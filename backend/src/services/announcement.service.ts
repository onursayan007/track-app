// ════════════════════════════════════════════════════════════════════
// AnnouncementService — CRUD for global broadcasts
// ════════════════════════════════════════════════════════════════════

import prisma from '../lib/prisma';
import { AnnouncementType } from '@prisma/client';

export interface AnnouncementInput {
  title: string;
  message: string;
  type?: AnnouncementType;
  targetRoles?: string[];
}

export class AnnouncementService {
  /** Create a new announcement (Super Admin only). */
  static async create(data: AnnouncementInput) {
    return prisma.announcement.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type ?? 'INFO',
        targetRoles: data.targetRoles ?? ['ALL'],
      },
    });
  }

  /** List all announcements (admin view). */
  static async findAll() {
    return prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Toggle isActive flag. */
  static async toggle(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new Error('Announcement not found');
    return prisma.announcement.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  /** Delete an announcement. */
  static async remove(id: string) {
    return prisma.announcement.delete({ where: { id } });
  }

  /**
   * Get active announcements for a specific user role.
   * Returns announcements where targetRoles includes 'ALL' or the user's role.
   */
  static async findForRole(userRole: string, tenantId?: string | null) {
    // Prisma postgres array: use `has` or `hasSome`
    const globalAnnouncements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { targetRoles: { has: 'ALL' } },
          { targetRoles: { has: userRole } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (!tenantId) {
      return globalAnnouncements;
    }

    const roleTargetType =
      userRole === 'DRIVER'
        ? 'DRIVERS'
        : userRole === 'PASSENGER'
          ? 'PASSENGERS'
          : 'TENANT_ADMINS';

    const tenantAnnouncements = await prisma.tenantAnnouncement.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { targetType: 'ALL' },
          { targetType: roleTargetType as any },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        createdAt: true,
      },
    });

    const normalizedTenantAnnouncements = tenantAnnouncements.map((item) => ({
      ...item,
      targetRoles: ['ALL'],
      isActive: true,
    }));

    return [...normalizedTenantAnnouncements, ...globalAnnouncements]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 30);
  }
}
