import { useTranslation } from '@/i18n/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CostBreakdown } from '@/types/assessment';
import type { MultiCloudCostBreakdown } from '@/types/clouds';
import { TrendingDown, Lightbulb, DollarSign, Zap, Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { brandFor } from '@/theme/cloudBrand';
import { CloudIcon } from '@/components/shared/CloudIcon';

interface CostOptimizationProps {
  estimatedCosts: CostBreakdown | null;
  /** Multi-cloud rollup — surfaces cheapest provider + delta vs baseline. */
  multiCloud?: MultiCloudCostBreakdown;
}

export function CostOptimization({ estimatedCosts, multiCloud }: CostOptimizationProps) {
  const { t } = useTranslation();
  const isMultiCloud = !!multiCloud && multiCloud.providers.length > 1;

  const OPTIMIZATION_OPPORTUNITIES = [
    {
      category: t('costOptimization.categories.rightSizing'),
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      opportunities: [
        { title: t('costOptimization.rightSizing.op1.title'), description: t('costOptimization.rightSizing.op1.description'), savings: '15-30%' },
        { title: t('costOptimization.rightSizing.op2.title'), description: t('costOptimization.rightSizing.op2.description'), savings: '20-40%' },
        { title: t('costOptimization.rightSizing.op3.title'), description: t('costOptimization.rightSizing.op3.description'), savings: '10-25%' },
      ],
    },
    {
      category: t('costOptimization.categories.reservedInstances'),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      opportunities: [
        { title: t('costOptimization.reservedInstances.op1.title'), description: t('costOptimization.reservedInstances.op1.description'), savings: '60%' },
        { title: t('costOptimization.reservedInstances.op2.title'), description: t('costOptimization.reservedInstances.op2.description'), savings: '54%' },
        { title: t('costOptimization.reservedInstances.op3.title'), description: t('costOptimization.reservedInstances.op3.description'), savings: '52-66%' },
      ],
    },
    {
      category: t('costOptimization.categories.storage'),
      icon: TrendingDown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      opportunities: [
        { title: t('costOptimization.storage.op1.title'), description: t('costOptimization.storage.op1.description'), savings: '40-68%' },
        { title: t('costOptimization.storage.op2.title'), description: t('costOptimization.storage.op2.description'), savings: '20%' },
        { title: t('costOptimization.storage.op3.title'), description: t('costOptimization.storage.op3.description'), savings: '30-50%' },
      ],
    },
    {
      category: t('costOptimization.categories.modernization'),
      icon: Lightbulb,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      opportunities: [
        { title: t('costOptimization.modernization.op1.title'), description: t('costOptimization.modernization.op1.description'), savings: '70-90%' },
        { title: t('costOptimization.modernization.op2.title'), description: t('costOptimization.modernization.op2.description'), savings: '50-90%' },
        { title: t('costOptimization.modernization.op3.title'), description: t('costOptimization.modernization.op3.description'), savings: '30-50%' },
      ],
    },
  ];
  const potentialAdditionalSavings = estimatedCosts
    ? Math.round((estimatedCosts.onDemand.annual - estimatedCosts.threeYearNuri.annual) * 0.2)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingDown className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">{t('costOptimization.title')}</h3>
              <p className="text-sm text-amber-700 mt-1">
                {t('costOptimization.description')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-cloud cheapest summary */}
      {isMultiCloud && (() => {
        const cheapest = multiCloud!.providers.find((p) => p.provider === multiCloud!.cheapest)!;
        const others = multiCloud!.providers.filter((p) => p.provider !== multiCloud!.cheapest);
        const maxOther = others.reduce(
          (acc, p) => (p.threeYearCommit.annual > acc ? p.threeYearCommit.annual : acc),
          0
        );
        const delta = maxOther - cheapest.threeYearCommit.annual;
        const brand = brandFor(cheapest.provider);
        return (
          <Card className="border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Trophy className="h-5 w-5" />
                {t('costOptimization.cheapestCloudTitle', { defaultValue: 'Nube más económica (3-Year Reserved)' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-2xl font-bold" style={{ color: brand.text }}>
                  <CloudIcon provider={cheapest.provider} size={28} />
                  {brand.fullName}
                </div>
                <div className="ml-auto text-right">
                  <div className="text-3xl font-extrabold text-green-700">
                    {formatCurrency(cheapest.threeYearCommit.annual)}/yr
                  </div>
                  {delta > 0 && (
                    <div className="text-sm text-green-700 font-semibold mt-1">
                      ↓ {formatCurrency(delta)}/yr {t('costOptimization.vsMostExpensiveCloud', { defaultValue: 'vs nube más cara' })}
                    </div>
                  )}
                </div>
              </div>
              {multiCloud!.comparisonNotes.length > 0 && (
                <p className="text-xs text-orange-900 mt-3">{multiCloud!.comparisonNotes.join(' ')}</p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Potential Savings */}
      {estimatedCosts && (
        <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-full p-4 shadow-md">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-900">{formatCurrency(potentialAdditionalSavings)}</p>
                <p className="text-sm text-green-700 mt-1">{t('costOptimization.potentialSavings')}</p>
                <p className="text-xs text-green-600 mt-1">{t('costOptimization.beyondBaseline', { amount: formatCurrency(estimatedCosts.threeYearNuri.annual) })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Categories */}
      {OPTIMIZATION_OPPORTUNITIES.map((category) => {
        const Icon = category.icon;
        return (
          <Card key={category.category} className={`border ${category.borderColor}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${category.color}`} />
                <CardTitle className="text-lg">{category.category}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.opportunities.map((opp, i) => (
                <div key={i} className={`p-4 rounded-lg ${category.bgColor}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900">{opp.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{opp.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${category.color} ${category.bgColor} border ${category.borderColor}`}>
                      {opp.savings} {t('common.savings')}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
