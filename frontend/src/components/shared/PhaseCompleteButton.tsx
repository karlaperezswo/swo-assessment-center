import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';

interface PhaseCompleteButtonProps {
  phaseLabel: string;
  nextPhaseLabel?: string;
  canComplete: boolean;
  isCompleted: boolean;
  onComplete: () => void;
  completionRequirements: string[];
  /** Phase tone for button accent. Legacy values kept for backward compat. */
  accentColor: 'fuchsia' | 'violet' | 'amber' | 'assess' | 'mobilize' | 'migrate';
}

const accentVar: Record<PhaseCompleteButtonProps['accentColor'], string> = {
  fuchsia: '--phase-assess',
  assess: '--phase-assess',
  violet: '--phase-mobilize',
  mobilize: '--phase-mobilize',
  amber: '--phase-migrate',
  migrate: '--phase-migrate',
};

export function PhaseCompleteButton({
  phaseLabel,
  nextPhaseLabel,
  canComplete,
  isCompleted,
  onComplete,
  completionRequirements,
  accentColor,
}: PhaseCompleteButtonProps) {
  const { t } = useTranslation();
  const cssVar = `hsl(var(${accentVar[accentColor]}))`;

  if (isCompleted) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl border bg-success/5 text-success',
          'border-success/30 px-5 py-3'
        )}
      >
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-semibold">
          {t('phaseComplete.completed', { phaseLabel })}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-card shadow-elev-1 p-4',
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">
          {canComplete
            ? t('phaseComplete.readyTitle', {
                defaultValue: '¿Listo para avanzar?',
              })
            : t('phaseComplete.requirements', { defaultValue: 'Falta antes de avanzar:' })}
        </p>
        {canComplete ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            {nextPhaseLabel
              ? t('phaseComplete.readyDescNext', {
                  next: nextPhaseLabel,
                  defaultValue: 'Marca esta fase como completa y pasa a {{next}}.',
                })
              : t('phaseComplete.readyDesc', {
                  defaultValue: 'Marca esta fase como completa.',
                })}
          </p>
        ) : (
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {completionRequirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                {req}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        type="button"
        onClick={onComplete}
        disabled={!canComplete}
        size="lg"
        className={cn(
          'shrink-0 text-white shadow-elev-2',
          !canComplete && 'opacity-60'
        )}
        style={canComplete ? { backgroundColor: cssVar } : undefined}
      >
        {canComplete ? (
          <>
            {t('phaseComplete.button', { phase: phaseLabel })}
            {nextPhaseLabel && <ArrowRight className="h-4 w-4 ml-2" />}
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            {t('phaseComplete.button', { phase: phaseLabel })}
          </>
        )}
      </Button>
    </div>
  );
}
