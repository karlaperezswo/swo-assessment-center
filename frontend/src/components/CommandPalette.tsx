import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  Moon,
  Sun,
  Laptop,
  KeyRound,
  LayoutDashboard,
  Layers,
  Truck,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { useCurrentUser } from '@/auth/useCurrentUser';

/**
 * Global Cmd+K / Ctrl+K command palette. Gives power-users fast access to
 * phase navigation, theming, MCP settings, and sign out from any screen.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const user = useCurrentUser();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const go = (path: string) => () => {
    setOpen(false);
    navigate(path);
  };

  const themed = (mode: 'light' | 'dark' | 'system') => () => {
    setTheme(mode);
    setOpen(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24"
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl dark:bg-gray-900">
        <Command>
          <Command.Input
            placeholder="Navegar, cambiar tema, o buscar…"
            className="w-full border-b border-gray-200 px-4 py-3 text-sm focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2 text-sm dark:text-gray-100">
            <Command.Empty className="py-6 text-center text-gray-500">Sin resultados.</Command.Empty>

            <Command.Group heading="Fases" className="[&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-gray-500">
              <Item icon={<LayoutDashboard className="h-4 w-4" />} onSelect={go('/assess')}>Assess</Item>
              <Item icon={<Layers className="h-4 w-4" />} onSelect={go('/mobilize')}>Mobilize</Item>
              <Item icon={<Truck className="h-4 w-4" />} onSelect={go('/migrate')}>Migrate</Item>
              <Item icon={<BookOpen className="h-4 w-4" />} onSelect={go('/tech-memory')}>Memoria técnica</Item>
            </Command.Group>

            <Command.Group heading="Ajustes" className="mt-2 [&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-gray-500">
              <Item icon={<KeyRound className="h-4 w-4" />} onSelect={go('/settings/mcp')}>MCP Access Keys</Item>
            </Command.Group>

            <Command.Group heading="Tema" className="mt-2 [&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-gray-500">
              <Item icon={<Sun className="h-4 w-4" />} onSelect={themed('light')}>Claro</Item>
              <Item icon={<Moon className="h-4 w-4" />} onSelect={themed('dark')}>Oscuro</Item>
              <Item icon={<Laptop className="h-4 w-4" />} onSelect={themed('system')}>Sistema</Item>
            </Command.Group>

            {user.isAuthenticated && (
              <Command.Group heading="Cuenta" className="mt-2 [&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-gray-500">
                <Item
                  icon={<LogOut className="h-4 w-4" />}
                  onSelect={() => {
                    setOpen(false);
                    void user.signoutRedirect();
                  }}
                >
                  Cerrar sesión
                </Item>
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </Command.Dialog>
  );
}

function Item({
  icon,
  onSelect,
  children,
}: {
  icon?: React.ReactNode;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-primary/10 dark:data-[selected=true]:bg-primary/20"
    >
      {icon}
      <span>{children}</span>
    </Command.Item>
  );
}
