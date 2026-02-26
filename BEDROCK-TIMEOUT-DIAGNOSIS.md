# Diagnóstico: Bedrock Timeout Persistente

## Problema
Bedrock agota el timeout en TODOS los intentos, incluso con 5 minutos configurados.

## Síntomas
```
Bedrock API call failed (attempt 1/3), retrying in 1000ms...
Bedrock API call failed (attempt 2/3), retrying in 2000ms...
Bedrock API call failed (attempt 3/3), retrying in 4000ms...
Error: Bedrock API call timed out
```

## Causas Posibles

### 1. Problema de Permisos AWS ⚠️ MÁS PROBABLE
**Síntoma**: Bedrock no responde porque no tiene permisos

**Verificar**:
```bash
# Ver credenciales AWS
aws sts get-caller-identity

# Ver permisos de Bedrock
aws bedrock list-foundation-models --region us-east-1
```

**Solución**: Agregar permisos de Bedrock al usuario/rol IAM:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/us.anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
```

---

### 2. Modelo No Disponible en la Región
**Síntoma**: El inference profile no está disponible

**Verificar**:
```bash
aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?contains(modelId, 'claude-3-5-sonnet')]"
```

**Solución**: Cambiar a modelo directo (sin inference profile):
```env
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

---

### 3. Prompt Demasiado Grande
**Síntoma**: Bedrock rechaza el request silenciosamente

**Datos actuales**:
- 76 servidores
- 723 bases de datos
- Cuestionario: 1.4MB
- Knowledge Base: ~3K tokens

**Solución**: Reducir tamaño del prompt

---

### 4. Problema de Red/Conectividad
**Síntoma**: No puede conectar con Bedrock API

**Verificar**:
```bash
# Test conectividad
curl https://bedrock-runtime.us-east-1.amazonaws.com

# Ver logs de red
```

**Solución**: Verificar firewall, proxy, VPN

---

### 5. Límites de Cuota AWS
**Síntoma**: Has excedido el límite de requests

**Verificar**: AWS Console → Service Quotas → Bedrock

**Solución**: Solicitar aumento de cuota

---

## Plan de Acción Inmediato

### Paso 1: Verificar Permisos AWS (5 minutos)

Ejecuta estos comandos:

```bash
# 1. Ver identidad actual
aws sts get-caller-identity

# 2. Listar modelos disponibles
aws bedrock list-foundation-models --region us-east-1

# 3. Test directo a Bedrock
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --region us-east-1 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
  output.json
```

**Si falla**: Problema de permisos → Agregar política IAM

---

### Paso 2: Cambiar a Modelo Directo (2 minutos)

Si el inference profile no funciona, usa el modelo directo:

```env
# backend/.env
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

Reinicia backend.

---

### Paso 3: Reducir Tamaño del Prompt (10 minutos)

Si el prompt es demasiado grande, reduce el Knowledge Base:

**Opción A**: Remover Knowledge Base temporalmente
```typescript
// backend/src/controllers/OpportunityController.ts
// Comentar estas líneas:
// const knowledgeBase = this.knowledgeBaseService.getMicrosoftCostOptimizationKnowledgeBase();
// anonymizedData.knowledgeBase = knowledgeBase;
```

**Opción B**: Reducir Knowledge Base a resumen
```typescript
// backend/src/services/KnowledgeBaseService.ts
// Usar solo el checklist, no todo el contenido
```

---

### Paso 4: Test con Dataset Pequeño (5 minutos)

Prueba con un dataset más pequeño:
- 10 servidores (en lugar de 76)
- 50 bases de datos (en lugar de 723)
- Sin cuestionario

Si funciona → El problema es el tamaño del prompt

---

### Paso 5: Habilitar Logs Detallados (2 minutos)

Agrega logs para ver qué está pasando:

```typescript
// backend/src/services/BedrockService.ts
console.log('[BEDROCK] Sending request...');
console.log('[BEDROCK] Model ID:', this.modelId);
console.log('[BEDROCK] Prompt size:', prompt.length, 'characters');
console.log('[BEDROCK] Timeout:', this.timeoutMs, 'ms');

try {
  const response = await this.client.send(command);
  console.log('[BEDROCK] Response received!');
} catch (error) {
  console.error('[BEDROCK] Error details:', error);
  throw error;
}
```

---

## Solución Rápida: Probar Sin Cuestionario y Knowledge Base

### Paso 1: Deshabilitar Cuestionario y Knowledge Base

```typescript
// backend/src/controllers/OpportunityController.ts

// Línea ~135: Comentar parseo de cuestionario
/*
if (questionnaireFile) {
  console.log('[ANALYZE] Parsing Questionnaire...');
  questionnaireData = await this.questionnaireParser.parseQuestionnaire(questionnaireFile.buffer);
  console.log(`[ANALYZE] Questionnaire parsed: ${questionnaireData.priorities?.length || 0} priorities identified`);
}
*/

// Línea ~165: Comentar knowledge base
/*
console.log('[ANALYZE] Loading knowledge base...');
const knowledgeBase = this.knowledgeBaseService.getMicrosoftCostOptimizationKnowledgeBase();
anonymizedData.knowledgeBase = knowledgeBase;
console.log(`[ANALYZE] Knowledge base loaded: ${knowledgeBase.title}`);
*/
```

### Paso 2: Reiniciar y Probar

Si funciona sin cuestionario y knowledge base:
→ El problema es el tamaño del prompt
→ Necesitamos optimizar el contenido

---

## Solución Alternativa: Procesamiento Asíncrono

Si Bedrock necesita más de 5 minutos, implementar:

### Arquitectura Asíncrona

```
1. Usuario envía análisis
   ↓
2. Backend crea job en DynamoDB
   ↓
3. Lambda procesa en background (15 min timeout)
   ↓
4. Guarda resultados en DynamoDB
   ↓
5. Frontend polling cada 10 segundos
   ↓
6. Muestra resultados cuando estén listos
```

**Ventajas**:
- Sin límite de timeout en frontend
- Usuario puede cerrar navegador
- Mejor UX con progress bar

**Desventajas**:
- Más complejo de implementar
- Requiere DynamoDB + Lambda

---

## Recomendación Inmediata

### Opción 1: Verificar Permisos (MÁS PROBABLE)

```bash
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --region us-east-1 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Test"}]}' \
  test-output.json

cat test-output.json
```

**Si funciona**: Permisos OK, problema es otro
**Si falla**: Agregar permisos IAM

---

### Opción 2: Probar Sin Knowledge Base (MÁS RÁPIDO)

Comentar estas líneas en `OpportunityController.ts`:

```typescript
// Línea ~165-168
/*
console.log('[ANALYZE] Loading knowledge base...');
const knowledgeBase = this.knowledgeBaseService.getMicrosoftCostOptimizationKnowledgeBase();
anonymizedData.knowledgeBase = knowledgeBase;
console.log(`[ANALYZE] Knowledge base loaded: ${knowledgeBase.title}`);
*/
```

Reiniciar backend y probar.

---

### Opción 3: Cambiar a Modelo Directo

```env
# backend/.env
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

Reiniciar backend y probar.

---

## Siguiente Paso

**¿Qué quieres hacer?**

A) Verificar permisos AWS (ejecutar comandos)
B) Probar sin Knowledge Base (comentar código)
C) Cambiar a modelo directo (cambiar .env)
D) Habilitar logs detallados (agregar console.log)
E) Probar con dataset pequeño

**Mi recomendación**: Empezar con **B** (probar sin Knowledge Base) porque es lo más rápido y nos dirá si el problema es el tamaño del prompt.

---

**Fecha**: 2026-02-22
**Estado**: ✅ SOLUCIONES APLICADAS - Ver BEDROCK-FIX-APPLIED.md
**Próximo paso**: Ejecutar test-bedrock-permissions.ps1 y probar análisis
