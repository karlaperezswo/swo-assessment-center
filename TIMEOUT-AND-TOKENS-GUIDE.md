# Guía: Timeout y Tokens en AWS Bedrock

## Resumen Ejecutivo

**Timeout y tokens son independientes**:
- **Timeout**: Cuánto tiempo esperamos la respuesta
- **Tokens**: Cuánto contenido procesamos (entrada + salida)

---

## Límites de AWS Bedrock (Claude 3.5 Sonnet)

### Límites de Tokens
| Concepto | Límite | Equivalente |
|----------|--------|-------------|
| Input tokens | 200,000 | ~150,000 palabras |
| Output tokens | 4,096 (configurable) | ~3,000 palabras |
| Context window | 200,000 | Total disponible |

### Límites de Timeout
| Servicio | Límite | Recomendación |
|----------|--------|---------------|
| Bedrock API directo | Sin límite oficial | < 5 minutos |
| Lambda | 15 minutos | < 5 minutos |
| API Gateway | 29 segundos | No usar para Bedrock |
| Nuestro código | Configurable | 3-5 minutos |

---

## Configuración Actual

### Backend (.env)
```env
BEDROCK_TIMEOUT_MS=180000  # 3 minutos
BEDROCK_MAX_RETRIES=3      # 3 intentos
```

### Tiempo Total Máximo
Con backoff exponencial:
- Intento 1: 3 minutos
- Espera: 1 segundo
- Intento 2: 3 minutos
- Espera: 2 segundos
- Intento 3: 3 minutos
- **Total**: ~9 minutos máximo

---

## Estimación de Tokens para Nuestro Caso

### Input Tokens (Prompt)
Componentes del prompt:

1. **ROL y contexto**: ~500 tokens
2. **Knowledge Base (Guía MACO)**: ~3,000 tokens
3. **Cuestionario**: ~1,000-2,000 tokens (depende del tamaño)
4. **MPA Summary**: ~500 tokens
   - 76 servidores → resumen estadístico
   - 723 bases de datos → resumen estadístico
5. **MRA Summary**: ~300 tokens
6. **Instrucciones**: ~1,000 tokens

**Total estimado**: ~6,000-7,500 tokens de entrada

### Output Tokens (Respuesta)
Configurado en el código:
```typescript
max_tokens: 4096  // ~3,000 palabras
```

Para 7-15 oportunidades con evidencia:
- **Estimado real**: 2,500-3,500 tokens
- **Máximo permitido**: 4,096 tokens

### Total de Tokens por Análisis
- **Input**: ~7,000 tokens
- **Output**: ~3,000 tokens
- **Total**: ~10,000 tokens

**Estamos MUY por debajo del límite de 200K tokens.**

---

## Relación entre Tokens y Tiempo de Respuesta

### Factores que Afectan el Tiempo:

1. **Número de tokens de salida** ⭐ (principal factor)
   - Más tokens = más tiempo
   - 4,096 tokens puede tomar 1-3 minutos

2. **Complejidad del análisis**
   - Análisis cruzado de múltiples fuentes
   - Generación de evidencia data-backed
   - Validación de consistencia

3. **Carga del servicio Bedrock**
   - Hora del día
   - Región (us-east-1)
   - Uso del inference profile

4. **Tamaño del prompt** (factor menor)
   - 7,000 tokens se procesan en segundos
   - No es el cuello de botella

### Tiempos Típicos por Tokens de Salida:

| Output Tokens | Tiempo Estimado | Nuestro Caso |
|---------------|-----------------|--------------|
| 500 tokens | 10-20 segundos | ❌ Muy poco |
| 1,000 tokens | 20-40 segundos | ❌ Insuficiente |
| 2,000 tokens | 40-80 segundos | ⚠️ Justo |
| 4,000 tokens | 80-180 segundos | ✅ Nuestro caso |
| 8,000 tokens | 160-360 segundos | ❌ Excesivo |

**Nuestro timeout de 3 minutos (180 segundos) es adecuado para 4,096 tokens.**

---

## Recomendaciones de Timeout según Dataset

### Dataset Pequeño (< 20 servidores, < 100 bases de datos)
```env
BEDROCK_TIMEOUT_MS=120000  # 2 minutos
```
- Prompt más pequeño
- Menos oportunidades
- Respuesta más rápida

### Dataset Mediano (20-100 servidores, 100-500 bases de datos)
```env
BEDROCK_TIMEOUT_MS=180000  # 3 minutos ✅ ACTUAL
```
- Nuestro caso actual
- Balance entre tiempo y confiabilidad

### Dataset Grande (> 100 servidores, > 500 bases de datos)
```env
BEDROCK_TIMEOUT_MS=240000  # 4 minutos
```
- Más contexto para analizar
- Más oportunidades potenciales
- Análisis más profundo

### Dataset Muy Grande (> 200 servidores, > 1000 bases de datos)
```env
BEDROCK_TIMEOUT_MS=300000  # 5 minutos
```
- Máximo recomendado
- Considerar dividir el análisis

---

## Cómo Ampliar el Timeout

### Opción 1: Modificar .env (Recomendado)
```env
# backend/.env
BEDROCK_TIMEOUT_MS=240000  # 4 minutos
```

Luego reiniciar backend:
```bash
cd backend
npm run dev
```

### Opción 2: Variable de Entorno
```bash
# Windows PowerShell
$env:BEDROCK_TIMEOUT_MS="240000"
npm run dev

# Linux/Mac
export BEDROCK_TIMEOUT_MS=240000
npm run dev
```

### Opción 3: Modificar Código Directamente
```typescript
// backend/src/services/BedrockService.ts
this.timeoutMs = parseInt(process.env.BEDROCK_TIMEOUT_MS || '240000', 10);
```

---

## Límites Prácticos

### Timeout Máximo Recomendado: 5 minutos (300,000ms)

**Razones**:
1. **Experiencia de usuario**: > 5 minutos es demasiado tiempo de espera
2. **Riesgo de errores**: Más tiempo = más probabilidad de fallos de red
3. **Costos**: Más tiempo = más recursos consumidos
4. **Lambda limits**: Si despliegas en Lambda, límite de 15 minutos

### Si Necesitas Más de 5 Minutos:

**Opción A: Reducir Output Tokens**
```typescript
// backend/src/services/BedrockService.ts
max_tokens: 2048  // En lugar de 4096
```
- Genera menos oportunidades (5-8 en lugar de 7-15)
- Respuesta más rápida

**Opción B: Dividir el Análisis**
- Análisis 1: Well-Architected opportunities
- Análisis 2: Workshop opportunities
- Combinar resultados

**Opción C: Procesamiento Asíncrono**
- Enviar análisis a cola (SQS)
- Procesar en background
- Notificar cuando termine (email/webhook)

---

## Monitoreo de Tokens

### Ver Tokens Consumidos en Logs

El código ya registra el uso:
```typescript
console.log(`[ANALYZE] Bedrock response: ${bedrockResponse.usage.inputTokens} input tokens, ${bedrockResponse.usage.outputTokens} output tokens`);
```

### Ejemplo de Log:
```
[ANALYZE] Bedrock response: 7234 input tokens, 3456 output tokens
```

### Calcular Costos

Claude 3.5 Sonnet pricing (us-east-1):
- **Input**: $3.00 por 1M tokens
- **Output**: $15.00 por 1M tokens

**Nuestro caso** (7,000 input + 3,000 output):
- Input: 7,000 × $3.00 / 1,000,000 = $0.021
- Output: 3,000 × $15.00 / 1,000,000 = $0.045
- **Total por análisis**: ~$0.066 (6.6 centavos)

---

## Configuración Recomendada por Escenario

### Desarrollo/Testing
```env
BEDROCK_TIMEOUT_MS=120000  # 2 minutos
BEDROCK_MAX_RETRIES=2      # 2 intentos
```
- Fallos rápidos
- Iteración rápida

### Producción (Dataset Normal)
```env
BEDROCK_TIMEOUT_MS=180000  # 3 minutos ✅ ACTUAL
BEDROCK_MAX_RETRIES=3      # 3 intentos
```
- Balance entre confiabilidad y tiempo
- Recomendado para la mayoría de casos

### Producción (Dataset Grande)
```env
BEDROCK_TIMEOUT_MS=240000  # 4 minutos
BEDROCK_MAX_RETRIES=3      # 3 intentos
```
- Más tiempo para análisis complejos
- Mejor para clientes enterprise

### Producción (Máxima Confiabilidad)
```env
BEDROCK_TIMEOUT_MS=300000  # 5 minutos
BEDROCK_MAX_RETRIES=4      # 4 intentos
```
- Máximo tiempo de espera
- Para casos críticos

---

## Troubleshooting

### Problema: Timeout frecuente
**Soluciones**:
1. Aumentar `BEDROCK_TIMEOUT_MS` a 240000 (4 min)
2. Reducir `max_tokens` a 2048
3. Verificar conectividad a AWS
4. Cambiar región si hay problemas

### Problema: Respuesta muy lenta
**Causas posibles**:
1. Dataset muy grande (> 1000 bases de datos)
2. Hora pico en AWS
3. Región con alta latencia
4. Prompt muy complejo

**Soluciones**:
1. Usar inference profile (ya configurado)
2. Optimizar prompt (ya optimizado)
3. Dividir análisis en partes
4. Considerar procesamiento asíncrono

### Problema: Tokens insuficientes
**Síntomas**:
- Respuesta cortada
- JSON incompleto
- Menos oportunidades de las esperadas

**Solución**:
```typescript
// Aumentar max_tokens
max_tokens: 8192  // En lugar de 4096
```

**Nota**: Esto aumentará el tiempo de respuesta proporcionalmente.

---

## Resumen de Respuestas a tu Pregunta

### ¿Hasta cuánto podemos ampliar el timeout?
**Respuesta**: Hasta 5 minutos (300,000ms) es práctico y seguro.

**Límites**:
- Técnico: Sin límite oficial en Bedrock
- Práctico: 5 minutos máximo recomendado
- Lambda: 15 minutos si despliegas en Lambda
- UX: > 5 minutos es mala experiencia de usuario

### ¿Afecta el timeout al número de tokens?
**Respuesta**: NO, son completamente independientes.

**Explicación**:
- **Timeout**: Cuánto tiempo esperamos
- **Tokens**: Cuánto contenido procesamos
- Aumentar timeout NO aumenta tokens
- Aumentar tokens SÍ aumenta tiempo necesario

### Configuración Óptima para tu Caso
```env
# Para 76 servidores + 723 bases de datos
BEDROCK_TIMEOUT_MS=180000  # 3 minutos ✅ ACTUAL
BEDROCK_MAX_RETRIES=3

# Si sigues teniendo timeouts:
BEDROCK_TIMEOUT_MS=240000  # 4 minutos
```

---

**Fecha**: 2026-02-22  
**Configuración Actual**: 3 minutos (180 segundos)  
**Tokens Estimados**: ~10,000 (7K input + 3K output)  
**Costo por Análisis**: ~$0.066 (6.6 centavos)
