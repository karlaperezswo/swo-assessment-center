import { useMemo } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { BusinessCaseMetrics } from '@/components/BusinessCaseMetrics';
import { ExcelData, UploadSummary } from '@/types/assessment';
import {
  computeReadiness,
  readinessLevelLabel,
  ManualChecklistState,
  ReadinessDimension,
  ReadinessCheck,
} from '@/lib/migrationReadiness';
import { usePersistedState } from '@/lib/usePersistedState';
import {
  Gauge,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Database,
  Users,
  Cpu,
} from 'lucide-react';

interface MigrationReadinessProps {
  excelData: ExcelData | null;
  uploadSummary: UploadSummary | null;
  migrationReadiness: string;
}

const dimensionIcons = {
  technical: Cpu,
  data: Database,
  security: ShieldCheck,
  organizational: Users,
} as const;

export function MigrationReadiness({
  excelData,
  uploadSummary,
  migrationReadiness,
}: MigrationReadinessProps) {
  const { t } = useTranslation();
  const [manualState, setManualState] = usePersistedState<ManualChecklistState>(
    'readiness.checklist',
    {}
  );

  const report = useMemo(() => computeReadiness(excelData, manualState), [excelData, manualState]);

  const toggleCheck = (id: string, passed: boolean) => {
    setManualState((prev) => ({ ...prev, [id]: passed }));
  };

  if (!excelData) {
    return (
      <Card className="border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-white">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Gauge className="h-12 w-12 text-fuchsia-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('mra.emptyTitle')}</h3>
          <p className="text-sm text-gray-500">{t('mra.emptyDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  const levelBadge = levelBadgeStyles(report.level);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-fuchsia-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-fuchsia-900">{t('mra.title')}</h3>
              <p className="text-sm text-fuchsia-700 mt-1">{t('mra.description')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-fuchsia-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Gauge className="h-6 w-6 text-fuchsia-600" />
              Overall Readiness
            </span>
            <Badge className={levelBadge.className}>{readinessLevelLabel(report.level)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-2 text-center">
              <ScoreDial score={report.overallScore} color={levelBadge.dialColor} />
            </div>
            <div className="md:col-span-3 grid grid-cols-2 gap-3">
              {report.dimensions.map((d) => {
                const Icon = dimensionIcons[d.id];
                return (
                  <div
                    key={d.id}
                    className="border rounded-lg p-3 bg-white flex items-center gap-3"
                  >
                    <Icon className="h-5 w-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{d.label}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${scoreBarColor(d.score)}`}
                            style={{ width: `${d.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{d.score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {report.gaps.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              Top gaps to close ({report.gaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.gaps.slice(0, 5).map((g) => (
                <li key={g.id} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-amber-900">{g.title}</span>
                    {g.recommendation && (
                      <p className="text-amber-700 text-xs mt-0.5">{g.recommendation}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {report.dimensions.map((d) => (
          <DimensionCard key={d.id} dimension={d} onToggle={toggleCheck} />
        ))}
      </div>

      <BusinessCaseMetrics
        serverCount={excelData.servers.length}
        databaseCount={excelData.databases.length}
        applicationCount={excelData.applications.length}
        totalStorageGB={uploadSummary?.totalStorageGB || 0}
        migrationReadiness={migrationReadiness}
      />
    </div>
  );
}

function DimensionCard({
  dimension,
  onToggle,
}: {
  dimension: ReadinessDimension;
  onToggle: (id: string, value: boolean) => void;
}) {
  const Icon = dimensionIcons[dimension.id];
  const passedCount = dimension.checks.filter((c) => c.passed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gray-600" />
            {dimension.label}
          </span>
          <span className="text-sm text-gray-500 font-normal">
            {passedCount}/{dimension.checks.length} · {dimension.score}%
          </span>
        </CardTitle>
        <p className="text-xs text-gray-500">{dimension.description}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {dimension.checks.map((check) => (
            <CheckRow key={check.id} check={check} onToggle={onToggle} isAutomatic={isAutomatic(check.id)} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CheckRow({
  check,
  onToggle,
  isAutomatic,
}: {
  check: ReadinessCheck;
  onToggle: (id: string, value: boolean) => void;
  isAutomatic: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      {isAutomatic ? (
        check.passed ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        )
      ) : (
        <Checkbox
          id={check.id}
          checked={check.passed}
          onCheckedChange={(v) => onToggle(check.id, v === true)}
          className="mt-0.5"
        />
      )}
      <div className="flex-1 min-w-0">
        <label
          htmlFor={check.id}
          className={`text-sm font-medium ${isAutomatic ? '' : 'cursor-pointer'} ${
            check.passed ? 'text-gray-900' : 'text-gray-700'
          }`}
        >
          {check.title}
          {isAutomatic && (
            <Badge variant="outline" className="ml-2 text-[10px] py-0">
              auto
            </Badge>
          )}
        </label>
        <p className="text-xs text-gray-500 mt-0.5">{check.description}</p>
        {check.detail && <p className="text-xs text-gray-600 mt-1 italic">{check.detail}</p>}
        {!check.passed && check.recommendation && (
          <p className="text-xs text-amber-700 mt-1">→ {check.recommendation}</p>
        )}
      </div>
    </li>
  );
}

function isAutomatic(id: string): boolean {
  return (
    id.startsWith('tech.') &&
    id !== 'tech.architecture_review'
  ) || id === 'data.inventory';
}

function ScoreDial({ score, color }: { score: number; color: string }) {
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-36 h-36 -rotate-90">
        <circle
          className="text-gray-200"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="50"
          cx="72"
          cy="72"
        />
        <circle
          className={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="50"
          cx="72"
          cy="72"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-gray-900">{score}</div>
        <div className="text-xs text-gray-500">/ 100</div>
      </div>
    </div>
  );
}

function levelBadgeStyles(level: 'ready' | 'evaluating' | 'not_ready') {
  switch (level) {
    case 'ready':
      return {
        className: 'bg-green-100 text-green-800 hover:bg-green-100',
        dialColor: 'text-green-500',
      };
    case 'evaluating':
      return {
        className: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
        dialColor: 'text-amber-500',
      };
    case 'not_ready':
      return {
        className: 'bg-red-100 text-red-800 hover:bg-red-100',
        dialColor: 'text-red-500',
      };
  }
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 55) return 'bg-amber-500';
  return 'bg-red-500';
}
