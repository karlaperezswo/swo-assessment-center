import {
  ClientFormData,
  BriefingSession,
  ImmersionDayPlan,
  MigrationWave,
  PhaseStatus,
} from '@/types/assessment';
import { readPersisted, writePersisted, clearPersisted, storageKey } from '@/lib/usePersistedState';
import apiClient from '@/lib/api';

export interface SessionSnapshot {
  version: 1;
  savedAt: string;
  clientData: ClientFormData;
  phaseStatus: PhaseStatus;
  briefingSessions: BriefingSession[];
  immersionDays: ImmersionDayPlan[];
  migrationWaves: MigrationWave[];
  opportunitySessionId: string | null;
}

const SESSION_KEY = 'session.current';

export function saveSession(snapshot: Omit<SessionSnapshot, 'version' | 'savedAt'>): void {
  const full: SessionSnapshot = {
    ...snapshot,
    version: 1,
    savedAt: new Date().toISOString(),
  };
  writePersisted(SESSION_KEY, full);
}

export function loadSession(): SessionSnapshot | null {
  return readPersisted<SessionSnapshot | null>(SESSION_KEY, null);
}

export function clearSession(): void {
  clearPersisted(SESSION_KEY);
}

export function exportSessionAsJson(snapshot: SessionSnapshot): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const safeName = (snapshot.clientData.clientName || 'session')
    .replace(/[^a-z0-9]+/gi, '_')
    .toLowerCase();
  const link = document.createElement('a');
  link.href = url;
  link.download = `swo_session_${safeName}_${snapshot.savedAt.split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importSessionFromFile(file: File): Promise<SessionSnapshot> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || parsed.version !== 1) {
    throw new Error('Invalid session file — expected version 1.');
  }
  if (!parsed.clientData || !parsed.phaseStatus) {
    throw new Error('Session file missing required fields.');
  }
  return parsed as SessionSnapshot;
}

export interface PersistedKeysSnapshot {
  [key: string]: unknown;
}

const AUXILIARY_KEYS = ['readiness.checklist', 'tco.scenarioConfig', 'riskRules'];

export function collectAuxiliaryState(): PersistedKeysSnapshot {
  const out: PersistedKeysSnapshot = {};
  AUXILIARY_KEYS.forEach((k) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey(k));
      if (raw !== null) out[k] = JSON.parse(raw);
    } catch {
      // ignore corrupt entries
    }
  });
  return out;
}

export function applyAuxiliaryState(aux: PersistedKeysSnapshot | undefined): void {
  if (!aux) return;
  Object.entries(aux).forEach(([k, v]) => {
    writePersisted(k, v);
  });
}

/**
 * Pull and push session snapshots against the backend `/api/session` endpoint.
 * Backend persists keyed by Cognito sub when auth is on, or by the
 * `x-session-key` header when running unauthenticated locally.
 */
const SESSION_KEY_HEADER = 'x-session-key';
const LOCAL_SESSION_KEY = 'session.remoteKey';

function resolveRemoteKey(): string {
  let key = readPersisted<string | null>(LOCAL_SESSION_KEY, null);
  if (!key) {
    key = `anon-${crypto.randomUUID?.() ?? Date.now()}`;
    writePersisted(LOCAL_SESSION_KEY, key);
  }
  return key;
}

export interface RemoteSessionBundle {
  snapshot: SessionSnapshot;
  auxiliary?: PersistedKeysSnapshot;
}

export async function pushSessionToCloud(
  snapshot: Omit<SessionSnapshot, 'version' | 'savedAt'>
): Promise<void> {
  const full: SessionSnapshot = {
    ...snapshot,
    version: 1,
    savedAt: new Date().toISOString(),
  };
  const bundle: RemoteSessionBundle = {
    snapshot: full,
    auxiliary: collectAuxiliaryState(),
  };
  await apiClient.put('/api/session', bundle, {
    headers: { [SESSION_KEY_HEADER]: resolveRemoteKey() },
  });
}

export async function pullSessionFromCloud(): Promise<RemoteSessionBundle | null> {
  const response = await apiClient.get('/api/session', {
    headers: { [SESSION_KEY_HEADER]: resolveRemoteKey() },
  });
  if (!response.data?.success) return null;
  const bundle = response.data.data as RemoteSessionBundle | null;
  if (!bundle || !bundle.snapshot) return null;
  return bundle;
}

export async function deleteCloudSession(): Promise<void> {
  await apiClient.delete('/api/session', {
    headers: { [SESSION_KEY_HEADER]: resolveRemoteKey() },
  });
}
