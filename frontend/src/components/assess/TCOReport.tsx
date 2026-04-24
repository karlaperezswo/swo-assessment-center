import { useTranslation } from '@/i18n/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CostBreakdown, ClientFormData, ExcelData } from '@/types/assessment';
import { DollarSign, TrendingDown, Server, Database, HardDrive, ArrowRight, Cpu, MemoryStick, Layers } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { TCOScenarioBuilder } from '@/components/assess/TCOScenarioBuilder';

interface TCOReportProps {
  excelData: ExcelData | null;
  estimatedCosts: CostBreakdown | null;
  clientData: ClientFormData;
}

export function TCOReport({ excelData, estimatedCosts, clientData }: TCOReportProps) {
  const { t } = useTranslation();

  if (!excelData || !estimatedCosts) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <Card className="border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-white">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <DollarSign className="h-12 w-12 text-fuchsia-300" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700">{t('tcoReport.empty')}</h3>
                <p className="text-sm text-gray-500">{t('tcoReport.emptyDescription')}</p>
              </div>
            </div>
            {/* Preview Skeleton */}
            <div className="mt-8 space-y-6 max-w-4xl mx-auto opacity-40">
              <div className="grid grid-cols-3 gap-6">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onPremCost = clientData.onPremisesCost || 0;
  const awsAnnual = estimatedCosts.threeYearNuri.annual;
  const annualSavings = onPremCost - awsAnnual;
  const savingsPercent = onPremCost > 0 ? ((annualSavings / onPremCost) * 100).toFixed(1) : '0';
  const totalStorage = excelData.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0);

  // Calculate infrastructure statistics
  // Added: 2026-02-25 - Infrastructure Scope enhancement
  const calculateInfraStats = () => {
    let totalCpus = 0;
    let totalCores = 0;
    let totalRAM = 0;
    const osVersions: { [version: string]: number } = {};

    excelData.servers.forEach(server => {
      totalCpus += server.numCpus || 0;
      totalCores += (server.numCpus || 0) * (server.numCoresPerCpu || 0);
      totalRAM += server.totalRAM || 0;

      const osVersion = server.osVersion || 'Unknown';
      osVersions[osVersion] = (osVersions[osVersion] || 0) + 1;
    });

    return {
      totalCpus,
      totalCores,
      totalRAM,
      osVersions: Object.entries(osVersions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Top 5 OS versions
    };
  };

  const infraStats = calculateInfraStats();

  return (
    <div className="space-y-6">
      {/* TCO Header */}
      <Card className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-fuchsia-700 text-white border-0">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-6 w-6" />
            <h2 className="text-xl font-bold">{t('tcoReport.totalCostOfOwnership')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/15 backdrop-blur rounded-lg p-4 text-center">
              <p className="text-sm text-white/80 mb-1">{t('tcoReport.currentOnPremises')}</p>
              <p className="text-3xl font-bold">{formatCurrency(onPremCost)}</p>
              <p className="text-xs text-white/60">{t('tcoReport.perYear')}</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center">
                <ArrowRight className="h-8 w-8 text-white/60" />
                <span className="text-xs text-white/60 mt-1">{t('tcoReport.migration')}</span>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-4 text-center">
              <p className="text-sm text-white/80 mb-1">{t('tcoReport.awsPrice')}</p>
              <p className="text-3xl font-bold">{formatCurrency(awsAnnual)}</p>
              <p className="text-xs text-white/60">{t('tcoReport.perYear')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings Summary */}
      {onPremCost > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-green-200">
            <CardContent className="pt-6 text-center">
              <TrendingDown className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">{t('tcoReport.annualSavings')}</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(annualSavings)}</p>
              <p className="text-sm text-green-500 font-medium">{savingsPercent}% {t('tcoReport.percentReduction')}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">{t('tcoReport.threeYearSavings')}</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(annualSavings * 3)}</p>
              <p className="text-sm text-blue-500 font-medium">{t('tcoReport.vsOnPremises')}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200">
            <CardContent className="pt-6 text-center">
              <TrendingDown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">{t('tcoReport.monthlyAwsCost')}</p>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(estimatedCosts.threeYearNuri.monthly)}</p>
              <p className="text-sm text-purple-500 font-medium">{t('tcoReport.threeYearPricing')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Infrastructure Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('tcoReport.infrastructureScope')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Server className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{excelData.servers.length}</p>
                <p className="text-xs text-gray-600">{t('fileUploader.summary.servers')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Database className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{excelData.databases.length}</p>
                <p className="text-xs text-gray-600">{t('fileUploader.summary.databases')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Server className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{excelData.applications.length}</p>
                <p className="text-xs text-gray-600">{t('fileUploader.summary.applications')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <HardDrive className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(Math.round(totalStorage))}</p>
                <p className="text-xs text-gray-600">{t('fileUploader.summary.totalGb')}</p>
              </div>
            </div>
          </div>

          {/* Infrastructure Details - Added: 2026-02-25 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Infrastructure Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                <Cpu className="h-8 w-8 text-cyan-600" />
                <div>
                  <p className="text-2xl font-bold text-cyan-900">{infraStats.totalCpus.toLocaleString()}</p>
                  <p className="text-xs text-cyan-600 font-medium">Total CPUs</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <Layers className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold text-indigo-900">{infraStats.totalCores.toLocaleString()}</p>
                  <p className="text-xs text-indigo-600 font-medium">Total Cores</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                <MemoryStick className="h-8 w-8 text-pink-600" />
                <div>
                  <p className="text-2xl font-bold text-pink-900">{infraStats.totalRAM.toLocaleString()}</p>
                  <p className="text-xs text-pink-600 font-medium">GB RAM</p>
                </div>
              </div>
            </div>
          </div>

          {/* OS Distribution - Added: 2026-02-25 */}
          {infraStats.osVersions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Top Operating Systems</h4>
              <div className="space-y-2">
                {infraStats.osVersions.map(([version, count]) => (
                  <div key={version} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-sm font-medium text-gray-700">{version}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(count / excelData.servers.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('tcoReport.awsPricingOptions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('tcoReport.onDemand')}</h4>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(estimatedCosts.onDemand.monthly)}<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(estimatedCosts.onDemand.annual)}/yr</p>
              <p className="text-xs text-gray-400 mt-2">{t('tcoReport.onDemandDesc')}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-5 text-center border-2 border-blue-300">
              <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">{t('tcoReport.oneYear')}</h4>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(estimatedCosts.oneYearNuri.monthly)}<span className="text-sm font-normal text-blue-600">/mo</span></p>
              <p className="text-sm text-blue-600 mt-1">{formatCurrency(estimatedCosts.oneYearNuri.annual)}/yr</p>
              <p className="text-xs text-blue-500 mt-2">{t('tcoReport.oneYearSavings')}</p>
            </div>
            <div className="relative bg-green-50 rounded-lg p-5 text-center border-2 border-green-300">
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{t('tcoReport.bestOption')}</div>
              <h4 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">{t('tcoReport.threeYear')}</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(estimatedCosts.threeYearNuri.monthly)}<span className="text-sm font-normal text-green-600">/mo</span></p>
              <p className="text-sm text-green-600 mt-1">{formatCurrency(estimatedCosts.threeYearNuri.annual)}/yr</p>
              <p className="text-xs text-green-500 mt-2">{t('tcoReport.threeYearSavings')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <TCOScenarioBuilder estimatedCosts={estimatedCosts} clientName={clientData.clientName} />
    </div>
  );
}
