import { BedrockService, BedrockError } from '../BedrockService';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AnonymizedData, AnonymizationMapping } from '../../../../shared/types/opportunity.types';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('BedrockService - Unit Tests', () => {
  let bedrockService: BedrockService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock for the send method
    mockSend = jest.fn();
    (BedrockRuntimeClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));
    
    bedrockService = new BedrockService();
  });

  describe('Retry Logic', () => {
    const mockAnonymizedData: AnonymizedData = {
      mpaData: {
        dataSource: 'MPA',
        servers: [{
          hostname: 'HOST_001',
          ipAddress: 'IP_001',
          osName: 'Linux',
          osVersion: '7.9',
          numCpus: 4,
          totalRAM: 16384,
          environment: 'Production'
        }],
        databases: [],
        applications: [],
        serverApplicationMappings: [],
        serverCommunications: []
      },
      mraData: {
        maturityLevel: 3,
        securityGaps: ['Gap 1', 'Gap 2'],
        drStrategy: 'Test DR strategy',
        backupStrategy: 'Test backup strategy',
        complianceRequirements: ['HIPAA'],
        technicalDebt: ['Debt 1'],
        recommendations: ['Rec 1'],
        rawText: 'Test raw text'
      },
      mapping: {
        ipAddresses: new Map(),
        hostnames: new Map(),
        companyNames: new Map(),
        reverseMap: new Map()
      } as AnonymizationMapping
    };

    const mockSuccessResponse = {
      body: new TextEncoder().encode(JSON.stringify({
        content: [{
          text: JSON.stringify([{
            title: 'Test Opportunity',
            category: 'Seguridad',
            priority: 'High',
            estimatedARR: 100000,
            reasoning: 'Test reasoning',
            evidence: ['Evidence 1', 'Evidence 2'],
            talkingPoints: ['Point 1', 'Point 2', 'Point 3'],
            nextSteps: ['Step 1', 'Step 2'],
            relatedServices: ['Amazon EC2']
          }])
        }],
        usage: {
          input_tokens: 100,
          output_tokens: 200
        }
      }))
    };

    test('succeeds on first attempt', async () => {
      mockSend.mockResolvedValueOnce(mockSuccessResponse);

      const result = await bedrockService.analyzeOpportunities(mockAnonymizedData);

      expect(result.content).toBeDefined();
      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(200);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    test('retries on throttling error and succeeds', async () => {
      const throttlingError = new Error('ThrottlingException');
      throttlingError.name = 'ThrottlingException';

      mockSend
        .mockRejectedValueOnce(throttlingError)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await bedrockService.analyzeOpportunities(mockAnonymizedData);

      expect(result.content).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    test('retries on service unavailable error and succeeds', async () => {
      const serviceError = new Error('ServiceUnavailableException');
      serviceError.name = 'ServiceUnavailableException';

      mockSend
        .mockRejectedValueOnce(serviceError)
        .mockRejectedValueOnce(serviceError)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await bedrockService.analyzeOpportunities(mockAnonymizedData);

      expect(result.content).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    test('retries on timeout error and succeeds', async () => {
      const timeoutError = new Error('Request timed out');
      timeoutError.name = 'TimeoutError';

      mockSend
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await bedrockService.analyzeOpportunities(mockAnonymizedData);

      expect(result.content).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    test('fails after 3 retry attempts', async () => {
      const throttlingError = new Error('ThrottlingException');
      throttlingError.name = 'ThrottlingException';

      mockSend
        .mockRejectedValueOnce(throttlingError)
        .mockRejectedValueOnce(throttlingError)
        .mockRejectedValueOnce(throttlingError);

      await expect(bedrockService.analyzeOpportunities(mockAnonymizedData))
        .rejects
        .toThrow(BedrockError);

      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    test('does not retry on non-retryable error', async () => {
      const validationError = new Error('ValidationException');
      validationError.name = 'ValidationException';

      mockSend.mockRejectedValueOnce(validationError);

      await expect(bedrockService.analyzeOpportunities(mockAnonymizedData))
        .rejects
        .toThrow(BedrockError);

      // Should not retry, only 1 attempt
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    test('uses exponential backoff delays', async () => {
      const throttlingError = new Error('ThrottlingException');
      throttlingError.name = 'ThrottlingException';

      mockSend
        .mockRejectedValueOnce(throttlingError)
        .mockRejectedValueOnce(throttlingError)
        .mockResolvedValueOnce(mockSuccessResponse);

      const startTime = Date.now();
      await bedrockService.analyzeOpportunities(mockAnonymizedData);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have delays of 1s + 2s = 3s minimum
      // Allow some tolerance for execution time
      expect(duration).toBeGreaterThanOrEqual(2900);
      expect(mockSend).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for this test

    test('throws BedrockError with cause on failure', async () => {
      const originalError = new Error('Original error message');
      originalError.name = 'ValidationException';

      mockSend.mockRejectedValueOnce(originalError);

      try {
        await bedrockService.analyzeOpportunities(mockAnonymizedData);
        fail('Should have thrown BedrockError');
      } catch (error) {
        expect(error).toBeInstanceOf(BedrockError);
        expect((error as BedrockError).cause).toBe(originalError);
        expect((error as BedrockError).message).toContain('Original error message');
      }
    });
  });

  describe('Response Validation', () => {
    test('rejects response with invalid JSON', async () => {
      const invalidResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'Not valid JSON'
          }],
          usage: {
            input_tokens: 100,
            output_tokens: 200
          }
        }))
      };

      mockSend.mockResolvedValueOnce(invalidResponse);

      const mockAnonymizedData: AnonymizedData = {
        mpaData: {
          dataSource: 'MPA',
          servers: [],
          databases: [],
          applications: [],
          serverApplicationMappings: [],
          serverCommunications: []
        },
        mraData: {
          maturityLevel: 3,
          securityGaps: [],
          drStrategy: '',
          backupStrategy: '',
          complianceRequirements: [],
          technicalDebt: [],
          recommendations: [],
          rawText: ''
        },
        mapping: {
          ipAddresses: new Map(),
          hostnames: new Map(),
          companyNames: new Map(),
          reverseMap: new Map()
        } as AnonymizationMapping
      };

      await expect(bedrockService.analyzeOpportunities(mockAnonymizedData))
        .rejects
        .toThrow(BedrockError);
    });
  });

  describe('Prompt Building', () => {
    test('includes server count in prompt', () => {
      const data: AnonymizedData = {
        mpaData: {
          dataSource: 'MPA',
          servers: [
            { hostname: 'HOST_001', osName: 'Linux', osVersion: '7.9', numCpus: 4, totalRAM: 8192, environment: 'Production' },
            { hostname: 'HOST_002', osName: 'Windows', osVersion: '2019', numCpus: 8, totalRAM: 16384, environment: 'Production' }
          ],
          databases: [],
          applications: [],
          serverApplicationMappings: [],
          serverCommunications: []
        },
        mraData: {
          maturityLevel: 3,
          securityGaps: [],
          drStrategy: '',
          backupStrategy: '',
          complianceRequirements: [],
          technicalDebt: [],
          recommendations: [],
          rawText: ''
        },
        mapping: {
          ipAddresses: new Map(),
          hostnames: new Map(),
          companyNames: new Map(),
          reverseMap: new Map()
        } as AnonymizationMapping
      };

      const prompt = bedrockService.buildPrompt(data);

      expect(prompt).toContain('Total Servers: 2');
      expect(prompt).toContain('Total CPUs: 12');
      expect(prompt).toContain('Total RAM: 24.00 GB');
    });

    test('includes maturity level in prompt', () => {
      const data: AnonymizedData = {
        mpaData: {
          dataSource: 'MPA',
          servers: [],
          databases: [],
          applications: [],
          serverApplicationMappings: [],
          serverCommunications: []
        },
        mraData: {
          maturityLevel: 4,
          securityGaps: ['Gap 1', 'Gap 2'],
          drStrategy: 'Active-Active DR',
          backupStrategy: 'Daily backups',
          complianceRequirements: ['HIPAA', 'SOC2'],
          technicalDebt: ['Legacy system'],
          recommendations: ['Modernize'],
          rawText: 'Test'
        },
        mapping: {
          ipAddresses: new Map(),
          hostnames: new Map(),
          companyNames: new Map(),
          reverseMap: new Map()
        } as AnonymizationMapping
      };

      const prompt = bedrockService.buildPrompt(data);

      expect(prompt).toContain('Maturity Level: 4/5');
      expect(prompt).toContain('Gap 1');
      expect(prompt).toContain('Active-Active DR');
    });
  });
});
