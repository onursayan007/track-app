// ════════════════════════════════════════════════════════════════════
// VehicleModel Controller — CRUD for the global VehicleModel catalog
// Only accessible by SUPER_ADMIN.
// ════════════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { ok, created, badRequest } from '../utils/response';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class VehicleModelController {
  /** POST /vehicle-models  (multipart/form-data) */
  static async create(req: Request, res: Response) {
    const { brand, modelName } = req.body;
    if (!brand || !modelName) throw new BadRequestError('brand and modelName are required');

    const file = req.file;
    if (!file) throw new BadRequestError('Vehicle photo is required');

    // Build a URL path for the uploaded image
    const photoUrl = `/uploads/${file.filename}`;

    const vehicleModel = await prisma.vehicleModel.create({
      data: { brand, modelName, photoUrl },
    });

    return created(res, vehicleModel);
  }

  /** GET /vehicle-models */
  static async list(_req: Request, res: Response) {
    const models = await prisma.vehicleModel.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, models);
  }

  /** GET /vehicle-models/:id */
  static async getById(req: Request, res: Response) {
    const id = req.params.id as string;
    const model = await prisma.vehicleModel.findUnique({
      where: { id },
    });
    if (!model) throw new NotFoundError('VehicleModel');
    return ok(res, model);
  }

  /** DELETE /vehicle-models/:id */
  static async remove(req: Request, res: Response) {
    const id = req.params.id as string;
    const exists = await prisma.vehicleModel.findUnique({ where: { id } });
    if (!exists) throw new NotFoundError('VehicleModel');
    await prisma.vehicleModel.delete({ where: { id } });
    return ok(res, { deleted: true });
  }
}
