# ✅ Separación de Servidores Test/Dev/Prod - COMPLETADO

## 🎯 Objetivo

Separar claramente los servidores de test/desarrollo/staging de los servidores de producción en waves dedicadas, con mapas de dependencias individuales para cada wave.

---

## 🚀 Funcionalidades Implementadas

### 1. ✅ Detección Mejorada de Servidores Test/Dev

**Función `isTestDevServer()`**
Detecta servidores que contienen en su nombre:
- `test`
- `dev` / `development`
- `staging` / `stage`
- `qa`
- `uat`
- `sandbox`
- `demo`
- `preprod` / `pre-prod`

**Ejemplo:**
```
server-test-01 → 🧪 TEST/DEV
app-dev-backend → 🧪 TEST/DEV
db-staging → 🧪 TEST/DEV
api-prod → 🏭 PRODUCCIÓN
```

### 2. ✅ Algoritmo de Waves en Dos Fases

**FASE 1: Waves de Test/Dev/Staging**
- Se calculan primero todas las waves de test/dev
- Criticidad siempre 10 (muy baja)
- Migran primero por ser menos críticos
- Waves numeradas desde 1

**FASE 2: Waves de Producción**
- Se calculan después las waves de producción
- Criticidad según tipo de servidor (20-90)
- Migran después de test/dev
- Waves continúan la numeración

**Ejemplo de Resultado:**
```
Wave 1 (TEST/DEV): 5 servidores
Wave 2 (TEST/DEV): 3 servidores
Wave 3 (PROD): 8 servidores
Wave 4 (PROD): 12 servidores
Wave 5 (PROD): 6 servidores
```

### 3. ✅ Badges Visuales por Tipo de Wave

**🧪 TEST/DEV** (Verde)
- Todos los servidores son test/dev/staging
- Migración de menor riesgo
- Prioridad alta

**🏭 PROD** (Azul)
- Todos los servidores son producción
- Migración de mayor cuidado
- Prioridad según criticidad

**⚠️ MIXTA** (Amarillo)
- Mezcla de test/dev y producción
- Requiere revisión manual
- Poco común con el nuevo algoritmo

### 4. ✅ Información en Logs

**Logs Mejorados:**
```
📊 Total servidores: 25
🧪 Servidores Test/Dev/Staging: 8
🏭 Servidores Producción: 17

🎯 server-test-01: criticidad 10 (🧪 TEST/DEV)
🎯 api-prod: criticidad 50 (🏭 PROD)
🎯 db-prod: criticidad 90 (🏭 PROD)

🧪 === FASE 1: Calculando waves de Test/Dev/Staging ===
✅ Wave 1 (TEST/DEV): 5 servidores
✅ Wave 2 (TEST/DEV): 3 servidores

🏭 === FASE 2: Calculando waves de Producción ===
✅ Wave 3 (PROD): 8 servidores (criticidad promedio: 35.2)
✅ Wave 4 (PROD): 12 servidores (criticidad promedio: 52.8)
✅ Wave 5 (PROD): 6 servidores (criticidad promedio: 78.5)
```

### 5. ✅ Diagramas de Dependencias por Wave

**Cada wave tiene su propio diagrama:**
- Hover sobre wave → Muestra diagrama automáticamente
- Badge indica tipo de wave (TEST/DEV, PROD, MIXTA)
- Servidores de la wave resaltados
- Dependencias externas con menor opacidad
- Exportación individual a PNG

**Header del Modal:**
- Título: "Diagrama de Dependencias - Wave X"
- Badge: 🧪 TEST/DEV, 🏭 PRODUCCIÓN, o ⚠️ MIXTA
- Contador de servidores

---

## 🎨 Diseño Visual

### Wave Cards

**Wave de Test/Dev:**
```
┌─────────────────────────────────┐
│ 🟢 Wave 1  🧪 TEST/DEV      [5] │
│ ─────────────────────────────── │
│ 🖥️ server-test-01              │
│ 🖥️ app-dev-backend             │
│ 🖥️ db-staging                  │
│ ...                             │
│ [Ver Diagrama]                  │
└─────────────────────────────────┘
```

**Wave de Producción:**
```
┌─────────────────────────────────┐
│ 🔵 Wave 3  🏭 PROD         [12] │
│ ─────────────────────────────── │
│ 🗄️ db-prod-master              │
│ 🔌 api-prod-gateway            │
│ 📱 app-prod-frontend           │
│ ...                             │
│ [Ver Diagrama]                  │
└─────────────────────────────────┘
```

### Modal de Diagrama

**Header:**
```
┌──────────────────────────────────────────────┐
│ 🟢 Diagrama de Dependencias - Wave 1         │
│    🧪 TEST/DEV                                │
│    5 servidores en esta wave                  │
│                          [Exportar PNG] [✕]   │
└──────────────────────────────────────────────┘
```

---

## 📊 Ventajas de la Separación

### Para la Planificación
✅ **Claridad**: Identificación inmediata de waves de test vs prod
✅ **Priorización**: Test/dev migran primero automáticamente
✅ **Riesgo**: Menor riesgo al migrar test/dev primero
✅ **Validación**: Probar proceso de migración en test antes de prod

### Para la Ejecución
✅ **Orden lógico**: Test → Dev → Staging → Prod
✅ **Rollback fácil**: Si falla en test, no afecta prod
✅ **Aprendizaje**: Identificar problemas en ambientes no críticos
✅ **Confianza**: Validar proceso antes de tocar producción

### Para el Análisis
✅ **Dependencias claras**: Ver qué test/dev depende de qué
✅ **Impacto medible**: Cuántos servidores de cada tipo
✅ **Documentación**: Diagramas separados por ambiente
✅ **Trazabilidad**: Logs detallados por fase

---

## 🔍 Casos de Uso

### Caso 1: Migración Segura

**Escenario:**
Empresa quiere migrar 50 servidores a AWS

**Solución:**
1. Algoritmo separa automáticamente:
   - Wave 1-2: 15 servidores test/dev
   - Wave 3-6: 35 servidores producción
2. Migrar primero waves 1-2 (test/dev)
3. Validar proceso y ajustar
4. Migrar waves 3-6 (producción) con confianza

### Caso 2: Identificar Dependencias Críticas

**Escenario:**
Necesitas saber si test/dev depende de producción

**Solución:**
1. Hover sobre Wave 1 (TEST/DEV)
2. Ver diagrama de dependencias
3. Identificar conexiones grises (externas)
4. Si hay dependencias con prod, revisar y ajustar

### Caso 3: Documentar por Ambiente

**Escenario:**
Documentar migración para auditoría

**Solución:**
1. Exportar diagramas de waves test/dev
2. Exportar diagramas de waves producción
3. Incluir en documento de planificación
4. Mostrar separación clara de ambientes

---

## 🛠️ Implementación Técnica

### Función de Detección

```typescript
const isTestDevServer = (serverName: string): boolean => {
  const name = serverName.toLowerCase();
  return (
    name.includes('test') ||
    name.includes('dev') ||
    name.includes('development') ||
    name.includes('staging') ||
    name.includes('stage') ||
    name.includes('qa') ||
    name.includes('uat') ||
    name.includes('sandbox') ||
    name.includes('demo') ||
    name.includes('preprod') ||
    name.includes('pre-prod')
  );
};
```

### Algoritmo de Dos Fases

```typescript
// Separar servidores
const testDevServers = new Set<string>();
const prodServers = new Set<string>();

servers.forEach(server => {
  if (isTestDevServer(server)) {
    testDevServers.add(server);
  } else {
    prodServers.add(server);
  }
});

// FASE 1: Calcular waves de test/dev
// ... (algoritmo de waves para testDevServers)

// FASE 2: Calcular waves de producción
// ... (algoritmo de waves para prodServers)
```

### Badges Dinámicos

```typescript
{(() => {
  const testDevCount = wave.servers.filter(s => isTestDevServer(s)).length;
  const isTestDevWave = testDevCount === wave.servers.length;
  const isMixedWave = testDevCount > 0 && testDevCount < wave.servers.length;
  
  if (isTestDevWave) {
    return <Badge className="bg-green-600">🧪 TEST/DEV</Badge>;
  } else if (isMixedWave) {
    return <Badge className="bg-yellow-600">⚠️ MIXTA</Badge>;
  } else {
    return <Badge className="bg-blue-600">🏭 PROD</Badge>;
  }
})()}
```

---

## 📈 Estadísticas y Métricas

### Información Mostrada

**Panel de Estadísticas:**
- Total de servidores
- Total de conexiones
- Total de waves
- Servidores sin asignar

**Por Wave:**
- Número de servidores
- Tipo de wave (TEST/DEV, PROD, MIXTA)
- Criticidad promedio (solo PROD)
- Conexiones internas vs externas

**En Logs:**
- Servidores test/dev vs producción
- Criticidad de cada servidor
- Waves generadas por fase
- Servidores por wave

---

## ✅ Validaciones

### Validaciones Automáticas

1. ✅ Servidores test/dev siempre en waves tempranas
2. ✅ Servidores producción en waves posteriores
3. ✅ Criticidad 10 para test/dev
4. ✅ Criticidad 20-90 para producción
5. ✅ Dependencias respetadas en ambas fases
6. ✅ Badges correctos según composición de wave

### Casos Especiales

**Wave Mixta:**
- Puede ocurrir si hay dependencias cruzadas
- Badge amarillo ⚠️ MIXTA
- Requiere revisión manual
- Poco común con el nuevo algoritmo

**Dependencias Circulares:**
- Se asignan a última wave
- Ordenadas por criticidad
- Requieren revisión manual

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)

1. **Migrar test/dev primero**
   - Validar proceso de migración
   - Identificar problemas temprano
   - Ajustar antes de tocar producción

2. **Revisar diagramas de cada wave**
   - Verificar dependencias externas
   - Identificar conexiones críticas
   - Documentar decisiones

3. **Exportar diagramas**
   - Documentación de planificación
   - Auditoría y trazabilidad
   - Compartir con equipo

4. **Validar badges**
   - Verificar que waves test/dev estén primero
   - Revisar waves mixtas si existen
   - Confirmar separación correcta

### ❌ DON'T (No Hacer)

1. **No migrar producción primero**
   - Mayor riesgo
   - Sin validación previa
   - Posibles problemas en prod

2. **No ignorar waves mixtas**
   - Requieren revisión manual
   - Pueden indicar dependencias problemáticas
   - Ajustar si es posible

3. **No confiar solo en nombres**
   - Validar con diagrama de dependencias
   - Verificar criticidad
   - Confirmar con equipo

---

## 🚀 Próximos Pasos

### Para Probar

1. Cargar archivo MPA con servidores test/dev y prod
2. Abrir Migration Planner
3. Verificar que waves test/dev estén primero
4. Verificar badges (🧪 TEST/DEV, 🏭 PROD)
5. Hover sobre cada wave para ver diagrama
6. Exportar diagramas de cada wave
7. Validar logs en consola

### Para Mejorar (Opcional)

1. Filtrar waves por tipo (solo test/dev, solo prod)
2. Comparar diagramas de test vs prod
3. Estadísticas por ambiente
4. Reporte PDF separado por ambiente
5. Validación de naming conventions

---

## 📝 Archivos Modificados

### `frontend/src/components/MigrationPlanner.tsx`

**Cambios:**
1. ✅ Agregada función `isTestDevServer()`
2. ✅ Mejorada función `getServerCriticality()`
3. ✅ Algoritmo de waves en dos fases
4. ✅ Separación de testDevServers y prodServers
5. ✅ Logs mejorados con emojis 🧪 y 🏭
6. ✅ Badges dinámicos en wave cards
7. ✅ Badge en header del modal de diagrama
8. ✅ Sin errores de TypeScript

---

## 🎉 Conclusión

La separación de servidores test/dev/staging de producción está completamente implementada con:

✅ **Detección automática** de servidores test/dev
✅ **Algoritmo en dos fases** (test/dev primero, prod después)
✅ **Badges visuales** para identificación rápida
✅ **Diagramas separados** por wave con hover automático
✅ **Logs detallados** con información de ambiente
✅ **Exportación individual** de cada diagrama
✅ **Validaciones automáticas** de criticidad y orden

**Estado**: ✅ COMPLETADO
**Fecha**: 2026-02-26
**Archivos modificados**: 1
**Errores**: 0
**Funcionalidades**: 5 implementadas

**¡Listo para migrar con confianza!** 🚀
