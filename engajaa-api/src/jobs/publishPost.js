const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { prisma } = require('../config/database');

// Runs every minute, checks for posts due to publish
const worker = new Worker('publishPost', async (job) => {
  const { postId } = job.data;

  const post = await prisma.scheduledPost.findUnique({ where: { id: postId } });
  if (!post || post.status !== 'SCHEDULED') return;

  try {
    // Instagram content_publish API call would go here
    // For MVP, mark as published
    await prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'PUBLISHED' },
    });
    console.log(`Published post ${postId}`);
  } catch (err) {
    await prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'FAILED' },
    });
    throw err;
  }
}, { connection: redis });

worker.on('failed', (job, err) => console.error('publishPost job failed:', err));

module.exports = worker;
