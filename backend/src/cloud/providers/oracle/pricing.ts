import type { IPricingService, PricingFlags, PricingSubtotal } from '../../types';
import type { CommitmentTerm } from '../../../../../shared/types/cloud.types';

// OCI Annual Universal Credits / Monthly Flex commit:
//   1Y commit: ~25%
//   3Y commit: ~33%
// BYOL: -50% on Oracle DB managed services when customer brings own license.
const ONE_YEAR_DISCOUNT = 0.25;
const THREE_YEAR_DISCOUNT = 0.33;
const BYOL_DB_DISCOUNT = 0.50;

export const oraclePricing: IPricingService = {
  // OCI egress is the cheapest of the four clouds (10 TB/mo free).
  networkingRatio: 0.05,

  applyCommitmentDiscount(subtotal: PricingSubtotal, term: CommitmentTerm, flags?: PricingFlags): number {
    const compute = subtotal.compute + subtotal.managedDb;
    const nonCompute = subtotal.blockStorage + subtotal.networking;
    const rate = term === 'one_year' ? ONE_YEAR_DISCOUNT : term === 'three_year' ? THREE_YEAR_DISCOUNT : 0;
    let discounted = compute * (1 - rate);

    if (flags?.byol) {
      // BYOL applies to the DB share only — subtract its discounted contribution.
      discounted -= subtotal.managedDb * (1 - rate) * BYOL_DB_DISCOUNT;
    }

    return discounted + nonCompute;
  },

  availableSpecialDiscounts: [
    {
      code: 'oracle_byol',
      description: 'Bring Your Own License (Oracle DB / Java / WebLogic)',
      applicableTo: 'database',
      monthlySavingsUSD: 0,
    },
    {
      code: 'oracle_universal_credits',
      description: 'Annual or Monthly Flex Universal Credits commitment',
      applicableTo: 'all',
      monthlySavingsUSD: 0,
    },
    {
      code: 'oracle_support_rewards',
      description: 'Oracle Support Rewards (25% on-prem support credit per $1 OCI spend)',
      applicableTo: 'all',
      monthlySavingsUSD: 0,
    },
  ],

  calculatorUrl: (region: string) =>
    `https://www.oracle.com/cloud/costestimator.html?region=${encodeURIComponent(region)}`,
};
