// ════════════════════════════════════════════════════════════════════
// TCP / UDP Listener — raw telemetry ingestion endpoint
//
// TCP (port 5001) — Teltonika devices send length-prefixed Codec 8/8E
// UDP (port 5002) — NMEA sentences / generic GPS trackers
//
// Both listeners do ZERO parsing — they push raw hex into a Redis
// Stream and return immediately, keeping the hot path lock-free.
// ════════════════════════════════════════════════════════════════════

import net from 'net';
import dgram from 'dgram';
import { config } from '../config';
import { publishRawFrame } from './stream';

// ─── TCP Server (Teltonika / binary protocols) ──────────────────

const tcpSessions = new Map<string, Buffer[]>();

export function startTcpListener(): net.Server {
  const server = net.createServer((socket) => {
    const remote = `${socket.remoteAddress}:${socket.remotePort}`;
    const chunks: Buffer[] = [];
    tcpSessions.set(remote, chunks);

    socket.on('data', (chunk: Buffer) => {
      chunks.push(chunk);

      // Teltonika: first connection sends IMEI (15–17 ASCII bytes
      // prefixed by 2-byte length).  Subsequent packets are Codec 8
      // frames prefixed by 4-byte 0x00 preamble.
      const combined = Buffer.concat(chunks);

      if (isTeltonikaImeiPacket(combined)) {
        // Extract IMEI, acknowledge it, reset buffer
        const imeiLen = combined.readUInt16BE(0);
        const imei = combined.subarray(2, 2 + imeiLen).toString('ascii');
        // Store IMEI on socket for later frames
        (socket as any).__imei = imei;
        (socket as any).__source = 'teltonika';
        // Send accept (0x01)
        socket.write(Buffer.from([0x01]));
        chunks.length = 0;
        return;
      }

      if (isTeltonikaDataPacket(combined)) {
        const hex = combined.toString('hex');
        const imei: string = (socket as any).__imei || 'unknown';
        publishRawFrame({
          source: 'teltonika',
          deviceId: imei,
          raw: hex,
          remoteIp: socket.remoteAddress || '',
        }).catch((err) => console.error('[TCP] Redis publish error:', err.message));

        // Respond with number of accepted data records (4 bytes)
        // Quick hack: parse number-of-data from byte 9 of the frame
        const numRecords = combined.length > 9 ? combined.readUInt8(9) : 0;
        const ack = Buffer.alloc(4);
        ack.writeUInt32BE(numRecords);
        socket.write(ack);
        chunks.length = 0;
        return;
      }

      // Guard: if the buffer grows beyond 64 KB without matching,
      // something is wrong — drop and close.
      if (combined.length > 65_536) {
        console.warn(`[TCP] Oversized buffer from ${remote}, dropping`);
        chunks.length = 0;
        socket.destroy();
      }
    });

    socket.on('close', () => tcpSessions.delete(remote));
    socket.on('error', (err) => {
      console.error(`[TCP] Socket error from ${remote}:`, err.message);
      tcpSessions.delete(remote);
    });

    // Idle timeout: 5 minutes with no data → close.
    socket.setTimeout(5 * 60_000, () => {
      console.warn(`[TCP] Idle timeout for ${remote}`);
      socket.destroy();
    });
  });

  server.listen(config.telemetry.tcpPort, () => {
    console.log(`📡 TCP telemetry listener on port ${config.telemetry.tcpPort}`);
  });

  server.on('error', (err) => {
    console.error('[TCP] Server error:', err.message);
  });

  return server;
}

// ─── UDP Server (NMEA / lightweight trackers) ───────────────────

export function startUdpListener(): dgram.Socket {
  const server = dgram.createSocket('udp4');

  server.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
    const raw = msg.toString('utf-8').trim();
    if (!raw) return;

    // Detect source heuristically
    let source = 'nmea';
    let deviceId = `${rinfo.address}:${rinfo.port}`;

    if (raw.startsWith('{')) {
      // Looks like JSON — could be Arvento push or generic
      try {
        const parsed = JSON.parse(raw);
        if (parsed.IMEI) {
          source = 'arvento';
          deviceId = parsed.IMEI;
        } else {
          source = 'app';
          deviceId = parsed.deviceId || deviceId;
        }
      } catch {
        // Not valid JSON — treat as NMEA
      }
    } else if (raw.startsWith('$G')) {
      source = 'nmea';
      // Try to extract device ID from a proprietary prefix
      // e.g. "IMEI:123456,$GPRMC,..."
    } else {
      // Raw hex — might be a Teltonika frame over UDP
      source = 'teltonika';
    }

    publishRawFrame({
      source,
      deviceId,
      raw: source === 'teltonika' ? msg.toString('hex') : raw,
      remoteIp: rinfo.address,
    }).catch((err) => console.error('[UDP] Redis publish error:', err.message));
  });

  server.on('error', (err) => {
    console.error('[UDP] Server error:', err.message);
    server.close();
  });

  server.bind(config.telemetry.udpPort, () => {
    console.log(`📡 UDP telemetry listener on port ${config.telemetry.udpPort}`);
  });

  return server;
}

// ─── Helpers ─────────────────────────────────────────────────────

function isTeltonikaImeiPacket(buf: Buffer): boolean {
  if (buf.length < 2) return false;
  const len = buf.readUInt16BE(0);
  // IMEI is 15 digits, but Teltonika sometimes sends 16
  return len >= 15 && len <= 17 && buf.length >= 2 + len;
}

function isTeltonikaDataPacket(buf: Buffer): boolean {
  // Codec 8/8E: 4 zero-byte preamble + 4-byte data length + payload + 4-byte CRC
  if (buf.length < 12) return false;
  return buf.readUInt32BE(0) === 0x00000000;
}
