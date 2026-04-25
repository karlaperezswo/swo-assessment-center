import { Database, DatabaseRecommendation } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database as DatabaseIcon } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useActiveClouds } from '@/clouds/useActiveClouds';
import type { CloudProvider, CloudDatabaseRecommendation } from '@/types/clouds';
import { brandFor } from '@/theme/cloudBrand';
import { CloudIcon } from '@/components/shared/CloudIcon';

interface DatabaseTableProps {
  databases: Database[];
  /** @deprecated Use `recommendationsByCloud`. Kept for AWS-only callers. */
  recommendations?: DatabaseRecommendation[];
  recommendationsByCloud?: Partial<Record<CloudProvider, CloudDatabaseRecommendation[]>>;
}

export function DatabaseTable({ databases, recommendations, recommendationsByCloud }: DatabaseTableProps) {
  const { t } = useTranslation();
  const { state: cloudState } = useActiveClouds();

  const byCloud = recommendationsByCloud ?? (
    recommendations
      ? { aws: recommendations.map(liftLegacyToCloudDb) }
      : undefined
  );

  const activeWithData = byCloud
    ? cloudState.active.filter((c) => byCloud[c] && (byCloud[c] as CloudDatabaseRecommendation[]).length > 0)
    : [];
  const showRecs = activeWithData.length > 0;
  const isMultiCloud = activeWithData.length > 1;

  const getRec = (cloud: CloudProvider, dbName: string) =>
    byCloud?.[cloud]?.find((r) => r.dbName === dbName);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="h-5 w-5" />
          {t('databases.titleWithCount', { count: databases.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-md border max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 backdrop-blur sticky top-0 z-10">
              {isMultiCloud && (
                <tr className="border-b">
                  <th colSpan={4} className="p-0" aria-hidden="true" />
                  {activeWithData.map((c) => {
                    const brand = brandFor(c);
                    return (
                      <th
                        key={`group-${c}`}
                        colSpan={3}
                        className="text-center p-2 text-xs font-semibold uppercase tracking-wide border-l"
                        style={{ backgroundColor: brand.bg, color: brand.text, borderColor: brand.border }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <CloudIcon provider={c} size={12} />
                          {brand.shortName}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              )}
              <tr className="border-b">
                <th className="text-left p-2 font-medium sticky left-0 bg-muted/50 z-10">{t('databases.dbName')}</th>
                <th className="text-left p-2 font-medium">{t('databases.engine')}</th>
                <th className="text-left p-2 font-medium">{t('databases.edition')}</th>
                <th className="text-right p-2 font-medium">{t('databases.size')}</th>
                {showRecs &&
                  activeWithData.map((c) => {
                    const brand = brandFor(c);
                    const cellStyle = isMultiCloud
                      ? { backgroundColor: brand.bg, borderColor: brand.border }
                      : undefined;
                    return (
                      <>
                        <th key={`tgt-${c}`} className="text-left p-2 font-medium border-l" style={cellStyle}>
                          {isMultiCloud ? t('databases.targetServiceShort', { defaultValue: 'Service' }) : t('databases.targetService')}
                        </th>
                        <th key={`cls-${c}`} className="text-left p-2 font-medium" style={cellStyle}>
                          {isMultiCloud ? 'SKU' : t('databases.instanceClass')}
                        </th>
                        <th key={`cost-${c}`} className="text-right p-2 font-medium" style={cellStyle}>
                          {isMultiCloud ? '$/mo' : t('databases.estimatedCost')}
                        </th>
                      </>
                    );
                  })}
              </tr>
            </thead>
            <tbody>
              {databases.map((db, index) => (
                <tr key={db.databaseId || index} className="border-b hover:bg-muted/30">
                  <td className="p-2 font-medium sticky left-0 bg-background z-[1]">{db.dbName}</td>
                  <td className="p-2 text-muted-foreground">{db.engineType}</td>
                  <td className="p-2 text-muted-foreground">{db.engineEdition || '-'}</td>
                  <td className="p-2 text-right">{db.totalSize?.toFixed(0) || 0}</td>
                  {showRecs &&
                    activeWithData.map((c) => {
                      const rec = getRec(c, db.dbName);
                      const brand = brandFor(c);
                      return (
                        <>
                          <td key={`tgt-${c}-${index}`} className="p-2 border-l">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: brand.bg, color: brand.text }}
                              title={rec?.targetService ?? '-'}
                            >
                              {rec?.targetService ?? '-'}
                            </span>
                          </td>
                          <td key={`cls-${c}-${index}`} className="p-2">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                              title={rec?.recommendedSku ?? '-'}
                            >
                              {rec?.recommendedSku ?? '-'}
                            </span>
                          </td>
                          <td key={`cost-${c}-${index}`} className="p-2 text-right font-medium">
                            {rec ? `$${rec.monthlyEstimateOnDemand.toFixed(2)}` : '-'}
                          </td>
                        </>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {t('databases.scrollHint', {
            count: databases.length,
            defaultValue: '{{count}} bases de datos · scroll dentro de la tabla — los encabezados quedan fijos.',
          })}
        </p>
      </CardContent>
    </Card>
  );
}

function liftLegacyToCloudDb(r: DatabaseRecommendation): CloudDatabaseRecommendation {
  return {
    provider: 'aws',
    dbName: r.dbName,
    sourceEngine: r.sourceEngine,
    targetService: r.targetEngine,
    recommendedSku: r.instanceClass,
    storageGB: r.storageGB,
    monthlyEstimateOnDemand: r.monthlyEstimate,
    monthlyEstimateOneYear: r.monthlyEstimate * 0.64,
    monthlyEstimateThreeYear: r.monthlyEstimate * 0.40,
    licenseModel: r.licenseModel,
  };
}
