// ════════════════════════════════════════════════════════════════════
// Billing Service — Invoice generation, prorata calc, suspension
// ════════════════════════════════════════════════════════════════════

import prisma from '../lib/prisma';
import { InvoiceType, InvoiceStatus, TenantStatus, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

// ─── Invoice Number Generator ────────────────────────────────────
async function generateInvoiceNo(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}`;

  const last = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
  });

  let seq = 1;
  if (last) {
    const parts = last.invoiceNo.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

// ─── Helper: days in a given month ──────────────────────────────
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Helper: remaining days in month (including today) ──────────
function remainingDaysInMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const totalDays = daysInMonth(year, month);
  const currentDay = date.getDate();
  return totalDays - currentDay + 1; // +1 to include today
}

// ─── Prorata Calculation ────────────────────────────────────────
export interface ProrataResult {
  proratedAmount: number;
  totalDays: number;
  remainingDays: number;
  pricePerVehicle: number;
  description: string;
}

export class BillingService {
  /**
   * Calculate prorated cost for a vehicle added mid-month.
   * Formula: (pricePerVehicle / totalDaysInMonth) * remainingDaysInMonth
   */
  static calculateProrata(pricePerVehicle: number, plate: string, date: Date = new Date()): ProrataResult {
    const year = date.getFullYear();
    const month = date.getMonth();
    const totalDays = daysInMonth(year, month);
    const remaining = remainingDaysInMonth(date);
    const proratedAmount = Math.round(((pricePerVehicle / totalDays) * remaining) * 100) / 100;

    return {
      proratedAmount,
      totalDays,
      remainingDays: remaining,
      pricePerVehicle,
      description: `Ay içi yeni araç ekleme (Kıstelyevm): ${plate}`,
    };
  }

  /**
   * Generate a PRORATA invoice when a new vehicle is added mid-month.
   * Called after vehicle creation. Returns null if tenant has no plan assigned.
   */
  static async generateProrataInvoice(tenantId: string, plate: string): Promise<any> {
    // Get the tenant with plan info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });
    if (!tenant) throw new NotFoundError('Tenant');
    if (!tenant.plan) return null; // No subscription plan assigned — skip prorata

    const pricePerVehicle = tenant.plan.pricePerVehicle;
    if (pricePerVehicle <= 0) return null;

    const now = new Date();
    const prorata = BillingService.calculateProrata(pricePerVehicle, plate, now);

    if (prorata.proratedAmount <= 0) return null;

    // Generate due date: last day of current month
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    dueDate.setHours(23, 59, 59, 999);

    const invoiceNo = await generateInvoiceNo();

    return prisma.invoice.create({
      data: {
        invoiceNo,
        tenantId,
        amount: prorata.proratedAmount,
        type: 'PRORATA',
        status: 'PENDING',
        description: prorata.description,
        issueDate: now,
        dueDate,
      },
    });
  }

  /**
   * Create a manual invoice (ONE_TIME_SETUP, HARDWARE, etc.)
   */
  static async createManualInvoice(data: {
    tenantId: string;
    amount: number;
    type: InvoiceType;
    description: string;
    dueDate: Date;
  }) {
    // Verify tenant exists
    const tenant = await prisma.tenant.count({ where: { id: data.tenantId } });
    if (tenant === 0) throw new NotFoundError('Tenant');
    if (data.amount <= 0) throw new BadRequestError('Amount must be positive');

    const invoiceNo = await generateInvoiceNo();
    return prisma.invoice.create({
      data: {
        invoiceNo,
        tenantId: data.tenantId,
        amount: data.amount,
        type: data.type,
        status: 'PENDING',
        description: data.description,
        issueDate: new Date(),
        dueDate: data.dueDate,
      },
    });
  }

  /**
   * Mark an invoice as paid.
   */
  static async markAsPaid(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundError('Invoice');
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  /**
   * List all invoices, optionally filtered by tenant, status, type.
   */
  static async findAll(filters?: {
    tenantId?: string;
    status?: InvoiceStatus;
    type?: InvoiceType;
    search?: string;
  }) {
    const where: Prisma.InvoiceWhereInput = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.search) {
      where.OR = [
        { invoiceNo: { contains: filters.search, mode: 'insensitive' } },
        { tenant: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    return prisma.invoice.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, legalName: true, taxId: true, taxOffice: true, billingAddress: true, contactPhone: true } },
        client: { select: { id: true, name: true, taxNumber: true, taxOffice: true, invoiceAddress: true, contactEmail: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single invoice by ID.
   */
  static async findById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, legalName: true, taxId: true, taxOffice: true, billingAddress: true, contactPhone: true } },
        client: { select: { id: true, name: true, taxNumber: true, taxOffice: true, invoiceAddress: true, contactEmail: true } },
      },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    return invoice;
  }

  /**
   * 15-Day Grace Period Auto-Suspension Engine.
   * Finds PENDING invoices where dueDate + 15 days < now.
   * Suspends all matching tenants.
   * Returns number of tenants suspended.
   */
  static async runGracePeriodCheck(): Promise<{ suspendedCount: number; suspendedTenantIds: string[] }> {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 15);

    // Find distinct tenants with overdue invoices past 15-day grace period
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: cutoff },
        tenantId: { not: null },
      },
      select: { tenantId: true },
      distinct: ['tenantId'],
    });

    const tenantIds = overdueInvoices.map((inv) => inv.tenantId).filter((id): id is string => !!id);

    if (tenantIds.length === 0) {
      return { suspendedCount: 0, suspendedTenantIds: [] };
    }

    // First update invoices to OVERDUE status
    await prisma.invoice.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: cutoff },
      },
      data: { status: 'OVERDUE' },
    });

    // Suspend tenants
    await prisma.tenant.updateMany({
      where: {
        id: { in: tenantIds },
        status: 'ACTIVE',
      },
      data: { status: 'SUSPENDED' },
    });

    console.log(`[BillingCron] Suspended ${tenantIds.length} tenant(s): ${tenantIds.join(', ')}`);
    return { suspendedCount: tenantIds.length, suspendedTenantIds: tenantIds };
  }

  /**
   * Platform-level billing stats for SuperAdmin dashboard.
   */
  static async billingStats() {
    // MRR: sum of (active vehicle count * plan pricePerVehicle) for each active tenant with a plan
    const tenantsWithPlans = await prisma.tenant.findMany({
      where: { status: 'ACTIVE', planId: { not: null } },
      include: {
        plan: true,
        _count: { select: { vehicles: true } },
      },
    });

    const mrr = tenantsWithPlans.reduce((sum, t) => {
      if (t.plan) return sum + t._count.vehicles * t.plan.pricePerVehicle;
      return sum;
    }, 0);

    const [pendingTotal, overdueTotal, paidThisMonth, activeTenants] = await Promise.all([
      prisma.invoice.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { status: 'OVERDUE' }, _sum: { amount: true } }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
      prisma.tenant.count({ where: { status: 'ACTIVE', planId: { not: null } } }),
    ]);

    // Per-tenant breakdown: name, plan, vehicleCount, calculatedAmount
    const tenantBreakdown = tenantsWithPlans.map((t) => ({
      tenantId: t.id,
      tenantName: t.name,
      planName: t.plan?.name ?? '—',
      pricePerVehicle: t.plan?.pricePerVehicle ?? 0,
      vehicleCount: t._count.vehicles,
      currentInvoiceAmount: Math.round((t._count.vehicles * (t.plan?.pricePerVehicle ?? 0)) * 100) / 100,
    }));

    return {
      mrr: Math.round(mrr * 100) / 100,
      pendingAmount: pendingTotal._sum.amount ?? 0,
      overdueAmount: overdueTotal._sum.amount ?? 0,
      paidThisMonth: paidThisMonth._sum.amount ?? 0,
      activeLicensedTenants: activeTenants,
      tenantBreakdown,
    };
  }

  /**
   * Generate monthly RECURRING invoices for all active tenants with a plan.
   * Creates one invoice per tenant: amount = vehicleCount * pricePerVehicle.
   * Skips tenants that already have a RECURRING invoice for the current month.
   */
  static async generateMonthlyInvoices(): Promise<{ generatedCount: number; skippedCount: number }> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const tenantsWithPlans = await prisma.tenant.findMany({
      where: { status: 'ACTIVE', planId: { not: null }, isActive: true },
      include: {
        plan: true,
        _count: { select: { vehicles: true } },
      },
    });

    let generatedCount = 0;
    let skippedCount = 0;

    for (const tenant of tenantsWithPlans) {
      if (!tenant.plan || tenant._count.vehicles === 0) {
        skippedCount++;
        continue;
      }

      // Check if RECURRING invoice already exists for this month
      const existing = await prisma.invoice.findFirst({
        where: {
          tenantId: tenant.id,
          type: 'RECURRING',
          issueDate: { gte: monthStart, lte: monthEnd },
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const amount = Math.round(tenant._count.vehicles * tenant.plan.pricePerVehicle * 100) / 100;
      if (amount <= 0) {
        skippedCount++;
        continue;
      }

      const invoiceNo = await generateInvoiceNo();
      const dueDate = new Date(year, month + 1, 0); // Last day of current month
      dueDate.setHours(23, 59, 59, 999);

      const monthName = now.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

      await prisma.invoice.create({
        data: {
          invoiceNo,
          tenantId: tenant.id,
          amount,
          type: 'RECURRING',
          status: 'PENDING',
          description: `${monthName} aylık abonelik — ${tenant._count.vehicles} araç × ₺${tenant.plan.pricePerVehicle}`,
          issueDate: now,
          dueDate,
        },
      });

      generatedCount++;
    }

    return { generatedCount, skippedCount };
  }
}
