// Orchestrator that runs the recommendation + cost rollup for one or more
// cloud providers in parallel and returns per-provider results plus a
// MultiCloudCostBreakdown ready for the frontend / docx generator to consume.

import type { Server, Database } from '../types';
import type {
  CloudProvider,
  ComputeRecommendation,
  CloudDatabaseRecommendation,
  ProviderCostBreakdown,
  MultiCloudCostBreakdown,
} from '../../../shared/types/cloud.types';
import { CLOUD_PROVIDERS, getProvider } from '../cloud/registry';
import { calculateProviderCosts } from '../cloud/algorithms/costCalculator';
import { normalizeOs } from '../cloud/algorithms/rightSizing';
import type { PricingFlags } from '../cloud/types';

export interface MultiCloudRunInput {
  servers: Server[];
  databases: Database[];
  selectedProviders: CloudProvider[];
  /** Per-provider region. When absent, each provider uses its `defaultRegion`. */
  regions?: Partial<Record<CloudProvider, string>>;
  /** Per-provider pricing flags (e.g., Hybrid Benefit on Azure, BYOL on Oracle). */
  pricingFlags?: Partial<Record<CloudProvider, PricingFlags>>;
}

export interface ProviderRunResult {
  provider: CloudProvider;
  region: string;
  compute: ComputeRecommendation[];
  databases: CloudDatabaseRecommendation[];
  cost: ProviderCostBreakdown;
}

export interface MultiCloudRunResult {
  byProvider: Record<CloudProvider, ProviderRunResult | undefined>;
  multiCloud: MultiCloudCostBreakdown;
}

export class MultiCloudRecommendationService {
  async run(input: MultiCloudRunInput): Promise<MultiCloudRunResult> {
    const providers = this.normalizeProviders(input.selectedProviders);
    const totalStorageGB = input.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0);

    const byProvider: Record<string, ProviderRunResult> = {};
    for (const id of providers) {
      const provider = getProvider(id);
      const region = input.regions?.[id] ?? provider.defaultRegion;

      const compute = input.servers.map((server) => {
        const totalVcpus = server.numCpus * server.numCoresPerCpu * (server.numThreadsPerCore || 1);
        return provider.compute.recommend({
          hostname: server.hostname,
          totalVcpus,
          totalRamGB: server.totalRAM,
          totalDiskGB: server.totalDiskSize,
          os: normalizeOs(server.osName),
          avgCpuUsage: server.avgCpuUsage,
          avgRamUsage: server.avgRamUsage,
          region,
        });
      });

      const databases = input.databases.map((db) =>
        provider.database.recommend({
          dbName: db.dbName,
          engineType: db.engineType,
          totalSizeGB: db.totalSize,
          licenseModel: db.licenseModel,
          region,
        })
      );

      const cost = calculateProviderCosts({
        provider: id,
        computeRecs: compute,
        dbRecs: databases,
        totalBlockStorageGB: totalStorageGB,
        blockStoragePricePerGBMonth: provider.compute.getBlockStoragePricePerGBMonth(),
        pricing: provider.pricing,
        flags: input.pricingFlags?.[id],
      });

      byProvider[id] = { provider: id, region, compute, databases, cost };
    }

    return {
      byProvider: byProvider as MultiCloudRunResult['byProvider'],
      multiCloud: this.buildMultiCloudRollup(Object.values(byProvider)),
    };
  }

  private normalizeProviders(input: CloudProvider[] | undefined): CloudProvider[] {
    const requested = input && input.length > 0 ? input : (['aws'] as CloudProvider[]);
    const known = new Set(Object.keys(CLOUD_PROVIDERS) as CloudProvider[]);
    const filtered = requested.filter((p) => known.has(p));
    if (filtered.length === 0) return ['aws'];
    // Dedup, preserve order.
    const seen = new Set<CloudProvider>();
    return filtered.filter((p) => (seen.has(p) ? false : (seen.add(p), true)));
  }

  private buildMultiCloudRollup(results: ProviderRunResult[]): MultiCloudCostBreakdown {
    if (results.length === 0) {
      return { providers: [], cheapest: 'aws', comparisonNotes: [] };
    }

    const providers: ProviderCostBreakdown[] = results.map((r) => r.cost);
    let cheapest = providers[0];
    for (const p of providers) {
      if (p.threeYearCommit.monthly < cheapest.threeYearCommit.monthly) cheapest = p;
    }

    const comparisonNotes: string[] = [];
    if (providers.length > 1) {
      const sorted = [...providers].sort(
        (a, b) => a.threeYearCommit.monthly - b.threeYearCommit.monthly
      );
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const delta = max.threeYearCommit.monthly - min.threeYearCommit.monthly;
      const pct = max.threeYearCommit.monthly > 0
        ? (delta / max.threeYearCommit.monthly) * 100
        : 0;
      comparisonNotes.push(
        `${min.provider.toUpperCase()} is the cheapest 3-year option, ${pct.toFixed(1)}% below ${max.provider.toUpperCase()} (delta $${delta.toFixed(2)}/mo).`
      );
    }

    return { providers, cheapest: cheapest.provider, comparisonNotes };
  }
}
