const { prisma } = require('../../config/database');
const ig = require('../../lib/instagram');

class InstagramService {
  async getOAuthUrl(tenantId) {
    return ig.getOAuthUrl(tenantId);
  }

  async handleCallback(tenantId, code) {
    const short = await ig.exchangeCodeForToken(code);
    // Instagram Login: user_id comes directly in the short-lived token response
    const igUserId = String(short.user_id);
    const long = await ig.getLongLivedToken(short.access_token);
    const profile = await ig.getProfile(igUserId, long.access_token);

    const expiresAt = new Date(Date.now() + (long.expires_in || 5183944) * 1000);

    await prisma.instagramAccount.upsert({
      where: { id: `${tenantId}-ig` },
      create: {
        id: `${tenantId}-ig`,
        tenantId,
        igUserId,
        username: profile.username,
        accessToken: ig.encryptToken(long.access_token),
        tokenExpiresAt: expiresAt,
        followersCount: profile.followers_count || 0,
        mediaCount: profile.media_count || 0,
        profilePictureUrl: profile.profile_picture_url || null,
        biography: profile.biography || null,
      },
      update: {
        igUserId,
        username: profile.username,
        accessToken: ig.encryptToken(long.access_token),
        tokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        followersCount: profile.followers_count || 0,
        mediaCount: profile.media_count || 0,
        profilePictureUrl: profile.profile_picture_url || null,
        biography: profile.biography || null,
      },
    });

    // fire and forget sync — don't block the OAuth callback redirect
    this.syncPosts(tenantId).catch(err => console.error('[auto-sync] failed:', err.message));

    return { username: profile.username };
  }

  async getStatus(tenantId) {
    const account = await prisma.instagramAccount.findFirst({
      where: { tenantId },
    });
    if (!account) return { connected: false };

    const postCount = await prisma.igPost.count({ where: { tenantId } });

    return {
      connected: true,
      username: account.username,
      connectedAt: account.connectedAt,
      tokenExpiresAt: account.tokenExpiresAt,
      lastSyncAt: account.lastSyncAt,
      followersCount: account.followersCount,
      mediaCount: account.mediaCount,
      profilePictureUrl: account.profilePictureUrl,
      biography: account.biography,
      postCount,
    };
  }

  async syncPosts(tenantId) {
    const account = await prisma.instagramAccount.findFirst({ where: { tenantId } });
    if (!account) throw Object.assign(new Error('No Instagram account connected'), { status: 400 });

    const token = ig.decryptToken(account.accessToken);

    // Refresh profile data on every sync
    try {
      const profile = await ig.getProfile(account.igUserId, token);
      await prisma.instagramAccount.update({
        where: { id: account.id },
        data: {
          followersCount: profile.followers_count || 0,
          mediaCount: profile.media_count || 0,
          profilePictureUrl: profile.profile_picture_url || null,
          biography: profile.biography || null,
        },
      });
    } catch (err) {
      console.warn('[syncPosts] profile refresh failed:', err.message);
    }

    const media = await ig.getMediaList(account.igUserId, token, 100);

    if (!media.data) return { synced: 0 };

    let synced = 0;
    for (const post of media.data) {
      const insights = await ig.getMediaInsights(post.id, token);
      const metrics = {};
      if (insights?.data) {
        for (const m of insights.data) {
          metrics[m.name] = m.values?.[0]?.value ?? m.value ?? 0;
        }
      }

      await prisma.igPost.upsert({
        where: { id: post.id },
        create: {
          id: post.id,
          tenantId,
          igMediaId: post.id,
          mediaType: post.media_type,
          caption: post.caption || null,
          likeCount: post.like_count || 0,
          commentsCount: post.comments_count || 0,
          reach: metrics.reach || 0,
          impressions: metrics.impressions || 0,
          saved: metrics.saved || 0,
          sharesCount: metrics.shares || 0,
          mediaUrl: post.media_url || null,
          thumbnailUrl: post.thumbnail_url || post.media_url || null,
          permalink: post.permalink || null,
          timestamp: new Date(post.timestamp),
          syncedAt: new Date(),
        },
        update: {
          likeCount: post.like_count || 0,
          commentsCount: post.comments_count || 0,
          reach: metrics.reach || 0,
          impressions: metrics.impressions || 0,
          saved: metrics.saved || 0,
          sharesCount: metrics.shares || 0,
          mediaUrl: post.media_url || null,
          thumbnailUrl: post.thumbnail_url || post.media_url || null,
          permalink: post.permalink || null,
          syncedAt: new Date(),
        },
      });
      synced++;
    }

    await prisma.instagramAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    return { synced };
  }

  async disconnect(tenantId) {
    await prisma.igPost.deleteMany({ where: { tenantId } });
    await prisma.instagramAccount.deleteMany({ where: { tenantId } });
    return { ok: true };
  }
}

module.exports = { InstagramService };
