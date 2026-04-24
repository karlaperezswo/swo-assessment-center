import { useEffect, useState } from 'react';
import { readPersisted, writePersisted } from '@/lib/usePersistedState';
import { ManualChecklistState } from '@/lib/migrationReadiness';
import { AnswersState } from '@/lib/readinessQuestionnaire';

/**
 * Tiny shared-store pattern so the readiness checklist and the guided
 * questionnaire answers stay in sync across components that render in
 * different sub-tabs (Rapid Discovery writes, Migration Readiness reads,
 * or vice versa).
 *
 * React's `usePersistedState` alone isn't enough here: two mounted copies
 * each hold their own state cell, so writes in one don't rerender the
 * other until the next full reload. The subscriber pattern fixes that
 * without pulling in a store library.
 */

type Listener = () => void;

interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: Listener) => () => void;
}

function createStore<T>(storageKey: string, initial: T): Store<T> {
  let cached: T = readPersisted<T>(storageKey, initial);
  const listeners = new Set<Listener>();
  return {
    get: () => cached,
    set: (next) => {
      cached = typeof next === 'function' ? (next as (prev: T) => T)(cached) : next;
      writePersisted(storageKey, cached);
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const checklistStore = createStore<ManualChecklistState>('readiness.checklist', {});
const answersStore = createStore<AnswersState>('readiness.questionnaire', {});

function useStore<T>(store: Store<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(store.get());
  useEffect(() => store.subscribe(() => setValue(store.get())), [store]);
  return [value, store.set];
}

export function useReadinessChecklist() {
  return useStore(checklistStore);
}

export function useReadinessAnswers() {
  return useStore(answersStore);
}

export function getReadinessChecklist(): ManualChecklistState {
  return checklistStore.get();
}

export function setReadinessChecklist(next: ManualChecklistState): void {
  checklistStore.set(next);
}
