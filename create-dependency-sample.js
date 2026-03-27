const XLSX = require('xlsx');
const path = require('path');

// Sample dependency data
const dependencies = [
  // Web tier
  { source: 'WEB-SERVER-01', destination: 'APP-SERVER-01', port: 8080, protocol: 'TCP', service: 'HTTP', source_app: 'Frontend', destination_app: 'Backend' },
  { source: 'WEB-SERVER-01', destination: 'APP-SERVER-02', port: 8080, protocol: 'TCP', service: 'HTTP', source_app: 'Frontend', destination_app: 'Backend' },
  { source: 'WEB-SERVER-02', destination: 'APP-SERVER-01', port: 8080, protocol: 'TCP', service: 'HTTP', source_app: 'Frontend', destination_app: 'Backend' },
  { source: 'WEB-SERVER-02', destination: 'APP-SERVER-02', port: 8080, protocol: 'TCP', service: 'HTTP', source_app: 'Frontend', destination_app: 'Backend' },
  
  // App to database
  { source: 'APP-SERVER-01', destination: 'DB-SERVER-01', port: 3306, protocol: 'TCP', service: 'MySQL', source_app: 'Backend', destination_app: 'Database' },
  { source: 'APP-SERVER-02', destination: 'DB-SERVER-01', port: 3306, protocol: 'TCP', service: 'MySQL', source_app: 'Backend', destination_app: 'Database' },
  { source: 'APP-SERVER-01', destination: 'DB-SERVER-02', port: 5432, protocol: 'TCP', service: 'PostgreSQL', source_app: 'Backend', destination_app: 'Database' },
  { source: 'APP-SERVER-02', destination: 'DB-SERVER-02', port: 5432, protocol: 'TCP', service: 'PostgreSQL', source_app: 'Backend', destination_app: 'Database' },
  
  // App to cache
  { source: 'APP-SERVER-01', destination: 'CACHE-SERVER-01', port: 6379, protocol: 'TCP', service: 'Redis', source_app: 'Backend', destination_app: 'Cache' },
  { source: 'APP-SERVER-02', destination: 'CACHE-SERVER-01', port: 6379, protocol: 'TCP', service: 'Redis', source_app: 'Backend', destination_app: 'Cache' },
  
  // App to message queue
  { source: 'APP-SERVER-01', destination: 'MQ-SERVER-01', port: 5672, protocol: 'TCP', service: 'RabbitMQ', source_app: 'Backend', destination_app: 'MessageQueue' },
  { source: 'APP-SERVER-02', destination: 'MQ-SERVER-01', port: 5672, protocol: 'TCP', service: 'RabbitMQ', source_app: 'Backend', destination_app: 'MessageQueue' },
  
  // Worker to database
  { source: 'WORKER-SERVER-01', destination: 'DB-SERVER-01', port: 3306, protocol: 'TCP', service: 'MySQL', source_app: 'Worker', destination_app: 'Database' },
  { source: 'WORKER-SERVER-01', destination: 'MQ-SERVER-01', port: 5672, protocol: 'TCP', service: 'RabbitMQ', source_app: 'Worker', destination_app: 'MessageQueue' },
  
  // API Gateway
  { source: 'API-GATEWAY-01', destination: 'APP-SERVER-01', port: 8080, protocol: 'TCP', service: 'HTTP', source_app: 'Gateway', destination_app: 'Backend' },
  { source: 'API-GATEWAY-01', destination: 'APP-SERVER-02', port: 8080, protocol: 'TCP', service: 'HTTP', source_app: 'Gateway', destination_app: 'Backend' },
  { source: 'API-GATEWAY-01', destination: 'AUTH-SERVER-01', port: 8443, protocol: 'TCP', service: 'HTTPS', source_app: 'Gateway', destination_app: 'Auth' },
  
  // Auth service
  { source: 'AUTH-SERVER-01', destination: 'DB-SERVER-01', port: 3306, protocol: 'TCP', service: 'MySQL', source_app: 'Auth', destination_app: 'Database' },
  { source: 'AUTH-SERVER-01', destination: 'LDAP-SERVER-01', port: 389, protocol: 'TCP', service: 'LDAP', source_app: 'Auth', destination_app: 'Directory' },
  
  // Monitoring
  { source: 'MONITOR-SERVER-01', destination: 'WEB-SERVER-01', port: 9100, protocol: 'TCP', service: 'Node Exporter', source_app: 'Monitoring', destination_app: 'Frontend' },
  { source: 'MONITOR-SERVER-01', destination: 'WEB-SERVER-02', port: 9100, protocol: 'TCP', service: 'Node Exporter', source_app: 'Monitoring', destination_app: 'Frontend' },
  { source: 'MONITOR-SERVER-01', destination: 'APP-SERVER-01', port: 9100, protocol: 'TCP', service: 'Node Exporter', source_app: 'Monitoring', destination_app: 'Backend' },
  { source: 'MONITOR-SERVER-01', destination: 'APP-SERVER-02', port: 9100, protocol: 'TCP', service: 'Node Exporter', source_app: 'Monitoring', destination_app: 'Backend' },
  { source: 'MONITOR-SERVER-01', destination: 'DB-SERVER-01', port: 9100, protocol: 'TCP', service: 'Node Exporter', source_app: 'Monitoring', destination_app: 'Database' },
  
  // Backup
  { source: 'BACKUP-SERVER-01', destination: 'DB-SERVER-01', port: 3306, protocol: 'TCP', service: 'MySQL', source_app: 'Backup', destination_app: 'Database' },
  { source: 'BACKUP-SERVER-01', destination: 'DB-SERVER-02', port: 5432, protocol: 'TCP', service: 'PostgreSQL', source_app: 'Backup', destination_app: 'Database' },
  { source: 'BACKUP-SERVER-01', destination: 'FILE-SERVER-01', port: 445, protocol: 'TCP', service: 'SMB', source_app: 'Backup', destination_app: 'FileStorage' },
  
  // File storage
  { source: 'APP-SERVER-01', destination: 'FILE-SERVER-01', port: 445, protocol: 'TCP', service: 'SMB', source_app: 'Backend', destination_app: 'FileStorage' },
  { source: 'APP-SERVER-02', destination: 'FILE-SERVER-01', port: 445, protocol: 'TCP', service: 'SMB', source_app: 'Backend', destination_app: 'FileStorage' },
  
  // Load balancer
  { source: 'LOAD-BALANCER-01', destination: 'WEB-SERVER-01', port: 80, protocol: 'TCP', service: 'HTTP', source_app: 'LoadBalancer', destination_app: 'Frontend' },
  { source: 'LOAD-BALANCER-01', destination: 'WEB-SERVER-02', port: 80, protocol: 'TCP', service: 'HTTP', source_app: 'LoadBalancer', destination_app: 'Frontend' },
  { source: 'LOAD-BALANCER-01', destination: 'WEB-SERVER-01', port: 443, protocol: 'TCP', service: 'HTTPS', source_app: 'LoadBalancer', destination_app: 'Frontend' },
  { source: 'LOAD-BALANCER-01', destination: 'WEB-SERVER-02', port: 443, protocol: 'TCP', service: 'HTTPS', source_app: 'LoadBalancer', destination_app: 'Frontend' },
];

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet
const ws = XLSX.utils.json_to_sheet(dependencies);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Network Dependencies');

// Write file
const outputPath = path.join(__dirname, 'sample-dependencies.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Archivo de ejemplo creado: ${outputPath}`);
console.log(`📊 Total de dependencias: ${dependencies.length}`);
console.log(`🖥️  Servidores únicos: ${new Set([...dependencies.map(d => d.source), ...dependencies.map(d => d.destination)]).size}`);
console.log(`📱 Aplicaciones únicas: ${new Set([...dependencies.map(d => d.source_app), ...dependencies.map(d => d.destination_app)]).size}`);
