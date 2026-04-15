const { Router } = require('express');
const { requireRole } = require('../../middlewares/roles');
const { AnalyticsController } = require('./analytics.controller');

const analyticsRouter = Router();
const ctrl = new AnalyticsController();

analyticsRouter.get('/overview', requireRole('VIEWER'), ctrl.overview);
analyticsRouter.get('/posts', requireRole('VIEWER'), ctrl.posts);
analyticsRouter.get('/by-format', requireRole('VIEWER'), ctrl.byFormat);
analyticsRouter.get('/best-times', requireRole('VIEWER'), ctrl.bestTimes);
analyticsRouter.get('/daily', requireRole('VIEWER'), ctrl.daily);

module.exports = { analyticsRouter };
