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
  targetProcessId?: string;
}

export interface DatabaseInfo {
  databaseName: string;
  serverId: string;
  databaseId?: string;
  edition?: string;
  hasDependencies: boolean;
  dependencies: {
    asSource: NetworkDependency[];
    asDestination: NetworkDependency[];
  };
}

export interface DependencyData {
  dependencies: NetworkDependency[];
  servers: Set<string>;
  applications: Set<string>;
  databases: DatabaseInfo[];
  databasesWithoutDependencies: DatabaseInfo[];
  summary: {
    totalDependencies: number;
    uniqueServers: number;
    uniqueApplications: number;
    uniquePorts: number;
    totalDatabases: number;
    databasesWithDependencies: number;
    databasesWithoutDependencies: number;
  };
}

export class DependencyParser {
  parseDependencies(buffer: Buffer): DependencyData {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const dependencies: NetworkDependency[] = [];
    const servers = new Set<string>();
    const applications = new Set<string>();
    const ports = new Set<number>();
    const databases: DatabaseInfo[] = [];

    const sheetNames = workbook.SheetNames;
    console.log(`📊 Analizando ${sheetNames.length} pestañas: ${sheetNames.join(', ')}`);

    // Find Server Communication sheet
    const serverCommSheet = sheetNames.find(name => 
      name.toLowerCase().includes('server') && name.toLowerCase().includes('communication')
    ) || sheetNames.find(name => 
      name.toLowerCase().includes('communication')
    ) || sheetNames.find(name =>
      name.toLowerCase().includes('dependenc')
    );

    if (!serverCommSheet) {
      throw new Error('No se encontró la pestaña "Server Communication" o similar en el archivo Excel');
    }

    console.log(`🎯 Usando pestaña principal: "${serverCommSheet}"`);

    // Parse Server Communication sheet
    try {
      const sheet = workbook.Sheets[serverCommSheet];
      const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rawData.length === 0) {
        throw new Error(`La pestaña "${serverCommSheet}" está vacía`);
      }

      // Log column names for debugging
      const columns = Object.keys(rawData[0]);
      console.log(`📋 Columnas encontradas: ${columns.join(', ')}`);

      console.log(`🔍 Procesando ${rawData.length} filas de dependencias...`);

      for (const row of rawData) {
        const dep = this.parseServerCommunicationRow(row);
        if (dep) {
          dependencies.push(dep);
          servers.add(dep.source);
          servers.add(dep.destination);
          if (dep.port !== null) {
            ports.add(dep.port);
          }
          
          if (dep.sourceApp) applications.add(dep.sourceApp);
          if (dep.destinationApp) applications.add(dep.destinationApp);
        }
      }

      console.log(`✅ Encontradas ${dependencies.length} dependencias válidas`);
    } catch (error) {
      console.error(`❌ Error procesando pestaña "${serverCommSheet}":`, error);
      throw error;
    }

    // Parse Databases sheet if exists
    const databaseSheet = sheetNames.find(name => 
      name.toLowerCase().includes('database') || name.toLowerCase().includes('db')
    );

    if (databaseSheet) {
      try {
        console.log(`💾 Procesando pestaña de bases de datos: "${databaseSheet}"`);
        const sheet = workbook.Sheets[databaseSheet];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const parsedDatabases = this.parseDatabaseSheet(rawData);
        databases.push(...parsedDatabases);
        console.log(`✅ Encontradas ${parsedDatabases.length} bases de datos`);
      } catch (error) {
        console.log(`⚠️  Error procesando bases de datos:`, error);
      }
    }

    if (dependencies.length === 0) {
      throw new Error('No se encontraron dependencias válidas en el archivo Excel');
    }

    // Match databases with dependencies
    if (databases.length > 0) {
      console.log(`🔗 Relacionando ${databases.length} bases de datos con dependencias...`);
      this.matchDatabaseDependencies(databases, dependencies);
    }

    // Separate databases with and without dependencies
    const databasesWithDependencies = databases.filter(db => db.hasDependencies);
    const databasesWithoutDependencies = databases.filter(db => !db.hasDependencies);

    console.log(`✅ Resumen Final:`);
    console.log(`   - ${dependencies.length} dependencias`);
    console.log(`   - ${servers.size} servidores únicos`);
    console.log(`   - ${applications.size} aplicaciones`);
    console.log(`   - ${databases.length} bases de datos (${databasesWithDependencies.length} con deps, ${databasesWithoutDependencies.length} sin deps)`);

    return {
      dependencies,
      servers,
      applications,
      databases,
      databasesWithoutDependencies,
      summary: {
        totalDependencies: dependencies.length,
        uniqueServers: servers.size,
        uniqueApplications: applications.size,
        uniquePorts: ports.size,
        totalDatabases: databases.length,
        databasesWithDependencies: databasesWithDependencies.length,
        databasesWithoutDependencies: databasesWithoutDependencies.length,
      },
    };
  }



  private parseServerCommunicationRow(row: any): NetworkDependency | null {
    // Extract values using MPA-specific column names for Server Communication sheet
    const sourceServerId = this.extractValue(row, [
      'Source Server ID',
      'source server id',
      'source_server_id',
      'sourceserverid',
      'source server',
      'source',
      'origen',
      'source hostname',
      'source host'
    ]);

    const targetServerId = this.extractValue(row, [
      'Target Server ID',
      'target server id',
      'target_server_id',
      'targetserverid',
      'target server',
      'destination server',
      'destination',
      'destino',
      'target hostname',
      'target host'
    ]);

    const communicationPort = this.extractValue(row, [
      'Communication Port',
      'communication port',
      'communication_port',
      'communicationport',
      'port',
      'puerto',
      'destination port',
      'target port',
      'dest port'
    ]);

    const targetProcessId = this.extractValue(row, [
      'Target Process ID',
      'target process id',
      'target_process_id',
      'targetprocessid',
      'process id',
      'process',
      'service',
      'service name',
      'application'
    ]);

    const protocol = this.extractValue(row, [
      'protocol',
      'protocolo',
      'proto',
      'ip protocol',
      'transport protocol'
    ]) || 'TCP';

    // CRITICAL: Only create dependency if we have both source and target
    // This ensures we only include servers that have actual connections
    if (!sourceServerId || !targetServerId) {
      return null;
    }

    // Parse port - can be null (connections without port are still valid)
    const port = this.parsePort(communicationPort);

    return {
      source: this.cleanString(sourceServerId),
      destination: this.cleanString(targetServerId),
      port,
      protocol: this.cleanString(protocol).toUpperCase(),
      serviceName: targetProcessId ? this.cleanString(targetProcessId) : undefined,
      targetProcessId: targetProcessId ? this.cleanString(targetProcessId) : undefined,
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

  private parseDatabaseSheet(rows: any[]): DatabaseInfo[] {
    const databases: DatabaseInfo[] = [];

    for (const row of rows) {
      const databaseName = this.extractValue(row, [
        'database', 'database name', 'db name', 'nombre base de datos',
        'database_name', 'db_name', 'nombre_bd', 'bd'
      ]);

      const serverId = this.extractValue(row, [
        'server', 'server id', 'server name', 'host', 'servidor',
        'server_id', 'server_name', 'host_name', 'hostname', 'vm name'
      ]);

      const databaseId = this.extractValue(row, [
        'database id', 'db id', 'database_id', 'db_id', 'id'
      ]);

      const edition = this.extractValue(row, [
        'edition', 'edicion', 'version', 'db edition', 'database edition',
        'sql edition', 'engine'
      ]);

      // Only add if we have at least database name and server
      if (databaseName && serverId) {
        databases.push({
          databaseName: this.cleanString(databaseName),
          serverId: this.cleanString(serverId),
          databaseId: databaseId ? this.cleanString(databaseId) : undefined,
          edition: edition ? this.cleanString(edition) : undefined,
          hasDependencies: false,
          dependencies: {
            asSource: [],
            asDestination: [],
          },
        });
      }
    }

    return databases;
  }

  private matchDatabaseDependencies(databases: DatabaseInfo[], dependencies: NetworkDependency[]): void {
    for (const db of databases) {
      // Find dependencies where the database server is involved
      const asSource = dependencies.filter(dep => 
        dep.source.toLowerCase().includes(db.serverId.toLowerCase()) ||
        db.serverId.toLowerCase().includes(dep.source.toLowerCase())
      );

      const asDestination = dependencies.filter(dep =>
        dep.destination.toLowerCase().includes(db.serverId.toLowerCase()) ||
        db.serverId.toLowerCase().includes(dep.destination.toLowerCase())
      );

      db.dependencies.asSource = asSource;
      db.dependencies.asDestination = asDestination;
      db.hasDependencies = asSource.length > 0 || asDestination.length > 0;
    }
  }
}
