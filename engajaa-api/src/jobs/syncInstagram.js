const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { prisma } = require('../config/database');
const { InstagramService } = require('../modules/instagram/instagram.service');

const svc = new InstagramService();

const worker = new Worker('syncInstagram', async () => {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });

  for (const tenant of tenants) {
    try {
      const result = await svc.syncPosts(tenant.id);
      console.log(`Synced tenant ${tenant.id}: ${result.synced} posts`);
    } catch (err) {
      console.error(`Sync failed for tenant ${tenant.id}:`, err.message);
    }
  }
}, { connection: redis });

worker.on('failed', (job, err) => console.error('syncInstagram job failed:', err));

module.exports = worker;
