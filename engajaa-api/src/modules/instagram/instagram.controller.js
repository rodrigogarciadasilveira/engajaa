const { InstagramService } = require('./instagram.service');

const svc = new InstagramService();

class InstagramController {
  connect = async (req, res, next) => {
    try {
      const url = await svc.getOAuthUrl(req.tenantId);
      res.json({ url });
    } catch (err) {
      next(err);
    }
  };

  // Used by the public callback route (no JWT) — tenantId comes from state param
  publicCallback = async (req, res, next) => {
    try {
      const { code, state, error } = req.query;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';

      if (error) return res.redirect(`${frontendUrl}/settings?ig_error=${encodeURIComponent(error)}`);
      if (!code || !state) return res.redirect(`${frontendUrl}/settings?ig_error=missing_params`);

      let tenantId;
      try {
        tenantId = Buffer.from(state, 'base64').toString('utf8');
      } catch {
        return res.redirect(`${frontendUrl}/settings?ig_error=invalid_state`);
      }

      await svc.handleCallback(tenantId, code);
      res.redirect(`${frontendUrl}/settings?ig_connected=1`);
    } catch (err) {
      console.error('[Instagram callback error]', err.message);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
      res.redirect(`${frontendUrl}/settings?ig_error=${encodeURIComponent(err.message)}`);
    }
  };

  sync = async (req, res, next) => {
    try {
      const result = await svc.syncPosts(req.tenantId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  status = async (req, res, next) => {
    try {
      const result = await svc.getStatus(req.tenantId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  disconnect = async (req, res, next) => {
    try {
      await svc.disconnect(req.tenantId);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };

  profile = async (req, res, next) => {
    try {
      const result = await svc.getStatus(req.tenantId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { InstagramController };
