// ════════════════════════════════════════════════════════════════════
// AuditService — Reusable audit trail utility
// Records "who did what, when, to which entity" in the audit_logs table.
// ════════════════════════════════════════════════════════════════════

import prisma from '../lib/prisma';

export interface AuditLogInput {
  userId: string;
  tenantId?: string | null;
  action: string;        // e.g. "DELETE", "UPDATE", "CREATE"
  entity: string;        // e.g. "DRIVER", "VEHICLE", "ROUTE"
  entityId: string;      // PK of the affected record
  details?: any;         // JSON — previous/new state snapshot
  ipAddress?: string;
}

export class AuditService {
  /**
   * Write an audit log entry. Fire-and-forget safe — errors are logged
   * but never propagate to the caller.
   */
  static async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: input.userId,
          tenantId: input.tenantId ?? undefined,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          details: input.details ?? undefined,
          ipAddress: input.ipAddress ?? undefined,
        },
      });
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', (err as Error).message);
    }
  }

  /**
   * Query audit logs with optional filters + pagination.
   */
  static async findAll(filters?: {
    userId?: string;
    tenantId?: string;
    entity?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.action) where.action = filters.action;

    return prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 100,
      skip: filters?.offset ?? 0,
    });
  }
}
