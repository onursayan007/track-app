#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  GPS Simulator — Servisim Geliyor Dev/QA Telemetry Generator               ║
// ║  Sends 5 virtual vehicles at 3-second intervals via UDP → port 5002        ║
// ║  Supports Arvento JSON, App JSON and NMEA $GPRMC protocols                 ║
// ║  Usage:  node gps-simulator.js [--interval 3000] [--port 5002]             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
'use strict';

const dgram = require('dgram');

// ─── Configuration ──────────────────────────────────────────────────────────────
const INTERVAL_MS = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--interval') || '3000', 10);
const UDP_PORT    = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--port')     || '5002', 10);
const UDP_HOST    = '127.0.0.1';

// ─── Route Waypoints ────────────────────────────────────────────────────────────
// Each vehicle follows a loop of GPS waypoints. The simulator linearly
// interpolates between them, creating realistic movement.

const ANTALYA_LOOP = [
  { lat: 36.8841, lng: 30.7056 },  // Konyaaltı sahil
  { lat: 36.8890, lng: 30.6985 },
  { lat: 36.8950, lng: 30.6900 },  // Antalya Havalimanı yolu
  { lat: 36.9005, lng: 30.6780 },
  { lat: 36.9100, lng: 30.6650 },
  { lat: 36.9120, lng: 30.6550 },  // Aksu kavşak
  { lat: 36.9080, lng: 30.6700 },
  { lat: 36.9000, lng: 30.6850 },
  { lat: 36.8930, lng: 30.6950 },
  { lat: 36.8870, lng: 30.7020 },
];

const BODRUM_LOOP = [
  { lat: 37.0344, lng: 27.4305 },  // Bodrum Kalesi
  { lat: 37.0380, lng: 27.4250 },
  { lat: 37.0420, lng: 27.4180 },  // Gümbet yolu
  { lat: 37.0480, lng: 27.4100 },
  { lat: 37.0500, lng: 27.4000 },  // Bitez
  { lat: 37.0460, lng: 27.3920 },
  { lat: 37.0410, lng: 27.3990 },
  { lat: 37.0380, lng: 27.4080 },
  { lat: 37.0350, lng: 27.4180 },
  { lat: 37.0340, lng: 27.4270 },
];

const ANTALYA_CITY = [
  { lat: 36.8969, lng: 30.7133 },  // Kaleiçi
  { lat: 36.8850, lng: 30.7060 },  // Lara
  { lat: 36.8750, lng: 30.7200 },
  { lat: 36.8680, lng: 30.7350 },
  { lat: 36.8600, lng: 30.7400 },
  { lat: 36.8550, lng: 30.7300 },
  { lat: 36.8650, lng: 30.7150 },
  { lat: 36.8780, lng: 30.7100 },
  { lat: 36.8880, lng: 30.7110 },
  { lat: 36.8950, lng: 30.7130 },
];

// ─── Vehicle Definitions ────────────────────────────────────────────────────────
// These match the seed data in prisma/seed.ts
const vehicles = [
  {
    deviceId:  'ARV-ANT-001',
    plate:     '07 VIP 001',
    protocol:  'arvento',       // → { IMEI, Latitude, Longitude, Speed, DateTime }
    route:     ANTALYA_LOOP,
    offset:    0,               // starting waypoint index
    speed:     45 + Math.random() * 20,
  },
  {
    deviceId:  'UDP-ANT-002',
    plate:     '07 VIP 002',
    protocol:  'app',           // → { deviceId, lat, lng, speed, heading }
    route:     ANTALYA_CITY,
    offset:    3,
    speed:     35 + Math.random() * 15,
  },
  {
    deviceId:  'ARV-BOD-001',
    plate:     '48 SHT 010',
    protocol:  'arvento',
    route:     BODRUM_LOOP,
    offset:    0,
    speed:     50 + Math.random() * 25,
  },
  {
    deviceId:  'APP-BOD-SIM-1',
    plate:     '48 SHT 020',
    protocol:  'app',
    route:     BODRUM_LOOP,
    offset:    5,
    speed:     30 + Math.random() * 20,
  },
  {
    deviceId:  'APP-ANT-SIM-1',
    plate:     '07 VIP 003',
    protocol:  'nmea',          // → $GPRMC sentence
    route:     ANTALYA_LOOP,
    offset:    7,
    speed:     40 + Math.random() * 20,
  },
];

// ─── Runtime State ──────────────────────────────────────────────────────────────
const state = vehicles.map((v) => ({
  ...v,
  waypointIdx: v.offset % v.route.length,
  progress:    0,   // 0..1 between current & next waypoint
  heading:     0,
  tickCount:   0,
}));

// ─── Helpers ────────────────────────────────────────────────────────────────────

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function bearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180)
            - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

function jitter(val, amount = 0.00005) {
  return val + (Math.random() - 0.5) * amount;
}

/** Convert decimal degrees to NMEA DDDMM.MMM format */
function toNMEA(deg, isLat) {
  const abs  = Math.abs(deg);
  const d    = Math.floor(abs);
  const m    = (abs - d) * 60;
  const pad  = isLat ? 2 : 3;
  return d.toString().padStart(pad, '0') + m.toFixed(4).padStart(7, '0');
}

/** Simple NMEA XOR checksum */
function nmeaChecksum(sentence) {
  let cs = 0;
  for (let i = 0; i < sentence.length; i++) cs ^= sentence.charCodeAt(i);
  return cs.toString(16).toUpperCase().padStart(2, '0');
}

function formatTime(d) {
  return d.getUTCHours().toString().padStart(2, '0')
       + d.getUTCMinutes().toString().padStart(2, '0')
       + d.getUTCSeconds().toString().padStart(2, '0')
       + '.00';
}

function formatDate(d) {
  return d.getUTCDate().toString().padStart(2, '0')
       + (d.getUTCMonth() + 1).toString().padStart(2, '0')
       + (d.getUTCFullYear() % 100).toString().padStart(2, '0');
}

// ANSI colors for console output
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  cyan:    '\x1b[36m',
  yellow:  '\x1b[33m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
  red:     '\x1b[31m',
  white:   '\x1b[37m',
  bgGray:  '\x1b[100m',
};

const vehicleColors = [C.green, C.cyan, C.yellow, C.magenta, C.blue];

// ─── Build Payloads ─────────────────────────────────────────────────────────────

function buildArventoPayload(v, lat, lng, speed, heading) {
  return JSON.stringify({
    IMEI:      v.deviceId,
    Latitude:  parseFloat(lat.toFixed(6)),
    Longitude: parseFloat(lng.toFixed(6)),
    Speed:     parseFloat(speed.toFixed(1)),
    Heading:   parseFloat(heading.toFixed(1)),
    DateTime:  new Date().toISOString(),
    Ignition:  true,
    Mileage:   Math.floor(Math.random() * 200000),
  });
}

function buildAppPayload(v, lat, lng, speed, heading) {
  return JSON.stringify({
    deviceId:  v.deviceId,
    lat:       parseFloat(lat.toFixed(6)),
    lng:       parseFloat(lng.toFixed(6)),
    speed:     parseFloat(speed.toFixed(1)),
    heading:   parseFloat(heading.toFixed(1)),
    altitude:  Math.floor(30 + Math.random() * 50),
    timestamp: new Date().toISOString(),
  });
}

function buildNMEAPayload(v, lat, lng, speed, heading) {
  // $GPRMC,HHMMSS.SS,A,DDMM.MMMM,N/S,DDDMM.MMMM,E/W,KNOTS,COURSE,DDMMYY,,,A*CS
  const now   = new Date();
  const knots = (speed / 1.852).toFixed(1);          // km/h → knots
  const latNM = toNMEA(lat, true);
  const lngNM = toNMEA(lng, false);
  const ns    = lat >= 0 ? 'N' : 'S';
  const ew    = lng >= 0 ? 'E' : 'W';

  const body = `GPRMC,${formatTime(now)},A,${latNM},${ns},${lngNM},${ew},${knots},${heading.toFixed(1)},${formatDate(now)},,,A`;
  return `$${body}*${nmeaChecksum(body)}`;
}

// ─── Main Loop ──────────────────────────────────────────────────────────────────

const client = dgram.createSocket('udp4');

function tick() {
  const now = new Date().toISOString().slice(11, 19);

  for (let i = 0; i < state.length; i++) {
    const s  = state[i];
    const wp = s.route;

    // Advance progress between waypoints
    s.progress += 0.08 + Math.random() * 0.06;
    if (s.progress >= 1) {
      s.progress    = 0;
      s.waypointIdx = (s.waypointIdx + 1) % wp.length;
    }

    const curr = wp[s.waypointIdx];
    const next = wp[(s.waypointIdx + 1) % wp.length];

    const lat     = jitter(lerp(curr.lat, next.lat, s.progress));
    const lng     = jitter(lerp(curr.lng, next.lng, s.progress));
    s.heading     = bearing(curr.lat, curr.lng, next.lat, next.lng);
    const speed   = s.speed + (Math.random() - 0.5) * 10;

    let payload;
    let proto;
    switch (s.protocol) {
      case 'arvento':
        payload = buildArventoPayload(s, lat, lng, speed, s.heading);
        proto   = 'ARV';
        break;
      case 'nmea':
        payload = buildNMEAPayload(s, lat, lng, speed, s.heading);
        proto   = 'NMEA';
        break;
      default:
        payload = buildAppPayload(s, lat, lng, speed, s.heading);
        proto   = 'APP';
    }

    const buf = Buffer.from(payload, 'utf-8');
    client.send(buf, 0, buf.length, UDP_PORT, UDP_HOST);

    s.tickCount++;
    const color = vehicleColors[i % vehicleColors.length];
    const dir   = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(s.heading / 45) % 8];

    process.stdout.write(
      `${C.dim}[${now}]${C.reset} ` +
      `${color}${C.bold}${s.plate.padEnd(12)}${C.reset} ` +
      `${C.dim}${proto.padEnd(5)}${C.reset} ` +
      `${C.white}${lat.toFixed(5)}, ${lng.toFixed(5)}${C.reset} ` +
      `${C.cyan}${speed.toFixed(0).padStart(3)} km/h${C.reset} ` +
      `${C.yellow}${dir.padEnd(2)}${C.reset} ` +
      `${C.dim}#${s.tickCount}${C.reset}\n`
    );
  }
}

// ─── Startup Banner ─────────────────────────────────────────────────────────────
console.log(`
${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗
║          Servisim Geliyor GPS Simulator v1.0                 ║
╚══════════════════════════════════════════════════════════════╝${C.reset}
${C.dim}Target   :${C.reset} ${C.white}UDP ${UDP_HOST}:${UDP_PORT}${C.reset}
${C.dim}Interval :${C.reset} ${C.white}${INTERVAL_MS}ms${C.reset}
${C.dim}Vehicles :${C.reset} ${C.white}${vehicles.length}${C.reset}
`);

vehicles.forEach((v, i) => {
  const color = vehicleColors[i % vehicleColors.length];
  console.log(`  ${color}● ${v.plate.padEnd(12)}${C.reset} ${C.dim}${v.protocol.toUpperCase().padEnd(7)} ${v.deviceId}${C.reset}`);
});
console.log(`\n${C.dim}Press Ctrl+C to stop.${C.reset}\n`);

// Start the tick loop
const timer = setInterval(tick, INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${C.yellow}⏹  Simulator stopped.${C.reset}`);
  clearInterval(timer);
  client.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(timer);
  client.close();
  process.exit(0);
});
