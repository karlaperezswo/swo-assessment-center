import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { buildBedrockRateLimiter } from '../middleware/security';
import { requirePermission } from '../middleware/requireRole';

const controller = new AgentController();
const bedrockLimiter = buildBedrockRateLimiter();

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
