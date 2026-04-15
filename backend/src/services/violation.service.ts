import { AlertSeverity } from '@prisma/client';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

type Packet = {
  timestamp: Date;
  lat: number;
  lng: number;
  speed?: number;
  ignition?: boolean;
};

type IdleState = {
  startAt: number;
  alertRaised: boolean;
};

const idleStates = new Map<string, IdleState>();
const cooldownMap = new Map<string, number>();

const ALERT_COOLDOWN_MS = 5 * 60_000;

export class ViolationService {
  static async processTelemetryPacket(params: {
    tenantId: string;
    vehicleId: string;
    packet: Packet;
  }) {
    const { tenantId, vehicleId, packet } = params;

    const settings = await prisma.tenantAlertSetting.upsert({
      where: { tenantId },
      update: {},
      create: {
        tenantId,
        enableIgnitionOn: false,
        enableSpeeding: false,
        enableIdling: false,
        enableGeofence: false,
        enableGeofence_Master: false,
        enableOffline: false,
        enablePowerCut: false,
        speedLimit: 90,
        idlingLimit: 10,
        selectedDistricts: [],
        enableShiftControl: false,
      },
    });

    const speed = packet.speed ?? 0;
    const ignition = packet.ignition === true;

    if (settings.enableSpeeding && speed > settings.speedLimit) {
      await this.raiseAlertWithCooldown({
        tenantId,
        vehicleId,
        alertType: 'Hız Sınırı Aşımı',
        severity: AlertSeverity.MEDIUM,
        details: {
          speed: Math.round(speed),
          speedLimit: settings.speedLimit,
          lat: packet.lat,
          lng: packet.lng,
        },
      });
    }

    const idlingEnabled = settings.enableIdling || settings.enableIgnitionOn;
    if (idlingEnabled) {
      await this.checkIdling({ tenantId, vehicleId, packet, idlingLimit: settings.idlingLimit });
    }

    if (settings.enableShiftControl && ignition) {
      await this.checkOffHours(tenantId, vehicleId, packet);
    }

    const geofenceEnabled = settings.enableGeofence || settings.enableGeofence_Master;
    if (geofenceEnabled) {
      const activeAssignments = await prisma.geofenceAssignment.findMany({
        where: {
          vehicleId,
          isActive: true,
          geofenceDefinition: { tenantId },
        },
        select: {
          geofenceDefinition: {
            select: {
              id: true,
              name: true,
              centerLat: true,
              centerLng: true,
              radiusKm: true,
            },
          },
        },
      });

      if (activeAssignments.length > 0) {
        const isInsideAnyGeofence = activeAssignments.some(({ geofenceDefinition }) => {
          const distanceKm = haversineKm(
            packet.lat,
            packet.lng,
            geofenceDefinition.centerLat,
            geofenceDefinition.centerLng,
          );
          return distanceKm <= geofenceDefinition.radiusKm;
        });

        if (!isInsideAnyGeofence) {
          await this.raiseAlertWithCooldown({
            tenantId,
            vehicleId,
            alertType: 'Sanal Çit İhlali',
            severity: AlertSeverity.MEDIUM,
            details: {
              lat: packet.lat,
              lng: packet.lng,
              assignedGeofenceCount: activeAssignments.length,
            },
          });
        }
      }
    }
  }

  static async checkOfflineVehicles() {
    const cutoff = new Date(Date.now() - 15 * 60_000);
    const vehicles = await prisma.vehicle.findMany({
      where: {
        lastSeen: { lt: cutoff },
      },
      select: { id: true, tenantId: true, lastSeen: true },
    });

    for (const vehicle of vehicles) {
      const settings = await prisma.tenantAlertSetting.findUnique({
        where: { tenantId: vehicle.tenantId },
        select: { enableOffline: true },
      });
      if (!settings || !settings.enableOffline) continue;

      const minutes = vehicle.lastSeen
        ? Math.floor((Date.now() - vehicle.lastSeen.getTime()) / 60_000)
        : 0;

      await this.raiseAlertWithCooldown({
        tenantId: vehicle.tenantId,
        vehicleId: vehicle.id,
        alertType: 'Cihaz Sinyali Kesildi',
        severity: AlertSeverity.HIGH,
        details: {
          offlineMinutes: minutes,
          lastSeen: vehicle.lastSeen?.toISOString() ?? null,
        },
      });
    }
  }

  private static async checkIdling(params: {
    tenantId: string;
    vehicleId: string;
    packet: Packet;
    idlingLimit: number;
  }) {
    const { tenantId, vehicleId, packet, idlingLimit } = params;
    const speed = packet.speed ?? 0;
    const ignition = packet.ignition === true;

    if (ignition && speed === 0) {
      const state = idleStates.get(vehicleId);
      if (!state) {
        idleStates.set(vehicleId, { startAt: packet.timestamp.getTime(), alertRaised: false });
        return;
      }

      const idleMinutes = Math.floor((packet.timestamp.getTime() - state.startAt) / 60_000);
      if (idleMinutes >= idlingLimit && !state.alertRaised) {
        await this.raiseAlertWithCooldown({
          tenantId,
          vehicleId,
          alertType: 'Rölanti İhlali',
          severity: AlertSeverity.LOW,
          details: {
            idlingMinutes: idleMinutes,
            idlingLimit,
            lat: packet.lat,
            lng: packet.lng,
          },
        });
        idleStates.set(vehicleId, { ...state, alertRaised: true });
      }
      return;
    }

    idleStates.delete(vehicleId);
  }

  private static async checkOffHours(tenantId: string, vehicleId: string, packet: Packet) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { driverId: true },
    });
    if (!vehicle?.driverId) return;

    const current = packet.timestamp;
    const dayOfWeek = current.getDay();
    const nowMinutes = current.getHours() * 60 + current.getMinutes();

    const shifts = await prisma.driverShift.findMany({
      where: { userId: vehicle.driverId, dayOfWeek },
      select: { startTime: true, endTime: true },
    });

    const isWithinAnyShift = shifts.some((shift) => {
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      const startTotal = startHour * 60 + startMinute;
      const endTotal = endHour * 60 + endMinute;
      return nowMinutes >= startTotal && nowMinutes <= endTotal;
    });

    if (!isWithinAnyShift) {
      await this.raiseAlertWithCooldown({
        tenantId,
        vehicleId,
        alertType: 'Mesai Dışı Kullanım',
        severity: AlertSeverity.HIGH,
        details: {
          timestamp: current.toISOString(),
          dayOfWeek,
        },
      });
    }
  }

  private static async raiseAlertWithCooldown(params: {
    tenantId: string;
    vehicleId: string;
    alertType: string;
    severity: AlertSeverity;
    details: Prisma.InputJsonValue;
  }) {
    const { tenantId, vehicleId, alertType, severity, details } = params;
    const key = `${tenantId}:${vehicleId}:${alertType}`;
    const now = Date.now();
    const lastRaisedAt = cooldownMap.get(key) ?? 0;

    if (now - lastRaisedAt < ALERT_COOLDOWN_MS) return;

    await prisma.vehicleAlert.create({
      data: {
        tenantId,
        vehicleId,
        timestamp: new Date(),
        alertType,
        severity,
        details,
      },
    });

    cooldownMap.set(key, now);
  }
}

/**
 * Mock boundary checker.
 * Returns true when point is considered inside an allowed district set.
 */
export function checkBoundary(
  coords: { lat: number; lng: number },
  districtIds: Array<number | string>,
): boolean {
  if (!districtIds || districtIds.length === 0) return true;
  const fingerprint = Math.abs(Math.floor((coords.lat + coords.lng) * 100)) % 10;
  const normalized = districtIds.map((id) => Number(id)).filter((n) => Number.isFinite(n));
  return normalized.some((id) => id % 10 === fingerprint);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}
