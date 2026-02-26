import { AnonymizedData, AnonymizationMapping, QuestionnaireData } from '../../../shared/types/opportunity.types';
import { ExcelData } from '../../../shared/types/assessment.types';
import { MraData } from '../../../shared/types/opportunity.types';

export class AnonymizationService {
  // Regex patterns for sensitive data detection
  private readonly IP_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  private readonly HOSTNAME_PATTERN = /\b[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(?:\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\b/g;
  // Company name pattern - looks for capitalized words that might be company names
  private readonly COMPANY_PATTERN = /\b[A-Z][a-zA-Z0-9&\-\s]{2,30}(?:\s+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|GmbH|SA|SL))\.?\b/g;

  /**
   * Anonymize assessment data for AI processing
   * @param mpaData - MPA Excel data
   * @param mraData - MRA PDF data
   * @param questionnaireData - Optional questionnaire data
   * @returns Anonymized data and reverse mapping
   */
  anonymize(
    mpaData: ExcelData, 
    mraData: MraData, 
    questionnaireData?: QuestionnaireData
  ): AnonymizedData {
    const mapping: AnonymizationMapping = {
      ipAddresses: new Map<string, string>(),
      hostnames: new Map<string, string>(),
      companyNames: new Map<string, string>(),
      locations: new Map<string, string>(),
      contacts: new Map<string, string>(),
      reverseMap: new Map<string, string>()
    };

    // Anonymize MPA data
    const anonymizedMpaData = this.anonymizeMpaData(mpaData, mapping);

    // Anonymize MRA data
    const anonymizedMraData = this.anonymizeMraData(mraData, mapping);

    // Anonymize questionnaire data if provided
    const anonymizedQuestionnaireData = questionnaireData 
      ? this.anonymizeQuestionnaireData(questionnaireData, mapping)
      : undefined;

    // Validate no sensitive patterns remain
    this.validateAnonymization(anonymizedMpaData, anonymizedMraData, anonymizedQuestionnaireData);

    return {
      mpaData: anonymizedMpaData,
      mraData: anonymizedMraData,
      questionnaireData: anonymizedQuestionnaireData,
      mapping
    };
  }

  /**
   * Restore original values in AI response
   * @param response - Bedrock response text
   * @param mapping - Anonymization mapping
   * @returns Response with original values restored
   */
  deanonymize(response: string, mapping: AnonymizationMapping): string {
    let deanonymized = response;

    // Replace tokens with original values using reverse map
    for (const [token, original] of mapping.reverseMap.entries()) {
      const regex = new RegExp(this.escapeRegex(token), 'g');
      deanonymized = deanonymized.replace(regex, original);
    }

    return deanonymized;
  }

  /**
   * Anonymize MPA data
   */
  private anonymizeMpaData(mpaData: ExcelData, mapping: AnonymizationMapping): any {
    const anonymized: any = {
      dataSource: mpaData.dataSource,
      servers: [],
      databases: [],
      applications: [],
      serverApplicationMappings: [],
      serverCommunications: []
    };

    // Anonymize servers
    anonymized.servers = mpaData.servers.map(server => ({
      ...server,
      hostname: this.anonymizeHostname(server.hostname, mapping),
      ipAddress: server.ipAddress ? this.anonymizeIpAddress(server.ipAddress, mapping) : undefined,
      // Preserve technical specs
      osName: server.osName,
      osVersion: server.osVersion,
      numCpus: server.numCpus,
      totalRAM: server.totalRAM,
      environment: server.environment
    }));

    // Anonymize databases
    anonymized.databases = mpaData.databases.map(db => ({
      ...db,
      instanceName: this.anonymizeHostname(db.instanceName, mapping),
      // Preserve engine types and technical details
      engineType: db.engineType,
      engineVersion: db.engineVersion,
      totalSize: db.totalSize
    }));

    // Anonymize applications
    anonymized.applications = (mpaData.applications || []).map(app => ({
      ...app,
      name: this.anonymizeText(app.name, mapping),
      description: this.anonymizeText(app.description, mapping),
      // Preserve connection counts and types
      totalConnections: app.totalConnections,
      environmentType: app.environmentType
    }));

    // Anonymize server communications
    anonymized.serverCommunications = (mpaData.serverCommunications || []).map(comm => ({
      ...comm,
      sourceHostname: this.anonymizeHostname(comm.sourceHostname, mapping),
      targetHostname: this.anonymizeHostname(comm.targetHostname, mapping),
      sourceIpAddress: comm.sourceIpAddress ? this.anonymizeIpAddress(comm.sourceIpAddress, mapping) : undefined,
      targetIpAddress: comm.targetIpAddress ? this.anonymizeIpAddress(comm.targetIpAddress, mapping) : undefined,
      // Preserve protocol and port information
      protocol: comm.protocol,
      destinationPort: comm.destinationPort
    }));

    return anonymized;
  }

  /**
   * Anonymize MRA data
   */
  private anonymizeMraData(mraData: MraData, mapping: AnonymizationMapping): Partial<MraData> {
    return {
      // Preserve maturity level (not sensitive)
      maturityLevel: mraData.maturityLevel,
      
      // Anonymize text fields
      securityGaps: mraData.securityGaps.map(gap => this.anonymizeText(gap, mapping)),
      drStrategy: this.anonymizeText(mraData.drStrategy, mapping),
      backupStrategy: this.anonymizeText(mraData.backupStrategy, mapping),
      complianceRequirements: mraData.complianceRequirements.map(req => this.anonymizeText(req, mapping)),
      technicalDebt: mraData.technicalDebt.map(debt => this.anonymizeText(debt, mapping)),
      recommendations: mraData.recommendations.map(rec => this.anonymizeText(rec, mapping)),
      rawText: this.anonymizeText(mraData.rawText, mapping)
    };
  }

  /**
   * Anonymize Questionnaire data
   */
  private anonymizeQuestionnaireData(
    questionnaireData: QuestionnaireData, 
    mapping: AnonymizationMapping
  ): Partial<QuestionnaireData> {
    return {
      // Anonymize client information
      clientName: this.anonymizeCompanyName(questionnaireData.clientName, mapping),
      industry: questionnaireData.industry, // Not sensitive
      location: this.anonymizeText(questionnaireData.location, mapping),
      companySize: questionnaireData.companySize, // Not sensitive
      executiveContact: this.anonymizeText(questionnaireData.executiveContact, mapping),
      technicalContact: this.anonymizeText(questionnaireData.technicalContact, mapping),

      // Anonymize infrastructure
      primaryDatacenter: this.anonymizeText(questionnaireData.primaryDatacenter, mapping),
      secondaryDatacenters: questionnaireData.secondaryDatacenters.map(dc => this.anonymizeText(dc, mapping)),
      cloudProviders: questionnaireData.cloudProviders, // Not sensitive (AWS, Azure, etc.)
      connectivity: this.anonymizeText(questionnaireData.connectivity, mapping),

      // Workloads - anonymize application names that might contain company info
      criticalApplications: questionnaireData.criticalApplications.map(app => this.anonymizeText(app, mapping)),
      databases: questionnaireData.databases, // Technology names, not sensitive
      middleware: questionnaireData.middleware, // Technology names, not sensitive
      operatingSystems: questionnaireData.operatingSystems, // Not sensitive

      // Priorities - preserve as-is (business priorities, not sensitive)
      priorities: questionnaireData.priorities,

      // Constraints - anonymize specific details
      complianceRequirements: questionnaireData.complianceRequirements, // Standards like PCI-DSS, not sensitive
      maintenanceWindows: questionnaireData.maintenanceWindows, // Time windows, not sensitive
      migrationRestrictions: questionnaireData.migrationRestrictions.map(r => this.anonymizeText(r, mapping)),
      budget: questionnaireData.budget, // Keep budget ranges, not sensitive
      timeline: questionnaireData.timeline, // Dates, not sensitive

      // Current situation - anonymize vendor/company names
      licenseContracts: questionnaireData.licenseContracts.map(l => this.anonymizeText(l, mapping)),
      endOfSupport: questionnaireData.endOfSupport, // Technology EOL dates, not sensitive
      currentProblems: questionnaireData.currentProblems.map(p => this.anonymizeText(p, mapping)),
      ongoingProjects: questionnaireData.ongoingProjects.map(p => this.anonymizeText(p, mapping)),

      // Team - preserve capabilities, anonymize specific names
      teamSize: questionnaireData.teamSize, // Numbers, not sensitive
      awsExperience: questionnaireData.awsExperience, // Experience level, not sensitive
      certifications: questionnaireData.certifications, // Cert types, not sensitive
      currentSupport: questionnaireData.currentSupport.map(s => this.anonymizeText(s, mapping)),

      // Business objectives - preserve strategic info, anonymize specifics
      expectedGrowth: questionnaireData.expectedGrowth, // Percentages, not sensitive
      newMarkets: questionnaireData.newMarkets.map(m => this.anonymizeText(m, mapping)),
      digitalInitiatives: questionnaireData.digitalInitiatives.map(i => this.anonymizeText(i, mapping)),
      kpis: questionnaireData.kpis, // Metric types, not sensitive
      decisionDrivers: questionnaireData.decisionDrivers, // Business drivers, not sensitive

      // Raw text - fully anonymize
      rawText: this.anonymizeText(questionnaireData.rawText, mapping)
    };
  }

  /**
   * Anonymize an IP address
   */
  private anonymizeIpAddress(ip: string, mapping: AnonymizationMapping): string {
    if (mapping.ipAddresses.has(ip)) {
      return mapping.ipAddresses.get(ip)!;
    }

    const token = `IP_${String(mapping.ipAddresses.size + 1).padStart(3, '0')}`;
    mapping.ipAddresses.set(ip, token);
    mapping.reverseMap.set(token, ip);
    return token;
  }

  /**
   * Anonymize a hostname
   */
  private anonymizeHostname(hostname: string, mapping: AnonymizationMapping): string {
    if (mapping.hostnames.has(hostname)) {
      return mapping.hostnames.get(hostname)!;
    }

    const token = `HOST_${String(mapping.hostnames.size + 1).padStart(3, '0')}`;
    mapping.hostnames.set(hostname, token);
    mapping.reverseMap.set(token, hostname);
    return token;
  }

  /**
   * Anonymize company names in text
   */
  private anonymizeCompanyName(companyName: string, mapping: AnonymizationMapping): string {
    if (mapping.companyNames.has(companyName)) {
      return mapping.companyNames.get(companyName)!;
    }

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const index = mapping.companyNames.size;
    const token = `COMPANY_${letters[index % letters.length]}`;
    
    mapping.companyNames.set(companyName, token);
    mapping.reverseMap.set(token, companyName);
    return token;
  }

  /**
   * Anonymize text content (IPs, hostnames, company names)
   */
  private anonymizeText(text: string, mapping: AnonymizationMapping): string {
    if (!text) return text;

    let anonymized = text;

    // Anonymize IP addresses
    anonymized = anonymized.replace(this.IP_PATTERN, (match) => {
      return this.anonymizeIpAddress(match, mapping);
    });

    // Anonymize hostnames (but be careful not to match common words)
    // Only match if it looks like a FQDN (has at least one dot)
    const fqdnPattern = /\b[a-zA-Z0-9][-a-zA-Z0-9]{0,62}\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(?:\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})*\b/g;
    anonymized = anonymized.replace(fqdnPattern, (match) => {
      // Skip common domains and generic terms
      if (this.isCommonDomain(match)) {
        return match;
      }
      return this.anonymizeHostname(match, mapping);
    });

    // Anonymize company names
    anonymized = anonymized.replace(this.COMPANY_PATTERN, (match) => {
      // Skip common generic terms
      if (this.isGenericTerm(match)) {
        return match;
      }
      return this.anonymizeCompanyName(match, mapping);
    });

    return anonymized;
  }

  /**
   * Check if a domain is a common public domain
   */
  private isCommonDomain(domain: string): boolean {
    const commonDomains = [
      'amazon.com', 'aws.amazon.com', 'microsoft.com', 'google.com',
      'oracle.com', 'ibm.com', 'redhat.com', 'vmware.com',
      'localhost', 'example.com', 'test.com'
    ];
    
    const lowerDomain = domain.toLowerCase();
    return commonDomains.some(common => lowerDomain.includes(common));
  }

  /**
   * Check if a term is a generic business term
   */
  private isGenericTerm(term: string): boolean {
    const genericTerms = [
      'The Company', 'The Organization', 'The Client', 'The Customer',
      'Data Center', 'Cloud Services', 'IT Department', 'Security Team'
    ];
    
    return genericTerms.some(generic => 
      term.toLowerCase() === generic.toLowerCase()
    );
  }

  /**
   * Validate that no sensitive patterns remain after anonymization
   */
  private validateAnonymization(
    anonymizedMpaData: any, 
    anonymizedMraData: Partial<MraData>,
    anonymizedQuestionnaireData?: Partial<QuestionnaireData>
  ): void {
    // Convert anonymized data to JSON string for pattern checking
    const mpaJson = JSON.stringify(anonymizedMpaData);
    const mraJson = JSON.stringify(anonymizedMraData);
    const questionnaireJson = anonymizedQuestionnaireData ? JSON.stringify(anonymizedQuestionnaireData) : '';
    const combined = mpaJson + mraJson + questionnaireJson;

    // Check for IP addresses (excluding our tokens)
    const ipMatches = combined.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
    if (ipMatches && ipMatches.length > 0) {
      // Filter out false positives (version numbers, etc.)
      const realIps = ipMatches.filter(ip => {
        const parts = ip.split('.');
        return parts.every(part => {
          const num = parseInt(part, 10);
          return num >= 0 && num <= 255;
        });
      });
      
      if (realIps.length > 0) {
        console.warn('Warning: Potential IP addresses found after anonymization:', realIps);
      }
    }

    // Check for our anonymization tokens to ensure they're present
    const hasTokens = /IP_\d{3}|HOST_\d{3}|COMPANY_[A-Z]/.test(combined);
    if (!hasTokens && (mpaJson.length > 100 || mraJson.length > 100)) {
      console.warn('Warning: No anonymization tokens found. Data may not have been anonymized.');
    }
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
