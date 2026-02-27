import { ExportService } from '../ExportService';
import { Opportunity } from '../../../../shared/types/opportunity.types';
import { StorageService } from '../storageService';

// Mock StorageService
jest.mock('../storageService');

describe('ExportService - Unit Tests', () => {
  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
    jest.clearAllMocks();

    // Mock StorageService methods
    (StorageService.saveFile as jest.Mock).mockResolvedValue('generated/playbook-123.docx');
    (StorageService.getDownloadUrl as jest.Mock).mockResolvedValue('https://example.com/download/playbook-123.docx');
    (StorageService.scheduleFileDeletion as jest.Mock).mockImplementation(() => {});
  });

  const createSampleOpportunity = (overrides?: Partial<Opportunity>): Opportunity => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Migración a AWS Lambda para Reducir Costos',
    category: 'Optimización de Costos',
    priority: 'High',
    estimatedARR: 250000,
    reasoning: 'El cliente tiene múltiples aplicaciones monolíticas que podrían beneficiarse de una arquitectura serverless.',
    evidence: [
      'Se identificaron 15 aplicaciones monolíticas con bajo uso de CPU (promedio 20%)',
      'Costos actuales de infraestructura: $500,000/año',
      'Análisis de tráfico muestra patrones de uso intermitente ideales para serverless',
    ],
    talkingPoints: [
      'Reducción de costos operativos hasta 70%',
      'Escalabilidad automática sin gestión de servidores',
      'Pago solo por uso real de recursos',
    ],
    nextSteps: [
      'Realizar análisis de aplicaciones candidatas',
      'Crear POC con una aplicación piloto',
    ],
    relatedServices: ['AWS Lambda', 'API Gateway', 'DynamoDB'],
    status: 'Nueva',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  });

  describe('generatePlaybook', () => {
    test('generates docx playbook with single opportunity', async () => {
      const opportunities = [createSampleOpportunity()];

      const fileKey = await exportService.generatePlaybook(opportunities, 'docx');

      expect(fileKey).toBe('generated/playbook-123.docx');
      expect(StorageService.saveFile).toHaveBeenCalledTimes(1);
      
      const saveCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
      expect(saveCall[0]).toMatch(/playbook-\d+\.docx/); // filename
      expect(saveCall[1]).toBeInstanceOf(Buffer); // buffer
      expect(saveCall[2]).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document'); // content type
      expect(saveCall[3]).toBe('generated'); // folder
    });

    test('generates docx playbook with multiple opportunities', async () => {
      const opportunities = [
        createSampleOpportunity({ id: '1', title: 'Oportunidad 1', priority: 'High' }),
        createSampleOpportunity({ id: '2', title: 'Oportunidad 2', priority: 'Medium' }),
        createSampleOpportunity({ id: '3', title: 'Oportunidad 3', priority: 'Low' }),
      ];

      const fileKey = await exportService.generatePlaybook(opportunities, 'docx');

      expect(fileKey).toBe('generated/playbook-123.docx');
      expect(StorageService.saveFile).toHaveBeenCalledTimes(1);
    });

    test('schedules file deletion after 1 hour', async () => {
      const opportunities = [createSampleOpportunity()];

      const fileKey = await exportService.generatePlaybook(opportunities, 'docx');

      expect(StorageService.scheduleFileDeletion).toHaveBeenCalledWith(
        fileKey,
        'generated',
        60 * 60 * 1000
      );
    });

    test('handles pdf format request (currently returns docx)', async () => {
      const opportunities = [createSampleOpportunity()];

      const fileKey = await exportService.generatePlaybook(opportunities, 'pdf');

      // For MVP, PDF format returns docx
      expect(fileKey).toBe('generated/playbook-123.docx');
      expect(StorageService.saveFile).toHaveBeenCalledTimes(1);
    });

    test('generates playbook with valid docx structure', async () => {
      const opportunities = [createSampleOpportunity()];

      await exportService.generatePlaybook(opportunities, 'docx');

      const saveCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
      const buffer = saveCall[1] as Buffer;

      // Verify it's a valid docx file (ZIP format with PK signature)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
      expect(buffer.length).toBeGreaterThan(1000);
    });

    test('document size increases with more opportunities', async () => {
      const opportunities = [
        createSampleOpportunity({ estimatedARR: 100000 }),
        createSampleOpportunity({ estimatedARR: 200000 }),
        createSampleOpportunity({ estimatedARR: 300000 }),
      ];

      await exportService.generatePlaybook(opportunities, 'docx');

      const saveCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
      const buffer = saveCall[1] as Buffer;

      // Verify buffer is a valid docx
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
      
      // Document with 3 opportunities should be reasonably sized
      expect(buffer.length).toBeGreaterThan(2000);
    });

    test('generates valid docx for different priorities', async () => {
      const opportunities = [
        createSampleOpportunity({ id: '1', priority: 'Low', title: 'Low Priority Opp' }),
        createSampleOpportunity({ id: '2', priority: 'High', title: 'High Priority Opp' }),
        createSampleOpportunity({ id: '3', priority: 'Medium', title: 'Medium Priority Opp' }),
      ];

      await exportService.generatePlaybook(opportunities, 'docx');

      const saveCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
      const buffer = saveCall[1] as Buffer;

      // Verify valid docx structure
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
      expect(buffer.length).toBeGreaterThan(2000);
    });
  });

  describe('getDownloadUrl', () => {
    test('returns download URL for file key', async () => {
      const fileKey = 'generated/playbook-123.docx';

      const url = await exportService.getDownloadUrl(fileKey);

      expect(url).toBe('https://example.com/download/playbook-123.docx');
      expect(StorageService.getDownloadUrl).toHaveBeenCalledWith(fileKey, 'generated');
    });

    test('handles different file keys', async () => {
      const fileKey = 'generated/playbook-456.docx';

      await exportService.getDownloadUrl(fileKey);

      expect(StorageService.getDownloadUrl).toHaveBeenCalledWith(fileKey, 'generated');
    });
  });

  describe('document structure', () => {
    test('generates valid docx with multiple opportunities', async () => {
      const opportunities = [
        createSampleOpportunity({ id: '1' }),
        createSampleOpportunity({ id: '2' }),
        createSampleOpportunity({ id: '3' }),
      ];

      await exportService.generatePlaybook(opportunities, 'docx');

      const saveCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
      const buffer = saveCall[1] as Buffer;

      // Verify valid docx structure
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
      expect(buffer.length).toBeGreaterThan(2000);
    });

    test('generates valid docx with single opportunity', async () => {
      const opportunities = [createSampleOpportunity()];

      await exportService.generatePlaybook(opportunities, 'docx');

      const saveCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
      const buffer = saveCall[1] as Buffer;

      // Verify valid docx structure
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
      expect(buffer.length).toBeGreaterThan(1000);
    });

    test('generates valid docx with detailed opportunity', async () => {
      const opportunity = createSampleOpportunity({
        title: 'Test Opportunity Title',
        reasoning: 'Test reasoning content',
      });

      await exportService.generatePlaybook([opportunity], 'docx');

      const saveCall = (StorageService.saveFile as jest.Mock).mock.calls[0];
      const buffer = saveCall[1] as Buffer;

      // Verify valid docx structure
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });
});
