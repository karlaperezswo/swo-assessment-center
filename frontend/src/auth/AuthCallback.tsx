import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from './useCurrentUser';

/**
 * Rendered at /auth/callback. react-oidc-context finalises the code exchange
 * automatically; this component just waits and redirects back to the app.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  useEffect(() => {
    if (user.isLoading) return;
    navigate(user.isAuthenticated ? '/assess' : '/', { replace: true });
  }, [user.isAuthenticated, user.isLoading, navigate]);

  return <div className="p-6 text-sm text-gray-500">Iniciando sesión…</div>;
}
