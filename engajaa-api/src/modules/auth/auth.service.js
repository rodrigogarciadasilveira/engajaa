const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../../config/database');
const { redis } = require('../../config/redis');

const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

function signAccess(payload) {
  return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '15m' });
}

function signRefresh(payload) {
  return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '7d' });
}

function verifyRefresh(token) {
  return jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
}

function refreshKey(token) {
  return `refresh:${token}`;
}

class AuthService {
  async login(email, password) {
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    const payload = { userId: user.id, tenantId: user.tenantId, role: user.role };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    await redis.set(refreshKey(refreshToken), '1', 'EX', REFRESH_TTL);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async refresh(token) {
    if (!token) throw Object.assign(new Error('Invalid refresh token'), { status: 401 });

    const exists = await redis.get(refreshKey(token));
    if (!exists) throw Object.assign(new Error('Invalid refresh token'), { status: 401 });

    const payload = verifyRefresh(token);
    const { userId, tenantId, role } = payload;

    await redis.del(refreshKey(token));
    const newRefresh = signRefresh({ userId, tenantId, role });
    await redis.set(refreshKey(newRefresh), '1', 'EX', REFRESH_TTL);

    return {
      accessToken: signAccess({ userId, tenantId, role }),
      refreshToken: newRefresh,
    };
  }

  async logout(token) {
    if (token) await redis.del(refreshKey(token));
  }

  async acceptInvite(token, name, password) {
    const user = await prisma.user.findFirst({
      where: { inviteToken: token, inviteExpiry: { gt: new Date() } },
    });

    if (!user) {
      throw Object.assign(new Error('Invalid or expired invite'), { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { name, passwordHash, inviteToken: null, inviteExpiry: null },
    });

    return { ok: true };
  }
}

module.exports = { AuthService };
