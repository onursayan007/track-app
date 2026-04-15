// ════════════════════════════════════════════════════════════════════
// Tenant Service — SUPER_ADMIN-only operations
// ════════════════════════════════════════════════════════════════════

import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

export interface TenantInput {
  name: string;
  subscriptionPlan?: string;
  planId?: string | null;
  isActive?: boolean;
  // Billing / e-Fatura
  legalName?: string | null;
  taxId?: string | null;
  taxOffice?: string | null;
  billingAddress?: string | null;
  contactPhone?: string | null;
}

export class TenantService {
  /** List all tenants (platform-wide). */
  static async findAll(filters?: { search?: string; isActive?: boolean }) {
    const where: Prisma.TenantWhereInput = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return prisma.tenant.findMany({
      where,
      include: {
        plan: { select: { id: true, name: true, pricePerVehicle: true } },
        _count: { select: { users: true, vehicles: true, routes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get single tenant with aggregated counts. */
  static async findById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, name: true, pricePerVehicle: true } },
        _count: { select: { users: true, vehicles: true, routes: true } },
      },
    });
    if (!tenant) throw new NotFoundError('Tenant');
    return tenant;
  }

  /** Create a new tenant. */
  static async create(data: TenantInput) {
    if (!data.name) throw new BadRequestError('Tenant name is required');
    return prisma.tenant.create({ data });
  }

  /** Update a tenant. */
  static async update(id: string, data: Partial<TenantInput>) {
    const exists = await prisma.tenant.count({ where: { id } });
    if (exists === 0) throw new NotFoundError('Tenant');
    return prisma.tenant.update({ where: { id }, data });
  }

  /** Soft-deactivate a tenant. */
  static async deactivate(id: string) {
    const exists = await prisma.tenant.count({ where: { id } });
    if (exists === 0) throw new NotFoundError('Tenant');
    return prisma.tenant.update({ where: { id }, data: { isActive: false } });
  }

  /** Platform-wide statistics. */
  static async platformStats() {
    const [totalTenants, activeTenants, totalUsers, totalVehicles, totalRoutes] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.route.count(),
    ]);
    return { totalTenants, activeTenants, totalUsers, totalVehicles, totalRoutes };
  }
}
