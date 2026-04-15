const { prisma } = require('../../config/database');

class AnalyticsService {
  async getOverview(tenantId, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const posts = await prisma.igPost.findMany({
      where: { tenantId, timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' },
    });

    const totalLikes = posts.reduce((s, p) => s + p.likeCount, 0);
    const totalReach = posts.reduce((s, p) => s + p.reach, 0);
    const totalComments = posts.reduce((s, p) => s + p.commentsCount, 0);
    const totalSaved = posts.reduce((s, p) => s + p.saved, 0);

    const engagementRate = totalReach > 0
      ? ((totalLikes + totalComments + totalSaved) / totalReach * 100).toFixed(2)
      : 0;

    return {
      period: days,
      totalPosts: posts.length,
      totalLikes,
      totalReach,
      engagementRate: parseFloat(engagementRate),
      lastSync: posts[0]?.syncedAt || null,
    };
  }

  async getPosts(tenantId, _days) {
    // Show all synced posts ordered by most recent — no date filter for the gallery
    return prisma.igPost.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async getByFormat(tenantId, days = 30) {
    // Use all available posts for format analysis (more meaningful with full history)
    const posts = await prisma.igPost.findMany({
      where: { tenantId },
    });

    const byFormat = {};
    for (const post of posts) {
      const fmt = post.mediaType;
      if (!byFormat[fmt]) byFormat[fmt] = { format: fmt, posts: 0, likes: 0, reach: 0, saved: 0, comments: 0 };
      byFormat[fmt].posts++;
      byFormat[fmt].likes += post.likeCount;
      byFormat[fmt].reach += post.reach;
      byFormat[fmt].saved += post.saved;
      byFormat[fmt].comments += post.commentsCount;
    }

    return Object.values(byFormat).map((f) => ({
      ...f,
      engagementRate: f.reach > 0
        ? parseFloat(((f.likes + f.comments + f.saved) / f.reach * 100).toFixed(2))
        : 0,
      score: f.posts > 0
        ? parseFloat(((f.likes + f.comments * 2 + f.saved * 3) / f.posts).toFixed(1))
        : 0,
    })).sort((a, b) => b.score - a.score);
  }

  async getBestTimes(tenantId, _days) {
    // Use all available posts for best-times analysis
    const posts = await prisma.igPost.findMany({
      where: { tenantId },
    });

    const hourBuckets = {};
    for (const post of posts) {
      const hour = new Date(post.timestamp).getHours();
      const bucket = Math.floor(hour / 3) * 3; // 3h windows
      const key = `${bucket}:00–${bucket + 3}:00`;
      if (!hourBuckets[key]) hourBuckets[key] = { window: key, engagementSum: 0, count: 0 };
      hourBuckets[key].engagementSum += post.likeCount + post.commentsCount + post.saved;
      hourBuckets[key].count++;
    }

    return Object.values(hourBuckets)
      .map((b) => ({ ...b, avgEngagement: b.count > 0 ? Math.round(b.engagementSum / b.count) : 0 }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3);
  }

  async getDailyMetrics(tenantId, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const posts = await prisma.igPost.findMany({
      where: { tenantId, timestamp: { gte: since } },
      orderBy: { timestamp: 'asc' },
    });

    const daily = {};
    for (const post of posts) {
      const day = new Date(post.timestamp).toISOString().split('T')[0];
      if (!daily[day]) daily[day] = { date: day, reach: 0, engagement: 0, posts: 0 };
      daily[day].reach += post.reach;
      daily[day].engagement += post.likeCount + post.commentsCount + post.saved;
      daily[day].posts++;
    }

    return Object.values(daily);
  }
}

module.exports = { AnalyticsService };
