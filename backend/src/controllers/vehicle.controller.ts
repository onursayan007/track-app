import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { ok, created, noContent } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { VehicleStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import prisma from '../lib/prisma';

/**
 * Vehicle Controller — all methods trust that `req.tenantScope`
 * has been set by the tenant-guard middleware.
 */
export class VehicleController {
  /** GET  /vehicles */
  static async list(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { status, search } = req.query as { status?: VehicleStatus; search?: string };
    const vehicles = await VehicleService.findAll(tenantId, { status, search });
    return ok(res, vehicles);
  }

  /** GET  /vehicles/:id */
  static async getById(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const vehicle = await VehicleService.findById(tenantId, req.params.id as string);
    return ok(res, vehicle);
  }

  /** POST /vehicles */
  static async create(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const vehicle = await VehicleService.create(tenantId, req.body);
    return created(res, vehicle);
  }

  /** PUT  /vehicles/:id */
  static async update(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const vehicle = await VehicleService.update(tenantId, req.params.id as string, req.body);
    return ok(res, vehicle);
  }

  /** DELETE /vehicles/:id */
  static async remove(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    await VehicleService.delete(tenantId, req.params.id as string);
    return noContent(res);
  }

  /** GET /vehicles/stats */
  static async stats(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const counts = await VehicleService.countByTenant(tenantId);
    return ok(res, counts);
  }

  /** GET /tenant/vehicles/:id/qr-pdf */
  static async downloadQrPdf(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const vehicleId = req.params.id as string;
    const vehicle = await VehicleService.findById(tenantId, vehicleId);

    if (!vehicle.publicAccessId) {
      throw new BadRequestError('Vehicle has no public access id');
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const publicUrl = `${protocol}://${host}/api/v1/public/vehicle/${vehicle.publicAccessId}`;
    const qrDownloadUrl = `${protocol}://${host}/api/v1/tenant/vehicles/${vehicle.id}/qr-pdf`;

    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { qrDownloadUrl },
    });

    const qrDataUrl = await QRCode.toDataURL(publicUrl, {
      width: 900,
      margin: 1,
      errorCorrectionLevel: 'H',
    });
    const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

    const fileName = `${vehicle.plate.replace(/\s+/g, '_')}_QR.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    const qrSize = 320;
    const qrX = (doc.page.width - qrSize) / 2;
    const qrY = 160;

    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0b1120');
    doc.fillColor('#ffffff');
    doc.roundedRect(qrX - 26, qrY - 26, qrSize + 52, qrSize + 52, 16).fill('#111827');
    doc.image(qrBuffer, qrX, qrY, { fit: [qrSize, qrSize], align: 'center', valign: 'center' });

    doc.fillColor('#e5e7eb').font('Helvetica-Bold').fontSize(20).text('Servisinizi takip etmek için tarayın', 50, qrY + qrSize + 55, {
      align: 'center',
      width: doc.page.width - 100,
    });

    doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(16).text(vehicle.plate, 50, qrY + qrSize + 95, {
      align: 'center',
      width: doc.page.width - 100,
    });

    doc.end();
  }
}