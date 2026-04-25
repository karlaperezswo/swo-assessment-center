import { Server, EC2Recommendation } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server as ServerIcon } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useActiveClouds } from '@/clouds/useActiveClouds';
import type { CloudProvider, ComputeRecommendation } from '@/types/clouds';
import { brandFor } from '@/theme/cloudBrand';
import { CloudIcon } from '@/components/shared/CloudIcon';

interface ServerTableProps {
  servers: Server[];
  /** @deprecated Use `recommendationsByCloud`. Kept for AWS-only callers. */
  recommendations?: EC2Recommendation[];
  /** Multi-cloud payload. Each entry is one provider's full recommendation list. */
  recommendationsByCloud?: Partial<Record<CloudProvider, ComputeRecommendation[]>>;
}

export function ServerTable({ servers, recommendations, recommendationsByCloud }: ServerTableProps) {
  const { t } = useTranslation();
  const { state: cloudState } = useActiveClouds();

  // Build the unified per-cloud map: when the caller only provided the legacy
  // `recommendations` prop, lift it into a single-provider AWS map so the
  // rendering path is the same.
  const byCloud = recommendationsByCloud ?? (
    recommendations
      ? { aws: recommendations.map((r) => liftLegacyToCompute(r)) }
      : undefined
  );

  // Active clouds that actually have data. Preserves cloudState order.
  const activeWithData = byCloud
    ? cloudState.active.filter((c) => byCloud[c] && (byCloud[c] as ComputeRecommendation[]).length > 0)
    : [];
  const showRecommendations = activeWithData.length > 0;
  const isMultiCloud = activeWithData.length > 1;

  const getRec = (cloud: CloudProvider, hostname: string): ComputeRecommendation | undefined => {
    return byCloud?.[cloud]?.find((r) => r.hostname === hostname);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerIcon className="h-5 w-5" />
          {t('servers.titleWithCount', { count: servers.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-md border max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 backdrop-blur sticky top-0 z-10">
              {isMultiCloud && (
                <tr className="border-b">
                  <th colSpan={7} className="p-0" aria-hidden="true" />
                  {activeWithData.map((c) => {
                    const brand = brandFor(c);
                    return (
                      <th
                        key={`group-${c}`}
                        colSpan={2}
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
                <th className="text-left p-2 font-medium sticky left-0 bg-muted/50 z-10">{t('servers.hostname')}</th>
                <th className="text-left p-2 font-medium">{t('servers.os')}</th>
                <th className="text-right p-2 font-medium">{t('servers.vcpus')}</th>
                <th className="text-right p-2 font-medium">{t('servers.ram')}</th>
                <th className="text-right p-2 font-medium">{t('servers.storage')}</th>
                <th className="text-right p-2 font-medium">{t('servers.avgCpu')}</th>
                <th className="text-right p-2 font-medium">{t('servers.avgRam')}</th>
                {showRecommendations &&
                  activeWithData.map((c) => {
                    const brand = brandFor(c);
                    const cellStyle = isMultiCloud
                      ? { backgroundColor: brand.bg, borderColor: brand.border }
                      : undefined;
                    return (
                      <>
                        <th
                          key={`rec-${c}`}
                          className="text-left p-2 font-medium border-l"
                          style={cellStyle}
                        >
                          {isMultiCloud ? t('servers.recommendedShort', { defaultValue: 'Rec' }) : t('servers.recommended')}
                        </th>
                        <th
                          key={`cost-${c}`}
                          className="text-right p-2 font-medium"
                          style={cellStyle}
                        >
                          {isMultiCloud ? '$/mo' : t('servers.estimatedCost')}
                        </th>
                      </>
                    );
                  })}
              </tr>
            </thead>
            <tbody>
              {servers.map((server, index) => {
                const vcpus = server.numCpus * server.numCoresPerCpu * (server.numThreadsPerCore || 1);

                return (
                  <tr key={server.serverId || index} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium sticky left-0 bg-background z-[1]">{server.hostname}</td>
                    <td className="p-2 text-muted-foreground" title={server.osName}>
                      {server.osName?.substring(0, 20)}
                      {server.osName?.length > 20 ? '…' : ''}
                    </td>
                    <td className="p-2 text-right">{vcpus}</td>
                    <td className="p-2 text-right">{server.totalRAM?.toFixed(0) || 0}</td>
                    <td className="p-2 text-right">{server.totalDiskSize?.toFixed(0) || 0}</td>
                    <td className="p-2 text-right">
                      <span className={server.avgCpuUsage > 80 ? 'text-red-500' : ''}>
                        {server.avgCpuUsage?.toFixed(1) || '-'}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={server.avgRamUsage > 80 ? 'text-red-500' : ''}>
                        {server.avgRamUsage?.toFixed(1) || '-'}
                      </span>
                    </td>
                    {showRecommendations &&
                      activeWithData.map((c) => {
                        const rec = getRec(c, server.hostname);
                        const brand = brandFor(c);
                        return (
                          <>
                            <td key={`rec-${c}-${index}`} className="p-2 border-l">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ backgroundColor: brand.bg, color: brand.text }}
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
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {t('servers.scrollHint', {
            count: servers.length,
            defaultValue: '{{count}} servers · scroll dentro de la tabla — los encabezados quedan fijos.',
          })}
        </p>
      </CardContent>
    </Card>
  );
}

// Bridges the legacy AWS-only `EC2Recommendation` shape into the multi-cloud
// `ComputeRecommendation` shape. Only used when callers haven't migrated to
// the new `recommendationsByCloud` prop yet.
function liftLegacyToCompute(r: EC2Recommendation): ComputeRecommendation {
  return {
    provider: 'aws',
    hostname: r.hostname,
    originalSpecs: r.originalSpecs,
    recommendedSku: r.recommendedInstance,
    family:
      r.instanceFamily === 't3' ? 'burstable' :
      r.instanceFamily === 'r5' ? 'memory_optimized' :
      r.instanceFamily === 'c5' ? 'compute_optimized' : 'general',
    rightsizingNote: r.rightsizingNote,
    monthlyEstimateOnDemand: r.monthlyEstimate,
    monthlyEstimateOneYear: r.monthlyEstimate * 0.64,
    monthlyEstimateThreeYear: r.monthlyEstimate * 0.40,
  };
}
