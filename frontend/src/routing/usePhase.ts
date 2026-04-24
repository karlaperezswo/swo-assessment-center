import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MigrationPhase } from '@/types/assessment';

const VALID_PHASES: MigrationPhase[] = [
  'assess',
  'mobilize',
  'migrate',
  'tech-memory',
];

const DEFAULT_PHASE: MigrationPhase = 'assess';

function phaseFromPath(pathname: string): MigrationPhase {
  const first = pathname.split('/').filter(Boolean)[0] as MigrationPhase;
  return VALID_PHASES.includes(first) ? first : DEFAULT_PHASE;
}

/**
 * React Router-backed replacement for `useState<MigrationPhase>`.
 *
 * Keeps the same tuple shape so `App.tsx` only swaps one line. Reading from
 * URL means deep-linking, back/forward, and shareable phase URLs work out of
 * the box — previously the phase lived only in component state and was lost
 * on refresh.
 */
export function usePhase(): [MigrationPhase, (next: MigrationPhase) => void] {
  const location = useLocation();
  const navigate = useNavigate();

  const phase = useMemo(() => phaseFromPath(location.pathname), [location.pathname]);

  const setPhase = useCallback(
    (next: MigrationPhase) => {
      if (next === phase) return;
      navigate(`/${next}`);
    },
    [navigate, phase]
  );

  return [phase, setPhase];
}
