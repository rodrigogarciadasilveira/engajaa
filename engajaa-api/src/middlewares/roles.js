const ROLE_HIERARCHY = { OWNER: 4, ADMIN: 3, EDITOR: 2, VIEWER: 1 };

function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) return res.status(401).json({ error: 'Unauthenticated' });

    const allowed = roles.some(
      (r) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[r]
    );
    if (!allowed) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

module.exports = { requireRole };
