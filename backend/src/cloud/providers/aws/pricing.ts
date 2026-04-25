import type { IPricingService, PricingFlags, PricingSubtotal } from '../../types';
import type { CommitmentTerm } from '../../../../../shared/types/cloud.types';

// AWS commitment-discount rates extracted from the legacy AWSCalculatorService
// (lines 11-12: oneYear -36%, threeYear -60%). Discounts apply to compute only;
// block storage and networking are passed through.
const ONE_YEAR_DISCOUNT = 0.36;
const THREE_YEAR_DISCOUNT = 0.60;

export const awsPricing: IPricingService = {
  // Networking ratio extracted from legacy code (line 41-42 of awsCalculatorService).
  networkingRatio: 0.10,

  applyCommitmentDiscount(subtotal: PricingSubtotal, term: CommitmentTerm, _flags?: PricingFlags): number {
    const compute = subtotal.compute + subtotal.managedDb;
    const nonCompute = subtotal.blockStorage + subtotal.networking;
    const rate = term === 'one_year' ? ONE_YEAR_DISCOUNT : term === 'three_year' ? THREE_YEAR_DISCOUNT : 0;
    return compute * (1 - rate) + nonCompute;
  },

  availableSpecialDiscounts: [],

  calculatorUrl: (region: string) =>
    `https://calculator.aws/#/addService/EC2?region=${encodeURIComponent(region)}`,
};
