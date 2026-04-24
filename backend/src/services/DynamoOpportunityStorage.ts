import {
  Opportunity,
  OpportunityFilters,
  OpportunityStatus,
} from '../../../shared/types/opportunity.types';
import { DynamoRepository, getDynamoRepository } from '../db/DynamoRepository';
import { OPPORTUNITY_SK_PREFIX, keys } from '../db/keys';
import { OpportunityStorageService } from './OpportunityStorageService';

const VALID_STATUSES: OpportunityStatus[] = [
  'Nueva',
  'En Progreso',
  'Ganada',
  'Perdida',
  'Descartada',
];

interface StoredOpportunity extends Opportunity {
  pk: string;
  sk: string;
  gsi1pk: string;
  gsi1sk: string;
  sessionId: string;
}

/**
 * DynamoDB-backed implementation of {@link OpportunityStorageService}.
 *
 * Uses the shared single-table `swo-assessments`. Opportunities live under
 * `SESSION#<id> / OPP#<oppId>` with a GSI on `OPP#<id>` → `SESSION#<id>` to
 * support single-item lookups by opportunity id without scanning.
 */
export class DynamoOpportunityStorage implements OpportunityStorageService {
  constructor(private readonly repo: DynamoRepository = getDynamoRepository()) {}

  async storeOpportunities(
    opportunities: Opportunity[],
    sessionId: string
  ): Promise<void> {
    const items: StoredOpportunity[] = opportunities.map((opp) => ({
      ...opp,
      sessionId,
      pk: keys.session.pk(sessionId),
      sk: `${OPPORTUNITY_SK_PREFIX}${opp.id}`,
      gsi1pk: `OPP#${opp.id}`,
      gsi1sk: keys.session.pk(sessionId),
    }));
    await this.repo.batchWrite(items);
  }

  async getOpportunities(
    sessionId: string,
    filters?: OpportunityFilters
  ): Promise<Opportunity[]> {
    const items = await this.repo.queryAll<StoredOpportunity>(
      keys.session.pk(sessionId),
      OPPORTUNITY_SK_PREFIX
    );
    const stripped = items.map((i) => this.stripKeys(i));
    return filters ? this.applyFilters(stripped, filters) : stripped;
  }

  async updateStatus(id: string, status: OpportunityStatus): Promise<void> {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    const sessionId = await this.resolveSessionId(id);
    if (!sessionId) {
      throw new Error(`Opportunity not found: ${id}`);
    }
    await this.repo.update({
      Key: {
        pk: keys.session.pk(sessionId),
        sk: `${OPPORTUNITY_SK_PREFIX}${id}`,
      },
      UpdateExpression: 'SET #status = :s, #updatedAt = :u',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':s': status,
        ':u': new Date().toISOString(),
      },
      ConditionExpression: 'attribute_exists(pk)',
    });
  }

  async getOpportunity(id: string): Promise<Opportunity | null> {
    const sessionId = await this.resolveSessionId(id);
    if (!sessionId) return null;
    const item = await this.repo.get<StoredOpportunity>(
      keys.session.pk(sessionId),
      `${OPPORTUNITY_SK_PREFIX}${id}`
    );
    return item ? this.stripKeys(item) : null;
  }

  private async resolveSessionId(oppId: string): Promise<string | null> {
    const result = await this.repo.queryByPk<StoredOpportunity>(
      `OPP#${oppId}`,
      undefined,
      { indexName: 'GSI1', limit: 1 }
    );
    const hit = result.items[0];
    return hit?.sessionId ?? null;
  }

  private stripKeys(item: StoredOpportunity): Opportunity {
    const { pk, sk, gsi1pk, gsi1sk, sessionId, ...opportunity } = item;
    void pk; void sk; void gsi1pk; void gsi1sk; void sessionId;
    return opportunity;
  }

  private applyFilters(
    opportunities: Opportunity[],
    filters: OpportunityFilters
  ): Opportunity[] {
    let filtered = opportunities;

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((o) => filters.priority!.includes(o.priority));
    }
    if (filters.minARR !== undefined) {
      filtered = filtered.filter((o) => o.estimatedARR >= filters.minARR!);
    }
    if (filters.maxARR !== undefined) {
      filtered = filtered.filter((o) => o.estimatedARR <= filters.maxARR!);
    }
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((o) => filters.status!.includes(o.status));
    }
    if (filters.searchTerm) {
      const needle = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((o) => {
        return (
          o.title.toLowerCase().includes(needle) ||
          o.reasoning.toLowerCase().includes(needle) ||
          o.talkingPoints.some((p) => p.toLowerCase().includes(needle))
        );
      });
    }
    return filtered;
  }
}
