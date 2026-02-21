import * as XLSX from 'xlsx';
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
 * Abstract base class for Excel parsers
 * Each data source (AWS, Concierto, Matilda) should extend this class
 */
export abstract class BaseParser {
  protected workbook: XLSX.WorkBook;

  constructor(workbook: XLSX.WorkBook) {
    this.workbook = workbook;
  }

  /**
   * Get the data source type identifier
   */
  abstract getDataSourceType(): DataSourceType;

  /**
   * Check if this parser can handle the given workbook
   */
  abstract canParse(): boolean;

  /**
   * Parse the entire workbook and return structured data
   */
  abstract parse(): ExcelData;

  /**
   * Parse servers from the workbook
   */
  protected abstract parseServers(): Server[];

  /**
   * Parse databases from the workbook
   */
  protected abstract parseDatabases(): Database[];

  /**
   * Parse applications from the workbook
   */
  protected abstract parseApplications(): Application[];

  /**
   * Parse server-to-application mappings
   */
  protected abstract parseServerApplicationMappings(): ServerApplicationMapping[];

  /**
   * Parse server communications/connections
   */
  protected abstract parseServerCommunications(): ServerCommunication[];

  // Utility methods shared across all parsers

  /**
   * Find a sheet by possible names (case-insensitive)
   */
  protected findSheet(possibleNames: string[]): string | undefined {
    const sheetNames = this.workbook.SheetNames;

    // Exact match (case-insensitive)
    for (const name of possibleNames) {
      const found = sheetNames.find(
        sn => sn.toLowerCase() === name.toLowerCase()
      );
      if (found) return found;
    }

    // Partial match (case-insensitive)
    for (const name of possibleNames) {
      const found = sheetNames.find(
        sn => sn.toLowerCase().includes(name.toLowerCase())
      );
      if (found) return found;
    }

    return undefined;
  }

  /**
   * Get sheet data as JSON
   */
  protected getSheetData(sheetName: string): any[] {
    const sheet = this.workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  }

  /**
   * Get sheet data with custom header row
   */
  protected getSheetDataWithHeader(sheetName: string, headerRow: number): any[] {
    const sheet = this.workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (data.length <= headerRow) return [];

    const headers = data[headerRow];
    const rows = data.slice(headerRow + 1);

    return rows.map(row => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        if (header) {
          obj[header] = row[index] || '';
        }
      });
      return obj;
    });
  }

  /**
   * Parse a value as a number
   */
  protected parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Parse a value as a boolean
   */
  protected parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  }

  /**
   * Clean and normalize string values
   */
  protected cleanString(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    return String(value || '');
  }

  /**
   * Generate a unique ID if not provided
   */
  protected generateId(prefix: string, index: number, fallback?: string): string {
    if (fallback && fallback.trim()) {
      return this.cleanString(fallback);
    }
    return `${prefix}-${String(index).padStart(5, '0')}`;
  }
}
