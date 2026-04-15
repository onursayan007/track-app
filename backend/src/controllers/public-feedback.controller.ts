import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { BadRequestError } from '../utils/errors';
import { created } from '../utils/response';

function isWithinShift(startTime: string, endTime: string, nowMinutes: number) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  if (startTotal <= endTotal) {
    return nowMinutes >= startTotal && nowMinutes <= endTotal;
  }

  return nowMinutes >= startTotal || nowMinutes <= endTotal;
}

export class PublicFeedbackController {
  static async createByQrToken(req: Request, res: Response) {
    const qrToken = req.params.qrToken as string;
    const { message } = req.body as { message?: string };

    if (!message || !message.trim()) {
      throw new BadRequestError('message zorunludur');
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { publicQrToken: qrToken },
      select: { id: true, tenantId: true, driverId: true },
    });

    if (!vehicle) {
      throw new BadRequestError('Geçersiz QR token');
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const activeAssignment = await prisma.vehicleAssignmentHistory.findFirst({
      where: {
        vehicleId: vehicle.id,
        assignedAt: { lte: now },
        OR: [{ unassignedAt: null }, { unassignedAt: { gt: now } }],
      },
      orderBy: { assignedAt: 'desc' },
      select: { driverId: true },
    });

    let resolvedDriverId = activeAssignment?.driverId || vehicle.driverId || null;

    if (resolvedDriverId) {
      const shift = await prisma.driverShift.findFirst({
        where: {
          tenantId: vehicle.tenantId,
          userId: resolvedDriverId,
          dayOfWeek,
        },
        select: { startTime: true, endTime: true },
      });

      if (shift && !isWithinShift(shift.startTime, shift.endTime, nowMinutes)) {
        resolvedDriverId = null;
      }
    }

    if (!resolvedDriverId) {
      const shiftBasedDriver = await prisma.driverShift.findFirst({
        where: {
          tenantId: vehicle.tenantId,
          dayOfWeek,
          user: {
            assignedVehicles: {
              some: { id: vehicle.id },
            },
          },
        },
        orderBy: { startTime: 'asc' },
        select: { userId: true, startTime: true, endTime: true },
      });

      if (shiftBasedDriver && isWithinShift(shiftBasedDriver.startTime, shiftBasedDriver.endTime, nowMinutes)) {
        resolvedDriverId = shiftBasedDriver.userId;
      }
    }

    if (!resolvedDriverId) {
      throw new BadRequestError('Aktif şoför çözümlenemedi');
    }

    const file = req.file as Express.Multer.File | undefined;
    const mediaUrl = file ? `/uploads/${file.filename}` : null;
    const mediaExpiresAt = file ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) : null;

    const feedback = await prisma.feedback.create({
      data: {
        tenantId: vehicle.tenantId,
        vehicleId: vehicle.id,
        driverId: resolvedDriverId,
        source: 'EXTERNAL_QR',
        message: message.trim(),
        mediaUrl,
        mediaExpiresAt,
        status: 'PENDING',
      },
    });

    return created(res, feedback);
  }
}
