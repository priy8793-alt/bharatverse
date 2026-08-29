const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verifies a Bearer JWT and attaches the user to req.user.
 * Use `protect()` for routes that require any logged-in user.
 */
function protect() {
  return async function protectMiddleware(req, res, next) {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) {
        return res.status(401).json({ error: "Not authenticated. Missing bearer token." });
      }
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: "Server auth is not configured (missing JWT_SECRET)." });
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ error: "User for this token no longer exists." });
      }
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  };
}

/**
 * Restricts a route to one or more roles. Must be used after protect().
 * e.g. router.post('/x', protect(), requireRole('verifier','admin'), handler)
 */
function requireRole(...roles) {
  return function requireRoleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires one of these roles: ${roles.join(", ")}` });
    }
    next();
  };
}

module.exports = { protect, requireRole };
