-- CreateEnum
CREATE TYPE "VehicleRecordType" AS ENUM ('TRAFIK_SIGORTASI', 'KASKO', 'MUAYENE', 'PERIYODIK_BAKIM', 'GIDER_FISI', 'DIGER');

-- CreateTable
CREATE TABLE "vehicle_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "recordType" "VehicleRecordType" NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "currentKm" INTEGER,
    "nextMaintenanceKm" INTEGER,
    "fileUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_records_tenantId_recordType_idx" ON "vehicle_records"("tenantId", "recordType");

-- CreateIndex
CREATE INDEX "vehicle_records_vehicleId_createdAt_idx" ON "vehicle_records"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "vehicle_records_driverId_idx" ON "vehicle_records"("driverId");

-- AddForeignKey
ALTER TABLE "vehicle_records" ADD CONSTRAINT "vehicle_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_records" ADD CONSTRAINT "vehicle_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_records" ADD CONSTRAINT "vehicle_records_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
