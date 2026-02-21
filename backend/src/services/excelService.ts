import * as XLSX from 'xlsx';
import { ExcelData, DataSourceType } from '../types';
import { createParserFromBuffer, createParserFromFile, FormatDetector } from './parsers/FormatDetector';
import { SecurityGroupService } from './SecurityGroupService';

/**
 * Main Excel Service
 * Orchestrates parsing and processing of Excel files from multiple data sources
 */
export class ExcelService {
  private securityGroupService: SecurityGroupService;

  constructor() {
    this.securityGroupService = new SecurityGroupService();
  }

  /**
   * Parse Excel file from file path
   * Automatically detects format and uses appropriate parser
   */
  parseExcel(filePath: string): ExcelData {
    const parser = createParserFromFile(filePath);
    const excelData = parser.parse();

    // Generate security groups from communications
    if (excelData.serverCommunications.length > 0) {
      excelData.securityGroups = this.securityGroupService.generateSecurityGroups(
        excelData.serverCommunications,
        excelData.servers,
        excelData.applications
      );
    }

    return excelData;
  }

  /**
   * Parse Excel file from buffer
   * Automatically detects format and uses appropriate parser
   */
  parseExcelFromBuffer(buffer: Buffer): ExcelData {
    const parser = createParserFromBuffer(buffer);
    const excelData = parser.parse();

    // Generate security groups from communications
    if (excelData.serverCommunications.length > 0) {
      excelData.securityGroups = this.securityGroupService.generateSecurityGroups(
        excelData.serverCommunications,
        excelData.servers,
        excelData.applications
      );
    }

    return excelData;
  }

  /**
   * Get detailed format information about an Excel file
   */
  detectFormat(buffer: Buffer): {
    dataSource: DataSourceType;
    sheetNames: string[];
    sheetCount: number;
    confidence: 'high' | 'medium' | 'low';
  } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const detector = new FormatDetector(workbook);
    const info = detector.getFormatInfo();

    return {
      dataSource: info.detectedFormat,
      sheetNames: info.sheetNames,
      sheetCount: info.sheetCount,
      confidence: info.confidence
    };
  }

  /**
   * Validate an Excel file before parsing
   */
  validateExcel(buffer: Buffer): { valid: boolean; errors: string[] } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const detector = new FormatDetector(workbook);
    return detector.validate();
  }
}
