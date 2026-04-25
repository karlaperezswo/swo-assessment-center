// Header chips for selecting active clouds. Multi-select; the chip for the
// last active cloud is non-interactive (invariant ≥1 active).

import { useTranslation } from 'react-i18next';
import { useActiveClouds } from '../../clouds/useActiveClouds';
import { ALL_CLOUDS, type CloudProvider } from '../../types/clouds';
import { brandFor } from '../../theme/cloudBrand';
import { CloudIcon } from '../shared/CloudIcon';
import { cn } from '../../lib/utils';

export function CloudSelector() {
  const { state, toggle, isActive } = useActiveClouds();
  const { t } = useTranslation();
  const isLast = (c: CloudProvider) => isActive(c) && state.active.length === 1;

  return (
    <div
      role="group"
      aria-label={t('cloudSelector.label', { defaultValue: 'Nubes activas' })}
      className="flex flex-wrap gap-1"
    >
      {ALL_CLOUDS.map((c) => {
        const active = isActive(c);
        const brand = brandFor(c);
        return (
          <button
            key={c}
            type="button"
            role="checkbox"
            aria-checked={active}
            aria-label={brand.fullName}
            disabled={isLast(c)}
            onClick={() => toggle(c)}
            title={
              isLast(c)
                ? t('cloudSelector.lastCloudWarning', {
                    defaultValue: 'Debe haber al menos una nube activa',
                  })
                : brand.fullName
            }
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active
                ? 'shadow-sm'
                : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500',
              isLast(c) && 'cursor-not-allowed opacity-90'
            )}
            style={
              active
                ? {
                    backgroundColor: brand.bg,
                    color: brand.text,
                    borderColor: brand.border,
                  }
                : undefined
            }
          >
            <CloudIcon provider={c} size={14} />
            <span>{brand.shortName}</span>
          </button>
        );
      })}
    </div>
  );
}
