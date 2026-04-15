const { Worker, Queue } = require('bullmq');
const { redis } = require('../config/redis');

// Import job processors
require('./syncInstagram');
require('./publishPost');
require('./refreshTokens');
require('./growthRadar');

// Schedule recurring jobs
const syncQueue = new Queue('syncInstagram', { connection: redis });
const refreshQueue = new Queue('refreshTokens', { connection: redis });
const growthRadarQueue = new Queue('growthRadar', { connection: redis });

async function scheduleRecurring() {
  // Sync every 6 hours
  await syncQueue.add('sync-all', {}, {
    repeat: { every: 6 * 60 * 60 * 1000 },
    jobId: 'sync-all-recurring',
  });

  // Refresh tokens every 55 days
  await refreshQueue.add('refresh-all', {}, {
    repeat: { every: 55 * 24 * 60 * 60 * 1000 },
    jobId: 'refresh-all-recurring',
  });

  // Growth Radar every 24 hours
  await growthRadarQueue.add('radar-all', {}, {
    repeat: { every: 24 * 60 * 60 * 1000 },
    jobId: 'radar-all-recurring',
  });
}

scheduleRecurring().catch(console.error);

console.log('BullMQ workers started');
