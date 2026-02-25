import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Search, Network, Server, Database, AlertCircle, Download, FileText, FileUp, ChevronLeft, ChevronRight, Filter, ArrowUpDown } from 'lucide-react';
import apiClient from '@/lib/api';
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

export function DependencyMap() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [summary, setSummary] = useState<DependencySummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [allServers, setAllServers] = useState<string[]>([]);
  const [allApplications, setAllApplications] = useState<string[]>([]);
  const [allDependencies, setAllDependencies] = useState<NetworkDependency[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Use ref instead of querySelector for React-controlled DOM manipulation
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.success('Archivo seleccionado', {
        description: e.target.files[0].name,
      });
    }
  };

  const handleSelectFile = () => {
    // Use ref instead of querySelector to avoid DOM manipulation issues
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Por favor selecciona un archivo Excel');
      return;
    }

    console.log('📤 Iniciando carga de archivo:', file.name);
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('🔄 Enviando archivo al servidor...');
      const response = await apiClient.post('/api/dependencies/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('📥 Respuesta del servidor:', response.data);

      if (response.data.success) {
        const data = response.data.data;
        
        console.log('✅ Datos recibidos:', {
          sessionId: data.sessionId,
          totalDependencies: data.summary.totalDependencies,
          uniqueServers: data.summary.uniqueServers,
          graphNodes: data.graph.nodes.length,
          graphEdges: data.graph.edges.length,
        });

        setSessionId(data.sessionId);
        setSummary(data.summary);
        setAllServers(data.servers || []);
        setAllApplications(data.applications || []);
        setAllDependencies(data.allDependencies || []);

        // Display initial full graph
        console.log('🎨 Generando visualización del grafo...');
        displayGraph(data.graph);

        toast.success('✅ Archivo cargado exitosamente', {
          description: `${data.summary.totalDependencies} dependencias encontradas de ${data.summary.uniqueServers} servidores únicos`,
          duration: 5000,
        });
        
        console.log('✅ Carga completada exitosamente');
      } else {
        console.error('❌ Respuesta sin éxito:', response.data);
        toast.error('Error al procesar archivo', {
          description: 'El servidor no pudo procesar el archivo correctamente',
        });
      }
    } catch (error: any) {
      console.error('❌ Error al cargar archivo:', error);
      
      let errorMessage = 'Error desconocido';
      let errorDescription = '';
      
      if (error.response) {
        // Error de respuesta del servidor
        console.error('Error del servidor:', error.response.data);
        errorMessage = 'Error del servidor';
        errorDescription = error.response.data?.error || error.response.statusText || 'Error al procesar el archivo';
      } else if (error.request) {
        // Error de red
        console.error('Error de red:', error.request);
        errorMessage = 'Error de conexión';
        errorDescription = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.';
      } else {
        // Otro tipo de error
        console.error('Error:', error.message);
        errorMessage = 'Error al procesar archivo';
        errorDescription = error.message;
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 7000,
      });
    } finally {
      setIsUploading(false);
      console.log('🏁 Proceso de carga finalizado');
    }
  };

  const handleSearch = async () => {
    if (!sessionId || !searchTerm.trim()) {
      toast.error('Ingresa un término de búsqueda');
      return;
    }

    setIsSearching(true);

    try {
      const response = await apiClient.post('/api/dependencies/search', {
        sessionId,
        searchTerm: searchTerm.trim(),
      });

      if (response.data.success && response.data.data) {
        const result: SearchResult = response.data.data;
        setSearchResult(result);
        displayGraph(result.graph);

        toast.success(`Servidor encontrado: ${result.server}`, {
          description: `${result.dependencies.incoming.length} entrantes, ${result.dependencies.outgoing.length} salientes`,
        });
      } else {
        toast.warning('No se encontraron resultados');
        setSearchResult(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error en búsqueda');
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'word') => {
    if (!sessionId) {
      toast.error('Primero debes cargar un archivo');
      return;
    }

    setIsExporting(true);

    try {
      const response = await apiClient.post('/api/dependencies/export', {
        sessionId,
        searchTerm: searchResult?.server || null,
        format,
      }, {
        responseType: 'blob', // Important for binary data
      });

      // Create blob and download using React-friendly approach
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = window.URL.createObjectURL(blob);
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `dependencias_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Use a temporary link without appending to body to avoid React DOM issues
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Trigger download and cleanup
      a.click();
      
      // Cleanup after a short delay to ensure download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success(`Reporte ${format === 'pdf' ? 'PDF' : 'Word'} generado exitosamente`, {
        description: `El archivo ${filename} se ha descargado.`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar', {
        description: error instanceof Error ? error.message : 'Error desconocido',
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

  const sortedDependencies = [...filteredDependencies].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key as keyof NetworkDependency] || '';
    const bValue = b[sortConfig.key as keyof NetworkDependency] || '';
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedDependencies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDependencies = sortedDependencies.slice(startIndex, endIndex);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const displayGraph = (graph: DependencyGraph) => {
    // Analyze graph structure to create better layout
    const nodesByType = new Map<string, DependencyNode[]>();
    const nodesByGroup = new Map<string, DependencyNode[]>();
    
    // Group nodes by type and application
    graph.nodes.forEach(node => {
      // Group by type
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, []);
      }
      nodesByType.get(node.type)!.push(node);
      
      // Group by application
      const group = node.group || 'Unknown';
      if (!nodesByGroup.has(group)) {
        nodesByGroup.set(group, []);
      }
      nodesByGroup.get(group)!.push(node);
    });

    // Calculate positions using hierarchical layout
    const flowNodes: Node[] = [];
    const groups = Array.from(nodesByGroup.entries());
    const groupSpacing = 300;
    const nodeSpacing = 150;
    const layerHeight = 200;
    
    // Analyze connections to determine hierarchy levels
    const incomingCount = new Map<string, number>();
    const outgoingCount = new Map<string, number>();
    
    graph.edges.forEach(edge => {
      incomingCount.set(edge.to, (incomingCount.get(edge.to) || 0) + 1);
      outgoingCount.set(edge.from, (outgoingCount.get(edge.from) || 0) + 1);
    });
    
    // Assign nodes to layers based on their role
    const layers = new Map<number, DependencyNode[]>();
    
    graph.nodes.forEach(node => {
      const incoming = incomingCount.get(node.id) || 0;
      const outgoing = outgoingCount.get(node.id) || 0;
      
      let layer = 1; // Default middle layer
      
      // Top layer: nodes with many outgoing, few incoming (sources)
      if (outgoing > incoming && incoming <= 2) {
        layer = 0;
      }
      // Bottom layer: nodes with many incoming, few outgoing (sinks)
      else if (incoming > outgoing && outgoing <= 2) {
        layer = 2;
      }
      // Middle layer: nodes with balanced connections
      else {
        layer = 1;
      }
      
      if (!layers.has(layer)) {
        layers.set(layer, []);
      }
      layers.get(layer)!.push(node);
    });
    
    // Position nodes in their layers
    let nodeIndex = 0;
    for (let layer = 0; layer <= 2; layer++) {
      const nodesInLayer = layers.get(layer) || [];
      const layerWidth = nodesInLayer.length * nodeSpacing;
      const startX = (800 - layerWidth) / 2; // Center the layer
      
      nodesInLayer.forEach((node, index) => {
        const x = startX + (index * nodeSpacing) + 100;
        const y = 100 + (layer * layerHeight);
        
        flowNodes.push({
          id: node.id,
          type: 'default',
          data: {
            label: (
              <div className="text-center">
                <div className="font-semibold text-sm">{node.label}</div>
                {node.group && (
                  <div className="text-xs text-gray-500 mt-1">{node.group}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  ↓{outgoingCount.get(node.id) || 0} ↑{incomingCount.get(node.id) || 0}
                </div>
              </div>
            ),
          },
          position: { x, y },
          style: {
            background: node.type === 'server' ? '#3b82f6' : '#10b981',
            color: 'white',
            border: '2px solid #1e40af',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '140px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
        });
        nodeIndex++;
      });
    }

    // Create edges with better styling
    const flowEdges: Edge[] = graph.edges.map((edge, index) => {
      // Determine edge color based on port/protocol
      let edgeColor = '#6b7280';
      if (edge.port !== null) {
        if (edge.port === 80 || edge.port === 443 || edge.port === 8080) {
          edgeColor = '#3b82f6'; // Blue for HTTP/HTTPS
        } else if (edge.port === 3306 || edge.port === 5432) {
          edgeColor = '#10b981'; // Green for databases
        } else if (edge.port === 6379 || edge.port === 11211) {
          edgeColor = '#f59e0b'; // Orange for cache
        }
      }
      
      return {
        id: `${edge.from}-${edge.to}-${index}`,
        source: edge.from,
        target: edge.to,
        label: edge.label,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 20,
          height: 20,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
        },
        labelStyle: {
          fill: '#1f2937',
          fontWeight: 700,
          fontSize: 12,
          backgroundColor: 'white',
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Mapa de Dependencias de Red
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Archivo Excel de Dependencias (MPA)
              </label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
                id="file-input"
              />
              {file && (
                <div 
                  className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border"
                >
                  📄 {file.name}
                </div>
              )}
              {!file && (
                <div 
                  className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md border border-dashed"
                  title="Use el botón 'Seleccionar Archivo' para elegir un archivo"
                >
                  No se ha seleccionado ningún archivo
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Soporta archivos de Matilda, Cloudamize, Concierto
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSelectFile}
                disabled={isUploading}
                variant="outline"
                className="min-w-[140px]"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Seleccionar Archivo
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="min-w-[120px]"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Procesando...' : 'Cargar'}
              </Button>
            </div>
          </div>

          {summary && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
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
          )}
        </CardContent>
      </Card>

      {/* Search Section */}
      {sessionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Dependencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar por nombre de servidor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
              />
              <Button
                onClick={handleSearch}
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

      {/* All Dependencies Table */}
      {allDependencies.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Todas las Dependencias
              </CardTitle>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {sortedDependencies.length} de {allDependencies.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters and Controls */}
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

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-blue-800 transition-colors"
                        onClick={() => handleSort('source')}
                      >
                        <div className="flex items-center gap-2">
                          Servidor Origen
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-blue-800 transition-colors"
                        onClick={() => handleSort('destination')}
                      >
                        <div className="flex items-center gap-2">
                          Servidor Destino
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-blue-800 transition-colors"
                        onClick={() => handleSort('port')}
                      >
                        <div className="flex items-center gap-2">
                          Puerto
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-blue-800 transition-colors"
                        onClick={() => handleSort('protocol')}
                      >
                        <div className="flex items-center gap-2">
                          Protocolo
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-blue-800 transition-colors"
                        onClick={() => handleSort('serviceName')}
                      >
                        <div className="flex items-center gap-2">
                          Servicio
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-blue-800 transition-colors"
                        onClick={() => handleSort('sourceApp')}
                      >
                        <div className="flex items-center gap-2">
                          App Origen
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-blue-800 transition-colors"
                        onClick={() => handleSort('destinationApp')}
                      >
                        <div className="flex items-center gap-2">
                          App Destino
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedDependencies.map((dep, idx) => (
                      <tr 
                        key={idx} 
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">{dep.source || ''}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-900">{dep.destination || ''}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {dep.port !== null && (
                            <Badge variant="outline" className="font-mono">
                              {dep.port}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge 
                            variant="secondary"
                            className={
                              dep.protocol === 'TCP' ? 'bg-blue-100 text-blue-800' :
                              dep.protocol === 'UDP' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {dep.protocol || ''}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {dep.serviceName || ''}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {dep.sourceApp || ''}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {dep.destinationApp || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, sortedDependencies.length)} de {sortedDependencies.length} dependencias
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Dependencias</div>
                <div className="text-2xl font-bold text-blue-900">{allDependencies.length}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Filtradas</div>
                <div className="text-2xl font-bold text-green-900">{sortedDependencies.length}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Protocolos Únicos</div>
                <div className="text-2xl font-bold text-purple-900">
                  {new Set(allDependencies.map(d => d.protocol)).size}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium">Puertos Únicos</div>
                <div className="text-2xl font-bold text-orange-900">
                  {new Set(allDependencies.filter(d => d.port !== null).map(d => d.port)).size}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graph Visualization */}
      {nodes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Visualización de Dependencias</CardTitle>
              {sessionId && (
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
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Leyenda de Nodos:</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Servidores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Aplicaciones</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Leyenda de Conexiones:</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-blue-500"></div>
                    <span>HTTP/HTTPS (80, 443, 8080)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-green-500"></div>
                    <span>Bases de Datos (3306, 5432)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-orange-500"></div>
                    <span>Cache (6379, 11211)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-gray-500"></div>
                    <span>Otros servicios</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Los nodos están organizados en capas: arriba (fuentes), medio (procesamiento), abajo (almacenamiento). 
                Los números ↓↑ indican conexiones salientes/entrantes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!sessionId && (
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
