const jwt = require('jsonwebtoken');

const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware };
