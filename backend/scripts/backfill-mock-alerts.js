const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  const descriptions = [
    'Hız: 112 km/s',
    'Rölanti: 22 dk',
    'Mesai takvimi dışında kullanım tespit edildi',
    'Bölge dışı kullanım',
    'Sinyal kesinti süresi: 18 dk',
    'Cihaz sabotaj/tamper alarmı (test kaydı)',
  ];

  const result = await prisma.$executeRawUnsafe(
    `UPDATE vehicle_alerts
     SET "isMock" = true,
         details = COALESCE(details, '{}'::jsonb) || '{"mock": true}'::jsonb
     WHERE details->>'source' = 'mock-device'
        OR details->>'description' = ANY($1::text[])`,
    descriptions,
  );

  console.log('Mock backfill güncellenen kayıt:', result);
})()
  .catch((error) => {
    console.error('Backfill hatası:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
