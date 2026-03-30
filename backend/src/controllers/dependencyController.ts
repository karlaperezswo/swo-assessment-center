import { Request, Response } from 'express';
import { DocumentGeneratorService } from '../services/documentGeneratorService';
import { DependencyService } from '../services/dependencyService';
import * as fs from 'fs';
import * as path from 'path';

const docService = new DocumentGeneratorService();
const dependencyService = new DependencyService();

export class DependencyController {

  // POST /api/dependencies/parse — parse dependency data from uploaded Excel file
  parse = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }
      const fileBuffer = req.file.buffer;
      const depParser = dependencyService.parseDependencyFile(fileBuffer);
      const dependencyData = {
        dependencies: depParser.dependencies,
        appDependencies: depParser.appDependencies,
        servers: Array.from(depParser.servers),
        applications: Array.from(depParser.applications),
        databases: depParser.databases,
        databasesWithoutDependencies: depParser.databasesWithoutDependencies,
        summary: depParser.summary,
      };
      const migrationWaves = dependencyService.calculateMigrationWaves(depParser.dependencies);
      res.json({ success: true, data: { dependencyData, migrationWaves } });
    } catch (error: any) {
      console.error('❌ Error parsing dependencies:', error);
      res.status(500).json({ success: false, error: error.message || 'Error parsing dependencies' });
    }
  };

  // POST /api/dependencies/export
  export = async (req: Request, res: Response) => {
    try {
      const { searchResult, summary, allDependencies, format } = req.body;

      if (!format || !['pdf', 'word'].includes(format)) {
        return res.status(400).json({ error: 'Formato inválido. Use "pdf" o "word".' });
      }

      // Build report data — use searchResult if provided, otherwise use all dependencies
      const reportData = searchResult
        ? {
            server: searchResult.server,
            dependencies: {
              incoming: searchResult.dependencies.incoming,
              outgoing: searchResult.dependencies.outgoing,
            },
            relatedServers: searchResult.relatedServers || [],
            relatedApplications: searchResult.relatedApplications || [],
            summary: summary || { totalDependencies: 0, uniqueServers: 0, uniqueApplications: 0, uniquePorts: 0 },
          }
        : {
            server: 'Todas las Dependencias',
            dependencies: {
              incoming: (allDependencies || []).slice(0, 500),
              outgoing: [],
            },
            relatedServers: [],
            relatedApplications: [],
            summary: summary || { totalDependencies: 0, uniqueServers: 0, uniqueApplications: 0, uniquePorts: 0 },
          };

      if (format === 'word') {
        const filename = await docService.generateWordDocument(reportData);
        const filepath = docService.getFilePath(filename);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const fileBuffer = fs.readFileSync(filepath);
        res.send(fileBuffer);

        // Clean up after sending
        setTimeout(() => {
          try { fs.unlinkSync(filepath); } catch {}
        }, 5000);

      } else if (format === 'pdf') {
        // Generate HTML and convert to PDF-like response
        const html = buildPDFHtml(reportData);
        const timestamp = new Date().toISOString().split('T')[0];
        const serverSlug = reportData.server.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `dependencias_${serverSlug}_${timestamp}.html`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(html);
      }

    } catch (error: any) {
      console.error('❌ Error exportando dependencias:', error);
      res.status(500).json({ error: error.message || 'Error al exportar' });
    }
  };
}

function buildPDFHtml(data: any): string {
  const incoming = data.dependencies.incoming || [];
  const outgoing = data.dependencies.outgoing || [];
  const date = new Date().toLocaleString('es-ES');

  const escape = (s: any) => String(s ?? '-').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const buildRows = (deps: any[], type: 'incoming' | 'outgoing') =>
    deps.length > 0
      ? deps.map((d: any, i: number) => `
        <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td>${escape(type === 'incoming' ? d.source : d.destination)}</td>
          <td>${escape(d.port)}</td>
          <td>${escape(d.protocol)}</td>
          <td>${escape(d.serviceName)}</td>
          <td>${escape(type === 'incoming' ? d.sourceApp : d.destinationApp)}</td>
        </tr>`).join('')
      : `<tr><td colspan="5" class="empty">Sin conexiones registradas</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Dependencias - ${escape(data.server)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      color: #1f2937;
      background: #ffffff;
      padding: 36px 44px;
    }

    /* ── Header ── */
    .report-header {
      border-bottom: 3px solid #1e40af;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .report-header h1 {
      font-size: 22px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 6px;
    }
    .report-header .server-badge {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #1d4ed8;
      margin-bottom: 4px;
    }
    .report-header .meta {
      font-size: 10px;
      color: #6b7280;
      margin-top: 4px;
    }

    /* ── Summary cards ── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 28px;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: 3px solid #1d4ed8;
      border-radius: 4px;
      padding: 12px 10px;
      text-align: center;
    }
    .summary-card .num { font-size: 24px; font-weight: 700; color: #1d4ed8; }
    .summary-card .lbl { font-size: 9px; color: #64748b; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* ── Section headings ── */
    h2 {
      font-size: 13px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 24px 0 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #dbeafe;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      table-layout: fixed;
      background: #ffffff;
    }
    col.c-server  { width: 28%; }
    col.c-port    { width: 8%;  }
    col.c-proto   { width: 9%;  }
    col.c-service { width: 27%; }
    col.c-app     { width: 28%; }

    thead tr {
      background: #dbeafe;        /* azul claro — sin negro */
    }
    th {
      padding: 8px 10px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      color: #1e3a8a;
      border-bottom: 2px solid #93c5fd;
    }
    td {
      padding: 7px 10px;
      font-size: 10px;
      color: #374151;
      vertical-align: top;
      overflow-wrap: break-word;
      word-break: break-word;
      line-height: 1.5;
      border-bottom: 1px solid #f1f5f9;
    }
    .row-even td { background: #ffffff; }
    .row-odd  td { background: #f8fafc; }

    .empty {
      text-align: center;
      color: #94a3b8;
      font-style: italic;
      padding: 14px;
      background: #f8fafc;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 40px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
    }

    @media print {
      body { padding: 15px 20px; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
      .summary-grid { break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="report-header">
    <h1>Reporte de Dependencias de Red</h1>
    <div class="server-badge">Servidor: ${escape(data.server)}</div>
    <div class="meta">Generado: ${date}</div>
  </div>

  <h2>Resumen Ejecutivo</h2>
  <div class="summary-grid">
    <div class="summary-card"><div class="num">${data.summary.totalDependencies}</div><div class="lbl">Dependencias</div></div>
    <div class="summary-card"><div class="num">${data.summary.uniqueServers}</div><div class="lbl">Servidores</div></div>
    <div class="summary-card"><div class="num">${data.summary.uniqueApplications}</div><div class="lbl">Aplicaciones</div></div>
    <div class="summary-card"><div class="num">${data.summary.uniquePorts}</div><div class="lbl">Puertos únicos</div></div>
  </div>

  <h2>Conexiones Entrantes (${incoming.length})</h2>
  <table>
    <colgroup>
      <col class="c-server"><col class="c-port"><col class="c-proto"><col class="c-service"><col class="c-app">
    </colgroup>
    <thead><tr>
      <th>Servidor Origen</th>
      <th>Puerto</th>
      <th>Protocolo</th>
      <th>Servicio / Proceso</th>
      <th>Aplicación</th>
    </tr></thead>
    <tbody>${buildRows(incoming, 'incoming')}</tbody>
  </table>

  <h2>Conexiones Salientes (${outgoing.length})</h2>
  <table>
    <colgroup>
      <col class="c-server"><col class="c-port"><col class="c-proto"><col class="c-service"><col class="c-app">
    </colgroup>
    <thead><tr>
      <th>Servidor Destino</th>
      <th>Puerto</th>
      <th>Protocolo</th>
      <th>Servicio / Proceso</th>
      <th>Aplicación</th>
    </tr></thead>
    <tbody>${buildRows(outgoing, 'outgoing')}</tbody>
  </table>

  ${data.relatedServers.length > 0 ? `
  <h2>Servidores Relacionados (${data.relatedServers.length})</h2>
  <p style="color:#374151;line-height:1.9;font-size:10px;padding:8px 0">${data.relatedServers.map(escape).join(' &nbsp;·&nbsp; ')}</p>
  ` : ''}

  ${data.relatedApplications.length > 0 ? `
  <h2>Aplicaciones Relacionadas (${data.relatedApplications.length})</h2>
  <p style="color:#374151;line-height:1.9;font-size:10px;padding:8px 0">${data.relatedApplications.map(escape).join(' &nbsp;·&nbsp; ')}</p>
  ` : ''}

  <div class="footer">© ${new Date().getFullYear()} SoftwareOne – AWS Migration Assessment Platform</div>
</body>
</html>`;
}
