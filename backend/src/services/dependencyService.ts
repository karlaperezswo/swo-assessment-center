import { DependencyParser, NetworkDependency, DependencyData } from './parsers/DependencyParser';

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'server' | 'application';
  group?: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  label: string;
  port: number | null;
  protocol: string;
  serviceName?: string;
}

export interface DependencySearchResult {
  server: string;
  dependencies: {
    incoming: NetworkDependency[];
    outgoing: NetworkDependency[];
  };
  relatedServers: string[];
  relatedApplications: string[];
  graph: DependencyGraph;
}

export class DependencyService {
  private parser: DependencyParser;

  constructor() {
    this.parser = new DependencyParser();
  }

  parseDependencyFile(buffer: Buffer): DependencyData {
    return this.parser.parseDependencies(buffer);
  }

  buildDependencyGraph(dependencies: NetworkDependency[]): DependencyGraph {
    const nodes = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];

    // First, collect all nodes that have connections
    const connectedNodes = new Set<string>();
    
    for (const dep of dependencies) {
      connectedNodes.add(dep.source);
      connectedNodes.add(dep.destination);
    }

    for (const dep of dependencies) {
      // Add source node (only if it has connections)
      if (!nodes.has(dep.source) && connectedNodes.has(dep.source)) {
        nodes.set(dep.source, {
          id: dep.source,
          label: dep.source,
          type: 'server',
          group: dep.sourceApp,
        });
      }

      // Add destination node (only if it has connections)
      if (!nodes.has(dep.destination) && connectedNodes.has(dep.destination)) {
        nodes.set(dep.destination, {
          id: dep.destination,
          label: dep.destination,
          type: 'server',
          group: dep.destinationApp,
        });
      }

      // Add edge
      edges.push({
        from: dep.source,
        to: dep.destination,
        label: dep.port !== null ? `${dep.protocol}:${dep.port}` : dep.protocol,
        port: dep.port,
        protocol: dep.protocol,
        serviceName: dep.serviceName,
      });
    }

    console.log(`📊 Grafo construido: ${nodes.size} nodos conectados, ${edges.length} conexiones`);

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  searchDependencies(
    data: DependencyData,
    searchTerm: string
  ): DependencySearchResult | null {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // Find matching server
    const matchingServer = Array.from(data.servers).find(
      server => server.toLowerCase().includes(normalizedSearch)
    );

    if (!matchingServer) {
      return null;
    }

    // Get all dependencies for this server
    const incoming = data.dependencies.filter(
      dep => dep.destination.toLowerCase() === matchingServer.toLowerCase()
    );

    const outgoing = data.dependencies.filter(
      dep => dep.source.toLowerCase() === matchingServer.toLowerCase()
    );

    // Get related servers (direct connections)
    const relatedServers = new Set<string>();
    incoming.forEach(dep => relatedServers.add(dep.source));
    outgoing.forEach(dep => relatedServers.add(dep.destination));

    // Get related applications
    const relatedApplications = new Set<string>();
    [...incoming, ...outgoing].forEach(dep => {
      if (dep.sourceApp) relatedApplications.add(dep.sourceApp);
      if (dep.destinationApp) relatedApplications.add(dep.destinationApp);
    });

    // Build subgraph with all related dependencies
    const allRelatedDeps = this.getTransitiveDependencies(
      data.dependencies,
      matchingServer
    );

    const graph = this.buildDependencyGraph(allRelatedDeps);

    return {
      server: matchingServer,
      dependencies: { incoming, outgoing },
      relatedServers: Array.from(relatedServers),
      relatedApplications: Array.from(relatedApplications),
      graph,
    };
  }

  private getTransitiveDependencies(
    allDependencies: NetworkDependency[],
    startServer: string,
    maxDepth: number = 2
  ): NetworkDependency[] {
    const result = new Set<NetworkDependency>();
    const visited = new Set<string>();
    const queue: Array<{ server: string; depth: number }> = [
      { server: startServer, depth: 0 }
    ];

    while (queue.length > 0) {
      const { server, depth } = queue.shift()!;

      if (visited.has(server) || depth > maxDepth) {
        continue;
      }

      visited.add(server);

      // Find all dependencies involving this server
      const related = allDependencies.filter(
        dep =>
          dep.source.toLowerCase() === server.toLowerCase() ||
          dep.destination.toLowerCase() === server.toLowerCase()
      );

      related.forEach(dep => {
        result.add(dep);

        // Add connected servers to queue
        if (depth < maxDepth) {
          if (dep.source.toLowerCase() === server.toLowerCase()) {
            queue.push({ server: dep.destination, depth: depth + 1 });
          } else {
            queue.push({ server: dep.source, depth: depth + 1 });
          }
        }
      });
    }

    return Array.from(result);
  }

  async exportToDocument(
    searchResult: DependencySearchResult,
    summary: any,
    format: 'pdf' | 'word'
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const timestamp = new Date().toISOString().split('T')[0];
    const serverName = searchResult.server.replace(/[^a-zA-Z0-9]/g, '_');

    if (format === 'word') {
      const { DocumentGeneratorService } = await import('./documentGeneratorService');
      const docGenerator = new DocumentGeneratorService();
      
      const reportData: any = {
        server: searchResult.server,
        dependencies: searchResult.dependencies,
        relatedServers: searchResult.relatedServers,
        relatedApplications: searchResult.relatedApplications,
        summary,
      };

      // Generate Word document and read the file
      const filename = await docGenerator.generateWordDocument(reportData);
      const filepath = docGenerator.getFilePath(filename);
      const buffer = require('fs').readFileSync(filepath);

      return {
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
    } else {
      // Generate PDF from HTML using puppeteer
      const htmlContent = this.generateHTMLReport(searchResult, summary);
      const filename = `dependencias_${serverName}_${timestamp}.pdf`;
      
      try {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
          printBackground: true,
        });
        await browser.close();

        return {
          buffer: pdfBuffer,
          filename,
          mimeType: 'application/pdf',
        };
      } catch (error) {
        console.error('Error generating PDF, falling back to HTML:', error);
        // Fallback to HTML if PDF generation fails
        return {
          buffer: Buffer.from(htmlContent, 'utf-8'),
          filename: filename.replace('.pdf', '.html'),
          mimeType: 'text/html',
        };
      }
    }
  }

  private generateHTMLReport(result: DependencySearchResult, summary: any): string {
    const { server, dependencies, relatedServers, relatedApplications } = result;

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte de Dependencias - ${server}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    h3 { color: #3b82f6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #2563eb; color: white; padding: 12px; text-align: left; }
    td { border: 1px solid #ddd; padding: 10px; }
    tr:nth-child(even) { background-color: #f3f4f6; }
    .summary-box { background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    .incoming { background-color: #d1fae5; }
    .outgoing { background-color: #dbeafe; }
    .badge { display: inline-block; background-color: #e5e7eb; padding: 5px 10px; margin: 5px; border-radius: 5px; }
    .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📊 Reporte de Dependencias de Red</h1>
  
  <div class="summary-box">
    <h3>Servidor Analizado: ${server}</h3>
    <p><strong>Fecha de generación:</strong> ${new Date().toLocaleString('es-ES')}</p>
    <p><strong>Total de dependencias en el sistema:</strong> ${summary.totalDependencies}</p>
    <p><strong>Servidores únicos:</strong> ${summary.uniqueServers}</p>
    <p><strong>Aplicaciones únicas:</strong> ${summary.uniqueApplications}</p>
    <p><strong>Puertos únicos:</strong> ${summary.uniquePorts}</p>
  </div>

  <h2>🔽 Conexiones Entrantes (${dependencies.incoming.length})</h2>
  <p>Servidores que se conectan a <strong>${server}</strong>:</p>
  <table>
    <thead>
      <tr>
        <th>Servidor Origen</th>
        <th>Puerto</th>
        <th>Protocolo</th>
        <th>Servicio</th>
        <th>Aplicación Origen</th>
        <th>Aplicación Destino</th>
      </tr>
    </thead>
    <tbody>
`;

    dependencies.incoming.forEach(dep => {
      html += `
      <tr class="incoming">
        <td><strong>${dep.source}</strong></td>
        <td>${dep.port !== null ? dep.port : ''}</td>
        <td>${dep.protocol}</td>
        <td>${dep.serviceName || ''}</td>
        <td>${dep.sourceApp || ''}</td>
        <td>${dep.destinationApp || ''}</td>
      </tr>
`;
    });

    if (dependencies.incoming.length === 0) {
      html += `
      <tr>
        <td colspan="6" style="text-align: center; color: #6b7280;">No hay conexiones entrantes</td>
      </tr>
`;
    }

    html += `
    </tbody>
  </table>

  <h2>🔼 Conexiones Salientes (${dependencies.outgoing.length})</h2>
  <p>Servidores a los que <strong>${server}</strong> se conecta:</p>
  <table>
    <thead>
      <tr>
        <th>Servidor Destino</th>
        <th>Puerto</th>
        <th>Protocolo</th>
        <th>Servicio</th>
        <th>Aplicación Origen</th>
        <th>Aplicación Destino</th>
      </tr>
    </thead>
    <tbody>
`;

    dependencies.outgoing.forEach(dep => {
      html += `
      <tr class="outgoing">
        <td><strong>${dep.destination}</strong></td>
        <td>${dep.port !== null ? dep.port : ''}</td>
        <td>${dep.protocol}</td>
        <td>${dep.serviceName || ''}</td>
        <td>${dep.sourceApp || ''}</td>
        <td>${dep.destinationApp || ''}</td>
      </tr>
`;
    });

    if (dependencies.outgoing.length === 0) {
      html += `
      <tr>
        <td colspan="6" style="text-align: center; color: #6b7280;">No hay conexiones salientes</td>
      </tr>
`;
    }

    html += `
    </tbody>
  </table>

  <h2>🖥️ Servidores Relacionados (${relatedServers.length})</h2>
  <div>
`;

    relatedServers.forEach(srv => {
      html += `<span class="badge">${srv}</span>`;
    });

    html += `
  </div>

  <h2>📱 Aplicaciones Relacionadas (${relatedApplications.length})</h2>
  <div>
`;

    relatedApplications.forEach(app => {
      html += `<span class="badge">${app}</span>`;
    });

    html += `
  </div>

  <div class="footer">
    <p>Reporte generado por el Sistema de Análisis de Dependencias de Red</p>
    <p>© ${new Date().getFullYear()} SoftwareOne - AWS Migration Assessment Platform</p>
  </div>
</body>
</html>
`;

    return html;
  }
}
