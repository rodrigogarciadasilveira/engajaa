const { Router } = require('express');
const { requireRole } = require('../../middlewares/roles');
const { InstagramController } = require('./instagram.controller');

const instagramRouter = Router();
const ctrl = new InstagramController();

instagramRouter.get('/connect', requireRole('OWNER'), ctrl.connect);
instagramRouter.post('/sync', requireRole('ADMIN'), ctrl.sync);
instagramRouter.get('/status', requireRole('VIEWER'), ctrl.status);
instagramRouter.delete('/disconnect', requireRole('OWNER'), ctrl.disconnect);
instagramRouter.get('/profile', requireRole('VIEWER'), ctrl.profile);

module.exports = { instagramRouter };
