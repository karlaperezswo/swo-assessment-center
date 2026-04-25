import * as React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Additional helper or hint shown below the action. */
  hint?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Friendly empty state for screens that have no data yet.
 * Always renders an explicit next action so the user is never stuck.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  hint,
  className,
  size = 'md',
}: EmptyStateProps) {
  const padding = size === 'sm' ? 'py-10 px-6' : size === 'lg' ? 'py-20 px-8' : 'py-14 px-8';
  const iconSize = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl',
        'border border-dashed border-border bg-surface-2',
        padding,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'mb-4 flex items-center justify-center rounded-full bg-card text-primary shadow-elev-1',
            iconSize
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
      {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
