import fc from 'fast-check';
import { PdfParserService } from '../PdfParserService';

/**
 * Feature: sales-opportunity-analyzer
 * Property 1: File Size Validation
 * Validates: Requirements 1.1
 * 
 * For any uploaded PDF file, if the file size is less than or equal to 50MB,
 * the system should accept it; if the file size exceeds 50MB, the system
 * should reject it with an appropriate error message.
 */
describe('PdfParserService - Property Tests', () => {
  let pdfParserService: PdfParserService;

  beforeEach(() => {
    pdfParserService = new PdfParserService();
  });

  describe('Property 1: File Size Validation', () => {
    test('accepts files <= 50MB and rejects files > 50MB', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 * 1024 * 1024 }), // 0 to 100MB
          async (fileSize) => {
            // Create a buffer of the specified size
            // For testing, we create a minimal PDF-like buffer
            const buffer = Buffer.alloc(fileSize);
            
            // Add minimal PDF header to make it parseable (if size allows)
            if (fileSize >= 8) {
              buffer.write('%PDF-1.4', 0);
            }

            const result = await pdfParserService.validatePdf(buffer);
            const maxSize = 50 * 1024 * 1024;

            if (fileSize <= maxSize && fileSize > 0) {
              // Files <= 50MB should be accepted (valid or have non-size-related errors)
              // The error should NOT be about file size
              const hasSizeError = result.errors.some(err => 
                err.includes('exceeds maximum') || err.includes('50MB')
              );
              expect(hasSizeError).toBe(false);
            } else if (fileSize > maxSize) {
              // Files > 50MB should be rejected with size error
              expect(result.valid).toBe(false);
              const hasSizeError = result.errors.some(err => 
                err.includes('exceeds maximum') || err.includes('50MB')
              );
              expect(hasSizeError).toBe(true);
            }
            // fileSize === 0 is handled separately (empty buffer error)
          }
        ),
        { numRuns: 100 }
      );
    });

    test('provides descriptive error message for oversized files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 51 * 1024 * 1024, max: 100 * 1024 * 1024 }), // 51MB to 100MB
          async (fileSize) => {
            const buffer = Buffer.alloc(fileSize);
            const result = await pdfParserService.validatePdf(buffer);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            
            // Error message should be descriptive
            const errorMessage = result.errors.join(' ');
            expect(errorMessage.length).toBeGreaterThan(10);
            expect(errorMessage).toMatch(/50MB|size|exceeds/i);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
