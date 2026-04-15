// ════════════════════════════════════════════════════════════════════
// AI Bridge Service — typed HTTP client for the Python AI microservice
//
// Every call is guarded by:
//   • X-API-Key header (shared secret)
//   • Timeout + graceful fallback when the service is down
// ════════════════════════════════════════════════════════════════════

import { config } from '../config';
import type { Readable } from 'stream';

const AI_URL = config.aiServiceUrl;                          // default http://localhost:8000
const API_KEY = process.env.AI_SERVICE_API_KEY || '';         // shared secret
const TIMEOUT_MS = 30_000;                                   // 30 s (OCR can be slow)

// ─── Helpers ─────────────────────────────────────────────────────

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'X-API-Key': API_KEY,
    ...extra,
  };
}

async function safeFetch<T>(
  url: string,
  init: RequestInit,
  fallback: T,
): Promise<T> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      console.error(`[AI Bridge] ${url} responded ${res.status}`);
      return fallback;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn('[AI Bridge] unreachable:', (err as Error).message);
    return fallback;
  }
}

// ─── Types ───────────────────────────────────────────────────────

export interface OcrResultField {
  value: string | null;
  confidence: number;
}

export interface OcrResponse {
  plate: OcrResultField;
  vin: OcrResultField;
  model: OcrResultField;
  owner_name: OcrResultField;
  registration_date: OcrResultField;
  raw_text: string;
  processing_time_ms: number;
}

export interface ScoreComponent {
  name: string;
  raw_ratio: number;
  weight: number;
  penalty: number;
}

export interface DriverScoreResponse {
  driver_id: string;
  vehicle_id: string;
  period_start: string;
  period_end: string;
  score: number;
  grade: string;
  components: ScoreComponent[];
  recommendations: string[];
}

export interface TelemetryPayload {
  driver_id: string;
  vehicle_id: string;
  period_start: string;
  period_end: string;
  total_distance_km: number;
  total_driving_seconds: number;
  speeding_count?: number;
  speeding_seconds?: number;
  harsh_braking_count?: number;
  harsh_acceleration_count?: number;
  idle_seconds?: number;
  night_driving_seconds?: number;
}

// ─── Service ─────────────────────────────────────────────────────

export class AiBridgeService {

  // ── 1. OCR — Vehicle Registration ─────────────────────────────

  /**
   * Upload a vehicle registration image to the AI service and receive
   * structured fields (plate, VIN, model, owner, date) with confidence.
   *
   * @param imageBuffer - Raw image bytes (JPEG/PNG/WebP/TIFF/BMP)
   * @param filename    - Original filename for content-type hinting
   */
  static async ocrVehicleRegistration(
    imageBuffer: Buffer,
    filename: string,
  ): Promise<OcrResponse | null> {
    try {
      const form = new FormData();
      const blob = new Blob([new Uint8Array(imageBuffer)]);
      form.append('file', blob, filename);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(
        `${AI_URL}/api/v1/ocr/vehicle-registration`,
        {
          method: 'POST',
          headers: headers(),          // X-API-Key; browser-style FormData sets content-type
          body: form,
          signal: controller.signal,
        },
      );
      clearTimeout(timer);

      if (!res.ok) {
        console.error(`[AI Bridge] OCR responded ${res.status}`);
        return null;
      }

      return (await res.json()) as OcrResponse;
    } catch (err) {
      console.warn('[AI Bridge] OCR unreachable:', (err as Error).message);
      return null;
    }
  }

  // ── 2. Driver Score ───────────────────────────────────────────

  /**
   * Compute a driver safety score from aggregated telemetry metrics.
   * Falls back to `null` if the AI service is unreachable.
   */
  static async computeDriverScore(
    payload: TelemetryPayload,
  ): Promise<DriverScoreResponse | null> {
    return safeFetch<DriverScoreResponse | null>(
      `${AI_URL}/api/v1/driver-score/compute`,
      {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      },
      null,
    );
  }

  // ── 3. Predict Route Delay (existing) ─────────────────────────

  /**
   * Calls the AI service to predict route delays (legacy endpoint).
   */
  static async predictRouteDelay(
    routeId: string,
    scheduledTime: Date,
    weatherData: unknown,
  ) {
    return safeFetch(
      `${AI_URL}/predict-delay`,
      {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ routeId, scheduledTime, weatherData }),
      },
      { estimatedDelay: 0, isFallback: true },
    );
  }

  // ── 4. Health Check ───────────────────────────────────────────

  /**
   * Returns true if the AI service is reachable and healthy.
   */
  static async isHealthy(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      const res = await fetch(`${AI_URL}/api/v1/health`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }
}