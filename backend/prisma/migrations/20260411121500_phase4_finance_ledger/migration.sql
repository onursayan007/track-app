-- AlterTable
ALTER TABLE "routes" ADD COLUMN "monthlyRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "vehicle_records" ALTER COLUMN "costAmount" SET DEFAULT 0;
UPDATE "vehicle_records" SET "costAmount" = 0 WHERE "costAmount" IS NULL;
ALTER TABLE "vehicle_records" ALTER COLUMN "costAmount" SET NOT NULL;

-- AlterTable
ALTER TABLE "financial_transactions" ADD COLUMN "relatedRecordId" TEXT;
UPDATE "financial_transactions" SET "description" = '' WHERE "description" IS NULL;
ALTER TABLE "financial_transactions" ALTER COLUMN "description" SET NOT NULL;
