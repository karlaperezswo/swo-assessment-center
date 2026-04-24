import { KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/auth/useCurrentUser';
import { can } from '../../../../shared/permissions';
import { useTranslation } from '@/i18n/useTranslation';
import { AUTH_ENABLED } from '@/auth/authConfig';

/**
 * Header shortcut to /settings/mcp.
 *
 * Visible only when:
 * - AUTH is disabled (local dev → show always so the page is reachable), OR
 * - the authenticated user has the `mcp-keys:manage:own` permission.
 *
 * Hidden for `cliente-readonly` users since they cannot manage their own keys.
 */
export function McpKeysLink() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();

  const allowed = !AUTH_ENABLED || can(user.role, 'mcp-keys:manage:own');
  if (!allowed) return null;

  const label = t('mcpKeys.headerLink', { defaultValue: 'MCP Access Keys' });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => navigate('/settings/mcp')}
      aria-label={label}
      title={label}
    >
      <KeyRound className="h-4 w-4" />
    </Button>
  );
}
