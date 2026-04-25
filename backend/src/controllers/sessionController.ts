import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

/**
 * File-based session persistence.
 *
 * Keys by the authenticated Cognito `sub` when AUTH_ENABLED=true. Falls back
 * to the `x-session-key` header (or `session.default`) otherwise so local dev
 * without auth continues to work. This is intentionally minimal — a real
 * deployment should move this to DynamoDB with a TTL, but the file layer
 * keeps the surface identical so swapping the store is a one-file change.
 */

const SESSION_DIR = path.join(__dirname, '..', '..', 'data', 'sessions');
const MAX_BYTES = 5 * 1024 * 1024; // 5MB per snapshot

async function ensureDir(): Promise<void> {
  await fs.mkdir(SESSION_DIR, { recursive: true });
}

/**
 * Strict session-key sanitiser.
 *
 * Allows only characters that cannot form a path-traversal sequence (no dots,
 * no slashes). Anything else is replaced with `_`. Empty results fall back to
 * `default` so callers always get a usable filename.
 */
function sanitizeKey(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : 'default';
}

function resolveKey(req: Request): string {
  const sub = req.user?.sub;
  if (sub) return sanitizeKey(sub);
  const header = req.header('x-session-key');
  if (header) return sanitizeKey(header);
  return 'default';
}

function sessionPath(key: string): string {
  // Defence in depth: validate the resolved path stays inside SESSION_DIR.
  const target = path.resolve(SESSION_DIR, `${key}.json`);
  const root = path.resolve(SESSION_DIR);
  if (!target.startsWith(root + path.sep)) {
    throw new Error('Invalid session key');
  }
  return target;
}

export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    await ensureDir();
    const key = resolveKey(req);
    const file = sessionPath(key);
    try {
      const content = await fs.readFile(file, 'utf-8');
      res.json({ success: true, data: JSON.parse(content) });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        res.json({ success: true, data: null });
        return;
      }
      throw err;
    }
  } catch (err: any) {
    console.error('[session] GET failed:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load session' });
  }
}

export async function putSession(req: Request, res: Response): Promise<void> {
  try {
    await ensureDir();
    const key = resolveKey(req);
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ success: false, error: 'Body must be a JSON object' });
      return;
    }
    const serialized = JSON.stringify(payload);
    if (Buffer.byteLength(serialized, 'utf-8') > MAX_BYTES) {
      res.status(413).json({ success: false, error: 'Session snapshot exceeds 5MB limit' });
      return;
    }
    await fs.writeFile(sessionPath(key), serialized, 'utf-8');
    res.json({ success: true, key, bytes: serialized.length });
  } catch (err: any) {
    console.error('[session] PUT failed:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save session' });
  }
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    await ensureDir();
    const key = resolveKey(req);
    try {
      await fs.unlink(sessionPath(key));
      res.json({ success: true });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        res.json({ success: true, note: 'No session to delete' });
        return;
      }
      throw err;
    }
  } catch (err: any) {
    console.error('[session] DELETE failed:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete session' });
  }
}
