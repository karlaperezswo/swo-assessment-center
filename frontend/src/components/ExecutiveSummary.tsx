import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CostBreakdown, ExcelData, MigrationWave } from '@/types/assessment';
import {
  TrendingDown, TrendingUp, DollarSign, Zap, Shield, Target,
  ArrowDownCircle, Calendar, Server, Database, AppWindow,
  HardDrive, Network, Waves, ArrowRight, AlertTriangle,
} from 'lucide-react';

interface ExecutiveSummaryProps {
  clientName: string;
  onPremisesCost: number;
  estimatedCosts: CostBreakdown;
  totalServers: number;
  migrationReadiness: string;
  // Optional enrichment from other Assess modules
  excelData?: ExcelData | null;
  dependencyData?: any;
  migrationWaves?: MigrationWave[];
  opportunitySessionId?: string | null;
  onGoToMobilize?: () => void;
}

export function ExecutiveSummary({
  clientName,
  onPremisesCost,
  estimatedCosts,
  totalServers,
  migrationReadiness,
  excelData,
  dependencyData,
  migrationWaves,
  onGoToMobilize,
}: ExecutiveSummaryProps) {
  const awsCost = estimatedCosts.threeYearNuri.annual;
  const totalSavings = onPremisesCost - awsCost;
  const savingsPercentage = onPremisesCost > 0 ? ((totalSavings / onPremisesCost) * 100).toFixed(1) : 0;
  const roi = onPremisesCost > 0 ? (((totalSavings * 3) / onPremisesCost) * 100).toFixed(0) : 0;
  const paybackMonths = awsCost > 0 && totalSavings > 0 ? Math.round((onPremisesCost * 0.3) / (totalSavings / 12)) : 0;
  const tcoReduction = estimatedCosts.onDemand.threeYear - estimatedCosts.threeYearNuri.threeYear;

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const readinessColor = (r: string) => {
    switch (r.toLowerCase()) {
      case 'ready': return 'text-green-600 bg-green-50 border-green-200';
      case 'evaluating': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Risk: servers with EOL operating systems
  const EOL_PATTERNS = ['2003', '2008', '2012', 'rhel 6', 'centos 6', 'centos 7', 'ubuntu 14', 'ubuntu 16', 'windows xp', 'windows 7'];
  const eolServers = excelData?.servers.filter(s =>
    EOL_PATTERNS.some(p => s.osName?.toLowerCase().includes(p) || s.osVersion?.toLowerCase().includes(p))
  ) ?? [];
  const eolCount = eolServers.length;
  const eolRisk = eolCount === 0 ? null : eolCount <= 5 ? 'low' : eolCount <= 15 ? 'medium' : 'high';

  // Pricing tiers for comparison
  const pricingTiers = [
    { label: 'On-Demand', monthly: estimatedCosts.onDemand.monthly, annual: estimatedCosts.onDemand.annual, savings: 0, highlight: false, badge: null },
    { label: '1-Year NURI', monthly: estimatedCosts.oneYearNuri.monthly, annual: estimatedCosts.oneYearNuri.annual, savings: estimatedCosts.onDemand.annual - estimatedCosts.oneYearNuri.annual, highlight: false, badge: '~36% ahorro' },
    { label: '3-Year NURI', monthly: estimatedCosts.threeYearNuri.monthly, annual: estimatedCosts.threeYearNuri.annual, savings: estimatedCosts.onDemand.annual - estimatedCosts.threeYearNuri.annual, highlight: true, badge: 'MEJOR VALOR' },
  ];

  // OS distribution from excelData
  const osDistribution = excelData?.servers.reduce((acc: Record<string, number>, s) => {
    const os = s.osName?.toLowerCase().includes('windows') ? 'Windows' : s.osName?.toLowerCase().includes('linux') ? 'Linux' : 'Other';
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {});

  // Dependency summary
  const depSummary = dependencyData ? {
    totalConnections: dependencyData.dependencies?.length ?? 0,
    totalDatabases: dependencyData.databases?.length ?? 0,
    totalApps: dependencyData.appDependencies?.length ?? 0,
    topServers: (() => {
      const counts: Record<string, number> = {};
      (dependencyData.dependencies ?? []).forEach((d: any) => {
        if (d.source) counts[d.source] = (counts[d.source] || 0) + 1;
        if (d.destination) counts[d.destination] = (counts[d.destination] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    })(),
  } : null;

  // Wave summary
  const waveSummary = migrationWaves && migrationWaves.length > 0 ? {
    total: migrationWaves.length,
    totalServers: migrationWaves.reduce((s, w) => s + w.serverCount, 0),
    completed: migrationWaves.filter(w => w.status === 'completed').length,
  } : null;

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{clientName || '—'}</h1>
            <p className="text-blue-100 text-lg">Caso de Negocio de Migración a AWS</p>
          </div>
          <div className={`px-6 py-3 rounded-lg border-2 font-semibold uppercase tracking-wide text-sm ${readinessColor(migrationReadiness)}`}>
            {migrationReadiness}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <ArrowDownCircle className="h-8 w-8 text-green-300" />
              <span className="text-3xl font-bold text-green-300">{savingsPercentage}%</span>
            </div>
            <p className="text-sm text-blue-100 mb-1">Reducción de Costo Anual</p>
            <p className="text-2xl font-bold">{fmt(totalSavings)}/año</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <Target className="h-8 w-8 text-purple-300" />
              <span className="text-3xl font-bold text-purple-300">{roi}%</span>
            </div>
            <p className="text-sm text-blue-100 mb-1">ROI a 3 Años</p>
            <p className="text-2xl font-bold">{fmt(totalSavings * 3)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="h-8 w-8 text-yellow-300" />
              <span className="text-3xl font-bold text-yellow-300">{paybackMonths}</span>
            </div>
            <p className="text-sm text-blue-100 mb-1">Período de Recuperación</p>
            <p className="text-2xl font-bold">meses</p>
          </div>
        </div>
      </div>

      {/* ── Financial KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ahorro TCO 3 Años', value: fmt(tcoReduction), sub: 'vs. On-Premises', color: 'border-l-green-500', icon: <DollarSign className="h-4 w-4" />, textColor: 'text-green-600' },
          { label: 'Infraestructura', value: String(totalServers), sub: 'Servidores a migrar', color: 'border-l-blue-500', icon: <Zap className="h-4 w-4" />, textColor: 'text-blue-600' },
          { label: 'Anual On-Premises', value: fmt(onPremisesCost), sub: 'Costo actual', color: 'border-l-purple-500', icon: <Shield className="h-4 w-4" />, textColor: 'text-purple-600' },
          { label: 'AWS Anual (3A NURI)', value: fmt(awsCost), sub: 'Costo optimizado', color: 'border-l-orange-500', icon: <TrendingUp className="h-4 w-4" />, textColor: 'text-orange-600' },
        ].map((k, i) => (
          <Card key={i} className={`border-l-4 ${k.color} shadow-lg`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">{k.icon}{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${k.textColor}`}>{k.value}</div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><TrendingDown className="h-3 w-3" />{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Inventory + OS ── */}
      {excelData && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Server className="h-5 w-5 text-blue-600" />Inventario de Infraestructura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Servidores', value: excelData.servers.length, icon: <Server className="h-5 w-5 text-blue-500" /> },
                { label: 'Bases de Datos', value: excelData.databases.length, icon: <Database className="h-5 w-5 text-purple-500" /> },
                { label: 'Aplicaciones', value: excelData.applications.length, icon: <AppWindow className="h-5 w-5 text-green-500" /> },
                { label: 'Storage Total (GB)', value: excelData.servers.reduce((s, srv) => s + (srv.totalDiskSize || 0), 0).toFixed(0), icon: <HardDrive className="h-5 w-5 text-orange-500" /> },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.icon}
                  <div>
                    <div className="text-xl font-bold text-gray-800">{item.value}</div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
            {osDistribution && Object.keys(osDistribution).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Distribución de SO</p>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(osDistribution).map(([os, count]) => (
                    <span key={os} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {os}: {count} ({((count / excelData.servers.length) * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Dependency Summary ── */}
      {depSummary && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Network className="h-5 w-5 text-teal-600" />Complejidad de Dependencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Conexiones', value: depSummary.totalConnections },
                { label: 'BDs mapeadas', value: depSummary.totalDatabases },
                { label: 'Apps mapeadas', value: depSummary.totalApps },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 bg-teal-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-700">{item.value}</div>
                  <div className="text-xs text-teal-600">{item.label}</div>
                </div>
              ))}
            </div>
            {depSummary.topServers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Top servidores por dependencias</p>
                <div className="space-y-1">
                  {depSummary.topServers.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm px-3 py-1.5 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700 truncate">{name}</span>
                      <span className="text-teal-600 font-bold ml-2">{count} conexiones</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Migration Waves ── */}
      {waveSummary && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Waves className="h-5 w-5 text-amber-600" />Plan de Olas de Migración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Olas definidas', value: waveSummary.total },
                { label: 'Servidores planificados', value: waveSummary.totalServers },
                { label: 'Olas completadas', value: waveSummary.completed },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-700">{item.value}</div>
                  <div className="text-xs text-amber-600">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pricing Comparison ── */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-5 w-5 text-blue-600" />Comparativa de Precios AWS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {pricingTiers.map((tier) => (
              <div key={tier.label} className={`relative rounded-xl p-4 border-2 ${tier.highlight ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                {tier.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold ${tier.highlight ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {tier.badge}
                  </span>
                )}
                <p className="text-sm font-semibold text-gray-600 mb-3 mt-1 text-center">{tier.label}</p>
                <p className={`text-2xl font-bold text-center ${tier.highlight ? 'text-green-700' : 'text-gray-800'}`}>{fmt(tier.monthly)}<span className="text-xs font-normal text-gray-500">/mo</span></p>
                <p className="text-xs text-center text-gray-500 mt-1">{fmt(tier.annual)}/yr</p>
                {tier.savings > 0 && (
                  <p className="text-xs text-center text-green-600 font-semibold mt-2 flex items-center justify-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Ahorra {fmt(tier.savings)}/año
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Risk Indicators ── */}
      {excelData && eolRisk && (
        <Card className={`shadow-lg border-l-4 ${eolRisk === 'high' ? 'border-l-red-500' : eolRisk === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-400'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className={`h-5 w-5 ${eolRisk === 'high' ? 'text-red-500' : eolRisk === 'medium' ? 'text-yellow-500' : 'text-blue-400'}`} />
              Indicadores de Riesgo — SO Fuera de Soporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className={`text-5xl font-bold ${eolRisk === 'high' ? 'text-red-600' : eolRisk === 'medium' ? 'text-yellow-600' : 'text-blue-500'}`}>
                {eolCount}
              </div>
              <div>
                <p className="font-semibold text-gray-700">
                  {eolCount === 1 ? 'servidor con SO fuera de soporte' : 'servidores con SO fuera de soporte'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {eolRisk === 'high' ? '⚠️ Riesgo alto — requiere atención inmediata' : eolRisk === 'medium' ? '⚠️ Riesgo medio — planificar migración prioritaria' : 'ℹ️ Riesgo bajo — incluir en plan de migración'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[...new Set(eolServers.map(s => s.osName).filter(Boolean))].slice(0, 5).map(os => (
                    <span key={os} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">{os}</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Next Step ── */}
      {onGoToMobilize && (
        <div className="flex justify-end">
          <button
            onClick={onGoToMobilize}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors"
          >
            Continuar a Mobilize <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
