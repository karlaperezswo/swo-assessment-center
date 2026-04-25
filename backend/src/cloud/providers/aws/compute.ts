import type { IComputeService, RecommendationInput } from '../../types';
import type { ComputeRecommendation } from '../../../../../shared/types/cloud.types';
import { recommendCompute } from '../../algorithms/rightSizing';
import { AWS_COMPUTE } from '../../../data/pricing/aws/compute';

export const awsCompute: IComputeService = {
  catalog: AWS_COMPUTE,

  recommend(input: RecommendationInput): ComputeRecommendation {
    return recommendCompute(input, AWS_COMPUTE, 'aws');
  },

  getBlockStoragePricePerGBMonth(): number {
    // gp3 — $0.08/GB/month — same constant the legacy AWSCalculatorService uses.
    return 0.08;
  },
};
