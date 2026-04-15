// ════════════════════════════════════════════════════════════════════
// /api/v1/telemetry/* — HTTP endpoints for telemetry pipeline
//
// POST /webhook/arvento   — Arvento REST push (server-to-server)
// POST /ingest            — Generic JSON ingest (mobile app fallback)
// GET  /stats             — Worker metrics (admin / monitoring)
// ════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { publishRawFrame } from '../telemetry/stream';
import { getWorkerMetrics } from '../telemetry/worker';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { authenticateToken } from '../middlewares/auth.middleware';
import { superAdminOnly } from '../middlewares/role.middleware';

const router = Router();

// ─── Arvento Webhook (server-to-server, IP-whitelisted or API-key) ─

router.post('/webhook/arvento', asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    throw new BadRequestError('Request body must be a JSON object');
  }

  // Arvento may push a single object or an array of objects
  const items = Array.isArray(body) ? body : [body];

  const ids: string[] = [];
  for (const item of items) {
    const deviceId = item.IMEI || item.imei || item.DeviceId || 'unknown';
    const id = await publishRawFrame({
      source: 'arvento',
      deviceId: String(deviceId),
      raw: JSON.stringify(item),
      remoteIp: (req.ip || req.socket.remoteAddress || '') as string,
    });
    ids.push(id);
  }

  return created(res, { accepted: ids.length, streamIds: ids });
}));

// ─── Generic JSON Ingest (mobile app / REST fallback) ───────────

router.post('/ingest', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, speed, heading, altitude, vehicleId, deviceId } = req.body;
  if (lat == null || lng == null) throw new BadRequestError('lat and lng are required');

  const user = (req as any).user;
  const resolvedDeviceId = deviceId || vehicleId || user.userId;

  const id = await publishRawFrame({
    source: 'app',
    deviceId: String(resolvedDeviceId),
    raw: JSON.stringify({ lat, lng, speed, heading, altitude, timestamp: new Date().toISOString() }),
    remoteIp: (req.ip || req.socket.remoteAddress || '') as string,
  });

  return ok(res, { streamId: id });
}));

// ─── Pipeline Metrics (admin-only) ──────────────────────────────

router.get('/stats', authenticateToken, superAdminOnly, asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, getWorkerMetrics());
}));

export default router;
