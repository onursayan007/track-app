// ════════════════════════════════════════════════════════════════════
// SubscriptionPlan Service — CRUD for plan catalog
// ════════════════════════════════════════════════════════════════════

import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

export interface PlanInput {
  name: string;
  pricePerVehicle: number;
  minVehicles?: number;
  maxVehicles?: number;
  isActive?: boolean;
}

export class PlanService {
  /** List all plans. */
  static async findAll(onlyActive = false) {
    const where: Prisma.SubscriptionPlanWhereInput = {};
    if (onlyActive) where.isActive = true;
    return prisma.subscriptionPlan.findMany({
      where,
      include: { _count: { select: { tenants: true } } },
      orderBy: { pricePerVehicle: 'asc' },
    });
  }

  /** Get a single plan. */
  static async findById(id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { tenants: true } } },
    });
    if (!plan) throw new NotFoundError('SubscriptionPlan');
    return plan;
  }

  /** Create a plan. */
  static async create(data: PlanInput) {
    if (!data.name) throw new BadRequestError('Plan name is required');
    if (data.pricePerVehicle == null || data.pricePerVehicle < 0) {
      throw new BadRequestError('pricePerVehicle must be >= 0');
    }
    return prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        pricePerVehicle: data.pricePerVehicle,
        minVehicles: data.minVehicles ?? 1,
        maxVehicles: data.maxVehicles ?? 9999,
        isActive: data.isActive ?? true,
      },
    });
  }

  /** Update a plan. */
  static async update(id: string, data: Partial<PlanInput>) {
    const exists = await prisma.subscriptionPlan.count({ where: { id } });
    if (exists === 0) throw new NotFoundError('SubscriptionPlan');
    return prisma.subscriptionPlan.update({ where: { id }, data });
  }

  /** Soft-delete / toggle a plan. */
  static async toggleActive(id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundError('SubscriptionPlan');
    return prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });
  }

  /** Hard-delete a plan (only if no tenants assigned). */
  static async remove(id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { tenants: true } } },
    });
    if (!plan) throw new NotFoundError('SubscriptionPlan');
    if (plan._count.tenants > 0) {
      throw new BadRequestError(`Bu plan ${plan._count.tenants} firmaya atanmış. Silmeden önce firmaların planını değiştirin.`);
    }
    return prisma.subscriptionPlan.delete({ where: { id } });
  }
}
