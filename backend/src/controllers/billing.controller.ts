// ════════════════════════════════════════════════════════════════════
// Billing Controller — SuperAdmin invoice & plan management
// ════════════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { BillingService } from '../services/billing.service';
import { PlanService } from '../services/plan.service';
import { dailyBillingCheck } from '../cron/billing.cron';
import { ok, created } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { InvoiceType, InvoiceStatus } from '@prisma/client';

export class BillingController {
  // ═══════════════════════════════════════════════════════════════
  // INVOICES
  // ═══════════════════════════════════════════════════════════════

  /** GET /superadmin/invoices */
  static async listInvoices(req: Request, res: Response) {
    const { tenantId, status, type, search } = req.query as {
      tenantId?: string;
      status?: InvoiceStatus;
      type?: InvoiceType;
      search?: string;
    };
    const invoices = await BillingService.findAll({ tenantId, status, type, search });
    return ok(res, invoices);
  }

  /** GET /superadmin/invoices/:id */
  static async getInvoice(req: Request, res: Response) {
    const invoice = await BillingService.findById(req.params.id as string);
    return ok(res, invoice);
  }

  /** POST /superadmin/invoices — Create manual invoice */
  static async createInvoice(req: Request, res: Response) {
    const { tenantId, amount, type, description, dueDate } = req.body;
    if (!tenantId || !amount || !type || !description || !dueDate) {
      throw new BadRequestError('tenantId, amount, type, description, dueDate required');
    }
    const validTypes: InvoiceType[] = ['RECURRING', 'PRORATA', 'ONE_TIME_SETUP', 'HARDWARE'];
    if (!validTypes.includes(type)) {
      throw new BadRequestError(`type must be one of: ${validTypes.join(', ')}`);
    }
    const invoice = await BillingService.createManualInvoice({
      tenantId,
      amount: parseFloat(amount),
      type,
      description,
      dueDate: new Date(dueDate),
    });
    return created(res, invoice);
  }

  /** PATCH /superadmin/invoices/:id/pay — Mark as paid */
  static async markPaid(req: Request, res: Response) {
    const invoice = await BillingService.markAsPaid(req.params.id as string);
    return ok(res, invoice);
  }

  /** GET /superadmin/billing/stats */
  static async billingStats(_req: Request, res: Response) {
    const stats = await BillingService.billingStats();
    return ok(res, stats);
  }

  /** POST /superadmin/billing/run-suspension-check — Manual trigger */
  static async runSuspensionCheck(_req: Request, res: Response) {
    const result = await dailyBillingCheck();
    return ok(res, { message: 'Grace period check completed', ...(result as any) });
  }

  /** POST /superadmin/billing/generate-invoices — Manual monthly invoice trigger */
  static async generateMonthlyInvoices(_req: Request, res: Response) {
    const result = await BillingService.generateMonthlyInvoices();
    return ok(res, { message: 'Aylık faturalar oluşturuldu', ...result });
  }

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION PLANS
  // ═══════════════════════════════════════════════════════════════

  /** GET /superadmin/plans */
  static async listPlans(_req: Request, res: Response) {
    const plans = await PlanService.findAll();
    return ok(res, plans);
  }

  /** GET /superadmin/plans/:id */
  static async getPlan(req: Request, res: Response) {
    const plan = await PlanService.findById(req.params.id as string);
    return ok(res, plan);
  }

  /** POST /superadmin/plans */
  static async createPlan(req: Request, res: Response) {
    const plan = await PlanService.create(req.body);
    return created(res, plan);
  }

  /** PUT /superadmin/plans/:id */
  static async updatePlan(req: Request, res: Response) {
    const plan = await PlanService.update(req.params.id as string, req.body);
    return ok(res, plan);
  }

  /** PATCH /superadmin/plans/:id/toggle */
  static async togglePlan(req: Request, res: Response) {
    const plan = await PlanService.toggleActive(req.params.id as string);
    return ok(res, plan);
  }

  /** DELETE /superadmin/plans/:id */
  static async deletePlan(req: Request, res: Response) {
    await PlanService.remove(req.params.id as string);
    return ok(res, { message: 'Plan silindi' });
  }
}
