# 🎨 Cambios de UX - Módulo Selector

## ✅ Actualización del Spec Completada

### 📋 Cambio Principal: Single-Page Questionnaire

**ANTES (con stepper):**
```
Categoría 1: Infraestructura (5 preguntas)
[Pregunta 1]
[Pregunta 2]
...
[Anterior] [Siguiente Categoría] ← Navegación por categorías

Categoría 2: Conectividad (3 preguntas)
...
```

**AHORA (single page):**
```
┌─────────────────────────────────────────┐
│ Progress: 25 / 28 respondidas            │
│ ⚠️ Faltan 3 preguntas por responder    │
├─────────────────────────────────────────┤
│                                          │
│ 📦 INFRAESTRUCTURA (5 preguntas)       │
│ ✅ Q1: ... [respuesta]                 │
│ ✅ Q2: ... [respuesta]                 │
│ ❌ Q3: ... [sin responder] ← ROJO      │
│ ✅ Q4: ... [respuesta]                 │
│ ✅ Q5: ... [respuesta]                 │
│                                          │
│ 🔌 CONECTIVIDAD (3 preguntas)          │
│ ✅ Q6: ... [respuesta]                 │
│ ❌ Q7: ... [sin responder] ← ROJO      │
│ ✅ Q8: ... [respuesta]                 │
│                                          │
│ ... (scroll para ver todas)             │
│                                          │
│ [Calcular] ← Deshabilitado             │
└─────────────────────────────────────────┘
```

---

## 🔴 Nuevas Reglas de UX

### 1. **Una Sola Página Scrolleable**
- ❌ NO hay navegación "Siguiente Categoría" / "Anterior"
- ✅ Todas las 28 preguntas visibles en una sola página
- ✅ Scroll suave para navegar
- ✅ Categorías como headers visuales (no como pasos)

### 2. **Todas las Preguntas son Obligatorias**
- ✅ Las 28 preguntas DEBEN ser respondidas
- ✅ No hay opción de "Skip" o "Omitir"
- ✅ Botón "Calcular" deshabilitado hasta completar todas

### 3. **Validación Visual en Rojo**
- ✅ Preguntas sin responder → borde ROJO
- ✅ Ícono de advertencia ⚠️
- ✅ Mensaje: "Esta pregunta es obligatoria"
- ✅ Contador en tiempo real: "X / 28 respondidas"
- ✅ Mensaje global: "Debes responder todas las preguntas (X faltan)"

### 4. **Auto-save Mantiene**
- ✅ Guardar automáticamente cada respuesta (500ms debounce)
- ✅ Indicador "Guardando..." cuando aplica

---

## 📝 Archivos del Spec Actualizados

### 1. **design.md**
- ✅ Sección 5.2: "Questionnaire Layout (Single Page)"
- ✅ Sección 2.2.1: Componentes actualizados
  - Eliminado: `SelectorStepper.tsx`
  - Agregado: `SelectorQuestionList.tsx`

### 2. **requirements.md**
- ✅ FR-1.1: Display requirements (single page)
- ✅ FR-1.2: Answer input (mandatory)
- ✅ FR-1.3: Validation & Visual Feedback (red highlighting)

### 3. **tasks.md**
- ✅ Sección 6.2: Componentes actualizados
- ✅ Sección 7: "Questionnaire Flow (Single Page - NO Stepper)"
  - 7.1: Single-Page Question List
  - 7.2: Mandatory Question Validation

---

## 🚀 Próximos Pasos de Implementación

### Fase 1: Refactorizar SelectorPhase.tsx
1. Eliminar lógica de `currentCategoryIndex`
2. Eliminar botones "Anterior" / "Siguiente Categoría"
3. Renderizar todas las preguntas en un solo contenedor scrolleable
4. Agrupar por categoría con headers visuales

### Fase 2: Implementar Validación
1. Agregar estado para tracking de preguntas sin responder
2. Aplicar clase CSS `border-red-500` a preguntas sin responder
3. Agregar ícono ⚠️ y mensaje "Esta pregunta es obligatoria"
4. Deshabilitar botón "Calcular" con lógica: `disabled={answers.length < 28}`
5. Mostrar mensaje: "Debes responder todas las preguntas (X faltan)"

### Fase 3: Testing
1. Verificar que todas las 28 preguntas sean visibles
2. Verificar scroll suave
3. Verificar highlighting en rojo
4. Verificar que botón se habilite solo con 28 respuestas
5. Verificar auto-save funciona en todas las preguntas

---

## 📊 Impacto en el Código Actual

### Componente Actual (SelectorPhase.tsx)
**Cambios necesarios:**
- ❌ Eliminar: `currentCategoryIndex` state
- ❌ Eliminar: `setCurrentCategoryIndex` 
- ❌ Eliminar: Botones "Anterior" / "Siguiente Categoría"
- ✅ Agregar: Renderizado de todas las categorías
- ✅ Agregar: Lógica de validación visual
- ✅ Agregar: Contador de preguntas faltantes

**Estimado:** 2-3 horas de refactoring

---

## ✅ Beneficios de este Cambio

1. **Mejor UX**: Usuario ve todo el contexto de una vez
2. **Más rápido**: No hay clicks innecesarios entre categorías
3. **Menos errores**: Validación visual clara de qué falta
4. **Más simple**: Menos estado, menos lógica de navegación
5. **Más accesible**: Scroll natural, sin pasos artificiales

---

## 📌 Resumen

**Cambio:** De stepper multi-paso → Single-page scrolleable
**Validación:** Todas las preguntas obligatorias con highlighting rojo
**Estado:** Spec actualizado ✅, implementación pendiente
**Próximo:** Refactorizar SelectorPhase.tsx según nuevo spec

---

**Commit:** `833915c` - "spec: update UX to single-page questionnaire with mandatory validation"
