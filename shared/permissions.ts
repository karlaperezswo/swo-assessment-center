/**
 * Canonical role & permission matrix for swo-assessment-center v2.
 *
 * This file is the single source of truth shared between backend middleware
 * (enforcement) and frontend UI (showing/hiding actions). Keep it minimal —
 * three roles by design. Adding a fourth role should be a deliberate product
 * decision.
 */

export const ROLES = {
  SUPERADMIN: 'superadmin',
  CONSULTOR: 'consultor',
  CLIENTE_READONLY: 'cliente-readonly',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: readonly Role[] = Object.values(ROLES);

/**
 * Action identifiers used across the product. Keep them coarse-grained so the
 * matrix stays readable; fine-grained checks (e.g. ownership) happen at the
 * data layer.
 */
export type Action =
  | 'orgs:manage'
  | 'users:manage'
  | 'sessions:list:any'
  | 'sessions:list:org'
  | 'sessions:read:own'
  | 'sessions:read:shared'
  | 'sessions:create'
  | 'sessions:edit'
  | 'assessments:upload'
  | 'bedrock:invoke'
  | 'opportunities:approve'
  | 'report:download'
  | 'audit:read:any'
  | 'audit:read:own'
  | 'mcp-keys:manage:any'
  | 'mcp-keys:manage:own';

const PERMISSIONS: Record<Role, readonly Action[]> = {
  superadmin: [
    'orgs:manage',
    'users:manage',
    'sessions:list:any',
    'sessions:list:org',
    'sessions:read:own',
    'sessions:read:shared',
    'sessions:create',
    'sessions:edit',
    'assessments:upload',
    'bedrock:invoke',
    'opportunities:approve',
    'report:download',
    'audit:read:any',
    'audit:read:own',
    'mcp-keys:manage:any',
    'mcp-keys:manage:own',
  ],
  consultor: [
    'sessions:list:org',
    'sessions:read:own',
    'sessions:create',
    'sessions:edit',
    'assessments:upload',
    'bedrock:invoke',
    'opportunities:approve',
    'report:download',
    'audit:read:own',
    'mcp-keys:manage:own',
  ],
  'cliente-readonly': [
    'sessions:read:shared',
    'report:download',
  ],
};

export function can(role: Role | undefined, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(action) ?? false;
}

export function canAny(role: Role | undefined, actions: Action[]): boolean {
  return actions.some((a) => can(role, a));
}

export function canAll(role: Role | undefined, actions: Action[]): boolean {
  return actions.every((a) => can(role, a));
}

/** Ordered by privilege ascendente — useful for UI role selectors. */
export const ROLE_DISPLAY: Record<Role, string> = {
  'cliente-readonly': 'Cliente (Read-only)',
  consultor: 'Consultor',
  superadmin: 'SuperAdmin',
};
