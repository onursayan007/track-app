// ════════════════════════════════════════════════════════════════════
// /api/v1/superadmin/* — Platform-level routes (SUPER_ADMIN only)
// ════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { superAdminOnly } from '../middlewares/role.middleware';
import { SuperAdminController } from '../controllers/superadmin.controller';
import { VehicleController } from '../controllers/vehicle.controller';
import { VehicleModelController } from '../controllers/vehicle-model.controller';
import { RouteController } from '../controllers/route.controller';
import { requireTenantScope } from '../middlewares/tenant.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { upload } from '../middlewares/upload.middleware';
import { VehicleService } from '../services/vehicle.service';
import { ok } from '../utils/response';
import { Request, Response } from 'express';
import { TenantCommsController } from '../controllers/tenant-comms.controller';

const router = Router();

// Every route here requires SUPER_ADMIN role
router.use(authenticateToken, superAdminOnly);

// ─── Platform Dashboard ──────────────────────────────────────────
router.get('/stats',                  asyncHandler(SuperAdminController.platformStats));

// ─── Tenant Management ───────────────────────────────────────────
router.get('/tenants',                asyncHandler(SuperAdminController.listTenants));
router.get('/tenants/:id',            asyncHandler(SuperAdminController.getTenant));
router.post('/tenants',               asyncHandler(SuperAdminController.createTenant));
router.put('/tenants/:id',            asyncHandler(SuperAdminController.updateTenant));
router.patch('/tenants/:id',          asyncHandler(SuperAdminController.updateTenant));
router.patch('/tenants/:id/deactivate', asyncHandler(SuperAdminController.deactivateTenant));
router.patch('/tenants/:id/toggle-status', asyncHandler(SuperAdminController.toggleTenantStatus));
router.post('/tenants/:id/impersonate', asyncHandler(SuperAdminController.impersonateTenant));

// ─── Cross-Tenant User Management ───────────────────────────────
router.get('/users',                  asyncHandler(SuperAdminController.listUsers));
router.post('/users',                 asyncHandler(SuperAdminController.createUser));

// ─── Tenant-Scoped User (Accounts) Management ───────────────────
router.get('/tenants/:id/users',      asyncHandler(SuperAdminController.listTenantUsers));
router.post('/tenants/:id/users',     asyncHandler(SuperAdminController.createTenantUser));
router.patch('/users/:userId/password', asyncHandler(SuperAdminController.resetUserPassword));

// ─── Cross-Tenant Vehicle Management ────────────────────────────
// SuperAdmin can scope via ?tenantId=<uuid>
router.get('/vehicles',               requireTenantScope, asyncHandler(SuperAdminController.listAllVehicles));
router.get('/vehicles/:id',           requireTenantScope, asyncHandler(VehicleController.getById));
router.post('/vehicles',              requireTenantScope, asyncHandler(VehicleController.create));
router.put('/vehicles/:id',           requireTenantScope, asyncHandler(VehicleController.update));
router.delete('/vehicles/:id',        requireTenantScope, asyncHandler(VehicleController.remove));

// ─── Vehicle Model Catalog ──────────────────────────────────────
router.get('/vehicle-models',                                asyncHandler(VehicleModelController.list));
router.get('/vehicle-models/:id',                            asyncHandler(VehicleModelController.getById));
router.post('/vehicle-models',     upload.single('photo'),   asyncHandler(VehicleModelController.create));
router.delete('/vehicle-models/:id',                         asyncHandler(VehicleModelController.remove));

// ─── M2M SIM Card Management ────────────────────────────────────
router.get('/m2m/vehicles', asyncHandler(async (_req: Request, res: Response) => {
  const vehicles = await VehicleService.findAllWithM2m();
  return ok(res, vehicles);
}));

router.patch('/vehicles/:id/m2m', asyncHandler(async (req: Request, res: Response) => {
  const { m2mNumber, m2mIccid, m2mOperator, m2mStatus, m2mDataQuotaMB, m2mUsedDataMB } = req.body;
  const vehicle = await VehicleService.updateM2m(req.params.id as string, {
    m2mNumber, m2mIccid, m2mOperator, m2mStatus, m2mDataQuotaMB, m2mUsedDataMB,
  });
  return ok(res, vehicle);
}));

// ─── Cross-Tenant Route Management ──────────────────────────────
router.get('/routes',                 requireTenantScope, asyncHandler(RouteController.list));
router.get('/routes/:id',             requireTenantScope, asyncHandler(RouteController.getById));
router.post('/routes',                requireTenantScope, asyncHandler(RouteController.create));
router.put('/routes/:id',             requireTenantScope, asyncHandler(RouteController.update));
router.put('/routes/:id/stops',       requireTenantScope, asyncHandler(RouteController.replaceStops));
router.patch('/routes/:id/status',    requireTenantScope, asyncHandler(RouteController.updateStatus));
router.delete('/routes/:id',          requireTenantScope, asyncHandler(RouteController.remove));
// ─── Billing & Invoice Management ──────────────────────────────
import { BillingController } from '../controllers/billing.controller';

router.get('/billing/stats',                  asyncHandler(BillingController.billingStats));
router.post('/billing/run-suspension-check',  asyncHandler(BillingController.runSuspensionCheck));
router.post('/billing/generate-invoices',     asyncHandler(BillingController.generateMonthlyInvoices));
router.get('/invoices',                       asyncHandler(BillingController.listInvoices));
router.get('/invoices/:id',                   asyncHandler(BillingController.getInvoice));
router.post('/invoices',                      asyncHandler(BillingController.createInvoice));
router.patch('/invoices/:id/pay',             asyncHandler(BillingController.markPaid));

// ─── Subscription Plan Management ──────────────────────────────
router.get('/plans',                          asyncHandler(BillingController.listPlans));
router.get('/plans/:id',                      asyncHandler(BillingController.getPlan));
router.post('/plans',                         asyncHandler(BillingController.createPlan));
router.put('/plans/:id',                      asyncHandler(BillingController.updatePlan));
router.patch('/plans/:id/toggle',             asyncHandler(BillingController.togglePlan));
router.delete('/plans/:id',                   asyncHandler(BillingController.deletePlan));

// ─── Announcements Management ───────────────────────────────────
import { AnnouncementService } from '../services/announcement.service';

router.get('/announcements', asyncHandler(async (_req: Request, res: Response) => {
  const list = await AnnouncementService.findAll();
  return ok(res, list);
}));

router.post('/announcements', asyncHandler(async (req: Request, res: Response) => {
  const { title, message, type, targetRoles } = req.body;
  if (!title || !message) return res.status(400).json({ success: false, message: 'title and message are required' });
  const ann = await AnnouncementService.create({ title, message, type, targetRoles });
  return res.status(201).json({ success: true, data: ann });
}));

router.patch('/announcements/:id/toggle', asyncHandler(async (req: Request, res: Response) => {
  const ann = await AnnouncementService.toggle(req.params.id as string);
  return ok(res, ann);
}));

router.delete('/announcements/:id', asyncHandler(async (req: Request, res: Response) => {
  await AnnouncementService.remove(req.params.id as string);
  return ok(res, { message: 'Deleted' });
}));

// ─── Tenant Dispatch Error Reports ─────────────────────────────
router.get('/comms/error-reports', asyncHandler(TenantCommsController.listErrorReportsForSuperAdmin));
router.put('/comms/error-reports/:id/resolve', asyncHandler(TenantCommsController.resolveErrorReportForSuperAdmin));

// ─── Audit Logs ─────────────────────────────────────────────────
import { AuditService } from '../services/audit.service';

router.get('/audit-logs', asyncHandler(async (req: Request, res: Response) => {
  const { userId, tenantId, entity, action, limit, offset } = req.query as any;
  const logs = await AuditService.findAll({
    userId, tenantId, entity, action,
    limit: limit ? parseInt(limit, 10) : 100,
    offset: offset ? parseInt(offset, 10) : 0,
  });
  return ok(res, logs);
}));

// ─── System Health (IoT Telemetry Mock) ─────────────────────────
router.get('/system-health', asyncHandler(async (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  return ok(res, {
    status: 'OPERATIONAL',
    uptime: Math.floor(uptime),
    cpuUsage: `${(Math.random() * 30 + 25).toFixed(1)}%`,
    ramUsage: `${(memUsage.rss / 1024 / 1024).toFixed(1)} MB`,
    heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
    activeUdpConnections: Math.floor(Math.random() * 80 + 100),
    activeTcpConnections: Math.floor(Math.random() * 40 + 50),
    packetsProcessedPerSec: Math.floor(Math.random() * 400 + 600),
    gpsPointsToday: Math.floor(Math.random() * 50000 + 120000),
    websocketClients: Math.floor(Math.random() * 20 + 30),
    dbConnectionPool: { active: Math.floor(Math.random() * 5 + 3), idle: Math.floor(Math.random() * 3 + 2), max: 20 },
    lastTelemetryAt: new Date().toISOString(),
  });
}));

export default router;
