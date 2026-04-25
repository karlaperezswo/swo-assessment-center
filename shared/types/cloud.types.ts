// Cross-cloud shared types — used by both backend and frontend.
// Lives in shared/ so both ends of the wire agree on shape.

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'oracle';

export const ALL_CLOUDS: readonly CloudProvider[] = ['aws', 'gcp', 'azure', 'oracle'] as const;

export type ComputeFamily = 'burstable' | 'general' | 'compute_optimized' | 'memory_optimized';

export type CommitmentTerm = 'on_demand' | 'one_year' | 'three_year';

export type NormalizedOS = 'linux' | 'windows' | 'rhel' | 'sles';

export type NormalizedDbEngine =
  | 'sqlserver'
  | 'mysql'
  | 'mariadb'
  | 'postgresql'
  | 'oracle';

// Region abstraction. A GlobalRegion resolves to a provider-specific SKU via REGION_MAP.
export type GlobalRegion =
  | 'us-east'
  | 'us-west'
  | 'us-central'
  | 'eu-west'
  | 'eu-central'
  | 'eu-north'
  | 'apac-southeast'
  | 'apac-northeast'
  | 'apac-south'
  | 'sa-east'
  | 'me-central'
  | 'af-south';

export const REGION_MAP: Readonly<Record<GlobalRegion, Readonly<Record<CloudProvider, string>>>> = Object.freeze({
  'us-east':         { aws: 'us-east-1',     gcp: 'us-east1',     azure: 'eastus',         oracle: 'us-ashburn-1' },
  'us-west':         { aws: 'us-west-2',     gcp: 'us-west1',     azure: 'westus2',        oracle: 'us-phoenix-1' },
  'us-central':      { aws: 'us-east-2',     gcp: 'us-central1',  azure: 'centralus',      oracle: 'us-chicago-1' },
  'eu-west':         { aws: 'eu-west-1',     gcp: 'europe-west1', azure: 'westeurope',     oracle: 'eu-frankfurt-1' },
  'eu-central':      { aws: 'eu-central-1',  gcp: 'europe-west3', azure: 'westeurope',     oracle: 'eu-frankfurt-1' },
  'eu-north':        { aws: 'eu-west-2',     gcp: 'europe-north1',azure: 'northeurope',    oracle: 'uk-london-1' },
  'apac-southeast':  { aws: 'ap-southeast-1',gcp: 'asia-southeast1', azure: 'southeastasia', oracle: 'ap-singapore-1' },
  'apac-northeast':  { aws: 'ap-northeast-1',gcp: 'asia-northeast1', azure: 'japaneast',   oracle: 'ap-tokyo-1' },
  'apac-south':      { aws: 'ap-southeast-2',gcp: 'asia-south1',  azure: 'centralindia',   oracle: 'ap-mumbai-1' },
  'sa-east':         { aws: 'sa-east-1',     gcp: 'southamerica-east1', azure: 'brazilsouth', oracle: 'sa-saopaulo-1' },
  'me-central':      { aws: 'eu-central-1',  gcp: 'me-central1',  azure: 'uaenorth',       oracle: 'me-jeddah-1' },
  'af-south':        { aws: 'eu-west-1',     gcp: 'africa-south1',azure: 'southafricanorth', oracle: 'af-johannesburg-1' },
});

export interface CostEstimate {
  monthly: number;
  annual: number;
  threeYear: number;
}

// Catalog entry for a compute SKU in a single provider.
export interface ComputeInstanceType {
  provider: CloudProvider;
  sku: string;                       // 'm5.large' | 'n2-standard-4' | 'Standard_D2s_v5' | 'VM.Standard.E4.Flex-2-16'
  displayName: string;
  family: ComputeFamily;
  vcpus: number;
  memoryGB: number;
  burstable: boolean;
  archHint?: 'x86' | 'arm';
  pricing: {
    onDemandMonthlyUSD: number;
    oneYearMonthlyUSD: number;
    threeYearMonthlyUSD: number;
  };
  // Per-OS multipliers applied on top of base Linux pricing.
  // Different clouds price Windows/RHEL/SLES differently (AWS 1.8x; Azure ~1.42x; GCP ~1.5x).
  osMultipliers?: Partial<Record<NormalizedOS, number>>;
}

// Catalog entry for a managed-database SKU.
export interface ManagedDbInstanceType {
  provider: CloudProvider;
  sku: string;
  displayName: string;
  family: ComputeFamily;
  vcpus: number;
  memoryGB: number;
  pricing: {
    onDemandMonthlyUSD: number;
    oneYearMonthlyUSD: number;
    threeYearMonthlyUSD: number;
  };
  supportedEngines: NormalizedDbEngine[];
}

// Cross-cloud compute recommendation.
export interface ComputeRecommendation {
  provider: CloudProvider;
  hostname: string;
  originalSpecs: {
    vcpus: number;
    ram: number;
    storage: number;
  };
  recommendedSku: string;
  family: ComputeFamily;
  rightsizingNote: string;
  monthlyEstimateOnDemand: number;
  monthlyEstimateOneYear: number;
  monthlyEstimateThreeYear: number;
}

// Cross-cloud database recommendation.
export interface CloudDatabaseRecommendation {
  provider: CloudProvider;
  dbName: string;
  sourceEngine: string;
  targetService: string;             // 'Amazon RDS for SQL Server' | 'Cloud SQL for SQL Server' | ...
  recommendedSku: string;
  storageGB: number;
  monthlyEstimateOnDemand: number;
  monthlyEstimateOneYear: number;
  monthlyEstimateThreeYear: number;
  licenseModel: string;
}

// Special discounts that don't fit the standard 3-tier model
// (Azure Hybrid Benefit, Oracle BYOL, GCP Sustained Use, etc.)
export interface SpecialDiscount {
  code: string;
  description: string;
  applicableTo: 'compute' | 'database' | 'all';
  monthlySavingsUSD: number;
}

// Per-provider cost rollup with the same shape across all clouds.
export interface ProviderCostBreakdown {
  provider: CloudProvider;
  onDemand: CostEstimate;
  oneYearCommit: CostEstimate;       // Generic name (not "NURI") — each provider maps to its own commit instrument.
  threeYearCommit: CostEstimate;
  componentBreakdown: {
    compute: number;
    managedDb: number;
    blockStorage: number;
    networking: number;
  };
  specialDiscounts?: SpecialDiscount[];
}

export interface MultiCloudCostBreakdown {
  providers: ProviderCostBreakdown[];
  cheapest: CloudProvider;
  comparisonNotes: string[];
}

// Landing Zone modeling — one item in a checklist section.
export interface LandingZoneChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'na';
  docsUrl?: string;
  experimental?: boolean;            // true until validated by a certified architect
}

export interface LandingZoneSection {
  id: string;                        // 'org_structure' | 'identity' | 'networking' | 'logging' | 'security' | 'governance'
  title: string;
  items: LandingZoneChecklistItem[];
}

// Architecture diagram — generic services that map to provider-specific icons.
export type GenericService =
  | 'compute'
  | 'managed_db'
  | 'load_balancer'
  | 'object_storage'
  | 'block_storage'
  | 'queue'
  | 'cdn'
  | 'cache'
  | 'vpn'
  | 'dns'
  | 'secrets'
  | 'identity'
  | 'monitoring';
