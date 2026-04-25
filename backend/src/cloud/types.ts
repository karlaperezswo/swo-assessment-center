// Backend-only cloud provider interfaces.
// Cross-cloud value types live in shared/types/cloud.types.ts.

import type {
  CloudProvider,
  ComputeFamily,
  ComputeInstanceType,
  ComputeRecommendation,
  ManagedDbInstanceType,
  CloudDatabaseRecommendation,
  NormalizedOS,
  NormalizedDbEngine,
  CommitmentTerm,
  SpecialDiscount,
  LandingZoneSection,
} from '../../../shared/types/cloud.types';

export type {
  CloudProvider,
  ComputeFamily,
  ComputeInstanceType,
  ComputeRecommendation,
  ManagedDbInstanceType,
  CloudDatabaseRecommendation,
  NormalizedOS,
  NormalizedDbEngine,
  CommitmentTerm,
  SpecialDiscount,
  LandingZoneSection,
};

export interface RecommendationInput {
  hostname: string;
  totalVcpus: number;
  totalRamGB: number;
  totalDiskGB: number;
  os: NormalizedOS;
  avgCpuUsage?: number;
  avgRamUsage?: number;
  region: string;
}

export interface DbRecommendationInput {
  dbName: string;
  engineType: string;
  totalSizeGB: number;
  licenseModel: string;
  region: string;
}

export interface IComputeService {
  readonly catalog: readonly ComputeInstanceType[];
  recommend(input: RecommendationInput): ComputeRecommendation;
  getBlockStoragePricePerGBMonth(): number;
}

export interface IDatabaseService {
  readonly catalog: readonly ManagedDbInstanceType[];
  recommend(input: DbRecommendationInput): CloudDatabaseRecommendation;
  mapEngine(sourceEngine: string): { service: string; engine: NormalizedDbEngine };
}

export interface PricingSubtotal {
  compute: number;
  managedDb: number;
  blockStorage: number;
  networking: number;
}

export interface PricingFlags {
  hybridBenefitWindows?: boolean;
  byol?: boolean;
  windowsRatio?: number;             // share of compute that runs Windows (0..1) — used by Hybrid Benefit math
}

export interface IPricingService {
  readonly networkingRatio: number;
  applyCommitmentDiscount(subtotal: PricingSubtotal, term: CommitmentTerm, flags?: PricingFlags): number;
  readonly availableSpecialDiscounts: readonly SpecialDiscount[];
  readonly calculatorUrl: (region: string) => string;
}

export interface IFrameworkService {
  readonly frameworkName: string;
  readonly pillars: readonly string[];
  readonly canonicalUrl: string;
  readonly landingZoneSections: readonly LandingZoneSection[];
}

export interface IDocsService {
  buildSearchUrl(query: string): string;
  readonly portalSearchUrl: (q: string) => string;
  readonly priorityLinks: readonly { url: string; title: string }[];
}

export interface ICloudProvider {
  readonly id: CloudProvider;
  readonly displayName: string;
  readonly defaultRegion: string;
  readonly availableRegions: readonly string[];
  readonly compute: IComputeService;
  readonly database: IDatabaseService;
  readonly pricing: IPricingService;
  readonly framework: IFrameworkService;
  readonly docs: IDocsService;
}
