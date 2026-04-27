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

export function getOsString(osVersion: string): string {
  const os = (osVersion ?? '').toLowerCase();
  if (os.includes('sql') && os.includes('enterprise')) return 'Windows Server con SQL Server Enterprise';
  if (os.includes('sql') && os.includes('standard'))   return 'Windows Server con SQL Server Standard';
  if (os.includes('sql') && os.includes('web'))        return 'Windows Server con SQL Server Web';
  if (os.includes('windows'))                          return 'Windows Server';
  return 'Linux';
}

export function getInstanceOptions(family: InstanceFamily): string[] {
  return (INSTANCE_SIZES[family] ?? INSTANCE_SIZES.r8i).map(s => `${family}.${s.size}`);
}

function getPricingStrategy(model: PricingModel, paymentOption: PaymentOption): string {
  if (model === 'ondemand') return 'On-Demand';
  if (model === '1yr') return `Compute Savings Plans 1yr ${paymentOption}`;
  return `Compute Savings Plans 3yr ${paymentOption}`;
}

export function generateCalculatorJson(config: GeneratorConfig): object {
  const regionName = REGION_DISPLAY_NAMES[config.region] ?? config.region;
  const pricingStrategy = getPricingStrategy(config.pricingModel, config.paymentOption);
  const { additionalServices: svc } = config;
  const zero = { mensual: '0.00', inicial: '0.00', '12 meses': '0.00' };

  const included = config.serverMappings.filter(m => m.isIncluded);

  const ec2Services = included.map(m => ({
    'Nombre del servicio': 'Amazon EC2 ',
    'Descripción': m.server.hostname,
    'Región': regionName,
    'Estado': '',
    'Costo del servicio': zero,
    'Propiedades': {
      'Tenencia': 'Instancias compartidas',
      'Sistema operativo': m.osString,
      'Workload': 'Consistent, Number of instances: 1',
      'Instancia EC2 por adelantado': m.instanceType,
      'Pricing strategy': pricingStrategy,
    },
  }));

  const ebsServices = included
    .filter(m => m.server.storage && m.server.storage > 0)
    .map(m => ({
      'Nombre del servicio': 'Amazon Elastic Block Store (EBS)',
      'Descripción': `${m.server.hostname} C`,
      'Región': regionName,
      'Estado': '',
      'Costo del servicio': zero,
      'Propiedades': {
        'Cantidad de volúmenes': '1',
        'Duración media del volumen': '730 horas al mes',
        'Cantidad de almacenamiento por volumen': `${m.server.storage} GB`,
        'Aprovisionamiento de IOPS por volumen (gp3)': '3000',
        'SSD de uso general (gp3): Rendimiento': '150 MBps',
        'Frecuencia de instantáneas': 'Sin almacenamiento de instantáneas',
      },
    }));

  const securityServices = [
    ...(svc.cloudwatch.enabled ? [{
      'Nombre del servicio': 'Amazon CloudWatch',
      'Descripción': 'Cloudwatch',
      'Región': regionName,
      'Estado': '',
      'Costo del servicio': zero,
      'Propiedades': {
        'Número de eventos de OTEL móvil y spans, o spans por visita': String(svc.cloudwatch.spans),
        'Frecuencia de muestreo móvil': '1',
        'Cantidad de métricas (incluye las métricas personalizadas y detalladas)': String(svc.cloudwatch.metrics),
        'Registros estándares: datos incorporados': `${svc.cloudwatch.logsGB} GB`,
        'Cantidad de paneles': String(svc.cloudwatch.dashboards),
        'Cantidad de métricas de las alarmas de resolución estándar': String(svc.cloudwatch.standardAlarms),
        'Cantidad de métricas de las alarmas de alta resolución': String(svc.cloudwatch.highResAlarms),
      },
    }] : []),
    ...(svc.firewall.enabled ? [{
      'Nombre del servicio': 'AWS Network Firewall',
      'Descripción': 'Firewall Manager',
      'Región': regionName,
      'Estado': '',
      'Costo del servicio': zero,
      'Propiedades': {
        'Cantidad de puntos de conexión de AWS Network Firewall': String(svc.firewall.endpoints),
        'Cantidad de puntos de enlace secundarios de Network Firewall': String(svc.firewall.endpoints),
        'Uso mensual por punto de enlace': '720 horas',
        'Uso mensual de la inspección avanzada por punto de enlace': '720 horas',
        'Datos procesados por mes': `${svc.firewall.dataProcessedGB} GB`,
      },
    }] : []),
  ];

  const networkingServices = [
    ...(svc.s3Logs.enabled ? [
      {
        'Nombre del servicio': 'S3 Standard',
        'Descripción': 'S3 Almacenamiento de Logs',
        'Región': regionName,
        'Estado': '',
        'Costo del servicio': zero,
        'Propiedades': { 'Almacenamiento de S3 Estándar': `${svc.s3Logs.storageGB} GB per mes` },
      },
      {
        'Nombre del servicio': 'Data Transfer',
        'Descripción': 'S3 Almacenamiento de Logs',
        'Región': regionName,
        'Estado': '',
        'Costo del servicio': zero,
        'Propiedades': {
          'DT Inbound: Internet': '1 TB per month',
          'DT Outbound: Not selected': '0 TB per month',
        },
      },
    ] : []),
    ...(svc.vpn.enabled ? [
      {
        'Nombre del servicio': 'VPN Connection',
        'Descripción': 'VPN',
        'Región': regionName,
        'Estado': '',
        'Costo del servicio': zero,
        'Propiedades': {
          'Días laborables al mes': String(svc.vpn.workDaysPerMonth),
          'Número de conexiones de Site-to-Site VPN': String(svc.vpn.connections),
          'Número de asociaciones de subred': '1',
        },
      },
      {
        'Nombre del servicio': 'Data Transfer',
        'Descripción': 'VPN',
        'Región': regionName,
        'Estado': '',
        'Costo del servicio': zero,
        'Propiedades': {
          'DT Inbound: Not selected': '0 TB per month',
          'DT Outbound: Internet': '500 GB per month',
          'DT Intra-Region:': '0 TB per month',
        },
      },
    ] : []),
    ...(svc.dataTransfer.enabled ? [{
      'Nombre del servicio': 'Data Transfer',
      'Descripción': 'Data Transfer',
      'Región': regionName,
      'Estado': '',
      'Costo del servicio': zero,
      'Propiedades': {
        'DT Inbound: Not selected': '0 TB per month',
        'DT Outbound: Internet': `${svc.dataTransfer.outboundTB} TB per month`,
        'DT Intra-Region:': '0 TB per month',
      },
    }] : []),
  ];

  const continuityServices = svc.backup.enabled ? [{
    'Nombre del servicio': 'EBS Backup',
    'Descripción': 'Backup',
    'Región': regionName,
    'Estado': '',
    'Costo del servicio': zero,
    'Propiedades': {
      'Incremento anual estimado de los datos principales (%)': '0.02',
      'Variación diaria estimada de los datos principales (%)': '0.002',
      'Cantidad de datos principales de los que se va a hacer copia de seguridad': `${svc.backup.primaryDataTB} TB`,
      'Periodo de retención en caliente de las copias de seguridad diarias': `${svc.backup.dailyRetentionDays} Días`,
      'Periodo de retención en caliente de las copias de seguridad semanales': `${svc.backup.weeklyRetentionWeeks} Semanas`,
      'Periodo de retención en caliente de las copias de seguridad mensuales': `${svc.backup.monthlyRetentionMonths} Meses`,
    },
  }] : [];

  return {
    Nombre: config.estimateName,
    'Costo total': { mensual: '0.00', inicial: '0.00', '12 meses': '0.00' },
    Metadatos: {
      Divisa: 'USD',
      'Configuración regional': 'es_ES',
      'Creado el': config.date,
      'Descargo de responsabilidad legal': 'La Calculadora de precios de AWS proporciona únicamente una estimación de sus tarifas de AWS y no incluye los impuestos que puedan aplicarse. El valor real de sus tarifas depende de una serie de factores, entre los que se incluye su uso real de AWS.',
      'Compartir URL': '',
    },
    Grupos: {
      Servers: {
        ...(ec2Services.length > 0       ? { Production:                { Servicios: ec2Services }         } : {}),
        ...(securityServices.length > 0   ? { Security:                  { Servicios: securityServices }    } : {}),
        ...(networkingServices.length > 0 ? { Networking:                { Servicios: networkingServices }  } : {}),
        ...(continuityServices.length > 0 ? { 'Continuidad del negocio': { Servicios: continuityServices } } : {}),
        ...(ebsServices.length > 0        ? { EBS:                       { Servicios: ebsServices }         } : {}),
      },
    },
  };
}

export function downloadJson(json: object, filename: string): void {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
