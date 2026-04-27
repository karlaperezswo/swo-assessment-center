import * as XLSX from 'xlsx';
import { CloudamizeServer } from '@/types/assessment';

export type PricingModel = 'ondemand' | '1yr' | '3yr';
export type PaymentOption = 'No Upfront' | 'Partial Upfront' | 'All Upfront';
export type InstanceFamily = 'r8i' | 'r8a' | 'm8a' | 'm6i' | 'm5';

export interface ServerMapping {
  server: CloudamizeServer;
  instanceType: string;
  osString: string;
  isIncluded: boolean;
}

export interface AdditionalServicesConfig {
  cloudwatch: {
    enabled: boolean;
    spans: number;
    metrics: number;
    logsGB: number;
    dashboards: number;
    standardAlarms: number;
    highResAlarms: number;
  };
  firewall: {
    enabled: boolean;
    endpoints: number;
    dataProcessedGB: number;
  };
  s3Logs: {
    enabled: boolean;
    storageGB: number;
  };
  vpn: {
    enabled: boolean;
    connections: number;
    workDaysPerMonth: number;
  };
  dataTransfer: {
    enabled: boolean;
    outboundTB: number;
  };
  backup: {
    enabled: boolean;
    primaryDataTB: number;
    dailyRetentionDays: number;
    weeklyRetentionWeeks: number;
    monthlyRetentionMonths: number;
  };
}

export interface GeneratorConfig {
  estimateName: string;
  region: string;
  pricingModel: PricingModel;
  paymentOption: PaymentOption;
  serverMappings: ServerMapping[];
  additionalServices: AdditionalServicesConfig;
  date: string;
}

const INSTANCE_SIZES: Record<string, Array<{ size: string; vcpu: number; ram: number }>> = {
  r8i: [
    { size: 'large',    vcpu: 2,  ram: 16  },
    { size: 'xlarge',   vcpu: 4,  ram: 32  },
    { size: '2xlarge',  vcpu: 8,  ram: 64  },
    { size: '4xlarge',  vcpu: 16, ram: 128 },
    { size: '8xlarge',  vcpu: 32, ram: 256 },
    { size: '12xlarge', vcpu: 48, ram: 384 },
  ],
  r8a: [
    { size: 'medium',  vcpu: 1,  ram: 8   },
    { size: 'large',   vcpu: 2,  ram: 16  },
    { size: 'xlarge',  vcpu: 4,  ram: 32  },
    { size: '2xlarge', vcpu: 8,  ram: 64  },
    { size: '4xlarge', vcpu: 16, ram: 128 },
  ],
  m8a: [
    { size: 'medium',  vcpu: 1,  ram: 4  },
    { size: 'large',   vcpu: 2,  ram: 8  },
    { size: 'xlarge',  vcpu: 4,  ram: 16 },
    { size: '2xlarge', vcpu: 8,  ram: 32 },
    { size: '4xlarge', vcpu: 16, ram: 64 },
    { size: '8xlarge', vcpu: 32, ram: 128 },
  ],
  m6i: [
    { size: 'large',   vcpu: 2,  ram: 8   },
    { size: 'xlarge',  vcpu: 4,  ram: 16  },
    { size: '2xlarge', vcpu: 8,  ram: 32  },
    { size: '4xlarge', vcpu: 16, ram: 64  },
    { size: '8xlarge', vcpu: 32, ram: 128 },
  ],
  m5: [
    { size: 'large',   vcpu: 2,  ram: 8   },
    { size: 'xlarge',  vcpu: 4,  ram: 16  },
    { size: '2xlarge', vcpu: 8,  ram: 32  },
    { size: '4xlarge', vcpu: 16, ram: 64  },
    { size: '8xlarge', vcpu: 32, ram: 128 },
  ],
};

export const REGION_DISPLAY_NAMES: Record<string, string> = {
  'us-east-1':      'Este de EE. UU. (Norte de Virginia)',
  'us-east-2':      'Este de EE. UU. (Ohio)',
  'us-west-1':      'Oeste de EE. UU. (Norte de California)',
  'us-west-2':      'Oeste de EE. UU. (Oregón)',
  'eu-west-1':      'Europa (Irlanda)',
  'eu-west-2':      'Europa (Londres)',
  'eu-central-1':   'Europa (Fráncfort)',
  'ap-southeast-1': 'Asia Pacífico (Singapur)',
  'ap-southeast-2': 'Asia Pacífico (Sídney)',
  'ap-northeast-1': 'Asia Pacífico (Tokio)',
  'sa-east-1':      'América del Sur (São Paulo)',
};

export function mapInstanceType(cpus: number, ram: number, family: InstanceFamily): string {
  const sizes = INSTANCE_SIZES[family] ?? INSTANCE_SIZES.r8i;
  for (const s of sizes) {
    if (s.vcpu >= cpus && s.ram >= ram) return `${family}.${s.size}`;
  }
  return `${family}.${sizes[sizes.length - 1].size}`;
}

/** Spanish OS string for UI display */
export function getOsString(osVersion: string): string {
  const os = (osVersion ?? '').toLowerCase();
  if (os.includes('sql') && os.includes('enterprise')) return 'Windows Server con SQL Server Enterprise';
  if (os.includes('sql') && os.includes('standard'))   return 'Windows Server con SQL Server Standard';
  if (os.includes('sql') && os.includes('web'))        return 'Windows Server con SQL Server Web';
  if (os.includes('windows'))                          return 'Windows Server';
  return 'Linux';
}

/** English OS string matching AWS Bulk Import valid values exactly */
export function getOsStringEnglish(osVersion: string): string {
  const os = (osVersion ?? '').toLowerCase();
  if (os.includes('sql') && os.includes('enterprise')) return 'Windows Server with SQL Server Enterprise';
  if (os.includes('sql') && os.includes('standard'))   return 'Windows Server with SQL Server Standard';
  if (os.includes('sql') && os.includes('web'))        return 'Windows Server with SQL Server Web';
  if (os.includes('windows'))                          return 'Windows Server';
  return 'Linux';
}

export function getInstanceOptions(family: InstanceFamily): string[] {
  return (INSTANCE_SIZES[family] ?? INSTANCE_SIZES.r8i).map(s => `${family}.${s.size}`);
}

function getPurchasingOption(model: PricingModel, paymentOption: PaymentOption): string {
  if (model === 'ondemand') return 'On-Demand';
  const yr = model === '1yr' ? '1' : '3';
  return `${yr} Yr ${paymentOption} Compute Savings Plan`;
}

/**
 * Generates an EC2 Instances Bulk Upload Excel (.xlsx) matching the
 * AWS Pricing Calculator Bulk Import template format exactly.
 */
export function generateEC2BulkImportXlsx(config: GeneratorConfig): ArrayBuffer {
  const purchasingOption = getPurchasingOption(config.pricingModel, config.paymentOption);
  const included = config.serverMappings.filter(m => m.isIncluded);

  const row1 = Array(17).fill('');
  const row2 = [
    '', '', '', '',
    'Elastic Cloud Compute (EC2) Specifications',
    '', '', '', '', '', '',
    'Elastic Block Storage (EBS) Specifications (Optional)',
    '', '', '', '', '',
  ];
  const row3 = [
    '',
    'Group\n(Group name cannot contain \'>\', \'<\' and \'&\')',
    'Description\n(Description cannot contain \'>\', \'<\' and \'&\')',
    'AWS Region',
    'Operating System',
    'Instance Type',
    'Tenancy',
    'Number of Instances',
    'Assumed Usage',
    'Usage Type',
    'Purchasing Option',
    'Storage Type',
    'Storage amount per Instance\n(GB)',
    'Provisioning IOPS per instance\n(applicable for\ngp3, io1, io2)',
    'EBS Throughput per Instance\n(applicable for gp3)\n(Mbps)',
    'Snapshot Frequency',
    'EBS Snapshot amount per Instance (GB/snapshot)',
  ];

  const dataRows = included.map((m, i) => {
    const hasStorage = !!m.server.storage && m.server.storage > 0;
    const group = m.server.environment || 'Production';
    return [
      i + 1,
      group,
      m.server.hostname,
      config.region,
      getOsStringEnglish(m.server.osVersion),
      m.instanceType,
      'Shared Instances',
      1,
      '',
      'Always On',
      purchasingOption,
      hasStorage ? 'General Purpose SSD (gp3)' : '',
      hasStorage ? m.server.storage : '',
      hasStorage ? 3000 : '',
      hasStorage ? 125 : '',
      'No snapshot storage',
      '',
    ];
  });

  const wsData = [row1, row2, row3, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 4 },  { wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 36 },
    { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 40 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
    { wch: 22 }, { wch: 32 },
  ];

  // Merge section header cells (row index 1 = row 2)
  ws['!merges'] = [
    { s: { r: 1, c: 4 },  e: { r: 1, c: 10 } },
    { s: { r: 1, c: 11 }, e: { r: 1, c: 16 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inputs');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

export function downloadXlsx(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
