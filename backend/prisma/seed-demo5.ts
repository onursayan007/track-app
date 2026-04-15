import {
  AlertSeverity,
  AnnouncementType,
  CommsTargetType,
  DispatchPriority,
  ErrorReportStatus,
  FeedbackSource,
  FeedbackStatus,
  HardwareType,
  InvoiceStatus,
  InvoiceType,
  PrismaClient,
  RouteStatus,
  RouteType,
  SOSStatus,
  TenantStatus,
  UserRole,
  VehicleRecordType,
  VehicleStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data (5 records per major table)...');

  const now = new Date();
  const pw = await bcrypt.hash('password123', 12);

  const plans = [
    { id: 'seed-plan-1', name: 'BASIC', pricePerVehicle: 450 },
    { id: 'seed-plan-2', name: 'STANDARD', pricePerVehicle: 650 },
    { id: 'seed-plan-3', name: 'PRO', pricePerVehicle: 850 },
    { id: 'seed-plan-4', name: 'ENTERPRISE', pricePerVehicle: 1200 },
    { id: 'seed-plan-5', name: 'ULTRA', pricePerVehicle: 1600 },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {
        pricePerVehicle: plan.pricePerVehicle,
        isActive: true,
      },
      create: {
        id: plan.id,
        name: plan.name,
        pricePerVehicle: plan.pricePerVehicle,
        minVehicles: 1,
        maxVehicles: 5000,
        isActive: true,
      },
    });
  }

  const tenants = [1, 2, 3, 4, 5].map((n) => ({
    id: `seed-tenant-${n}`,
    name: `Demo Tenant ${n}`,
    planId: plans[n - 1].id,
  }));

  for (const [idx, tenant] of tenants.entries()) {
    await prisma.tenant.upsert({
      where: { id: tenant.id },
      update: {
        name: tenant.name,
        status: TenantStatus.ACTIVE,
        isActive: true,
        planId: tenant.planId,
        subscriptionPlan: plans[idx].name,
        legalName: `${tenant.name} A.Ş.`,
        taxId: `100000000${idx + 1}`,
        taxOffice: 'İstanbul',
        billingAddress: `Merkez Mah. Test Sok. No:${idx + 10}`,
        contactPhone: `+90555000000${idx + 1}`,
      },
      create: {
        id: tenant.id,
        name: tenant.name,
        status: TenantStatus.ACTIVE,
        isActive: true,
        planId: tenant.planId,
        subscriptionPlan: plans[idx].name,
        legalName: `${tenant.name} A.Ş.`,
        taxId: `100000000${idx + 1}`,
        taxOffice: 'İstanbul',
        billingAddress: `Merkez Mah. Test Sok. No:${idx + 10}`,
        contactPhone: `+90555000000${idx + 1}`,
      },
    });
  }

  const vehicleModels = [
    { id: 'seed-vm-1', brand: 'Mercedes', modelName: 'Sprinter', photoUrl: '/uploads/demo-vm-1.jpg' },
    { id: 'seed-vm-2', brand: 'Ford', modelName: 'Transit', photoUrl: '/uploads/demo-vm-2.jpg' },
    { id: 'seed-vm-3', brand: 'VW', modelName: 'Crafter', photoUrl: '/uploads/demo-vm-3.jpg' },
    { id: 'seed-vm-4', brand: 'Iveco', modelName: 'Daily', photoUrl: '/uploads/demo-vm-4.jpg' },
    { id: 'seed-vm-5', brand: 'Toyota', modelName: 'Coaster', photoUrl: '/uploads/demo-vm-5.jpg' },
  ];

  for (const model of vehicleModels) {
    await prisma.vehicleModel.upsert({
      where: { id: model.id },
      update: model,
      create: model,
    });
  }

  const primaryTenantId = tenants[0].id;

  const clients = [1, 2, 3, 4, 5].map((n) => ({
    id: `seed-client-${n}`,
    tenantId: primaryTenantId,
    name: `Demo Kurumsal Müşteri ${n}`,
    taxNumber: `200000000${n}`,
    taxOffice: 'Mecidiyeköy',
    invoiceAddress: `Levent Mah. Kurumsal Cad. No:${n}`,
    contactEmail: `client${n}@demo-kurumsal.com`,
    monthlyAllowance: 15000 * n,
  }));

  for (const client of clients) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: {
        name: client.name,
        taxNumber: client.taxNumber,
        taxOffice: client.taxOffice,
        invoiceAddress: client.invoiceAddress,
        contactEmail: client.contactEmail,
        monthlyAllowance: client.monthlyAllowance,
      } as any,
      create: client as any,
    });
  }

  const users = [
    { id: 'seed-user-1', email: 'tenant-admin@demo1.com', role: UserRole.TENANT_ADMIN, name: 'Demo Admin', tenantId: primaryTenantId, phone: '+905551111111', clientId: null },
    { id: 'seed-user-2', email: 'tenant-operator@demo1.com', role: UserRole.TENANT_OPERATOR, name: 'Demo Operatör', tenantId: primaryTenantId, phone: '+905552222222', clientId: null },
    { id: 'seed-user-3', email: 'driver1@demo1.com', role: UserRole.DRIVER, name: 'Demo Şoför 1', tenantId: primaryTenantId, phone: '+905553333333', clientId: null },
    { id: 'seed-user-4', email: 'driver2@demo1.com', role: UserRole.DRIVER, name: 'Demo Şoför 2', tenantId: primaryTenantId, phone: '+905554444444', clientId: null },
    { id: 'seed-user-5', email: 'passenger1@demo1.com', role: UserRole.PASSENGER, name: 'Demo Yolcu', tenantId: primaryTenantId, phone: '+905555555555', clientId: clients[0].id },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        phone: user.phone,
        tenantId: user.tenantId,
        clientId: user.clientId,
        passwordHash: pw,
        isActive: true,
      },
      create: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        clientId: user.clientId,
        passwordHash: pw,
        isActive: true,
      },
    });
  }

  const vehicles = [1, 2, 3, 4, 5].map((n) => ({
    id: `seed-vehicle-${n}`,
    tenantId: primaryTenantId,
    vehicleModelId: vehicleModels[n - 1].id,
    plate: `34 DEMO ${100 + n}`,
    vin: `VINDEMO000000000${n}`,
    hardwareType: n % 2 === 0 ? HardwareType.UDP : HardwareType.ARVENTO,
    deviceId: `DEMO-DEV-${n}`,
    brand: vehicleModels[n - 1].brand,
    model: vehicleModels[n - 1].modelName,
    year: 2020 + n,
    capacity: 10 + n,
    status: VehicleStatus.ACTIVE,
    driverId: n <= 2 ? users[n + 1].id : null,
  }));

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { plate: vehicle.plate },
      update: {
        tenantId: vehicle.tenantId,
        vehicleModelId: vehicle.vehicleModelId,
        vin: vehicle.vin,
        hardwareType: vehicle.hardwareType,
        deviceId: vehicle.deviceId,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        capacity: vehicle.capacity,
        status: vehicle.status,
        driverId: vehicle.driverId,
      },
      create: vehicle,
    });
  }

  const routes = [1, 2, 3, 4, 5].map((n) => ({
    id: `seed-route-${n}`,
    tenantId: primaryTenantId,
    clientId: clients[(n - 1) % clients.length].id,
    vehicleId: vehicles[(n - 1) % vehicles.length].id,
    driverId: n <= 2 ? users[n + 1].id : null,
    name: `Demo Rota ${n}`,
    type: n % 2 === 0 ? RouteType.CORPORATE : RouteType.SHUTTLE,
    monthlyRevenue: 10000 + n * 3500,
    status: RouteStatus.ACTIVE,
  }));

  for (const route of routes) {
    await prisma.route.upsert({
      where: { id: route.id },
      update: {
        tenantId: route.tenantId,
        clientId: route.clientId,
        vehicleId: route.vehicleId,
        driverId: route.driverId,
        name: route.name,
        type: route.type,
        monthlyRevenue: route.monthlyRevenue,
        status: route.status,
      },
      create: route,
    });
  }

  for (const route of routes) {
    for (let i = 1; i <= 5; i++) {
      const stopId = `seed-stop-${route.id}-${i}`;
      await prisma.routeStop.upsert({
        where: { id: stopId },
        update: {
          name: `Durak ${i}`,
          latitude: 41.0 + i / 100 + Number(route.id.slice(-1)) / 1000,
          longitude: 29.0 + i / 100 + Number(route.id.slice(-1)) / 1000,
          orderIndex: i,
        },
        create: {
          id: stopId,
          routeId: route.id,
          name: `Durak ${i}`,
          latitude: 41.0 + i / 100 + Number(route.id.slice(-1)) / 1000,
          longitude: 29.0 + i / 100 + Number(route.id.slice(-1)) / 1000,
          orderIndex: i,
        },
      });
    }
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.financialTransaction.upsert({
      where: { id: `seed-ft-${i}` },
      update: {
        tenantId: primaryTenantId,
        type: i % 2 === 0 ? 'EXPENSE' : 'INCOME',
        category: i % 2 === 0 ? 'OPERASYON_GIDER' : 'MUSTERI_TAHAKKUK',
        amount: i % 2 === 0 ? 2500 * i : 5000 * i,
        date: new Date(now.getFullYear(), now.getMonth(), i),
        description: `Demo finans hareketi ${i}`,
        relatedRecordId: routes[(i - 1) % routes.length].id,
      },
      create: {
        id: `seed-ft-${i}`,
        tenantId: primaryTenantId,
        type: i % 2 === 0 ? 'EXPENSE' : 'INCOME',
        category: i % 2 === 0 ? 'OPERASYON_GIDER' : 'MUSTERI_TAHAKKUK',
        amount: i % 2 === 0 ? 2500 * i : 5000 * i,
        date: new Date(now.getFullYear(), now.getMonth(), i),
        description: `Demo finans hareketi ${i}`,
        relatedRecordId: routes[(i - 1) % routes.length].id,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    const invoiceNo = `SEED-CINV-2026-${String(i).padStart(4, '0')}`;
    await prisma.invoice.upsert({
      where: { invoiceNo },
      update: {
        tenantId: primaryTenantId,
        clientId: clients[(i - 1) % clients.length].id,
        amount: 12000 + i * 1500,
        type: InvoiceType.RECURRING,
        status: i % 3 === 0 ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
        description: `Demo müşteri faturası ${i}`,
        issueDate: new Date(now.getFullYear(), now.getMonth(), i),
        dueDate: new Date(now.getFullYear(), now.getMonth(), 20 + i),
        paidAt: i % 3 === 0 ? new Date(now.getFullYear(), now.getMonth(), 15 + i) : null,
      },
      create: {
        id: `seed-invoice-${i}`,
        invoiceNo,
        tenantId: primaryTenantId,
        clientId: clients[(i - 1) % clients.length].id,
        amount: 12000 + i * 1500,
        type: InvoiceType.RECURRING,
        status: i % 3 === 0 ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
        description: `Demo müşteri faturası ${i}`,
        issueDate: new Date(now.getFullYear(), now.getMonth(), i),
        dueDate: new Date(now.getFullYear(), now.getMonth(), 20 + i),
        paidAt: i % 3 === 0 ? new Date(now.getFullYear(), now.getMonth(), 15 + i) : null,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.vehicleRecord.upsert({
      where: { id: `seed-vr-${i}` },
      update: {
        tenantId: primaryTenantId,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        driverId: i <= 2 ? users[i + 1].id : null,
        recordType: VehicleRecordType.PERIYODIK_BAKIM,
        costAmount: 1500 * i,
        description: `Demo bakım kaydı ${i}`,
      },
      create: {
        id: `seed-vr-${i}`,
        tenantId: primaryTenantId,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        driverId: i <= 2 ? users[i + 1].id : null,
        recordType: VehicleRecordType.PERIYODIK_BAKIM,
        costAmount: 1500 * i,
        description: `Demo bakım kaydı ${i}`,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.feedback.upsert({
      where: { id: `seed-feedback-${i}` },
      update: {
        tenantId: primaryTenantId,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        driverId: i <= 2 ? users[i + 1].id : users[2].id,
        source: FeedbackSource.EXTERNAL_QR,
        rating: 3 + (i % 2),
        message: `Demo geri bildirim ${i}`,
        status: FeedbackStatus.PENDING,
      },
      create: {
        id: `seed-feedback-${i}`,
        tenantId: primaryTenantId,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        driverId: i <= 2 ? users[i + 1].id : users[2].id,
        source: FeedbackSource.EXTERNAL_QR,
        rating: 3 + (i % 2),
        message: `Demo geri bildirim ${i}`,
        status: FeedbackStatus.PENDING,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.announcement.upsert({
      where: { id: `seed-ann-${i}` },
      update: {
        title: `Demo Duyuru ${i}`,
        message: `Bu bir demo duyuru içeriğidir (${i}).`,
        type: i % 2 === 0 ? AnnouncementType.WARNING : AnnouncementType.INFO,
        targetRoles: ['ALL'],
        isActive: true,
      },
      create: {
        id: `seed-ann-${i}`,
        title: `Demo Duyuru ${i}`,
        message: `Bu bir demo duyuru içeriğidir (${i}).`,
        type: i % 2 === 0 ? AnnouncementType.WARNING : AnnouncementType.INFO,
        targetRoles: ['ALL'],
        isActive: true,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.tenantAnnouncement.upsert({
      where: { id: `seed-tann-${i}` },
      update: {
        tenantId: primaryTenantId,
        createdByUserId: users[0].id,
        title: `Dispatch Duyuru ${i}`,
        message: `Demo dispatch duyuru içeriği ${i}.`,
        type: i % 2 === 0 ? AnnouncementType.WARNING : AnnouncementType.INFO,
        priority: i === 5 ? DispatchPriority.CRITICAL : i % 2 === 0 ? DispatchPriority.HIGH : DispatchPriority.NORMAL,
        targetType: i % 3 === 0 ? CommsTargetType.DRIVERS : CommsTargetType.ALL,
        targetValue: null,
        isActive: true,
      },
      create: {
        id: `seed-tann-${i}`,
        tenantId: primaryTenantId,
        createdByUserId: users[0].id,
        title: `Dispatch Duyuru ${i}`,
        message: `Demo dispatch duyuru içeriği ${i}.`,
        type: i % 2 === 0 ? AnnouncementType.WARNING : AnnouncementType.INFO,
        priority: i === 5 ? DispatchPriority.CRITICAL : i % 2 === 0 ? DispatchPriority.HIGH : DispatchPriority.NORMAL,
        targetType: i % 3 === 0 ? CommsTargetType.DRIVERS : CommsTargetType.ALL,
        targetValue: null,
        isActive: true,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.sOSAlert.upsert({
      where: { id: `seed-sos-${i}` },
      update: {
        tenantId: primaryTenantId,
        driverId: i <= 2 ? users[i + 1].id : users[2].id,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        plateSnapshot: vehicles[(i - 1) % vehicles.length].plate,
        message: `Demo SOS bildirimi ${i}`,
        location: { lat: 41.02 + i / 1000, lng: 28.98 + i / 1000 },
        status: i === 5 ? SOSStatus.RESOLVED : SOSStatus.OPEN,
        resolvedAt: i === 5 ? new Date(now.getFullYear(), now.getMonth(), 10 + i) : null,
        resolvedByUserId: i === 5 ? users[0].id : null,
        isMock: true,
      },
      create: {
        id: `seed-sos-${i}`,
        tenantId: primaryTenantId,
        driverId: i <= 2 ? users[i + 1].id : users[2].id,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        plateSnapshot: vehicles[(i - 1) % vehicles.length].plate,
        message: `Demo SOS bildirimi ${i}`,
        location: { lat: 41.02 + i / 1000, lng: 28.98 + i / 1000 },
        status: i === 5 ? SOSStatus.RESOLVED : SOSStatus.OPEN,
        resolvedAt: i === 5 ? new Date(now.getFullYear(), now.getMonth(), 10 + i) : null,
        resolvedByUserId: i === 5 ? users[0].id : null,
        isMock: true,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.errorReport.upsert({
      where: { id: `seed-er-${i}` },
      update: {
        tenantId: primaryTenantId,
        reporterUserId: users[1].id,
        subject: `Dispatch Hata Bildirimi ${i}`,
        details: `Demo hata açıklaması ${i}: bildirim teslim gecikmesi gözlemlendi.`,
        source: 'DISPATCH_CENTER',
        status: i === 5 ? ErrorReportStatus.RESOLVED : i % 2 === 0 ? ErrorReportStatus.IN_REVIEW : ErrorReportStatus.OPEN,
        resolvedAt: i === 5 ? new Date(now.getFullYear(), now.getMonth(), 12 + i) : null,
        resolvedByUserId: i === 5 ? users[0].id : null,
      },
      create: {
        id: `seed-er-${i}`,
        tenantId: primaryTenantId,
        reporterUserId: users[1].id,
        subject: `Dispatch Hata Bildirimi ${i}`,
        details: `Demo hata açıklaması ${i}: bildirim teslim gecikmesi gözlemlendi.`,
        source: 'DISPATCH_CENTER',
        status: i === 5 ? ErrorReportStatus.RESOLVED : i % 2 === 0 ? ErrorReportStatus.IN_REVIEW : ErrorReportStatus.OPEN,
        resolvedAt: i === 5 ? new Date(now.getFullYear(), now.getMonth(), 12 + i) : null,
        resolvedByUserId: i === 5 ? users[0].id : null,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.auditLog.upsert({
      where: { id: `seed-audit-${i}` },
      update: {
        userId: users[0].id,
        tenantId: primaryTenantId,
        action: 'CREATE',
        entity: 'DEMO',
        entityId: `seed-entity-${i}`,
        details: { info: `demo-${i}` },
      },
      create: {
        id: `seed-audit-${i}`,
        userId: users[0].id,
        tenantId: primaryTenantId,
        action: 'CREATE',
        entity: 'DEMO',
        entityId: `seed-entity-${i}`,
        details: { info: `demo-${i}` },
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.vehicleAlert.upsert({
      where: { id: `seed-alert-${i}` },
      update: {
        tenantId: primaryTenantId,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        alertType: i % 2 === 0 ? 'SPEEDING' : 'IDLING',
        severity: i % 2 === 0 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        details: { speed: 80 + i },
        isMock: true,
      },
      create: {
        id: `seed-alert-${i}`,
        tenantId: primaryTenantId,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        alertType: i % 2 === 0 ? 'SPEEDING' : 'IDLING',
        severity: i % 2 === 0 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        details: { speed: 80 + i },
        isMock: true,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.tenantAlertSetting.upsert({
      where: { tenantId: tenants[i - 1].id },
      update: {
        speedLimit: 85 + i,
        idlingLimit: 10 + i,
        enableSpeeding: true,
        enableIdling: true,
      },
      create: {
        id: `seed-alert-setting-${i}`,
        tenantId: tenants[i - 1].id,
        speedLimit: 85 + i,
        idlingLimit: 10 + i,
        enableSpeeding: true,
        enableIdling: true,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.driverShift.upsert({
      where: { id: `seed-shift-${i}` },
      update: {
        userId: users[2].id,
        tenantId: primaryTenantId,
        dayOfWeek: i,
        startTime: '08:00',
        endTime: '18:00',
      },
      create: {
        id: `seed-shift-${i}`,
        userId: users[2].id,
        tenantId: primaryTenantId,
        dayOfWeek: i,
        startTime: '08:00',
        endTime: '18:00',
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.geofenceDefinition.upsert({
      where: { id: `seed-gf-${i}` },
      update: {
        tenantId: primaryTenantId,
        name: `Demo Geofence ${i}`,
        centerLat: 41.0 + i / 100,
        centerLng: 29.0 + i / 100,
        radiusKm: 1 + i,
      },
      create: {
        id: `seed-gf-${i}`,
        tenantId: primaryTenantId,
        name: `Demo Geofence ${i}`,
        centerLat: 41.0 + i / 100,
        centerLng: 29.0 + i / 100,
        radiusKm: 1 + i,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.geofenceAssignment.upsert({
      where: { id: `seed-gfa-${i}` },
      update: {
        geofenceDefinitionId: `seed-gf-${i}`,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        isActive: true,
      },
      create: {
        id: `seed-gfa-${i}`,
        geofenceDefinitionId: `seed-gf-${i}`,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        isActive: true,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.vehicleAssignmentHistory.upsert({
      where: { id: `seed-vah-${i}` },
      update: {
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        driverId: i % 2 === 0 ? users[3].id : users[2].id,
        assignedAt: new Date(now.getFullYear(), now.getMonth(), i),
      },
      create: {
        id: `seed-vah-${i}`,
        vehicleId: vehicles[(i - 1) % vehicles.length].id,
        driverId: i % 2 === 0 ? users[3].id : users[2].id,
        assignedAt: new Date(now.getFullYear(), now.getMonth(), i),
      },
    });
  }

  const minimalMenus = [
    { label: 'Canlı Operasyon', route: '/company/dashboard', icon: 'map', sortOrder: 1 },
    { label: 'Müşteri Yönetimi', route: '/company/clients', icon: 'users', sortOrder: 2 },
    { label: 'Rotalar', route: '/company/routes', icon: 'route', sortOrder: 3 },
    { label: 'Finans ve Raporlar', route: '/company/reports', icon: 'chart', sortOrder: 4 },
    { label: 'Ayarlar', route: '/company/settings', icon: 'settings', sortOrder: 5 },
  ];

  for (const [tIdx, tenant] of tenants.entries()) {
    for (const [mIdx, menu] of minimalMenus.entries()) {
      await prisma.tenantMenu.upsert({
        where: { id: `seed-menu-${tIdx + 1}-${mIdx + 1}` },
        update: {
          tenantId: tenant.id,
          label: menu.label,
          route: menu.route,
          icon: menu.icon,
          sortOrder: menu.sortOrder,
          isActive: true,
        },
        create: {
          id: `seed-menu-${tIdx + 1}-${mIdx + 1}`,
          tenantId: tenant.id,
          label: menu.label,
          route: menu.route,
          icon: menu.icon,
          sortOrder: menu.sortOrder,
          isActive: true,
        },
      });
    }
  }

  // Backfill all tenant-admin companies so company panel is never sparse
  const modelPool = await prisma.vehicleModel.findMany({
    select: { id: true, brand: true, modelName: true },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  const tenantTargets = await prisma.tenant.findMany({
    where: {
      users: {
        some: { role: UserRole.TENANT_ADMIN },
      },
    },
    select: {
      id: true,
      name: true,
      users: {
        where: { role: UserRole.TENANT_ADMIN },
        select: { id: true, email: true, name: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const [tIndex, tenant] of tenantTargets.entries()) {
    const admin = tenant.users[0];
    if (!admin) continue;

    const slug = (tenant.id || `tenant${tIndex + 1}`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase() || `tenant${tIndex + 1}`;

    const localUsers: Array<{ id: string; role: UserRole }> = [];

    for (let i = 1; i <= 3; i++) {
      const userId = `seed-${slug}-driver-${i}`;
      const email = `${slug}.driver${i}@demo.local`;
      await prisma.user.upsert({
        where: { email },
        update: {
          name: `Demo Şoför ${i}`,
          role: UserRole.DRIVER,
          tenantId: tenant.id,
          phone: `+9055600${String(tIndex + 1).padStart(2, '0')}${String(i).padStart(3, '0')}`,
          passwordHash: pw,
          isActive: true,
        },
        create: {
          id: userId,
          email,
          name: `Demo Şoför ${i}`,
          role: UserRole.DRIVER,
          tenantId: tenant.id,
          phone: `+9055600${String(tIndex + 1).padStart(2, '0')}${String(i).padStart(3, '0')}`,
          passwordHash: pw,
          isActive: true,
        },
      });
      localUsers.push({ id: userId, role: UserRole.DRIVER });
    }

    for (let i = 1; i <= 2; i++) {
      const userId = `seed-${slug}-passenger-${i}`;
      const email = `${slug}.passenger${i}@demo.local`;
      await prisma.user.upsert({
        where: { email },
        update: {
          name: `Demo Yolcu ${i}`,
          role: UserRole.PASSENGER,
          tenantId: tenant.id,
          phone: `+9055700${String(tIndex + 1).padStart(2, '0')}${String(i).padStart(3, '0')}`,
          passwordHash: pw,
          isActive: true,
        },
        create: {
          id: userId,
          email,
          name: `Demo Yolcu ${i}`,
          role: UserRole.PASSENGER,
          tenantId: tenant.id,
          phone: `+9055700${String(tIndex + 1).padStart(2, '0')}${String(i).padStart(3, '0')}`,
          passwordHash: pw,
          isActive: true,
        },
      });
      localUsers.push({ id: userId, role: UserRole.PASSENGER });
    }

    const tenantClients: Array<{ id: string }> = [];
    for (let i = 1; i <= 5; i++) {
      const clientId = `seed-${slug}-client-${i}`;
      await prisma.client.upsert({
        where: { id: clientId },
        update: {
          tenantId: tenant.id,
          name: `${tenant.name} Kurumsal ${i}`,
          taxNumber: `9${String(tIndex + 1).padStart(2, '0')}00000${i}`,
          taxOffice: 'İstanbul',
          invoiceAddress: `${tenant.name} Fatura Adresi ${i}`,
          contactEmail: `${slug}.client${i}@demo.local`,
          monthlyAllowance: 12000 + i * 3000,
        } as any,
        create: {
          id: clientId,
          tenantId: tenant.id,
          name: `${tenant.name} Kurumsal ${i}`,
          taxNumber: `9${String(tIndex + 1).padStart(2, '0')}00000${i}`,
          taxOffice: 'İstanbul',
          invoiceAddress: `${tenant.name} Fatura Adresi ${i}`,
          contactEmail: `${slug}.client${i}@demo.local`,
          monthlyAllowance: 12000 + i * 3000,
        } as any,
      });
      tenantClients.push({ id: clientId });
    }

    const tenantVehicles: Array<{ id: string; plate: string }> = [];
    for (let i = 1; i <= 5; i++) {
      const model = modelPool[(i - 1) % Math.max(modelPool.length, 1)] ?? { id: vehicleModels[0].id, brand: vehicleModels[0].brand, modelName: vehicleModels[0].modelName };
      const vehicleId = `seed-${slug}-vehicle-${i}`;
      const plate = `${34 + tIndex} ${slug.slice(0, 2).toUpperCase()} ${100 + i}`;
      const driver = localUsers.filter((u) => u.role === UserRole.DRIVER)[(i - 1) % 3];

      await prisma.vehicle.upsert({
        where: { id: vehicleId },
        update: {
          tenantId: tenant.id,
          vehicleModelId: model.id,
          plate,
          vin: `${slug.toUpperCase()}VIN${String(i).padStart(12, '0')}`,
          hardwareType: i % 2 === 0 ? HardwareType.UDP : HardwareType.ARVENTO,
          deviceId: `DEV-${slug.toUpperCase()}-${i}`,
          brand: model.brand,
          model: model.modelName,
          year: 2020 + i,
          capacity: 12 + i,
          status: VehicleStatus.ACTIVE,
          driverId: driver?.id ?? null,
        },
        create: {
          id: vehicleId,
          tenantId: tenant.id,
          vehicleModelId: model.id,
          plate,
          vin: `${slug.toUpperCase()}VIN${String(i).padStart(12, '0')}`,
          hardwareType: i % 2 === 0 ? HardwareType.UDP : HardwareType.ARVENTO,
          deviceId: `DEV-${slug.toUpperCase()}-${i}`,
          brand: model.brand,
          model: model.modelName,
          year: 2020 + i,
          capacity: 12 + i,
          status: VehicleStatus.ACTIVE,
          driverId: driver?.id ?? null,
        },
      });

      tenantVehicles.push({ id: vehicleId, plate });
    }

    for (let i = 1; i <= 5; i++) {
      const routeId = `seed-${slug}-route-${i}`;
      const vehicle = tenantVehicles[(i - 1) % tenantVehicles.length];
      const driver = localUsers.filter((u) => u.role === UserRole.DRIVER)[(i - 1) % 3];
      const client = tenantClients[(i - 1) % tenantClients.length];

      await prisma.route.upsert({
        where: { id: routeId },
        update: {
          tenantId: tenant.id,
          clientId: client.id,
          vehicleId: vehicle.id,
          driverId: driver?.id ?? null,
          name: `${tenant.name} Demo Rota ${i}`,
          type: i % 2 === 0 ? RouteType.CORPORATE : RouteType.SHUTTLE,
          monthlyRevenue: 9000 + i * 2500,
          status: RouteStatus.ACTIVE,
        },
        create: {
          id: routeId,
          tenantId: tenant.id,
          clientId: client.id,
          vehicleId: vehicle.id,
          driverId: driver?.id ?? null,
          name: `${tenant.name} Demo Rota ${i}`,
          type: i % 2 === 0 ? RouteType.CORPORATE : RouteType.SHUTTLE,
          monthlyRevenue: 9000 + i * 2500,
          status: RouteStatus.ACTIVE,
        },
      });

      await prisma.routeStop.upsert({
        where: { id: `seed-${slug}-stop-${i}-1` },
        update: { name: `Başlangıç ${i}`, latitude: 41.0 + i / 100, longitude: 29.0 + i / 100, orderIndex: 1 },
        create: { id: `seed-${slug}-stop-${i}-1`, routeId, name: `Başlangıç ${i}`, latitude: 41.0 + i / 100, longitude: 29.0 + i / 100, orderIndex: 1 },
      });

      await prisma.routeStop.upsert({
        where: { id: `seed-${slug}-stop-${i}-2` },
        update: { name: `Varış ${i}`, latitude: 41.02 + i / 100, longitude: 29.02 + i / 100, orderIndex: 2 },
        create: { id: `seed-${slug}-stop-${i}-2`, routeId, name: `Varış ${i}`, latitude: 41.02 + i / 100, longitude: 29.02 + i / 100, orderIndex: 2 },
      });

      await prisma.vehicleAlert.upsert({
        where: { id: `seed-${slug}-alert-${i}` },
        update: {
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          alertType: i % 2 === 0 ? 'SPEEDING' : 'IDLING',
          severity: i % 2 === 0 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          details: { mock: true, tenant: tenant.name, index: i },
          isMock: true,
        },
        create: {
          id: `seed-${slug}-alert-${i}`,
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          alertType: i % 2 === 0 ? 'SPEEDING' : 'IDLING',
          severity: i % 2 === 0 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          details: { mock: true, tenant: tenant.name, index: i },
          isMock: true,
        },
      });

      await prisma.sOSAlert.upsert({
        where: { id: `seed-${slug}-sos-${i}` },
        update: {
          tenantId: tenant.id,
          driverId: driver?.id ?? null,
          vehicleId: vehicle.id,
          plateSnapshot: vehicle.plate,
          message: `${tenant.name} demo SOS ${i}`,
          location: { lat: 41.01 + i / 1000, lng: 28.99 + i / 1000 },
          status: i === 5 ? SOSStatus.RESOLVED : SOSStatus.OPEN,
          resolvedAt: i === 5 ? new Date(now.getFullYear(), now.getMonth(), 12 + i) : null,
          resolvedByUserId: i === 5 ? admin.id : null,
          isMock: true,
        },
        create: {
          id: `seed-${slug}-sos-${i}`,
          tenantId: tenant.id,
          driverId: driver?.id ?? null,
          vehicleId: vehicle.id,
          plateSnapshot: vehicle.plate,
          message: `${tenant.name} demo SOS ${i}`,
          location: { lat: 41.01 + i / 1000, lng: 28.99 + i / 1000 },
          status: i === 5 ? SOSStatus.RESOLVED : SOSStatus.OPEN,
          resolvedAt: i === 5 ? new Date(now.getFullYear(), now.getMonth(), 12 + i) : null,
          resolvedByUserId: i === 5 ? admin.id : null,
          isMock: true,
        },
      });

      await prisma.errorReport.upsert({
        where: { id: `seed-${slug}-report-${i}` },
        update: {
          tenantId: tenant.id,
          reporterUserId: admin.id,
          subject: `${tenant.name} Demo Hata ${i}`,
          details: `Dispatch merkezi demo hata açıklaması ${i}`,
          source: 'DISPATCH_CENTER',
          status: i === 5 ? ErrorReportStatus.RESOLVED : i % 2 === 0 ? ErrorReportStatus.IN_REVIEW : ErrorReportStatus.OPEN,
          resolvedAt: i === 5 ? new Date(now.getFullYear(), now.getMonth(), 15 + i) : null,
          resolvedByUserId: i === 5 ? admin.id : null,
        },
        create: {
          id: `seed-${slug}-report-${i}`,
          tenantId: tenant.id,
          reporterUserId: admin.id,
          subject: `${tenant.name} Demo Hata ${i}`,
          details: `Dispatch merkezi demo hata açıklaması ${i}`,
          source: 'DISPATCH_CENTER',
          status: i === 5 ? ErrorReportStatus.RESOLVED : i % 2 === 0 ? ErrorReportStatus.IN_REVIEW : ErrorReportStatus.OPEN,
          resolvedAt: i === 5 ? new Date(now.getFullYear(), now.getMonth(), 15 + i) : null,
          resolvedByUserId: i === 5 ? admin.id : null,
        },
      });

      await prisma.feedback.upsert({
        where: { id: `seed-${slug}-feedback-${i}` },
        update: {
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          driverId: driver?.id ?? localUsers[0]?.id ?? admin.id,
          source: FeedbackSource.EXTERNAL_QR,
          rating: 3 + (i % 2),
          message: `${tenant.name} demo geri bildirim ${i}`,
          status: FeedbackStatus.PENDING,
        },
        create: {
          id: `seed-${slug}-feedback-${i}`,
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          driverId: driver?.id ?? localUsers[0]?.id ?? admin.id,
          source: FeedbackSource.EXTERNAL_QR,
          rating: 3 + (i % 2),
          message: `${tenant.name} demo geri bildirim ${i}`,
          status: FeedbackStatus.PENDING,
        },
      });

      await prisma.financialTransaction.upsert({
        where: { id: `seed-${slug}-ft-${i}` },
        update: {
          tenantId: tenant.id,
          type: i % 2 === 0 ? 'EXPENSE' : 'INCOME',
          category: i % 2 === 0 ? 'OPERASYON_GIDER' : 'MUSTERI_TAHAKKUK',
          amount: i % 2 === 0 ? 2200 * i : 4800 * i,
          date: new Date(now.getFullYear(), now.getMonth(), i),
          description: `${tenant.name} demo finans hareketi ${i}`,
        },
        create: {
          id: `seed-${slug}-ft-${i}`,
          tenantId: tenant.id,
          type: i % 2 === 0 ? 'EXPENSE' : 'INCOME',
          category: i % 2 === 0 ? 'OPERASYON_GIDER' : 'MUSTERI_TAHAKKUK',
          amount: i % 2 === 0 ? 2200 * i : 4800 * i,
          date: new Date(now.getFullYear(), now.getMonth(), i),
          description: `${tenant.name} demo finans hareketi ${i}`,
        },
      });

      const invoiceNo = `SEED-${slug.toUpperCase()}-INV-${String(i).padStart(3, '0')}`;
      await prisma.invoice.upsert({
        where: { invoiceNo },
        update: {
          tenantId: tenant.id,
          clientId: client.id,
          amount: 9500 + i * 1300,
          type: InvoiceType.RECURRING,
          status: i % 3 === 0 ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
          description: `${tenant.name} demo faturası ${i}`,
          issueDate: new Date(now.getFullYear(), now.getMonth(), i),
          dueDate: new Date(now.getFullYear(), now.getMonth(), 20 + i),
          paidAt: i % 3 === 0 ? new Date(now.getFullYear(), now.getMonth(), 10 + i) : null,
        },
        create: {
          id: `seed-${slug}-invoice-${i}`,
          invoiceNo,
          tenantId: tenant.id,
          clientId: client.id,
          amount: 9500 + i * 1300,
          type: InvoiceType.RECURRING,
          status: i % 3 === 0 ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
          description: `${tenant.name} demo faturası ${i}`,
          issueDate: new Date(now.getFullYear(), now.getMonth(), i),
          dueDate: new Date(now.getFullYear(), now.getMonth(), 20 + i),
          paidAt: i % 3 === 0 ? new Date(now.getFullYear(), now.getMonth(), 10 + i) : null,
        },
      });

      await prisma.vehicleRecord.upsert({
        where: { id: `seed-${slug}-vr-${i}` },
        update: {
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          driverId: driver?.id ?? null,
          recordType: VehicleRecordType.PERIYODIK_BAKIM,
          costAmount: 1300 * i,
          description: `${tenant.name} demo bakım kaydı ${i}`,
        },
        create: {
          id: `seed-${slug}-vr-${i}`,
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          driverId: driver?.id ?? null,
          recordType: VehicleRecordType.PERIYODIK_BAKIM,
          costAmount: 1300 * i,
          description: `${tenant.name} demo bakım kaydı ${i}`,
        },
      });
    }
  }

  console.log('✅ Demo seed completed.');
  console.log('   Test tenant admin: tenant-admin@demo1.com / password123');
}

main()
  .catch((error) => {
    console.error('❌ Demo seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
