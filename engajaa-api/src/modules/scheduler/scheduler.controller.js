const { SchedulerService } = require('./scheduler.service');

const svc = new SchedulerService();

class SchedulerController {
  list   = async (req, res, next) => { try { res.json(await svc.list(req.tenantId)); } catch (e) { next(e); } };
  create = async (req, res, next) => { try { res.status(201).json(await svc.create(req.tenantId, req.user.userId, req.body)); } catch (e) { next(e); } };
  update = async (req, res, next) => { try { res.json(await svc.update(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
  remove = async (req, res, next) => { try { await svc.remove(req.tenantId, req.params.id); res.json({ ok: true }); } catch (e) { next(e); } };
}

module.exports = { SchedulerController };
