import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MoreHorizontal,
  Moon,
  Sun,
  KeyRound,
  BookOpen,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';
import { usePersistedState } from '@/lib/usePersistedState';
import { useCurrentUser } from '@/auth/useCurrentUser';
import { can } from '../../../../shared/permissions';
import { AUTH_ENABLED } from '@/auth/authConfig';
import { MigrationPhase } from '@/types/assessment';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark';

interface AppToolbarProps {
  currentPhase: MigrationPhase;
  onPhaseChange: (phase: MigrationPhase) => void;
  onReset: () => void;
}

/**
 * Compact "more" menu for global actions: theme, language, MCP keys,
 * Tech Memory, reset session. Replaces the cluster of header buttons.
 */
export function AppToolbar({ currentPhase, onPhaseChange, onReset }: AppToolbarProps) {
  const { t, currentLanguage, availableLanguages, changeLanguage, isLoading } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = usePersistedState<Theme>('theme', detectInitialTheme());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const mcpAllowed = !AUTH_ENABLED || can(user.role, 'mcp-keys:manage:own');
  const isTechMemory = currentPhase === 'tech-memory';
  const langCurrent =
    availableLanguages.find((l) => l.code === currentLanguage) ?? availableLanguages[0];

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('appToolbar.menu', { defaultValue: 'Menú' })}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              className="absolute right-0 top-full mt-1 z-50 w-72 rounded-lg border bg-popover text-popover-foreground shadow-elev-3 p-2"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
            >
              {/* Tech Memory */}
              <MenuItem
                icon={<BookOpen className="h-4 w-4" />}
                label={t('phases.techMemory.name', { defaultValue: 'Tech Memory' })}
                hint={t('phases.techMemory.subtitle', { defaultValue: 'Biblioteca técnica' })}
                active={isTechMemory}
                onClick={() => {
                  onPhaseChange(isTechMemory ? 'assess' : 'tech-memory');
                  setOpen(false);
                }}
              />

              {mcpAllowed && (
                <MenuItem
                  icon={<KeyRound className="h-4 w-4" />}
                  label={t('mcpKeys.headerLink', { defaultValue: 'MCP Access Keys' })}
                  hint={t('appToolbar.mcpHint', { defaultValue: 'Gestiona tus credenciales' })}
                  onClick={() => {
                    navigate('/settings/mcp');
                    setOpen(false);
                  }}
                />
              )}

              <div className="my-1 h-px bg-border" />

              <MenuItem
                icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                label={
                  theme === 'dark'
                    ? t('theme.switchToLight', { defaultValue: 'Modo claro' })
                    : t('theme.switchToDark', { defaultValue: 'Modo oscuro' })
                }
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              />

              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  {t('appToolbar.language', { defaultValue: 'Idioma' })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        if (lang.code !== currentLanguage) changeLanguage(lang.code);
                      }}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition-colors',
                        lang.code === langCurrent.code
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'border-transparent hover:bg-surface-2'
                      )}
                    >
                      <span aria-hidden>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-1 h-px bg-border" />

              <MenuItem
                icon={<RefreshCw className="h-4 w-4" />}
                label={t('appToolbar.reset', { defaultValue: 'Reiniciar sesión' })}
                hint={t('appToolbar.resetHint', { defaultValue: 'Borra todos los datos cargados' })}
                tone="danger"
                onClick={() => {
                  if (confirm(t('appToolbar.resetConfirm', { defaultValue: '¿Reiniciar la sesión actual? Se perderán los datos no guardados.' }))) {
                    onReset();
                    setOpen(false);
                  }
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
  tone,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  tone?: 'danger';
  active?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-2 px-2 py-2 text-sm rounded-md text-left transition-colors',
        tone === 'danger'
          ? 'text-destructive hover:bg-destructive/10'
          : active
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-surface-2'
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-tight">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground mt-0.5">{hint}</span>}
      </span>
    </button>
  );
}

function detectInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}
