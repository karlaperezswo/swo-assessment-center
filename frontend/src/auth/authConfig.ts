import type { AuthProviderProps } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';

/**
 * Cognito OIDC configuration for the SPA. Env-driven so the same build ships
 * to dev/staging/prod by swapping VITE_COGNITO_* values.
 *
 * When VITE_AUTH_ENABLED != 'true' the app runs in legacy unauthenticated
 * mode (mirrors backend's AUTH_ENABLED flag). This keeps Phase 1 shippable
 * before the Cognito User Pool is provisioned in the target environment.
 */

const rawEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const AUTH_ENABLED = (rawEnv.VITE_AUTH_ENABLED ?? '').toLowerCase() === 'true';

const region = rawEnv.VITE_AWS_REGION ?? 'us-east-1';
const userPoolId = rawEnv.VITE_COGNITO_USER_POOL_ID ?? '';
const clientId = rawEnv.VITE_COGNITO_CLIENT_ID ?? '';
const hostedDomain = rawEnv.VITE_COGNITO_HOSTED_DOMAIN ?? '';

const origin = typeof window !== 'undefined' ? window.location.origin : '';

export const oidcConfig: AuthProviderProps = {
  authority: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
  client_id: clientId,
  redirect_uri: `${origin}/auth/callback`,
  post_logout_redirect_uri: `${origin}/`,
  response_type: 'code',
  scope: 'openid email profile',
  loadUserInfo: false,
  userStore: typeof window !== 'undefined'
    ? new WebStorageStateStore({ store: window.localStorage })
    : undefined,
  automaticSilentRenew: true,
  onSigninCallback: () => {
    // Strip OAuth params from the URL after successful login.
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },
};

export const hostedLogoutUrl = (): string => {
  if (!hostedDomain || !clientId) return '/';
  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: `${origin}/`,
  });
  return `https://${hostedDomain}/logout?${params.toString()}`;
};
