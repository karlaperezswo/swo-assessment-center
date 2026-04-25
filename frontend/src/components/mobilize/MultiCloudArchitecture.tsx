// Multi-cloud architecture comparison. Renders a canonical topology built
// from the inventory's services, with one tab per active cloud showing the
// equivalent service icons + names. Topology is computed once; only the
// iconset switches when the user changes tabs.
//
// This is a complement to the AWS-detailed `ArchitectureDiagram.tsx` SVG, not
// a replacement. The legacy detailed diagram renders below this view when
// AWS is one of the active clouds.

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useActiveClouds } from '@/clouds/useActiveClouds';
import { brandFor } from '@/theme/cloudBrand';
import { CloudIcon } from '@/components/shared/CloudIcon';
import { iconFor } from '@/diagram/iconMap';
import type { CloudProvider, GenericService } from '@/types/clouds';
import type { ExcelData } from '@/types/assessment';
import { cn } from '@/lib/utils';

interface Props {
  excelData: ExcelData;
}

interface TopologyTier {
  id: string;
  title: string;
  services: GenericService[];
}

/**
 * Derive a canonical 4-tier topology from the inventory. We only show tiers
 * that have something in the actual customer inventory — no aspirational
 * services that aren't there.
 */
function buildTopology(data: ExcelData): TopologyTier[] {
  const hasDb = data.databases.length > 0;
  const hasMultipleEnvs = new Set(data.servers.map((s) => s.environment).filter(Boolean)).size > 1;
  const hasNetworkComm = data.serverCommunications.length > 0;

  const tiers: TopologyTier[] = [
    { id: 'edge',       title: 'Edge',          services: ['cdn', 'dns', 'load_balancer'] },
    { id: 'compute',    title: 'Compute',       services: ['compute', 'cache'] },
    { id: 'data',       title: 'Data',          services: hasDb ? ['managed_db', 'object_storage', 'block_storage'] : ['object_storage', 'block_storage'] },
    { id: 'platform',   title: 'Platform',      services: ['identity', 'secrets', 'monitoring', 'queue'] },
  ];
  if (hasNetworkComm || hasMultipleEnvs) {
    tiers.push({ id: 'connectivity', title: 'Connectivity', services: ['vpn'] });
  }
  return tiers;
}

export function MultiCloudArchitecture({ excelData }: Props) {
  const { t } = useTranslation();
  const { state: cloudState } = useActiveClouds();
  const [activeTab, setActiveTab] = useState<CloudProvider>(cloudState.active[0]);

  const validTab = cloudState.active.includes(activeTab) ? activeTab : cloudState.active[0];
  if (validTab !== activeTab) {
    setTimeout(() => setActiveTab(validTab), 0);
  }

  const tiers = useMemo(() => buildTopology(excelData), [excelData]);

  if (cloudState.active.length <= 1) return null;

  const brand = brandFor(validTab);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-600" />
          {t('architectureDiagram.multiCloudTitle', { defaultValue: 'Arquitectura objetivo — comparativo multi-nube' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabs per cloud */}
        <div className="flex gap-1 border-b mb-3">
          {cloudState.active.map((p) => {
            const b = brandFor(p);
            const isActive = p === validTab;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActiveTab(p)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition',
                  isActive ? '' : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
                style={isActive ? { borderColor: b.color, color: b.text } : undefined}
              >
                <CloudIcon provider={p} size={14} />
                {b.shortName}
              </button>
            );
          })}
        </div>

        {/* Topology rendered as horizontal bands of service tiles */}
        <div className="space-y-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="rounded-md border p-3"
              style={{ borderColor: brand.border, backgroundColor: brand.bg }}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: brand.text }}>
                {tier.title}
              </h4>
              <div className="flex flex-wrap gap-2">
                {tier.services.map((svc) => {
                  const icon = iconFor(svc, validTab);
                  return (
                    <div
                      key={svc}
                      className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-md border px-3 py-2 shadow-sm"
                      style={{ borderColor: brand.border }}
                    >
                      <img src={icon.path} alt={icon.label} width={28} height={28} />
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs text-muted-foreground">{svc.replace('_', ' ')}</span>
                        <span className="text-sm font-medium" style={{ color: brand.text }}>{icon.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          {t('architectureDiagram.multiCloudHint', {
            defaultValue:
              'Mismo layout topológico, distinto iconset y nombres canónicos por nube. Útil para mostrar al cliente cómo se vería su arquitectura en cada proveedor.',
          })}
        </p>
      </CardContent>
    </Card>
  );
}
