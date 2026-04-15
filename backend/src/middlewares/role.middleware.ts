import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { unauthorized, forbidden } from '../utils/response';

/**
 * Role-gate middleware factory.
 * Usage:  `authorizeRoles('SUPER_ADMIN', 'TENANT_ADMIN')`
 */
export const authorizeRoles = (...allowedRoles: (UserRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return unauthorized(res, 'User not authenticated');
    if (!allowedRoles.includes(user.role)) {
      return forbidden(res, `Access denied: requires one of [${allowedRoles.join(', ')}]`);
    }
    next();
  };
};

/**
 * Convenience presets used by the namespaced routers.
 */
export const superAdminOnly = authorizeRoles('SUPER_ADMIN');
export const tenantAdminOrAbove = authorizeRoles('SUPER_ADMIN', 'TENANT_ADMIN');
export const tenantOnly = authorizeRoles('TENANT_ADMIN', 'TENANT_OPERATOR');
export const driverOrAbove = authorizeRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'DRIVER');
export const anyAuthenticated = authorizeRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_OPERATOR', 'DRIVER', 'PASSENGER');