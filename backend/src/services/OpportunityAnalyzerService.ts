import { v4 as uuidv4 } from 'uuid';
import {
  Opportunity,
  RawOpportunity,
  BedrockResponse,
  AnonymizationMapping,
  OpportunityPriority,
} from '../../../shared/types/opportunity.types';

export class OpportunityAnalyzerError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'OpportunityAnalyzerError';
  }
}

export class OpportunityAnalyzerService {
  /**
   * Parse Bedrock response into structured opportunities
   * @param response - Raw Bedrock response
   * @param mapping - Anonymization mapping for deanonymization
   * @returns Array of structured opportunities
   */
  parseOpportunities(
    response: BedrockResponse,
    mapping: AnonymizationMapping
  ): Opportunity[] {
    try {
      // Parse JSON response
      const rawOpportunities: RawOpportunity[] = JSON.parse(response.content);

      if (!Array.isArray(rawOpportunities)) {
        throw new OpportunityAnalyzerError('Bedrock response is not an array');
      }

      // Validate and enrich each opportunity
      const opportunities = rawOpportunities.map(raw => 
        this.validateOpportunity(raw, mapping)
      );

      // Sort by priority then ARR
      return this.sortOpportunities(opportunities);
    } catch (error) {
      if (error instanceof OpportunityAnalyzerError) {
        throw error;
      }
      throw new OpportunityAnalyzerError(
        `Failed to parse opportunities: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Validate and enrich opportunity data
   * @param opportunity - Raw opportunity from Bedrock
   * @param mapping - Anonymization mapping for deanonymization
   * @returns Validated and enriched opportunity
   */
  validateOpportunity(
    opportunity: RawOpportunity,
    mapping: AnonymizationMapping
  ): Opportunity {
    // Validate required fields
    if (!opportunity.title || typeof opportunity.title !== 'string') {
      throw new OpportunityAnalyzerError('Opportunity missing valid title');
    }

    if (!opportunity.category || typeof opportunity.category !== 'string') {
      throw new OpportunityAnalyzerError('Opportunity missing valid category');
    }

    if (!this.isValidPriority(opportunity.priority)) {
      throw new OpportunityAnalyzerError(
        `Invalid priority: ${opportunity.priority}. Must be High, Medium, or Low`
      );
    }

    if (typeof opportunity.estimatedARR !== 'number' || opportunity.estimatedARR <= 0) {
      throw new OpportunityAnalyzerError(
        `Invalid estimatedARR: ${opportunity.estimatedARR}. Must be a positive number`
      );
    }

    if (!opportunity.reasoning || typeof opportunity.reasoning !== 'string') {
      throw new OpportunityAnalyzerError('Opportunity missing valid reasoning');
    }

    if (!Array.isArray(opportunity.evidence) || opportunity.evidence.length < 2) {
      throw new OpportunityAnalyzerError(
        `Opportunity must have at least 2 evidence points, got ${opportunity.evidence?.length || 0}`
      );
    }

    if (!Array.isArray(opportunity.talkingPoints) || opportunity.talkingPoints.length < 3) {
      throw new OpportunityAnalyzerError(
        `Opportunity must have at least 3 talking points, got ${opportunity.talkingPoints?.length || 0}`
      );
    }

    if (!Array.isArray(opportunity.nextSteps) || opportunity.nextSteps.length < 2) {
      throw new OpportunityAnalyzerError(
        `Opportunity must have at least 2 next steps, got ${opportunity.nextSteps?.length || 0}`
      );
    }

    if (!Array.isArray(opportunity.relatedServices) || opportunity.relatedServices.length === 0) {
      throw new OpportunityAnalyzerError('Opportunity must have at least 1 related service');
    }

    // Deanonymize text fields
    const deanonymizedTitle = this.deanonymizeText(opportunity.title, mapping);
    const deanonymizedReasoning = this.deanonymizeText(opportunity.reasoning, mapping);
    const deanonymizedEvidence = opportunity.evidence.map(ev =>
      this.deanonymizeText(ev, mapping)
    );
    const deanonymizedTalkingPoints = opportunity.talkingPoints.map(point =>
      this.deanonymizeText(point, mapping)
    );
    const deanonymizedNextSteps = opportunity.nextSteps.map(step =>
      this.deanonymizeText(step, mapping)
    );

    // Create enriched opportunity
    const now = new Date();
    return {
      id: uuidv4(),
      title: deanonymizedTitle,
      category: opportunity.category as any, // Will be validated by TypeScript
      priority: opportunity.priority as OpportunityPriority,
      estimatedARR: opportunity.estimatedARR,
      reasoning: deanonymizedReasoning,
      evidence: deanonymizedEvidence,
      talkingPoints: deanonymizedTalkingPoints,
      nextSteps: deanonymizedNextSteps,
      relatedServices: opportunity.relatedServices,
      status: 'Nueva', // Initial status
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Check if priority value is valid
   */
  private isValidPriority(priority: string): boolean {
    return priority === 'High' || priority === 'Medium' || priority === 'Low';
  }

  /**
   * Deanonymize text by replacing tokens with original values
   */
  private deanonymizeText(text: string, mapping: AnonymizationMapping): string {
    let deanonymized = text;

    // Replace tokens with original values using reverse map
    for (const [token, original] of mapping.reverseMap.entries()) {
      const regex = new RegExp(this.escapeRegex(token), 'g');
      deanonymized = deanonymized.replace(regex, original);
    }

    return deanonymized;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Sort opportunities by priority then ARR
   * Priority order: High > Medium > Low
   */
  private sortOpportunities(opportunities: Opportunity[]): Opportunity[] {
    const priorityOrder: Record<OpportunityPriority, number> = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return opportunities.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Then sort by ARR (descending)
      return b.estimatedARR - a.estimatedARR;
    });
  }
}
