import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Send, X, RotateCcw, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentContextValue } from './AgentContextProvider';
import { AgentToolCall, useAgentChat } from './useAgentChat';

/**
 * Persistent lateral drawer for the AI copilot. Collapsible, 420px wide,
 * available across the whole app. Reads the current screen context from
 * AgentContextProvider and forwards it to every backend call.
 */
export function AgentDrawer() {
  const [isOpen, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { sessionId, pageContext } = useAgentContextValue();
  const { messages, isSending, send, cancel, reset } = useAgentChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const submit = () => {
    if (!input.trim()) return;
    send(input.trim(), { sessionId, pageContext });
    setInput('');
  };

  return (
    <>
      {/* Floating toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:scale-105"
      >
        <Sparkles className="h-4 w-4" />
        {isOpen ? 'Ocultar asistente' : 'Asistente AWS'}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="agent-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="fixed right-0 top-0 z-30 flex h-screen w-[min(420px,95vw)] flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950"
          >
        <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-semibold">Asistente AWS</div>
              <div className="text-xs text-gray-500">
                {sessionId ? `Sesión ${sessionId.slice(0, 8)}…` : 'Sin sesión activa'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={reset} title="Nuevo hilo">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} title="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          {messages.length === 0 && (
            <div className="rounded-md border border-dashed border-gray-200 p-4 text-xs text-gray-500">
              Pregúntame sobre esta sesión. Puedo consultar oportunidades,
              estimar costos, o buscar documentación AWS. <br />
              <span className="mt-2 block italic">
                Ejemplos: «resume los hallazgos críticos», «estima 5 servidores
                Windows de 8 vCPU», «¿qué dice AWS sobre RDS Proxy?».
              </span>
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} text={m.text} error={m.error}>
              {m.toolCalls?.length ? (
                <div className="mt-2 space-y-1">
                  {m.toolCalls.map((tc) => (
                    <ToolCallDisclosure key={tc.id} toolCall={tc} />
                  ))}
                </div>
              ) : null}
              {m.streaming && !m.text && !m.error ? (
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  pensando…
                </div>
              ) : null}
            </MessageBubble>
          ))}
        </div>

        <div className="border-t border-gray-100 p-3 dark:border-gray-800">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder="Escribe tu pregunta… (Enter para enviar)"
              className="flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
            />
            {isSending ? (
              <Button variant="outline" size="icon" onClick={cancel} title="Cancelar">
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={submit} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({
  role,
  text,
  error,
  children,
}: {
  role: 'user' | 'assistant';
  text: string;
  error?: string;
  children?: React.ReactNode;
}) {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary text-white'
            : error
            ? 'bg-red-50 text-red-800'
            : 'bg-gray-50 text-gray-800'
        }`}
      >
        {error ?? text}
        {children}
      </div>
    </div>
  );
}

function ToolCallDisclosure({ toolCall }: { toolCall: AgentToolCall }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-gray-200 bg-white/70 text-xs">
      <button
        type="button"
        className="flex w-full items-center gap-1 px-2 py-1 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="font-medium">{toolCall.name}</span>
        {toolCall.result ? (
          <span className="text-gray-400">· {toolCall.isError ? 'error' : 'ok'}</span>
        ) : (
          <span className="text-gray-400">· ejecutando…</span>
        )}
      </button>
      {open && (
        <div className="space-y-1 border-t border-gray-100 px-2 py-2 font-mono">
          {toolCall.input !== undefined && (
            <details>
              <summary className="cursor-pointer">input</summary>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[11px] text-gray-600">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </details>
          )}
          {toolCall.result !== undefined && (
            <details open>
              <summary className="cursor-pointer">output</summary>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[11px] text-gray-600">
                {toolCall.result}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
