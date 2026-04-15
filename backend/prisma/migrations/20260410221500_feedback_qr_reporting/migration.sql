-- Ensure UUID generator exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "FeedbackSource" AS ENUM ('INTERNAL_APP', 'EXTERNAL_QR');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'RESOLVED');

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "publicQrToken" TEXT;
ALTER TABLE "vehicles" ALTER COLUMN "publicQrToken" SET DEFAULT gen_random_uuid()::text;
UPDATE "vehicles" SET "publicQrToken" = gen_random_uuid()::text WHERE "publicQrToken" IS NULL;
ALTER TABLE "vehicles" ALTER COLUMN "publicQrToken" SET NOT NULL;

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "source" "FeedbackSource" NOT NULL DEFAULT 'INTERNAL_APP',
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaExpiresAt" TIMESTAMP(3),
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_publicQrToken_key" ON "vehicles"("publicQrToken");

-- CreateIndex
CREATE INDEX "feedbacks_tenantId_source_createdAt_idx" ON "feedbacks"("tenantId", "source", "createdAt");

-- CreateIndex
CREATE INDEX "feedbacks_vehicleId_createdAt_idx" ON "feedbacks"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "feedbacks_driverId_idx" ON "feedbacks"("driverId");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
