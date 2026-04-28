import { Router } from 'express';
import multer from 'multer';
import { AgentController } from '../controllers/AgentController';
import { AgentUploadController } from '../controllers/agentUploadController';
import { buildBedrockRateLimiter } from '../middleware/security';
import { requirePermission } from '../middleware/requireRole';

const controller = new AgentController();
const uploadController = new AgentUploadController();
const bedrockLimiter = buildBedrockRateLimiter();

const mpaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB ceiling for MPA workbooks
});

export const agentRouter = Router();

// Chat — hits Bedrock, so it gets the stricter limiter on top of the base.
agentRouter.post(
  '/chat',
  bedrockLimiter,
  requirePermission('bedrock:invoke'),
  controller.chat
);

agentRouter.get(
  '/threads/:sessionId/:threadId',
  requirePermission('sessions:read:own'),
  controller.getThread
);

// MPA upload — parsed server-side, scoped to the session, consumed by the
// agent's `get_dependency_graph` tool on the next turn.
agentRouter.post(
  '/uploads/mpa',
  requirePermission('assessments:upload'),
  mpaUpload.single('file'),
  uploadController.uploadMpa
);

agentRouter.delete(
  '/uploads/mpa/:sessionId',
  requirePermission('assessments:upload'),
  uploadController.clearMpa
);
