import { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon, BarChart3, Info, Target, Server as ServerIcon } from 'lucide-react';
import { Server } from '@/types/assessment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SevenRsChartProps {
  serverCount: number;
  servers?: Server[];
}

type MigrationStrategy = 'Rehost' | 'Replatform' | 'Refactor' | 'Repurchase' | 'Relocate' | 'Retain' | 'Retire';

interface ServerWithStrategy extends Server {
  migrationStrategy: MigrationStrategy;
}

// Enhanced colors with better contrast for C-level presentations
const COLORS_MAP = {
  Rehost: '#3b82f6',      // Blue - Most common
  Replatform: '#8b5cf6',  // Purple - Optimize
  Refactor: '#ec4899',    // Pink - Transform
  Repurchase: '#f59e0b',  // Amber - Replace
  Relocate: '#10b981',    // Green - VMware
  Retain: '#6b7280',      // Gray - Keep
  Retire: '#ef4444',      // Red - Decommission
};

const STRATEGY_DESCRIPTIONS = {
  Rehost: 'Lift & Shift to AWS with minimal changes',
  Replatform: 'Lift & Optimize with managed services',
  Refactor: 'Re-architect for cloud-native benefits',
  Repurchase: 'Replace with SaaS alternatives',
  Relocate: 'Move to VMware Cloud on AWS',
  Retain: 'Keep on-premises for now',
  Retire: 'Decommission unused applications',
};

// Function to assign migration strategy to a server based on its characteristics
function assignMigrationStrategy(server: Server): MigrationStrategy {
  const cpuUsage = server.avgCpuUsage || 0;
  const ramUsage = server.avgRamUsage || 0;
  const osName = server.osName?.toLowerCase() || '';
  const sqlEdition = server.sqlEdition?.toLowerCase() || '';

  // Helper to check if it's a real database server
  const isRealDatabase = sqlEdition &&
    sqlEdition !== 'not applicable' &&
    sqlEdition !== 'n/a' &&
    sqlEdition !== 'none' &&
    (sqlEdition.includes('sql server') ||
     sqlEdition.includes('oracle') ||
     sqlEdition.includes('mysql') ||
     sqlEdition.includes('postgres') ||
     sqlEdition.includes('standard') ||
     sqlEdition.includes('enterprise'));

  // Retire: Very low usage or very old systems
  if (cpuUsage < 5 && ramUsage < 10 && server.uptime < 30) {
    return 'Retire';
  }

  // Retain: High resource usage, specific requirements, or mainframe
  if (cpuUsage > 85 || ramUsage > 90 || osName.includes('mainframe')) {
    return 'Retain';
  }

  // Relocate: VMware systems
  if (osName.includes('vmware') || server.vmFunctionality?.toLowerCase().includes('vmware')) {
    return 'Relocate';
  }

  // Refactor: High usage, modern OS, good candidates for modernization
  if ((cpuUsage > 60 || ramUsage > 70) && (osName.includes('linux') || osName.includes('ubuntu') || osName.includes('red hat'))) {
    return 'Refactor';
  }

  // Repurchase: Database servers with Standard edition (good candidates for managed DB)
  if (isRealDatabase && sqlEdition.includes('standard')) {
    return 'Repurchase';
  }

  // Replatform: Database servers with Enterprise edition or moderate CPU usage
  if (isRealDatabase || (cpuUsage > 30 && cpuUsage <= 60)) {
    return 'Replatform';
  }

  // Rehost: Default strategy for most servers (Lift & Shift)
  return 'Rehost';
}

export function SevenRsChart({ serverCount, servers = [] }: SevenRsChartProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<MigrationStrategy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Assign strategies to servers
  const serversWithStrategy = useMemo<ServerWithStrategy[]>(() => {
    if (servers.length === 0) return [];
    return servers.map(server => ({
      ...server,
      migrationStrategy: assignMigrationStrategy(server)
    }));
  }, [servers]);

  // Generate 7Rs distribution
  const data = useMemo(() => {
    if (serversWithStrategy.length > 0) {
      // Count servers by strategy
      const strategyCounts: Record<MigrationStrategy, number> = {
        Rehost: 0,
        Replatform: 0,
        Refactor: 0,
        Repurchase: 0,
        Relocate: 0,
        Retain: 0,
        Retire: 0,
      };

      serversWithStrategy.forEach(server => {
        strategyCounts[server.migrationStrategy]++;
      });

      return Object.entries(strategyCounts)
        .map(([name, value]) => ({
          name: name as MigrationStrategy,
          value,
          description: STRATEGY_DESCRIPTIONS[name as MigrationStrategy]
        }))
        .filter(item => item.value > 0);
    } else {
      // Fallback to percentage-based distribution
      return [
        { name: 'Rehost' as MigrationStrategy, value: Math.round(serverCount * 0.55), description: STRATEGY_DESCRIPTIONS.Rehost },
        { name: 'Replatform' as MigrationStrategy, value: Math.round(serverCount * 0.20), description: STRATEGY_DESCRIPTIONS.Replatform },
        { name: 'Refactor' as MigrationStrategy, value: Math.round(serverCount * 0.10), description: STRATEGY_DESCRIPTIONS.Refactor },
        { name: 'Repurchase' as MigrationStrategy, value: Math.round(serverCount * 0.05), description: STRATEGY_DESCRIPTIONS.Repurchase },
        { name: 'Relocate' as MigrationStrategy, value: Math.round(serverCount * 0.03), description: STRATEGY_DESCRIPTIONS.Relocate },
        { name: 'Retain' as MigrationStrategy, value: Math.round(serverCount * 0.04), description: STRATEGY_DESCRIPTIONS.Retain },
        { name: 'Retire' as MigrationStrategy, value: Math.round(serverCount * 0.03), description: STRATEGY_DESCRIPTIONS.Retire },
      ].filter(item => item.value > 0);
    }
  }, [serversWithStrategy, serverCount]);

  // Radar chart data for migration readiness metrics
  const radarData = useMemo(() => {
    if (serversWithStrategy.length === 0) {
      return [
        { metric: 'Cloud Ready', value: 75 },
        { metric: 'Modernization', value: 45 },
        { metric: 'Cost Optimization', value: 60 },
        { metric: 'Performance', value: 70 },
        { metric: 'Security', value: 65 },
      ];
    }

    // Calculate metrics from actual server data
    const totalServers = serversWithStrategy.length;
    const cloudReady = ((data.find(d => d.name === 'Rehost')?.value || 0) + (data.find(d => d.name === 'Replatform')?.value || 0)) / totalServers * 100;
    const modernization = ((data.find(d => d.name === 'Refactor')?.value || 0) + (data.find(d => d.name === 'Repurchase')?.value || 0)) / totalServers * 100;
    const costOptimization = ((data.find(d => d.name === 'Retire')?.value || 0) + (data.find(d => d.name === 'Replatform')?.value || 0)) / totalServers * 100;

    // Calculate performance score based on average CPU/RAM usage
    const avgCpuUsage = serversWithStrategy.reduce((sum, s) => sum + s.avgCpuUsage, 0) / totalServers;
    const performance = Math.max(0, 100 - avgCpuUsage);

    // Calculate security score (servers with recent OS)
    const modernOS = serversWithStrategy.filter(s => {
      const os = s.osName.toLowerCase();
      return os.includes('2019') || os.includes('2022') || os.includes('ubuntu 20') || os.includes('ubuntu 22');
    }).length;
    const security = (modernOS / totalServers) * 100;

    return [
      { metric: 'Cloud Ready', value: Math.round(cloudReady) },
      { metric: 'Modernization', value: Math.round(modernization) },
      { metric: 'Cost Optimization', value: Math.round(costOptimization) },
      { metric: 'Performance', value: Math.round(performance) },
      { metric: 'Security', value: Math.round(security) },
    ];
  }, [serversWithStrategy, data]);

  const handleStrategyClick = (strategyName: MigrationStrategy) => {
    if (servers.length > 0) {
      setSelectedStrategy(strategyName);
      setIsModalOpen(true);
    }
  };

  const filteredServers = useMemo(() => {
    if (!selectedStrategy || serversWithStrategy.length === 0) return [];
    return serversWithStrategy.filter(s => s.migrationStrategy === selectedStrategy);
  }, [selectedStrategy, serversWithStrategy]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / serverCount) * 100).toFixed(1);
      return (
        <div className="bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 max-w-xs">
          <p className="font-bold text-lg text-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600 mb-2">{data.description}</p>
          <div className="border-t pt-2">
            <p className="text-lg font-bold" style={{ color: COLORS_MAP[data.name as keyof typeof COLORS_MAP] }}>
              {data.value} servers
            </p>
            <p className="text-sm text-gray-500">{percentage}% of total</p>
          </div>
          {servers.length > 0 && (
            <p className="text-xs text-blue-600 mt-2">Click para ver detalles →</p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide labels for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <PieChartIcon className="h-6 w-6 text-blue-600" />
            7Rs Migration Strategy Distribution
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              AWS 7Rs framework provides a strategic approach to cloud migration, helping organizations
              choose the right strategy for each application based on business goals and technical requirements.
              {servers.length > 0 && <strong> Haz click en cualquier sección para ver los servidores detallados.</strong>}
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                    onClick={(data) => handleStrategyClick(data.name)}
                    style={{ cursor: servers.length > 0 ? 'pointer' : 'default' }}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={COLORS_MAP[entry.name as keyof typeof COLORS_MAP]}
                        stroke="white"
                        strokeWidth={2}
                        className={servers.length > 0 ? 'hover:opacity-80 transition-opacity' : ''}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with Stats */}
            <div className="space-y-3">
              {data.map((item) => {
                const percentage = ((item.value / serverCount) * 100).toFixed(1);
                const color = COLORS_MAP[item.name as keyof typeof COLORS_MAP];
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 transition-all bg-white ${
                      servers.length > 0 ? 'hover:shadow-md hover:border-blue-300 cursor-pointer' : ''
                    }`}
                    onClick={() => handleStrategyClick(item.name)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-6 h-6 rounded-md flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color }}>
                        {item.value}
                      </p>
                      <p className="text-xs text-gray-500">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Server Distribution by Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Number of Servers', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={80}
                  animationBegin={0}
                  animationDuration={800}
                  onClick={(data) => handleStrategyClick(data.name)}
                  style={{ cursor: servers.length > 0 ? 'pointer' : 'default' }}
                >
                  {data.map((entry) => (
                    <Cell
                      key={`bar-${entry.name}`}
                      fill={COLORS_MAP[entry.name as keyof typeof COLORS_MAP]}
                      className={servers.length > 0 ? 'hover:opacity-80 transition-opacity' : ''}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart - Migration Readiness */}
      <Card className="border-2 border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Migration Readiness Assessment
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Evaluación multidimensional de la preparación para la migración basada en las características de los servidores
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                />
                <Radar
                  name="Readiness Score"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                  animationBegin={0}
                  animationDuration={800}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border-2 border-purple-200 rounded-lg shadow-xl p-3">
                          <p className="font-bold text-gray-900">{payload[0].payload.metric}</p>
                          <p className="text-lg font-bold text-purple-600">{payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Recommendations */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Strategic Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">Quick Wins</p>
              <p className="text-3xl font-bold text-blue-600">{data.find(d => d.name === 'Rehost')?.value || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Rehost servers for immediate migration</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">Optimization Potential</p>
              <p className="text-3xl font-bold text-purple-600">
                {(data.find(d => d.name === 'Replatform')?.value || 0) +
                  (data.find(d => d.name === 'Refactor')?.value || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Modernization candidates</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">Cost Reduction</p>
              <p className="text-3xl font-bold text-red-600">{data.find(d => d.name === 'Retire')?.value || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Decommission to reduce costs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <ServerIcon className="h-6 w-6" style={{ color: selectedStrategy ? COLORS_MAP[selectedStrategy] : undefined }} />
              {selectedStrategy} - Servidores Detallados
            </DialogTitle>
            <DialogDescription>
              {filteredServers.length} servidores asignados a la estrategia {selectedStrategy}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Hostname</th>
                    <th className="px-4 py-3 text-left font-semibold">IP Address</th>
                    <th className="px-4 py-3 text-left font-semibold">OS</th>
                    <th className="px-4 py-3 text-right font-semibold">CPUs</th>
                    <th className="px-4 py-3 text-right font-semibold">RAM (GB)</th>
                    <th className="px-4 py-3 text-right font-semibold">Storage (GB)</th>
                    <th className="px-4 py-3 text-right font-semibold">CPU Avg %</th>
                    <th className="px-4 py-3 text-right font-semibold">RAM Avg %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServers.map((server, idx) => (
                    <tr key={server.serverId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-medium">{server.hostname}</td>
                      <td className="px-4 py-3 text-gray-600">{server.ipAddress || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{server.osName}</td>
                      <td className="px-4 py-3 text-right">{server.numCpus * server.numCoresPerCpu}</td>
                      <td className="px-4 py-3 text-right">{server.totalRAM.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">{server.totalDiskSize.toFixed(0)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${server.avgCpuUsage > 70 ? 'text-red-600' : server.avgCpuUsage > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {server.avgCpuUsage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${server.avgRamUsage > 80 ? 'text-red-600' : server.avgRamUsage > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {server.avgRamUsage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
