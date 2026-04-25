// Multi-cloud quick cost estimator. Wraps the provider's compute/database
// recommend() functions for napkin-math during a consultant call. Deterministic
// and offline. The full TCO still goes through MultiCloudRecommendationService
// + the docx report.

import type { AgentTool } from './types';
import type { CloudProvider } from '../../../../shared/types/cloud.types';
import { CLOUD_PROVIDERS } from '../../cloud/registry';

interface Resource {
  type: 'compute' | 'managed_db' | 'block_storage';
  vcpus?: number;
  ramGB?: number;
  storageGB?: number;
  windows?: boolean;
  engine?: string;
}

interface Input {
  provider: CloudProvider;
  resources: Resource[];
  currency?: 'USD';
}

export const estimateCloudCostTool: AgentTool<Input> = {
  name: 'estimate_cloud_cost',
  description:
    'Produce a quick monthly cost estimate for candidate resources on a ' +
    'specific cloud provider. Deterministic heuristics — good enough for ' +
    'triage during a call, not a replacement for the formal Business Case.',
  input_schema: {
    type: 'object',
    properties: {
      provider: { type: 'string', enum: ['aws', 'gcp', 'azure', 'oracle'] },
      resources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['compute', 'managed_db', 'block_storage'] },
            vcpus: { type: 'number' },
            ramGB: { type: 'number' },
            storageGB: { type: 'number' },
            windows: { type: 'boolean' },
            engine: { type: 'string' },
          },
          required: ['type'],
        },
      },
      currency: { type: 'string', enum: ['USD'] },
    },
    required: ['provider', 'resources'],
    additionalProperties: false,
  },
  async run(input, ctx) {
    const active = ctx.activeProviders ?? ['aws'];
    if (!active.includes(input.provider)) {
      return {
        error:
          `Provider '${input.provider}' is not active in this session. ` +
          `Active providers: ${active.join(', ')}.`,
      };
    }
    const provider = CLOUD_PROVIDERS[input.provider];

    let monthly = 0;
    const breakdown = input.resources.map((r) => {
      let cost = 0;
      let detail = '';
      if (r.type === 'block_storage') {
        cost = (r.storageGB ?? 0) * provider.compute.getBlockStoragePricePerGBMonth();
        detail = `${r.storageGB ?? 0}GB block storage`;
      } else if (r.type === 'compute') {
        const rec = provider.compute.recommend({
          hostname: 'estimate',
          totalVcpus: r.vcpus ?? 2,
          totalRamGB: r.ramGB ?? 8,
          totalDiskGB: r.storageGB ?? 50,
          os: r.windows ? 'windows' : 'linux',
          region: provider.defaultRegion,
        });
        cost = rec.monthlyEstimateOnDemand;
        detail = `${rec.recommendedSku} (${rec.family})`;
      } else if (r.type === 'managed_db') {
        const rec = provider.database.recommend({
          dbName: 'estimate',
          engineType: r.engine ?? 'MySQL',
          totalSizeGB: r.storageGB ?? 50,
          licenseModel: 'license-included',
          region: provider.defaultRegion,
        });
        cost = rec.monthlyEstimateOnDemand;
        detail = `${rec.recommendedSku} on ${rec.targetService}`;
      }
      monthly += cost;
      return { ...r, monthlyUSD: Math.round(cost), detail };
    });

    return {
      provider: input.provider,
      currency: 'USD',
      monthlyUSD: Math.round(monthly),
      annualUSD: Math.round(monthly * 12),
      threeYearUSD: Math.round(monthly * 36),
      breakdown,
      notes: [
        'On-demand pricing — committed-use discounts vary by provider (~25% to 62%).',
        'Excludes data transfer, support, backup and special discounts (Hybrid Benefit, BYOL, Sustained Use).',
      ],
    };
  },
};
