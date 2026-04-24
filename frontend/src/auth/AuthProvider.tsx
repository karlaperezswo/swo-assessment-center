import { PropsWithChildren } from 'react';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { AUTH_ENABLED, oidcConfig } from './authConfig';

/**
 * Wraps the app in the OIDC provider when AUTH_ENABLED=true. Otherwise
 * renders children straight through so the app keeps working pre-Cognito.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  if (!AUTH_ENABLED) return <>{children}</>;
  return <OidcAuthProvider {...oidcConfig}>{children}</OidcAuthProvider>;
}
