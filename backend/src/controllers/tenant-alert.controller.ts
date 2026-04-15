import { Request, Response } from 'express';
import { AlertSeverity } from '@prisma/client';
import prisma from '../lib/prisma';
import { BadRequestError } from '../utils/errors';
import { ok, created, noContent } from '../utils/response';
import { Prisma } from '@prisma/client';

export class TenantAlertController {
  private static readonly mockViolations: Array<{
    alertType: string;
    severity: AlertSeverity;
    details: Prisma.InputJsonValue;
  }> = [
    {
      alertType: 'Hız Sınırı Aşımı',
      severity: AlertSeverity.MEDIUM,
      details: { mock: true, speed: 112, speedLimit: 90, description: 'Hız: 112 km/s' },
    },
    {
      alertType: 'Rölanti İhlali',
      severity: AlertSeverity.LOW,
      details: { mock: true, idlingMinutes: 22, idlingLimit: 10, description: 'Rölanti: 22 dk' },
    },
    {
      alertType: 'Mesai Dışı Kullanım',
      severity: AlertSeverity.HIGH,
      details: { mock: true, description: 'Mesai takvimi dışında kullanım tespit edildi' },
    },
    {
      alertType: 'Sanal Çit İhlali',
      severity: AlertSeverity.MEDIUM,
      details: { mock: true, districtIds: [1, 2], description: 'Bölge dışı kullanım' },
    },
    {
      alertType: 'Cihaz Sinyali Kesildi',
      severity: AlertSeverity.HIGH,
      details: { mock: true, offlineMinutes: 18, description: 'Sinyal kesinti süresi: 18 dk' },
    },
  ];

  /** POST /tenant/alerts/mock */
  static async createMockAlert(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

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

    const vehicle = await prisma.vehicle.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, plate: true },
    });

    if (!vehicle) {
      throw new BadRequestError('Mock alarm üretmek için tenant altında en az 1 araç olmalı');
    }

    const enabledViolations = TenantAlertController.mockViolations.filter((v) =>
      TenantAlertController.isAlertEnabledBySettings(v.alertType, settings),
    );

    if (enabledViolations.length === 0) {
      throw new BadRequestError('Mock üretmek için en az bir ihlal türünü ayarlardan aktif edin');
    }

    const picked = enabledViolations[0];

    const alert = await prisma.vehicleAlert.create({
      data: {
        tenantId,
        vehicleId: vehicle.id,
        timestamp: new Date(),
        alertType: picked.alertType,
        details: {
          ...(picked.details as Record<string, unknown>),
          source: 'mock-device',
          plate: vehicle.plate,
        },
        severity: picked.severity,
        isResolved: false,
        isMock: true,
      },
      include: {
        vehicle: { select: { id: true, plate: true } },
      },
    });

    return created(res, alert);
  }

  /** POST /tenant/alerts/mock/all */
  static async createMockAlertsForTenantVehicles(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

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

    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (vehicles.length === 0) {
      throw new BadRequestError('Mock ihlal üretmek için tenant altında en az 1 araç olmalı');
    }

    const enabledViolations = TenantAlertController.mockViolations.filter((v) =>
      TenantAlertController.isAlertEnabledBySettings(v.alertType, settings),
    );

    if (enabledViolations.length === 0) {
      throw new BadRequestError('Mock üretmek için en az bir ihlal türünü ayarlardan aktif edin');
    }

    const rows: Array<{
      tenantId: string;
      vehicleId: string;
      timestamp: Date;
      alertType: string;
      details: Prisma.InputJsonValue;
      severity: AlertSeverity;
      isResolved: boolean;
      isMock: boolean;
    }> = [];

    let step = 0;
    const now = Date.now();
    for (const vehicle of vehicles) {
      for (const violation of enabledViolations) {
        rows.push({
          tenantId,
          vehicleId: vehicle.id,
          timestamp: new Date(now - step * 60_000),
          alertType: violation.alertType,
          details: violation.details,
          severity: violation.severity,
          isResolved: false,
          isMock: true,
        });
        step += 1;
      }
    }

    const result = await prisma.vehicleAlert.createMany({ data: rows });
    return created(res, { createdCount: result.count });
  }

  /** GET /tenant/alerts */
  static async listAlerts(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

    const alerts = await prisma.vehicleAlert.findMany({
      where: {
        tenantId,
        vehicle: { tenantId },
      },
      include: {
        vehicle: { select: { id: true, plate: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    const normalized = alerts.map((alert) => {
      const details = (alert.details ?? {}) as Record<string, unknown>;
      return {
        ...alert,
        detailsText: TenantAlertController.detailsText(alert.alertType, details),
      };
    });

    return ok(res, normalized);
  }

  /** DELETE /tenant/alerts/:id */
  static async removeAlert(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const alertId = req.params.id as string;

    const alert = await prisma.vehicleAlert.findFirst({
      where: {
        id: alertId,
        tenantId,
        vehicle: { tenantId },
      },
      select: { id: true },
    });

    if (!alert) {
      throw new BadRequestError('İhlal kaydı bulunamadı');
    }

    await prisma.vehicleAlert.delete({ where: { id: alertId } });
    return noContent(res);
  }

  /** GET /tenant/settings/alerts */
  static async getAlertSettings(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

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

    return ok(res, settings);
  }

  /** PUT /tenant/settings/alerts */
  static async updateAlertSettings(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

    const {
      enableIgnitionOn,
      enableSpeeding,
      enableIdling,
      enableGeofence,
      enableGeofence_Master,
      enableOffline,
      enablePowerCut,
      speedLimit,
      idlingLimit,
      selectedDistricts,
      enableShiftControl,
    } = req.body as {
      enableIgnitionOn?: boolean;
      enableSpeeding?: boolean;
      enableIdling?: boolean;
      enableGeofence?: boolean;
      enableGeofence_Master?: boolean;
      enableOffline?: boolean;
      enablePowerCut?: boolean;
      speedLimit?: number;
      idlingLimit?: number;
      selectedDistricts?: unknown;
      enableShiftControl?: boolean;
    };

    if (speedLimit !== undefined) {
      if (!Number.isInteger(speedLimit) || speedLimit < 1) {
        throw new BadRequestError('speedLimit pozitif bir tam sayı olmalıdır');
      }
    }

    if (idlingLimit !== undefined) {
      if (!Number.isInteger(idlingLimit) || idlingLimit < 1) {
        throw new BadRequestError('idlingLimit pozitif bir tam sayı olmalıdır');
      }
    }

    if (selectedDistricts !== undefined && !Array.isArray(selectedDistricts)) {
      throw new BadRequestError('selectedDistricts bir dizi olmalıdır');
    }

    const settings = await prisma.tenantAlertSetting.upsert({
      where: { tenantId },
      update: {
        ...(enableIgnitionOn !== undefined && { enableIgnitionOn }),
        ...(enableSpeeding !== undefined && { enableSpeeding }),
        ...(enableIdling !== undefined && { enableIdling }),
        ...(enableGeofence !== undefined && { enableGeofence }),
        ...(enableGeofence_Master !== undefined && { enableGeofence_Master }),
        ...(enableOffline !== undefined && { enableOffline }),
        ...(enablePowerCut !== undefined && { enablePowerCut }),
        ...(speedLimit !== undefined && { speedLimit }),
        ...(idlingLimit !== undefined && { idlingLimit }),
        ...(selectedDistricts !== undefined && { selectedDistricts }),
        ...(enableShiftControl !== undefined && { enableShiftControl }),
      },
      create: {
        tenantId,
        enableIgnitionOn: enableIgnitionOn ?? false,
        enableSpeeding: enableSpeeding ?? false,
        enableIdling: enableIdling ?? false,
        enableGeofence: enableGeofence ?? false,
        enableGeofence_Master: enableGeofence_Master ?? false,
        enableOffline: enableOffline ?? false,
        enablePowerCut: enablePowerCut ?? false,
        speedLimit: speedLimit ?? 90,
        idlingLimit: idlingLimit ?? 10,
        selectedDistricts: selectedDistricts ?? [],
        enableShiftControl: enableShiftControl ?? false,
      },
    });

    return ok(res, settings);
  }

  /** GET /tenant/drivers/:driverId/shifts */
  static async getDriverShifts(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = req.params.driverId as string;

    const driver = await prisma.user.findFirst({
      where: { id: driverId, tenantId, role: 'DRIVER' },
      select: { id: true },
    });
    if (!driver) throw new BadRequestError('Driver bu tenant altında bulunamadı');

    const shifts = await prisma.driverShift.findMany({
      where: { userId: driverId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return ok(res, shifts);
  }

  /** PUT /tenant/drivers/:driverId/shifts */
  static async replaceDriverShifts(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = req.params.driverId as string;

    const driver = await prisma.user.findFirst({
      where: { id: driverId, tenantId, role: 'DRIVER' },
      select: { id: true },
    });
    if (!driver) throw new BadRequestError('Driver bu tenant altında bulunamadı');

    const shifts = (req.body?.shifts ?? []) as Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;

    if (!Array.isArray(shifts)) {
      throw new BadRequestError('shifts alanı bir dizi olmalıdır');
    }

    for (const shift of shifts) {
      if (!Number.isInteger(shift.dayOfWeek) || shift.dayOfWeek < 0 || shift.dayOfWeek > 6) {
        throw new BadRequestError('dayOfWeek 0-6 aralığında olmalıdır');
      }
      if (!/^\d{2}:\d{2}$/.test(shift.startTime) || !/^\d{2}:\d{2}$/.test(shift.endTime)) {
        throw new BadRequestError('startTime/endTime HH:mm formatında olmalıdır');
      }
      if (shift.startTime >= shift.endTime) {
        throw new BadRequestError('startTime endTime değerinden küçük olmalıdır');
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.driverShift.deleteMany({ where: { userId: driverId } });
      if (shifts.length > 0) {
        await tx.driverShift.createMany({
          data: shifts.map((s) => ({
            userId: driverId,
            tenantId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }
    });

    const updated = await prisma.driverShift.findMany({
      where: { userId: driverId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return ok(res, updated);
  }

  private static detailsText(alertType: string, details: Record<string, unknown>): string {
    if (alertType === 'Hız Sınırı Aşımı' && typeof details.speed === 'number') {
      return `Hız: ${details.speed} km/s`;
    }
    if (alertType === 'Rölanti İhlali' && typeof details.idlingMinutes === 'number') {
      return `Rölanti: ${details.idlingMinutes} dk`;
    }
    if (alertType === 'Mesai Dışı Kullanım') {
      return 'Mesai takvimi dışında kullanım tespit edildi';
    }
    if (alertType === 'Sanal Çit İhlali' && typeof details.districtIds !== 'undefined') {
      return `Bölge dışı kullanım`; 
    }
    if (alertType === 'Cihaz Sinyali Kesildi' && typeof details.offlineMinutes === 'number') {
      return `Sinyal kesinti süresi: ${details.offlineMinutes} dk`;
    }

    if (typeof details.description === 'string') return details.description;
    return '-';
  }

  private static isAlertEnabledBySettings(
    alertType: string,
    settings: {
      enableIgnitionOn: boolean;
      enableSpeeding: boolean;
      enableIdling?: boolean;
      enableGeofence: boolean;
      enableGeofence_Master?: boolean;
      enableOffline: boolean;
      enablePowerCut: boolean;
      enableShiftControl: boolean;
    },
  ): boolean {
    if (alertType.includes('Hız Sınırı Aşımı')) return settings.enableSpeeding;
    if (alertType.includes('Rölanti')) return settings.enableIdling ?? settings.enableIgnitionOn;
    if (alertType.includes('Mesai Dışı')) return settings.enableShiftControl;
    if (alertType.includes('Sanal Çit')) return settings.enableGeofence_Master ?? settings.enableGeofence;
    if (alertType.includes('Cihaz Sinyali Kesildi')) return settings.enableOffline;
    if (alertType.includes('Cihaz Söküldü') || alertType.includes('Sabotaj') || alertType.includes('Güç Kesintisi')) {
      return settings.enablePowerCut;
    }
    return true;
  }
}
