// ════════════════════════════════════════════════════════════════════
// Telemetry Pub/Sub — Redis channel bridging Worker → Socket.io
//
// Problem:
//   The telemetry worker may run as a separate Node process (or N
//   instances).  It cannot call `io.to(room).emit()` directly because
//   Socket.io lives in the HTTP server process.
//
// Solution:
//   Worker publishes parsed telemetry to a Redis Pub/Sub channel.
//   The HTTP server subscribes to that channel and fans out via
//   Socket.io rooms.
//
//   Channel: `telemetry:vehicle_moved`
//   Payload: JSON-serialised VehicleTelemetryEvent
//
// This module exposes:
//   • publishTelemetryEvent()  — called by the worker
//   • subscribeTelemetryEvents() — called once by the HTTP server
// ════════════════════════════════════════════════════════════════════

import Redis from 'ioredis';
import { config } from '../config';
import { broadcastVehicleMoved, VehicleTelemetryEvent } from '../routes/socket.config';

const CHANNEL = 'telemetry:vehicle_moved';
const ALARM_CHANNEL = 'telemetry:alarm';

// ─── Publisher (used by worker / any process) ───────────────────

let pubClient: Redis | null = null;

function getPubClient(): Redis {
  if (!pubClient) {
    pubClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 5_000),
    });
    pubClient.on('error', (err) => console.error('[PubSub:pub] Error:', err.message));
  }
  return pubClient;
}

/**
 * Publish a parsed telemetry event to the Redis channel.
 * Called by the telemetry worker after parsing + DB insert.
 */
export async function publishTelemetryEvent(event: VehicleTelemetryEvent): Promise<void> {
  const client = getPubClient();
  await client.publish(CHANNEL, JSON.stringify(event));
}

/**
 * Publish an alarm/geofence event.
 */
export async function publishAlarmEvent(event: {
  tenantId: string;
  vehicleId: string;
  type: string;
  message: string;
  lat: number;
  lng: number;
  timestamp: string;
}): Promise<void> {
  const client = getPubClient();
  await client.publish(ALARM_CHANNEL, JSON.stringify(event));
}

// ─── Subscriber (runs in the HTTP server process) ───────────────

let subClient: Redis | null = null;

/**
 * Start subscribing to telemetry channels and forward events to
 * Socket.io rooms.  Must be called AFTER `initSocket()`.
 */
export async function subscribeTelemetryEvents(): Promise<void> {
  subClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 200, 5_000),
  });

  subClient.on('error', (err) => console.error('[PubSub:sub] Error:', err.message));

  await subClient.connect();
  await subClient.subscribe(CHANNEL, ALARM_CHANNEL);

  subClient.on('message', (channel: string, message: string) => {
    try {
      if (channel === CHANNEL) {
        const event: VehicleTelemetryEvent = JSON.parse(message);
        broadcastVehicleMoved(event);
      } else if (channel === ALARM_CHANNEL) {
        const { broadcastAlarm } = require('../routes/socket.config');
        broadcastAlarm(JSON.parse(message));
      }
    } catch (err) {
      console.error('[PubSub] Failed to handle message:', (err as Error).message);
    }
  });

  console.log('[PubSub] Subscribed to telemetry channels — forwarding to Socket.io');
}

/**
 * Graceful teardown.
 */
export async function closePubSub(): Promise<void> {
  if (subClient) {
    await subClient.unsubscribe();
    await subClient.quit();
    subClient = null;
  }
  if (pubClient) {
    await pubClient.quit();
    pubClient = null;
  }
}
