import { Request, Response } from 'express';
import { VehicleRecordType } from '@prisma/client';
import prisma from '../lib/prisma';
import { BadRequestError } from '../utils/errors';
import { created, ok } from '../utils/response';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import archiver from 'archiver';
import { OcrService } from '../services/OcrService';

const VALID_TYPES = Object.values(VehicleRecordType);

const RECORD_TYPE_CATEGORY_MAP: Record<VehicleRecordType, string> = {
  TRAFIK_SIGORTASI: 'SİGORTA',
  KASKO: 'SİGORTA',
  MUAYENE: 'MUAYENE',
  PERIYODIK_BAKIM: 'BAKIM',
  GIDER_FISI: 'YAKIT',
  DIGER: 'DİĞER',
};

export class VehicleRecordController {
  static async list(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const recordTypeRaw = req.query.recordType as string | undefined;

    let recordType: VehicleRecordType | undefined;
    if (recordTypeRaw) {
      if (!VALID_TYPES.includes(recordTypeRaw as VehicleRecordType)) {
        throw new BadRequestError('Geçersiz recordType');
      }
      recordType = recordTypeRaw as VehicleRecordType;
    }

    const records = await prisma.vehicleRecord.findMany({
      where: {
        tenantId,
        ...(recordType && { recordType }),
      },
      include: {
        vehicle: {
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
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

    return ok(res, records);
  }

  static async create(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const {
      vehicleId,
      recordType,
      expiryDate,
      currentKm,
      nextMaintenanceKm,
      description,
    } = req.body as {
      vehicleId?: string;
      recordType?: string;
      expiryDate?: string;
      currentKm?: string | number;
      nextMaintenanceKm?: string | number;
      description?: string;
    };

    if (!vehicleId) throw new BadRequestError('vehicleId zorunludur');
    if (!recordType) throw new BadRequestError('recordType zorunludur');
    if (!VALID_TYPES.includes(recordType as VehicleRecordType)) {
      throw new BadRequestError('Geçersiz recordType');
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
      select: { id: true, plate: true },
    });
    if (!vehicle) throw new BadRequestError('Araç bulunamadı');

    const parsedCurrentKm = currentKm !== undefined && currentKm !== '' ? Number(currentKm) : null;
    const parsedNextMaintenanceKm = nextMaintenanceKm !== undefined && nextMaintenanceKm !== '' ? Number(nextMaintenanceKm) : null;

    if (parsedCurrentKm !== null && !Number.isFinite(parsedCurrentKm)) {
      throw new BadRequestError('currentKm sayısal olmalıdır');
    }
    if (parsedNextMaintenanceKm !== null && !Number.isFinite(parsedNextMaintenanceKm)) {
      throw new BadRequestError('nextMaintenanceKm sayısal olmalıdır');
    }
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      throw new BadRequestError('Dosya yüklemek zorunludur');
    }

    const fileBuffer = await fsp.readFile(file.path);
    const { extractedAmount } = await OcrService.extractInvoiceData(fileBuffer);
    const fileUrl = `/uploads/${file.filename}`;

    const record = await prisma.vehicleRecord.create({
      data: {
        tenantId,
        vehicleId,
        driverId: null,
        recordType: recordType as VehicleRecordType,
        costAmount: extractedAmount,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        currentKm: parsedCurrentKm,
        nextMaintenanceKm: parsedNextMaintenanceKm,
        fileUrl,
        description: description || null,
      },
      include: {
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
    });

    if (extractedAmount > 0) {
      await prisma.financialTransaction.create({
        data: {
          tenantId,
          type: 'EXPENSE',
          category: RECORD_TYPE_CATEGORY_MAP[recordType as VehicleRecordType],
          amount: extractedAmount,
          date: new Date(),
          description: `${vehicle.plate} - ${recordType} Faturası`,
          relatedRecordId: record.id,
        },
      });
    }

    return created(res, record);
  }

  static async getLastMaintenance(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const vehicleId = req.params.vehicleId as string;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
      select: { id: true },
    });
    if (!vehicle) throw new BadRequestError('Araç bulunamadı');

    const record = await prisma.vehicleRecord.findFirst({
      where: {
        tenantId,
        vehicleId,
        recordType: 'PERIYODIK_BAKIM',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { id: true, plate: true } },
        driver: { select: { id: true, name: true } },
      },
    });

    return ok(res, record ?? null);
  }

  static async downloadIncomingZip(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

    const records = await prisma.vehicleRecord.findMany({
      where: {
        tenantId,
        driverId: { not: null },
        fileUrl: { not: null },
        recordType: { in: ['GIDER_FISI', 'DIGER'] },
      },
      include: {
        vehicle: { select: { plate: true } },
        driver: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const archive = archiver('zip', { zlib: { level: 9 } });
    const fileName = `gelen-evraklar-${new Date().toISOString().slice(0, 10)}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    archive.on('error', (error) => {
      throw error;
    });

    archive.pipe(res);

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    let addedCount = 0;

    for (const record of records) {
      const rawUrl = record.fileUrl || '';
      const basename = path.basename(rawUrl);
      const absPath = path.join(uploadsDir, basename);
      if (!basename || !fs.existsSync(absPath)) continue;

      const ext = path.extname(basename);
      const safePlate = (record.vehicle?.plate || 'ARAC').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeDriver = (record.driver?.name || 'SOFOR').replace(/[^a-zA-Z0-9_-]/g, '_');
      const archiveEntryName = `${safePlate}_${safeDriver}_${record.id}${ext}`;

      archive.file(absPath, { name: archiveEntryName });
      addedCount += 1;
    }

    if (addedCount === 0) {
      archive.append('Bu tenant için indirilebilir gelen evrak dosyası bulunamadı.', { name: 'README.txt' });
    }

    await archive.finalize();
  }
}
