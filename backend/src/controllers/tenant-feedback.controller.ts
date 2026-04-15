import { Request, Response } from 'express';
import { FeedbackSource } from '@prisma/client';
import prisma from '../lib/prisma';
import { BadRequestError } from '../utils/errors';
import { ok } from '../utils/response';

const VALID_SOURCES = Object.values(FeedbackSource);

export class TenantFeedbackController {
  static async list(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const sourceRaw = req.query.source as string | undefined;

    let source: FeedbackSource | undefined;
    if (sourceRaw) {
      if (!VALID_SOURCES.includes(sourceRaw as FeedbackSource)) {
        throw new BadRequestError('Geçersiz source filtresi');
      }
      source = sourceRaw as FeedbackSource;
    }

    const feedbacks = await prisma.feedback.findMany({
      where: {
        tenantId,
        ...(source && { source }),
      },
      include: {
        vehicle: {
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
            publicQrToken: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok(res, feedbacks);
  }
}
