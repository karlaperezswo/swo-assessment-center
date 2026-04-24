import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Gauge,
  ShieldCheck,
  Zap,
  Users,
  Clock,
  Sparkles,
  Database,
  Cpu,
  HardDrive
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface BusinessCaseMetricsProps {
  serverCount: number;
  databaseCount: number;
  applicationCount: number;
  totalStorageGB: number;
  migrationReadiness: string;
}

export function BusinessCaseMetrics({
  serverCount,
  databaseCount,
  applicationCount,
  totalStorageGB,
  migrationReadiness
}: BusinessCaseMetricsProps) {
  const { t } = useTranslation();
  // Calculate complexity score (0-100)
  const complexityScore = Math.min(
    100,
    Math.round(
      (serverCount * 0.5) +
      (databaseCount * 2) +
      (applicationCount * 1.5) +
      (totalStorageGB / 1000)
    )
  );

  // Estimated migration timeline (months)
  const estimatedTimeline = Math.max(
    3,
    Math.ceil(
      (serverCount / 20) +
      (databaseCount / 5) +
      (applicationCount / 10)
    )
  );

  // Resource requirements
  const estimatedFTE = Math.max(
    2,
    Math.ceil(
      (serverCount / 50) +
      (databaseCount / 10) +
      (applicationCount / 15)
    )
  );

  // Risk level
  const getRiskLevel = () => {
    if (complexityScore > 70) return { level: t('businessCaseMetrics.riskHigh'), color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' };
    if (complexityScore > 40) return { level: t('businessCaseMetrics.riskMedium'), color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' };
    return { level: t('businessCaseMetrics.riskLow'), color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' };
  };

  const risk = getRiskLevel();

  // Readiness score
  const getReadinessScore = () => {
    switch (migrationReadiness.toLowerCase()) {
      case 'ready':
        return { score: 90, color: 'text-green-600', bg: 'bg-green-100' };
      case 'evaluating':
        return { score: 60, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      default:
        return { score: 30, color: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  const readiness = getReadinessScore();

  // Calculate optimization potential (opportunities based on infrastructure)
  // Factors: servers with low utilization, underutilized DBs, redundant apps
  const optimizationPotential = Math.round(
    (serverCount * 0.8) +  // 80% of servers could be optimized
    (databaseCount * 1.2) +  // DBs tend to have more optimization potential
    (applicationCount * 0.5)  // Apps consolidation opportunities
  );

  // Calculate potential cost reduction (percentage)
  // Based on current infrastructure complexity
  const costReductionPercentage = Math.min(
    60,  // Cap at 60% reduction
    Math.round(
      15 +  // Base reduction with cloud
      (serverCount * 0.3) +  // More servers = more savings potential
      (databaseCount * 0.4) +  // DB licensing savings
      (totalStorageGB / 5000) * 10  // Storage optimization
    )
  );

  // Estimated annual cost savings (rough calculation)
  const estimatedAnnualSavings = Math.round(
    (serverCount * 8000) *  // ~$8k per server annual savings
    (costReductionPercentage / 100)
  );


  return (
    <div className="space-y-6">
      {/* Migration Readiness Assessment */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Gauge className="h-6 w-6" />
            {t('businessCaseMetrics.readinessTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Readiness Score */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32">
                  <circle
                    className="text-gray-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="50"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className={readiness.color}
                    strokeWidth="10"
                    strokeDasharray={`${readiness.score * 3.14}, 314`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="50"
                    cx="64"
                    cy="64"
                    transform="rotate(-90 64 64)"
                  />
                </svg>
                <span className="absolute text-3xl font-bold text-gray-900">
                  {readiness.score}%
                </span>
              </div>
              <p className="mt-3 font-semibold text-gray-900">{t('businessCaseMetrics.readinessScore')}</p>
              <p className={`text-sm ${readiness.color} font-medium mt-1`}>
                {t('businessCaseMetrics.statusLabel')} {migrationReadiness}
              </p>
            </div>

            {/* Complexity & Risk */}
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${risk.borderColor} ${risk.bgColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{t('businessCaseMetrics.complexityLabel')}</span>
                  <span className={`text-2xl font-bold ${risk.textColor}`}>{complexityScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full bg-${risk.color}-500`}
                    style={{ width: `${complexityScore}%` }}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${risk.borderColor} ${risk.bgColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className={`h-5 w-5 ${risk.textColor}`} />
                  <span className="text-sm font-medium text-gray-600">{t('businessCaseMetrics.riskLevel')}</span>
                </div>
                <p className={`text-xl font-bold ${risk.textColor}`}>{risk.level} {t('businessCaseMetrics.riskSuffix')}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('businessCaseMetrics.basedOnComplexity')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Estimates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              {t('businessCaseMetrics.timelineTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {estimatedTimeline}
            </div>
            <p className="text-sm text-gray-600">{t('businessCaseMetrics.months')}</p>
            <p className="text-xs text-gray-500 mt-2">
              {t('businessCaseMetrics.includingPlanning')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              {t('businessCaseMetrics.resourceTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {estimatedFTE}
            </div>
            <p className="text-sm text-gray-600">{t('businessCaseMetrics.fte')}</p>
            <p className="text-xs text-gray-500 mt-2">
              {t('businessCaseMetrics.fteNeeded')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              {t('businessCaseMetrics.costTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {costReductionPercentage}%
            </div>
            <p className="text-sm text-gray-600">{t('businessCaseMetrics.annualSavings')}</p>
            <p className="text-xs text-gray-500 mt-2">
              ${t('businessCaseMetrics.perYear', { amount: (estimatedAnnualSavings / 1000).toFixed(0) })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Recommendations */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Zap className="h-6 w-6" />
            {t('businessCaseMetrics.recommendationsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Wins - Optimization Potential */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 font-medium mb-2">{t('businessCaseMetrics.optimizationPotential')}</p>
              <p className="text-3xl font-bold text-blue-600 mb-1">{optimizationPotential}</p>
              <p className="text-xs text-gray-500">
                {t('businessCaseMetrics.optimizationDesc')}
              </p>
            </div>

            {/* Cost Reduction */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600 font-medium mb-2">{t('businessCaseMetrics.costReduction')}</p>
              <p className="text-3xl font-bold text-green-600 mb-1">{costReductionPercentage}%</p>
              <p className="text-xs text-gray-500">
                {t('businessCaseMetrics.costReductionDesc')}
              </p>
            </div>

            {/* ROI Timeline */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 font-medium mb-2">{t('businessCaseMetrics.estimatedROI')}</p>
              <p className="text-3xl font-bold text-purple-600 mb-1">
                {Math.ceil(estimatedAnnualSavings / 1000) > 0 ? Math.ceil((serverCount * 50000) / estimatedAnnualSavings) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {t('businessCaseMetrics.monthsBreakEven')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t('businessCaseMetrics.infraTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <Cpu className="h-8 w-8 text-blue-600 mb-3" />
              <p className="text-2xl font-bold text-blue-900">{serverCount}</p>
              <p className="text-sm text-blue-600 font-medium">{t('businessCaseMetrics.servers')}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <Database className="h-8 w-8 text-green-600 mb-3" />
              <p className="text-2xl font-bold text-green-900">{databaseCount}</p>
              <p className="text-sm text-green-600 font-medium">{t('businessCaseMetrics.databases')}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <Sparkles className="h-8 w-8 text-purple-600 mb-3" />
              <p className="text-2xl font-bold text-purple-900">{applicationCount}</p>
              <p className="text-sm text-purple-600 font-medium">{t('businessCaseMetrics.applications')}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <HardDrive className="h-8 w-8 text-orange-600 mb-3" />
              <p className="text-2xl font-bold text-orange-900">
                {(totalStorageGB / 1024).toFixed(1)}
              </p>
              <p className="text-sm text-orange-600 font-medium">{t('businessCaseMetrics.tbStorage')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
