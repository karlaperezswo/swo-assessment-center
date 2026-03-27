import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { formatSpanishNumber } from '@/lib/numberFormat';

interface TCOChartProps {
  title?: string;
  onPremisesCost: number;
  onDemandAsIs: number;
  oneYearOptimized: number;
  threeYearOptimized: number;
}

export function TCOChart({ title = 'Costo Anual en USD (ARR)', onPremisesCost, onDemandAsIs, oneYearOptimized, threeYearOptimized }: TCOChartProps) {
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
      label: 'On-Premises',
      value: onPremisesCost,
      color: 'bg-blue-600',
      savings: '0%',
      isBaseline: true,
      key: 'onPremises'
    },
    {
      label: 'Ondemand (As-Is Optimizado)',
      value: onDemandAsIs,
      color: savingsBadgeColor['onDemand'],
      savings: calculateSavings(onDemandAsIs),
      key: 'onDemand'
    },
    {
      label: '1 Año Optimizado',
      value: oneYearOptimized,
      color: savingsBadgeColor['oneYear'],
      savings: calculateSavings(oneYearOptimized),
      key: 'oneYear'
    },
    {
      label: '3 Años Optimizado',
      value: threeYearOptimized,
      color: savingsBadgeColor['threeYear'],
      savings: calculateSavings(threeYearOptimized),
      key: 'threeYear'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          {title}
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
                          ★ BEST
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
              <span className="text-sm text-gray-700">COSTO ANUAL</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">MEJOR AHORRO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-500 rounded"></div>
              <span className="text-sm text-gray-700">2° AHORRO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">3° AHORRO</span>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm text-gray-600">
            <p>• Todos los precios están en USD</p>
            <p>• <span className="font-semibold">NUSP = No Upfront Saving Plan</span></p>
            <p>• <span className="font-semibold">Todos los consumos proyectados son anuales</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
