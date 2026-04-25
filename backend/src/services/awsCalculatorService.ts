// Legacy facade. Delegates cost rollup to `calculateProviderCosts` over the
// AWS provider. Public shape (`CostBreakdown` with onDemand/oneYearNuri/threeYearNuri)
// is preserved so reportController and the docx generator keep working when
// no `selectedProviders` is sent.
//
// @deprecated since 2026-04. Use `MultiCloudRecommendationService` for new code.
//
// Removal criteria: same as ec2RecommendationService.ts — wait until telemetry
// shows zero AWS-only-implicit requests for one full release cycle.

import { EC2Recommendation, DatabaseRecommendation, Server, CostEstimate } from '../types';
import { awsProvider } from '../cloud/providers/aws';
import { calculateProviderCosts } from '../cloud/algorithms/costCalculator';
import type {
  ComputeRecommendation,
  CloudDatabaseRecommendation,
} from '../../../shared/types/cloud.types';

interface CostBreakdown {
  onDemand: CostEstimate;
  oneYearNuri: CostEstimate;
  threeYearNuri: CostEstimate;
}

const EBS_PRICE_PER_GB = 0.08;     // gp3, AWS default — kept here as legacy export.

function liftRec(rec: EC2Recommendation): ComputeRecommendation {
  // Approximate the 1Y/3Y rates from the on-demand monthly: the legacy callers
  // only have the on-demand number on the recommendation, so we recover the
  // committed-tier figures from the catalog using the SKU.
  const sku = awsProvider.compute.catalog.find((c) => c.sku === rec.recommendedInstance);
  const isWindows = rec.monthlyEstimate > 0 && sku
    ? Math.abs(rec.monthlyEstimate - sku.pricing.onDemandMonthlyUSD * 1.8) <
      Math.abs(rec.monthlyEstimate - sku.pricing.onDemandMonthlyUSD)
    : false;
  const mult = isWindows && sku?.osMultipliers?.windows ? sku.osMultipliers.windows : 1;

  return {
    provider: 'aws',
    hostname: rec.hostname,
    originalSpecs: rec.originalSpecs,
    recommendedSku: rec.recommendedInstance,
    family: sku?.family ?? 'general',
    rightsizingNote: rec.rightsizingNote,
    monthlyEstimateOnDemand: rec.monthlyEstimate,
    monthlyEstimateOneYear: (sku?.pricing.oneYearMonthlyUSD ?? 0) * mult,
    monthlyEstimateThreeYear: (sku?.pricing.threeYearMonthlyUSD ?? 0) * mult,
  };
}

function liftDb(rec: DatabaseRecommendation): CloudDatabaseRecommendation {
  const sku = awsProvider.database.catalog.find((c) => c.sku === rec.instanceClass);
  const storageCost = rec.storageGB * EBS_PRICE_PER_GB;

  return {
    provider: 'aws',
    dbName: rec.dbName,
    sourceEngine: rec.sourceEngine,
    targetService: rec.targetEngine,
    recommendedSku: rec.instanceClass,
    storageGB: rec.storageGB,
    monthlyEstimateOnDemand: rec.monthlyEstimate,
    monthlyEstimateOneYear: (sku?.pricing.oneYearMonthlyUSD ?? 0) + storageCost,
    monthlyEstimateThreeYear: (sku?.pricing.threeYearMonthlyUSD ?? 0) + storageCost,
    licenseModel: rec.licenseModel,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export class AWSCalculatorService {
  calculateCosts(
    ec2Recommendations: EC2Recommendation[],
    dbRecommendations: DatabaseRecommendation[],
    servers: Server[]
  ): CostBreakdown {
    const totalStorageGB = servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0);

    const result = calculateProviderCosts({
      provider: 'aws',
      computeRecs: ec2Recommendations.map(liftRec),
      dbRecs: dbRecommendations.map(liftDb),
      totalBlockStorageGB: totalStorageGB,
      blockStoragePricePerGBMonth: awsProvider.compute.getBlockStoragePricePerGBMonth(),
      pricing: awsProvider.pricing,
    });

    return {
      onDemand: {
        monthly: round2(result.onDemand.monthly),
        annual: round2(result.onDemand.annual),
        threeYear: round2(result.onDemand.threeYear),
      },
      oneYearNuri: {
        monthly: round2(result.oneYearCommit.monthly),
        annual: round2(result.oneYearCommit.annual),
        threeYear: round2(result.oneYearCommit.threeYear),
      },
      threeYearNuri: {
        monthly: round2(result.threeYearCommit.monthly),
        annual: round2(result.threeYearCommit.annual),
        threeYear: round2(result.threeYearCommit.threeYear),
      },
    };
  }

  generateCalculatorLinks(
    region: string,
    _ec2Recommendations: EC2Recommendation[],
    _dbRecommendations: DatabaseRecommendation[]
  ): { onDemand: string; oneYearNuri: string; threeYearNuri: string } {
    const url = `https://calculator.aws/#/estimate?region=${encodeURIComponent(region)}`;
    return { onDemand: url, oneYearNuri: url, threeYearNuri: url };
  }

  generateDetailedCostBreakdown(
    ec2Recommendations: EC2Recommendation[],
    dbRecommendations: DatabaseRecommendation[],
    servers: Server[]
  ): {
    ec2: { total: number; details: { instance: string; cost: number }[] };
    ebs: { total: number; totalGB: number };
    rds: { total: number; details: { db: string; cost: number }[] };
    networking: { total: number };
  } {
    const ec2Details = ec2Recommendations.map((rec) => ({
      instance: `${rec.hostname} (${rec.recommendedInstance})`,
      cost: rec.monthlyEstimate,
    }));
    const totalStorageGB = servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0);
    const ebsTotal = totalStorageGB * EBS_PRICE_PER_GB;
    const rdsDetails = dbRecommendations.map((rec) => ({
      db: `${rec.dbName} (${rec.instanceClass})`,
      cost: rec.monthlyEstimate,
    }));
    const ec2Total = ec2Recommendations.reduce((sum, r) => sum + r.monthlyEstimate, 0);
    const rdsTotal = dbRecommendations.reduce((sum, r) => sum + r.monthlyEstimate, 0);
    return {
      ec2: { total: ec2Total, details: ec2Details },
      ebs: { total: ebsTotal, totalGB: totalStorageGB },
      rds: { total: rdsTotal, details: rdsDetails },
      networking: { total: (ec2Total + rdsTotal) * awsProvider.pricing.networkingRatio },
    };
  }
}
