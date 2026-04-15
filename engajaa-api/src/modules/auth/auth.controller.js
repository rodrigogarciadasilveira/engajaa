const { z } = require('zod');
const { AuthService } = require('./auth.service');

const svc = new AuthService();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth',
};

class AuthController {
  login = async (req, res, next) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);

      const { accessToken, refreshToken, user } = await svc.login(email, password);

      res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
      res.json({ accessToken, user });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const token = req.cookies?.refreshToken;
      const { accessToken, refreshToken } = await svc.refresh(token);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
      res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req, res, next) => {
    try {
      const token = req.cookies?.refreshToken;
      await svc.logout(token);
      res.clearCookie('refreshToken', { path: '/auth' });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };

  acceptInvite = async (req, res, next) => {
    try {
      const { token, name, password } = z.object({
        token: z.string(),
        name: z.string().min(2),
        password: z.string().min(8),
      }).parse(req.body);

      const result = await svc.acceptInvite(token, name, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { AuthController };
