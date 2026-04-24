import { Opportunity, OpportunityCategory, OpportunityPriority, OpportunityStatus } from '@shared/types/opportunity.types';
import { readPersisted, writePersisted } from '@/lib/usePersistedState';

const KEY_PREFIX = 'opportunities.manual';

function storageSlot(sessionId: string | null): string {
  return sessionId ? `${KEY_PREFIX}.${sessionId}` : `${KEY_PREFIX}.global`;
}

export function loadManualOpportunities(sessionId: string | null): Opportunity[] {
  const raw = readPersisted<any[]>(storageSlot(sessionId), []);
  return raw.map(rehydrateDates);
}

export function saveManualOpportunities(sessionId: string | null, opportunities: Opportunity[]): void {
  writePersisted(storageSlot(sessionId), opportunities);
}

export interface OpportunityDraft {
  id?: string;
  title: string;
  category: OpportunityCategory;
  priority: OpportunityPriority;
  estimatedARR: number;
  reasoning: string;
  evidence: string[];
  talkingPoints: string[];
  nextSteps: string[];
  relatedServices: string[];
  status: OpportunityStatus;
}

export function createEmptyDraft(): OpportunityDraft {
  return {
    title: '',
    category: 'Otro',
    priority: 'Medium',
    estimatedARR: 0,
    reasoning: '',
    evidence: [],
    talkingPoints: [],
    nextSteps: [],
    relatedServices: [],
    status: 'Nueva',
  };
}

export function draftToOpportunity(draft: OpportunityDraft, existing?: Opportunity): Opportunity {
  const now = new Date();
  return {
    id: draft.id ?? existing?.id ?? `manual-${now.getTime()}`,
    title: draft.title,
    category: draft.category,
    priority: draft.priority,
    estimatedARR: draft.estimatedARR,
    reasoning: draft.reasoning,
    evidence: draft.evidence,
    talkingPoints: draft.talkingPoints,
    nextSteps: draft.nextSteps,
    relatedServices: draft.relatedServices,
    status: draft.status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function toDraft(opportunity: Opportunity): OpportunityDraft {
  return {
    id: opportunity.id,
    title: opportunity.title,
    category: opportunity.category,
    priority: opportunity.priority,
    estimatedARR: opportunity.estimatedARR,
    reasoning: opportunity.reasoning,
    evidence: [...opportunity.evidence],
    talkingPoints: [...opportunity.talkingPoints],
    nextSteps: [...opportunity.nextSteps],
    relatedServices: [...opportunity.relatedServices],
    status: opportunity.status,
  };
}

export function isManualOpportunity(opportunity: Opportunity): boolean {
  return opportunity.id.startsWith('manual-');
}

function rehydrateDates(raw: any): Opportunity {
  return {
    ...raw,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
  };
}
