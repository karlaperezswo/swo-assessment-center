// Multi-cloud Landing Zone comparison view. Renders tabs per active cloud
// with that cloud's canonical landing-zone checklist. Each item shows its
// official documentation link when available. Items inherit the per-cloud
// checklist state from `cloudChecklistState` so the consultant can mark
// progress independently per cloud.

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, AlertTriangle, Trophy } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useActiveClouds } from '@/clouds/useActiveClouds';
import { brandFor } from '@/theme/cloudBrand';
import { CloudIcon } from '@/components/shared/CloudIcon';
import { LANDING_ZONE_SEEDS } from '../../../../shared/data/landingZoneSeeds';
import type { CloudProvider } from '@/types/clouds';
import { cn } from '@/lib/utils';

/**
 * Per-cloud per-item completion state stored as `${provider}.${itemId}` →
 * boolean. The parent owns this Map; this component just reads and toggles.
 */
export type CloudChecklistState = Record<string, boolean>;

interface Props {
  /** When provided, the keys are `${provider}.${itemId}`. */
  state?: CloudChecklistState;
  onToggle?: (provider: CloudProvider, itemId: string) => void;
}

export function MultiCloudLandingZone({ state, onToggle }: Props) {
  const { t } = useTranslation();
  const { state: cloudState } = useActiveClouds();
  const [activeTab, setActiveTab] = useState<CloudProvider>(cloudState.active[0]);

  // Keep activeTab valid when the user toggles clouds in the header selector.
  const validTab = cloudState.active.includes(activeTab) ? activeTab : cloudState.active[0];
  if (validTab !== activeTab) {
    setTimeout(() => setActiveTab(validTab), 0);
  }

  // Cross-cloud completion summary (% completed by cloud) shown above the tabs.
  const summary = useMemo(() => {
    return cloudState.active.map((p) => {
      const sections = LANDING_ZONE_SEEDS[p];
      const total = sections.reduce((acc, s) => acc + s.items.length, 0);
      const done = sections.reduce(
        (acc, s) =>
          acc + s.items.filter((i) => state?.[`${p}.${i.id}`]).length,
        0
      );
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { provider: p, total, done, pct };
    });
  }, [cloudState.active, state]);

  // Don't render anything when only one cloud is active — the legacy
  // LandingZone component already renders the AWS-specific checklist.
  if (cloudState.active.length <= 1) return null;

  const sections = LANDING_ZONE_SEEDS[validTab];
  const brand = brandFor(validTab);
  const winner = summary.reduce((a, b) => (a.pct > b.pct ? a : b));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-blue-600" />
          {t('landingZone.multiCloudTitle', { defaultValue: 'Landing Zone — comparativo multi-nube' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Per-cloud completion summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {summary.map((s) => {
            const b = brandFor(s.provider);
            const isWinner = s.provider === winner.provider && s.pct > 0;
            return (
              <div
                key={s.provider}
                className={cn(
                  'rounded-md p-2 border text-xs',
                  isWinner ? 'ring-2 ring-orange-400' : ''
                )}
                style={{ backgroundColor: b.bg, borderColor: b.border }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CloudIcon provider={s.provider} size={12} />
                  <span className="font-semibold" style={{ color: b.text }}>{b.shortName}</span>
                  {isWinner && <Trophy className="h-3 w-3 text-orange-500" aria-label="leading" />}
                </div>
                <div className="text-sm font-bold" style={{ color: b.text }}>
                  {s.done}/{s.total} <span className="text-xs font-normal">({s.pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>

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
                  isActive
                    ? ''
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
                style={isActive ? { borderColor: b.color, color: b.text } : undefined}
              >
                <CloudIcon provider={p} size={14} />
                {b.shortName}
              </button>
            );
          })}
        </div>

        {/* Sections for the active tab */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="border rounded-md">
              <div
                className="px-3 py-2 text-sm font-semibold border-b"
                style={{ backgroundColor: brand.bg, color: brand.text, borderColor: brand.border }}
              >
                {section.title}
              </div>
              <ul className="divide-y">
                {section.items.map((item) => {
                  const checked = !!state?.[`${validTab}.${item.id}`];
                  return (
                    <li key={item.id} className="flex items-start gap-2 px-3 py-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onToggle?.(validTab, item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-medium', checked && 'line-through text-muted-foreground')}>
                            {item.title}
                          </span>
                          {item.experimental && (
                            <span
                              title={t('landingZone.experimentalHint', {
                                defaultValue:
                                  'Catálogo en revisión — pendiente de validación por arquitecto certificado',
                              })}
                              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              borrador
                            </span>
                          )}
                          {item.docsUrl && (
                            <a
                              href={item.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              docs
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
