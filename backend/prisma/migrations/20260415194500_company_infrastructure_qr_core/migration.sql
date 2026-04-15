-- Company Infrastructure & QR Core

CREATE TYPE "ActiveTripStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
CREATE TYPE "PassengerRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "users"
  ADD COLUMN "licenseClass" TEXT,
  ADD COLUMN "address" TEXT;

ALTER TABLE "vehicles"
  ADD COLUMN "clientId" TEXT,
  ADD COLUMN "publicAccessId" TEXT NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN "qrDownloadUrl" TEXT;

CREATE UNIQUE INDEX "vehicles_publicAccessId_key" ON "vehicles"("publicAccessId");
CREATE INDEX "vehicles_clientId_idx" ON "vehicles"("clientId");

ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "active_trips" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "routeId" TEXT,
  "status" "ActiveTripStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "name" TEXT NOT NULL,
  "isDirectionForward" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "active_trips_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "active_trips_tenantId_status_createdAt_idx" ON "active_trips"("tenantId", "status", "createdAt");
CREATE INDEX "active_trips_vehicleId_status_idx" ON "active_trips"("vehicleId", "status");
CREATE INDEX "active_trips_driverId_status_idx" ON "active_trips"("driverId", "status");

ALTER TABLE "active_trips"
  ADD CONSTRAINT "active_trips_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "active_trips"
  ADD CONSTRAINT "active_trips_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "active_trips"
  ADD CONSTRAINT "active_trips_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "active_trips"
  ADD CONSTRAINT "active_trips_routeId_fkey"
  FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "passenger_requests" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "passengerName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "status" "PassengerRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "passenger_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "passenger_requests_tripId_status_createdAt_idx" ON "passenger_requests"("tripId", "status", "createdAt");

ALTER TABLE "passenger_requests"
  ADD CONSTRAINT "passenger_requests_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "active_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
