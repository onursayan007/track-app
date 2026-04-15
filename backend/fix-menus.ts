import prisma from './src/lib/prisma';

async function fixMenus() {
  // Rename 'Filo ve Şoförler' to 'Filo Yönetimi'
  const updated = await prisma.tenantMenu.updateMany({
    where: { label: 'Filo ve Şoförler' },
    data: { label: 'Filo Yönetimi' },
  });
  console.log('Renamed:', updated.count);

  // Get all tenant IDs
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  for (const t of tenants) {
    const exists = await prisma.tenantMenu.findFirst({ where: { tenantId: t.id, route: '/company/drivers' } });
    if (!exists) {
      await prisma.tenantMenu.create({
        data: { tenantId: t.id, label: 'Şoför Yönetimi', route: '/company/drivers', icon: 'users', sortOrder: 4, isActive: true },
      });
      console.log('Created Şoför Yönetimi for tenant', t.id);
    }
  }

  // Bump sortOrder for items with sortOrder >= 5 (passengers, reports, etc.) to make room
  await prisma.tenantMenu.updateMany({
    where: {
      sortOrder: { gte: 4 },
      route: { notIn: ['/company/fleet', '/company/drivers'] },
    },
    data: { sortOrder: { increment: 1 } },
  });
  console.log('Sort orders adjusted');

  await prisma.$disconnect();
}

fixMenus().catch(e => { console.error(e); process.exit(1); });
