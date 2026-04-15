const { prisma } = require('../../config/database');

class TenantController {
  getPlan = async (req, res, next) => {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
      res.json({ plan: tenant.plan, status: tenant.status });
    } catch (e) { next(e); }
  };

  billingPortal = async (req, res, next) => {
    try {
      // Stripe integration placeholder
      res.json({ url: 'https://billing.stripe.com/session/placeholder' });
    } catch (e) { next(e); }
  };
}

module.exports = { TenantController };
