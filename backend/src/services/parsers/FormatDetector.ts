import * as XLSX from 'xlsx';
import { DataSourceType } from '../../../../shared/types/assessment.types';
import { BaseParser } from './BaseParser';
import { AWSMPAParser } from './AWSMPAParser';
import { ConciertoParser } from './ConciertoParser';

/**
 * Format detector that automatically identifies the Excel format
 * and returns the appropriate parser
 */
export class FormatDetector {
  private workbook: XLSX.WorkBook;
  private parsers: BaseParser[];

  constructor(workbook: XLSX.WorkBook) {
    this.workbook = workbook;

    // Register all available parsers
    // Order matters - more specific parsers should come first
    this.parsers = [
      new ConciertoParser(workbook),
      new AWSMPAParser(workbook),
      // Add more parsers here as needed:
      // new MatildaParser(workbook),
      // new CustomParser(workbook),
    ];
  }

  /**
   * Detect the format and return the appropriate parser
   */
  detectFormat(): { parser: BaseParser; dataSource: DataSourceType } {
    // Try each parser's canParse method
    for (const parser of this.parsers) {
      if (parser.canParse()) {
        return {
          parser,
          dataSource: parser.getDataSourceType()
        };
      }
    }

    // If no parser matches, use AWS MPA as fallback
    // (it's the most flexible and generic)
    const fallbackParser = new AWSMPAParser(this.workbook);
    return {
      parser: fallbackParser,
      dataSource: 'UNKNOWN'
    };
  }

  /**
   * Get detailed format information for debugging
   */
  getFormatInfo(): {
    sheetNames: string[];
    sheetCount: number;
    detectedFormat: DataSourceType;
    confidence: 'high' | 'medium' | 'low';
  } {
    const { parser, dataSource } = this.detectFormat();
    const sheetNames = this.workbook.SheetNames;

    // Determine confidence based on whether a parser matched
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (dataSource !== 'UNKNOWN') {
      confidence = 'high';
    } else if (sheetNames.length > 0) {
      confidence = 'medium';
    }

    return {
      sheetNames,
      sheetCount: sheetNames.length,
      detectedFormat: dataSource,
      confidence
    };
  }

  /**
   * Validate that the workbook has minimum required data
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const sheetNames = this.workbook.SheetNames;

    if (sheetNames.length === 0) {
      errors.push('Excel file contains no sheets');
      return { valid: false, errors };
    }

    // Check if at least one sheet has data
    let hasData = false;
    for (const sheetName of sheetNames) {
      const sheet = this.workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      if (data.length > 0) {
        hasData = true;
        break;
      }
    }

    if (!hasData) {
      errors.push('Excel file contains no data in any sheet');
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Factory function to create a parser from a workbook
 */
export function createParser(workbook: XLSX.WorkBook): BaseParser {
  const detector = new FormatDetector(workbook);
  const { parser } = detector.detectFormat();
  return parser;
}

/**
 * Factory function to create a parser from a buffer
 */
export function createParserFromBuffer(buffer: Buffer): BaseParser {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return createParser(workbook);
}

/**
 * Factory function to create a parser from a file path
 */
export function createParserFromFile(filePath: string): BaseParser {
  const workbook = XLSX.readFile(filePath);
  return createParser(workbook);
}
