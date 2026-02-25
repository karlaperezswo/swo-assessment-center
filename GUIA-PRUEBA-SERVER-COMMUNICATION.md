# 🧪 Guía de Prueba - Parser Server Communication

## Objetivo
Verificar que el parser de "Server Communication" funciona correctamente con archivos MPA reales.

---

## 📋 Pre-requisitos

1. ✅ Backend corriendo en puerto 4000
2. ✅ Frontend corriendo en puerto 3005
3. ✅ Archivo Excel MPA con pestaña "Server Communication"

---

## 🚀 Pasos para Probar

### 1. Iniciar el Sistema

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Espera a ver:
- Backend: `🚀 Server running on port 4000`
- Frontend: `Local: http://localhost:3005/`

---

### 2. Verificar Estructura del Archivo Excel

Tu archivo MPA debe tener una pestaña llamada **"Server Communication"** con estas columnas:

| Columna Requerida | Descripción | Ejemplo |
|-------------------|-------------|---------|
| Source Server ID | Servidor origen | SERVER-001 |
| Target Server ID | Servidor destino | SERVER-002 |
| Communication Port | Puerto de comunicación | 443 |
| Target Process ID | Proceso destino | nginx |
| Protocol | Protocolo (opcional) | TCP |

**Nota**: El parser es flexible con los nombres de columnas (case-insensitive).

---

### 3. Cargar el Archivo

1. Abre el navegador en `http://localhost:3005`
2. Ve a la pestaña **"Dependency Map"**
3. Haz clic en **"Seleccionar Archivo"**
4. Selecciona tu archivo Excel MPA
5. Haz clic en **"Cargar"**

---

### 4. Verificar la Carga

#### En la Consola del Backend
Deberías ver logs como:
```
📊 Analizando 5 pestañas: Server Communication, Databases, ...
🎯 Usando pestaña principal: "Server Communication"
📋 Columnas encontradas: Source Server ID, Target Server ID, Communication Port, ...
🔍 Procesando 150 filas de dependencias...
✅ Encontradas 145 dependencias válidas
✅ Resumen Final:
   - 145 dependencias
   - 50 servidores únicos
   - 0 aplicaciones
   - 30 bases de datos (15 con deps, 15 sin deps)
```

#### En la Consola del Navegador
Deberías ver:
```
📤 Iniciando carga de archivo: mpa-export-2025-12-19.xlsx
🔄 Enviando archivo al servidor...
📥 Respuesta del servidor: Object
✅ Datos recibidos: Object
🎨 Generando visualización del grafo...
✅ Carga completada exitosamente
```

---

### 5. Verificar la Visualización

#### Panel Verde: "Conexiones de Servidores con Puerto"
- ✅ Muestra solo conexiones que tienen puerto definido
- ✅ Columnas: Origen, Destino, Puerto, Protocolo, **Proceso Destino**
- ✅ La columna "Proceso Destino" muestra el Target Process ID

Ejemplo:
| Origen | Destino | Puerto | Protocolo | Proceso Destino |
|--------|---------|--------|-----------|-----------------|
| SERVER-001 | SERVER-002 | 443 | TCP | nginx |
| SERVER-002 | SERVER-003 | 3306 | TCP | mysqld |

#### Panel Naranja: "Conexiones de Servidores sin Puerto"
- ✅ Muestra conexiones sin puerto o sin destino
- ✅ Mismas columnas que el panel verde
- ✅ Puerto muestra "Sin puerto" si es null

Ejemplo:
| Origen | Destino | Puerto | Protocolo | Proceso Destino |
|--------|---------|--------|-----------|-----------------|
| SERVER-004 | SERVER-005 | Sin puerto | TCP | app-service |

---

### 6. Verificar el Grafo

El grafo debe mostrar:
- ✅ Solo servidores que tienen conexiones
- ✅ Nodos organizados en capas:
  - **Verde**: Servidores origen (solo envían)
  - **Azul**: Servidores intermedios (envían y reciben)
  - **Morado**: Servidores destino (solo reciben)
- ✅ Conexiones coloreadas por tipo de servicio:
  - **Azul**: HTTP/HTTPS (80, 443, 8080)
  - **Verde**: Bases de datos (3306, 5432, 1433)
  - **Naranja**: Cache (6379, 11211)
  - **Rojo**: Acceso remoto (22, 3389)
  - **Gris**: Otros servicios

---

### 7. Verificar Estadísticas

En la sección de estadísticas deberías ver:
- **Total Conexiones**: Número total de dependencias
- **Con Puerto**: Dependencias con puerto definido
- **Sin Puerto/Destino**: Dependencias sin puerto o destino
- **Filtradas**: Dependencias después de aplicar filtros

---

### 8. Verificar Bases de Datos

Si tu archivo tiene pestaña "Databases":
- ✅ Panel gris: "Bases de Datos sin Dependencias"
- ✅ Columnas: Nombre Base de Datos, Servidor, Database ID, Edición
- ✅ Solo muestra bases de datos que NO tienen conexiones

---

## ✅ Checklist de Validación

### Carga de Archivo
- [ ] El archivo se carga sin errores
- [ ] Se muestra el resumen de estadísticas
- [ ] Los logs del backend muestran el número correcto de dependencias

### Panel Verde (Con Puerto)
- [ ] Solo muestra conexiones con puerto definido
- [ ] La columna "Proceso Destino" tiene datos
- [ ] Los datos coinciden con el archivo Excel
- [ ] Headers son sticky (visibles al hacer scroll)
- [ ] Paginación funciona correctamente

### Panel Naranja (Sin Puerto)
- [ ] Muestra conexiones sin puerto o sin destino
- [ ] La columna "Proceso Destino" tiene datos
- [ ] Muestra "Sin puerto" cuando el puerto es null
- [ ] Headers son sticky
- [ ] Paginación funciona correctamente

### Grafo de Dependencias
- [ ] Solo muestra servidores con conexiones
- [ ] Nodos están organizados en capas (verde, azul, morado)
- [ ] Conexiones tienen colores según el tipo de servicio
- [ ] Se puede hacer zoom y pan
- [ ] Los badges muestran número de conexiones entrantes/salientes

### Bases de Datos
- [ ] Panel de bases de datos sin dependencias aparece
- [ ] Muestra Database Name, Server ID, Database ID, Edition
- [ ] Solo incluye bases de datos sin conexiones

### Filtrado y Búsqueda
- [ ] El filtro de texto funciona
- [ ] El ordenamiento por columna funciona
- [ ] La búsqueda de servidor específico funciona
- [ ] Los resultados se actualizan correctamente

### Exportación
- [ ] Exportar a PDF funciona
- [ ] Exportar a Word funciona
- [ ] Los archivos se descargan correctamente

---

## 🐛 Problemas Comunes

### Error: "No se encontró la pestaña Server Communication"
**Solución**: Verifica que tu archivo Excel tenga una pestaña con ese nombre (puede variar mayúsculas/minúsculas).

### Error: "No se encontraron dependencias válidas"
**Solución**: Verifica que las columnas tengan los nombres correctos:
- Source Server ID
- Target Server ID
- Communication Port
- Target Process ID

### La columna "Proceso Destino" muestra "-"
**Causa**: El archivo no tiene la columna "Target Process ID" o está vacía.
**Solución**: Esto es normal si el archivo no tiene esa información.

### El grafo está vacío
**Causa**: Ninguna dependencia tiene tanto source como target definidos.
**Solución**: Verifica que las columnas Source Server ID y Target Server ID tengan datos.

### Servidores no aparecen en el grafo
**Causa**: El servidor no tiene ninguna conexión (ni entrante ni saliente).
**Solución**: Esto es correcto. El grafo solo muestra servidores con dependencias.

---

## 📊 Datos de Ejemplo para Prueba

Si no tienes un archivo MPA real, puedes crear uno con estos datos:

### Pestaña: Server Communication

| Source Server ID | Target Server ID | Communication Port | Target Process ID | Protocol |
|------------------|------------------|-------------------|-------------------|----------|
| WEB-SERVER-01 | APP-SERVER-01 | 8080 | tomcat | TCP |
| APP-SERVER-01 | DB-SERVER-01 | 3306 | mysqld | TCP |
| APP-SERVER-01 | CACHE-SERVER-01 | 6379 | redis | TCP |
| WEB-SERVER-02 | APP-SERVER-01 | 8080 | tomcat | TCP |
| APP-SERVER-02 | DB-SERVER-01 | 3306 | mysqld | TCP |
| ADMIN-SERVER-01 | WEB-SERVER-01 | 22 | sshd | TCP |

### Pestaña: Databases

| Database | Server | Database ID | Edition |
|----------|--------|-------------|---------|
| ProductionDB | DB-SERVER-01 | DB-001 | Enterprise |
| TestDB | DB-SERVER-02 | DB-002 | Standard |
| ArchiveDB | DB-SERVER-03 | DB-003 | Express |

---

## 🎯 Resultado Esperado

Después de cargar el archivo de ejemplo:

### Estadísticas
- Total Conexiones: 6
- Con Puerto: 6
- Sin Puerto/Destino: 0
- Servidores únicos: 7

### Panel Verde (6 conexiones)
Todas las conexiones tienen puerto definido.

### Panel Naranja (0 conexiones)
Vacío porque todas las conexiones tienen puerto.

### Grafo
- **Verde** (origen): ADMIN-SERVER-01, WEB-SERVER-01, WEB-SERVER-02
- **Azul** (intermedio): APP-SERVER-01, APP-SERVER-02
- **Morado** (destino): DB-SERVER-01, CACHE-SERVER-01

### Bases de Datos sin Dependencias
- TestDB (DB-SERVER-02)
- ArchiveDB (DB-SERVER-03)

---

## 📝 Notas Finales

1. **Logs detallados**: Revisa siempre la consola del backend y del navegador para logs detallados.

2. **Columnas flexibles**: El parser es flexible con los nombres de columnas (case-insensitive y con variaciones).

3. **Puertos opcionales**: Las conexiones sin puerto son válidas y se muestran en el panel naranja.

4. **Grafo limpio**: Solo se muestran servidores con conexiones, el resto se excluye automáticamente.

5. **Target Process ID**: Es opcional. Si no está en el archivo, la columna mostrará "-".

---

## ✅ Confirmación Final

Si todos los checks están marcados, el parser está funcionando correctamente y listo para producción.

**Commit actual**: `Parser Server Communication - Implementacion Completa`

---

**¿Necesitas ayuda?** Revisa `CAMBIOS-PARSER-SERVER-COMMUNICATION.md` para detalles técnicos o `RESUMEN-CAMBIOS-FINALES.md` para un resumen ejecutivo.
