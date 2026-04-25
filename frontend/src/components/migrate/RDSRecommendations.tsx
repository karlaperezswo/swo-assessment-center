import { useTranslation } from '@/i18n/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseTable } from '@/components/DatabaseTable';
import { Database, DatabaseRecommendation } from '@/types/assessment';
import type { CloudProvider, CloudDatabaseRecommendation } from '@/types/clouds';
import { Database as DatabaseIcon } from 'lucide-react';
import { useActiveClouds } from '@/clouds/useActiveClouds';

interface RDSRecommendationsProps {
  databases: Database[];
  recommendations: DatabaseRecommendation[];
  /** Multi-cloud — when present, DatabaseTable renders columns dynamically per active cloud. */
  recommendationsByCloud?: Partial<Record<CloudProvider, CloudDatabaseRecommendation[]>>;
}

export function RDSRecommendations({ databases, recommendations, recommendationsByCloud }: RDSRecommendationsProps) {
  const { t } = useTranslation();
  const { state: cloudState } = useActiveClouds();
  const isMultiCloud = cloudState.active.length > 1 && !!recommendationsByCloud;

  if (!databases || databases.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <DatabaseIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">{t('rds.noDatabases')}</p>
        <p className="text-sm mt-1">{t('rds.noDatabasesDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <DatabaseIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">{t('rds.title')}</h3>
              <p className="text-sm text-amber-700 mt-1">
                {t('rds.description')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isMultiCloud
              ? t('rds.recommendationTitleMultiCloud', {
                  count: databases.length,
                  defaultValue: 'Database recommendations — {{count}} BBDD × {{clouds}} nubes',
                  clouds: cloudState.active.length,
                })
              : t('rds.recommendationTitle', { count: databases.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DatabaseTable
            databases={databases}
            recommendations={recommendations}
            recommendationsByCloud={recommendationsByCloud}
          />
        </CardContent>
      </Card>
    </div>
  );
}
