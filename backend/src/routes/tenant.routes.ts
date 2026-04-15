// ════════════════════════════════════════════════════════════════════
// /api/v1/tenant/* — Tenant-scoped routes (TENANT_ADMIN + SUPER_ADMIN)
// Every query is automatically scoped to the caller's tenantId.
// ════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { tenantOnly } from '../middlewares/role.middleware';
import { requireTenantScope } from '../middlewares/tenant.middleware';
import { VehicleController } from '../controllers/vehicle.controller';
import { RouteController } from '../controllers/route.controller';
import { TenantMenuController } from '../controllers/tenant-menu.controller';
import { AuthController } from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/response';
import { VehicleService } from '../services/vehicle.service';
import { RouteService } from '../services/route.service';
import prisma from '../lib/prisma';
import { Request, Response } from 'express';

import { checkTenantSuspension } from '../middlewares/suspension.middleware';
import { BillingService } from '../services/billing.service';
import { AuditService } from '../services/audit.service';
import { TenantAlertController } from '../controllers/tenant-alert.controller';
import { TenantRulesController } from '../controllers/tenant-rules.controller';
import { VehicleRecordController } from '../controllers/vehicle-record.controller';
import { TenantFeedbackController } from '../controllers/tenant-feedback.controller';
import { FinanceController } from '../controllers/finance.controller';
import { upload } from '../middlewares/upload.middleware';
import { TenantClientController } from '../controllers/tenant-client.controller';
import { TenantCommsController } from '../controllers/tenant-comms.controller';

const router = Router();

// All routes require authentication + tenant-level RBAC (TENANT_ADMIN | TENANT_OPERATOR)
// SUPER_ADMIN, DRIVER, PASSENGER → 403 Forbidden
router.use(authenticateToken, tenantOnly, requireTenantScope);

// ─── Tenant Invoice Routes (BEFORE suspension guard) ──────────
router.get('/invoices', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantScope as string;
  const invoices = await BillingService.findAll({ tenantId });
  return ok(res, invoices);
}));

// Suspension guard — blocks all other tenant routes if SUSPENDED
// Invoice routes above remain accessible so tenants can view & pay
router.use(checkTenantSuspension);

// ─── Dashboard ───────────────────────────────────────────────────
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantScope as string;
  const [vehicleStats, routeStats, userCount] = await Promise.all([
    VehicleService.countByTenant(tenantId),
    RouteService.countByTenant(tenantId),
    prisma.user.count({ where: { tenantId } }),
  ]);
  return ok(res, { vehicles: vehicleStats, routes: routeStats, userCount });
}));

// ─── Telemetry Alerts & Notification Settings ───────────────────
router.post('/alerts/mock', asyncHandler(TenantAlertController.createMockAlert));
router.post('/alerts/mock/all', asyncHandler(TenantAlertController.createMockAlertsForTenantVehicles));
router.get('/alerts', asyncHandler(TenantAlertController.listAlerts));
router.delete('/alerts/:id', asyncHandler(TenantAlertController.removeAlert));
router.get('/settings/alerts', asyncHandler(TenantAlertController.getAlertSettings));
router.put('/settings/alerts', asyncHandler(TenantAlertController.updateAlertSettings));
router.get('/drivers/:driverId/shifts', asyncHandler(TenantAlertController.getDriverShifts));
router.put('/drivers/:driverId/shifts', asyncHandler(TenantAlertController.replaceDriverShifts));

router.get('/settings/geofences', asyncHandler(TenantRulesController.listGeofences));
router.post('/settings/geofences', asyncHandler(TenantRulesController.createGeofence));
router.put('/settings/geofences/:id', asyncHandler(TenantRulesController.updateGeofence));
router.delete('/settings/geofences/:id', asyncHandler(TenantRulesController.deleteGeofence));
router.get('/settings/geofences/vehicle/:vehicleId', asyncHandler(TenantRulesController.getVehicleGeofenceAssignments));
router.put('/settings/geofences/vehicle/:vehicleId', asyncHandler(TenantRulesController.replaceVehicleGeofenceAssignments));

router.get('/shifts', asyncHandler(TenantRulesController.listShifts));
router.post('/shifts', asyncHandler(TenantRulesController.createShift));
router.put('/shifts/:id', asyncHandler(TenantRulesController.updateShift));
router.delete('/shifts/:id', asyncHandler(TenantRulesController.deleteShift));

// ─── User Management (within own tenant) ─────────────────────────
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantScope as string;
  const { role } = req.query as { role?: string };
  const where: any = { tenantId };
  if (role) where.role = role;
  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true, phone: true, role: true, clientId: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, users);
}));

router.post('/users', asyncHandler(async (req: Request, res: Response) => {
  // Force tenantId to the caller's tenant — tenant-admin cannot create cross-tenant users
  const tenantId = (req as any).tenantScope as string;
  req.body.tenantId = tenantId;

  if (req.body.clientId) {
    const client = await prisma.client.findFirst({ where: { id: req.body.clientId, tenantId } });
    if (!client) return res.status(400).json({ success: false, message: 'Invalid clientId for tenant scope' });
  }

  // Restrict roles that tenant-admin can assign
  const allowed = ['DRIVER', 'PASSENGER'];
  if (req.body.role && !allowed.includes(req.body.role)) {
    req.body.role = 'PASSENGER';
  }
  return AuthController.register(req, res);
}));

router.patch('/users/:id', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantScope as string;
  const userId = req.params.id as string;
  const { name, phone, email, isActive, clientId } = req.body;

  const existing = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!existing) return res.status(404).json({ success: false, message: 'User not found' });

  if (clientId !== undefined && clientId !== null && clientId !== '') {
    const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) return res.status(400).json({ success: false, message: 'Invalid clientId for tenant scope' });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(isActive !== undefined && { isActive }),
      ...(clientId !== undefined && { clientId: clientId || null }),
    },
    select: { id: true, email: true, name: true, phone: true, role: true, clientId: true, isActive: true, createdAt: true },
  });

  return ok(res, updated);
}));

// ─── Dedicated Driver Registration (POST /tenant/drivers) ────────
// Accepts name, phone, email, password. tenantId is ALWAYS from JWT.
router.post('/drivers', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantScope as string;
  const { name, email, phone, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ success: false, message: 'name and password are required' });
  }
  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'At least one of email or phone is required' });
  }

  // Force tenant + role — never trust the client
  req.body.tenantId = tenantId;
  req.body.role = 'DRIVER';

  return AuthController.register(req, res);
}));

// ─── List Drivers for this tenant ────────────────────────────────
router.get('/drivers', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantScope as string;
  const drivers = await prisma.user.findMany({
    where: { tenantId, role: 'DRIVER' },
    select: {
      id: true, email: true, name: true, phone: true, licenseClass: true, address: true, isActive: true, createdAt: true,
      assignedVehicles: { select: { id: true, plate: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, drivers);
}));

// ─── Update Driver ───────────────────────────────────────────────
router.patch('/drivers/:id', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantScope as string;
  const userId = (req as any).user.userId as string;
  const driverId = req.params.id as string;
  const { name, phone, email, isActive, licenseClass, address } = req.body;

  const existing = await prisma.user.findFirst({ where: { id: driverId, tenantId, role: 'DRIVER' } });
  if (!existing) return res.status(404).json({ success: false, message: 'Driver not found' });

  const updated = await prisma.user.update({
    where: { id: driverId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(licenseClass !== undefined && { licenseClass }),
      ...(address !== undefined && { address }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, email: true, name: true, phone: true, licenseClass: true, address: true, isActive: true, role: true },
  });

  await AuditService.log({
    userId,
    tenantId,
    action: 'UPDATE',
    entity: 'DRIVER',
    entityId: driverId,
    details: {
      before: { name: existing.name, phone: existing.phone, email: existing.email, isActive: existing.isActive, licenseClass: existing.licenseClass, address: existing.address },
      after: { name: updated.name, phone: updated.phone, email: updated.email, isActive: updated.isActive, licenseClass: updated.licenseClass, address: updated.address },
    },
    ipAddress: req.ip,
  });

  return ok(res, updated);
}));

// ─── Delete Driver ───────────────────────────────────────────────
router.delete('/drivers/:id', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantScope as string;
  const userId = (req as any).user.userId as string;
  const driverId = req.params.id as string;

  const existing = await prisma.user.findFirst({ where: { id: driverId, tenantId, role: 'DRIVER' } });
  if (!existing) return res.status(404).json({ success: false, message: 'Driver not found' });

  await prisma.user.delete({ where: { id: driverId } });

  await AuditService.log({
    userId,
    tenantId,
    action: 'DELETE',
    entity: 'DRIVER',
    entityId: driverId,
    details: { deleted: { name: existing.name, email: existing.email, phone: existing.phone, role: existing.role } },
    ipAddress: req.ip,
  });

  return ok(res, { message: 'Driver deleted' });
}));

// ─── Dynamic Navigation Menus ────────────────────────────────────
router.get('/menus', asyncHandler(TenantMenuController.list));

// ─── Vehicle CRUD ────────────────────────────────────────────────
router.get('/vehicles/stats',     asyncHandler(VehicleController.stats));
router.get('/vehicles',           asyncHandler(VehicleController.list));
router.get('/vehicles/:id',       asyncHandler(VehicleController.getById));
router.get('/vehicles/:id/qr-pdf', asyncHandler(VehicleController.downloadQrPdf));
router.post('/vehicles',          asyncHandler(VehicleController.create));
router.put('/vehicles/:id',       asyncHandler(VehicleController.update));
router.delete('/vehicles/:id',    asyncHandler(VehicleController.remove));

// ─── Vehicle-Driver Assignment (Zimmetleme) ─────────────────────
router.patch('/vehicles/:id/assign-driver', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantScope as string;
  const vehicleId = req.params.id as string;
  const { driverId, clientId } = req.body;    // null → unassign
  const vehicle = await VehicleService.assignDriver(tenantId, vehicleId, driverId ?? null, clientId);
  return ok(res, vehicle);
}));

// ─── Route CRUD ──────────────────────────────────────────────────
router.get('/routes/stats',           asyncHandler(RouteController.stats));
router.get('/routes',                 asyncHandler(RouteController.list));
router.get('/routes/:id',             asyncHandler(RouteController.getById));
router.post('/routes',                asyncHandler(RouteController.create));
router.put('/routes/:id',             asyncHandler(RouteController.update));
router.put('/routes/:id/stops',       asyncHandler(RouteController.replaceStops));
router.patch('/routes/:id/status',    asyncHandler(RouteController.updateStatus));
router.delete('/routes/:id',          asyncHandler(RouteController.remove));
router.post('/routes/optimize',       asyncHandler(RouteController.optimize));

// ─── Client Management ─────────────────────────────────────────
router.get('/clients', asyncHandler(TenantClientController.list));
router.get('/clients/:id', asyncHandler(TenantClientController.getById));
router.post('/clients', asyncHandler(TenantClientController.create));
router.put('/clients/:id', asyncHandler(TenantClientController.update));
router.delete('/clients/:id', asyncHandler(TenantClientController.remove));

// ─── Vehicle Records (Maintenance & Documents) ──────────────────
router.get('/vehicle-records', asyncHandler(VehicleRecordController.list));
router.post('/vehicle-records', upload.single('file'), asyncHandler(VehicleRecordController.create));
router.get('/vehicle-records/vehicle/:vehicleId/last-maintenance', asyncHandler(VehicleRecordController.getLastMaintenance));
router.get('/vehicle-records/incoming/download-all', asyncHandler(VehicleRecordController.downloadIncomingZip));

// ─── Feedbacks ─────────────────────────────────────────────────
router.get('/feedbacks', asyncHandler(TenantFeedbackController.list));

// ─── Dispatch & Fleet Comms ────────────────────────────────────
router.get('/comms/announcements', asyncHandler(TenantCommsController.listAnnouncements));
router.post('/comms/announcements', asyncHandler(TenantCommsController.createAnnouncement));
router.get('/comms/sos-alerts', asyncHandler(TenantCommsController.listSosAlerts));
router.post('/comms/sos-alerts/mock', asyncHandler(TenantCommsController.createMockSosAlert));
router.put('/comms/sos-alerts/:id/resolve', asyncHandler(TenantCommsController.resolveSosAlert));
router.post('/comms/error-reports', asyncHandler(TenantCommsController.createErrorReport));

// ─── Finance & Reports ─────────────────────────────────────────
router.get('/finance/summary', asyncHandler(FinanceController.summary));
router.get('/finance/chart', asyncHandler(FinanceController.chart));
router.get('/finance/transactions', asyncHandler(FinanceController.transactions));
router.get('/finance/client-summary', asyncHandler(FinanceController.clientSummary));
router.get('/finance/client-invoices/:clientId/pdf', asyncHandler(FinanceController.downloadClientInvoicePdf));
router.post('/finance/client-invoices/:clientId/send', asyncHandler(FinanceController.sendClientInvoice));

export default router;
