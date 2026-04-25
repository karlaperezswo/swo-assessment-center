import type { IComputeService, RecommendationInput } from '../../types';
import type { ComputeRecommendation } from '../../../../../shared/types/cloud.types';
import { recommendCompute } from '../../algorithms/rightSizing';
import { AZURE_COMPUTE } from '../../../data/pricing/azure/compute';

export const azureCompute: IComputeService = {
  catalog: AZURE_COMPUTE,

  recommend(input: RecommendationInput): ComputeRecommendation {
    return recommendCompute(input, AZURE_COMPUTE, 'azure');
  },

  getBlockStoragePricePerGBMonth(): number {
    // Premium SSD v2 ~$0.12/GB/month in East US.
    return 0.12;
  },
};
