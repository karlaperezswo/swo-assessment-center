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
  // Server Communication MPA fields
  sourceHostname?: string;
  targetHostname?: string;
  clientProcess?: string;
  clientGroup?: string;
  serverProcess?: string;
  serverGroup?: string;
  // Application dependency fields (SRC App ID / DEST App ID)
  srcAppId?: string;
  destAppId?: string;
}

// Dependency from "Application Dependency" sheet
export interface AppDependency {
  srcAppId: string;
  destAppId: string;
  // extra columns if present
  srcAppName?: string;
  destAppName?: string;
  connectionType?: string;
  port?: number | null;
  protocol?: string;
  notes?: string;
}

export interface DatabaseInfo {
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

export interface DependencyData {
  dependencies: NetworkDependency[];
  appDependencies: AppDependency[];
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
    totalAppDependencies: number;
  };
}

export class DependencyParser {
  parseDependencies(buffer: Buffer): DependencyData {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const dependencies: NetworkDependency[] = [];
    const appDependencies: AppDependency[] = [];
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

    // Parse Application Dependency sheet if exists
    const appDepSheet = sheetNames.find(name =>
      name.toLowerCase().includes('application dependency') ||
      name.toLowerCase().includes('app dependency') ||
      name.toLowerCase().includes('application dep') ||
      name.toLowerCase() === 'app dep'
    );

    if (appDepSheet) {
      try {
        console.log(`📦 Procesando pestaña de dependencias de aplicaciones: "${appDepSheet}"`);
        const sheet = workbook.Sheets[appDepSheet];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const cols = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        console.log(`📋 Columnas Application Dependency: ${cols.join(', ')}`);
        const parsed = this.parseAppDependencySheet(rawData);
        appDependencies.push(...parsed);
        console.log(`✅ Encontradas ${parsed.length} dependencias de aplicaciones`);
      } catch (err) {
        console.warn(`⚠️  Error procesando Application Dependency:`, err);
      }
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
      appDependencies,
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
        totalAppDependencies: appDependencies.length,
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

    // Client (source) hostname, process and group
    const clientHostname = this.extractValue(row, [
      'Client Hostname', 'client hostname', 'client_hostname',
      'Source Hostname', 'source hostname', 'source_hostname',
      'Client Host', 'client host'
    ]);

    const clientProcess = this.extractValue(row, [
      'Client Process', 'client process', 'client_process',
      'Source Process', 'source process', 'source_process',
      'Client Process ID', 'client process id'
    ]);

    const clientGroup = this.extractValue(row, [
      'Client Group', 'client group', 'client_group',
      'Source Group', 'source group', 'source_group',
      'Client Application Group', 'client app group'
    ]);

    // Server (target) hostname, process and group
    const serverHostname = this.extractValue(row, [
      'Server Hostname', 'server hostname', 'server_hostname',
      'Target Hostname', 'target hostname', 'target_hostname',
      'Server Host', 'server host'
    ]);

    const serverProcess = this.extractValue(row, [
      'Server Process', 'server process', 'server_process',
      'Target Process', 'target process', 'target_process',
      'Server Process ID', 'server process id'
    ]);

    const serverGroup = this.extractValue(row, [
      'Server Group', 'server group', 'server_group',
      'Target Group', 'target group', 'target_group',
      'Server Application Group', 'server app group'
    ]);

    // Application IDs (SRC App ID / DEST App ID)
    const srcAppId = this.extractValue(row, [
      'SRC App ID', 'src app id', 'src_app_id', 'srcappid',
      'Source App ID', 'source app id', 'source_app_id',
      'Client App ID', 'client app id', 'src app', 'source app'
    ]);

    const destAppId = this.extractValue(row, [
      'DEST App ID', 'dest app id', 'dest_app_id', 'destappid',
      'Destination App ID', 'destination app id', 'destination_app_id',
      'Target App ID', 'target app id', 'target_app_id',
      'Server App ID', 'server app id', 'dest app', 'destination app'
    ]);

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
      sourceHostname: clientHostname ? this.cleanString(clientHostname) : undefined,
      targetHostname: serverHostname ? this.cleanString(serverHostname) : undefined,
      clientProcess: clientProcess ? this.cleanString(clientProcess) : undefined,
      clientGroup: clientGroup ? this.cleanString(clientGroup) : undefined,
      serverProcess: serverProcess ? this.cleanString(serverProcess) : undefined,
      serverGroup: serverGroup ? this.cleanString(serverGroup) : undefined,
      srcAppId: srcAppId ? this.cleanString(srcAppId) : undefined,
      destAppId: destAppId ? this.cleanString(destAppId) : undefined,
    };
  }



  private parseAppDependencySheet(rows: any[]): AppDependency[] {
    const result: AppDependency[] = [];
    for (const row of rows) {
      const srcAppId = this.extractValue(row, [
        'SRC App ID', 'src app id', 'src_app_id', 'srcappid',
        'Source App ID', 'source app id', 'source_app_id',
        'Source Application ID', 'src application id',
        'App ID Source', 'app id source',
      ]);
      const destAppId = this.extractValue(row, [
        'DEST App ID', 'dest app id', 'dest_app_id', 'destappid',
        'Destination App ID', 'destination app id', 'destination_app_id',
        'Target App ID', 'target app id', 'target_app_id',
        'Dest Application ID', 'App ID Dest', 'app id dest',
      ]);

      if (!srcAppId || !destAppId) continue;

      const srcAppName = this.extractValue(row, [
        'SRC App Name', 'src app name', 'Source App Name', 'source app name',
        'Source Application Name', 'src application name',
      ]);
      const destAppName = this.extractValue(row, [
        'DEST App Name', 'dest app name', 'Destination App Name', 'destination app name',
        'Target App Name', 'target app name', 'Dest Application Name',
      ]);
      const connectionType = this.extractValue(row, [
        'Connection Type', 'connection type', 'connection_type', 'type', 'tipo',
        'Dependency Type', 'dependency type',
      ]);
      const portRaw = this.extractValue(row, [
        'Port', 'port', 'puerto', 'Communication Port', 'communication port',
      ]);
      const protocol = this.extractValue(row, [
        'Protocol', 'protocol', 'protocolo', 'proto',
      ]);
      const notes = this.extractValue(row, [
        'Notes', 'notes', 'notas', 'Description', 'description', 'comments',
      ]);

      result.push({
        srcAppId: this.cleanString(srcAppId),
        destAppId: this.cleanString(destAppId),
        srcAppName: srcAppName ? this.cleanString(srcAppName) : undefined,
        destAppName: destAppName ? this.cleanString(destAppName) : undefined,
        connectionType: connectionType ? this.cleanString(connectionType) : undefined,
        port: portRaw ? this.parsePort(portRaw) : null,
        protocol: protocol ? this.cleanString(protocol).toUpperCase() : undefined,
        notes: notes ? this.cleanString(notes) : undefined,
      });
    }
    return result;
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
        'DB Name', 'Database Name', 'database name', 'db name',
        'database', 'nombre base de datos', 'database_name', 'db_name', 'nombre_bd', 'bd'
      ]);

      const serverId = this.extractValue(row, [
        'Server Id', 'Server ID', 'server id', 'server_id',
        'server', 'server name', 'host', 'servidor',
        'server_name', 'host_name', 'hostname', 'vm name'
      ]);

      const databaseId = this.extractValue(row, [
        'Database Id', 'Database ID', 'database id', 'db id',
        'database_id', 'db_id', 'id'
      ]);

      const edition = this.extractValue(row, [
        'Engine Edition', 'Engine Type', 'Source Engine Type',
        'edition', 'edicion', 'version', 'db edition', 'database edition',
        'sql edition', 'engine'
      ]);

      const dbInstanceName = this.extractValue(row, [
        'Instance Name', 'DB Instance Name', 'db instance name',
        'instance name', 'db instance', 'instance',
        'database instance', 'db_instance_name', 'instance_name',
        'sql instance', 'server instance'
      ]);

      const totalSizeRaw = this.extractValue(row, [
        'Total Size (GB)', 'Total Size', 'total size (gb)', 'total size gb',
        'size (gb)', 'size gb', 'database size', 'db size',
        'total_size_gb', 'total_size', 'size', 'tamaño total', 'tamaño (gb)'
      ]);

      const totalSizeGb = totalSizeRaw
        ? parseFloat(String(totalSizeRaw).replace(/[^0-9.]/g, '')) || undefined
        : undefined;

      const maxTpsRaw = this.extractValue(row, [
        'Max Transactions per Second', 'Max Transactions Per Second',
        'max transactions per second', 'max tps', 'Max TPS',
        'transactions per second', 'tps', 'max_tps', 'max_transactions_per_second'
      ]);

      const maxTransactionsPerSecond = maxTpsRaw
        ? parseFloat(String(maxTpsRaw).replace(/[^0-9.]/g, '')) || undefined
        : undefined;

      // Only add if we have at least database name and server
      if (databaseName && serverId) {
        databases.push({
          databaseName: this.cleanString(databaseName),
          serverId: this.cleanString(serverId),
          databaseId: databaseId ? this.cleanString(databaseId) : undefined,
          edition: edition ? this.cleanString(edition) : undefined,
          dbInstanceName: dbInstanceName ? this.cleanString(dbInstanceName) : undefined,
          totalSizeGb: totalSizeGb !== undefined && !isNaN(totalSizeGb) ? totalSizeGb : undefined,
          maxTransactionsPerSecond: maxTransactionsPerSecond !== undefined && !isNaN(maxTransactionsPerSecond) ? maxTransactionsPerSecond : undefined,
          hasDependencies: false,
          dependencies: { asSource: [], asDestination: [] },
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
