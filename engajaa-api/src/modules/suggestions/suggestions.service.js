const { prisma } = require('../../config/database');
const { generateSuggestions } = require('../../lib/anthropic');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// In-memory cache (use Redis in production)
const cache = new Map();

class SuggestionsService {
  async getSuggestions(tenantId, forceRefresh = false) {
    const cacheKey = `suggestions:${tenantId}`;
    const cached = cache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data;
    }

    const context = await this._buildContext(tenantId);
    const result = await generateSuggestions(context);

    cache.set(cacheKey, { ts: Date.now(), data: result.suggestions });
    return result.suggestions;
  }

  async _buildContext(tenantId) {
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const posts = await prisma.igPost.findMany({
      where: { tenantId, timestamp: { gte: since90 } },
    });

    const byFormat = {};
    for (const p of posts) {
      if (!byFormat[p.mediaType]) byFormat[p.mediaType] = { count: 0, likes: 0, reach: 0, saved: 0 };
      byFormat[p.mediaType].count++;
      byFormat[p.mediaType].likes += p.likeCount;
      byFormat[p.mediaType].reach += p.reach;
      byFormat[p.mediaType].saved += p.saved;
    }

    const bestFormat = Object.entries(byFormat)
      .sort(([, a], [, b]) => b.likes - a.likes)[0]?.[0] || 'VIDEO';

    const hourBuckets = {};
    for (const p of posts) {
      const h = new Date(p.timestamp).getHours();
      hourBuckets[h] = (hourBuckets[h] || 0) + p.likeCount + p.commentsCount;
    }
    const peakHours = Object.entries(hourBuckets)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([h]) => `${h}:00`);

    return {
      totalPosts: posts.length,
      bestFormat,
      peakHours,
      avgEngagement: posts.length > 0
        ? Math.round(posts.reduce((s, p) => s + p.likeCount + p.commentsCount, 0) / posts.length)
        : 0,
      formatBreakdown: byFormat,
    };
  }
}

module.exports = { SuggestionsService };
