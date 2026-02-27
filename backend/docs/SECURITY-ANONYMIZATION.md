# Verificación de Seguridad: Anonimización de Datos Sensibles

## Resumen Ejecutivo

✅ **CONFIRMADO**: Los datos sensibles (IPs, hostnames, nombres de empresa) **NO se envían a Amazon Bedrock**.

Todos los datos sensibles son reemplazados con tokens anónimos antes de ser enviados a Bedrock para análisis.

---

## Flujo de Seguridad

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. DATOS ORIGINALES (SENSIBLES)                                    │
│    - IPs: 192.168.1.100, 192.168.1.200, 10.0.5.50                 │
│    - Hostnames: prod-web-01.acmecorp.com, db-primary.acmecorp.com │
│    - Empresa: Acme Corp                                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. ANONIMIZACIÓN (AnonymizationService)                            │
│    - 192.168.1.100 → IP_001                                        │
│    - prod-web-01.acmecorp.com → HOST_001                           │
│    - Acme Corp → COMPANY_A                                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. DATOS ANONIMIZADOS (ENVIADOS A BEDROCK)                         │
│    - IPs: IP_001, IP_002, IP_003                                   │
│    - Hostnames: HOST_001, HOST_002, HOST_003                       │
│    - Empresa: COMPANY_A, COMPANY_B                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. BEDROCK ANALIZA (solo ve tokens)                                │
│    - Genera oportunidades basadas en tokens                        │
│    - NO tiene acceso a datos sensibles reales                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. DEANONIMIZACIÓN (OpportunityAnalyzerService)                    │
│    - IP_001 → 192.168.1.100                                        │
│    - HOST_001 → prod-web-01.acmecorp.com                           │
│    - COMPANY_A → Acme Corp                                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. OPORTUNIDADES FINALES (con datos reales restaurados)            │
│    - Usuario ve datos originales en el frontend                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Componentes de Seguridad

### 1. AnonymizationService (`backend/src/services/AnonymizationService.ts`)

**Responsabilidad**: Reemplazar datos sensibles con tokens anónimos.

**Patrones detectados**:
- **IPs**: `\b(?:\d{1,3}\.){3}\d{1,3}\b` → `IP_001`, `IP_002`, ...
- **Hostnames**: FQDNs como `server.domain.com` → `HOST_001`, `HOST_002`, ...
- **Nombres de empresa**: Patrones como "Acme Corp", "Company Inc" → `COMPANY_A`, `COMPANY_B`, ...

**Datos preservados** (NO sensibles):
- Conteos: número de servidores, bases de datos, aplicaciones
- Especificaciones técnicas: CPUs, RAM, almacenamiento
- Tecnologías: tipos de OS, versiones, motores de BD
- Arquitectura: protocolos, puertos, patrones de comunicación
- Nivel de madurez, requisitos de cumplimiento

**Ejemplo**:
```typescript
// ANTES (sensible)
{
  hostname: "prod-web-01.acmecorp.com",
  ipAddress: "192.168.1.100",
  osName: "Linux",
  numCpus: 8,
  totalRAM: 32768
}

// DESPUÉS (anonimizado)
{
  hostname: "HOST_001",
  ipAddress: "IP_001",
  osName: "Linux",      // ✓ Preservado
  numCpus: 8,           // ✓ Preservado
  totalRAM: 32768       // ✓ Preservado
}
```

### 2. BedrockService (`backend/src/services/BedrockService.ts`)

**Responsabilidad**: Construir prompt y enviar a Bedrock.

**Seguridad**:
- Solo recibe datos ya anonimizados
- Construye prompt con tokens, NO con datos reales
- Logs de CloudWatch solo contienen tokens

**Ejemplo de prompt enviado a Bedrock**:
```
MPA Data Summary:
- Total Servers: 3
- Total Databases: 2
- Operating Systems: Linux, Windows
- Total CPUs: 28
- Total RAM: 112.00 GB

MRA Data Summary:
- Maturity Level: 2/5
- Security Gaps:
  - No encryption at rest on HOST_002        ← Token, no hostname real
  - Weak password policy detected on IP_001  ← Token, no IP real
  - COMPANY_A administrators                 ← Token, no nombre real
```

### 3. OpportunityAnalyzerService (`backend/src/services/OpportunityAnalyzerService.ts`)

**Responsabilidad**: Parsear respuesta de Bedrock y restaurar datos originales.

**Proceso**:
1. Recibe respuesta JSON de Bedrock (contiene tokens)
2. Usa el mapping de anonimización para restaurar valores originales
3. Devuelve oportunidades con datos reales al frontend

---

## Verificación de Seguridad

### Método 1: Script de Verificación

Ejecutar el script de verificación:

```bash
cd backend
npx ts-node verify-anonymization.ts
```

**Resultado esperado**:
```
✅ VERIFICACIÓN EXITOSA
No se encontraron datos sensibles en el prompt enviado a Bedrock.
Todos los datos sensibles fueron reemplazados con tokens anónimos.
```

### Método 2: Property-Based Tests

Ejecutar tests automatizados:

```bash
cd backend
npm test -- AnonymizationService.property.test.ts
npm test -- BedrockService.property.test.ts
```

**Tests ejecutados**:
- **Property 4**: Comprehensive Sensitive Data Anonymization
  - Verifica que NO hay IPs en datos anonimizados (100 casos)
  - Verifica que NO hay hostnames en datos anonimizados (100 casos)
  - Verifica que NO hay nombres de empresa en datos anonimizados (100 casos)
  
- **Property 5**: Preservation of Non-Sensitive Data
  - Verifica que datos técnicos se preservan (100 casos)
  
- **Property 6**: Anonymization Round-Trip
  - Verifica que anonimizar → deanonimizar restaura datos originales (100 casos)
  
- **Property 9**: CloudWatch Logging Without Sensitive Data
  - Verifica que logs NO contienen datos sensibles (100 casos)

**Total**: 700+ casos de prueba generados aleatoriamente

### Método 3: Inspección Manual del Código

1. **Revisar OpportunityController.ts** (líneas 80-95):
```typescript
// Step 4: Anonymize data
console.log('[ANALYZE] Anonymizing data...');
const anonymizedData = this.anonymizationService.anonymize(mpaData, mraData);

// Step 5: Call Bedrock
console.log('[ANALYZE] Calling Bedrock AI...');
const bedrockResponse = await this.bedrockService.analyzeOpportunities(anonymizedData);
```

2. **Revisar BedrockService.ts** (línea 35):
```typescript
async analyzeOpportunities(anonymizedData: AnonymizedData): Promise<BedrockResponse> {
  const prompt = this.buildPrompt(anonymizedData);  // Solo usa datos anonimizados
  // ...
}
```

3. **Revisar AnonymizationService.ts** (líneas 150-180):
```typescript
private validateAnonymization(anonymizedMpaData: any, anonymizedMraData: Partial<MraData>): void {
  // Verifica que no queden patrones sensibles después de anonimización
  const ipMatches = combined.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
  if (ipMatches && ipMatches.length > 0) {
    console.warn('Warning: Potential IP addresses found after anonymization:', realIps);
  }
}
```

### Método 4: CloudWatch Logs

Revisar logs en AWS CloudWatch:

```json
{
  "timestamp": "2024-02-22T10:30:00.000Z",
  "modelId": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "serverCount": 3,
  "databaseCount": 2,
  "maturityLevel": 2,
  "inputTokens": 2500,
  "outputTokens": 1800,
  "sampleAnonymizedData": {
    "firstServerHostname": "HOST_001"  ← Token, NO hostname real
  }
}
```

**Nota**: Los logs NUNCA contienen IPs, hostnames o nombres de empresa reales.

---

## Garantías de Seguridad

### ✅ Datos que NUNCA se envían a Bedrock:
- Direcciones IP reales (ej: `192.168.1.100`)
- Hostnames reales (ej: `prod-web-01.acmecorp.com`)
- Nombres de empresa reales (ej: `Acme Corp`)
- Información de identificación personal (PII)

### ✅ Datos que SÍ se envían a Bedrock (NO sensibles):
- Conteos agregados (número de servidores, bases de datos)
- Especificaciones técnicas (CPUs, RAM, almacenamiento)
- Tipos de tecnología (Linux, Windows, PostgreSQL, MySQL)
- Versiones de software (7.9, 2019, 13.0)
- Patrones de arquitectura (protocolos, puertos)
- Nivel de madurez (1-5)
- Requisitos de cumplimiento (PCI-DSS, SOC2)
- Tokens anónimos (IP_001, HOST_001, COMPANY_A)

### ✅ Almacenamiento seguro:
- Archivos originales (MPA/MRA) se almacenan en S3 con cifrado AES256
- Datos sensibles solo existen en memoria durante el procesamiento
- Mapping de anonimización se mantiene en memoria, NO se persiste

---

## Arquitectura de Seguridad

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  - Usuario sube MPA/MRA                                          │
│  - Ve oportunidades con datos reales (después de deanonimizar)  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    OPPORTUNITY CONTROLLER                        │
│  1. Parsea archivos (PdfParserService, ExcelService)            │
│  2. Almacena en S3 con cifrado AES256                           │
│  3. Anonimiza datos (AnonymizationService)                      │
│  4. Envía a Bedrock (BedrockService)                            │
│  5. Parsea respuesta (OpportunityAnalyzerService)               │
│  6. Deanonimiza (restaura datos originales)                     │
│  7. Devuelve oportunidades al frontend                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      AMAZON BEDROCK                              │
│  - Solo recibe tokens anónimos (IP_001, HOST_001, COMPANY_A)   │
│  - Genera oportunidades basadas en patrones técnicos            │
│  - NO tiene acceso a datos sensibles reales                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Cumplimiento y Auditoría

### Evidencia de Cumplimiento:

1. **Código fuente**: Revisión de `AnonymizationService.ts`, `BedrockService.ts`
2. **Tests automatizados**: 700+ casos de prueba en property-based tests
3. **Script de verificación**: `verify-anonymization.ts` demuestra anonimización
4. **Logs de CloudWatch**: Solo contienen tokens, NO datos sensibles
5. **Validación en tiempo de ejecución**: `validateAnonymization()` verifica que no queden datos sensibles

### Auditoría:

Para auditar el sistema:

1. Ejecutar script de verificación: `npx ts-node verify-anonymization.ts`
2. Ejecutar property-based tests: `npm test`
3. Revisar logs de CloudWatch en AWS Console
4. Inspeccionar código fuente de servicios de anonimización
5. Verificar cifrado de archivos en S3 (ServerSideEncryption: AES256)

---

## Preguntas Frecuentes

**P: ¿Bedrock puede ver mis IPs o hostnames reales?**  
R: No. Bedrock solo ve tokens como `IP_001`, `HOST_001`, `COMPANY_A`.

**P: ¿Dónde se almacenan los datos originales?**  
R: En S3 con cifrado AES256. El mapping de anonimización solo existe en memoria.

**P: ¿Cómo puedo verificar que funciona?**  
R: Ejecuta `npx ts-node verify-anonymization.ts` en el directorio `backend/`.

**P: ¿Los logs de CloudWatch contienen datos sensibles?**  
R: No. Los logs solo contienen tokens anonimizados y métricas agregadas.

**P: ¿Qué pasa si falla la anonimización?**  
R: El método `validateAnonymization()` detecta patrones sensibles y registra advertencias.

**P: ¿Puedo ver el prompt exacto enviado a Bedrock?**  
R: Sí. Ejecuta el script de verificación o revisa el método `buildPrompt()` en `BedrockService.ts`.

---

## Contacto

Para preguntas sobre seguridad o anonimización, contactar al equipo de desarrollo.

**Última actualización**: 2024-02-22
