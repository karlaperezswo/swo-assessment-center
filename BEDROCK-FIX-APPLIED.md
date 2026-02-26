# Solución Aplicada: Timeout de Bedrock

## Fecha: 2026-02-22

## Problema
Bedrock agotaba el timeout en TODOS los intentos (3 reintentos), incluso con 5 minutos configurados.

```
Bedrock API call failed (attempt 1/3), retrying in 1000ms...
Bedrock API call failed (attempt 2/3), retrying in 2000ms...
Bedrock API call failed (attempt 3/3), retrying in 4000ms...
Error: Bedrock API call timed out
```

---

## Soluciones Aplicadas

### 1. ✅ Logs Detallados Agregados

**Archivo**: `backend/src/services/BedrockService.ts`

**Cambios**:
- Agregados logs antes de enviar request
- Logs de tiempo de respuesta
- Logs detallados de errores (name, code, message, full error)
- Logs de tokens (input/output)

**Beneficio**: Ahora podemos ver EXACTAMENTE qué error está ocurriendo en Bedrock.

---

### 2. ✅ Cambio a Modelo Directo

**Archivo**: `backend/.env`

**Antes**:
```env
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

**Después**:
```env
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

**Razón**: El inference profile (`us.anthropic...`) puede no estar disponible en tu región o cuenta. El modelo directo (`anthropic...`) es más confiable.

**Beneficio**: Evita problemas de disponibilidad del inference profile.

---

### 3. ✅ Script de Diagnóstico Creado

**Archivo**: `backend/test-bedrock-permissions.ps1`

**Qué hace**:
1. Verifica identidad AWS (`aws sts get-caller-identity`)
2. Lista modelos Claude disponibles
3. Prueba modelo directo
4. Prueba inference profile
5. Genera reporte de diagnóstico

**Cómo ejecutar**:
```powershell
cd backend
.\test-bedrock-permissions.ps1
```

**Beneficio**: Identifica si el problema es de permisos, disponibilidad de modelo, o configuración.

---

### 4. ✅ Backend Reiniciado

**Estado**: Backend corriendo en puerto 4000 con nuevo modelo

**Logs actuales**:
```
[BEDROCK] Initialized with model: anthropic.claude-3-5-sonnet-20241022-v2:0
Server running on http://localhost:4000
```

---

## Próximos Pasos

### Paso 1: Ejecutar Script de Diagnóstico (RECOMENDADO)

```powershell
cd backend
.\test-bedrock-permissions.ps1
```

**Esto te dirá**:
- ✅ Si tus credenciales AWS funcionan
- ✅ Si tienes permisos de Bedrock
- ✅ Si el modelo directo funciona
- ✅ Si el inference profile funciona

**Tiempo estimado**: 1-2 minutos

---

### Paso 2: Probar Análisis con Nuevo Modelo

1. Abre el frontend (puerto 3005)
2. Sube archivos MPA + MRA (sin cuestionario por ahora)
3. Observa los logs del backend

**Qué buscar en los logs**:
```
[BEDROCK] Preparing request...
[BEDROCK] Model ID: anthropic.claude-3-5-sonnet-20241022-v2:0
[BEDROCK] Prompt size: XXXXX characters
[BEDROCK] Timeout: 300000 ms
[BEDROCK] Region: us-east-1
[BEDROCK] Sending request to Bedrock...
[BEDROCK] Response received in XXXXms  <-- ESTO ES LO QUE QUEREMOS VER
```

**Si ves el error**:
```
[BEDROCK] Error after XXXXms: ...
[BEDROCK] Error name: ...
[BEDROCK] Error code: ...
[BEDROCK] Error message: ...
```

**Copia el error completo** y lo analizamos.

---

### Paso 3: Si Sigue Fallando

#### Opción A: Problema de Permisos

Si el script de diagnóstico falla en test 2 o 3, necesitas agregar permisos IAM:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    }
  ]
}
```

**Cómo agregar**:
1. AWS Console → IAM → Users → [Tu usuario]
2. Add permissions → Attach policies directly
3. Create policy → JSON → Pegar el JSON de arriba
4. Guardar como "BedrockAccess"

---

#### Opción B: Prompt Demasiado Grande

Si el modelo funciona en el script pero falla en el análisis, el problema es el tamaño del prompt.

**Solución temporal**: Deshabilitar Knowledge Base

```typescript
// backend/src/controllers/OpportunityController.ts
// Línea ~165-170: Ya está comentado

// MANTENER COMENTADO:
/*
console.log('[ANALYZE] Loading knowledge base...');
const knowledgeBase = this.knowledgeBaseService.getMicrosoftCostOptimizationKnowledgeBase();
anonymizedData.knowledgeBase = knowledgeBase;
console.log(`[ANALYZE] Knowledge base loaded: ${knowledgeBase.title}`);
*/
```

**Beneficio**: Reduce el prompt en ~3K tokens

---

#### Opción C: Dataset Demasiado Grande

Si tienes 76 servidores + 723 bases de datos, el prompt puede ser muy grande.

**Solución**: Probar con dataset más pequeño
- 10 servidores
- 50 bases de datos
- Sin cuestionario

Si funciona con dataset pequeño → El problema es el tamaño del prompt

---

## Información Técnica

### Modelo Actual
- **ID**: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Región**: us-east-1
- **Timeout**: 300,000ms (5 minutos)
- **Max retries**: 3
- **Backoff**: Exponencial (1s, 2s, 4s)

### Costos
- **Input**: ~$3.00 USD / 1M tokens
- **Output**: ~$15.00 USD / 1M tokens
- **Estimado por análisis**: $0.066 USD (~$1.12 MXN)

### Límites
- **Max tokens input**: ~200K tokens
- **Max tokens output**: 4,096 tokens
- **Timeout máximo**: Sin límite técnico, pero 5 minutos es razonable

---

## Checklist de Diagnóstico

Ejecuta estos pasos en orden:

- [ ] 1. Ejecutar `test-bedrock-permissions.ps1`
  - [ ] Test 1 (identidad) pasa
  - [ ] Test 2 (listar modelos) pasa
  - [ ] Test 3 (modelo directo) pasa
  - [ ] Test 4 (inference profile) pasa o falla (no crítico)

- [ ] 2. Probar análisis con MPA + MRA (sin cuestionario)
  - [ ] Backend muestra logs detallados
  - [ ] Ver tiempo de respuesta
  - [ ] Ver error específico si falla

- [ ] 3. Si falla, identificar causa:
  - [ ] Permisos AWS (test 2 o 3 falló)
  - [ ] Prompt muy grande (test 3 pasó, análisis falló)
  - [ ] Dataset muy grande (probar con dataset pequeño)

- [ ] 4. Aplicar solución correspondiente

---

## Comandos Útiles

### Ver logs del backend en tiempo real
```powershell
# En otra terminal
cd backend
npm run dev
```

### Verificar credenciales AWS
```powershell
aws sts get-caller-identity
```

### Test rápido de Bedrock
```powershell
cd backend
.\test-bedrock-permissions.ps1
```

### Reiniciar backend
```powershell
# Ctrl+C en la terminal del backend
npm run dev
```

---

## Estado Actual

✅ **Backend corriendo**: Puerto 4000
✅ **Modelo cambiado**: anthropic.claude-3-5-sonnet-20241022-v2:0
✅ **Logs detallados**: Habilitados
✅ **Script de diagnóstico**: Creado
⏳ **Pendiente**: Ejecutar diagnóstico y probar análisis

---

## Contacto

Si después de ejecutar el script de diagnóstico y probar el análisis sigues teniendo problemas:

1. **Copia los logs completos** del backend (desde `[BEDROCK] Preparing request...` hasta el error)
2. **Copia el resultado** del script de diagnóstico
3. **Comparte** ambos para análisis detallado

---

**Última actualización**: 2026-02-22 (después de aplicar soluciones)
**Estado**: Esperando prueba del usuario
