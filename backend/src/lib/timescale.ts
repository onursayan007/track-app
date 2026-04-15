// ════════════════════════════════════════════════════════════════════
// TimescaleDB — hypertable for telemetry time-series data
//
// This uses raw `pg` because Prisma does not support:
//   - CREATE EXTENSION
//   - create_hypertable()
//   - time_bucket() aggregations
//
// Call `ensureTimescaleSchema()` once at startup.
// ════════════════════════════════════════════════════════════════════

import { Pool } from 'pg';
import { config } from '../config';

let pool: Pool | null = null;

/** Lazy singleton — all telemetry writes share one pool */
export function getTimescalePool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,                 // high concurrency for ingestion
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => {
      console.error('[TimescaleDB] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

/**
 * Idempotently creates the TimescaleDB extension, the
 * `vehicle_telemetry` hypertable, and useful indexes / continuous
 * aggregates.  Safe to call on every server start.
 */
export async function ensureTimescaleSchema(): Promise<void> {
  const pg = getTimescalePool();

  await pg.query(`
    -- Enable TimescaleDB (no-op if already enabled)
    CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
  `);

  await pg.query(`
    -- Raw telemetry points (one row per GPS ping)
    CREATE TABLE IF NOT EXISTS vehicle_telemetry (
      time         TIMESTAMPTZ      NOT NULL,
      vehicle_id   UUID             NOT NULL,
      tenant_id    UUID             NOT NULL,
      device_id    TEXT,
      lat          DOUBLE PRECISION NOT NULL,
      lng          DOUBLE PRECISION NOT NULL,
      altitude     DOUBLE PRECISION,
      speed        DOUBLE PRECISION DEFAULT 0,
      heading      DOUBLE PRECISION DEFAULT 0,
      satellites   INT,
      hdop         DOUBLE PRECISION,
      ignition     BOOLEAN,
      odometer     DOUBLE PRECISION,
      fuel_level   DOUBLE PRECISION,
      battery_mv   INT,
      io_data      JSONB,
      source       TEXT             NOT NULL DEFAULT 'unknown',
      raw_hex      TEXT
    );
  `);

  // Convert to hypertable (idempotent — errors if already a hypertable,
  // so we catch and ignore)
  try {
    await pg.query(`
      SELECT create_hypertable(
        'vehicle_telemetry',
        'time',
        if_not_exists => TRUE,
        chunk_time_interval => INTERVAL '1 day'
      );
    `);
  } catch (err: any) {
    // "already a hypertable" is fine
    if (!err.message?.includes('already a hypertable')) throw err;
  }

  // Indexes for common query patterns
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_time
      ON vehicle_telemetry (vehicle_id, time DESC);

    CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_time
      ON vehicle_telemetry (tenant_id, time DESC);

    CREATE INDEX IF NOT EXISTS idx_telemetry_device
      ON vehicle_telemetry (device_id, time DESC)
      WHERE device_id IS NOT NULL;
  `);

  // ─── Continuous Aggregate: 1-minute rollups ────────────────────
  // Useful for dashboard charts, avoiding full-scan on raw data.
  await pg.query(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_1m
    WITH (timescaledb.continuous) AS
    SELECT
      time_bucket('1 minute', time) AS bucket,
      vehicle_id,
      tenant_id,
      AVG(speed)             AS avg_speed,
      MAX(speed)             AS max_speed,
      AVG(lat)               AS avg_lat,
      AVG(lng)               AS avg_lng,
      COUNT(*)               AS sample_count
    FROM vehicle_telemetry
    GROUP BY bucket, vehicle_id, tenant_id
    WITH NO DATA;
  `).catch((err: any) => {
    // Ignore "already exists"
    if (!err.message?.includes('already exists')) throw err;
  });

  // Auto-refresh policy: materialized view refreshes every 2 minutes
  try {
    await pg.query(`
      SELECT add_continuous_aggregate_policy('telemetry_1m',
        start_offset    => INTERVAL '10 minutes',
        end_offset      => INTERVAL '1 minute',
        schedule_interval => INTERVAL '2 minutes',
        if_not_exists   => TRUE
      );
    `);
  } catch (err: any) {
    if (!err.message?.includes('already exists')) throw err;
  }

  // ─── Data Retention: auto-drop raw data older than 90 days ────
  try {
    await pg.query(`
      SELECT add_retention_policy('vehicle_telemetry',
        INTERVAL '90 days',
        if_not_exists => TRUE
      );
    `);
  } catch (err: any) {
    if (!err.message?.includes('already exists')) throw err;
  }

  console.log('[TimescaleDB] Schema verified — hypertable + indexes + aggregates ready');
}

// ─── Batch Insert Helper ─────────────────────────────────────────

export interface TelemetryRow {
  time: Date;
  vehicleId: string;
  tenantId: string;
  deviceId?: string | null;
  lat: number;
  lng: number;
  altitude?: number | null;
  speed?: number;
  heading?: number;
  satellites?: number | null;
  hdop?: number | null;
  ignition?: boolean | null;
  odometer?: number | null;
  fuelLevel?: number | null;
  batteryMv?: number | null;
  ioData?: Record<string, unknown> | null;
  source: string;
  rawHex?: string | null;
}

/**
 * Bulk-insert telemetry rows using a single multi-value INSERT.
 * Batches of 500–1000 rows keep PG wire overhead minimal.
 */
export async function insertTelemetryBatch(rows: TelemetryRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const pg = getTimescalePool();
  const cols = 18;
  const placeholders: string[] = [];
  const values: unknown[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const offset = i * cols;
    placeholders.push(
      `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},` +
      `$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},` +
      `$${offset + 9},$${offset + 10},$${offset + 11},$${offset + 12},` +
      `$${offset + 13},$${offset + 14},$${offset + 15},$${offset + 16},` +
      `$${offset + 17},$${offset + 18})`
    );
    values.push(
      r.time, r.vehicleId, r.tenantId, r.deviceId ?? null,
      r.lat, r.lng, r.altitude ?? null, r.speed ?? 0,
      r.heading ?? 0, r.satellites ?? null, r.hdop ?? null, r.ignition ?? null,
      r.odometer ?? null, r.fuelLevel ?? null, r.batteryMv ?? null,
      r.ioData ? JSON.stringify(r.ioData) : null,
      r.source, r.rawHex ?? null,
    );
  }

  const sql = `
    INSERT INTO vehicle_telemetry (
      time, vehicle_id, tenant_id, device_id,
      lat, lng, altitude, speed,
      heading, satellites, hdop, ignition,
      odometer, fuel_level, battery_mv, io_data,
      source, raw_hex
    ) VALUES ${placeholders.join(',\n')}
  `;

  const result = await pg.query(sql, values);
  return result.rowCount ?? rows.length;
}

/**
 * Graceful shutdown — drain the pool.
 */
export async function closeTimescalePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
