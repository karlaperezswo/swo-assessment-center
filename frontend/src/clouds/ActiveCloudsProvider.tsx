import { createContext, useCallback, useMemo, type ReactNode } from 'react';
import { usePersistedState } from '../lib/usePersistedState';
import type { CloudProvider } from '../types/clouds';
import {
  ALL_CLOUDS,
  DEFAULT_ACTIVE_CLOUDS,
  type ActiveCloudsState,
} from '../types/clouds';

interface ContextValue {
  state: ActiveCloudsState;
  toggle: (cloud: CloudProvider) => void;
  setActive: (clouds: CloudProvider[]) => void;
  setPrimary: (cloud: CloudProvider) => void;
  isActive: (cloud: CloudProvider) => boolean;
  reset: () => void;
}

export const ActiveCloudsContext = createContext<ContextValue | null>(null);

const PERSIST_KEY = 'active-clouds:v1';

function sanitize(state: ActiveCloudsState): ActiveCloudsState {
  const known = new Set<CloudProvider>(ALL_CLOUDS);
  const cleaned = state.active.filter((c) => known.has(c));
  // Invariant: at least 1 active cloud. Cualquier nube vale — AWS no es obligatorio.
  const active = cleaned.length > 0 ? Array.from(new Set(cleaned)) : DEFAULT_ACTIVE_CLOUDS.active;
  const primary = active.includes(state.primary) ? state.primary : active[0];
  return { active, primary };
}

export function ActiveCloudsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = usePersistedState<ActiveCloudsState>(PERSIST_KEY, DEFAULT_ACTIVE_CLOUDS);

  const toggle = useCallback(
    (cloud: CloudProvider) => {
      setState((prev) => {
        const has = prev.active.includes(cloud);
        let active: CloudProvider[];
        if (has) {
          // Don't allow removing the last cloud — invariant ≥1 active.
          if (prev.active.length === 1) return prev;
          active = prev.active.filter((c) => c !== cloud);
        } else {
          active = [...prev.active, cloud];
        }
        const primary = active.includes(prev.primary) ? prev.primary : active[0];
        return sanitize({ active, primary });
      });
    },
    [setState]
  );

  const setActive = useCallback(
    (clouds: CloudProvider[]) => setState((prev) => sanitize({ active: clouds, primary: prev.primary })),
    [setState]
  );

  const setPrimary = useCallback(
    (cloud: CloudProvider) =>
      setState((prev) => (prev.active.includes(cloud) ? sanitize({ ...prev, primary: cloud }) : prev)),
    [setState]
  );

  const reset = useCallback(() => setState(DEFAULT_ACTIVE_CLOUDS), [setState]);

  const value = useMemo<ContextValue>(
    () => ({
      state,
      toggle,
      setActive,
      setPrimary,
      isActive: (cloud) => state.active.includes(cloud),
      reset,
    }),
    [state, toggle, setActive, setPrimary, reset]
  );

  return <ActiveCloudsContext.Provider value={value}>{children}</ActiveCloudsContext.Provider>;
}
