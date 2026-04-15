const { Router } = require('express');
const { requireRole } = require('../../middlewares/roles');
const { UsersController } = require('./users.controller');

const usersRouter = Router();
const ctrl = new UsersController();

usersRouter.get('/', requireRole('ADMIN'), ctrl.list);
usersRouter.post('/invite', requireRole('ADMIN'), ctrl.invite);
usersRouter.patch('/:id/role', requireRole('OWNER'), ctrl.updateRole);
usersRouter.delete('/:id', requireRole('OWNER'), ctrl.remove);

module.exports = { usersRouter };
