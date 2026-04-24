import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExcelData } from '@/types/assessment';
import { validateExcelData } from '@/lib/excelValidation';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, FileCheck } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface ExcelValidationPanelProps {
  excelData: ExcelData | null;
}

const iconFor = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const colorFor = {
  error: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
} as const;

const badgeStyles = {
  error: 'bg-red-100 text-red-800 hover:bg-red-100',
  warning: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  info: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
} as const;

export function ExcelValidationPanel({ excelData }: ExcelValidationPanelProps) {
  const { t } = useTranslation();
  const result = useMemo(() => validateExcelData(excelData), [excelData]);

  if (!excelData) return null;

  return (
    <Card className={result.valid ? 'border-green-200' : 'border-red-200'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {result.valid ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <FileCheck className="h-4 w-4 text-gray-500" />
            {t('excelValidation.title')}
          </span>
          <span className="flex items-center gap-2 text-xs font-normal">
            {result.issues.length === 0 ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t('excelValidation.ok')}</Badge>
            ) : (
              <>
                {countBy(result.issues, 'error') > 0 && (
                  <Badge className={badgeStyles.error}>
                    {t('excelValidation.errors', { count: countBy(result.issues, 'error') })}
                  </Badge>
                )}
                {countBy(result.issues, 'warning') > 0 && (
                  <Badge className={badgeStyles.warning}>
                    {t('excelValidation.warnings', { count: countBy(result.issues, 'warning') })}
                  </Badge>
                )}
                {countBy(result.issues, 'info') > 0 && (
                  <Badge className={badgeStyles.info}>
                    {t('excelValidation.info', { count: countBy(result.issues, 'info') })}
                  </Badge>
                )}
              </>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
          <Stat label={t('excelValidation.stats.servers')} value={result.stats.servers} />
          <Stat label={t('excelValidation.stats.databases')} value={result.stats.databases} />
          <Stat label={t('excelValidation.stats.applications')} value={result.stats.applications} />
          <Stat label={t('excelValidation.stats.dependencies')} value={result.stats.dependencies} />
        </div>
        {result.issues.length === 0 ? (
          <p className="text-sm text-green-700">{t('excelValidation.allPassed')}</p>
        ) : (
          <ul className="space-y-2">
            {result.issues.map((issue, i) => {
              const Icon = iconFor[issue.severity];
              return (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${colorFor[issue.severity]}`} />
                  <div className="flex-1">
                    <span className="text-gray-800">{issue.message}</span>
                    <span className="ml-2 text-xs text-gray-400">[{issue.code}]</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2 bg-gray-50 rounded text-center">
      <div className="text-xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function countBy<T extends { severity: string }>(items: T[], severity: string): number {
  return items.filter((i) => i.severity === severity).length;
}
