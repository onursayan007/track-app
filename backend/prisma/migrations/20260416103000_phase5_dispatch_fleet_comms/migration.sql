-- Phase 5: Dispatch & Fleet Communications

CREATE TYPE "DispatchPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
CREATE TYPE "CommsTargetType" AS ENUM ('ALL', 'DRIVERS', 'PASSENGERS', 'TENANT_ADMINS', 'VEHICLE_PLATE');
CREATE TYPE "SOSStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE "ErrorReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');

CREATE TABLE "tenant_announcements" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "AnnouncementType" NOT NULL DEFAULT 'INFO',
  "priority" "DispatchPriority" NOT NULL DEFAULT 'NORMAL',
  "targetType" "CommsTargetType" NOT NULL DEFAULT 'ALL',
  "targetValue" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tenant_announcements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "announcement_read_logs" (
  "id" TEXT NOT NULL,
  "announcementId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "announcement_read_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sos_alerts" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "driverId" TEXT,
  "vehicleId" TEXT,
  "plateSnapshot" TEXT,
  "message" TEXT,
  "location" JSONB,
  "status" "SOSStatus" NOT NULL DEFAULT 'OPEN',
  "resolvedAt" TIMESTAMP(3),
  "resolvedByUserId" TEXT,
  "isMock" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sos_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "error_reports" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "reporterUserId" TEXT,
  "subject" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "source" TEXT,
  "status" "ErrorReportStatus" NOT NULL DEFAULT 'OPEN',
  "resolvedAt" TIMESTAMP(3),
  "resolvedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "error_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tenant_announcements_tenantId_isActive_createdAt_idx" ON "tenant_announcements"("tenantId", "isActive", "createdAt");
CREATE UNIQUE INDEX "announcement_read_logs_announcementId_userId_key" ON "announcement_read_logs"("announcementId", "userId");
CREATE INDEX "announcement_read_logs_userId_readAt_idx" ON "announcement_read_logs"("userId", "readAt");
CREATE INDEX "sos_alerts_tenantId_status_createdAt_idx" ON "sos_alerts"("tenantId", "status", "createdAt");
CREATE INDEX "sos_alerts_driverId_idx" ON "sos_alerts"("driverId");
CREATE INDEX "sos_alerts_vehicleId_idx" ON "sos_alerts"("vehicleId");
CREATE INDEX "error_reports_tenantId_createdAt_idx" ON "error_reports"("tenantId", "createdAt");
CREATE INDEX "error_reports_status_createdAt_idx" ON "error_reports"("status", "createdAt");

ALTER TABLE "tenant_announcements"
  ADD CONSTRAINT "tenant_announcements_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_announcements"
  ADD CONSTRAINT "tenant_announcements_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "announcement_read_logs"
  ADD CONSTRAINT "announcement_read_logs_announcementId_fkey"
  FOREIGN KEY ("announcementId") REFERENCES "tenant_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "announcement_read_logs"
  ADD CONSTRAINT "announcement_read_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sos_alerts"
  ADD CONSTRAINT "sos_alerts_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sos_alerts"
  ADD CONSTRAINT "sos_alerts_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sos_alerts"
  ADD CONSTRAINT "sos_alerts_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sos_alerts"
  ADD CONSTRAINT "sos_alerts_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "error_reports"
  ADD CONSTRAINT "error_reports_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "error_reports"
  ADD CONSTRAINT "error_reports_reporterUserId_fkey"
  FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "error_reports"
  ADD CONSTRAINT "error_reports_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
