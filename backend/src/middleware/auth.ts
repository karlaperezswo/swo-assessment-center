import { RequestHandler, Request } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { Role } from '../../../shared/permissions';

/**
 * Claims extracted from the Cognito access token and attached to req.user.
 *
 * `orgId` and `role` come from the PreTokenGeneration Lambda trigger that
 * enriches the token with DynamoDB-sourced membership data. Until that
 * trigger exists we fall back to the first cognito:groups entry for `role`
 * and to a `custom:orgId` attribute for `orgId`.
 */
export interface AuthenticatedUser {
  sub: string;
  email?: string;
  role?: Role;
  orgId?: string;
  groups: string[];
  tokenUse: 'access' | 'id';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

type Verifier = ReturnType<typeof CognitoJwtVerifier.create>;

let cachedVerifier: Verifier | null = null;

function getVerifier(): Verifier {
  if (cachedVerifier) return cachedVerifier;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) {
    throw new Error(
      'COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set when AUTH_ENABLED=true'
    );
  }
  cachedVerifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'access',
  });
  return cachedVerifier;
}

function extractBearer(req: Request): string | null {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header) return null;
  const [scheme, token] = header.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

function claimsToUser(claims: Record<string, unknown>): AuthenticatedUser {
  const rawGroups = claims['cognito:groups'];
  const groups = Array.isArray(rawGroups) ? (rawGroups as string[]) : [];
  const role =
    (claims['custom:role'] as Role | undefined) ??
    (groups[0] as Role | undefined);
  const orgId =
    (claims['custom:orgId'] as string | undefined) ?? undefined;
  return {
    sub: String(claims.sub ?? ''),
    email: (claims.email as string | undefined) ?? undefined,
    role,
    orgId,
    groups,
    tokenUse: (claims.token_use as 'access' | 'id') ?? 'access',
  };
}

/**
 * Authentication middleware. Verifies a Cognito access token and populates
 * `req.user`. Globally enabled by `AUTH_ENABLED=true` — when false, requests
 * pass through untouched (dev/legacy mode).
 */
export function authenticate(): RequestHandler {
  const enabled = String(process.env.AUTH_ENABLED ?? '').toLowerCase() === 'true';

  return async (req, res, next) => {
    if (!enabled) return next();

    const token = extractBearer(req);
    if (!token) {
      res.status(401).json({ success: false, error: 'missing bearer token' });
      return;
    }
    try {
      const verifier = getVerifier();
      const claims = await verifier.verify(token);
      req.user = claimsToUser(claims as unknown as Record<string, unknown>);
      next();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'invalid token';
      res.status(401).json({ success: false, error: message });
    }
  };
}

/** For tests / debugging: reset the memoised verifier so env changes take effect. */
export function __resetAuthVerifierForTests(): void {
  cachedVerifier = null;
}
