# Migration Planner Conectado con Dependencias

## ✅ Cambios Implementados

### 1. Cambio de Nombre del Botón
- **Antes**: "Abrir Planificador Visual"
- **Ahora**: "Migration Planner"
- **Ubicación**: `frontend/src/components/migrate/MigrationWaves.tsx`

### 2. Conexión con Datos de Dependencias
- El componente `MigrationWaves` ahora recibe `dependencyData` como prop
- Los datos se pasan automáticamente desde `AssessPhase` → `MigrationWaves` → `MigrationPlanner`
- El Migration Planner ahora usa las dependencias reales del archivo MPA cargado

### 3. Algoritmo de Criticidad Implementado

#### Niveles de Criticidad (Score):
- **🔴 Alta (70-90)**: Migrar al final
  - Database/SQL: 90
  - Auth/LDAP/AD: 85
  - Storage/S3: 80
  - Cache/Redis: 75
  - Queue/Kafka: 70

- **🟡 Media (40-60)**: Migrar en medio
  - API/REST: 50
  - App: 45
  - Base + dependientes: 40 + (5 × número de dependientes)

- **🟢 Baja (15-30)**: Migrar primero
  - Analytics/BI: 30
  - Web/Nginx: 25
  - CDN: 20
  - Test/Dev/Staging: 15

#### Lógica del Algoritmo:
1. Construye el grafo de dependencias
2. Calcula la criticidad de cada servidor
3. Agrupa servidores por wave respetando dependencias
4. **Dentro de cada wave, ordena por criticidad ascendente** (menos críticos primero)
5. Asigna colores diferentes a cada wave usando `WAVE_COLORS`

### 4. Visualización de Mapas por Ola

#### Funcionalidades:
- **Click en una Wave**: Muestra solo las dependencias de esa ola
- **Indicador visual**: Badge "📊 Mapa activo" cuando una wave está seleccionada
- **Resaltado inteligente**:
  - Nodos de la wave: 100% opacidad
  - Nodos relacionados: 100% opacidad
  - Otros nodos: 15% opacidad
  - Edges relacionados: 80% opacidad, grosor 2.5
  - Otros edges: 10% opacidad

- **Indicador de criticidad**: Cada servidor muestra su nivel de criticidad
  - 🔴 Alta
  - 🟡 Media
  - 🟢 Baja

### 5. Colores por Wave
Cada wave tiene un color único del array `WAVE_COLORS`:
1. Wave 1: Verde (#48bb78)
2. Wave 2: Azul (#4299e1)
3. Wave 3: Naranja (#ed8936)
4. Wave 4: Morado (#9f7aea)
5. Wave 5: Rojo (#f56565)
6. Wave 6: Teal (#38b2ac)
7. Wave 7: Amarillo (#ecc94b)
8. Wave 8: Rosa (#ed64a6)

## 📋 Flujo de Datos

```
Rapid Discovery (carga MPA)
    ↓
App.tsx (almacena dependencyData)
    ↓
AssessPhase (recibe dependencyData)
    ↓
MigrationWaves (recibe dependencyData)
    ↓
MigrationPlanner (usa dependencyData.dependencies)
    ↓
Calcula waves con criticidad
    ↓
Visualiza con Vis.js
```

## 🎯 Características Principales

### Generación Automática de Olas
- Se calculan automáticamente al abrir el Migration Planner
- Considera dependencias topológicas
- Ordena por criticidad dentro de cada wave
- Detecta dependencias circulares

### Visualización Interactiva
- Grafo de red con Vis.js
- Colores por wave
- Iconos por tipo de servidor
- Tooltips con información detallada
- Filtrado por wave
- Selección de servidor individual

### Exportación
- Exportar a CSV con:
  - Nombre del servidor
  - Tipo de servidor
  - Wave asignada
  - Lista de dependencias

## 🚀 Cómo Usar

1. **Cargar archivo MPA** en Rapid Discovery
2. **Ir a Planificación de Olas** en el módulo Assess
3. **Click en "Migration Planner"**
4. **Ver waves calculadas automáticamente** en el panel izquierdo
5. **Click en una wave** para ver su mapa de dependencias
6. **Click en un servidor** para ver sus dependencias específicas
7. **Exportar a CSV** si necesitas el plan en formato tabular

## 📊 Información Mostrada

### Panel Izquierdo
- Estadísticas generales (servidores, conexiones, waves)
- Lista de waves con colores
- Servidores por wave con criticidad
- Indicador de mapa activo
- Detalles del servidor seleccionado

### Panel Derecho
- Mapa de dependencias completo o filtrado por wave
- Visualización con colores por wave
- Flechas indicando dirección de dependencias
- Leyenda de colores

## 🔧 Archivos Modificados

1. `frontend/src/components/migrate/MigrationWaves.tsx`
   - Agregado prop `dependencyData`
   - Cambiado texto del botón
   - Pasando dependencias reales al MigrationPlanner

2. `frontend/src/components/MigrationPlanner.tsx`
   - Agregada función `getServerCriticality()`
   - Actualizado algoritmo `calculateWaves()` con criticidad
   - Mejorada función `filterByWave()` para mostrar mapas por ola
   - Agregados indicadores visuales de criticidad
   - Mejorado resaltado de dependencias por wave

3. `frontend/src/components/phases/AssessPhase.tsx`
   - Pasando `dependencyData` a `MigrationWaves`

## ✨ Mejoras Implementadas

- ✅ Botón renombrado a "Migration Planner"
- ✅ Conectado con datos reales de dependencias
- ✅ Algoritmo de criticidad implementado
- ✅ Servidores menos críticos migran primero
- ✅ Mapa de dependencias por ola
- ✅ Colores diferentes por wave
- ✅ Indicadores visuales de criticidad
- ✅ Resaltado inteligente de dependencias
- ✅ Exportación a CSV con criticidad

## 🎨 Experiencia de Usuario

1. **Automático**: Las waves se calculan automáticamente
2. **Visual**: Colores y iconos facilitan la comprensión
3. **Interactivo**: Click para explorar waves y servidores
4. **Informativo**: Muestra criticidad y dependencias
5. **Exportable**: Genera CSV para documentación

## 📝 Notas Técnicas

- El algoritmo respeta las dependencias topológicas
- Dentro de cada wave, los servidores se ordenan por criticidad
- Los servidores con más dependientes son más críticos
- Las dependencias circulares se detectan y agrupan en la última wave
- El mapa se actualiza dinámicamente al seleccionar una wave
