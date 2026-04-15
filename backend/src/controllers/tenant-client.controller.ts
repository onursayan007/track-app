import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { ok, created, noContent } from '../utils/response';

function sanitizeString(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function requireClientPayload(body: any) {
  const monthlyAllowanceRaw = Number(body.monthlyAllowance ?? 0);
  const monthlyAllowance = Number.isFinite(monthlyAllowanceRaw) ? Math.max(0, monthlyAllowanceRaw) : 0;

  const payload = {
    name: sanitizeString(body.name),
    taxNumber: sanitizeString(body.taxNumber),
    taxOffice: sanitizeString(body.taxOffice),
    invoiceAddress: sanitizeString(body.invoiceAddress),
    contactEmail: sanitizeString(body.contactEmail),
    monthlyAllowance,
  };

  if (!payload.name) throw new BadRequestError('name is required');
  if (!payload.taxNumber) throw new BadRequestError('taxNumber is required');
  if (!payload.taxOffice) throw new BadRequestError('taxOffice is required');
  if (!payload.invoiceAddress) throw new BadRequestError('invoiceAddress is required');
  if (!payload.contactEmail) throw new BadRequestError('contactEmail is required');

  return payload;
}

async function resolveClientOrThrow(tenantId: string, clientId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
  if (!client) throw new NotFoundError('Client');
  return client;
}

export class TenantClientController {
  static async list(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

    const [clients, routeCounts, passengerCounts] = await Promise.all([
      prisma.client.findMany({
        where: { tenantId },
        orderBy: [{ name: 'asc' }],
      }),
      prisma.route.groupBy({
        by: ['clientId'],
        where: { tenantId, clientId: { not: null } },
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ['clientId'],
        where: { tenantId, role: 'PASSENGER', clientId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const routeCountMap = new Map(routeCounts.map((item) => [item.clientId, item._count._all]));
    const passengerCountMap = new Map(passengerCounts.map((item) => [item.clientId, item._count._all]));

    return ok(
      res,
      clients.map((client) => ({
        ...client,
        routeCount: routeCountMap.get(client.id) || 0,
        passengerCount: passengerCountMap.get(client.id) || 0,
      }))
    );
  }

  static async getById(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const id = req.params.id as string;
    const client = await resolveClientOrThrow(tenantId, id);

    const [routeCount, passengerCount] = await Promise.all([
      prisma.route.count({ where: { tenantId, clientId: id } }),
      prisma.user.count({ where: { tenantId, role: 'PASSENGER', clientId: id } }),
    ]);

    return ok(res, { ...client, routeCount, passengerCount });
  }

  static async create(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const payload = requireClientPayload(req.body);

    const client = await prisma.client.create({
      data: {
        ...payload,
        tenantId,
      },
    });

    return created(res, { ...client, routeCount: 0, passengerCount: 0 });
  }

  static async update(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const id = req.params.id as string;
    await resolveClientOrThrow(tenantId, id);

    const payload = requireClientPayload(req.body);

    const client = await prisma.client.update({
      where: { id },
      data: payload,
    });

    const [routeCount, passengerCount] = await Promise.all([
      prisma.route.count({ where: { tenantId, clientId: id } }),
      prisma.user.count({ where: { tenantId, role: 'PASSENGER', clientId: id } }),
    ]);

    return ok(res, { ...client, routeCount, passengerCount });
  }

  static async remove(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const id = req.params.id as string;
    await resolveClientOrThrow(tenantId, id);

    await prisma.client.delete({ where: { id } });
    return noContent(res);
  }
}
