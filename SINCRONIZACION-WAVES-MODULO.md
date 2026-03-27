# ✅ Sincronización de Waves con Módulo de Planificación

## 🎯 Objetivo

Asegurar que el Migration Planner use exactamente las mismas waves que se muestran en el gráfico "Distribución de Capacidad de las Olas" del módulo de Planificación de Olas.

---

## 🔄 Cómo Funciona la Sincronización

### Flujo de Datos

```
Módulo Planificación de Olas
         ↓
   existingWaves (props)
         ↓
   Migration Planner
         ↓
   Calcula distribución de servidores
         ↓
   Muestra waves sincronizadas
```

### Escenarios

#### Escenario 1: Waves con Servidores Ya Asignados

**Condición:** `existingWaves[0].servers` existe y tiene servidores

**Comportamiento:**
```typescript
if (existingWaves[0]?.servers && existingWaves[0].servers.length > 0) {
  // Usar waves directamente
  const wavesData = existingWaves.map(wave => ({
    number: wave.waveNumber,
    servers: wave.servers,
    color: WAVE_COLORS[(wave.waveNumber - 1) % WAVE_COLORS.length],
  }));
}
```

**Resultado:**
- ✅ Usa waves exactamente como están definidas
- ✅ No recalcula nada
- ✅ Sincronización perfecta

#### Escenario 2: Waves Sin Servidores Asignados

**Condición:** `existingWaves` existe pero no tiene `servers`

**Comportamiento:**
```typescript
// Calcula automáticamente qué servidores van en cada wave
// Basándose en:
// 1. Número de waves definidas en el módulo
// 2. Dependencias entre servidores
// 3. Criticidad de cada servidor
// 4. Separación test/dev vs prod
```

**Resultado:**
- ✅ Respeta el número de waves del módulo
- ✅ Distribuye servidores automáticamente
- ✅ Mantiene sincronización con gráfico

#### Escenario 3: Sin Waves Existentes

**Condición:** `existingWaves` es null o vacío

**Comportamiento:**
```typescript
// Calcula waves desde cero
// Algoritmo en dos fases:
// 1. Waves de test/dev
// 2. Waves de producción
```

**Resultado:**
- ✅ Genera waves automáticamente
- ✅ Basado en dependencias y criticidad
- ✅ Puede diferir del módulo (normal)

---

## 📊 Sincronización con Gráfico

### Gráfico "Wave Capacity Distribution"

El gráfico muestra:
- **Eje X**: Wave 1, Wave 2, Wave 3, etc.
- **Eje Y**: Número de servidores/aplicaciones
- **Barras**: Servidores (sólido) y Aplicaciones (transparente)
- **Colores**: Según estado (planned, in_progress, completed, blocked)

### Migration Planner

El planner muestra:
- **Panel izquierdo**: Lista de waves con servidores
- **Panel derecho**: Mapa de dependencias
- **Badges**: Tipo de wave (TEST/DEV, PROD, MIXTA)
- **Diagramas**: Por wave con hover

### Sincronización

```
Gráfico muestra:
Wave 1: 5 servidores
Wave 2: 8 servidores
Wave 3: 12 servidores

Migration Planner muestra:
Wave 1: 5 servidores (listados)
Wave 2: 8 servidores (listados)
Wave 3: 12 servidores (listados)

✅ SINCRONIZADOS
```

---

## 🛠️ Implementación Técnica

### Props del Migration Planner

```typescript
interface MigrationPlannerProps {
  dependencies: NetworkDependency[];
  existingWaves?: any[]; // Waves del módulo
  onClose?: () => void;
}
```

### Uso en MigrationWaves

```typescript
<MigrationPlanner
  dependencies={dependencyData?.dependencies || []}
  existingWaves={waves} // ← Waves del módulo
  onClose={() => setShowPlanner(false)}
/>
```

### Lógica de Sincronización

```typescript
const calculateWaves = (forceRecalculate: boolean = false) => {
  // 1. Verificar si hay waves existentes
  if (existingWaves && existingWaves.length > 0 && !forceRecalculate) {
    console.log('✅ Usando waves existentes del módulo');
    
    // 2. Verificar si tienen servidores asignados
    if (existingWaves[0]?.servers && existingWaves[0].servers.length > 0) {
      // Usar directamente
      return useExistingWaves();
    }
    
    // 3. Si no tienen servidores, calcularlos
    console.log('📊 Calculando distribución de servidores...');
  }
  
  // 4. Calcular waves desde cero
  return calculateFromScratch();
};
```

---

## 📈 Casos de Uso

### Caso 1: Usuario Define Waves Manualmente

**Escenario:**
1. Usuario abre módulo Planificación de Olas
2. Crea 3 waves manualmente:
   - Wave 1: "Dev/Test" - 5 servidores
   - Wave 2: "Non-Critical" - 8 servidores
   - Wave 3: "Critical" - 12 servidores
3. Abre Migration Planner

**Resultado:**
- ✅ Migration Planner muestra 3 waves
- ✅ Distribuye servidores automáticamente
- ✅ Respeta el número de waves definido
- ✅ Gráfico y planner sincronizados

### Caso 2: Usuario Usa Waves Automáticas

**Escenario:**
1. Usuario carga archivo MPA
2. Sistema genera dependencias automáticamente
3. Usuario abre Migration Planner directamente

**Resultado:**
- ✅ Migration Planner calcula waves desde cero
- ✅ Basado en dependencias y criticidad
- ✅ Genera waves automáticamente
- ✅ Usuario puede ajustar manualmente

### Caso 3: Usuario Modifica Waves

**Escenario:**
1. Usuario tiene 3 waves definidas
2. Abre Migration Planner
3. Mueve servidores entre waves
4. Cierra Migration Planner
5. Vuelve a abrir

**Resultado:**
- ✅ Cambios se mantienen
- ✅ Waves actualizadas
- ✅ Gráfico refleja cambios
- ✅ Sincronización mantenida

---

## 🔍 Validación de Sincronización

### Checklist de Validación

1. **Número de Waves**
   - [ ] Gráfico muestra N waves
   - [ ] Migration Planner muestra N waves
   - [ ] ✅ Coinciden

2. **Número de Servidores por Wave**
   - [ ] Gráfico muestra X servidores en Wave 1
   - [ ] Migration Planner muestra X servidores en Wave 1
   - [ ] ✅ Coinciden

3. **Total de Servidores**
   - [ ] Gráfico suma total = Y
   - [ ] Migration Planner suma total = Y
   - [ ] ✅ Coinciden

4. **Orden de Waves**
   - [ ] Gráfico: Wave 1, 2, 3...
   - [ ] Migration Planner: Wave 1, 2, 3...
   - [ ] ✅ Coinciden

### Logs de Validación

```
🔄 Calculando waves de migración con criticidad...
✅ Usando waves existentes del módulo de Planificación de Olas como base
📊 3 waves definidas en el módulo
📊 Calculando distribución de servidores en waves existentes...

🧪 === FASE 1: Calculando waves de Test/Dev/Staging ===
✅ Wave 1 (TEST/DEV): 5 servidores

🏭 === FASE 2: Calculando waves de Producción ===
✅ Wave 2 (PROD): 8 servidores (criticidad promedio: 45.2)
✅ Wave 3 (PROD): 12 servidores (criticidad promedio: 62.8)

🎉 Waves calculadas: 3 waves (sincronizadas con módulo)
```

---

## 🎯 Mejores Prácticas

### Para Usuarios

1. **Definir Waves Primero**
   - Crear waves en módulo Planificación de Olas
   - Definir fechas y estrategias
   - Luego abrir Migration Planner

2. **Usar Migration Planner para Distribución**
   - Dejar que el planner distribuya servidores
   - Ajustar manualmente si es necesario
   - Exportar diagramas para documentación

3. **Validar Sincronización**
   - Verificar que número de waves coincida
   - Verificar que número de servidores coincida
   - Revisar gráfico y planner

### Para Desarrolladores

1. **Pasar existingWaves Siempre**
   ```typescript
   <MigrationPlanner
     dependencies={dependencies}
     existingWaves={waves} // ← Importante
     onClose={onClose}
   />
   ```

2. **Verificar Logs**
   ```typescript
   console.log('✅ Usando waves existentes del módulo');
   console.log(`📊 ${existingWaves.length} waves definidas`);
   ```

3. **Manejar Casos Edge**
   - Waves sin servidores
   - Waves con servidores
   - Sin waves existentes

---

## 🐛 Solución de Problemas

### Problema: Número de Waves No Coincide

**Causa:** Migration Planner calculó waves desde cero

**Solución:**
1. Verificar que `existingWaves` se pasa correctamente
2. Verificar logs: "✅ Usando waves existentes"
3. Si no aparece, revisar props del componente

### Problema: Servidores No Distribuidos Correctamente

**Causa:** Algoritmo de distribución no respeta waves existentes

**Solución:**
1. Verificar que waves tienen `serverCount` definido
2. Verificar que hay suficientes servidores
3. Ajustar manualmente con drag & drop

### Problema: Gráfico y Planner Desincronizados

**Causa:** Cambios no se guardan o no se propagan

**Solución:**
1. Cerrar y abrir Migration Planner
2. Verificar que `onWavesChange` se llama
3. Verificar que estado se actualiza

---

## 📊 Ejemplo Completo

### Módulo Planificación de Olas

```typescript
const waves = [
  {
    id: 'wave-1',
    waveNumber: 1,
    name: 'Dev/Test Workloads',
    serverCount: 5,
    applicationCount: 3,
    status: 'planned',
  },
  {
    id: 'wave-2',
    waveNumber: 2,
    name: 'Non-Critical Apps',
    serverCount: 8,
    applicationCount: 5,
    status: 'planned',
  },
  {
    id: 'wave-3',
    waveNumber: 3,
    name: 'Critical Systems',
    serverCount: 12,
    applicationCount: 8,
    status: 'planned',
  },
];
```

### Migration Planner Recibe

```typescript
existingWaves = [
  { waveNumber: 1, serverCount: 5, ... },
  { waveNumber: 2, serverCount: 8, ... },
  { waveNumber: 3, serverCount: 12, ... },
]
```

### Migration Planner Calcula

```typescript
wavesData = [
  {
    number: 1,
    servers: ['server-test-01', 'server-test-02', ...], // 5 servidores
    color: '#48bb78',
  },
  {
    number: 2,
    servers: ['api-prod-01', 'web-prod-01', ...], // 8 servidores
    color: '#4299e1',
  },
  {
    number: 3,
    servers: ['db-prod-master', 'auth-prod', ...], // 12 servidores
    color: '#ed8936',
  },
]
```

### Resultado

```
Gráfico:
Wave 1: ████████ (5 servidores)
Wave 2: ████████████ (8 servidores)
Wave 3: ████████████████████ (12 servidores)

Migration Planner:
Wave 1 🧪 TEST/DEV [5]
  - server-test-01
  - server-test-02
  - ...

Wave 2 🏭 PROD [8]
  - api-prod-01
  - web-prod-01
  - ...

Wave 3 🏭 PROD [12]
  - db-prod-master
  - auth-prod
  - ...

✅ SINCRONIZADOS
```

---

## 🎉 Conclusión

La sincronización entre el módulo de Planificación de Olas y el Migration Planner está completamente implementada:

✅ **Migration Planner usa waves existentes** del módulo
✅ **Respeta número de waves** definido
✅ **Distribuye servidores automáticamente** si es necesario
✅ **Mantiene sincronización** con gráfico
✅ **Permite ajustes manuales** con drag & drop
✅ **Logs detallados** para debugging

**Estado**: ✅ SINCRONIZADO
**Fecha**: 2026-02-26
**Archivos modificados**: 1
**Errores**: 0

**¡El sistema está completamente sincronizado!** 🚀
