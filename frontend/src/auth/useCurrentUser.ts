import { useAuth } from 'react-oidc-context';
import type { Role } from '../../../shared/permissions';
import { AUTH_ENABLED } from './authConfig';

export interface CurrentUser {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken?: string;
  email?: string;
  sub?: string;
  role?: Role;
  orgId?: string;
  groups: string[];
  signinRedirect: () => Promise<void>;
  signoutRedirect: () => Promise<void>;
}

/**
 * Normalised view of the authenticated user. Callers should use this instead
 * of react-oidc-context's `useAuth` directly so swapping the IdP later is a
 * single-file change.
 *
 * Safe to call with AUTH_ENABLED=false — returns a stub that reports nobody
 * is logged in but exposes a no-op `signinRedirect`.
 */
export function useCurrentUser(): CurrentUser {
  if (!AUTH_ENABLED) {
    return {
      isAuthenticated: false,
      isLoading: false,
      groups: [],
      signinRedirect: async () => {},
      signoutRedirect: async () => {},
    };
  }
  const auth = useAuth();
  const profile = (auth.user?.profile ?? {}) as Record<string, unknown>;
  const groups = Array.isArray(profile['cognito:groups'])
    ? (profile['cognito:groups'] as string[])
    : [];
  const role =
    (profile['custom:role'] as Role | undefined) ??
    (groups[0] as Role | undefined);

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    accessToken: auth.user?.access_token,
    email: typeof profile.email === 'string' ? (profile.email as string) : undefined,
    sub: typeof profile.sub === 'string' ? (profile.sub as string) : undefined,
    role,
    orgId: typeof profile['custom:orgId'] === 'string' ? (profile['custom:orgId'] as string) : undefined,
    groups,
    signinRedirect: () => auth.signinRedirect(),
    signoutRedirect: () => auth.signoutRedirect(),
  };
}
