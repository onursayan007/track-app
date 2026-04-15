import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { BadRequestError } from '../utils/errors';
import { created } from '../utils/response';
import { emitPassengerRequestReceived } from '../routes/socket.config';

function normalizePhone(raw: string): string {
  return String(raw || '').replace(/\D+/g, '').slice(-10);
}

export class PublicPassengerController {
  /** POST /api/v1/public/join-request */
  static async createJoinRequest(req: Request, res: Response) {
    const publicAccessId = String(req.body?.publicAccessId || '').trim();
    const name = String(req.body?.name || '').trim();
    const surname = String(req.body?.surname || '').trim();
    const phoneRaw = String(req.body?.phone || '').trim();
    const phone = normalizePhone(phoneRaw);

    if (!publicAccessId || publicAccessId.length < 10) {
      throw new BadRequestError('Invalid publicAccessId');
    }

    if (!name || !surname || phone.length < 10) {
      throw new BadRequestError('Name, surname and valid phone are required');
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { publicAccessId },
      select: {
        id: true,
        activeTrips: {
          where: { status: 'IN_PROGRESS' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            tenantId: true,
            driverId: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new BadRequestError('Vehicle not found');
    }

    const activeTrip = vehicle.activeTrips[0];
    if (!activeTrip) {
      throw new BadRequestError('No active trip found for this vehicle');
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const recentRejected = await prisma.passengerRequest.findFirst({
      where: {
        tripId: activeTrip.id,
        phone,
        status: 'REJECTED',
        updatedAt: { gte: tenMinutesAgo },
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    if (recentRejected) {
      const retryAt = new Date(recentRejected.updatedAt.getTime() + 10 * 60 * 1000);
      return res.status(429).json({
        success: false,
        message: 'Son isteğiniz reddedildi. 10 dakika sonra tekrar deneyin.',
        retryAt,
      });
    }

    const existingPending = await prisma.passengerRequest.findFirst({
      where: {
        tripId: activeTrip.id,
        phone,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'Halihazırda bekleyen bir talebiniz var.',
      });
    }

    const passengerName = `${name} ${surname}`.trim();
    const request = await prisma.passengerRequest.create({
      data: {
        tripId: activeTrip.id,
        passengerName,
        phone,
        status: 'PENDING',
      },
    });

    emitPassengerRequestReceived({
      tenantId: activeTrip.tenantId,
      driverId: activeTrip.driverId,
      requestId: request.id,
      tripId: activeTrip.id,
      passengerName: request.passengerName,
      phone: request.phone,
      createdAt: request.createdAt.toISOString(),
    });

    return created(res, {
      requestId: request.id,
      tripId: activeTrip.id,
      status: request.status,
    });
  }
}
