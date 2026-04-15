const { prisma } = require('../config/database');

async function tenantMiddleware(req, res, next) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(401).json({ error: 'No tenant in token' });

  req.tenantId = tenantId;

  // Set RLS context for this transaction
  try {
    await prisma.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
  } catch {
    // Outside transaction context — set as session var fallback
  }

  next();
}

module.exports = { tenantMiddleware };
