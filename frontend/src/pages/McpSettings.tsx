import { useEffect, useState } from 'react';
import { Copy, Plus, Trash2, Loader2, CheckCircle2, Key } from 'lucide-react';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';

interface ApiKey {
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
 * /settings/mcp — consultor-facing screen to list, generate and revoke
 * MCP API keys. The freshly-minted secret is shown exactly once in a
 * modal-ish banner; after that only the keyId metadata is displayed.
 */
export function McpSettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/mcp-keys');
      setKeys(res.data.keys ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error loading keys');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function issue() {
    if (!newLabel.trim()) return;
    setIssuing(true);
    setError(null);
    try {
      const res = await apiClient.post('/api/mcp-keys', {
        label: newLabel.trim(),
        scopes: ['mcp:read', 'mcp:tools:call'],
      });
      setFreshSecret(res.data.secret);
      setNewLabel('');
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error issuing key');
    } finally {
      setIssuing(false);
    }
  }

  async function revoke(keyId: string) {
    if (!confirm('¿Revocar esta API key? Los clientes que la usen dejarán de funcionar inmediatamente.')) return;
    try {
      await apiClient.delete(`/api/mcp-keys/${keyId}`);
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error revoking');
    }
  }

  const apiBase =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_API_URL ?? window.location.origin;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <header className="flex items-center gap-3">
        <Key className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">MCP Access Keys</h1>
          <p className="text-sm text-gray-500">
            Autoriza clientes MCP externos (Claude Desktop, IDEs, scripts) a consumir tu sesión
            del Assessment Center.
          </p>
        </div>
      </header>

      {freshSecret && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <div className="font-medium">Tu nueva API key</div>
              <div className="mt-1 text-xs text-amber-900">
                Cópiala ahora. No volverá a mostrarse. Si la pierdes, revócala y genera otra.
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-xs break-all">
                  {freshSecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(freshSecret);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  {copied ? 'Copiada' : 'Copiar'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFreshSecret(null)}
                >
                  Cerrar
                </Button>
              </div>

              <div className="mt-4 text-xs">
                <div className="font-medium">Snippet para Claude Desktop (~/.config/claude/mcp.json):</div>
                <pre className="mt-1 overflow-x-auto rounded bg-white p-3 font-mono text-[11px]">{`{
  "mcpServers": {
    "swo-assessment": {
      "url": "${apiBase}/mcp",
      "headers": { "Authorization": "Bearer ${freshSecret}" }
    }
  }
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nombre descriptivo (ej. 'Claude Desktop laptop')"
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <Button onClick={issue} disabled={issuing || !newLabel.trim()}>
            {issuing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Generar nueva key
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">Tus keys</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes API keys todavía.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {keys.map((k) => (
              <li key={k.keyId} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{k.label}</div>
                  <div className="text-xs text-gray-500">
                    {k.keyId.slice(0, 8)}… · creada {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt && ` · último uso ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                    {k.revokedAt && (
                      <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] uppercase">Revocada</span>
                    )}
                  </div>
                </div>
                {!k.revokedAt && (
                  <Button variant="ghost" size="icon" onClick={() => revoke(k.keyId)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
