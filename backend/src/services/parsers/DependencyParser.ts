import * as XLSX from 'xlsx';

export interface NetworkDependency {
  source: string;
  destination: string;
  port: number | null;
  protocol: string;
  serviceName?: string;
  sourceApp?: string;
  destinationApp?: string;
  sourceIP?: string;
  destinationIP?: string;
}

export interface DependencyData {
  dependencies: NetworkDependency[];
  servers: Set<string>;
  applications: Set<string>;
  summary: {
    totalDependencies: number;
    uniqueServers: number;
    uniqueApplications: number;
    uniquePorts: number;
  };
}

export class DependencyParser {
  parseDependencies(buffer: Buffer): DependencyData {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const dependencies: NetworkDependency[] = [];
    const servers = new Set<string>();
    const applications = new Set<string>();
    const ports = new Set<number>();

    // Try to read from ALL sheets to get complete data
    const sheetNames = workbook.SheetNames;
    console.log(`📊 Analizando ${sheetNames.length} pestañas: ${sheetNames.join(', ')}`);

    for (const sheetName of sheetNames) {
      try {
        const sheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawData.length === 0) {
          console.log(`⚠️  Pestaña "${sheetName}" está vacía, saltando...`);
          continue;
        }

        // Log column names for debugging
        if (rawData.length > 0) {
          const columns = Object.keys(rawData[0]);
          console.log(`📋 Columnas en "${sheetName}": ${columns.slice(0, 10).join(', ')}${columns.length > 10 ? '...' : ''}`);
        }

        console.log(`🔍 Procesando pestaña "${sheetName}" con ${rawData.length} filas`);

        let foundDependencies = 0;
        for (const row of rawData) {
          const dep = this.parseDependencyRow(row);
          if (dep) {
            dependencies.push(dep);
            servers.add(dep.source);
            servers.add(dep.destination);
            if (dep.port !== null) {
              ports.add(dep.port);
            }
            
            if (dep.sourceApp) applications.add(dep.sourceApp);
            if (dep.destinationApp) applications.add(dep.destinationApp);
            foundDependencies++;
          }
        }

        if (foundDependencies > 0) {
          console.log(`✅ Encontradas ${foundDependencies} dependencias en "${sheetName}"`);
        } else {
          console.log(`⚠️  No se encontraron dependencias válidas en "${sheetName}"`);
        }
      } catch (error) {
        console.log(`⚠️  Error procesando pestaña "${sheetName}":`, error);
        continue;
      }
    }

    if (dependencies.length === 0) {
      throw new Error('No se encontraron dependencias válidas en ninguna pestaña del archivo Excel');
    }

    console.log(`✅ Total: ${dependencies.length} dependencias, ${servers.size} servidores, ${applications.size} aplicaciones`);

    return {
      dependencies,
      servers,
      applications,
      summary: {
        totalDependencies: dependencies.length,
        uniqueServers: servers.size,
        uniqueApplications: applications.size,
        uniquePorts: ports.size,
      },
    };
  }

  private findDependencySheet(sheetNames: string[]): string | null {
    const keywords = [
      'dependenc',
      'network',
      'connection',
      'flow',
      'comunicacion',
      'comunicación',
      'red',
      'flujo',
      'traffic',
      'tráfico'
    ];

    for (const name of sheetNames) {
      const lowerName = name.toLowerCase();
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return name;
      }
    }

    // If no match, try first sheet
    return sheetNames[0] || null;
  }

  private parseDependencyRow(row: any): NetworkDependency | null {
    // Try different column name variations
    const source = this.extractValue(row, [
      'source', 'origen', 'from', 'source_server', 'source_host',
      'servidor_origen', 'host_origen', 'source hostname', 'source server',
      'source name', 'sourcename', 'src', 'source vm', 'source device'
    ]);

    const destination = this.extractValue(row, [
      'destination', 'destino', 'to', 'dest', 'destination_server',
      'destination_host', 'servidor_destino', 'host_destino',
      'destination hostname', 'destination server', 'destination name',
      'destinationname', 'dst', 'destination vm', 'destination device', 'target'
    ]);

    const portStr = this.extractValue(row, [
      'port', 'puerto', 'destination_port', 'dest_port', 'puerto_destino',
      'destination port', 'dst_port', 'target port', 'service port'
    ]);

    const protocol = this.extractValue(row, [
      'protocol', 'protocolo', 'proto', 'ip protocol'
    ]) || 'TCP';

    const serviceName = this.extractValue(row, [
      'service', 'servicio', 'service_name', 'nombre_servicio',
      'application', 'app name', 'process'
    ]);

    const sourceApp = this.extractValue(row, [
      'source_app', 'source_application', 'app_origen', 'aplicacion_origen',
      'source application name'
    ]);

    const destinationApp = this.extractValue(row, [
      'destination_app', 'dest_app', 'app_destino', 'aplicacion_destino',
      'destination application name'
    ]);

    const sourceIP = this.extractValue(row, [
      'source_ip', 'ip_origen', 'source ip', 'source address', 'src ip'
    ]);

    const destinationIP = this.extractValue(row, [
      'destination_ip', 'dest_ip', 'ip_destino', 'destination ip',
      'destination address', 'dst ip', 'target ip'
    ]);

    // If we don't have source and destination, skip this row
    if (!source || !destination) {
      return null;
    }

    // Try to parse port - if not found, use null (unknown)
    let port = this.parsePort(portStr);
    if (port === null) {
      // Try to extract port from service name or other fields
      const allValues = Object.values(row).join(' ');
      const portMatch = allValues.match(/\b(\d{1,5})\b/);
      if (portMatch) {
        const extractedPort = parseInt(portMatch[1], 10);
        if (extractedPort >= 1 && extractedPort <= 65535) {
          port = extractedPort;
        }
      }
    }

    return {
      source: this.cleanString(source),
      destination: this.cleanString(destination),
      port,
      protocol: this.cleanString(protocol).toUpperCase(),
      serviceName: serviceName ? this.cleanString(serviceName) : undefined,
      sourceApp: sourceApp ? this.cleanString(sourceApp) : undefined,
      destinationApp: destinationApp ? this.cleanString(destinationApp) : undefined,
      sourceIP: sourceIP ? this.cleanString(sourceIP) : undefined,
      destinationIP: destinationIP ? this.cleanString(destinationIP) : undefined,
    };
  }

  private extractValue(row: any, possibleKeys: string[]): string | null {
    for (const key of possibleKeys) {
      // Exact match
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return String(row[key]).trim();
      }

      // Case-insensitive match
      const foundKey = Object.keys(row).find(
        k => k.toLowerCase() === key.toLowerCase()
      );
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
        return String(row[foundKey]).trim();
      }

      // Partial match (contains)
      const partialKey = Object.keys(row).find(
        k => k.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(k.toLowerCase())
      );
      if (partialKey && row[partialKey] !== undefined && row[partialKey] !== null && row[partialKey] !== '') {
        return String(row[partialKey]).trim();
      }
    }
    return null;
  }

  private parsePort(portStr: string | null): number | null {
    if (!portStr) return null;
    
    const cleaned = portStr.replace(/[^0-9]/g, '');
    const port = parseInt(cleaned, 10);
    
    if (isNaN(port) || port < 1 || port > 65535) {
      return null;
    }
    
    return port;
  }

  private cleanString(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    return String(value || '');
  }
}
