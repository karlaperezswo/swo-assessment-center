import { useContext } from 'react';
import { ActiveCloudsContext } from './ActiveCloudsProvider';

export function useActiveClouds() {
  const ctx = useContext(ActiveCloudsContext);
  if (!ctx) {
    throw new Error('useActiveClouds must be used inside <ActiveCloudsProvider>');
  }
  return ctx;
}
