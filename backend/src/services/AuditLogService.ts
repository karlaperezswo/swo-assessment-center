import { v4 as uuidv4 } from 'uuid';
import { DynamoRepository, getDynamoRepository } from '../db/DynamoRepository';
import { keys } from '../db/keys';

export type AuditActor = {
  userId: string;
  orgId?: string;
  role?: string;
  ip?: string;
};

export interface AuditEntry {
  action: string;
  resource: string;
  actor: AuditActor;
  status: 'success' | 'failure';
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

interface StoredAudit {
  pk: string;
  sk: string;
  type: 'AUDIT';
  timestamp: string;
  ttl: number;
  id: string;
  action: string;
  resource: string;
  actorUserId: string;
  actorOrgId?: string;
  actorRole?: string;
  actorIp?: string;
  status: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Durable audit log. Entries live under `AUDIT#<yyyy-mm-dd> / <ts>#<userId>`
 * with a TTL of 1 year (set via DynamoDB's `ttl` attribute). Writes are
 * fire-and-forget from the callers' perspective but still awaited inside
 * this service so test mocks can assert on them.
 *
 * For local dev without DynamoDB (USE_DYNAMO_STORAGE unset), `record` logs
 * to stdout instead. Losing the DB path in dev is fine — audit is a prod
 * concern — but having SOME trace helps debug RBAC while iterating.
 */
export class AuditLogService {
  private readonly useDynamo: boolean;
  constructor(private readonly repo: DynamoRepository | null = null) {
    this.useDynamo = String(process.env.USE_DYNAMO_STORAGE ?? '').toLowerCase() === 'true';
  }

  async record(entry: AuditEntry): Promise<void> {
    const timestamp = new Date().toISOString();
    const date = timestamp.slice(0, 10);
    const id = uuidv4();

    const line = {
      level: 'audit',
      id,
      timestamp,
      action: entry.action,
      resource: entry.resource,
      status: entry.status,
      actor: entry.actor,
      correlationId: entry.correlationId,
      metadata: entry.metadata,
    };
    console.log(JSON.stringify(line));

    if (!this.useDynamo) return;

    const repo = this.repo ?? getDynamoRepository();
    const item: StoredAudit = {
      pk: keys.audit.pk(date),
      sk: `${timestamp}#${entry.actor.userId}`,
      type: 'AUDIT',
      timestamp,
      ttl: Math.floor(Date.now() / 1000) + ONE_YEAR_SECONDS,
      id,
      action: entry.action,
      resource: entry.resource,
      actorUserId: entry.actor.userId,
      actorOrgId: entry.actor.orgId,
      actorRole: entry.actor.role,
      actorIp: entry.actor.ip,
      status: entry.status,
      correlationId: entry.correlationId,
      metadata: entry.metadata,
    };

    try {
      await repo.put(item);
    } catch (err) {
      // Never let audit-writing take down the main request.
      console.error('[AuditLogService] failed to write entry:', err);
    }
  }
}

let singleton: AuditLogService | null = null;

export function getAuditLog(): AuditLogService {
  if (!singleton) singleton = new AuditLogService();
  return singleton;
}
