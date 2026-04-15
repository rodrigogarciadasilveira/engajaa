const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { authRouter } = require('./modules/auth/auth.routes');
const { instagramRouter } = require('./modules/instagram/instagram.routes');
const { InstagramController } = require('./modules/instagram/instagram.controller');
const { analyticsRouter } = require('./modules/analytics/analytics.routes');
const { suggestionsRouter } = require('./modules/suggestions/suggestions.routes');
const { schedulerRouter } = require('./modules/scheduler/scheduler.routes');
const { usersRouter } = require('./modules/users/users.routes');
const { tenantRouter } = require('./modules/tenant/tenant.routes');
const { growthRadarRouter } = require('./modules/growth-radar/growth-radar.routes');
const { authMiddleware } = require('./middlewares/auth');
const { tenantMiddleware } = require('./middlewares/tenant');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS — only allow app origins
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Global rate limit
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Health check (public)
app.get('/health', (_req, res) => res.json({ ok: true }));


// Public routes
app.use('/auth', authRouter);

// Public Instagram OAuth callback (no JWT — browser redirect from Meta)
const igCtrl = new InstagramController();
app.get('/instagram/callback', igCtrl.publicCallback);

// Protected routes — require JWT + tenant context
app.use(authMiddleware);
app.use(tenantMiddleware);

app.use('/instagram', instagramRouter);
app.use('/analytics', analyticsRouter);
app.use('/suggestions', suggestionsRouter);
app.use('/scheduler', schedulerRouter);
app.use('/users', usersRouter);
app.use('/tenant', tenantRouter);
app.use('/growth-radar', growthRadarRouter);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));

module.exports = app;
