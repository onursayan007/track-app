import { Request, Response } from 'express';
import { RouteStatus, RouteType } from '@prisma/client';
import { RouteService } from '../services/route.service';
import { RouteOptimizationService } from '../services/route-optimization.service';
import { ok, created, noContent } from '../utils/response';
import { BadRequestError } from '../utils/errors';

/**
 * Route Controller — all methods trust `req.tenantScope` from the tenant guard.
 */
export class RouteController {
  /** GET  /routes */
  static async list(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { userId, role } = (req as any).user;
    const { status, type } = req.query as { status?: RouteStatus; type?: RouteType };
    const routes = await RouteService.findAll(tenantId, userId, role, { status, type });
    return ok(res, routes);
  }

  /** GET  /routes/:id */
  static async getById(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const route = await RouteService.findById(tenantId, req.params.id as string);
    return ok(res, route);
  }

  /** POST /routes */
  static async create(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const route = await RouteService.create(tenantId, req.body);
    return created(res, route);
  }

  /** PUT  /routes/:id */
  static async update(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const route = await RouteService.update(tenantId, req.params.id as string, req.body);
    return ok(res, route);
  }

  /** PUT  /routes/:id/stops — replace stops atomically */
  static async replaceStops(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { stops } = req.body;
    if (!Array.isArray(stops)) throw new BadRequestError('stops must be an array');
    const route = await RouteService.replaceStops(tenantId, req.params.id as string, stops);
    return ok(res, route);
  }

  /** PATCH /routes/:id/status */
  static async updateStatus(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { userId, role } = (req as any).user;
    const { status } = req.body;
    if (!Object.values(RouteStatus).includes(status)) {
      throw new BadRequestError(`Invalid status. Must be one of: ${Object.values(RouteStatus).join(', ')}`);
    }
    const route = await RouteService.updateStatus(tenantId, req.params.id as string, status, userId, role);
    return ok(res, route);
  }

  /** DELETE /routes/:id */
  static async remove(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    await RouteService.delete(tenantId, req.params.id as string);
    return noContent(res);
  }

  /** GET /routes/stats */
  static async stats(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const counts = await RouteService.countByTenant(tenantId);
    return ok(res, counts);
  }

  /** POST /routes/optimize */
  static async optimize(req: Request, res: Response) {
    const { origin, destination, waypoints } = req.body;
    if (!origin || !destination || !waypoints) {
      throw new BadRequestError('origin, destination, and waypoints are required');
    }
    const result = await RouteOptimizationService.optimizeRouteOrder(origin, destination, waypoints);
    return ok(res, result);
  }
}