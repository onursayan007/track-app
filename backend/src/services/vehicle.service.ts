import prisma from '../lib/prisma';
import { Prisma, VehicleStatus, HardwareType } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { BillingService } from './billing.service';

/** Input shape for creating / updating a vehicle */
export interface VehicleInput {
  plate: string;
  vin: string;
  clientId?: string | null;
  hardwareType?: HardwareType;
  deviceId?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: number;
  status?: VehicleStatus;
  vehicleModelId?: string | null;
  driverId?: string | null;
  publicAccessId?: string;
  qrDownloadUrl?: string | null;
  m2mNumber?: string | null;
  m2mIccid?: string | null;
  m2mOperator?: string | null;
  m2mStatus?: string | null;
  m2mDataQuotaMB?: number | null;
  m2mUsedDataMB?: number | null;
}

/** Input shape for updating M2M SIM fields only */
export interface M2mUpdateInput {
  m2mNumber?: string | null;
  m2mIccid?: string | null;
  m2mOperator?: string | null;
  m2mStatus?: string | null;
  m2mDataQuotaMB?: number | null;
  m2mUsedDataMB?: number | null;
}

/**
 * Vehicle CRUD — every query is scoped to the caller’s tenantId.
 * SUPER_ADMIN may pass tenantId explicitly; TENANT_ADMIN is locked to their own.
 */
export class VehicleService {
  /** List all vehicles for a tenant. */
  static async findAll(tenantId: string, filters?: { status?: VehicleStatus; search?: string }) {
    const where: Prisma.VehicleWhereInput = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { plate: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return prisma.vehicle.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        vehicleModel: true,
        assignedDriver: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get a single vehicle by ID (tenant-scoped). */
  static async findById(tenantId: string, id: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: {
        tenant: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        vehicleModel: true,
        assignedDriver: { select: { id: true, name: true, phone: true, email: true } },
        routes: { take: 10, orderBy: { createdAt: 'desc' }, include: { stops: { orderBy: { orderIndex: 'asc' } } } },
      },
    });
    if (!vehicle) throw new NotFoundError('Vehicle');
    return vehicle;
  }

  /** Create a new vehicle under the given tenant. Also generates a prorata invoice if applicable. */
  static async create(tenantId: string, data: VehicleInput) {
    if (!data.plate || !data.vin) throw new BadRequestError('plate and vin are required');

    if (data.clientId) {
      const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId } });
      if (!client) throw new BadRequestError('Invalid clientId for tenant scope');
    }

    if (data.driverId) {
      const driver = await prisma.user.findFirst({ where: { id: data.driverId, tenantId, role: 'DRIVER' } });
      if (!driver) throw new BadRequestError('Driver not found in this tenant');
    }

    const vehicle = await prisma.vehicle.create({
      data: { ...data, tenantId },
    });

    // Fire-and-forget prorata invoice generation (non-blocking)
    BillingService.generateProrataInvoice(tenantId, data.plate).catch((err) => {
      console.error('[Prorata] Failed to generate prorata invoice:', (err as Error).message);
    });

    return vehicle;
  }

  /** Update a vehicle (verifies tenant ownership). */
  static async update(tenantId: string, id: string, data: Partial<VehicleInput>) {
    const exists = await prisma.vehicle.count({ where: { id, tenantId } });
    if (exists === 0) throw new NotFoundError('Vehicle');

    if (data.clientId) {
      const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId } });
      if (!client) throw new BadRequestError('Invalid clientId for tenant scope');
    }

    if (data.driverId) {
      const driver = await prisma.user.findFirst({ where: { id: data.driverId, tenantId, role: 'DRIVER' } });
      if (!driver) throw new BadRequestError('Driver not found in this tenant');
    }

    return prisma.vehicle.update({ where: { id }, data });
  }

  /** Hard-delete a vehicle (verifies tenant ownership). */
  static async delete(tenantId: string, id: string) {
    const exists = await prisma.vehicle.count({ where: { id, tenantId } });
    if (exists === 0) throw new NotFoundError('Vehicle');
    return prisma.vehicle.delete({ where: { id } });
  }

  /** Update only M2M SIM card fields for a vehicle. */
  static async updateM2m(vehicleId: string, data: M2mUpdateInput) {
    const exists = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!exists) throw new NotFoundError('Vehicle');
    return prisma.vehicle.update({
      where: { id: vehicleId },
      data,
      include: {
        tenant: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        vehicleModel: true,
        assignedDriver: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
  }

  /** List all vehicles that have an M2M SIM line configured. */
  static async findAllWithM2m() {
    return prisma.vehicle.findMany({
      where: { m2mNumber: { not: null } },
      include: {
        tenant: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        vehicleModel: true,
        assignedDriver: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Count vehicles per tenant (for dashboard stats). */
  static async countByTenant(tenantId: string) {
    const [total, active, maintenance, inactive] = await Promise.all([
      prisma.vehicle.count({ where: { tenantId } }),
      prisma.vehicle.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.vehicle.count({ where: { tenantId, status: 'MAINTENANCE' } }),
      prisma.vehicle.count({ where: { tenantId, status: 'INACTIVE' } }),
    ]);
    return { total, active, maintenance, inactive };
  }

  /**
   * Assign or unassign a driver to/from a vehicle.
   * - If driverId is provided: assigns driver, closes any open history for the vehicle, opens new history row.
   * - If driverId is null: unassigns, closes the open history row.
   */
  static async assignDriver(tenantId: string, vehicleId: string, driverId: string | null, clientId?: string | null) {
    // Verify vehicle belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId } });
    if (!vehicle) throw new NotFoundError('Vehicle');

    // If assigning a driver, verify driver belongs to same tenant and is a DRIVER
    if (driverId) {
      const driver = await prisma.user.findFirst({ where: { id: driverId, tenantId, role: 'DRIVER' } });
      if (!driver) throw new BadRequestError('Driver not found in this tenant');
    }

    if (clientId) {
      const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
      if (!client) throw new BadRequestError('Invalid clientId for tenant scope');
    }

    // Close any open assignment history for this vehicle
    await prisma.vehicleAssignmentHistory.updateMany({
      where: { vehicleId, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });

    // If assigning new driver, also close that driver's open assignments on OTHER vehicles
    if (driverId) {
      await prisma.vehicleAssignmentHistory.updateMany({
        where: { driverId, unassignedAt: null },
        data: { unassignedAt: new Date() },
      });

      // Unassign this driver from any other vehicle
      await prisma.vehicle.updateMany({
        where: { driverId, tenantId, NOT: { id: vehicleId } },
        data: { driverId: null },
      });

      // Create new assignment history
      await prisma.vehicleAssignmentHistory.create({
        data: { vehicleId, driverId },
      });
    }

    // Update the vehicle
    return prisma.vehicle.update({
      where: { id: vehicleId },
      data: { driverId, ...(clientId !== undefined ? { clientId: clientId || null } : {}) },
      include: {
        tenant: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        vehicleModel: true,
        assignedDriver: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
  }
}