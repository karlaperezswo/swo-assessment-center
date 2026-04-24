import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Network, FileDown, FileText, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/useTranslation';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AppDependencyRow {
  srcAppId: string;
  destAppId: string;
  srcAppName?: string;
  destAppName?: string;
  connectionType?: string;
  port?: number | null;
  protocol?: string;
  notes?: string;
}
interface NetworkDependency {
  source: string; destination: string; port: number | null; protocol: string;
  srcAppId?: string; destAppId?: string;
}
interface AppDependencyMapProps {
  appDependencies?: AppDependencyRow[];
  allDependencies?: NetworkDependency[];
}
interface AppLink {
  srcAppId: string; destAppId: string;
  srcAppName?: string; destAppName?: string;
  count: number; ports: (number | null)[]; protocols: string[]; connectionTypes: string[];
}

// ── App type detector ─────────────────────────────────────────────────────────
function getAppTypeInfo(appId: string, appName?: string): { icon: string; label: string; color: string; bg: string } {
  const s = `${appId} ${appName ?? ''}`.toLowerCase();
  if (/active.?dir|ldap|ad[-_\s]|\\bads?\b/.test(s))
    return { icon: '🏢', label: 'Active Directory', color: '#7c3aed', bg: '#ede9fe' };
  if (/web|http|nginx|apache|iis|tomcat|frontend|portal|site/.test(s))
    return { icon: '🌐', label: 'Web App', color: '#0891b2', bg: '#e0f2fe' };
  if (/api|rest|graphql|gateway|service|svc|microservice/.test(s))
    return { icon: '⚙️', label: 'API / Servicio', color: '#0f766e', bg: '#ccfbf1' };
  if (/db|database|sql|oracle|mysql|postgres|mongo|redis|elastic/.test(s))
    return { icon: '🗄️', label: 'Base de Datos', color: '#b45309', bg: '#fef3c7' };
  if (/erp|sap|crm|dynamics|salesforce|oracle.?e-biz/.test(s))
    return { icon: '🏭', label: 'ERP / CRM', color: '#be185d', bg: '#fce7f3' };
  if (/mail|exchange|smtp|outlook|email/.test(s))
    return { icon: '📧', label: 'Correo', color: '#1d4ed8', bg: '#dbeafe' };
  if (/file|ftp|sftp|share|nas|storage|blob/.test(s))
    return { icon: '📁', label: 'Almacenamiento', color: '#92400e', bg: '#fef3c7' };
  if (/monitor|log|kibana|grafana|splunk|datadog|prometheus/.test(s))
    return { icon: '📊', label: 'Monitoreo', color: '#065f46', bg: '#d1fae5' };
  if (/auth|sso|oauth|saml|keycloak|identity|iam/.test(s))
    return { icon: '🔐', label: 'Autenticación', color: '#7c3aed', bg: '#ede9fe' };
  if (/queue|kafka|rabbit|mq|bus|event|stream/.test(s))
    return { icon: '📨', label: 'Mensajería', color: '#b45309', bg: '#fef3c7' };
  if (/backup|bkp|recovery|dr/.test(s))
    return { icon: '💾', label: 'Backup', color: '#475569', bg: '#f1f5f9' };
  if (/print|scan|fax/.test(s))
    return { icon: '🖨️', label: 'Impresión', color: '#475569', bg: '#f1f5f9' };
  return { icon: '📦', label: 'Aplicación', color: '#475569', bg: '#f1f5f9' };
}


function GlassBtn({ onClick, disabled, icon, label }: { onClick: () => void; disabled: boolean; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)',
        color: '#fff', fontSize: 11, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, backdropFilter: 'blur(4px)' }}>
      {icon}{label}
    </button>
  );
}

// ── SVG → PNG data URL ────────────────────────────────────────────────────────
function svgToDataUrl(svgEl: SVGSVGElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const bbox = svgEl.getBoundingClientRect();
    const W = bbox.width || 900; const H = bbox.height || 540;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(W)); clone.setAttribute('height', String(H));
    clone.style.background = '#f8fafc';
    const svgStr = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = W * 2; c.height = H * 2;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.scale(2, 2); ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/png'));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// ── D3 Force Graph ────────────────────────────────────────────────────────────
function AppForceGraph({
  links, svgRef, activeTypeFilter, allLinks,
}: {
  links: AppLink[];
  svgRef: React.RefObject<SVGSVGElement>;
  activeTypeFilter: string | null;
  allLinks: AppLink[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!allLinks.length || !containerRef.current) return;
    const W = containerRef.current.clientWidth || 900;
    const H = 540;

    // Build full node map from allLinks so positions are stable
    const nodeMap = new Map<string, { id: string; label: string; connections: number; appName?: string }>();
    allLinks.forEach(l => {
      const srcLabel = l.srcAppName ? `${l.srcAppId} — ${l.srcAppName}` : l.srcAppId;
      const dstLabel = l.destAppName ? `${l.destAppId} — ${l.destAppName}` : l.destAppId;
      if (!nodeMap.has(l.srcAppId)) nodeMap.set(l.srcAppId, { id: l.srcAppId, label: srcLabel, connections: 0, appName: l.srcAppName });
      if (!nodeMap.has(l.destAppId)) nodeMap.set(l.destAppId, { id: l.destAppId, label: dstLabel, connections: 0, appName: l.destAppName });
      nodeMap.get(l.srcAppId)!.connections++;
      nodeMap.get(l.destAppId)!.connections++;
    });
    const nodes = Array.from(nodeMap.values());

    // Active link ids for dimming
    const activeNodeIds = new Set<string>();
    links.forEach(l => { activeNodeIds.add(l.srcAppId); activeNodeIds.add(l.destAppId); });
    const simLinks = allLinks.map(l => ({ source: l.srcAppId, target: l.destAppId, count: l.count, active: links.some(al => al.srcAppId === l.srcAppId && al.destAppId === l.destAppId) }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(160))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(55));

    const svg = d3.select(svgRef.current)
      .attr('width', W).attr('height', H)
      .style('background', '#f8fafc').style('border-radius', '0 0 8px 8px');
    svg.selectAll('*').remove();

    const g = svg.append('g');
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3])
      .on('zoom', (ev) => g.attr('transform', ev.transform)) as any);

    const defs = svg.append('defs');
    defs.append('marker').attr('id', 'arrow-app')
      .attr('viewBox', '0 -5 10 10').attr('refX', 32).attr('refY', 0)
      .attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#0891b2').attr('opacity', 0.8);

    const linkSel = g.append('g').selectAll('line').data(simLinks).enter().append('line')
      .attr('stroke', '#0891b2')
      .attr('stroke-opacity', (d: any) => activeTypeFilter ? (d.active ? 0.55 : 0.08) : 0.45)
      .attr('stroke-width', (d: any) => Math.min(1.5 + d.count * 0.3, 6))
      .attr('marker-end', 'url(#arrow-app)');

    const linkLabel = g.append('g').selectAll('text').data(simLinks).enter().append('text')
      .attr('font-size', 9).attr('fill', '#64748b').attr('text-anchor', 'middle')
      .attr('font-family', 'sans-serif')
      .attr('opacity', (d: any) => activeTypeFilter ? (d.active ? 1 : 0.1) : 1)
      .text((d: any) => d.count > 1 ? `×${d.count}` : '');

    const nodeSel = g.append('g').selectAll('circle').data(nodes).enter().append('circle')
      .attr('r', (d: any) => Math.min(16 + d.connections * 2.5, 34))
      .attr('fill', (d: any) => getAppTypeInfo(d.id, d.appName).color)
      .attr('stroke', '#fff').attr('stroke-width', 2.5)
      .attr('opacity', (d: any) => activeTypeFilter ? (activeNodeIds.has(d.id) ? 1 : 0.15) : 1)
      .style('cursor', 'grab')
      .call(d3.drag<SVGCircleElement, any>()
        .on('start', (ev, d) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end', (ev, d) => { if (!ev.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as any);

    nodeSel.append('title').text((d: any) => d.label);

    const labelSel = g.append('g').selectAll('text').data(nodes).enter().append('text')
      .attr('font-size', 9).attr('font-weight', '500').attr('fill', '#111827')
      .attr('font-family', 'sans-serif')
      .attr('text-anchor', 'middle').attr('pointer-events', 'none')
      .attr('opacity', (d: any) => activeTypeFilter ? (activeNodeIds.has(d.id) ? 1 : 0.2) : 1)
      .attr('dy', (d: any) => Math.min(16 + d.connections * 2.5, 34) + 14)
      .text((d: any) => d.id.length > 22 ? d.id.slice(0, 21) + '…' : d.id);

    simulation.on('tick', () => {
      linkSel.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      linkLabel.attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 4);
      nodeSel.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      labelSel.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });
    return () => { simulation.stop(); };
  }, [allLinks, activeTypeFilter]);

  return <div ref={containerRef} style={{ width: '100%' }}><svg ref={svgRef} style={{ width: '100%', display: 'block' }} /></div>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AppDependencyMap({ appDependencies = [], allDependencies = [] }: AppDependencyMapProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isExportingTable, setIsExportingTable] = useState(false);
  const [isExportingGraph, setIsExportingGraph] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);

  const appLinks: AppLink[] = useMemo(() => {
    const map = new Map<string, AppLink>();
    const addRow = (src: string, dst: string, row?: AppDependencyRow, dep?: NetworkDependency) => {
      if (!src || !dst || src === dst) return;
      const key = `${src}|||${dst}`;
      if (!map.has(key)) map.set(key, { srcAppId: src, destAppId: dst, srcAppName: row?.srcAppName, destAppName: row?.destAppName, count: 0, ports: [], protocols: [], connectionTypes: [] });
      const e = map.get(key)!;
      e.count++;
      const port = row?.port ?? dep?.port ?? null;
      if (port !== null && port !== undefined && !e.ports.includes(port)) e.ports.push(port);
      const proto = row?.protocol ?? dep?.protocol;
      if (proto && !e.protocols.includes(proto)) e.protocols.push(proto);
      const ct = row?.connectionType;
      if (ct && !e.connectionTypes.includes(ct)) e.connectionTypes.push(ct);
    };
    if (appDependencies.length > 0) appDependencies.forEach(r => addRow(r.srcAppId, r.destAppId, r));
    else allDependencies.forEach(d => { if (d.srcAppId && d.destAppId) addRow(d.srcAppId, d.destAppId, undefined, d); });
    return Array.from(map.values());
  }, [appDependencies, allDependencies]);

  const uniqueApps = useMemo(() => { const s = new Set<string>(); appLinks.forEach(l => { s.add(l.srcAppId); s.add(l.destAppId); }); return s.size; }, [appLinks]);

  // ── Legend: types present in the data ──────────────────────────────────────
  const legendTypes = useMemo(() => {
    const typeMap = new Map<string, { icon: string; label: string; color: string; bg: string; count: number }>();
    appLinks.forEach(l => {
      [{ id: l.srcAppId, name: l.srcAppName }, { id: l.destAppId, name: l.destAppName }].forEach(({ id, name }) => {
        const t = getAppTypeInfo(id, name);
        if (!typeMap.has(t.label)) typeMap.set(t.label, { ...t, count: 0 });
        typeMap.get(t.label)!.count++;
      });
    });
    return Array.from(typeMap.values()).sort((a, b) => b.count - a.count);
  }, [appLinks]);

  // ── Filtered links for graph (by type filter) ───────────────────────────────
  const graphFilteredLinks = useMemo(() => {
    if (!activeTypeFilter) return appLinks;
    return appLinks.filter(l => {
      const srcType = getAppTypeInfo(l.srcAppId, l.srcAppName).label;
      const dstType = getAppTypeInfo(l.destAppId, l.destAppName).label;
      return srcType === activeTypeFilter || dstType === activeTypeFilter;
    });
  }, [appLinks, activeTypeFilter]);

  const filtered = useMemo(() => {
    if (!filterText) return appLinks;
    const q = filterText.toLowerCase();
    return appLinks.filter(l => l.srcAppId.toLowerCase().includes(q) || l.destAppId.toLowerCase().includes(q) ||
      (l.srcAppName ?? '').toLowerCase().includes(q) || (l.destAppName ?? '').toLowerCase().includes(q) ||
      l.protocols.join(',').toLowerCase().includes(q) || l.connectionTypes.join(',').toLowerCase().includes(q));
  }, [appLinks, filterText]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String((a as any)[sortConfig.key] ?? ''); const bv = String((b as any)[sortConfig.key] ?? '');
      return sortConfig.direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIdx, startIdx + itemsPerPage);
  const handleSort = (key: string) => setSortConfig(c => c?.key === key ? { key, direction: c.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  const dataSource = appDependencies.length > 0 ? 'Pestaña "Application Dependency"' : 'Columnas SRC/DEST App ID (Server Communication)';
  const dateStr = new Date().toLocaleString('es-ES');
  const fileDate = new Date().toISOString().split('T')[0];

  // ── Shared PDF builder ──────────────────────────────────────────────────────
  const buildBasePDF = async (includeGraph: boolean) => {
    const jsPDF = (await import('jspdf')).jsPDF;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pW = pdf.internal.pageSize.getWidth();   // 297
    const pH = pdf.internal.pageSize.getHeight();  // 210

    // ── Portada ──
    pdf.setFillColor(15, 118, 110);
    pdf.rect(0, 0, pW, 30, 'F');
    // Degradado simulado con rect adicional
    pdf.setFillColor(8, 145, 178);
    pdf.rect(pW * 0.55, 0, pW * 0.45, 30, 'F');
    pdf.setFillColor(2, 132, 199);
    pdf.rect(pW * 0.8, 0, pW * 0.2, 30, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
    pdf.text('Dependencias de Aplicaciones', 12, 13);
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text(`Fuente: ${dataSource}`, 12, 20);
    pdf.text(`Generado: ${dateStr}`, 12, 25);
    pdf.text(`${appLinks.length} dependencias · ${uniqueApps} aplicaciones`, pW - 12, 20, { align: 'right' });

    // ── Stats cards ──
    const stats = [
      { label: 'Total Dependencias', value: String(appLinks.length) },
      { label: 'Aplicaciones Únicas', value: String(uniqueApps) },
      { label: 'Filtradas', value: String(sorted.length) },
    ];
    const cardW = 58; let sx = 12; const sy = 34;
    stats.forEach(s => {
      pdf.setFillColor(240, 253, 250); pdf.rect(sx, sy, cardW, 14, 'F');
      pdf.setDrawColor(153, 246, 228); pdf.rect(sx, sy, cardW, 14, 'S');
      pdf.setTextColor(15, 118, 110); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
      pdf.text(s.value, sx + cardW / 2, sy + 8, { align: 'center' });
      pdf.setTextColor(8, 145, 178); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
      pdf.text(s.label, sx + cardW / 2, sy + 12, { align: 'center' });
      sx += cardW + 4;
    });

    // ── Tabla ──
    const colWidths = [44, 44, 16, 38, 38, 34, 28];
    const headers = ['SRC App ID', 'DEST App ID', 'Conex.', 'Nombre Origen', 'Nombre Destino', 'Protocolo/Tipo', 'Puertos'];
    const tableX = 12; const tableW = pW - 24;
    let y = 54;

    // Header row
    pdf.setFillColor(15, 118, 110);
    pdf.rect(tableX, y, tableW, 8, 'F');
    pdf.setTextColor(255, 255, 255); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
    let cx = tableX + 2;
    headers.forEach((h, i) => { pdf.text(h, cx, y + 5.5); cx += colWidths[i]; });
    y += 9;

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7);
    sorted.forEach((l, idx) => {
      if (y > pH - 14) {
        pdf.addPage();
        // Repeat header on new page
        pdf.setFillColor(15, 118, 110); pdf.rect(tableX, 10, tableW, 8, 'F');
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
        cx = tableX + 2; headers.forEach((h, i) => { pdf.text(h, cx, 15.5); cx += colWidths[i]; });
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7);
        y = 20;
      }
      if (idx % 2 === 0) { pdf.setFillColor(240, 253, 250); pdf.rect(tableX, y - 1, tableW, 7, 'F'); }
      pdf.setTextColor(15, 23, 42);
      cx = tableX + 2;
      const row = [
        l.srcAppId, l.destAppId, String(l.count),
        l.srcAppName ?? '—', l.destAppName ?? '—',
        [...l.connectionTypes, ...l.protocols].filter(Boolean).join(', ') || '—',
        l.ports.filter(p => p !== null).slice(0, 4).join(', ') || '—',
      ];
      row.forEach((v, i) => {
        const maxC = Math.floor(colWidths[i] / 1.65);
        pdf.text(v.length > maxC ? v.slice(0, maxC - 1) + '…' : v, cx, y + 4.5);
        cx += colWidths[i];
      });
      y += 7;
    });

    // ── Grafo ──
    if (includeGraph && svgRef.current) {
      pdf.addPage();
      // Graph page header
      pdf.setFillColor(15, 118, 110); pdf.rect(0, 0, pW, 18, 'F');
      pdf.setFillColor(8, 145, 178); pdf.rect(pW * 0.55, 0, pW * 0.45, 18, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
      pdf.text('Grafo de Dependencias de Aplicaciones', 12, 11);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text(`${uniqueApps} aplicaciones · ${appLinks.length} conexiones`, pW - 12, 11, { align: 'right' });

      const imgData = await svgToDataUrl(svgRef.current);
      const svgBbox = svgRef.current.getBoundingClientRect();
      const ratio = svgBbox.width / svgBbox.height;
      const maxW = pW - 24; const maxH = pH - 28;
      let imgW = maxW; let imgH = imgW / ratio;
      if (imgH > maxH) { imgH = maxH; imgW = imgH * ratio; }
      const imgX = 12 + (maxW - imgW) / 2;
      pdf.addImage(imgData, 'PNG', imgX, 22, imgW, imgH);
    }

    // ── Footer on all pages ──
    const totalPgs = (pdf as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPgs; p++) {
      pdf.setPage(p);
      pdf.setFillColor(248, 250, 252); pdf.rect(0, pH - 8, pW, 8, 'F');
      pdf.setDrawColor(226, 232, 240); pdf.line(0, pH - 8, pW, pH - 8);
      pdf.setTextColor(100, 116, 139); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
      pdf.text('© SoftwareOne – AWS Migration Assessment Platform', 12, pH - 3);
      pdf.text(`Página ${p} de ${totalPgs}`, pW - 12, pH - 3, { align: 'right' });
    }

    return pdf;
  };

  // ── Export tabla PDF ────────────────────────────────────────────────────────
  const exportTablePDF = async () => {
    if (!appLinks.length) { toast.error(t('appDependencyMap.noDataToExport')); return; }
    setIsExportingTable(true);
    toast.loading(t('appDependencyMap.generatingTablePdf'), { id: 'tbl-pdf' });
    try {
      const pdf = await buildBasePDF(false);
      pdf.save(`dependencias_aplicaciones_tabla_${fileDate}.pdf`);
      toast.success(t('appDependencyMap.tablePdfGenerated'), { id: 'tbl-pdf', duration: 4000 });
    } catch (e) { console.error(e); toast.error(t('appDependencyMap.errorGeneratingTablePdf'), { id: 'tbl-pdf' }); }
    finally { setIsExportingTable(false); }
  };

  // ── Export tabla Word ───────────────────────────────────────────────────────
  const exportTableWord = async () => {
    if (!appLinks.length) { toast.error(t('appDependencyMap.noDataToExport')); return; }
    setIsExportingTable(true);
    toast.loading(t('appDependencyMap.generatingTableWord'), { id: 'tbl-word' });
    try {
      const rows = sorted.map((l, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
        return `<tr style="background:${bg}">
          <td style="padding:5px 8px;border:1px solid #e5e7eb;font-weight:700;color:#0f766e;font-family:Courier New,monospace">${l.srcAppId}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;font-weight:700;color:#0284c7;font-family:Courier New,monospace">${l.destAppId}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:#0f766e">${l.count}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb">${l.srcAppName ?? '—'}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb">${l.destAppName ?? '—'}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb">${[...l.connectionTypes, ...l.protocols].filter(Boolean).join(', ') || '—'}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;font-family:Courier New,monospace">${l.ports.filter(p => p !== null).slice(0, 5).join(', ') || '—'}</td>
        </tr>`;
      }).join('');

      const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>Dependencias de Aplicaciones</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4 landscape; margin: 1.5cm 1.8cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 9pt; color: #1f2937; margin: 0; }
  .cover { background: linear-gradient(135deg,#0f766e,#0891b2,#0284c7); color: #fff; padding: 18px 20px 14px; margin-bottom: 16px; }
  .cover h1 { margin: 0 0 4px; font-size: 18pt; font-weight: bold; }
  .cover p { margin: 2px 0; font-size: 9pt; opacity: .85; }
  .stats { display: table; width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 14px; }
  .stat { display: table-cell; background: #f0fdfa; border: 1px solid #99f6e4; padding: 8px 12px; text-align: center; width: 33%; }
  .stat .n { font-size: 20pt; font-weight: bold; color: #0f766e; display: block; }
  .stat .l { font-size: 8pt; color: #0891b2; }
  h2 { color: #0f766e; font-size: 12pt; border-bottom: 2px solid #99f6e4; padding-bottom: 4px; margin: 18px 0 8px; }
  table.data { width: 100%; border-collapse: collapse; font-size: 8pt; table-layout: fixed; }
  table.data thead tr { background: linear-gradient(90deg,#0f766e,#0891b2); color: #fff; }
  table.data th { padding: 6px 8px; border: 1px solid rgba(255,255,255,0.2); font-weight: bold; text-align: left; }
  table.data td { padding: 5px 8px; border: 1px solid #e5e7eb; word-break: break-word; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 8pt; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style></head>
<body>
<div class="cover">
  <h1>Dependencias de Aplicaciones</h1>
  <p>Fuente: ${dataSource}</p>
  <p>Generado: ${dateStr} &nbsp;|&nbsp; ${appLinks.length} dependencias · ${uniqueApps} aplicaciones</p>
</div>
<div class="stats">
  <div class="stat"><span class="n">${appLinks.length}</span><span class="l">Total Dependencias</span></div>
  <div class="stat"><span class="n">${uniqueApps}</span><span class="l">Aplicaciones Únicas</span></div>
  <div class="stat"><span class="n">${sorted.length}</span><span class="l">Filtradas</span></div>
</div>
<h2>Conexiones entre Aplicaciones (SRC App ID → DEST App ID)</h2>
<table class="data">
  <colgroup>
    <col style="width:14%"><col style="width:14%"><col style="width:7%">
    <col style="width:16%"><col style="width:16%"><col style="width:18%"><col style="width:15%">
  </colgroup>
  <thead><tr>
    <th>SRC App ID</th><th>DEST App ID</th><th>Conex.</th>
    <th>Nombre Origen</th><th>Nombre Destino</th><th>Protocolo/Tipo</th><th>Puertos</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">© ${new Date().getFullYear()} SoftwareOne – AWS Migration Assessment Platform</div>
</body></html>`;

      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `dependencias_aplicaciones_tabla_${fileDate}.doc`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success(t('appDependencyMap.tableWordGenerated'), { id: 'tbl-word', duration: 4000 });
    } catch (e) { console.error(e); toast.error(t('appDependencyMap.errorGeneratingTableWord'), { id: 'tbl-word' }); }
    finally { setIsExportingTable(false); }
  };

  // ── Export grafo PDF ────────────────────────────────────────────────────────
  const exportGraphPDF = async () => {
    if (!svgRef.current) { toast.error(t('appDependencyMap.graphNotAvailable')); return; }
    setIsExportingGraph(true);
    toast.loading(t('appDependencyMap.generatingGraphPdf'), { id: 'grph-pdf' });
    try {
      const pdf = await buildBasePDF(true);
      pdf.save(`dependencias_aplicaciones_grafo_${fileDate}.pdf`);
      toast.success(t('appDependencyMap.graphPdfGenerated'), { id: 'grph-pdf', duration: 4000 });
    } catch (e) { console.error(e); toast.error(t('appDependencyMap.errorGeneratingGraphPdf'), { id: 'grph-pdf' }); }
    finally { setIsExportingGraph(false); }
  };

  // ── Export grafo Word ───────────────────────────────────────────────────────
  const exportGraphWord = async () => {
    if (!svgRef.current) { toast.error(t('appDependencyMap.graphNotAvailable')); return; }
    setIsExportingGraph(true);
    toast.loading(t('appDependencyMap.generatingGraphWord'), { id: 'grph-word' });
    try {
      const imgData = await svgToDataUrl(svgRef.current);
      const rows = sorted.slice(0, 50).map((l, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
        return `<tr style="background:${bg}">
          <td style="padding:4px 7px;border:1px solid #e5e7eb;font-weight:700;color:#0f766e">${l.srcAppId}</td>
          <td style="padding:4px 7px;border:1px solid #e5e7eb;font-weight:700;color:#0284c7">${l.destAppId}</td>
          <td style="padding:4px 7px;border:1px solid #e5e7eb;text-align:center;font-weight:700">${l.count}</td>
          <td style="padding:4px 7px;border:1px solid #e5e7eb">${l.srcAppName ?? '—'}</td>
          <td style="padding:4px 7px;border:1px solid #e5e7eb">${l.destAppName ?? '—'}</td>
        </tr>`;
      }).join('');
      const moreNote = sorted.length > 50 ? `<p style="font-size:8pt;color:#64748b;margin-top:6px">* Se muestran las primeras 50 de ${sorted.length} dependencias. Exporta la tabla completa con el botón "Exportar Word" del panel de tabla.</p>` : '';

      const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>Grafo de Dependencias de Aplicaciones</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4 landscape; margin: 1.5cm 1.8cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 9pt; color: #1f2937; margin: 0; }
  .cover { background: linear-gradient(135deg,#0f766e,#0891b2,#0284c7); color: #fff; padding: 18px 20px 14px; margin-bottom: 16px; }
  .cover h1 { margin: 0 0 4px; font-size: 18pt; font-weight: bold; }
  .cover p { margin: 2px 0; font-size: 9pt; opacity: .85; }
  .stats { display: table; width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 14px; }
  .stat { display: table-cell; background: #f0fdfa; border: 1px solid #99f6e4; padding: 8px 12px; text-align: center; width: 33%; }
  .stat .n { font-size: 20pt; font-weight: bold; color: #0f766e; display: block; }
  .stat .l { font-size: 8pt; color: #0891b2; }
  h2 { color: #0f766e; font-size: 12pt; border-bottom: 2px solid #99f6e4; padding-bottom: 4px; margin: 18px 0 8px; }
  .graph-img { width: 100%; max-width: 100%; height: auto; border: 1px solid #e5e7eb; display: block; border-radius: 6px; }
  table.data { width: 100%; border-collapse: collapse; font-size: 8pt; table-layout: fixed; }
  table.data thead tr { background: linear-gradient(90deg,#0f766e,#0891b2); color: #fff; }
  table.data th { padding: 6px 8px; border: 1px solid rgba(255,255,255,0.2); font-weight: bold; }
  table.data td { padding: 5px 8px; border: 1px solid #e5e7eb; word-break: break-word; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 8pt; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style></head>
<body>
<div class="cover">
  <h1>Grafo de Dependencias de Aplicaciones</h1>
  <p>Fuente: ${dataSource}</p>
  <p>Generado: ${dateStr} &nbsp;|&nbsp; ${appLinks.length} dependencias · ${uniqueApps} aplicaciones</p>
</div>
<div class="stats">
  <div class="stat"><span class="n">${appLinks.length}</span><span class="l">Total Dependencias</span></div>
  <div class="stat"><span class="n">${uniqueApps}</span><span class="l">Aplicaciones Únicas</span></div>
  <div class="stat"><span class="n">${sorted.length}</span><span class="l">Filtradas</span></div>
</div>
<h2>Diagrama de Dependencias</h2>
<img class="graph-img" src="${imgData}" alt="Grafo de dependencias de aplicaciones" />
<h2>Resumen de Conexiones (Top 50)</h2>
<table class="data">
  <colgroup><col style="width:20%"><col style="width:20%"><col style="width:10%"><col style="width:25%"><col style="width:25%"></colgroup>
  <thead><tr><th>SRC App ID</th><th>DEST App ID</th><th>Conex.</th><th>Nombre Origen</th><th>Nombre Destino</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
${moreNote}
<div class="footer">© ${new Date().getFullYear()} SoftwareOne – AWS Migration Assessment Platform</div>
</body></html>`;

      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `dependencias_aplicaciones_grafo_${fileDate}.doc`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success(t('appDependencyMap.graphWordGenerated'), { id: 'grph-word', duration: 4000 });
    } catch (e) { console.error(e); toast.error(t('appDependencyMap.errorGeneratingGraphWord'), { id: 'grph-word' }); }
    finally { setIsExportingGraph(false); }
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { value: appLinks.length, label: 'Total Dependencias', icon: '🔗' },
          { value: uniqueApps,      label: 'Aplicaciones Únicas', icon: '📦' },
          { value: sorted.length,   label: 'Filtradas',           icon: '🔍' },
        ].map((s, i) => (
          <div key={i} style={{
            borderRadius: 10, padding: '12px 16px', textAlign: 'center',
            background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
            border: '1px solid #99f6e4', boxShadow: '0 1px 4px rgba(8,145,178,0.08)'
          }}>
            <div style={{ fontSize: 11, marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#0891b2', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Source badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Layers style={{ width: 14, height: 14, color: '#0891b2' }} />
        <span style={{ fontSize: 11, color: '#64748b' }}>Fuente:</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#0f766e', background: '#f0fdfa',
          border: '1px solid #99f6e4', borderRadius: 4, padding: '2px 8px' }}>
          {dataSource}
        </span>
      </div>

      {/* ── Panel: Conexiones entre Aplicaciones ─────────────────────────── */}
      <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(8,145,178,0.10)', border: '1px solid #99f6e4' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
              <Network style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>
                Conexiones entre Aplicaciones
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                SRC App ID → DEST App ID — dependencias detectadas
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px',
              fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              {appLinks.length} conexiones
            </div>
            {/* Export buttons */}
            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
              <GlassBtn onClick={exportTablePDF} disabled={isExportingTable}
                icon={<FileText style={{ width: 12, height: 12 }} />}
                label={isExportingTable ? '...' : 'PDF'} />
              <GlassBtn onClick={exportTableWord} disabled={isExportingTable}
                icon={<FileDown style={{ width: 12, height: 12 }} />}
                label={isExportingTable ? '...' : 'Word'} />
            </div>
          </div>
          {/* Filter */}
          <div style={{ marginTop: 12, position: 'relative' }}>
            <Filter style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              width: 14, height: 14, color: 'rgba(255,255,255,0.6)' }} />
            <input
              placeholder="Filtrar por App ID, nombre, protocolo..."
              value={filterText}
              onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 6, fontSize: 12, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowY: 'auto', maxHeight: 460, background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'auto' }}>
            <thead>
              <tr>
                {([
                  { key: 'srcAppId',   label: 'SRC App ID',    align: 'left'   },
                  { key: 'destAppId',  label: 'DEST App ID',   align: 'left'   },
                  { key: 'count',      label: 'Conexiones',    align: 'center' },
                  { key: 'srcAppName', label: 'Nombre Origen', align: 'left'   },
                  { key: 'destAppName',label: 'Nombre Destino',align: 'left'   },
                  { key: 'protocols',  label: 'Protocolo/Tipo',align: 'left'   },
                  { key: 'ports',      label: 'Puertos',       align: 'center' },
                ] as const).map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    style={{ padding: '9px 12px', textAlign: col.align, fontSize: 11, fontWeight: 700,
                      color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.02em',
                      background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 55%, #0284c7 100%)',
                      position: 'sticky', top: 0, zIndex: 10,
                      borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4,
                      justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
                      {col.label} <ArrowUpDown style={{ width: 10, height: 10, opacity: 0.7 }} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((l, i) => {
                const rowBg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
                return (
                  <tr key={i} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                    onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                    <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0f172a', fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {(() => { const t = getAppTypeInfo(l.srcAppId, l.srcAppName); return (
                          <span title={t.label} style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                        ); })()}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.srcAppId}</div>
                          {(() => { const t = getAppTypeInfo(l.srcAppId, l.srcAppName); return (
                            <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                          ); })()}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0f172a', fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {(() => { const t = getAppTypeInfo(l.destAppId, l.destAppName); return (
                          <span title={t.label} style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                        ); })()}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.destAppId}</div>
                          {(() => { const t = getAppTypeInfo(l.destAppId, l.destAppName); return (
                            <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                          ); })()}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 10, background: '#ccfbf1', color: '#0f766e',
                        border: '1px solid #99f6e4', borderRadius: 999, padding: '2px 8px' }}>{l.count}</span>
                    </td>
                    <td style={{ padding: '6px 12px', color: '#475569', fontSize: 11 }}>{l.srcAppName ?? <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ padding: '6px 12px', color: '#475569', fontSize: 11 }}>{l.destAppName ?? <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ padding: '6px 12px', fontSize: 11 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {[...l.connectionTypes, ...l.protocols].filter(Boolean).slice(0, 3).map((p, pi) => (
                          <span key={pi} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                            background: p === 'TCP' ? '#dbeafe' : p === 'UDP' ? '#dcfce7' : '#f0fdfa',
                            color: p === 'TCP' ? '#1d4ed8' : p === 'UDP' ? '#16a34a' : '#0f766e' }}>{p}</span>
                        ))}
                        {[...l.connectionTypes, ...l.protocols].filter(Boolean).length === 0 && <span style={{ color: '#cbd5e1' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                        {l.ports.filter(p => p !== null).length > 0
                          ? l.ports.filter(p => p !== null).slice(0, 4).map((p, pi) => (
                              <span key={pi} style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#0f766e',
                                background: '#ccfbf1', border: '1px solid #99f6e4', borderRadius: 4, padding: '2px 5px' }}>{p}</span>
                            ))
                          : <span style={{ color: '#cbd5e1', fontSize: 10 }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
                  {t('appDependencyMap.noDependencies')}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {startIdx + 1}–{Math.min(startIdx + itemsPerPage, sorted.length)} de {sorted.length}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px', color: '#475569' }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / pág</option>)}
              </select>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
                <ChevronLeft style={{ width: 12, height: 12 }} />
              </button>
              <span style={{ fontSize: 11, color: '#475569' }}>{currentPage}/{totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Panel: Grafo de Dependencias de Aplicaciones ─────────────────── */}
      <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(8,145,178,0.10)', border: '1px solid #99f6e4' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
              <Network style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>
                Grafo de Dependencias de Aplicaciones
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                Visualización de red — nodos = aplicaciones, líneas = dependencias
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 12px',
              fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              {uniqueApps} aplicaciones
            </div>
            {/* Export buttons */}
            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
              <GlassBtn onClick={exportGraphPDF} disabled={isExportingGraph || !appLinks.length}
                icon={<FileText style={{ width: 12, height: 12 }} />}
                label={isExportingGraph ? '...' : 'PDF'} />
              <GlassBtn onClick={exportGraphWord} disabled={isExportingGraph || !appLinks.length}
                icon={<FileDown style={{ width: 12, height: 12 }} />}
                label={isExportingGraph ? '...' : 'Word'} />
            </div>
          </div>
        </div>

        {/* Graph */}
        <div style={{ background: '#f8fafc', padding: 0 }}>
          {appLinks.length > 0
            ? <AppForceGraph links={graphFilteredLinks} svgRef={svgRef} activeTypeFilter={activeTypeFilter} allLinks={appLinks} />
            : <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>
                {t('appDependencyMap.noDataToChart')}
              </div>}
        </div>

        {/* ── Leyenda + Filtros por tipo ──────────────────────────────────── */}
        {legendTypes.length > 0 && (
          <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Leyenda · Filtrar por tipo de aplicación
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {legendTypes.map(t => {
                const isActive = activeTypeFilter === t.label;
                return (
                  <button key={t.label} onClick={() => setActiveTypeFilter(isActive ? null : t.label)}
                    title={`Filtrar: ${t.label} (${t.count} nodos)`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                      border: isActive ? `2px solid ${t.color}` : '2px solid transparent',
                      background: isActive ? t.bg : '#fff',
                      boxShadow: isActive
                        ? `0 0 0 2px ${t.color}33, 0 2px 6px rgba(0,0,0,0.08)`
                        : '0 1px 3px rgba(0,0,0,0.08)',
                      transition: 'all 0.15s',
                      outline: 'none',
                    }}>
                    {/* Color dot */}
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0, display: 'inline-block' }} />
                    {/* Icon */}
                    <span style={{ fontSize: 13 }}>{t.icon}</span>
                    {/* Label */}
                    <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? t.color : '#475569', whiteSpace: 'nowrap' }}>
                      {t.label}
                    </span>
                    {/* Count badge */}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                      background: isActive ? t.color : '#e2e8f0',
                      color: isActive ? '#fff' : '#64748b' }}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
              {activeTypeFilter && (
                <button onClick={() => setActiveTypeFilter(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20,
                    border: '2px solid #e2e8f0', background: '#fff', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600, color: '#94a3b8', transition: 'all 0.15s' }}>
                  ✕ Limpiar filtro
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
