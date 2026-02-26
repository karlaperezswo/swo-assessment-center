# 📖 Guía Rápida - Waves Test/Dev vs Producción

## 🎯 ¿Qué es la Separación Test/Dev/Prod?

El Migration Planner ahora separa automáticamente los servidores en dos grupos:

- **🧪 TEST/DEV/STAGING**: Ambientes no productivos (migran primero)
- **🏭 PRODUCCIÓN**: Ambientes productivos (migran después)

Cada grupo tiene sus propias waves y diagramas de dependencias.

---

## 🚀 Cómo Funciona

### 1. Detección Automática

El sistema detecta automáticamente servidores test/dev si su nombre contiene:

```
✅ test          → server-test-01
✅ dev           → app-dev-backend
✅ development   → api-development
✅ staging       → db-staging
✅ stage         → web-stage
✅ qa            → qa-server
✅ uat           → uat-environment
✅ sandbox       → sandbox-api
✅ demo          → demo-app
✅ preprod       → preprod-db
✅ pre-prod      → pre-prod-api
```

### 2. Generación de Waves

**Orden de Generación:**
```
FASE 1: Waves de Test/Dev
├─ Wave 1 (TEST/DEV): 5 servidores
├─ Wave 2 (TEST/DEV): 3 servidores
└─ Wave 3 (TEST/DEV): 2 servidores

FASE 2: Waves de Producción
├─ Wave 4 (PROD): 8 servidores
├─ Wave 5 (PROD): 12 servidores
└─ Wave 6 (PROD): 6 servidores
```

### 3. Badges Visuales

**🧪 TEST/DEV** (Verde)
- Todos los servidores son test/dev/staging
- Migración de bajo riesgo
- Migran primero

**🏭 PROD** (Azul)
- Todos los servidores son producción
- Migración de mayor cuidado
- Migran después

**⚠️ MIXTA** (Amarillo)
- Mezcla de test/dev y producción
- Requiere revisión manual
- Poco común

---

## 📊 Cómo Usar

### Paso 1: Abrir Migration Planner

1. Ve al módulo "Planificación de Olas"
2. Click en botón "Migration Planner"
3. El sistema calcula waves automáticamente

### Paso 2: Identificar Waves por Tipo

**Busca los badges:**
- 🧪 **TEST/DEV** (verde) = Waves de test/dev
- 🏭 **PROD** (azul) = Waves de producción
- ⚠️ **MIXTA** (amarillo) = Requiere revisión

**Ejemplo:**
```
Wave 1  🧪 TEST/DEV     [5]
Wave 2  🧪 TEST/DEV     [3]
Wave 3  🏭 PROD         [8]
Wave 4  🏭 PROD        [12]
```

### Paso 3: Ver Diagrama de Cada Wave

**Opción A: Hover Automático**
1. Pasa el mouse sobre una wave
2. Se muestra automáticamente su diagrama
3. Badge indica tipo de wave

**Opción B: Botón Manual**
1. Click en "Ver Diagrama"
2. Se abre modal con diagrama completo
3. Header muestra badge de tipo

### Paso 4: Analizar Dependencias

**En el Diagrama:**
- **Borde blanco grueso** = Servidores de esta wave
- **Borde normal** = Dependencias externas
- **Conexiones de color** = Internas a la wave
- **Conexiones grises** = Externas a la wave

**Footer muestra:**
- "X internas, Y externas"
- Leyenda de colores

### Paso 5: Exportar Diagramas

1. Abre diagrama de una wave
2. Click en "Exportar PNG"
3. Se descarga: `wave-X-diagram-YYYY-MM-DD.png`
4. Repite para cada wave

---

## 💡 Casos de Uso Prácticos

### Caso 1: Validar Orden de Migración

**Objetivo:** Asegurar que test/dev migran primero

**Pasos:**
1. Abrir Migration Planner
2. Verificar que waves 1-N tienen badge 🧪 TEST/DEV
3. Verificar que waves siguientes tienen badge 🏭 PROD
4. Si hay waves mixtas ⚠️, revisar manualmente

**Resultado Esperado:**
```
✅ Wave 1  🧪 TEST/DEV
✅ Wave 2  🧪 TEST/DEV
✅ Wave 3  🏭 PROD
✅ Wave 4  🏭 PROD
```

### Caso 2: Identificar Dependencias entre Ambientes

**Objetivo:** Ver si test/dev depende de producción

**Pasos:**
1. Hover sobre Wave 1 (TEST/DEV)
2. Ver diagrama de dependencias
3. Buscar conexiones grises (externas)
4. Si hay conexiones a waves PROD, revisar

**Acción:**
- Si test depende de prod → Considerar mover a wave posterior
- Si prod depende de test → Revisar arquitectura

### Caso 3: Documentar Migración por Ambiente

**Objetivo:** Crear documentación separada por ambiente

**Pasos:**
1. Exportar diagramas de todas las waves TEST/DEV
2. Exportar diagramas de todas las waves PROD
3. Crear dos documentos:
   - "Plan de Migración - Test/Dev"
   - "Plan de Migración - Producción"
4. Incluir diagramas correspondientes

### Caso 4: Migración Incremental Segura

**Objetivo:** Migrar con mínimo riesgo

**Estrategia:**
1. **Semana 1**: Migrar waves TEST/DEV
   - Menor riesgo
   - Validar proceso
   - Identificar problemas
2. **Semana 2**: Ajustar y documentar
   - Corregir problemas encontrados
   - Actualizar procedimientos
   - Preparar equipo
3. **Semana 3+**: Migrar waves PROD
   - Con confianza
   - Proceso validado
   - Equipo preparado

---

## 🔍 Interpretación de Resultados

### Escenario Ideal

```
Wave 1  🧪 TEST/DEV     [5]  ← Migrar primero
Wave 2  🧪 TEST/DEV     [3]  ← Migrar segundo
Wave 3  🏭 PROD         [8]  ← Migrar tercero
Wave 4  🏭 PROD        [12]  ← Migrar cuarto
```

**Características:**
- ✅ Test/dev en waves tempranas
- ✅ Producción en waves posteriores
- ✅ Sin waves mixtas
- ✅ Orden lógico y seguro

### Escenario con Wave Mixta

```
Wave 1  🧪 TEST/DEV     [5]
Wave 2  ⚠️ MIXTA        [4]  ← Revisar
Wave 3  🏭 PROD         [8]
```

**Acción Requerida:**
1. Click en Wave 2
2. Ver qué servidores son test/dev y cuáles prod
3. Considerar mover servidores para separar
4. Usar drag & drop para reorganizar

### Escenario con Dependencias Cruzadas

**Diagrama muestra:**
- Wave 1 (TEST/DEV) con muchas conexiones grises a Wave 3 (PROD)

**Acción Requerida:**
1. Identificar servidores test que dependen de prod
2. Evaluar si es correcto (ej: test apunta a DB prod)
3. Si no es correcto, ajustar configuración
4. Documentar dependencias necesarias

---

## 📈 Métricas Importantes

### En el Panel de Estadísticas

**Total de Servidores:**
- Suma de test/dev + producción

**Total de Waves:**
- Waves test/dev + waves producción

**Servidores sin Asignar:**
- Dependencias circulares
- Requieren revisión manual

### En los Logs (Consola)

```
📊 Total servidores: 25
🧪 Servidores Test/Dev/Staging: 8
🏭 Servidores Producción: 17

🧪 === FASE 1: Calculando waves de Test/Dev/Staging ===
✅ Wave 1 (TEST/DEV): 5 servidores
✅ Wave 2 (TEST/DEV): 3 servidores

🏭 === FASE 2: Calculando waves de Producción ===
✅ Wave 3 (PROD): 8 servidores (criticidad promedio: 35.2)
✅ Wave 4 (PROD): 12 servidores (criticidad promedio: 52.8)
```

---

## ⚠️ Advertencias y Consideraciones

### Naming Conventions

**Importante:** La detección se basa en el nombre del servidor

**Buenas Prácticas:**
```
✅ server-test-01
✅ app-dev-backend
✅ db-staging-master
✅ api-prod-gateway
```

**Evitar:**
```
❌ server01 (no indica ambiente)
❌ app-backend (no indica ambiente)
❌ database (no indica ambiente)
```

### Dependencias entre Ambientes

**Normal:**
- Test/dev puede depender de otros test/dev
- Prod puede depender de otros prod

**Revisar:**
- Test/dev depende de prod (puede ser intencional)
- Prod depende de test/dev (probablemente error)

### Waves Mixtas

**Causas Comunes:**
- Dependencias cruzadas entre ambientes
- Naming inconsistente
- Arquitectura compleja

**Solución:**
- Revisar diagrama de la wave
- Mover servidores manualmente
- Recalcular waves

---

## 🎯 Checklist de Validación

Antes de ejecutar la migración, verifica:

### ✅ Orden de Waves
- [ ] Waves test/dev están primero
- [ ] Waves producción están después
- [ ] No hay waves mixtas (o están justificadas)

### ✅ Dependencias
- [ ] Test/dev no depende de prod (o está justificado)
- [ ] Prod no depende de test/dev
- [ ] Dependencias circulares revisadas

### ✅ Documentación
- [ ] Diagramas exportados de cada wave
- [ ] Badges verificados
- [ ] Logs revisados
- [ ] Plan de migración documentado

### ✅ Equipo
- [ ] Equipo conoce el orden de migración
- [ ] Procedimientos documentados
- [ ] Rollback plan preparado
- [ ] Comunicación establecida

---

## 🚀 Flujo de Trabajo Recomendado

### Fase de Planificación

1. **Cargar datos**
   - Subir archivo MPA
   - Verificar dependencias cargadas

2. **Abrir Migration Planner**
   - Revisar waves generadas
   - Verificar badges de tipo

3. **Analizar cada wave**
   - Hover para ver diagrama
   - Exportar diagramas
   - Documentar hallazgos

4. **Ajustar si necesario**
   - Mover servidores entre waves
   - Recalcular
   - Validar cambios

### Fase de Ejecución

1. **Migrar waves TEST/DEV**
   - Seguir orden de waves
   - Validar después de cada wave
   - Documentar problemas

2. **Revisar y ajustar**
   - Analizar problemas encontrados
   - Actualizar procedimientos
   - Preparar para producción

3. **Migrar waves PROD**
   - Seguir orden de waves
   - Mayor cuidado y validación
   - Monitoreo continuo

4. **Validación final**
   - Verificar todas las waves
   - Confirmar funcionamiento
   - Documentar lecciones aprendidas

---

## 📞 Solución de Problemas

### Problema: No se detectan servidores test/dev

**Causa:** Naming no incluye palabras clave

**Solución:**
1. Verificar nombres de servidores
2. Agregar sufijo/prefijo (ej: -test, -dev)
3. Recalcular waves

### Problema: Waves mixtas

**Causa:** Dependencias cruzadas entre ambientes

**Solución:**
1. Ver diagrama de la wave mixta
2. Identificar servidores de cada tipo
3. Mover manualmente para separar
4. Recalcular

### Problema: Test/dev depende de prod

**Causa:** Puede ser intencional (ej: test apunta a DB prod)

**Solución:**
1. Verificar si es intencional
2. Si es correcto, documentar
3. Si no es correcto, ajustar configuración
4. Recalcular waves

---

## 🎉 ¡Listo para Usar!

Ahora tienes todas las herramientas para:

✅ Separar automáticamente test/dev de producción
✅ Visualizar dependencias por wave y ambiente
✅ Migrar con orden lógico y seguro
✅ Documentar planificación por ambiente
✅ Ejecutar migración con confianza

**¡Buena suerte con tu migración!** 🚀
