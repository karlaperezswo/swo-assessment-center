# Sincronización de Olas de Migración

## ✅ Problema Resuelto

Antes había dos cálculos separados de waves:
1. **Módulo de Planificación de Olas**: Mostraba X waves en la gráfica
2. **Migration Planner**: Calculaba sus propias waves (podía ser diferente número)

Ahora están sincronizados: el número de waves en la gráfica coincide exactamente con el Migration Planner.

## 🔄 Flujo de Sincronización

```
Rapid Discovery (carga MPA)
    ↓
Backend calcula waves automáticamente
    ↓
App.tsx almacena waves calculadas
    ↓
MigrationWaves muestra waves en gráfica
    ↓
Usuario click en "Migration Planner"
    ↓
MigrationPlanner recibe waves existentes
    ↓
Usa las mismas waves (no recalcula)
    ↓
Visualiza con el mismo número de waves
```

## 📊 Implementación

### 1. MigrationPlanner Actualizado

**Nueva prop `existingWaves`:**
```typescript
interface MigrationPlannerProps {
  dependencies: NetworkDependency[];
  existingWaves?: any[]; // Waves del módulo
  onClose?: () => void;
}
```

### 2. Lógica de Cálculo Mejorada

```typescript
const calculateWaves = () => {
  // Si hay waves existentes, usarlas
  if (existingWaves && existingWaves.length > 0) {
    console.log('✅ Usando waves existentes del módulo');
    
    const wavesData = existingWaves.map(wave => ({
      number: wave.waveNumber,
      servers: wave.servers || [],
      color: WAVE_COLORS[(wave.waveNumber - 1) % WAVE_COLORS.length],
    }));
    
    // Crear mapa servidor -> wave
    const assigned = new Map();
    wavesData.forEach(wave => {
      wave.servers.forEach(server => {
        assigned.set(server, wave.number);
      });
    });
    
    return { wavesData, assigned };
  }
  
  // Si no hay waves, calcular desde cero
  // ... algoritmo de cálculo ...
}
```

### 3. MigrationWaves Pasa las Waves

```typescript
<MigrationPlanner
  dependencies={dependencyData?.dependencies || []}
  existingWaves={waves}  // ← Pasa las waves existentes
  onClose={() => setShowPlanner(false)}
/>
```

## 🎯 Resultado

### Antes
- Gráfica muestra: **3 waves**
- Migration Planner calcula: **5 waves** ❌ (inconsistente)

### Ahora
- Gráfica muestra: **3 waves**
- Migration Planner usa: **3 waves** ✅ (sincronizado)

## 📋 Ventajas

1. **Consistencia**: Mismo número de waves en ambos lugares
2. **Rendimiento**: No recalcula si ya existen waves
3. **Confiabilidad**: Una sola fuente de verdad
4. **UX mejorada**: Usuario ve información coherente

## 🔍 Casos de Uso

### Caso 1: Waves Auto-Calculadas
1. Usuario carga archivo MPA en Rapid Discovery
2. Backend calcula waves automáticamente
3. Gráfica muestra N waves
4. Migration Planner usa esas mismas N waves ✅

### Caso 2: Waves Manuales
1. Usuario agrega waves manualmente
2. Gráfica muestra M waves
3. Migration Planner usa esas mismas M waves ✅

### Caso 3: Sin Waves
1. Usuario no ha cargado archivo ni agregado waves
2. Gráfica muestra 0 waves
3. Migration Planner calcula desde cero (fallback) ✅

## 🛠️ Detalles Técnicos

### Estructura de Wave Existente
```typescript
{
  id: "wave-auto-1",
  waveNumber: 1,
  name: "Wave 1 - Base Infrastructure",
  startDate: "",
  endDate: "",
  serverCount: 5,
  applicationCount: 0,
  status: "planned",
  strategy: "Rehost",
  notes: "Servidores: server1, server2, ...",
  servers: ["server1", "server2", "server3", ...]
}
```

### Conversión a Wave del Planner
```typescript
{
  number: 1,
  servers: ["server1", "server2", "server3", ...],
  color: "#48bb78" // Verde (Wave 1)
}
```

## 📊 Estadísticas Sincronizadas

El Migration Planner ahora muestra:
- **Total Servidores**: Cuenta de servidores en waves existentes
- **Total Conexiones**: Dependencias del archivo MPA
- **Total Waves**: Número de waves del módulo ✅
- **Sin Asignar**: Servidores en dependencias pero no en waves

## 🎨 Visualización Coherente

### Gráfica de Distribución
```
Wave 1: ████████ 8 servidores
Wave 2: ████████████ 12 servidores
Wave 3: ████ 4 servidores
```

### Migration Planner
```
Wave 1 (Verde): 8 servidores
Wave 2 (Azul): 12 servidores
Wave 3 (Naranja): 4 servidores
```

**Mismo número de waves en ambos lugares!** ✅

## 🔄 Actualización Dinámica

Si el usuario:
1. Agrega una wave manualmente → Migration Planner la verá
2. Elimina una wave → Migration Planner se actualiza
3. Modifica servidores en wave → Migration Planner refleja cambios

## ✨ Mejoras Futuras Posibles

1. **Edición en Planner**: Permitir editar waves desde el planner
2. **Sincronización bidireccional**: Cambios en planner actualizan módulo
3. **Validación**: Verificar que todos los servidores estén asignados
4. **Optimización**: Sugerir re-ordenamiento de waves

## 📝 Notas Importantes

- Las waves existentes siempre tienen prioridad
- Si no hay waves, el planner calcula desde cero (fallback)
- Los colores se asignan consistentemente por número de wave
- La criticidad se respeta en el cálculo inicial de waves

## 🎉 Conclusión

Ahora el número de waves en la gráfica de distribución coincide exactamente con el número de waves en el Migration Planner, proporcionando una experiencia consistente y confiable para el usuario.
