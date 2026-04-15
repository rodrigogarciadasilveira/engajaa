const { z } = require('zod');
const { prisma } = require('../../config/database');

const createSchema = z.object({
  mediaType: z.enum(['REELS', 'CAROUSEL', 'IMAGE', 'STORY']),
  caption: z.string().optional(),
  mediaUrls: z.array(z.string().url()),
  scheduledAt: z.coerce.date(),
});

class SchedulerService {
  async list(tenantId) {
    return prisma.scheduledPost.findMany({
      where: { tenantId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async create(tenantId, userId, data) {
    const parsed = createSchema.parse(data);
    return prisma.scheduledPost.create({
      data: {
        tenantId,
        createdById: userId,
        ...parsed,
        status: 'DRAFT',
      },
    });
  }

  async update(tenantId, id, data) {
    const post = await prisma.scheduledPost.findFirst({ where: { id, tenantId } });
    if (!post) throw Object.assign(new Error('Not found'), { status: 404 });
    if (!['DRAFT', 'SCHEDULED'].includes(post.status)) {
      throw Object.assign(new Error('Cannot edit a published or failed post'), { status: 400 });
    }

    return prisma.scheduledPost.update({
      where: { id },
      data: {
        caption: data.caption ?? post.caption,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : post.scheduledAt,
        status: data.status ?? post.status,
      },
    });
  }

  async remove(tenantId, id) {
    const post = await prisma.scheduledPost.findFirst({ where: { id, tenantId } });
    if (!post) throw Object.assign(new Error('Not found'), { status: 404 });
    if (!['DRAFT', 'SCHEDULED'].includes(post.status)) {
      throw Object.assign(new Error('Cannot delete a published post'), { status: 400 });
    }
    return prisma.scheduledPost.delete({ where: { id } });
  }
}

module.exports = { SchedulerService };
