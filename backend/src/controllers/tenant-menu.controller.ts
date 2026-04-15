// ════════════════════════════════════════════════════════════════════
// TenantMenu Controller — Dynamic sidebar navigation per tenant
// ════════════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { ok } from '../utils/response';

export class TenantMenuController {
  /** GET /tenant/menus — returns active menu items for the caller's tenant */
  static async list(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const defaults = getDefaultMenus(tenantId);

    // Read existing active menus
    let menus = await prisma.tenantMenu.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (menus.length === 0) {
      // Auto-provision default menus for the tenant
      await prisma.tenantMenu.createMany({ data: defaults });
      menus = await prisma.tenantMenu.findMany({
        where: { tenantId, isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    } else {
      // Backfill newly introduced default items for existing tenants
      const existingRoutes = new Set(menus.map((item) => item.route));
      const missingDefaults = defaults.filter((item) => !existingRoutes.has(item.route));

      if (missingDefaults.length > 0) {
        await prisma.tenantMenu.createMany({ data: missingDefaults });
        menus = await prisma.tenantMenu.findMany({
          where: { tenantId, isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
      }
    }

    return ok(res, menus);
  }
}

/** Default navigation items provisioned for every new tenant */
function getDefaultMenus(tenantId: string) {
  return [
    { tenantId, label: 'Canlı Operasyon',     route: '/company/dashboard',    icon: 'map',          sortOrder: 1, isActive: true },
    { tenantId, label: 'Tur ve Planlama',      route: '/company/planning',     icon: 'calendar',     sortOrder: 2, isActive: true },
    { tenantId, label: 'Rotalar',              route: '/company/routes',       icon: 'route',        sortOrder: 3, isActive: true },
    { tenantId, label: 'Filo ve Şoförler',     route: '/company/fleet',        icon: 'truck',        sortOrder: 4, isActive: true },
    { tenantId, label: 'Yolcu Listesi',        route: '/company/passengers',   icon: 'users',        sortOrder: 5, isActive: true },
    { tenantId, label: 'Müşteri Yönetimi',     route: '/company/clients',      icon: 'users',        sortOrder: 6, isActive: true },
    { tenantId, label: 'İletişim Merkezi',     route: '/company/dispatch',     icon: 'chat',         sortOrder: 7, isActive: true },
    { tenantId, label: 'Finans ve Raporlar',   route: '/company/reports',      icon: 'chart',        sortOrder: 8, isActive: true },
    { tenantId, label: 'Bakım ve Evrak',       route: '/company/maintenance',  icon: 'wrench',       sortOrder: 9, isActive: true },
    { tenantId, label: 'Geri Bildirimler',     route: '/company/feedback',     icon: 'chat',         sortOrder: 10, isActive: true },
    { tenantId, label: 'İhlal ve Alarmlar',    route: '/company/alarms',       icon: 'bell',         sortOrder: 11, isActive: true },
    { tenantId, label: 'Ayarlar',              route: '/company/settings',     icon: 'settings',     sortOrder: 100, isActive: true },
  ];
}
