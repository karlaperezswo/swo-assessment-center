import { QueryClient } from '@tanstack/react-query';

/**
 * Central TanStack Query client. Defaults chosen for a data-heavy consultant
 * workflow where stale-while-revalidate is the norm:
 *  - 30s stale window ⇒ opening the drawer again re-uses cached data.
 *  - 5min gcTime ⇒ leaving a page doesn't immediately drop state.
 *  - Retry once on failure; the user gets a clear "something broke" state
 *    instead of waiting 3× RTT.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
