import { ExcelData } from '@/types/assessment';

export type ReadinessLevel = 'ready' | 'evaluating' | 'not_ready';

export type ReadinessDimensionId = 'technical' | 'data' | 'security' | 'organizational';

export interface ReadinessCheck {
  id: string;
  title: string;
  description: string;
  passed: boolean;
  weight: number;
  detail?: string;
  recommendation?: string;
}

export interface ReadinessDimension {
  id: ReadinessDimensionId;
  label: string;
  description: string;
  score: number;
  checks: ReadinessCheck[];
}

export interface ReadinessReport {
  overallScore: number;
  level: ReadinessLevel;
  dimensions: ReadinessDimension[];
  gaps: ReadinessCheck[];
}

const EOL_OS_PATTERNS = [
  /windows\s*(server\s*)?2003/i,
  /windows\s*(server\s*)?2008/i,
  /windows\s*(server\s*)?2012/i,
  /windows\s*xp/i,
  /windows\s*7/i,
  /centos\s*6/i,
  /red\s*hat.*(5|6)\b/i,
  /rhel.*(5|6)\b/i,
  /ubuntu\s*(14|16)\./i,
  /debian\s*(7|8|9)\b/i,
];

const OUTDATED_DB_PATTERNS = [
  /sql\s*server.*(2008|2012|2014)/i,
  /mysql.*(5\.[0-6]|5\.7)/i,
  /oracle.*(10|11)/i,
  /postgres.*(9\.|10\b)/i,
];

export interface ManualChecklistState {
  [checkId: string]: boolean;
}

export function computeReadiness(
  excelData: ExcelData | null,
  manualState: ManualChecklistState = {}
): ReadinessReport {
  const technical = computeTechnicalDimension(excelData, manualState);
  const data = computeDataDimension(excelData, manualState);
  const security = computeSecurityDimension(manualState);
  const organizational = computeOrganizationalDimension(manualState);

  const dimensions = [technical, data, security, organizational];
  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  );

  const level: ReadinessLevel =
    overallScore >= 80 ? 'ready' : overallScore >= 55 ? 'evaluating' : 'not_ready';

  const gaps = dimensions
    .flatMap((d) => d.checks.filter((c) => !c.passed))
    .sort((a, b) => b.weight - a.weight);

  return { overallScore, level, dimensions, gaps };
}

function computeTechnicalDimension(
  excelData: ExcelData | null,
  manual: ManualChecklistState
): ReadinessDimension {
  const servers = excelData?.servers ?? [];
  const databases = excelData?.databases ?? [];

  const eolServers = servers.filter((s) =>
    EOL_OS_PATTERNS.some((p) => p.test(`${s.osName ?? ''} ${s.osVersion ?? ''}`))
  );
  const eolDbs = databases.filter((d) =>
    OUTDATED_DB_PATTERNS.some((p) => p.test(`${d.engineType ?? ''} ${d.engineVersion ?? ''}`))
  );
  const withUtilization = servers.filter((s) => (s.avgCpuUsage ?? 0) > 0);

  const checks: ReadinessCheck[] = [
    {
      id: 'tech.eol_os',
      title: 'Operating systems supported',
      description: 'All servers run supported (non end-of-life) operating systems.',
      passed: servers.length === 0 ? false : eolServers.length === 0,
      weight: 3,
      detail:
        servers.length === 0
          ? 'Upload MPA data to evaluate.'
          : eolServers.length === 0
          ? `${servers.length} servers, none on EOL OS.`
          : `${eolServers.length}/${servers.length} servers on EOL OS.`,
      recommendation:
        eolServers.length > 0
          ? 'Plan OS upgrade or replatform waves before migration. Candidates: ' +
            eolServers
              .slice(0, 3)
              .map((s) => s.hostname)
              .join(', ') +
            (eolServers.length > 3 ? ` (+${eolServers.length - 3} more)` : '')
          : undefined,
    },
    {
      id: 'tech.db_versions',
      title: 'Database engines current',
      description: 'Database engines are on versions supported by AWS RDS managed offerings.',
      passed: databases.length === 0 ? false : eolDbs.length === 0,
      weight: 3,
      detail:
        databases.length === 0
          ? 'No databases detected in MPA.'
          : eolDbs.length === 0
          ? `${databases.length} databases on current engine versions.`
          : `${eolDbs.length}/${databases.length} databases on outdated engine versions.`,
      recommendation:
        eolDbs.length > 0
          ? `Assess in-place upgrade vs replatform for: ${eolDbs
              .slice(0, 3)
              .map((d) => d.dbName)
              .join(', ')}`
          : undefined,
    },
    {
      id: 'tech.utilization_data',
      title: 'Utilization data available',
      description: 'CPU/RAM utilization metrics exist for a statistically useful sample of servers.',
      passed: servers.length === 0 ? false : withUtilization.length / servers.length >= 0.7,
      weight: 2,
      detail:
        servers.length === 0
          ? 'No servers loaded.'
          : `${withUtilization.length}/${servers.length} servers with measured CPU utilization.`,
      recommendation:
        servers.length > 0 && withUtilization.length / servers.length < 0.7
          ? 'Extend MPA collection window to ≥30 days for reliable rightsizing.'
          : undefined,
    },
    {
      id: 'tech.dependency_mapping',
      title: 'Dependencies mapped',
      description: 'Server-to-server and app-to-database communications are captured.',
      passed: !!excelData?.serverCommunications && excelData.serverCommunications.length > 0,
      weight: 2,
      detail: excelData?.serverCommunications
        ? `${excelData.serverCommunications.length} communication flows detected.`
        : 'No dependency data detected.',
      recommendation: !excelData?.serverCommunications?.length
        ? 'Enable MPA dependency collector or import netflow data.'
        : undefined,
    },
    manualCheck(
      'tech.architecture_review',
      'Architecture review completed',
      'Target AWS architecture has been reviewed with a solutions architect.',
      manual,
      2
    ),
  ];

  return {
    id: 'technical',
    label: 'Technical',
    description: 'Infrastructure supportability and data quality.',
    score: weightedScore(checks),
    checks,
  };
}

function computeDataDimension(
  excelData: ExcelData | null,
  manual: ManualChecklistState
): ReadinessDimension {
  const databases = excelData?.databases ?? [];
  const hasLargeDbs = databases.some((d) => d.totalSize > 500);

  const checks: ReadinessCheck[] = [
    {
      id: 'data.inventory',
      title: 'Database inventory complete',
      description: 'All production databases are listed with engine and size.',
      passed: databases.length > 0,
      weight: 3,
      detail:
        databases.length === 0
          ? 'No databases in current inventory.'
          : `${databases.length} databases inventoried.`,
      recommendation:
        databases.length === 0 ? 'Complete MPA database discovery or import manually.' : undefined,
    },
    {
      id: 'data.large_db_strategy',
      title: 'Large database strategy defined',
      description: 'Databases >500GB have a documented migration approach (DMS, snapshot, etc.).',
      passed: !hasLargeDbs || manual['data.large_db_strategy'] === true,
      weight: 2,
      detail: hasLargeDbs
        ? `${databases.filter((d) => d.totalSize > 500).length} databases >500GB require special handling.`
        : 'No databases >500GB detected.',
      recommendation: hasLargeDbs
        ? 'Document DMS/replication approach before cutover planning.'
        : undefined,
    },
    manualCheck(
      'data.backup_strategy',
      'Backup & recovery strategy documented',
      'RTO/RPO defined and AWS Backup / snapshot strategy agreed with client.',
      manual,
      3
    ),
    manualCheck(
      'data.classification',
      'Data classification complete',
      'Sensitive / regulated data (PII, PCI, PHI) has been identified and tagged.',
      manual,
      3
    ),
  ];

  return {
    id: 'data',
    label: 'Data',
    description: 'Data inventory, classification, and migration strategy.',
    score: weightedScore(checks),
    checks,
  };
}

function computeSecurityDimension(manual: ManualChecklistState): ReadinessDimension {
  const checks: ReadinessCheck[] = [
    manualCheck(
      'sec.landing_zone',
      'AWS Landing Zone designed',
      'Account structure, SCPs, and guardrails defined.',
      manual,
      3
    ),
    manualCheck(
      'sec.iam_strategy',
      'IAM / SSO strategy defined',
      'Identity provider integration (SSO, AD, SCIM) planned.',
      manual,
      2
    ),
    manualCheck(
      'sec.compliance_reqs',
      'Compliance requirements captured',
      'Applicable frameworks (ISO, SOC2, HIPAA, PCI) and controls are documented.',
      manual,
      2
    ),
    manualCheck(
      'sec.encryption',
      'Encryption standards defined',
      'At-rest (KMS) and in-transit (TLS) requirements agreed.',
      manual,
      2
    ),
    manualCheck(
      'sec.incident_response',
      'Incident response plan updated',
      'On-call, runbooks, and escalation paths cover the AWS estate.',
      manual,
      1
    ),
  ];

  return {
    id: 'security',
    label: 'Security & Compliance',
    description: 'Guardrails, identity, data protection, and regulatory readiness.',
    score: weightedScore(checks),
    checks,
  };
}

function computeOrganizationalDimension(manual: ManualChecklistState): ReadinessDimension {
  const checks: ReadinessCheck[] = [
    manualCheck(
      'org.exec_sponsor',
      'Executive sponsor identified',
      'A named sponsor owns the migration outcome and unblocks decisions.',
      manual,
      3
    ),
    manualCheck(
      'org.cloud_team',
      'Cloud operating model agreed',
      'CCoE, platform team, or managed-service model is defined.',
      manual,
      3
    ),
    manualCheck(
      'org.skills_aws',
      'Core AWS skills covered',
      'At least one certified AWS engineer on staff or partner.',
      manual,
      2
    ),
    manualCheck(
      'org.change_mgmt',
      'Change management plan exists',
      'Communications, training, and business-unit engagement scheduled.',
      manual,
      2
    ),
    manualCheck(
      'org.budget_approved',
      'Budget approved',
      'Migration program funded through go-live, including contingency.',
      manual,
      2
    ),
  ];

  return {
    id: 'organizational',
    label: 'Organizational',
    description: 'Sponsorship, operating model, skills, and funding.',
    score: weightedScore(checks),
    checks,
  };
}

function manualCheck(
  id: string,
  title: string,
  description: string,
  manual: ManualChecklistState,
  weight: number
): ReadinessCheck {
  return {
    id,
    title,
    description,
    passed: manual[id] === true,
    weight,
  };
}

function weightedScore(checks: ReadinessCheck[]): number {
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  if (total === 0) return 0;
  const gained = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  return Math.round((gained / total) * 100);
}

export function readinessLevelLabel(level: ReadinessLevel): string {
  switch (level) {
    case 'ready':
      return 'Ready to migrate';
    case 'evaluating':
      return 'Evaluating — gaps remain';
    case 'not_ready':
      return 'Not ready — critical gaps';
  }
}
