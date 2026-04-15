const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      isActive: true,
      vehicles: { select: { id: true, plate: true } },
    },
    orderBy: { name: 'asc' },
  });

  for (const tenant of tenants) {
    const vehicleIds = tenant.vehicles.map((vehicle) => vehicle.id);
    const alertCount = vehicleIds.length
      ? await prisma.vehicleAlert.count({
          where: {
            tenantId: tenant.id,
            vehicleId: { in: vehicleIds },
          },
        })
      : 0;

    console.log(
      JSON.stringify(
        {
          tenantId: tenant.id,
          tenantName: tenant.name,
          status: tenant.status,
          isActive: tenant.isActive,
          vehicleCount: tenant.vehicles.length,
          alertCount,
        },
        null,
        2,
      ),
    );
  }
})()
  .catch((error) => {
    console.error('Diagnose error:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
