import { PropsWithChildren, useEffect } from 'react';
import type { Role } from '../../../shared/permissions';
import { can, Action } from '../../../shared/permissions';
import { AUTH_ENABLED } from './authConfig';
import { useCurrentUser } from './useCurrentUser';

interface ProtectedRouteProps {
  roles?: Role[];
  requires?: Action[];
  fallback?: React.ReactNode;
}

/**
 * Guards a subtree. When AUTH_ENABLED=false this is a no-op to keep dev flows
 * working before Cognito is provisioned — the backend's authenticate()
 * middleware behaves the same.
 */
export function ProtectedRoute({
  children,
  roles,
  requires,
  fallback = null,
}: PropsWithChildren<ProtectedRouteProps>) {
  const user = useCurrentUser();

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    if (user.isLoading) return;
    if (!user.isAuthenticated) {
      void user.signinRedirect();
    }
  }, [user]);

  if (!AUTH_ENABLED) return <>{children}</>;
  if (user.isLoading) return <>{fallback}</>;
  if (!user.isAuthenticated) return <>{fallback}</>;

  if (roles && roles.length > 0 && (!user.role || !roles.includes(user.role))) {
    return (
      <div className="p-6 text-sm text-red-700">
        403 — no tienes permisos suficientes para ver esta sección.
      </div>
    );
  }

  if (requires && requires.length > 0 && !requires.every((a) => can(user.role, a))) {
    return (
      <div className="p-6 text-sm text-red-700">
        403 — permisos insuficientes.
      </div>
    );
  }

  return <>{children}</>;
}
