import type { IComputeService, RecommendationInput } from '../../types';
import type { ComputeRecommendation } from '../../../../../shared/types/cloud.types';
import { recommendCompute } from '../../algorithms/rightSizing';
import { ORACLE_COMPUTE } from '../../../data/pricing/oracle/compute';
import { DEFAULT_FAMILY_RULES } from '../../algorithms/rightSizing';

// Oracle has no native burstable family — disable burstable selection so the
// algorithm naturally falls back to general (A1.Flex/E4.Flex small shapes).
const ORACLE_FAMILY_RULES = {
  ...DEFAULT_FAMILY_RULES,
  burstableMaxVcpus: 0,
  burstableMaxMemoryGB: 0,
};

export const oracleCompute: IComputeService = {
  catalog: ORACLE_COMPUTE,

  recommend(input: RecommendationInput): ComputeRecommendation {
    return recommendCompute(input, ORACLE_COMPUTE, 'oracle', undefined, ORACLE_FAMILY_RULES);
  },

  getBlockStoragePricePerGBMonth(): number {
    // OCI Block Volume default ~$0.0255/GB/month — significantly cheaper than other clouds.
    return 0.0255;
  },
};
