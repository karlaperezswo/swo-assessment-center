import { CostBreakdown } from '@/types/assessment';

export interface TCOScenario {
  id: string;
  label: string;
  description: string;
  monthly: number;
  annual: number;
  threeYear: number;
  savingsVsOnDemand: number;
  savingsPercent: number;
  risk: 'low' | 'medium' | 'high';
  commitment: string;
}

export interface TCOScenarioConfig {
  spotDiscount: number;
  savingsPlanDiscount: number;
}

export const DEFAULT_SCENARIO_CONFIG: TCOScenarioConfig = {
  spotDiscount: 0.7,
  savingsPlanDiscount: 0.5,
};

export function buildScenarios(
  costs: CostBreakdown,
  config: TCOScenarioConfig = DEFAULT_SCENARIO_CONFIG
): TCOScenario[] {
  const od = costs.onDemand;
  const monthlyOD = od.monthly;

  const scenarios: TCOScenario[] = [
    {
      id: 'on-demand',
      label: 'On-Demand',
      description: 'Pay-per-use, no commitment. Maximum flexibility, highest price.',
      monthly: od.monthly,
      annual: od.annual,
      threeYear: od.threeYear,
      savingsVsOnDemand: 0,
      savingsPercent: 0,
      risk: 'low',
      commitment: 'None',
    },
    {
      id: '1y-reserved',
      label: '1-Year Reserved',
      description: 'No-upfront reserved instances, 1-year commitment.',
      monthly: costs.oneYearNuri.monthly,
      annual: costs.oneYearNuri.annual,
      threeYear: costs.oneYearNuri.threeYear,
      savingsVsOnDemand: od.threeYear - costs.oneYearNuri.threeYear,
      savingsPercent: percent(od.threeYear, costs.oneYearNuri.threeYear),
      risk: 'low',
      commitment: '1 year',
    },
    {
      id: 'savings-plan',
      label: 'Compute Savings Plan',
      description: 'Flexible hourly commitment across instance families and regions.',
      monthly: round(monthlyOD * config.savingsPlanDiscount),
      annual: round(monthlyOD * config.savingsPlanDiscount * 12),
      threeYear: round(monthlyOD * config.savingsPlanDiscount * 36),
      savingsVsOnDemand: round(od.threeYear - monthlyOD * config.savingsPlanDiscount * 36),
      savingsPercent: percent(od.threeYear, monthlyOD * config.savingsPlanDiscount * 36),
      risk: 'low',
      commitment: '1-3 years',
    },
    {
      id: '3y-reserved',
      label: '3-Year Reserved',
      description: 'All-upfront reserved instances, 3-year commitment.',
      monthly: costs.threeYearNuri.monthly,
      annual: costs.threeYearNuri.annual,
      threeYear: costs.threeYearNuri.threeYear,
      savingsVsOnDemand: od.threeYear - costs.threeYearNuri.threeYear,
      savingsPercent: percent(od.threeYear, costs.threeYearNuri.threeYear),
      risk: 'medium',
      commitment: '3 years',
    },
    {
      id: 'spot',
      label: 'Spot (stateless workloads)',
      description: 'Spare capacity at steep discount. Interruption-tolerant only.',
      monthly: round(monthlyOD * (1 - config.spotDiscount)),
      annual: round(monthlyOD * (1 - config.spotDiscount) * 12),
      threeYear: round(monthlyOD * (1 - config.spotDiscount) * 36),
      savingsVsOnDemand: round(od.threeYear - monthlyOD * (1 - config.spotDiscount) * 36),
      savingsPercent: percent(od.threeYear, monthlyOD * (1 - config.spotDiscount) * 36),
      risk: 'high',
      commitment: 'None (can be reclaimed)',
    },
  ];

  return scenarios;
}

export function scenariosToCsv(scenarios: TCOScenario[]): string {
  const header = [
    'Scenario',
    'Commitment',
    'Risk',
    'Monthly (USD)',
    'Annual (USD)',
    '3-Year (USD)',
    '3Y Savings vs On-Demand (USD)',
    'Savings %',
  ];
  const rows = scenarios.map((s) => [
    s.label,
    s.commitment,
    s.risk,
    s.monthly,
    s.annual,
    s.threeYear,
    s.savingsVsOnDemand,
    s.savingsPercent.toFixed(1),
  ]);
  return [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function percent(base: number, value: number): number {
  if (base <= 0) return 0;
  return ((base - value) / base) * 100;
}

function round(v: number): number {
  return Math.round(v);
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
