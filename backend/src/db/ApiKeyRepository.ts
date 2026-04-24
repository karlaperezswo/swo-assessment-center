import crypto from 'crypto';
import { DynamoRepository, getDynamoRepository } from './DynamoRepository';
import { keys } from './keys';

export interface ApiKey {
  keyId: string;
  userId: string;
  orgId?: string;
  label: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

/**
 * MCP / long-lived API keys.
 *
 * We never store the raw secret — only a SHA-256 hash. Clients must keep the
 * key returned from `issue()`; a lost key can only be rotated, not recovered.
 *
 * Keys live under `USER#<userId> / MCPKEY#<keyId>` so a user's keys are
 * listable with a single query, and each key references its owner back to
 * the user for audit.
 */

interface StoredApiKey extends ApiKey {
  pk: string;
  sk: string;
  type: 'MCPKEY';
  keyHash: string;
  gsi1pk: string; // HASH#<hash> — reverse lookup during verify()
  gsi1sk: string;
}

const KEY_PREFIX = 'swoak_';

function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateRawKey(): string {
  return KEY_PREFIX + crypto.randomBytes(24).toString('base64url');
}

export class ApiKeyRepository {
  private readonly useDynamo: boolean;
  private readonly memory = new Map<string, StoredApiKey>();

  constructor(private readonly repo: DynamoRepository | null = null) {
    this.useDynamo = String(process.env.USE_DYNAMO_STORAGE ?? '').toLowerCase() === 'true';
  }

  async issue(params: {
    userId: string;
    orgId?: string;
    label: string;
    scopes: string[];
  }): Promise<{ key: ApiKey; rawSecret: string }> {
    const keyId = crypto.randomUUID();
    const rawSecret = generateRawKey();
    const keyHash = hashKey(rawSecret);

    const record: StoredApiKey = {
      pk: keys.user.pk(params.userId),
      sk: keys.user.mcpKey(keyId).sk,
      type: 'MCPKEY',
      keyId,
      userId: params.userId,
      orgId: params.orgId,
      label: params.label,
      scopes: params.scopes,
      createdAt: new Date().toISOString(),
      keyHash,
      gsi1pk: `APIKEYHASH#${keyHash}`,
      gsi1sk: keys.user.pk(params.userId),
    };

    await this.putRecord(record);

    const publicKey: ApiKey = {
      keyId: record.keyId,
      userId: record.userId,
      orgId: record.orgId,
      label: record.label,
      scopes: record.scopes,
      createdAt: record.createdAt,
    };
    return { key: publicKey, rawSecret };
  }

  async listForUser(userId: string): Promise<ApiKey[]> {
    const rows = await this.queryByPk(keys.user.pk(userId), 'MCPKEY#');
    return rows.map((r) => this.strip(r));
  }

  async verify(rawSecret: string): Promise<ApiKey | null> {
    const hash = hashKey(rawSecret);
    const record = await this.findByHash(hash);
    if (!record || record.revokedAt) return null;
    // update lastUsedAt best-effort
    record.lastUsedAt = new Date().toISOString();
    await this.putRecord(record).catch(() => void 0);
    return this.strip(record);
  }

  async revoke(userId: string, keyId: string): Promise<boolean> {
    const pk = keys.user.pk(userId);
    const sk = keys.user.mcpKey(keyId).sk;
    if (!this.useDynamo) {
      const record = this.memory.get(`${pk}#${sk}`);
      if (!record) return false;
      record.revokedAt = new Date().toISOString();
      return true;
    }
    const repo = this.repo ?? getDynamoRepository();
    try {
      await repo.update({
        Key: { pk, sk },
        UpdateExpression: 'SET revokedAt = :r',
        ExpressionAttributeValues: { ':r': new Date().toISOString() },
        ConditionExpression: 'attribute_exists(pk)',
      });
      return true;
    } catch {
      return false;
    }
  }

  // ---- low-level helpers ----------------------------------------------

  private strip(r: StoredApiKey): ApiKey {
    const { pk, sk, type, keyHash, gsi1pk, gsi1sk, ...rest } = r;
    void pk; void sk; void type; void keyHash; void gsi1pk; void gsi1sk;
    return rest;
  }

  private async putRecord(record: StoredApiKey): Promise<void> {
    if (!this.useDynamo) {
      this.memory.set(`${record.pk}#${record.sk}`, record);
      return;
    }
    const repo = this.repo ?? getDynamoRepository();
    await repo.put(record);
  }

  private async queryByPk(pk: string, skPrefix: string): Promise<StoredApiKey[]> {
    if (!this.useDynamo) {
      return [...this.memory.values()].filter((r) => r.pk === pk && r.sk.startsWith(skPrefix));
    }
    const repo = this.repo ?? getDynamoRepository();
    return repo.queryAll<StoredApiKey>(pk, skPrefix);
  }

  private async findByHash(hash: string): Promise<StoredApiKey | null> {
    if (!this.useDynamo) {
      return (
        [...this.memory.values()].find((r) => r.keyHash === hash) ?? null
      );
    }
    const repo = this.repo ?? getDynamoRepository();
    const result = await repo.queryByPk<StoredApiKey>(
      `APIKEYHASH#${hash}`,
      undefined,
      { indexName: 'GSI1', limit: 1 }
    );
    return result.items[0] ?? null;
  }
}

let singleton: ApiKeyRepository | null = null;
export function getApiKeyRepository(): ApiKeyRepository {
  if (!singleton) singleton = new ApiKeyRepository();
  return singleton;
}
