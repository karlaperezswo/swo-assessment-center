import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// ── Color palette (teal/cyan theme) ──────────────────────────────────────────
const C = {
  teal:    [15, 118, 110] as [number,number,number],
  cyan:    [8,  145, 178] as [number,number,number],
  blue:    [2,  132, 199] as [number,number,number],
  dark:    [12,  74,  110] as [number,number,number],
  white:   [255,255,255] as [number,number,number],
  light:   [240,253,250] as [number,number,number],
  gray:    [71,  85, 105] as [number,number,number],
  lgray:   [226,232,240] as [number,number,number],
};

function pdfHeader(doc: jsPDF, title: string, subtitle: string) {
  const W = doc.internal.pageSize.getWidth();
  // Gradient-like header bar
  doc.setFillColor(...C.teal);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFillColor(...C.cyan);
  doc.rect(W * 0.4, 0, W * 0.35, 28, 'F');
  doc.setFillColor(...C.blue);
  doc.rect(W * 0.75, 0, W * 0.25, 28, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text(title, 14, 12);
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.text(subtitle, 14, 20);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, W - 14, 20, { align: 'right' });
  doc.setTextColor(...C.dark);
}

function pdfFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...C.lgray);
  doc.rect(0, H - 10, W, 10, 'F');
  doc.setFontSize(7); doc.setTextColor(...C.gray);
  doc.text('Reporte de Dependencias de Bases de Datos', 14, H - 3.5);
  doc.text(`Página ${pageNum} de ${totalPages}`, W - 14, H - 3.5, { align: 'right' });
}

function tableHeader(doc: jsPDF, cols: string[], colWidths: number[], x: number, y: number): number {
  doc.setFillColor(...C.teal);
  const rowH = 7;
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  doc.rect(x, y, totalW, rowH, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(7); doc.setFont('helvetica','bold');
  let cx = x;
  cols.forEach((col, i) => {
    doc.text(col, cx + 2, y + 4.8);
    cx += colWidths[i];
  });
  doc.setFont('helvetica','normal');
  return y + rowH;
}

function tableRow(doc: jsPDF, cells: string[], colWidths: number[], x: number, y: number, even: boolean): number {
  const rowH = 6;
  if (even) { doc.setFillColor(...C.light); doc.rect(x, y, colWidths.reduce((a,b)=>a+b,0), rowH, 'F'); }
  doc.setTextColor(...C.dark); doc.setFontSize(7); doc.setFont('helvetica','normal');
  let cx = x;
  cells.forEach((cell, i) => {
    const maxW = colWidths[i] - 4;
    const txt = doc.splitTextToSize(String(cell ?? '—'), maxW)[0] ?? '';
    doc.text(txt, cx + 2, y + 4.2);
    cx += colWidths[i];
  });
  return y + rowH;
}

// ── Types (minimal, matching DatabaseDependencyMap) ───────────────────────────
export interface DbExportInfo {
  databaseName: string; serverId: string; databaseId?: string;
  edition?: string; dbInstanceName?: string; totalSizeGb?: number;
  maxTransactionsPerSecond?: number; hasDependencies: boolean;
  dependencies: { asSource: any[]; asDestination: any[] };
}
export interface ConnExportInfo {
  source: string; destination: string; port: number | null;
  protocol: string; serviceName?: string; targetProcessId?: string;
}

// ── 1. CONNECTIONS — PDF ──────────────────────────────────────────────────────
export async function exportConnectionsPDF(
  connections: ConnExportInfo[],
  graphSvgEl: SVGSVGElement | null
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let page = 1;

  pdfHeader(doc, 'Conexiones entre Bases de Datos y Servidores',
    `Total de conexiones: ${connections.length}`);

  // Section title
  let y = 36;
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...C.teal);
  doc.text('Detalle de Conexiones de Red', 14, y); y += 6;

  // Table
  const cols = ['Servidor Origen','Servidor Destino','Puerto','Protocolo','Proceso / Servicio'];
  const widths = [65, 65, 22, 25, 90];
  y = tableHeader(doc, cols, widths, 14, y);

  connections.forEach((c, i) => {
    if (y > 185) {
      pdfFooter(doc, page, 999);
      doc.addPage(); page++;
      pdfHeader(doc, 'Conexiones entre Bases de Datos y Servidores', `(continuación)`);
      y = 36;
      y = tableHeader(doc, cols, widths, 14, y);
    }
    y = tableRow(doc, [
      c.source, c.destination,
      c.port !== null ? String(c.port) : '—',
      c.protocol || '—',
      c.targetProcessId || c.serviceName || '—',
    ], widths, 14, y, i % 2 === 0);
  });

  // Graph image
  if (graphSvgEl) {
    try {
      pdfFooter(doc, page, 999);
      doc.addPage(); page++;
      pdfHeader(doc, 'Grafo de Dependencias de Bases de Datos', 'Visualización de red');
      const canvas = await html2canvas(graphSvgEl.parentElement as HTMLElement, { scale: 1.5, backgroundColor: '#fff' });
      const img = canvas.toDataURL('image/png');
      const imgW = W - 28;
      const imgH = (canvas.height / canvas.width) * imgW;
      doc.addImage(img, 'PNG', 14, 36, imgW, Math.min(imgH, 160));
    } catch (_) { /* skip if capture fails */ }
  }

  // Fix total pages
  const totalP = page;
  for (let p = 1; p <= totalP; p++) {
    doc.setPage(p);
    pdfFooter(doc, p, totalP);
  }
  doc.save(`conexiones-bd-${Date.now()}.pdf`);
}

// ── 2. CONNECTIONS — Word (HTML→Blob) ─────────────────────────────────────────
export async function exportConnectionsWord(
  connections: ConnExportInfo[],
  graphSvgEl: SVGSVGElement | null
) {
  let graphImg = '';
  if (graphSvgEl) {
    try {
      const canvas = await html2canvas(graphSvgEl.parentElement as HTMLElement, { scale: 1.5, backgroundColor: '#fff' });
      graphImg = canvas.toDataURL('image/png');
    } catch (_) {}
  }

  const rows = connections.map((c, i) => `
    <tr style="background:${i%2===0?'#f0fdfa':'#ffffff'}">
      <td>${c.source}</td><td>${c.destination}</td>
      <td style="text-align:center">${c.port ?? '—'}</td>
      <td style="text-align:center">${c.protocol || '—'}</td>
      <td>${c.targetProcessId || c.serviceName || '—'}</td>
    </tr>`).join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  @page { size: A4 landscape; margin: 2cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0c4a6e; }
  .cover { text-align:center; padding: 60px 0 40px; }
  .cover h1 { font-size:22pt; color:#0f766e; margin:0 0 8px; }
  .cover p  { font-size:10pt; color:#475569; margin:4px 0; }
  .section-title { font-size:13pt; font-weight:bold; color:#0f766e;
    border-bottom:2px solid #0891b2; padding-bottom:4px; margin:20px 0 10px; }
  table { width:100%; border-collapse:collapse; font-size:9pt; }
  th { background:#0f766e; color:#fff; padding:6px 8px; text-align:left; font-size:9pt; }
  td { padding:5px 8px; border-bottom:1px solid #e2e8f0; }
  .stats { display:flex; gap:16px; margin:12px 0; }
  .stat-box { background:#f0fdfa; border:1px solid #99f6e4; border-radius:6px;
    padding:10px 16px; text-align:center; flex:1; }
  .stat-num { font-size:18pt; font-weight:bold; color:#0f766e; }
  .stat-lbl { font-size:8pt; color:#0891b2; }
  .graph-section { page-break-before:always; }
  img { max-width:100%; }
</style></head>
<body>
<div class="cover">
  <h1>Conexiones entre Bases de Datos y Servidores</h1>
  <p>Reporte de dependencias de red detectadas</p>
  <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
</div>
<div class="section-title">Resumen Ejecutivo</div>
<div class="stats">
  <div class="stat-box"><div class="stat-num">${connections.length}</div><div class="stat-lbl">Total Conexiones</div></div>
  <div class="stat-box"><div class="stat-num">${new Set(connections.map(c=>c.source)).size}</div><div class="stat-lbl">Servidores Origen</div></div>
  <div class="stat-box"><div class="stat-num">${new Set(connections.map(c=>c.destination)).size}</div><div class="stat-lbl">Servidores Destino</div></div>
  <div class="stat-box"><div class="stat-num">${new Set(connections.map(c=>c.port).filter(Boolean)).size}</div><div class="stat-lbl">Puertos Únicos</div></div>
</div>
<div class="section-title">Detalle de Conexiones</div>
<table>
  <thead><tr><th>Servidor Origen</th><th>Servidor Destino</th><th>Puerto</th><th>Protocolo</th><th>Proceso / Servicio</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
${graphImg ? `<div class="graph-section">
  <div class="section-title">Grafo de Dependencias</div>
  <img src="${graphImg}" />
</div>` : ''}
</body></html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `conexiones-bd-${Date.now()}.doc`; a.click();
  URL.revokeObjectURL(url);
}

// ── 3. INVENTORY — PDF ────────────────────────────────────────────────────────
export function exportInventoryPDF(databases: DbExportInfo[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.internal.pageSize.getWidth(); // width available if needed
  let page = 1;

  pdfHeader(doc, 'Inventario de Bases de Datos', `Total registros: ${databases.length}`);

  let y = 36;
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...C.teal);
  doc.text('Listado Completo de Bases de Datos', 14, y); y += 6;

  const cols = ['#','BD Name','Database ID','Server ID','DB Instance Name','Size (GB)','Conexiones','Estado'];
  const widths = [10, 50, 38, 45, 45, 22, 22, 25];
  y = tableHeader(doc, cols, widths, 14, y);

  let totalGb = 0;
  databases.forEach((db, i) => {
    if (y > 185) {
      pdfFooter(doc, page, 999);
      doc.addPage(); page++;
      pdfHeader(doc, 'Inventario de Bases de Datos', '(continuación)');
      y = 36;
      y = tableHeader(doc, cols, widths, 14, y);
    }
    const conn = db.dependencies.asSource.length + db.dependencies.asDestination.length;
    totalGb += db.totalSizeGb ?? 0;
    y = tableRow(doc, [
      String(i+1), db.databaseName, db.databaseId || '—', db.serverId,
      db.dbInstanceName || '—',
      db.totalSizeGb !== undefined ? db.totalSizeGb.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:2}) : '—',
      String(conn),
      db.hasDependencies ? 'Con deps' : 'Sin deps',
    ], widths, 14, y, i % 2 === 0);
  });

  // Footer total row
  if (y < 185) {
    y += 2;
    doc.setFillColor(...C.cyan);
    doc.rect(14, y, widths.reduce((a,b)=>a+b,0), 7, 'F');
    doc.setTextColor(...C.white); doc.setFontSize(7); doc.setFont('helvetica','bold');
    doc.text('TOTAL', 16, y + 4.8);
    doc.text(totalGb.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:2}) + ' GB',
      14 + widths.slice(0,5).reduce((a,b)=>a+b,0) + 2, y + 4.8);
  }

  const totalP = page;
  for (let p = 1; p <= totalP; p++) { doc.setPage(p); pdfFooter(doc, p, totalP); }
  doc.save(`inventario-bd-${Date.now()}.pdf`);
}

// ── 4. INVENTORY — Excel ──────────────────────────────────────────────────────
export function exportInventoryExcel(databases: DbExportInfo[]) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['INVENTARIO DE BASES DE DATOS'],
    [`Generado: ${new Date().toLocaleString('es-ES')}`],
    [],
    ['Total BDs', databases.length],
    ['Total Size (GB)', databases.reduce((s,d)=>s+(d.totalSizeGb??0),0).toFixed(2)],
    ['Con dependencias', databases.filter(d=>d.hasDependencies).length],
    ['Sin dependencias', databases.filter(d=>!d.hasDependencies).length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{wch:30},{wch:20}];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // Detail sheet
  const headers = ['#','BD Name','Database ID','Server ID','DB Instance Name',
    'Total Size (GB)','Max TPS','Conexiones Origen','Conexiones Destino','Total Conexiones','Estado'];
  const rows = databases.map((db, i) => [
    i+1, db.databaseName, db.databaseId||'', db.serverId, db.dbInstanceName||'',
    db.totalSizeGb ?? '', db.maxTransactionsPerSecond ?? '',
    db.dependencies.asSource.length, db.dependencies.asDestination.length,
    db.dependencies.asSource.length + db.dependencies.asDestination.length,
    db.hasDependencies ? 'Con dependencias' : 'Sin dependencias',
  ]);
  const wsDetail = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  wsDetail['!cols'] = [
    {wch:5},{wch:30},{wch:20},{wch:25},{wch:25},
    {wch:15},{wch:12},{wch:18},{wch:18},{wch:16},{wch:20}
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Inventario');

  XLSX.writeFile(wb, `inventario-bd-${Date.now()}.xlsx`);
}

// ── 5. DISTRIBUTION — PDF ─────────────────────────────────────────────────────
export async function exportDistributionPDF(
  databases: DbExportInfo[],
  pieSvgEl: SVGSVGElement | null
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let page = 1;

  pdfHeader(doc, 'Distribución de Almacenamiento por Base de Datos',
    `${databases.length} instancias analizadas`);

  let y = 36;

  // Pie chart image
  if (pieSvgEl) {
    try {
      const container = pieSvgEl.closest('[data-pie-container]') as HTMLElement
        ?? pieSvgEl.parentElement as HTMLElement;
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#fff' });
      const img = canvas.toDataURL('image/png');
      const imgW = W - 28;
      const imgH = Math.min((canvas.height / canvas.width) * imgW, 100);
      doc.addImage(img, 'PNG', 14, y, imgW, imgH);
      y += imgH + 8;
    } catch (_) {}
  }

  // Aggregated table
  const agg = new Map<string, { size: number; tps: number }>();
  databases.forEach(db => {
    const k = db.databaseName || 'Sin nombre';
    const cur = agg.get(k) ?? { size: 0, tps: 0 };
    agg.set(k, { size: cur.size + (db.totalSizeGb??0), tps: cur.tps + (db.maxTransactionsPerSecond??0) });
  });
  const aggData = [...agg.entries()].sort((a,b)=>b[1].size-a[1].size);
  const totalSize = aggData.reduce((s,[,v])=>s+v.size,0);

  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...C.teal);
  doc.text('Distribución por BD Name', 14, y); y += 6;

  const cols = ['BD Name','Total Size (GB)','% del Total','Max TPS'];
  const widths = [80, 35, 30, 35];
  y = tableHeader(doc, cols, widths, 14, y);

  aggData.forEach(([name, v], i) => {
    if (y > 270) {
      pdfFooter(doc, page, 999);
      doc.addPage(); page++;
      pdfHeader(doc, 'Distribución de Almacenamiento', '(continuación)');
      y = 36;
      y = tableHeader(doc, cols, widths, 14, y);
    }
    const pct = totalSize > 0 ? ((v.size/totalSize)*100).toFixed(1)+'%' : '0%';
    y = tableRow(doc, [
      name,
      v.size.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:2}),
      pct,
      v.tps > 0 ? v.tps.toLocaleString('es-ES',{maximumFractionDigits:0}) : '—',
    ], widths, 14, y, i%2===0);
  });

  const totalP = page;
  for (let p = 1; p <= totalP; p++) { doc.setPage(p); pdfFooter(doc, p, totalP); }
  doc.save(`distribucion-almacenamiento-${Date.now()}.pdf`);
}

// ── 6. DISTRIBUTION — Word ────────────────────────────────────────────────────
export async function exportDistributionWord(
  databases: DbExportInfo[],
  pieSvgEl: SVGSVGElement | null
) {
  let chartImg = '';
  if (pieSvgEl) {
    try {
      const container = pieSvgEl.closest('[data-pie-container]') as HTMLElement
        ?? pieSvgEl.parentElement as HTMLElement;
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#fff' });
      chartImg = canvas.toDataURL('image/png');
    } catch (_) {}
  }

  const agg = new Map<string, { size: number; tps: number }>();
  databases.forEach(db => {
    const k = db.databaseName || 'Sin nombre';
    const cur = agg.get(k) ?? { size: 0, tps: 0 };
    agg.set(k, { size: cur.size + (db.totalSizeGb??0), tps: cur.tps + (db.maxTransactionsPerSecond??0) });
  });
  const aggData = [...agg.entries()].sort((a,b)=>b[1].size-a[1].size);
  const totalSize = aggData.reduce((s,[,v])=>s+v.size,0);

  const rows = aggData.map(([name, v], i) => {
    const pct = totalSize > 0 ? ((v.size/totalSize)*100).toFixed(1)+'%' : '0%';
    return `<tr style="background:${i%2===0?'#f0fdfa':'#ffffff'}">
      <td>${name}</td>
      <td style="text-align:right">${v.size.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:2})}</td>
      <td style="text-align:center">${pct}</td>
      <td style="text-align:right">${v.tps>0?v.tps.toLocaleString('es-ES',{maximumFractionDigits:0}):'—'}</td>
    </tr>`;
  }).join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  @page { size: A4 portrait; margin: 2cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0c4a6e; }
  .cover { text-align:center; padding: 60px 0 40px; }
  .cover h1 { font-size:20pt; color:#0f766e; margin:0 0 8px; }
  .cover p  { font-size:10pt; color:#475569; margin:4px 0; }
  .section-title { font-size:12pt; font-weight:bold; color:#0f766e;
    border-bottom:2px solid #0891b2; padding-bottom:4px; margin:20px 0 10px; }
  table { width:100%; border-collapse:collapse; font-size:9pt; }
  th { background:#0f766e; color:#fff; padding:6px 8px; text-align:left; }
  td { padding:5px 8px; border-bottom:1px solid #e2e8f0; }
  .total-row { background:#ccfbf1; font-weight:bold; }
  img { max-width:100%; margin:8px 0; }
</style></head>
<body>
<div class="cover">
  <h1>Distribución de Almacenamiento por Base de Datos</h1>
  <p>Análisis de capacidad y transacciones por instancia</p>
  <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
</div>
${chartImg ? `<div class="section-title">Gráfico de Distribución</div><img src="${chartImg}" />` : ''}
<div class="section-title">Tabla de Distribución</div>
<table>
  <thead><tr><th>BD Name</th><th>Total Size (GB)</th><th>% del Total</th><th>Max TPS</th></tr></thead>
  <tbody>
    ${rows}
    <tr class="total-row">
      <td>TOTAL</td>
      <td style="text-align:right">${totalSize.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:2})} GB</td>
      <td style="text-align:center">100%</td>
      <td>—</td>
    </tr>
  </tbody>
</table>
</body></html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `distribucion-almacenamiento-${Date.now()}.doc`; a.click();
  URL.revokeObjectURL(url);
}

// ── 7. GRAPH — PDF ────────────────────────────────────────────────────────────
export async function exportGraphPDF(
  graphSvgEl: SVGSVGElement | null,
  nodes: { id: string; label: string; type: 'db' | 'server'; color: string }[],
  links: { source: string; target: string; port: number | null; protocol: string }[],
  databases: DbExportInfo[],
  connections?: ConnExportInfo[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let page = 1;

  const dbNodes  = nodes.filter(n => n.type === 'db').length;
  const srvNodes = nodes.filter(n => n.type === 'server').length;

  // ── Portada ──────────────────────────────────────────────────────────────
  doc.setFillColor(...C.teal);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(...C.cyan);
  doc.rect(W * 0.35, 0, W * 0.4, H, 'F');
  doc.setFillColor(...C.blue);
  doc.rect(W * 0.75, 0, W * 0.25, H, 'F');

  doc.setFillColor(...C.white);
  doc.roundedRect(W * 0.1, H * 0.2, W * 0.8, H * 0.6, 6, 6, 'F');

  doc.setTextColor(...C.teal);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('Dependencias de Bases de Datos', W / 2, H * 0.36, { align: 'center' });
  doc.setFontSize(14); doc.setFont('helvetica', 'normal');
  doc.text('Conexiones · Grafo · Inventario', W / 2, H * 0.44, { align: 'center' });
  doc.setTextColor(...C.gray); doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, W / 2, H * 0.52, { align: 'center' });

  const stats = [
    { label: 'Nodos BD',      value: String(dbNodes)  },
    { label: 'Servidores',    value: String(srvNodes) },
    { label: 'Conexiones',    value: String(connections?.length ?? links.length) },
    { label: 'Instancias BD', value: String(databases.length) },
  ];
  const boxW = 40, boxH = 18, startX = (W - stats.length * (boxW + 6)) / 2;
  stats.forEach((s, i) => {
    const bx = startX + i * (boxW + 6); const by = H * 0.60;
    doc.setFillColor(...C.light); doc.roundedRect(bx, by, boxW, boxH, 3, 3, 'F');
    doc.setDrawColor(...C.cyan); doc.roundedRect(bx, by, boxW, boxH, 3, 3, 'S');
    doc.setTextColor(...C.teal); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(s.value, bx + boxW / 2, by + 9, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text(s.label, bx + boxW / 2, by + 15, { align: 'center' });
  });
  pdfFooter(doc, page, 999);

  // ── Página 2: Tabla de conexiones ─────────────────────────────────────────
  if (connections && connections.length > 0) {
    doc.addPage(); page++;
    pdfHeader(doc, 'Conexiones entre Bases de Datos y Servidores', 'Tráfico de red detectado entre instancias de BD y servidores');
    let y = 36;
    const connCols = ['Servidor Origen', 'Servidor Destino', 'Puerto', 'Protocolo', 'Proceso / Servicio'];
    const connWidths = [70, 70, 28, 30, 69];
    y = tableHeader(doc, connCols, connWidths, 14, y);
    connections.forEach((c, i) => {
      if (y > H - 16) {
        pdfFooter(doc, page, 999); doc.addPage(); page++;
        pdfHeader(doc, 'Conexiones (continuación)', ''); y = 36;
        y = tableHeader(doc, connCols, connWidths, 14, y);
      }
      y = tableRow(doc, [
        c.source, c.destination,
        c.port !== null ? String(c.port) : '—',
        c.protocol || '—',
        c.targetProcessId || c.serviceName || '—',
      ], connWidths, 14, y, i % 2 === 0);
    });
    pdfFooter(doc, page, 999);
  }

  // ── Página: Imagen del grafo ──────────────────────────────────────────────
  doc.addPage(); page++;
  pdfHeader(doc, 'Grafo de Dependencias de Bases de Datos', 'Visualización de red — nodos y conexiones detectadas');

  if (graphSvgEl) {
    try {
      const canvas = await html2canvas(graphSvgEl.parentElement as HTMLElement, {
        scale: 2, backgroundColor: '#ffffff',
      });
      const img = canvas.toDataURL('image/png');
      const maxW = W - 28; const maxH = H - 52;
      const ratio = canvas.width / canvas.height;
      let imgW = maxW, imgH = maxW / ratio;
      if (imgH > maxH) { imgH = maxH; imgW = maxH * ratio; }
      doc.addImage(img, 'PNG', (W - imgW) / 2, 34, imgW, imgH);
    } catch (_) {
      doc.setFontSize(10); doc.setTextColor(...C.gray);
      doc.text('No se pudo capturar la imagen del grafo.', W / 2, H / 2, { align: 'center' });
    }
  }
  pdfFooter(doc, page, 999);

  // ── Página: Leyenda + tabla de nodos ─────────────────────────────────────
  doc.addPage(); page++;
  pdfHeader(doc, 'Leyenda y Detalle de Nodos', 'Tipos de bases de datos y servidores en el grafo');
  let y = 36;

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.teal);
  doc.text('Leyenda de Colores por Tipo de BD', 14, y); y += 7;

  const legend: [string, string][] = [
    ['MySQL', '#f59e0b'], ['PostgreSQL', '#3b82f6'], ['SQL Server', '#0ea5e9'], ['Oracle', '#ef4444'],
    ['MongoDB', '#22c55e'], ['Redis', '#f97316'], ['Otro / Default', '#8b5cf6'], ['Servidor', '#3b82f6'],
  ];
  legend.forEach(([label, hex], i) => {
    const col = i < 4 ? 0 : 1; const row = i < 4 ? i : i - 4;
    const lx = 14 + col * 130; const ly = y + row * 8;
    const rgb = parseInt(hex.slice(1), 16);
    doc.setFillColor((rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255);
    doc.circle(lx + 3, ly + 2, 2.5, 'F');
    doc.setTextColor(...C.dark); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(label, lx + 8, ly + 3.5);
  });
  y += 38;

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.teal);
  doc.text('Nodos de Bases de Datos en el Grafo', 14, y); y += 6;

  const dbNodesList = nodes.filter(n => n.type === 'db');
  const cols2 = ['BD / Nodo', 'Tipo', 'Conexiones como origen', 'Conexiones como destino'];
  const widths2 = [90, 40, 60, 60];
  y = tableHeader(doc, cols2, widths2, 14, y);

  dbNodesList.forEach((n, i) => {
    if (y > 185) {
      pdfFooter(doc, page, 999); doc.addPage(); page++;
      pdfHeader(doc, 'Detalle de Nodos (continuación)', ''); y = 36;
      y = tableHeader(doc, cols2, widths2, 14, y);
    }
    const asSource = links.filter(l => l.source === n.id || (typeof l.source === 'object' && (l.source as any).id === n.id)).length;
    const asDest   = links.filter(l => l.target === n.id || (typeof l.target === 'object' && (l.target as any).id === n.id)).length;
    y = tableRow(doc, [n.label, 'Base de Datos', String(asSource), String(asDest)], widths2, 14, y, i % 2 === 0);
  });

  const totalP = page;
  for (let p = 1; p <= totalP; p++) { doc.setPage(p); pdfFooter(doc, p, totalP); }
  doc.save(`dependencias-bd-completo-${Date.now()}.pdf`);
}

// ── 8. GRAPH — Word ───────────────────────────────────────────────────────────
export async function exportGraphWord(
  graphSvgEl: SVGSVGElement | null,
  nodes: { id: string; label: string; type: 'db' | 'server'; color: string }[],
  links: { source: string; target: string; port: number | null; protocol: string }[],
  databases: DbExportInfo[],
  connections?: ConnExportInfo[]
) {
  let graphImg = '';
  if (graphSvgEl) {
    try {
      const canvas = await html2canvas(graphSvgEl.parentElement as HTMLElement, {
        scale: 2, backgroundColor: '#ffffff',
      });
      graphImg = canvas.toDataURL('image/png');
    } catch (_) {}
  }

  const dbNodes  = nodes.filter(n => n.type === 'db').length;
  const srvNodes = nodes.filter(n => n.type === 'server').length;
  const totalConns = connections?.length ?? links.length;

  const legendItems: [string, string][] = [
    ['MySQL', '#f59e0b'], ['PostgreSQL', '#3b82f6'], ['SQL Server', '#0ea5e9'],
    ['Oracle', '#ef4444'], ['MongoDB', '#22c55e'], ['Redis', '#f97316'],
    ['Otro / Default', '#8b5cf6'], ['Servidor', '#3b82f6'],
  ];

  const legendHtml = legendItems.map(([label, color]) =>
    `<div style="display:inline-flex;align-items:center;gap:6px;margin:4px 12px 4px 0">
      <div style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0"></div>
      <span style="font-size:9pt">${label}</span>
    </div>`
  ).join('');

  const nodeRows = nodes.filter(n => n.type === 'db').map((n, i) => {
    const asSource = links.filter(l => l.source === n.id || (typeof l.source === 'object' && (l.source as any).id === n.id)).length;
    const asDest   = links.filter(l => l.target === n.id || (typeof l.target === 'object' && (l.target as any).id === n.id)).length;
    return `<tr style="background:${i%2===0?'#f0fdfa':'#ffffff'}">
      <td>${n.label}</td>
      <td style="text-align:center">Base de Datos</td>
      <td style="text-align:center">${asSource}</td>
      <td style="text-align:center">${asDest}</td>
    </tr>`;
  }).join('');

  const connRows = (connections ?? []).map((c, i) =>
    `<tr style="background:${i%2===0?'#f0fdfa':'#ffffff'}">
      <td>${c.source}</td>
      <td>${c.destination}</td>
      <td style="text-align:center;font-family:monospace">${c.port !== null ? c.port : '—'}</td>
      <td style="text-align:center">${c.protocol || '—'}</td>
      <td>${c.targetProcessId || c.serviceName || '—'}</td>
    </tr>`
  ).join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  @page { size: A4 landscape; margin: 2cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0c4a6e; }
  .cover { text-align:center; padding: 80px 0 50px; }
  .cover h1 { font-size:24pt; color:#0f766e; margin:0 0 10px; }
  .cover h2 { font-size:14pt; color:#0891b2; font-weight:normal; margin:0 0 8px; }
  .cover p  { font-size:10pt; color:#475569; margin:4px 0; }
  .stats-row { display:flex; gap:16px; justify-content:center; margin:24px 0; }
  .stat-box { background:#f0fdfa; border:2px solid #99f6e4; border-radius:8px;
    padding:14px 24px; text-align:center; min-width:80px; }
  .stat-num { font-size:20pt; font-weight:bold; color:#0f766e; display:block; }
  .stat-lbl { font-size:8pt; color:#0891b2; }
  .section-title { font-size:13pt; font-weight:bold; color:#0f766e;
    border-bottom:2px solid #0891b2; padding-bottom:4px; margin:24px 0 12px; }
  .graph-img { page-break-before:always; }
  img { max-width:100%; border:1px solid #e2e8f0; border-radius:6px; }
  table { width:100%; border-collapse:collapse; font-size:9pt; margin-top:8px; }
  th { background:#0f766e; color:#fff; padding:7px 10px; text-align:left; }
  td { padding:5px 10px; border-bottom:1px solid #e2e8f0; }
  .legend-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;
    padding:12px 16px; margin:8px 0; }
</style></head>
<body>

<!-- PORTADA -->
<div class="cover">
  <h1>Dependencias de Bases de Datos</h1>
  <h2>Conexiones · Grafo · Inventario</h2>
  <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
  <div class="stats-row">
    <div class="stat-box"><span class="stat-num">${dbNodes}</span><span class="stat-lbl">Nodos BD</span></div>
    <div class="stat-box"><span class="stat-num">${srvNodes}</span><span class="stat-lbl">Servidores</span></div>
    <div class="stat-box"><span class="stat-num">${totalConns}</span><span class="stat-lbl">Conexiones</span></div>
    <div class="stat-box"><span class="stat-num">${databases.length}</span><span class="stat-lbl">Instancias BD</span></div>
  </div>
</div>

${connections && connections.length > 0 ? `
<!-- TABLA DE CONEXIONES -->
<div class="section-title">Conexiones entre Bases de Datos y Servidores</div>
<table>
  <thead>
    <tr>
      <th>Servidor Origen</th><th>Servidor Destino</th>
      <th style="text-align:center">Puerto</th><th style="text-align:center">Protocolo</th>
      <th>Proceso / Servicio</th>
    </tr>
  </thead>
  <tbody>${connRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Sin conexiones</td></tr>'}</tbody>
</table>` : ''}

<!-- GRAFO -->
${graphImg ? `
<div class="graph-img">
  <div class="section-title">Visualización del Grafo de Dependencias</div>
  <img src="${graphImg}" />
</div>` : ''}

<!-- LEYENDA -->
<div class="section-title">Leyenda de Colores</div>
<div class="legend-box">${legendHtml}</div>

<!-- TABLA DE NODOS -->
<div class="section-title">Detalle de Nodos — Bases de Datos</div>
<table>
  <thead>
    <tr>
      <th>BD / Nodo</th>
      <th style="text-align:center">Tipo</th>
      <th style="text-align:center">Conexiones Origen</th>
      <th style="text-align:center">Conexiones Destino</th>
    </tr>
  </thead>
  <tbody>${nodeRows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Sin nodos de bases de datos</td></tr>'}</tbody>
</table>

</body></html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `dependencias-bd-completo-${Date.now()}.doc`; a.click();
  URL.revokeObjectURL(url);
}
