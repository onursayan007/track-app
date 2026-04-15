// ════════════════════════════════════════════════════════════════════
// /api/v1/* — Aggregator that delegates to namespaced routers
// This file is kept only so index.ts can mount a single import.
// Each sub-router applies its own auth + role + tenant guards.
// ════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';

import superadminRoutes from './superadmin.routes';
import tenantRoutes from './tenant.routes';
import driverRoutes from './driver.routes';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireTenantScope } from '../middlewares/tenant.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/response';
import { AnnouncementService } from '../services/announcement.service';
import { RouteService } from '../services/route.service';

const router = Router();

// ─── Public (authenticated) announcements for ALL roles ─────────
router.get('/announcements', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userRole = (req as any).user?.role as string;
  const tenantId = (req as any).user?.tenantId as string | null;
  const announcements = await AnnouncementService.findForRole(userRole, tenantId);
  return ok(res, announcements);
}));

router.post('/tenant/routes', authenticateToken, requireTenantScope, asyncHandler(async (req: Request, res: Response) => {
  const role = (req as any).user?.role as string;
  const tenantId = (req as any).tenantScope as string;

  if (!tenantId) {
    return res.status(400).json({ success: false, message: 'Tenant scope is required' });
  }

  if (!['TENANT_ADMIN', 'TENANT_OPERATOR', 'DRIVER'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const payload = { ...req.body };

  if (role === 'DRIVER') {
    payload.source = 'DRIVER';
    payload.status = 'DRAFT';
    payload.monthlyRevenue = 0;
  }

  const route = await RouteService.create(tenantId, payload);
  return res.status(201).json({ success: true, data: route });
}));

router.use('/superadmin', superadminRoutes);
router.use('/tenant', tenantRoutes);
router.use('/driver', driverRoutes);

export default router;