# 🚀 Guía de Inicio - Módulo de Mapa de Dependencias

## ✅ APROBADO - Listo para Iniciar

El análisis confirmó que el módulo funcional ya está en tu código local. Solo necesita iniciarse.

---

## 🎯 INICIO RÁPIDO

### Opción 1: Script Automático (Recomendado)

```bash
INICIAR-MODULO-DEPENDENCIAS.bat
```

Este script hace TODO automáticamente:
1. ✅ Verifica dependencias
2. ✅ Inicia backend (puerto 4000)
3. ✅ Inicia frontend (puerto 3005)
4. ✅ Verifica conexión
5. ✅ Te muestra los próximos pasos

---

### Opción 2: Inicio Manual

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Espera a ver:
```
╔════════════════════════════════════════════════════════╗
║          AWS Assessment Report Generator               ║
╚════════════════════════════════════════════════════════╝

✅ Server running on http://localhost:4000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Espera a ver:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3005/
  ➜  Network: use --host to expose
```

---

## 📍 ACCEDER AL MÓDULO

### Paso 1: Abrir la Aplicación
```
http://localhost:3005
```

### Paso 2: Navegar al Módulo
1. Click en la fase **"Assess"**
2. Click en el tab **"Mapa de Dependencias"**

### Paso 3: Usar el Módulo
1. Click en **"Seleccionar Archivo"**
2. Elige un archivo Excel (.xlsx o .xls)
3. Click en **"Cargar"**
4. ¡Listo! Verás:
   - 📊 Resumen con estadísticas
   - 📋 Tabla de dependencias
   - 🎨 Grafo visual
   - 🔍 Búsqueda de servidores
   - 📥 Opciones de exportación

---

## 🧪 ARCHIVO DE PRUEBA

Si necesitas un archivo Excel de ejemplo:

```bash
4-GENERAR-DATOS-EJEMPLO.bat
```

Esto genera: `sample-dependencies.xlsx`

---

## 🔍 VERIFICACIÓN

### Verificar que todo funciona:

```bash
6-DIAGNOSTICO-COMPLETO.bat
```

Deberías ver todos los checks en verde (✅):
- ✅ Backend funcionando
- ✅ Frontend funcionando
- ✅ Endpoint de dependencias disponible
- ✅ Archivos del proyecto existentes
- ✅ Puertos en uso correctos

---

## 📊 CARACTERÍSTICAS DEL MÓDULO

### 1. Carga de Archivos
- ✅ Soporta formatos: Matilda, Cloudamize, Concierto
- ✅ Detección automática de columnas
- ✅ Validación de datos
- ✅ Feedback visual

### 2. Visualización de Datos
- ✅ Tabla con 50+ dependencias
- ✅ Filtrado en tiempo real
- ✅ Ordenamiento por columnas
- ✅ Paginación (10/25/50/100)
- ✅ Estadísticas en tiempo real

### 3. Grafo Visual
- ✅ Visualización interactiva con ReactFlow
- ✅ Nodos por tipo (servidores, aplicaciones)
- ✅ Conexiones con colores por protocolo
- ✅ Zoom y navegación
- ✅ Layout automático

### 4. Búsqueda
- ✅ Buscar servidor específico
- ✅ Ver conexiones entrantes
- ✅ Ver conexiones salientes
- ✅ Servidores relacionados
- ✅ Aplicaciones relacionadas

### 5. Exportación
- ✅ Exportar a PDF
- ✅ Exportar a Word
- ✅ Incluye todas las dependencias
- ✅ Formato profesional

---

## 🎨 INTERFAZ DEL MÓDULO

```
┌─────────────────────────────────────────────────────┐
│  MAPA DE DEPENDENCIAS DE RED                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Archivo Excel de Dependencias (MPA)               │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📄 sample-dependencies.xlsx                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Seleccionar Archivo]  [Cargar]                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  RESUMEN                                            │
│  ┌──────┬──────┬──────┬──────┐                    │
│  │  50  │  20  │  10  │  15  │                    │
│  │Depen.│Serv. │Apps  │Ports │                    │
│  └──────┴──────┴──────┴──────┘                    │
├─────────────────────────────────────────────────────┤
│  BUSCAR DEPENDENCIAS                                │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔍 Buscar por nombre de servidor...          │ │
│  └───────────────────────────────────────────────┘ │
│  [Buscar]                                          │
├─────────────────────────────────────────────────────┤
│  TODAS LAS DEPENDENCIAS (50)                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔍 Filtrar...        Mostrar: [10 ▼]         │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ Origen ↕ │ Destino ↕ │ Puerto ↕ │ Proto ↕   │ │
│  ├───────────────────────────────────────────────┤ │
│  │ web-01   │ db-01     │ 3306    │ TCP       │ │
│  │ app-01   │ cache-01  │ 6379    │ TCP       │ │
│  └───────────────────────────────────────────────┘ │
│  [◀ Anterior] [1][2][3][4][5] [Siguiente ▶]       │
├─────────────────────────────────────────────────────┤
│  VISUALIZACIÓN                                      │
│  [Exportar PDF] [Exportar Word]                    │
│  ┌───────────────────────────────────────────────┐ │
│  │         [Grafo Visual ReactFlow]              │ │
│  │    🖥️ ──→ 🖥️ ──→ 🖥️                          │ │
│  │     │      │      │                            │ │
│  │     ↓      ↓      ↓                            │ │
│  │    🖥️ ──→ 🖥️ ──→ 🖥️                          │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ NOTAS IMPORTANTES

### 1. Ventanas del Backend y Frontend
- ❌ NO cierres las ventanas mientras uses la aplicación
- ✅ Déjalas abiertas en segundo plano
- ✅ Puedes minimizarlas

### 2. Puertos Utilizados
- Backend: `4000`
- Frontend: `3005`

### 3. Detener los Servicios
Cuando termines de usar la aplicación:
```bash
DETENER-TODO.bat
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "No se pudo conectar con el servidor"

**Solución:**
```bash
6-DIAGNOSTICO-COMPLETO.bat
```

Si el backend no está ejecutándose:
```bash
INICIAR-MODULO-DEPENDENCIAS.bat
```

### Problema: "Puerto ya en uso"

**Solución:**
```bash
DETENER-TODO.bat
```
Luego:
```bash
INICIAR-MODULO-DEPENDENCIAS.bat
```

### Problema: "Error al procesar archivo"

**Causas posibles:**
1. Archivo Excel corrupto
2. Formato no soportado
3. Columnas faltantes

**Solución:**
Prueba con el archivo de ejemplo:
```bash
4-GENERAR-DATOS-EJEMPLO.bat
```

---

## 📞 COMANDOS ÚTILES

### Ver logs del backend
Revisa la ventana "Backend - Mapa de Dependencias"

### Ver logs del frontend
Revisa la ventana "Frontend - Aplicación"

### Ver logs en el navegador
1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes con emojis (📡, ✅, ❌)

---

## ✅ CHECKLIST DE INICIO

Después de ejecutar `INICIAR-MODULO-DEPENDENCIAS.bat`:

- [ ] Ventana "Backend - Mapa de Dependencias" abierta
- [ ] Ventana "Frontend - Aplicación" abierta
- [ ] Backend muestra: "✅ Server running on http://localhost:4000"
- [ ] Frontend muestra: "Local: http://localhost:3005"
- [ ] Diagnóstico pasa todos los tests
- [ ] http://localhost:3005 carga en el navegador
- [ ] Tab "Mapa de Dependencias" visible en "Assess"
- [ ] Botones "Seleccionar Archivo" y "Cargar" visibles

Si todos los checks pasan, ¡el módulo está listo! 🎉

---

## 🎯 RESUMEN

1. **Ejecuta:** `INICIAR-MODULO-DEPENDENCIAS.bat`
2. **Abre:** http://localhost:3005
3. **Navega:** Assess → Mapa de Dependencias
4. **Usa:** Seleccionar Archivo → Cargar
5. **Disfruta:** ¡El módulo está funcionando!

**El módulo funcional ya está en tu local. Solo necesitaba iniciarse.** ✅
