/**
 * Tiny accessor that lets non-React modules (axios interceptor) read the
 * current Cognito access token without coupling to react-oidc-context.
 *
 * Updated by a small bridge component that calls setAccessToken() whenever
 * react-oidc-context emits a new user.
 */

let currentToken: string | undefined;

export function setAccessToken(token: string | undefined): void {
  currentToken = token;
}

export function getAccessToken(): string | undefined {
  return currentToken;
}
