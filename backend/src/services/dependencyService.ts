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

export interface WaveGroup {
  waveNumber: number;
  servers: string[];
  serverCount: number;
}

export interface MigrationWaveCalculation {
  waves: WaveGroup[];
  totalServers: number;
  totalWaves: number;
  serversWithoutDependencies: number;
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

  /**
   * Calculate migration waves based on dependencies with improved criticality logic
   * Priority:
   * 1. Test/Dev/Staging servers (lowest criticality) - Wave 1
   * 2. Servers without dependencies (low criticality) - Wave 1-2
   * 3. Servers with dependencies (medium criticality) - Wave 2-3
   * 4. Critical servers (high criticality) - Last waves
   */
  calculateMigrationWaves(dependencies: NetworkDependency[]): MigrationWaveCalculation {
    const graph = this.buildDependencyGraph(dependencies);
    const waves: Map<string, number> = new Map();
    const serverDependencies: Map<string, Set<string>> = new Map();
    
    // Build dependency map (server -> servers it depends on)
    for (const edge of graph.edges) {
      if (!serverDependencies.has(edge.from)) {
        serverDependencies.set(edge.from, new Set());
      }
      serverDependencies.get(edge.from)!.add(edge.to);
    }

    // Initialize all servers
    const allServers = new Set<string>();
    graph.nodes.forEach(node => allServers.add(node.id));

    // Calculate criticality for each server
    const serverCriticality = new Map<string, number>();
    allServers.forEach(server => {
      const criticality = this.calculateServerCriticality(server, serverDependencies);
      serverCriticality.set(server, criticality);
      console.log(`🎯 ${server}: criticidad ${criticality}`);
    });

    // WAVE 1: Test/Dev/Staging servers (criticality <= 15) - ALWAYS first
    const wave1Servers: string[] = [];
    allServers.forEach(server => {
      const criticality = serverCriticality.get(server) || 50;
      if (criticality <= 15) {
        wave1Servers.push(server);
        waves.set(server, 1);
      }
    });

    if (wave1Servers.length > 0) {
      console.log(`✅ Wave 1 (Test/Dev): ${wave1Servers.length} servidores`);
    }

    // WAVE 2: Servers without dependencies and low criticality (16-40)
    const wave2Servers: string[] = [];
    allServers.forEach(server => {
      if (waves.has(server)) return; // Already assigned
      
      const deps = serverDependencies.get(server);
      const criticality = serverCriticality.get(server) || 50;
      
      if ((!deps || deps.size === 0) && criticality <= 40) {
        wave2Servers.push(server);
        waves.set(server, 2);
      }
    });

    if (wave2Servers.length > 0) {
      console.log(`✅ Wave 2 (Sin dependencias, baja criticidad): ${wave2Servers.length} servidores`);
    }

    // WAVES 3+: Remaining servers based on dependencies and criticality
    let currentWave = 3;
    let assigned = new Set(waves.keys());
    let maxIterations = allServers.size + 10;
    let iterations = 0;

    while (assigned.size < allServers.size && iterations < maxIterations) {
      iterations++;
      const candidatesForWave: Array<{ server: string; criticality: number }> = [];

      for (const server of allServers) {
        if (assigned.has(server)) continue;

        const deps = serverDependencies.get(server);
        const criticality = serverCriticality.get(server) || 50;
        
        // If no dependencies, can go in current wave
        if (!deps || deps.size === 0) {
          candidatesForWave.push({ server, criticality });
          continue;
        }

        // Check if all dependencies are assigned
        const allDepsAssigned = Array.from(deps).every(dep => assigned.has(dep));
        
        if (allDepsAssigned) {
          // Calculate wave: max(dependency waves) + 1
          const depWaves = Array.from(deps).map(dep => waves.get(dep) || 1);
          const maxDepWave = Math.max(...depWaves);
          const calculatedWave = maxDepWave + 1;
          
          // SPECIAL RULE: Low criticality servers (< 40) can go earlier
          if (criticality < 40 && calculatedWave > currentWave) {
            // Skip for now, will be assigned in later iteration
            continue;
          }
          
          if (calculatedWave === currentWave) {
            candidatesForWave.push({ server, criticality });
          }
        }
      }

      // Sort by criticality (less critical first)
      candidatesForWave.sort((a, b) => a.criticality - b.criticality);
      
      if (candidatesForWave.length > 0) {
        candidatesForWave.forEach(({ server }) => {
          waves.set(server, currentWave);
          assigned.add(server);
        });
        
        const avgCriticality = candidatesForWave.reduce((sum, c) => sum + c.criticality, 0) / candidatesForWave.length;
        console.log(`✅ Wave ${currentWave}: ${candidatesForWave.length} servidores (criticidad promedio: ${avgCriticality.toFixed(1)})`);
        currentWave++;
      } else {
        // No candidates for this wave, move to next
        currentWave++;
      }
    }

    // Handle circular dependencies or unassigned servers
    const unassignedServers = Array.from(allServers).filter(s => !assigned.has(s));
    if (unassignedServers.length > 0) {
      console.log(`⚠️  ${unassignedServers.length} servidores con dependencias circulares`);
      
      // Sort by criticality
      const unassignedWithCriticality = unassignedServers.map(server => ({
        server,
        criticality: serverCriticality.get(server) || 50,
      })).sort((a, b) => a.criticality - b.criticality);
      
      unassignedWithCriticality.forEach(({ server }) => {
        waves.set(server, currentWave);
        assigned.add(server);
      });
      
      console.log(`✅ Wave ${currentWave} (Circular): ${unassignedServers.length} servidores`);
    }

    // Group servers by wave
    const waveGroups: Map<number, string[]> = new Map();
    waves.forEach((wave, server) => {
      if (!waveGroups.has(wave)) {
        waveGroups.set(wave, []);
      }
      waveGroups.get(wave)!.push(server);
    });

    // Convert to array format
    const waveArray: WaveGroup[] = Array.from(waveGroups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([waveNumber, servers]) => ({
        waveNumber,
        servers: servers.sort(),
        serverCount: servers.length,
      }));

    console.log(`🌊 Calculadas ${waveArray.length} olas de migración para ${allServers.size} servidores`);

    return {
      waves: waveArray,
      totalServers: allServers.size,
      totalWaves: waveArray.length,
      serversWithoutDependencies: waveGroups.get(1)?.length || 0,
    };
  }

  /**
   * Calculate server criticality based on name and dependencies
   */
  private calculateServerCriticality(serverName: string, dependencyMap: Map<string, Set<string>>): number {
    const name = serverName.toLowerCase();
    
    // PRIORITY 1: Test/Dev/Staging - ALWAYS lowest criticality (10-15)
    if (name.includes('test') || name.includes('dev') || name.includes('staging') || 
        name.includes('qa') || name.includes('sandbox') || name.includes('demo')) {
      return 10;
    }
    
    // PRIORITY 2: High criticality - Production infrastructure (70-90)
    if (name.includes('database') || name.includes('db') || name.includes('sql')) return 90;
    if (name.includes('auth') || name.includes('ldap') || name.includes('ad')) return 85;
    if (name.includes('storage') || name.includes('s3') || name.includes('blob')) return 80;
    if (name.includes('cache') || name.includes('redis') || name.includes('memcache')) return 75;
    if (name.includes('queue') || name.includes('kafka') || name.includes('rabbit')) return 70;
    
    // PRIORITY 3: Medium criticality - Production services (45-50)
    if (name.includes('api') || name.includes('rest') || name.includes('graphql')) return 50;
    if (name.includes('app')) return 45;
    
    // PRIORITY 4: Low criticality - Auxiliary services (20-30)
    if (name.includes('analytics') || name.includes('bi') || name.includes('report')) return 30;
    if (name.includes('web') || name.includes('nginx') || name.includes('apache')) return 25;
    if (name.includes('cdn') || name.includes('cloudfront')) return 20;
    
    // Consider number of dependents (more dependents = more critical)
    const dependents = Array.from(dependencyMap.entries())
      .filter(([_, deps]) => deps.has(serverName))
      .length;
    
    return 40 + (dependents * 5); // Base 40 + 5 per dependent
  }
}
