import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, RefreshCw } from 'lucide-react';
import { MigrationWave } from '@/types/assessment';

interface Server {
  ServerName: string;
  Criticidad: 'Baja' | 'Media' | 'Alta';
  Ola: string;
  Dependencia?: string;
}

interface WavePlannerToolProps {
  servers: Server[];
  onClose: () => void;
  onWavesUpdate?: (waves: MigrationWave[]) => void;
}

export function WavePlannerTool({ servers: initialServers, onClose, onWavesUpdate }: WavePlannerToolProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedWave, setSelectedWave] = useState<string>('Ola 1');
  const [waves, setWaves] = useState<string[]>([]);

  // Inicializar datos
  useEffect(() => {
    if (initialServers && initialServers.length > 0) {
      // Si ya tienen olas asignadas, usar esas
      setServers(initialServers);
      const uniqueWaves = [...new Set(initialServers.map(s => s.Ola))].sort();
      setWaves(uniqueWaves);
      if (uniqueWaves.length > 0) {
        setSelectedWave(uniqueWaves[0]);
      }
    } else {
      // Clasificación automática inicial
      autoAssignWaves();
    }
  }, [initialServers]);

  const getCriticidadScore = (criticidad: string): number => {
    const mapping: Record<string, number> = { 'Baja': 1, 'Media': 2, 'Alta': 3 };
    return mapping[criticidad] || 1;
  };

  const autoAssignWaves = () => {
    // Ordenar por criticidad (menos crítico a más crítico)
    const sorted = [...initialServers].sort((a, b) => 
      getCriticidadScore(a.Criticidad) - getCriticidadScore(b.Criticidad)
    );

    // Asignación automática basada en criticidad
    const assigned = sorted.map(server => ({
      ...server,
      Ola: server.Criticidad === 'Baja' ? 'Ola 1' : 
           server.Criticidad === 'Media' ? 'Ola 2' : 'Ola 3'
    }));

    setServers(assigned);
    setWaves(['Ola 1', 'Ola 2', 'Ola 3']);
    setSelectedWave('Ola 1');
  };

  const handleWaveChange = (serverName: string, newWave: string) => {
    setServers(prev => prev.map(s => 
      s.ServerName === serverName ? { ...s, Ola: newWave } : s
    ));
  };

  const getWaveStats = () => {
    const stats: Record<string, { total: number; criticidad: Record<string, number> }> = {};
    
    servers.forEach(server => {
      if (!stats[server.Ola]) {
        stats[server.Ola] = { total: 0, criticidad: { Baja: 0, Media: 0, Alta: 0 } };
      }
      stats[server.Ola].total++;
      stats[server.Ola].criticidad[server.Criticidad]++;
    });

    return stats;
  };

  const exportToCSV = () => {
    const headers = ['ServerName', 'Criticidad', 'Ola', 'Dependencia'];
    const rows = servers.map(s => [
      s.ServerName,
      s.Criticidad,
      s.Ola,
      s.Dependencia || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map_wave_plan.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCriticalityColor = (criticidad: string) => {
    switch (criticidad) {
      case 'Baja': return 'bg-green-100 text-green-800 border-green-300';
      case 'Media': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Alta': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const waveServers = servers.filter(s => s.Ola === selectedWave);
  const stats = getWaveStats();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">🚀 AWS MAP Wave Planner</h2>
            <p className="text-blue-100 text-sm mt-1">
              Planificador interactivo de olas de migración con ajuste dinámico
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Inventory */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">🛠️ Inventario y Ajuste de Olas</CardTitle>
                    <Button 
                      onClick={autoAssignWaves} 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Auto-asignar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {servers.map((server, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{server.ServerName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getCriticalityColor(server.Criticidad)}`}>
                              {server.Criticidad}
                            </span>
                            {server.Dependencia && (
                              <span className="text-xs text-gray-500 truncate">
                                → {server.Dependencia}
                              </span>
                            )}
                          </div>
                        </div>
                        <select
                          value={server.Ola}
                          onChange={(e) => handleWaveChange(server.ServerName, e.target.value)}
                          className="text-sm border rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {waves.map(wave => (
                            <option key={wave} value={wave}>{wave}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Visualization */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">📊 Visualización por Ola</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Wave Selector */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Selecciona una Ola:
                      </label>
                      <select
                        value={selectedWave}
                        onChange={(e) => setSelectedWave(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {waves.map(wave => (
                          <option key={wave} value={wave}>
                            {wave} ({stats[wave]?.total || 0} servidores)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Wave Details */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">{selectedWave}</h4>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="text-2xl font-bold text-blue-600">
                            {stats[selectedWave]?.total || 0}
                          </div>
                          <div className="text-xs text-gray-600">Total Servidores</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="flex gap-2">
                            <span className="text-xs">
                              🟢 {stats[selectedWave]?.criticidad.Baja || 0}
                            </span>
                            <span className="text-xs">
                              🟠 {stats[selectedWave]?.criticidad.Media || 0}
                            </span>
                            <span className="text-xs">
                              🔴 {stats[selectedWave]?.criticidad.Alta || 0}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">Por Criticidad</div>
                        </div>
                      </div>

                      {/* Server List */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {waveServers.map((server, idx) => (
                          <div 
                            key={idx}
                            className="bg-white rounded-lg p-3 border hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{server.ServerName}</div>
                                {server.Dependencia && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Depende de: {server.Dependencia}
                                  </div>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full border ${getCriticalityColor(server.Criticidad)}`}>
                                {server.Criticidad}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Summary Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">📊 Resumen de Planificación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold">Ola</th>
                      <th className="text-center p-3 font-semibold">Total Servidores</th>
                      <th className="text-center p-3 font-semibold">Baja</th>
                      <th className="text-center p-3 font-semibold">Media</th>
                      <th className="text-center p-3 font-semibold">Alta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waves.map(wave => (
                      <tr key={wave} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{wave}</td>
                        <td className="text-center p-3">{stats[wave]?.total || 0}</td>
                        <td className="text-center p-3">
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">
                            {stats[wave]?.criticidad.Baja || 0}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded">
                            {stats[wave]?.criticidad.Media || 0}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded">
                            {stats[wave]?.criticidad.Alta || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total: {servers.length} servidores en {waves.length} olas
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
            <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Descargar Plan (CSV)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
