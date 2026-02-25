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
  const [databases, setDatabases] = useState<any[]>([]);
  const [databasesWithoutDeps, setDatabasesWithoutDeps] = useState<any[]>([]);
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
        setDatabases(data.databases || []);
        setDatabasesWithoutDeps(data.databasesWithoutDependencies || []);

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
      console.log(`📄 Exportando a ${format}...`);
      const response = await apiClient.post('/api/dependencies/export', {
        sessionId,
        searchTerm: searchResult?.server || null,
        format,
      }, {
        responseType: 'blob', // Important for binary data
      });

      console.log('✅ Respuesta recibida:', {
        status: response.status,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        dataType: typeof response.data,
        dataSize: response.data.size || response.data.length,
      });

      // Verify we received blob data
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }

      // Create blob with correct MIME type
      const mimeType = format === 'pdf' 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      const blob = new Blob([response.data], { type: mimeType });
      
      console.log('📦 Blob creado:', {
        size: blob.size,
        type: blob.type,
      });

      if (blob.size === 0) {
        throw new Error('El archivo generado está vacío');
      }
      
      const url = window.URL.createObjectURL(blob);
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `dependencias_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      console.log('💾 Descargando archivo:', filename);
      
      // Create download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Append to body, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup after download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        console.log('🧹 URL limpiado');
      }, 100);

      toast.success(`Reporte ${format === 'pdf' ? 'PDF' : 'Word'} generado exitosamente`, {
        description: `El archivo ${filename} se ha descargado.`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error('❌ Export error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      toast.error('Error al exportar', {
        description: error.response?.data?.error || error.message || 'Error desconocido',
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
  
  const incompleteDependencies = filteredDependencies.filter(
    dep => !dep.destination || dep.destination.trim() === '' || dep.port === null
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

    // Classify nodes into layers based on their role
    const sourceNodes: DependencyNode[] = []; // Nodes with only outgoing connections
    const intermediateNodes: DependencyNode[] = []; // Nodes with both incoming and outgoing
    const destinationNodes: DependencyNode[] = []; // Nodes with only incoming connections
    const isolatedNodes: DependencyNode[] = []; // Nodes with no connections
    
    graph.nodes.forEach(node => {
      const incoming = incomingCount.get(node.id) || 0;
      const outgoing = outgoingCount.get(node.id) || 0;
      
      if (incoming === 0 && outgoing === 0) {
        isolatedNodes.push(node);
      } else if (incoming === 0 && outgoing > 0) {
        sourceNodes.push(node);
      } else if (incoming > 0 && outgoing === 0) {
        destinationNodes.push(node);
      } else {
        intermediateNodes.push(node);
      }
    });

    // Create hierarchical layout
    const flowNodes: Node[] = [];
    const layerSpacing = 300;
    const nodeSpacing = 180;
    let currentY = 100;

    // Helper function to create nodes in a layer
    const createLayerNodes = (nodes: DependencyNode[], layerName: string, color: string, y: number) => {
      const layerWidth = nodes.length * nodeSpacing;
      const startX = Math.max(100, (1200 - layerWidth) / 2);
      
      nodes.forEach((node, index) => {
        const totalConnections = (incomingCount.get(node.id) || 0) + (outgoingCount.get(node.id) || 0);
        const nodeSize = Math.min(120, 60 + (totalConnections * 5));
        
        flowNodes.push({
          id: node.id,
          type: 'default',
          data: {
            label: (
              <div className="text-center p-2">
                <div className="font-bold text-sm mb-1" style={{ wordBreak: 'break-word' }}>
                  {node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label}
                </div>
                {node.group && (
                  <div className="text-xs text-gray-300 mb-1">{node.group}</div>
                )}
                <div className="flex items-center justify-center gap-2 text-xs">
                  {(incomingCount.get(node.id) || 0) > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded">
                      ↓ {incomingCount.get(node.id)}
                    </span>
                  )}
                  {(outgoingCount.get(node.id) || 0) > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded">
                      ↑ {outgoingCount.get(node.id)}
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
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '8px',
            minWidth: `${nodeSize}px`,
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
            fontSize: '12px',
          },
        });
      });
    };

    // Layer 1: Source nodes (top)
    if (sourceNodes.length > 0) {
      createLayerNodes(sourceNodes, 'Origen', '#10b981', currentY);
      currentY += layerSpacing;
    }

    // Layer 2: Intermediate nodes (middle)
    if (intermediateNodes.length > 0) {
      createLayerNodes(intermediateNodes, 'Intermedios', '#3b82f6', currentY);
      currentY += layerSpacing;
    }

    // Layer 3: Destination nodes (bottom)
    if (destinationNodes.length > 0) {
      createLayerNodes(destinationNodes, 'Destino', '#8b5cf6', currentY);
      currentY += layerSpacing;
    }

    // Layer 4: Isolated nodes (if any)
    if (isolatedNodes.length > 0) {
      createLayerNodes(isolatedNodes, 'Aislados', '#6b7280', currentY);
    }

    // Create edges with clear visual hierarchy
    const flowEdges: Edge[] = graph.edges.map((edge, index) => {
      // Determine edge properties based on connection type
      let edgeColor = '#94a3b8';
      let edgeWidth = 2;
      let animated = false;
      
      // Color by protocol/port
      if (edge.port !== null) {
        if (edge.port === 80 || edge.port === 443 || edge.port === 8080) {
          edgeColor = '#3b82f6'; // Blue for HTTP/HTTPS
          animated = true;
        } else if (edge.port === 3306 || edge.port === 5432 || edge.port === 1433) {
          edgeColor = '#10b981'; // Green for databases
        } else if (edge.port === 6379 || edge.port === 11211) {
          edgeColor = '#f59e0b'; // Orange for cache
        } else if (edge.port === 22 || edge.port === 3389) {
          edgeColor = '#ef4444'; // Red for remote access
        }
      }
      
      // Thicker edges for high-traffic connections
      const sourceConnections = (outgoingCount.get(edge.from) || 0);
      if (sourceConnections > 5) {
        edgeWidth = 3;
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
          width: 20,
          height: 20,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          opacity: 0.7,
        },
        labelStyle: {
          fill: '#1f2937',
          fontWeight: 700,
          fontSize: 11,
          backgroundColor: 'white',
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 3] as [number, number],
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
                  Conexiones de Servidores sin Puerto
                  <Badge variant="secondary" className="ml-auto bg-orange-600 text-white">
                    {sortedIncompleteDependencies.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-orange-700 mt-1">
                  Servidores sin puerto o sin destino definido
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
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Capas del Grafo:</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Servidores Origen (solo envían)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Servidores Intermedios (envían y reciben)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Servidores Destino (solo reciben)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <span>Servidores Aislados (sin conexiones)</span>
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
                <strong>💡 Organización:</strong> El grafo está organizado en capas jerárquicas de arriba hacia abajo: 
                Servidores Origen (verde) → Intermedios (azul) → Destino (morado). 
                Las conexiones animadas indican tráfico HTTP/HTTPS de alta prioridad.
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
