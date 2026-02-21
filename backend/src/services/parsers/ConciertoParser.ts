import { BaseParser } from './BaseParser';
import {
  ExcelData,
  DataSourceType,
  Server,
  Database,
  Application,
  ServerApplicationMapping,
  ServerCommunication
} from '../../../../shared/types/assessment.types';

/**
 * Parser for Concierto MPA Report Excel format
 */
export class ConciertoParser extends BaseParser {
  private cachedCommunications: ServerCommunication[] | null = null;

  getDataSourceType(): DataSourceType {
    return 'CONCIERTO';
  }

  canParse(): boolean {
    // Concierto format has specific sheet names
    const sheetNames = this.workbook.SheetNames.map(s => s.toLowerCase());
    const conciertoSheets = [
      'inventory master',
      'app dashboard',
      'overall connections'
    ];

    return conciertoSheets.some(sheet =>
      sheetNames.some(s => s.includes(sheet))
    );
  }

  parse(): ExcelData {
    // Parse communications first and cache them for application connection counting
    const serverCommunications = this.parseServerCommunications();
    this.cachedCommunications = serverCommunications;

    return {
      dataSource: this.getDataSourceType(),
      servers: this.parseServers(),
      databases: this.parseDatabases(),
      applications: this.parseApplications(),
      serverApplicationMappings: this.parseServerApplicationMappings(),
      serverCommunications
    };
  }

  protected parseServers(): Server[] {
    const sheetName = this.findSheet(['Inventory Master', 'VM Utilization Metrics']);
    if (!sheetName) return [];

    // Concierto format has header in row 1 (index 1)
    const data = this.getSheetDataWithHeader(sheetName, 1);

    return data
      .filter(row => row['Host Name '] || row['Host Name']) // Filter out empty rows
      .map((row, index) => {
        const hostname = this.cleanString(row['Host Name '] || row['Host Name'] || '');
        const ipAddress = this.cleanString(row['IP Address'] || '');

        return {
          serverId: this.generateId('srv', index, `${hostname}-${ipAddress}`),
          hostname,
          ipAddress,
          isPhysical: this.parseBoolean(row['Is Virtual?']) === false, // Invert the logic
          osName: this.cleanString(row['Operating System'] || ''),
          osVersion: '',
          numCpus: this.parseNumber(row['CPU Count'] || 1),
          numCoresPerCpu: 1, // Not provided in Concierto format
          numThreadsPerCore: 1, // Not provided in Concierto format
          totalRAM: this.parseNumber(row['Memory (MB)'] || 0) / 1024, // Convert MB to GB
          maxCpuUsage: this.parseNumber(row['Cpu Utilization Peak (%)'] || 0),
          avgCpuUsage: this.parseNumber(row['Cpu Utilization Avg (%)'] || 0),
          maxRamUsage: this.parseNumber(row['Memory Utilization Peak (%)'] || 0),
          avgRamUsage: this.parseNumber(row['Memory Utilization Avg (%)'] || 0),
          totalDiskSize: this.parseNumber(row['Provisioned Storage (GB)'] || 0),
          storageUtilization: this.calculateStorageUtilization(
            row['Provisioned Storage (GB)'],
            row['Utilized Storage (GB)']
          ),
          uptime: 0, // Not provided in Concierto format
          environment: this.cleanString(row['Environment'] || ''),
          vmFunctionality: this.cleanString(row['VM Funcationality'] || row['VM Functionality'] || ''),
          sqlEdition: this.cleanString(row['SQL Edition'] || '')
        };
      });
  }

  protected parseDatabases(): Database[] {
    const sheetName = this.findSheet(['Databases']);
    if (!sheetName) return [];

    const data = this.getSheetDataWithHeader(sheetName, 1);

    // Also get databases from Inventory Master with SQL Edition
    const inventorySheetName = this.findSheet(['Inventory Master']);
    const inventoryData = inventorySheetName
      ? this.getSheetDataWithHeader(inventorySheetName, 1)
      : [];

    // Filter for REAL database servers only (exclude "Not Applicable", etc.)
    const dbServers = inventoryData.filter(row => {
      const sqlEdition = this.cleanString(row['SQL Edition'] || '').toLowerCase();
      return sqlEdition &&
        sqlEdition !== 'not applicable' &&
        sqlEdition !== 'n/a' &&
        sqlEdition !== 'none' &&
        (sqlEdition.includes('sql server') ||
         sqlEdition.includes('oracle') ||
         sqlEdition.includes('mysql') ||
         sqlEdition.includes('postgres') ||
         sqlEdition.includes('db2') ||
         sqlEdition.includes('mariadb'));
    });

    return dbServers.map((row, index) => {
      const hostname = this.cleanString(row['Host Name '] || row['Host Name'] || '');
      const ipAddress = this.cleanString(row['IP Address'] || '');
      const sqlEdition = this.cleanString(row['SQL Edition'] || '');

      // Parse SQL Edition to determine engine type and version
      const engineInfo = this.parseSQLEdition(sqlEdition);

      return {
        databaseId: this.generateId('db', index, `${hostname}-${ipAddress}-db`),
        dbName: hostname, // Use hostname as database name
        instanceName: hostname,
        engineType: engineInfo.type,
        engineVersion: engineInfo.version,
        engineEdition: engineInfo.edition,
        totalSize: 0, // Size not directly available in Concierto
        serverId: `${hostname}-${ipAddress}`,
        licenseModel: this.getLicenseModel(engineInfo.type),
        maxTPS: 0
      };
    });
  }

  protected parseApplications(): Application[] {
    const sheetName = this.findSheet(['App to IP Mapping']);
    if (!sheetName) return [];

    const data = this.getSheetDataWithHeader(sheetName, 1);

    // Group by application name to get unique applications
    const appMap = new Map<string, any[]>();

    data.forEach(row => {
      const appName = this.cleanString(row['Application Name'] || '');
      if (appName) {
        if (!appMap.has(appName)) {
          appMap.set(appName, []);
        }
        appMap.get(appName)!.push(row);
      }
    });

    // Create applications from grouped data
    return Array.from(appMap.entries()).map(([appName, rows], index) => {
      // Count connections from communication sheets
      const connections = this.getApplicationConnections(appName);

      return {
        appId: this.generateId('app', index, appName),
        name: appName,
        description: `Application with ${rows.length} servers`,
        type: this.inferApplicationType(appName),
        totalConnections: connections.inbound + connections.outbound,
        inboundConnections: connections.inbound,
        outboundConnections: connections.outbound,
        environmentType: this.inferEnvironmentFromConnections(appName)
      };
    });
  }

  protected parseServerApplicationMappings(): ServerApplicationMapping[] {
    const sheetName = this.findSheet(['App to IP Mapping']);
    if (!sheetName) return [];

    const data = this.getSheetDataWithHeader(sheetName, 1);

    return data
      .filter(row => row['Application Name'] && (row['Host Name (New)'] || row['Host Name']))
      .map(row => {
        const hostname = this.cleanString(row['Host Name (New)'] || row['Host Name'] || '');
        const ipAddress = this.cleanString(row['IP Address (New)'] || row['IP Address'] || '');
        const appName = this.cleanString(row['Application Name'] || '');

        return {
          serverId: `${hostname}-${ipAddress}`,
          appId: appName,
          hostname,
          applicationName: appName
        };
      });
  }

  protected parseServerCommunications(): ServerCommunication[] {
    const communications: ServerCommunication[] = [];

    // Parse all connection sheets (Prod, Dev, UAT, SIT, DR)
    const environments = ['Prod', 'Dev', 'UAT', 'SIT', 'DR'];

    environments.forEach(env => {
      const sheetName = this.findSheet([`Overall Connections - ${env}`]);
      if (sheetName) {
        const envCommunications = this.parseConnectionSheet(sheetName, env);
        communications.push(...envCommunications);
      }
    });

    // Also parse Inbound and Outbound sheets if they exist
    const inboundSheet = this.findSheet(['Inbound Connections Sheet']);
    if (inboundSheet) {
      const inboundComms = this.parseConnectionSheet(inboundSheet, 'Unknown');
      communications.push(...inboundComms);
    }

    const outboundSheet = this.findSheet(['Outbound Connections Sheet']);
    if (outboundSheet) {
      const outboundComms = this.parseConnectionSheet(outboundSheet, 'Unknown');
      communications.push(...outboundComms);
    }

    return communications;
  }

  private parseConnectionSheet(sheetName: string, defaultEnvironment: string): ServerCommunication[] {
    const data = this.getSheetData(sheetName);

    return data
      .filter(row => row['Source IP Address'] && row['Destination IP Address'])
      .map(row => ({
        sourceServerId: this.cleanString(row['Source IP Address'] || ''),
        targetServerId: this.cleanString(row['Destination IP Address'] || ''),
        sourceHostname: this.cleanString(row['Source AppName'] || ''),
        targetHostname: this.cleanString(row['Destination AppName'] || ''),
        sourceIpAddress: this.cleanString(row['Source IP Address'] || ''),
        targetIpAddress: this.cleanString(row['Destination IP Address'] || ''),
        sourcePort: this.parseNumber(row['Source Port'] || 0),
        destinationPort: this.parseNumber(row['Destination Port'] || 0),
        protocol: this.cleanString(row['Protocol'] || 'tcp').toLowerCase(),
        sourceEnvironment: this.cleanString(row['Source Environment'] || defaultEnvironment),
        targetEnvironment: this.cleanString(row['Destination Environment'] || defaultEnvironment),
        connectionType: this.parseConnectionType(row['Connection'] || row['Cnnection']),
        category: this.cleanString(row['Category'] || ''),
        sourceService: this.cleanString(row['Source_Service'] || ''),
        sourceAppName: this.cleanString(row['Source AppName'] || row['AppName_01'] || ''),
        targetAppName: this.cleanString(row['Destination AppName'] || '')
      }));
  }

  // Helper methods

  private calculateStorageUtilization(provisioned: any, utilized: any): number {
    const prov = this.parseNumber(provisioned);
    const util = this.parseNumber(utilized);

    if (prov === 0) return 0;
    return (util / prov) * 100;
  }

  private parseSQLEdition(sqlEdition: string): {
    type: string;
    version: string;
    edition: string;
  } {
    const cleaned = sqlEdition.toLowerCase();

    // Parse SQL Server editions
    if (cleaned.includes('sql server') || cleaned.includes('mssql')) {
      const version = this.extractVersion(cleaned);
      const edition = this.extractEdition(cleaned);
      return { type: 'MSSQL', version, edition };
    }

    // Parse PostgreSQL
    if (cleaned.includes('postgres')) {
      const version = this.extractVersion(cleaned);
      return { type: 'PostgreSQL', version, edition: '' };
    }

    // Parse MySQL
    if (cleaned.includes('mysql')) {
      const version = this.extractVersion(cleaned);
      return { type: 'MySQL', version, edition: '' };
    }

    // Parse Oracle
    if (cleaned.includes('oracle')) {
      const version = this.extractVersion(cleaned);
      const edition = this.extractEdition(cleaned);
      return { type: 'Oracle', version, edition };
    }

    return { type: 'Unknown', version: '', edition: sqlEdition };
  }

  private extractVersion(text: string): string {
    // Look for version numbers like 2019, 14, 5.7, etc.
    const versionMatch = text.match(/\d+(\.\d+)?/);
    return versionMatch ? versionMatch[0] : '';
  }

  private extractEdition(text: string): string {
    if (text.includes('enterprise')) return 'Enterprise';
    if (text.includes('standard')) return 'Standard';
    if (text.includes('express')) return 'Express';
    if (text.includes('web')) return 'Web';
    if (text.includes('developer')) return 'Developer';
    return '';
  }

  private getLicenseModel(engineType: string): string {
    if (engineType === 'MSSQL' || engineType === 'Oracle') {
      return 'license-included';
    }
    return 'general-public-license';
  }

  private getApplicationConnections(appName: string): { inbound: number; outbound: number } {
    if (!this.cachedCommunications) {
      return { inbound: 0, outbound: 0 };
    }

    let inbound = 0;
    let outbound = 0;

    this.cachedCommunications.forEach(comm => {
      // Count outbound: where this app is the source
      if (comm.sourceAppName === appName) {
        outbound++;
      }
      // Count inbound: where this app is the target
      if (comm.targetAppName === appName) {
        inbound++;
      }
    });

    return { inbound, outbound };
  }

  private inferApplicationType(appName: string): string {
    const name = appName.toLowerCase();

    if (name.includes('web') || name.includes('portal')) return 'Web Application';
    if (name.includes('api') || name.includes('service')) return 'Backend Service';
    if (name.includes('db') || name.includes('database')) return 'Database';
    if (name.includes('monitor')) return 'Monitoring';
    if (name.includes('backup')) return 'Backup';

    return 'Application';
  }

  private inferEnvironmentFromConnections(appName: string): string {
    // Could be enhanced by looking at actual connections
    // For now, return 'Production' as default
    return 'Production';
  }

  private parseConnectionType(value: string): 'Upstream' | 'Downstream' | 'Bidirectional' | undefined {
    if (!value) return undefined;

    const cleaned = value.toLowerCase().trim();
    if (cleaned === 'upstream') return 'Upstream';
    if (cleaned === 'downstream') return 'Downstream';
    if (cleaned === 'bidirectional') return 'Bidirectional';

    return undefined;
  }
}
