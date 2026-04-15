const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'seed-tenant-id-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'seed-tenant-id-0000-0000-000000000001',
      name: 'Demo Company',
      plan: 'FREE',
    },
  });

  const hash = await bcrypt.hash('demo1234', 12);

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'owner@demo.com',
      passwordHash: hash,
      name: 'Demo Owner',
      role: 'OWNER',
    },
  });

  console.log('Seed completed — tenant:', tenant.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
