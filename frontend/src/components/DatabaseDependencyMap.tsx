import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTranslation } from '@/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { Database, Server, Network, Filter, ArrowUpDown, ChevronLeft, ChevronRight, FileText, FileSpreadsheet, Download, Search } from 'lucide-react';
import {
  exportConnectionsPDF, exportConnectionsWord,
  exportInventoryPDF, exportInventoryExcel,
  exportDistributionPDF, exportDistributionWord,
  exportGraphPDF, exportGraphWord,
} from './dbExportUtils';

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface DatabaseInfo {
  databaseName: string;
  serverId: string;
  databaseId?: string;
  edition?: string;
  dbInstanceName?: string;
  totalSizeGb?: number;
  maxTransactionsPerSecond?: number;
  hasDependencies: boolean;
  dependencies: {
    asSource: NetworkDependency[];
    asDestination: NetworkDependency[];
  };
}

interface DatabaseDependencyMapProps {
  databases: DatabaseInfo[];
  allDependencies: NetworkDependency[];
}

// ── Known ports ───────────────────────────────────────────────────────────────
const KNOWN_PORTS: Record<number, string> = {
  80: 'HTTP', 443: 'HTTPS', 22: 'SSH', 3389: 'RDP',
  3306: 'MySQL', 5432: 'PostgreSQL', 1433: 'SQL Server',
  1521: 'Oracle DB', 27017: 'MongoDB', 6379: 'Redis',
  8080: 'HTTP Alt', 8443: 'HTTPS Alt', 21: 'FTP',
  25: 'SMTP', 53: 'DNS', 389: 'LDAP', 636: 'LDAPS',
  445: 'SMB', 139: 'NetBIOS', 5985: 'WinRM', 9200: 'Elasticsearch',
  5984: 'CouchDB', 7474: 'Neo4j', 9042: 'Cassandra', 2181: 'Zookeeper',
};

// ── DB engine type detector ───────────────────────────────────────────────────
function getDbTypeInfo(name: string, edition?: string): { icon: string; label: string; color: string; bg: string } {
  const s = `${name} ${edition ?? ''}`.toLowerCase();
  if (/mysql/.test(s))      return { icon: '🐬', label: 'MySQL',      color: '#f59e0b', bg: '#fef3c7' };
  if (/postgres|pgsql/.test(s)) return { icon: '🐘', label: 'PostgreSQL', color: '#3b82f6', bg: '#dbeafe' };
  if (/sql.?server|mssql/.test(s)) return { icon: '🪟', label: 'SQL Server', color: '#0ea5e9', bg: '#e0f2fe' };
  if (/oracle/.test(s))     return { icon: '🔴', label: 'Oracle',     color: '#ef4444', bg: '#fee2e2' };
  if (/mongo/.test(s))      return { icon: '🍃', label: 'MongoDB',    color: '#22c55e', bg: '#dcfce7' };
  if (/redis/.test(s))      return { icon: '⚡', label: 'Redis',      color: '#f97316', bg: '#ffedd5' };
  if (/elastic/.test(s))    return { icon: '🔍', label: 'Elastic',    color: '#f59e0b', bg: '#fef3c7' };
  if (/cassandra/.test(s))  return { icon: '👁', label: 'Cassandra',  color: '#8b5cf6', bg: '#ede9fe' };
  if (/db2/.test(s))        return { icon: '🔷', label: 'DB2',        color: '#1d4ed8', bg: '#dbeafe' };
  if (/sqlite/.test(s))     return { icon: '📦', label: 'SQLite',     color: '#64748b', bg: '#f1f5f9' };
  if (/maria/.test(s))      return { icon: '🦭', label: 'MariaDB',    color: '#0891b2', bg: '#e0f2fe' };
  return { icon: '🗄️', label: 'Base de Datos', color: '#8b5cf6', bg: '#ede9fe' };
}

function getServerTypeInfoDb(name: string): { icon: string; label: string; color: string; bg: string } {
  const s = name.toLowerCase();
  if (/web|http|nginx|apache|iis|tomcat|www/.test(s)) return { icon: '🖥️', label: 'Web',    color: '#0891b2', bg: '#e0f2fe' };
  if (/mail|exchange|smtp/.test(s))                   return { icon: '🖥️', label: 'Correo', color: '#1d4ed8', bg: '#dbeafe' };
  if (/file|ftp|nas|storage/.test(s))                 return { icon: '🗃️', label: 'Storage',color: '#92400e', bg: '#fef3c7' };
  if (/auth|ldap|ad[-_]|sso/.test(s))                 return { icon: '🖥️', label: 'Auth',   color: '#7c3aed', bg: '#ede9fe' };
  if (/app|apl/.test(s))                              return { icon: '📱', label: 'App',    color: '#0f766e', bg: '#ccfbf1' };
  if (/srv|svc/.test(s))                              return { icon: '🖧', label: 'Servicio',color: '#475569', bg: '#f1f5f9' };
  return { icon: '🖥️', label: 'Servidor', color: '#3b82f6', bg: '#dbeafe' };
}

// ── DB color palette ──────────────────────────────────────────────────────────
const DB_COLORS: Record<string, string> = {
  mysql: '#f59e0b', postgresql: '#3b82f6', 'sql server': '#0ea5e9',
  oracle: '#ef4444', mongodb: '#22c55e', redis: '#f97316',
  default: '#8b5cf6',
};

function getDbColor(edition = ''): string {
  const e = edition.toLowerCase();
  for (const [k, v] of Object.entries(DB_COLORS)) {
    if (e.includes(k)) return v;
  }
  return DB_COLORS.default;
}

// ── D3 Force Graph for DB dependencies ───────────────────────────────────────
interface DbGraphNode { id: string; label: string; type: 'db' | 'server'; color: string; r: number; }
interface DbGraphLink { source: string; target: string; port: number | null; protocol: string; }

function DbForceGraph({ nodes, links, svgRef: extRef }: {
  nodes: DbGraphNode[];
  links: DbGraphLink[];
  svgRef?: React.RefObject<SVGSVGElement>;
}) {
  const internalRef = useRef<SVGSVGElement>(null);
  const svgRef = extRef ?? internalRef;

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;
    const container = svgRef.current.parentElement!;
    const W = container.clientWidth || 900;
    const H = 600;

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current).attr('width', W).attr('height', H).style('background', '#ffffff');

    const defs = svg.append('defs');
    ['#8b5cf6', '#3b82f6', '#94a3b8'].forEach((c, i) => {
      defs.append('marker').attr('id', `dbarrow-${i}`)
        .attr('viewBox', '0 -5 10 10').attr('refX', 10).attr('refY', 0)
        .attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', c);
    });

    const g = svg.append('g');
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.05, 5])
      .on('zoom', e => g.attr('transform', e.transform)));

    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const simNodes: any[] = nodes.map(n => ({ ...n }));
    const simLinks: any[] = links
      .filter(l => nodeById.has(l.source) && nodeById.has(l.target))
      .map(l => ({ ...l }));

    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(120).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.r + 12));

    const linkG = g.append('g');
    const link = linkG.selectAll('line').data(simLinks).join('line')
      .attr('stroke', '#94a3b8').attr('stroke-width', 1.5).attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#dbarrow-2)');

    const linkLabel = linkG.selectAll('text').data(simLinks.filter(l => l.port)).join('text')
      .attr('text-anchor', 'middle').attr('font-size', 8).attr('fill', '#6b7280')
      .attr('pointer-events', 'none')
      .text((d: any) => d.port ? `${d.protocol}:${d.port}` : '');

    const nodeG = g.append('g');
    const node = nodeG.selectAll<SVGGElement, any>('g').data(simNodes).join('g')
      .attr('cursor', 'grab')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = d.x; d.fy = d.y; }));

    node.append('circle').attr('r', d => d.r).attr('fill', d => d.color)
      .attr('stroke', '#fff').attr('stroke-width', 2.5)
      .style('filter', 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))');

    node.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('fill', '#fff').attr('font-size', d => Math.max(8, d.r * 0.45))
      .attr('font-weight', 'bold').attr('pointer-events', 'none')
      .text(d => d.type === 'db' ? '🗄' : '🖥');

    node.append('text').attr('text-anchor', 'middle').attr('dy', d => d.r + 13)
      .attr('fill', '#111827').attr('font-size', 9).attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .text(d => d.label.length > 22 ? d.label.slice(0, 21) + '…' : d.label);

    const tip = d3.select(container).select<HTMLDivElement>('.db-tooltip').empty()
      ? d3.select(container).append('div').attr('class', 'db-tooltip')
          .style('position', 'absolute').style('background', 'rgba(17,24,39,0.93)')
          .style('color', '#f9fafb').style('padding', '7px 12px').style('border-radius', '7px')
          .style('font-size', '11px').style('pointer-events', 'none').style('opacity', '0')
          .style('z-index', '20').style('max-width', '220px')
      : d3.select(container).select<HTMLDivElement>('.db-tooltip');

    node.on('mouseover', (_, d) => tip.style('opacity', '1')
        .html(`<strong>${d.label}</strong><br/>Tipo: <b>${d.type === 'db' ? 'Base de Datos' : 'Servidor'}</b>`))
      .on('mousemove', e => {
        const r = container.getBoundingClientRect();
        tip.style('left', (e.clientX - r.left + 14) + 'px').style('top', (e.clientY - r.top - 32) + 'px');
      })
      .on('mouseout', () => tip.style('opacity', '0'));

    sim.on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => { const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dist = Math.sqrt(dx*dx+dy*dy)||1; return d.target.x - (dx/dist)*(d.target.r+3); })
        .attr('y2', (d: any) => { const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dist = Math.sqrt(dx*dx+dy*dy)||1; return d.target.y - (dy/dist)*(d.target.r+3); });
      linkLabel.attr('x', (d: any) => (d.source.x+d.target.x)/2).attr('y', (d: any) => (d.source.y+d.target.y)/2-4);
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  }, [nodes, links]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}
         className="border rounded-xl overflow-hidden bg-white shadow-inner">
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: '#9ca3af', pointerEvents: 'none' }}>
        🖱 Rueda = zoom &nbsp;|&nbsp; Arrastra nodos para mover
      </div>
    </div>
  );
}

// ── Pie Chart Component ───────────────────────────────────────────────────────
function DbPieChart({ databases, svgRef: extSvgRef }: { databases: DatabaseInfo[]; svgRef?: React.RefObject<SVGSVGElement> }) {
  const internalRef = useRef<SVGSVGElement>(null);
  const svgRef = extSvgRef ?? internalRef;

  const aggregated = new Map<string, { size: number; tps: number; hasTps: boolean }>();
  databases.forEach(db => {
    const key = db.databaseName || 'Sin nombre';
    const cur = aggregated.get(key) ?? { size: 0, tps: 0, hasTps: false };
    aggregated.set(key, {
      size: cur.size + (db.totalSizeGb ?? 0),
      tps: cur.tps + (db.maxTransactionsPerSecond ?? 0),
      hasTps: cur.hasTps || db.maxTransactionsPerSecond !== undefined,
    });
  });

  const data = [...aggregated.entries()]
    .map(([name, v]) => ({ name, size: v.size, tps: v.tps, hasTps: v.hasTps }))
    .filter(d => d.size > 0)
    .sort((a, b) => b.size - a.size);

  const totalSize = data.reduce((s, d) => s + d.size, 0);
  const totalTps  = data.reduce((s, d) => s + d.tps, 0);
  const anyTps    = data.some(d => d.hasTps);

  const COLORS = [
    '#6366f1','#8b5cf6','#3b82f6','#06b6d4','#10b981',
    '#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316',
    '#84cc16','#a855f7','#0ea5e9','#22c55e','#eab308',
  ];

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;
    const W = 320, H = 320, R = 120, innerR = 55;
    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current).attr('width', W).attr('height', H).style('overflow', 'visible');
    const g = svg.append('g').attr('transform', `translate(${W / 2},${H / 2})`);
    const pie = d3.pie<typeof data[0]>().value(d => d.size).sort(null).padAngle(0.02);
    const arc = d3.arc<d3.PieArcDatum<typeof data[0]>>().innerRadius(innerR).outerRadius(R).cornerRadius(4);
    const arcHover = d3.arc<d3.PieArcDatum<typeof data[0]>>().innerRadius(innerR).outerRadius(R + 12).cornerRadius(4);
    const arcs = pie(data);
    const container = svgRef.current.parentElement!;
    const tip = d3.select(container).select<HTMLDivElement>('.pie-tooltip').empty()
      ? d3.select(container).append('div').attr('class', 'pie-tooltip')
          .style('position', 'absolute').style('background', 'rgba(15,23,42,0.95)')
          .style('color', '#f1f5f9').style('padding', '10px 14px').style('border-radius', '8px')
          .style('font-size', '11px').style('pointer-events', 'none').style('opacity', '0')
          .style('z-index', '20').style('max-width', '220px').style('line-height', '1.7')
          .style('box-shadow', '0 4px 16px rgba(0,0,0,0.3)')
      : d3.select(container).select<HTMLDivElement>('.pie-tooltip');
    g.selectAll('path').data(arcs).join('path')
      .attr('d', arc as any).attr('fill', (_, i) => COLORS[i % COLORS.length])
      .attr('stroke', '#fff').attr('stroke-width', 2)
      .style('cursor', 'pointer').style('transition', 'all 0.15s ease')
      .on('mouseover', function(_, d) {
        d3.select(this).attr('d', arcHover(d) as any);
        const pct = totalSize > 0 ? ((d.data.size / totalSize) * 100).toFixed(1) : '0';
        const tpsLine = d.data.hasTps ? `<br/>Max TPS: <b>${d.data.tps.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</b>` : '';
        tip.style('opacity', '1').html(`<strong style="font-size:12px">${d.data.name}</strong><br/>Tamaño: <b>${d.data.size.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} GB</b><br/>Porcentaje: <b>${pct}%</b>${tpsLine}`);
      })
      .on('mousemove', e => {
        const r = container.getBoundingClientRect();
        tip.style('left', (e.clientX - r.left + 16) + 'px').style('top', (e.clientY - r.top - 44) + 'px');
      })
      .on('mouseout', function(_, d) { d3.select(this).attr('d', arc(d) as any); tip.style('opacity', '0'); });
    g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.6em').attr('font-size', 13).attr('font-weight', 'bold').attr('fill', '#1e1b4b')
      .text(totalSize.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
    g.append('text').attr('text-anchor', 'middle').attr('dy', '0.8em').attr('font-size', 9).attr('fill', '#6b7280').text('GB Total');
    if (anyTps) {
      g.append('text').attr('text-anchor', 'middle').attr('dy', '2.2em').attr('font-size', 9).attr('fill', '#a78bfa')
        .text(`${totalTps.toLocaleString('es-ES', { maximumFractionDigits: 0 })} TPS`);
    }
  }, [databases]);

  if (data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Sin datos de tamaño (Total Size GB) para graficar</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 24, padding: '16px 20px', alignItems: 'flex-start', flexWrap: 'wrap' }} data-pie-container>
      <div style={{ position: 'relative', flexShrink: 0 }}><svg ref={svgRef} /></div>
      <div style={{ flex: 1, minWidth: 280, overflow: 'hidden', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowY: 'auto', maxHeight: 320 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {[
                  { label: 'Color', align: 'center', w: 36 },
                  { label: 'BD Name', align: 'left', w: undefined },
                  { label: 'Size (GB)', align: 'right', w: 80 },
                  { label: '%', align: 'right', w: 48 },
                  ...(anyTps ? [{ label: 'Max TPS', align: 'right' as const, w: 80 }] : []),
                ].map(col => (
                  <th key={col.label} style={{ padding: '8px 10px', textAlign: col.align as any, fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', width: col.w, background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 55%, #0284c7 100%)', position: 'sticky', top: 0, zIndex: 10 }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => {
                const pct = totalSize > 0 ? ((d.size / totalSize) * 100).toFixed(1) : '0';
                const rowBg = i % 2 === 0 ? '#ffffff' : '#f8f7ff';
                return (
                  <tr key={d.name} style={{ background: rowBg, borderBottom: '1px solid #ccfbf1', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                    onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                    <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i % COLORS.length], margin: '0 auto' }} />
                    </td>
                    <td style={{ padding: '5px 10px', color: '#0c4a6e', fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.name}>{d.name}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', color: '#0f766e', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {d.size.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', color: '#0284c7', fontWeight: 700, whiteSpace: 'nowrap' }}>{pct}%</td>
                    {anyTps && (
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: d.hasTps ? '#0891b2' : '#cbd5e1', fontWeight: d.hasTps ? 700 : 400, whiteSpace: 'nowrap' }}>
                        {d.hasTps ? d.tps.toLocaleString('es-ES', { maximumFractionDigits: 0 }) : '—'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'linear-gradient(90deg, #f0fdfa 0%, #e0f2fe 100%)', borderTop: '2px solid #99f6e4' }}>
                <td colSpan={2} style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#0f766e' }}>Total</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0c4a6e', fontVariantNumeric: 'tabular-nums' }}>
                  {totalSize.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>100%</td>
                {anyTps && (
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0891b2', fontVariantNumeric: 'tabular-nums' }}>
                    {totalTps.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function DatabaseDependencyMap({ databases, allDependencies }: DatabaseDependencyMapProps) {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'connections' | 'ports' | 'processes'>('connections');
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const graphSvgRef = useRef<SVGSVGElement>(null);
  const pieSvgRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [dbSearchText, setDbSearchText] = useState('');
  const [selectedDb, setSelectedDb] = useState<string | null>(null);

  const doExport = async (key: string, fn: () => Promise<void> | void) => {
    setExporting(key);
    try { await fn(); } finally { setExporting(null); }
  };

  const dbServerIds = new Set(databases.map(d => d.serverId.toLowerCase()));
  const dbDependencies = allDependencies.filter(dep =>
    dbServerIds.has(dep.source.toLowerCase()) || dbServerIds.has(dep.destination.toLowerCase())
  );

  const portMap = new Map<number, { count: number; servers: Set<string>; protocols: Set<string>; services: Set<string> }>();
  dbDependencies.forEach(dep => {
    if (dep.port === null) return;
    if (!portMap.has(dep.port)) portMap.set(dep.port, { count: 0, servers: new Set(), protocols: new Set(), services: new Set() });
    const e = portMap.get(dep.port)!;
    e.count++; e.servers.add(dep.source); e.servers.add(dep.destination);
    if (dep.protocol) e.protocols.add(dep.protocol);
    if (dep.serviceName) e.services.add(dep.serviceName);
  });
  const sortedPorts = [...portMap.entries()].sort((a, b) => b[1].count - a[1].count);

  const processMap = new Map<string, { count: number; servers: Set<string>; ports: Set<number> }>();
  dbDependencies.forEach(dep => {
    const proc = dep.targetProcessId || dep.serviceName;
    if (!proc) return;
    if (!processMap.has(proc)) processMap.set(proc, { count: 0, servers: new Set(), ports: new Set() });
    const e = processMap.get(proc)!;
    e.count++; e.servers.add(dep.source); e.servers.add(dep.destination);
    if (dep.port !== null) e.ports.add(dep.port);
  });
  const sortedProcesses = [...processMap.entries()].sort((a, b) => b[1].count - a[1].count);

  const selectedDbInfo = selectedDb ? databases.find(d => d.databaseName === selectedDb) : null;
  const selectedServerId = selectedDbInfo?.serverId.toLowerCase();

  // ── Graph data (full) ─────────────────────────────────────────────────────
  const graphNodes: DbGraphNode[] = [];
  const graphLinks: DbGraphLink[] = [];
  const addedNodes = new Set<string>();
  databases.forEach(db => {
    const id = `db::${db.serverId}::${db.databaseName}`;
    if (!addedNodes.has(id)) { addedNodes.add(id); graphNodes.push({ id, label: db.databaseName, type: 'db', color: getDbColor(db.edition), r: 22 }); }
  });
  dbDependencies.forEach(dep => {
    [dep.source, dep.destination].forEach(srv => {
      if (!addedNodes.has(srv)) { addedNodes.add(srv); graphNodes.push({ id: srv, label: srv, type: 'server', color: '#3b82f6', r: 18 }); }
    });
    graphLinks.push({ source: dep.source, target: dep.destination, port: dep.port, protocol: dep.protocol });
  });
  databases.forEach(db => {
    const dbId = `db::${db.serverId}::${db.databaseName}`;
    if (addedNodes.has(db.serverId)) graphLinks.push({ source: dbId, target: db.serverId, port: null, protocol: 'DB' });
  });

  // ── Filtered graph nodes/links (when a DB is selected) ────────────────────
  const filteredGraphDeps = selectedServerId
    ? dbDependencies.filter(dep => dep.source.toLowerCase() === selectedServerId || dep.destination.toLowerCase() === selectedServerId)
    : dbDependencies;

  const filteredGraphNodes: DbGraphNode[] = [];
  const filteredGraphLinks: DbGraphLink[] = [];
  const addedFilteredNodes = new Set<string>();

  if (selectedServerId) {
    databases.filter(db => db.serverId.toLowerCase() === selectedServerId).forEach(db => {
      const id = `db::${db.serverId}::${db.databaseName}`;
      if (!addedFilteredNodes.has(id)) { addedFilteredNodes.add(id); filteredGraphNodes.push({ id, label: db.databaseName, type: 'db', color: getDbColor(db.edition), r: 22 }); }
    });
    filteredGraphDeps.forEach(dep => {
      [dep.source, dep.destination].forEach(srv => {
        if (!addedFilteredNodes.has(srv)) { addedFilteredNodes.add(srv); filteredGraphNodes.push({ id: srv, label: srv, type: 'server', color: '#3b82f6', r: 18 }); }
      });
      filteredGraphLinks.push({ source: dep.source, target: dep.destination, port: dep.port, protocol: dep.protocol });
    });
    databases.filter(db => db.serverId.toLowerCase() === selectedServerId).forEach(db => {
      const dbId = `db::${db.serverId}::${db.databaseName}`;
      if (addedFilteredNodes.has(db.serverId)) filteredGraphLinks.push({ source: dbId, target: db.serverId, port: null, protocol: 'DB' });
    });
  }

  // ── Visualization graph — reacts to BOTH selectedDb AND filterText ────────
  const filteredConnections = dbDependencies.filter(dep => {
    if (selectedServerId) {
      const matchesServer = dep.source.toLowerCase() === selectedServerId || dep.destination.toLowerCase() === selectedServerId;
      if (!matchesServer) return false;
    } else if (dbSearchText) {
      const q = dbSearchText.toLowerCase();
      const matchingServerIds = new Set(databases.filter(db => db.databaseName.toLowerCase().includes(q) || db.serverId.toLowerCase().includes(q)).map(db => db.serverId.toLowerCase()));
      if (!matchingServerIds.has(dep.source.toLowerCase()) && !matchingServerIds.has(dep.destination.toLowerCase())) return false;
    }
    if (!filterText) return true;
    const s = filterText.toLowerCase();
    return dep.source.toLowerCase().includes(s) || dep.destination.toLowerCase().includes(s) ||
      dep.protocol?.toLowerCase().includes(s) || dep.serviceName?.toLowerCase().includes(s) ||
      dep.port?.toString().includes(s);
  });

  // Build visGraph from filteredConnections so it reacts to all active filters
  const _visNodes: DbGraphNode[] = [];
  const _visLinks: DbGraphLink[] = [];
  const _addedVis = new Set<string>();
  // Add DB nodes for servers that appear in filteredConnections
  const visServerIds = new Set(filteredConnections.flatMap(d => [d.source.toLowerCase(), d.destination.toLowerCase()]));
  databases.filter(db => visServerIds.has(db.serverId.toLowerCase())).forEach(db => {
    const id = `db::${db.serverId}::${db.databaseName}`;
    if (!_addedVis.has(id)) { _addedVis.add(id); _visNodes.push({ id, label: db.databaseName, type: 'db', color: getDbColor(db.edition), r: 22 }); }
  });
  filteredConnections.forEach(dep => {
    [dep.source, dep.destination].forEach(srv => {
      if (!_addedVis.has(srv)) { _addedVis.add(srv); _visNodes.push({ id: srv, label: srv, type: 'server', color: '#3b82f6', r: 18 }); }
    });
    _visLinks.push({ source: dep.source, target: dep.destination, port: dep.port, protocol: dep.protocol });
  });
  databases.filter(db => visServerIds.has(db.serverId.toLowerCase())).forEach(db => {
    const dbId = `db::${db.serverId}::${db.databaseName}`;
    if (_addedVis.has(db.serverId)) _visLinks.push({ source: dbId, target: db.serverId, port: null, protocol: 'DB' });
  });
  // Fall back to full graph when no filter is active
  const hasActiveFilter = !!(selectedServerId || filterText || dbSearchText);
  const activeVisNodes = hasActiveFilter ? _visNodes : graphNodes;
  const activeVisLinks = hasActiveFilter ? _visLinks : graphLinks;

  const sorted = [...filteredConnections].sort((a, b) => {    if (!sortConfig) return 0;
    const av = (a as any)[sortConfig.key] ?? '';
    const bv = (b as any)[sortConfig.key] ?? '';
    return sortConfig.direction === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(c => c?.key === key ? { key, direction: c.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  };

  const views = [
    { id: 'connections', label: t('databaseDependencyMap.viewConnections') },
    { id: 'ports', label: t('databaseDependencyMap.viewPorts') },
    { id: 'processes', label: t('databaseDependencyMap.viewProcesses') },
  ] as const;

  if (databases.length === 0 && dbDependencies.length === 0) {
    return (
      <Card style={{ border: '1px solid #99f6e4', background: '#f0fdfa' }}>
        <CardContent className="pt-6 text-center text-sm" style={{ color: '#0f766e' }}>
          {t('databaseDependencyMap.noData')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value: databases.length,      label: t('databaseDependencyMap.statDatabases'),  icon: '🗄' },
          { value: dbDependencies.length, label: t('databaseDependencyMap.statConnections'), icon: '🔗' },
          { value: portMap.size,          label: t('databaseDependencyMap.statPorts'),       icon: '🔌' },
          { value: processMap.size,       label: t('databaseDependencyMap.statProcesses'),   icon: '⚙️' },
        ].map((s, i) => (
          <div key={i} style={{ borderRadius: 10, padding: '12px 16px', textAlign: 'center', background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)', border: '1px solid #99f6e4', boxShadow: '0 1px 4px rgba(8,145,178,0.08)' }}>
            <div style={{ fontSize: 11, marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#0891b2', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {views.map(v => (
          <button key={v.id} onClick={() => { setActiveView(v.id); setCurrentPage(1); }}
            style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: activeView === v.id ? 'linear-gradient(90deg, #0f766e 0%, #0891b2 100%)' : '#f1f5f9',
              color: activeView === v.id ? '#fff' : '#475569',
              boxShadow: activeView === v.id ? '0 2px 8px rgba(8,145,178,0.3)' : 'none' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── VIEW: Connections ─────────────────────────────────────────────── */}
      {activeView === 'connections' && (
        <>
          {/* Panel Buscar Base de Datos — eliminado por solicitud del usuario */}
          {false && <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
            <CardHeader className="pb-0" style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)',
              borderRadius: selectedDb ? '8px 8px 0 0' : '8px', padding: '14px 20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                  <Search style={{ width: 16, height: 16, color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>Buscar Base de Datos</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    Busca una BD para ver sus conexiones entrantes y salientes
                  </div>
                </div>
                {selectedDb && (
                  <button onClick={() => { setSelectedDb(null); setDbSearchText(''); setCurrentPage(1); }}
                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '4px 10px', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    ✕ Limpiar
                  </button>
                )}
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,0.6)' }} />
                  <input
                    placeholder={selectedDb ? `BD seleccionada: ${selectedDb}` : 'Escribe el nombre de una base de datos...'}
                    value={dbSearchText}
                    onChange={e => { setDbSearchText(e.target.value); setSelectedDb(null); setCurrentPage(1); }}
                    onFocus={e => { if (selectedDb) { setSelectedDb(null); setDbSearchText(''); } e.currentTarget.select(); }}
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                      background: selectedDb ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                      border: selectedDb ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.3)',
                      borderRadius: 8, fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              {dbSearchText && !selectedDb && (() => {
                const q = dbSearchText.toLowerCase();
                const results = databases.filter(db => db.databaseName.toLowerCase().includes(q) || db.serverId.toLowerCase().includes(q)).slice(0, 8);
                if (results.length === 0) return null;
                return (
                  <div style={{ marginTop: 4, background: '#fff', borderRadius: 8, border: '1px solid #99f6e4', boxShadow: '0 4px 16px rgba(8,145,178,0.15)', overflow: 'hidden', zIndex: 20, position: 'relative' }}>
                    {results.map((db, i) => {
                      const connCount = dbDependencies.filter(dep => dep.source.toLowerCase() === db.serverId.toLowerCase() || dep.destination.toLowerCase() === db.serverId.toLowerCase()).length;
                      return (
                        <button key={i} onClick={() => { setSelectedDb(db.databaseName); setDbSearchText(''); setCurrentPage(1); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', width: '100%', border: 'none', borderBottom: i < results.length - 1 ? '1px solid #f0fdfa' : 'none', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f0fdfa')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: getDbColor(db.edition) }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{db.databaseName}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{db.serverId}{db.edition ? ` · ${db.edition}` : ''}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: connCount > 0 ? '#ccfbf1' : '#f1f5f9', color: connCount > 0 ? '#0f766e' : '#94a3b8', border: connCount > 0 ? '1px solid #99f6e4' : '1px solid #e2e8f0', flexShrink: 0 }}>
                            {connCount} conex.
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </CardHeader>

            {/* Resultado: Conexiones Entrantes / Salientes + Grafo */}
            {selectedDb && selectedDbInfo && (
              <CardContent className="p-0" style={{ borderRadius: '0 0 8px 8px', background: '#f8fafc' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: getDbColor(selectedDbInfo!.edition), flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{selectedDb}</span>
                    <span style={{ marginLeft: 10, fontSize: 11, color: '#64748b' }}>
                      Servidor: <b style={{ color: '#0f766e' }}>{selectedDbInfo!.serverId}</b>
                      {selectedDbInfo!.edition && <> · Edición: <b>{selectedDbInfo!.edition}</b></>}
                      {selectedDbInfo!.totalSizeGb !== undefined && <> · Tamaño: <b>{selectedDbInfo!.totalSizeGb} GB</b></>}
                    </span>
                  </div>
                </div>
                {/* Grid 2 cols: Entrantes / Salientes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1px solid #e2e8f0' }}>
                  {/* Conexiones Entrantes */}
                  <div style={{ borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '10px 16px', background: 'linear-gradient(90deg, #064e3b 0%, #065f46 100%)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>⬇️</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Conexiones Entrantes</span>
                      <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                        {dbDependencies.filter(d => d.destination.toLowerCase() === selectedServerId).length}
                      </span>
                    </div>
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {dbDependencies.filter(d => d.destination.toLowerCase() === selectedServerId).length === 0
                        ? <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Sin conexiones entrantes</div>
                        : dbDependencies.filter(d => d.destination.toLowerCase() === selectedServerId).map((dep, i) => (
                          <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid #f0fdfa', background: i % 2 === 0 ? '#fff' : '#f0fdf4', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f0fdf4')}>
                            <Server style={{ width: 11, height: 11, color: '#0891b2', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.source}</div>
                              {dep.sourceApp && <div style={{ fontSize: 10, color: '#64748b' }}>{dep.sourceApp}</div>}
                            </div>
                            {dep.port !== null && (
                              <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#0f766e', background: '#ccfbf1', border: '1px solid #99f6e4', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>:{dep.port}</span>
                            )}
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, flexShrink: 0, background: dep.protocol === 'TCP' ? '#dbeafe' : '#f1f5f9', color: dep.protocol === 'TCP' ? '#1d4ed8' : '#475569' }}>
                              {dep.protocol || '—'}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  {/* Conexiones Salientes */}
                  <div>
                    <div style={{ padding: '10px 16px', background: 'linear-gradient(90deg, #1e3a5f 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>⬆️</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Conexiones Salientes</span>
                      <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                        {dbDependencies.filter(d => d.source.toLowerCase() === selectedServerId).length}
                      </span>
                    </div>
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {dbDependencies.filter(d => d.source.toLowerCase() === selectedServerId).length === 0
                        ? <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Sin conexiones salientes</div>
                        : dbDependencies.filter(d => d.source.toLowerCase() === selectedServerId).map((dep, i) => (
                          <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid #e0f2fe', background: i % 2 === 0 ? '#fff' : '#eff6ff', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#eff6ff')}>
                            <Server style={{ width: 11, height: 11, color: '#7c3aed', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.destination}</div>
                              {dep.destinationApp && <div style={{ fontSize: 10, color: '#64748b' }}>{dep.destinationApp}</div>}
                            </div>
                            {dep.port !== null && (
                              <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>:{dep.port}</span>
                            )}
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, flexShrink: 0, background: dep.protocol === 'TCP' ? '#dbeafe' : '#f1f5f9', color: dep.protocol === 'TCP' ? '#1d4ed8' : '#475569' }}>
                              {dep.protocol || '—'}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>

                {/* Grafo de la BD seleccionada */}
                <div style={{ borderTop: '2px solid #99f6e4' }}>
                  <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '5px', display: 'flex', alignItems: 'center' }}>
                      <Network style={{ width: 14, height: 14, color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Grafo de Dependencias — {selectedDb}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>🗄 = Base de datos &nbsp;|&nbsp; 🖥 = Servidor &nbsp;|&nbsp; Líneas = conexiones de red</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                      {filteredGraphNodes.length} nodos
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => doExport('graph-pdf', () => exportGraphPDF(graphSvgRef.current, filteredGraphNodes, filteredGraphLinks, databases, filteredConnections))}
                        disabled={!!exporting}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        <FileText style={{ width:12, height:12 }} />{exporting==='graph-pdf' ? '...' : 'PDF'}
                      </button>
                      <button onClick={() => doExport('graph-word', () => exportGraphWord(graphSvgRef.current, filteredGraphNodes, filteredGraphLinks, databases, filteredConnections))}
                        disabled={!!exporting}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        <Download style={{ width:12, height:12 }} />{exporting==='graph-word' ? '...' : 'Word'}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#fff' }}>
                    {filteredGraphNodes.length > 0
                      ? <DbForceGraph nodes={filteredGraphNodes} links={filteredGraphLinks} svgRef={graphSvgRef} />
                      : <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 13 }}>{t('databaseDependencyMap.noDataToGraph')}</div>}
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      {Object.entries(DB_COLORS).filter(([k]) => k !== 'default').map(([k, c]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#475569' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </div>
                      ))}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#475569' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />{t('databaseDependencyMap.server')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>}

          {/* 2. Tabla de conexiones con filtro en su header */}
          <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
            <CardHeader className="pb-0" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', borderRadius: '8px 8px 0 0', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                  <Network style={{ width: 16, height: 16, color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>{t('databaseDependencyMap.connectionsTitle')}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {t('databaseDependencyMap.connectionsSubtitle')}
                    {selectedDb && <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 8px', fontWeight: 700 }}>{t('databaseDependencyMap.filteringLabel')} {selectedDb}</span>}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                  {filteredConnections.length} {t('databaseDependencyMap.connectionsCount')}
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                  <button onClick={() => doExport('conn-pdf', () => exportConnectionsPDF(filteredConnections, graphSvgRef.current))}
                    disabled={!!exporting}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    <FileText style={{ width:12, height:12 }} />{exporting==='conn-pdf' ? '...' : 'PDF'}
                  </button>
                  <button onClick={() => doExport('conn-word', () => exportConnectionsWord(filteredConnections, graphSvgRef.current))}
                    disabled={!!exporting}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    <Download style={{ width:12, height:12 }} />{exporting==='conn-word' ? '...' : 'Word'}
                  </button>
                </div>
              </div>
              {/* Filtro de texto — separado, abajo */}
              <div style={{ marginTop: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Filter style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,0.6)' }} />
                  <input
                    placeholder={t('databaseDependencyMap.filterPlaceholder')}
                    value={filterText}
                    onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }}
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, fontSize: 12, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0" style={{ borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', maxHeight: '460px' }}>
                <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr>
                      {([
                        { key: 'source',      label: t('databaseDependencyMap.colSourceServer'), align: 'left'   },
                        { key: 'destination', label: t('databaseDependencyMap.colDestServer'),   align: 'left'   },
                        { key: 'port',        label: t('databaseDependencyMap.colPort'),         align: 'center' },
                        { key: 'protocol',    label: t('databaseDependencyMap.colProtocol'),     align: 'center' },
                        { key: 'serviceName', label: t('databaseDependencyMap.colProcess'),      align: 'left'   },
                      ] as const).map(col => (
                        <th key={col.key} onClick={() => handleSort(col.key)}
                          style={{ padding: '9px 12px', textAlign: col.align, fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.02em',
                            background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
                            {col.label} <ArrowUpDown style={{ width: 10, height: 10, opacity: 0.7 }} />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((dep, i) => {
                      const rowBg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
                      return (
                        <tr key={i} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                          onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                          <td style={{ padding: '6px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {dbServerIds.has(dep.source.toLowerCase()) ? (() => {
                                const db = databases.find(d => d.serverId.toLowerCase() === dep.source.toLowerCase());
                                const t = getDbTypeInfo(dep.source, db?.edition);
                                return <>
                                  <span title={t.label} style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.source}</div>
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                                  </div>
                                </>;
                              })() : (() => {
                                const t = getServerTypeInfoDb(dep.source);
                                return <>
                                  <span title={t.label} style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.source}</div>
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                                  </div>
                                </>;
                              })()}
                            </div>
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {dbServerIds.has(dep.destination.toLowerCase()) ? (() => {
                                const db = databases.find(d => d.serverId.toLowerCase() === dep.destination.toLowerCase());
                                const t = getDbTypeInfo(dep.destination, db?.edition);
                                return <>
                                  <span title={t.label} style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.destination}</div>
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                                  </div>
                                </>;
                              })() : (() => {
                                const t = getServerTypeInfoDb(dep.destination);
                                return <>
                                  <span title={t.label} style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.destination}</div>
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                                  </div>
                                </>;
                              })()}
                            </div>
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                            {dep.port !== null
                              ? <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#0f766e', background: '#ccfbf1', border: '1px solid #99f6e4', borderRadius: 4, padding: '2px 6px' }}>{dep.port}</span>
                              : <span style={{ color: '#cbd5e1', fontSize: 10 }}>—</span>}
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: dep.protocol === 'TCP' ? '#dbeafe' : dep.protocol === 'UDP' ? '#dcfce7' : '#f1f5f9', color: dep.protocol === 'TCP' ? '#1d4ed8' : dep.protocol === 'UDP' ? '#16a34a' : '#475569' }}>
                              {dep.protocol || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '6px 12px', color: '#475569', fontSize: 11 }}>
                            {dep.targetProcessId || dep.serviceName || <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {paginated.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Sin conexiones de bases de datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage, sorted.length)} de {sorted.length}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}><ChevronLeft className="h-3 w-3"/></Button>
                    <span style={{ fontSize: 11, color: '#475569' }}>{currentPage}/{totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages}><ChevronRight className="h-3 w-3"/></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Panel Visualización de Dependencias de Bases de Datos */}
          <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
            <CardHeader className="pb-0" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', borderRadius: '8px 8px 0 0', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                  <Network style={{ width: 16, height: 16, color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>
                    Visualización de Dependencias de Bases de Datos
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {selectedDb ? `Mostrando dependencias de: ${selectedDb}` : filterText ? `Filtrando por: "${filterText}"` : 'Mapa completo de conexiones entre BDs y servidores'}
                    &nbsp;·&nbsp; 🗄 = Base de datos &nbsp;|&nbsp; 🖥 = Servidor
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                  {activeVisNodes.length} nodos
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => doExport('vis-pdf', () => exportGraphPDF(graphSvgRef.current, activeVisNodes, activeVisLinks, databases, filteredConnections))}
                    disabled={!!exporting}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    <FileText style={{ width:12, height:12 }} />{exporting==='vis-pdf' ? '...' : 'PDF'}
                  </button>
                  <button
                    onClick={() => doExport('vis-word', () => exportGraphWord(graphSvgRef.current, activeVisNodes, activeVisLinks, databases, filteredConnections))}
                    disabled={!!exporting}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    <Download style={{ width:12, height:12 }} />{exporting==='vis-word' ? '...' : 'Word'}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0" style={{ borderRadius: '0 0 8px 8px', background: '#fff' }}>
              {/* Stats rápidas */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0' }}>
                {[
                  { label: 'BDs en grafo',  value: activeVisNodes.filter(n => n.type === 'db').length,     color: '#8b5cf6' },
                  { label: 'Servidores',    value: activeVisNodes.filter(n => n.type === 'server').length, color: '#3b82f6' },
                  { label: 'Conexiones',    value: activeVisLinks.length,                                  color: '#0891b2' },
                  { label: 'Nodos totales', value: activeVisNodes.length,                                  color: '#0f766e' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: '10px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none', background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Grafo */}
              <div style={{ padding: '16px' }}>
                {activeVisNodes.length > 0
                  ? <DbForceGraph nodes={activeVisNodes} links={activeVisLinks} svgRef={graphSvgRef} />
                  : <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8', fontSize: 13 }}>
                      Sin datos para graficar. Carga un archivo con dependencias de bases de datos.
                    </div>
                }
              </div>
              {/* Leyenda */}
              <div style={{ padding: '10px 20px 14px', borderTop: '1px solid #f0fdfa', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Leyenda:</span>
                {Object.entries(DB_COLORS).filter(([k]) => k !== 'default').map(([k, c]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: DB_COLORS.default }} />{t('databaseDependencyMap.statDatabases')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />{t('databaseDependencyMap.server')}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── VIEW: Ports ───────────────────────────────────────────────────── */}
      {activeView === 'ports' && (
        <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
          <CardHeader className="pb-0" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', borderRadius: '8px 8px 0 0', padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                <Network style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>Dependencias de Bases de Datos por Puerto</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{t('databaseDependencyMap.portsTitle')}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                {portMap.size} puertos
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0" style={{ borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
            <div style={{ overflowY: 'auto', maxHeight: '460px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['Puerto','Servicio Conocido','Protocolo','Conexiones','Servidores','Proceso/Servicio'].map((h, hi) => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: hi >= 3 && hi <= 4 ? 'center' : 'left', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 55%, #0284c7 100%)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPorts.map(([port, info], i) => {
                    const rowBg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
                    return (
                      <tr key={port} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                        onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                        <td style={{ padding: '6px 12px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#0f766e', background: '#ccfbf1', border: '1px solid #99f6e4', borderRadius: 4, padding: '2px 6px' }}>{port}</span>
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          {KNOWN_PORTS[port] ? <span style={{ fontSize: 10, fontWeight: 600, color: '#0c4a6e', background: '#e0f2fe', padding: '2px 7px', borderRadius: 4 }}>{KNOWN_PORTS[port]}</span> : <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>{t('databaseDependencyMap.custom')}</span>}
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: [...info.protocols][0] === 'TCP' ? '#dbeafe' : [...info.protocols][0] === 'UDP' ? '#dcfce7' : '#f1f5f9', color: [...info.protocols][0] === 'TCP' ? '#1d4ed8' : [...info.protocols][0] === 'UDP' ? '#16a34a' : '#475569' }}>
                            {[...info.protocols].join(', ') || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 999 }}>{info.count}</span>
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', fontSize: 11, color: '#475569' }}>{info.servers.size}</td>
                        <td style={{ padding: '6px 12px', fontSize: 11, color: '#475569', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={[...info.services].join(', ')}>
                          {[...info.services].slice(0,2).join(', ') || '—'}{info.services.size > 2 && ` +${info.services.size-2}`}
                        </td>
                      </tr>
                    );
                  })}
                  {sortedPorts.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Sin datos de puertos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── VIEW: Processes ───────────────────────────────────────────────── */}
      {activeView === 'processes' && (
        <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
          <CardHeader className="pb-0" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', borderRadius: '8px 8px 0 0', padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                <Server style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>Dependencias de Bases de Datos por Proceso/Servicio</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{t('databaseDependencyMap.processesTitle')}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                {processMap.size} procesos
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0" style={{ borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
            <div style={{ overflowY: 'auto', maxHeight: '460px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['Proceso / Servicio','Conexiones','Servidores','Puertos Usados'].map((h, hi) => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: hi >= 1 && hi <= 2 ? 'center' : 'left', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 55%, #0284c7 100%)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedProcesses.map(([proc, info], i) => {
                    const rowBg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
                    return (
                      <tr key={proc} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                        onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                        <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0f172a' }}>{proc}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#ccfbf1', color: '#0f766e', padding: '2px 8px', borderRadius: 999 }}>{info.count}</span>
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', color: '#475569' }}>{info.servers.size}</td>
                        <td style={{ padding: '6px 12px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {[...info.ports].slice(0,5).map(p => (
                              <span key={p} style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: '#0f766e', background: '#ccfbf1', border: '1px solid #99f6e4', borderRadius: 4, padding: '1px 5px' }}>{p}</span>
                            ))}
                            {info.ports.size > 5 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{info.ports.size-5}</span>}
                            {info.ports.size === 0 && <span style={{ fontSize: 10, color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedProcesses.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Sin datos de procesos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── DB inventory table ────────────────────────────────────────────── */}
      <Card className="border-0 shadow-lg" style={{ overflow: 'visible' }}>
        <CardHeader className="pb-3" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', borderRadius: '8px 8px 0 0', padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
              <Database style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>Inventario de Bases de Datos</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>BD Name · Database ID · Server ID · DB Instance Name · Total Size (GB) · Dependencias</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              {databases.length} registros
            </div>
            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
              <button onClick={() => doExport('inv-pdf', () => exportInventoryPDF(databases))} disabled={!!exporting}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                <FileText style={{ width:12, height:12 }} />{exporting==='inv-pdf' ? '...' : 'PDF'}
              </button>
              <button onClick={() => doExport('inv-excel', () => exportInventoryExcel(databases))} disabled={!!exporting}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                <FileSpreadsheet style={{ width:12, height:12 }} />{exporting==='inv-excel' ? '...' : 'Excel'}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0" style={{ borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', maxHeight: '480px' }}>
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr>
                  {([
                    { label: '#',                align: 'center', width: 32  },
                    { label: 'BD Name',          align: 'left',   width: undefined },
                    { label: 'Database ID',      align: 'left',   width: undefined },
                    { label: 'Server ID',        align: 'left',   width: undefined },
                    { label: 'DB Instance Name', align: 'left',   width: undefined },
                    { label: 'Total Size (GB)',  align: 'right',  width: 100 },
                    { label: 'Conexiones',       align: 'center', width: 80  },
                    { label: 'Estado',           align: 'center', width: 80  },
                  ] as const).map(col => (
                    <th key={col.label} style={{ padding: '8px 10px', textAlign: col.align, fontSize: '11px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', width: col.width, background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 55%, #0284c7 100%)', position: 'sticky', top: 0, zIndex: 10, letterSpacing: '0.02em' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {databases.map((db, i) => {
                  const connCount = db.dependencies.asSource.length + db.dependencies.asDestination.length;
                  const rowBg = i % 2 === 0 ? '#ffffff' : '#f8f7ff';
                  return (
                    <tr key={i} style={{ background: rowBg, borderBottom: '1px solid #ccfbf1', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                      onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: '#0891b2', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '10px' }}>{i + 1}</td>
                      <td style={{ padding: '5px 10px', maxWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          {(() => { const t = getDbTypeInfo(db.databaseName, db.edition); return (
                            <span title={t.label} style={{ fontSize: 14, flexShrink: 0 }}>{t.icon}</span>
                          ); })()}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#1e1b4b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={db.databaseName}>{db.databaseName}</div>
                            {(() => { const t = getDbTypeInfo(db.databaseName, db.edition); return (
                              <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                            ); })()}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '5px 10px', maxWidth: 130 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#6b7280', background: '#f3f4f6', padding: '2px 5px', borderRadius: 4, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={db.databaseId || '-'}>{db.databaseId || '—'}</span>
                      </td>
                      <td style={{ padding: '5px 10px', maxWidth: 150 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                          {(() => { const t = getServerTypeInfoDb(db.serverId); return (
                            <span title={t.label} style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                          ); })()}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 11 }} title={db.serverId}>{db.serverId}</div>
                            {(() => { const t = getServerTypeInfoDb(db.serverId); return (
                              <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                            ); })()}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '5px 10px', maxWidth: 150 }}>
                        <span style={{ color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={db.dbInstanceName || '—'}>{db.dbInstanceName || <span style={{ color: '#d1d5db' }}>—</span>}</span>
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'right' }}>
                        {db.totalSizeGb !== undefined ? <span style={{ fontWeight: 700, color: '#0f766e', fontVariantNumeric: 'tabular-nums' }}>{db.totalSizeGb.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '10px', padding: '2px 7px', borderRadius: 999, background: connCount > 0 ? '#ccfbf1' : '#f3f4f6', color: connCount > 0 ? '#0f766e' : '#9ca3af' }}>{connCount}</span>
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: db.hasDependencies ? '#dcfce7' : '#f3f4f6', color: db.hasDependencies ? '#16a34a' : '#6b7280' }}>
                          {db.hasDependencies ? '✓ Con deps' : 'Sin deps'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {databases.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontStyle: 'italic', fontSize: '12px' }}>Sin bases de datos registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {databases.some(d => d.totalSizeGb !== undefined) && (
            <div className="px-4 py-2 flex items-center gap-3 text-xs border-t" style={{ background: 'linear-gradient(90deg, #f0fdfa 0%, #e0f2fe 100%)', borderColor: '#99f6e4' }}>
              <span style={{ color: '#0f766e', fontWeight: 500 }}>Total almacenamiento:</span>
              <span style={{ fontWeight: 700, color: '#0c4a6e', fontVariantNumeric: 'tabular-nums' }}>
                {databases.reduce((sum, d) => sum + (d.totalSizeGb ?? 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} GB
              </span>
              <span style={{ color: '#0891b2', marginLeft: 4 }}>({databases.filter(d => d.totalSizeGb !== undefined).length}/{databases.length} con tamaño)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Pie Chart: Distribución de almacenamiento ─────────────────────── */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-3" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', borderRadius: '8px 8px 0 0', padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
              <Database style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>Distribución de Almacenamiento por Base de Datos</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Total Size (GB) y Max TPS por DB Name — pasa el cursor sobre cada sector para ver detalles</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              {databases.length} instancias
            </div>
            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
              <button onClick={() => doExport('dist-pdf', () => exportDistributionPDF(databases, pieSvgRef.current))} disabled={!!exporting}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                <FileText style={{ width:12, height:12 }} />{exporting==='dist-pdf' ? '...' : 'PDF'}
              </button>
              <button onClick={() => doExport('dist-word', () => exportDistributionWord(databases, pieSvgRef.current))} disabled={!!exporting}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                <Download style={{ width:12, height:12 }} />{exporting==='dist-word' ? '...' : 'Word'}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0" style={{ position: 'relative' }}>
          <DbPieChart databases={databases} svgRef={pieSvgRef} />
        </CardContent>
      </Card>
    </div>
  );
}
