'use strict';

const { Router } = require('express');
const { requireRole } = require('../../middlewares/roles');
const { GrowthRadarController } = require('./growth-radar.controller');

const growthRadarRouter = Router();
const ctrl = new GrowthRadarController();

// Consulta o relatório mais recente — qualquer membro pode ver
growthRadarRouter.get('/overview', requireRole('VIEWER'), (req, res, next) => ctrl.overview(req, res, next));

// Recalcula manualmente — apenas ADMIN+
growthRadarRouter.post('/recalculate', requireRole('ADMIN'), (req, res, next) => ctrl.recalculate(req, res, next));

// Histórico paginado — qualquer membro pode ver
growthRadarRouter.get('/history', requireRole('VIEWER'), (req, res, next) => ctrl.history(req, res, next));

module.exports = { growthRadarRouter };
