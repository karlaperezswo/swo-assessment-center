import * as XLSX from 'xlsx';
import { CloudamizeServer, BusinessCaseData, OSDistribution } from '../../../../shared/types/businessCase.types';
// Inline OS normalizer — avoids ts-node --transpile-only module resolution issues
function normalizeOSVersion(osVersion: string): string {
  const trimmed = (osVersion || '').trim();
  if (!trimmed) return 'Unknown';
  const v = trimmed.toLowerCase();
  const linuxDistros: { pattern: RegExp; name: string }[] = [
    { pattern: /ubuntu/i,               name: 'Ubuntu' },
    { pattern: /red\s*hat|rhel/i,       name: 'Red Hat Enterprise Linux' },
    { pattern: /centos/i,               name: 'CentOS' },
    { pattern: /suse|sles/i,            name: 'SUSE Linux Enterprise Server' },
    { pattern: /debian/i,               name: 'Debian' },
    { pattern: /amazon\s*linux/i,       name: 'Amazon Linux' },
    { pattern: /oracle\s*linux/i,       name: 'Oracle Linux' },
    { pattern: /fedora/i,               name: 'Fedora' },
    { pattern: /rocky/i,                name: 'Rocky Linux' },
    { pattern: /alma/i,                 name: 'AlmaLinux' },
  ];
  const isLinux = linuxDistros.some(d => d.pattern.test(v)) || v.includes('linux') || v.includes('unix');
  if (isLinux) {
    for (const d of linuxDistros) {
      if (d.pattern.test(trimmed)) return d.name;
    }
    return trimmed.replace(/\s+[\d\(].*$/, '').trim() || trimmed;
  }
  return trimmed.replace(/\s+\d+\.\d+[\.\d\-\w]*$/, '').trim();
}

function buildOSVersion(os: string, version: string): string {
  if (!version) return os || 'Unknown';
  if (!os) return version;
  if (version.toLowerCase().startsWith(os.toLowerCase())) return version;
  return `${os} ${version}`.trim();
}

/**
 * Parser for Matilda Discovery Assessment Excel format
 * Specifically for "Matilda Discovery Assessment Summary" files
 * Created: 2026-03-04 - Matilda Parser Integration
 *
 * Key differences from Cloudamize:
 * - Headers in row 1 (index 0) instead of row 2
 * - Sheet names: "Host Details", "Instance Assessment Summary"
 * - OS Version: Combination of "Operating System" (column E) + "Version" (column F)
 * - Environment: Column J (PROD/DEV/QA)
 * - SQL Server: detected from "Databases/Caches" column
 */
export class MatildaParser {
  private workbook: XLSX.WorkBook;

  constructor(workbook: XLSX.WorkBook) {
    this.workbook = workbook;
  }

  canParse(): boolean {
    const sheetNames = this.workbook.SheetNames.map(s => s.toLowerCase());

    // Only require "Host Details" — the TCO sheets are optional (present in TCO1Year files)
    return sheetNames.some(sheet =>
      sheet === 'host details' || sheet === 'hostdetails'
    );
  }

  getDataSourceType(): 'CLOUDAMIZE' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN' {
    return 'MATILDA';
  }

  parse(): BusinessCaseData {
    console.log('[MatildaParser] Starting parse...');
    console.log('[MatildaParser] Available sheets:', this.workbook.SheetNames);

    const servers = this.parseServers();
    const osDistribution = this.calculateOSDistribution(servers);
    const summary = this.calculateSummary(servers);

    console.log(`[MatildaParser] ✓ Parsed ${servers.length} servers`);
    console.log(`[MatildaParser] ✓ Found ${osDistribution.length} unique OS versions`);

    return {
      dataSource: this.getDataSourceType(),
      servers,
      osDistribution,
      summary
    };
  }

  private findSheet(possibleNames: string[]): string | null {
    const sheetNames = this.workbook.SheetNames;
    for (const possibleName of possibleNames) {
      const found = sheetNames.find(sheet =>
        sheet.toLowerCase().includes(possibleName.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  }

  private findHeaderRow(sheetName: string): number {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) return 0;

    // Scan first 5 rows looking for a row that contains "Host Name" or "Operating System"
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i].map((c: any) => String(c || '').toLowerCase().trim());
      if (row.some(c => c === 'host name' || c === 'hostname' || c === 'operating system' || c === 'os')) {
        console.log(`[MatildaParser] ✓ Found headers in row ${i + 1} (0-indexed: ${i}) in ${sheetName}`);
        return i;
      }
    }

    console.log(`[MatildaParser] Using row 1 (0-indexed: 0) for headers in ${sheetName}`);
    return 0;
  }

  private getSheetData(sheetName: string): any[] {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) return [];
    const headerRow = this.findHeaderRow(sheetName);
    const data = XLSX.utils.sheet_to_json(sheet, { range: headerRow });
    console.log(`[MatildaParser] Reading data from row ${headerRow + 1}, found ${data.length} rows`);
    return data;
  }

  private cleanString(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  private generateId(prefix: string, index: number, fallback?: any): string {
    if (fallback) return `${prefix}-${fallback}`;
    return `${prefix}-${index + 1}`;
  }

  private parseServers(): CloudamizeServer[] {
    console.log('[MatildaParser] Searching for Host Details sheet...');

    const sheetName = this.findSheet(['Host Details', 'HostDetails', 'Host_Details']);

    if (!sheetName) {
      console.log('[MatildaParser] ⚠ Host Details sheet not found');
      console.log('[MatildaParser] Available sheets:', this.workbook.SheetNames);
      return [];
    }

    const data = this.getSheetData(sheetName);
    console.log(`[MatildaParser] ✓ Found sheet: ${sheetName}, rows: ${data.length}`);

    if (data.length === 0) {
      console.error('[MatildaParser] ⚠ Host Details sheet has no data');
      return [];
    }

    if (data.length > 0) {
      console.log('[MatildaParser] Available columns:', Object.keys(data[0]));
    }

    return this.parseServerData(data);
  }

  /**
   * Parse server data from rows.
   * Matilda column mappings:
   * - Host Name: Column A
   * - Platform: Column D
   * - Operating System: Column E
   * - Version: Column F
   * - Environment: Column J
   * - Memory: Column X
   * - Logical Processors: Column Y
   * - Databases/Caches: Column with SQL Server info (e.g. "SQL Server 2019 Standard")
   */
  private parseServerData(data: any[]): CloudamizeServer[] {
    const servers: CloudamizeServer[] = [];

    // Log first row columns for debugging
    if (data.length > 0) {
      console.log('[MatildaParser] First row keys:', Object.keys(data[0]));
    }

    data.forEach((row, index) => {
      try {
        const hostname = this.cleanString(
          row['Host Name'] || row['HostName'] || row['Hostname'] || row['Server Name'] || ''
        );

        if (!hostname || hostname === '-') return;

        const os = this.cleanString(row['Operating System'] || row['OS'] || '');
        const version = this.cleanString(row['Version'] || '');
        const rawOsVersion = buildOSVersion(os, version) || 'Unknown';
        const osVersion = normalizeOSVersion(rawOsVersion);

        const environment = this.cleanString(row['Environment'] || row['Env'] || '');

        const memory = this.parseNumber(
          row['Memory'] || row['Memory (GB)'] || row['RAM'] || 0
        );

        const vcpus = this.parseNumber(
          row['Logical Processors'] || row['vCPUs'] || row['CPUs'] || 0
        );

        // Detect SQL Server from column K (index 10) in Matilda Host Details
        // Column K may be named "Databases/Caches", "MS SQL Edition", or appear as __EMPTY_10
        const dbCaches = this.cleanString(
          row['Databases/Caches'] ||
          row['Databases / Caches'] ||
          row['Database/Caches'] ||
          row['MS SQL Edition'] ||
          row['Databases'] ||
          row['__EMPTY_10'] ||
          ''
        );

        // Extract SQL Server edition from the databases string
        // e.g. "SQL Server 2019 Standard", "Microsoft SQL Server 2016 Enterprise"
        let sqlEditionNormalized = '';
        let hasSQLServer = false;

        if (dbCaches) {
          const dbLower = dbCaches.toLowerCase();
          const hasSql = dbLower.includes('sql server') || dbLower.includes('mssql');
          const isExcluded = dbLower.includes('express') || dbLower.includes('developer');

          if (hasSql && !isExcluded) {
            hasSQLServer = true;
            if (dbLower.includes('enterprise')) sqlEditionNormalized = 'Enterprise';
            else if (dbLower.includes('web')) sqlEditionNormalized = 'Web';
            else sqlEditionNormalized = 'Standard';
          }
        }

        servers.push({
          serverId: this.generateId('matilda', index, hostname),
          hostname,
          osVersion,
          environment,
          instanceType: '',
          vcpus,
          memory,
          storage: 0,
          monthlyOnDemand: 0,
          monthly1Year: 0,
          monthly3Year: 0,
          hasSQLServer,
          sqlEdition: sqlEditionNormalized
        });
      } catch (err) {
        console.warn(`[MatildaParser] Skipping row ${index} due to error:`, err);
      }
    });

    console.log(`[MatildaParser] ✓ Parsed ${servers.length} servers from ${data.length} rows`);
    return servers;
  }

  /**
   * Calculate OS distribution by environment.
   * Each server goes into exactly ONE row:
   * - If it has SQL Server → "{OS} with SQL {Edition}"
   * - If it doesn't → "{OS}"
   * SQL rows are placed immediately after their base OS row.
   */
  private calculateOSDistribution(servers: CloudamizeServer[]): OSDistribution[] {
    const rowMap: { [key: string]: OSDistribution } = {};

    servers.forEach(server => {
      const os = server.osVersion || 'Unknown';
      const env = (server.environment || '').toLowerCase();
      const sql = server.hasSQLServer === true;
      const edition = server.sqlEdition || '';

      const rowLabel = (sql && edition) ? `${os} with SQL ${edition}` : os;

      if (!rowMap[rowLabel]) {
        rowMap[rowLabel] = { osVersion: rowLabel, prod: 0, dev: 0, qa: 0, total: 0 };
      }

      if (env.includes('prod') || env.includes('production')) rowMap[rowLabel].prod++;
      else if (env.includes('dev') || env.includes('development')) rowMap[rowLabel].dev++;
      else if (env.includes('qa') || env.includes('quality')) rowMap[rowLabel].qa++;
      else rowMap[rowLabel].prod++;

      rowMap[rowLabel].total++;
    });

    // Sort: base OS rows by total desc, SQL variants follow their base OS
    const baseRows = Object.values(rowMap)
      .filter(r => !r.osVersion.includes(' with SQL '))
      .sort((a, b) => b.total - a.total);

    const result: OSDistribution[] = [];
    for (const base of baseRows) {
      result.push(base);
      const sqlVariants = Object.values(rowMap)
        .filter(r => r.osVersion.startsWith(`${base.osVersion} with SQL `))
        .sort((a, b) => b.total - a.total);
      result.push(...sqlVariants);
    }

    console.log(`[MatildaParser] ✓ OS Distribution: ${result.length} rows`);
    return result;
  }

  private calculateSummary(servers: CloudamizeServer[]): {
    totalServers: number;
    prodServers: number;
    devServers: number;
    qaServers: number;
  } {
    let prodServers = 0;
    let devServers = 0;
    let qaServers = 0;

    servers.forEach(server => {
      const env = (server.environment || '').toLowerCase();

      if (env.includes('prod') || env.includes('production')) prodServers++;
      else if (env.includes('dev') || env.includes('development')) devServers++;
      else if (env.includes('qa') || env.includes('quality')) qaServers++;
      else prodServers++;
    });

    console.log(`[MatildaParser] ✓ Summary: ${servers.length} total, ${prodServers} prod, ${devServers} dev, ${qaServers} qa`);

    return {
      totalServers: servers.length,
      prodServers,
      devServers,
      qaServers
    };
  }
}
