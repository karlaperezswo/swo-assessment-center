import { useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Network, Server, Database, AlertCircle, Download, FileText, ChevronLeft, ChevronRight, Filter, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface DependencyNode {
  id: string;
  label: string;
  type: 'server' | 'application';
  group?: string;
}

interface DependencyEdge {
  from: string;
  to: string;
  label: string;
  port: number | null;
  protocol: string;
  serviceName?: string;
}

interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

interface DependencySummary {
  totalDependencies: number;
  uniqueServers: number;
  uniqueApplications: number;
  uniquePorts: number;
}

interface NetworkDependency {
  source: string;
  destination: string;
  port: number | null;
  protocol: string;
  serviceName?: string;
  sourceApp?: string;
  destinationApp?: string;
  targetProcessId?: string;
}

interface SearchResult {
  server: string;
  dependencies: {
    incoming: NetworkDependency[];
    outgoing: NetworkDependency[];
  };
  relatedServers: string[];
  relatedApplications: string[];
  graph: DependencyGraph;
}

interface DependencyMapProps {
  dependencyData?: any;
}

export function DependencyMap({ dependencyData }: DependencyMapProps) {
  const [summary, setSummary] = useState<DependencySummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [allServers, setAllServers] = useState<string[]>([]);
  const [allDependencies, setAllDependencies] = useState<NetworkDependency[]>([]);
  const [databasesWithoutDeps, setDatabasesWithoutDeps] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load dependency data automatically when provided
  useEffect(() => {
    if (dependencyData) {
      console.log('✅ Cargando dependencias automáticamente desde archivo MPA');
      setSummary(dependencyData.summary);
      setAllServers(dependencyData.servers || []);
      setAllDependencies(dependencyData.dependencies || []);
      setDatabasesWithoutDeps(dependencyData.databasesWithoutDependencies || []);
      
      // Build and display graph
      const graph = buildGraphFromDependencies(dependencyData.dependencies);
      displayGraph(graph);
      
      toast.success('Dependencias cargadas automáticamente', {
        description: `${dependencyData.summary.totalDependencies} dependencias, ${dependencyData.summary.uniqueServers} servidores`,
        duration: 4000
      });
    }
  }, [dependencyData]);

  const buildGraphFromDependencies = (dependencies: NetworkDependency[]): DependencyGraph => {
    const nodesMap = new Map<string, DependencyNode>();
    const edgesArray: DependencyEdge[] = [];

    dependencies.forEach(dep => {
      // Add source node
      if (!nodesMap.has(dep.source)) {
        nodesMap.set(dep.source, {
          id: dep.source,
          label: dep.source,
          type: 'server',
          group: dep.sourceApp,
        });
      }

      // Add destination node
      if (!nodesMap.has(dep.destination)) {
        nodesMap.set(dep.destination, {
          id: dep.destination,
          label: dep.destination,
          type: 'server',
          group: dep.destinationApp,
        });
      }

      // Add edge
      edgesArray.push({
        from: dep.source,
        to: dep.destination,
        label: dep.port !== null ? `${dep.protocol}:${dep.port}` : dep.protocol,
        port: dep.port,
        protocol: dep.protocol,
        serviceName: dep.serviceName,
      });
    });

    return {
      nodes: Array.from(nodesMap.values()),
      edges: edgesArray,
    };
  };

  // Nueva función de búsqueda local (sin necesidad de backend)
  const handleLocalSearch = () => {
    if (!searchTerm.trim() || allDependencies.length === 0) {
      toast.error('Ingresa un término de búsqueda');
      return;
    }

    setIsSearching(true);

    try {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      
      // Buscar servidor que coincida (como origen o destino)
      const matchingServer = allServers.find(
        server => server.toLowerCase().includes(normalizedSearch)
      );

      if (!matchingServer) {
        toast.warning('No se encontró ningún servidor con ese nombre');
        setSearchResult(null);
        setIsSearching(false);
        return;
      }

      // Filtrar dependencias entrantes (donde el servidor es destino)
      const incoming = allDependencies.filter(
        dep => dep.destination.toLowerCase() === matchingServer.toLowerCase()
      );

      // Filtrar dependencias salientes (donde el servidor es origen)
      const outgoing = allDependencies.filter(
        dep => dep.source.toLowerCase() === matchingServer.toLowerCase()
      );

      // Obtener servidores relacionados
      const relatedServers = new Set<string>();
      incoming.forEach(dep => relatedServers.add(dep.source));
      outgoing.forEach(dep => relatedServers.add(dep.destination));

      // Obtener aplicaciones relacionadas
      const relatedApplications = new Set<string>();
      [...incoming, ...outgoing].forEach(dep => {
        if (dep.sourceApp) relatedApplications.add(dep.sourceApp);
        if (dep.destinationApp) relatedApplications.add(dep.destinationApp);
      });

      // Construir grafo con dependencias relacionadas
      const relatedDeps = [...incoming, ...outgoing];
      const graph = buildGraphFromDependencies(relatedDeps);

      const result: SearchResult = {
        server: matchingServer,
        dependencies: { incoming, outgoing },
        relatedServers: Array.from(relatedServers),
        relatedApplications: Array.from(relatedApplications),
        graph,
      };

      setSearchResult(result);
      displayGraph(graph);

      toast.success(`Servidor encontrado: ${matchingServer}`, {
        description: `${incoming.length} entrantes, ${outgoing.length} salientes`,
        duration: 4000
      });
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error en búsqueda');
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'word') => {
    if (!searchResult) {
      toast.error('Primero debes buscar un servidor');
      return;
    }

    setIsExporting(true);

    try {
      console.log(`📄 Exportando a ${format}...`);
      
      toast.loading(`Generando archivo ${format.toUpperCase()}...`, { id: 'export' });
      
      // Llamar al backend para exportar
      const response = await fetch('/api/dependencies/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchResult,
          summary,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al exportar: ${response.statusText}`);
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dependencias_${searchResult.server}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Archivo ${format.toUpperCase()} generado`, {
        id: 'export',
        description: 'El archivo se ha descargado correctamente',
        duration: 4000
      });
      
    } catch (error: any) {
      console.error('❌ Export error:', error);
      toast.error('Error al exportar', {
        id: 'export',
        description: error.message || 'Error desconocido',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Filter and sort dependencies
  const filteredDependencies = allDependencies.filter(dep => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      dep.source?.toLowerCase().includes(searchLower) ||
      dep.destination?.toLowerCase().includes(searchLower) ||
      dep.protocol?.toLowerCase().includes(searchLower) ||
      dep.serviceName?.toLowerCase().includes(searchLower) ||
      dep.sourceApp?.toLowerCase().includes(searchLower) ||
      dep.destinationApp?.toLowerCase().includes(searchLower) ||
      dep.port?.toString().includes(searchLower)
    );
  });

  // Separate complete and incomplete dependencies
  const completeDependencies = filteredDependencies.filter(
    dep => dep.destination && dep.destination.trim() !== '' && dep.port !== null
  );
  
  // Conexiones sin puerto: tienen origen Y destino pero NO tienen puerto
  const incompleteDependencies = filteredDependencies.filter(
    dep => dep.source && dep.source.trim() !== '' && 
           dep.destination && dep.destination.trim() !== '' && 
           dep.port === null
  );

  const sortedCompleteDependencies = [...completeDependencies].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key as keyof NetworkDependency] || '';
    const bValue = b[sortConfig.key as keyof NetworkDependency] || '';
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedIncompleteDependencies = [...incompleteDependencies].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key as keyof NetworkDependency] || '';
    const bValue = b[sortConfig.key as keyof NetworkDependency] || '';
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination for complete dependencies
  const totalPagesComplete = Math.ceil(sortedCompleteDependencies.length / itemsPerPage);
  const startIndexComplete = (currentPage - 1) * itemsPerPage;
  const endIndexComplete = startIndexComplete + itemsPerPage;
  const paginatedCompleteDependencies = sortedCompleteDependencies.slice(startIndexComplete, endIndexComplete);

  // Pagination for incomplete dependencies
  const totalPagesIncomplete = Math.ceil(sortedIncompleteDependencies.length / itemsPerPage);
  const startIndexIncomplete = (currentPage - 1) * itemsPerPage;
  const endIndexIncomplete = startIndexIncomplete + itemsPerPage;
  const paginatedIncompleteDependencies = sortedIncompleteDependencies.slice(startIndexIncomplete, endIndexIncomplete);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const displayGraph = (graph: DependencyGraph) => {
    // Calculate node importance based on connections
    const incomingCount = new Map<string, number>();
    const outgoingCount = new Map<string, number>();
    
    graph.edges.forEach(edge => {
      incomingCount.set(edge.to, (incomingCount.get(edge.to) || 0) + 1);
      outgoingCount.set(edge.from, (outgoingCount.get(edge.from) || 0) + 1);
    });

    // Calculate hierarchical levels using topological sort
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const temp = new Set<string>();

    const calculateLevel = (nodeId: string): number => {
      if (levels.has(nodeId)) return levels.get(nodeId)!;
      if (temp.has(nodeId)) return 0; // Circular dependency
      if (visited.has(nodeId)) return levels.get(nodeId) || 0;

      temp.add(nodeId);
      
      // Find all nodes this node depends on (incoming edges)
      const dependencies = graph.edges.filter(e => e.from === nodeId);
      let maxLevel = 0;
      
      for (const dep of dependencies) {
        const depLevel = calculateLevel(dep.to);
        maxLevel = Math.max(maxLevel, depLevel + 1);
      }
      
      temp.delete(nodeId);
      visited.add(nodeId);
      levels.set(nodeId, maxLevel);
      
      return maxLevel;
    };

    // Calculate levels for all nodes
    graph.nodes.forEach(node => {
      if (!levels.has(node.id)) {
        calculateLevel(node.id);
      }
    });

    // Group nodes by level
    const nodesByLevel = new Map<number, DependencyNode[]>();
    graph.nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    });

    // Sort levels
    const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
    const maxLevel = sortedLevels[sortedLevels.length - 1] || 0;

    // Create nodes with hierarchical positioning
    const flowNodes: Node[] = [];
    const levelHeight = 250;
    const nodeSpacing = 200;
    const startY = 100;

    sortedLevels.forEach(level => {
      const nodesInLevel = nodesByLevel.get(level)!;
      const levelWidth = nodesInLevel.length * nodeSpacing;
      const startX = Math.max(100, (1400 - levelWidth) / 2);
      const y = startY + (maxLevel - level) * levelHeight; // Invert: level 0 at bottom

      nodesInLevel.forEach((node, index) => {
        const totalConnections = (incomingCount.get(node.id) || 0) + (outgoingCount.get(node.id) || 0);
        const nodeSize = Math.min(100, 50 + (totalConnections * 3));
        
        // Determine color based on level
        let color = '#3b82f6'; // Default blue
        if (level === 0) color = '#10b981'; // Green for base level
        else if (level === maxLevel) color = '#8b5cf6'; // Purple for top level
        else if (level === 1) color = '#06b6d4'; // Cyan for level 1
        else if (level === 2) color = '#f59e0b'; // Orange for level 2
        
        flowNodes.push({
          id: node.id,
          type: 'default',
          data: {
            label: (
              <div className="text-center p-2">
                <div className="font-bold text-xs mb-1" style={{ wordBreak: 'break-word' }}>
                  {node.label.length > 18 ? node.label.substring(0, 18) + '...' : node.label}
                </div>
                {node.group && (
                  <div className="text-xs text-gray-300 mb-1">{node.group}</div>
                )}
                <div className="flex items-center justify-center gap-1 text-xs">
                  {(incomingCount.get(node.id) || 0) > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                      ↓{incomingCount.get(node.id)}
                    </span>
                  )}
                  {(outgoingCount.get(node.id) || 0) > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                      ↑{outgoingCount.get(node.id)}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          position: { x: startX + (index * nodeSpacing), y },
          style: {
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '10px',
            padding: '6px',
            width: `${nodeSize}px`,
            minHeight: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            fontSize: '11px',
          },
        });
      });
    });

    // Create edges with improved styling
    const flowEdges: Edge[] = graph.edges.map((edge, index) => {
      let edgeColor = '#94a3b8';
      let edgeWidth = 1.5;
      let animated = false;
      
      // Color by protocol/port
      if (edge.port !== null) {
        if (edge.port === 80 || edge.port === 443 || edge.port === 8080) {
          edgeColor = '#3b82f6';
          animated = true;
        } else if (edge.port === 3306 || edge.port === 5432 || edge.port === 1433) {
          edgeColor = '#10b981';
        } else if (edge.port === 6379 || edge.port === 11211) {
          edgeColor = '#f59e0b';
        } else if (edge.port === 22 || edge.port === 3389) {
          edgeColor = '#ef4444';
        }
      }
      
      const sourceConnections = (outgoingCount.get(edge.from) || 0);
      if (sourceConnections > 5) {
        edgeWidth = 2.5;
      }
      
      return {
        id: `${edge.from}-${edge.to}-${index}`,
        source: edge.from,
        target: edge.to,
        label: edge.label,
        type: 'smoothstep',
        animated,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 18,
          height: 18,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          opacity: 0.6,
        },
        labelStyle: {
          fill: '#1f2937',
          fontWeight: 600,
          fontSize: 10,
          backgroundColor: 'white',
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.9,
          rx: 3,
          ry: 3,
        },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 3,
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Resumen de Dependencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.totalDependencies}
                </div>
                <div className="text-sm text-gray-600">Dependencias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.uniqueServers}
                </div>
                <div className="text-sm text-gray-600">Servidores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.uniqueApplications}
                </div>
                <div className="text-sm text-gray-600">Aplicaciones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {summary.uniquePorts}
                </div>
                <div className="text-sm text-gray-600">Puertos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      {allDependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Servidor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar por nombre de servidor (origen o destino)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocalSearch()}
                disabled={isSearching}
              />
              <Button
                onClick={handleLocalSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="min-w-[120px]"
              >
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            {searchResult && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-600" />
                    {searchResult.server}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-green-700">
                      Conexiones Entrantes ({searchResult.dependencies.incoming.length})
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {searchResult.dependencies.incoming.map((dep, idx) => (
                        <div key={idx} className="text-sm bg-green-50 p-2 rounded">
                          <div className="font-medium">{dep.source}</div>
                          <div className="text-xs text-gray-600">
                            {dep.protocol}{dep.port !== null ? `:${dep.port}` : ''}
                            {dep.serviceName && ` (${dep.serviceName})`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2 text-blue-700">
                      Conexiones Salientes ({searchResult.dependencies.outgoing.length})
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {searchResult.dependencies.outgoing.map((dep, idx) => (
                        <div key={idx} className="text-sm bg-blue-50 p-2 rounded">
                          <div className="font-medium">{dep.destination}</div>
                          <div className="text-xs text-gray-600">
                            {dep.protocol}{dep.port !== null ? `:${dep.port}` : ''}
                            {dep.serviceName && ` (${dep.serviceName})`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {searchResult.relatedApplications.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Aplicaciones Relacionadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {searchResult.relatedApplications.map((app) => (
                        <Badge key={app} variant="secondary">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Dependencies - Two Panels */}
      {allDependencies.length > 0 && (
        <div className="space-y-6">
          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Todas las Dependencias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Filtrar por servidor, puerto, protocolo, servicio..."
                      value={filterText}
                      onChange={(e) => {
                        setFilterText(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Mostrar:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two Panels Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Panel 1: Complete Dependencies */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Server className="h-5 w-5" />
                  Conexiones de Servidores con Puerto
                  <Badge variant="secondary" className="ml-auto bg-green-600 text-white">
                    {sortedCompleteDependencies.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-green-700 mt-1">
                  Servidores con destino y puerto definidos
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden m-4">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white sticky top-0 z-10 shadow-md">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-green-800 transition-colors bg-green-600" onClick={() => handleSort('source')}>
                            <div className="flex items-center gap-1 text-xs">
                              Origen
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-green-800 transition-colors bg-green-600" onClick={() => handleSort('destination')}>
                            <div className="flex items-center gap-1 text-xs">
                              Destino
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-green-800 transition-colors bg-green-600" onClick={() => handleSort('port')}>
                            <div className="flex items-center gap-1 text-xs">
                              Puerto
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-green-800 transition-colors bg-green-600" onClick={() => handleSort('protocol')}>
                            <div className="flex items-center gap-1 text-xs">
                              Protocolo
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold bg-green-600">
                            <div className="text-xs">
                              Proceso Destino
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedCompleteDependencies.map((dep, idx) => (
                          <tr key={idx} className="hover:bg-green-50 transition-colors">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <Server className="h-3 w-3 text-green-600 flex-shrink-0" />
                                <span className="font-medium text-gray-900 text-xs truncate">{dep.source}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <Server className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                <span className="font-medium text-gray-900 text-xs truncate">{dep.destination}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {dep.port}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <Badge 
                                variant="secondary"
                                className={`text-xs ${
                                  dep.protocol === 'TCP' ? 'bg-blue-100 text-blue-800' :
                                  dep.protocol === 'UDP' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {dep.protocol}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-gray-700 text-xs">
                                {(dep as any).targetProcessId || dep.serviceName || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Pagination for Complete */}
                {totalPagesComplete > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-xs text-gray-600">
                      {startIndexComplete + 1} - {Math.min(endIndexComplete, sortedCompleteDependencies.length)} de {sortedCompleteDependencies.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs">{currentPage} / {totalPagesComplete}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPagesComplete, p + 1))}
                        disabled={currentPage === totalPagesComplete}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Panel 2: Incomplete Dependencies */}
            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertCircle className="h-5 w-5" />
                  Conexiones sin Puerto Identificado
                  <Badge variant="secondary" className="ml-auto bg-orange-600 text-white">
                    {sortedIncompleteDependencies.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-orange-700 mt-1">
                  Servidores con origen y destino definidos pero sin puerto identificado
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden m-4">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-orange-600 to-orange-700 text-white sticky top-0 z-10 shadow-md">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-orange-800 transition-colors bg-orange-600" onClick={() => handleSort('source')}>
                            <div className="flex items-center gap-1 text-xs">
                              Origen
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-orange-800 transition-colors bg-orange-600" onClick={() => handleSort('destination')}>
                            <div className="flex items-center gap-1 text-xs">
                              Destino
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-orange-800 transition-colors bg-orange-600" onClick={() => handleSort('port')}>
                            <div className="flex items-center gap-1 text-xs">
                              Puerto
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-orange-800 transition-colors bg-orange-600" onClick={() => handleSort('protocol')}>
                            <div className="flex items-center gap-1 text-xs">
                              Protocolo
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold bg-orange-600">
                            <div className="text-xs">
                              Proceso Destino
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedIncompleteDependencies.map((dep, idx) => (
                          <tr key={idx} className="hover:bg-orange-50 transition-colors">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <Server className="h-3 w-3 text-orange-600 flex-shrink-0" />
                                <span className="font-medium text-gray-900 text-xs truncate">{dep.source}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-gray-400 text-xs italic">
                                {dep.destination || 'Sin destino'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {dep.port !== null ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {dep.port}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs italic">Sin puerto</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <Badge 
                                variant="secondary"
                                className={`text-xs ${
                                  dep.protocol === 'TCP' ? 'bg-blue-100 text-blue-800' :
                                  dep.protocol === 'UDP' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {dep.protocol || 'N/A'}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-gray-700 text-xs">
                                {(dep as any).targetProcessId || dep.serviceName || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Pagination for Incomplete */}
                {totalPagesIncomplete > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-xs text-gray-600">
                      {startIndexIncomplete + 1} - {Math.min(endIndexIncomplete, sortedIncompleteDependencies.length)} de {sortedIncompleteDependencies.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs">{currentPage} / {totalPagesIncomplete}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPagesIncomplete, p + 1))}
                        disabled={currentPage === totalPagesIncomplete}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Total Conexiones</div>
                  <div className="text-2xl font-bold text-blue-900">{allDependencies.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Con Puerto</div>
                  <div className="text-2xl font-bold text-green-900">{completeDependencies.length}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm text-orange-600 font-medium">Sin Puerto/Destino</div>
                  <div className="text-2xl font-bold text-orange-900">{incompleteDependencies.length}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium">Filtradas</div>
                  <div className="text-2xl font-bold text-purple-900">{filteredDependencies.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Databases Without Dependencies */}
          {databasesWithoutDeps.length > 0 && (
            <Card className="border-gray-300">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Database className="h-5 w-5" />
                  Bases de Datos sin Dependencias
                  <Badge variant="secondary" className="ml-auto bg-gray-600 text-white">
                    {databasesWithoutDeps.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-700 mt-1">
                  Bases de datos que no tienen conexiones con otros servidores
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden m-4">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto relative">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-600 to-gray-700 text-white sticky top-0 z-10 shadow-md">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold bg-gray-600">
                            <div className="text-xs">Nombre Base de Datos</div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold bg-gray-600">
                            <div className="text-xs">Servidor</div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold bg-gray-600">
                            <div className="text-xs">Database ID</div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold bg-gray-600">
                            <div className="text-xs">Edición</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {databasesWithoutDeps.map((db, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <Database className="h-3 w-3 text-gray-600 flex-shrink-0" />
                                <span className="font-medium text-gray-900 text-xs">{db.databaseName}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <Server className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                <span className="text-gray-700 text-xs">{db.serverId}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-gray-600 text-xs font-mono">
                                {db.databaseId || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-gray-600 text-xs">
                                {db.edition || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Graph Visualization */}
      {nodes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Visualización de Dependencias</CardTitle>
              {searchResult && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button
                    onClick={() => handleExport('word')}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar Word
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ height: '700px', width: '100%' }} className="border rounded-lg bg-gray-50">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-left"
                minZoom={0.1}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              >
                <Background color="#e5e7eb" gap={16} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Niveles Jerárquicos:</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Nivel 0 (Base - Sin dependencias)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-500 rounded"></div>
                    <span>Nivel 1 (Depende de Nivel 0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span>Nivel 2 (Depende de Nivel 1)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Niveles Intermedios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Nivel Superior (Aplicaciones finales)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Tipos de Conexión:</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-blue-500"></div>
                    <span>HTTP/HTTPS (80, 443, 8080)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-green-500"></div>
                    <span>Bases de Datos (3306, 5432, 1433)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-orange-500"></div>
                    <span>Cache (6379, 11211)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-red-500"></div>
                    <span>Acceso Remoto (22, 3389)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-gray-400"></div>
                    <span>Otros servicios</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Indicadores:</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">↓ 5</span>
                    <span>Conexiones entrantes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">↑ 3</span>
                    <span>Conexiones salientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white rounded"></div>
                    <span>Tamaño = número de conexiones</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Organización:</strong> El grafo está organizado en niveles jerárquicos de abajo hacia arriba usando ordenamiento topológico. 
                Nivel 0 (verde) representa servicios base sin dependencias, y cada nivel superior depende de los niveles inferiores. 
                Las conexiones animadas indican tráfico HTTP/HTTPS de alta prioridad.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!summary && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Cómo usar el Mapa de Dependencias
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. Carga un archivo Excel con dependencias de red (MPA)</li>
                  <li>2. Visualiza el mapa completo de conexiones</li>
                  <li>3. Busca un servidor específico para ver sus dependencias</li>
                  <li>4. Explora conexiones entrantes y salientes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
