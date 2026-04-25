import type { IPricingService, PricingFlags, PricingSubtotal } from '../../types';
import type { CommitmentTerm } from '../../../../../shared/types/cloud.types';

// GCP Committed Use Discounts (CUDs):
//   1Y resource-based: ~37%
//   3Y resource-based: ~55%
// Sustained Use Discount applies automatically to on-demand n2/n1 (~30% on n1, ~20% on n2)
// — modeled as a flat 5% extra on-demand reduction representative of the average workload.
const ONE_YEAR_DISCOUNT = 0.37;
const THREE_YEAR_DISCOUNT = 0.55;
const SUSTAINED_USE_ON_DEMAND_REDUCTION = 0.05;

export const gcpPricing: IPricingService = {
  // GCP egress is slightly cheaper inter-region than AWS; ratio scaled accordingly.
  networkingRatio: 0.08,

  applyCommitmentDiscount(subtotal: PricingSubtotal, term: CommitmentTerm, _flags?: PricingFlags): number {
    const compute = subtotal.compute + subtotal.managedDb;
    const nonCompute = subtotal.blockStorage + subtotal.networking;
    const rate =
      term === 'one_year' ? ONE_YEAR_DISCOUNT :
      term === 'three_year' ? THREE_YEAR_DISCOUNT :
      SUSTAINED_USE_ON_DEMAND_REDUCTION;
    return compute * (1 - rate) + nonCompute;
  },

  availableSpecialDiscounts: [
    {
      code: 'gcp_sustained_use',
      description: 'Sustained Use Discount (automatic for n1/n2/e2 instances running >25% of the month)',
      applicableTo: 'compute',
      monthlySavingsUSD: 0,
    },
  ],

  calculatorUrl: (region: string) =>
    `https://cloud.google.com/products/calculator?region=${encodeURIComponent(region)}`,
};
