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
 * Parser for Cloudamize TCO 1 Year Excel format
 * Reads from multiple sheets: Compute, Storage, Network
 * Column mappings:
 * - vCPU: Column P (Observed vCPU), Column Q (Recommended vCPU) from Compute
 * - RAM: Column U (Observed Memory Provisioned GB), Column W (Recommended Memory GB) from Compute
 * - Storage: Column G (Observed Disk Capacity GB), Column J (Recommended Cloud Capacity GB + custom %) from Storage
 * - Network: Column H (GB/month leaving server) from Network - Observed = Recommended
 * Created: 2026-02-27 - TCO 1 Year Module
 */
export class CloudamizeTCO1YearParser {
  private workbook: XLSX.WorkBook;
  private storageIncrementPercent: number;

  constructor(workbook: XLSX.WorkBook, storageIncrementPercent: number = 0) {
    this.workbook = workbook;
    this.storageIncrementPercent = storageIncrementPercent;
  }

  canParse(): boolean {
    const sheetNames = this.workbook.SheetNames.map(s => s.toLowerCase());
    
    // TCO 1 Year files should have Compute, Storage, and Network sheets
    const hasCompute = sheetNames.some(s => s.includes('compute'));
    const hasStorage = sheetNames.some(s => s.includes('storage'));
    const hasNetwork = sheetNames.some(s => s.includes('network'));
    
    return hasCompute && hasStorage && hasNetwork;
  }

  getDataSourceType(): 'CLOUDAMIZE' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN' {
    return 'CLOUDAMIZE';
  }

  async parse(): Promise<TCO1YearData> {
    console.log('[TCO1YearParser] Starting parse...');
    console.log('[TCO1YearParser] Available sheets:', this.workbook.SheetNames);
    
    const resourceOptimization = this.parseResourceOptimization();
    const { migrationStrategies, migrationSummary } = this.parseMigrationStrategies();
    const { sqlLicensing, sqlLicensingSummary } = await this.parseSQLLicensing();
    const instanceTypes = this.parseInstanceTypes();
    const networkTransfer = this.parseNetworkTransfer();
    const supportRisk = await this.parseSupportRisk();

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
   */
  private findHeaderRow(sheetName: string): number {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) return 0;

    // For TCO 1 Year files, headers are typically in row 2 (index 1)
    // Try up to first 5 rows to find the row with key columns
    for (let row = 0; row < 5; row++) {
      const data = XLSX.utils.sheet_to_json(sheet, { 
        range: row,
        header: 1
      });

      if (data.length === 0) continue;

      const firstRow = data[0] as any[];
      if (!firstRow || firstRow.length === 0) continue;

      const columnsLower = firstRow.map(col => 
        String(col || '').toLowerCase().trim()
      );

      // Look for key columns that indicate this is the header row
      const hasKeyColumns = columnsLower.some(col => 
        col.includes('observed vcpu') ||
        col.includes('recommended vcpu') ||
        col.includes('observed memory provisioned') ||
        col.includes('recommended memory') ||
        col.includes('observed disk capacity') ||
        col.includes('recommended cloud capacity') ||
        col.includes('gb/month leaving server')
      );

      if (hasKeyColumns) {
        console.log(`[TCO1YearParser] ✓ Found headers in row ${row + 1} (0-indexed: ${row})`);
        console.log(`[TCO1YearParser] Sample headers:`, firstRow.filter(h => h).slice(0, 10));
        return row;
      }
    }

    console.log('[TCO1YearParser] ⚠ No headers found, using row 2 (0-indexed: 1) as default');
    return 1;  // Default to row 2 for TCO 1 Year files
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
    
    console.log(`[TCO1YearParser] Reading ${sheetName} from row ${headerRow + 1}, found ${data.length} rows`);
    
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
          break; // Found the column, no need to check others
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

    // 1. vCPU from Compute sheet
    const vcpuData = this.parseVCPU();
    if (vcpuData) resources.push(vcpuData);

    // 2. RAM from Compute sheet
    const ramData = this.parseRAM();
    if (ramData) resources.push(ramData);

    // 3. Storage from Storage sheet
    const storageData = this.parseStorage();
    if (storageData) resources.push(storageData);

    // 4. Network from Network sheet
    const networkData = this.parseNetwork();
    if (networkData) resources.push(networkData);

    return resources;
  }

  /**
   * Parse vCPU data from Compute sheet
   * Observed: Column P "Observed vCPU"
   * Recommended: Column Q "Recommended vCPU"
   */
  private parseVCPU(): ResourceOptimization | null {
    const sheetName = this.findSheet(['Compute']);
    if (!sheetName) {
      console.log('[TCO1YearParser] ⚠ Compute sheet not found');
      return null;
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[TCO1YearParser] ⚠ Compute sheet has no data');
      return null;
    }

    // Log available columns for debugging
    if (data.length > 0) {
      console.log('[TCO1YearParser] Compute sheet columns:', Object.keys(data[0]));
    }

    // Column P: Observed vCPU
    const observed = this.sumColumn(data, [
      'Observed vCPU',
      'Observed vCPUs',
      'ObservedvCPU',
      '__EMPTY_15'  // Column P (16th column) = __EMPTY_15
    ]);

    // Column Q: Recommended vCPU
    const recommendedProd = this.sumColumn(data, [
      'Recommended vCPU',
      'Recommended vCPUs',
      'RecommendedvCPU',
      '__EMPTY_16'  // Column Q (17th column) = __EMPTY_16
    ]);

    const recommendedDev = 0;
    const recommendedQA = 0;
    const recommendedTotal = recommendedProd + recommendedDev + recommendedQA;

    const optimizationPercent = observed > 0 
      ? (((observed - recommendedTotal) / observed) * 100).toFixed(2).replace('.', ',')
      : '0,00';

    console.log(`[TCO1YearParser] vCPU - Observed: ${observed}, Recommended: ${recommendedTotal}, Optimization: ${optimizationPercent}%`);

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
   * Parse RAM data from Compute sheet
   * Observed: Column U "Observed Memory Provisioned (GB)"
   * Recommended: Column W "Recommended Memory (GB)"
   */
  private parseRAM(): ResourceOptimization | null {
    const sheetName = this.findSheet(['Compute']);
    if (!sheetName) return null;

    const data = this.getSheetData(sheetName);
    if (data.length === 0) return null;

    // Column U: Observed Memory Provisioned (GB)
    const observed = this.sumColumn(data, [
      'Observed Memory Provisioned (GB)',
      'Observed Memory (GB)',
      'ObservedMemory',
      '__EMPTY_20'  // Column U (21st column) = __EMPTY_20
    ]);

    // Column W: Recommended Memory (GB)
    const recommendedProd = this.sumColumn(data, [
      'Recommended Memory (GB)',
      'Recommended Memory',
      'RecommendedMemory',
      '__EMPTY_22'  // Column W (23rd column) = __EMPTY_22
    ]);

    const recommendedDev = 0;
    const recommendedQA = 0;
    const recommendedTotal = recommendedProd + recommendedDev + recommendedQA;

    const optimizationPercent = observed > 0 
      ? (((observed - recommendedTotal) / observed) * 100).toFixed(2).replace('.', ',')
      : '0,00';

    console.log(`[TCO1YearParser] RAM - Observed: ${observed}, Recommended: ${recommendedTotal}, Optimization: ${optimizationPercent}%`);

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
   * Parse Storage data from Storage sheet
   * Observed: Column G "Observed Disk Capacity (GB)"
   * Recommended: Column J "Recommended Cloud Capacity (GB)" + custom %
   */
  private parseStorage(): ResourceOptimization | null {
    const sheetName = this.findSheet(['Storage']);
    if (!sheetName) {
      console.log('[TCO1YearParser] ⚠ Storage sheet not found');
      return null;
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[TCO1YearParser] ⚠ Storage sheet has no data');
      return null;
    }

    // Log available columns for debugging
    if (data.length > 0) {
      console.log('[TCO1YearParser] Storage sheet columns:', Object.keys(data[0]));
    }

    // Column G: Observed Disk Capacity (GB)
    const observed = this.sumColumn(data, [
      'Observed Disk Capacity (GB)',
      'Observed Capacity (GB)',
      'ObservedCapacity',
      '__EMPTY_6'  // Column G (7th column) = __EMPTY_6
    ]);

    // Column J: Recommended Cloud Capacity (GB) + custom %
    const recommendedBase = this.sumColumn(data, [
      'Recommended Cloud Capacity (GB)',
      'Recommended Capacity (GB)',
      'RecommendedCapacity',
      '__EMPTY_9'  // Column J (10th column) = __EMPTY_9
    ]);

    // Add custom percentage to recommended storage
    const incrementMultiplier = 1 + (this.storageIncrementPercent / 100);
    const recommendedProd = recommendedBase * incrementMultiplier;

    console.log(`[TCO1YearParser] Storage increment: ${this.storageIncrementPercent}% (multiplier: ${incrementMultiplier})`);

    const recommendedDev = 0;
    const recommendedQA = 0;
    const recommendedTotal = recommendedProd + recommendedDev + recommendedQA;

    const optimizationPercent = observed > 0 
      ? (((observed - recommendedTotal) / observed) * 100).toFixed(2).replace('.', ',')
      : '0,00';

    console.log(`[TCO1YearParser] Storage - Observed: ${observed}, Recommended: ${recommendedTotal}, Optimization: ${optimizationPercent}%`);

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
   * Parse Network data from Network sheet
   * Observed: Column H "GB/month leaving server"
   * Recommended: Same as Observed
   */
  private parseNetwork(): ResourceOptimization | null {
    const sheetName = this.findSheet(['Network']);
    if (!sheetName) {
      console.log('[TCO1YearParser] ⚠ Network sheet not found');
      return null;
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[TCO1YearParser] ⚠ Network sheet has no data');
      return null;
    }

    // Column H: GB/month leaving server
    const observed = this.sumColumn(data, [
      'GB/month leaving server',
      'GB/month',
      'Network GB',
      '__EMPTY_7'  // Column H (8th column) = __EMPTY_7
    ]);

    // For Network, recommended is same as observed
    const recommendedProd = observed;
    const recommendedDev = 0;
    const recommendedQA = 0;
    const recommendedTotal = recommendedProd;

    console.log(`[TCO1YearParser] Network - Observed: ${observed}, Recommended: ${recommendedTotal}, Optimization: NA`);

    return {
      resource: 'Network',
      observed,
      recommendedProd,
      recommendedDev,
      recommendedQA,
      recommendedTotal,
      optimizationPercent: 'NA'
    };
  }

  /**
   * Parse migration strategies from OS versions in Compute sheet
   * Column F: "OS Version"
   */
  private parseMigrationStrategies(): { migrationStrategies: OSMigrationStrategy[], migrationSummary: MigrationStrategySummary } {
    const sheetName = this.findSheet(['Compute']);
    if (!sheetName) {
      console.log('[TCO1YearParser] ⚠ Compute sheet not found for migration strategies');
      return { migrationStrategies: [], migrationSummary: this.getEmptySummary() };
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[TCO1YearParser] ⚠ Compute sheet has no data for migration strategies');
      return { migrationStrategies: [], migrationSummary: this.getEmptySummary() };
    }

    // Column F: OS Version
    const osVersions = new Map<string, number>();
    
    data.forEach((row: any) => {
      const osVersion = row['OS Version'] || row['OSVersion'] || row['Operating System'] || row['__EMPTY_5'];
      
      if (osVersion && typeof osVersion === 'string' && osVersion.trim() !== '') {
        const normalized = normalizeOSVersion(osVersion.trim());
        osVersions.set(normalized, (osVersions.get(normalized) || 0) + 1);
      }
    });

    console.log(`[TCO1YearParser] Found ${osVersions.size} unique OS versions`);

    // Classify each OS and create migration strategies
    const classifications = new Map<string, { count: number; classification: ReturnType<typeof classifyOS> }>();
    
    for (const [osVersion, count] of osVersions.entries()) {
      const classification = classifyOS(osVersion);
      classifications.set(osVersion, { count, classification });
    }

    // Convert to array of OSMigrationStrategy
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

    // Sort by count (descending)
    migrationStrategies.sort((a, b) => b.count - a.count);

    // Get summary
    const migrationSummary = getMigrationSummary(classifications);

    console.log(`[TCO1YearParser] Migration strategies: ${migrationStrategies.length} OS versions classified`);
    console.log(`[TCO1YearParser] Summary: ${migrationSummary.totalServers} total servers`);

    return { migrationStrategies, migrationSummary };
  }

  /**
   * Get empty summary
   */
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
   * Parse SQL Server licensing data from Compute sheet
   * Column K: "MS SQL Edition"
   * Column P: "Observed vCPU"
   * Column Q: "Recommended vCPU"
   * 
   * Filters:
   * - Only process rows that contain "SQL Server" in the edition field
   * - Ignore empty cells, "-", or similar characters
   * - Ignore "Express Edition" (free, no licensing cost)
   * - Ignore "Developer Edition" (free, no licensing cost)
   */
  private async parseSQLLicensing(): Promise<{ sqlLicensing: SQLLicensingData[], sqlLicensingSummary: SQLLicensingSummary }> {
    const sheetName = this.findSheet(['Compute']);
    if (!sheetName) {
      console.log('[TCO1YearParser] ⚠ Compute sheet not found for SQL licensing');
      return { sqlLicensing: [], sqlLicensingSummary: this.getEmptySQLSummary() };
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[TCO1YearParser] ⚠ Compute sheet has no data for SQL licensing');
      return { sqlLicensing: [], sqlLicensingSummary: this.getEmptySQLSummary() };
    }

    // Group by SQL Edition
    const sqlEditions = new Map<string, { observedVCPUs: number; recommendedVCPUs: number }>();
    let totalServersProcessed = 0;
    let totalServersSkipped = 0;
    let totalDeveloperServers = 0;
    let totalExpressServers = 0;
    let totalSQLServers = 0; // Total servers with any SQL Server edition
    
    data.forEach((row: any) => {
      // Column K: MS SQL Edition
      const sqlEdition = row['MS SQL Edition'] || row['MSSQLEdition'] || row['SQL Edition'] || row['__EMPTY_10'];
      
      // Skip if no value
      if (!sqlEdition || typeof sqlEdition !== 'string') {
        return;
      }

      const normalized = sqlEdition.trim();
      
      // Skip if empty or just a dash/hyphen
      if (normalized === '' || normalized === '-' || normalized === '--' || normalized === 'N/A' || normalized === 'n/a') {
        totalServersSkipped++;
        return;
      }

      // Skip if it doesn't contain "SQL Server"
      const normalizedLower = normalized.toLowerCase();
      if (!normalizedLower.includes('sql server')) {
        totalServersSkipped++;
        return;
      }

      // Count total SQL Servers (including Express and Developer)
      totalSQLServers++;

      // Count Express Edition (free, no licensing cost)
      if (normalizedLower.includes('express')) {
        console.log(`[TCO1YearParser] Skipping Express Edition: ${normalized}`);
        totalExpressServers++;
        totalServersSkipped++;
        return;
      }

      // Count Developer Edition (free, no licensing cost)
      if (normalizedLower.includes('developer')) {
        console.log(`[TCO1YearParser] Skipping Developer Edition: ${normalized}`);
        totalDeveloperServers++;
        totalServersSkipped++;
        return;
      }

      // Valid SQL Server edition found
      totalServersProcessed++;
      
      // Column P: Observed vCPU
      const observedVCPU = this.parseNumber(
        row['Observed vCPU'] || row['Observed vCPUs'] || row['ObservedvCPU'] || row['__EMPTY_15']
      );
      
      // Column Q: Recommended vCPU
      const recommendedVCPU = this.parseNumber(
        row['Recommended vCPU'] || row['Recommended vCPUs'] || row['RecommendedvCPU'] || row['__EMPTY_16']
      );
      
      const existing = sqlEditions.get(normalized) || { observedVCPUs: 0, recommendedVCPUs: 0 };
      sqlEditions.set(normalized, {
        observedVCPUs: existing.observedVCPUs + observedVCPU,
        recommendedVCPUs: existing.recommendedVCPUs + recommendedVCPU
      });
    });

    console.log(`[TCO1YearParser] SQL Licensing: ${totalServersProcessed} servers with valid SQL Server, ${totalServersSkipped} servers skipped`);
    console.log(`[TCO1YearParser] Found ${sqlEditions.size} unique SQL Server editions`);
    console.log(`[TCO1YearParser] Total SQL Servers: ${totalSQLServers}, Developer: ${totalDeveloperServers}, Express: ${totalExpressServers}`);

    // Calculate licensing costs for each edition
    const sqlLicensing: SQLLicensingData[] = [];
    let totalObservedVCPUs = 0;
    let totalRecommendedVCPUs = 0;
    let totalObservedCost = 0;
    let totalRecommendedCost = 0;

    for (const [edition, vcpus] of sqlEditions.entries()) {
      // Determine if version is out of support
      const isOutOfSupport = this.isSQLVersionOutOfSupport(edition);
      
      // Determine list price based on edition (fetched from pricing service)
      const listPrice = await getPriceForEdition(edition);

      // Calculate costs: (vCPUs / 2) * List Price
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

    // Sort by observed cost (descending)
    sqlLicensing.sort((a, b) => b.observedCost - a.observedCost);

    // Calculate summary
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

    console.log(`[TCO1YearParser] SQL Licensing: ${sqlLicensing.length} editions, Total Savings: $${totalSavings.toFixed(2)}`);

    return { sqlLicensing, sqlLicensingSummary };
  }

  /**
   * Get empty SQL summary
   */
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
   * Check if SQL Server version is out of support
   * Based on Microsoft's official support lifecycle
   * Reference: https://learn.microsoft.com/en-us/lifecycle/products/
   * 
   * Support Status (as of 2026):
   * - SQL Server 2025: Mainstream support (latest)
   * - SQL Server 2022: Mainstream support until Jan 11, 2028 / Extended until Jan 11, 2033
   * - SQL Server 2019: Mainstream support ended Jan 7, 2025 / Extended until Jan 8, 2030
   * - SQL Server 2017: Mainstream support ended Oct 11, 2022 / Extended until Oct 12, 2027
   * - SQL Server 2016: Mainstream support ended Jul 13, 2021 / Extended support ended Jul 14, 2026
   * - SQL Server 2014: Extended support ended Jul 9, 2024 (OUT OF SUPPORT)
   * - SQL Server 2012: Extended support ended Jul 12, 2022 (OUT OF SUPPORT)
   * - SQL Server 2008/R2: Extended support ended Jul 9, 2019 (OUT OF SUPPORT)
   * - SQL Server 2005 and earlier: OUT OF SUPPORT
   */
  private isSQLVersionOutOfSupport(edition: string): boolean {
    const editionLower = edition.toLowerCase();
    const currentDate = new Date('2026-03-04'); // Current date for testing
    
    // Versions that are OUT OF SUPPORT (extended support has ended)
    const outOfSupportVersions = [
      { version: '2014', extendedSupportEnd: new Date('2024-07-09') },
      { version: '2012', extendedSupportEnd: new Date('2022-07-12') },
      { version: '2008', extendedSupportEnd: new Date('2019-07-09') },
      { version: '2005', extendedSupportEnd: new Date('2016-04-12') },
      { version: '2000', extendedSupportEnd: new Date('2013-04-09') },
      { version: '7.0', extendedSupportEnd: new Date('2011-01-11') },
      { version: '6.5', extendedSupportEnd: new Date('2002-03-31') }
    ];
    
    // Versions that are STILL SUPPORTED (extended support is active)
    const supportedVersions = [
      { version: '2025', extendedSupportEnd: new Date('2035-01-01') }, // Estimated
      { version: '2022', extendedSupportEnd: new Date('2033-01-11') },
      { version: '2019', extendedSupportEnd: new Date('2030-01-08') },
      { version: '2017', extendedSupportEnd: new Date('2027-10-12') },
      { version: '2016', extendedSupportEnd: new Date('2026-07-14') }
    ];
    
    // First check if it's a supported version
    for (const supported of supportedVersions) {
      if (editionLower.includes(supported.version)) {
        if (currentDate <= supported.extendedSupportEnd) {
          console.log(`[TCO1YearParser] ✓ SQL Server ${supported.version} is still supported (extended support until ${supported.extendedSupportEnd.toISOString().split('T')[0]})`);
          return false; // Still supported
        } else {
          console.log(`[TCO1YearParser] ⚠ SQL Server ${supported.version} extended support has ended`);
          return true; // Support has ended
        }
      }
    }
    
    // Check if it's an out-of-support version
    for (const outOfSupport of outOfSupportVersions) {
      if (editionLower.includes(outOfSupport.version)) {
        console.log(`[TCO1YearParser] ⚠ Out of support SQL Server version detected: ${edition} (extended support ended ${outOfSupport.extendedSupportEnd.toISOString().split('T')[0]})`);
        return true;
      }
    }
    
    // If no version number found, assume it's supported (could be latest version without year)
    console.log(`[TCO1YearParser] ℹ Could not determine version for: ${edition}, assuming supported`);
    return false;
  }

  /**
   * Parse instance types from Compute sheet
   * Column G: "Recommended Instance"
   * Returns top 10 instance types by count
   */
  private parseInstanceTypes(): InstanceTypeData[] {
    const sheetName = this.findSheet(['Compute']);
    if (!sheetName) {
      console.log('[TCO1YearParser] ⚠ Compute sheet not found for instance types');
      return [];
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[TCO1YearParser] ⚠ Compute sheet has no data for instance types');
      return [];
    }

    // Count instance types
    const instanceCounts = new Map<string, number>();
    let totalInstances = 0;

    data.forEach((row: any) => {
      // Column G: Recommended Instance
      const instanceType = row['Recommended Instance'] || row['RecommendedInstance'] || row['Instance Type'] || row['__EMPTY_6'];
      
      if (instanceType && typeof instanceType === 'string' && instanceType.trim() !== '' && instanceType.trim() !== '-') {
        const normalized = instanceType.trim();
        instanceCounts.set(normalized, (instanceCounts.get(normalized) || 0) + 1);
        totalInstances++;
      }
    });

    console.log(`[TCO1YearParser] Found ${instanceCounts.size} unique instance types, ${totalInstances} total instances`);

    // Convert to array and sort by count (descending)
    const instanceTypes: InstanceTypeData[] = [];
    for (const [instanceType, count] of instanceCounts.entries()) {
      const percentage = totalInstances > 0 ? (count / totalInstances) * 100 : 0;
      instanceTypes.push({
        instanceType,
        count,
        percentage
      });
    }

    // Sort by count (descending) and take top 10
    instanceTypes.sort((a, b) => b.count - a.count);
    const top10 = instanceTypes.slice(0, 10);

    console.log(`[TCO1YearParser] Top 10 instance types:`, top10.map(i => `${i.instanceType}: ${i.count}`));

    return top10;
  }

  /**
   * Parse network transfer data from Network sheet
   * Column H: "GB/month leaving server"
   * Returns top 10 servers by network transfer
   */
  private parseNetworkTransfer(): NetworkTransferData[] {
    const sheetName = this.findSheet(['Network']);
    if (!sheetName) {
      console.log('[TCO1YearParser] ⚠ Network sheet not found for network transfer');
      return [];
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[TCO1YearParser] ⚠ Network sheet has no data for network transfer');
      return [];
    }

    // Collect network transfer data
    const networkData: { serverName: string; transferGB: number }[] = [];
    let totalTransfer = 0;

    data.forEach((row: any) => {
      // Server name - try multiple column names
      const serverName = row['Server Name'] || row['ServerName'] || row['Hostname'] || row['Host'] || row['__EMPTY_0'] || 'Unknown';
      
      // Column H: GB/month leaving server
      const transferGB = this.parseNumber(
        row['GB/month leaving server'] || row['GB/month'] || row['Network Transfer'] || row['__EMPTY_7']
      );
      
      if (transferGB > 0 && serverName && serverName !== 'Unknown') {
        networkData.push({
          serverName: String(serverName).trim(),
          transferGB
        });
        totalTransfer += transferGB;
      }
    });

    console.log(`[TCO1YearParser] Found ${networkData.length} servers with network transfer data, total: ${totalTransfer.toFixed(2)} GB/month`);

    // Sort by transfer (descending) and take top 10
    networkData.sort((a, b) => b.transferGB - a.transferGB);
    const top10 = networkData.slice(0, 10);

    // Calculate percentages
    const networkTransfer: NetworkTransferData[] = top10.map(item => ({
      serverName: item.serverName,
      transferGB: item.transferGB,
      percentage: totalTransfer > 0 ? (item.transferGB / totalTransfer) * 100 : 0
    }));

    console.log(`[TCO1YearParser] Top 10 network transfer:`, networkTransfer.map(n => `${n.serverName}: ${n.transferGB.toFixed(2)} GB`));

    return networkTransfer;
  }

  /**
   * Parse support risk data from Compute sheet
   * Column F: "OS Version" - for Windows Server and Linux
   * Column K: "MS SQL Edition" - for SQL Server
   * Classifies into Windows Server, SQL Server, and Linux
   */
  private async parseSupportRisk(): Promise<SupportRiskSummary> {
    const sheetName = this.findSheet(['Compute']);
    if (!sheetName) {
      console.log('[TCO1YearParser] ⚠ Compute sheet not found for support risk');
      return { windowsServers: [], sqlServers: [], linuxServers: [] };
    }

    const data = this.getSheetData(sheetName);
    if (data.length === 0) {
      console.log('[TCO1YearParser] ⚠ Compute sheet has no data for support risk');
      return { windowsServers: [], sqlServers: [], linuxServers: [] };
    }

    // Count OS versions by category
    const windowsVersions = new Map<string, number>();
    const sqlVersions = new Map<string, number>();
    const linuxVersions = new Map<string, number>();

    data.forEach((row: any) => {
      // Column F: OS Version - for Windows and Linux
      const osVersion = row['OS Version'] || row['OSVersion'] || row['Operating System'] || row['__EMPTY_5'];
      
      if (osVersion && typeof osVersion === 'string' && osVersion.trim() !== '' && osVersion.trim() !== '-') {
        const normalized = normalizeOSVersion(osVersion.trim());
        const normalizedLower = normalized.toLowerCase();

        // Classify Windows and Linux from OS Version column
        if (normalizedLower.includes('windows server') || normalizedLower.includes('windows')) {
          windowsVersions.set(normalized, (windowsVersions.get(normalized) || 0) + 1);
        } else if (normalizedLower.includes('linux') || normalizedLower.includes('rhel') || 
                   normalizedLower.includes('ubuntu') || normalizedLower.includes('centos') ||
                   normalizedLower.includes('suse') || normalizedLower.includes('debian') ||
                   normalizedLower.includes('red hat')) {
          linuxVersions.set(normalized, (linuxVersions.get(normalized) || 0) + 1);
        }
      }

      // Column K: MS SQL Edition - for SQL Server
      const sqlEdition = row['MS SQL Edition'] || row['MSSQLEdition'] || row['SQL Edition'] || row['__EMPTY_10'];
      
      if (sqlEdition && typeof sqlEdition === 'string' && sqlEdition.trim() !== '' && sqlEdition.trim() !== '-') {
        const normalized = sqlEdition.trim();
        const normalizedLower = normalized.toLowerCase();

        // Count ALL SQL Server editions (including Express and Developer for support risk analysis)
        if (normalizedLower.includes('sql server') || normalizedLower.includes('sql')) {
          sqlVersions.set(normalized, (sqlVersions.get(normalized) || 0) + 1);
        }
      }
    });

    console.log(`[TCO1YearParser] Support Risk: Windows=${windowsVersions.size}, SQL=${sqlVersions.size}, Linux=${linuxVersions.size}`);

    // Process each category
    const windowsServers = await this.processSupportRiskCategory(windowsVersions, 'windows');
    const sqlServers = await this.processSupportRiskCategory(sqlVersions, 'sql');
    const linuxServers = await this.processSupportRiskCategory(linuxVersions, 'linux');

    return { windowsServers, sqlServers, linuxServers };
  }

  /**
   * Process support risk for a category
   */
  private async processSupportRiskCategory(
    versions: Map<string, number>,
    category: 'windows' | 'sql' | 'linux'
  ): Promise<OSSupportRiskData[]> {
    const totalCount = Array.from(versions.values()).reduce((sum, count) => sum + count, 0);
    const result: OSSupportRiskData[] = [];

    for (const [version, count] of versions.entries()) {
      const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
      
      // Get support info from EOL API (cached)
      const supportInfo = await getSupportInfo(version, category);
      
      let supportCycle: 'Unsupported' | 'Extended Support' | 'Mainstream Support' | 'Supported' = 'Supported';
      let endOfSupport = '---';
      let risk: 'High' | 'Med' | 'Low' = 'Low';

      if (supportInfo) {
        // Use extended support end date as the final date
        endOfSupport = supportInfo.extendedEnd;
        const status = getSupportStatus(supportInfo.extendedEnd);
        supportCycle = status.status;
        risk = status.risk;
      } else {
        // Unknown version, mark as medium risk
        supportCycle = 'Supported';
        risk = 'Med';
        endOfSupport = '---';
      }

      result.push({
        version,
        count,
        percentage,
        supportCycle,
        endOfSupport,
        risk
      });
    }

    // Sort by count (descending)
    result.sort((a, b) => b.count - a.count);

    return result;
  }
}
