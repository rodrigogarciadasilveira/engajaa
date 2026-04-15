const { Router } = require('express');
const { authMiddleware } = require('../../middlewares/auth');
const { AuthController } = require('./auth.controller');

const authRouter = Router();
const ctrl = new AuthController();

authRouter.post('/login', ctrl.login);
authRouter.post('/refresh', ctrl.refresh);
authRouter.post('/logout', authMiddleware, ctrl.logout);
authRouter.post('/invite/accept', ctrl.acceptInvite);

module.exports = { authRouter };
