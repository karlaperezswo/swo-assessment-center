import * as XLSX from 'xlsx';
import { TCO1YearData, ResourceOptimization, OSMigrationStrategy, MigrationStrategySummary, SQLLicensingData, SQLLicensingSummary, InstanceTypeData, NetworkTransferData, SupportRiskSummary, OSSupportRiskData } from '../../../../shared/types/businessCase.types';
import { classifyOS, getMigrationSummary } from '../osSupportService';
import { getSupportInfo, getSupportStatus } from '../osSupportDatesService';
import { getPriceForEdition } from '../sqlPricingService';
// Inline OS normalizer to avoid ts-node module resolution issues
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
 * Parser for Matilda TCO 1 Year Excel format
 * Reads from multiple sheets: Host Details, Instance TCO Right Sizing, Instance Assessment Summary
 * Created: 2026-03-04 - Matilda Parser Integration
 * 
 * Key differences from Cloudamize:
 * - Headers in row 1 (index 0) instead of row 2
 * - vCPU: Column O (Observed), Column ` (Recommended) from Instance TCO Right Sizing
 * - RAM: Column R (Observed), Column a (Recommended)
 * - Storage: Column V (Observed), Column g (Recommended)
 * - Network: Not available in Matilda
 * - Migration Strategy: Column Q (explicit) from Instance Assessment Summary
 * - SQL Server: From "Databases/Caches" column in Host Details
 * - Support Risk: Columns K (EOL Status), L (Support End Date) from Host Details
 */
export class MatildaTCO1YearParser {
  private workbook: XLSX.WorkBook;
  private storageIncrementPercent: number;

  constructor(workbook: XLSX.WorkBook, storageIncrementPercent: number = 0) {
    this.workbook = workbook;
    this.storageIncrementPercent = storageIncrementPercent;
  }

  canParse(): boolean {
    const sheetNames = this.workbook.SheetNames.map(s => s.toLowerCase());
    
    // Look for exact "Host Details" (not "Dedicated Host Details")
    const hasHostDetails = sheetNames.some(s => s === 'host details' || s === 'hostdetails');
    const hasInstanceTCO = sheetNames.some(s => s.includes('instance tco') || s.includes('instance assessment'));
    
    // BOTH must be present for Matilda format
    return hasHostDetails && hasInstanceTCO;
  }

  getDataSourceType(): 'CLOUDAMIZE' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN' {
    return 'MATILDA';
  }

  async parse(): Promise<TCO1YearData> {
    console.log('[MatildaTCO1YearParser] Starting parse...');
    console.log('[MatildaTCO1YearParser] Available sheets:', this.workbook.SheetNames);

    const resourceOptimization = this.parseResourceOptimization();
    const { migrationStrategies, migrationSummary } = this.parseMigrationStrategies();
    const { sqlLicensing, sqlLicensingSummary } = await this.parseSQLLicensing().catch(e => {
      console.error('[MatildaTCO1YearParser] parseSQLLicensing error:', e);
      return { sqlLicensing: [], sqlLicensingSummary: this.getEmptySQLSummary() };
    });
    const instanceTypes = this.parseInstanceTypes();
    const networkTransfer = this.parseNetworkTransfer();
    const supportRisk = await this.parseSupportRisk().catch(e => {
      console.error('[MatildaTCO1YearParser] parseSupportRisk error:', e);
      return { windowsServers: [], sqlServers: [], linuxServers: [] };
    });

    return {
      dataSource: this.getDataSourceType(),
      resourceOptimization,
      migrationStrategies,
      migrationSummary,
      sqlLicensing,
      sqlLicensingSummary,
      instanceTypes,
      networkTransfer,
      supportRisk
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
   * For Matilda, headers are in row 1 (index 0)
   */
  private findHeaderRow(sheetName: string): number {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) return 0;

    // Scan first 5 rows looking for known header keywords
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    const keywords = ['host name', 'hostname', 'operating system', 'vcpu count', 'memory', 'instance type', 'migration strategy'];
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i].map((c: any) => String(c || '').toLowerCase().trim());
      if (row.some(c => keywords.includes(c))) {
        console.log(`[MatildaTCO1YearParser] ✓ Found headers in row ${i + 1} (0-indexed: ${i}) in ${sheetName}`);
        return i;
      }
    }

    console.log(`[MatildaTCO1YearParser] Using row 1 (0-indexed: 0) for headers in ${sheetName}`);
    return 0;
  }

  /**
   * Get sheet data as JSON
   */
  private getSheetData(sheetName: string): any[] {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) return [];
    
    const headerRow = this.findHeaderRow(sheetName);
    const data = XLSX.utils.sheet_to_json(sheet, { 
      range: headerRow
    });
    
    console.log(`[MatildaTCO1YearParser] Reading ${sheetName} from row ${headerRow + 1}, found ${data.length} rows`);
    
    return data;
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
   * Sum column values from sheet data
   */
  private sumColumn(data: any[], columnNames: string[]): number {
    let total = 0;
    
    data.forEach(row => {
      for (const colName of columnNames) {
        const value = row[colName];
        if (value !== undefined && value !== null && value !== '') {
          total += this.parseNumber(value);
          break;
        }
      }
    });
    
    return total;
  }

  /**
   * Parse resource optimization data from all sheets
   */
  private parseResourceOptimization(): ResourceOptimization[] {
    const resources: ResourceOptimization[] = [];

    const vcpuData = this.parseVCPU();
    if (vcpuData) resources.push(vcpuData);

    const ramData = this.parseRAM();
    if (ramData) resources.push(ramData);

    const storageData = this.parseStorage();
    if (storageData) resources.push(storageData);

    // Network is not available in Matilda
    // No need to call parseNetwork()

    return resources;
  }

  /**
   * Parse vCPU data from Instance TCO Right Sizing sheet
   * Observed: Column O "VCPU Count"
   * Recommended: Column ` "Recomm. vCPU" (column 26, index 25)
   */
  private parseVCPU(): ResourceOptimization | null {
    const sheetName = this.findSheet(['Instance TCO Right Sizing', 'Instance TCO', 'TCO Right Sizing']);
    if (!sheetName) {
      console.log('[MatildaTCO1YearParser] ⚠ Instance TCO Right Sizing sheet not found');
      return null;
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[MatildaTCO1YearParser] ⚠ Instance TCO Right Sizing sheet has no data');
      return null;
    }

    if (data.length > 0) {
      console.log('[MatildaTCO1YearParser] Instance TCO Right Sizing columns:', Object.keys(data[0]));
    }

    const observed = this.sumColumn(data, [
      'VCPU Count',
      'vCPU Count',
      'VCPUCount',
      '__EMPTY_14'
    ]);

    const recommendedProd = this.sumColumn(data, [
      'Recomm. vCPU',
      'Recommended vCPU',
      'RecommendedvCPU',
      '__EMPTY_25'
    ]);

    const recommendedDev = 0;
    const recommendedQA = 0;
    const recommendedTotal = recommendedProd + recommendedDev + recommendedQA;

    const optimizationPercent = observed > 0 
      ? (((observed - recommendedTotal) / observed) * 100).toFixed(2).replace('.', ',')
      : '0,00';

    console.log(`[MatildaTCO1YearParser] vCPU - Observed: ${observed}, Recommended: ${recommendedTotal}, Optimization: ${optimizationPercent}%`);

    return {
      resource: 'vCPU',
      observed,
      recommendedProd,
      recommendedDev,
      recommendedQA,
      recommendedTotal,
      optimizationPercent: `${optimizationPercent}%`
    };
  }

  /**
   * Parse RAM data from Instance TCO Right Sizing sheet
   * Observed: Column R "Memory(GB)"
   * Recommended: Column a "Recomm. Memory" (column 27, index 26)
   */
  private parseRAM(): ResourceOptimization | null {
    const sheetName = this.findSheet(['Instance TCO Right Sizing', 'Instance TCO', 'TCO Right Sizing']);
    if (!sheetName) return null;

    const data = this.getSheetData(sheetName);
    if (data.length === 0) return null;

    const observed = this.sumColumn(data, [
      'Memory(GB)',
      'Memory (GB)',
      'Memory',
      '__EMPTY_17'
    ]);

    const recommendedProd = this.sumColumn(data, [
      'Recomm. Memory',
      'Recommended Memory',
      'RecommendedMemory',
      '__EMPTY_26'
    ]);

    const recommendedDev = 0;
    const recommendedQA = 0;
    const recommendedTotal = recommendedProd + recommendedDev + recommendedQA;

    const optimizationPercent = observed > 0 
      ? (((observed - recommendedTotal) / observed) * 100).toFixed(2).replace('.', ',')
      : '0,00';

    console.log(`[MatildaTCO1YearParser] RAM - Observed: ${observed}, Recommended: ${recommendedTotal}, Optimization: ${optimizationPercent}%`);

    return {
      resource: 'RAM',
      observed,
      recommendedProd,
      recommendedDev,
      recommendedQA,
      recommendedTotal,
      optimizationPercent: `${optimizationPercent}%`
    };
  }

  /**
   * Parse Storage data from Instance TCO Right Sizing sheet
   * Observed: Column V "Total Storage(GB)"
   * Recommended: Column g "Recommended Storage(GB)" (column 33, index 32) + custom %
   */
  private parseStorage(): ResourceOptimization | null {
    const sheetName = this.findSheet(['Instance TCO Right Sizing', 'Instance TCO', 'TCO Right Sizing']);
    if (!sheetName) {
      console.log('[MatildaTCO1YearParser] ⚠ Instance TCO Right Sizing sheet not found');
      return null;
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[MatildaTCO1YearParser] ⚠ Instance TCO Right Sizing sheet has no data');
      return null;
    }

    const observed = this.sumColumn(data, [
      'Total Storage(GB)',
      'Total Storage (GB)',
      'Storage(GB)',
      'Storage',
      '__EMPTY_21'
    ]);

    const recommendedBase = this.sumColumn(data, [
      'Recommended Storage(GB)',
      'Recommended Storage (GB)',
      'RecommendedStorage',
      '__EMPTY_32'
    ]);

    const incrementMultiplier = 1 + (this.storageIncrementPercent / 100);
    const recommendedProd = recommendedBase * incrementMultiplier;

    console.log(`[MatildaTCO1YearParser] Storage increment: ${this.storageIncrementPercent}% (multiplier: ${incrementMultiplier})`);

    const recommendedDev = 0;
    const recommendedQA = 0;
    const recommendedTotal = recommendedProd + recommendedDev + recommendedQA;

    const optimizationPercent = observed > 0 
      ? (((observed - recommendedTotal) / observed) * 100).toFixed(2).replace('.', ',')
      : '0,00';

    console.log(`[MatildaTCO1YearParser] Storage - Observed: ${observed}, Recommended: ${recommendedTotal}, Optimization: ${optimizationPercent}%`);

    return {
      resource: 'Storage',
      observed,
      recommendedProd,
      recommendedDev,
      recommendedQA,
      recommendedTotal,
      optimizationPercent: `${optimizationPercent}%`
    };
  }

  /**
   * Parse migration strategies from Instance Assessment Summary sheet
   * Column Q: "Migration Strategy" (explicit)
   * Column G: "OS Version" for classification
   */
  private parseMigrationStrategies(): { migrationStrategies: OSMigrationStrategy[], migrationSummary: MigrationStrategySummary } {
    const sheetName = this.findSheet(['Instance Assessment Summary', 'Instance Assessment', 'Assessment Summary']);
    if (!sheetName) {
      console.log('[MatildaTCO1YearParser] ⚠ Instance Assessment Summary sheet not found for migration strategies');
      return { migrationStrategies: [], migrationSummary: this.getEmptySummary() };
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[MatildaTCO1YearParser] ⚠ Instance Assessment Summary sheet has no data for migration strategies');
      return { migrationStrategies: [], migrationSummary: this.getEmptySummary() };
    }

    const osVersions = new Map<string, { count: number; strategy: string }>();
    
    data.forEach((row: any) => {
      // Use "OS Version" from Instance Assessment Summary (not "Operating System")
      const osVersion = row['OS Version'] || row['OSVersion'] || row['Operating System'] || row['__EMPTY_6'];
      const strategy = row['Migration Strategy'] || row['MigrationStrategy'] || row['Strategy'] || row['__EMPTY_16'] || 'Rehost';
      
      if (osVersion && typeof osVersion === 'string' && osVersion.trim() !== '') {
        const normalized = osVersion.trim();
        const existing = osVersions.get(normalized);
        
        if (existing) {
          existing.count++;
        } else {
          osVersions.set(normalized, { count: 1, strategy: strategy || 'Rehost' });
        }
      }
    });

    console.log(`[MatildaTCO1YearParser] Found ${osVersions.size} unique OS versions with migration strategies`);

    const classifications = new Map<string, { count: number; classification: ReturnType<typeof classifyOS> }>();
    
    for (const [osVersion, { count, strategy }] of osVersions.entries()) {
      const classification = classifyOS(osVersion);
      classifications.set(osVersion, { count, classification });
    }

    const migrationStrategies: OSMigrationStrategy[] = [];
    
    for (const [osVersion, { count, classification }] of classifications.entries()) {
      migrationStrategies.push({
        osVersion,
        count,
        category: classification.category,
        strategy: classification.strategy,
        supported: classification.supported,
        notes: classification.notes
      });
    }

    migrationStrategies.sort((a, b) => b.count - a.count);

    const migrationSummary = getMigrationSummary(classifications);

    console.log(`[MatildaTCO1YearParser] Migration strategies: ${migrationStrategies.length} OS versions classified`);
    console.log(`[MatildaTCO1YearParser] Summary: ${migrationSummary.totalServers} total servers`);

    return { migrationStrategies, migrationSummary };
  }

  private getEmptySummary(): MigrationStrategySummary {
    return {
      totalServers: 0,
      byCategory: {
        purchase: 0,
        migrate: 0,
        modernize: 0
      },
      byStrategy: {
        repurchase: 0,
        retire: 0,
        retain: 0,
        rehost: 0,
        relocate: 0,
        replatform: 0,
        refactor: 0
      }
    };
  }

  /**
   * Parse SQL Server licensing data from Host Details sheet
   * Column ` (26): "Databases/Caches" - contains comma-separated database list
   * vCPUs from Instance TCO Right Sizing: Column O (Observed), Column ` (Recommended)
   */
  private async parseSQLLicensing(): Promise<{ sqlLicensing: SQLLicensingData[], sqlLicensingSummary: SQLLicensingSummary }> {
    const hostDetailsSheet = this.findSheet(['Host Details', 'HostDetails']);
    const tcoSheet = this.findSheet(['Instance TCO Right Sizing', 'Instance TCO']);
    
    if (!hostDetailsSheet || !tcoSheet) {
      console.log('[MatildaTCO1YearParser] ⚠ Required sheets not found for SQL licensing');
      return { sqlLicensing: [], sqlLicensingSummary: this.getEmptySQLSummary() };
    }

    const hostData = this.getSheetData(hostDetailsSheet);
    const tcoData = this.getSheetData(tcoSheet);
    
    if (hostData.length === 0 || tcoData.length === 0) {
      console.log('[MatildaTCO1YearParser] ⚠ Sheets have no data for SQL licensing');
      return { sqlLicensing: [], sqlLicensingSummary: this.getEmptySQLSummary() };
    }

    const sqlEditions = new Map<string, { observedVCPUs: number; recommendedVCPUs: number }>();
    let totalSQLServers = 0;
    let totalDeveloperServers = 0;
    let totalExpressServers = 0;

    hostData.forEach((hostRow: any, index: number) => {
      // Column K (index 10) in Matilda Host Details contains SQL Server info
      const databases = hostRow['Databases/Caches'] || hostRow['Databases / Caches'] ||
        hostRow['MS SQL Edition'] || hostRow['Databases'] || hostRow['__EMPTY_10'] || '';
      const appServices = hostRow['AppServices'] || '';
      
      // Combine both fields to search for SQL Server
      const combinedData = `${databases} ${appServices}`.toLowerCase();
      
      if (!combinedData.includes('mssql') && !combinedData.includes('sql server') && !combinedData.includes('mysql') && !combinedData.includes('postgresql')) {
        return;
      }

      // Only count SQL Server for licensing
      if (!combinedData.includes('mssql') && !combinedData.includes('sql server')) {
        return;
      }

      totalSQLServers++;

      const sqlInfo = this.parseSQLEdition(databases || appServices);
      if (!sqlInfo) return;

      if (sqlInfo.edition.toLowerCase().includes('express')) {
        totalExpressServers++;
        return;
      }
      if (sqlInfo.edition.toLowerCase().includes('developer')) {
        totalDeveloperServers++;
        return;
      }

      const tcoRow = tcoData[index];
      if (!tcoRow) return;

      const observedVCPU = this.parseNumber(
        tcoRow['VCPU Count'] || tcoRow['vCPU Count'] || tcoRow['__EMPTY_14']
      );
      const recommendedVCPU = this.parseNumber(
        tcoRow['Recomm. vCPU'] || tcoRow['Recommended vCPU'] || tcoRow['__EMPTY_25']
      );

      const edition = `SQL Server ${sqlInfo.version} ${sqlInfo.edition}`;
      const existing = sqlEditions.get(edition) || { observedVCPUs: 0, recommendedVCPUs: 0 };
      sqlEditions.set(edition, {
        observedVCPUs: existing.observedVCPUs + observedVCPU,
        recommendedVCPUs: existing.recommendedVCPUs + recommendedVCPU
      });
    });

    console.log(`[MatildaTCO1YearParser] SQL Licensing: ${sqlEditions.size} editions, Total SQL Servers: ${totalSQLServers}`);

    const sqlLicensing: SQLLicensingData[] = [];
    let totalObservedVCPUs = 0;
    let totalRecommendedVCPUs = 0;
    let totalObservedCost = 0;
    let totalRecommendedCost = 0;

    for (const [edition, vcpus] of sqlEditions.entries()) {
      const isOutOfSupport = this.isSQLVersionOutOfSupport(edition);
      const listPrice = await getPriceForEdition(edition);

      const observedCost = (vcpus.observedVCPUs / 2) * listPrice;
      const recommendedCost = (vcpus.recommendedVCPUs / 2) * listPrice;
      const savings = observedCost - recommendedCost;
      const savingsPercent = observedCost > 0 ? ((savings / observedCost) * 100) : 0;
      const optimizationPercent = vcpus.observedVCPUs > 0 
        ? (((vcpus.observedVCPUs - vcpus.recommendedVCPUs) / vcpus.observedVCPUs) * 100) 
        : 0;

      sqlLicensing.push({
        edition,
        observedVCPUs: vcpus.observedVCPUs,
        recommendedVCPUs: vcpus.recommendedVCPUs,
        optimizationPercent,
        listPrice,
        observedCost,
        recommendedCost,
        savings,
        savingsPercent,
        isOutOfSupport
      });

      totalObservedVCPUs += vcpus.observedVCPUs;
      totalRecommendedVCPUs += vcpus.recommendedVCPUs;
      totalObservedCost += observedCost;
      totalRecommendedCost += recommendedCost;
    }

    sqlLicensing.sort((a, b) => b.observedCost - a.observedCost);

    const totalSavings = totalObservedCost - totalRecommendedCost;
    const totalSavingsPercent = totalObservedCost > 0 ? ((totalSavings / totalObservedCost) * 100) : 0;
    const totalOptimizationPercent = totalObservedVCPUs > 0 
      ? (((totalObservedVCPUs - totalRecommendedVCPUs) / totalObservedVCPUs) * 100) 
      : 0;

    const sqlLicensingSummary: SQLLicensingSummary = {
      totalObservedVCPUs,
      totalRecommendedVCPUs,
      totalOptimizationPercent,
      totalObservedCost,
      totalRecommendedCost,
      totalSavings,
      totalSavingsPercent,
      totalSQLServers,
      totalDeveloperServers,
      totalExpressServers
    };

    return { sqlLicensing, sqlLicensingSummary };
  }

  private parseSQLEdition(databaseString: string): { version: string; edition: string } | null {
    if (!databaseString) return null;
    
    const parts = databaseString.toLowerCase().split(',');
    
    for (const part of parts) {
      if (part.includes('mssql') || part.includes('sql server')) {
        const versionMatch = part.match(/\b(20\d{2})\b/);
        const version = versionMatch ? versionMatch[1] : 'Unknown';
        
        let edition = 'Standard';
        if (part.includes('enterprise')) edition = 'Enterprise';
        else if (part.includes('standard')) edition = 'Standard';
        else if (part.includes('web')) edition = 'Web';
        else if (part.includes('express')) return null;
        else if (part.includes('developer')) return null;
        
        return { version, edition };
      }
    }
    
    return null;
  }

  private isSQLVersionOutOfSupport(edition: string): boolean {
    const editionLower = edition.toLowerCase();
    const currentDate = new Date('2026-03-04');
    
    const outOfSupportVersions = [
      { version: '2014', extendedSupportEnd: new Date('2024-07-09') },
      { version: '2012', extendedSupportEnd: new Date('2022-07-12') },
      { version: '2008', extendedSupportEnd: new Date('2019-07-09') },
      { version: '2005', extendedSupportEnd: new Date('2016-04-12') }
    ];
    
    const supportedVersions = [
      { version: '2025', extendedSupportEnd: new Date('2035-01-01') },
      { version: '2022', extendedSupportEnd: new Date('2033-01-11') },
      { version: '2019', extendedSupportEnd: new Date('2030-01-08') },
      { version: '2017', extendedSupportEnd: new Date('2027-10-12') },
      { version: '2016', extendedSupportEnd: new Date('2026-07-14') }
    ];
    
    for (const supported of supportedVersions) {
      if (editionLower.includes(supported.version)) {
        return currentDate > supported.extendedSupportEnd;
      }
    }
    
    for (const outOfSupport of outOfSupportVersions) {
      if (editionLower.includes(outOfSupport.version)) {
        return true;
      }
    }
    
    return false;
  }

  private getEmptySQLSummary(): SQLLicensingSummary {
    return {
      totalObservedVCPUs: 0,
      totalRecommendedVCPUs: 0,
      totalOptimizationPercent: 0,
      totalObservedCost: 0,
      totalRecommendedCost: 0,
      totalSavings: 0,
      totalSavingsPercent: 0,
      totalSQLServers: 0,
      totalDeveloperServers: 0,
      totalExpressServers: 0
    };
  }

  /**
   * Parse instance types from Instance TCO Right Sizing sheet
   * Column _ (31): "Recomm. Instance Type"
   * Returns top 10 instance types by count
   */
  private parseInstanceTypes(): InstanceTypeData[] {
    const sheetName = this.findSheet(['Instance TCO Right Sizing', 'Instance TCO', 'TCO Right Sizing']);
    if (!sheetName) {
      console.log('[MatildaTCO1YearParser] ⚠ Instance TCO Right Sizing sheet not found for instance types');
      return [];
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[MatildaTCO1YearParser] ⚠ Instance TCO Right Sizing sheet has no data for instance types');
      return [];
    }

    const instanceCounts = new Map<string, number>();
    let totalInstances = 0;

    data.forEach((row: any) => {
      const instanceType = row['Recomm. Instance Type'] || row['Recommended Instance Type'] || row['Instance Type'] || row['__EMPTY_30'];
      
      if (instanceType && typeof instanceType === 'string' && instanceType.trim() !== '' && instanceType.trim() !== '-') {
        const normalized = instanceType.trim();
        instanceCounts.set(normalized, (instanceCounts.get(normalized) || 0) + 1);
        totalInstances++;
      }
    });

    console.log(`[MatildaTCO1YearParser] Found ${instanceCounts.size} unique instance types, ${totalInstances} total instances`);

    const instanceTypes: InstanceTypeData[] = [];
    for (const [instanceType, count] of instanceCounts.entries()) {
      const percentage = totalInstances > 0 ? (count / totalInstances) * 100 : 0;
      instanceTypes.push({
        instanceType,
        count,
        percentage
      });
    }

    instanceTypes.sort((a, b) => b.count - a.count);
    const top10 = instanceTypes.slice(0, 10);

    console.log(`[MatildaTCO1YearParser] Top 10 instance types:`, top10.map(i => `${i.instanceType}: ${i.count}`));

    return top10;
  }

  /**
   * Parse network transfer data
   * Matilda does not provide network transfer data
   */
  private parseNetworkTransfer(): NetworkTransferData[] {
    console.log('[MatildaTCO1YearParser] ⚠ Network transfer data not available in Matilda format');
    return [];
  }

  /**
   * Parse support risk data from Host Details sheet
   * Column K: "OS EOL Status" (Active/Expired)
   * Column L: "OS Support End Date" (MM-DD-YYYY)
   * Column E + F: "Operating System" + "Version" for classification
   */
  private async parseSupportRisk(): Promise<SupportRiskSummary> {
    const sheetName = this.findSheet(['Host Details', 'HostDetails']);
    if (!sheetName) {
      console.log('[MatildaTCO1YearParser] ⚠ Host Details sheet not found for support risk');
      return { windowsServers: [], sqlServers: [], linuxServers: [] };
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[MatildaTCO1YearParser] ⚠ Host Details sheet has no data for support risk');
      return { windowsServers: [], sqlServers: [], linuxServers: [] };
    }

    const windowsVersions = new Map<string, { count: number; eolStatus: string; supportEndDate: string }>();
    const sqlVersions = new Map<string, { count: number; eolStatus: string; supportEndDate: string }>();
    const linuxVersions = new Map<string, { count: number; eolStatus: string; supportEndDate: string }>();

    data.forEach((row: any) => {
      const os = (row['Operating System'] || row['OS'] || '').trim();
      const version = (row['Version'] || '').trim();
      // Avoid "Ubuntu Ubuntu 20.04.5 LTS" — if version starts with OS name, use version only
      const rawOsVersion = (version && version.toLowerCase().startsWith(os.toLowerCase()))
        ? version
        : `${os} ${version}`.trim();
      const osVersion = normalizeOSVersion(rawOsVersion);
      const eolStatus = row['OS EOL Status'] || row['EOL Status'] || 'Active';
      const supportEndDate = row['OS Support End Date'] || row['Support End Date'] || row['__EMPTY_11'] || '---';
      const databases = row['Databases/Caches'] || row['Databases / Caches'] ||
        row['MS SQL Edition'] || row['Databases'] || row['__EMPTY_10'] || '';
      const appServices = row['AppServices'] || '';

      if (!osVersion || osVersion === '-') return;

      const normalizedLower = osVersion.toLowerCase();

      if (normalizedLower.includes('windows server') || normalizedLower.includes('windows')) {
        const existing = windowsVersions.get(osVersion) || { count: 0, eolStatus, supportEndDate };
        windowsVersions.set(osVersion, { ...existing, count: existing.count + 1 });
      } else if (normalizedLower.includes('linux') || normalizedLower.includes('rhel') || 
                 normalizedLower.includes('ubuntu') || normalizedLower.includes('centos') ||
                 normalizedLower.includes('suse') || normalizedLower.includes('debian') ||
                 normalizedLower.includes('red hat')) {
        const existing = linuxVersions.get(osVersion) || { count: 0, eolStatus, supportEndDate };
        linuxVersions.set(osVersion, { ...existing, count: existing.count + 1 });
      }

      // Check both Databases/Caches and AppServices for SQL Server
      const combinedData = `${databases} ${appServices}`.toLowerCase();
      if (combinedData.includes('mssql') || combinedData.includes('sql server')) {
        const sqlInfo = this.parseSQLEdition(databases || appServices);
        if (sqlInfo) {
          const sqlVersion = `SQL Server ${sqlInfo.version} ${sqlInfo.edition}`;
          const existing = sqlVersions.get(sqlVersion) || { count: 0, eolStatus, supportEndDate };
          sqlVersions.set(sqlVersion, { ...existing, count: existing.count + 1 });
        }
      }
    });

    console.log(`[MatildaTCO1YearParser] Support Risk: Windows=${windowsVersions.size}, SQL=${sqlVersions.size}, Linux=${linuxVersions.size}`);

    const windowsServers = await this.processSupportRiskCategory(windowsVersions, 'windows');
    const sqlServers = await this.processSupportRiskCategory(sqlVersions, 'sql');
    const linuxServers = await this.processSupportRiskCategory(linuxVersions, 'linux');

    return { windowsServers, sqlServers, linuxServers };
  }

  private async processSupportRiskCategory(
    versions: Map<string, { count: number; eolStatus: string; supportEndDate: string }>,
    category: 'windows' | 'sql' | 'linux'
  ): Promise<OSSupportRiskData[]> {
    const totalCount = Array.from(versions.values()).reduce((sum, v) => sum + v.count, 0);
    const result: OSSupportRiskData[] = [];

    for (const [version, data] of versions.entries()) {
      const percentage = totalCount > 0 ? (data.count / totalCount) * 100 : 0;
      
      const supportInfo = await getSupportInfo(version, category);
      
      let supportCycle: 'Unsupported' | 'Extended Support' | 'Mainstream Support' | 'Supported' = 'Supported';
      let endOfSupport = data.supportEndDate !== '---' ? data.supportEndDate : '---';
      let risk: 'High' | 'Med' | 'Low' = 'Low';

      if (data.eolStatus === 'Expired') {
        supportCycle = 'Unsupported';
        risk = 'High';
      } else if (supportInfo) {
        endOfSupport = supportInfo.extendedEnd;
        const status = getSupportStatus(supportInfo.extendedEnd);
        supportCycle = status.status;
        risk = status.risk;
      } else if (data.supportEndDate !== '---') {
        const endDate = this.parseMatildaDate(data.supportEndDate);
        if (endDate) {
          const now = new Date('2026-03-04');
          const oneYearFromNow = new Date(now);
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          
          if (endDate < now) {
            supportCycle = 'Unsupported';
            risk = 'High';
          } else if (endDate < oneYearFromNow) {
            supportCycle = 'Extended Support';
            risk = 'Med';
          } else {
            supportCycle = 'Supported';
            risk = 'Low';
          }
        }
      }

      result.push({
        version,
        count: data.count,
        percentage,
        supportCycle,
        endOfSupport,
        risk
      });
    }

    result.sort((a, b) => b.count - a.count);

    return result;
  }

  private parseMatildaDate(dateString: string): Date | null {
    if (!dateString || dateString === '---') return null;
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    return new Date(year, month, day);
  }
}
