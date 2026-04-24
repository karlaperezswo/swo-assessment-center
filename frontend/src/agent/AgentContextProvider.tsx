import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * Shared agent context. Each screen calls `useAgentContext({...})` with
 * whatever the user is currently looking at (phase, sessionId, selection).
 * The AgentDrawer reads the merged state via `useAgentContextValue()` and
 * ships it to the backend as `pageContext` on every chat turn.
 *
 * We merge rather than replace so mid-page widgets can contribute their own
 * slice without racing the phase-level provider.
 */

interface AgentContextState {
  sessionId?: string;
  pageContext: Record<string, unknown>;
  setSlice: (key: string, value: unknown) => void;
  clearSlice: (key: string) => void;
  setSessionId: (id: string | undefined) => void;
}

const AgentCtx = createContext<AgentContextState | null>(null);

export function AgentContextProvider({ children }: PropsWithChildren) {
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [pageContext, setPageContext] = useState<Record<string, unknown>>({});

  const setSlice = useCallback((key: string, value: unknown) => {
    setPageContext((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearSlice = useCallback((key: string) => {
    setPageContext((prev) => {
      if (!(key in prev)) return prev;
      const { [key]: _, ...rest } = prev;
      void _;
      return rest;
    });
  }, []);

  const value = useMemo<AgentContextState>(
    () => ({ sessionId, pageContext, setSlice, clearSlice, setSessionId }),
    [sessionId, pageContext, setSlice, clearSlice]
  );

  return <AgentCtx.Provider value={value}>{children}</AgentCtx.Provider>;
}

export function useAgentContextValue(): AgentContextState {
  const ctx = useContext(AgentCtx);
  if (!ctx) {
    throw new Error('useAgentContextValue must be used inside <AgentContextProvider>');
  }
  return ctx;
}

/**
 * Screen-level hook that publishes a slice of context for the agent while
 * the component is mounted, then cleans up on unmount. The `slice` object
 * is deep-spread on every render, so callers don't need to memoise.
 */
export function useAgentContext(key: string, slice: unknown): void {
  const { setSlice, clearSlice } = useAgentContextValue();
  const encoded = useMemo(() => JSON.stringify(slice ?? null), [slice]);
  useEffect(() => {
    setSlice(key, slice);
    return () => clearSlice(key);
    // encoded captures deep equality so we only re-push when contents change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, encoded]);
}

export function useSetAgentSession(sessionId: string | undefined): void {
  const { setSessionId } = useAgentContextValue();
  useEffect(() => {
    setSessionId(sessionId);
  }, [sessionId, setSessionId]);
}
