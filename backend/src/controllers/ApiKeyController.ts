import { Request, Response } from 'express';
import { z } from 'zod';
import { getApiKeyRepository } from '../db/ApiKeyRepository';
import { getAuditLog } from '../services/AuditLogService';

const issueSchema = z.object({
  label: z.string().min(1).max(80),
  scopes: z.array(z.string().min(1).max(60)).max(20).default(['mcp:read']),
});

export class ApiKeyController {
  list = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, error: 'not authenticated' });
      return;
    }
    const keys = await getApiKeyRepository().listForUser(userId);
    res.json({ success: true, keys });
  };

  issue = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, error: 'not authenticated' });
      return;
    }
    const parse = issueSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.flatten() });
      return;
    }
    const { key, rawSecret } = await getApiKeyRepository().issue({
      userId,
      orgId: req.user?.orgId,
      label: parse.data.label,
      scopes: parse.data.scopes,
    });
    await getAuditLog().record({
      action: 'mcp-key:issue',
      resource: `mcpkey:${key.keyId}`,
      actor: {
        userId,
        orgId: req.user?.orgId,
        role: req.user?.role,
        ip: req.ip,
      },
      status: 'success',
      metadata: { label: key.label, scopes: key.scopes },
    });
    // Raw secret is returned exactly once — the client must persist it.
    res.status(201).json({ success: true, key, secret: rawSecret });
  };

  revoke = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, error: 'not authenticated' });
      return;
    }
    const { keyId } = req.params;
    const ok = await getApiKeyRepository().revoke(userId, keyId);
    if (!ok) {
      res.status(404).json({ success: false, error: 'key not found' });
      return;
    }
    await getAuditLog().record({
      action: 'mcp-key:revoke',
      resource: `mcpkey:${keyId}`,
      actor: {
        userId,
        orgId: req.user?.orgId,
        role: req.user?.role,
        ip: req.ip,
      },
      status: 'success',
    });
    res.json({ success: true });
  };
}
