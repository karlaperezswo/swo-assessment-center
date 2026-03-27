import * as XLSX from 'xlsx';
import { CloudamizeParser } from './CloudamizeParser';
import { MatildaParser } from './MatildaParser';
import { CloudamizeTCO1YearParser } from './CloudamizeTCO1YearParser';
import { MatildaTCO1YearParser } from './MatildaTCO1YearParser';

/**
 * Format detector for Business Case files
 * Automatically identifies whether a file is Cloudamize or Matilda format
 * Created: 2026-03-04 - Matilda Parser Integration
 */
export class BusinessCaseFormatDetector {
  private workbook: XLSX.WorkBook;

  constructor(workbook: XLSX.WorkBook) {
    this.workbook = workbook;
  }

  /**
   * Detect format for Business Case upload (OS Distribution)
   * Returns appropriate parser: MatildaParser or CloudamizeParser
   */
  detectBusinessCaseFormat(): {
    parser: CloudamizeParser | MatildaParser;
    dataSource: 'CLOUDAMIZE' | 'MATILDA' | 'UNKNOWN';
  } {
    // Try Matilda first (more specific)
    const matildaParser = new MatildaParser(this.workbook);
    if (matildaParser.canParse()) {
      console.log('[BusinessCaseFormatDetector] ✓ Detected Matilda format');
      return {
        parser: matildaParser,
        dataSource: 'MATILDA'
      };
    }

    // Try Cloudamize
    const cloudamizeParser = new CloudamizeParser(this.workbook);
    if (cloudamizeParser.canParse()) {
      console.log('[BusinessCaseFormatDetector] ✓ Detected Cloudamize format');
      return {
        parser: cloudamizeParser,
        dataSource: 'CLOUDAMIZE'
      };
    }

    // Fallback to Cloudamize (most flexible)
    console.log('[BusinessCaseFormatDetector] ⚠ Unknown format, using Cloudamize parser as fallback');
    return {
      parser: cloudamizeParser,
      dataSource: 'UNKNOWN'
    };
  }

  /**
   * Detect format for TCO 1 Year upload
   * Returns appropriate parser: MatildaTCO1YearParser or CloudamizeTCO1YearParser
   */
  detectTCO1YearFormat(storageIncrementPercent: number = 0): {
    parser: CloudamizeTCO1YearParser | MatildaTCO1YearParser;
    dataSource: 'CLOUDAMIZE' | 'MATILDA' | 'UNKNOWN';
  } {
    // Try Matilda first (more specific)
    const matildaParser = new MatildaTCO1YearParser(this.workbook, storageIncrementPercent);
    if (matildaParser.canParse()) {
      console.log('[BusinessCaseFormatDetector] ✓ Detected Matilda TCO format');
      return {
        parser: matildaParser,
        dataSource: 'MATILDA'
      };
    }

    // Try Cloudamize
    const cloudamizeParser = new CloudamizeTCO1YearParser(this.workbook, storageIncrementPercent);
    if (cloudamizeParser.canParse()) {
      console.log('[BusinessCaseFormatDetector] ✓ Detected Cloudamize TCO format');
      return {
        parser: cloudamizeParser,
        dataSource: 'CLOUDAMIZE'
      };
    }

    // Fallback to Cloudamize (most flexible)
    console.log('[BusinessCaseFormatDetector] ⚠ Unknown TCO format, using Cloudamize parser as fallback');
    return {
      parser: cloudamizeParser,
      dataSource: 'UNKNOWN'
    };
  }

  /**
   * Get detailed format information for debugging
   */
  getFormatInfo(): {
    sheetNames: string[];
    sheetCount: number;
    detectedFormat: 'CLOUDAMIZE' | 'MATILDA' | 'UNKNOWN';
    confidence: 'high' | 'medium' | 'low';
  } {
    const sheetNames = this.workbook.SheetNames;
    const sheetNamesLower = sheetNames.map(s => s.toLowerCase());

    // Check for Matilda indicators
    const hasHostDetails = sheetNamesLower.some(s => s === 'host details' || s === 'hostdetails');
    const hasInstanceTCO = sheetNamesLower.some(s => s.includes('instance tco') || s.includes('instance assessment'));

    // Check for Cloudamize indicators
    const hasCompute = sheetNamesLower.some(s => s.includes('compute'));
    const hasStorage = sheetNamesLower.some(s => s.includes('storage'));
    const hasNetwork = sheetNamesLower.some(s => s.includes('network'));

    let detectedFormat: 'CLOUDAMIZE' | 'MATILDA' | 'UNKNOWN' = 'UNKNOWN';
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (hasHostDetails && hasInstanceTCO) {
      detectedFormat = 'MATILDA';
      confidence = 'high';
    } else if (hasHostDetails) {
      detectedFormat = 'MATILDA';
      confidence = 'medium';
    } else if (hasCompute && hasStorage && hasNetwork) {
      detectedFormat = 'CLOUDAMIZE';
      confidence = 'high';
    } else if (hasCompute || hasStorage) {
      detectedFormat = 'CLOUDAMIZE';
      confidence = 'medium';
    }

    return {
      sheetNames,
      sheetCount: sheetNames.length,
      detectedFormat,
      confidence
    };
  }
}
