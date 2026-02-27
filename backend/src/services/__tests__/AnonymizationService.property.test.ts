import fc from 'fast-check';
import { AnonymizationService } from '../AnonymizationService';
import { ExcelData } from '../../../../shared/types/assessment.types';
import { MraData } from '../../../../shared/types/opportunity.types';

/**
 * Feature: sales-opportunity-analyzer
 * Property-Based Tests for AnonymizationService
 */
describe('AnonymizationService - Property Tests', () => {
  let anonymizationService: AnonymizationService;

  beforeEach(() => {
    anonymizationService = new AnonymizationService();
  });

  /**
   * Property 4: Comprehensive Sensitive Data Anonymization
   * Validates: Requirements 2.1, 2.2, 2.3, 2.6
   * 
   * For any assessment data containing IP addresses, hostnames, or company names,
   * after anonymization, none of these sensitive patterns should remain in the
   * anonymized output.
   */
  describe('Property 4: Comprehensive Sensitive Data Anonymization', () => {
    // Generator for IP addresses
    const ipAddressArb = fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

    // Generator for hostnames (FQDN)
    const hostnameArb = fc.tuple(
      fc.stringMatching(/^[a-z][a-z0-9-]{1,10}$/),
      fc.stringMatching(/^[a-z][a-z0-9-]{1,10}$/),
      fc.constantFrom('com', 'net', 'org', 'io', 'local')
    ).map(([subdomain, domain, tld]) => `${subdomain}.${domain}.${tld}`);

    // Generator for company names
    const companyNameArb = fc.tuple(
      fc.stringMatching(/^[A-Z][a-z]{3,10}$/),
      fc.constantFrom('Inc', 'LLC', 'Corp', 'Ltd')
    ).map(([name, suffix]) => `${name} ${suffix}`);

    // Generator for MPA data with sensitive information
    const mpaDataArb = fc.record({
      dataSource: fc.constant('MPA'),
      servers: fc.array(
        fc.record({
          hostname: hostnameArb,
          ipAddress: fc.option(ipAddressArb, { nil: undefined }),
          osName: fc.constantFrom('Linux', 'Windows', 'AIX'),
          osVersion: fc.constantFrom('7.9', '2019', '6.1'),
          numCpus: fc.integer({ min: 1, max: 64 }),
          totalRAM: fc.integer({ min: 1024, max: 524288 }),
          environment: fc.constantFrom('Production', 'Development', 'Test')
        }),
        { minLength: 1, maxLength: 5 }
      ),
      databases: fc.array(
        fc.record({
          instanceName: hostnameArb,
          engineType: fc.constantFrom('MySQL', 'PostgreSQL', 'Oracle', 'SQL Server'),
          engineVersion: fc.constantFrom('8.0', '13.0', '19c', '2019'),
          totalSize: fc.integer({ min: 1024, max: 1048576 })
        }),
        { minLength: 0, maxLength: 3 }
      ),
      applications: fc.array(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 20 }),
          description: fc.string({ minLength: 10, maxLength: 50 }),
          totalConnections: fc.integer({ min: 0, max: 100 }),
          environmentType: fc.constantFrom('Production', 'Development', 'Test')
        }),
        { minLength: 0, maxLength: 3 }
      ),
      serverApplicationMappings: fc.constant([]),
      serverCommunications: fc.array(
        fc.record({
          sourceHostname: hostnameArb,
          targetHostname: hostnameArb,
          sourceIpAddress: fc.option(ipAddressArb, { nil: undefined }),
          targetIpAddress: fc.option(ipAddressArb, { nil: undefined }),
          protocol: fc.constantFrom('TCP', 'UDP', 'HTTP', 'HTTPS'),
          destinationPort: fc.integer({ min: 1, max: 65535 })
        }),
        { minLength: 0, maxLength: 5 }
      )
    });

    // Generator for MRA data with sensitive information
    const mraDataArb = fc.record({
      maturityLevel: fc.integer({ min: 1, max: 5 }),
      securityGaps: fc.array(
        fc.tuple(fc.string({ minLength: 10, maxLength: 50 }), fc.option(ipAddressArb, { nil: undefined }))
          .map(([text, ip]) => ip ? `${text} at ${ip}` : text),
        { minLength: 1, maxLength: 5 }
      ),
      drStrategy: fc.tuple(fc.string({ minLength: 20, maxLength: 100 }), fc.option(hostnameArb, { nil: undefined }))
        .map(([text, hostname]) => hostname ? `${text} on ${hostname}` : text),
      backupStrategy: fc.string({ minLength: 20, maxLength: 100 }),
      complianceRequirements: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 0, maxLength: 3 }),
      technicalDebt: fc.array(
        fc.tuple(fc.string({ minLength: 10, maxLength: 50 }), fc.option(companyNameArb, { nil: undefined }))
          .map(([text, company]) => company ? `${text} from ${company}` : text),
        { minLength: 0, maxLength: 5 }
      ),
      recommendations: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
      rawText: fc.tuple(
        fc.string({ minLength: 50, maxLength: 200 }),
        fc.option(ipAddressArb, { nil: undefined }),
        fc.option(hostnameArb, { nil: undefined }),
        fc.option(companyNameArb, { nil: undefined })
      ).map(([text, ip, hostname, company]) => {
        let result = text;
        if (ip) result += ` IP: ${ip}`;
        if (hostname) result += ` Host: ${hostname}`;
        if (company) result += ` Company: ${company}`;
        return result;
      })
    });

    test('removes all IP addresses from anonymized output', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Convert anonymized data to JSON string for pattern checking
            const anonymizedJson = JSON.stringify(result.mpaData) + JSON.stringify(result.mraData);
            
            // Check for IP addresses (excluding version numbers)
            const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
            const matches = anonymizedJson.match(ipPattern);
            
            if (matches) {
              // Filter to only real IP addresses (each octet 0-255)
              const realIps = matches.filter(ip => {
                const parts = ip.split('.');
                return parts.every(part => {
                  const num = parseInt(part, 10);
                  return num >= 0 && num <= 255;
                });
              });
              
              // No real IP addresses should remain
              expect(realIps).toEqual([]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('removes all hostnames from anonymized output', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            // Collect all original hostnames
            const originalHostnames = new Set<string>();
            
            mpaData.servers.forEach(s => originalHostnames.add(s.hostname));
            mpaData.databases.forEach(d => originalHostnames.add(d.instanceName));
            mpaData.serverCommunications.forEach(c => {
              originalHostnames.add(c.sourceHostname);
              originalHostnames.add(c.targetHostname);
            });
            
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            const anonymizedJson = JSON.stringify(result.mpaData) + JSON.stringify(result.mraData);
            
            // Check that none of the original hostnames appear in anonymized output
            originalHostnames.forEach(hostname => {
              expect(anonymizedJson).not.toContain(hostname);
            });
            
            // Verify anonymization tokens are present
            expect(anonymizedJson).toMatch(/HOST_\d{3}/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('removes all company names from anonymized output', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            const anonymizedJson = JSON.stringify(result.mpaData) + JSON.stringify(result.mraData);
            
            // Company name pattern - should not find any company names with suffixes
            const companyPattern = /\b[A-Z][a-zA-Z0-9&\-\s]{2,30}(?:\s+(?:Inc|LLC|Corp|Corporation|Ltd|Limited))\.?\b/g;
            const matches = anonymizedJson.match(companyPattern);
            
            // Should not find any company names (or only generic ones that are allowed)
            if (matches) {
              const genericTerms = ['The Company', 'The Organization', 'The Client'];
              const nonGeneric = matches.filter(m => 
                !genericTerms.some(g => m.includes(g))
              );
              expect(nonGeneric.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validates that anonymization tokens are present', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            const anonymizedJson = JSON.stringify(result.mpaData) + JSON.stringify(result.mraData);
            
            // Should have anonymization tokens if there was data to anonymize
            const hasServers = mpaData.servers.length > 0;
            const hasDatabases = mpaData.databases.length > 0;
            const hasCommunications = mpaData.serverCommunications.length > 0;
            
            if (hasServers || hasDatabases || hasCommunications) {
              // Should have HOST tokens
              expect(anonymizedJson).toMatch(/HOST_\d{3}/);
            }
            
            // Check for IP tokens if there were IPs in the data
            const hasIps = mpaData.servers.some(s => s.ipAddress) || 
                          mpaData.serverCommunications.some(c => c.sourceIpAddress || c.targetIpAddress);
            
            if (hasIps) {
              expect(anonymizedJson).toMatch(/IP_\d{3}/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('maintains bidirectional mapping for all anonymized values', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Check that all mappings have reverse mappings
            result.mapping.ipAddresses.forEach((token, original) => {
              expect(result.mapping.reverseMap.get(token)).toBe(original);
            });
            
            result.mapping.hostnames.forEach((token, original) => {
              expect(result.mapping.reverseMap.get(token)).toBe(original);
            });
            
            result.mapping.companyNames.forEach((token, original) => {
              expect(result.mapping.reverseMap.get(token)).toBe(original);
            });
            
            // Verify reverse map size equals sum of all forward maps
            const totalMappings = result.mapping.ipAddresses.size + 
                                 result.mapping.hostnames.size + 
                                 result.mapping.companyNames.size;
            expect(result.mapping.reverseMap.size).toBe(totalMappings);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Preservation of Non-Sensitive Data
   * Validates: Requirements 2.4
   * 
   * For any assessment data containing architecture patterns, technology stacks,
   * maturity levels, or gap information, after anonymization, these elements
   * should remain unchanged in the anonymized output.
   */
  describe('Property 5: Preservation of Non-Sensitive Data', () => {
    const mpaDataArb = fc.record({
      dataSource: fc.constant('MPA'),
      servers: fc.array(
        fc.record({
          hostname: fc.string({ minLength: 5, maxLength: 20 }),
          ipAddress: fc.option(fc.string({ minLength: 7, maxLength: 15 }), { nil: undefined }),
          osName: fc.constantFrom('Linux', 'Windows', 'AIX', 'Solaris'),
          osVersion: fc.constantFrom('7.9', '2019', '6.1', '11'),
          numCpus: fc.integer({ min: 1, max: 64 }),
          totalRAM: fc.integer({ min: 1024, max: 524288 }),
          environment: fc.constantFrom('Production', 'Development', 'Test', 'Staging')
        }),
        { minLength: 1, maxLength: 5 }
      ),
      databases: fc.array(
        fc.record({
          instanceName: fc.string({ minLength: 5, maxLength: 20 }),
          engineType: fc.constantFrom('MySQL', 'PostgreSQL', 'Oracle', 'SQL Server', 'MongoDB'),
          engineVersion: fc.constantFrom('8.0', '13.0', '19c', '2019', '5.0'),
          totalSize: fc.integer({ min: 1024, max: 1048576 })
        }),
        { minLength: 0, maxLength: 3 }
      ),
      applications: fc.constant([]),
      serverApplicationMappings: fc.constant([]),
      serverCommunications: fc.array(
        fc.record({
          sourceHostname: fc.string({ minLength: 5, maxLength: 20 }),
          targetHostname: fc.string({ minLength: 5, maxLength: 20 }),
          sourceIpAddress: fc.option(fc.string({ minLength: 7, maxLength: 15 }), { nil: undefined }),
          targetIpAddress: fc.option(fc.string({ minLength: 7, maxLength: 15 }), { nil: undefined }),
          protocol: fc.constantFrom('TCP', 'UDP', 'HTTP', 'HTTPS', 'SSH'),
          destinationPort: fc.integer({ min: 1, max: 65535 })
        }),
        { minLength: 0, maxLength: 5 }
      )
    });

    const mraDataArb = fc.record({
      maturityLevel: fc.integer({ min: 1, max: 5 }),
      securityGaps: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
      drStrategy: fc.string({ minLength: 20, maxLength: 100 }),
      backupStrategy: fc.string({ minLength: 20, maxLength: 100 }),
      complianceRequirements: fc.array(
        fc.constantFrom('HIPAA', 'PCI-DSS', 'SOC2', 'ISO27001', 'GDPR'),
        { minLength: 0, maxLength: 3 }
      ),
      technicalDebt: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
      recommendations: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
      rawText: fc.string({ minLength: 50, maxLength: 200 })
    });

    test('preserves maturity levels', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const originalMaturityLevel = mraData.maturityLevel;
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            expect(result.mraData.maturityLevel).toBe(originalMaturityLevel);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('preserves technology stack information', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const originalOsNames = mpaData.servers.map(s => s.osName);
            const originalEngineTypes = mpaData.databases.map(d => d.engineType);
            const originalProtocols = mpaData.serverCommunications.map(c => c.protocol);
            
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Check that OS names are preserved
            const anonymizedOsNames = result.mpaData.servers.map((s: any) => s.osName);
            expect(anonymizedOsNames).toEqual(originalOsNames);
            
            // Check that database engine types are preserved
            const anonymizedEngineTypes = result.mpaData.databases.map((d: any) => d.engineType);
            expect(anonymizedEngineTypes).toEqual(originalEngineTypes);
            
            // Check that protocols are preserved
            const anonymizedProtocols = result.mpaData.serverCommunications.map((c: any) => c.protocol);
            expect(anonymizedProtocols).toEqual(originalProtocols);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('preserves architecture patterns (CPU, RAM, environment)', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const originalCpus = mpaData.servers.map(s => s.numCpus);
            const originalRam = mpaData.servers.map(s => s.totalRAM);
            const originalEnvs = mpaData.servers.map(s => s.environment);
            
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Check that CPU counts are preserved
            const anonymizedCpus = result.mpaData.servers.map((s: any) => s.numCpus);
            expect(anonymizedCpus).toEqual(originalCpus);
            
            // Check that RAM values are preserved
            const anonymizedRam = result.mpaData.servers.map((s: any) => s.totalRAM);
            expect(anonymizedRam).toEqual(originalRam);
            
            // Check that environments are preserved
            const anonymizedEnvs = result.mpaData.servers.map((s: any) => s.environment);
            expect(anonymizedEnvs).toEqual(originalEnvs);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('preserves compliance requirements', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const originalCompliance = [...mraData.complianceRequirements];
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Compliance requirements should be preserved
            expect(result.mraData.complianceRequirements).toEqual(originalCompliance);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('preserves database sizes and versions', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const originalSizes = mpaData.databases.map(d => d.totalSize);
            const originalVersions = mpaData.databases.map(d => d.engineVersion);
            
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Check that database sizes are preserved
            const anonymizedSizes = result.mpaData.databases.map((d: any) => d.totalSize);
            expect(anonymizedSizes).toEqual(originalSizes);
            
            // Check that engine versions are preserved
            const anonymizedVersions = result.mpaData.databases.map((d: any) => d.engineVersion);
            expect(anonymizedVersions).toEqual(originalVersions);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('preserves port numbers', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            const originalPorts = mpaData.serverCommunications.map(c => c.destinationPort);
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Check that port numbers are preserved
            const anonymizedPorts = result.mpaData.serverCommunications.map((c: any) => c.destinationPort);
            expect(anonymizedPorts).toEqual(originalPorts);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Anonymization Round-Trip
   * Validates: Requirements 2.5
   * 
   * For any assessment data, anonymizing then deanonymizing should produce
   * data equivalent to the original.
   */
  describe('Property 6: Anonymization Round-Trip', () => {
    // Generator for IP addresses
    const ipAddressArb = fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

    // Generator for hostnames (FQDN)
    const hostnameArb = fc.tuple(
      fc.stringMatching(/^[a-z][a-z0-9-]{1,10}$/),
      fc.stringMatching(/^[a-z][a-z0-9-]{1,10}$/),
      fc.constantFrom('com', 'net', 'org', 'io', 'local')
    ).map(([subdomain, domain, tld]) => `${subdomain}.${domain}.${tld}`);

    // Generator for company names
    const companyNameArb = fc.tuple(
      fc.stringMatching(/^[A-Z][a-z]{3,10}$/),
      fc.constantFrom('Inc', 'LLC', 'Corp', 'Ltd')
    ).map(([name, suffix]) => `${name} ${suffix}`);

    // Generator for text with embedded sensitive data
    const textWithSensitiveDataArb = fc.tuple(
      fc.string({ minLength: 20, maxLength: 100 }),
      fc.array(ipAddressArb, { minLength: 0, maxLength: 3 }),
      fc.array(hostnameArb, { minLength: 0, maxLength: 3 }),
      fc.array(companyNameArb, { minLength: 0, maxLength: 2 })
    ).map(([baseText, ips, hostnames, companies]) => {
      let text = baseText;
      ips.forEach(ip => { text += ` IP: ${ip}`; });
      hostnames.forEach(host => { text += ` Host: ${host}`; });
      companies.forEach(company => { text += ` Company: ${company}`; });
      return text;
    });

    const mpaDataArb = fc.record({
      dataSource: fc.constant('MPA'),
      servers: fc.array(
        fc.record({
          hostname: hostnameArb,
          ipAddress: fc.option(ipAddressArb, { nil: undefined }),
          osName: fc.constantFrom('Linux', 'Windows', 'AIX'),
          osVersion: fc.constantFrom('7.9', '2019', '6.1'),
          numCpus: fc.integer({ min: 1, max: 64 }),
          totalRAM: fc.integer({ min: 1024, max: 524288 }),
          environment: fc.constantFrom('Production', 'Development', 'Test')
        }),
        { minLength: 1, maxLength: 3 }
      ),
      databases: fc.array(
        fc.record({
          instanceName: hostnameArb,
          engineType: fc.constantFrom('MySQL', 'PostgreSQL', 'Oracle'),
          engineVersion: fc.constantFrom('8.0', '13.0', '19c'),
          totalSize: fc.integer({ min: 1024, max: 1048576 })
        }),
        { minLength: 0, maxLength: 2 }
      ),
      applications: fc.constant([]),
      serverApplicationMappings: fc.constant([]),
      serverCommunications: fc.array(
        fc.record({
          sourceHostname: hostnameArb,
          targetHostname: hostnameArb,
          sourceIpAddress: fc.option(ipAddressArb, { nil: undefined }),
          targetIpAddress: fc.option(ipAddressArb, { nil: undefined }),
          protocol: fc.constantFrom('TCP', 'UDP', 'HTTP'),
          destinationPort: fc.integer({ min: 1, max: 65535 })
        }),
        { minLength: 0, maxLength: 3 }
      )
    });

    const mraDataArb = fc.record({
      maturityLevel: fc.integer({ min: 1, max: 5 }),
      securityGaps: fc.array(textWithSensitiveDataArb, { minLength: 1, maxLength: 3 }),
      drStrategy: textWithSensitiveDataArb,
      backupStrategy: textWithSensitiveDataArb,
      complianceRequirements: fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 0, maxLength: 2 }),
      technicalDebt: fc.array(textWithSensitiveDataArb, { minLength: 0, maxLength: 3 }),
      recommendations: fc.array(textWithSensitiveDataArb, { minLength: 0, maxLength: 3 }),
      rawText: textWithSensitiveDataArb
    });

    test('deanonymizing anonymized text restores original sensitive data', async () => {
      await fc.assert(
        fc.asyncProperty(
          textWithSensitiveDataArb,
          async (originalText) => {
            // Create minimal MPA/MRA data with the text
            const mpaData = {
              dataSource: 'MPA',
              servers: [],
              databases: [],
              applications: [],
              serverApplicationMappings: [],
              serverCommunications: []
            };
            
            const mraData = {
              maturityLevel: 3,
              securityGaps: [originalText],
              drStrategy: '',
              backupStrategy: '',
              complianceRequirements: [],
              technicalDebt: [],
              recommendations: [],
              rawText: ''
            };
            
            // Anonymize
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Get anonymized text
            const anonymizedText = result.mraData.securityGaps![0];
            
            // Deanonymize
            const deanonymizedText = anonymizationService.deanonymize(anonymizedText, result.mapping);
            
            // Should match original
            expect(deanonymizedText).toBe(originalText);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('round-trip preserves all MRA text fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          mpaDataArb,
          mraDataArb,
          async (mpaData, mraData) => {
            // Store original text fields
            const originalSecurityGaps = [...mraData.securityGaps];
            const originalDrStrategy = mraData.drStrategy;
            const originalBackupStrategy = mraData.backupStrategy;
            const originalTechnicalDebt = [...mraData.technicalDebt];
            const originalRecommendations = [...mraData.recommendations];
            const originalRawText = mraData.rawText;
            
            // Anonymize
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Deanonymize each field
            const deanonymizedSecurityGaps = result.mraData.securityGaps!.map(gap => 
              anonymizationService.deanonymize(gap, result.mapping)
            );
            const deanonymizedDrStrategy = anonymizationService.deanonymize(
              result.mraData.drStrategy!, result.mapping
            );
            const deanonymizedBackupStrategy = anonymizationService.deanonymize(
              result.mraData.backupStrategy!, result.mapping
            );
            const deanonymizedTechnicalDebt = result.mraData.technicalDebt!.map(debt => 
              anonymizationService.deanonymize(debt, result.mapping)
            );
            const deanonymizedRecommendations = result.mraData.recommendations!.map(rec => 
              anonymizationService.deanonymize(rec, result.mapping)
            );
            const deanonymizedRawText = anonymizationService.deanonymize(
              result.mraData.rawText!, result.mapping
            );
            
            // Verify all fields match original
            expect(deanonymizedSecurityGaps).toEqual(originalSecurityGaps);
            expect(deanonymizedDrStrategy).toBe(originalDrStrategy);
            expect(deanonymizedBackupStrategy).toBe(originalBackupStrategy);
            expect(deanonymizedTechnicalDebt).toEqual(originalTechnicalDebt);
            expect(deanonymizedRecommendations).toEqual(originalRecommendations);
            expect(deanonymizedRawText).toBe(originalRawText);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('round-trip works with multiple occurrences of same sensitive value', async () => {
      await fc.assert(
        fc.asyncProperty(
          ipAddressArb,
          hostnameArb,
          async (ip, hostname) => {
            // Create text with repeated sensitive values
            const originalText = `Server ${hostname} at ${ip} connects to ${hostname} using ${ip}`;
            
            const mpaData = {
              dataSource: 'MPA',
              servers: [],
              databases: [],
              applications: [],
              serverApplicationMappings: [],
              serverCommunications: []
            };
            
            const mraData = {
              maturityLevel: 3,
              securityGaps: [originalText],
              drStrategy: '',
              backupStrategy: '',
              complianceRequirements: [],
              technicalDebt: [],
              recommendations: [],
              rawText: ''
            };
            
            // Anonymize
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            const anonymizedText = result.mraData.securityGaps![0];
            
            // Verify anonymization happened
            expect(anonymizedText).not.toContain(ip);
            expect(anonymizedText).not.toContain(hostname);
            
            // Deanonymize
            const deanonymizedText = anonymizationService.deanonymize(anonymizedText, result.mapping);
            
            // Should match original exactly
            expect(deanonymizedText).toBe(originalText);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('mapping consistency: each unique value gets unique token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(ipAddressArb, { minLength: 2, maxLength: 10 }),
          fc.array(hostnameArb, { minLength: 2, maxLength: 10 }),
          async (ips, hostnames) => {
            // Create unique sets
            const uniqueIps = [...new Set(ips)];
            const uniqueHostnames = [...new Set(hostnames)];
            
            // Create text with all values
            const text = `IPs: ${uniqueIps.join(', ')} Hosts: ${uniqueHostnames.join(', ')}`;
            
            const mpaData = {
              dataSource: 'MPA',
              servers: [],
              databases: [],
              applications: [],
              serverApplicationMappings: [],
              serverCommunications: []
            };
            
            const mraData = {
              maturityLevel: 3,
              securityGaps: [text],
              drStrategy: '',
              backupStrategy: '',
              complianceRequirements: [],
              technicalDebt: [],
              recommendations: [],
              rawText: ''
            };
            
            // Anonymize
            const result = anonymizationService.anonymize(mpaData as ExcelData, mraData as MraData);
            
            // Each unique IP should have unique token
            expect(result.mapping.ipAddresses.size).toBe(uniqueIps.length);
            
            // Each unique hostname should have unique token
            expect(result.mapping.hostnames.size).toBe(uniqueHostnames.length);
            
            // Deanonymize should restore original
            const deanonymized = anonymizationService.deanonymize(
              result.mraData.securityGaps![0], 
              result.mapping
            );
            expect(deanonymized).toBe(text);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
