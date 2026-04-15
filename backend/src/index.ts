// ════════════════════════════════════════════════════════════════════
// Fleet Tracking B2B SaaS — Entry Point
// Stateless Express server with JWT auth, Prisma ORM, Socket.io
// + Telemetry ingestion pipeline (TCP/UDP → Redis Streams → TimescaleDB)
// ════════════════════════════════════════════════════════════════════

import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { config, validateConfig } from './config';
import { initSocket } from './routes/socket.config';
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/api.routes';
import publicRoutes from './routes/public.routes';
import telemetryRoutes from './routes/telemetry.routes';
import prisma from './lib/prisma';
import { globalErrorHandler } from './middlewares/error.middleware';
import { setupSwagger } from './swagger';
import { startBillingCron, stopBillingCron } from './cron/billing.cron';
import { startViolationCron, stopViolationCron } from './cron/violation.cron';
import { startFeedbackMediaCleanupCron, stopFeedbackMediaCleanupCron } from './cron/feedback-media-cleanup.cron';
import { startMockTelemetryService, stopMockTelemetryService } from './services/MockTelemetryService';

// Telemetry pipeline
import { getRedis, closeRedis } from './lib/redis';
import { ensureTimescaleSchema, closeTimescalePool } from './lib/timescale';
import { startTcpListener, startUdpListener, startWorker, stopWorker, subscribeTelemetryEvents, closePubSub } from './telemetry';

// Fail fast if critical env vars are missing
validateConfig();

const app = express();
const server = http.createServer(app);

// ─── Socket.io (tenant-isolated rooms) ──────────────────────────
const io = initSocket(server);

// ─── Global Middleware ───────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ─── Static files (uploaded vehicle photos, etc.) ───────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Swagger / OpenAPI  ─────────────────────────────────────────
setupSwagger(app);

// ─── Routes ─────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1', apiRoutes);          // delegates to /superadmin, /tenant, /driver

// Health check (unauthenticated — for load-balancers / k8s probes)
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redis = getRedis();
    const redisPing = await redis.ping().catch(() => 'disconnected');
    res.json({
      status: 'ok',
      db: 'connected',
      redis: redisPing === 'PONG' ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ─── 404 Fallback ───────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

// ─── Global Error Handler (MUST be last) ────────────────────────
app.use(globalErrorHandler);

// ─── Bootstrap ──────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  // ── 1. Start HTTP server FIRST so auth/API always works ───────
  server.listen(config.port, () => {
    console.log(`🚀 Server listening on http://localhost:${config.port}`);
    console.log(`   Environment : ${config.nodeEnv}`);
    console.log(`   API docs    : http://localhost:${config.port}/api/docs`);
  });

  // ── 2. Try Redis with a short timeout (don't block forever) ───
  try {
    const redis = getRedis();
    await Promise.race([
      redis.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5_000)),
    ]);
    console.log('[Boot] Redis connected');
  } catch {
    console.warn('[Boot] Redis not available — telemetry pipeline will retry in background');
  }

  // ── 3. TimescaleDB schema (non-critical) ──────────────────────
  await ensureTimescaleSchema().catch((err) => {
    console.warn('[Boot] TimescaleDB schema init skipped:', (err as Error).message);
  });

  // ── 4. Telemetry pipeline (all best-effort) ───────────────────
  subscribeTelemetryEvents().catch((err) => {
    console.warn('[Boot] Pub/Sub subscriber skipped:', (err as Error).message);
  });

  startTcpListener();
  startUdpListener();

  startWorker().catch((err) => {
    console.error('[Boot] Worker failed to start:', (err as Error).message);
  });

  // ── 5. Billing Cron (daily suspension check) ─────────────────
  startBillingCron();
  startViolationCron();
  startFeedbackMediaCleanupCron();

  // ── 6. Mock telemetry stream (for Live Map activation/testing) ──
  startMockTelemetryService(io);
}

bootstrap();

// ─── Graceful Shutdown ──────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[${signal}] Shutting down gracefully…`);
  stopBillingCron();
  stopViolationCron();
  stopFeedbackMediaCleanupCron();
  stopMockTelemetryService();
  stopWorker();
  server.close();
  await closePubSub();
  await prisma.$disconnect();
  await closeRedis();
  await closeTimescalePool();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
