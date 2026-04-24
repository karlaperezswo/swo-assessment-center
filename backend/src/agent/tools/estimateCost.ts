import type { AgentTool } from './types';

interface Resource {
  type: 'ec2' | 'rds' | 'storage';
  vcpus?: number;
  ramGB?: number;
  storageGB?: number;
  windows?: boolean;
  engine?: string;
}
interface Input {
  resources: Resource[];
  currency?: 'USD';
}

/**
 * Napkin-math TCO estimator that mirrors the in-browser estimation in
 * App.tsx. Intentionally deterministic and offline — the agent uses this
 * for quick "what would this cost" answers; the real TCO runs through
 * Bedrock + the Business Case parser elsewhere.
 */
export const estimateCostTool: AgentTool<Input> = {
  name: 'estimate_cost',
  description:
    'Produce a quick monthly cost estimate for a list of candidate AWS ' +
    'resources. Deterministic heuristics — good enough for triage during a ' +
    'call, not a replacement for the formal Business Case report.',
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
  async run(input) {
    let monthly = 0;
    const breakdown = input.resources.map((r) => {
      const cost = costFor(r);
      monthly += cost;
      return { ...r, monthlyUSD: Math.round(cost) };
    });
    return {
      currency: 'USD',
      monthlyUSD: Math.round(monthly),
      annualUSD: Math.round(monthly * 12),
      threeYearUSD: Math.round(monthly * 36),
      breakdown,
      notes: [
        'On-demand pricing — Savings Plans typically reduce 30-40%.',
        'Excludes data transfer, support and backup.',
      ],
    };
  },
};

function costFor(r: Resource): number {
  if (r.type === 'storage') return (r.storageGB ?? 0) * 0.08;
  if (r.type === 'rds') {
    const size = r.storageGB ?? 50;
    let base = 50;
    if (size > 500) base = 350;
    else if (size > 200) base = 180;
    else if (size > 100) base = 125;
    else if (size > 50) base = 100;
    return base + size * 0.08;
  }
  // ec2
  const vcpus = r.vcpus ?? 2;
  const ram = r.ramGB ?? 8;
  let base = 70;
  if (vcpus <= 2 && ram <= 4) base = 30;
  else if (vcpus <= 4 && ram <= 16) base = 70;
  else if (vcpus <= 8 && ram <= 32) base = 140;
  else if (vcpus <= 16 && ram <= 64) base = 280;
  else base = 560;
  if (r.windows) base *= 1.8;
  return base;
}
