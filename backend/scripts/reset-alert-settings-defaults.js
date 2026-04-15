const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  const result = await prisma.tenantAlertSetting.updateMany({
    data: {
      enableIgnitionOn: false,
      enableSpeeding: false,
      enableGeofence: false,
      enableOffline: false,
      enablePowerCut: false,
      enableShiftControl: false,
    },
  });

  console.log('Güncellenen ayar kaydı:', result.count);
})()
  .catch((error) => {
    console.error('Reset error:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
