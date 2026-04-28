import type { DependencyData } from './parsers/DependencyParser';

export interface StoredMpa {
  sessionId: string;
  filename: string;
  uploadedAt: string;
  data: DependencyData;
}

/**
 * Per-session store for parsed MPA (Migration Portfolio Assessment) inventories.
 * The agent's `get_dependency_graph` tool reads from here, so a consultant only
 * has to upload the Excel once and the copilot can answer dependency / wave
 * questions without re-uploading on every turn.
 *
 * In-memory by default to mirror OpportunityStorage. Swap for a persistent
 * implementation when DynamoDB-backed sessions are wired in.
 */
export interface MpaSessionStore {
  put(sessionId: string, mpa: StoredMpa): Promise<void>;
  get(sessionId: string): Promise<StoredMpa | null>;
  clear(sessionId: string): Promise<void>;
}

class InMemoryMpaSessionStore implements MpaSessionStore {
  private static instance: InMemoryMpaSessionStore;
  private storage = new Map<string, StoredMpa>();

  static getInstance(): InMemoryMpaSessionStore {
    if (!this.instance) this.instance = new InMemoryMpaSessionStore();
    return this.instance;
  }

  async put(sessionId: string, mpa: StoredMpa): Promise<void> {
    this.storage.set(sessionId, mpa);
  }

  async get(sessionId: string): Promise<StoredMpa | null> {
    return this.storage.get(sessionId) ?? null;
  }

  async clear(sessionId: string): Promise<void> {
    this.storage.delete(sessionId);
  }
}

let cached: MpaSessionStore | null = null;

export function getMpaSessionStore(): MpaSessionStore {
  if (!cached) cached = InMemoryMpaSessionStore.getInstance();
  return cached;
}

export function __resetMpaSessionStoreForTests(): void {
  cached = null;
}
