'use strict';

const { GrowthRadarService } = require('./growth-radar.service');

const svc = new GrowthRadarService();

class GrowthRadarController {
  /**
   * GET /growth-radar/overview
   * Retorna o relatório mais recente do tenant.
   */
  async overview(req, res, next) {
    try {
      const report = await svc.getLatest(req.tenantId);

      if (!report) {
        return res.status(200).json({
          status: 'NO_REPORT',
          message: 'Ainda não há dados suficientes para gerar um radar de crescimento confiável.',
        });
      }

      return res.json(report);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /growth-radar/recalculate
   * Recalcula o radar do tenant (ADMIN+).
   */
  async recalculate(req, res, next) {
    try {
      const report = await svc.generateReport(req.tenantId);
      return res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /growth-radar/history
   * Histórico paginado de relatórios.
   */
  async history(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const data = await svc.getHistory(req.tenantId, page, Math.min(limit, 50));
      return res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { GrowthRadarController };
