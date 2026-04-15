// ════════════════════════════════════════════════════════════════════
// Protocol Parsers — decode raw frames into standardised telemetry
//
// Supported:
//   1. Teltonika Codec 8 / 8E  (TCP — length-prefixed binary)
//   2. NMEA 0183  ($GPRMC, $GPGGA sentences)
//   3. Arvento API  (JSON over HTTP — pre-parsed)
//   4. Mobile App / REST  (already JSON)
//
// Each parser returns a `ParsedTelemetry` or `null` on failure.
// ════════════════════════════════════════════════════════════════════

export interface ParsedTelemetry {
  /** ISO-8601 timestamp from the device (GPS time) */
  timestamp: Date;
  lat: number;
  lng: number;
  altitude?: number;
  speed?: number;       // km/h
  heading?: number;     // degrees 0-360
  satellites?: number;
  hdop?: number;
  ignition?: boolean;
  odometer?: number;
  fuelLevel?: number;
  batteryMv?: number;
  /** Arbitrary I/O elements from Teltonika or vendor-specific data */
  ioData?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// 1. Teltonika Codec 8 / 8E
//    Reference: https://wiki.teltonika-gps.com/view/Codec
// ═══════════════════════════════════════════════════════════════

export function parseTeltonika(hex: string): ParsedTelemetry[] {
  const results: ParsedTelemetry[] = [];
  try {
    const buf = Buffer.from(hex, 'hex');
    if (buf.length < 12) return results;

    // Preamble (4 bytes 0x00) + data length (4 bytes)
    let offset = 8;

    const codecId = buf.readUInt8(offset);
    offset += 1;

    if (codecId !== 0x08 && codecId !== 0x8e) {
      console.warn(`[Teltonika] Unsupported codec 0x${codecId.toString(16)}`);
      return results;
    }

    const numberOfData = buf.readUInt8(offset);
    offset += 1;

    for (let i = 0; i < numberOfData; i++) {
      if (offset + 30 > buf.length) break;   // guard against truncated packets

      // Timestamp — 8 bytes, ms since epoch
      const tsHigh = buf.readUInt32BE(offset);
      const tsLow = buf.readUInt32BE(offset + 4);
      const timestamp = new Date(tsHigh * 4294967296 + tsLow);
      offset += 8;

      // Priority — 1 byte (skip)
      offset += 1;

      // Longitude — 4 bytes, signed, ×1e-7 degrees → multiply by 1e-7 is wrong
      // Teltonika: longitude in degrees × 10^7, stored as signed int32
      const rawLng = buf.readInt32BE(offset);
      offset += 4;
      const rawLat = buf.readInt32BE(offset);
      offset += 4;
      const lat = rawLat / 1e7;
      const lng = rawLng / 1e7;

      const altitude = buf.readInt16BE(offset);
      offset += 2;

      const heading = buf.readUInt16BE(offset);
      offset += 2;

      const satellites = buf.readUInt8(offset);
      offset += 1;

      const speed = buf.readUInt16BE(offset);
      offset += 2;

      // ─── I/O Elements ──────────────────────────────────
      const ioData: Record<string, unknown> = {};
      let ignition: boolean | undefined;

      if (codecId === 0x08) {
        offset = parseTeltonikaIo8(buf, offset, ioData);
      } else {
        // Codec 8E — 16-bit event/element counts
        offset = parseTeltonikaIo8E(buf, offset, ioData);
      }

      // Teltonika AVL ID 239 = ignition
      if ('239' in ioData) ignition = ioData['239'] === 1;

      results.push({ timestamp, lat, lng, altitude, speed, heading, satellites, ignition, ioData });
    }
  } catch (err) {
    console.error('[Teltonika] Parse error:', (err as Error).message);
  }
  return results;
}

/** Parse Codec 8 I/O block (8-bit event id + element count) */
function parseTeltonikaIo8(buf: Buffer, offset: number, io: Record<string, unknown>): number {
  if (offset + 2 > buf.length) return offset;
  const eventId = buf.readUInt8(offset); offset += 1;
  io['_eventId'] = eventId;
  const totalElements = buf.readUInt8(offset); offset += 1;

  // 1-byte values
  offset = readIoElements(buf, offset, 1, io, 8);
  // 2-byte values
  offset = readIoElements(buf, offset, 2, io, 8);
  // 4-byte values
  offset = readIoElements(buf, offset, 4, io, 8);
  // 8-byte values
  offset = readIoElements(buf, offset, 8, io, 8);

  return offset;
}

/** Parse Codec 8E I/O block (16-bit event id + element count) */
function parseTeltonikaIo8E(buf: Buffer, offset: number, io: Record<string, unknown>): number {
  if (offset + 4 > buf.length) return offset;
  const eventId = buf.readUInt16BE(offset); offset += 2;
  io['_eventId'] = eventId;
  const totalElements = buf.readUInt16BE(offset); offset += 2;

  // 1-byte values
  offset = readIoElements(buf, offset, 1, io, 16);
  // 2-byte values
  offset = readIoElements(buf, offset, 2, io, 16);
  // 4-byte values
  offset = readIoElements(buf, offset, 4, io, 16);
  // 8-byte values
  offset = readIoElements(buf, offset, 8, io, 16);
  // variable-length values (Codec 8E only)
  offset = readIoElementsVariable(buf, offset, io);

  return offset;
}

function readIoElements(
  buf: Buffer, offset: number, valueBytes: number, io: Record<string, unknown>, idBytes: 8 | 16,
): number {
  if (offset + (idBytes === 8 ? 1 : 2) > buf.length) return offset;
  const count = idBytes === 8 ? buf.readUInt8(offset++) : buf.readUInt16BE((offset += 2) - 2);

  for (let i = 0; i < count; i++) {
    if (offset + (idBytes === 8 ? 1 : 2) + valueBytes > buf.length) return offset;
    const id = idBytes === 8 ? buf.readUInt8(offset++) : buf.readUInt16BE((offset += 2) - 2);
    let val: number;
    switch (valueBytes) {
      case 1: val = buf.readUInt8(offset); break;
      case 2: val = buf.readUInt16BE(offset); break;
      case 4: val = buf.readUInt32BE(offset); break;
      case 8:
        val = Number(buf.readBigUInt64BE(offset));
        break;
      default: val = 0;
    }
    offset += valueBytes;
    io[String(id)] = val;
  }
  return offset;
}

function readIoElementsVariable(buf: Buffer, offset: number, io: Record<string, unknown>): number {
  if (offset + 2 > buf.length) return offset;
  const count = buf.readUInt16BE(offset); offset += 2;
  for (let i = 0; i < count; i++) {
    if (offset + 4 > buf.length) return offset;
    const id = buf.readUInt16BE(offset); offset += 2;
    const len = buf.readUInt16BE(offset); offset += 2;
    if (offset + len > buf.length) return offset;
    io[String(id)] = buf.subarray(offset, offset + len).toString('hex');
    offset += len;
  }
  return offset;
}

// ═══════════════════════════════════════════════════════════════
// 2. NMEA 0183  ($GPRMC / $GPGGA)
// ═══════════════════════════════════════════════════════════════

export function parseNMEA(sentence: string): ParsedTelemetry | null {
  try {
    const trimmed = sentence.trim();
    if (trimmed.startsWith('$GPRMC') || trimmed.startsWith('$GNRMC')) {
      return parseGPRMC(trimmed);
    }
    if (trimmed.startsWith('$GPGGA') || trimmed.startsWith('$GNGGA')) {
      return parseGPGGA(trimmed);
    }
    return null;
  } catch {
    return null;
  }
}

function parseGPRMC(sentence: string): ParsedTelemetry | null {
  // $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
  const parts = sentence.split('*')[0].split(',');
  if (parts.length < 12 || parts[2] !== 'A') return null; // 'A' = Active fix

  const time = parts[1];
  const date = parts[9];
  const timestamp = nmeaDateTime(date, time);
  if (!timestamp) return null;

  const lat = nmeaCoord(parts[3], parts[4]);
  const lng = nmeaCoord(parts[5], parts[6]);
  if (lat === null || lng === null) return null;

  const speed = parts[7] ? parseFloat(parts[7]) * 1.852 : 0; // knots → km/h
  const heading = parts[8] ? parseFloat(parts[8]) : 0;

  return { timestamp, lat, lng, speed, heading };
}

function parseGPGGA(sentence: string): ParsedTelemetry | null {
  // $GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,...
  const parts = sentence.split('*')[0].split(',');
  if (parts.length < 10) return null;

  const fixQuality = parseInt(parts[6], 10);
  if (fixQuality === 0) return null; // no fix

  const lat = nmeaCoord(parts[2], parts[3]);
  const lng = nmeaCoord(parts[4], parts[5]);
  if (lat === null || lng === null) return null;

  const satellites = parts[7] ? parseInt(parts[7], 10) : undefined;
  const hdop = parts[8] ? parseFloat(parts[8]) : undefined;
  const altitude = parts[9] ? parseFloat(parts[9]) : undefined;

  return { timestamp: new Date(), lat, lng, satellites, hdop, altitude };
}

function nmeaCoord(raw: string, dir: string): number | null {
  if (!raw || !dir) return null;
  // "4807.038" → 48° 07.038'
  const dotIdx = raw.indexOf('.');
  if (dotIdx < 3) return null;
  const degLen = dotIdx - 2;
  const degrees = parseInt(raw.substring(0, degLen), 10);
  const minutes = parseFloat(raw.substring(degLen));
  let dd = degrees + minutes / 60;
  if (dir === 'S' || dir === 'W') dd = -dd;
  return Math.round(dd * 1e7) / 1e7;
}

function nmeaDateTime(ddmmyy: string, hhmmss: string): Date | null {
  if (ddmmyy.length < 6 || hhmmss.length < 6) return null;
  const day = ddmmyy.substring(0, 2);
  const month = ddmmyy.substring(2, 4);
  const year = `20${ddmmyy.substring(4, 6)}`;
  const hh = hhmmss.substring(0, 2);
  const mm = hhmmss.substring(2, 4);
  const ss = hhmmss.substring(4, 6);
  return new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}Z`);
}

// ═══════════════════════════════════════════════════════════════
// 3. Arvento (JSON from Arvento REST/push API)
// ═══════════════════════════════════════════════════════════════

export interface ArventoPayload {
  IMEI?: string;
  Latitude?: number;
  Longitude?: number;
  Speed?: number;
  Direction?: number;
  DateTime?: string;
  Ignition?: boolean;
  Mileage?: number;
  [key: string]: unknown;
}

export function parseArvento(json: string): ParsedTelemetry | null {
  try {
    const data: ArventoPayload = JSON.parse(json);
    if (data.Latitude == null || data.Longitude == null) return null;

    return {
      timestamp: data.DateTime ? new Date(data.DateTime) : new Date(),
      lat: data.Latitude,
      lng: data.Longitude,
      speed: data.Speed ?? 0,
      heading: data.Direction ?? 0,
      ignition: data.Ignition,
      odometer: data.Mileage,
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. App / REST  (already structured JSON from driver mobile)
// ═══════════════════════════════════════════════════════════════

export interface AppPayload {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  timestamp?: string;
}

export function parseAppPayload(json: string): ParsedTelemetry | null {
  try {
    const data: AppPayload = JSON.parse(json);
    if (data.lat == null || data.lng == null) return null;
    return {
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      lat: data.lat,
      lng: data.lng,
      speed: data.speed ?? 0,
      heading: data.heading ?? 0,
      altitude: data.altitude,
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Dispatch — pick the right parser by source tag
// ═══════════════════════════════════════════════════════════════

export function parseRawFrame(
  source: string,
  raw: string,
): ParsedTelemetry[] {
  switch (source) {
    case 'teltonika':
      return parseTeltonika(raw);

    case 'nmea': {
      // NMEA can have multiple sentences separated by \n
      const results: ParsedTelemetry[] = [];
      for (const line of raw.split('\n')) {
        const p = parseNMEA(line);
        if (p) results.push(p);
      }
      return results;
    }

    case 'arvento': {
      const p = parseArvento(raw);
      return p ? [p] : [];
    }

    case 'app':
    case 'rest': {
      const p = parseAppPayload(raw);
      return p ? [p] : [];
    }

    default:
      console.warn(`[Parser] Unknown source "${source}", attempting JSON`);
      const fallback = parseAppPayload(raw);
      return fallback ? [fallback] : [];
  }
}
