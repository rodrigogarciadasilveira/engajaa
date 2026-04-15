const { UsersService } = require('./users.service');

const svc = new UsersService();

class UsersController {
  list = async (req, res, next) => {
    try { res.json(await svc.list(req.tenantId)); } catch (e) { next(e); }
  };

  invite = async (req, res, next) => {
    try {
      const { email, role } = req.body;
      res.status(201).json(await svc.invite(req.tenantId, email, role));
    } catch (e) { next(e); }
  };

  updateRole = async (req, res, next) => {
    try {
      const result = await svc.updateRole(req.tenantId, req.user.role, req.params.id, req.body.role);
      res.json({ id: result.id, role: result.role });
    } catch (e) { next(e); }
  };

  remove = async (req, res, next) => {
    try {
      res.json(await svc.remove(req.tenantId, req.user.userId, req.params.id));
    } catch (e) { next(e); }
  };
}

module.exports = { UsersController };
