import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';
import prisma from '../lib/prisma';
import { ok } from '../utils/response';
import { BadRequestError, ForbiddenError } from '../utils/errors';

export class GpsController {
  /** POST /api/v1/driver/gps/ping */
  static async ping(req: Request, res: Response) {
    const { lat, lng, speed, heading } = req.body;
    const { tenantId, userId, role } = (req as any).user;

    if (!lat || !lng) throw new BadRequestError('lat and lng are required');

    let vehicleId = req.body.vehicleId;

    if (role === 'DRIVER') {
      const activeRoute = await prisma.route.findFirst({
        where: { driverId: userId, tenantId, status: 'ACTIVE' },
        select: { vehicleId: true },
      });
      if (!activeRoute?.vehicleId) throw new ForbiddenError('No active route found for this driver');
      vehicleId = activeRoute.vehicleId;
    } else if (!vehicleId) {
      throw new BadRequestError('vehicleId is required for non-driver users');
    }

    const result = await LocationService.updateVehicleLocation(tenantId, vehicleId, {
      lat, lng, speed: speed || 0, heading: heading || 0,
    });

    return ok(res, result, { message: 'Location updated' });
  }
}