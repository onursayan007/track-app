// ════════════════════════════════════════════════════════════════════
// Prisma Seed Script — Fleet Tracking B2B SaaS
// Run: npx prisma db seed   (or: ts-node prisma/seed.ts)
// ════════════════════════════════════════════════════════════════════

import { PrismaClient, UserRole, HardwareType, VehicleStatus, RouteType, RouteStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

async function main() {
  console.log('🌱 Seeding database…');

  // ─── Clean slate ────────────────────────────────────────────────
  await prisma.tenantMenu.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.vehicleModel.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // ─── Tenants ────────────────────────────────────────────────────
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'Antalya VIP Transfer',
      subscriptionPlan: 'PRO',
      isActive: true,
    },
  });

  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Bodrum Shuttle Co.',
      subscriptionPlan: 'BUSINESS',
      isActive: true,
    },
  });

  console.log(`   ✔ Tenants: ${tenantA.name}, ${tenantB.name}`);

  // ─── Users ──────────────────────────────────────────────────────
  const pw = await hashPassword('password123');

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@servisimgeliyor.com',
      passwordHash: pw,
      name: 'Platform Super Admin',
      role: UserRole.SUPER_ADMIN,
      tenantId: null,           // platform-level, no tenant
    },
  });

  const tenantAdminA = await prisma.user.create({
    data: {
      email: 'admin@antalya-vip.com',
      passwordHash: pw,
      name: 'Ahmet Yılmaz',
      phone: '+905551234567',
      role: UserRole.TENANT_ADMIN,
      tenantId: tenantA.id,
    },
  });

  const driverA1 = await prisma.user.create({
    data: {
      email: 'driver1@antalya-vip.com',
      passwordHash: pw,
      name: 'Mehmet Demir',
      phone: '+905559876543',
      role: UserRole.DRIVER,
      tenantId: tenantA.id,
    },
  });

  const driverA2 = await prisma.user.create({
    data: {
      email: 'driver2@antalya-vip.com',
      passwordHash: pw,
      name: 'Ali Kaya',
      phone: '+905553456789',
      role: UserRole.DRIVER,
      tenantId: tenantA.id,
    },
  });

  const passengerA1 = await prisma.user.create({
    data: {
      email: 'passenger@antalya-vip.com',
      passwordHash: pw,
      name: 'Zeynep Öztürk',
      role: UserRole.PASSENGER,
      tenantId: tenantA.id,
    },
  });

  const tenantAdminB = await prisma.user.create({
    data: {
      email: 'admin@bodrum-shuttle.com',
      passwordHash: pw,
      name: 'Canan Aksoy',
      phone: '+905557654321',
      role: UserRole.TENANT_ADMIN,
      tenantId: tenantB.id,
    },
  });

  const driverB1 = await prisma.user.create({
    data: {
      email: 'driver1@bodrum-shuttle.com',
      passwordHash: pw,
      name: 'Emre Çelik',
      phone: '+905552345678',
      role: UserRole.DRIVER,
      tenantId: tenantB.id,
    },
  });

  console.log(`   ✔ Users: 7 created (1 SUPER_ADMIN, 2 TENANT_ADMIN, 3 DRIVER, 1 PASSENGER)`);

  // ─── Vehicle Models (catalog) ──────────────────────────────────────
  const modelSprinter = await prisma.vehicleModel.create({
    data: { brand: 'Mercedes-Benz', modelName: 'Sprinter 516 CDI', photoUrl: '/uploads/seed-sprinter.jpg' },
  });
  const modelTransit = await prisma.vehicleModel.create({
    data: { brand: 'Ford', modelName: 'Transit Custom', photoUrl: '/uploads/seed-transit.jpg' },
  });
  const modelCrafter = await prisma.vehicleModel.create({
    data: { brand: 'Volkswagen', modelName: 'Crafter 35', photoUrl: '/uploads/seed-crafter.jpg' },
  });
  const modelCoaster = await prisma.vehicleModel.create({
    data: { brand: 'Toyota', modelName: 'Coaster Deluxe', photoUrl: '/uploads/seed-coaster.jpg' },
  });
  const modelDaily = await prisma.vehicleModel.create({
    data: { brand: 'Iveco', modelName: 'Daily Minibus', photoUrl: '/uploads/seed-daily.jpg' },
  });

  console.log(`   ✔ Vehicle Models: 5 created`);

  // ─── Vehicles ───────────────────────────────────────────────────
  const vehicleA1 = await prisma.vehicle.create({
    data: {
      tenantId: tenantA.id,
      plate: '07 ABC 123',
      vin: 'WBA3A5C55CF256789',
      hardwareType: HardwareType.ARVENTO,
      deviceId: 'ARV-001-ANT',
      brand: 'Mercedes-Benz',
      model: 'Sprinter 516',
      year: 2023,
      capacity: 16,
      status: VehicleStatus.ACTIVE,
      vehicleModelId: modelSprinter.id,
    },
  });

  const vehicleA2 = await prisma.vehicle.create({
    data: {
      tenantId: tenantA.id,
      plate: '07 DEF 456',
      vin: 'WDB9066331S123456',
      hardwareType: HardwareType.UDP,
      deviceId: 'UDP-002-ANT',
      brand: 'Ford',
      model: 'Transit Custom',
      year: 2024,
      capacity: 9,
      status: VehicleStatus.ACTIVE,
      vehicleModelId: modelTransit.id,
    },
  });

  const vehicleA3 = await prisma.vehicle.create({
    data: {
      tenantId: tenantA.id,
      plate: '07 GHI 789',
      vin: 'WVWZZZ3CZWE456789',
      hardwareType: HardwareType.APP_ONLY,
      deviceId: null,
      brand: 'Volkswagen',
      model: 'Crafter',
      year: 2022,
      capacity: 20,
      status: VehicleStatus.MAINTENANCE,
      vehicleModelId: modelCrafter.id,
    },
  });

  const vehicleB1 = await prisma.vehicle.create({
    data: {
      tenantId: tenantB.id,
      plate: '48 JKL 321',
      vin: 'JTDKN3DU5A0123456',
      hardwareType: HardwareType.ARVENTO,
      deviceId: 'ARV-001-BOD',
      brand: 'Toyota',
      model: 'Coaster',
      year: 2023,
      capacity: 30,
      status: VehicleStatus.ACTIVE,
      vehicleModelId: modelCoaster.id,
    },
  });

  const vehicleB2 = await prisma.vehicle.create({
    data: {
      tenantId: tenantB.id,
      plate: '48 MNO 654',
      vin: 'SALLAAA148A123456',
      hardwareType: HardwareType.APP_ONLY,
      deviceId: null,
      brand: 'Iveco',
      model: 'Daily Minibus',
      year: 2024,
      capacity: 14,
      status: VehicleStatus.ACTIVE,
      vehicleModelId: modelDaily.id,
    },
  });

  console.log(`   ✔ Vehicles: 5 created (3 Tenant A, 2 Tenant B)`);

  // ─── Routes + Stops ─────────────────────────────────────────────
  const routeA1 = await prisma.route.create({
    data: {
      tenantId: tenantA.id,
      vehicleId: vehicleA1.id,
      driverId: driverA1.id,
      name: 'Morning Airport Shuttle — Terminal 1',
      type: RouteType.SHUTTLE,
      status: RouteStatus.ACTIVE,
      stops: {
        create: [
          { name: 'Lara Hotels Hub',      latitude: 36.8600, longitude: 30.7100, orderIndex: 1 },
          { name: 'Antalya Bus Terminal',  latitude: 36.8850, longitude: 30.6900, orderIndex: 2 },
          { name: 'Airport Terminal 1',    latitude: 36.8990, longitude: 30.8005, orderIndex: 3 },
        ],
      },
    },
  });

  const routeA2 = await prisma.route.create({
    data: {
      tenantId: tenantA.id,
      vehicleId: vehicleA2.id,
      driverId: driverA2.id,
      name: 'Corporate Campus Route — TechPark',
      type: RouteType.CORPORATE,
      status: RouteStatus.DRAFT,
      stops: {
        create: [
          { name: 'Konyaaltı Residence',   latitude: 36.8700, longitude: 30.6350, orderIndex: 1 },
          { name: 'Akdeniz University',     latitude: 36.8930, longitude: 30.6400, orderIndex: 2 },
          { name: 'TechPark Antalya',       latitude: 36.9000, longitude: 30.6520, orderIndex: 3 },
          { name: 'Kepez Industrial Zone',  latitude: 36.9340, longitude: 30.6600, orderIndex: 4 },
        ],
      },
    },
  });

  const routeB1 = await prisma.route.create({
    data: {
      tenantId: tenantB.id,
      vehicleId: vehicleB1.id,
      driverId: driverB1.id,
      name: 'Bodrum Peninsula Tour',
      type: RouteType.TRANSFER,
      status: RouteStatus.ACTIVE,
      stops: {
        create: [
          { name: 'Bodrum Marina',         latitude: 37.0340, longitude: 27.4290, orderIndex: 1 },
          { name: 'Gümbet Beach',          latitude: 37.0350, longitude: 27.4100, orderIndex: 2 },
          { name: 'Bitez Bay',             latitude: 37.0360, longitude: 27.3900, orderIndex: 3 },
          { name: 'Türkbükü Harbor',       latitude: 37.0920, longitude: 27.4050, orderIndex: 4 },
          { name: 'Yalıkavak Marina',      latitude: 37.1050, longitude: 27.2900, orderIndex: 5 },
        ],
      },
    },
  });

  const routeB2 = await prisma.route.create({
    data: {
      tenantId: tenantB.id,
      vehicleId: vehicleB2.id,
      driverId: null,
      name: 'School Bus — Bodrum International School',
      type: RouteType.SCHOOL,
      status: RouteStatus.DRAFT,
      stops: {
        create: [
          { name: 'Ortakent Village',              latitude: 37.0450, longitude: 27.3500, orderIndex: 1 },
          { name: 'Bodrum International School',   latitude: 37.0380, longitude: 27.4200, orderIndex: 2 },
        ],
      },
    },
  });

  console.log(`   ✔ Routes: 4 created with ${3 + 4 + 5 + 2} stops total`);

  // ─── Tenant Menus ─────────────────────────────────────────────────
  const defaultMenus = [
    { label: 'Canlı Operasyon',     route: '/company/dashboard',    icon: 'map',      sortOrder: 0 },
    { label: 'Tur ve Planlama',     route: '/company/planning',     icon: 'calendar',  sortOrder: 1 },
    { label: 'Rotalar',             route: '/company/routes',       icon: 'location',  sortOrder: 2 },
    { label: 'Filo Yönetimi',       route: '/company/fleet',        icon: 'truck',     sortOrder: 3 },
    { label: 'Şoför Yönetimi',      route: '/company/drivers',      icon: 'users',     sortOrder: 4 },
    { label: 'Yolcu Listesi',       route: '/company/passengers',   icon: 'users',     sortOrder: 5 },
    { label: 'Finans ve Raporlar',   route: '/company/reports',      icon: 'chart',     sortOrder: 6 },
    { label: 'Bakım ve Evrak',       route: '/company/maintenance',  icon: 'wrench',    sortOrder: 7 },
    { label: 'Geri Bildirimler',     route: '/company/feedback',     icon: 'chat',      sortOrder: 8 },
    { label: 'İhlal ve Alarmlar',     route: '/company/alarms',       icon: 'bell',      sortOrder: 9 },
    { label: 'Ayarlar',             route: '/company/settings',     icon: 'cog',       sortOrder: 99 },
  ];

  for (const tenant of [tenantA, tenantB]) {
    for (const m of defaultMenus) {
      await prisma.tenantMenu.create({
        data: { tenantId: tenant.id, ...m, isActive: true },
      });
    }
  }

  console.log(`   ✔ Tenant Menus: ${defaultMenus.length * 2} created (${defaultMenus.length} per tenant)`);

  // ─── Summary ────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('  Test credentials (all passwords: password123):');
  console.log('');
  console.log('  SUPER_ADMIN   → admin@servisimgeliyor.com');
  console.log('  TENANT_ADMIN  → admin@antalya-vip.com');
  console.log('  TENANT_ADMIN  → admin@bodrum-shuttle.com');
  console.log('  DRIVER        → driver1@antalya-vip.com');
  console.log('  DRIVER        → driver2@antalya-vip.com');
  console.log('  DRIVER        → driver1@bodrum-shuttle.com');
  console.log('  PASSENGER     → passenger@antalya-vip.com');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
