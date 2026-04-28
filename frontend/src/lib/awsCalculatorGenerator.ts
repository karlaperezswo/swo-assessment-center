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

/**
 * Generates an EBS Bulk Upload Excel (.xlsx) — one row per included server with storage.
 */
export function generateEBSBulkImportXlsx(config: GeneratorConfig): ArrayBuffer {
  const included = config.serverMappings.filter(m => m.isIncluded && m.server.storage && m.server.storage > 0);

  const row1 = ['', '', '', '', 'Elastic Block Storage (EBS) Specifications', '', '', '', '', '', '', ''];
  const row2 = [
    '',
    'Group\n(Group name cannot contain \'>\', \'<\' and \'&\')',
    'Description\n(Description cannot contain \'>\', \'<\' and \'&\')',
    'AWS Region',
    'Storage Type',
    'Average duration each instance runs\n(hours per month)',
    'Number\nof volumes',
    'Storage amount\nper volume\n(GB)',
    'Provisioning IOPS per volume\n(applicable for\ngp3, io1, io2)',
    'EBS Throughput per volume\n(applicable for gp3)\n(Mbps)',
    'Snapshot Frequency',
    'EBS Snapshot amount\nper volume\n(GB/snapshot)',
  ];

  const dataRows = included.map(m => [
    '',
    m.server.environment || 'Production',
    m.server.hostname,
    config.region,
    'General Purpose SSD (gp3)',
    730,
    1,
    m.server.storage,
    3000,
    125,
    'No snapshot storage',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([row1, row2, ...dataRows]);
  ws['!cols'] = [
    { wch: 4 }, { wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 28 },
    { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
    { wch: 22 }, { wch: 22 },
  ];
  ws['!merges'] = [{ s: { r: 0, c: 4 }, e: { r: 0, c: 11 } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inputs');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

/**
 * Generates a Dedicated Hosts Bulk Upload Excel (.xlsx).
 * Uses instance family (e.g. "r8i") not the full instance type.
 */
export function generateDedicatedHostsBulkImportXlsx(config: GeneratorConfig): ArrayBuffer {
  const purchasingOption = getPurchasingOption(config.pricingModel, config.paymentOption);
  const included = config.serverMappings.filter(m => m.isIncluded);

  const row1 = [
    '', '', '', '',
    'Elastic Cloud Compute (EC2) Dedicated Host Specifications',
    '', '',
    'Elastic Block Storage (EBS) Specifications (Optional)',
    '', '', '',
  ];
  const row2 = [
    '',
    'Group\n(Group name cannot contain \'>\', \'<\' and \'&\')',
    'Description\n(Description cannot contain \'>\', \'<\' and \'&\')',
    'AWS Region',
    'Instance Family',
    'Number of Hosts',
    'Purchasing Option',
    'Storage Type',
    'Storage amount per Instance\n(GB)',
    'Provisioning IOPS per instance\n(applicable for\ngp3, io1, io2)',
    'EBS Throughput per Instance\n(applicable for gp3)\n(Mbps)',
  ];

  const dataRows = included.map(m => {
    const family = m.instanceType.split('.')[0];
    const hasStorage = !!m.server.storage && m.server.storage > 0;
    return [
      '',
      m.server.environment || 'Production',
      m.server.hostname,
      config.region,
      family,
      1,
      purchasingOption,
      hasStorage ? 'General Purpose SSD (gp3)' : '',
      hasStorage ? m.server.storage : '',
      hasStorage ? 3000 : '',
      hasStorage ? 125 : '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([row1, row2, ...dataRows]);
  ws['!cols'] = [
    { wch: 4 }, { wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 16 },
    { wch: 12 }, { wch: 40 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
  ];
  ws['!merges'] = [
    { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } },
    { s: { r: 0, c: 7 }, e: { r: 0, c: 10 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inputs');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

/**
 * Generates a bookmarklet href (javascript:...) that auto-fills additional
 * services on calculator.aws (in Spanish) using the configured values.
 * Requires: calculator in Spanish + Edge Tracking Prevention disabled for calculator.aws.
 */
export function generateBookmarklet(services: AdditionalServicesConfig): string {
  const steps: string[] = [];

  if (services.cloudwatch.enabled) {
    const c = services.cloudwatch;
    steps.push(
      `await go('CloudWatch');` +
      `await f('Número de eventos de OTEL móvil y spans, o spans por visita Escriba la cantidad.',${c.spans});` +
      `await f('Cantidad de métricas (incluye las métricas personalizadas y detalladas) Escriba la cantidad.',${c.metrics});` +
      `await f('Registros estándares: datos incorporados Value',${c.logsGB});` +
      `await f('Cantidad de paneles Escriba la cantidad.',${c.dashboards});` +
      `await f('Cantidad de métricas de las alarmas de resolución estándar Escriba la cantidad.',${c.standardAlarms});` +
      `await f('Cantidad de métricas de las alarmas de alta resolución Escriba la cantidad.',${c.highResAlarms});` +
      `await save();`
    );
  }

  if (services.firewall.enabled) {
    const fw = services.firewall;
    steps.push(
      `await go('networkfirewall');` +
      `await f('Cantidad de puntos de conexión de AWS Network Firewall',${fw.endpoints});` +
      `await p();` +
      `await f('Uso mensual por punto de enlace Value',720);` +
      `await f('Uso mensual de la inspección avanzada por punto de enlace Value',720);` +
      `await f('Cantidad de puntos de enlace secundarios de Network Firewall',${fw.endpoints});` +
      `await f('Uso por punto de enlace secundario Value',720);` +
      `await f('Datos procesados por mes Value',${fw.dataProcessedGB});` +
      `await save();`
    );
  }

  if (services.s3Logs.enabled) {
    steps.push(
      `await go('S3');` +
      `await f('Almacenamiento de S3 Estándar Value',${services.s3Logs.storageGB});` +
      `await save();`
    );
  }

  if (services.vpn.enabled) {
    const v = services.vpn;
    steps.push(
      `await go('VPC');` +
      `await f('Número de conexiones de Site-to-Site VPN Escriba la cantidad.',${v.connections});` +
      `await f('Días laborables al mes Escribir el número de días laborables',${v.workDaysPerMonth});` +
      `await f('Número de asociaciones de subred Escriba la cantidad.',1);` +
      `await save();`
    );
  }

  if (services.dataTransfer.enabled) {
    steps.push(
      `await go('DataTransfer');` +
      `await fn(1,${services.dataTransfer.outboundTB});` +
      `await save();`
    );
  }

  if (services.backup.enabled) {
    const b = services.backup;
    steps.push(
      `await go('Backup');` +
      `await f('Cantidad de datos principales de los que se va a hacer copia de seguridad Value',${b.primaryDataTB * 1024});` +
      `await f('Incremento anual estimado de los datos principales (%)',0.02);` +
      `await f('Variación diaria estimada de los datos principales (%)',0.002);` +
      `await f('Periodo de retención en caliente de las copias de seguridad diarias Value',${b.dailyRetentionDays});` +
      `await f('Periodo de retención en caliente de las copias de seguridad semanales Value',${b.weeklyRetentionWeeks});` +
      `await f('Periodo de retención en caliente de las copias de seguridad mensuales Value',${b.monthlyRetentionMonths});` +
      `await save();`
    );
  }

  if (steps.length === 0) {
    return `javascript:alert('No hay servicios habilitados para configurar.')`;
  }

  const code =
    `(async function(){` +
    `var bt=document.body.innerText||'';` +
    `if(bt.includes('Add service')&&!bt.includes('Agregar servicio')){` +
    `alert('\\u26a0\\ufe0f Cambia la calculadora a ESPA\\u00d1OL primero:\\n1. Clic en "Language: English" (men\\u00fa superior)\\n2. Selecciona Espa\\u00f1ol\\n3. Ejecuta el marcador de nuevo');return;}` +
    `var S=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;` +
    `function sr(e,v){S.call(e,String(v));['input','change'].forEach(function(n){e.dispatchEvent(new Event(n,{bubbles:true}))})}` +
    `async function w(fn){var t=Date.now();while(Date.now()-t<15000){var r=fn();if(r)return r;await new Promise(function(re){setTimeout(re,300)})}throw new Error('Timeout esperando elemento')}` +
    `async function p(ms){await new Promise(function(r){setTimeout(r,ms||800)})}` +
    `function da(s){return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')}` +
    `function qi(l){` +
    `var k=da(l);var all=Array.from(document.querySelectorAll('input'));` +
    `return document.querySelector('input[aria-label="'+l+'"]')||` +
    `all.find(function(i){return (i.getAttribute('aria-label')||'')===l;})||` +
    `all.find(function(i){return da(i.getAttribute('aria-label')||'')===k;})||` +
    `(function(){var c=Array.from(document.querySelectorAll('[aria-label]')).find(function(x){return da(x.getAttribute('aria-label')||'')===k;});return c&&c.querySelector&&c.querySelector('input')})()}` +
    `async function f(l,v){var e=await w(function(){return qi(l)});if(e){sr(e,v);await p()}}` +
    `async function fn(i,v){var e=await w(function(){return document.querySelectorAll('input[type="number"]')[i]});if(e){sr(e,v);await p()}}` +
    `async function save(){` +
    `var b=await w(function(){return Array.from(document.querySelectorAll('button')).find(function(x){` +
    `var a=x.getAttribute('aria-label')||'';var t=x.textContent.trim();` +
    `return a==='Guardar y agregar servicio'||t==='Guardar y agregar servicio'||a==='Save and add service'||t==='Save and add service'});});` +
    `if(b){b.click();await new Promise(function(r){setTimeout(r,4000)})}}` +
    `async function go(s){window.location.hash='/createCalculator/'+s;await new Promise(function(r){setTimeout(r,4000)})}` +
    `try{${steps.join('')}` +
    `window.location.hash='/estimate';` +
    `alert('\\u2705 Servicios adicionales configurados en AWS Calculator.')}` +
    `catch(e){alert('\\u274c Error: '+e.message+'\\n\\nVerifica estar en calculator.aws en ESPA\\u00d1OL con una estimaci\\u00f3n abierta y Tracking Prevention desactivado.')}` +
    `})();`;

  return 'javascript:' + encodeURIComponent(code);
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
