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
 * Parser for AWS Migration Portfolio Assessment (MPA) Excel format
 */
export class AWSMPAParser extends BaseParser {
  private cachedCommunications: ServerCommunication[] | null = null;

  getDataSourceType(): DataSourceType {
    return 'AWS_MPA';
  }

  canParse(): boolean {
    // AWS MPA format typically has these sheet names
    const requiredSheets = ['Servers', 'Databases'];
    const sheetNames = this.workbook.SheetNames.map(s => s.toLowerCase());

    return requiredSheets.every(required =>
      sheetNames.some(sheet => sheet.includes(required.toLowerCase()))
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
    const sheetName = this.findSheet(['Servers', 'Server', 'servers']);
    if (!sheetName) return [];

    const data = this.getSheetData(sheetName);

    return data.map((row, index) => ({
      serverId: this.generateId('srv', index,
        row['Server Id'] || row['ServerId'] || row['server_id']
      ),
      hostname: this.cleanString(
        row['HOSTNAME'] || row['Hostname'] || row['hostname'] || row['Server Name'] || ''
      ),
      ipAddress: this.cleanString(
        row['IP Address'] || row['IPAddress'] || row['ip_address'] || ''
      ),
      isPhysical: this.parseBoolean(
        row['Is Physical'] || row['isPhysical'] || row['Physical']
      ),
      osName: this.cleanString(
        row['osName'] || row['OS Name'] || row['Operating System'] || ''
      ),
      osVersion: this.cleanString(
        row['osVersion'] || row['OS Version'] || ''
      ),
      numCpus: this.parseNumber(
        row['numCpus'] || row['Num CPUs'] || row['CPU Sockets'] || 1
      ),
      numCoresPerCpu: this.parseNumber(
        row['numCoresPerCpu'] || row['Cores Per CPU'] || row['Cores per Socket'] || 1
      ),
      numThreadsPerCore: this.parseNumber(
        row['numThreadsPerCore'] || row['Threads Per Core'] || 1
      ),
      totalRAM: this.parseNumber(
        row['totalRAM'] || row['Total RAM (GB)'] || row['RAM (GB)'] || row['Memory (GB)'] || 0
      ),
      maxCpuUsage: this.parseNumber(
        row['maxCpuUsagePct'] || row['Max CPU Usage'] || row['Peak CPU %'] || 0
      ),
      avgCpuUsage: this.parseNumber(
        row['avgCpuUsagePct'] || row['Avg CPU Usage'] || row['Average CPU %'] || 0
      ),
      maxRamUsage: this.parseNumber(
        row['maxRamUsagePct'] || row['Max RAM Usage'] || row['Peak Memory %'] || 0
      ),
      avgRamUsage: this.parseNumber(
        row['avgRamUsagePct'] || row['Avg RAM Usage'] || row['Average Memory %'] || 0
      ),
      totalDiskSize: this.parseNumber(
        row['Storage-Total Disk Size (GB)'] ||
        row['totalDiskSize'] ||
        row['Total Disk Size (GB)'] ||
        row['Storage (GB)'] ||
        0
      ),
      storageUtilization: this.parseNumber(
        row['Storage Utilization'] || row['storageUtilization'] || 0
      ),
      uptime: this.parseNumber(
        row['Uptime'] || row['uptime'] || 0
      ),
      environment: this.cleanString(
        row['Environment'] || row['Environment Type'] || ''
      )
    }));
  }

  protected parseDatabases(): Database[] {
    const sheetName = this.findSheet(['Databases', 'Database', 'databases', 'DB']);
    if (!sheetName) return [];

    const data = this.getSheetData(sheetName);

    return data.map((row, index) => ({
      databaseId: this.generateId('db', index,
        row['Database Id'] || row['DatabaseId'] || row['database_id']
      ),
      dbName: this.cleanString(
        row['DB Name'] || row['Database Name'] || row['Name'] || ''
      ),
      instanceName: this.cleanString(
        row['Instance Name'] || row['instanceName'] || ''
      ),
      engineType: this.cleanString(
        row['Source Engine Type'] || row['Engine Type'] || row['Engine'] || ''
      ),
      engineVersion: this.cleanString(
        row['Engine Version'] || row['Version'] || ''
      ),
      engineEdition: this.cleanString(
        row['Engine Edition'] || row['Edition'] || ''
      ),
      totalSize: this.parseNumber(
        row['Total Size (GB)'] || row['Total Size'] || row['Size (GB)'] || 0
      ),
      serverId: this.cleanString(
        row['Server Id'] || row['ServerId'] || ''
      ),
      targetEngine: this.cleanString(
        row['Target Engine'] || row['Target'] || ''
      ),
      licenseModel: this.cleanString(
        row['License Model'] || row['License'] || 'license-included'
      ),
      maxTPS: this.parseNumber(
        row['Max TPS'] || row['TPS'] || 0
      )
    }));
  }

  protected parseApplications(): Application[] {
    const sheetName = this.findSheet(['Applications', 'Application', 'applications', 'Apps']);
    if (!sheetName) return [];

    const data = this.getSheetData(sheetName);

    return data.map((row, index) => {
      const appName = this.cleanString(
        row['Application Name'] || row['Name'] || row['App Name'] || ''
      );

      // Get connection counts from Excel
      const excelTotal = this.parseNumber(
        row['Total Connections'] || row['Connections'] || 0
      );
      const excelInbound = this.parseNumber(
        row['Inbound Connections'] || row['Inbound'] || 0
      );
      const excelOutbound = this.parseNumber(
        row['Outbound Connections'] || row['Outbound'] || 0
      );

      // Calculate from communications as fallback
      const calculated = this.getApplicationConnections(appName);

      return {
        appId: this.generateId('app', index,
          row['Application Id'] || row['AppId'] || row['app_id']
        ),
        name: appName,
        description: this.cleanString(
          row['Description'] || ''
        ),
        type: this.cleanString(
          row['Type'] || row['Application Type'] || ''
        ),
        totalConnections: excelTotal || calculated.total,
        inboundConnections: excelInbound || calculated.inbound,
        outboundConnections: excelOutbound || calculated.outbound,
        environmentType: this.cleanString(
          row['Environment Type'] || row['Environment'] || ''
        )
      };
    });
  }

  protected parseServerApplicationMappings(): ServerApplicationMapping[] {
    const sheetName = this.findSheet([
      'Server to Application',
      'ServerToApplication',
      'server_to_application',
      'Server-Application'
    ]);
    if (!sheetName) return [];

    const data = this.getSheetData(sheetName);

    return data.map(row => ({
      serverId: this.cleanString(
        row['Server Id'] || row['ServerId'] || ''
      ),
      appId: this.cleanString(
        row['Application Id'] || row['AppId'] || ''
      ),
      hostname: this.cleanString(
        row['Hostname'] || row['Server Name'] || ''
      ),
      applicationName: this.cleanString(
        row['Application Name'] || row['App Name'] || ''
      )
    }));
  }

  protected parseServerCommunications(): ServerCommunication[] {
    const sheetName = this.findSheet([
      'Server Communication',
      'ServerCommunication',
      'server_communication',
      'Communications'
    ]);
    if (!sheetName) return [];

    const data = this.getSheetData(sheetName);

    return data.map(row => ({
      sourceServerId: this.cleanString(
        row['Source Server Id'] || row['SourceServerId'] || ''
      ),
      targetServerId: this.cleanString(
        row['Target Server Id'] || row['TargetServerId'] || ''
      ),
      sourceHostname: this.cleanString(
        row['Source Hostname'] || row['Source'] || ''
      ),
      targetHostname: this.cleanString(
        row['Target Hostname'] || row['Target'] || ''
      ),
      sourceIpAddress: this.cleanString(
        row['Source IP Address'] || row['Source IP'] || ''
      ),
      targetIpAddress: this.cleanString(
        row['Target IP Address'] || row['Target IP'] || ''
      ),
      sourcePort: this.parseNumber(
        row['Source Port'] || 0
      ),
      destinationPort: this.parseNumber(
        row['Port'] || row['Destination Port'] || row['Target Port'] || 0
      ),
      protocol: this.cleanString(
        row['Protocol'] || 'tcp'
      ).toLowerCase()
    }));
  }

  private getApplicationConnections(appName: string): { inbound: number; outbound: number; total: number } {
    if (!this.cachedCommunications || !appName) {
      return { inbound: 0, outbound: 0, total: 0 };
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

    return { inbound, outbound, total: inbound + outbound };
  }
}
