import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePersistedState } from '@/lib/usePersistedState';
import { useTranslation } from '@/i18n/useTranslation';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = usePersistedState<Theme>('theme', detectInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const label = theme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark');

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function detectInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}
