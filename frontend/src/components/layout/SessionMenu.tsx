import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Upload, Download, Clock, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/useTranslation';
import {
  SessionSnapshot,
  saveSession,
  loadSession,
  clearSession,
  importSessionFromFile,
  collectAuxiliaryState,
  applyAuxiliaryState,
} from '@/lib/sessionPersistence';

interface SessionMenuProps {
  currentSnapshot: Omit<SessionSnapshot, 'version' | 'savedAt'>;
  onRestore: (snapshot: SessionSnapshot) => void;
  onReset: () => void;
}

export function SessionMenu({ currentSnapshot, onRestore, onReset }: SessionMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stored = loadSession();

  const handleSaveLocal = () => {
    saveSession(currentSnapshot);
    toast.success(t('sessionMenu.saved'));
    setOpen(false);
  };

  const handleLoadLocal = () => {
    const snap = loadSession();
    if (!snap) {
      toast.error(t('sessionMenu.noSession'));
      return;
    }
    onRestore(snap);
    toast.success(t('sessionMenu.restored', { date: new Date(snap.savedAt).toLocaleString() }));
    setOpen(false);
  };

  const handleExport = () => {
    const full: SessionSnapshot = {
      ...currentSnapshot,
      version: 1,
      savedAt: new Date().toISOString(),
    };
    // bundle auxiliary state into the exported file so risk rules etc. round-trip
    const bundle = {
      ...full,
      auxiliary: collectAuxiliaryState(),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const safeName = (full.clientData.clientName || 'session')
      .replace(/[^a-z0-9]+/gi, '_')
      .toLowerCase();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swo_session_${safeName}_${full.savedAt.split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sessionMenu.exported'));
    setOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.auxiliary) applyAuxiliaryState(parsed.auxiliary);
      const snap = await importSessionFromFile(file);
      onRestore(snap);
      toast.success(t('sessionMenu.imported'));
    } catch (err: any) {
      toast.error(t('sessionMenu.importError'), { description: err?.message });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
      setOpen(false);
    }
  };

  const handleClear = () => {
    clearSession();
    onReset();
    toast.success(t('sessionMenu.cleared'));
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(!open)} aria-label={t('sessionMenu.ariaLabel')} aria-expanded={open}>
        <Save className="h-4 w-4 mr-1" />
        {t('sessionMenu.trigger')}
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <Card className="absolute right-0 top-full mt-1 z-50 w-72 shadow-xl">
            <CardContent className="p-2 space-y-1">
              <button
                type="button"
                onClick={handleSaveLocal}
                aria-label="Guardar sesión en localStorage"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
              >
                <Save className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium">{t('sessionMenu.saveLocal')}</div>
                  <div className="text-xs text-gray-500">{t('sessionMenu.saveLocalHint')}</div>
                </div>
              </button>
              <button
                type="button"
                onClick={handleLoadLocal}
                disabled={!stored}
                aria-label="Restaurar última sesión guardada"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium">{t('sessionMenu.restore')}</div>
                  <div className="text-xs text-gray-500">
                    {stored
                      ? t('sessionMenu.restoreHintSaved', { date: new Date(stored.savedAt).toLocaleString() })
                      : t('sessionMenu.restoreHintEmpty')}
                  </div>
                </div>
              </button>
              <div className="border-t my-1" />
              <button
                type="button"
                onClick={handleExport}
                aria-label="Exportar sesión a archivo JSON"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
              >
                <Download className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <div className="font-medium">{t('sessionMenu.export')}</div>
                  <div className="text-xs text-gray-500">{t('sessionMenu.exportHint')}</div>
                </div>
              </button>
              <label className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left cursor-pointer">
                <Upload className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <div className="font-medium">{t('sessionMenu.import')}</div>
                  <div className="text-xs text-gray-500">{t('sessionMenu.importHint')}</div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              <div className="border-t my-1" />
              <button
                type="button"
                onClick={handleClear}
                aria-label="Borrar sesión guardada localmente"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-700 dark:text-red-400 text-left"
              >
                <Trash2 className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{t('sessionMenu.clear')}</div>
                </div>
              </button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default SessionMenu;
