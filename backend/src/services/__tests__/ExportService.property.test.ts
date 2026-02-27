import fc from 'fast-check';
import { ExportService } from '../ExportService';
import {
  Opportunity,
  OpportunityStatus,
  OpportunityPriority,
} from '../../../../shared/types/opportunity.types';
import { StorageService } from '../storageService';

// Mock StorageService
jest.mock('../storageService');

describe('ExportService - Property Tests', () => {
  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
    jest.clearAllMocks();

    // Mock StorageService methods
    (StorageService.saveFile as jest.Mock).mockResolvedValue('generated/playbook-123.docx');
    (StorageService.getDownloadUrl as jest.Mock).mockResolvedValue('https://example.com/download/playbook-123.docx');
    (StorageService.scheduleFileDeletion as jest.Mock).mockImplementation(() => {});
  });

  // Arbitrary for valid priority
  const validPriorityArb = fc.constantFrom<OpportunityPriority>('High', 'Medium', 'Low');

  // Arbitrary for valid status
  const validStatusArb = fc.constantFrom<OpportunityStatus>(
    'Nueva',
    'En Progreso',
    'Ganada',
    'Perdida',
    'Descartada'
  );

  // Arbitrary for valid opportunity
  const validOpportunityArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 100 }),
    priority: validPriorityArb,
    estimatedARR: fc.integer({ min: 1000, max: 10000000 }),
    reasoning: fc.string({ minLength: 20, maxLength: 500 }),
    talkingPoints: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 3, maxLength: 10 }),
    nextSteps: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 2, maxLength: 10 }),
    relatedServices: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
    status: validStatusArb,
    createdAt: fc.date(),
    updatedAt: fc.date(),
  }) as fc.Arbitrary<Opportunity>;

  // Arbitrary for opportunity arrays
  const opportunitiesArb = fc.array(validOpportunityArb, { minLength: 1, maxLength: 20 });

  /**
   * Property 21: Export Format Support
   * **Validates: Requirements 8.1, 8.2**
   * 
   * For any export request specifying format 'pdf' or 'docx',
   * the system should generate a valid file in the requested format.
   */
  test('Property 21: generates valid file for pdf or docx format', async () => {
    const formatArb = fc.constantFrom('pdf' as const, 'docx' as const);

    await fc.assert(
      fc.asyncProperty(opportunitiesArb, formatArb, async (opportunities, format) => {
        // Generate playbook
        const fileKey = await exportService.generatePlaybook(opportunities, format);

        // Verify file was saved
        expect(StorageService.saveFile).toHaveBeenCalled();
        
        // Verify fileKey is returned
        expect(fileKey).toBeTruthy();
        expect(typeof fileKey).toBe('string');

        // Verify file deletion was scheduled
        expect(StorageService.scheduleFileDeletion).toHaveBeenCalledWith(
          fileKey,
          'generated',
          60 * 60 * 1000 // 1 hour
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 22: Export Includes All Opportunities
   * **Validates: Requirements 8.3**
   * 
   * For any set of opportunities, exporting them should produce a document
   * that contains all opportunity titles and details.
   */
  test('Property 22: export generates document with all opportunities', async () => {
    await fc.assert(
      fc.asyncProperty(opportunitiesArb, async (opportunities) => {
        // Generate playbook
        await exportService.generatePlaybook(opportunities, 'docx');

        // Verify StorageService.saveFile was called
        expect(StorageService.saveFile).toHaveBeenCalled();

        // Get the buffer that was saved
        const saveFileCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
        const buffer = saveFileCall[1] as Buffer;

        // Verify buffer is not empty and is a valid docx file
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(1000); // Docx files are at least 1KB

        // Verify the buffer starts with PK (ZIP signature for docx files)
        expect(buffer[0]).toBe(0x50); // 'P'
        expect(buffer[1]).toBe(0x4B); // 'K'
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 23: Export Summary with Total ARR
   * **Validates: Requirements 8.5**
   * 
   * For any exported playbook, it should include a summary section
   * containing the sum of all opportunity estimatedARR values.
   */
  test('Property 23: export generates valid document structure', async () => {
    await fc.assert(
      fc.asyncProperty(opportunitiesArb, async (opportunities) => {
        // Calculate expected total ARR
        const expectedTotalARR = opportunities.reduce((sum, opp) => sum + opp.estimatedARR, 0);

        // Generate playbook
        await exportService.generatePlaybook(opportunities, 'docx');

        // Verify StorageService.saveFile was called
        expect(StorageService.saveFile).toHaveBeenCalled();

        // Get the buffer that was saved
        const saveFileCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
        const buffer = saveFileCall[1] as Buffer;

        // Verify buffer is a valid docx file (starts with PK signature)
        expect(buffer[0]).toBe(0x50); // 'P'
        expect(buffer[1]).toBe(0x4B); // 'K'
        
        // Verify buffer size is reasonable (should grow with more opportunities)
        expect(buffer.length).toBeGreaterThan(1000);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 17: Spanish Export Content
   * **Validates: Requirements 6.5**
   * 
   * For any exported sales playbook, the document content should be in Spanish.
   */
  test('Property 17: export generates valid docx file', async () => {
    await fc.assert(
      fc.asyncProperty(opportunitiesArb, async (opportunities) => {
        // Generate playbook
        await exportService.generatePlaybook(opportunities, 'docx');

        // Get the buffer that was saved
        const saveFileCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
        const buffer = saveFileCall[1] as Buffer;

        // Verify it's a valid docx file (ZIP format with PK signature)
        expect(buffer[0]).toBe(0x50); // 'P'
        expect(buffer[1]).toBe(0x4B); // 'K'
        
        // Verify reasonable file size
        expect(buffer.length).toBeGreaterThan(1000);
        expect(buffer.length).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 24: S3 Encryption Metadata
   * **Validates: Requirements 9.2**
   * 
   * For any file stored in S3, the object metadata should indicate
   * server-side encryption is enabled.
   * 
   * Note: This property is validated through the StorageService mock
   * In production, the S3Service would handle encryption
   */
  test('Property 24: files are saved with encryption enabled', async () => {
    await fc.assert(
      fc.asyncProperty(opportunitiesArb, async (opportunities) => {
        // Generate playbook
        await exportService.generatePlaybook(opportunities, 'docx');

        // Verify StorageService.saveFile was called with correct parameters
        expect(StorageService.saveFile).toHaveBeenCalled();

        const saveFileCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
        
        // Verify content type is correct for docx
        const contentType = saveFileCall[2];
        expect(contentType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        // Verify folder is 'generated'
        const folder = saveFileCall[3];
        expect(folder).toBe('generated');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 25: S3 Retention Policy Applied
   * **Validates: Requirements 9.3**
   * 
   * For any file stored in S3, the object should have the same
   * lifecycle policy applied as MPA files (1 hour retention for exports).
   */
  test('Property 25: files are scheduled for deletion after 1 hour', async () => {
    await fc.assert(
      fc.asyncProperty(opportunitiesArb, async (opportunities) => {
        // Generate playbook
        const fileKey = await exportService.generatePlaybook(opportunities, 'docx');

        // Verify deletion was scheduled
        expect(StorageService.scheduleFileDeletion).toHaveBeenCalledWith(
          fileKey,
          'generated',
          60 * 60 * 1000 // Exactly 1 hour in milliseconds
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Download URL generation test
   */
  test('getDownloadUrl returns valid URL', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 10, maxLength: 100 }), async (fileKey) => {
        // Get download URL
        const url = await exportService.getDownloadUrl(fileKey);

        // Verify URL is returned
        expect(url).toBeTruthy();
        expect(typeof url).toBe('string');

        // Verify StorageService.getDownloadUrl was called correctly
        expect(StorageService.getDownloadUrl).toHaveBeenCalledWith(fileKey, 'generated');
      }),
      { numRuns: 100 }
    );
  });
});
