import prisma from '../lib/prisma';
import { RouteStatus, RouteType, RouteSource, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export interface RouteStopInput {
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteInput {
  name: string;
  type?: RouteType;
  source?: RouteSource;
  monthlyRevenue?: number;
  clientId?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  stops?: RouteStopInput[];
}

/**
 * Route CRUD — tenant-scoped, role-aware.
 */
export class RouteService {
  private static async ensureClientBelongsToTenant(tenantId: string, clientId?: string | null) {
    if (!clientId) return;
    const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) throw new BadRequestError('Invalid clientId for tenant scope');
  }

  /** List routes. Drivers see only their own assignments. */
  static async findAll(tenantId: string, userId: string, role: string, filters?: { status?: RouteStatus; type?: RouteType }) {
    const where: Prisma.RouteWhereInput = { tenantId };
    if (role === 'DRIVER') where.driverId = userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;

    return prisma.route.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, taxNumber: true } },
        vehicle: true,
        driver: { select: { id: true, name: true, email: true } },
        stops: { orderBy: { orderIndex: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get a single route by ID (tenant-scoped). */
  static async findById(tenantId: string, id: string) {
    const route = await prisma.route.findFirst({
      where: { id, tenantId },
      include: {
        client: { select: { id: true, name: true, taxNumber: true } },
        vehicle: true,
        driver: { select: { id: true, name: true, email: true, phone: true } },
        stops: { orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!route) throw new NotFoundError('Route');
    return route;
  }

  /** Create a route with nested stops (single transaction). */
  static async create(tenantId: string, data: RouteInput) {
    if (!data.name) throw new BadRequestError('Route name is required');
    await RouteService.ensureClientBelongsToTenant(tenantId, data.clientId ?? null);
    const { stops, ...routeData } = data;

    return prisma.$transaction(async (tx) => {
      const route = await tx.route.create({
        data: {
          ...routeData,
          tenantId,
          stops: stops
            ? {
                create: stops.map((s, i) => ({
                  name: s.name,
                  latitude: s.latitude,
                  longitude: s.longitude,
                  orderIndex: i + 1,
                })),
              }
            : undefined,
        },
        include: { stops: { orderBy: { orderIndex: 'asc' } } },
      });

      if ((route.monthlyRevenue || 0) > 0) {
        await tx.financialTransaction.create({
          data: {
            tenantId,
            type: 'INCOME',
            category: 'SÖZLEŞME_GELİRİ',
            amount: route.monthlyRevenue,
            date: new Date(),
            description: `${route.name} - Aylık Sözleşme Geliri`,
            relatedRecordId: route.id,
          },
        });
      }

      return route;
    });
  }

  /** Update a route's fields (tenant-scoped). */
  static async update(tenantId: string, id: string, data: Partial<Pick<RouteInput, 'name' | 'type' | 'monthlyRevenue' | 'clientId' | 'vehicleId' | 'driverId'>>) {
    const exists = await prisma.route.count({ where: { id, tenantId } });
    if (exists === 0) throw new NotFoundError('Route');
    if (data.clientId !== undefined) {
      await RouteService.ensureClientBelongsToTenant(tenantId, data.clientId);
    }

    return prisma.$transaction(async (tx) => {
      const route = await tx.route.update({
        where: { id },
        data,
        include: { stops: { orderBy: { orderIndex: 'asc' } } },
      });

      if (data.monthlyRevenue !== undefined && Number(data.monthlyRevenue) > 0) {
        await tx.financialTransaction.create({
          data: {
            tenantId,
            type: 'INCOME',
            category: 'SÖZLEŞME_GELİRİ',
            amount: Number(data.monthlyRevenue),
            date: new Date(),
            description: `${route.name} - Aylık Sözleşme Geliri`,
            relatedRecordId: route.id,
          },
        });
      }

      return route;
    });
  }

  /** Replace all stops on a route (delete + recreate in a tx). */
  static async replaceStops(tenantId: string, routeId: string, stops: RouteStopInput[]) {
    const exists = await prisma.route.count({ where: { id: routeId, tenantId } });
    if (exists === 0) throw new NotFoundError('Route');

    return prisma.$transaction(async (tx) => {
      await tx.routeStop.deleteMany({ where: { routeId } });
      await tx.routeStop.createMany({
        data: stops.map((s, i) => ({
          routeId,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          orderIndex: i + 1,
        })),
      });
      return tx.route.findUnique({
        where: { id: routeId },
        include: { stops: { orderBy: { orderIndex: 'asc' } } },
      });
    });
  }

  /** Update route status with role-based guard. */
  static async updateStatus(tenantId: string, id: string, status: RouteStatus, userId: string, role: string) {
    const where: Prisma.RouteWhereInput = { id, tenantId };
    if (role === 'DRIVER') where.driverId = userId;

    const route = await prisma.route.findFirst({ where });
    if (!route) throw new NotFoundError('Route');

    return prisma.route.update({ where: { id }, data: { status } });
  }

  /** Delete a route (tenant-scoped, cascades stops). */
  static async delete(tenantId: string, id: string) {
    const exists = await prisma.route.count({ where: { id, tenantId } });
    if (exists === 0) throw new NotFoundError('Route');
    return prisma.route.delete({ where: { id } });
  }

  /** Dashboard stats. */
  static async countByTenant(tenantId: string) {
    const [total, draft, active, completed, cancelled] = await Promise.all([
      prisma.route.count({ where: { tenantId } }),
      prisma.route.count({ where: { tenantId, status: 'DRAFT' } }),
      prisma.route.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.route.count({ where: { tenantId, status: 'COMPLETED' } }),
      prisma.route.count({ where: { tenantId, status: 'CANCELLED' } }),
    ]);
    return { total, draft, active, completed, cancelled };
  }
}