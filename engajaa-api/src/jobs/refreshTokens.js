const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { prisma } = require('../config/database');
const ig = require('../lib/instagram');

const worker = new Worker('refreshTokens', async () => {
  const threshold = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // refresh if expires in <10d

  const accounts = await prisma.instagramAccount.findMany({
    where: { tokenExpiresAt: { lte: threshold } },
  });

  for (const account of accounts) {
    try {
      const token = ig.decryptToken(account.accessToken);
      const refreshed = await ig.refreshLongLivedToken(token);
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

      await prisma.instagramAccount.update({
        where: { id: account.id },
        data: {
          accessToken: ig.encryptToken(refreshed.access_token),
          tokenExpiresAt: expiresAt,
        },
      });
      console.log(`Refreshed token for account ${account.username}`);
    } catch (err) {
      console.error(`Failed to refresh token for ${account.username}:`, err.message);
    }
  }
}, { connection: redis });

worker.on('failed', (job, err) => console.error('refreshTokens job failed:', err));

module.exports = worker;
