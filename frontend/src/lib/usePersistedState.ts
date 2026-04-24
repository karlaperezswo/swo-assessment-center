import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_PREFIX = 'swo-ac:';

export function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function readPersisted<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writePersisted<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Quota errors or disabled storage — silently ignore, feature degrades gracefully.
  }
}

export function clearPersisted(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    // ignore
  }
}

export function usePersistedState<T>(
  key: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => readPersisted(key, initial));
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    writePersisted(keyRef.current, state);
  }, [state]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [state, update];
}
