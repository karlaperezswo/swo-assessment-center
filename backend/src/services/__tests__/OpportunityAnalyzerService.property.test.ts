import fc from 'fast-check';
import { OpportunityAnalyzerService } from '../OpportunityAnalyzerService';
import {
  RawOpportunity,
  BedrockResponse,
  AnonymizationMapping,
  OpportunityPriority,
  OpportunityCategory,
} from '../../../../shared/types/opportunity.types';

describe('OpportunityAnalyzerService - Property Tests', () => {
  let service: OpportunityAnalyzerService;

  beforeEach(() => {
    service = new OpportunityAnalyzerService();
  });

  // Helper to create empty mapping
  const createEmptyMapping = (): AnonymizationMapping => ({
    ipAddresses: new Map(),
    hostnames: new Map(),
    companyNames: new Map(),
    reverseMap: new Map(),
  });

  // Arbitrary for valid priority
  const validPriorityArb = fc.constantFrom<OpportunityPriority>('High', 'Medium', 'Low');

  // Arbitrary for valid category
  const validCategoryArb = fc.constantFrom<OpportunityCategory>(
    'Workshop',
    'Seguridad',
    'Optimización de Costos',
    'Confiabilidad',
    'Excelencia Operacional',
    'Eficiencia de Rendimiento',
    'Sostenibilidad',
    'Migración',
    'Modernización',
    'Otro'
  );

  // Arbitrary for valid raw opportunity
  const validRawOpportunityArb = fc.record({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    category: validCategoryArb,
    priority: validPriorityArb,
    estimatedARR: fc.integer({ min: 1000, max: 10000000 }),
    reasoning: fc.string({ minLength: 20, maxLength: 500 }),
    evidence: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 2, maxLength: 4 }),
    talkingPoints: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 3, maxLength: 10 }),
    nextSteps: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 2, maxLength: 10 }),
    relatedServices: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
  });

  /**
   * Property 10: Opportunity Required Fields
   * Validates: Requirements 4.1, 4.4, 4.5, 4.6
   */
  test('Property 10: parsed opportunity contains all required fields with minimum counts', () => {
    fc.assert(
      fc.property(validRawOpportunityArb, (rawOpp) => {
        const mapping = createEmptyMapping();
        const opportunity = service.validateOpportunity(rawOpp, mapping);

        // Check all required fields are present
        expect(opportunity.id).toBeDefined();
        expect(typeof opportunity.id).toBe('string');
        expect(opportunity.id.length).toBeGreaterThan(0);

        expect(opportunity.title).toBeDefined();
        expect(typeof opportunity.title).toBe('string');
        expect(opportunity.title.length).toBeGreaterThan(0);

        expect(opportunity.priority).toBeDefined();
        expect(['High', 'Medium', 'Low']).toContain(opportunity.priority);

        expect(opportunity.estimatedARR).toBeDefined();
        expect(typeof opportunity.estimatedARR).toBe('number');
        expect(opportunity.estimatedARR).toBeGreaterThan(0);

        expect(opportunity.reasoning).toBeDefined();
        expect(typeof opportunity.reasoning).toBe('string');
        expect(opportunity.reasoning.length).toBeGreaterThan(0);

        // Minimum 3 talking points
        expect(Array.isArray(opportunity.talkingPoints)).toBe(true);
        expect(opportunity.talkingPoints.length).toBeGreaterThanOrEqual(3);
        opportunity.talkingPoints.forEach(point => {
          expect(typeof point).toBe('string');
          expect(point.length).toBeGreaterThan(0);
        });

        // Minimum 2 next steps
        expect(Array.isArray(opportunity.nextSteps)).toBe(true);
        expect(opportunity.nextSteps.length).toBeGreaterThanOrEqual(2);
        opportunity.nextSteps.forEach(step => {
          expect(typeof step).toBe('string');
          expect(step.length).toBeGreaterThan(0);
        });

        // Non-empty related services
        expect(Array.isArray(opportunity.relatedServices)).toBe(true);
        expect(opportunity.relatedServices.length).toBeGreaterThan(0);
        opportunity.relatedServices.forEach(service => {
          expect(typeof service).toBe('string');
          expect(service.length).toBeGreaterThan(0);
        });

        expect(opportunity.status).toBeDefined();
        expect(opportunity.createdAt).toBeInstanceOf(Date);
        expect(opportunity.updatedAt).toBeInstanceOf(Date);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Valid Priority Values
   * Validates: Requirements 4.2
   */
  test('Property 11: opportunity priority is exactly High, Medium, or Low', () => {
    fc.assert(
      fc.property(validRawOpportunityArb, (rawOpp) => {
        const mapping = createEmptyMapping();
        const opportunity = service.validateOpportunity(rawOpp, mapping);

        expect(['High', 'Medium', 'Low']).toContain(opportunity.priority);
        expect(opportunity.priority).toBe(rawOpp.priority);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11 (negative): Invalid priority values are rejected
   */
  test('Property 11 (negative): rejects invalid priority values', () => {
    const invalidPriorityArb = fc.string().filter(s => !['High', 'Medium', 'Low'].includes(s));

    fc.assert(
      fc.property(validRawOpportunityArb, invalidPriorityArb, (rawOpp, invalidPriority) => {
        const mapping = createEmptyMapping();
        const invalidOpp = { ...rawOpp, priority: invalidPriority };

        expect(() => service.validateOpportunity(invalidOpp as any, mapping)).toThrow();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Opportunity Sort Order
   * Validates: Requirements 4.3
   */
  test('Property 12: opportunities are sorted by priority then ARR', () => {
    // Generate array of opportunities with random priorities and ARRs
    const opportunitiesArb = fc.array(validRawOpportunityArb, { minLength: 3, maxLength: 20 });

    fc.assert(
      fc.property(opportunitiesArb, (rawOpps) => {
        const mapping = createEmptyMapping();
        const bedrockResponse: BedrockResponse = {
          content: JSON.stringify(rawOpps),
          usage: { inputTokens: 100, outputTokens: 200 },
          modelId: 'test-model',
        };

        const opportunities = service.parseOpportunities(bedrockResponse, mapping);

        // Verify sort order
        const priorityOrder: Record<OpportunityPriority, number> = {
          High: 3,
          Medium: 2,
          Low: 1,
        };

        for (let i = 0; i < opportunities.length - 1; i++) {
          const current = opportunities[i];
          const next = opportunities[i + 1];

          const currentPriorityValue = priorityOrder[current.priority];
          const nextPriorityValue = priorityOrder[next.priority];

          if (currentPriorityValue === nextPriorityValue) {
            // Same priority, check ARR is descending
            expect(current.estimatedARR).toBeGreaterThanOrEqual(next.estimatedARR);
          } else {
            // Different priority, current should be higher
            expect(currentPriorityValue).toBeGreaterThan(nextPriorityValue);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: Initial Status is Nueva
   * Validates: Requirements 5.2
   */
  test('Property 14: newly created opportunity has status Nueva', () => {
    fc.assert(
      fc.property(validRawOpportunityArb, (rawOpp) => {
        const mapping = createEmptyMapping();
        const opportunity = service.validateOpportunity(rawOpp, mapping);

        expect(opportunity.status).toBe('Nueva');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Spanish Language Output
   * Validates: Requirements 6.3
   */
  test('Property 16: opportunity text fields contain Spanish content', () => {
    // Spanish-specific patterns
    const spanishTextArb = fc.oneof(
      fc.constant('Migración a la nube de AWS'),
      fc.constant('Modernización de aplicaciones'),
      fc.constant('Optimización de costos'),
      fc.constant('Mejora de seguridad'),
      fc.constant('Implementación de estrategia DR')
    );

    const spanishOpportunityArb = fc.record({
      title: spanishTextArb,
      category: validCategoryArb,
      priority: validPriorityArb,
      estimatedARR: fc.integer({ min: 1000, max: 10000000 }),
      reasoning: fc.constant('Esta es una oportunidad importante para mejorar la infraestructura del cliente.'),
      evidence: fc.constant([
        'Se identificaron 50 servidores con bajo uso de CPU',
        'Costos actuales de infraestructura: $300,000/año',
        'Nivel de madurez 3/5 indica preparación para migración'
      ]),
      talkingPoints: fc.constant([
        'Reducción de costos operativos',
        'Mejora en la disponibilidad',
        'Mayor seguridad y cumplimiento'
      ]),
      nextSteps: fc.constant([
        'Realizar workshop técnico',
        'Crear plan de migración'
      ]),
      relatedServices: fc.constant(['Amazon EC2', 'AWS Lambda']),
    });

    fc.assert(
      fc.property(spanishOpportunityArb, (rawOpp) => {
        const mapping = createEmptyMapping();
        const opportunity = service.validateOpportunity(rawOpp, mapping);

        // Check for Spanish-specific characters or common Spanish words
        const spanishIndicators = /[áéíóúñü]|migración|optimización|implementación|estrategia|mejora/i;
        
        const hasSpanishInTitle = spanishIndicators.test(opportunity.title);
        const hasSpanishInReasoning = spanishIndicators.test(opportunity.reasoning);
        const hasSpanishInTalkingPoints = opportunity.talkingPoints.some(point => 
          spanishIndicators.test(point)
        );
        const hasSpanishInNextSteps = opportunity.nextSteps.some(step => 
          spanishIndicators.test(step)
        );

        // At least some fields should contain Spanish indicators
        const spanishFieldCount = [
          hasSpanishInTitle,
          hasSpanishInReasoning,
          hasSpanishInTalkingPoints,
          hasSpanishInNextSteps
        ].filter(Boolean).length;

        expect(spanishFieldCount).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 30: Minimum Opportunity Count
   * Validates: Requirements 12.4
   */
  test('Property 30: typical assessment data generates at least 3 opportunities', () => {
    // Generate at least 3 opportunities
    const opportunitiesArb = fc.array(validRawOpportunityArb, { minLength: 3, maxLength: 7 });

    fc.assert(
      fc.property(opportunitiesArb, (rawOpps) => {
        const mapping = createEmptyMapping();
        const bedrockResponse: BedrockResponse = {
          content: JSON.stringify(rawOpps),
          usage: { inputTokens: 100, outputTokens: 200 },
          modelId: 'test-model',
        };

        const opportunities = service.parseOpportunities(bedrockResponse, mapping);

        expect(opportunities.length).toBeGreaterThanOrEqual(3);
      }),
      { numRuns: 100 }
    );
  });
});
