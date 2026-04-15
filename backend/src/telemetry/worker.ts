// ════════════════════════════════════════════════════════════════════
// Telemetry Worker — Redis Stream consumer → parse → TimescaleDB
//
// Lifecycle:
//   1. Reads a batch of raw frames from the Redis Stream (blocking).
//   2. For each message, runs the appropriate protocol parser.
//   3. Resolves deviceId → (vehicleId, tenantId) via a local LRU
//      cache backed by Prisma lookups.
//   4. Accumulates parsed rows, then performs a single bulk INSERT
//      into the TimescaleDB hypertable.
//   5. ACKs the processed stream messages.
//   6. Optionally emits a Socket.io `vehicle_moved` event for
//      real-time dashboard updates.
//
// Designed to run N instances in parallel using Redis consumer
// groups for horizontal scalability.
// ════════════════════════════════════════════════════════════════════

import { config } from '../config';
import { ensureConsumerGroup, readBatch, ackMessages, RawStreamMessage } from './stream';
import { parseRawFrame, ParsedTelemetry } from './parsers';
import { insertTelemetryBatch, TelemetryRow } from '../lib/timescale';
import { publishTelemetryEvent } from './pubsub';
import prisma from '../lib/prisma';
import os from 'os';
import { ViolationService } from '../services/violation.service';

// ─── Device → Vehicle LRU Cache ─────────────────────────────────

interface DeviceMapping {
  vehicleId: string;
  tenantId: string;
  fetchedAt: number;
}

const deviceCache = new Map<string, DeviceMapping>();
const CACHE_TTL_MS = 5 * 60_000; // 5 min

async function resolveDevice(deviceId: string): Promise<DeviceMapping | null> {
  const cached = deviceCache.get(deviceId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;

  const vehicle = await prisma.vehicle.findUnique({
    where: { deviceId },
    select: { id: true, tenantId: true },
  });

  if (!vehicle) return null;

  const mapping: DeviceMapping = {
    vehicleId: vehicle.id,
    tenantId: vehicle.tenantId,
    fetchedAt: Date.now(),
  };
  deviceCache.set(deviceId, mapping);

  // Evict oldest entries if cache grows beyond 10 000
  if (deviceCache.size > 10_000) {
    const oldest = [...deviceCache.entries()]
      .sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)
      .slice(0, 1_000);
    for (const [key] of oldest) deviceCache.delete(key);
  }

  return mapping;
}

// ─── Metrics ─────────────────────────────────────────────────────

const metrics = {
  processed: 0,
  inserted: 0,
  parseErrors: 0,
  unmappedDevices: 0,
  batchesWritten: 0,
};

export function getWorkerMetrics() {
  return { ...metrics };
}

// ─── Main Loop ───────────────────────────────────────────────────

let running = false;

export async function startWorker(): Promise<void> {
  if (running) return;
  running = true;

  const consumerName = `worker-${os.hostname()}-${process.pid}`;

  await ensureConsumerGroup();
  console.log(`[Worker] "${consumerName}" started – batch ${config.telemetry.batchSize}, interval ${config.telemetry.batchIntervalMs}ms`);

  while (running) {
    try {
      const messages = await readBatch(consumerName, config.telemetry.batchSize, config.telemetry.batchIntervalMs);
      if (messages.length === 0) continue;

      const rows: TelemetryRow[] = [];
      const ackIds: string[] = [];

      for (const msg of messages) {
        ackIds.push(msg.id);
        metrics.processed++;

        // 1. Parse raw → structured telemetry
        const parsed = parseRawFrame(msg.source, msg.raw);
        if (parsed.length === 0) {
          metrics.parseErrors++;
          continue;
        }

        // 2. Resolve device → vehicle + tenant
        const mapping = await resolveDevice(msg.deviceId);
        if (!mapping) {
          metrics.unmappedDevices++;
          continue;
        }

        // 3. Build DB rows
        for (const p of parsed) {
          rows.push({
            time: p.timestamp,
            vehicleId: mapping.vehicleId,
            tenantId: mapping.tenantId,
            deviceId: msg.deviceId,
            lat: p.lat,
            lng: p.lng,
            altitude: p.altitude,
            speed: p.speed,
            heading: p.heading,
            satellites: p.satellites,
            hdop: p.hdop,
            ignition: p.ignition,
            odometer: p.odometer,
            fuelLevel: p.fuelLevel,
            batteryMv: p.batteryMv,
            ioData: p.ioData,
            source: msg.source,
            rawHex: msg.source === 'teltonika' ? msg.raw : null,
          });

          await ViolationService.processTelemetryPacket({
            tenantId: mapping.tenantId,
            vehicleId: mapping.vehicleId,
            packet: {
              timestamp: p.timestamp,
              lat: p.lat,
              lng: p.lng,
              speed: p.speed,
              ignition: p.ignition,
            },
          });
        }

        // 4. Real-time emit via Redis Pub/Sub → Socket.io
        const latest = parsed[parsed.length - 1];
        const routeIds = await resolveVehicleRoutes(mapping.vehicleId);
        publishTelemetryEvent({
          vehicleId: mapping.vehicleId,
          tenantId: mapping.tenantId,
          deviceId: msg.deviceId,
          lat: latest.lat,
          lng: latest.lng,
          speed: latest.speed ?? 0,
          heading: latest.heading ?? 0,
          altitude: latest.altitude,
          ignition: latest.ignition,
          timestamp: latest.timestamp.toISOString(),
          routeIds,
        }).catch((err) => {
          console.warn('[Worker] Pub/Sub publish failed:', (err as Error).message);
        });
      }

      // 5. Batch insert into TimescaleDB
      if (rows.length > 0) {
        const inserted = await insertTelemetryBatch(rows);
        metrics.inserted += inserted;
        metrics.batchesWritten++;
      }

      // 6. Update "last known" on the Vehicle row (latest per vehicle)
      await updateLastKnown(rows);

      // 7. ACK all processed messages
      await ackMessages(ackIds);
    } catch (err) {
      console.error('[Worker] Loop error:', (err as Error).message);
      // Back off on persistent errors
      await sleep(2_000);
    }
  }
}

export function stopWorker(): void {
  running = false;
  console.log('[Worker] Shutdown requested');
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Vehicle → active route IDs cache (for room targeting) */
const vehicleRouteCache = new Map<string, { routeIds: string[]; fetchedAt: number }>();
const ROUTE_CACHE_TTL = 60_000; // 1 min

async function resolveVehicleRoutes(vehicleId: string): Promise<string[]> {
  const cached = vehicleRouteCache.get(vehicleId);
  if (cached && Date.now() - cached.fetchedAt < ROUTE_CACHE_TTL) return cached.routeIds;

  const routes = await prisma.route.findMany({
    where: { vehicleId, status: 'ACTIVE' },
    select: { id: true },
  });
  const routeIds = routes.map((r) => r.id);
  vehicleRouteCache.set(vehicleId, { routeIds, fetchedAt: Date.now() });

  // Evict old entries
  if (vehicleRouteCache.size > 5_000) {
    const oldest = [...vehicleRouteCache.entries()]
      .sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)
      .slice(0, 500);
    for (const [key] of oldest) vehicleRouteCache.delete(key);
  }

  return routeIds;
}

/**
 * Fire-and-forget bulk update of `lastLat`, `lastLng` etc. on the
 * Vehicle table.  Only the most recent point per vehicle is written.
 */
async function updateLastKnown(rows: TelemetryRow[]): Promise<void> {
  if (rows.length === 0) return;

  // Deduplicate — keep latest per vehicleId
  const latest = new Map<string, TelemetryRow>();
  for (const r of rows) {
    const prev = latest.get(r.vehicleId);
    if (!prev || r.time > prev.time) latest.set(r.vehicleId, r);
  }

  const updates = [...latest.values()].map((r) =>
    prisma.vehicle.update({
      where: { id: r.vehicleId },
      data: {
        lastSeen: r.time,
      },
    }).catch(() => { /* vehicle may have been deleted — ignore */ })
  );

  await Promise.all(updates);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
