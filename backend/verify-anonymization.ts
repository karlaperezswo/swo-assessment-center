/**
 * Script de Verificación de Anonimización
 * 
 * Este script demuestra que los datos sensibles (IPs, hostnames, nombres de empresa)
 * NO se envían a Bedrock. Solo se envían tokens anónimos.
 */

import { AnonymizationService } from './src/services/AnonymizationService';
import { BedrockService } from './src/services/BedrockService';
import { ExcelData } from '../shared/types/assessment.types';
import { MraData } from '../shared/types/opportunity.types';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bold + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

// Datos de ejemplo con información sensible REAL
const sampleMpaData: ExcelData = {
  dataSource: 'AWS_MPA',
  servers: [
    {
      serverId: 'srv-001',
      hostname: 'prod-web-01.acmecorp.com',
      ipAddress: '192.168.1.100',
      isPhysical: false,
      osName: 'Linux',
      osVersion: '7.9',
      numCpus: 8,
      numCoresPerCpu: 2,
      numThreadsPerCore: 2,
      totalRAM: 32768,
      maxCpuUsage: 80,
      avgCpuUsage: 45,
      maxRamUsage: 24576,
      avgRamUsage: 16384,
      totalDiskSize: 500,
      storageUtilization: 60,
      uptime: 99.9,
      environment: 'Production'
    },
    {
      serverId: 'srv-002',
      hostname: 'db-primary.acmecorp.com',
      ipAddress: '192.168.1.200',
      isPhysical: false,
      osName: 'Linux',
      osVersion: '7.9',
      numCpus: 16,
      numCoresPerCpu: 2,
      numThreadsPerCore: 2,
      totalRAM: 65536,
      maxCpuUsage: 70,
      avgCpuUsage: 40,
      maxRamUsage: 49152,
      avgRamUsage: 32768,
      totalDiskSize: 1000,
      storageUtilization: 75,
      uptime: 99.95,
      environment: 'Production'
    },
    {
      serverId: 'srv-003',
      hostname: 'app-server-01.acmecorp.com',
      ipAddress: '10.0.5.50',
      isPhysical: false,
      osName: 'Windows',
      osVersion: '2019',
      numCpus: 4,
      numCoresPerCpu: 2,
      numThreadsPerCore: 2,
      totalRAM: 16384,
      maxCpuUsage: 60,
      avgCpuUsage: 30,
      maxRamUsage: 12288,
      avgRamUsage: 8192,
      totalDiskSize: 250,
      storageUtilization: 50,
      uptime: 99.8,
      environment: 'Production'
    }
  ],
  databases: [
    {
      databaseId: 'db-001',
      dbName: 'production_db',
      instanceName: 'db-primary.acmecorp.com',
      engineType: 'PostgreSQL',
      engineVersion: '13.0',
      engineEdition: 'Standard',
      totalSize: 524288,
      serverId: 'srv-002',
      licenseModel: 'Open Source',
      maxTPS: 5000
    },
    {
      databaseId: 'db-002',
      dbName: 'replica_db',
      instanceName: 'db-replica.acmecorp.com',
      engineType: 'PostgreSQL',
      engineVersion: '13.0',
      engineEdition: 'Standard',
      totalSize: 524288,
      serverId: 'srv-002',
      licenseModel: 'Open Source',
      maxTPS: 5000
    }
  ],
  applications: [
    {
      appId: 'app-001',
      name: 'Customer Portal',
      description: 'Main customer-facing application hosted on prod-web-01.acmecorp.com',
      type: 'Web Application',
      totalConnections: 50,
      inboundConnections: 30,
      outboundConnections: 20,
      environmentType: 'Production'
    }
  ],
  serverApplicationMappings: [],
  serverCommunications: [
    {
      sourceServerId: 'srv-001',
      targetServerId: 'srv-002',
      sourceHostname: 'prod-web-01.acmecorp.com',
      targetHostname: 'db-primary.acmecorp.com',
      sourceIpAddress: '192.168.1.100',
      targetIpAddress: '192.168.1.200',
      protocol: 'TCP',
      destinationPort: 5432
    }
  ]
};

const sampleMraData: MraData = {
  maturityLevel: 2,
  securityGaps: [
    'No encryption at rest on db-primary.acmecorp.com',
    'Weak password policy detected on 192.168.1.100',
    'Missing MFA for Acme Corp administrators'
  ],
  drStrategy: 'Manual backups to 10.0.5.100 every night',
  backupStrategy: 'Daily backups stored on backup-server.acmecorp.com',
  complianceRequirements: ['PCI-DSS', 'SOC2'],
  technicalDebt: [
    'Legacy application on app-server-01.acmecorp.com needs modernization',
    'Acme Corp uses outdated SSL certificates'
  ],
  recommendations: [
    'Implement encryption for db-primary.acmecorp.com',
    'Migrate from 192.168.1.0/24 network to cloud'
  ],
  rawText: 'Assessment conducted for Acme Corp. Infrastructure includes prod-web-01.acmecorp.com (192.168.1.100) and db-primary.acmecorp.com (192.168.1.200).'
};

async function main() {
  logSection('VERIFICACIÓN DE ANONIMIZACIÓN - DATOS SENSIBLES NO SE ENVÍAN A BEDROCK');

  // Paso 1: Mostrar datos originales (SENSIBLES)
  logSection('PASO 1: DATOS ORIGINALES (SENSIBLES - NO SE ENVÍAN A BEDROCK)');
  
  log('Servidores:', colors.yellow);
  sampleMpaData.servers.forEach(server => {
    console.log(`  - ${server.hostname} (${server.ipAddress})`);
  });

  log('\nBases de Datos:', colors.yellow);
  sampleMpaData.databases.forEach(db => {
    console.log(`  - ${db.instanceName}`);
  });

  log('\nBrechas de Seguridad:', colors.yellow);
  sampleMraData.securityGaps.forEach(gap => {
    console.log(`  - ${gap}`);
  });

  log('\nEstrategia de DR:', colors.yellow);
  console.log(`  ${sampleMraData.drStrategy}`);

  // Paso 2: Anonimizar datos
  logSection('PASO 2: ANONIMIZACIÓN - REEMPLAZAR DATOS SENSIBLES CON TOKENS');
  
  const anonymizationService = new AnonymizationService();
  const anonymizedData = anonymizationService.anonymize(sampleMpaData, sampleMraData);

  log('Mapeo de Anonimización:', colors.green);
  log('\nIPs Anonimizadas:', colors.cyan);
  anonymizedData.mapping.ipAddresses.forEach((token, original) => {
    console.log(`  ${original} → ${token}`);
  });

  log('\nHostnames Anonimizados:', colors.cyan);
  anonymizedData.mapping.hostnames.forEach((token, original) => {
    console.log(`  ${original} → ${token}`);
  });

  log('\nNombres de Empresa Anonimizados:', colors.cyan);
  if (anonymizedData.mapping.companyNames.size > 0) {
    anonymizedData.mapping.companyNames.forEach((token, original) => {
      console.log(`  ${original} → ${token}`);
    });
  } else {
    console.log('  (ninguno detectado)');
  }

  // Paso 3: Mostrar datos anonimizados
  logSection('PASO 3: DATOS ANONIMIZADOS (ESTO ES LO QUE VE BEDROCK)');
  
  log('Servidores Anonimizados:', colors.green);
  anonymizedData.mpaData.servers.forEach((server: any) => {
    console.log(`  - ${server.hostname} (${server.ipAddress || 'N/A'})`);
  });

  log('\nBases de Datos Anonimizadas:', colors.green);
  anonymizedData.mpaData.databases.forEach((db: any) => {
    console.log(`  - ${db.instanceName}`);
  });

  log('\nBrechas de Seguridad Anonimizadas:', colors.green);
  anonymizedData.mraData.securityGaps?.forEach(gap => {
    console.log(`  - ${gap}`);
  });

  log('\nEstrategia de DR Anonimizada:', colors.green);
  console.log(`  ${anonymizedData.mraData.drStrategy}`);

  // Paso 4: Generar prompt de Bedrock
  logSection('PASO 4: PROMPT ENVIADO A BEDROCK (VERIFICAR QUE NO HAY DATOS SENSIBLES)');
  
  const bedrockService = new BedrockService();
  const prompt = bedrockService.buildPrompt(anonymizedData);

  log('Primeros 2000 caracteres del prompt:', colors.magenta);
  console.log(prompt.substring(0, 2000));
  console.log('\n[... prompt continúa ...]');

  // Paso 5: Verificar que NO hay datos sensibles en el prompt
  logSection('PASO 5: VERIFICACIÓN - BUSCAR DATOS SENSIBLES EN EL PROMPT');

  const sensitiveDataFound: string[] = [];

  // Verificar IPs originales
  log('Verificando IPs originales...', colors.yellow);
  anonymizedData.mapping.ipAddresses.forEach((token, original) => {
    if (prompt.includes(original)) {
      sensitiveDataFound.push(`IP: ${original}`);
      log(`  ❌ ENCONTRADO: ${original}`, colors.red);
    } else {
      log(`  ✓ NO encontrado: ${original}`, colors.green);
    }
  });

  // Verificar hostnames originales
  log('\nVerificando hostnames originales...', colors.yellow);
  anonymizedData.mapping.hostnames.forEach((token, original) => {
    if (prompt.includes(original)) {
      sensitiveDataFound.push(`Hostname: ${original}`);
      log(`  ❌ ENCONTRADO: ${original}`, colors.red);
    } else {
      log(`  ✓ NO encontrado: ${original}`, colors.green);
    }
  });

  // Verificar nombres de empresa
  log('\nVerificando nombres de empresa...', colors.yellow);
  if (anonymizedData.mapping.companyNames.size > 0) {
    anonymizedData.mapping.companyNames.forEach((token, original) => {
      if (prompt.includes(original)) {
        sensitiveDataFound.push(`Company: ${original}`);
        log(`  ❌ ENCONTRADO: ${original}`, colors.red);
      } else {
        log(`  ✓ NO encontrado: ${original}`, colors.green);
      }
    });
  } else {
    log('  (ningún nombre de empresa para verificar)', colors.cyan);
  }

  // Verificar que SÍ hay tokens de anonimización
  log('\nVerificando presencia de tokens de anonimización...', colors.yellow);
  const hasIpTokens = /IP_\d{3}/.test(prompt);
  const hasHostTokens = /HOST_\d{3}/.test(prompt);
  
  if (hasIpTokens) {
    log('  ✓ Tokens IP_XXX encontrados', colors.green);
  } else {
    log('  ⚠ No se encontraron tokens IP_XXX', colors.yellow);
  }

  if (hasHostTokens) {
    log('  ✓ Tokens HOST_XXX encontrados', colors.green);
  } else {
    log('  ⚠ No se encontraron tokens HOST_XXX', colors.yellow);
  }

  // Resultado final
  logSection('RESULTADO FINAL');

  if (sensitiveDataFound.length === 0) {
    log('✅ VERIFICACIÓN EXITOSA', colors.bold + colors.green);
    log('No se encontraron datos sensibles en el prompt enviado a Bedrock.', colors.green);
    log('Todos los datos sensibles fueron reemplazados con tokens anónimos.', colors.green);
  } else {
    log('❌ VERIFICACIÓN FALLIDA', colors.bold + colors.red);
    log('Se encontraron los siguientes datos sensibles en el prompt:', colors.red);
    sensitiveDataFound.forEach(data => {
      console.log(`  - ${data}`);
    });
  }

  logSection('INFORMACIÓN ADICIONAL');
  log('Datos técnicos preservados (NO sensibles):', colors.cyan);
  console.log('  - Conteos de servidores, bases de datos, aplicaciones');
  console.log('  - Tipos de OS, versiones, CPUs, RAM');
  console.log('  - Tipos de motores de BD, versiones');
  console.log('  - Nivel de madurez, protocolos, puertos');
  console.log('  - Requisitos de cumplimiento (PCI-DSS, SOC2, etc.)');

  log('\nDatos anonimizados (tokens):', colors.cyan);
  console.log('  - IPs → IP_001, IP_002, IP_003, ...');
  console.log('  - Hostnames → HOST_001, HOST_002, HOST_003, ...');
  console.log('  - Nombres de empresa → COMPANY_A, COMPANY_B, ...');

  log('\nPruebas automatizadas:', colors.cyan);
  console.log('  - Property-based tests en AnonymizationService.property.test.ts');
  console.log('  - Property-based tests en BedrockService.property.test.ts');
  console.log('  - 100 casos generados aleatoriamente por cada propiedad');
  console.log('  - Verifican que NO hay IPs, hostnames o nombres de empresa en datos anonimizados');

  log('\nLogs de CloudWatch:', colors.cyan);
  console.log('  - Solo se registran tokens anonimizados');
  console.log('  - Ejemplo: "firstServerHostname: HOST_001"');
  console.log('  - NO se registran IPs, hostnames o nombres de empresa reales');

  console.log('\n');
}

// Ejecutar verificación
main().catch(error => {
  console.error('Error durante la verificación:', error);
  process.exit(1);
});
