# ✅ Funcionalidad Automática: Dependencias y Olas de Migración

## 🎯 Objetivo Completado

Cuando se sube un archivo MPA en el módulo **Rapid Discovery**, el sistema ahora:

1. ✅ Parsea automáticamente las dependencias de la pestaña "Server Communication"
2. ✅ Calcula automáticamente las olas de migración basadas en las dependencias
3. ✅ Carga los datos en el módulo **Mapa de Dependencias**
4. ✅ Genera las olas en el módulo **Planificación de Olas**

---

## 🔄 Flujo Automático

### 1. Subida de Archivo MPA (Rapid Discovery)

Cuando el usuario sube un archivo Excel MPA:

```
Usuario → Rapid Discovery → S3 → Backend Processing
```

### 2. Procesamiento Backend

El backend automáticamente:

- **Parsea el archivo Excel** (servidores, bases de datos, aplicaciones)
- **Extrae dependencias** de la pestaña "Server Communication"
  - Source Server ID
  - Target Server ID
  - Communication Port
  - Target Process ID
  - Protocol
- **Calcula olas de migración** usando algoritmo topológico
  - Wave 1: Servidores sin dependencias (infraestructura base)
  - Wave N: Servidores que dependen de waves anteriores
  - Detecta y maneja dependencias circulares

### 3. Respuesta al Frontend

El backend retorna:

```json
{
  "success": true,
  "data": {
    "excelData": { ... },
    "summary": { ... },
    "dependencyData": {
      "dependencies": [...],
      "servers": [...],
      "applications": [...],
      "databasesWithoutDependencies": [...],
      "summary": {
        "totalDependencies": 150,
        "uniqueServers": 45,
        "uniqueApplications": 12,
        "uniquePorts": 8
      }
    },
    "migrationWaves": {
      "waves": [
        {
          "waveNumber": 1,
          "servers": ["db-server-01", "cache-server-02"],
          "serverCount": 2
        },
        {
          "waveNumber": 2,
          "servers": ["api-server-01", "api-server-02"],
          "serverCount": 2
        }
      ],
      "totalServers": 45,
      "totalWaves": 5,
      "serversWithoutDependencies": 2
    }
  }
}
```

### 4. Actualización Automática del Frontend

El frontend automáticamente:

- **Guarda las dependencias** en el estado global
- **Convierte las olas calculadas** al formato MigrationWave
- **Carga el Mapa de Dependencias** con los datos parseados
- **Genera las olas** en Planificación de Olas
- **Muestra notificación** al usuario

---

## 📊 Módulo: Mapa de Dependencias

### Carga Automática

Cuando hay datos de dependencias disponibles:

```typescript
// Se cargan automáticamente al entrar al módulo
- Resumen de dependencias
- Lista de servidores
- Lista de aplicaciones
- Grafo de dependencias visualizado
- Bases de datos sin dependencias
```

### Visualización

- **Grafo jerárquico** de abajo hacia arriba
- **Colores por nivel** (Verde → Cyan → Naranja → Azul → Morado)
- **Nodos compactos** con información del servidor
- **Edges con opacidad** mostrando protocolo y puerto
- **Leyenda interactiva** por niveles

### Funcionalidades Disponibles

- ✅ Ver grafo completo de dependencias
- ✅ Buscar servidor específico
- ✅ Ver dependencias entrantes y salientes
- ✅ Exportar a Word/PDF
- ✅ Ver bases de datos sin dependencias
- ✅ Tabla paginada y ordenable

---

## 🌊 Módulo: Planificación de Olas

### Generación Automática

Las olas se generan automáticamente con:

```typescript
{
  waveNumber: 1,
  name: "Wave 1 - Base Infrastructure",
  serverCount: 2,
  servers: ["db-server-01", "cache-server-02"],
  status: "planned",
  strategy: "Rehost",
  notes: "Servidores: db-server-01, cache-server-02"
}
```

### Características

- **Wave 1**: Servidores sin dependencias (infraestructura base)
- **Wave N**: Servidores que dependen de waves anteriores
- **Contador automático** de servidores por wave
- **Lista de servidores** en las notas
- **Estado inicial**: "planned"
- **Estrategia por defecto**: "Rehost"

### Edición Manual

El usuario puede:

- ✅ Editar fechas de inicio y fin
- ✅ Cambiar estrategia de migración
- ✅ Cambiar estado (planned → in_progress → completed → blocked)
- ✅ Agregar/eliminar waves manualmente
- ✅ Mover servidores entre waves (drag & drop en Migration Planner)

---

## 🔧 Algoritmo de Cálculo de Olas

### Lógica Topológica

```
1. Identificar servidores sin dependencias → Wave 1

2. Para cada servidor restante:
   - Si todas sus dependencias están asignadas:
     * Wave = max(wave de dependencias) + 1
   
3. Manejar dependencias circulares:
   - Asignar a wave siguiente
   - Registrar en logs
```

### Ejemplo

```
Dependencias:
- web-server → api-server → db-server
- cache-server (sin dependencias)

Resultado:
Wave 1: db-server, cache-server (sin dependencias)
Wave 2: api-server (depende de db-server)
Wave 3: web-server (depende de api-server)
```

---

## 📁 Archivos Modificados

### Backend

1. **`backend/src/services/dependencyService.ts`**
   - ✅ Agregada interfaz `WaveGroup`
   - ✅ Agregada interfaz `MigrationWaveCalculation`
   - ✅ Agregado método `calculateMigrationWaves()`

2. **`backend/src/controllers/reportController.ts`**
   - ✅ Importado `DependencyService`
   - ✅ Agregado parsing de dependencias en `uploadExcelFromS3`
   - ✅ Agregado cálculo de olas en `uploadExcelFromS3`
   - ✅ Incluido `dependencyData` y `migrationWaves` en respuesta

### Frontend

3. **`frontend/src/components/FileUploader.tsx`**
   - ✅ Actualizada interfaz para recibir `dependencyData` y `migrationWaves`
   - ✅ Actualizado callback `onDataLoaded` con nuevos parámetros
   - ✅ Mejorado mensaje de éxito con info de olas

4. **`frontend/src/components/assess/RapidDiscovery.tsx`**
   - ✅ Actualizada interfaz `RapidDiscoveryProps`
   - ✅ Propagación de nuevos parámetros

5. **`frontend/src/components/phases/AssessPhase.tsx`**
   - ✅ Agregada prop `dependencyData`
   - ✅ Pasada a `DependencyMap`

6. **`frontend/src/components/DependencyMap.tsx`**
   - ✅ Agregada interfaz `DependencyMapProps`
   - ✅ Agregado `useEffect` para carga automática
   - ✅ Agregado método `buildGraphFromDependencies`
   - ✅ Notificación de carga exitosa

7. **`frontend/src/App.tsx`**
   - ✅ Agregado estado `dependencyData`
   - ✅ Agregado estado `autoCalculatedWaves`
   - ✅ Actualizado `handleDataLoaded` para procesar dependencias y olas
   - ✅ Conversión automática de olas a formato `MigrationWave`
   - ✅ Notificación toast de olas calculadas
   - ✅ Pasada prop `dependencyData` a `AssessPhase`

---

## 🎨 Experiencia de Usuario

### Flujo Completo

1. **Usuario sube archivo MPA** en Rapid Discovery
   ```
   📤 Subiendo archivo...
   ⚙️  Analizando datos...
   ```

2. **Sistema procesa automáticamente**
   ```
   ✅ AWS MPA cargado: 45 servidores, 12 bases de datos, 150 conexiones, 5 olas de migración calculadas
   ```

3. **Usuario navega a Mapa de Dependencias**
   ```
   ✅ Dependencias cargadas automáticamente
   📊 150 dependencias, 45 servidores
   🎨 Grafo visualizado automáticamente
   ```

4. **Usuario navega a Planificación de Olas**
   ```
   ✅ 5 olas de migración generadas automáticamente
   📋 Wave 1 - Base Infrastructure: 2 servidores
   📋 Wave 2: 8 servidores
   📋 Wave 3: 15 servidores
   ...
   ```

---

## 🧪 Pruebas

### Para Probar la Funcionalidad

1. **Iniciar el proyecto**
   ```bash
   3-INICIAR-PROYECTO.bat
   ```

2. **Abrir la aplicación**
   ```
   http://localhost:3005
   ```

3. **Ir a Assess → Rapid Discovery**

4. **Subir archivo MPA** con pestaña "Server Communication"

5. **Verificar notificaciones**
   - ✅ Archivo cargado con éxito
   - ✅ Número de olas calculadas

6. **Ir a Assess → Mapa de Dependencias**
   - ✅ Grafo cargado automáticamente
   - ✅ Resumen de dependencias visible
   - ✅ Búsqueda de servidores funcional

7. **Ir a Assess → Planificación de Olas**
   - ✅ Olas generadas automáticamente
   - ✅ Contador de servidores por wave
   - ✅ Lista de servidores en notas

---

## 📝 Notas Técnicas

### Manejo de Errores

- Si el archivo no tiene pestaña "Server Communication", continúa sin dependencias
- Logs de advertencia en consola
- No bloquea la carga del archivo

### Dependencias Circulares

- Detectadas automáticamente
- Asignadas a wave siguiente
- Registradas en logs del servidor

### Performance

- Parsing optimizado con streams
- Cálculo de olas en O(n log n)
- Visualización con React Flow (optimizado para grafos grandes)

---

## 🚀 Próximas Mejoras Sugeridas

1. **Edición de Olas**
   - Drag & drop de servidores entre waves
   - Recalcular dependencias al mover

2. **Validación de Olas**
   - Verificar que dependencias estén en waves anteriores
   - Alertas de conflictos

3. **Exportación**
   - Exportar plan de olas a CSV/Excel
   - Incluir dependencias por servidor

4. **Visualización Avanzada**
   - Filtros por wave en el grafo
   - Highlight de servidores de una wave específica

---

**Fecha de Implementación**: 2026-02-26
**Implementado por**: Kiro AI Assistant
**Estado**: ✅ Completado y Funcional
