const { Router } = require('express');
const { requireRole } = require('../../middlewares/roles');
const { TenantController } = require('./tenant.controller');

const tenantRouter = Router();
const ctrl = new TenantController();

tenantRouter.get('/plan', requireRole('OWNER'), ctrl.getPlan);
tenantRouter.post('/billing-portal', requireRole('OWNER'), ctrl.billingPortal);

module.exports = { tenantRouter };
