import { CheckCircle2, Search, Rocket, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { useTranslation } from '@/i18n/useTranslation';
import { MigrationPhase, PhaseStatus } from '@/types/assessment';

interface PhaseStripProps {
  currentPhase: MigrationPhase;
  onPhaseChange: (phase: MigrationPhase) => void;
  phaseStatus: PhaseStatus;
}

const PHASES = [
  {
    key: 'assess' as const,
    icon: Search,
    accent: 'phase-assess',
    soft: 'bg-phase-assess/10 text-phase-assess border-phase-assess/30',
  },
  {
    key: 'mobilize' as const,
    icon: Rocket,
    accent: 'phase-mobilize',
    soft: 'bg-phase-mobilize/10 text-phase-mobilize border-phase-mobilize/30',
  },
  {
    key: 'migrate' as const,
    icon: Zap,
    accent: 'phase-migrate',
    soft: 'bg-phase-migrate/10 text-phase-migrate border-phase-migrate/30',
  },
];

/**
 * Top horizontal phase indicator. Three pill-style buttons that double as
 * navigation. Replaces the older PhaseProgressBar + PhaseNavigator combo.
 *
 * `tech-memory` is intentionally excluded — it lives in the overflow menu
 * since it's a tool, not a phase.
 */
export function PhaseStrip({ currentPhase, onPhaseChange, phaseStatus }: PhaseStripProps) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label="Migration phases"
      className="rounded-xl border bg-card shadow-elev-1 p-1.5 flex items-stretch gap-1"
    >
      {PHASES.map((phase, index) => {
        const status = phaseStatus[phase.key];
        const isActive = currentPhase === phase.key;
        const isLocked = status === 'not_started' && phase.key !== 'assess';
        const isDone = status === 'completed';
        const Icon = phase.icon;
        const label = t(`phases.${phase.key}.name`).split(' ')[0];

        const button = (
          <button
            type="button"
            onClick={() => !isLocked && onPhaseChange(phase.key)}
            disabled={isLocked}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            className={cn(
              'group relative flex items-center gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors w-full justify-center sm:justify-start',
              isActive
                ? phase.soft
                : isLocked
                ? 'text-muted-foreground/60 cursor-not-allowed'
                : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
              !isActive && isDone && 'text-success'
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0',
                isDone
                  ? 'bg-success text-success-foreground'
                  : isActive
                  ? 'text-white'
                  : 'bg-muted text-muted-foreground'
              )}
              style={
                isActive && !isDone
                  ? { backgroundColor: `hsl(var(--${phase.accent}))` }
                  : undefined
              }
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </span>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline truncate">{label}</span>
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-2 sm:inset-x-3 bottom-0 h-0.5 rounded-full"
                style={{ backgroundColor: `hsl(var(--${phase.accent}))` }}
              />
            )}
          </button>
        );

        const wrapperClass = 'flex-1 min-w-0 flex';

        if (isLocked) {
          const reason =
            phase.key === 'mobilize'
              ? t('phases.locked.mobilize', {
                  defaultValue: 'Termina la fase Assess para desbloquear',
                })
              : t('phases.locked.migrate', {
                  defaultValue: 'Termina la fase Mobilize para desbloquear',
                });
          return (
            <div key={phase.key} className={wrapperClass}>
              <Tooltip content={reason} wrapperClassName="w-full">
                {button}
              </Tooltip>
            </div>
          );
        }
        return (
          <div key={phase.key} className={wrapperClass}>
            {button}
          </div>
        );
      })}
    </nav>
  );
}
