// Legacy AWS-only cost estimator. Now an alias of `estimate_cloud_cost` with
// provider hard-coded to 'aws'. The legacy resource-type names ('ec2'/'rds'/
// 'storage') are translated to the multi-cloud generic names.
//
// @deprecated Use `estimate_cloud_cost`. Remove in F7.

import type { AgentTool } from './types';
import { estimateCloudCostTool } from './estimateCloudCost';

type LegacyResourceType = 'ec2' | 'rds' | 'storage';
interface LegacyResource {
  type: LegacyResourceType;
  vcpus?: number;
  ramGB?: number;
  storageGB?: number;
  windows?: boolean;
  engine?: string;
}
interface Input {
  resources: LegacyResource[];
  currency?: 'USD';
}

const TYPE_MAP: Record<LegacyResourceType, 'compute' | 'managed_db' | 'block_storage'> = {
  ec2: 'compute',
  rds: 'managed_db',
  storage: 'block_storage',
};

export const estimateCostTool: AgentTool<Input> = {
  name: 'estimate_cost',
  description: '(legacy) AWS-only quick cost estimate. New code should call estimate_cloud_cost.',
  input_schema: {
    type: 'object',
    properties: {
      resources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['ec2', 'rds', 'storage'] },
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
    required: ['resources'],
    additionalProperties: false,
  },
  async run(input, ctx) {
    return estimateCloudCostTool.run(
      {
        provider: 'aws',
        currency: input.currency,
        resources: input.resources.map((r) => ({ ...r, type: TYPE_MAP[r.type] })),
      },
      ctx
    );
  },
};
