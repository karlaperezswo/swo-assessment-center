import { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const LOCAL_DEFAULTS = [
  'http://localhost:3005',
  'http://localhost:3006',
  'http://localhost:5173',
  'http://127.0.0.1:3005',
  'http://127.0.0.1:3006',
];

export function parseOriginAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resolve the CORS allowlist. Order of precedence:
 *  - CORS_ALLOWED_ORIGINS env var (comma-separated).
 *  - NODE_ENV=production and no env var ⇒ empty (refuses every origin).
 *    We prefer an explicit 503-like failure to the previous `origin: '*'`.
 *  - anything else ⇒ localhost defaults for dev ergonomics.
 */
export function resolveAllowlist(): string[] {
  const fromEnv = parseOriginAllowlist(process.env.CORS_ALLOWED_ORIGINS);
  if (fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === 'production') return [];
  return LOCAL_DEFAULTS;
}

export function buildCorsMiddleware(): RequestHandler {
  const allowlist = resolveAllowlist();
  const allowAll = allowlist.includes('*');

  return cors({
    origin(origin, callback) {
      // Server-to-server or curl: no Origin header ⇒ always allow.
      if (!origin) return callback(null, true);
      if (allowAll) return callback(null, true);
      if (allowlist.includes(origin)) return callback(null, origin);
      return callback(new Error(`CORS: origin not allowed: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: !allowAll, // cookies+`*` is forbidden by spec
    maxAge: 86400,
  });
}

/**
 * Opinionated Helmet preset. CSP is reportOnly by default because the frontend
 * still injects some inline styles (shadcn/ui) — flip CSP_ENFORCE=true once
 * audited.
 */
export function buildHelmetMiddleware(): RequestHandler {
  const enforceCsp = process.env.CSP_ENFORCE === 'true';
  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      reportOnly: !enforceCsp,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'", 'https:'],
        'frame-ancestors': ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
    },
  });
}

/**
 * Baseline limiter: 60 req/min per IP. Applied to every /api route.
 * Uses the default in-memory store; swap to a DynamoDB-backed store once
 * traffic warrants it (see docs/planning/v2-roadmap.md Phase 0).
 */
export function buildBaseRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_BASE ?? 60),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests. Please retry shortly.',
    },
  });
}

/**
 * Tight limiter for Bedrock-hitting endpoints: 10 req/min per IP.
 * Applied on top of the base limiter via route-level middleware.
 */
export function buildBedrockRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_BEDROCK ?? 10),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Rate limit exceeded for AI-assisted endpoints.',
    },
  });
}
