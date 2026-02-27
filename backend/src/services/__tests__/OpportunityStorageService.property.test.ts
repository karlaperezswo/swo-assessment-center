import fc from 'fast-check';
import { InMemoryOpportunityStorage } from '../OpportunityStorageService';
import {
  Opportunity,
  OpportunityStatus,
  OpportunityPriority,
} from '../../../../shared/types/opportunity.types';
import { v4 as uuidv4 } from 'uuid';

describe('OpportunityStorageService - Property Tests', () => {
  let storage: InMemoryOpportunityStorage;

  beforeEach(() => {
    storage = new InMemoryOpportunityStorage();
  });

  afterEach(() => {
    storage.clear();
  });

  // Arbitrary for valid status
  const validStatusArb = fc.constantFrom<OpportunityStatus>(
    'Nueva',
    'En Progreso',
    'Ganada',
    'Perdida',
    'Descartada'
  );

  // Arbitrary for valid priority
  const validPriorityArb = fc.constantFrom<OpportunityPriority>('High', 'Medium', 'Low');

  // Arbitrary for valid opportunity
  const validOpportunityArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 100 }),
    priority: validPriorityArb,
    estimatedARR: fc.integer({ min: 1000, max: 10000000 }),
    reasoning: fc.string({ minLength: 20, maxLength: 500 }),
    talkingPoints: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 3, maxLength: 10 }),
    nextSteps: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 2, maxLength: 10 }),
    relatedServices: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
    status: validStatusArb,
    createdAt: fc.date(),
    updatedAt: fc.date(),
  }) as fc.Arbitrary<Opportunity>;

  /**
   * Property 13: Valid Opportunity Status Values
   * Validates: Requirements 5.1, 5.3
   */
  test('Property 13: only accepts valid status values', async () => {
    await fc.assert(
      fc.asyncProperty(validOpportunityArb, validStatusArb, async (opp, newStatus) => {
        const sessionId = uuidv4();
        await storage.storeOpportunities([opp], sessionId);

        // Should accept valid status
        await expect(storage.updateStatus(opp.id, newStatus)).resolves.not.toThrow();

        // Verify status was updated
        const updated = await storage.getOpportunity(opp.id);
        expect(updated?.status).toBe(newStatus);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13 (negative): Rejects invalid status values
   */
  test('Property 13 (negative): rejects invalid status values', async () => {
    const invalidStatusArb = fc
      .string()
      .filter(s => !['Nueva', 'En Progreso', 'Ganada', 'Perdida', 'Descartada'].includes(s));

    await fc.assert(
      fc.asyncProperty(validOpportunityArb, invalidStatusArb, async (opp, invalidStatus) => {
        const sessionId = uuidv4();
        await storage.storeOpportunities([opp], sessionId);

        // Should reject invalid status
        await expect(storage.updateStatus(opp.id, invalidStatus as any)).rejects.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: Status Update Persistence
   * Validates: Requirements 5.4
   */
  test('Property 15: status update persists when retrieved', async () => {
    await fc.assert(
      fc.asyncProperty(validOpportunityArb, validStatusArb, async (opp, newStatus) => {
        const sessionId = uuidv4();
        await storage.storeOpportunities([opp], sessionId);

        // Update status
        await storage.updateStatus(opp.id, newStatus);

        // Retrieve and verify
        const retrieved = await storage.getOpportunity(opp.id);
        expect(retrieved).not.toBeNull();
        expect(retrieved!.status).toBe(newStatus);

        // Also verify through getOpportunities
        const opportunities = await storage.getOpportunities(sessionId);
        const found = opportunities.find(o => o.id === opp.id);
        expect(found).not.toBeUndefined();
        expect(found!.status).toBe(newStatus);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 27: List Endpoint Filtering
   * Validates: Requirements 10.3
   */
  test('Property 27: filters return only matching opportunities', async () => {
    const opportunitiesArb = fc.array(validOpportunityArb, { minLength: 5, maxLength: 20 });

    await fc.assert(
      fc.asyncProperty(opportunitiesArb, async (opportunities) => {
        const sessionId = uuidv4();
        await storage.storeOpportunities(opportunities, sessionId);

        // Test priority filter
        const priorities = ['High', 'Medium', 'Low'];
        for (const priority of priorities) {
          const filtered = await storage.getOpportunities(sessionId, { priority: [priority] });
          filtered.forEach(opp => {
            expect(opp.priority).toBe(priority);
          });
        }

        // Test ARR range filter
        const minARR = 50000;
        const maxARR = 500000;
        const arrFiltered = await storage.getOpportunities(sessionId, { minARR, maxARR });
        arrFiltered.forEach(opp => {
          expect(opp.estimatedARR).toBeGreaterThanOrEqual(minARR);
          expect(opp.estimatedARR).toBeLessThanOrEqual(maxARR);
        });

        // Test status filter
        const statuses: OpportunityStatus[] = ['Nueva', 'En Progreso'];
        const statusFiltered = await storage.getOpportunities(sessionId, { status: statuses });
        statusFiltered.forEach(opp => {
          expect(statuses).toContain(opp.status);
        });
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 19: Search Functionality
   * Validates: Requirements 7.4
   */
  test('Property 19: search finds opportunities containing search term', async () => {
    const opportunitiesArb = fc.array(validOpportunityArb, { minLength: 3, maxLength: 10 });

    await fc.assert(
      fc.asyncProperty(opportunitiesArb, async (opportunities) => {
        const sessionId = uuidv4();
        await storage.storeOpportunities(opportunities, sessionId);

        // Pick a random opportunity and search for part of its title
        if (opportunities.length > 0) {
          const targetOpp = opportunities[0];
          const searchTerm = targetOpp.title.substring(0, Math.min(5, targetOpp.title.length));

          if (searchTerm.length > 0) {
            const results = await storage.getOpportunities(sessionId, { searchTerm });

            // Should find the target opportunity
            const found = results.find(opp => opp.id === targetOpp.id);
            expect(found).toBeDefined();

            // All results should contain the search term in title, reasoning, or talking points
            results.forEach(opp => {
              const searchLower = searchTerm.toLowerCase();
              const inTitle = opp.title.toLowerCase().includes(searchLower);
              const inReasoning = opp.reasoning.toLowerCase().includes(searchLower);
              const inTalkingPoints = opp.talkingPoints.some(point =>
                point.toLowerCase().includes(searchLower)
              );

              expect(inTitle || inReasoning || inTalkingPoints).toBe(true);
            });
          }
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 29: On-Demand Generation
   * Validates: Requirements 11.3
   */
  test('Property 29: storing new opportunities replaces previous ones for same session', async () => {
    const opportunitiesArb1 = fc.array(validOpportunityArb, { minLength: 3, maxLength: 5 });
    const opportunitiesArb2 = fc.array(validOpportunityArb, { minLength: 3, maxLength: 5 });

    await fc.assert(
      fc.asyncProperty(opportunitiesArb1, opportunitiesArb2, async (opps1, opps2) => {
        const sessionId = uuidv4();

        // Store first set
        await storage.storeOpportunities(opps1, sessionId);
        const retrieved1 = await storage.getOpportunities(sessionId);
        expect(retrieved1.length).toBe(opps1.length);

        // Store second set (simulating re-analysis)
        await storage.storeOpportunities(opps2, sessionId);
        const retrieved2 = await storage.getOpportunities(sessionId);
        expect(retrieved2.length).toBe(opps2.length);

        // Should have new opportunities, not old ones
        const ids2 = new Set(opps2.map(o => o.id));
        retrieved2.forEach(opp => {
          expect(ids2.has(opp.id)).toBe(true);
        });
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 31: Concurrent Request Safety
   * Validates: Requirements 12.5
   */
  test('Property 31: concurrent sessions do not interfere with each other', async () => {
    const opportunitiesArb1 = fc.array(validOpportunityArb, { minLength: 3, maxLength: 5 });
    const opportunitiesArb2 = fc.array(validOpportunityArb, { minLength: 3, maxLength: 5 });

    await fc.assert(
      fc.asyncProperty(opportunitiesArb1, opportunitiesArb2, async (opps1, opps2) => {
        const sessionId1 = uuidv4();
        const sessionId2 = uuidv4();

        // Store opportunities for both sessions concurrently
        await Promise.all([
          storage.storeOpportunities(opps1, sessionId1),
          storage.storeOpportunities(opps2, sessionId2),
        ]);

        // Retrieve opportunities for each session
        const [retrieved1, retrieved2] = await Promise.all([
          storage.getOpportunities(sessionId1),
          storage.getOpportunities(sessionId2),
        ]);

        // Each session should have its own opportunities
        expect(retrieved1.length).toBe(opps1.length);
        expect(retrieved2.length).toBe(opps2.length);

        // Verify no cross-contamination
        const ids1 = new Set(opps1.map(o => o.id));
        const ids2 = new Set(opps2.map(o => o.id));

        retrieved1.forEach(opp => {
          expect(ids1.has(opp.id)).toBe(true);
          expect(ids2.has(opp.id)).toBe(false);
        });

        retrieved2.forEach(opp => {
          expect(ids2.has(opp.id)).toBe(true);
          expect(ids1.has(opp.id)).toBe(false);
        });
      }),
      { numRuns: 50 }
    );
  });
});
