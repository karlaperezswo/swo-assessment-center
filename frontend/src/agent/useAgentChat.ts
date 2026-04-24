import { useCallback, useRef, useState } from 'react';
import { getAccessToken } from '@/auth/tokenBridge';

export interface AgentToolCall {
  id: string;
  name: string;
  input?: unknown;
  result?: string;
  isError?: boolean;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolCalls?: AgentToolCall[];
  streaming?: boolean;
  error?: string;
}

interface SendOptions {
  sessionId?: string;
  pageContext?: Record<string, unknown>;
}

const API_BASE =
  (import.meta as unknown as { env?: Record<string, string | undefined> })
    .env?.VITE_API_URL ?? '';

function parseSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: string, data: unknown) => void,
  signal: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';
  return (async () => {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const lines = raw.split('\n');
        let event = 'message';
        let dataStr = '';
        for (const line of lines) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
        }
        let data: unknown = null;
        try {
          data = dataStr ? JSON.parse(dataStr) : null;
        } catch {
          data = dataStr;
        }
        onEvent(event, data);
      }
    }
  })();
}

/**
 * Hook that manages a single agent thread, calls /api/agent/chat with SSE,
 * and exposes incremental UI state: messages, streaming flag, inflight tool
 * calls.
 */
export function useAgentChat() {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const threadIdRef = useRef<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsSending(false);
  }, []);

  const send = useCallback(async (text: string, opts: SendOptions = {}) => {
    if (!text.trim() || isSending) return;

    const userMsg: AgentChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
    };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', text: '', toolCalls: [], streaming: true },
    ]);
    setIsSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const resp = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          threadId: threadIdRef.current,
          sessionId: opts.sessionId,
          message: text,
          pageContext: opts.pageContext,
        }),
      });

      if (!resp.ok || !resp.body) {
        const body = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status} ${body}`);
      }

      await parseSseStream(
        resp.body.getReader(),
        (event, data) => {
          if (event === 'thread' && data && typeof data === 'object') {
            const tid = (data as { threadId?: string }).threadId;
            if (tid) threadIdRef.current = tid;
          } else if (event === 'text_delta' && data && typeof data === 'object') {
            const t = (data as { text?: string }).text ?? '';
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, text: m.text + t } : m
              )
            );
          } else if (event === 'tool_use_start' && data && typeof data === 'object') {
            const d = data as { id: string; name: string; input?: unknown };
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      toolCalls: [
                        ...(m.toolCalls ?? []),
                        { id: d.id, name: d.name, input: d.input },
                      ],
                    }
                  : m
              )
            );
          } else if (
            (event === 'tool_use_result' || event === 'tool_use_error') &&
            data &&
            typeof data === 'object'
          ) {
            const d = data as { id: string; content: string };
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      toolCalls: (m.toolCalls ?? []).map((tc) =>
                        tc.id === d.id
                          ? {
                              ...tc,
                              result: d.content,
                              isError: event === 'tool_use_error',
                            }
                          : tc
                      ),
                    }
                  : m
              )
            );
          } else if (event === 'error' && data && typeof data === 'object') {
            const m = (data as { message?: string }).message ?? 'error';
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId ? { ...msg, error: m, streaming: false } : msg
              )
            );
          }
        },
        controller.signal
      );

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'network error';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, error: message, streaming: false } : m
        )
      );
    } finally {
      setIsSending(false);
      abortRef.current = null;
    }
  }, [isSending]);

  const reset = useCallback(() => {
    cancel();
    threadIdRef.current = undefined;
    setMessages([]);
  }, [cancel]);

  return { messages, isSending, send, cancel, reset, threadId: threadIdRef.current };
}
