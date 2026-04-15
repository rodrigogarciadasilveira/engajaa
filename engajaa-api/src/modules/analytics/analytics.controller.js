const { z } = require('zod');
const { AnalyticsService } = require('./analytics.service');

const svc = new AnalyticsService();
const daysSchema = z.coerce.number().int().min(7).max(90).default(30);

class AnalyticsController {
  overview = async (req, res, next) => {
    try {
      const days = daysSchema.parse(req.query.days);
      res.json(await svc.getOverview(req.tenantId, days));
    } catch (err) { next(err); }
  };

  posts = async (req, res, next) => {
    try {
      const days = daysSchema.parse(req.query.days);
      res.json(await svc.getPosts(req.tenantId, days));
    } catch (err) { next(err); }
  };

  byFormat = async (req, res, next) => {
    try {
      const days = daysSchema.parse(req.query.days);
      res.json(await svc.getByFormat(req.tenantId, days));
    } catch (err) { next(err); }
  };

  bestTimes = async (req, res, next) => {
    try {
      res.json(await svc.getBestTimes(req.tenantId));
    } catch (err) { next(err); }
  };

  daily = async (req, res, next) => {
    try {
      const days = daysSchema.parse(req.query.days);
      res.json(await svc.getDailyMetrics(req.tenantId, days));
    } catch (err) { next(err); }
  };
}

module.exports = { AnalyticsController };
