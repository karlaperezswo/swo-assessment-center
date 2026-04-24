import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Network, Server, Database, AlertCircle, FileText, ChevronLeft, ChevronRight, Filter, ArrowUpDown, FileDown, Layers, Image as ImageIcon, Code } from 'lucide-react';
import { toast } from 'sonner';
import { DatabaseDependencyMap } from './DatabaseDependencyMap';
import { useTranslation } from '@/i18n/useTranslation';
import { AppDependencyMap } from './AppDependencyMap';

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
  sourceHostname?: string;
  targetHostname?: string;
  clientProcess?: string;
  clientGroup?: string;
  serverProcess?: string;
  serverGroup?: string;
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

// ─── D3 Force-Directed Graph (networkx-style) ────────────────────────────────
interface ForceGraphProps {
  nodes: import('reactflow').Node[];
  edges: import('reactflow').Edge[];
  svgRef?: React.RefObject<SVGSVGElement>;
}

function ForceGraph({ nodes: rfNodes, edges: rfEdges, svgRef: externalRef }: ForceGraphProps) {
  const internalRef = useRef<SVGSVGElement>(null);
  const svgRef = externalRef ?? internalRef;

  useEffect(() => {
    if (!svgRef.current || rfNodes.length === 0) return;

    const container = svgRef.current.parentElement!;
    const W = container.clientWidth || 960;
    const H = 720;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H)
      .style('background', '#ffffff');

    // Defs: arrow markers per color
    const defs = svg.append('defs');

    const arrowColors = ['#4f86c6', '#e05c5c', '#5cb85c', '#f0ad4e', '#9b59b6', '#94a3b8'];
    arrowColors.forEach((color, i) => {
      defs.append('marker')
        .attr('id', `arrow-${i}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    // Zoom & pan
    const g = svg.append('g');
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.05, 5])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Degree counts
    const inDeg = new Map<string, number>();
    const outDeg = new Map<string, number>();
    rfEdges.forEach(e => {
      outDeg.set(e.source, (outDeg.get(e.source) || 0) + 1);
      inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1);
    });
    const totalDeg = (id: string) => (inDeg.get(id) || 0) + (outDeg.get(id) || 0);

    // Assign color by level from ReactFlow node style
    const getColor = (nodeId: string) => {
      const n = rfNodes.find(n => n.id === nodeId);
      const bg = (n?.style?.background as string) ?? '';
      const match = bg.match(/#[0-9a-fA-F]{6}/);
      if (match) {
        // Map known colors to palette index for arrow marker
        const colorMap: Record<string, number> = {
          '#10b981': 2, '#06b6d4': 0, '#f59e0b': 3, '#3b82f6': 0, '#8b5cf6': 4,
        };
        return { fill: match[0], arrowIdx: colorMap[match[0]] ?? 5 };
      }
      return { fill: '#4f86c6', arrowIdx: 0 };
    };

    // Simulation nodes
    const simNodes: any[] = rfNodes.map(n => ({
      id: n.id,
      label: n.id,
      ...getColor(n.id),
      r: Math.max(18, Math.min(42, 18 + totalDeg(n.id) * 2.2)),
    }));

    const nodeById = new Map(simNodes.map(n => [n.id, n]));

    // Simulation links
    const simLinks: any[] = rfEdges
      .filter(e => nodeById.has(e.source) && nodeById.has(e.target))
      .map(e => ({
        source: e.source,
        target: e.target,
        label: e.label ? String(e.label) : '',
        color: (e.style?.stroke as string) ?? '#94a3b8',
        arrowIdx: 5,
      }));

    // Force simulation — spring layout (like networkx spring_layout)
    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id)
        .distance((d: any) => {
          const src = nodeById.get(typeof d.source === 'string' ? d.source : d.source.id);
          const tgt = nodeById.get(typeof d.target === 'string' ? d.target : d.target.id);
          return 100 + ((src?.r ?? 20) + (tgt?.r ?? 20));
        })
        .strength(0.35))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.r + 14));

    // ── Draw edges ──────────────────────────────────────────────────────────
    const linkG = g.append('g').attr('class', 'links');

    const link = linkG.selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.65)
      .attr('marker-end', d => `url(#arrow-${d.arrowIdx})`);

    // Edge labels (port/protocol)
    const linkLabel = linkG.selectAll('text.edge-label')
      .data(simLinks.filter(d => d.label))
      .join('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', 8)
      .attr('fill', '#6b7280')
      .attr('pointer-events', 'none')
      .text(d => d.label);

    // ── Draw nodes ──────────────────────────────────────────────────────────
    const nodeG = g.append('g').attr('class', 'nodes');

    const node = nodeG.selectAll<SVGGElement, any>('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'grab')
      .call(
        d3.drag<SVGGElement, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (_event, d) => {
            if (!_event.active) simulation.alphaTarget(0);
            // Mantener el nodo fijo donde se soltó (no volver al centro)
            d.fx = d.x;
            d.fy = d.y;
          })
      );

    // Circle
    node.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => d.fill)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .style('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.22))');

    // Degree count inside circle
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', d => Math.max(9, Math.min(14, d.r * 0.52)))
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => totalDeg(d.id) > 0 ? totalDeg(d.id) : '');

    // Label below node (networkx-style: text outside the circle)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.r + 13)
      .attr('fill', '#111827')
      .attr('font-size', 10)
      .attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .text(d => d.label.length > 20 ? d.label.slice(0, 19) + '…' : d.label);

    // ── Tooltip ─────────────────────────────────────────────────────────────
    const tip = d3.select(container).select<HTMLDivElement>('.d3-tooltip').empty()
      ? d3.select(container).append('div')
          .attr('class', 'd3-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(17,24,39,0.93)')
          .style('color', '#f9fafb')
          .style('padding', '7px 12px')
          .style('border-radius', '7px')
          .style('font-size', '11px')
          .style('pointer-events', 'none')
          .style('opacity', '0')
          .style('z-index', '20')
          .style('max-width', '220px')
          .style('line-height', '1.5')
      : d3.select(container).select<HTMLDivElement>('.d3-tooltip');

    node
      .on('mouseover', (_event, d) => {
        tip.style('opacity', '1')
          .html(
            `<strong>${d.label}</strong><br/>` +
            `Entrantes: <b>${inDeg.get(d.id) || 0}</b> &nbsp; Salientes: <b>${outDeg.get(d.id) || 0}</b><br/>` +
            `Total conexiones: <b>${totalDeg(d.id)}</b>`
          );
      })
      .on('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        tip.style('left', (event.clientX - rect.left + 14) + 'px')
           .style('top',  (event.clientY - rect.top  - 32) + 'px');
      })
      .on('mouseout', () => tip.style('opacity', '0'));

    // ── Tick ────────────────────────────────────────────────────────────────
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return d.target.x - (dx / dist) * (d.target.r + 3);
        })
        .attr('y2', (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return d.target.y - (dy / dist) * (d.target.r + 3);
        });

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 4);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [rfNodes, rfEdges]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '720px' }}
         className="border rounded-xl overflow-hidden bg-white shadow-inner">
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      {/* Zoom hint */}
      <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: '#9ca3af', pointerEvents: 'none' }}>
        🖱 Rueda = zoom &nbsp;|&nbsp; Arrastra nodos o fondo para mover &nbsp;|&nbsp; Nodos fijos al soltar
      </div>
    </div>
  );
}


// ── Server type detector ──────────────────────────────────────────────────────
function getServerTypeInfo(name: string): { icon: string; label: string; color: string; bg: string } {
  const s = name.toLowerCase();
  if (/web|http|nginx|apache|iis|tomcat|frontend|portal|site|www/.test(s))
    return { icon: '🖥️', label: 'Web', color: '#0891b2', bg: '#e0f2fe' };
  if (/db|database|sql|oracle|mysql|postgres|mongo|redis|elastic|mssql/.test(s))
    return { icon: '🗄️', label: 'Base de Datos', color: '#b45309', bg: '#fef3c7' };
  if (/api|rest|gateway|svc|service|microservice/.test(s))
    return { icon: '🖧', label: 'API / Servicio', color: '#0f766e', bg: '#ccfbf1' };
  if (/mail|exchange|smtp|outlook/.test(s))
    return { icon: '🖥️', label: 'Correo', color: '#1d4ed8', bg: '#dbeafe' };
  if (/file|ftp|sftp|nas|storage|backup|bkp/.test(s))
    return { icon: '🗃️', label: 'Almacenamiento', color: '#92400e', bg: '#fef3c7' };
  if (/monitor|log|kibana|grafana|splunk|datadog|prometheus/.test(s))
    return { icon: '🖥️', label: 'Monitoreo', color: '#065f46', bg: '#d1fae5' };
  if (/auth|sso|ldap|ad[-_]|active.?dir|identity|iam|keycloak/.test(s))
    return { icon: '🖥️', label: 'Autenticación', color: '#7c3aed', bg: '#ede9fe' };
  if (/proxy|lb|load.?bal|haproxy|f5|nginx/.test(s))
    return { icon: '🖧', label: 'Proxy / LB', color: '#0284c7', bg: '#e0f2fe' };
  if (/app|apl|srv|svr/.test(s))
    return { icon: '🖥️', label: 'App Server', color: '#475569', bg: '#f1f5f9' };
  return { icon: '🖥️', label: 'Servidor', color: '#334155', bg: '#f8fafc' };
}

export function DependencyMap({ dependencyData }: DependencyMapProps) {
  const { t } = useTranslation();
  const [activeMainTab, setActiveMainTab] = useState<'servers' | 'databases' | 'apps'>('servers');
  const [summary, setSummary] = useState<DependencySummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [allServers, setAllServers] = useState<string[]>([]);
  const [allDependencies, setAllDependencies] = useState<NetworkDependency[]>([]);
  const [allDatabases, setAllDatabases] = useState<any[]>([]);
  const [databasesWithoutDeps, setDatabasesWithoutDeps] = useState<any[]>([]);
  const [allAppDependencies, setAllAppDependencies] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  const forceSvgRef = useRef<SVGSVGElement>(null);
  const [isExportingGraph, setIsExportingGraph] = useState(false);

  // ── Captura el SVG del grafo D3 tal como se ve en pantalla ─────────────────
  const captureSvgAsDataUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const svgEl = forceSvgRef.current;
      if (!svgEl) { reject(new Error('SVG no disponible')); return; }

      // Clonar el SVG para no modificar el original
      const clone = svgEl.cloneNode(true) as SVGSVGElement;

      // Asegurar fondo blanco en el clon
      clone.style.background = '#ffffff';
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Obtener dimensiones reales
      const bbox = svgEl.getBoundingClientRect();
      const W = bbox.width || 960;
      const H = bbox.height || 720;
      clone.setAttribute('width', String(W));
      clone.setAttribute('height', String(H));

      // Serializar a string
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Escala 2x para mejor resolución
        canvas.width = W * 2;
        canvas.height = H * 2;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, W, H);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  };

  const exportGraphToPDF = async () => {
    if (nodes.length === 0) { toast.error(t('dependencyGraph.noGraphToExport')); return; }
    setIsExportingGraph(true);
    toast.loading(t('dependencyGraph.generatingPdf'), { id: 'graph-export' });
    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const imgData = await captureSvgAsDataUrl();

      const svgEl = forceSvgRef.current!;
      const bbox = svgEl.getBoundingClientRect();
      const srcRatio = bbox.width / bbox.height;

      // Página A3 landscape para máximo espacio
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const headerH = 20;

      // Header
      pdf.setFillColor(30, 64, 175);
      pdf.rect(0, 0, pageW, headerH, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mapa de Dependencias de Red', margin, 9);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const label = searchResult ? `Servidor: ${searchResult.server}` : 'Vista completa';
      pdf.text(`${label}   |   ${new Date().toLocaleString('es-ES')}   |   ${nodes.length} nodos · ${edges.length} conexiones`, margin, 16);

      // Imagen: ocupa todo el espacio disponible manteniendo ratio
      const maxW = pageW - margin * 2;
      const maxH = pageH - headerH - margin * 2;
      let imgW = maxW;
      let imgH = imgW / srcRatio;
      if (imgH > maxH) { imgH = maxH; imgW = imgH * srcRatio; }
      const imgX = margin + (maxW - imgW) / 2;
      pdf.addImage(imgData, 'PNG', imgX, headerH + margin / 2, imgW, imgH);

      const filename = `mapa_dependencias_${searchResult?.server ?? 'completo'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      toast.success(t('dependencyGraph.pdfGenerated'), { id: 'graph-export', duration: 4000 });
    } catch (err) {
      console.error(err);
      toast.error(t('dependencyGraph.errorGeneratingPdf'), { id: 'graph-export' });
    } finally {
      setIsExportingGraph(false);
    }
  };

  const exportGraphToPNG = async () => {
    if (nodes.length === 0) { toast.error('No hay grafo para exportar'); return; }
    setIsExportingGraph(true);
    toast.loading('Generando PNG...', { id: 'graph-export-png' });
    try {
      const dataUrl = await captureSvgAsDataUrl();
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `mapa_dependencias_${searchResult?.server ?? 'completo'}_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PNG descargado', { id: 'graph-export-png', duration: 3000 });
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PNG', { id: 'graph-export-png' });
    } finally {
      setIsExportingGraph(false);
    }
  };

  const exportGraphToSVG = () => {
    if (nodes.length === 0 || !forceSvgRef.current) {
      toast.error('No hay grafo para exportar');
      return;
    }
    try {
      const clone = forceSvgRef.current.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.style.background = '#ffffff';
      const bbox = forceSvgRef.current.getBoundingClientRect();
      clone.setAttribute('width', String(bbox.width || 960));
      clone.setAttribute('height', String(bbox.height || 720));
      const svgStr = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mapa_dependencias_${searchResult?.server ?? 'completo'}_${new Date().toISOString().split('T')[0]}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('SVG descargado', { duration: 3000 });
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el SVG');
    }
  };

  const exportGraphToWord = async () => {
    if (nodes.length === 0) { toast.error(t('dependencyGraph.noGraphToExport')); return; }
    setIsExportingGraph(true);
    toast.loading(t('dependencyGraph.generatingWord'), { id: 'graph-export-word' });
    try {
      const imgData = await captureSvgAsDataUrl();
      const label = searchResult ? `Servidor: ${searchResult.server}` : 'Vista completa';
      const date = new Date().toLocaleString('es-ES');

      const incomingRows = (searchResult?.dependencies.incoming ?? []).map(d =>
        `<tr><td>${d.source}</td><td>${d.port ?? '-'}</td><td>${d.protocol}</td><td>${d.serviceName ?? '-'}</td></tr>`
      ).join('');
      const outgoingRows = (searchResult?.dependencies.outgoing ?? []).map(d =>
        `<tr><td>${d.destination}</td><td>${d.port ?? '-'}</td><td>${d.protocol}</td><td>${d.serviceName ?? '-'}</td></tr>`
      ).join('');

      // La imagen se ajusta al ancho de la hoja (max-width: 100%) sin desbordarse
      const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>Mapa de Dependencias</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 1.5cm 2cm; color: #1f2937; }
    .header { background: #1e40af; color: white; padding: 12px 16px; margin-bottom: 14px; }
    .header h1 { margin: 0; font-size: 16pt; }
    .header p  { margin: 3px 0 0; font-size: 9pt; opacity: 0.85; }
    .stats { margin-bottom: 14px; }
    .stats table { width: auto; border-collapse: collapse; }
    .stats td { padding: 6px 14px; background: #eff6ff; border: 1px solid #bfdbfe; text-align: center; }
    .stats .num { font-size: 16pt; font-weight: bold; color: #1d4ed8; display: block; }
    .stats .lbl { font-size: 8pt; color: #6b7280; }
    h2 { color: #1e40af; font-size: 12pt; border-bottom: 2px solid #bfdbfe; padding-bottom: 3px; margin-top: 18px; }
    /* Imagen ajustada a la hoja */
    .graph-img { width: 100%; max-width: 100%; height: auto; border: 1px solid #e5e7eb; display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 6px; }
    thead tr { background: #1d4ed8; color: white; }
    th, td { padding: 5px 8px; border: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 8pt; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Mapa de Dependencias de Red</h1>
    <p>${label} &nbsp;|&nbsp; ${date} &nbsp;|&nbsp; ${nodes.length} nodos · ${edges.length} conexiones</p>
  </div>

  <div class="stats">
    <table><tr>
      <td><span class="num">${nodes.length}</span><span class="lbl">Nodos</span></td>
      <td><span class="num">${edges.length}</span><span class="lbl">Conexiones</span></td>
      <td><span class="num">${summary?.uniqueServers ?? '-'}</span><span class="lbl">Servidores</span></td>
      <td><span class="num">${summary?.uniquePorts ?? '-'}</span><span class="lbl">Puertos</span></td>
    </tr></table>
  </div>

  <h2>Diagrama de Dependencias</h2>
  <img class="graph-img" src="${imgData}" alt="Mapa de dependencias" />

  ${searchResult ? `
  <h2>Conexiones Entrantes (${searchResult.dependencies.incoming.length})</h2>
  <table>
    <thead><tr><th>Servidor Origen</th><th>Puerto</th><th>Protocolo</th><th>Servicio</th></tr></thead>
    <tbody>${incomingRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af">Sin conexiones</td></tr>'}</tbody>
  </table>
  <h2>Conexiones Salientes (${searchResult.dependencies.outgoing.length})</h2>
  <table>
    <thead><tr><th>Servidor Destino</th><th>Puerto</th><th>Protocolo</th><th>Servicio</th></tr></thead>
    <tbody>${outgoingRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af">Sin conexiones</td></tr>'}</tbody>
  </table>
  ` : ''}

  <div class="footer">© ${new Date().getFullYear()} SoftwareOne – AWS Migration Assessment Platform</div>
</body>
</html>`;

      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mapa_dependencias_${searchResult?.server ?? 'completo'}_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t('dependencyGraph.wordGenerated'), { id: 'graph-export-word', duration: 4000 });
    } catch (err) {
      console.error(err);
      toast.error(t('dependencyGraph.errorGeneratingWord'), { id: 'graph-export-word' });
    } finally {
      setIsExportingGraph(false);
    }
  };

  // Load dependency data automatically when provided
  useEffect(() => {
    if (dependencyData) {
      console.log('✅ Cargando dependencias automáticamente desde archivo MPA');
      setSummary(dependencyData.summary);
      setAllServers(dependencyData.servers || []);
      setAllDependencies(dependencyData.dependencies || []);
      setDatabasesWithoutDeps(dependencyData.databasesWithoutDependencies || []);
      setAllDatabases(dependencyData.databases || []);
      setAllAppDependencies(dependencyData.appDependencies || []);
      
      // Build and display graph
      if (dependencyData.dependencies && dependencyData.dependencies.length > 0) {
        const graph = buildGraphFromDependencies(dependencyData.dependencies);
        displayGraph(graph);
      }
      
      // No mostrar toast aquí - ya se muestra en FileUploader
      // toast.success('Dependencias cargadas automáticamente', {
      //   description: `${dependencyData.summary.totalDependencies} dependencias, ${dependencyData.summary.uniqueServers} servidores`,
      //   duration: 4000
      // });
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
      toast.error(t('dependencyGraph.enterSearchTerm'));
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
        toast.warning(t('dependencyGraph.serverNotFound'));
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

      toast.success(t('dependencyGraph.serverFound', { server: matchingServer }), {
        description: `${incoming.length} entrantes, ${outgoing.length} salientes`,
        duration: 4000
      });
    } catch (error) {
      console.error('Search error:', error);
      toast.error(t('dependencyGraph.searchError'));
    } finally {
      setIsSearching(false);
    }
  };

  // ── Shared helpers ──────────────────────────────────────────────────────────
  const fileDate = new Date().toISOString().split('T')[0];
  const dateStr  = new Date().toLocaleString('es-ES');

  const captureSvgPng = (): Promise<string | null> => {
    return new Promise(resolve => {
      const svgEl = forceSvgRef.current;
      if (!svgEl) { resolve(null); return; }
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.style.background = '#ffffff';
      const bbox = svgEl.getBoundingClientRect();
      const W = bbox.width || 960; const H = bbox.height || 720;
      clone.setAttribute('width', String(W)); clone.setAttribute('height', String(H));
      const svgStr = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = W * 2; c.height = H * 2;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.scale(2, 2); ctx.drawImage(img, 0, 0, W, H);
        URL.revokeObjectURL(url); resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  };

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const exportServersPDF = async () => {
    if (!summary) { toast.error(t('dependencyGraph.noDataToExport')); return; }
    setIsExporting(true);
    toast.loading(t('dependencyGraph.generatingSrvPdf'), { id: 'srv-pdf' });
    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pW = pdf.internal.pageSize.getWidth();   // 297
      const pH = pdf.internal.pageSize.getHeight();  // 210
      const M = 12;

      const drawHeader = (title: string, subtitle: string) => {
        // Fondo degradado simulado
        pdf.setFillColor(15, 118, 110); pdf.rect(0, 0, pW, 28, 'F');
        pdf.setFillColor(8, 145, 178);  pdf.rect(pW * 0.55, 0, pW * 0.45, 28, 'F');
        pdf.setFillColor(2, 132, 199);  pdf.rect(pW * 0.8, 0, pW * 0.2, 28, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
        pdf.text(title, M, 12);
        pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
        pdf.text(subtitle, M, 19);
        pdf.text(`Generado: ${dateStr}`, pW - M, 19, { align: 'right' });
      };

      // ── Página 1: Portada + Stats + Tabla ──────────────────────────────
      drawHeader('Dependencias de Servidores', 'AWS Migration Assessment Platform — SoftwareOne');

      // Stats cards
      const stats = [
        { label: 'Total Dependencias', value: String(summary.totalDependencies) },
        { label: 'Servidores Únicos',  value: String(summary.uniqueServers) },
        { label: 'Aplicaciones',       value: String(summary.uniqueApplications) },
        { label: 'Puertos Únicos',     value: String(summary.uniquePorts) },
      ];
      const cW = (pW - M * 2 - 9) / 4;
      let sx = M;
      stats.forEach(s => {
        pdf.setFillColor(240, 253, 250); pdf.rect(sx, 32, cW, 14, 'F');
        pdf.setDrawColor(153, 246, 228); pdf.rect(sx, 32, cW, 14, 'S');
        pdf.setTextColor(15, 118, 110); pdf.setFontSize(15); pdf.setFont('helvetica', 'bold');
        pdf.text(s.value, sx + cW / 2, 40, { align: 'center' });
        pdf.setTextColor(8, 145, 178); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
        pdf.text(s.label, sx + cW / 2, 44, { align: 'center' });
        sx += cW + 3;
      });

      // Tabla de conexiones
      const deps = sortedCompleteDependencies;
      const colW = [52, 52, 18, 22, 50, 50, 30];
      const hdrs = ['Servidor Origen', 'Servidor Destino', 'Puerto', 'Protocolo', 'Proceso Destino', 'Proceso Cliente', 'Tipo'];
      const tX = M; const tW = pW - M * 2;
      let y = 50;

      // Header row
      pdf.setFillColor(15, 118, 110); pdf.rect(tX, y, tW, 7, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
      let cx = tX + 2;
      hdrs.forEach((h, i) => { pdf.text(h, cx, y + 5); cx += colW[i]; });
      y += 8;

      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5);
      deps.forEach((dep, idx) => {
        if (y > pH - 12) {
          pdf.addPage();
          pdf.setFillColor(15, 118, 110); pdf.rect(tX, 8, tW, 7, 'F');
          pdf.setTextColor(255, 255, 255); pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
          cx = tX + 2; hdrs.forEach((h, i) => { pdf.text(h, cx, 13); cx += colW[i]; });
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5);
          y = 18;
        }
        if (idx % 2 === 0) { pdf.setFillColor(240, 253, 250); pdf.rect(tX, y - 1, tW, 6.5, 'F'); }
        const srcType = getServerTypeInfo(dep.source);
        const dstType = getServerTypeInfo(dep.destination);
        // Badge de color con etiqueta ASCII legible (sin emojis para PDF)
        const drawBadge = (lbl: string, hex: string, bx: number, by: number) => {
          const r2 = parseInt(hex.slice(1,3),16), g2 = parseInt(hex.slice(3,5),16), b2 = parseInt(hex.slice(5,7),16);
          pdf.setFillColor(r2,g2,b2); pdf.roundedRect(bx,by,13,3.5,0.8,0.8,'F');
          pdf.setTextColor(255,255,255); pdf.setFontSize(5); pdf.setFont('helvetica','bold');
          pdf.text(lbl, bx+6.5, by+2.6, {align:'center'});
        };
        const colorMap: Record<string,string> = {
          'Web':'#0891b2','Base de Datos':'#b45309','API / Servicio':'#0f766e',
          'Correo':'#1d4ed8','Almacenamiento':'#92400e','Monitoreo':'#065f46',
          'Autenticaci\u00f3n':'#7c3aed','Proxy / LB':'#0284c7','App Server':'#475569','Servidor':'#334155'
        };
        const shortMap: Record<string,string> = {
          'Web':'WEB','Base de Datos':'DB','API / Servicio':'API',
          'Correo':'MAIL','Almacenamiento':'FILE','Monitoreo':'MON',
          'Autenticaci\u00f3n':'AUTH','Proxy / LB':'LB','App Server':'APP','Servidor':'SRV'
        };
        cx = tX + 2;
        // Origen: badge + nombre
        drawBadge(shortMap[srcType.label]??'SRV', colorMap[srcType.label]??'#334155', cx, y+0.5);
        pdf.setTextColor(15,23,42); pdf.setFontSize(6.5); pdf.setFont('helvetica','normal');
        const srcTxt = dep.source.length>20 ? dep.source.slice(0,19)+'...' : dep.source;
        pdf.text(srcTxt, cx+14, y+4);
        cx += colW[0];
        // Destino: badge + nombre
        drawBadge(shortMap[dstType.label]??'SRV', colorMap[dstType.label]??'#334155', cx, y+0.5);
        pdf.setTextColor(15,23,42); pdf.setFontSize(6.5); pdf.setFont('helvetica','normal');
        const dstTxt = dep.destination.length>20 ? dep.destination.slice(0,19)+'...' : dep.destination;
        pdf.text(dstTxt, cx+14, y+4);
        cx += colW[1];
        // Resto de columnas
        const rest2 = [
          dep.port !== null ? String(dep.port) : '-',
          dep.protocol || '-',
          (dep as any).targetProcessId || dep.serviceName || '-',
          dep.clientProcess || '-',
          srcType.label,
        ];
        rest2.forEach((v, i) => {
          const maxC = Math.floor(colW[i+2] / 1.5);
          const txt = v.length > maxC ? v.slice(0, maxC-1) + '...' : v;
          pdf.setTextColor(15,23,42); pdf.setFontSize(6.5); pdf.setFont('helvetica','normal');
          pdf.text(txt, cx, y+4); cx += colW[i+2];
        });
        y += 6.5;
      });

      // ── Página: Grafo ───────────────────────────────────────────────────
      const imgData = await captureSvgPng();
      if (imgData && nodes.length > 0) {
        pdf.addPage();
        drawHeader('Grafo de Dependencias de Servidores', `${nodes.length} nodos · ${edges.length} conexiones`);
        const svgBbox = forceSvgRef.current!.getBoundingClientRect();
        const ratio = svgBbox.width / svgBbox.height;
        const maxW = pW - M * 2; const maxH = pH - 36;
        let iW = maxW; let iH = iW / ratio;
        if (iH > maxH) { iH = maxH; iW = iH * ratio; }
        pdf.addImage(imgData, 'PNG', M + (maxW - iW) / 2, 32, iW, iH);
      }

      // ── Página: Búsqueda (si hay resultado) ────────────────────────────
      if (searchResult) {
        pdf.addPage();
        drawHeader(`Análisis de Servidor: ${searchResult.server}`, `${searchResult.dependencies.incoming.length} entrantes · ${searchResult.dependencies.outgoing.length} salientes`);
        let sy = 34;
        const halfW = (pW - M * 2 - 6) / 2;

        // Entrantes
        pdf.setFillColor(6, 78, 59); pdf.rect(M, sy, halfW, 7, 'F');
        pdf.setTextColor(255,255,255); pdf.setFontSize(8); pdf.setFont('helvetica','bold');
        pdf.text(`⬇ Conexiones Entrantes (${searchResult.dependencies.incoming.length})`, M + 3, sy + 5);
        sy += 8;
        pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5); pdf.setTextColor(15,23,42);
        searchResult.dependencies.incoming.forEach((d, i) => {
          if (sy > pH - 12) return;
          if (i % 2 === 0) { pdf.setFillColor(240,253,250); pdf.rect(M, sy-1, halfW, 6, 'F'); }
          const t = getServerTypeInfo(d.source);
          const tShort = ({'Web':'WEB','Base de Datos':'DB','API / Servicio':'API','Correo':'MAIL','Almacenamiento':'FILE','Monitoreo':'MON','Autenticación':'AUTH','Proxy / LB':'LB','App Server':'APP','Servidor':'SRV'} as Record<string,string>)[t.label]??'SRV';
          const tHex = ({'Web':'#0891b2','Base de Datos':'#b45309','API / Servicio':'#0f766e','Correo':'#1d4ed8','Almacenamiento':'#92400e','Monitoreo':'#065f46','Autenticación':'#7c3aed','Proxy / LB':'#0284c7','App Server':'#475569','Servidor':'#334155'} as Record<string,string>)[t.label]??'#334155';
          const tR=parseInt(tHex.slice(1,3),16),tG=parseInt(tHex.slice(3,5),16),tB=parseInt(tHex.slice(5,7),16);
          pdf.setFillColor(tR,tG,tB); pdf.roundedRect(M+2,sy+0.3,11,3.2,0.7,0.7,'F');
          pdf.setTextColor(255,255,255); pdf.setFontSize(4.5); pdf.setFont('helvetica','bold');
          pdf.text(tShort, M+7.5, sy+2.5, {align:'center'});
          pdf.setTextColor(15,23,42); pdf.setFontSize(6.5); pdf.setFont('helvetica','normal');
          const srcName = d.source.length>22 ? d.source.slice(0,21)+'...' : d.source;
          pdf.text(srcName, M+14, sy+3.5);
          pdf.text(`${d.protocol}${d.port ? ':'+d.port : ''}`, M + halfW - 22, sy + 3.5);
          sy += 6;
        });

        // Salientes
        sy = 34;
        const sx2 = M + halfW + 6;
        pdf.setFillColor(30, 58, 95); pdf.rect(sx2, sy, halfW, 7, 'F');
        pdf.setTextColor(255,255,255); pdf.setFontSize(8); pdf.setFont('helvetica','bold');
        pdf.text(`⬆ Conexiones Salientes (${searchResult.dependencies.outgoing.length})`, sx2 + 3, sy + 5);
        sy += 8;
        pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5); pdf.setTextColor(15,23,42);
        searchResult.dependencies.outgoing.forEach((d, i) => {
          if (sy > pH - 12) return;
          if (i % 2 === 0) { pdf.setFillColor(239,246,255); pdf.rect(sx2, sy-1, halfW, 6, 'F'); }
          const t2 = getServerTypeInfo(d.destination);
          const tShort2 = ({'Web':'WEB','Base de Datos':'DB','API / Servicio':'API','Correo':'MAIL','Almacenamiento':'FILE','Monitoreo':'MON','Autenticación':'AUTH','Proxy / LB':'LB','App Server':'APP','Servidor':'SRV'} as Record<string,string>)[t2.label]??'SRV';
          const tHex2 = ({'Web':'#0891b2','Base de Datos':'#b45309','API / Servicio':'#0f766e','Correo':'#1d4ed8','Almacenamiento':'#92400e','Monitoreo':'#065f46','Autenticación':'#7c3aed','Proxy / LB':'#0284c7','App Server':'#475569','Servidor':'#334155'} as Record<string,string>)[t2.label]??'#334155';
          const tR2=parseInt(tHex2.slice(1,3),16),tG2=parseInt(tHex2.slice(3,5),16),tB2=parseInt(tHex2.slice(5,7),16);
          pdf.setFillColor(tR2,tG2,tB2); pdf.roundedRect(sx2+2,sy+0.3,11,3.2,0.7,0.7,'F');
          pdf.setTextColor(255,255,255); pdf.setFontSize(4.5); pdf.setFont('helvetica','bold');
          pdf.text(tShort2, sx2+7.5, sy+2.5, {align:'center'});
          pdf.setTextColor(15,23,42); pdf.setFontSize(6.5); pdf.setFont('helvetica','normal');
          const dstName = d.destination.length>22 ? d.destination.slice(0,21)+'...' : d.destination;
          pdf.text(dstName, sx2+14, sy+3.5);
          pdf.text(`${d.protocol}${d.port ? ':'+d.port : ''}`, sx2 + halfW - 22, sy + 3.5);
          sy += 6;
        });
      }

      // Footer en todas las páginas
      const total = (pdf as any).internal.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        pdf.setPage(p);
        pdf.setFillColor(248,250,252); pdf.rect(0, pH - 8, pW, 8, 'F');
        pdf.setDrawColor(226,232,240); pdf.line(0, pH - 8, pW, pH - 8);
        pdf.setTextColor(100,116,139); pdf.setFontSize(7); pdf.setFont('helvetica','normal');
        pdf.text('© SoftwareOne – AWS Migration Assessment Platform', M, pH - 3);
        pdf.text(`Página ${p} de ${total}`, pW - M, pH - 3, { align: 'right' });
      }

      pdf.save(`dependencias_servidores_${fileDate}.pdf`);
      toast.success(t('dependencyGraph.srvPdfGenerated'), { id: 'srv-pdf', duration: 4000 });
    } catch (e) { console.error(e); toast.error(t('dependencyGraph.errorGeneratingSrvPdf'), { id: 'srv-pdf' }); }
    finally { setIsExporting(false); }
  };

  // ── Export Word ─────────────────────────────────────────────────────────────
  const exportServersWord = async () => {
    if (!summary) { toast.error(t('dependencyGraph.noDataToExport')); return; }
    setIsExporting(true);
    toast.loading(t('dependencyGraph.generatingSrvWord'), { id: 'srv-word' });
    try {
      const imgData = await captureSvgPng();

      const tableRows = sortedCompleteDependencies.map((dep, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
        const srcT = getServerTypeInfo(dep.source);
        const dstT = getServerTypeInfo(dep.destination);
        return `<tr style="background:${bg}">
          <td style="padding:5px 8px;border:1px solid #e5e7eb">
            <span style="font-size:13px">${srcT.icon}</span>
            <span style="font-weight:700;color:#0f172a;margin-left:5px">${dep.source}</span><br/>
            <span style="font-size:9px;font-weight:600;padding:1px 5px;border-radius:3px;background:${srcT.bg};color:${srcT.color}">${srcT.label}</span>
          </td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb">
            <span style="font-size:13px">${dstT.icon}</span>
            <span style="font-weight:700;color:#0f172a;margin-left:5px">${dep.destination}</span><br/>
            <span style="font-size:9px;font-weight:600;padding:1px 5px;border-radius:3px;background:${dstT.bg};color:${dstT.color}">${dstT.label}</span>
          </td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;font-family:monospace;font-weight:700;color:#0f766e;background:#f0fdfa">${dep.port !== null ? dep.port : '—'}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center">
            <span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;background:${dep.protocol==='TCP'?'#dbeafe':dep.protocol==='UDP'?'#dcfce7':'#f1f5f9'};color:${dep.protocol==='TCP'?'#1d4ed8':dep.protocol==='UDP'?'#16a34a':'#475569'}">${dep.protocol||'—'}</span>
          </td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;color:#475569">${(dep as any).targetProcessId||dep.serviceName||'—'}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;color:#0891b2">${dep.clientProcess||'—'}</td>
        </tr>`;
      }).join('');

      const inRows = (searchResult?.dependencies.incoming ?? []).map((d, i) => {
        const t = getServerTypeInfo(d.source);
        return `<tr style="background:${i%2===0?'#fff':'#f0fdf4'}">
          <td style="padding:5px 8px;border:1px solid #e5e7eb"><span>${t.icon}</span> <b>${d.source}</b><br/><span style="font-size:9px;background:${t.bg};color:${t.color};padding:1px 5px;border-radius:3px">${t.label}</span></td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;font-family:monospace;color:#0f766e">${d.port??'—'}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb">${d.protocol}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;color:#64748b">${d.serviceName??'—'}</td>
        </tr>`;
      }).join('');

      const outRows = (searchResult?.dependencies.outgoing ?? []).map((d, i) => {
        const t = getServerTypeInfo(d.destination);
        return `<tr style="background:${i%2===0?'#fff':'#eff6ff'}">
          <td style="padding:5px 8px;border:1px solid #e5e7eb"><span>${t.icon}</span> <b>${d.destination}</b><br/><span style="font-size:9px;background:${t.bg};color:${t.color};padding:1px 5px;border-radius:3px">${t.label}</span></td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;font-family:monospace;color:#1d4ed8">${d.port??'—'}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb">${d.protocol}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;color:#64748b">${d.serviceName??'—'}</td>
        </tr>`;
      }).join('');

      const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>Dependencias de Servidores</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4 landscape; margin: 1.5cm 1.8cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 9pt; color: #1f2937; margin: 0; }
  .cover { background: linear-gradient(135deg,#0f766e,#0891b2,#0284c7); color:#fff; padding:18px 20px 14px; margin-bottom:16px; border-radius:4px; }
  .cover h1 { margin:0 0 4px; font-size:18pt; font-weight:bold; }
  .cover p  { margin:2px 0; font-size:9pt; opacity:.85; }
  .stats { display:table; width:100%; border-collapse:separate; border-spacing:8px; margin-bottom:14px; }
  .stat  { display:table-cell; background:#f0fdfa; border:1px solid #99f6e4; padding:8px 12px; text-align:center; width:25%; }
  .stat .n { font-size:20pt; font-weight:bold; color:#0f766e; display:block; }
  .stat .l { font-size:8pt; color:#0891b2; }
  h2 { color:#0f766e; font-size:12pt; border-bottom:2px solid #99f6e4; padding-bottom:4px; margin:18px 0 8px; }
  h3 { color:#0284c7; font-size:10pt; margin:14px 0 6px; }
  table.data { width:100%; border-collapse:collapse; font-size:8pt; }
  table.data thead tr { background:linear-gradient(90deg,#0f766e,#0891b2); color:#fff; }
  table.data th { padding:6px 8px; border:1px solid rgba(255,255,255,0.2); font-weight:bold; text-align:left; }
  table.data td { padding:5px 8px; border:1px solid #e5e7eb; vertical-align:middle; }
  .graph-img { width:100%; max-width:100%; height:auto; border:1px solid #e5e7eb; display:block; border-radius:6px; }
  .search-grid { display:table; width:100%; border-collapse:separate; border-spacing:10px; }
  .search-col  { display:table-cell; width:50%; vertical-align:top; }
  .in-hdr  { background:linear-gradient(90deg,#064e3b,#065f46); color:#fff; padding:7px 12px; font-weight:bold; font-size:9pt; border-radius:4px 4px 0 0; }
  .out-hdr { background:linear-gradient(90deg,#1e3a5f,#1d4ed8); color:#fff; padding:7px 12px; font-weight:bold; font-size:9pt; border-radius:4px 4px 0 0; }
  .footer { margin-top:24px; text-align:center; color:#9ca3af; font-size:8pt; border-top:1px solid #e5e7eb; padding-top:8px; }
</style></head>
<body>
<div class="cover">
  <h1>🖥️ Dependencias de Servidores</h1>
  <p>AWS Migration Assessment Platform — SoftwareOne</p>
  <p>Generado: ${dateStr} &nbsp;|&nbsp; ${summary.totalDependencies} dependencias · ${summary.uniqueServers} servidores</p>
</div>

<div class="stats">
  <div class="stat"><span class="n">${summary.totalDependencies}</span><span class="l">Total Dependencias</span></div>
  <div class="stat"><span class="n">${summary.uniqueServers}</span><span class="l">Servidores Únicos</span></div>
  <div class="stat"><span class="n">${summary.uniqueApplications}</span><span class="l">Aplicaciones</span></div>
  <div class="stat"><span class="n">${summary.uniquePorts}</span><span class="l">Puertos Únicos</span></div>
</div>

${imgData && nodes.length > 0 ? `
<h2>🔗 Grafo de Dependencias de Red</h2>
<img class="graph-img" src="${imgData}" alt="Grafo de dependencias" />
` : ''}

<h2>📋 Conexiones entre Servidores</h2>
<table class="data">
  <thead><tr>
    <th style="width:18%">Servidor Origen</th>
    <th style="width:18%">Servidor Destino</th>
    <th style="width:7%">Puerto</th>
    <th style="width:8%">Protocolo</th>
    <th style="width:20%">Proceso Destino</th>
    <th style="width:20%">Proceso Cliente</th>
  </tr></thead>
  <tbody>${tableRows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af">Sin conexiones</td></tr>'}</tbody>
</table>

${searchResult ? `
<h2>🔍 Análisis de Servidor: ${searchResult.server}</h2>
<div class="search-grid">
  <div class="search-col">
    <div class="in-hdr">⬇ Conexiones Entrantes (${searchResult.dependencies.incoming.length})</div>
    <table class="data"><thead><tr><th>Origen</th><th>Puerto</th><th>Protocolo</th><th>Servicio</th></tr></thead>
    <tbody>${inRows||'<tr><td colspan="4" style="text-align:center;color:#9ca3af">Sin conexiones</td></tr>'}</tbody></table>
  </div>
  <div class="search-col">
    <div class="out-hdr">⬆ Conexiones Salientes (${searchResult.dependencies.outgoing.length})</div>
    <table class="data"><thead><tr><th>Destino</th><th>Puerto</th><th>Protocolo</th><th>Servicio</th></tr></thead>
    <tbody>${outRows||'<tr><td colspan="4" style="text-align:center;color:#9ca3af">Sin conexiones</td></tr>'}</tbody></table>
  </div>
</div>
${searchResult.relatedApplications.length > 0 ? `
<h3>📦 Aplicaciones Relacionadas</h3>
<p>${searchResult.relatedApplications.map(a => `<span style="background:#ccfbf1;color:#0f766e;border:1px solid #99f6e4;border-radius:12px;padding:2px 10px;font-size:9pt;font-weight:600;margin-right:6px">${a}</span>`).join('')}</p>
` : ''}
` : ''}

<div class="footer">© ${new Date().getFullYear()} SoftwareOne – AWS Migration Assessment Platform</div>
</body></html>`;

      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `dependencias_servidores_${fileDate}.doc`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success(t('dependencyGraph.srvWordGenerated'), { id: 'srv-word', duration: 4000 });
    } catch (e) { console.error(e); toast.error(t('dependencyGraph.errorGeneratingSrvWord'), { id: 'srv-word' }); }
    finally { setIsExporting(false); }
  };

  const handleExport = (format: 'pdf' | 'word') => {
    if (format === 'pdf') exportServersPDF();
    else exportServersWord();
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

  // Todas las dependencias con origen y destino (con o sin puerto)
  const completeDependencies = filteredDependencies.filter(
    dep => dep.source && dep.source.trim() !== '' && dep.destination && dep.destination.trim() !== ''
  );

  const sortedCompleteDependencies = [...completeDependencies].sort((a, b) => {
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

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const displayGraph = (graph: DependencyGraph) => {
    // Validar que haya nodos y edges
    if (!graph || !graph.nodes || graph.nodes.length === 0) {
      console.log('⚠️ No hay nodos para mostrar en el grafo');
      setNodes([]);
      setEdges([]);
      return;
    }

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

  // Si no hay datos de dependencias, mostrar mensaje informativo
  if (!dependencyData || !dependencyData.dependencies || dependencyData.dependencies.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Network className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-blue-900 text-lg">Mapa de Dependencias</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Visualiza y analiza las dependencias de red entre servidores para planificar tu migración AWS.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">{t('dependencyGraph.noDependencyData')}</h4>
                <p className="text-sm text-amber-800 mb-3">
                  Para visualizar el mapa de dependencias, necesitas cargar un archivo Excel MPA que contenga 
                  la hoja "Server Communication" con información de conexiones de red.
                </p>
                <div className="space-y-2 text-sm text-amber-700">
                  <p className="font-medium">Pasos para cargar dependencias:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Ve a la pestaña "Descubrimiento Rápido"</li>
                    <li>Carga un archivo Excel MPA que incluya la hoja "Server Communication"</li>
                    <li>Las dependencias se cargarán automáticamente</li>
                    <li>Regresa a esta pestaña para visualizar el mapa</li>
                  </ol>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Formatos soportados:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• AWS MPA (Migration Portfolio Assessment)</li>
                    <li>• Concierto MPA</li>
                    <li>• Matilda</li>
                    <li>• Archivos personalizados con hoja "Server Communication"</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Main tab selector ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'servers',   label: 'Dependencias de Servidores',       icon: <Server style={{ width: 14, height: 14 }} /> },
          { id: 'databases', label: 'Dependencias de Bases de Datos',   icon: <Database style={{ width: 14, height: 14 }} />, badge: allDatabases.length > 0 ? allDatabases.length : null },
          { id: 'apps',      label: 'Dependencias de Aplicaciones',     icon: <Layers style={{ width: 14, height: 14 }} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveMainTab(tab.id as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: activeMainTab === tab.id
                ? 'linear-gradient(90deg, #0f766e 0%, #0891b2 100%)'
                : '#f1f5f9',
              color: activeMainTab === tab.id ? '#fff' : '#475569',
              boxShadow: activeMainTab === tab.id ? '0 2px 8px rgba(8,145,178,0.3)' : 'none',
            }}>
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 12, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── DB tab ────────────────────────────────────────────────────────── */}
      {activeMainTab === 'databases' && (
        <DatabaseDependencyMap
          databases={allDatabases}
          allDependencies={allDependencies}
        />
      )}

      {/* ── Apps tab ──────────────────────────────────────────────────────── */}
      {activeMainTab === 'apps' && (
        <AppDependencyMap
          appDependencies={allAppDependencies}
          allDependencies={allDependencies}
        />
      )}

      {/* ── Server tab ────────────────────────────────────────────────────── */}
      {activeMainTab === 'servers' && (<>
      {/* Summary Section */}
      {summary && (
        <div>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { value: summary.totalDependencies, label: 'Dependencias',  icon: '🔗' },
              { value: summary.uniqueServers,      label: 'Servidores',    icon: '🖥' },
              { value: summary.uniqueApplications, label: 'Aplicaciones',  icon: '📦' },
              { value: summary.uniquePorts,         label: 'Puertos',       icon: '🔌' },
            ].map((s, i) => (
              <div key={i} style={{
                borderRadius: 10, padding: '12px 16px', textAlign: 'center',
                background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
                border: '1px solid #99f6e4',
                boxShadow: '0 1px 4px rgba(8,145,178,0.08)'
              }}>
                <div style={{ fontSize: 11, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#0891b2', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Export buttons row */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 4 }}>
            <button onClick={() => handleExport('pdf')} disabled={isExporting}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:7,
                border:'1px solid #99f6e4', background:'linear-gradient(90deg,#0f766e,#0891b2)',
                color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <FileDown style={{ width:14, height:14 }} />
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
            <button onClick={() => handleExport('word')} disabled={isExporting}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:7,
                border:'1px solid #99f6e4', background:'linear-gradient(90deg,#0891b2,#0284c7)',
                color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <FileText style={{ width:14, height:14 }} />
              {isExporting ? 'Exportando...' : 'Exportar Word'}
            </button>
          </div>
        </div>
      )}

      {/* Search Section */}
      {allDependencies.length > 0 && (
        <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
          <CardHeader className="pb-0" style={{
            background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)',
            borderRadius: '8px 8px 0 0', padding: '14px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                <Search style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>Buscar Servidor</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Filtra por nombre de servidor para ver sus conexiones</div>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,0.6)' }} />
                <input
                  placeholder="Buscar por nombre de servidor (origen o destino)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleLocalSearch()}
                  disabled={isSearching}
                  style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 6, fontSize: 12, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button onClick={handleLocalSearch} disabled={isSearching || !searchTerm.trim()}
                style={{ padding: '7px 18px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {isSearching ? t('dependencyGraph.searching') : t('dependencyGraph.search')}
              </button>
            </div>
          </CardHeader>
          {searchResult && (
            <CardContent style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Server style={{ width: 16, height: 16, color: '#0f766e' }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0c4a6e' }}>{searchResult.server}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', marginBottom: 6 }}>
                    Conexiones Entrantes ({searchResult.dependencies.incoming.length})
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {searchResult.dependencies.incoming.map((dep, idx) => (
                      <div key={idx} style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 6, padding: '6px 10px' }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: '#0c4a6e' }}>{dep.source}</div>
                        <div style={{ fontSize: 10, color: '#0891b2' }}>
                          {dep.protocol}{dep.port !== null ? `:${dep.port}` : ''}
                          {dep.serviceName && ` · ${dep.serviceName}`}
                          {dep.clientProcess && ` · ${dep.clientProcess}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', marginBottom: 6 }}>
                    Conexiones Salientes ({searchResult.dependencies.outgoing.length})
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {searchResult.dependencies.outgoing.map((dep, idx) => (
                      <div key={idx} style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 10px' }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: '#0c4a6e' }}>{dep.destination}</div>
                        <div style={{ fontSize: 10, color: '#0891b2' }}>
                          {dep.protocol}{dep.port !== null ? `:${dep.port}` : ''}
                          {dep.serviceName && ` · ${dep.serviceName}`}
                          {dep.clientProcess && ` · ${dep.clientProcess}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {searchResult.relatedApplications.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Aplicaciones Relacionadas</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {searchResult.relatedApplications.map(app => (
                      <span key={app} style={{ background: '#ccfbf1', color: '#0f766e', border: '1px solid #99f6e4', borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{app}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* All Dependencies - Two Panels */}
      {allDependencies.length > 0 && (
        <div className="space-y-4">
          {/* Filter bar */}
          <Card className="border-0 shadow-sm">
            <CardContent style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
                  <Filter style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
                  <input
                    placeholder="Filtrar por servidor, puerto, protocolo, servicio..."
                    value={filterText}
                    onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }}
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                      border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, color: '#0f172a',
                      outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Mostrar:</span>
                  <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#374151', background: '#fff' }}>
                    {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Single Panel */}
          <div className="grid grid-cols-1 gap-4">

            {/* Panel 1: Conexiones con Puerto */}
            <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
              <CardHeader className="pb-0" style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)',
                borderRadius: '8px 8px 0 0', padding: '14px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                    <Server style={{ width: 16, height: 16, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>Conexiones de Servidores</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Todas las conexiones detectadas entre servidores</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                    {sortedCompleteDependencies.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0" style={{ borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                <div style={{ overflowY: 'auto', maxHeight: 520 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {[
                          { key: 'source',        label: 'Origen',          align: 'left'   },
                          { key: 'destination',   label: 'Destino',         align: 'left'   },
                          { key: 'port',          label: 'Puerto',          align: 'center' },
                          { key: 'protocol',      label: 'Protocolo',       align: 'center' },
                          { key: 'serviceName',   label: 'Proceso Destino', align: 'left'   },
                          { key: 'clientProcess', label: 'Proceso Cliente', align: 'left'   },
                        ].map(col => (
                          <th key={col.key} onClick={() => handleSort(col.key)}
                            style={{ padding: '9px 10px', textAlign: col.align as any, fontSize: 11, fontWeight: 700,
                              color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
                              background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)',
                              position: 'sticky', top: 0, zIndex: 10,
                              borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
                              {col.label} <ArrowUpDown style={{ width: 9, height: 9, opacity: 0.7 }} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCompleteDependencies.map((dep, i) => {
                        const rowBg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
                        return (
                          <tr key={i} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0', transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                            onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                            <td style={{ padding: '6px 10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {(() => { const t = getServerTypeInfo(dep.source); return (
                                  <span title={t.label} style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                                ); })()}
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.source}</div>
                                  {(() => { const t = getServerTypeInfo(dep.source); return (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                                  ); })()}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '6px 10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {(() => { const t = getServerTypeInfo(dep.destination); return (
                                  <span title={t.label} style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                                ); })()}
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.destination}</div>
                                  {(() => { const t = getServerTypeInfo(dep.destination); return (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                                  ); })()}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                              {dep.port !== null
                                ? <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#0f766e',
                                    background: '#ccfbf1', border: '1px solid #99f6e4', borderRadius: 4, padding: '2px 6px' }}>
                                    {dep.port}
                                  </span>
                                : <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', padding: '2px 6px' }}>—</span>}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                                background: dep.protocol === 'TCP' ? '#dbeafe' : dep.protocol === 'UDP' ? '#dcfce7' : '#f1f5f9',
                                color: dep.protocol === 'TCP' ? '#1d4ed8' : dep.protocol === 'UDP' ? '#16a34a' : '#475569' }}>
                                {dep.protocol || '—'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', color: '#475569', fontSize: 11 }}>
                              {(dep as any).targetProcessId || dep.serviceName || <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td style={{ padding: '6px 10px' }}>
                              {dep.clientProcess
                                ? <span style={{ fontSize: 10, color: '#0891b2', background: '#e0f2fe', padding: '2px 7px', borderRadius: 4 }}>{dep.clientProcess}</span>
                                : <span style={{ color: '#cbd5e1', fontSize: 10 }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedCompleteDependencies.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Sin conexiones</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPagesComplete > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px',
                    background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {startIndexComplete+1}–{Math.min(endIndexComplete, sortedCompleteDependencies.length)} de {sortedCompleteDependencies.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}><ChevronLeft className="h-3 w-3"/></Button>
                      <span style={{ fontSize: 11, color: '#475569' }}>{currentPage}/{totalPagesComplete}</span>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPagesComplete,p+1))} disabled={currentPage===totalPagesComplete}><ChevronRight className="h-3 w-3"/></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Stats mini */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: allDependencies.length,      label: 'Total Conexiones', icon: '🔗' },
              { value: completeDependencies.length, label: 'Con Puerto',       icon: '✅' },
              { value: filteredDependencies.length, label: 'Filtradas',        icon: '🔍' },
            ].map((s, i) => (
              <div key={i} style={{
                borderRadius: 10, padding: '10px 14px', textAlign: 'center',
                background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
                border: '1px solid #99f6e4', boxShadow: '0 1px 4px rgba(8,145,178,0.08)'
              }}>
                <div style={{ fontSize: 11, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f766e', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#0891b2', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Databases Without Dependencies */}
          {databasesWithoutDeps.length > 0 && (
            <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
              <CardHeader className="pb-0" style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)',
                borderRadius: '8px 8px 0 0', padding: '14px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                    <Database style={{ width: 16, height: 16, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Bases de Datos sin Dependencias</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Bases de datos sin conexiones con otros servidores</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                    {databasesWithoutDeps.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0" style={{ borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                <div style={{ overflowY: 'auto', maxHeight: 360 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {['Nombre Base de Datos','Servidor','Database ID','Edición'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                            color: '#fff', whiteSpace: 'nowrap',
                            background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 55%, #0284c7 100%)',
                            position: 'sticky', top: 0, zIndex: 10, borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {databasesWithoutDeps.map((db, i) => {
                        const rowBg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
                        return (
                          <tr key={i} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0', transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                            onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                            <td style={{ padding: '6px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Database style={{ width: 10, height: 10, color: '#0f766e', flexShrink: 0 }} />
                                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 11 }}>{db.databaseName}</span>
                              </div>
                            </td>
                            <td style={{ padding: '6px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Server style={{ width: 10, height: 10, color: '#0284c7', flexShrink: 0 }} />
                                <span style={{ color: '#374151', fontSize: 11 }}>{db.serverId}</span>
                              </div>
                            </td>
                            <td style={{ padding: '6px 12px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b7280', background: '#f3f4f6', padding: '2px 5px', borderRadius: 4 }}>{db.databaseId || '—'}</span>
                            </td>
                            <td style={{ padding: '6px 12px', color: '#475569', fontSize: 11 }}>{db.edition || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Graph Visualization — D3 Force */}
      {nodes.length > 0 && (
        <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
          <CardHeader className="pb-0" style={{
            background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)',
            borderRadius: '8px 8px 0 0', padding: '14px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                <Network style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>Visualización de Dependencias</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                  {nodes.length} nodos · {edges.length} conexiones &nbsp;|&nbsp; Arrastra nodos · Rueda = zoom
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={exportGraphToPDF} disabled={isExportingGraph}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6,
                    border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)',
                    color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  <FileDown style={{ width:12, height:12 }} />
                  {isExportingGraph ? '...' : 'PDF'}
                </button>
                <button onClick={exportGraphToWord} disabled={isExportingGraph}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6,
                    border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)',
                    color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  <FileText style={{ width:12, height:12 }} />
                  {isExportingGraph ? '...' : 'Word'}
                </button>
                <button onClick={exportGraphToPNG} disabled={isExportingGraph}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6,
                    border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)',
                    color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  <ImageIcon style={{ width:12, height:12 }} />
                  {isExportingGraph ? '...' : 'PNG'}
                </button>
                <button onClick={exportGraphToSVG} disabled={isExportingGraph}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6,
                    border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)',
                    color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  <Code style={{ width:12, height:12 }} />
                  SVG
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ padding: '16px' }}>
            <ForceGraph nodes={nodes} edges={edges} svgRef={forceSvgRef} />

            {/* ── Panel de resumen detallado ──────────────────────────────── */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Fila 1: Leyenda de colores de nodos + líneas */}
              <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Leyenda del Grafo
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginRight: 4, alignSelf: 'center' }}>Nodos:</div>
                  {[
                    { color: '#10b981', label: 'Base (sin deps)' },
                    { color: '#06b6d4', label: 'Nivel 1' },
                    { color: '#f59e0b', label: 'Nivel 2' },
                    { color: '#3b82f6', label: 'Intermedios' },
                    { color: '#8b5cf6', label: 'Nivel superior' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#475569' }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: l.color, flexShrink: 0 }} />{l.label}
                    </div>
                  ))}
                  <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginRight: 4, alignSelf: 'center' }}>Líneas:</div>
                  {[
                    { color: '#3b82f6', label: 'HTTP/HTTPS' },
                    { color: '#10b981', label: 'Base de datos' },
                    { color: '#ef4444', label: 'Acceso remoto' },
                    { color: '#f59e0b', label: 'Cache/Cola' },
                    { color: '#94a3b8', label: 'Otros' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#475569' }}>
                      <div style={{ width: 18, height: 2, background: l.color, flexShrink: 0 }} />{l.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fila 2: Resumen cuantitativo */}
              {(() => {
                // Calcular métricas reales
                const deps = sortedCompleteDependencies;
                const portCount = new Map<number, number>();
                const protoCount = new Map<string, number>();
                const srcCount  = new Map<string, number>();
                const dstCount  = new Map<string, number>();
                const serviceCount = new Map<string, number>();

                deps.forEach(d => {
                  if (d.port !== null) portCount.set(d.port, (portCount.get(d.port) ?? 0) + 1);
                  if (d.protocol) protoCount.set(d.protocol, (protoCount.get(d.protocol) ?? 0) + 1);
                  srcCount.set(d.source, (srcCount.get(d.source) ?? 0) + 1);
                  dstCount.set(d.destination, (dstCount.get(d.destination) ?? 0) + 1);
                  const svc = (d as any).targetProcessId || d.serviceName;
                  if (svc) serviceCount.set(svc, (serviceCount.get(svc) ?? 0) + 1);
                });

                // Combinar src+dst para ranking total de conexiones por servidor
                const totalConns = new Map<string, number>();
                srcCount.forEach((v, k) => totalConns.set(k, (totalConns.get(k) ?? 0) + v));
                dstCount.forEach((v, k) => totalConns.set(k, (totalConns.get(k) ?? 0) + v));

                const topServers = [...totalConns.entries()].sort((a,b) => b[1]-a[1]).slice(0, 6);
                const topPorts   = [...portCount.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8);
                const topProtos  = [...protoCount.entries()].sort((a,b) => b[1]-a[1]);
                const topSvcs    = [...serviceCount.entries()].sort((a,b) => b[1]-a[1]).slice(0, 5);
                const uniqueSrcs = srcCount.size;
                const uniqueDsts = dstCount.size;
                const withPort   = deps.filter(d => d.port !== null).length;
                const withSvc    = deps.filter(d => (d as any).targetProcessId || d.serviceName).length;

                const KNOWN: Record<number,string> = {
                  80:'HTTP',443:'HTTPS',22:'SSH',3389:'RDP',3306:'MySQL',5432:'PostgreSQL',
                  1433:'SQL Server',1521:'Oracle',27017:'MongoDB',6379:'Redis',8080:'HTTP Alt',
                  8443:'HTTPS Alt',21:'FTP',25:'SMTP',53:'DNS',389:'LDAP',445:'SMB',
                  5985:'WinRM',9200:'Elasticsearch',
                };

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

                    {/* Columna 1: Top servidores */}
                    <div style={{ background: '#f0fdfa', borderRadius: 8, border: '1px solid #99f6e4', padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#0f766e', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        🖥️ Top Servidores por Conexiones
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {topServers.map(([srv, cnt]) => {
                          const t = getServerTypeInfo(srv);
                          const maxCnt = topServers[0][1];
                          const pct = Math.round((cnt / maxCnt) * 100);
                          return (
                            <div key={srv}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                <span style={{ fontSize: 11 }}>{t.icon}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={srv}>{srv}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#0f766e', background: '#ccfbf1', border: '1px solid #99f6e4', borderRadius: 999, padding: '0px 6px', flexShrink: 0 }}>{cnt}</span>
                              </div>
                              <div style={{ height: 3, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, #0f766e, #0891b2)`, borderRadius: 2 }} />
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ marginTop: 4, fontSize: 10, color: '#64748b', display: 'flex', gap: 10 }}>
                          <span>📤 {uniqueSrcs} orígenes</span>
                          <span>📥 {uniqueDsts} destinos</span>
                        </div>
                      </div>
                    </div>

                    {/* Columna 2: Puertos + Protocolos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', padding: '10px 12px', flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
                          🔌 Puertos más Usados
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {topPorts.map(([port, cnt]) => (
                            <div key={port} title={KNOWN[port] ?? 'Puerto personalizado'} style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#fff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '3px 7px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#1d4ed8' }}>{port}</span>
                              {KNOWN[port] && <span style={{ fontSize: 9, color: '#64748b' }}>{KNOWN[port]}</span>}
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#0891b2', background: '#e0f2fe', borderRadius: 999, padding: '0 4px' }}>{cnt}</span>
                            </div>
                          ))}
                          {topPorts.length === 0 && <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>Sin puertos identificados</span>}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 10, color: '#64748b' }}>
                          🔢 {portCount.size} puertos únicos · {withPort} conexiones con puerto ({deps.length > 0 ? Math.round(withPort/deps.length*100) : 0}%)
                        </div>
                      </div>

                      <div style={{ background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff', padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
                          📡 Protocolos
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {topProtos.map(([proto, cnt]) => (
                            <div key={proto} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6,
                              background: proto==='TCP'?'#dbeafe':proto==='UDP'?'#dcfce7':'#f3e8ff',
                              border: `1px solid ${proto==='TCP'?'#bfdbfe':proto==='UDP'?'#bbf7d0':'#e9d5ff'}` }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: proto==='TCP'?'#1d4ed8':proto==='UDP'?'#16a34a':'#7c3aed' }}>{proto}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', background: 'rgba(255,255,255,0.7)', borderRadius: 999, padding: '0 4px' }}>{cnt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Columna 3: Procesos/Servicios + Tipos de servidor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa', padding: '10px 12px', flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#c2410c', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
                          ⚙️ Procesos / Servicios Destino
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {topSvcs.map(([svc, cnt]) => (
                            <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={svc}>{svc}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#c2410c', background: '#ffedd5', border: '1px solid #fed7aa', borderRadius: 999, padding: '0 5px', flexShrink: 0 }}>{cnt}</span>
                            </div>
                          ))}
                          {topSvcs.length === 0 && <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>Sin procesos identificados</span>}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 10, color: '#64748b' }}>
                          📋 {serviceCount.size} procesos únicos · {withSvc} conexiones con proceso
                        </div>
                      </div>

                      <div style={{ background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
                          🏷️ Tipos de Servidor Detectados
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {(() => {
                            const typeMap = new Map<string, { icon: string; color: string; bg: string; count: number }>();
                            [...srcCount.keys(), ...dstCount.keys()].forEach(srv => {
                              const t = getServerTypeInfo(srv);
                              if (!typeMap.has(t.label)) typeMap.set(t.label, { icon: t.icon, color: t.color, bg: t.bg, count: 0 });
                              typeMap.get(t.label)!.count++;
                            });
                            return [...typeMap.entries()].sort((a,b) => b[1].count - a[1].count).map(([label, t]) => (
                              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: 12 }}>{t.icon}</span>
                                <span style={{ fontSize: 10, flex: 1, color: '#0f172a', fontWeight: 500 }}>{label}</span>
                                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: t.bg, color: t.color, border: `1px solid ${t.color}33`, flexShrink: 0 }}>{t.count}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Tip */}
              <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💡</span>
                <span>El tamaño del nodo es proporcional al número de conexiones. Arrastra nodos para reorganizar · Rueda del ratón para zoom.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!summary && (
        <Card style={{ border: '1px solid #99f6e4', background: '#f0fdfa' }}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-teal-600 mt-0.5" />
              <div>
                <h3 style={{ fontWeight: 700, color: '#0f766e', marginBottom: 6 }}>Cómo usar el Mapa de Dependencias</h3>
                <ul style={{ fontSize: 13, color: '#0891b2', lineHeight: 1.8 }}>
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
      </>)}
    </div>
  );
}
