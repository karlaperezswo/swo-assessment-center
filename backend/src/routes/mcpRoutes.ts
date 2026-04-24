import { Router } from 'express';
import { ApiKeyController } from '../controllers/ApiKeyController';
import { authenticateMcp } from '../mcp/authenticateApiKey';
import { handleMcpRequest } from '../mcp/httpController';
import { requirePermission } from '../middleware/requireRole';

const keyController = new ApiKeyController();

/**
 * MCP protocol endpoint — mounted at `/mcp` in the root app so it is
 * independent from the `/api` JWT middleware. Authenticated via API key
 * (or Cognito JWT fallback) through `authenticateMcp()`.
 */
export const mcpProtocolRouter = Router();
mcpProtocolRouter.all('/', authenticateMcp(), handleMcpRequest);

/**
 * API key management — under `/api/mcp-keys`, requires a logged-in user
 * with the `mcp-keys:manage:own` permission.
 */
export const mcpKeyRouter = Router();
mcpKeyRouter.get('/', requirePermission('mcp-keys:manage:own'), keyController.list);
mcpKeyRouter.post('/', requirePermission('mcp-keys:manage:own'), keyController.issue);
mcpKeyRouter.delete('/:keyId', requirePermission('mcp-keys:manage:own'), keyController.revoke);
