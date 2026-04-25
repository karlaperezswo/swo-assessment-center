import { useTranslation } from '@/i18n/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerTable } from '@/components/ServerTable';
import { Server, EC2Recommendation } from '@/types/assessment';
import type { CloudProvider, ComputeRecommendation } from '@/types/clouds';
import { Server as ServerIcon } from 'lucide-react';
import { useActiveClouds } from '@/clouds/useActiveClouds';

interface EC2RecommendationsProps {
  servers: Server[];
  recommendations: EC2Recommendation[];
  /** Multi-cloud — when present, ServerTable renders columns dynamically per active cloud. */
  recommendationsByCloud?: Partial<Record<CloudProvider, ComputeRecommendation[]>>;
}

export function EC2Recommendations({ servers, recommendations, recommendationsByCloud }: EC2RecommendationsProps) {
  const { t } = useTranslation();
  const { state: cloudState } = useActiveClouds();
  const isMultiCloud = cloudState.active.length > 1 && !!recommendationsByCloud;

  if (!servers || servers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ServerIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">{t('ec2.noServers')}</p>
        <p className="text-sm mt-1">{t('ec2.noServersDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ServerIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">{t('ec2.title')}</h3>
              <p className="text-sm text-amber-700 mt-1">
                {t('ec2.description')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isMultiCloud
              ? t('ec2.recommendationTitleMultiCloud', {
                  count: servers.length,
                  defaultValue: 'Compute recommendations — {{count}} servidores × {{clouds}} nubes',
                  clouds: cloudState.active.length,
                })
              : t('ec2.recommendationTitle', { count: servers.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServerTable
            servers={servers}
            recommendations={recommendations}
            recommendationsByCloud={recommendationsByCloud}
          />
        </CardContent>
      </Card>
    </div>
  );
}
