// ════════════════════════════════════════════════════════════════════
// Centralized Configuration — Single Source of Truth
// ════════════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  /** Server */
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  /** JWT — stateless auth for PWA / Native apps */
  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  /** Database (Prisma reads DATABASE_URL automatically) */
  databaseUrl: process.env.DATABASE_URL || '',

  /** CORS */
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  /** Redis — used for Streams-based telemetry ingestion + BullMQ */
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  /** Telemetry TCP/UDP listener ports */
  telemetry: {
    tcpPort: parseInt(process.env.TELEMETRY_TCP_PORT || '5001', 10),
    udpPort: parseInt(process.env.TELEMETRY_UDP_PORT || '5002', 10),
    /** Max messages to accumulate before a batch DB write */
    batchSize: parseInt(process.env.TELEMETRY_BATCH_SIZE || '500', 10),
    /** Max ms to wait before flushing a partial batch */
    batchIntervalMs: parseInt(process.env.TELEMETRY_BATCH_INTERVAL_MS || '2000', 10),
    /** Redis Stream key for raw telemetry frames */
    streamKey: process.env.TELEMETRY_STREAM_KEY || 'telemetry:raw',
    /** Redis consumer group */
    consumerGroup: process.env.TELEMETRY_CONSUMER_GROUP || 'telemetry-workers',
  },

  /** External Services */
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiServiceApiKey: process.env.AI_SERVICE_API_KEY || '',
} as const;

/** Runtime validation — fail fast if critical env vars are missing */
export function validateConfig(): void {
  const required: Array<[string, string]> = [
    ['DATABASE_URL', config.databaseUrl],
  ];

  const missing = required.filter(([, val]) => !val).map(([key]) => key);

  if (missing.length > 0) {
    console.error(`❌  Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (config.jwt.secret === 'CHANGE_ME_IN_PRODUCTION' && config.nodeEnv === 'production') {
    console.error('❌  JWT_SECRET must be set in production');
    process.exit(1);
  }
}
