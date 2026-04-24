import { ExcelData } from '@/types/assessment';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  affected?: number;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    servers: number;
    databases: number;
    applications: number;
    dependencies: number;
    serversWithCpuData: number;
    serversWithRamData: number;
    serversWithoutOs: number;
  };
}

export function validateExcelData(data: ExcelData | null): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!data) {
    return {
      valid: false,
      issues: [{ severity: 'error', code: 'no-data', message: 'No data loaded.' }],
      stats: {
        servers: 0,
        databases: 0,
        applications: 0,
        dependencies: 0,
        serversWithCpuData: 0,
        serversWithRamData: 0,
        serversWithoutOs: 0,
      },
    };
  }

  const servers = data.servers ?? [];
  const databases = data.databases ?? [];
  const applications = data.applications ?? [];
  const dependencies = data.serverCommunications ?? [];

  const serversWithCpuData = servers.filter((s) => (s.avgCpuUsage ?? 0) > 0).length;
  const serversWithRamData = servers.filter((s) => (s.avgRamUsage ?? 0) > 0).length;
  const serversWithoutOs = servers.filter((s) => !s.osName || s.osName.trim() === '').length;

  if (servers.length === 0) {
    issues.push({
      severity: 'error',
      code: 'no-servers',
      message: 'No servers detected. Verify the file is an MPA export with a servers sheet.',
    });
  }

  if (servers.length > 0 && serversWithCpuData / servers.length < 0.5) {
    issues.push({
      severity: 'warning',
      code: 'low-cpu-coverage',
      message: `Only ${serversWithCpuData} of ${servers.length} servers have CPU utilization data. Rightsizing will be less accurate.`,
      affected: servers.length - serversWithCpuData,
    });
  }

  if (serversWithoutOs > 0) {
    issues.push({
      severity: 'warning',
      code: 'missing-os',
      message: `${serversWithoutOs} servers are missing OS information.`,
      affected: serversWithoutOs,
    });
  }

  const duplicateHostnames = findDuplicates(servers.map((s) => s.hostname).filter(Boolean));
  if (duplicateHostnames.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'duplicate-hostnames',
      message: `${duplicateHostnames.length} duplicate hostname(s): ${duplicateHostnames.slice(0, 3).join(', ')}${
        duplicateHostnames.length > 3 ? '…' : ''
      }`,
      affected: duplicateHostnames.length,
    });
  }

  if (databases.length === 0) {
    issues.push({
      severity: 'info',
      code: 'no-databases',
      message: 'No databases detected. Confirm the environment has no managed DB workloads or enable DB discovery.',
    });
  }

  if (dependencies.length === 0 && servers.length > 1) {
    issues.push({
      severity: 'warning',
      code: 'no-dependencies',
      message: 'No inter-server communications detected. Wave planning and dependency map will be degraded.',
    });
  }

  const invalidSpecs = servers.filter(
    (s) => !s.numCpus || !s.numCoresPerCpu || s.numCpus <= 0 || s.numCoresPerCpu <= 0
  );
  if (invalidSpecs.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'invalid-cpu-specs',
      message: `${invalidSpecs.length} server(s) have missing or zero CPU specs — rightsizing defaults will apply.`,
      affected: invalidSpecs.length,
    });
  }

  return {
    valid: issues.every((i) => i.severity !== 'error'),
    issues,
    stats: {
      servers: servers.length,
      databases: databases.length,
      applications: applications.length,
      dependencies: dependencies.length,
      serversWithCpuData,
      serversWithRamData,
      serversWithoutOs,
    },
  };
}

function findDuplicates(values: string[]): string[] {
  const counts = new Map<string, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()].filter(([, n]) => n > 1).map(([v]) => v);
}
