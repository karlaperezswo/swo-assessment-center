import { DynamoOpportunityStorage } from './DynamoOpportunityStorage';
import {
  InMemoryOpportunityStorage,
  OpportunityStorageService,
} from './OpportunityStorageService';

let cached: OpportunityStorageService | null = null;

/**
 * Returns the active opportunity storage implementation.
 *
 * Selection rules:
 *  - USE_DYNAMO_STORAGE=true ⇒ DynamoDB (requires SWO_TABLE_NAME).
 *  - anything else ⇒ in-memory singleton (current MVP behaviour).
 *
 * Feature-flag driven so the DynamoDB rollout can happen per-env without a
 * code change or rebuild.
 */
export function getOpportunityStorage(): OpportunityStorageService {
  if (cached) return cached;
  const useDynamo = String(process.env.USE_DYNAMO_STORAGE ?? '').toLowerCase() === 'true';
  if (useDynamo) {
    console.log('[OpportunityStorage] Using DynamoDB backend');
    cached = new DynamoOpportunityStorage();
  } else {
    console.log('[OpportunityStorage] Using in-memory backend (set USE_DYNAMO_STORAGE=true to persist)');
    cached = InMemoryOpportunityStorage.getInstance();
  }
  return cached;
}

export function __resetOpportunityStorageForTests(): void {
  cached = null;
}
