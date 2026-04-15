CREATE TABLE "clients" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "taxNumber" TEXT NOT NULL,
  "taxOffice" TEXT NOT NULL,
  "invoiceAddress" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "users" ADD COLUMN "clientId" TEXT;
ALTER TABLE "routes" ADD COLUMN "clientId" TEXT;
ALTER TABLE "invoices" ADD COLUMN "clientId" TEXT;
ALTER TABLE "invoices" ALTER COLUMN "tenantId" DROP NOT NULL;

CREATE INDEX "clients_tenantId_idx" ON "clients"("tenantId");
CREATE INDEX "clients_tenantId_name_idx" ON "clients"("tenantId", "name");
CREATE INDEX "users_clientId_idx" ON "users"("clientId");
CREATE INDEX "routes_clientId_idx" ON "routes"("clientId");
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");

ALTER TABLE "clients" ADD CONSTRAINT "clients_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "routes" ADD CONSTRAINT "routes_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;