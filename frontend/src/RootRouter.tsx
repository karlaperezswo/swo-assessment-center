import { Route, Routes } from 'react-router-dom';
import App from './App';
import { AuthCallback } from './auth/AuthCallback';
import { ProtectedRoute } from './auth/ProtectedRoute';

/**
 * Top-level router. Keeps the OIDC callback isolated from the main app tree
 * (otherwise the heavy phase components would mount during code exchange)
 * and wraps every non-callback path in the ProtectedRoute guard.
 *
 * Catch-all `*` deliberately re-renders <App /> so internal navigation still
 * works — phase routing is delegated to usePhase() inside App.
 */
export function RootRouter() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
