// Cloud provider logo. Uses official SVGs from /public/cloud-logos/.
// IMPORTANT: those SVGs MUST be the official vendor logos, not placeholders,
// before customer-facing release. Legal validation tracks via the plan's
// pre-requisites (AWS Partner Network, Microsoft Solutions Partner,
// Google Cloud Partner Advantage, Oracle Partner Network).

import type { CloudProvider } from '../../types/clouds';
import { brandFor } from '../../theme/cloudBrand';
import { cn } from '../../lib/utils';

interface Props {
  provider: CloudProvider;
  className?: string;
  size?: number;
  /** When true, falls back to a colored circle if the logo SVG is missing. */
  showFallback?: boolean;
}

export function CloudIcon({ provider, className, size = 16, showFallback = true }: Props) {
  const brand = brandFor(provider);
  return (
    <img
      src={brand.logoPath}
      alt={brand.fullName}
      width={size}
      height={size}
      className={cn('inline-block', className)}
      onError={(e) => {
        if (showFallback) {
          // Fallback: colored circle with initial when SVG fails to load.
          const target = e.currentTarget;
          target.style.display = 'none';
          const sibling = target.nextElementSibling as HTMLElement | null;
          if (sibling) sibling.style.display = 'inline-flex';
        }
      }}
    />
  );
}

/** Compact text fallback for environments where the SVG can't load. */
export function CloudIconFallback({ provider, className }: Pick<Props, 'provider' | 'className'>) {
  const brand = brandFor(provider);
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full text-xs font-bold', className)}
      style={{ backgroundColor: brand.color, color: '#fff', width: 16, height: 16 }}
      aria-hidden
    >
      {brand.shortName.charAt(0)}
    </span>
  );
}
