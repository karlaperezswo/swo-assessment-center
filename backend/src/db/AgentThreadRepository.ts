import { DynamoRepository, getDynamoRepository } from './DynamoRepository';
import { keys } from './keys';

export type AgentRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AgentMessage {
  role: AgentRole;
  content: string;
  /** Optional Claude tool-use metadata (serialised JSON string). */
  toolUse?: string;
  /** Timestamp in ISO-8601. */
  createdAt: string;
}

export interface AgentThread {
  sessionId: string;
  threadId: string;
  ownerId: string;
  orgId?: string;
  title?: string;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
}

interface StoredAgentThread extends AgentThread {
  pk: string;
  sk: string;
  type: 'AGENT_THREAD';
}

/**
 * Persists agent conversations in the single-table design under
 * `SESSION#<sessionId> / AGENT#<threadId>`. Falls back to an in-memory map
 * when USE_DYNAMO_STORAGE is off, so local dev keeps working.
 */
export class AgentThreadRepository {
  private readonly useDynamo: boolean;
  private readonly memory = new Map<string, AgentThread>();

  constructor(private readonly repo: DynamoRepository | null = null) {
    this.useDynamo = String(process.env.USE_DYNAMO_STORAGE ?? '').toLowerCase() === 'true';
  }

  private key(threadId: string): string {
    return threadId;
  }

  async save(thread: AgentThread): Promise<void> {
    const next: AgentThread = {
      ...thread,
      updatedAt: new Date().toISOString(),
    };
    if (!this.useDynamo) {
      this.memory.set(this.key(next.threadId), next);
      return;
    }
    const repo = this.repo ?? getDynamoRepository();
    const item: StoredAgentThread = {
      ...next,
      type: 'AGENT_THREAD',
      pk: keys.session.pk(next.sessionId),
      sk: keys.session.agentThread(next.threadId).sk,
    };
    await repo.put(item);
  }

  async get(sessionId: string, threadId: string): Promise<AgentThread | null> {
    if (!this.useDynamo) {
      return this.memory.get(this.key(threadId)) ?? null;
    }
    const repo = this.repo ?? getDynamoRepository();
    const raw = await repo.get<StoredAgentThread>(
      keys.session.pk(sessionId),
      keys.session.agentThread(threadId).sk
    );
    if (!raw) return null;
    const { pk, sk, type, ...thread } = raw;
    void pk; void sk; void type;
    return thread;
  }

  async appendMessage(
    sessionId: string,
    threadId: string,
    message: AgentMessage
  ): Promise<AgentThread> {
    const existing = await this.get(sessionId, threadId);
    const base: AgentThread = existing ?? {
      sessionId,
      threadId,
      ownerId: 'anonymous',
      title: undefined,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next: AgentThread = {
      ...base,
      messages: [...base.messages, message],
    };
    await this.save(next);
    return next;
  }
}

let singleton: AgentThreadRepository | null = null;
export function getAgentThreadRepository(): AgentThreadRepository {
  if (!singleton) singleton = new AgentThreadRepository();
  return singleton;
}
