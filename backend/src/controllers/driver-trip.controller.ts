import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { BadRequestError } from '../utils/errors';
import { created, ok } from '../utils/response';
import {
  closePublicTripRoom,
  emitPassengerRequestApproved,
  emitPassengerRequestRejected,
} from '../routes/socket.config';

export class DriverTripController {
  /** GET /driver/assigned-vehicles */
  static async assignedVehicles(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = (req as any).user.userId as string;

    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId,
        OR: [
          { driverId },
          {
            assignmentHistory: {
              some: {
                driverId,
                unassignedAt: null,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        plate: true,
        brand: true,
        model: true,
        routes: {
          where: { tenantId },
          select: { id: true, name: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 40,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok(res, vehicles);
  }

  /** POST /driver/active-trips/start */
  static async startTrip(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = (req as any).user.userId as string;

    const vehicleId = String(req.body?.vehicleId || '').trim();
    const routeId = req.body?.routeId ? String(req.body.routeId).trim() : null;
    const name = String(req.body?.name || '').trim();
    const isDirectionForward = req.body?.isDirectionForward !== false;

    if (!vehicleId) {
      throw new BadRequestError('vehicleId is required');
    }

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId } });
    if (!vehicle) {
      throw new BadRequestError('Vehicle not found for tenant');
    }

    const route = routeId
      ? await prisma.route.findFirst({ where: { id: routeId, tenantId } })
      : null;

    if (routeId && !route) {
      throw new BadRequestError('Route not found for tenant');
    }

    if (!name && !route?.name) {
      throw new BadRequestError('Trip name is required');
    }

    await prisma.activeTrip.updateMany({
      where: { tenantId, driverId, status: 'IN_PROGRESS' },
      data: { status: 'COMPLETED' },
    });

    const trip = await prisma.activeTrip.create({
      data: {
        tenantId,
        vehicleId,
        driverId,
        routeId: routeId || null,
        name: name || route?.name || 'Serbest Sürüş',
        isDirectionForward,
        status: 'IN_PROGRESS',
      },
      include: {
        route: {
          include: {
            stops: { orderBy: { orderIndex: 'asc' } },
          },
        },
        vehicle: { select: { id: true, plate: true } },
        requests: { orderBy: { createdAt: 'desc' } },
      },
    });

    return created(res, trip);
  }

  /** GET /driver/active-trips/current */
  static async currentTrip(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = (req as any).user.userId as string;

    const trip = await prisma.activeTrip.findFirst({
      where: {
        tenantId,
        driverId,
        status: 'IN_PROGRESS',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        route: {
          include: {
            stops: { orderBy: { orderIndex: 'asc' } },
          },
        },
        vehicle: { select: { id: true, plate: true } },
        requests: { orderBy: { createdAt: 'asc' } },
      },
    });

    return ok(res, trip);
  }

  /** PATCH /driver/active-trips/:id/complete */
  static async completeTrip(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = (req as any).user.userId as string;
    const tripId = req.params.id as string;

    const trip = await prisma.activeTrip.findFirst({
      where: { id: tripId, tenantId, driverId },
      select: { id: true },
    });

    if (!trip) {
      throw new BadRequestError('Active trip not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const completedTrip = await tx.activeTrip.update({
        where: { id: tripId },
        data: { status: 'COMPLETED' },
        include: {
          route: true,
          vehicle: { select: { id: true, plate: true } },
        },
      });

      await tx.passengerRequest.updateMany({
        where: {
          tripId,
          status: { not: 'EXPIRED' },
        },
        data: { status: 'EXPIRED' },
      });

      return completedTrip;
    });

    closePublicTripRoom(tripId);

    return ok(res, updated);
  }

  /** GET /driver/passenger-requests/pending */
  static async pendingPassengers(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = (req as any).user.userId as string;

    const trip = await prisma.activeTrip.findFirst({
      where: { tenantId, driverId, status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!trip) return ok(res, []);

    const requests = await prisma.passengerRequest.findMany({
      where: {
        tripId: trip.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    });

    return ok(res, requests);
  }

  /** GET /driver/passenger-requests/approved */
  static async approvedPassengers(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = (req as any).user.userId as string;

    const trip = await prisma.activeTrip.findFirst({
      where: { tenantId, driverId, status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!trip) return ok(res, []);

    const passengers = await prisma.passengerRequest.findMany({
      where: {
        tripId: trip.id,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'asc' },
    });

    return ok(res, passengers);
  }

  /** PATCH /driver/passenger-requests/:id/ride-status */
  static async updatePassengerRideStatus(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = (req as any).user.userId as string;
    const requestId = req.params.id as string;

    const rideStatus = String(req.body?.rideStatus || '').toUpperCase();
    if (!['BOARDED', 'NO_SHOW', 'UNKNOWN'].includes(rideStatus)) {
      throw new BadRequestError('Invalid rideStatus');
    }

    const record = await prisma.passengerRequest.findFirst({
      where: {
        id: requestId,
        trip: {
          tenantId,
          driverId,
        },
      },
      select: { id: true },
    });

    if (!record) {
      throw new BadRequestError('Passenger request not found in driver scope');
    }

    const updated = await prisma.passengerRequest.update({
      where: { id: requestId },
      data: { rideStatus: rideStatus as any },
    });

    return ok(res, updated);
  }

  /** PATCH /driver/passenger-requests/:id/decision */
  static async decidePassengerRequest(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const driverId = (req as any).user.userId as string;
    const requestId = req.params.id as string;
    const decision = String(req.body?.decision || '').toUpperCase();

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      throw new BadRequestError('decision must be APPROVED or REJECTED');
    }

    const request = await prisma.passengerRequest.findFirst({
      where: {
        id: requestId,
        status: 'PENDING',
        trip: {
          tenantId,
          driverId,
          status: 'IN_PROGRESS',
        },
      },
      include: {
        trip: {
          include: {
            route: {
              include: {
                stops: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new BadRequestError('Pending passenger request not found');
    }

    const updated = await prisma.passengerRequest.update({
      where: { id: requestId },
      data: {
        status: decision as 'APPROVED' | 'REJECTED',
      },
    });

    if (decision === 'APPROVED') {
      emitPassengerRequestApproved({
        requestId: updated.id,
        tripId: request.tripId,
        routeName: request.trip.route?.name || request.trip.name,
        stops: (request.trip.route?.stops || []).map((stop) => ({
          id: stop.id,
          name: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          orderIndex: stop.orderIndex,
        })),
      });
    } else {
      emitPassengerRequestRejected({
        requestId: updated.id,
        tripId: request.tripId,
        retryAfterSeconds: 10 * 60,
      });
    }

    return ok(res, updated);
  }
}
