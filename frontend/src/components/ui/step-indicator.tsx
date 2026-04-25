import * as React from 'react';
import { Check, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

export type StepStatus = 'done' | 'current' | 'pending' | 'locked' | 'error';

export interface Step {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
  /** Tooltip explaining why a locked step is locked. */
  lockReason?: string;
  icon?: React.ReactNode;
}

export interface StepGroup {
  id: string;
  label: string;
  description?: string;
  steps: Step[];
}

interface StepIndicatorProps {
  groups: StepGroup[];
  activeStepId: string;
  onStepClick: (stepId: string) => void;
  /** Phase accent token name. */
  accent?: 'assess' | 'mobilize' | 'migrate' | 'primary';
  className?: string;
}

const accentClass: Record<NonNullable<StepIndicatorProps['accent']>, string> = {
  assess: 'text-phase-assess',
  mobilize: 'text-phase-mobilize',
  migrate: 'text-phase-migrate',
  primary: 'text-primary',
};
const accentBg: Record<NonNullable<StepIndicatorProps['accent']>, string> = {
  assess: 'bg-phase-assess',
  mobilize: 'bg-phase-mobilize',
  migrate: 'bg-phase-migrate',
  primary: 'bg-primary',
};

function StepRow({
  step,
  isActive,
  accent,
  onClick,
  isLast,
}: {
  step: Step;
  isActive: boolean;
  accent: NonNullable<StepIndicatorProps['accent']>;
  onClick: () => void;
  isLast: boolean;
}) {
  const interactive = step.status !== 'locked';
  const statusBubble = (() => {
    switch (step.status) {
      case 'done':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-success-foreground shadow-elev-1">
            <Check className="h-4 w-4" />
          </span>
        );
      case 'current':
        return (
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-white shadow-elev-1 ring-4 ring-offset-2 ring-offset-card',
              accentBg[accent],
              accent === 'assess' && 'ring-phase-assess/20',
              accent === 'mobilize' && 'ring-phase-mobilize/20',
              accent === 'migrate' && 'ring-phase-migrate/20',
              accent === 'primary' && 'ring-primary/20'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        );
      case 'locked':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
          </span>
        );
      case 'error':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            <AlertTriangle className="h-4 w-4" />
          </span>
        );
      default:
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground text-xs font-semibold">
            {step.icon ?? '·'}
          </span>
        );
    }
  })();

  const button = (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={!interactive}
      aria-current={isActive ? 'step' : undefined}
      className={cn(
        'group relative flex items-start gap-3 w-full text-left rounded-lg px-2 py-2 transition-colors',
        interactive ? 'hover:bg-surface-2 cursor-pointer' : 'cursor-not-allowed',
        isActive && 'bg-surface-2'
      )}
    >
      <div className="relative flex flex-col items-center">
        {statusBubble}
        {!isLast && (
          <span
            aria-hidden
            className={cn(
              'mt-1 mb-1 w-0.5 flex-1 min-h-6 rounded-full',
              step.status === 'done' ? 'bg-success/70' : 'bg-border'
            )}
          />
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={cn(
            'text-sm font-medium leading-tight',
            step.status === 'locked'
              ? 'text-muted-foreground'
              : isActive
              ? accentClass[accent]
              : 'text-foreground'
          )}
        >
          {step.label}
        </p>
        {step.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{step.description}</p>
        )}
      </div>
    </button>
  );

  if (step.status === 'locked' && step.lockReason) {
    return (
      <Tooltip content={step.lockReason} side="right">
        {button}
      </Tooltip>
    );
  }
  return button;
}

/**
 * Vertical step indicator grouped by phase / section.
 * Renders one column of steps with a connector line between them.
 */
export function StepIndicator({
  groups,
  activeStepId,
  onStepClick,
  accent = 'primary',
  className,
}: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="space-y-6">
        {groups.map((group) => {
          const total = group.steps.length;
          const done = group.steps.filter((s) => s.status === 'done').length;
          return (
            <li key={group.id}>
              <div className="flex items-baseline justify-between mb-2 px-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </h4>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {done}/{total}
                </span>
              </div>
              {group.description && (
                <p className="px-2 mb-2 text-xs text-muted-foreground">{group.description}</p>
              )}
              <ol className="space-y-0.5">
                {group.steps.map((step, idx) => (
                  <li key={step.id}>
                    <StepRow
                      step={step}
                      isActive={step.id === activeStepId}
                      accent={accent}
                      onClick={() => onStepClick(step.id)}
                      isLast={idx === group.steps.length - 1}
                    />
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
