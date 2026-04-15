import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { BadRequestError } from '../utils/errors';
import { created, noContent, ok } from '../utils/response';

export class TenantRulesController {
  // ─── Geofence Definitions ─────────────────────────────────────
  static async listGeofences(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const geofences = await prisma.geofenceDefinition.findMany({
      where: { tenantId },
      include: {
        assignments: {
          where: { isActive: true },
          select: { id: true, vehicleId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, geofences);
  }

  static async createGeofence(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { name, centerLat, centerLng, radiusKm } = req.body as {
      name?: string;
      centerLat?: number;
      centerLng?: number;
      radiusKm?: number;
    };

    if (!name || centerLat === undefined || centerLng === undefined || radiusKm === undefined) {
      throw new BadRequestError('name, centerLat, centerLng, radiusKm zorunludur');
    }

    const geofence = await prisma.geofenceDefinition.create({
      data: {
        tenantId,
        name,
        centerLat,
        centerLng,
        radiusKm,
      },
    });

    return created(res, geofence);
  }

  static async updateGeofence(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const id = req.params.id as string;
    const { name, centerLat, centerLng, radiusKm } = req.body as {
      name?: string;
      centerLat?: number;
      centerLng?: number;
      radiusKm?: number;
    };

    const exists = await prisma.geofenceDefinition.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!exists) throw new BadRequestError('Geofence bulunamadı');

    const geofence = await prisma.geofenceDefinition.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(centerLat !== undefined && { centerLat }),
        ...(centerLng !== undefined && { centerLng }),
        ...(radiusKm !== undefined && { radiusKm }),
      },
    });

    return ok(res, geofence);
  }

  static async deleteGeofence(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const id = req.params.id as string;

    const exists = await prisma.geofenceDefinition.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!exists) throw new BadRequestError('Geofence bulunamadı');

    await prisma.geofenceDefinition.delete({ where: { id } });
    return noContent(res);
  }

  // ─── Geofence Assignments ─────────────────────────────────────
  static async getVehicleGeofenceAssignments(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const vehicleId = req.params.vehicleId as string;

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId }, select: { id: true } });
    if (!vehicle) throw new BadRequestError('Araç bulunamadı');

    const assignments = await prisma.geofenceAssignment.findMany({
      where: {
        vehicleId,
        geofenceDefinition: { tenantId },
      },
      include: {
        geofenceDefinition: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok(res, assignments);
  }

  static async replaceVehicleGeofenceAssignments(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const vehicleId = req.params.vehicleId as string;
    const geofenceDefinitionIds = (req.body?.geofenceDefinitionIds ?? []) as string[];

    if (!Array.isArray(geofenceDefinitionIds)) {
      throw new BadRequestError('geofenceDefinitionIds bir dizi olmalıdır');
    }

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId }, select: { id: true } });
    if (!vehicle) throw new BadRequestError('Araç bulunamadı');

    const geofences = await prisma.geofenceDefinition.findMany({
      where: { tenantId, id: { in: geofenceDefinitionIds } },
      select: { id: true },
    });

    if (geofences.length !== geofenceDefinitionIds.length) {
      throw new BadRequestError('Bazı geofence kayıtları tenant altında bulunamadı');
    }

    await prisma.$transaction(async (tx) => {
      await tx.geofenceAssignment.updateMany({
        where: { vehicleId },
        data: { isActive: false },
      });

      for (const geofenceId of geofenceDefinitionIds) {
        await tx.geofenceAssignment.upsert({
          where: { geofenceDefinitionId_vehicleId: { geofenceDefinitionId: geofenceId, vehicleId } },
          create: { geofenceDefinitionId: geofenceId, vehicleId, isActive: true },
          update: { isActive: true },
        });
      }
    });

    const assignments = await prisma.geofenceAssignment.findMany({
      where: {
        vehicleId,
        isActive: true,
        geofenceDefinition: { tenantId },
      },
      include: { geofenceDefinition: true },
    });

    return ok(res, assignments);
  }

  // ─── Driver Shift CRUD (/tenant/shifts) ───────────────────────
  static async listShifts(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { userId } = req.query as { userId?: string };

    const shifts = await prisma.driverShift.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: [{ userId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return ok(res, shifts);
  }

  static async createShift(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { userId, dayOfWeek, startTime, endTime } = req.body as {
      userId?: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
    };

    if (!userId || dayOfWeek === undefined || !startTime || !endTime) {
      throw new BadRequestError('userId, dayOfWeek, startTime, endTime zorunludur');
    }

    const driver = await prisma.user.findFirst({
      where: { id: userId, tenantId, role: 'DRIVER' },
      select: { id: true },
    });
    if (!driver) throw new BadRequestError('Sürücü bulunamadı');

    const shift = await prisma.driverShift.create({
      data: { tenantId, userId, dayOfWeek, startTime, endTime },
    });

    return created(res, shift);
  }

  static async updateShift(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const id = req.params.id as string;
    const { dayOfWeek, startTime, endTime } = req.body as {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
    };

    const exists = await prisma.driverShift.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!exists) throw new BadRequestError('Shift bulunamadı');

    const shift = await prisma.driverShift.update({
      where: { id },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
      },
    });

    return ok(res, shift);
  }

  static async deleteShift(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const id = req.params.id as string;

    const exists = await prisma.driverShift.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!exists) throw new BadRequestError('Shift bulunamadı');

    await prisma.driverShift.delete({ where: { id } });
    return noContent(res);
  }
}
