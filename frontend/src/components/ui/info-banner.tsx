import * as React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'info' | 'success' | 'warning' | 'danger';

interface InfoBannerProps {
  tone?: Tone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const toneStyles: Record<Tone, { wrapper: string; icon: string; defaultIcon: React.ReactNode }> = {
  info: {
    wrapper: 'border-primary/20 bg-primary/5 text-foreground',
    icon: 'text-primary',
    defaultIcon: <Info className="h-5 w-5" />,
  },
  success: {
    wrapper: 'border-success/20 bg-success/5 text-foreground',
    icon: 'text-success',
    defaultIcon: <CheckCircle2 className="h-5 w-5" />,
  },
  warning: {
    wrapper: 'border-warning/20 bg-warning/5 text-foreground',
    icon: 'text-warning',
    defaultIcon: <AlertTriangle className="h-5 w-5" />,
  },
  danger: {
    wrapper: 'border-destructive/20 bg-destructive/5 text-foreground',
    icon: 'text-destructive',
    defaultIcon: <XCircle className="h-5 w-5" />,
  },
};

/**
 * Inline contextual banner. Use for prerequisite hints, success/error
 * messages and tip boxes. For toast-style notifications use sonner.
 */
export function InfoBanner({
  tone = 'info',
  title,
  children,
  icon,
  action,
  className,
}: InfoBannerProps) {
  const t = toneStyles[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'note'}
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        t.wrapper,
        className
      )}
    >
      <div className={cn('mt-0.5 shrink-0', t.icon)}>{icon ?? t.defaultIcon}</div>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold leading-tight">{title}</p>}
        {children && (
          <div className={cn('text-muted-foreground', title && 'mt-0.5')}>{children}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
