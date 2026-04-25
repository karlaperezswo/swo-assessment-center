import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CostBreakdown } from '@/types/assessment';
import { DollarSign, TrendingDown, ExternalLink, BarChart3, Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from '@/i18n/useTranslation';
import type { MultiCloudCostBreakdown, CloudProvider } from '@/types/clouds';
import { brandFor } from '@/theme/cloudBrand';
import { CloudIcon } from '@/components/shared/CloudIcon';

interface CostSummaryProps {
  costs: CostBreakdown;
  calculatorLinks?: {
    onDemand: string;
    oneYearNuri: string;
    threeYearNuri: string;
  };
  /** When present, a comparative multi-cloud section is rendered ABOVE the AWS-only block. */
  multiCloud?: MultiCloudCostBreakdown;
}

export function CostSummary({ costs, calculatorLinks, multiCloud }: CostSummaryProps) {
  const { t } = useTranslation();
  const savings1Year = costs.onDemand.annual - costs.oneYearNuri.annual;
  const savings3Year = costs.onDemand.threeYear - costs.threeYearNuri.threeYear;

  const chartData = [
    {
      name: 'On-Demand',
      'Annual Cost': costs.onDemand.annual,
      'Monthly Cost': costs.onDemand.monthly,
      fill: '#6b7280'
    },
    {
      name: '1-Year NURI',
      'Annual Cost': costs.oneYearNuri.annual,
      'Monthly Cost': costs.oneYearNuri.monthly,
      fill: '#3b82f6'
    },
    {
      name: '3-Year NURI',
      'Annual Cost': costs.threeYearNuri.annual,
      'Monthly Cost': costs.threeYearNuri.monthly,
      fill: '#10b981'
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
          <p className="text-sm text-gray-600">
            {t('costSummary.monthly')}: {formatCurrency(payload[0].payload['Monthly Cost'])}
          </p>
          <p className="text-sm text-gray-600">
            {t('costSummary.annual')}: {formatCurrency(payload[0].payload['Annual Cost'])}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Multi-cloud comparative section — only when backend returned `multiCloud` (>1 provider). */}
      {multiCloud && multiCloud.providers.length > 1 && (
        <MultiCloudCostCards multiCloud={multiCloud} />
      )}

      {/* Cards Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('costSummary.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* On-Demand */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 text-center border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">On-Demand</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(costs.onDemand.monthly)}
                <span className="text-base font-normal text-gray-500">/mo</span>
              </p>
              <p className="text-sm text-gray-600 font-medium">
                {formatCurrency(costs.onDemand.annual)}/yr
              </p>
              <p className="text-xs text-gray-500 mt-3">{t('costSummary.noCommitment')}</p>
            </div>

            {/* 1-Year NURI */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center border-2 border-blue-300 shadow-md">
              <h3 className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wide">1-Year NURI</h3>
              <p className="text-3xl font-bold text-blue-900 mb-2">
                {formatCurrency(costs.oneYearNuri.monthly)}
                <span className="text-base font-normal text-blue-600">/mo</span>
              </p>
              <p className="text-sm text-blue-700 font-medium">
                {formatCurrency(costs.oneYearNuri.annual)}/yr
              </p>
              <div className="flex items-center justify-center gap-1 mt-3 text-green-600 text-sm font-semibold">
                <TrendingDown className="h-4 w-4" />
                <span>{t('costSummary.savesPerYear', { amount: formatCurrency(savings1Year) })}</span>
              </div>
            </div>

            {/* 3-Year NURI */}
            <div className="relative bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center border-2 border-green-300 shadow-md">
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {t('costSummary.bestValue')}
              </div>
              <h3 className="text-sm font-semibold text-green-700 mb-3 uppercase tracking-wide">3-Year NURI</h3>
              <p className="text-3xl font-bold text-green-900 mb-2">
                {formatCurrency(costs.threeYearNuri.monthly)}
                <span className="text-base font-normal text-green-600">/mo</span>
              </p>
              <p className="text-sm text-green-700 font-medium">
                {formatCurrency(costs.threeYearNuri.annual)}/yr
              </p>
              <div className="flex items-center justify-center gap-1 mt-3 text-green-700 text-sm font-bold">
                <TrendingDown className="h-4 w-4" />
                <span>{t('costSummary.savesIn3Years', { amount: formatCurrency(savings3Year) })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('costSummary.chartTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="Annual Cost"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={100}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparative grouped bars — only when multi-cloud data is present. */}
      {multiCloud && multiCloud.providers.length > 1 && <MultiCloudGroupedBars multiCloud={multiCloud} />}

      {/* Calculator Links */}
      {calculatorLinks && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('costSummary.calculatorLinks')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <a
                href={calculatorLinks.onDemand}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="font-medium">{t('costSummary.onDemandCalc')}</span>
              </a>
              <a
                href={calculatorLinks.oneYearNuri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="font-medium">{t('costSummary.oneYearCalc')}</span>
              </a>
              <a
                href={calculatorLinks.threeYearNuri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="font-medium">{t('costSummary.threeYearCalc')}</span>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-cloud sub-components
// ---------------------------------------------------------------------------

function MultiCloudCostCards({ multiCloud }: { multiCloud: MultiCloudCostBreakdown }) {
  const { t } = useTranslation();
  const tiers: Array<{ key: 'onDemand' | 'oneYearCommit' | 'threeYearCommit'; label: string; isBest?: boolean }> = [
    { key: 'onDemand',         label: t('costSummary.onDemand', { defaultValue: 'On-Demand' }) },
    { key: 'oneYearCommit',    label: t('costSummary.oneYear',  { defaultValue: '1-Year Reserved' }) },
    { key: 'threeYearCommit',  label: t('costSummary.threeYear',{ defaultValue: '3-Year Reserved' }), isBest: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {t('costSummary.multiCloudTitle', { defaultValue: 'Comparativo multi-nube' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={
                'rounded-lg p-4 border ' +
                (tier.isBest ? 'border-green-300 bg-green-50/50 dark:bg-green-900/20' : 'border-gray-200 bg-gray-50/50 dark:bg-gray-900/20')
              }
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide">{tier.label}</h3>
                {tier.isBest && (
                  <span className="text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                    {t('costSummary.bestValue')}
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {multiCloud.providers.map((p) => {
                  const brand = brandFor(p.provider);
                  const isCheapest = p.provider === multiCloud.cheapest && tier.isBest;
                  return (
                    <li key={p.provider} className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <CloudIcon provider={p.provider} size={12} />
                        <span style={{ color: brand.text }} className="font-medium">{brand.shortName}</span>
                        {isCheapest && <Trophy className="h-3 w-3 text-orange-500" aria-label="cheapest" />}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(p[tier.key].annual)}/yr
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        {multiCloud.comparisonNotes.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {multiCloud.comparisonNotes.join(' ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MultiCloudGroupedBars({ multiCloud }: { multiCloud: MultiCloudCostBreakdown }) {
  const { t } = useTranslation();
  // Build a Recharts dataset where each row is a tier and each provider is a series.
  const data = [
    { tier: 'On-Demand',         ...providerSeries(multiCloud, 'onDemand') },
    { tier: '1-Year',            ...providerSeries(multiCloud, 'oneYearCommit') },
    { tier: '3-Year',            ...providerSeries(multiCloud, 'threeYearCommit') },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('costSummary.multiCloudChartTitle', { defaultValue: 'Costo anual por nube y nivel de compromiso' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="tier" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              {multiCloud.providers.map((p) => {
                const brand = brandFor(p.provider);
                return (
                  <Bar
                    key={p.provider}
                    dataKey={p.provider}
                    fill={brand.color}
                    name={brand.shortName}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function providerSeries(
  multiCloud: MultiCloudCostBreakdown,
  tier: 'onDemand' | 'oneYearCommit' | 'threeYearCommit'
): Record<CloudProvider, number> {
  const acc = {} as Record<CloudProvider, number>;
  for (const p of multiCloud.providers) {
    acc[p.provider] = p[tier].annual;
  }
  return acc;
}
