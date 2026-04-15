const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const violations = [
    {
      alertType: 'Hız Sınırı Aşımı',
      severity: 'MEDIUM',
      details: { mock: true, speed: 112, speedLimit: 90, description: 'Hız: 112 km/s' },
    },
    {
      alertType: 'Rölanti hlali',
      severity: 'LOW',
      details: { mock: true, idlingMinutes: 22, idlingLimit: 10, description: 'Rölanti: 22 dk' },
    },
    {
      alertType: 'Mesai Dışı Kullanım',
      severity: 'HIGH',
      details: { mock: true, description: 'Mesai takvimi dışında kullanım tespit edildi' },
    },
    {
      alertType: 'Sanal Çit hlali',
      severity: 'MEDIUM',
      details: { mock: true, districtIds: [1, 2], description: 'Bölge dışı kullanım' },
    },
    {
      alertType: 'Cihaz Sinyali Kesildi',
      severity: 'HIGH',
      details: { mock: true, offlineMinutes: 18, description: 'Sinyal kesinti süresi: 18 dk' },
    },
  ];

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      vehicles: { select: { id: true, plate: true } },
    },
  });

  const rows = [];
  const now = Date.now();
  let step = 0;

  for (const tenant of tenants) {
    for (const vehicle of tenant.vehicles) {
      for (const violation of violations) {
        rows.push({
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          timestamp: new Date(now - step * 60_000),
          alertType: violation.alertType,
          details: violation.details,
          severity: violation.severity,
          isResolved: false,
          isMock: true,
        });
        step += 1;
      }
    }
  }

  if (rows.length === 0) {
    console.log('Hiç araç bulunamadı, mock ihlal eklenmedi.');
    return;
  }

  const result = await prisma.vehicleAlert.createMany({ data: rows });

  console.log('Mock ihlal eklendi:', result.count);
  console.log('Şirket sayısı:', tenants.length);
  console.log('Araç sayısı:', rows.length / violations.length);
  console.log('Araç başına ihlal adedi:', violations.length);
})()
  .catch((error) => {
    console.error('Hata:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
