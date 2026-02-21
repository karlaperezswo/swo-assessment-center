# Multi-Source Data Parser & Security Group Generator

## 📋 Descripción General

Este sistema permite procesar archivos Excel de múltiples fuentes de datos (AWS MPA, Concierto, Matilda, etc.) y generar automáticamente grupos de seguridad basados en las comunicaciones entre servidores y aplicaciones.

## 🎯 Características Principales

### 1. **Detección Automática de Formato**
- El sistema detecta automáticamente el tipo de archivo Excel
- Soporta múltiples formatos sin necesidad de configuración manual
- Fallback inteligente si el formato no es reconocido

### 2. **Parsers Específicos por Fuente**
Actualmente soporta:

#### AWS MPA (Migration Portfolio Assessment)
- **Hojas**: Servers, Databases, Applications, Server to Application, Server Communication
- **Características**: Formato estándar de AWS con IDs únicos

#### Concierto MPA Report
- **Hojas**: Inventory Master, Databases, App to IP Mapping, Overall Connections (Prod/Dev/UAT/SIT/DR)
- **Características**:
  - Información detallada de conectividad por ambiente
  - Puertos origen y destino
  - Información de SQL Edition integrada
  - 889 servidores, 98 aplicaciones, 6216+ conexiones

### 3. **Generación de Grupos de Seguridad**
- Análisis automático de comunicaciones
- Consolidación de reglas por protocolo y puerto
- Agrupación por aplicación y ambiente
- Identificación de servicios comunes (HTTP, HTTPS, SSH, RDP, bases de datos)

## 📊 Estadísticas del Archivo Concierto

```
Total Servers (Inventory): 889
Servers with SQL Edition: 889
Database entries: 260
Unique Applications: 98
Server-to-App mappings: 889

🔗 Connections by Environment:
- Prod: 4,350 connections
- UAT:   704 connections
- DR:    963 connections
- SIT:   136 connections
- Dev:    63 connections
Total: 6,216 connections

🔌 Top Ports Used:
- Port 443  (HTTPS): 1,668 connections
- Port 8027:         1,214 connections
- Port 1435:           638 connections
- Port 1524:           569 connections
- Port 1433 (MSSQL):   296 connections
- Port 22   (SSH):     249 connections
```

## 🏗️ Arquitectura

### Backend Structure

```
backend/src/services/
├── parsers/
│   ├── BaseParser.ts           # Clase base abstracta
│   ├── AWSMPAParser.ts         # Parser para AWS MPA
│   ├── ConciertoParser.ts      # Parser para Concierto
│   ├── FormatDetector.ts       # Detección automática
│   └── index.ts                # Exports
├── excelService.ts             # Servicio principal
└── SecurityGroupService.ts     # Generación de grupos de seguridad
```

### Data Flow

```
1. Excel File Upload
   ↓
2. Format Detection (FormatDetector)
   ↓
3. Parser Selection (AWSMPAParser | ConciertoParser | ...)
   ↓
4. Data Parsing
   ↓
5. Security Group Generation (SecurityGroupService)
   ↓
6. Response with ExcelData + Summary
```

## 🔧 Tipos de Datos

### ExcelData
```typescript
{
  dataSource: 'AWS_MPA' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN',
  servers: Server[],
  databases: Database[],
  applications: Application[],
  serverApplicationMappings: ServerApplicationMapping[],
  serverCommunications: ServerCommunication[],
  securityGroups?: SecurityGroup[]
}
```

### ServerCommunication (Enhanced)
```typescript
{
  sourceServerId: string,
  targetServerId: string,
  sourceHostname: string,
  targetHostname: string,
  sourceIpAddress?: string,
  targetIpAddress?: string,
  sourcePort?: number,           // NEW
  destinationPort: number,       // RENAMED from 'port'
  protocol: string,
  sourceEnvironment?: string,    // NEW
  targetEnvironment?: string,    // NEW
  connectionType?: 'Upstream' | 'Downstream' | 'Bidirectional',
  category?: string,             // NEW
  sourceService?: string,        // NEW
  sourceAppName?: string,        // NEW
  targetAppName?: string         // NEW
}
```

### SecurityGroup
```typescript
{
  groupId: string,
  groupName: string,
  description: string,
  vpcId?: string,
  inboundRules: SecurityGroupRule[],
  outboundRules: SecurityGroupRule[],
  associatedServers: string[],
  associatedApplications: string[],
  environment?: string
}
```

### SecurityGroupRule
```typescript
{
  ruleId: string,
  direction: 'inbound' | 'outbound',
  protocol: string,
  port?: number,
  portRange?: { from: number; to: number },
  source?: string,
  destination?: string,
  description: string,
  relatedApplications: string[],
  relatedServers: string[]
}
```

## 💻 Uso

### 1. Subir Archivo
El sistema detecta automáticamente el formato:

```typescript
// Frontend - FileUploader component
const response = await apiClient.post('/api/report/upload-from-s3', { key });
const { excelData, summary } = response.data.data;

// Summary incluye:
// - serverCount
// - databaseCount
// - applicationCount
// - communicationCount (NEW)
// - securityGroupCount (NEW)
// - dataSource (NEW)
```

### 2. Backend Processing
```typescript
// backend/src/services/excelService.ts
const excelData = excelService.parseExcelFromBuffer(buffer);

// Automáticamente:
// 1. Detecta el formato (AWS_MPA | CONCIERTO)
// 2. Selecciona el parser apropiado
// 3. Parsea los datos
// 4. Genera grupos de seguridad
```

### 3. Acceder a Security Groups
```typescript
// Los grupos de seguridad están disponibles en excelData.securityGroups
const securityGroups = excelData.securityGroups;

// Cada grupo contiene:
// - Reglas inbound/outbound consolidadas
// - Servidores asociados
// - Aplicaciones relacionadas
// - Ambiente (Prod/Dev/UAT/etc.)
```

## 🧪 Testing

### Script de Prueba
```bash
# Analizar archivo Concierto
node test-concierto-parser.js

# Output incluye:
# - Resumen de hojas
# - Estadísticas de servidores
# - Análisis de conexiones por ambiente
# - Top 10 puertos más usados
```

### Pruebas Manuales
```bash
# 1. Subir archivo AWS MPA
# → Detecta formato: AWS_MPA
# → Procesa servidores, databases, apps

# 2. Subir archivo Concierto
# → Detecta formato: CONCIERTO
# → Procesa 889 servidores, 6216 conexiones
# → Genera grupos de seguridad
```

## 📝 Agregar Nuevo Parser

Para agregar soporte para un nuevo formato (ej: Matilda):

### 1. Crear Parser
```typescript
// backend/src/services/parsers/MatildaParser.ts
import { BaseParser } from './BaseParser';

export class MatildaParser extends BaseParser {
  getDataSourceType(): DataSourceType {
    return 'MATILDA';
  }

  canParse(): boolean {
    // Lógica para detectar formato Matilda
    return this.workbook.SheetNames.some(s =>
      s.includes('Matilda Specific Sheet')
    );
  }

  parse(): ExcelData {
    // Implementar parsing específico
  }

  // Implementar métodos abstractos...
}
```

### 2. Registrar en FormatDetector
```typescript
// backend/src/services/parsers/FormatDetector.ts
constructor(workbook: XLSX.WorkBook) {
  this.parsers = [
    new ConciertoParser(workbook),
    new MatildaParser(workbook),      // ← Agregar aquí
    new AWSMPAParser(workbook),
  ];
}
```

### 3. Actualizar Tipos
```typescript
// shared/types/assessment.types.ts
export type DataSourceType =
  | 'AWS_MPA'
  | 'CONCIERTO'
  | 'MATILDA'    // ← Agregar
  | 'UNKNOWN';
```

## 🔐 Security Group Mapping

### Lógica de Agrupación

1. **Por Aplicación + Ambiente**
   - Se agrupan conexiones por `(Application Name, Environment)`
   - Ejemplo: `CRMNext-Prod`, `ITAM-UAT`

2. **Consolidación de Reglas**
   - Se consolidan conexiones con mismo protocolo + puerto
   - Se agrupan por origen/destino
   - Se genera descripción automática

3. **Identificación de Servicios**
   - Puertos comunes se identifican automáticamente
   - Ejemplos: 443→HTTPS, 1433→MSSQL, 22→SSH

### Ejemplo de Security Group Generado

```typescript
{
  groupId: "sg-crmnext-prod",
  groupName: "CRMNext-Prod-sg",
  description: "Security group for CRMNext in Prod environment",
  inboundRules: [
    {
      direction: "inbound",
      protocol: "tcp",
      port: 443,
      source: "10.0.0.0/8",
      description: "Allow inbound HTTPS (tcp/443) from internal network",
      relatedApplications: ["Portal", "API Gateway"]
    }
  ],
  outboundRules: [
    {
      direction: "outbound",
      protocol: "tcp",
      port: 1433,
      destination: "sg-database-prod",
      description: "Allow outbound MSSQL (tcp/1433) for Database",
      relatedApplications: ["MSSQL Database"]
    }
  ],
  associatedServers: ["Prod3033", "Prod227"],
  associatedApplications: ["CRMNext"],
  environment: "Prod"
}
```

## 📈 Mejoras Futuras

### Corto Plazo
- [ ] Export security groups a Terraform
- [ ] Export security groups a CloudFormation
- [ ] Visualización de dependencias entre aplicaciones
- [ ] Dashboard de conectividad

### Mediano Plazo
- [ ] Análisis de riesgos de seguridad
- [ ] Recomendaciones de optimización de reglas
- [ ] Simulador de cambios en grupos de seguridad
- [ ] Templates de grupos de seguridad por tipo de app

### Largo Plazo
- [ ] Machine learning para detectar patrones
- [ ] Integración con AWS Security Hub
- [ ] Compliance checking automático
- [ ] Detección de configuraciones inseguras

## 🤝 Contribuir

Para agregar soporte para nuevos formatos:
1. Crea un parser extendiendo `BaseParser`
2. Implementa el método `canParse()` para detección
3. Implementa los métodos de parsing específicos
4. Agrega pruebas
5. Actualiza documentación

## 📚 Referencias

- [AWS MPA Documentation](https://aws.amazon.com/migration-portfolio-assessment/)
- [AWS VPC Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [Concierto MPA Format Specification](internal)

---

**Version:** 1.0.0
**Last Updated:** 2024
**Maintainers:** Assessment Center Team
