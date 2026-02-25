import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, Download, RefreshCw, AlertCircle, Server, Layers, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

// Vis.js types
interface VisNode {
  id: string;
  label: string;
  color: string;
  font?: { color: string };
  borderWidth?: number;
  title?: string;
}

interface VisEdge {
  from: string;
  to: string;
  arrows: string;
  color?: { color: string; opacity: number };
  width?: number;
}

interface NetworkDependency {
  source: string;
  destination: string;
  port: number | null;
  protocol: string;
  serviceName?: string;
  targetProcessId?: string;
}

interface Wave {
  number: number;
  servers: string[];
  color: string;
}

const WAVE_COLORS = [
  '#48bb78', // Wave 1 - Verde
  '#4299e1', // Wave 2 - Azul
  '#ed8936', // Wave 3 - Naranja
  '#9f7aea', // Wave 4 - Morado
  '#f56565', // Wave 5 - Rojo
  '#38b2ac', // Wave 6 - Teal
  '#ecc94b', // Wave 7 - Amarillo
  '#ed64a6', // Wave 8 - Rosa
];

const SERVER_ICONS: { [key: string]: string } = {
  database: '🗄️',
  cache: '⚡',
  queue: '📬',
  auth: '🔐',
  storage: '💾',
  api: '🔌',
  analytics: '📊',
  app: '📱',
  web: '🌐',
  cdn: '☁️',
  default: '🖥️',
};

interface MigrationPlannerProps {
  dependencies: NetworkDependency[];
  onClose?: () => void;
}

export function MigrationPlanner({ dependencies, onClose }: MigrationPlannerProps) {
  const [waves, setWaves] = useState<Wave[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedWave, setSelectedWave] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalServers: 0,
    totalConnections: 0,
    totalWaves: 0,
    unassigned: 0,
  });

  const networkContainerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);

  // Detectar tipo de servidor por nombre
  const getServerType = (serverName: string): string => {
    const name = serverName.toLowerCase();
    if (name.includes('database') || name.includes('db') || name.includes('sql')) return 'database';
    if (name.includes('cache') || name.includes('redis') || name.includes('memcache')) return 'cache';
    if (name.includes('queue') || name.includes('kafka') || name.includes('rabbit')) return 'queue';
    if (name.includes('auth') || name.includes('ldap') || name.includes('ad')) return 'auth';
    if (name.includes('storage') || name.includes('s3') || name.includes('blob')) return 'storage';
    if (name.includes('api') || name.includes('rest') || name.includes('graphql')) return 'api';
    if (name.includes('analytics') || name.includes('bi') || name.includes('report')) return 'analytics';
    if (name.includes('app')) return 'app';
    if (name.includes('web') || name.includes('nginx') || name.includes('apache')) return 'web';
    if (name.includes('cdn') || name.includes('cloudfront')) return 'cdn';
    return 'default';
  };

  // Calcular waves automáticamente
  const calculateWaves = () => {
    console.log('🔄 Calculando waves de migración...');
    
    // Construir grafo de dependencias
    const servers = new Set<string>();
    const dependencyMap = new Map<string, Set<string>>();

    dependencies.forEach(dep => {
      servers.add(dep.source);
      servers.add(dep.destination);
      
      if (!dependencyMap.has(dep.source)) {
        dependencyMap.set(dep.source, new Set());
      }
      dependencyMap.get(dep.source)!.add(dep.destination);
    });

    console.log(`📊 Total servidores: ${servers.size}`);
    console.log(`📊 Total conexiones: ${dependencies.length}`);

    const assigned = new Map<string, number>(); // servidor -> wave
    const wavesData: Wave[] = [];
    let currentWave = 1;
    let processedInIteration = true;

    // Algoritmo de cálculo de waves
    while (processedInIteration && assigned.size < servers.size) {
      processedInIteration = false;
      const serversInWave: string[] = [];

      for (const server of servers) {
        if (assigned.has(server)) continue;

        const deps = dependencyMap.get(server) || new Set();
        
        // Wave 1: Sin dependencias
        if (deps.size === 0) {
          serversInWave.push(server);
          assigned.set(server, currentWave);
          processedInIteration = true;
          continue;
        }

        // Verificar si todas las dependencias están asignadas
        const allDepsAssigned = Array.from(deps).every(dep => assigned.has(dep));
        
        if (allDepsAssigned) {
          // Calcular wave = max(wave de dependencias) + 1
          const maxDepWave = Math.max(...Array.from(deps).map(dep => assigned.get(dep) || 0));
          const serverWave = maxDepWave + 1;
          
          if (serverWave === currentWave) {
            serversInWave.push(server);
            assigned.set(server, currentWave);
            processedInIteration = true;
          }
        }
      }

      if (serversInWave.length > 0) {
        const color = WAVE_COLORS[(currentWave - 1) % WAVE_COLORS.length];
        wavesData.push({
          number: currentWave,
          servers: serversInWave,
          color,
        });
        console.log(`✅ Wave ${currentWave}: ${serversInWave.length} servidores`);
        currentWave++;
      }
    }

    // Servidores no asignados (dependencias circulares)
    const unassignedServers = Array.from(servers).filter(s => !assigned.has(s));
    if (unassignedServers.length > 0) {
      console.log(`⚠️  ${unassignedServers.length} servidores con dependencias circulares`);
      const color = WAVE_COLORS[(currentWave - 1) % WAVE_COLORS.length];
      wavesData.push({
        number: currentWave,
        servers: unassignedServers,
        color,
      });
      unassignedServers.forEach(s => assigned.set(s, currentWave));
    }

    setWaves(wavesData);
    setStats({
      totalServers: servers.size,
      totalConnections: dependencies.length,
      totalWaves: wavesData.length,
      unassigned: unassignedServers.length,
    });

    console.log(`🎉 Waves calculadas: ${wavesData.length} waves`);
    return { wavesData, assigned };
  };

  // Inicializar Vis.js Network
  const initializeNetwork = (wavesData: Wave[], serverWaveMap: Map<string, number>) => {
    if (!networkContainerRef.current) return;

    // Cargar Vis.js desde CDN si no está disponible
    if (!(window as any).vis) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js';
      script.onload = () => initializeNetwork(wavesData, serverWaveMap);
      document.head.appendChild(script);
      return;
    }

    const vis = (window as any).vis;

    // Crear nodos
    const nodes: VisNode[] = [];
    serverWaveMap.forEach((wave, server) => {
      const type = getServerType(server);
      const icon = SERVER_ICONS[type];
      const color = WAVE_COLORS[(wave - 1) % WAVE_COLORS.length];
      
      nodes.push({
        id: server,
        label: `${icon}\n${server}`,
        color: color,
        font: { color: '#1a202c' },
        borderWidth: 3,
        title: `${server}\nWave ${wave}\nTipo: ${type}`,
      });
    });

    // Crear edges
    const edges: VisEdge[] = dependencies.map(dep => ({
      from: dep.source,
      to: dep.destination,
      arrows: 'to',
      color: { color: '#a0aec0', opacity: 0.4 },
      width: 1.5,
    }));

    const data = { nodes, edges };

    const options = {
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -8000,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09,
        },
        stabilization: { iterations: 200 },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
      },
      nodes: {
        shape: 'circle',
        size: 35,
        font: { size: 10, multi: true },
        borderWidth: 3,
      },
      edges: {
        arrows: 'to',
        color: { color: '#a0aec0', opacity: 0.4 },
        width: 1.5,
        smooth: { type: 'continuous' },
      },
    };

    networkRef.current = new vis.Network(networkContainerRef.current, data, options);

    // Event listeners
    networkRef.current.on('click', (params: any) => {
      if (params.nodes.length > 0) {
        setSelectedServer(params.nodes[0]);
      } else {
        setSelectedServer(null);
      }
    });

    console.log('🎨 Red visualizada con Vis.js');
  };

  // Calcular waves al montar
  useEffect(() => {
    if (dependencies.length > 0) {
      const { wavesData, assigned } = calculateWaves();
      initializeNetwork(wavesData, assigned);
    }
  }, [dependencies]);

  // Obtener dependencias de un servidor
  const getServerDependencies = (server: string) => {
    const dependsOn = dependencies.filter(d => d.source === server);
    const dependents = dependencies.filter(d => d.destination === server);
    return { dependsOn, dependents };
  };

  // Filtrar por wave
  const filterByWave = (waveNumber: number | null) => {
    setSelectedWave(waveNumber);
    
    if (!networkRef.current) return;

    if (waveNumber === null) {
      // Mostrar todos
      networkRef.current.setOptions({
        nodes: { opacity: 1 },
        edges: { color: { opacity: 0.4 } },
      });
    } else {
      // Resaltar wave seleccionada
      const wave = waves.find(w => w.number === waveNumber);
      if (!wave) return;

      const highlightedNodes = new Set(wave.servers);
      
      networkRef.current.body.data.nodes.forEach((node: any) => {
        const opacity = highlightedNodes.has(node.id) ? 1 : 0.2;
        networkRef.current.body.data.nodes.update({ id: node.id, opacity });
      });
    }
  };

  // Exportar a CSV
  const exportToCSV = () => {
    const serverWaveMap = new Map<string, number>();
    waves.forEach(wave => {
      wave.servers.forEach(server => {
        serverWaveMap.set(server, wave.number);
      });
    });

    const rows = [['Servidor', 'Tipo', 'Wave', 'Dependencias']];
    
    serverWaveMap.forEach((wave, server) => {
      const type = getServerType(server);
      const deps = getServerDependencies(server);
      const depsStr = deps.dependsOn.map(d => d.destination).join(';');
      rows.push([server, type, wave.toString(), depsStr]);
    });

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-plan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Plan de migración exportado', {
      description: 'El archivo CSV se ha descargado correctamente',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Migration Planner</h2>
              <p className="text-sm text-gray-600">Planificación automática de waves de migración</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={() => calculateWaves()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalcular
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div className="w-96 border-r flex flex-col overflow-hidden">
            {/* Stats */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-600">Servidores</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalServers}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-600">Conexiones</div>
                  <div className="text-2xl font-bold text-green-600">{stats.totalConnections}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-600">Waves</div>
                  <div className="text-2xl font-bold text-purple-600">{stats.totalWaves}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-600">Sin Asignar</div>
                  <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
                </div>
              </div>
            </div>

            {/* Waves List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-700">Waves de Migración</h3>
                {selectedWave !== null && (
                  <Button
                    onClick={() => filterByWave(null)}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    Ver todos
                  </Button>
                )}
              </div>

              {waves.map(wave => (
                <Card
                  key={wave.number}
                  className={`cursor-pointer transition-all ${
                    selectedWave === wave.number ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => filterByWave(wave.number)}
                >
                  <CardHeader className="p-3" style={{ backgroundColor: wave.color + '20' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: wave.color }}
                        />
                        <span className="font-semibold text-sm">Wave {wave.number}</span>
                      </div>
                      <Badge variant="secondary">{wave.servers.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {wave.servers.slice(0, 5).map(server => (
                        <div
                          key={server}
                          className="text-xs text-gray-700 truncate hover:text-blue-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedServer(server);
                          }}
                        >
                          {SERVER_ICONS[getServerType(server)]} {server}
                        </div>
                      ))}
                      {wave.servers.length > 5 && (
                        <div className="text-xs text-gray-500 italic">
                          +{wave.servers.length - 5} más...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Server Info */}
            {selectedServer && (
              <div className="border-t p-4 bg-gray-50">
                <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  {selectedServer}
                </h3>
                {(() => {
                  const { dependsOn, dependents } = getServerDependencies(selectedServer);
                  return (
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="font-medium text-gray-600">→ Depende de ({dependsOn.length}):</div>
                        <div className="ml-2 space-y-1 max-h-20 overflow-y-auto">
                          {dependsOn.map((dep, idx) => (
                            <div key={idx} className="text-gray-700">
                              • {dep.destination} {dep.port && `(${dep.port})`}
                            </div>
                          ))}
                          {dependsOn.length === 0 && (
                            <div className="text-gray-400 italic">Sin dependencias</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">← Dependientes ({dependents.length}):</div>
                        <div className="ml-2 space-y-1 max-h-20 overflow-y-auto">
                          {dependents.map((dep, idx) => (
                            <div key={idx} className="text-gray-700">
                              • {dep.source} {dep.port && `(${dep.port})`}
                            </div>
                          ))}
                          {dependents.length === 0 && (
                            <div className="text-gray-400 italic">Sin dependientes</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right Panel - Network Visualization */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Mapa de Dependencias</h3>
                  <p className="text-xs text-gray-600">Click en un servidor para ver detalles</p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-gray-600">Flujo de migración →</span>
                </div>
              </div>
            </div>
            <div
              ref={networkContainerRef}
              className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100"
              style={{ minHeight: '400px' }}
            />
            
            {/* Legend */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-xs font-semibold text-gray-700">Leyenda:</div>
                {waves.slice(0, 6).map(wave => (
                  <div key={wave.number} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: wave.color }}
                    />
                    <span className="text-xs text-gray-600">Wave {wave.number}</span>
                  </div>
                ))}
                {waves.length > 6 && (
                  <span className="text-xs text-gray-500 italic">+{waves.length - 6} más</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        {stats.unassigned > 0 && (
          <div className="p-3 bg-orange-50 border-t border-orange-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-xs text-orange-800">
              {stats.unassigned} servidor(es) con dependencias circulares detectadas. 
              Revisar manualmente antes de migrar.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
