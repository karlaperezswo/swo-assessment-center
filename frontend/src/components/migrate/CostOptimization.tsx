import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CostBreakdown } from '@/types/assessment';
import { TrendingDown, Lightbulb, DollarSign, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CostOptimizationProps {
  estimatedCosts: CostBreakdown | null;
}

const OPTIMIZATION_OPPORTUNITIES = [
  {
    category: 'Right-Sizing',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    opportunities: [
      { title: 'Monitor CloudWatch metrics for 2+ weeks', description: 'Collect CPU, memory, and network metrics to identify over-provisioned instances', savings: '15-30%' },
      { title: 'Implement Auto Scaling', description: 'Scale resources based on demand, reduce idle capacity during off-peak hours', savings: '20-40%' },
      { title: 'Use AWS Compute Optimizer', description: 'Get ML-powered recommendations for optimal instance types based on actual workload', savings: '10-25%' },
    ],
  },
  {
    category: 'Reserved Instances & Savings Plans',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    opportunities: [
      { title: 'Purchase 3-Year Savings Plans', description: 'Already reflected in your estimate. Lock in 60% discount on compute usage', savings: '60%' },
      { title: 'Convert to Convertible RIs', description: 'Maintain flexibility while getting 54% discount vs On-Demand', savings: '54%' },
      { title: 'Use Compute Savings Plans', description: 'Automatic discounts across EC2, Lambda, and Fargate', savings: '52-66%' },
    ],
  },
  {
    category: 'Storage Optimization',
    icon: TrendingDown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    opportunities: [
      { title: 'Implement S3 Intelligent-Tiering', description: 'Automatically move objects between access tiers based on usage patterns', savings: '40-68%' },
      { title: 'Use EBS gp3 instead of gp2', description: 'Get 20% cost savings with independent IOPS and throughput provisioning', savings: '20%' },
      { title: 'Snapshot lifecycle policies', description: 'Automate deletion of old snapshots, reducing storage costs', savings: '30-50%' },
    ],
  },
  {
    category: 'Modernization',
    icon: Lightbulb,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    opportunities: [
      { title: 'Adopt serverless architectures', description: 'Replace always-on servers with Lambda, pay only for execution time', savings: '70-90%' },
      { title: 'Containerize workloads', description: 'Use ECS/EKS with Fargate Spot for unpredictable workloads', savings: '50-90%' },
      { title: 'Migrate to managed services', description: 'Reduce operational overhead and hidden costs with RDS, DynamoDB, etc.', savings: '30-50%' },
    ],
  },
];

export function CostOptimization({ estimatedCosts }: CostOptimizationProps) {
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
              <h3 className="font-bold text-amber-900 text-lg">Cost Optimization Opportunities</h3>
              <p className="text-sm text-amber-700 mt-1">
                Continuous cost optimization is key to maximizing cloud ROI. These strategies can help you reduce costs beyond the initial savings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <p className="text-sm text-green-700 mt-1">Potential additional annual savings (est. 20% more)</p>
                <p className="text-xs text-green-600 mt-1">Beyond 3-Year NURI baseline of {formatCurrency(estimatedCosts.threeYearNuri.annual)}/year</p>
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
                      {opp.savings} savings
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
