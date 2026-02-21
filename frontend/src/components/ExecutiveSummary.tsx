import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CostBreakdown } from '@/types/assessment';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Zap,
  Shield,
  Target,
  ArrowDownCircle,
  Calendar
} from 'lucide-react';

interface ExecutiveSummaryProps {
  clientName: string;
  onPremisesCost: number;
  estimatedCosts: CostBreakdown;
  totalServers: number;
  migrationReadiness: string;
}

export function ExecutiveSummary({
  clientName,
  onPremisesCost,
  estimatedCosts,
  totalServers,
  migrationReadiness,
}: ExecutiveSummaryProps) {
  // Calculate key metrics
  const awsCost = estimatedCosts.threeYearNuri.annual;
  const totalSavings = onPremisesCost - awsCost;
  const savingsPercentage = onPremisesCost > 0
    ? ((totalSavings / onPremisesCost) * 100).toFixed(1)
    : 0;

  const roi = onPremisesCost > 0
    ? (((totalSavings * 3) / onPremisesCost) * 100).toFixed(0)
    : 0;

  const paybackMonths = awsCost > 0 && totalSavings > 0
    ? Math.round((onPremisesCost * 0.3) / (totalSavings / 12))
    : 0;

  const tcoReduction = estimatedCosts.onDemand.threeYear - estimatedCosts.threeYearNuri.threeYear;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getReadinessColor = (readiness: string) => {
    switch (readiness.toLowerCase()) {
      case 'ready':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'evaluating':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{clientName}</h1>
            <p className="text-blue-100 text-lg">AWS Migration Business Case</p>
          </div>
          <div className={`px-6 py-3 rounded-lg border-2 ${getReadinessColor(migrationReadiness)}`}>
            <p className="text-sm font-semibold uppercase tracking-wide">
              {migrationReadiness}
            </p>
          </div>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <ArrowDownCircle className="h-8 w-8 text-green-300" />
              <span className="text-3xl font-bold text-green-300">{savingsPercentage}%</span>
            </div>
            <p className="text-sm text-blue-100 mb-1">Annual Cost Reduction</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSavings)}/year</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <Target className="h-8 w-8 text-purple-300" />
              <span className="text-3xl font-bold text-purple-300">{roi}%</span>
            </div>
            <p className="text-sm text-blue-100 mb-1">3-Year ROI</p>
            <p className="text-2xl font-bold">{formatCurrency(Number(roi) * awsCost / 100)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="h-8 w-8 text-yellow-300" />
              <span className="text-3xl font-bold text-yellow-300">{paybackMonths}</span>
            </div>
            <p className="text-sm text-blue-100 mb-1">Payback Period</p>
            <p className="text-2xl font-bold">months</p>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              3-Year TCO Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(tcoReduction)}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              vs. On-Premises Total Cost
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Infrastructure Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totalServers}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Servers to Migrate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              On-Premises Annual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(onPremisesCost)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Current Infrastructure Cost
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              AWS Annual (3Y NURI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(awsCost)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Optimized AWS Cost
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
