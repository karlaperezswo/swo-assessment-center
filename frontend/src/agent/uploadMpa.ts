import { getAccessToken } from '@/auth/tokenBridge';

export interface MpaUploadSummary {
  sessionId: string;
  filename: string;
  summary: {
    servers: number;
    applications: number;
    dependencies: number;
    databases: number;
    totalDependencies: number;
    uniqueServers: number;
    uniqueApplications: number;
    uniquePorts: number;
  };
  message: string;
}

const API_BASE =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_URL ?? '';

/**
 * Upload an MPA Excel/CSV for the current session. The backend parses the
 * workbook, stores the dependency graph in-memory keyed by sessionId, and
 * makes it available to the agent's `get_dependency_graph` tool on the
 * next chat turn — so the consultant doesn't have to paste rows manually.
 */
export async function uploadMpaForAgent(
  file: File,
  sessionId: string
): Promise<MpaUploadSummary> {
  const form = new FormData();
  form.append('file', file);
  form.append('sessionId', sessionId);

  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}/api/agent/uploads/mpa`, {
    method: 'POST',
    headers,
    body: form,
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || !json?.success) {
    throw new Error(json?.error || `Upload failed (HTTP ${resp.status})`);
  }
  return json.data as MpaUploadSummary;
}
