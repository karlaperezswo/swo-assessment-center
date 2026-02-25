# Diagnóstico de Carga de Archivos - Mapa de Dependencias

## Mejoras Implementadas

### 1. Logging Detallado
La función `handleUpload` ahora incluye logs en consola para cada paso:

- 📤 Inicio de carga con nombre del archivo
- 🔄 Envío al servidor
- 📥 Respuesta del servidor
- ✅ Datos recibidos (sessionId, dependencias, servidores, nodos, edges)
- 🎨 Generación de visualización
- ✅ Confirmación de éxito
- 🏁 Finalización del proceso

### 2. Manejo de Errores Mejorado

#### Tipos de Errores Detectados:

**Error del Servidor (error.response)**
- Muestra: "Error del servidor"
- Descripción: Mensaje específico del backend
- Ejemplo: "No se encontraron dependencias válidas"

**Error de Red (error.request)**
- Muestra: "Error de conexión"
- Descripción: "No se pudo conectar con el servidor"
- Causa común: Backend no está ejecutándose

**Otros Errores**
- Muestra: "Error al procesar archivo"
- Descripción: Mensaje del error específico

### 3. Notificaciones Mejoradas

#### Éxito
```
✅ Archivo cargado exitosamente
X dependencias encontradas de Y servidores únicos
```

#### Error
- Título descriptivo según tipo de error
- Descripción detallada del problema
- Duración de 7 segundos para errores

## Cómo Diagnosticar Problemas

### Paso 1: Verificar Backend
Asegúrate de que el backend esté ejecutándose:

```bash
# En la carpeta raíz del proyecto
npm run dev
# o
node backend/dist/index.js
```

Deberías ver:
```
Server running on http://localhost:4000
```

### Paso 2: Verificar Consola del Navegador
Abre las DevTools (F12) y ve a la pestaña Console.

Al cargar un archivo, deberías ver:
```
📤 Iniciando carga de archivo: nombre-archivo.xlsx
🔄 Enviando archivo al servidor...
📥 Respuesta del servidor: {success: true, data: {...}}
✅ Datos recibidos: {sessionId: "...", totalDependencies: X, ...}
🎨 Generando visualización del grafo...
✅ Carga completada exitosamente
🏁 Proceso de carga finalizado
```

### Paso 3: Identificar Errores Comunes

#### Error: "No se pudo conectar con el servidor"
**Causa**: Backend no está ejecutándose
**Solución**: 
1. Abre una terminal
2. Navega a la carpeta del proyecto
3. Ejecuta `npm run dev` o inicia el backend manualmente

#### Error: "No se encontraron dependencias válidas"
**Causa**: El archivo Excel no tiene el formato esperado
**Solución**:
1. Verifica que el archivo sea .xlsx o .xls
2. Asegúrate de que tenga columnas con nombres como:
   - Source/Origen
   - Destination/Destino
   - Port/Puerto
   - Protocol/Protocolo

#### Error: "Error al procesar archivo"
**Causa**: Archivo corrupto o formato incorrecto
**Solución**:
1. Verifica que el archivo no esté corrupto
2. Intenta con otro archivo de ejemplo
3. Revisa los logs del backend en la terminal

### Paso 4: Verificar Logs del Backend
En la terminal donde corre el backend, deberías ver:

```
📊 Analizando X pestañas: Sheet1, Sheet2, ...
📋 Columnas en "Sheet1": source, destination, port, ...
🔍 Procesando pestaña "Sheet1" con X filas
✅ Encontradas X dependencias en "Sheet1"
✅ Total: X dependencias, Y servidores, Z aplicaciones
```

## Flujo Completo de Carga

1. **Usuario selecciona archivo**
   - Click en "Seleccionar Archivo"
   - Elige archivo .xlsx o .xls
   - Se muestra nombre del archivo

2. **Usuario hace click en "Cargar"**
   - Se valida que hay archivo seleccionado
   - Se crea FormData con el archivo
   - Se envía POST a `/api/dependencies/upload`

3. **Backend procesa archivo**
   - Recibe archivo
   - Parsea Excel con XLSX
   - Extrae dependencias
   - Construye grafo
   - Retorna datos

4. **Frontend recibe respuesta**
   - Guarda sessionId
   - Guarda summary
   - Guarda dependencias
   - Genera visualización del grafo
   - Muestra notificación de éxito

5. **Usuario ve resultados**
   - Resumen con estadísticas
   - Tabla de todas las dependencias
   - Visualización del grafo
   - Opciones de búsqueda y exportación

## Verificación de Funcionamiento

### Checklist
- [ ] Backend ejecutándose en puerto 4000
- [ ] Frontend ejecutándose en puerto 5173
- [ ] Archivo Excel válido seleccionado
- [ ] Click en botón "Cargar"
- [ ] Ver logs en consola del navegador
- [ ] Ver notificación de éxito
- [ ] Ver estadísticas en pantalla
- [ ] Ver tabla de dependencias
- [ ] Ver grafo de visualización

### Prueba Rápida
1. Usa el archivo de ejemplo: `create-dependency-sample.js`
2. Ejecuta: `node create-dependency-sample.js`
3. Se genera: `sample-dependencies.xlsx`
4. Carga este archivo en la aplicación
5. Deberías ver dependencias de ejemplo

## Solución de Problemas Avanzados

### Backend no responde
```bash
# Verificar que el puerto 4000 esté libre
netstat -ano | findstr :4000

# Si está ocupado, cambiar puerto en backend/.env
PORT=4001
```

### CORS Error
Verifica que el backend tenga CORS habilitado:
```typescript
app.use(cors());
```

### Archivo muy grande
Aumenta el límite en backend:
```typescript
app.use(express.json({ limit: '50mb' }));
```

## Contacto y Soporte

Si después de seguir estos pasos el problema persiste:
1. Copia los logs de la consola del navegador
2. Copia los logs de la terminal del backend
3. Describe el problema específico
4. Incluye el tipo de archivo que intentas cargar
