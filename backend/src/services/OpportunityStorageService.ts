import {
  Opportunity,
  OpportunityFilters,
  OpportunityStatus,
} from '../../../shared/types/opportunity.types';

/**
 * Storage abstraction for opportunities
 * MVP: In-memory implementation
 * Future: DynamoDB implementation
 */
export interface OpportunityStorageService {
  /**
   * Store opportunities from analysis
   * @param opportunities - Array of opportunities to store
   * @param sessionId - Session identifier for grouping
   */
  storeOpportunities(opportunities: Opportunity[], sessionId: string): Promise<void>;

  /**
   * Retrieve opportunities with optional filters
   * @param sessionId - Session identifier
   * @param filters - Optional filter criteria
   * @returns Filtered opportunities
   */
  getOpportunities(sessionId: string, filters?: OpportunityFilters): Promise<Opportunity[]>;

  /**
   * Update opportunity status
   * @param id - Opportunity ID
   * @param status - New status
   */
  updateStatus(id: string, status: OpportunityStatus): Promise<void>;

  /**
   * Get single opportunity by ID
   * @param id - Opportunity ID
   */
  getOpportunity(id: string): Promise<Opportunity | null>;
}

/**
 * In-memory implementation of OpportunityStorageService
 * 
 * Migration Path to DynamoDB:
 * 1. Create DynamoDB table with schema:
 *    - PK: sessionId (String)
 *    - SK: opportunityId (String)
 *    - Attributes: all Opportunity fields
 *    - GSI: status-index (for filtering by status)
 * 
 * 2. Implement DynamoDBOpportunityStorage class:
 *    - Use AWS SDK DynamoDB DocumentClient
 *    - Implement same interface methods
 *    - Use Query for getOpportunities (by sessionId)
 *    - Use GetItem for getOpportunity (by id)
 *    - Use UpdateItem for updateStatus
 * 
 * 3. Replace InMemoryOpportunityStorage with DynamoDBOpportunityStorage
 *    - No API changes required
 *    - Update environment configuration
 *    - Add DynamoDB permissions to IAM role
 */
export class InMemoryOpportunityStorage implements OpportunityStorageService {
  // Map: sessionId -> Opportunity[]
  private storage: Map<string, Opportunity[]> = new Map();

  // Map: opportunityId -> sessionId (for quick lookup)
  private opportunityIndex: Map<string, string> = new Map();

  /**
   * Store opportunities from analysis
   */
  async storeOpportunities(opportunities: Opportunity[], sessionId: string): Promise<void> {
    // Store opportunities for this session
    this.storage.set(sessionId, opportunities);

    // Update index for quick lookup
    opportunities.forEach(opp => {
      this.opportunityIndex.set(opp.id, sessionId);
    });
  }

  /**
   * Retrieve opportunities with optional filters
   */
  async getOpportunities(
    sessionId: string,
    filters?: OpportunityFilters
  ): Promise<Opportunity[]> {
    const opportunities = this.storage.get(sessionId) || [];

    if (!filters) {
      return opportunities;
    }

    return this.applyFilters(opportunities, filters);
  }

  /**
   * Update opportunity status
   */
  async updateStatus(id: string, status: OpportunityStatus): Promise<void> {
    // Validate status
    const validStatuses: OpportunityStatus[] = [
      'Nueva',
      'En Progreso',
      'Ganada',
      'Perdida',
      'Descartada',
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    // Find opportunity
    const sessionId = this.opportunityIndex.get(id);
    if (!sessionId) {
      throw new Error(`Opportunity not found: ${id}`);
    }

    const opportunities = this.storage.get(sessionId);
    if (!opportunities) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Update status
    const opportunity = opportunities.find(opp => opp.id === id);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${id}`);
    }

    opportunity.status = status;
    opportunity.updatedAt = new Date();
  }

  /**
   * Get single opportunity by ID
   */
  async getOpportunity(id: string): Promise<Opportunity | null> {
    const sessionId = this.opportunityIndex.get(id);
    if (!sessionId) {
      return null;
    }

    const opportunities = this.storage.get(sessionId);
    if (!opportunities) {
      return null;
    }

    return opportunities.find(opp => opp.id === id) || null;
  }

  /**
   * Apply filters to opportunities
   */
  private applyFilters(
    opportunities: Opportunity[],
    filters: OpportunityFilters
  ): Opportunity[] {
    let filtered = opportunities;

    // Filter by priority
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(opp => filters.priority!.includes(opp.priority));
    }

    // Filter by ARR range
    if (filters.minARR !== undefined) {
      filtered = filtered.filter(opp => opp.estimatedARR >= filters.minARR!);
    }

    if (filters.maxARR !== undefined) {
      filtered = filtered.filter(opp => opp.estimatedARR <= filters.maxARR!);
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(opp => filters.status!.includes(opp.status));
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(opp => {
        // Search in title, reasoning, and talking points
        const titleMatch = opp.title.toLowerCase().includes(searchLower);
        const reasoningMatch = opp.reasoning.toLowerCase().includes(searchLower);
        const talkingPointsMatch = opp.talkingPoints.some(point =>
          point.toLowerCase().includes(searchLower)
        );

        return titleMatch || reasoningMatch || talkingPointsMatch;
      });
    }

    return filtered;
  }

  /**
   * Clear all stored data (for testing)
   */
  clear(): void {
    this.storage.clear();
    this.opportunityIndex.clear();
  }
}
