// ════════════════════════════════════════════════════════════════════
// Location Service — bridges REST GPS endpoint → Redis Stream pipeline
//
// Previously used an in-memory Map; now delegates to the telemetry
// ingestion pipeline so every ping flows through the same path:
//   REST → Redis Stream → Worker → TimescaleDB + Socket.io
// ════════════════════════════════════════════════════════════════════

import { publishRawFrame } from '../telemetry/stream';
import { publishTelemetryEvent } from '../telemetry/pubsub';

export class LocationService {
  /**
   * Publish a GPS update into the Redis Stream AND emit an immediate
   * real-time event via Redis Pub/Sub → Socket.io.
   *
   * The worker will also process the stream entry (parse + DB insert),
   * but the Pub/Sub event provides lowest-latency dashboard refresh.
   */
  static async updateVehicleLocation(
    tenantId: string,
    vehicleId: string,
    data: { lat: number; lng: number; speed: number; heading: number },
  ) {
    const timestamp = new Date().toISOString();

    const locationData = {
      vehicleId,
      tenantId,
      ...data,
      timestamp,
    };

    // 1. Publish to Redis Stream (async — non-blocking for the HTTP response)
    publishRawFrame({
      source: 'rest',
      deviceId: vehicleId,
      raw: JSON.stringify({ ...data, timestamp }),
      remoteIp: 'rest-api',
    }).catch((err) => {
      console.error('[LocationService] Stream publish failed:', err.message);
    });

    // 2. Immediate Pub/Sub → Socket.io broadcast for lowest latency
    publishTelemetryEvent({
      vehicleId,
      tenantId,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      heading: data.heading,
      timestamp,
    }).catch(() => { /* non-critical */ });

    return locationData;
  }
}