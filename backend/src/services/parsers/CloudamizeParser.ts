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

/**
 * Parser for Cloudamize Excel format
 * Specifically for "Dashboard-All-Infrastructures-*" files
 * Created: 2026-02-26 - Business Case Module
 */
export class CloudamizeParser {
  private workbook: XLSX.WorkBook;

  constructor(workbook: XLSX.WorkBook) {
    this.workbook = workbook;
  }

  canParse(): boolean {
    // Cloudamize format typically has "Dashboard" or "Infrastructures" in sheet names
    const sheetNames = this.workbook.SheetNames.map(s => s.toLowerCase());
    
    return sheetNames.some(sheet => 
      sheet.includes('dashboard') || 
      sheet.includes('infrastructure') ||
      sheet.includes('all')
    );
  }

  getDataSourceType(): 'CLOUDAMIZE' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN' {
    return 'CLOUDAMIZE';
  }

  parse(): BusinessCaseData {
    console.log('[CloudamizeParser] Starting parse...');
    console.log('[CloudamizeParser] Available sheets:', this.workbook.SheetNames);
    
    // Try each sheet to find OS data
    for (const sheetName of this.workbook.SheetNames) {
      const data = this.getSheetData(sheetName);
      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`[CloudamizeParser] Sheet "${sheetName}" columns:`, columns);
        
        // Check if this sheet has OS-related columns
        const hasOSColumn = columns.some(col => 
          col.toLowerCase().includes('os') || 
          col.toLowerCase().includes('operating') ||
          col.toLowerCase().includes('platform')
        );
        
        if (hasOSColumn) {
          console.log(`[CloudamizeParser] ✓ Found OS column in sheet: ${sheetName}`);
        }
      }
    }
    
    const servers = this.parseServers();
    const osDistribution = this.calculateOSDistribution(servers);
    const summary = this.calculateSummary(servers);

    return {
      dataSource: this.getDataSourceType(),
      servers,
      osDistribution,
      summary
    };
  }

  /**
   * Find sheet by name (case-insensitive, partial match)
   */
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

  /**
   * Find the row number where headers are located
   * Searches specifically for "OS Version" column
   */
  private findHeaderRow(sheetName: string): number {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) return 1;

    // Read raw data to find headers
    const rawData = XLSX.utils.sheet_to_json(sheet, { 
      header: 1,
      defval: ''
    });

    // Try up to first 5 rows to find the row with "OS Version"
    for (let row = 0; row < Math.min(5, rawData.length); row++) {
      const rowData = rawData[row] as any[];
      if (!rowData || rowData.length === 0) continue;

      // Convert to lowercase for comparison
      const columnsLower = rowData.map(col => 
        String(col || '').toLowerCase().trim()
      );

      // Look specifically for "OS Version" column
      const hasOSVersion = columnsLower.some(col => 
        col === 'os version' || col === 'osversion' || col === 'os_version'
      );

      if (hasOSVersion) {
        console.log(`[CloudamizeParser] ✓ Found "OS Version" header in row ${row + 1} (0-indexed: ${row})`);
        console.log(`[CloudamizeParser] Sample headers:`, rowData.filter(h => h).slice(0, 10));
        return row;
      }
    }

    console.log('[CloudamizeParser] ⚠ No "OS Version" header found, using row 2 (0-indexed: 1) as default');
    return 1;  // Default to row 2 (0-indexed: 1) for Cloudamize files
  }

  /**
   * Get sheet data as JSON
   * Automatically detects which row contains the headers
   */
  private getSheetData(sheetName: string): any[] {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) return [];
    
    // Find the row where headers are located
    const headerRow = this.findHeaderRow(sheetName);
    
    // Convert sheet to JSON, starting from the detected header row
    const data = XLSX.utils.sheet_to_json(sheet, { 
      range: headerRow
    });
    
    console.log(`[CloudamizeParser] Reading data from row ${headerRow + 1}, found ${data.length} rows`);
    
    return data;
  }

  /**
   * Clean string value
   */
  private cleanString(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  /**
   * Parse number value
   */
  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string, index: number, fallback?: any): string {
    if (fallback) return `${prefix}-${fallback}`;
    return `${prefix}-${index + 1}`;
  }

  /**
   * Parse servers from Cloudamize Excel
   */
  private parseServers(): CloudamizeServer[] {
    // First, try to find a sheet with OS-related columns
    console.log('[CloudamizeParser] Searching for sheet with OS data...');
    
    for (const sheetName of this.workbook.SheetNames) {
      const headerRow = this.findHeaderRow(sheetName);
      const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[sheetName], { 
        range: headerRow 
      });
      
      if (data.length === 0) continue;
      
      const firstRow = data[0];
      if (!firstRow || typeof firstRow !== 'object') continue;
      
      const columns = Object.keys(firstRow);
      
      // Look specifically for "OS Version" column (exact match)
      const hasOSVersionColumn = columns.some(col => {
        const colLower = col.toLowerCase().trim();
        return colLower === 'os version' || 
               colLower === 'osversion' ||
               colLower === 'os_version';
      });
      
      if (hasOSVersionColumn) {
        console.log(`[CloudamizeParser] ✓ Found sheet with "OS Version" column: ${sheetName}`);
        console.log(`[CloudamizeParser] Columns in ${sheetName}:`, columns);
        console.log(`[CloudamizeParser] Parsing ${data.length} rows from ${sheetName}`);
        return this.parseServerData(data);
      }
    }
    
    console.log('[CloudamizeParser] ⚠ No sheet with "OS Version" column found, trying default sheets...');
    
    // Fallback: Try to find the main data sheet
    const sheetName = this.findSheet([
      'Summary',
      'Compute',
      'Dashboard',
      'All Infrastructures',
      'Infrastructures',
      'Servers',
      'All'
    ]);

    if (!sheetName) {
      console.log('[CloudamizeParser] Available sheets:', this.workbook.SheetNames);
      console.log('[CloudamizeParser] Warning: No matching sheet found, using first sheet');
      
      if (this.workbook.SheetNames.length === 0) {
        console.error('[CloudamizeParser] Error: No sheets found in workbook');
        return [];
      }
      
      const firstSheet = this.workbook.SheetNames[0];
      console.log(`[CloudamizeParser] Using first sheet: ${firstSheet}`);
      const data = this.getSheetData(firstSheet);
      
      if (data.length === 0) {
        console.error('[CloudamizeParser] Error: First sheet has no data');
        return [];
      }
      
      return this.parseServerData(data);
    }

    const data = this.getSheetData(sheetName);
    console.log(`[CloudamizeParser] Found sheet: ${sheetName}, rows: ${data.length}`);
    
    if (data.length === 0) {
      console.error('[CloudamizeParser] Error: Sheet has no data');
      return [];
    }
    
    // Log first row to see available columns
    if (data.length > 0) {
      console.log('[CloudamizeParser] Available columns:', Object.keys(data[0]));
    }
    
    return this.parseServerData(data);
  }

  /**
   * Parse server data from rows
   */
  private parseServerData(data: any[]): CloudamizeServer[] {
    console.log(`[CloudamizeParser] Parsing ${data.length} server rows...`);
    
    if (data.length === 0) {
      console.log('[CloudamizeParser] ⚠ No data to parse');
      return [];
    }
    
    // Log first row columns for debugging
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    console.log(`[CloudamizeParser] Available columns (${columns.length}):`, columns.slice(0, 15));
    
    const servers = data.map((row, index) => {
      // Get OS Version - normalize to strip build numbers
      const rawOsVersion = this.cleanString(
        row['OS Version'] || 
        row['OSVersion'] || 
        row['Operating System'] || 
        row['OS'] ||
        ''
      );
      const osVersion = normalizeOSVersion(rawOsVersion);
      
      // Get hostname
      const hostname = this.cleanString(
        row['Server Name'] ||
        row['Hostname'] || 
        row['Server'] || 
        row['Name'] ||
        row['Asset'] ||
        ''
      );
      
      if (!hostname || hostname === '-') return null;
      
      const environment = this.cleanString(
        row['Environment'] || row['Env'] || row['Tier'] || 'PROD'
      );

      // Column K in Cloudamize: "MS SQL Edition" — detect SQL Server presence
      const sqlEdition = this.cleanString(
        row['MS SQL Edition'] ||
        row['MSSQLEdition'] ||
        row['SQL Edition'] ||
        row['__EMPTY_10'] ||
        ''
      );

      const hasSQLServer = sqlEdition.length > 0 &&
        sqlEdition.trim() !== '-' &&
        sqlEdition.toLowerCase() !== 'not applicable' &&
        sqlEdition.toLowerCase() !== 'n/a' &&
        sqlEdition.toLowerCase() !== 'none' &&
        !sqlEdition.toLowerCase().includes('express') &&
        !sqlEdition.toLowerCase().includes('developer');

      // Normalize SQL edition to Standard/Enterprise/Web
      let sqlEditionNormalized = '';
      if (hasSQLServer) {
        const el = sqlEdition.toLowerCase();
        if (el.includes('enterprise')) sqlEditionNormalized = 'Enterprise';
        else if (el.includes('web')) sqlEditionNormalized = 'Web';
        else sqlEditionNormalized = 'Standard';
      }
      
      return {
        serverId: this.generateId('cloudamize', index, 
          row['ID (server name + uid)'] || row['Server Id'] || row['ServerId'] || hostname
        ),
        hostname,
        osVersion,
        environment,
        instanceType: this.cleanString(
          row['Recommended Instance'] || row['Instance Type'] || ''
        ),
        vcpus: this.parseNumber(
          row['Recommended vCPU'] || row['Available vCPU'] || row['vCPU'] || 0
        ),
        memory: this.parseNumber(
          row['Recommended Memory (GB)'] || row['Observed Memory Provisioned (GB)'] || row['Memory'] || 0
        ),
        storage: this.parseNumber(row['Storage'] || row['Storage Cost ($)'] || 0),
        monthlyOnDemand: this.parseNumber(
          row['Total Cost ($)'] || row['Annual Total Cost ($)'] || 0
        ) / 12,
        monthly1Year: 0,
        monthly3Year: 0,
        hasSQLServer,
        sqlEdition: sqlEditionNormalized
      };
    }).filter(server => server !== null) as CloudamizeServer[];
    
    console.log(`[CloudamizeParser] ✓ Successfully parsed ${servers.length} servers`);
    
    if (servers.length > 0) {
      console.log(`[CloudamizeParser] Sample server:`, {
        hostname: servers[0].hostname,
        osVersion: servers[0].osVersion,
        environment: servers[0].environment
      });
    }
    
    return servers;
  }

  /**
   * Calculate OS distribution by environment.
   * Each server goes into exactly ONE row:
   * - If it has SQL Server → "{OS} with SQL {Edition}"
   * - If it doesn't → "{OS}"
   * So totals add up correctly without double-counting.
   * SQL rows are placed immediately after their base OS row.
   */
  private calculateOSDistribution(servers: CloudamizeServer[]): OSDistribution[] {
    // key → OSDistribution row
    const rowMap: { [key: string]: OSDistribution } = {};

    servers.forEach(server => {
      const os = server.osVersion || 'Unknown';
      const env = (server.environment || '').toLowerCase();
      const sql = server.hasSQLServer === true;
      const edition = (server as any).sqlEdition as string || '';

      // Each server goes to exactly one row
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
      // Find SQL variants for this base OS, sorted by total desc
      const sqlVariants = Object.values(rowMap)
        .filter(r => r.osVersion.startsWith(`${base.osVersion} with SQL `))
        .sort((a, b) => b.total - a.total);
      result.push(...sqlVariants);
    }

    return result;
  }


  /**
   * Calculate summary statistics
   */
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

      if (env.includes('prod') || env.includes('production')) {
        prodServers++;
      } else if (env.includes('dev') || env.includes('development')) {
        devServers++;
      } else if (env.includes('qa') || env.includes('quality')) {
        qaServers++;
      } else {
        // If no environment specified, count as prod by default
        prodServers++;
      }
    });

    return {
      totalServers: servers.length,
      prodServers,
      devServers,
      qaServers
    };
  }
}
