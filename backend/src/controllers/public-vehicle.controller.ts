import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { ok } from '../utils/response';
import { BadRequestError } from '../utils/errors';

function normalizeLocationFromAlert(details: unknown): { lat: number; lng: number } | null {
  if (!details || typeof details !== 'object') return null;
  const row = details as Record<string, unknown>;

  const latCandidates = [row.lat, row.latitude, row.gpsLat, row.gpsLatitude];
  const lngCandidates = [row.lng, row.longitude, row.gpsLng, row.gpsLongitude];

  const lat = latCandidates.find((v) => typeof v === 'number') as number | undefined;
  const lng = lngCandidates.find((v) => typeof v === 'number') as number | undefined;

  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}

export class PublicVehicleController {
  /** GET /api/v1/public/vehicle/:publicAccessId */
  static async getVehiclePublicState(req: Request, res: Response) {
    const publicAccessId = req.params.publicAccessId as string;

    if (!publicAccessId || publicAccessId.length < 10) {
      throw new BadRequestError('Invalid publicAccessId');
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { publicAccessId },
      select: {
        id: true,
        plate: true,
        tenantId: true,
        activeTrips: {
          where: { status: 'IN_PROGRESS' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            name: true,
            status: true,
            isDirectionForward: true,
            createdAt: true,
            driver: {
              select: {
                id: true,
                name: true,
              },
            },
            route: {
              select: {
                id: true,
                name: true,
                stops: {
                  orderBy: { orderIndex: 'asc' },
                  select: {
                    id: true,
                    name: true,
                    latitude: true,
                    longitude: true,
                    orderIndex: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new BadRequestError('Vehicle not found for public access id');
    }

    const activeTrip = vehicle.activeTrips[0] || null;

    const latestAlert = await prisma.vehicleAlert.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: 'desc' },
      select: {
        timestamp: true,
        details: true,
      },
    });

    const locationFromAlert = normalizeLocationFromAlert(latestAlert?.details);
    const fallbackStop = activeTrip?.route?.stops?.[0];

    const liveLocation = locationFromAlert
      ? {
          ...locationFromAlert,
          source: 'vehicle_alert',
          updatedAt: latestAlert?.timestamp || new Date(),
        }
      : fallbackStop
        ? {
            lat: fallbackStop.latitude,
            lng: fallbackStop.longitude,
            source: 'route_stop_fallback',
            updatedAt: new Date(),
          }
        : null;

    return ok(res, {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
      },
      activeTrip,
      liveLocation,
    });
  }
}
