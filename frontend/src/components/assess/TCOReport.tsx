import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CostBreakdown, ClientFormData, ExcelData } from '@/types/assessment';
import { DollarSign, TrendingDown, Server, Database, HardDrive, ArrowRight } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface TCOReportProps {
  excelData: ExcelData | null;
  estimatedCosts: CostBreakdown | null;
  clientData: ClientFormData;
}

export function TCOReport({ excelData, estimatedCosts, clientData }: TCOReportProps) {
  if (!excelData || !estimatedCosts) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <Card className="border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-white">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <DollarSign className="h-12 w-12 text-fuchsia-300" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700">TCO Report Not Available</h3>
                <p className="text-sm text-gray-500">Upload your MPA data in the Rapid Discovery tab to generate TCO analysis.</p>
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

  return (
    <div className="space-y-6">
      {/* TCO Header */}
      <Card className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-fuchsia-700 text-white border-0">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-6 w-6" />
            <h2 className="text-xl font-bold">Total Cost of Ownership Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/15 backdrop-blur rounded-lg p-4 text-center">
              <p className="text-sm text-white/80 mb-1">Current On-Premises</p>
              <p className="text-3xl font-bold">{formatCurrency(onPremCost)}</p>
              <p className="text-xs text-white/60">per year</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center">
                <ArrowRight className="h-8 w-8 text-white/60" />
                <span className="text-xs text-white/60 mt-1">Migration</span>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-4 text-center">
              <p className="text-sm text-white/80 mb-1">AWS (3Y NURI)</p>
              <p className="text-3xl font-bold">{formatCurrency(awsAnnual)}</p>
              <p className="text-xs text-white/60">per year</p>
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
              <p className="text-sm text-gray-600 font-medium">Annual Savings</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(annualSavings)}</p>
              <p className="text-sm text-green-500 font-medium">{savingsPercent}% reduction</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">3-Year Savings</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(annualSavings * 3)}</p>
              <p className="text-sm text-blue-500 font-medium">vs On-Premises</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200">
            <CardContent className="pt-6 text-center">
              <TrendingDown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">Monthly AWS Cost</p>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(estimatedCosts.threeYearNuri.monthly)}</p>
              <p className="text-sm text-purple-500 font-medium">3-Year NURI pricing</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Infrastructure Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Infrastructure Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Server className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{excelData.servers.length}</p>
                <p className="text-xs text-gray-600">Servers</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Database className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{excelData.databases.length}</p>
                <p className="text-xs text-gray-600">Databases</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Server className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{excelData.applications.length}</p>
                <p className="text-xs text-gray-600">Applications</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <HardDrive className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(Math.round(totalStorage))}</p>
                <p className="text-xs text-gray-600">GB Storage</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AWS Pricing Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">On-Demand</h4>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(estimatedCosts.onDemand.monthly)}<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(estimatedCosts.onDemand.annual)}/yr</p>
              <p className="text-xs text-gray-400 mt-2">No commitment</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-5 text-center border-2 border-blue-300">
              <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">1-Year NURI</h4>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(estimatedCosts.oneYearNuri.monthly)}<span className="text-sm font-normal text-blue-600">/mo</span></p>
              <p className="text-sm text-blue-600 mt-1">{formatCurrency(estimatedCosts.oneYearNuri.annual)}/yr</p>
              <p className="text-xs text-blue-500 mt-2">~36% savings</p>
            </div>
            <div className="relative bg-green-50 rounded-lg p-5 text-center border-2 border-green-300">
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">BEST</div>
              <h4 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">3-Year NURI</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(estimatedCosts.threeYearNuri.monthly)}<span className="text-sm font-normal text-green-600">/mo</span></p>
              <p className="text-sm text-green-600 mt-1">{formatCurrency(estimatedCosts.threeYearNuri.annual)}/yr</p>
              <p className="text-xs text-green-500 mt-2">~60% savings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
