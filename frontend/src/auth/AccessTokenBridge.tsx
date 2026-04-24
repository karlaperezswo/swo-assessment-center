import { useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { setAccessToken } from './tokenBridge';

/**
 * Invisible component that keeps the tokenBridge in sync with the OIDC user.
 * Mounted once inside <AuthProvider> so every request fired via apiClient
 * picks up the current bearer automatically.
 */
export function AccessTokenBridge() {
  const user = useCurrentUser();
  useEffect(() => {
    setAccessToken(user.accessToken);
  }, [user.accessToken]);
  return null;
}
