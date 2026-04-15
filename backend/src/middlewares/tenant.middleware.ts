// ════════════════════════════════════════════════════════════════════
// Tenant Isolation Guard
// Ensures every non-SUPER_ADMIN request has a valid tenantId.
// SUPER_ADMIN can optionally scope queries via ?tenantId=<uuid>.
// ════════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { forbidden, badRequest } from '../utils/response';

/**
 * Middleware that:
 * 1. TENANT_ADMIN / DRIVER / PASSENGER — uses tenantId from JWT (immutable).
 * 2. SUPER_ADMIN — reads optional `?tenantId=` query param or body field;
 *    if not supplied the controller must handle cross-tenant logic itself.
 *
 * Sets `req.tenantScope` for downstream use.
 */
declare global {
  namespace Express {
    interface Request {
      /** Resolved tenant scope — guaranteed non-null after this middleware (except SUPER_ADMIN). */
      tenantScope?: string;
    }
  }
}

export const requireTenantScope = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user;
  if (!user) return forbidden(res, 'Not authenticated');

  if (user.role === 'SUPER_ADMIN') {
    // Super admins can optionally scope to a tenant
    const explicitTenantId =
      (req.query.tenantId as string) || req.body?.tenantId;
    (req as any).tenantScope = explicitTenantId || null;
    return next();
  }

  // For all other roles the tenantId is baked into the JWT — non-negotiable
  if (!user.tenantId) {
    return badRequest(res, 'User has no associated tenant');
  }

  (req as any).tenantScope = user.tenantId;
  next();
};
