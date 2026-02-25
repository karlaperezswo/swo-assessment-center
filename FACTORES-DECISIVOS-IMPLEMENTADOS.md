# ✅ Factores Decisivos Implementados

## Funcionalidad

El módulo Selector ahora muestra los **Factores Decisivos** en la pantalla de resultados, explicando al usuario por qué se hizo esa recomendación específica.

## ¿Qué son los Factores Decisivos?

Son las **5 preguntas que más influyeron** en la recomendación de la herramienta. En lugar de solo decir "Te recomendamos Migration Evaluator", el sistema explica:

- Qué preguntas fueron más importantes
- Qué respondió el usuario
- Cuántos puntos aportó cada respuesta

## Ejemplo Visual

```
💡 ¿Por qué esta recomendación?

Estas preguntas tuvieron mayor impacto en la recomendación de Migration Evaluator:

┌─────────────────────────────────────────────────┐
│ #1  ¿Tiene acceso a AWS?                        │
│     Tu respuesta: Sí                            │
│     Impacto: +12.5 pts                          │
├─────────────────────────────────────────────────┤
│ #2  ¿Cuántos servidores tiene?                  │
│     Tu respuesta: Más de 1000                   │
│     Impacto: +8.3 pts                           │
├─────────────────────────────────────────────────┤
│ #3  ¿Necesita análisis de costos?               │
│     Tu respuesta: Sí                            │
│     Impacto: +7.1 pts                           │
├─────────────────────────────────────────────────┤
│ #4  ¿Tiene inventario actualizado?              │
│     Tu respuesta: No                            │
│     Impacto: +5.8 pts                           │
├─────────────────────────────────────────────────┤
│ #5  ¿Requiere análisis de dependencias?         │
│     Tu respuesta: Sí                            │
│     Impacto: +4.2 pts                           │
└─────────────────────────────────────────────────┘
```

## Características

### 1. Ubicación
- **Dónde**: Entre el gráfico radar y la tabla de scores
- **Cuándo**: Solo si hay factores decisivos calculados
- **Orden**: Después de la recomendación y el radar, antes de la tabla

### 2. Diseño Visual

**Header:**
- Icono: 💡 Lightbulb (bombilla) en color ámbar
- Título: "¿Por qué esta recomendación?"
- Color: Ámbar (#f59e0b) para destacar

**Contenedor:**
- Fondo: Ámbar claro (#fef3c7)
- Borde: Ámbar (#fbbf24)
- Bordes redondeados

**Texto explicativo:**
- "Estas preguntas tuvieron mayor impacto en la recomendación de [Herramienta]"
- Color: Ámbar oscuro (#78350f)

**Cards de factores:**
- Fondo blanco sobre el contenedor ámbar
- Badge con número (#1, #2, #3, etc.)
- Pregunta en negrita
- Respuesta del usuario destacada
- Impacto en puntos con color ámbar

### 3. Información Mostrada

Para cada factor (top 5):
1. **Número de ranking**: Badge #1, #2, #3, etc.
2. **Texto de la pregunta**: Pregunta completa del cuestionario
3. **Respuesta del usuario**: Lo que respondió (Sí/No o opción múltiple)
4. **Impacto en puntos**: Cuántos puntos aportó a la herramienta recomendada

### 4. Cálculo (Backend)

El backend ya calcula esto en `SelectorCalculationService.findDecisiveFactors()`:

```typescript
// Encuentra las preguntas que más diferencia hicieron
// entre la herramienta #1 y la herramienta #2
const decisiveFactors = findDecisiveFactors(session, matrix);

// Retorna array ordenado por impacto descendente:
[
  {
    questionId: "q1",
    questionText: "¿Tiene acceso a AWS?",
    answer: "Sí",
    impact: 12.5  // Diferencia de puntos entre tool #1 y #2
  },
  ...
]
```

## Beneficios

✅ **Transparencia** - El usuario entiende por qué se hizo esa recomendación

✅ **Confianza** - Puede verificar que las respuestas clave fueron correctas

✅ **Justificación** - Puede explicar a stakeholders por qué eligió esa herramienta

✅ **Validación** - Si no está de acuerdo, puede revisar esas respuestas específicas

✅ **Educación** - Aprende qué factores son más importantes para cada herramienta

## Casos de Uso

### Caso 1: Presentación a Stakeholders
```
"Recomendamos Migration Evaluator porque:
- Tienen acceso a AWS (+12.5 pts)
- Tienen más de 1000 servidores (+8.3 pts)
- Necesitan análisis de costos (+7.1 pts)"
```

### Caso 2: Validación de Respuestas
```
Usuario ve que "¿Tiene inventario actualizado? No" tuvo +5.8 pts
Usuario piensa: "Espera, sí tenemos inventario"
Usuario puede volver y corregir esa respuesta
```

### Caso 3: Comparación de Herramientas
```
Usuario ve que las 5 preguntas clave favorecieron Migration Evaluator
Usuario entiende que si cambia esas respuestas, podría cambiar la recomendación
```

## Ubicación en la UI

```
┌─────────────────────────────────────┐
│ Resultado del Assessment            │
├─────────────────────────────────────┤
│                                     │
│  Herramienta Recomendada            │
│  ┌─────────────────────────────┐   │
│  │   Migration Evaluator       │   │
│  └─────────────────────────────┘   │
│                                     │
│  Comparación Visual (Radar Chart)   │
│  ┌─────────────────────────────┐   │
│  │      [RADAR CHART]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  💡 ¿Por qué esta recomendación?    │ <- NUEVO
│  ┌─────────────────────────────┐   │
│  │ #1 ¿Tiene acceso a AWS?     │   │
│  │    Respuesta: Sí            │   │
│  │    Impacto: +12.5 pts       │   │
│  ├─────────────────────────────┤   │
│  │ #2 ¿Cuántos servidores?     │   │
│  │    Respuesta: Más de 1000   │   │
│  │    Impacto: +8.3 pts        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Scores de Todas las Herramientas   │
│  ┌─────────────────────────────┐   │
│  │ #1 Migration Evaluator 85%  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Exportar Resultados                │
│  [Exportar PDF] [Exportar CSV]      │
└─────────────────────────────────────┘
```

## Datos Utilizados

Los datos vienen del resultado del cálculo:

```typescript
interface CalculationResult {
  recommendedTool: string;
  confidence: string;
  confidencePercentage: number;
  results: ToolResult[];
  decisiveFactors: DecisiveFactor[];  // <- Estos datos
}

interface DecisiveFactor {
  questionId: string;
  questionText?: string;
  answer: string;
  impact: number;  // Puntos de diferencia
}
```

## Renderizado Condicional

Solo se muestra si:
```typescript
{result.decisiveFactors && result.decisiveFactors.length > 0 && (
  // Mostrar factores decisivos
)}
```

Si no hay factores (caso raro), no se muestra nada.

## Archivos Modificados

- `frontend/src/components/phases/SelectorPhase.tsx`
  - Agregado import de icono `Lightbulb`
  - Agregada sección de Factores Decisivos
  - Renderizado condicional basado en `result.decisiveFactors`
  - Diseño con tema ámbar para destacar
  - Muestra top 5 factores con badge, pregunta, respuesta, impacto

## Testing

Para probar:

1. Completa un assessment
2. Haz clic en "Calcular Recomendación"
3. Verás la sección "¿Por qué esta recomendación?" después del radar
4. Revisa las 5 preguntas más importantes
5. Verifica que las respuestas coincidan con lo que respondiste
6. Observa el impacto en puntos de cada pregunta

---

**Implementado**: 2024-02-25  
**Tiempo**: ~15 minutos  
**Estado**: ✅ Funcional
