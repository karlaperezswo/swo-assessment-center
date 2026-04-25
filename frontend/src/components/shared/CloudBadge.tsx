// Pill with the cloud's brand color + logo + name. Used in tables, charts and
// agent drawer to consistently identify "which cloud is this row about".

import type { CloudProvider } from '../../types/clouds';
import { brandFor } from '../../theme/cloudBrand';
import { CloudIcon } from './CloudIcon';
import { cn } from '../../lib/utils';

interface Props {
  provider: CloudProvider;
  variant?: 'solid' | 'soft' | 'outline';
  size?: 'sm' | 'md';
  showName?: boolean;
  className?: string;
}

export function CloudBadge({
  provider,
  variant = 'soft',
  size = 'sm',
  showName = true,
  className,
}: Props) {
  const brand = brandFor(provider);
  const styles =
    variant === 'solid'
      ? { backgroundColor: brand.color, color: '#fff', borderColor: brand.color }
      : variant === 'outline'
        ? { backgroundColor: 'transparent', color: brand.text, borderColor: brand.border }
        : { backgroundColor: brand.bg, color: brand.text, borderColor: brand.border };

  const sizeClasses = size === 'sm' ? 'gap-1 px-1.5 py-0.5 text-xs' : 'gap-1.5 px-2 py-1 text-sm';

  return (
    <span
      className={cn('inline-flex items-center rounded-full border font-medium', sizeClasses, className)}
      style={styles}
    >
      <CloudIcon provider={provider} size={size === 'sm' ? 12 : 14} />
      {showName ? brand.shortName : null}
    </span>
  );
}
