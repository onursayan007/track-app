// ════════════════════════════════════════════════════════════════════
// Redis Streams — Telemetry Ingestion Buffer
//
// Producer side: `publishRawFrame()` called by TCP/UDP listener and
//                the REST GPS endpoint.
// Consumer side: see `src/telemetry/worker.ts`
// ════════════════════════════════════════════════════════════════════

import { getRedis } from '../lib/redis';
import { config } from '../config';

const { streamKey, consumerGroup } = config.telemetry;

/**
 * Publish one raw telemetry frame into the Redis Stream.
 *
 * Fields stored per message:
 *   source   — "teltonika" | "arvento" | "nmea" | "app" | "rest"
 *   deviceId — hardware IMEI or logical device id
 *   raw      — hex-encoded raw bytes (or JSON string for app/rest)
 *   remoteIp — originating IP (for audit / debugging)
 *   ts       — ingestion timestamp (epoch ms)
 */
export async function publishRawFrame(fields: {
  source: string;
  deviceId: string;
  raw: string;
  remoteIp: string;
}): Promise<string> {
  const redis = getRedis();
  const id = await redis.xadd(
    streamKey,
    'MAXLEN', '~', '1000000',   // cap at ~1M entries, trimmed lazily
    '*',                          // auto-generated ID
    'source', fields.source,
    'deviceId', fields.deviceId,
    'raw', fields.raw,
    'remoteIp', fields.remoteIp,
    'ts', Date.now().toString(),
  );
  return id ?? '';
}

/**
 * Ensure the consumer group exists (idempotent).
 * Called once by each worker at startup.
 */
export async function ensureConsumerGroup(): Promise<void> {
  const redis = getRedis();
  try {
    await redis.xgroup('CREATE', streamKey, consumerGroup, '0', 'MKSTREAM');
    console.log(`[Stream] Consumer group "${consumerGroup}" created on "${streamKey}"`);
  } catch (err: any) {
    if (err.message?.includes('BUSYGROUP')) {
      // Already exists — fine
      return;
    }
    throw err;
  }
}

/**
 * Read a batch of messages from the stream using XREADGROUP.
 * This is a blocking read that waits up to `blockMs` before returning
 * an empty array (perfect for a tight worker loop).
 */
export async function readBatch(
  consumerName: string,
  count: number = 100,
  blockMs: number = 2000,
): Promise<RawStreamMessage[]> {
  const redis = getRedis();

  const result = await redis.xreadgroup(
    'GROUP', consumerGroup, consumerName,
    'COUNT', count.toString(),
    'BLOCK', blockMs.toString(),
    'STREAMS', streamKey, '>',
  );

  if (!result || result.length === 0) return [];

  const [, entries] = result[0] as [string, [string, string[]][]];
  return entries.map(([id, fields]: [string, string[]]) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      obj[fields[i]] = fields[i + 1];
    }
    return { id, ...obj } as unknown as RawStreamMessage;
  });
}

/** Acknowledge processed messages */
export async function ackMessages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const redis = getRedis();
  await redis.xack(streamKey, consumerGroup, ...ids);
}

// ─── Types ───────────────────────────────────────────────────────

export interface RawStreamMessage {
  id: string;
  source: string;
  deviceId: string;
  raw: string;
  remoteIp: string;
  ts: string;
}
