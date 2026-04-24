import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CostBreakdown } from '@/types/assessment';
import {
  buildScenarios,
  DEFAULT_SCENARIO_CONFIG,
  TCOScenarioConfig,
  scenariosToCsv,
  downloadCsv,
} from '@/lib/tcoScenarios';
import { usePersistedState } from '@/lib/usePersistedState';
import { Calculator, Download, Sliders } from 'lucide-react';

interface TCOScenarioBuilderProps {
  estimatedCosts: CostBreakdown;
  clientName: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

const riskBadge = {
  low: 'bg-green-100 text-green-800 hover:bg-green-100',
  medium: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  high: 'bg-red-100 text-red-800 hover:bg-red-100',
};

export function TCOScenarioBuilder({ estimatedCosts, clientName }: TCOScenarioBuilderProps) {
  const [config, setConfig] = usePersistedState<TCOScenarioConfig>(
    'tco.scenarioConfig',
    DEFAULT_SCENARIO_CONFIG
  );
  const [showConfig, setShowConfig] = useState(false);

  const scenarios = useMemo(() => buildScenarios(estimatedCosts, config), [estimatedCosts, config]);
  const best = useMemo(
    () => scenarios.reduce((acc, s) => (s.savingsVsOnDemand > acc.savingsVsOnDemand ? s : acc), scenarios[0]),
    [scenarios]
  );

  const handleExport = () => {
    const csv = scenariosToCsv(scenarios);
    const safeClient = (clientName || 'client').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    downloadCsv(`tco_scenarios_${safeClient}_${new Date().toISOString().split('T')[0]}.csv`, csv);
  };

  return (
    <Card className="border-2 border-fuchsia-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-fuchsia-600" />
            Comparador de escenarios TCO
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
              <Sliders className="h-3 w-3 mr-1" />
              {showConfig ? 'Ocultar' : 'Ajustar'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showConfig && (
          <div className="mb-4 p-3 bg-fuchsia-50 border border-fuchsia-100 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="spot-discount" className="text-xs">
                Descuento Spot (%)
              </Label>
              <Input
                id="spot-discount"
                type="number"
                min={0}
                max={90}
                step={1}
                value={Math.round(config.spotDiscount * 100)}
                onChange={(e) =>
                  setConfig({ ...config, spotDiscount: Math.min(0.9, Math.max(0, Number(e.target.value) / 100)) })
                }
                className="text-sm"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Típico: 60-80% según familia de instancia.
              </p>
            </div>
            <div>
              <Label htmlFor="sp-discount" className="text-xs">
                Descuento Savings Plan (fracción del On-Demand)
              </Label>
              <Input
                id="sp-discount"
                type="number"
                min={10}
                max={100}
                step={1}
                value={Math.round(config.savingsPlanDiscount * 100)}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    savingsPlanDiscount: Math.min(1, Math.max(0.1, Number(e.target.value) / 100)),
                  })
                }
                className="text-sm"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Fracción pagada vs On-Demand. 50% = 50% de ahorro.
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="py-2 px-2">Escenario</th>
                <th className="py-2 px-2">Compromiso</th>
                <th className="py-2 px-2">Riesgo</th>
                <th className="py-2 px-2 text-right">Mensual</th>
                <th className="py-2 px-2 text-right">Anual</th>
                <th className="py-2 px-2 text-right">3 años</th>
                <th className="py-2 px-2 text-right">Ahorro 3a</th>
                <th className="py-2 px-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => {
                const isBest = s.id === best.id && s.savingsVsOnDemand > 0;
                return (
                  <tr
                    key={s.id}
                    className={`border-b ${isBest ? 'bg-green-50' : ''}`}
                  >
                    <td className="py-2 px-2">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {s.label}
                        {isBest && (
                          <Badge className="bg-green-500 text-white hover:bg-green-500 text-[10px] py-0">
                            MEJOR
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">{s.description}</div>
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-600">{s.commitment}</td>
                    <td className="py-2 px-2">
                      <Badge className={riskBadge[s.risk]}>{s.risk}</Badge>
                    </td>
                    <td className="py-2 px-2 text-right font-mono">{fmt(s.monthly)}</td>
                    <td className="py-2 px-2 text-right font-mono">{fmt(s.annual)}</td>
                    <td className="py-2 px-2 text-right font-mono font-semibold">{fmt(s.threeYear)}</td>
                    <td className="py-2 px-2 text-right font-mono text-green-700">
                      {s.savingsVsOnDemand > 0 ? fmt(s.savingsVsOnDemand) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right text-xs font-semibold text-green-700">
                      {s.savingsPercent > 0 ? `${s.savingsPercent.toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Los valores Spot y Savings Plan son estimaciones paramétricas. Ajusta los porcentajes arriba
          según negociación real con AWS.
        </p>
      </CardContent>
    </Card>
  );
}
