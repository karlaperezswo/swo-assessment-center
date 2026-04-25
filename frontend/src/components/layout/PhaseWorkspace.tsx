import * as React from 'react';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StepIndicator, StepGroup } from '@/components/ui/step-indicator';
import { useState } from 'react';

export interface PhaseWorkspaceProps {
  groups: StepGroup[];
  activeStepId: string;
  onStepChange: (stepId: string) => void;
  accent: 'assess' | 'mobilize' | 'migrate' | 'primary';
  /** Optional overview block (e.g. client summary) shown above the steps. */
  overview?: React.ReactNode;
  /** Right-side area: actual page content for the active step. */
  children: React.ReactNode;
  /** Slot rendered as a sticky footer (back / next, complete-phase, etc.). */
  footer?: React.ReactNode;
}

const accentBorder: Record<NonNullable<PhaseWorkspaceProps['accent']>, string> = {
  assess: 'border-phase-assess/30',
  mobilize: 'border-phase-mobilize/30',
  migrate: 'border-phase-migrate/30',
  primary: 'border-primary/30',
};

/**
 * Two-column workspace layout used by every phase.
 *
 * Left: sticky sidebar with optional overview + grouped step indicator.
 * Right: page content for the active step and a bottom action footer.
 *
 * Collapses to a single column on mobile with a drawer-style step menu.
 */
export function PhaseWorkspace({
  groups,
  activeStepId,
  onStepChange,
  accent,
  overview,
  children,
  footer,
}: PhaseWorkspaceProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const allSteps = groups.flatMap((g) => g.steps);
  const idx = allSteps.findIndex((s) => s.id === activeStepId);
  const activeStep = idx >= 0 ? allSteps[idx] : undefined;

  const handleStepClick = (stepId: string) => {
    onStepChange(stepId);
    setMobileOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Mobile step toggle */}
      <div className="lg:hidden flex items-center justify-between rounded-lg border bg-card px-3 py-2 shadow-elev-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {activeStep ? `Paso ${idx + 1} de ${allSteps.length}` : 'Pasos'}
          </p>
          <p className="text-sm font-medium truncate">{activeStep?.label ?? '—'}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label="Toggle step list"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto',
          'rounded-xl border bg-card shadow-elev-1 p-4',
          accentBorder[accent],
          !mobileOpen && 'hidden lg:block'
        )}
      >
        {overview && <div className="mb-5 pb-5 border-b border-border">{overview}</div>}
        <StepIndicator
          groups={groups}
          activeStepId={activeStepId}
          onStepClick={handleStepClick}
          accent={accent}
        />
      </aside>

      {/* Main + footer */}
      <div className="min-w-0 flex flex-col gap-6">
        <div className="animate-fadeIn">{children}</div>
        {footer && <div className="pt-2">{footer}</div>}
      </div>
    </div>
  );
}

interface FooterNavProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  /** Optional element placed between back and next (e.g. Complete Phase). */
  primaryAction?: React.ReactNode;
  hideBack?: boolean;
  hideNext?: boolean;
}

/**
 * Sticky-feeling footer with back / next navigation and an optional primary
 * action (e.g. "Complete phase"). Use inside PhaseWorkspace footer slot.
 */
export function PhaseFooterNav({
  onBack,
  onNext,
  backLabel = 'Atrás',
  nextLabel = 'Siguiente',
  primaryAction,
  hideBack,
  hideNext,
}: FooterNavProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card shadow-elev-1 px-4 py-3">
      <div>
        {!hideBack && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={!onBack}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {backLabel}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {primaryAction}
        {!hideNext && (
          <Button
            type="button"
            size="sm"
            onClick={onNext}
            disabled={!onNext}
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
