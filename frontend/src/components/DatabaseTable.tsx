import { Database, DatabaseRecommendation } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database as DatabaseIcon } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface DatabaseTableProps {
  databases: Database[];
  recommendations?: DatabaseRecommendation[];
}

export function DatabaseTable({ databases, recommendations }: DatabaseTableProps) {
  const { t } = useTranslation();

  const getRecommendation = (dbName: string) => {
    return recommendations?.find(r => r.dbName === dbName);
  };

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
            <thead className="bg-muted/50 backdrop-blur">
              <tr className="border-b">
                <th className="text-left p-2 font-medium">{t('databases.dbName')}</th>
                <th className="text-left p-2 font-medium">{t('databases.engine')}</th>
                <th className="text-left p-2 font-medium">{t('databases.edition')}</th>
                <th className="text-right p-2 font-medium">{t('databases.size')}</th>
                {recommendations && (
                  <>
                    <th className="text-left p-2 font-medium">{t('databases.targetService')}</th>
                    <th className="text-left p-2 font-medium">{t('databases.instanceClass')}</th>
                    <th className="text-right p-2 font-medium">{t('databases.estimatedCost')}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {databases.map((db, index) => {
                const rec = getRecommendation(db.dbName);

                return (
                  <tr key={db.databaseId || index} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{db.dbName}</td>
                    <td className="p-2 text-muted-foreground">{db.engineType}</td>
                    <td className="p-2 text-muted-foreground">{db.engineEdition || '-'}</td>
                    <td className="p-2 text-right">{db.totalSize?.toFixed(0) || 0}</td>
                    {recommendations && (
                      <>
                        <td className="p-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {rec?.targetEngine || '-'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {rec?.instanceClass || '-'}
                          </span>
                        </td>
                        <td className="p-2 text-right font-medium">
                          ${rec?.monthlyEstimate?.toFixed(2) || '-'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
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
