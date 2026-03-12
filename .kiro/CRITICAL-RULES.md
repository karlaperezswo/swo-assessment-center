# 🚨 REGLAS CRÍTICAS Y OBLIGATORIAS DEL PROYECTO

## 🔒 REGLA OPERATIVA OBLIGATORIA PARA CUALQUIER CAMBIO

**A PARTIR DE ESTE MOMENTO, PARA CUALQUIER CAMBIO SOLICITADO:**

### ANTES DE EJECUTAR CUALQUIER ACCIÓN:

1. ✅ **Lista detalladamente** las tareas que realizarás
2. ✅ **Explica** qué entendiste que debes cambiar, ajustar o crear
3. ✅ **Especifica claramente**:
   - Si crearás un recurso nuevo (y cuál exactamente)
   - Si modificarás un recurso existente (y cuál exactamente)
   - Si agregarás una ruta nueva
   - Si agregarás un prefijo nuevo en S3
   - Si crearás una Lambda nueva
   - Si modificarás una Lambda existente
   - Si crearás un archivo .md temporal o un script temporal → agrégalos automáticamente al .gitignore
4. ✅ **Justifica** por qué esa acción es necesaria
5. ✅ **Confirma explícitamente** que no estás creando recursos innecesarios
6. ⏸️ **Espera aprobación explícita** antes de ejecutar cualquier implementación

### ⚠️ NO EJECUTAR NADA SIN APROBACIÓN

Si la acción requiere modificar algún recurso existente del sistema actual:
- Marcar con ⚠️
- Explicar el impacto potencial
- Esperar validación explícita

---

## ⚠️ MÓDULO SELECTOR - CÓDIGO ESTABLE Y PROTEGIDO

**FECHA DE ESTABILIZACIÓN**: 12 de Marzo 2026  
**VERSIÓN ESTABLE**: main @ commit 3c83588  
**TAG**: v1.0.0-selector-stable

### 🔒 ARCHIVOS PROTEGIDOS - NO MODIFICAR

Los siguientes archivos están en **PRODUCCIÓN ESTABLE** y **NO DEBEN SER MODIFICADOS** bajo ninguna circunstancia sin aprobación explícita:

#### Backend - Selector Module
```
backend/src/controllers/selector/
├── SelectorController.ts          ❌ NO MODIFICAR
backend/src/services/selector/
├── SelectorCalculationService.ts  ❌ NO MODIFICAR
├── SelectorConfigService.ts       ❌ NO MODIFICAR
├── SelectorExportService.ts       ❌ NO MODIFICAR
├── SelectorSessionService.ts      ❌ NO MODIFICAR
backend/src/config/selector/
├── matrix.json                    ❌ NO MODIFICAR
├── questions.json                 ❌ NO MODIFICAR
backend/src/types/
├── selector.ts                    ❌ NO MODIFICAR
backend/src/routes/
├── selectorRoutes.ts              ❌ NO MODIFICAR
```

#### Frontend - Selector Module
```
frontend/src/components/phases/
├── SelectorPhase.tsx              ❌ NO MODIFICAR
```

#### Data Storage
```
backend/data/selector/             ❌ NO MODIFICAR
└── sessions/                      ❌ NO MODIFICAR (contiene datos de clientes)
```

### 📦 DEPENDENCIAS PROTEGIDAS

Las siguientes dependencias son **CRÍTICAS** para el módulo Selector y **NO DEBEN SER ACTUALIZADAS** sin testing exhaustivo:

#### Backend Dependencies
```json
{
  "pdfkit": "^0.15.0",           ❌ NO ACTUALIZAR (usado en PDF export)
  "express": "^4.18.2",          ⚠️  CUIDADO al actualizar
  "serverless-http": "^3.2.0"    ⚠️  CUIDADO al actualizar
}
```

#### Frontend Dependencies
```json
{
  "recharts": "^2.x.x"           ⚠️  CUIDADO al actualizar (radar charts)
}
```

### 🛡️ REGLAS OBLIGATORIAS

#### 1. **PROHIBIDO MODIFICAR**
- ❌ NO cambiar la lógica de cálculo de scores
- ❌ NO modificar el formato de export PDF/CSV
- ❌ NO alterar la estructura de datos de sesiones
- ❌ NO cambiar los endpoints de la API
- ❌ NO modificar la configuración de questions.json o matrix.json
- ❌ NO tocar el manejo de Base64 en PDF export (funciona en producción)

#### 2. **PROHIBIDO ELIMINAR**
- ❌ NO borrar archivos del módulo Selector
- ❌ NO eliminar endpoints de Selector
- ❌ NO remover dependencias usadas por Selector
- ❌ NO borrar datos de sesiones guardadas

#### 3. **PROHIBIDO REFACTORIZAR**
- ❌ NO renombrar archivos del módulo Selector
- ❌ NO mover archivos a otras carpetas
- ❌ NO cambiar nombres de funciones públicas
- ❌ NO modificar interfaces/types de Selector

#### 4. **SI NECESITAS HACER CAMBIOS**
Si absolutamente necesitas modificar algo del módulo Selector:

1. ✅ Crear una rama específica: `fix-selector-[descripcion]`
2. ✅ Documentar EXACTAMENTE qué cambiarás y por qué
3. ✅ Hacer backup de los archivos originales
4. ✅ Testing exhaustivo en local
5. ✅ Testing en producción con datos de prueba
6. ✅ Obtener aprobación explícita antes de merge
7. ✅ Crear tag de versión antes del cambio

### 🎯 FUNCIONALIDAD ESTABLE

El módulo Selector actualmente incluye:

✅ **Cuestionario de 28 preguntas** - Funcionando correctamente  
✅ **Cálculo de scores** - Algoritmo validado y estable  
✅ **Recomendación de herramienta** - Lógica probada  
✅ **Export PDF** - Funciona en producción con Base64 en JSON  
✅ **Export CSV** - Funciona correctamente  
✅ **Visualización con Radar Chart** - Renderiza correctamente  
✅ **Factores decisivos** - Muestra top 5 preguntas con mayor impacto  
✅ **Persistencia de sesiones** - Guarda datos en filesystem  

### 📊 ENDPOINTS PROTEGIDOS

```
GET  /api/selector/questions                          ❌ NO MODIFICAR
POST /api/selector/session                            ❌ NO MODIFICAR
POST /api/selector/session/:sessionId/calculate       ❌ NO MODIFICAR
POST /api/selector/export/pdf                         ❌ NO MODIFICAR
POST /api/selector/export/csv                         ❌ NO MODIFICAR
```

### 🔧 CONFIGURACIÓN PROTEGIDA

#### Lambda Configuration
```
Function: assessment-center-api
Handler: dist/backend/src/lambda.handler
Runtime: nodejs20.x
Memory: 2048 MB
Timeout: 600s
Environment Variables:
  - BEDROCK_TIMEOUT_MS: 300000                        ❌ NO MODIFICAR
  - S3_BUCKET_NAME: assessment-center-files-...      ❌ NO MODIFICAR
```

#### API Gateway Configuration
```
API ID: 6tk4qqlhs6
Stage: prod
Binary Media Types: (none - intencional)              ❌ NO MODIFICAR
CORS: Habilitado para todos los orígenes              ⚠️  CUIDADO
```

### 📝 NOTAS IMPORTANTES

1. **PDF Export usa JSON con Base64**: Esta es la solución estable que funciona sin modificar API Gateway. NO cambiar a respuesta binaria.

2. **serverless-http maneja binarios automáticamente**: El código en `lambda.ts` detecta si serverless-http ya convirtió a Base64. NO modificar esta lógica.

3. **Frontend decodifica Base64 manualmente**: El código en `SelectorPhase.tsx` usa `atob()` para decodificar. NO cambiar a `response.blob()`.

4. **Datos de sesiones son críticos**: Los archivos JSON en `backend/data/selector/sessions/` contienen datos de clientes reales. NO borrar ni modificar.

### 🚀 PARA NUEVOS FEATURES

Si necesitas agregar funcionalidad nueva:

✅ **PERMITIDO**:
- Crear NUEVOS módulos en carpetas separadas
- Agregar NUEVOS endpoints que NO interfieran con Selector
- Agregar NUEVAS dependencias que NO conflictúen con las existentes
- Crear NUEVOS componentes de frontend en carpetas separadas

❌ **PROHIBIDO**:
- Modificar código existente del módulo Selector
- Compartir servicios o utilidades con Selector (crear copias si es necesario)
- Actualizar dependencias compartidas sin verificar impacto en Selector

### 📞 CONTACTO

Si tienes dudas sobre si un cambio afecta al módulo Selector:
- **PREGUNTA PRIMERO** antes de hacer cualquier cambio
- **DOCUMENTA** el impacto potencial
- **PRUEBA** exhaustivamente en local antes de desplegar

---

## 🚨 PROBLEMA CONOCIDO: API Gateway Timeout

### Situación Actual

**LÍMITE FUNDAMENTAL DE AWS API GATEWAY**: 30 segundos máximo (NO SE PUEDE CAMBIAR)

```
✅ Lambda timeout: 600 segundos (10 minutos)
✅ Bedrock timeout: 300 segundos (5 minutos)
❌ API Gateway timeout: 30 segundos (LÍMITE FIJO DE AWS)
```

### El Problema

Cuando Bedrock tarda más de 30 segundos en responder:
1. Lambda sigue procesando (tiene 10 minutos)
2. Bedrock sigue trabajando (tiene 5 minutos)
3. **API Gateway corta la conexión a los 30 segundos** → 504 Gateway Timeout
4. Frontend recibe error aunque Lambda termine exitosamente

### Endpoints Afectados

```
POST /api/opportunities/analyze    ⚠️  Puede tardar >30s con Bedrock
```

### ❌ Soluciones NO Viables

1. **Aumentar timeout de API Gateway** → Imposible, límite fijo de AWS
2. **Usar Lambda Function URL** → Requiere cambiar toda la arquitectura
3. **Optimizar Bedrock** → Ya está optimizado, el análisis es complejo

### ✅ Solución Recomendada: Procesamiento Asíncrono

**Flujo propuesto**:

```
1. Frontend → POST /api/opportunities/analyze
   ↓
2. Lambda responde inmediatamente: 202 Accepted + jobId
   ↓
3. Lambda procesa en background (sin límite de tiempo)
   ↓
4. Frontend hace polling: GET /api/opportunities/status/{jobId}
   ↓
5. Cuando termina: GET /api/opportunities/result/{jobId}
```

**Ventajas**:
- ✅ Sin límites de tiempo
- ✅ Mejor UX (puede mostrar progreso)
- ✅ Más robusto
- ✅ Permite retry automático
- ✅ Usuario puede cerrar ventana y volver después

**Desventajas**:
- ⚠️ Requiere cambios en frontend y backend
- ⚠️ Necesita almacenamiento para jobs (S3 o DynamoDB)
- ⚠️ Más complejo de implementar

### 📋 Implementación Futura (NO IMPLEMENTAR SIN APROBACIÓN)

Si se decide implementar procesamiento asíncrono:

**Backend - Nuevos endpoints**:
```
POST   /api/opportunities/analyze        → Retorna 202 + jobId
GET    /api/opportunities/status/:jobId  → Retorna estado (pending/processing/completed/failed)
GET    /api/opportunities/result/:jobId  → Retorna resultado cuando completed
DELETE /api/opportunities/job/:jobId     → Limpia job completado
```

**Backend - Almacenamiento de jobs**:
```
Opción 1: S3
  - Crear prefijo: s3://bucket/jobs/{jobId}/
  - Guardar: status.json, input.json, result.json

Opción 2: DynamoDB
  - Tabla: opportunity-jobs
  - PK: jobId
  - Atributos: status, createdAt, input, result, error
```

**Frontend - Cambios**:
```typescript
// 1. Iniciar análisis
const { jobId } = await api.post('/api/opportunities/analyze', data);

// 2. Polling cada 5 segundos
const interval = setInterval(async () => {
  const { status } = await api.get(`/api/opportunities/status/${jobId}`);
  
  if (status === 'completed') {
    const result = await api.get(`/api/opportunities/result/${jobId}`);
    // Mostrar resultado
    clearInterval(interval);
  } else if (status === 'failed') {
    // Mostrar error
    clearInterval(interval);
  }
}, 5000);
```

### ⚠️ IMPORTANTE

**NO IMPLEMENTAR** esta solución sin:
1. Aprobación explícita
2. Diseño detallado
3. Plan de testing
4. Plan de rollback
5. Documentación completa

Por ahora, el endpoint `/api/opportunities/analyze` tiene el límite de 30 segundos y puede fallar con timeout si Bedrock tarda mucho.

---

## 🎯 RESUMEN EJECUTIVO

**EL MÓDULO SELECTOR ESTÁ EN PRODUCCIÓN Y FUNCIONA CORRECTAMENTE.**  
**NO TOCAR A MENOS QUE SEA ABSOLUTAMENTE NECESARIO.**  
**CUALQUIER CAMBIO REQUIERE APROBACIÓN EXPLÍCITA.**

**PARA CUALQUIER CAMBIO: SEGUIR LA REGLA OPERATIVA OBLIGATORIA AL INICIO DE ESTE DOCUMENTO.**

---

*Última actualización: 12 de Marzo 2026*  
*Versión estable: main @ 3c83588*  
*Tag: v1.0.0-selector-stable*
