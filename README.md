# 🚀 AWS Assessment Report Generator

Aplicación web fullstack que genera documentos Word profesionales para reportes de migración AWS a partir de archivos Excel de MPA (Migration Portfolio Assessment).

## 📋 Requisitos Previos

- **Node.js** 20.x o superior ([Descargar](https://nodejs.org/))
- **npm** (viene con Node.js)
- Windows PowerShell o CMD

## 🔧 Instalación y Ejecución Rápida

### Opción 1: Usar el script automático (RECOMENDADO)

1. Abre el explorador de archivos en:
   ```
   C:\Users\yorkijr\Documents\GitHub\assessment-center
   ```

2. Haz doble clic en:
   ```
   start-dev.bat
   ```

3. El script automáticamente:
   - Instalará todas las dependencias (backend y frontend)
   - Iniciará el servidor backend en http://localhost:4000
   - Iniciará el servidor frontend en http://localhost:3000
   - Abrirá tu navegador en la aplicación

### Opción 2: Manual (Dos terminales)

#### Terminal 1 - Backend
```powershell
cd C:\Users\yorkijr\Documents\GitHub\assessment-center\backend
npm install
npm run dev
```

Deberías ver:
```
Server running on http://localhost:4000
```

#### Terminal 2 - Frontend
```powershell
cd C:\Users\yorkijr\Documents\GitHub\assessment-center\frontend
npm install
npm run dev
```

Deberías ver:
```
  ➜  Local:   http://localhost:3000/
```

## 📊 Crear Datos de Prueba

Para probar la aplicación sin tener un archivo MPA real:

1. Abre una terminal en la carpeta del proyecto

2. Ejecuta:
   ```powershell
   cd test-data
   npm install
   node create-sample-excel.js
   ```

3. Se creará el archivo:
   ```
   test-data/sample-mpa-export.xlsx
   ```

4. Este archivo contiene:
   - 10 servidores de ejemplo (Windows/Linux)
   - 5 bases de datos (SQL Server, PostgreSQL, MySQL)
   - 7 aplicaciones

## 🎯 Cómo Usar la Aplicación

### 1. Subir Archivo Excel
- Arrastra y suelta o haz clic para seleccionar un archivo `.xlsx`
- El archivo debe tener las hojas: **Servers**, **Databases**, **Applications**
- Los datos se parsean automáticamente

### 2. Completar Formulario de Cliente
- **Client Name** (requerido)
- **Vertical/Industry** (Energy, Insurance, Healthcare, etc.)
- **AWS Region** (us-east-1, eu-west-1, etc.)
- **Report Date**
- **On-Premises Cost** (costo anual actual)
- **Company Description**
- **Client Priorities** (checkboxes múltiples)
- **Migration Readiness** (Ready, Evaluating, Not ready)

### 3. Vista Previa de Datos
Revisa los datos parseados en las pestañas:
- **Servers**: Lista de servidores con recomendaciones EC2
- **Databases**: Bases de datos con recomendaciones RDS
- **Applications**: Aplicaciones detectadas
- **7Rs Analysis**: Distribución de estrategias de migración

### 4. Ver Estimación de Costos
Revisa la estimación automática de costos AWS:
- **On-Demand**: Sin compromisos
- **1-Year NURI**: Reserved Instance 1 año, sin pago inicial
- **3-Year NURI**: Reserved Instance 3 años, sin pago inicial

### 5. Generar Reporte
Haz clic en **"Generate Report"**

El sistema generará un documento Word (.docx) que incluye:
- Portada con datos del cliente
- Tabla de contenidos automática
- Análisis de costos multi-año
- Tablas detalladas de servidores y recomendaciones EC2
- Tablas de bases de datos y recomendaciones RDS
- Proyección de ARR (Annual Recurring Revenue)
- Requisitos de negocio (SLA, seguridad, DR)
- Análisis de las 7Rs
- Estimación de esfuerzo de migración
- Links a AWS Calculator

### 6. Descargar Documento
Haz clic en **"Download Report"** para descargar el archivo Word generado.

## 📁 Estructura del Proyecto

```
assessment-center/
├── frontend/                 # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   │   ├── ui/          # Componentes Shadcn/UI
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   ├── ServerTable.tsx
│   │   │   ├── DatabaseTable.tsx
│   │   │   ├── ApplicationTable.tsx
│   │   │   ├── CostSummary.tsx
│   │   │   └── SevenRsChart.tsx
│   │   ├── types/           # TypeScript types
│   │   ├── lib/             # Utilidades
│   │   ├── App.tsx          # Componente principal
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Express + TypeScript
│   ├── src/
│   │   ├── controllers/     # Controladores REST
│   │   ├── services/        # Lógica de negocio
│   │   │   ├── excelService.ts           # Parser Excel
│   │   │   ├── docxService.ts            # Generador Word
│   │   │   ├── ec2RecommendationService.ts
│   │   │   └── awsCalculatorService.ts
│   │   ├── routes/          # Rutas API
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Entry point
│   ├── uploads/             # Archivos temporales
│   ├── generated/           # Reportes generados
│   └── package.json
│
├── test-data/               # Scripts para datos de prueba
│   ├── create-sample-excel.js
│   └── sample-mpa-export.xlsx (generado)
│
├── shared/                  # Tipos compartidos
│   └── types/
│
├── docker-compose.yml       # Configuración Docker
├── start-dev.bat           # Script inicio automático
└── README.md               # Esta documentación
```

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **TailwindCSS** - Estilos utility-first
- **Shadcn/UI** - Componentes accesibles
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Recharts** - Gráficos
- **Axios** - Cliente HTTP
- **React Dropzone** - Upload de archivos

### Backend
- **Node.js 20** - Runtime
- **Express** - Framework web
- **TypeScript** - Type safety
- **Multer** - Upload de archivos
- **xlsx (SheetJS)** - Parser de Excel
- **docx** - Generador de documentos Word
- **Zod** - Validación

## 🐛 Solución de Problemas

### El backend no inicia

**Error: `npm: command not found`**
- Instala Node.js desde https://nodejs.org/

**Error: `Cannot find module`**
```powershell
cd backend
rm -rf node_modules
npm install
```

### El frontend no inicia

**Error: `EADDRINUSE: address already in use`**
- El puerto 3000 está ocupado
- Cierra otras aplicaciones que usen ese puerto
- O edita `frontend/vite.config.ts` y cambia el puerto

**Error: `Module not found`**
```powershell
cd frontend
rm -rf node_modules
npm install
```

### El archivo Excel no se carga

**Verifica que tu archivo Excel tenga estas hojas:**
- `Servers` (o variantes: Server, servers)
- `Databases` (o variantes: Database, DB)
- `Applications` (o variantes: Application, Apps)

**Columnas requeridas en la hoja Servers:**
- HOSTNAME o Hostname
- osName u OS Name
- numCpus o Num CPUs
- totalRAM o Total RAM (GB)
- Storage-Total Disk Size (GB) o Storage (GB)

**Si no tienes un archivo MPA:**
Usa el script de datos de prueba (ver sección "Crear Datos de Prueba")

### El documento Word no se genera

**Verifica:**
1. El campo "Client Name" está lleno
2. Se cargó correctamente el archivo Excel
3. Revisa la consola del navegador (F12) para errores
4. Revisa los logs del backend en la terminal

**Permisos de escritura:**
Asegúrate de que la carpeta `backend/generated` exista y tenga permisos de escritura:
```powershell
mkdir backend\generated
```

## 🔒 Seguridad

- Los archivos Excel subidos se eliminan después de parsearlos
- Los reportes generados se eliminan automáticamente después de 1 hora
- No se almacenan datos sensibles del cliente en disco (solo temporalmente)

## 🌐 Compartir tu App con Port Forwarding (VSCode)

Puedes compartir tu aplicación con otros sin necesidad de deploy usando **VSCode Port Forwarding**.

### Pasos Rápidos:

**1. Inicia el backend:**
```powershell
.\start-portforward.bat
```

**2. Haz público el puerto del backend:**
- En VSCode, presiona `Ctrl+J` para abrir el panel inferior
- Selecciona la pestaña **PORTS**
- Clic derecho en el puerto **4000** → "Port Visibility" → **"Public"**
- Copia la URL generada (ejemplo: `https://xyz-4000.preview.app.github.dev`)

**3. Configura el frontend:**
- Abre el archivo `frontend\.env.portforward`
- Reemplaza `VITE_API_URL` con la URL del paso 2:
  ```
  VITE_API_URL=https://xyz-4000.preview.app.github.dev
  ```

**4. Inicia el frontend en modo port forwarding:**
```powershell
cd frontend
npm run dev:portforward
```

**5. Haz público el puerto del frontend:**
- En el panel **PORTS** de VSCode
- Clic derecho en el puerto **3000** → "Port Visibility" → **"Public"**
- Copia la URL del frontend (ejemplo: `https://abc-3000.preview.app.github.dev`)

**6. ¡Comparte la URL del frontend!**
- Cualquier persona con la URL puede acceder a tu aplicación
- Requiere que estés logueado con GitHub en VSCode
- La sesión permanece activa mientras VSCode esté abierto

### Alternativa: ngrok

Si prefieres usar ngrok:

```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: ngrok para backend
ngrok http 4000

# Terminal 3: Frontend (actualiza .env.portforward con la URL de ngrok)
cd frontend
npm run dev:portforward

# Terminal 4: ngrok para frontend
ngrok http 3000
```

## 🚀 Producción con Docker

```bash
# Build y ejecutar con Docker Compose
docker-compose up --build

# La aplicación estará disponible en:
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

## 📝 API Endpoints

### POST `/api/report/upload`
Sube y parsea un archivo Excel MPA

**Request:**
- `Content-Type: multipart/form-data`
- Field: `file` (Excel file)

**Response:**
```json
{
  "success": true,
  "data": {
    "excelData": {
      "servers": [...],
      "databases": [...],
      "applications": [...]
    },
    "summary": {
      "serverCount": 10,
      "databaseCount": 5,
      "applicationCount": 7,
      "totalStorageGB": 15000
    }
  }
}
```

### POST `/api/report/generate`
Genera el documento Word del reporte

**Request Body:**
```json
{
  "clientName": "Example Corp",
  "vertical": "Technology",
  "reportDate": "2024-01-22",
  "awsRegion": "us-east-1",
  "totalServers": 10,
  "onPremisesCost": 500000,
  "companyDescription": "Leading tech company...",
  "priorities": ["reduced_costs", "operational_resilience"],
  "migrationReadiness": "ready",
  "excelData": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/api/report/download/assessment-Example-Corp-1705959600000.docx",
    "calculatorLinks": {
      "onDemand": "https://calculator.aws/#...",
      "oneYearNuri": "https://calculator.aws/#...",
      "threeYearNuri": "https://calculator.aws/#..."
    },
    "summary": {
      "totalServers": 10,
      "estimatedCosts": { ... },
      "ec2Recommendations": [ ... ]
    }
  }
}
```

### GET `/api/report/download/:filename`
Descarga un reporte generado

## 🎨 Personalización

### Cambiar colores de marca (SoftwareOne)

Edita `backend/src/services/docxService.ts`:
```typescript
const COLORS = {
  primary: '0066CC',    // Azul principal
  secondary: '333333',  // Gris oscuro
  accent: 'FF6600',     // Naranja
  lightGray: 'F5F5F5',
  white: 'FFFFFF',
  black: '000000'
};
```

### Cambiar lógica de rightsizing EC2

Edita `backend/src/services/ec2RecommendationService.ts`:
```typescript
if (avgCpuUsage < 20 && avgMemUsage < 30) {
  // Reducir specs al 50%
} else if (avgCpuUsage < 40 && avgMemUsage < 50) {
  // Reducir specs al 75%
}
```

### Agregar nuevas regiones AWS

Edita `frontend/src/components/ClientForm.tsx`:
```typescript
const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'nueva-region', label: 'Nueva Región' },
  // ...
];
```

## 📧 Soporte

Para problemas o preguntas:
1. Revisa la sección de "Solución de Problemas"
2. Verifica los logs en ambas terminales (backend y frontend)
3. Usa las herramientas de desarrollo del navegador (F12)

## 📄 Licencia

Copyright © 2024 SoftwareOne

---

**¡Listo para empezar!** Haz doble clic en `start-dev.bat` y comienza a generar reportes profesionales de migración AWS. 🚀
