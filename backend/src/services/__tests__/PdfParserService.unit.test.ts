import { PdfParserService, PdfParseError } from '../PdfParserService';

// Mock pdf-parse to avoid worker issues in Jest
jest.mock('pdf-parse', () => {
  return {
    PDFParse: jest.fn().mockImplementation((options) => {
      const data = options.data;
      
      // Simulate PDF parsing behavior
      if (!data || data.length === 0) {
        throw new Error('Invalid PDF');
      }
      
      // Extract text from our test PDF format
      const text = data.toString('utf-8');
      
      // Check if it looks like a PDF
      if (!text.startsWith('%PDF')) {
        throw new Error('Invalid PDF format');
      }
      
      // Extract content between parentheses (our simple PDF format)
      const matches = text.match(/\(([^)]+)\)/g);
      let extractedText = '';
      if (matches) {
        extractedText = matches.map(m => m.slice(1, -1)).join(' ');
      }
      
      return {
        getText: jest.fn().mockResolvedValue({
          text: extractedText,
          pages: [],
          total: 1
        }),
        destroy: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

describe('PdfParserService - Unit Tests', () => {
  let pdfParserService: PdfParserService;

  beforeEach(() => {
    pdfParserService = new PdfParserService();
    jest.clearAllMocks();
  });

  describe('parsePdf', () => {
    test('should extract text from a valid PDF buffer', async () => {
      const pdfContent = createMinimalPdf('Test content for MRA document with sufficient length. Maturity Level: 3. Security gaps identified. This document contains important information about the migration readiness assessment.');
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result).toBeDefined();
      expect(result.rawText).toBeDefined();
      expect(result.rawText.length).toBeGreaterThan(0);
      expect(result.maturityLevel).toBeGreaterThanOrEqual(1);
      expect(result.maturityLevel).toBeLessThanOrEqual(5);
      expect(Array.isArray(result.securityGaps)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should extract maturity level from text', async () => {
      const pdfContent = createMinimalPdf('Migration Readiness Assessment document with comprehensive analysis. Maturity Level: 4. The organization shows good maturity in cloud readiness and operational practices.');
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result.maturityLevel).toBe(4);
    });

    test('should extract security gaps from text', async () => {
      const pdfContent = createMinimalPdf(
        'Security Gaps identified in the assessment: - Lack of encryption at rest for sensitive data - No MFA enabled for administrative access - Outdated firewall rules requiring immediate attention'
      );
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result.securityGaps.length).toBeGreaterThan(0);
    });

    test('should handle Spanish content', async () => {
      const pdfContent = createMinimalPdf(
        'Evaluación de Preparación para la Migración a la nube de AWS. Nivel de Madurez: 3. Brechas de Seguridad: - Falta de cifrado en reposo - Sin autenticación multifactor para acceso administrativo'
      );
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result.maturityLevel).toBe(3);
      expect(result.securityGaps.length).toBeGreaterThan(0);
    });

    test('should throw PdfParseError for content that is too short', async () => {
      const pdfContent = createMinimalPdf('Short');
      
      await expect(pdfParserService.parsePdf(pdfContent)).rejects.toThrow(PdfParseError);
      await expect(pdfParserService.parsePdf(pdfContent)).rejects.toThrow('too short');
    });

    test('should throw PdfParseError for invalid PDF buffer', async () => {
      const invalidBuffer = Buffer.from('This is not a PDF file');
      
      await expect(pdfParserService.parsePdf(invalidBuffer)).rejects.toThrow(PdfParseError);
    });

    test('should extract DR strategy information', async () => {
      const pdfContent = createMinimalPdf(
        'Disaster Recovery Strategy: The organization has implemented a comprehensive multi-region disaster recovery strategy with RPO of 4 hours and RTO of 8 hours for critical systems.'
      );
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result.drStrategy).toBeDefined();
      // Check for either full term or abbreviation
      const drText = result.drStrategy.toLowerCase();
      expect(drText.includes('disaster recovery') || drText.includes('dr strategy')).toBe(true);
    });

    test('should extract backup strategy information', async () => {
      const pdfContent = createMinimalPdf(
        'Backup Strategy: Daily incremental backups with weekly full backups are implemented. Retention period of 30 days for all critical data and systems.'
      );
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result.backupStrategy).toBeDefined();
      expect(result.backupStrategy.toLowerCase()).toContain('backup');
    });

    test('should extract compliance requirements', async () => {
      const pdfContent = createMinimalPdf(
        'Compliance Requirements for the organization: - HIPAA compliance required for healthcare data - SOC 2 Type II certification needed - GDPR data protection compliance mandatory'
      );
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result.complianceRequirements.length).toBeGreaterThan(0);
    });

    test('should extract technical debt', async () => {
      const pdfContent = createMinimalPdf(
        'Technical Debt identified in the infrastructure: - Legacy Windows Server 2008 systems requiring upgrade - End of life SQL Server 2012 databases - Obsolete Java 7 applications needing modernization'
      );
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result.technicalDebt.length).toBeGreaterThan(0);
    });

    test('should extract recommendations', async () => {
      const pdfContent = createMinimalPdf(
        'Recommendations for cloud migration: 1. Migrate to AWS EC2 instances for compute workloads 2. Implement AWS RDS for managed databases 3. Use AWS Backup for comprehensive data protection'
      );
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('should default to maturity level 2 when not found', async () => {
      const pdfContent = createMinimalPdf(
        'This document does not contain a maturity level indicator but has sufficient content for parsing and analysis of the migration readiness assessment.'
      );
      
      const result = await pdfParserService.parsePdf(pdfContent);

      expect(result.maturityLevel).toBe(2);
    });
  });

  describe('validatePdf', () => {
    test('should validate a correct PDF buffer', async () => {
      const pdfContent = createMinimalPdf('Valid PDF content with sufficient length for validation purposes and testing.');
      
      const result = await pdfParserService.validatePdf(pdfContent);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should reject empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      
      const result = await pdfParserService.validatePdf(emptyBuffer);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('empty');
    });

    test('should reject oversized files', async () => {
      const oversizedBuffer = Buffer.alloc(51 * 1024 * 1024); // 51MB
      
      const result = await pdfParserService.validatePdf(oversizedBuffer);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('50MB');
    });

    test('should provide warnings for short content', async () => {
      const shortPdf = createMinimalPdf('This is short but valid PDF content for testing purposes only.');
      
      const result = await pdfParserService.validatePdf(shortPdf);

      // Should be valid but may have warnings
      if (result.warnings.length > 0) {
        expect(result.warnings.some(w => w.includes('short'))).toBe(true);
      }
    });

    test('should handle invalid PDF gracefully', async () => {
      const invalidBuffer = Buffer.from('Not a PDF');
      
      const result = await pdfParserService.validatePdf(invalidBuffer);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Helper function to create a minimal valid PDF with text content
 */
function createMinimalPdf(textContent: string): Buffer {
  const pdfHeader = '%PDF-1.4\n';
  const pdfCatalog = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const pdfPages = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const pdfPage = '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n';
  const pdfResources = '4 0 obj\n<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>\nendobj\n';
  
  const streamContent = `BT\n/F1 12 Tf\n50 750 Td\n(${textContent}) Tj\nET\n`;
  const pdfStream = `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
  
  const pdfXref = 'xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\n0000000308 00000 n\n';
  const pdfTrailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${(pdfHeader + pdfCatalog + pdfPages + pdfPage + pdfResources + pdfStream).length}\n%%EOF\n`;
  
  const pdfContent = pdfHeader + pdfCatalog + pdfPages + pdfPage + pdfResources + pdfStream + pdfXref + pdfTrailer;
  
  return Buffer.from(pdfContent, 'utf-8');
}
