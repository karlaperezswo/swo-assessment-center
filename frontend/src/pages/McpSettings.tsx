import { useEffect, useState } from 'react';
import {
  Copy,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Key,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Tooltip } from '@/components/ui/tooltip';

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
 * /settings/mcp — issue, list and revoke MCP API keys.
 *
 * The freshly-minted secret is shown in a modal that requires explicit
 * confirmation ("I have stored this securely") before it can be closed —
 * this stops accidental dismissals while the secret is still onscreen.
 */
export function McpSettingsPage() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState<'secret' | 'snippet' | null>(null);
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
      setAcknowledged(false);
      setNewLabel('');
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error issuing key');
    } finally {
      setIssuing(false);
    }
  }

  async function revoke(keyId: string) {
    if (
      !confirm(
        '¿Revocar esta API key? Los clientes que la usen dejarán de funcionar inmediatamente.'
      )
    )
      return;
    try {
      await apiClient.delete(`/api/mcp-keys/${keyId}`);
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error revoking');
    }
  }

  const apiBase =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL ??
    window.location.origin;

  const snippet = freshSecret
    ? `{
  "mcpServers": {
    "swo-assessment": {
      "url": "${apiBase}/mcp",
      "headers": { "Authorization": "Bearer ${freshSecret}" }
    }
  }
}`
    : '';

  const copy = async (kind: 'secret' | 'snippet', value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-card/85 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm font-medium">MCP Access Keys</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <PageHeader
          icon={<Key className="h-5 w-5" />}
          title="MCP Access Keys"
          description="Autoriza clientes MCP externos (Claude Desktop, IDEs, scripts) a consumir tu sesión del Assessment Center."
        />

        {/* Issue form */}
        <section className="rounded-xl border bg-card shadow-elev-1 p-4">
          <label className="text-sm font-medium" htmlFor="mcp-key-label">
            Generar una nueva key
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Asígnale un nombre que recuerdes después (el dispositivo o cliente que la usará).
          </p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              id="mcp-key-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="ej. Claude Desktop laptop personal"
              className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none"
            />
            <Button onClick={issue} disabled={issuing || !newLabel.trim()}>
              {issuing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Generar key
            </Button>
          </div>
        </section>

        {/* Existing keys */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Tus keys</h2>
          {loading ? (
            <div className="rounded-xl border bg-card shadow-elev-1 p-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : keys.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="h-7 w-7" />}
              title="Aún no tienes API keys"
              description="Genera tu primera key arriba para conectar Claude Desktop u otro cliente MCP."
              size="sm"
            />
          ) : (
            <ul className="rounded-xl border bg-card shadow-elev-1 overflow-hidden divide-y divide-border">
              {keys.map((k) => (
                <li
                  key={k.keyId}
                  className="flex items-center justify-between px-4 py-3 text-sm gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate flex items-center gap-2">
                        {k.label}
                        {k.revokedAt && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            Revocada
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        <span className="font-mono">{k.keyId.slice(0, 8)}…</span>
                        {' · '}creada {new Date(k.createdAt).toLocaleDateString()}
                        {k.lastUsedAt &&
                          ` · último uso ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  {!k.revokedAt && (
                    <Tooltip content="Revocar key">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => revoke(k.keyId)}
                        aria-label="Revocar key"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </Tooltip>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && (
          <InfoBanner tone="danger" title="Error">
            {error}
          </InfoBanner>
        )}
      </main>

      {/* Fresh secret modal — gated by acknowledgement to prevent accidental dismissal */}
      <Dialog
        open={!!freshSecret}
        onOpenChange={(open) => {
          if (!open && acknowledged) setFreshSecret(null);
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => {
            if (!acknowledged) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (!acknowledged) e.preventDefault();
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <DialogTitle>Tu nueva API key</DialogTitle>
            </div>
            <DialogDescription>
              Cópiala ahora — no volverá a mostrarse. Si la pierdes deberás revocarla y generar una
              nueva.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
                Secret
              </p>
              <div className="flex items-stretch gap-2">
                <code className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-xs break-all">
                  {freshSecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => freshSecret && copy('secret', freshSecret)}
                >
                  {copied === 'secret' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-success" />
                      Copiada
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
                Snippet para Claude Desktop (~/.config/claude/mcp.json)
              </p>
              <div className="flex items-stretch gap-2">
                <pre className="flex-1 overflow-x-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-[11px]">
                  {snippet}
                </pre>
                <Button variant="outline" size="sm" onClick={() => copy('snippet', snippet)}>
                  {copied === 'snippet' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-success" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-md border border-border bg-surface-2 p-3 text-sm cursor-pointer">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(v) => setAcknowledged(v === true)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Guardé este secret en un lugar seguro</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                (gestor de contraseñas, archivo de configuración o variable de entorno).
              </span>
            </span>
          </label>

          <div className="flex justify-end">
            <Button
              onClick={() => acknowledged && setFreshSecret(null)}
              disabled={!acknowledged}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
