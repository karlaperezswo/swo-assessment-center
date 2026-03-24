# 📊 Guía de Uso: Wave Planner Tool con Carga de Excel

## ✅ Funcionalidad Implementada

Se ha agregado la capacidad de cargar archivos Excel al Wave Planner Tool para generar automáticamente olas de migración basadas en:
- **Criticidad**: Baja, Media, Alta
- **Ambiente**: Test, Dev, Prod, QA, UAT, Staging

## 🚀 Cómo Usar

### 1. Acceder al Wave Planner Tool

1. Abre la aplicación en tu navegador
2. Ve a la fase de **Migrate**
3. Carga un archivo MPA o de dependencias
4. Haz clic en el botón verde **"Wave Planner Tool"**

### 2. Cargar Archivo Excel

En la ventana del Wave Planner Tool verás una sección verde en la parte superior:

**Opción A: Drag & Drop**
- Arrastra tu archivo Excel (.xlsx o .xls) directamente a la zona verde
- El archivo se procesará automáticamente

**Opción B: Selección Manual**
- Haz clic en la zona verde
- Selecciona tu archivo Excel desde el explorador de archivos

### 3. Formato del Archivo Excel

Tu archivo Excel debe contener las siguientes columnas (el sistema acepta variaciones):

| Columna | Variaciones Aceptadas | Valores Válidos | Ejemplo |
|---------|----------------------|-----------------|---------|
| **ServerName** | Server Name, Hostname, HOSTNAME, Server | Cualquier texto | WEB-SERVER-01 |
| **Criticidad** | Criticality, Priority | Baja/Low, Media/Medium, Alta/High/Critical | Alta |
| **Ambiente** | Environment, Env | Test, Dev, QA, UAT, Staging, Prod, Producción | Prod |
| **Dependencia** | Dependencies | Nombres de servidores separados por comas | DB-SERVER-01 |

#### Ejemplo de Datos:

```
ServerName          | Criticidad | Ambiente | Dependencia
--------------------|------------|----------|------------------
WEB-SERVER-TEST-01  | Baja       | Test     | APP-SERVER-TEST-01
APP-SERVER-TEST-01  | Media      | Test     | DB-SERVER-TEST-01
DB-SERVER-TEST-01   | Alta       | Test     |
WEB-SERVER-PROD-01  | Baja       | Prod     | APP-SERVER-PROD-01
APP-SERVER-PROD-01  | Media      | Prod     | DB-SERVER-PROD-01
DB-SERVER-PROD-01   | Alta       | Prod     |
```

### 4. Algoritmo de Asignación de Olas

El sistema asigna olas automáticamente siguiendo esta lógica:

#### Fase 1: Ambientes No Productivos (Test/Dev/QA/UAT/Staging)
- **Ola 1**: Servidores Test/Dev con Criticidad Baja
- **Ola 2**: Servidores Test/Dev con Criticidad Media
- **Ola 3**: Servidores Test/Dev con Criticidad Alta

#### Fase 2: Ambientes Productivos (Prod)
- **Ola 4**: Servidores Prod con Criticidad Baja
- **Ola 5**: Servidores Prod con Criticidad Media
- **Ola 6**: Servidores Prod con Criticidad Alta

**Nota**: Si no hay servidores en alguna categoría, esa ola se omite y la numeración se ajusta automáticamente.

### 5. Ajustar Olas Manualmente

Después de la asignación automática, puedes:

1. **Cambiar la ola de un servidor**: Usa el selector desplegable al lado de cada servidor
2. **Ver detalles por ola**: Selecciona una ola en el panel derecho para ver todos sus servidores
3. **Reasignar automáticamente**: Haz clic en el botón "Auto-asignar" para volver a aplicar el algoritmo

### 6. Visualización

El panel derecho muestra:
- **Total de servidores** por ola
- **Distribución por criticidad** (🟢 Baja, 🟠 Media, 🔴 Alta)
- **Lista detallada** de servidores con su ambiente y dependencias
- **Resumen ejecutivo** en tabla al final

### 7. Exportar Plan

Una vez satisfecho con la planificación:

1. Haz clic en el botón **"Descargar Plan (CSV)"**
2. Se descargará un archivo `map_wave_plan.csv` con:
   - ServerName
   - Criticidad
   - Ambiente
   - Ola asignada
   - Dependencias

## 📝 Archivo de Ejemplo

Se ha creado un archivo de ejemplo: `ejemplo-servidores-wave-planner.csv`

Para usarlo:
1. Abre Excel o Google Sheets
2. Importa el archivo CSV
3. Guárdalo como `.xlsx`
4. Cárgalo en el Wave Planner Tool

O puedes crear tu propio archivo Excel con las columnas mencionadas.

## 🎯 Casos de Uso

### Caso 1: Migración Gradual
```
Test → Dev → Prod
Baja → Media → Alta (dentro de cada ambiente)
```

### Caso 2: Migración por Criticidad
```
Todos los ambientes: Baja primero
Todos los ambientes: Media después
Todos los ambientes: Alta al final
```

### Caso 3: Migración Mixta
```
Combina ambos enfoques usando el ajuste manual
```

## ⚠️ Notas Importantes

1. **Normalización Automática**: El sistema normaliza automáticamente:
   - "Low" → "Baja"
   - "High" / "Critical" → "Alta"
   - "Medium" → "Media"

2. **Detección de Ambiente**: El sistema detecta automáticamente:
   - Test, Dev, QA, UAT, Staging → Ambientes no productivos
   - Prod, Producción → Ambientes productivos

3. **Dependencias**: Las dependencias se muestran pero no afectan la asignación automática de olas. Debes ajustar manualmente si un servidor depende de otro en una ola posterior.

4. **Validación**: El sistema valida que:
   - El archivo no esté vacío
   - Existan servidores con nombres válidos
   - Las columnas requeridas estén presentes

## 🔧 Solución de Problemas

### "El archivo Excel está vacío"
- Verifica que la hoja tenga datos
- Asegúrate de que la hoja se llame "Servers", "servers", o sea la primera hoja

### "No se encontraron servidores válidos"
- Verifica que la columna ServerName tenga valores
- Asegúrate de que no todos los nombres estén vacíos

### "Error al procesar el archivo"
- Verifica que el archivo sea .xlsx o .xls válido
- Intenta guardar el archivo nuevamente desde Excel
- Verifica que no haya caracteres especiales problemáticos

## 📊 Beneficios

✅ **Automatización**: Genera olas automáticamente en segundos
✅ **Flexibilidad**: Ajusta manualmente cualquier asignación
✅ **Visualización**: Ve claramente la distribución de servidores
✅ **Exportación**: Descarga el plan final para compartir
✅ **Validación**: Detecta errores en los datos de entrada
✅ **Inteligencia**: Separa ambientes y prioriza por criticidad

---

**Última actualización**: Implementación completada
**Archivos modificados**: 
- `frontend/src/components/migrate/WavePlannerTool.tsx`
- `AGREGAR-CARGA-EXCEL-WAVE-PLANNER.md` (documentación técnica)
