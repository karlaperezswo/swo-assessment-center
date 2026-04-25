// Frontend re-export of the cross-cloud types defined in shared/types/cloud.types.ts.
// Importing from here keeps frontend code self-contained without reaching into
// the shared/ directory directly from every component.

export type {
  CloudProvider,
  ComputeFamily,
  ComputeRecommendation,
  CloudDatabaseRecommendation,
  ProviderCostBreakdown,
  MultiCloudCostBreakdown,
  SpecialDiscount,
  GlobalRegion,
  LandingZoneSection,
  LandingZoneChecklistItem,
  GenericService,
} from '../../../shared/types/cloud.types';

export { ALL_CLOUDS, REGION_MAP } from '../../../shared/types/cloud.types';

import type { CloudProvider } from '../../../shared/types/cloud.types';

/** Persisted state shape for the active-clouds Context. */
export interface ActiveCloudsState {
  /** At least 1 element. Order = render order in tables/charts. */
  active: CloudProvider[];
  /** "Primary" cloud for single-cloud views (defaults to the first active one). */
  primary: CloudProvider;
}

export const DEFAULT_ACTIVE_CLOUDS: ActiveCloudsState = {
  active: ['aws'],
  primary: 'aws',
};
