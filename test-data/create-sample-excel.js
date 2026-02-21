// Script para crear un Excel de prueba
// Ejecutar: node create-sample-excel.js

const XLSX = require('xlsx');

// Datos de ejemplo - Servers
const servers = [
  {
    'Server Id': 'srv-001',
    'HOSTNAME': 'WEB-PROD-01',
    'osName': 'Windows Server 2019',
    'numCpus': 2,
    'numCoresPerCpu': 4,
    'numThreadsPerCore': 2,
    'totalRAM': 32,
    'avgCpuUsagePct': 45,
    'avgRamUsagePct': 60,
    'Storage-Total Disk Size (GB)': 500
  },
  {
    'Server Id': 'srv-002',
    'HOSTNAME': 'WEB-PROD-02',
    'osName': 'Windows Server 2019',
    'numCpus': 2,
    'numCoresPerCpu': 4,
    'numThreadsPerCore': 2,
    'totalRAM': 32,
    'avgCpuUsagePct': 35,
    'avgRamUsagePct': 55,
    'Storage-Total Disk Size (GB)': 500
  },
  {
    'Server Id': 'srv-003',
    'HOSTNAME': 'APP-PROD-01',
    'osName': 'Red Hat Enterprise Linux 8',
    'numCpus': 2,
    'numCoresPerCpu': 8,
    'numThreadsPerCore': 2,
    'totalRAM': 64,
    'avgCpuUsagePct': 70,
    'avgRamUsagePct': 75,
    'Storage-Total Disk Size (GB)': 1000
  },
  {
    'Server Id': 'srv-004',
    'HOSTNAME': 'APP-PROD-02',
    'osName': 'Red Hat Enterprise Linux 8',
    'numCpus': 2,
    'numCoresPerCpu': 8,
    'numThreadsPerCore': 2,
    'totalRAM': 64,
    'avgCpuUsagePct': 65,
    'avgRamUsagePct': 70,
    'Storage-Total Disk Size (GB)': 1000
  },
  {
    'Server Id': 'srv-005',
    'HOSTNAME': 'DB-PROD-01',
    'osName': 'Windows Server 2019',
    'numCpus': 4,
    'numCoresPerCpu': 8,
    'numThreadsPerCore': 2,
    'totalRAM': 256,
    'avgCpuUsagePct': 55,
    'avgRamUsagePct': 80,
    'Storage-Total Disk Size (GB)': 2000
  },
  {
    'Server Id': 'srv-006',
    'HOSTNAME': 'DB-PROD-02',
    'osName': 'Red Hat Enterprise Linux 8',
    'numCpus': 4,
    'numCoresPerCpu': 8,
    'numThreadsPerCore': 2,
    'totalRAM': 128,
    'avgCpuUsagePct': 40,
    'avgRamUsagePct': 65,
    'Storage-Total Disk Size (GB)': 1500
  },
  {
    'Server Id': 'srv-007',
    'HOSTNAME': 'FILE-SERVER-01',
    'osName': 'Windows Server 2016',
    'numCpus': 1,
    'numCoresPerCpu': 4,
    'numThreadsPerCore': 2,
    'totalRAM': 16,
    'avgCpuUsagePct': 15,
    'avgRamUsagePct': 30,
    'Storage-Total Disk Size (GB)': 5000
  },
  {
    'Server Id': 'srv-008',
    'HOSTNAME': 'BACKUP-01',
    'osName': 'Ubuntu 20.04',
    'numCpus': 1,
    'numCoresPerCpu': 2,
    'numThreadsPerCore': 2,
    'totalRAM': 8,
    'avgCpuUsagePct': 10,
    'avgRamUsagePct': 25,
    'Storage-Total Disk Size (GB)': 10000
  },
  {
    'Server Id': 'srv-009',
    'HOSTNAME': 'MONITORING-01',
    'osName': 'Ubuntu 22.04',
    'numCpus': 1,
    'numCoresPerCpu': 4,
    'numThreadsPerCore': 2,
    'totalRAM': 16,
    'avgCpuUsagePct': 25,
    'avgRamUsagePct': 40,
    'Storage-Total Disk Size (GB)': 200
  },
  {
    'Server Id': 'srv-010',
    'HOSTNAME': 'DEV-SERVER-01',
    'osName': 'Windows Server 2022',
    'numCpus': 1,
    'numCoresPerCpu': 4,
    'numThreadsPerCore': 2,
    'totalRAM': 32,
    'avgCpuUsagePct': 20,
    'avgRamUsagePct': 35,
    'Storage-Total Disk Size (GB)': 500
  }
];

// Datos de ejemplo - Databases
const databases = [
  {
    'Database Id': 'db-001',
    'DB Name': 'ProductionDB',
    'Instance Name': 'SQLPROD01',
    'Source Engine Type': 'MSSQL',
    'Engine Version': '2019',
    'Engine Edition': 'Enterprise',
    'Total Size (GB)': 500,
    'Server Id': 'srv-005',
    'License Model': 'license-included'
  },
  {
    'Database Id': 'db-002',
    'DB Name': 'ReportingDB',
    'Instance Name': 'SQLPROD01',
    'Source Engine Type': 'MSSQL',
    'Engine Version': '2019',
    'Engine Edition': 'Standard',
    'Total Size (GB)': 200,
    'Server Id': 'srv-005',
    'License Model': 'license-included'
  },
  {
    'Database Id': 'db-003',
    'DB Name': 'AppDatabase',
    'Instance Name': 'PGPROD01',
    'Source Engine Type': 'PostgreSQL',
    'Engine Version': '14',
    'Engine Edition': '',
    'Total Size (GB)': 150,
    'Server Id': 'srv-006',
    'License Model': 'general-public-license'
  },
  {
    'Database Id': 'db-004',
    'DB Name': 'AnalyticsDB',
    'Instance Name': 'PGPROD01',
    'Source Engine Type': 'PostgreSQL',
    'Engine Version': '14',
    'Engine Edition': '',
    'Total Size (GB)': 300,
    'Server Id': 'srv-006',
    'License Model': 'general-public-license'
  },
  {
    'Database Id': 'db-005',
    'DB Name': 'LegacyDB',
    'Instance Name': 'MYSQLPROD',
    'Source Engine Type': 'MySQL',
    'Engine Version': '5.7',
    'Engine Edition': '',
    'Total Size (GB)': 50,
    'Server Id': 'srv-003',
    'License Model': 'general-public-license'
  }
];

// Datos de ejemplo - Applications
const applications = [
  {
    'Application Id': 'app-001',
    'Application Name': 'E-Commerce Platform',
    'Description': 'Main e-commerce web application',
    'Type': 'Web Application',
    'Total Connections': 150,
    'Inbound Connections': 100,
    'Outbound Connections': 50,
    'Environment Type': 'Production'
  },
  {
    'Application Id': 'app-002',
    'Application Name': 'Order Management System',
    'Description': 'Backend order processing',
    'Type': 'Backend Service',
    'Total Connections': 80,
    'Inbound Connections': 50,
    'Outbound Connections': 30,
    'Environment Type': 'Production'
  },
  {
    'Application Id': 'app-003',
    'Application Name': 'Customer Portal',
    'Description': 'Customer self-service portal',
    'Type': 'Web Application',
    'Total Connections': 60,
    'Inbound Connections': 40,
    'Outbound Connections': 20,
    'Environment Type': 'Production'
  },
  {
    'Application Id': 'app-004',
    'Application Name': 'Reporting Service',
    'Description': 'Business intelligence and reporting',
    'Type': 'Backend Service',
    'Total Connections': 25,
    'Inbound Connections': 10,
    'Outbound Connections': 15,
    'Environment Type': 'Production'
  },
  {
    'Application Id': 'app-005',
    'Application Name': 'API Gateway',
    'Description': 'Central API gateway',
    'Type': 'Infrastructure',
    'Total Connections': 200,
    'Inbound Connections': 150,
    'Outbound Connections': 50,
    'Environment Type': 'Production'
  },
  {
    'Application Id': 'app-006',
    'Application Name': 'Monitoring Dashboard',
    'Description': 'System monitoring and alerting',
    'Type': 'Monitoring',
    'Total Connections': 30,
    'Inbound Connections': 5,
    'Outbound Connections': 25,
    'Environment Type': 'Production'
  },
  {
    'Application Id': 'app-007',
    'Application Name': 'Dev Environment',
    'Description': 'Development and testing',
    'Type': 'Development',
    'Total Connections': 15,
    'Inbound Connections': 10,
    'Outbound Connections': 5,
    'Environment Type': 'Development'
  }
];

// Crear workbook
const wb = XLSX.utils.book_new();

// Agregar hojas
const wsServers = XLSX.utils.json_to_sheet(servers);
XLSX.utils.book_append_sheet(wb, wsServers, 'Servers');

const wsDatabases = XLSX.utils.json_to_sheet(databases);
XLSX.utils.book_append_sheet(wb, wsDatabases, 'Databases');

const wsApplications = XLSX.utils.json_to_sheet(applications);
XLSX.utils.book_append_sheet(wb, wsApplications, 'Applications');

// Guardar archivo
XLSX.writeFile(wb, 'sample-mpa-export.xlsx');

console.log('Archivo creado: sample-mpa-export.xlsx');
console.log('Contenido:');
console.log(`  - ${servers.length} servidores`);
console.log(`  - ${databases.length} bases de datos`);
console.log(`  - ${applications.length} aplicaciones`);
