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
    if (complexityScore > 70) return { level: 'High', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' };
    if (complexityScore > 40) return { level: 'Medium', color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' };
    return { level: 'Low', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' };
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

  return (
    <div className="space-y-6">
      {/* Migration Readiness Assessment */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Gauge className="h-6 w-6" />
            Migration Readiness Assessment
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
              <p className="mt-3 font-semibold text-gray-900">Readiness Score</p>
              <p className={`text-sm ${readiness.color} font-medium mt-1`}>
                Status: {migrationReadiness}
              </p>
            </div>

            {/* Complexity & Risk */}
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${risk.borderColor} ${risk.bgColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Migration Complexity</span>
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
                  <span className="text-sm font-medium text-gray-600">Risk Level</span>
                </div>
                <p className={`text-xl font-bold ${risk.textColor}`}>{risk.level} Risk</p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on infrastructure complexity
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
              Timeline Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {estimatedTimeline}
            </div>
            <p className="text-sm text-gray-600">months</p>
            <p className="text-xs text-gray-500 mt-2">
              Including planning & testing
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Resource Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {estimatedFTE}
            </div>
            <p className="text-sm text-gray-600">FTE</p>
            <p className="text-xs text-gray-500 mt-2">
              Full-time equivalents needed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Modernization Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-2">
              High
            </div>
            <p className="text-sm text-gray-600">Opportunity</p>
            <p className="text-xs text-gray-500 mt-2">
              Cloud-native capabilities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Infrastructure Scope
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <Cpu className="h-8 w-8 text-blue-600 mb-3" />
              <p className="text-2xl font-bold text-blue-900">{serverCount}</p>
              <p className="text-sm text-blue-600 font-medium">Servers</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <Database className="h-8 w-8 text-green-600 mb-3" />
              <p className="text-2xl font-bold text-green-900">{databaseCount}</p>
              <p className="text-sm text-green-600 font-medium">Databases</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <Sparkles className="h-8 w-8 text-purple-600 mb-3" />
              <p className="text-2xl font-bold text-purple-900">{applicationCount}</p>
              <p className="text-sm text-purple-600 font-medium">Applications</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <HardDrive className="h-8 w-8 text-orange-600 mb-3" />
              <p className="text-2xl font-bold text-orange-900">
                {(totalStorageGB / 1024).toFixed(1)}
              </p>
              <p className="text-sm text-orange-600 font-medium">TB Storage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
