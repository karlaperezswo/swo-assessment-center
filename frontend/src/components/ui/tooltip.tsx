import { cn } from '@/lib/utils';
import * as React from 'react';

interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Classes for the floating tooltip bubble. */
  className?: string;
  /** Classes for the wrapper span (e.g. `w-full block` to stretch in flex parents). */
  wrapperClassName?: string;
  children: React.ReactElement;
  /** When false, just renders the child without wrapping. */
  enabled?: boolean;
}

const sideStyles: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/**
 * Lightweight CSS-only tooltip. Appears on hover/focus of the wrapper.
 * Use for short hints (under ~80 chars). For long-form content, use a popover.
 */
export function Tooltip({
  content,
  side = 'top',
  className,
  wrapperClassName,
  children,
  enabled = true,
}: TooltipProps) {
  if (!enabled || !content) return children;

  return (
    <span
      className={cn(
        'relative inline-flex group focus-within:z-20 hover:z-20',
        wrapperClassName
      )}
    >
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-30 whitespace-nowrap rounded-md',
          'bg-foreground text-background text-xs font-medium px-2.5 py-1.5 shadow-elev-2',
          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          'transition-opacity duration-150',
          sideStyles[side],
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
