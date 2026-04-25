import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Send, X, RotateCcw, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { useAgentContextValue } from './AgentContextProvider';
import { AgentToolCall, useAgentChat } from './useAgentChat';
import { useActiveClouds } from '@/clouds/useActiveClouds';

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
  const { t } = useTranslation();
  const { state: cloudState } = useActiveClouds();
  const isMultiCloud = cloudState.active.length > 1;

  // Single brand for all configurations: "Smart SWO". The multi/aws split
  // remains in i18n keys so future variants are possible without code changes.
  const assistantTitle = isMultiCloud
    ? t('agent.assistantTitle.multi', { defaultValue: 'Smart SWO' })
    : t('agent.assistantTitle.aws', { defaultValue: 'Smart SWO' });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const submit = () => {
    if (!input.trim()) return;
    // Forward active clouds + primary as part of pageContext so the agent's
    // system prompt and tool filters know which clouds are in scope.
    const ctx = { ...pageContext, clouds: { active: cloudState.active, primary: cloudState.primary } };
    send(input.trim(), { sessionId, pageContext: ctx });
    setInput('');
  };

  return (
    <>
      {/* Floating toggle — bottom-right, lifted above the phase footer
          "Siguiente" CTA so it never overlaps. The lift accounts for
          the PhaseFooterNav button row (~64px) plus padding. */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={assistantTitle}
          className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-40 flex h-12 w-12 sm:h-auto sm:w-auto items-center justify-center sm:gap-2 rounded-full bg-primary sm:px-4 sm:py-3 text-sm font-medium text-white shadow-lg transition hover:scale-105"
        >
          <Sparkles className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{assistantTitle}</span>
        </button>
      )}

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
              <div className="text-sm font-semibold">{assistantTitle}</div>
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
              placeholder={t('agent.placeholder', { defaultValue: 'Escribe tu pregunta… (Enter para enviar)' })}
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
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'whitespace-pre-wrap bg-primary text-white'
            : error
            ? 'whitespace-pre-wrap bg-red-50 text-red-800'
            : 'bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {error ? (
          error
        ) : isUser ? (
          text
        ) : (
          <AssistantMarkdown text={text} />
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * Compact markdown renderer for the agent's assistant messages.
 *
 * Tuned for a narrow drawer (max ~360px content width) so we tone down
 * heading sizes, tighten list margins, and force long inline code to wrap
 * instead of overflowing the bubble.
 */
function AssistantMarkdown({ text }: { text: string }) {
  return (
    <div className="agent-md text-[13px] leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h3 className="mt-1 mb-1.5 text-sm font-bold text-gray-900 dark:text-gray-50" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h4 className="mt-2 mb-1 text-[13px] font-bold text-gray-900 dark:text-gray-50" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h5 className="mt-1.5 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h6 className="mt-1.5 mb-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300" {...props} />
          ),
          p: ({ node, ...props }) => <p className="my-1.5" {...props} />,
          ul: ({ node, ...props }) => <ul className="my-1.5 ml-4 list-disc space-y-0.5" {...props} />,
          ol: ({ node, ...props }) => <ol className="my-1.5 ml-4 list-decimal space-y-0.5" {...props} />,
          li: ({ node, ...props }) => <li className="leading-snug" {...props} />,
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-gray-900 dark:text-gray-50" {...props} />
          ),
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-primary/40 hover:decoration-primary"
            />
          ),
          hr: () => <hr className="my-2 border-gray-200 dark:border-gray-700" />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-1.5 border-l-2 border-primary/40 pl-2 italic text-gray-600 dark:text-gray-400"
              {...props}
            />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const inline = !className;
            if (inline) {
              return (
                <code
                  className="rounded bg-gray-200 px-1 py-0.5 text-[12px] font-mono text-gray-900 break-words dark:bg-gray-700 dark:text-gray-100"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="block" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre
              className="my-1.5 overflow-x-auto rounded-md bg-gray-900 p-2 text-[11px] text-gray-100"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="my-1.5 overflow-x-auto">
              <table className="w-full text-[12px]" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="border-b border-gray-300 px-1.5 py-1 text-left font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border-b border-gray-100 px-1.5 py-1 align-top" {...props} />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
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
