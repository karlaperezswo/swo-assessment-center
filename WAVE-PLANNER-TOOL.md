# 🚀 Wave Planner Tool - Guía de Uso

## 📋 Descripción

El **Wave Planner Tool** es una herramienta interactiva para planificar olas de migración AWS MAP, inspirada en la funcionalidad de Streamlit pero integrada nativamente en la aplicación React.

## ✨ Características

### 1. Clasificación Automática Inicial
- Asignación automática de servidores a olas basada en criticidad
- **Ola 1**: Servidores de criticidad Baja
- **Ola 2**: Servidores de criticidad Media  
- **Ola 3**: Servidores de criticidad Alta

### 2. Ajuste Dinámico
- Cambio manual de servidores entre olas mediante selectores
- Actualización en tiempo real de estadísticas
- Visualización inmediata de cambios

### 3. Visualización por Ola
- Selector de ola para ver detalles específicos
- Conteo de servidores por ola
- Distribución por criticidad (Baja/Media/Alta)
- Lista detallada de servidores en cada ola
- Visualización de dependencias

### 4. Resumen Ejecutivo
- Tabla consolidada con todas las olas
- Estadísticas por criticidad
- Totales generales

### 5. Exportación
- Descarga del plan final en formato CSV
- Incluye: ServerName, Criticidad, Ola, Dependencia

## 🎯 Cómo Usar

### Paso 1: Acceder a la Herramienta

1. Ve al módulo **Migrate** → **Migration Waves**
2. Haz clic en el botón verde **"Wave Planner Tool"**
3. Se abrirá el planificador en modal a pantalla completa

### Paso 2: Revisar Clasificación Automática

Al abrir, la herramienta:
- Clasifica automáticamente los servidores por criticidad
- Asigna olas iniciales (Ola 1, 2, 3)
- Muestra el inventario completo en el panel izquierdo

### Paso 3: Ajustar Olas Manualmente

**En el panel izquierdo (Inventario):**
- Cada servidor tiene un selector de ola
- Cambia la ola de cualquier servidor usando el dropdown
- Los cambios se reflejan inmediatamente en las estadísticas

**Botón "Auto-asignar":**
- Restablece la clasificación automática
- Útil para empezar de nuevo

### Paso 4: Visualizar por Ola

**En el panel derecho (Visualización):**
- Selecciona una ola del dropdown superior
- Ve el total de servidores en esa ola
- Revisa la distribución por criticidad (🟢🟠🔴)
- Explora la lista detallada de servidores
- Identifica dependencias entre servidores

### Paso 5: Revisar Resumen

**Tabla de Resumen:**
- Vista consolidada de todas las olas
- Totales por ola y criticidad
- Fácil identificación de desbalances

### Paso 6: Exportar Plan

1. Haz clic en **"Descargar Plan (CSV)"**
2. Se descarga `map_wave_plan.csv`
3. Contiene toda la planificación actualizada

## 📊 Formato de Datos

### Entrada Esperada

El componente espera un array de servidores con esta estructura:

```typescript
interface Server {
  ServerName: string;           // Nombre del servidor
  Criticidad: 'Baja' | 'Media' | 'Alta';  // Nivel de criticidad
  Ola: string;                  // Ola asignada (ej: "Ola 1")
  Dependencia?: string;         // Dependencias (opcional)
}
```

### Salida CSV

El archivo CSV exportado contiene:

```csv
ServerName,Criticidad,Ola,Dependencia
WEB-SERVER-01,Baja,Ola 1,APP-SERVER-01
APP-SERVER-01,Media,Ola 2,DB-SERVER-01
DB-SERVER-01,Alta,Ola 3,
```

## 🎨 Interfaz

### Colores de Criticidad

- 🟢 **Verde**: Criticidad Baja
- 🟠 **Naranja**: Criticidad Media
- 🔴 **Rojo**: Criticidad Alta

### Paneles

1. **Panel Izquierdo**: Inventario completo con selectores de ola
2. **Panel Derecho**: Visualización detallada de ola seleccionada
3. **Panel Inferior**: Tabla de resumen ejecutivo

## 🔧 Integración

### Ubicación del Botón

El botón está en:
```
Migrate → Migration Waves → "Wave Planner Tool" (botón verde)
```

### Props del Componente

```typescript
interface WavePlannerToolProps {
  servers: Server[];              // Array de servidores
  onClose: () => void;            // Callback para cerrar
  onWavesUpdate?: (waves: MigrationWave[]) => void;  // Opcional
}
```

### Uso en Código

```tsx
import { WavePlannerTool } from '@/components/migrate/WavePlannerTool';

// En tu componente
{showWaveTool && dependencyData?.servers && (
  <WavePlannerTool
    servers={dependencyData.servers}
    onClose={() => setShowWaveTool(false)}
    onWavesUpdate={onWavesChange}
  />
)}
```

## 📈 Casos de Uso

### 1. Planificación Inicial
- Carga tu archivo MPA
- Abre Wave Planner Tool
- Revisa la clasificación automática
- Ajusta según necesidades del negocio

### 2. Rebalanceo de Olas
- Identifica olas sobrecargadas
- Mueve servidores entre olas
- Verifica distribución en tiempo real

### 3. Análisis de Dependencias
- Selecciona una ola
- Revisa dependencias de cada servidor
- Asegura que dependencias estén en olas anteriores

### 4. Documentación
- Exporta el plan final a CSV
- Comparte con stakeholders
- Usa como input para herramientas de migración

## 🚀 Ventajas vs Streamlit

### Integración Nativa
- No requiere servidor Python separado
- Funciona directamente en la aplicación React
- Sin necesidad de cambiar de herramienta

### Performance
- Actualización instantánea de UI
- Sin recargas de página
- Experiencia fluida

### Consistencia
- Mismo look & feel que el resto de la app
- Componentes UI reutilizables
- Estilos coherentes

### Datos Compartidos
- Usa los mismos datos cargados en la app
- No requiere re-upload de archivos
- Sincronización automática

## 🔄 Flujo de Trabajo Completo

```
1. Cargar archivo MPA en Rapid Discovery
   ↓
2. Ir a Migrate → Migration Waves
   ↓
3. Click en "Wave Planner Tool"
   ↓
4. Revisar clasificación automática
   ↓
5. Ajustar olas manualmente según necesidad
   ↓
6. Visualizar cada ola y sus dependencias
   ↓
7. Revisar resumen ejecutivo
   ↓
8. Exportar plan final a CSV
   ↓
9. Usar CSV para ejecutar migración
```

## 📝 Notas Técnicas

### Estado Local
- El componente mantiene su propio estado
- Los cambios no afectan otros módulos hasta exportar
- Permite experimentar sin riesgo

### Algoritmo de Auto-asignación
```typescript
// Ordenamiento por criticidad
sorted = servers.sort((a, b) => 
  getCriticidadScore(a.Criticidad) - getCriticidadScore(b.Criticidad)
);

// Asignación
Baja → Ola 1
Media → Ola 2
Alta → Ola 3
```

### Responsividad
- Layout adaptativo (grid 1 o 2 columnas)
- Scroll independiente en cada panel
- Modal a pantalla completa en móviles

## 🎯 Próximas Mejoras

- [ ] Visualización de grafo de dependencias con Vis.js
- [ ] Drag & drop entre olas
- [ ] Validación de dependencias (alertas si dependencia en ola posterior)
- [ ] Estimación de duración por ola
- [ ] Exportación a Excel con múltiples hojas
- [ ] Importación de plan existente
- [ ] Historial de cambios (undo/redo)
- [ ] Sugerencias automáticas basadas en dependencias

## 📞 Soporte

Para problemas o preguntas:
1. Verifica que los datos de servidores estén cargados
2. Revisa la consola del navegador para errores
3. Asegúrate de que cada servidor tenga los campos requeridos

---

**Versión**: 1.0.0  
**Fecha**: 2026-03-06  
**Desarrollado por**: Kiro AI Assistant  
**Proyecto**: AWS Migration Assessment Platform
