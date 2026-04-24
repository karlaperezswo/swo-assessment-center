import { ExcelData } from '@/types/assessment';
import { readPersisted, writePersisted } from '@/lib/usePersistedState';

export interface RiskRule {
  id: string;
  label: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
  category: 'os' | 'database' | 'hardware';
}

export const DEFAULT_RISK_RULES: RiskRule[] = [
  { id: 'win-2003', label: 'Windows Server 2003', pattern: 'windows.*2003', severity: 'high', enabled: true, category: 'os' },
  { id: 'win-2008', label: 'Windows Server 2008/2008 R2', pattern: 'windows.*2008', severity: 'high', enabled: true, category: 'os' },
  { id: 'win-2012', label: 'Windows Server 2012/2012 R2', pattern: 'windows.*2012', severity: 'medium', enabled: true, category: 'os' },
  { id: 'win-xp', label: 'Windows XP', pattern: 'windows xp', severity: 'high', enabled: true, category: 'os' },
  { id: 'win-7', label: 'Windows 7', pattern: 'windows 7', severity: 'high', enabled: true, category: 'os' },
  { id: 'rhel-5-6', label: 'RHEL / CentOS 5-6', pattern: '(rhel|red hat|centos)[^0-9]*(5|6)', severity: 'high', enabled: true, category: 'os' },
  { id: 'centos-7', label: 'CentOS 7 (EOL 2024)', pattern: 'centos[^0-9]*7', severity: 'medium', enabled: true, category: 'os' },
  { id: 'ubuntu-14-16', label: 'Ubuntu 14.04 / 16.04', pattern: 'ubuntu[^0-9]*(14|16)\\.', severity: 'medium', enabled: true, category: 'os' },
  { id: 'sql-2008-2014', label: 'SQL Server 2008-2014', pattern: 'sql server.*(2008|2012|2014)', severity: 'high', enabled: true, category: 'database' },
  { id: 'mysql-5', label: 'MySQL 5.x', pattern: 'mysql.*5\\.', severity: 'medium', enabled: true, category: 'database' },
  { id: 'oracle-11g', label: 'Oracle 11g and older', pattern: 'oracle.*(10|11)', severity: 'medium', enabled: true, category: 'database' },
];

const STORAGE_KEY = 'riskRules';

export function loadRiskRules(): RiskRule[] {
  return readPersisted<RiskRule[]>(STORAGE_KEY, DEFAULT_RISK_RULES);
}

export function saveRiskRules(rules: RiskRule[]): void {
  writePersisted(STORAGE_KEY, rules);
}

export interface RiskMatch {
  ruleId: string;
  ruleLabel: string;
  severity: RiskRule['severity'];
  category: RiskRule['category'];
  entity: string;
  detail: string;
}

export function evaluateRisks(excelData: ExcelData | null, rules: RiskRule[]): RiskMatch[] {
  if (!excelData) return [];
  const matches: RiskMatch[] = [];
  const active = rules.filter((r) => r.enabled);

  excelData.servers.forEach((s) => {
    const haystack = `${s.osName ?? ''} ${s.osVersion ?? ''}`.toLowerCase();
    active
      .filter((r) => r.category === 'os' || r.category === 'hardware')
      .forEach((rule) => {
        try {
          if (new RegExp(rule.pattern, 'i').test(haystack)) {
            matches.push({
              ruleId: rule.id,
              ruleLabel: rule.label,
              severity: rule.severity,
              category: rule.category,
              entity: s.hostname,
              detail: haystack.trim(),
            });
          }
        } catch {
          // malformed regex — ignore this rule
        }
      });
  });

  excelData.databases.forEach((d) => {
    const haystack = `${d.engineType ?? ''} ${d.engineVersion ?? ''}`.toLowerCase();
    active
      .filter((r) => r.category === 'database')
      .forEach((rule) => {
        try {
          if (new RegExp(rule.pattern, 'i').test(haystack)) {
            matches.push({
              ruleId: rule.id,
              ruleLabel: rule.label,
              severity: rule.severity,
              category: rule.category,
              entity: d.dbName,
              detail: haystack.trim(),
            });
          }
        } catch {
          // ignore malformed regex
        }
      });
  });

  return matches;
}

export function summarizeRisks(matches: RiskMatch[]): {
  high: number;
  medium: number;
  low: number;
  total: number;
  byRule: Record<string, number>;
} {
  const summary = {
    high: 0,
    medium: 0,
    low: 0,
    total: matches.length,
    byRule: {} as Record<string, number>,
  };
  matches.forEach((m) => {
    summary[m.severity]++;
    summary.byRule[m.ruleLabel] = (summary.byRule[m.ruleLabel] || 0) + 1;
  });
  return summary;
}
