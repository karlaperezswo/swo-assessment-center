import type { IComputeService, RecommendationInput } from '../../types';
import type { ComputeRecommendation } from '../../../../../shared/types/cloud.types';
import { recommendCompute } from '../../algorithms/rightSizing';
import { GCP_COMPUTE } from '../../../data/pricing/gcp/compute';

export const gcpCompute: IComputeService = {
  catalog: GCP_COMPUTE,

  recommend(input: RecommendationInput): ComputeRecommendation {
    return recommendCompute(input, GCP_COMPUTE, 'gcp');
  },

  getBlockStoragePricePerGBMonth(): number {
    // pd-balanced ~$0.10/GB/month in us-central1
    return 0.10;
  },
};
