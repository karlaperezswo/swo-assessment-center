import { Router } from 'express';
import { getSession, putSession, deleteSession } from '../controllers/sessionController';
import { requirePermission } from '../middleware/requireRole';

export const sessionRouter = Router();

// Session snapshots are scoped to the authenticated user (req.user.sub) inside
// the controller; the permission check here ensures only roles that can read /
// write their own sessions reach the handler.
sessionRouter.get('/', requirePermission('sessions:read:own'), getSession);
sessionRouter.put('/', requirePermission('sessions:edit'), putSession);
sessionRouter.delete('/', requirePermission('sessions:edit'), deleteSession);
