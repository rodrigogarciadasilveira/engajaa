const { Router } = require('express');
const { requireRole } = require('../../middlewares/roles');
const { SchedulerController } = require('./scheduler.controller');

const schedulerRouter = Router();
const ctrl = new SchedulerController();

schedulerRouter.get('/posts', requireRole('VIEWER'), ctrl.list);
schedulerRouter.post('/posts', requireRole('EDITOR'), ctrl.create);
schedulerRouter.patch('/posts/:id', requireRole('EDITOR'), ctrl.update);
schedulerRouter.delete('/posts/:id', requireRole('EDITOR'), ctrl.remove);

module.exports = { schedulerRouter };
