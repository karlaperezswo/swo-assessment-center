import * as XLSX from 'xlsx';
import { CarbonReportData } from '../../../../shared/types/businessCase.types';

/**
 * Parser for Carbon Report Excel format
 * Reads carbon emissions data from Excel
 * Column mappings:
 * - Column K: "Global Warming Power (kgCO2eq)" - Current Usage
 * - Column P: "Global Warming Power (kgCO2eq)" - AWS Usage
 * - Column Q: "Carbon Savings (kgCO2eq)" - Savings
 * Created: 2026-03-04 - Carbon Report Module
 */
export class CarbonReportParser {
  private workbook: XLSX.WorkBook;

  constructor(workbook: XLSX.WorkBook) {
    this.workbook = workbook;
  }

  canParse(): boolean {
    // Check if workbook has at least one sheet
    return this.workbook.SheetNames.length > 0;
  }

  parse(): CarbonReportData {
    console.log('[CarbonReportParser] Starting parse...');
    console.log('[CarbonReportParser] Available sheets:', this.workbook.SheetNames);
    
    // Use first sheet
    const sheetName = this.workbook.SheetNames[0];
    const sheet = this.workbook.Sheets[sheetName];
    
    if (!sheet) {
      console.log('[CarbonReportParser] ⚠ Sheet not found');
      return this.getEmptyData();
    }

    // Find header row
    const headerRow = this.findHeaderRow(sheetName);
    
    // Get raw data with header row to inspect column names
    const rawData = XLSX.utils.sheet_to_json(sheet, { 
      range: headerRow,
      header: 1
    });
    
    if (rawData.length < 2) {
      console.log('[CarbonReportParser] ⚠ Not enough data');
      return this.getEmptyData();
    }

    // First row is headers
    const headers = rawData[0] as any[];
    console.log('[CarbonReportParser] Headers found:', headers);
    
    // Find column indices for K, P, Q
    const columnK = this.findColumnIndex(headers, 'K', ['global warming power', 'gwp']);
    const columnP = this.findColumnIndex(headers, 'P', ['global warming power', 'gwp'], columnK); // Skip first match
    const columnQ = this.findColumnIndex(headers, 'Q', ['carbon savings', 'savings']);
    
    console.log(`[CarbonReportParser] Column K index: ${columnK}`);
    console.log(`[CarbonReportParser] Column P index: ${columnP}`);
    console.log(`[CarbonReportParser] Column Q index: ${columnQ}`);

    // Extract and sum values
    let currentUsage = 0;
    let awsUsage = 0;
    let savings = 0;

    // Start from row 1 (skip header row 0)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      
      if (columnK >= 0 && row[columnK] !== undefined) {
        const value = this.parseNumber(row[columnK]);
        currentUsage += value;
      }
      
      if (columnP >= 0 && row[columnP] !== undefined) {
        const value = this.parseNumber(row[columnP]);
        awsUsage += value;
      }
      
      if (columnQ >= 0 && row[columnQ] !== undefined) {
        const value = this.parseNumber(row[columnQ]);
        savings += value;
      }
    }

    const savingsPercent = currentUsage > 0 
      ? ((currentUsage - awsUsage) / currentUsage) * 100 
      : 0;

    console.log(`[CarbonReportParser] Current Usage (Column K): ${currentUsage} kgCO2eq`);
    console.log(`[CarbonReportParser] AWS Usage (Column P): ${awsUsage} kgCO2eq`);
    console.log(`[CarbonReportParser] Savings (Column Q): ${savings} kgCO2eq`);
    console.log(`[CarbonReportParser] Savings Percent: ${savingsPercent.toFixed(2)}%`);

    return {
      currentUsage,
      awsUsage,
      savings,
      savingsPercent
    };
  }

  /**
   * Find column index by letter or by searching header names
   */
  private findColumnIndex(headers: any[], targetColumn: string, searchTerms: string[], skipIndex: number = -1): number {
    // Column letters to indices: K=10, P=15, Q=16
    const columnMap: { [key: string]: number } = {
      'K': 10,
      'P': 15,
      'Q': 16
    };

    // Try direct column index first
    if (columnMap[targetColumn] !== undefined) {
      const directIndex = columnMap[targetColumn];
      if (directIndex < headers.length) {
        console.log(`[CarbonReportParser] Using direct index for column ${targetColumn}: ${directIndex}`);
        return directIndex;
      }
    }

    // Fallback: search by header name
    let matchCount = 0;
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || '').toLowerCase().trim();
      
      const matches = searchTerms.some(term => header.includes(term));
      
      if (matches) {
        // If we need to skip the first match (for duplicate column names)
        if (skipIndex >= 0 && matchCount === 0) {
          matchCount++;
          continue;
        }
        console.log(`[CarbonReportParser] Found column ${targetColumn} at index ${i} with header: ${headers[i]}`);
        return i;
      }
    }

    console.log(`[CarbonReportParser] ⚠ Column ${targetColumn} not found`);
    return -1;
  }

  /**
   * Parse number value
   * Handles both formats:
   * - English: 1,234.56 (comma for thousands, dot for decimals)
   * - Spanish: 1.234,56 (dot for thousands, comma for decimals)
   */
  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    
    // If already a number, return it
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }
    
    // Convert to string for processing
    const strValue = String(value).trim();
    
    if (strValue === '') return 0;
    
    // Detect format by checking which separator appears last
    const lastComma = strValue.lastIndexOf(',');
    const lastDot = strValue.lastIndexOf('.');
    
    let normalized: string;
    
    if (lastComma > lastDot) {
      // Spanish format: 1.234,56 or just comma: 1234,56
      // Remove dots (thousands separator) and replace comma with dot (decimal)
      normalized = strValue.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
      // English format: 1,234.56 or just dot: 1234.56
      // Remove commas (thousands separator), keep dot (decimal)
      normalized = strValue.replace(/,/g, '');
    } else if (lastComma === -1 && lastDot === -1) {
      // No separators, just digits
      normalized = strValue;
    } else {
      // Edge case: only one separator
      if (lastComma >= 0 && lastDot === -1) {
        // Only comma: could be thousands or decimal
        // If comma is in last 3 positions, assume decimal
        if (strValue.length - lastComma <= 3) {
          normalized = strValue.replace(',', '.');
        } else {
          normalized = strValue.replace(',', '');
        }
      } else {
        // Only dot: could be thousands or decimal
        // If dot is in last 3 positions, assume decimal
        if (strValue.length - lastDot <= 3) {
          normalized = strValue;
        } else {
          normalized = strValue.replace('.', '');
        }
      }
    }
    
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Find the row number where headers are located
   */
  private findHeaderRow(sheetName: string): number {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) return 0;

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

      // Look for key columns
      const hasKeyColumns = columnsLower.some(col => 
        col.includes('global warming power') ||
        col.includes('carbon savings')
      );

      if (hasKeyColumns) {
        console.log(`[CarbonReportParser] ✓ Found headers in row ${row + 1} (0-indexed: ${row})`);
        return row;
      }
    }

    console.log('[CarbonReportParser] ⚠ No headers found, using row 2 (0-indexed: 1) as default');
    return 1;  // Default to row 2
  }

  /**
   * Get empty data
   */
  private getEmptyData(): CarbonReportData {
    return {
      currentUsage: 0,
      awsUsage: 0,
      savings: 0,
      savingsPercent: 0
    };
  }
}
