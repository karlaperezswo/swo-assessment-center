import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { OpportunityCard } from '../OpportunityCard';
import { Opportunity, OpportunityPriority, OpportunityStatus } from '@shared/types/opportunity.types';

/**
 * Feature: sales-opportunity-analyzer
 * Property 18: Opportunity Card Required Information
 * Validates: Requirements 7.2
 * 
 * For any rendered opportunity card, it should display the title, priority, estimatedARR, and status.
 */

// Arbitraries for generating test data
const opportunityPriorityArb = fc.constantFrom<OpportunityPriority>('High', 'Medium', 'Low');
const opportunityStatusArb = fc.constantFrom<OpportunityStatus>(
  'Nueva', 'En Progreso', 'Ganada', 'Perdida', 'Descartada'
);

const opportunityArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  priority: opportunityPriorityArb,
  estimatedARR: fc.integer({ min: 10000, max: 1000000 }),
  reasoning: fc.string({ minLength: 20, maxLength: 200 }),
  talkingPoints: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 3, maxLength: 5 }),
  nextSteps: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 2, maxLength: 4 }),
  relatedServices: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
  status: opportunityStatusArb,
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<Opportunity>;

describe('OpportunityCard - Property Tests', () => {
  it('Property 18: displays all required information (title, priority, ARR, status)', () => {
    fc.assert(
      fc.property(opportunityArb, (opportunity) => {
        const { container } = render(
          <OpportunityCard opportunity={opportunity} onClick={() => {}} />
        );

        // Check title is displayed
        expect(screen.getByText(opportunity.title)).toBeInTheDocument();

        // Check priority is displayed
        expect(screen.getByText(opportunity.priority)).toBeInTheDocument();

        // Check status is displayed
        expect(screen.getByText(opportunity.status)).toBeInTheDocument();

        // Check ARR is displayed (formatted with commas)
        const formattedARR = opportunity.estimatedARR.toLocaleString();
        expect(screen.getByText(new RegExp(formattedARR))).toBeInTheDocument();

        // Verify all four required elements are present
        const hasTitle = container.textContent?.includes(opportunity.title);
        const hasPriority = container.textContent?.includes(opportunity.priority);
        const hasStatus = container.textContent?.includes(opportunity.status);
        const hasARR = container.textContent?.includes(formattedARR);

        expect(hasTitle && hasPriority && hasStatus && hasARR).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
