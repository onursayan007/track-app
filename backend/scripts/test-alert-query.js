const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  for (const tenant of tenants) {
    const strictCount = await prisma.vehicleAlert.count({
      where: {
        tenantId: tenant.id,
        vehicle: { tenantId: tenant.id },
      },
    });

    const plainCount = await prisma.vehicleAlert.count({
      where: { tenantId: tenant.id },
    });

    console.log(`${tenant.name} -> strict:${strictCount} plain:${plainCount}`);
  }
})()
  .catch((error) => {
    console.error('Test query error:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
