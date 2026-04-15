const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../../config/database');
const { sendInviteEmail } = require('../../lib/mailer');

class UsersService {
  async list(tenantId) {
    return prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true, createdAt: true },
    });
  }

  async invite(tenantId, email, role = 'VIEWER') {
    z.string().email().parse(email);
    z.enum(['ADMIN', 'EDITOR', 'VIEWER']).parse(role);

    const existing = await prisma.user.findUnique({ where: { tenantId_email: { tenantId, email } } });
    if (existing) throw Object.assign(new Error('User already exists'), { status: 409 });

    const token = uuidv4();
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash: '',
        role,
        inviteToken: token,
        inviteExpiry: expiry,
      },
    });

    await sendInviteEmail(email, token);
    return { id: user.id, email, role };
  }

  async updateRole(tenantId, actorRole, userId, newRole) {
    z.enum(['ADMIN', 'EDITOR', 'VIEWER']).parse(newRole);

    const target = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!target) throw Object.assign(new Error('User not found'), { status: 404 });
    if (actorRole !== 'OWNER' && target.role === 'ADMIN') {
      throw Object.assign(new Error('Cannot change role of another admin'), { status: 403 });
    }

    return prisma.user.update({ where: { id: userId }, data: { role: newRole } });
  }

  async remove(tenantId, actorId, userId) {
    if (actorId === userId) throw Object.assign(new Error('Cannot remove yourself'), { status: 400 });
    const target = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!target) throw Object.assign(new Error('User not found'), { status: 404 });
    await prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }
}

module.exports = { UsersService };
