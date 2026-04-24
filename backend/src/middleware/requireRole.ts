import { RequestHandler } from 'express';
import { Action, Role, can } from '../../../shared/permissions';

/**
 * Guards an endpoint by role. Usage:
 *   router.get('/admin/users', requireRole('superadmin'), handler)
 *
 * Responds 401 if no authenticated user (auth middleware must run first),
 * 403 if the role doesn't match. When AUTH_ENABLED=false the middleware is a
 * no-op so local dev keeps working.
 */
export function requireRole(...roles: Role[]): RequestHandler {
  const enabled = String(process.env.AUTH_ENABLED ?? '').toLowerCase() === 'true';
  return (req, res, next) => {
    if (!enabled) return next();
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'not authenticated' });
      return;
    }
    if (!user.role || !roles.includes(user.role)) {
      res.status(403).json({ success: false, error: 'forbidden: insufficient role' });
      return;
    }
    next();
  };
}

/**
 * Permission-based guard — prefer this over requireRole when the rule is
 * expressed in terms of capabilities (which tolerates role reorganisations).
 */
export function requirePermission(...actions: Action[]): RequestHandler {
  const enabled = String(process.env.AUTH_ENABLED ?? '').toLowerCase() === 'true';
  return (req, res, next) => {
    if (!enabled) return next();
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'not authenticated' });
      return;
    }
    const hasAll = actions.every((a) => can(user.role, a));
    if (!hasAll) {
      res.status(403).json({ success: false, error: 'forbidden: missing permission' });
      return;
    }
    next();
  };
}
