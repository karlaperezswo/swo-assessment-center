import mammoth from 'mammoth';
import { QuestionnaireData } from '../../../shared/types/opportunity.types';

/**
 * Service to parse Infrastructure Questionnaire from Word documents
 */
export class QuestionnaireParserService {
  /**
   * Parse Word document buffer and extract questionnaire data
   * @param buffer - Word document buffer
   * @returns Parsed questionnaire data
   */
  async parseQuestionnaire(buffer: Buffer): Promise<QuestionnaireData> {
    try {
      // Extract text from Word document
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result.value;

      // Parse structured data from text
      const questionnaireData = this.extractStructuredData(rawText);

      return {
        ...questionnaireData,
        rawText,
      };
    } catch (error) {
      console.error('[QuestionnaireParser] Error parsing Word document:', error);
      throw new Error(`Failed to parse questionnaire: ${(error as Error).message}`);
    }
  }

  /**
   * Extract structured data from raw text
   * Uses pattern matching to identify sections and extract information
   */
  private extractStructuredData(text: string): Omit<QuestionnaireData, 'rawText'> {
    return {
      // Client Information
      clientName: this.extractField(text, ['client name', 'company name', 'organization']),
      industry: this.extractField(text, ['industry', 'sector', 'vertical']),
      location: this.extractField(text, ['location', 'headquarters', 'primary location']),
      companySize: this.extractField(text, ['company size', 'employees', 'organization size']),
      executiveContact: this.extractField(text, ['executive contact', 'sponsor', 'executive sponsor']),
      technicalContact: this.extractField(text, ['technical contact', 'it contact', 'technical lead']),

      // Infrastructure
      primaryDatacenter: this.extractField(text, ['primary datacenter', 'main datacenter', 'primary dc']),
      secondaryDatacenters: this.extractList(text, ['secondary datacenters', 'backup datacenters', 'dr sites']),
      cloudProviders: this.extractList(text, ['cloud providers', 'current cloud', 'cloud platforms']),
      connectivity: this.extractField(text, ['connectivity', 'network connectivity', 'wan']),

      // Workloads
      criticalApplications: this.extractList(text, ['critical applications', 'key applications', 'business critical apps']),
      databases: this.extractList(text, ['databases', 'database systems', 'db platforms']),
      middleware: this.extractList(text, ['middleware', 'application servers', 'integration platforms']),
      operatingSystems: this.extractList(text, ['operating systems', 'os distribution', 'platforms']),

      // Priorities
      priorities: this.extractOrderedList(text, ['priorities', 'business priorities', 'key priorities']),

      // Constraints and Requirements
      complianceRequirements: this.extractList(text, ['compliance', 'regulatory requirements', 'certifications required']),
      maintenanceWindows: this.extractList(text, ['maintenance windows', 'downtime windows', 'change windows']),
      migrationRestrictions: this.extractList(text, ['migration restrictions', 'constraints', 'limitations']),
      budget: this.extractField(text, ['budget', 'investment', 'funding']),
      timeline: this.extractField(text, ['timeline', 'schedule', 'target date']),

      // Current Situation
      licenseContracts: this.extractList(text, ['license contracts', 'software licenses', 'licensing']),
      endOfSupport: this.extractList(text, ['end of support', 'eol', 'end of life']),
      currentProblems: this.extractList(text, ['current problems', 'pain points', 'challenges']),
      ongoingProjects: this.extractList(text, ['ongoing projects', 'current projects', 'initiatives']),

      // Team and Capabilities
      teamSize: this.extractField(text, ['team size', 'it team', 'staff count']),
      awsExperience: this.extractField(text, ['aws experience', 'cloud experience', 'aws knowledge']),
      certifications: this.extractList(text, ['certifications', 'aws certifications', 'certified staff']),
      currentSupport: this.extractList(text, ['current support', 'support model', 'managed services']),

      // Business Objectives
      expectedGrowth: this.extractField(text, ['expected growth', 'growth rate', 'business growth']),
      newMarkets: this.extractList(text, ['new markets', 'expansion', 'geographic expansion']),
      digitalInitiatives: this.extractList(text, ['digital initiatives', 'digital transformation', 'innovation']),
      kpis: this.extractList(text, ['kpis', 'key performance indicators', 'success metrics']),
      decisionDrivers: this.extractList(text, ['decision drivers', 'decision factors', 'key drivers']),
    };
  }

  /**
   * Extract a single field value from text
   */
  private extractField(text: string, patterns: string[]): string {
    const lowerText = text.toLowerCase();

    for (const pattern of patterns) {
      // Look for pattern followed by colon or newline
      const regex = new RegExp(`${pattern}\\s*:?\\s*([^\\n]+)`, 'i');
      const match = lowerText.match(regex);

      if (match && match[1]) {
        // Get the original text (not lowercased) for the match
        const startIndex = lowerText.indexOf(match[0]);
        const endIndex = startIndex + match[0].length;
        const originalMatch = text.substring(startIndex, endIndex);
        
        // Extract just the value part
        const valueMatch = originalMatch.match(/:\s*(.+)$/);
        if (valueMatch) {
          return valueMatch[1].trim();
        }
      }
    }

    return '';
  }

  /**
   * Extract a list of items from text
   */
  private extractList(text: string, patterns: string[]): string[] {
    const lowerText = text.toLowerCase();
    const items: string[] = [];

    for (const pattern of patterns) {
      // Look for pattern followed by list items (bullets, numbers, or newlines)
      const sectionRegex = new RegExp(`${pattern}\\s*:?([^]*?)(?=\\n\\n|\\n[A-Z][a-z]+:|$)`, 'i');
      const sectionMatch = lowerText.match(sectionRegex);

      if (sectionMatch && sectionMatch[1]) {
        const section = sectionMatch[1];
        
        // Extract list items (lines starting with -, *, •, numbers, or just text)
        const listItems = section.match(/(?:^|\n)\s*(?:[-*•]|\d+\.)\s*([^\n]+)/g);
        
        if (listItems) {
          items.push(...listItems.map(item => 
            item.replace(/^\s*(?:[-*•]|\d+\.)\s*/, '').trim()
          ));
        } else {
          // If no bullets, split by newlines and filter empty
          const lines = section.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.match(/^[A-Z][a-z]+:/));
          
          items.push(...lines);
        }
      }
    }

    return items.filter(item => item.length > 0);
  }

  /**
   * Extract an ordered list (maintains order)
   */
  private extractOrderedList(text: string, patterns: string[]): string[] {
    const lowerText = text.toLowerCase();

    for (const pattern of patterns) {
      // Look for numbered list
      const sectionRegex = new RegExp(`${pattern}\\s*:?([^]*?)(?=\\n\\n|\\n[A-Z][a-z]+:|$)`, 'i');
      const sectionMatch = lowerText.match(sectionRegex);

      if (sectionMatch && sectionMatch[1]) {
        const section = sectionMatch[1];
        
        // Extract numbered items
        const numberedItems = section.match(/\d+\.\s*([^\n]+)/g);
        
        if (numberedItems) {
          return numberedItems.map(item => 
            item.replace(/^\d+\.\s*/, '').trim()
          );
        }
      }
    }

    return [];
  }

  /**
   * Validate questionnaire data
   */
  validateQuestionnaire(data: QuestionnaireData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for minimum required fields
    if (!data.clientName || data.clientName.trim().length === 0) {
      errors.push('Client name is required');
    }

    if (!data.rawText || data.rawText.trim().length < 100) {
      errors.push('Questionnaire content is too short or empty');
    }

    // Warn if critical sections are missing
    if (data.priorities.length === 0) {
      errors.push('No priorities identified in questionnaire');
    }

    if (data.criticalApplications.length === 0) {
      errors.push('No critical applications identified');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
