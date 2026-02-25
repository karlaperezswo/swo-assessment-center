# Módulo de Mapa de Dependencias - Instalación y Uso

## 🎯 Descripción

Módulo completo para visualizar y analizar dependencias de red entre servidores. Compatible con archivos Excel de herramientas MPA (Matilda, Cloudamize, Concierto).

## 📦 Archivos Creados

### Backend
- `backend/src/controllers/dependencyController.ts` - Controlador de API
- `backend/src/services/dependencyService.ts` - Lógica de negocio
- `backend/src/services/parsers/DependencyParser.ts` - Parser de Excel
- `backend/src/routes/dependencyRoutes.ts` - Rutas de API

### Frontend
- `frontend/src/components/DependencyMap.tsx` - Componente principal
- Integrado en `frontend/src/components/phases/AssessPhase.tsx`

### Documentación
- `DEPENDENCY-MAP-GUIDE.md` - Guía completa de uso
- `DEPENDENCY-MODULE-README.md` - Este archivo

### Scripts
- `create-dependency-sample.js` - Genera datos de ejemplo
- `4-GENERAR-DATOS-EJEMPLO.bat` - Script para generar datos
- `INSTALAR-CON-DEPENDENCIAS.bat` - Instalación completa

## 🚀 Instalación Rápida

### Opción 1: Instalación Automática (Recomendada)

```batch
INSTALAR-CON-DEPENDENCIAS.bat
```

Este script:
1. Verifica Node.js
2. Instala dependencias del backend
3. Instala dependencias del frontend (incluyendo reactflow)
4. Genera archivo de ejemplo

### Opción 2: Instalación Manual

```batch
# 1. Backend
cd backend
npm install

# 2. Frontend (incluye reactflow)
cd ../frontend
npm install

# 3. Generar datos de ejemplo
cd ..
node create-dependency-sample.js
```

## 📊 Dependencias Nuevas

### Frontend
- `reactflow@^11.10.4` - Librería para grafos interactivos

Ya añadida en `frontend/package.json`

## 🎮 Cómo Usar

### 1. Iniciar la Aplicación

```batch
3-INICIAR-PROYECTO.bat
```

O manualmente:
```batch
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Acceder al Módulo

1. Abre http://localhost:5173
2. Ve a la fase **Assess**
3. Haz clic en la pestaña **Mapa de Dependencias**

### 3. Cargar Archivo

**Opción A: Usar archivo de ejemplo**
1. Carga `sample-dependencies.xlsx` (generado automáticamente)
2. Haz clic en "Cargar"

**Opción B: Usar tu propio archivo**
1. Prepara un Excel con columnas: source, destination, port, protocol
2. Carga el archivo
3. Haz clic en "Cargar"

### 4. Explorar Dependencias

**Ver mapa completo:**
- Después de cargar, verás el grafo completo
- Usa zoom y pan para navegar
- Arrastra nodos para reorganizar

**Buscar servidor específico:**
1. Ingresa nombre del servidor en el campo de búsqueda
2. Presiona Enter o haz clic en "Buscar"
3. Verás:
   - Conexiones entrantes
   - Conexiones salientes
   - Servidores relacionados
   - Aplicaciones relacionadas
   - Grafo filtrado

## 📋 Formato del Archivo Excel

### Columnas Mínimas Requeridas

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| source | Servidor origen | WEB-SERVER-01 |
| destination | Servidor destino | APP-SERVER-01 |
| port | Puerto | 8080 |
| protocol | Protocolo | TCP |

### Columnas Opcionales

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| service | Nombre del servicio | HTTP |
| source_app | Aplicación origen | Frontend |
| destination_app | Aplicación destino | Backend |
| source_ip | IP origen | 192.168.1.10 |
| destination_ip | IP destino | 192.168.1.20 |

### Nombres Alternativos Soportados

El parser detecta automáticamente variaciones de nombres:
- **Source**: origen, from, source_server, source_host
- **Destination**: destino, to, dest, destination_server
- **Port**: puerto, destination_port, dest_port
- **Protocol**: protocolo, proto

## 🔧 API Endpoints

### POST /api/dependencies/upload
Carga y procesa archivo Excel

**Request:**
```
Content-Type: multipart/form-data
Body: file (Excel file)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "1234567890",
    "summary": {
      "totalDependencies": 35,
      "uniqueServers": 15,
      "uniqueApplications": 8,
      "uniquePorts": 12
    },
    "graph": { "nodes": [...], "edges": [...] },
    "servers": ["WEB-SERVER-01", ...],
    "applications": ["Frontend", ...]
  }
}
```

### POST /api/dependencies/search
Busca dependencias de un servidor

**Request:**
```json
{
  "sessionId": "1234567890",
  "searchTerm": "APP-SERVER-01"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "server": "APP-SERVER-01",
    "dependencies": {
      "incoming": [...],
      "outgoing": [...]
    },
    "relatedServers": [...],
    "relatedApplications": [...],
    "graph": { "nodes": [...], "edges": [...] }
  }
}
```

## 🎨 Características del Grafo

### Visualización
- **Nodos azules**: Servidores
- **Nodos verdes**: Aplicaciones
- **Flechas animadas**: Dirección del flujo
- **Etiquetas**: Protocolo:Puerto

### Controles
- **Zoom**: Rueda del mouse o controles
- **Pan**: Arrastra el fondo
- **Mover nodos**: Arrastra nodos individuales
- **Fit view**: Botón para ajustar vista

### Algoritmo de Layout
- Distribución circular automática
- Radio adaptativo según cantidad de nodos
- Posiciones ajustables manualmente

## 📈 Casos de Uso

### 1. Planificación de Migración AWS
- Identifica grupos de servidores interdependientes
- Planifica orden de migración
- Documenta requisitos de Security Groups

### 2. Análisis de Impacto
- Evalúa impacto de cambios
- Identifica puntos únicos de fallo
- Documenta dependencias críticas

### 3. Seguridad
- Mapea flujos de datos
- Identifica conexiones no autorizadas
- Planifica reglas de firewall

### 4. Troubleshooting
- Visualiza rutas de comunicación
- Identifica cuellos de botella
- Documenta arquitectura actual

## 🐛 Troubleshooting

### Error: "npm no reconocido"
**Solución:** Ejecuta `1-INSTALAR-NODEJS.bat` primero

### Error: "No se encontró hoja de dependencias"
**Solución:** 
- Verifica que el Excel tenga una hoja con datos
- Renombra la hoja a "Dependencies" o "Network"
- Asegúrate de que tenga las columnas requeridas

### Error: "reactflow no encontrado"
**Solución:**
```batch
cd frontend
npm install reactflow
```

### El grafo no se muestra
**Solución:**
1. Abre la consola del navegador (F12)
2. Busca errores de JavaScript
3. Verifica que el archivo se haya cargado correctamente
4. Recarga la página

### Búsqueda no encuentra resultados
**Solución:**
- Verifica el nombre exacto del servidor
- La búsqueda es parcial y case-insensitive
- Asegúrate de que el servidor exista en el archivo

## 📝 Ejemplo de Datos

El archivo `sample-dependencies.xlsx` incluye:
- 35 dependencias de ejemplo
- 15 servidores únicos
- 8 aplicaciones diferentes
- Arquitectura típica de 3 capas (Web, App, DB)
- Servicios adicionales (Cache, MQ, Auth, Monitoring)

## 🔄 Próximas Mejoras

- [ ] Exportar grafo como imagen PNG/SVG
- [ ] Filtros por protocolo y puerto
- [ ] Detección automática de aplicaciones
- [ ] Sugerencias de Security Groups AWS
- [ ] Análisis de latencia y ancho de banda
- [ ] Importar desde múltiples archivos
- [ ] Comparación de dependencias antes/después
- [ ] Integración con AWS Application Discovery Service

## 📞 Soporte

Para problemas o preguntas:
1. Revisa `DEPENDENCY-MAP-GUIDE.md` para guía detallada
2. Verifica los logs del backend en la consola
3. Revisa la consola del navegador para errores frontend

## 📄 Licencia

Parte del proyecto AWS Assessment Report Generator
© 2024 SoftwareOne
