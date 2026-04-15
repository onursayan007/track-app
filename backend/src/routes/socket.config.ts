// ════════════════════════════════════════════════════════════════════
// Socket.io — Real-time communication layer
//
// Features:
//   • JWT authentication on every connection (same middleware as REST)
//   • Redis adapter for horizontal scaling (Pub/Sub across N processes)
//   • Tenant-isolated rooms: `tenant:<tenantId>`
//   • Route-specific rooms:  `route:<routeId>`
//   • Vehicle-specific rooms: `vehicle:<vehicleId>`
//   • Dynamic join/leave via client events
//   • Connection tracking + online-users per tenant
// ════════════════════════════════════════════════════════════════════

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { config } from '../config';
import { AuthService, JwtPayload } from '../services/auth.service';

// ─── Augment Socket with user data ──────────────────────────────

declare module 'socket.io' {
  interface Socket {
    user?: JwtPayload;
    publicMeta?: {
      publicAccessId?: string;
      vehicleId?: string;
      tripId?: string;
      requestId?: string;
    };
  }
}

let io: Server;
let publicNamespace: ReturnType<Server['of']>;

// ─── Connection tracking (per tenant) ───────────────────────────

/** Maps tenantId → Set<socketId>  (used for "who's online" queries) */
const tenantConnections = new Map<string, Set<string>>();

function getTenantRoomName(tenantId: string): string {
  return `room:${tenantId}`;
}

function trackConnect(socket: Socket): void {
  const tid = socket.user?.tenantId;
  if (!tid) return;
  if (!tenantConnections.has(tid)) tenantConnections.set(tid, new Set());
  tenantConnections.get(tid)!.add(socket.id);
}

function trackDisconnect(socket: Socket): void {
  const tid = socket.user?.tenantId;
  if (!tid) return;
  tenantConnections.get(tid)?.delete(socket.id);
  if (tenantConnections.get(tid)?.size === 0) tenantConnections.delete(tid);
}

export function getOnlineCountForTenant(tenantId: string): number {
  return tenantConnections.get(tenantId)?.size ?? 0;
}

// ─── Init ────────────────────────────────────────────────────────

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25_000,
    pingTimeout: 20_000,
    transports: ['websocket', 'polling'],
  });

  // ── Redis Adapter (Pub/Sub for multi-process broadcasting) ────
  attachRedisAdapter();

  // ══════════════════════════════════════════════════════════════
  //  AUTH MIDDLEWARE — uses the same JWT verification as REST API
  // ══════════════════════════════════════════════════════════════
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('AUTH_TOKEN_MISSING'));
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return next(new Error('AUTH_TOKEN_INVALID'));
    }

    socket.user = payload;
    next();
  });

  // ══════════════════════════════════════════════════════════════
  //  CONNECTION HANDLER
  // ══════════════════════════════════════════════════════════════
  io.on('connection', (socket: Socket) => {
    const { userId, tenantId, role } = socket.user!;

    // ─── Auto-join tenant room ───────────────────────────────
    if (tenantId) {
      socket.join(`tenant:${tenantId}`);
      socket.join(getTenantRoomName(tenantId));
    }
    socket.join(`user:${userId}`);
    if (role === 'DRIVER') {
      socket.join(`driver:${userId}`);
    }

    trackConnect(socket);

    console.log(
      `[WS] Connected: socket=${socket.id} user=${userId} tenant=${tenantId} role=${role}`,
    );

    // ─── Client-initiated room subscriptions ─────────────────

    /**
     * subscribe:route — client wants live updates for a specific route.
     * Server validates the route belongs to the caller's tenant before
     * allowing the join.
     */
    socket.on('subscribe:route', async (routeId: string, ack?: (ok: boolean) => void) => {
      try {
        if (!routeId || typeof routeId !== 'string') {
          ack?.(false);
          return;
        }

        // Validate ownership (lazy import to avoid circular deps)
        const prisma = (await import('../lib/prisma')).default;
        const route = await prisma.route.findFirst({
          where: {
            id: routeId,
            ...(role === 'SUPER_ADMIN' ? {} : { tenantId: tenantId! }),
          },
          select: { id: true },
        });

        if (!route) {
          ack?.(false);
          return;
        }

        socket.join(`route:${routeId}`);
        ack?.(true);
      } catch {
        ack?.(false);
      }
    });

    socket.on('unsubscribe:route', (routeId: string) => {
      if (routeId) socket.leave(`route:${routeId}`);
    });

    /**
     * subscribe:vehicle — client wants live updates for a single vehicle.
     * Validated against tenant ownership.
     */
    socket.on('subscribe:vehicle', async (vehicleId: string, ack?: (ok: boolean) => void) => {
      try {
        if (!vehicleId || typeof vehicleId !== 'string') {
          ack?.(false);
          return;
        }

        const prisma = (await import('../lib/prisma')).default;
        const vehicle = await prisma.vehicle.findFirst({
          where: {
            id: vehicleId,
            ...(role === 'SUPER_ADMIN' ? {} : { tenantId: tenantId! }),
          },
          select: { id: true },
        });

        if (!vehicle) {
          ack?.(false);
          return;
        }

        socket.join(`vehicle:${vehicleId}`);
        ack?.(true);
      } catch {
        ack?.(false);
      }
    });

    socket.on('unsubscribe:vehicle', (vehicleId: string) => {
      if (vehicleId) socket.leave(`vehicle:${vehicleId}`);
    });

    socket.on('joinRoom', (requestedTenantId: string, ack?: (ok: boolean) => void) => {
      if (!requestedTenantId || typeof requestedTenantId !== 'string') {
        ack?.(false);
        return;
      }

      const canJoin = role === 'SUPER_ADMIN' || requestedTenantId === tenantId;
      if (!canJoin) {
        ack?.(false);
        return;
      }

      socket.join(getTenantRoomName(requestedTenantId));
      socket.join(`tenant:${requestedTenantId}`);
      ack?.(true);
    });

    // ─── Driver-specific: auto-join their active route room ──
    if (role === 'DRIVER') {
      autoJoinDriverRoute(socket, userId, tenantId!);
    }

    // ─── Disconnect cleanup ──────────────────────────────────
    socket.on('disconnect', (reason) => {
      trackDisconnect(socket);
      console.log(`[WS] Disconnected: socket=${socket.id} reason=${reason}`);
    });

    // ─── Error handler ───────────────────────────────────────
    socket.on('error', (err) => {
      console.error(`[WS] Socket error: socket=${socket.id}`, err.message);
    });
  });

  publicNamespace = io.of('/public');
  publicNamespace.on('connection', (socket: Socket) => {
    socket.on('subscribe:public_vehicle', async (publicAccessId: string, ack?: (payload: { ok: boolean; vehicleId?: string; tripId?: string }) => void) => {
      try {
        if (!publicAccessId || typeof publicAccessId !== 'string') {
          ack?.({ ok: false });
          return;
        }

        const prisma = (await import('../lib/prisma')).default;
        const vehicle = await prisma.vehicle.findUnique({
          where: { publicAccessId },
          select: {
            id: true,
            activeTrips: {
              where: { status: 'IN_PROGRESS' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true },
            },
          },
        });

        if (!vehicle) {
          ack?.({ ok: false });
          return;
        }

        socket.publicMeta = { ...socket.publicMeta, publicAccessId, vehicleId: vehicle.id, tripId: vehicle.activeTrips[0]?.id };
        socket.join(`public:vehicle:${vehicle.id}`);
        if (vehicle.activeTrips[0]?.id) {
          socket.join(`public:trip:${vehicle.activeTrips[0].id}`);
        }

        ack?.({ ok: true, vehicleId: vehicle.id, tripId: vehicle.activeTrips[0]?.id });
      } catch {
        ack?.({ ok: false });
      }
    });

    socket.on('subscribe:request_status', async (requestId: string, ack?: (ok: boolean) => void) => {
      try {
        if (!requestId || typeof requestId !== 'string') {
          ack?.(false);
          return;
        }

        const prisma = (await import('../lib/prisma')).default;
        const request = await prisma.passengerRequest.findUnique({
          where: { id: requestId },
          select: { id: true },
        });

        if (!request) {
          ack?.(false);
          return;
        }

        socket.publicMeta = { ...socket.publicMeta, requestId };
        socket.join(`public:request:${requestId}`);
        ack?.(true);
      } catch {
        ack?.(false);
      }
    });

    socket.on('disconnect', () => {
      // no-op
    });
  });

  return io;
}

// ─── Redis Adapter Setup ─────────────────────────────────────────

function attachRedisAdapter(): void {
  try {
    const pubClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 5_000),
    });

    const subClient = pubClient.duplicate();

    // Connect both clients
    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('[WS] Redis adapter attached — multi-process Pub/Sub enabled');
      })
      .catch((err) => {
        console.warn('[WS] Redis adapter not available, falling back to in-memory:', err.message);
      });
  } catch (err) {
    console.warn('[WS] Could not create Redis adapter:', (err as Error).message);
  }
}

// ─── Auto-join driver's active route ─────────────────────────────

async function autoJoinDriverRoute(socket: Socket, userId: string, tenantId: string): Promise<void> {
  try {
    const prisma = (await import('../lib/prisma')).default;
    const activeRoutes = await prisma.route.findMany({
      where: { driverId: userId, tenantId, status: 'ACTIVE' },
      select: { id: true, vehicleId: true },
    });

    for (const route of activeRoutes) {
      socket.join(`route:${route.id}`);
      if (route.vehicleId) socket.join(`vehicle:${route.vehicleId}`);
    }

    if (activeRoutes.length > 0) {
      console.log(
        `[WS] Driver ${userId} auto-joined ${activeRoutes.length} route room(s)`,
      );
    }
  } catch (err) {
    console.warn('[WS] Failed to auto-join driver routes:', (err as Error).message);
  }
}

// ─── Public API ──────────────────────────────────────────────────

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}

/**
 * Broadcast a vehicle telemetry event to all relevant rooms:
 *   1. tenant:<tenantId>  — all dashboards for that company
 *   2. vehicle:<vehicleId> — anyone tracking that specific vehicle
 *   3. route:<routeId>    — passengers/admins watching a route
 *
 * This is called from the Redis Pub/Sub subscriber (see pubsub.ts)
 * so it works across multiple server processes.
 */
export function broadcastVehicleMoved(payload: VehicleTelemetryEvent): void {
  if (!io) return;

  const event = 'vehicle:telemetry';

  // 1. Tenant room (always)
  io.to(`tenant:${payload.tenantId}`).emit(event, payload);
  io.to(getTenantRoomName(payload.tenantId)).emit(event, payload);

  // 2. Vehicle room (granular tracking)
  io.to(`vehicle:${payload.vehicleId}`).emit(event, payload);
  publicNamespace?.to(`public:vehicle:${payload.vehicleId}`).emit(event, payload);

  // 3. Route rooms (if routeIds provided)
  if (payload.routeIds) {
    for (const rid of payload.routeIds) {
      io.to(`route:${rid}`).emit(event, payload);
    }
  }
}

/**
 * Emit a route status change to all interested clients.
 */
export function broadcastRouteStatus(payload: {
  routeId: string;
  tenantId: string;
  status: string;
  vehicleId?: string;
  driverId?: string;
}): void {
  if (!io) return;

  const event = 'route:status';
  io.to(`tenant:${payload.tenantId}`).emit(event, payload);
  io.to(getTenantRoomName(payload.tenantId)).emit(event, payload);
  io.to(`route:${payload.routeId}`).emit(event, payload);
}

/**
 * Emit a geofence / alarm event.
 */
export function broadcastAlarm(payload: {
  tenantId: string;
  vehicleId: string;
  type: string;
  message: string;
  lat: number;
  lng: number;
  timestamp: string;
}): void {
  if (!io) return;

  io.to(`tenant:${payload.tenantId}`).emit('alarm', payload);
  io.to(getTenantRoomName(payload.tenantId)).emit('alarm', payload);
  io.to(`vehicle:${payload.vehicleId}`).emit('alarm', payload);
}

export function getConnectedTenantIds(): string[] {
  return Array.from(tenantConnections.keys());
}

export function emitPassengerRequestReceived(payload: {
  tenantId: string;
  driverId: string;
  requestId: string;
  tripId: string;
  passengerName: string;
  phone: string;
  createdAt: string;
}): void {
  if (!io) return;
  io.to(`driver:${payload.driverId}`).emit('passenger:request_received', payload);
  io.to(`tenant:${payload.tenantId}`).emit('passenger:request_created', payload);
}

export function emitPassengerRequestApproved(payload: {
  requestId: string;
  tripId: string;
  routeName?: string | null;
  stops: Array<{ id: string; name: string; latitude: number; longitude: number; orderIndex: number }>;
}): void {
  if (!io) return;
  publicNamespace?.to(`public:request:${payload.requestId}`).emit('passenger:request_approved', payload);
  publicNamespace?.to(`public:trip:${payload.tripId}`).emit('passenger:request_approved', payload);
}

export function emitPassengerRequestRejected(payload: {
  requestId: string;
  tripId: string;
  reason?: string;
  retryAfterSeconds: number;
}): void {
  if (!io) return;
  publicNamespace?.to(`public:request:${payload.requestId}`).emit('passenger:request_rejected', payload);
  publicNamespace?.to(`public:trip:${payload.tripId}`).emit('passenger:request_rejected', payload);
}

export function closePublicTripRoom(tripId: string): void {
  if (!publicNamespace || !tripId) return;
  const room = `public:trip:${tripId}`;
  publicNamespace.to(room).emit('trip:closed', { tripId });
  publicNamespace.in(room).socketsLeave(room);
}

// ─── Types ───────────────────────────────────────────────────────

export interface VehicleTelemetryEvent {
  vehicleId: string;
  tenantId: string;
  deviceId?: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  altitude?: number;
  ignition?: boolean;
  timestamp: string;
  /** Route IDs currently assigned to this vehicle (for room targeting) */
  routeIds?: string[];
}
