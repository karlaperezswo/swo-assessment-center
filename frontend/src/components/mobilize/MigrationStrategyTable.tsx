import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OSMigrationStrategy, MigrationStrategySummary } from '@/types/assessment';
import { Target, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface MigrationStrategyTableProps {
  migrationStrategies: OSMigrationStrategy[];
  migrationSummary: MigrationStrategySummary;
}

/** Strip trailing build numbers: "Windows Server 2019 Standard 10.0.17763" → "Windows Server 2019 Standard" */
function normalizeOS(osVersion: string): string {
  return osVersion.replace(/\s+\d+\.\d+[\.\d\-\w]*$/, '').trim();
}

/** Semaphore priority: Replatform/Refactor = red (2), others = yellow (1), Rehost/Relocate = green (0) */
function strategyPriority(strategy: string): number {
  if (strategy === 'Replatform' || strategy === 'Refactor') return 2;
  if (strategy === 'Rehost' || strategy === 'Relocate') return 0;
  return 1;
}

/** Row left-border semaphore color */
function getRowStyle(strategy: string): string {
  const p = strategyPriority(strategy);
  if (p === 2) return 'bg-red-50 border-l-4 border-red-500';
  if (p === 1) return 'bg-yellow-50 border-l-4 border-yellow-400';
  return 'border-l-4 border-green-400';
}

export function MigrationStrategyTable({ migrationStrategies, migrationSummary }: MigrationStrategyTableProps) {
  // Group by normalized OS, merge counts, keep highest-priority strategy
  const grouped = new Map<string, OSMigrationStrategy>();
  for (const item of migrationStrategies) {
    const key = normalizeOS(item.osVersion);
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...item, osVersion: key });
    } else {
      const merged: OSMigrationStrategy = { ...existing, count: existing.count + item.count };
      if (strategyPriority(item.strategy) > strategyPriority(existing.strategy)) {
        merged.strategy = item.strategy;
        merged.category = item.category;
        merged.supported = item.supported;
        merged.notes = item.notes;
      }
      grouped.set(key, merged);
    }
  }

  // Sort: red first, then yellow, then green; within same priority by count desc
  const rows = Array.from(grouped.values()).sort((a, b) => {
    const pd = strategyPriority(b.strategy) - strategyPriority(a.strategy);
    return pd !== 0 ? pd : b.count - a.count;
  });

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Migrate':   return 'text-green-700 bg-green-100';
      case 'Purchase':  return 'text-orange-700 bg-orange-100';
      case 'Modernize': return 'text-blue-700 bg-blue-100';
      default:          return 'text-gray-700 bg-gray-100';
    }
  };

  const getStrategyBadge = (strategy: string): string => {
    const p = strategyPriority(strategy);
    if (p === 2) return 'text-red-700 bg-red-100 border-red-300';
    if (p === 1) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    return 'text-green-700 bg-green-100 border-green-300';
  };

  const getSupportIcon = (supported: boolean) =>
    supported
      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
      : <XCircle className="h-4 w-4 text-red-600" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Estrategia de Migración por Sistema Operativo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm font-medium text-green-800">Migrate</p>
                <p className="text-2xl font-bold text-green-600">{migrationSummary.byCategory.migrate}</p>
                <p className="text-xs text-green-700 mt-1">
                  Rehost: {migrationSummary.byStrategy.rehost} | Replatform: {migrationSummary.byStrategy.replatform}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm font-medium text-orange-800">Purchase</p>
                <p className="text-2xl font-bold text-orange-600">{migrationSummary.byCategory.purchase}</p>
                <p className="text-xs text-orange-700 mt-1">
                  Retire: {migrationSummary.byStrategy.retire} | Retain: {migrationSummary.byStrategy.retain} | Repurchase: {migrationSummary.byStrategy.repurchase}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-800">Total Servidores</p>
                <p className="text-2xl font-bold text-blue-600">{migrationSummary.totalServers}</p>
                <p className="text-xs text-blue-700 mt-1">Clasificados por OS</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Semaphore legend */}
        <div className="flex gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Replatform / Refactor — requiere atención</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Retire / Retain / Repurchase</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Rehost / Relocate</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Sistema Operativo</TableHead>
                <TableHead className="text-center font-bold">Cantidad</TableHead>
                <TableHead className="text-center font-bold">Soportado</TableHead>
                <TableHead className="text-center font-bold">Categoría</TableHead>
                <TableHead className="text-center font-bold">Estrategia</TableHead>
                <TableHead className="font-bold">Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item, index) => (
                <TableRow key={index} className={getRowStyle(item.strategy)}>
                  <TableCell className="font-medium">{item.osVersion}</TableCell>
                  <TableCell className="text-center font-semibold">{item.count}</TableCell>
                  <TableCell className="text-center">{getSupportIcon(item.supported)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded border text-xs font-semibold ${getStrategyBadge(item.strategy)}`}>
                      {item.strategy}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{item.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-semibold">Categorías de Migración:</p>
              <ul className="space-y-1 ml-4">
                <li>• <span className="font-semibold">Purchase:</span> Optimice las condiciones comerciales (Repurchase, Retire, Retain)</li>
                <li>• <span className="font-semibold">Migrate:</span> Migre las aplicaciones a la nube (Rehost, Relocate, Replatform)</li>
                <li>• <span className="font-semibold">Modernize:</span> Modernice y cree aplicaciones (Refactor)</li>
              </ul>
              <p className="mt-3 text-xs text-gray-600">
                Clasificación basada en AWS Application Migration Service —{' '}
                <a
                  href="https://docs.aws.amazon.com/mgn/latest/ug/Supported-Operating-Systems.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Ver documentación oficial
                </a>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
