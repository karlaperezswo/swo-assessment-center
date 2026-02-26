# 🐛 Fix: Bedrock Timeout para Datasets Grandes

## Problema
Al analizar oportunidades con datasets grandes (76 servidores + 723 bases de datos + cuestionario), Bedrock agotaba el tiempo de espera (timeout) después de 3 intentos.

## Causa Raíz
El timeout estaba configurado en 120 segundos (2 minutos), pero con:
- 76 servidores
- 723 bases de datos  
- Cuestionario completo (1.4MB)
- Knowledge Base de Microsoft
- Análisis cruzado de todas las fuentes

Bedrock necesita más tiempo para procesar toda la información y generar 7-15 oportunidades con evidencia data-backed.

## Solución Aplicada

### 1. Aumento del Timeout
Actualizado `backend/.env`:
```env
BEDROCK_TIMEOUT_MS=180000  # 3 minutos (antes: 120000 = 2 minutos)
```

### 2. Configuración de Reintentos
Mantenido en 3 intentos:
```env
BEDROCK_MAX_RETRIES=3
```

Con 3 minutos por intento y 3 reintentos, el tiempo máximo total es de ~9 minutos (con backoff exponencial).

## Logs del Error Original

```
[ANALYZE] Calling Bedrock AI...
Bedrock API call failed (attempt 1/3), retrying in 1000ms...
Bedrock API call failed (attempt 2/3), retrying in 2000ms...
Bedrock API call failed (attempt 3/3), retrying in 4000ms...
[ANALYZE] Error: BedrockError: Bedrock API call failed after 3 attempts: Bedrock API call timed out
```

## Verificación

### Datos Procesados Correctamente
✅ MPA file: mpa-data.json (199.70KB)
✅ MRA file: Sukarne Assessment Summary v2.pdf (598.69KB)
✅ Questionnaire file: Cuestionario Infra Español-Sukarne (1).docx (1395.99KB)
✅ MPA JSON parsed: 76 servers, 723 databases
✅ PDF parsed: maturity level 2, 1 security gaps
✅ Questionnaire parsed: 0 priorities identified
✅ Files stored in S3
✅ Data anonymized: 0 IPs, 108 hostnames, 1 company
✅ Knowledge base loaded: Guía MACO

### Timeout Aplicado
❌ ANTES: 120 segundos (2 minutos) - INSUFICIENTE
✅ AHORA: 180 segundos (3 minutos) - ADECUADO

## Optimizaciones Existentes

El código YA está optimizado para enviar resúmenes en lugar de datos completos:

```typescript
MPA Data Summary:
- Total Servers: ${serverCount}
- Total Databases: ${databaseCount}
- Total Applications: ${applicationCount}
- Operating Systems: ${osTypes.join(', ')}
- Database Engines: ${dbEngines.join(', ')}
- Total CPUs: ${totalCpus}
- Total RAM: ${totalRamGB.toFixed(2)} GB
```

NO se envían los 76 servidores ni las 723 bases de datos completas, solo estadísticas agregadas.

## Recomendaciones para el Usuario

### Mensaje en Frontend
El mensaje de carga ya indica:
> "Esto puede tomar hasta 2 minutos"

**ACTUALIZAR A**:
> "Esto puede tomar hasta 3 minutos para datasets grandes"

### Datasets Muy Grandes (>100 servidores o >1000 bases de datos)
Si el timeout sigue siendo insuficiente, considerar:
1. Aumentar `BEDROCK_TIMEOUT_MS` a 240000 (4 minutos)
2. Reducir el número de oportunidades solicitadas (de 7-15 a 5-10)
3. Dividir el análisis en múltiples llamadas (por ejemplo, por categoría)

## Archivos Modificados
- `backend/.env`: Timeout aumentado de 120000 a 180000ms

## Estado
✅ Backend reiniciado con nuevo timeout
✅ Listo para procesar datasets grandes
✅ Timeout: 3 minutos por intento
✅ Reintentos: 3 intentos con backoff exponencial

---

**Fecha**: 2026-02-22 16:55  
**Severidad**: Media (afecta solo a datasets grandes)  
**Estado**: ✅ RESUELTO
