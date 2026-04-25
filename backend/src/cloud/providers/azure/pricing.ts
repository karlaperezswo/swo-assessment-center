import type { IPricingService, PricingFlags, PricingSubtotal } from '../../types';
import type { CommitmentTerm } from '../../../../../shared/types/cloud.types';

// Azure Reserved Instances:
//   1Y RI: ~40%
//   3Y RI: ~62%
// Azure Hybrid Benefit (AHB): -30% extra on the Windows portion when applicable.
const ONE_YEAR_DISCOUNT = 0.40;
const THREE_YEAR_DISCOUNT = 0.62;
const HYBRID_BENEFIT_RATE = 0.30;

export const azurePricing: IPricingService = {
  networkingRatio: 0.10,

  applyCommitmentDiscount(subtotal: PricingSubtotal, term: CommitmentTerm, flags?: PricingFlags): number {
    const compute = subtotal.compute + subtotal.managedDb;
    const nonCompute = subtotal.blockStorage + subtotal.networking;
    const baseRate = term === 'one_year' ? ONE_YEAR_DISCOUNT : term === 'three_year' ? THREE_YEAR_DISCOUNT : 0;
    let discounted = compute * (1 - baseRate);

    if (flags?.hybridBenefitWindows) {
      const winRatio = flags.windowsRatio ?? 0.5;
      discounted *= 1 - HYBRID_BENEFIT_RATE * winRatio;
    }

    return discounted + nonCompute;
  },

  availableSpecialDiscounts: [
    {
      code: 'azure_hybrid_benefit',
      description: 'Azure Hybrid Benefit (Software Assurance / on-prem Windows licenses)',
      applicableTo: 'compute',
      monthlySavingsUSD: 0,
    },
    {
      code: 'azure_dev_test_pricing',
      description: 'Azure Dev/Test pricing for Visual Studio subscribers',
      applicableTo: 'all',
      monthlySavingsUSD: 0,
    },
  ],

  calculatorUrl: (region: string) =>
    `https://azure.microsoft.com/en-us/pricing/calculator/?region=${encodeURIComponent(region)}`,
};
