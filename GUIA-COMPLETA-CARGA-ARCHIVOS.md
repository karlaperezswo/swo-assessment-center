# Guía Completa - Carga de Archivos en Mapa de Dependencias

## ✅ Verificación Completa del Sistema

### Paso 1: Verificar que el Backend esté Ejecutándose

#### Opción A: Usar el script de prueba
```bash
# Ejecutar el script de prueba
5-PROBAR-CONEXION.bat
```

#### Opción B: Verificación manual
1. Abre una terminal
2. Ejecuta:
```bash
curl http://localhost:4000/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"2024-..."}
```

Si ves un error, el backend NO está ejecutándose.

### Paso 2: Iniciar el Backend (si no está ejecutándose)

#### Opción A: Usar el script automático
```bash
3-INICIAR-PROYECTO.bat
```

#### Opción B: Inicio manual
```bash
# En la carpeta raíz del proyecto
cd backend
npm run dev
```

Deberías ver:
```
Server running on http://localhost:4000
```

### Paso 3: Verificar el Frontend

El frontend debe estar ejecutándose en: http://localhost:3005

Si no está ejecutándose:
```bash
cd frontend
npm run dev
```

## 🔧 Configuración Técnica

### Configuración del Proxy (Vite)
Archivo: `frontend/vite.config.ts`

```typescript
server: {
  host: '0.0.0.0',
  port: 3005,
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  },
}
```

Esto significa que:
- Frontend: http://localhost:3005
- Backend: http://localhost:4000
- Peticiones a `/api/*` se redirigen automáticamente al backend

### Configuración de la API (Frontend)
Archivo: `frontend/src/lib/api.ts`

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Rutas del Backend
Archivo: `backend/src/routes/dependencyRoutes.ts`

```typescript
router.post('/upload', uploadDependencyFile);
router.post('/search', searchDependencies);
router.post('/export', exportDependencies);
```

URL completa: `http://localhost:4000/api/dependencies/upload`

## 📤 Flujo de Carga de Archivos

### 1. Usuario Selecciona Archivo
```
Click en "Seleccionar Archivo"
  ↓
Se abre explorador de archivos
  ↓
Usuario elige archivo .xlsx o .xls
  ↓
handleFileChange() se ejecuta
  ↓
setFile(archivo)
  ↓
Se muestra nombre del archivo
```

### 2. Usuario Hace Click en "Cargar"
```
Click en "Cargar"
  ↓
handleUpload() se ejecuta
  ↓
Validación: ¿Hay archivo?
  ↓
Se crea FormData con el archivo
  ↓
POST a /api/dependencies/upload
```

### 3. Petición HTTP
```
Frontend (localhost:3005)
  ↓
POST /api/dependencies/upload
  ↓
Proxy de Vite intercepta
  ↓
Redirige a http://localhost:4000/api/dependencies/upload
  ↓
Backend recibe la petición
```

### 4. Backend Procesa
```
Multer recibe el archivo
  ↓
req.file.buffer contiene los datos
  ↓
DependencyService.parseDependencyFile()
  ↓
XLSX.read() parsea el Excel
  ↓
Se extraen dependencias
  ↓
Se construye el grafo
  ↓
Se genera sessionId
  ↓
Se guarda en cache
  ↓
Se retorna JSON con datos
```

### 5. Frontend Recibe Respuesta
```
response.data.success === true
  ↓
setSessionId(data.sessionId)
  ↓
setSummary(data.summary)
  ↓
setAllDependencies(data.allDependencies)
  ↓
displayGraph(data.graph)
  ↓
toast.success("Archivo cargado exitosamente")
```

### 6. Usuario Ve Resultados
```
✅ Notificación de éxito
✅ Resumen con estadísticas
✅ Tabla de dependencias
✅ Visualización del grafo
✅ Opciones de búsqueda
✅ Botones de exportación
```

## 🐛 Diagnóstico de Problemas

### Problema 1: "No se pudo conectar con el servidor"

**Síntoma**: Error de red en la consola del navegador

**Causa**: Backend no está ejecutándose

**Solución**:
1. Ejecuta `5-PROBAR-CONEXION.bat`
2. Si falla, ejecuta `3-INICIAR-PROYECTO.bat`
3. Espera a ver "Server running on http://localhost:4000"
4. Intenta cargar el archivo nuevamente

### Problema 2: "Error al procesar archivo"

**Síntoma**: Backend responde con error 500

**Causa**: Archivo Excel con formato incorrecto

**Solución**:
1. Verifica que el archivo sea .xlsx o .xls
2. Abre el archivo en Excel y verifica que tenga columnas como:
   - Source/Origen
   - Destination/Destino
   - Port/Puerto
   - Protocol/Protocolo
3. Revisa los logs del backend en la terminal
4. Prueba con el archivo de ejemplo: `node create-dependency-sample.js`

### Problema 3: "No se proporcionó archivo"

**Síntoma**: Error 400 del backend

**Causa**: El archivo no se está enviando correctamente

**Solución**:
1. Verifica que hayas seleccionado un archivo
2. Verifica que el nombre del archivo aparezca en pantalla
3. Revisa la consola del navegador (F12)
4. Busca el log: "📤 Iniciando carga de archivo: ..."
5. Si no aparece, hay un problema en el frontend

### Problema 4: CORS Error

**Síntoma**: Error de CORS en la consola

**Causa**: Backend no tiene CORS habilitado o puerto incorrecto

**Solución**:
1. Verifica que el backend tenga:
```typescript
app.use(cors());
```
2. Verifica que el proxy de Vite apunte al puerto correcto (4000)
3. Reinicia ambos servidores

## 📊 Logs Esperados

### Consola del Navegador (F12 → Console)
```
📡 API Request: POST /api/dependencies/upload
📤 Iniciando carga de archivo: mi-archivo.xlsx
🔄 Enviando archivo al servidor...
✅ API Response: 200 /api/dependencies/upload
📥 Respuesta del servidor: {success: true, data: {...}}
✅ Datos recibidos: {sessionId: "1234567890", totalDependencies: 50, ...}
🎨 Generando visualización del grafo...
✅ Carga completada exitosamente
🏁 Proceso de carga finalizado
```

### Terminal del Backend
```
📡 API Request: POST /api/dependencies/upload
📊 Analizando 1 pestañas: Sheet1
📋 Columnas en "Sheet1": source, destination, port, protocol, ...
🔍 Procesando pestaña "Sheet1" con 50 filas
✅ Encontradas 50 dependencias en "Sheet1"
✅ Total: 50 dependencias, 20 servidores, 10 aplicaciones
✅ API Response: 200 /api/dependencies/upload
```

## 🧪 Prueba Rápida

### Generar Archivo de Prueba
```bash
node create-dependency-sample.js
```

Esto genera: `sample-dependencies.xlsx`

### Cargar Archivo de Prueba
1. Abre http://localhost:3005
2. Ve a "Mapa de Dependencias"
3. Click en "Seleccionar Archivo"
4. Elige `sample-dependencies.xlsx`
5. Click en "Cargar"
6. Deberías ver:
   - ✅ Notificación de éxito
   - 📊 Estadísticas: 10 dependencias, 8 servidores
   - 📋 Tabla con las dependencias
   - 🎨 Grafo visual

## 📝 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Backend ejecutándose en puerto 4000
- [ ] Frontend ejecutándose en puerto 3005
- [ ] Script de prueba pasa: `5-PROBAR-CONEXION.bat`
- [ ] Archivo Excel válido seleccionado
- [ ] Nombre del archivo visible en pantalla
- [ ] Consola del navegador abierta (F12)
- [ ] Logs visibles en consola del navegador
- [ ] Logs visibles en terminal del backend
- [ ] No hay errores de CORS
- [ ] No hay errores de red

## 🆘 Soporte

Si después de seguir todos estos pasos el problema persiste:

1. Ejecuta: `5-PROBAR-CONEXION.bat`
2. Copia el resultado
3. Abre la consola del navegador (F12)
4. Intenta cargar un archivo
5. Copia todos los logs de la consola
6. Copia los logs de la terminal del backend
7. Incluye esta información al reportar el problema

## 🎯 Resumen

El botón "Cargar" está completamente configurado y funcional. Para que funcione:

1. ✅ Backend debe estar ejecutándose (puerto 4000)
2. ✅ Frontend debe estar ejecutándose (puerto 3005)
3. ✅ Proxy de Vite configurado correctamente
4. ✅ Archivo Excel válido seleccionado
5. ✅ Click en "Cargar"

Si todos estos requisitos se cumplen, el archivo se cargará exitosamente y verás los resultados en pantalla.
