import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Trophy } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { formatSpanishNumber } from '@/lib/numberFormat';
import type { MultiCloudCostBreakdown, CloudProvider } from '@/types/clouds';
import { brandFor } from '@/theme/cloudBrand';
import { CloudIcon } from '@/components/shared/CloudIcon';

interface TCOChartProps {
  title?: string | undefined;
  onPremisesCost: number;
  onDemandAsIs: number;
  oneYearOptimized: number;
  threeYearOptimized: number;
  /** When present and has >1 provider, the chart renders a multi-cloud grouped layout. */
  multiCloud?: MultiCloudCostBreakdown;
}

export function TCOChart({ title, onPremisesCost, onDemandAsIs, oneYearOptimized, threeYearOptimized, multiCloud }: TCOChartProps) {
  const { t } = useTranslation();
  const formatCurrency = (value: number): string => {
    // Format with Spanish locale: dots for thousands, comma for decimals
    const formatted = formatSpanishNumber(value);
    return `$${formatted}`;
  };

  const formatCompact = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1).replace('.', ',')}M`;
    } else if (value >= 1000) {
      const thousands = Math.round(value / 1000);
      return `$${formatSpanishNumber(thousands)}K`;
    }
    return formatCurrency(value);
  };

  // Calculate savings percentages
  const calculateSavings = (cost: number): string => {
    if (onPremisesCost === 0) return '0,00%';
    const savings = ((onPremisesCost - cost) / onPremisesCost) * 100;
    return `${savings.toFixed(2).replace('.', ',')}%`;
  };

  // Find max value for scaling
  const maxValue = Math.max(onPremisesCost, onDemandAsIs, oneYearOptimized, threeYearOptimized);
  const scale = maxValue > 0 ? 100 / maxValue : 0;

  // Rank AWS options by cost: 1st (lowest) = green, 2nd = cyan, 3rd = yellow
  const awsOptions = [
    { key: 'onDemand', value: onDemandAsIs },
    { key: 'oneYear', value: oneYearOptimized },
    { key: 'threeYear', value: threeYearOptimized },
  ].sort((a, b) => a.value - b.value);
  const savingsBadgeColor: Record<string, string> = {
    [awsOptions[0].key]: 'bg-green-500',
    [awsOptions[1].key]: 'bg-cyan-500',
    [awsOptions[2].key]: 'bg-yellow-500',
  };
  const bestKey = awsOptions[0].key;

  const bars = [
    {
      label: t('tcoChart.onPremises'),
      value: onPremisesCost,
      color: 'bg-blue-600',
      savings: '0%',
      isBaseline: true,
      key: 'onPremises'
    },
    {
      label: t('tcoChart.onDemand'),
      value: onDemandAsIs,
      color: savingsBadgeColor['onDemand'],
      savings: calculateSavings(onDemandAsIs),
      key: 'onDemand'
    },
    {
      label: t('tcoChart.oneYear'),
      value: oneYearOptimized,
      color: savingsBadgeColor['oneYear'],
      savings: calculateSavings(oneYearOptimized),
      key: 'oneYear'
    },
    {
      label: t('tcoChart.threeYear'),
      value: threeYearOptimized,
      color: savingsBadgeColor['threeYear'],
      savings: calculateSavings(threeYearOptimized),
      key: 'threeYear'
    }
  ];

  // Multi-cloud grouped layout: when caller provides a MultiCloudCostBreakdown
  // with more than one provider, we replace the legacy 3-bar AWS layout with
  // grouped bars (On-Demand / 1-Year / 3-Year × N providers).
  const isMultiCloud = !!multiCloud && multiCloud.providers.length > 1;

  if (isMultiCloud) {
    return (
      <MultiCloudTCOChart
        title={title}
        onPremisesCost={onPremisesCost}
        multiCloud={multiCloud!}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          {title ?? t('tcoChart.defaultTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Bar Chart */}
          <div className="space-y-4">
            {bars.map((bar, index) => {
              const isBest = !bar.isBaseline && bar.key === bestKey;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      {bar.label}:
                      {isBest && (
                        <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold tracking-wide">
                          {t('tcoChart.best')}
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-gray-900">{formatCurrency(bar.value)}</span>
                  </div>
                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`${bar.color} h-full flex items-center justify-end pr-4 transition-all duration-500`}
                      style={{ width: `${bar.value * scale}%` }}
                    >
                      <span className="text-white font-bold text-sm">
                        {formatCompact(bar.value)}
                      </span>
                    </div>
                    {!bar.isBaseline && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className={`${savingsBadgeColor[bar.key]} text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1`}>
                          <span>↓</span>
                          <span>{bar.savings}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-4 gap-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-sm text-gray-700">{t('tcoChart.annualCost')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">{t('tcoChart.bestSavings')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-500 rounded"></div>
              <span className="text-sm text-gray-700">{t('tcoChart.secondSavings')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">{t('tcoChart.thirdSavings')}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm text-gray-600">
            <p>• {t('tcoChart.noteUSD')}</p>
            <p>• <span className="font-semibold">{t('tcoChart.noteNUSP')}</span></p>
            <p>• <span className="font-semibold">{t('tcoChart.noteAnnual')}</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Multi-cloud variant — grouped bars by tier × provider with brand colors.
// ---------------------------------------------------------------------------

interface MultiCloudTCOChartProps {
  title?: string;
  onPremisesCost: number;
  multiCloud: MultiCloudCostBreakdown;
}

function MultiCloudTCOChart({ title, onPremisesCost, multiCloud }: MultiCloudTCOChartProps) {
  const { t } = useTranslation();

  const formatCurrency = (value: number): string => `$${formatSpanishNumber(value)}`;
  const formatCompact = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (value >= 1_000) return `$${formatSpanishNumber(Math.round(value / 1000))}K`;
    return formatCurrency(value);
  };
  const calcSavings = (cost: number): string => {
    if (onPremisesCost === 0) return '0,00%';
    const savings = ((onPremisesCost - cost) / onPremisesCost) * 100;
    return `${savings.toFixed(2).replace('.', ',')}%`;
  };

  const tiers: Array<{ key: 'onDemand' | 'oneYearCommit' | 'threeYearCommit'; label: string }> = [
    { key: 'onDemand',         label: t('tcoChart.onDemand') },
    { key: 'oneYearCommit',    label: t('tcoChart.oneYear') },
    { key: 'threeYearCommit',  label: t('tcoChart.threeYear') },
  ];

  // Find the cheapest combination (provider × tier) across all bars for the BEST OVERALL badge.
  let bestProvider: CloudProvider | null = null;
  let bestTier: typeof tiers[number]['key'] | null = null;
  let bestValue = Infinity;
  for (const tier of tiers) {
    for (const p of multiCloud.providers) {
      if (p[tier.key].annual < bestValue) {
        bestValue = p[tier.key].annual;
        bestProvider = p.provider;
        bestTier = tier.key;
      }
    }
  }

  const allValues = [
    onPremisesCost,
    ...tiers.flatMap((t) => multiCloud.providers.map((p) => p[t.key].annual)),
  ];
  const maxValue = Math.max(...allValues, 1);
  const scale = 100 / maxValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          {title ?? t('tcoChart.defaultTitle')}
          <span className="ml-2 text-xs font-normal bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
            {t('tcoChart.multiCloudBadge', { defaultValue: 'Multi-cloud' })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Baseline on-prem bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{t('tcoChart.onPremises')}</span>
              <span className="font-bold text-gray-900">{formatCurrency(onPremisesCost)}</span>
            </div>
            <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className="bg-blue-600 h-full flex items-center justify-end pr-4 transition-all duration-500"
                style={{ width: `${onPremisesCost * scale}%` }}
              >
                <span className="text-white font-bold text-sm">{formatCompact(onPremisesCost)}</span>
              </div>
            </div>
          </div>

          {/* Grouped bars by tier */}
          {tiers.map((tier) => (
            <div key={tier.key} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 border-b pb-1">
                {tier.label}
              </h4>
              {multiCloud.providers.map((p) => {
                const value = p[tier.key].annual;
                const brand = brandFor(p.provider);
                const isBestOverall = p.provider === bestProvider && tier.key === bestTier;
                return (
                  <div key={`${tier.key}-${p.provider}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 inline-flex items-center gap-1.5">
                        <CloudIcon provider={p.provider} size={12} />
                        <span style={{ color: brand.text }}>{brand.shortName}</span>
                        {isBestOverall && (
                          <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold tracking-wide inline-flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {t('tcoChart.bestOverall', { defaultValue: 'Mejor opción' })}
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-gray-900 tabular-nums">{formatCurrency(value)}</span>
                    </div>
                    <div className="relative h-9 bg-gray-100 rounded-md overflow-hidden">
                      <div
                        className="h-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${value * scale}%`, backgroundColor: brand.color }}
                      >
                        <span className="text-white font-semibold text-xs">{formatCompact(value)}</span>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="bg-white/90 text-gray-700 px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                          <span>↓</span>
                          <span>{calcSavings(value)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Comparison notes from the orchestrator */}
          {multiCloud.comparisonNotes.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-xs text-blue-900 dark:text-blue-100">
              {multiCloud.comparisonNotes.join(' ')}
            </div>
          )}

          {/* Notes */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm text-gray-600">
            <p>• {t('tcoChart.noteUSD')}</p>
            <p>• <span className="font-semibold">{t('tcoChart.noteAnnual')}</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
