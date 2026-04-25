// Legacy facade. Internally delegates to the multi-cloud `awsProvider` so the
// recommendation logic lives in one place (backend/src/cloud/providers/aws).
// Public shape (`EC2Recommendation`, `DatabaseRecommendation`) is preserved
// byte-for-byte so reportController and the docx generator keep working when
// no `selectedProviders` is sent (e.g., third-party API callers, MCP clients,
// pre-Sprint-1 cached frontend bundles).
//
// @deprecated since 2026-04. New code MUST call `getProvider('aws').compute.recommend()`
// or use `MultiCloudRecommendationService`.
//
// Removal criteria: this facade can be deleted once
//   1. All upstream callers (reportController, businessCaseController, MCP adapters)
//      have been migrated to MultiCloudRecommendationService directly, AND
//   2. Telemetry shows zero requests reaching `/generate-report` without
//      `selectedProviders` for at least one full release cycle.

import { Server, Database, EC2Recommendation, DatabaseRecommendation } from '../types';
import { awsProvider } from '../cloud/providers/aws';
import { normalizeOs } from '../cloud/algorithms/rightSizing';
import type {
  ComputeRecommendation,
  CloudDatabaseRecommendation,
} from '../../../shared/types/cloud.types';

interface EC2InstanceSpec {
  vcpus: number;
  memory: number;
  monthlyPriceOnDemand: number;
  monthlyPrice1YearNuri: number;
  monthlyPrice3YearNuri: number;
}

// Map the new semantic family names back to the legacy literal strings the
// frontend expects (t3 / m5 / r5 / c5). The selected SKU's prefix gives us
// the family for free, so we just slice it.
function legacyFamilyFromSku(sku: string): string {
  const prefix = sku.split('.')[0];
  return prefix;                     // 't3', 'm5', 'r5', 'c5' for AWS catalog
}

function toEC2(rec: ComputeRecommendation, server: Server): EC2Recommendation {
  return {
    hostname: rec.hostname,
    originalSpecs: rec.originalSpecs,
    recommendedInstance: rec.recommendedSku,
    instanceFamily: legacyFamilyFromSku(rec.recommendedSku),
    rightsizingNote: rec.rightsizingNote,
    monthlyEstimate: rec.monthlyEstimateOnDemand,
  };
}

function toDb(rec: CloudDatabaseRecommendation): DatabaseRecommendation {
  return {
    dbName: rec.dbName,
    sourceEngine: rec.sourceEngine,
    targetEngine: rec.targetService,
    instanceClass: rec.recommendedSku,
    storageGB: rec.storageGB,
    monthlyEstimate: rec.monthlyEstimateOnDemand,
    licenseModel: rec.licenseModel,
  };
}

export class EC2RecommendationService {
  generateRecommendations(servers: Server[], _region: string): EC2Recommendation[] {
    return servers.map((server) => {
      const totalVcpus = server.numCpus * server.numCoresPerCpu * (server.numThreadsPerCore || 1);
      const rec = awsProvider.compute.recommend({
        hostname: server.hostname,
        totalVcpus,
        totalRamGB: server.totalRAM,
        totalDiskGB: server.totalDiskSize,
        os: normalizeOs(server.osName),
        avgCpuUsage: server.avgCpuUsage,
        avgRamUsage: server.avgRamUsage,
        region: _region,
      });
      return toEC2(rec, server);
    });
  }

  generateDatabaseRecommendations(databases: Database[], _region: string): DatabaseRecommendation[] {
    return databases.map((db) => {
      const rec = awsProvider.database.recommend({
        dbName: db.dbName,
        engineType: db.engineType,
        totalSizeGB: db.totalSize,
        licenseModel: db.licenseModel,
        region: _region,
      });
      return toDb(rec);
    });
  }

  /** @deprecated Looking up legacy hardcoded specs by name. Use the catalog directly. */
  getInstancePricing(instanceName: string, isWindows: boolean = false): EC2InstanceSpec | undefined {
    const sku = awsProvider.compute.catalog.find((c) => c.sku === instanceName);
    if (!sku) return undefined;
    const mult = isWindows ? sku.osMultipliers?.windows ?? 1 : 1;
    return {
      vcpus: sku.vcpus,
      memory: sku.memoryGB,
      monthlyPriceOnDemand: sku.pricing.onDemandMonthlyUSD * mult,
      monthlyPrice1YearNuri: sku.pricing.oneYearMonthlyUSD * mult,
      monthlyPrice3YearNuri: sku.pricing.threeYearMonthlyUSD * mult,
    };
  }
}
