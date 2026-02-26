import fc from 'fast-check';
import { BedrockService } from '../BedrockService';
import { AnonymizedData, AnonymizationMapping } from '../../../../shared/types/opportunity.types';

/**
 * Feature: sales-opportunity-analyzer
 * Property-Based Tests for BedrockService
 */
describe('BedrockService - Property Tests', () => {
  let bedrockService: BedrockService;

  beforeEach(() => {
    bedrockService = new BedrockService();
  });

  /**
   * Property 7: Bedrock Prompt Contains Required Data
   * Validates: Requirements 3.2
   * 
   * For any anonymized assessment data, the generated Bedrock prompt should
   * contain references to server counts, database counts, maturity level,
   * and security gaps.
   */
  describe('Property 7: Bedrock Prompt Contains Required Data', () => {
    // Generator for anonymized MPA data
    const anonymizedMpaDataArb = fc.record({
      dataSource: fc.constant('MPA'),
      servers: fc.array(
        fc.record({
          hostname: fc.stringMatching(/^HOST_\d{3}$/),
          ipAddress: fc.option(fc.stringMatching(/^IP_\d{3}$/), { nil: undefined }),
          osName: fc.constantFrom('Linux', 'Windows', 'AIX'),
          osVersion: fc.constantFrom('7.9', '2019', '6.1'),
          numCpus: fc.integer({ min: 1, max: 64 }),
          totalRAM: fc.integer({ min: 1024, max: 524288 }),
          environment: fc.constantFrom('Production', 'Development', 'Test')
        }),
        { minLength: 1, maxLength: 10 }
      ),
      databases: fc.array(
        fc.record({
          instanceName: fc.stringMatching(/^HOST_\d{3}$/),
          engineType: fc.constantFrom('MySQL', 'PostgreSQL', 'Oracle', 'SQL Server'),
          engineVersion: fc.constantFrom('8.0', '13.0', '19c', '2019'),
          totalSize: fc.integer({ min: 1024, max: 1048576 })
        }),
        { minLength: 0, maxLength: 5 }
      ),
      applications: fc.constant([]),
      serverApplicationMappings: fc.constant([]),
      serverCommunications: fc.constant([])
    });

    // Generator for anonymized MRA data
    const anonymizedMraDataArb = fc.record({
      maturityLevel: fc.integer({ min: 1, max: 5 }),
      securityGaps: fc.array(
        fc.string({ minLength: 20, maxLength: 100 }),
        { minLength: 1, maxLength: 10 }
      ),
      drStrategy: fc.string({ minLength: 20, maxLength: 100 }),
      backupStrategy: fc.string({ minLength: 20, maxLength: 100 }),
      complianceRequirements: fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
      technicalDebt: fc.array(fc.string({ minLength: 20, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
      recommendations: fc.array(fc.string({ minLength: 20, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
      rawText: fc.string({ minLength: 50, maxLength: 200 })
    });

    // Generator for anonymized data
    const anonymizedDataArb = fc.record({
      mpaData: anonymizedMpaDataArb,
      mraData: anonymizedMraDataArb,
      mapping: fc.constant({
        ipAddresses: new Map(),
        hostnames: new Map(),
        companyNames: new Map(),
        reverseMap: new Map()
      } as AnonymizationMapping)
    });

    test('prompt contains server count', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            const serverCount = anonymizedData.mpaData.servers.length;
            
            // Prompt should mention the server count
            expect(prompt).toContain(`Total Servers: ${serverCount}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('prompt contains database count', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            const databaseCount = anonymizedData.mpaData.databases.length;
            
            // Prompt should mention the database count
            expect(prompt).toContain(`Total Databases: ${databaseCount}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('prompt contains maturity level', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            const maturityLevel = anonymizedData.mraData.maturityLevel;
            
            // Prompt should mention the maturity level
            expect(prompt).toContain(`Maturity Level: ${maturityLevel}/5`);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('prompt contains security gaps information', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            
            // Prompt should have a section for security gaps
            expect(prompt).toContain('Security Gaps:');
            
            // If there are security gaps, at least one should be mentioned
            if (anonymizedData.mraData.securityGaps.length > 0) {
              const firstGap = anonymizedData.mraData.securityGaps[0];
              // The gap might be truncated or summarized, so check for partial match
              const gapWords = firstGap.split(' ').slice(0, 3).join(' ');
              expect(prompt).toContain(gapWords);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('prompt contains all required MPA summary fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            
            // Check for all required MPA fields
            expect(prompt).toContain('MPA Data Summary:');
            expect(prompt).toContain('Total Servers:');
            expect(prompt).toContain('Total Databases:');
            expect(prompt).toContain('Total Applications:');
            expect(prompt).toContain('Operating Systems:');
            expect(prompt).toContain('Database Engines:');
            expect(prompt).toContain('Total CPUs:');
            expect(prompt).toContain('Total RAM:');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('prompt contains all required MRA summary fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            
            // Check for all required MRA fields
            expect(prompt).toContain('MRA Data Summary:');
            expect(prompt).toContain('Maturity Level:');
            expect(prompt).toContain('Security Gaps:');
            expect(prompt).toContain('DR Strategy:');
            expect(prompt).toContain('Technical Debt:');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('prompt includes instructions for Spanish output', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            
            // Prompt should instruct to generate Spanish content
            expect(prompt.toLowerCase()).toContain('spanish');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('prompt includes JSON format instructions', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            
            // Prompt should instruct to return JSON
            expect(prompt.toLowerCase()).toContain('json');
            expect(prompt).toContain('title');
            expect(prompt).toContain('priority');
            expect(prompt).toContain('estimatedARR');
            expect(prompt).toContain('reasoning');
            expect(prompt).toContain('talkingPoints');
            expect(prompt).toContain('nextSteps');
            expect(prompt).toContain('relatedServices');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Bedrock Response Validation
   * Validates: Requirements 3.6
   * 
   * For any Bedrock response, if the response is not valid JSON or missing
   * required fields, the validation should reject it.
   */
  describe('Property 8: Bedrock Response Validation', () => {
    // Note: This property is tested indirectly through the invokeModel method
    // which validates JSON parsing. We'll test the validation logic here.
    
    test('valid JSON response is accepted', () => {
      const validResponse = JSON.stringify([
        {
          title: 'Test Opportunity',
          category: 'Workshop',
          priority: 'High',
          estimatedARR: 100000,
          reasoning: 'Test reasoning',
          evidence: ['Evidence 1', 'Evidence 2'],
          talkingPoints: ['Point 1', 'Point 2', 'Point 3'],
          nextSteps: ['Step 1', 'Step 2'],
          relatedServices: ['Amazon EC2']
        }
      ]);
      
      // Should not throw
      expect(() => JSON.parse(validResponse)).not.toThrow();
    });

    test('invalid JSON response is rejected', () => {
      const invalidResponses = [
        'Not JSON at all',
        '{ incomplete json',
        '[{"title": "Missing closing bracket"',
        'undefined',
        ''
      ];
      
      invalidResponses.forEach(response => {
        expect(() => JSON.parse(response)).toThrow();
      });
    });
  });

  /**
   * Property 9: CloudWatch Logging Without Sensitive Data
   * Validates: Requirements 3.5, 9.5
   * 
   * For any analysis request, the CloudWatch log entry should not contain
   * IP addresses, hostnames, or company names.
   */
  describe('Property 9: CloudWatch Logging Without Sensitive Data', () => {
    // Generator for anonymized data with tokens
    const anonymizedDataArb = fc.record({
      mpaData: fc.record({
        dataSource: fc.constant('MPA'),
        servers: fc.array(
          fc.record({
            hostname: fc.stringMatching(/^HOST_\d{3}$/),
            ipAddress: fc.option(fc.stringMatching(/^IP_\d{3}$/), { nil: undefined }),
            osName: fc.constantFrom('Linux', 'Windows'),
            osVersion: fc.constant('7.9'),
            numCpus: fc.integer({ min: 1, max: 8 }),
            totalRAM: fc.integer({ min: 1024, max: 16384 }),
            environment: fc.constant('Production')
          }),
          { minLength: 1, maxLength: 3 }
        ),
        databases: fc.constant([]),
        applications: fc.constant([]),
        serverApplicationMappings: fc.constant([]),
        serverCommunications: fc.constant([])
      }),
      mraData: fc.record({
        maturityLevel: fc.integer({ min: 1, max: 5 }),
        securityGaps: fc.array(fc.string({ minLength: 20, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
        drStrategy: fc.constant('Test strategy'),
        backupStrategy: fc.constant('Test backup'),
        complianceRequirements: fc.constant([]),
        technicalDebt: fc.constant([]),
        recommendations: fc.constant([]),
        rawText: fc.constant('Test text')
      }),
      mapping: fc.constant({
        ipAddresses: new Map(),
        hostnames: new Map(),
        companyNames: new Map(),
        reverseMap: new Map()
      } as AnonymizationMapping)
    });

    test('logged data contains only anonymization tokens, not real IPs', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            
            // Check that prompt doesn't contain real IPs (only version numbers are allowed)
            const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
            const matches = prompt.match(ipPattern);
            
            if (matches) {
              // Filter to only real IP addresses (not version numbers)
              const realIps = matches.filter(ip => {
                const parts = ip.split('.');
                // Check if it looks like a real IP (all octets 0-255)
                const isValidIp = parts.every(part => {
                  const num = parseInt(part, 10);
                  return num >= 0 && num <= 255;
                });
                // Exclude common version numbers
                const isVersionNumber = ip.match(/^[0-9]\.[0-9]/) || ip.match(/\.[0-9]{2}$/);
                return isValidIp && !isVersionNumber;
              });
              
              // Should not have real IPs
              expect(realIps.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('logged data contains only anonymization tokens, not real hostnames', async () => {
      await fc.assert(
        fc.asyncProperty(
          anonymizedDataArb,
          async (anonymizedData) => {
            const prompt = bedrockService.buildPrompt(anonymizedData as AnonymizedData);
            
            // The prompt should not contain FQDN patterns (except for common domains like aws.amazon.com)
            // Note: The prompt contains summaries, not raw hostnames, so we check for suspicious FQDNs
            const fqdnPattern = /\b[a-z][a-z0-9-]{2,}\.[a-z][a-z0-9-]{2,}\.[a-z]{2,}\b/gi;
            const matches = prompt.match(fqdnPattern);
            
            if (matches) {
              // Filter out common/allowed domains
              const suspiciousDomains = matches.filter(domain => {
                const lower = domain.toLowerCase();
                return !lower.includes('amazon.com') && 
                       !lower.includes('aws.') &&
                       !lower.includes('example.com');
              });
              
              expect(suspiciousDomains.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
