import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { BadRequestError } from '../utils/errors';
import { created, ok } from '../utils/response';

const targetTypes = new Set(['ALL', 'DRIVERS', 'PASSENGERS', 'TENANT_ADMINS', 'VEHICLE_PLATE']);
const priorities = new Set(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);
const sosStatuses = new Set(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']);
const errorStatuses = new Set(['OPEN', 'IN_REVIEW', 'RESOLVED']);

export class TenantCommsController {
  /** GET /tenant/comms/announcements */
  static async listAnnouncements(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

    const announcements = await prisma.tenantAnnouncement.findMany({
      where: { tenantId },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return ok(res, announcements);
  }

  /** POST /tenant/comms/announcements */
  static async createAnnouncement(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const userId = (req as any).user?.userId as string | undefined;

    const title = String(req.body?.title || '').trim();
    const message = String(req.body?.message || '').trim();
    const type = String(req.body?.type || 'INFO').toUpperCase();
    const priority = String(req.body?.priority || 'NORMAL').toUpperCase();
    const targetType = String(req.body?.targetType || 'ALL').toUpperCase();
    const targetValue = req.body?.targetValue ? String(req.body.targetValue).trim() : null;

    if (!title || !message) {
      throw new BadRequestError('title and message are required');
    }

    if (!['INFO', 'WARNING', 'SUCCESS'].includes(type)) {
      throw new BadRequestError('Invalid announcement type');
    }

    if (!priorities.has(priority)) {
      throw new BadRequestError('Invalid priority');
    }

    if (!targetTypes.has(targetType)) {
      throw new BadRequestError('Invalid targetType');
    }

    if (targetType === 'VEHICLE_PLATE' && !targetValue) {
      throw new BadRequestError('targetValue is required for VEHICLE_PLATE');
    }

    const announcement = await prisma.tenantAnnouncement.create({
      data: {
        tenantId,
        createdByUserId: userId ?? null,
        title,
        message,
        type: type as any,
        priority: priority as any,
        targetType: targetType as any,
        targetValue,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return created(res, announcement);
  }

  /** GET /tenant/comms/sos-alerts */
  static async listSosAlerts(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;

    if (status && !sosStatuses.has(status)) {
      throw new BadRequestError('Invalid SOS status');
    }

    const alerts = await prisma.sOSAlert.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, plate: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return ok(res, alerts);
  }

  /** PUT /tenant/comms/sos-alerts/:id/resolve */
  static async resolveSosAlert(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const userId = (req as any).user?.userId as string | undefined;
    const id = req.params.id as string;

    const existing = await prisma.sOSAlert.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new BadRequestError('SOS alert not found');
    }

    const alert = await prisma.sOSAlert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedByUserId: userId ?? null,
      },
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, plate: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    return ok(res, alert);
  }

  /** POST /tenant/comms/sos-alerts/mock */
  static async createMockSosAlert(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId },
      select: {
        id: true,
        plate: true,
        driverId: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    if (vehicles.length === 0) {
      throw new BadRequestError('SOS mock üretmek için tenant altında en az 1 araç olmalı');
    }

    const picked = vehicles[Math.floor(Math.random() * vehicles.length)];

    const latBase = 41.01;
    const lngBase = 28.97;

    const alert = await prisma.sOSAlert.create({
      data: {
        tenantId,
        driverId: picked.driverId ?? null,
        vehicleId: picked.id,
        plateSnapshot: picked.plate,
        message: String(req.body?.message || 'Acil durum bildirimi alındı').trim(),
        location: {
          lat: Number((latBase + (Math.random() - 0.5) * 0.12).toFixed(6)),
          lng: Number((lngBase + (Math.random() - 0.5) * 0.12).toFixed(6)),
        },
        status: 'OPEN',
        isMock: true,
      },
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, plate: true } },
      },
    });

    return created(res, alert);
  }

  /** POST /tenant/comms/error-reports */
  static async createErrorReport(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const userId = (req as any).user?.userId as string | undefined;

    const subject = String(req.body?.subject || '').trim();
    const details = String(req.body?.details || '').trim();
    const source = req.body?.source ? String(req.body.source).trim() : 'DISPATCH_CENTER';

    if (!subject || !details) {
      throw new BadRequestError('subject and details are required');
    }

    const report = await prisma.errorReport.create({
      data: {
        tenantId,
        reporterUserId: userId ?? null,
        subject,
        details,
        source,
      },
      include: {
        reporter: { select: { id: true, name: true, role: true } },
      },
    });

    return created(res, report);
  }

  /** GET /superadmin/comms/error-reports */
  static async listErrorReportsForSuperAdmin(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;

    if (status && !errorStatuses.has(status)) {
      throw new BadRequestError('Invalid error report status');
    }

    const reports = await prisma.errorReport.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        tenant: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, role: true } },
        resolvedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return ok(res, reports);
  }

  /** PUT /superadmin/comms/error-reports/:id/resolve */
  static async resolveErrorReportForSuperAdmin(req: Request, res: Response) {
    const userId = (req as any).user?.userId as string | undefined;
    const id = req.params.id as string;

    const report = await prisma.errorReport.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedByUserId: userId ?? null,
      },
      include: {
        tenant: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, role: true } },
        resolvedBy: { select: { id: true, name: true, role: true } },
      },
    });

    return ok(res, report);
  }
}
