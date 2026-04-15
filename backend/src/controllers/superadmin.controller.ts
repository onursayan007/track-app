// ════════════════════════════════════════════════════════════════════
// SuperAdmin Controller — platform-level operations
// Only accessible by SUPER_ADMIN role.
// ════════════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { TenantService } from '../services/tenant.service';
import { AuthService } from '../services/auth.service';
import { VehicleService } from '../services/vehicle.service';
import { RouteService } from '../services/route.service';
import { ok, created, noContent } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import prisma from '../lib/prisma';

export class SuperAdminController {
  // ─── Platform dashboard ────────────────────────────────────────
  static async platformStats(_req: Request, res: Response) {
    const stats = await TenantService.platformStats();
    return ok(res, stats);
  }

  // ─── Tenant CRUD ───────────────────────────────────────────────
  static async listTenants(req: Request, res: Response) {
    const { search, isActive } = req.query as { search?: string; isActive?: string };
    const tenants = await TenantService.findAll({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    return ok(res, tenants);
  }

  static async getTenant(req: Request, res: Response) {
    const tenant = await TenantService.findById(req.params.id as string);
    return ok(res, tenant);
  }

  static async createTenant(req: Request, res: Response) {
    const tenant = await TenantService.create(req.body);
    return created(res, tenant);
  }

  static async updateTenant(req: Request, res: Response) {
    const tenant = await TenantService.update(req.params.id as string, req.body);
    return ok(res, tenant);
  }

  static async deactivateTenant(req: Request, res: Response) {
    const tenant = await TenantService.deactivate(req.params.id as string);
    return ok(res, tenant);
  }

  /** Toggle tenant isActive status (suspend / reactivate). */
  static async toggleTenantStatus(req: Request, res: Response) {
    const tenant = await TenantService.findById(req.params.id as string);
    const updated = await TenantService.update(tenant.id, { isActive: !tenant.isActive });
    return ok(res, updated);
  }

  /**
   * Impersonate a tenant — mints a JWT for the first TENANT_ADMIN
   * of the given tenant so SuperAdmin can login as that company.
   */
  static async impersonateTenant(req: Request, res: Response) {
    const tenantId = req.params.id as string;

    // Ensure tenant exists
    const tenant = await TenantService.findById(tenantId);

    // Find first active TENANT_ADMIN for this tenant
    const adminUser = await prisma.user.findFirst({
      where: { tenantId, role: 'TENANT_ADMIN', isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!adminUser) throw new BadRequestError('Bu firmaya ait aktif yönetici bulunamadı');

    // Mint token as that user
    const token = AuthService.signToken({
      userId: adminUser.id,
      tenantId: adminUser.tenantId,
      role: adminUser.role,
    });

    const { passwordHash, ...profile } = adminUser;
    return ok(res, { token, user: { ...profile, tenantName: tenant.name } });
  }

  // ─── Cross-tenant user management ─────────────────────────────
  static async createUser(req: Request, res: Response) {
    const { email, password, name, phone, role, tenantId } = req.body;
    if (!email || !password || !name) throw new BadRequestError('email, password, name required');
    const user = await AuthService.register({ email, password, name, phone, role, tenantId });
    return created(res, user);
  }

  static async listUsers(req: Request, res: Response) {
    const { tenantId, role } = req.query as { tenantId?: string; role?: string };
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (role) where.role = role;
    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, phone: true, role: true, tenantId: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, users);
  }

  // ─── Tenant-scoped user management ────────────────────────────
  /** List all users belonging to a specific tenant. */
  static async listTenantUsers(req: Request, res: Response) {
    const tenantId = req.params.id as string;
    await TenantService.findById(tenantId); // ensure tenant exists
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, users);
  }

  /** Create a new user for a specific tenant. */
  static async createTenantUser(req: Request, res: Response) {
    const tenantId = req.params.id as string;
    await TenantService.findById(tenantId); // ensure tenant exists
    const { email, password, name, phone, role } = req.body;
    if (!email || !password || !name) throw new BadRequestError('email, password, name required');
    const user = await AuthService.register({
      email,
      password,
      name,
      phone,
      role: role || 'TENANT_ADMIN',
      tenantId,
    });
    return created(res, user);
  }

  /** Reset/update a user's password (Super Admin). */
  static async resetUserPassword(req: Request, res: Response) {
    const userId = req.params.userId as string;
    const { password } = req.body;
    if (!password || password.length < 6) throw new BadRequestError('Password must be at least 6 characters');
    const exists = await prisma.user.findUnique({ where: { id: userId } });
    if (!exists) throw new BadRequestError('User not found');
    const hash = await AuthService.hashPassword(password);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return ok(res, { message: 'Password updated' });
  }

  // ─── Cross-tenant vehicle view ────────────────────────────────
  static async listAllVehicles(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string | undefined;
    if (tenantId) {
      const vehicles = await VehicleService.findAll(tenantId);
      return ok(res, vehicles);
    }
    // All vehicles across the platform
    const vehicles = await prisma.vehicle.findMany({
      include: {
        tenant: { select: { id: true, name: true } },
        vehicleModel: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, vehicles);
  }
}
