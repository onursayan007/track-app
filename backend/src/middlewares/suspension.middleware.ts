// ════════════════════════════════════════════════════════════════════
// Tenant Suspension Guard Middleware
// Blocks SUSPENDED tenants from accessing /api/v1/tenant/* endpoints.
// Returns 403 with error code 'TENANT_SUSPENDED' so the frontend
// can render the suspension overlay.
// ════════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * Must be placed AFTER authenticateToken + tenantScope resolution.
 * Checks if the user's tenant has status === 'SUSPENDED'.
 * If suspended, returns 403 with a specific error code.
 *
 * Exempt paths: /tenant/invoices (so they can view & pay invoices)
 */
export const checkTenantSuspension = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = (req as any).user;
  if (!user || user.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  const tenantId = user.tenantId || (req as any).tenantScope;
  if (!tenantId) {
    next();
    return;
  }

  // Allow access to invoice/billing endpoints even when suspended
  const exemptPaths = ['/invoices', '/billing'];
  const path = req.path.toLowerCase();
  if (exemptPaths.some((p) => path.includes(p))) {
    next();
    return;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { status: true },
    });

    if (tenant?.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        code: 'TENANT_SUSPENDED',
        message: 'Hesabınız askıya alındı. Ödenmemiş faturalarınızın vadesi 15 günü geçmiştir. Lütfen faturalarınızı ödeyiniz.',
      });
      return;
    }
  } catch (err) {
    console.error('[SuspensionGuard] Error checking tenant status:', (err as Error).message);
  }

  next();
};
