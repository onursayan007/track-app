// ════════════════════════════════════════════════════════════════════
// Redis client singleton (ioredis)
// Used by: Streams ingestion buffer, real-time caching
// ════════════════════════════════════════════════════════════════════

import Redis from 'ioredis';
import { config } from '../config';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      maxRetriesPerRequest: null,   // required by BullMQ
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 10) {
          console.warn('[Redis] Max reconnect attempts reached — giving up');
          return null;                 // stop retrying
        }
        const delay = Math.min(times * 500, 5_000);
        console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${times})…`);
        return delay;
      },
    });

    client.on('connect', () => console.log('[Redis] Connected'));
    client.on('error', (err) => console.error('[Redis] Error:', err.message));
  }
  return client;
}

/** Create a duplicate connection (needed for blocking reads like XREADGROUP) */
export function createRedisSubscriber(): Redis {
  const dup = getRedis().duplicate();
  dup.on('error', (err) => console.error('[Redis:sub] Error:', err.message));
  return dup;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
