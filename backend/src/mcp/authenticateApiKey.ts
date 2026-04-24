import { RequestHandler } from 'express';
import { getApiKeyRepository } from '../db/ApiKeyRepository';
import { getAuditLog } from '../services/AuditLogService';
import type { McpServerContext } from './server';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      mcpCtx?: McpServerContext;
    }
  }
}

/**
 * MCP requests authenticate with a long-lived API key: `Authorization:
 * Bearer swoak_...`. The token is hashed, looked up on DynamoDB, and the
 * resulting owner + scopes are attached to req.mcpCtx for the handler.
 *
 * Cognito JWT auth (the same access token used by the SPA) is accepted as a
 * fallback — useful when the MCP endpoint is hit from a logged-in browser
 * doing dev testing.
 */
export function authenticateMcp(): RequestHandler {
  return async (req, res, next) => {
    const header = req.header('authorization') ?? req.header('Authorization');
    if (!header) {
      res.status(401).json({ error: 'missing bearer token' });
      return;
    }
    const [scheme, token] = header.split(/\s+/);
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      res.status(401).json({ error: 'invalid authorization header' });
      return;
    }

    // API key path — starts with our branded prefix.
    if (token.startsWith('swoak_')) {
      const key = await getApiKeyRepository().verify(token);
      if (!key) {
        res.status(401).json({ error: 'invalid or revoked api key' });
        return;
      }
      req.mcpCtx = {
        userId: key.userId,
        orgId: key.orgId,
        scopes: key.scopes,
      };
      await getAuditLog().record({
        action: 'mcp:authenticate',
        resource: `mcpkey:${key.keyId}`,
        actor: {
          userId: key.userId,
          orgId: key.orgId,
          ip: req.ip,
        },
        status: 'success',
      });
      next();
      return;
    }

    // Cognito JWT fallback — reuse existing req.user populated by the /api
    // authenticate() middleware. MCP is mounted under /mcp so that middleware
    // doesn't run; we accept the token if the caller was already authed
    // elsewhere (i.e. cookie handoff or manual header copy).
    if (req.user?.sub) {
      req.mcpCtx = {
        userId: req.user.sub,
        orgId: req.user.orgId,
        scopes: ['mcp:*'],
      };
      next();
      return;
    }

    res.status(401).json({ error: 'unrecognised credential' });
  };
}
