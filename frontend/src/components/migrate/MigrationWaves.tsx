import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MigrationPlanner } from '@/components/MigrationPlanner';

import { MigrationWave } from '@/types/assessment';
import { Waves, Plus, Trash2, Play, Pause, CheckCircle, AlertCircle, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MigrationWavesProps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // totalServers and totalApplications are available for future use
  waves: MigrationWave[];
  onWavesChange: (waves: MigrationWave[]) => void;
  dependencyData?: any;
  // totalServers: number;
  // totalApplications: number;
}

const statusConfig = {
  planned: { icon: Pause, color: '#eab308', label: 'Planned', bg: 'bg-yellow-50 border-yellow-200' },
  in_progress: { icon: Play, color: '#3b82f6', label: 'In Progress', bg: 'bg-blue-50 border-blue-200' },
  completed: { icon: CheckCircle, color: '#22c55e', label: 'Completed', bg: 'bg-green-50 border-green-200' },
  blocked: { icon: AlertCircle, color: '#ef4444', label: 'Blocked', bg: 'bg-red-50 border-red-200' },
};

export function MigrationWaves({ waves, onWavesChange, dependencyData }: MigrationWavesProps) {
  const [showForm, setShowForm] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [newWave, setNewWave] = useState({
    name: '',
    startDate: '',
    endDate: '',
    serverCount: 0,
    applicationCount: 0,
    strategy: 'Rehost',
  });

  const handleAdd = () => {
    if (!newWave.name || !newWave.startDate || !newWave.endDate) return;

    const wave: MigrationWave = {
      id: `wave-${Date.now()}`,
      waveNumber: waves.length + 1,
      name: newWave.name,
      startDate: newWave.startDate,
      endDate: newWave.endDate,
      serverCount: newWave.serverCount,
      applicationCount: newWave.applicationCount,
      status: 'planned',
      strategy: newWave.strategy,
      notes: '',
    };

    onWavesChange([...waves, wave]);
    setNewWave({ name: '', startDate: '', endDate: '', serverCount: 0, applicationCount: 0, strategy: 'Rehost' });
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    onWavesChange(waves.filter(w => w.id !== id).map((w, i) => ({ ...w, waveNumber: i + 1 })));
  };

  const handleStatusChange = (id: string) => {
    onWavesChange(waves.map(w => {
      if (w.id !== id) return w;
      const statuses: MigrationWave['status'][] = ['planned', 'in_progress', 'completed', 'blocked'];
      const currentIdx = statuses.indexOf(w.status);
      const nextIdx = (currentIdx + 1) % statuses.length;
      return { ...w, status: statuses[nextIdx] };
    }));
  };

  const chartData = waves.map(w => ({
    name: `Wave ${w.waveNumber}`,
    servers: w.serverCount,
    apps: w.applicationCount,
    fill: statusConfig[w.status].color,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Waves className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Migration Waves Planning</h3>
              <p className="text-sm text-amber-700 mt-1">
                Organize your migration into manageable waves based on dependencies, business priority, and technical complexity.
                Track wave status and progress throughout the migration journey.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => setShowForm(!showForm)} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
          <Plus className="h-4 w-4 mr-1" /> {showForm ? 'Cancel' : 'Add Wave'}
        </Button>
        <Button 
          onClick={() => setShowPlanner(true)} 
          className="bg-gradient-to-r from-[#2563eb] to-[#1e3a8a] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Network className="h-4 w-4 mr-2" />
          Migration Planner
        </Button>
      </div>

      {/* Add Wave Form */}
      {showForm && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm text-amber-700">Create New Migration Wave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Wave Name</label>
                <Input
                  value={newWave.name}
                  onChange={(e) => setNewWave({ ...newWave, name: e.target.value })}
                  placeholder="e.g., Dev/Test Workloads"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Strategy</label>
                <select
                  value={newWave.strategy}
                  onChange={(e) => setNewWave({ ...newWave, strategy: e.target.value })}
                  className="w-full text-sm border rounded-md px-3 py-2"
                >
                  <option>Rehost</option>
                  <option>Replatform</option>
                  <option>Refactor</option>
                  <option>Repurchase</option>
                  <option>Relocate</option>
                  <option>Retain</option>
                  <option>Retire</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={newWave.startDate}
                  onChange={(e) => setNewWave({ ...newWave, startDate: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={newWave.endDate}
                  onChange={(e) => setNewWave({ ...newWave, endDate: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Server Count</label>
                <Input
                  type="number"
                  value={newWave.serverCount}
                  onChange={(e) => setNewWave({ ...newWave, serverCount: parseInt(e.target.value) || 0 })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Application Count</label>
                <Input
                  type="number"
                  value={newWave.applicationCount}
                  onChange={(e) => setNewWave({ ...newWave, applicationCount: parseInt(e.target.value) || 0 })}
                  className="text-sm"
                />
              </div>
            </div>
            <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700">Create Wave</Button>
          </CardContent>
        </Card>
      )}

      {/* Wave List */}
      <div className="space-y-4">
        {waves.length === 0 && (
          <p className="text-center text-gray-400 py-8">No migration waves defined yet. Click "Add Wave" to create one.</p>
        )}

        {waves.map((wave) => {
          const config = statusConfig[wave.status];
          const StatusIcon = config.icon;
          return (
            <Card key={wave.id} className={cn('border', config.bg)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button onClick={() => handleStatusChange(wave.id)} className="mt-0.5">
                      <StatusIcon className="h-5 w-5" style={{ color: config.color }} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">WAVE {wave.waveNumber}</span>
                        <h4 className="font-semibold text-gray-900">{wave.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: config.color + '20', color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Strategy: {wave.strategy} | {wave.serverCount} servers, {wave.applicationCount} apps | {wave.startDate} → {wave.endDate}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(wave.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      {waves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wave Capacity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="servers" name="Servers">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
                <Bar dataKey="apps" name="Applications">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Migration Planner Modal */}
      {showPlanner && (
        <MigrationPlanner
          dependencies={dependencyData?.dependencies || []}
          existingWaves={waves}
          onClose={() => setShowPlanner(false)}
        />
      )}
    </div>
  );
}
