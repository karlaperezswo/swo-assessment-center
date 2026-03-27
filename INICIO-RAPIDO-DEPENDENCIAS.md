# 🚀 Inicio Rápido - Mapa de Dependencias

## ⚡ 3 Pasos para Ver tu Mapa de Dependencias

### Paso 1: Instalar (5 minutos)

```batch
INSTALAR-CON-DEPENDENCIAS.bat
```

**¿Qué hace este script?**
- ✅ Verifica que Node.js esté instalado
- ✅ Instala todas las dependencias del backend
- ✅ Instala todas las dependencias del frontend (incluyendo reactflow)
- ✅ Genera un archivo de ejemplo con 35 dependencias

**Resultado esperado:**
```
✅ Archivo de ejemplo creado: sample-dependencies.xlsx
📊 Total de dependencias: 35
🖥️  Servidores únicos: 15
📱 Aplicaciones únicas: 8
```

---

### Paso 2: Iniciar (1 minuto)

```batch
3-INICIAR-PROYECTO.bat
```

**¿Qué hace este script?**
- 🔧 Inicia el backend en http://localhost:4000
- 🎨 Inicia el frontend en http://localhost:5173

**Resultado esperado:**
```
Backend: Server running on http://localhost:4000
Frontend: Local: http://localhost:5173
```

---

### Paso 3: Usar (2 minutos)

#### 3.1 Abrir la Aplicación
1. Abre tu navegador
2. Ve a: **http://localhost:5173**

#### 3.2 Navegar al Módulo
1. Verás la pantalla principal del MAP
2. Haz clic en la fase **"Assess"** (primera fase)
3. Busca y haz clic en la pestaña **"Mapa de Dependencias"** (icono de red)

#### 3.3 Cargar Archivo
1. Haz clic en **"Seleccionar archivo"**
2. Busca y selecciona **"sample-dependencies.xlsx"** (en la raíz del proyecto)
3. Haz clic en **"Cargar"**
4. Espera 2-3 segundos

#### 3.4 Ver el Mapa
¡Listo! Verás:
- 📊 **Estadísticas**: 35 dependencias, 15 servidores, 8 aplicaciones
- 🗺️ **Grafo interactivo**: Todos los servidores conectados
- 🔵 **Nodos azules**: Servidores
- 🟢 **Nodos verdes**: Aplicaciones
- ➡️ **Flechas**: Conexiones con protocolo:puerto

#### 3.5 Buscar un Servidor
1. En el campo de búsqueda, escribe: **"APP-SERVER-01"**
2. Presiona **Enter** o haz clic en **"Buscar"**
3. Verás:
   - ✅ Conexiones entrantes (desde WEB-SERVER-01, WEB-SERVER-02)
   - ✅ Conexiones salientes (hacia DB-SERVER-01, CACHE-SERVER-01, etc.)
   - ✅ Grafo filtrado con solo las dependencias relacionadas

---

## 🎯 Pruebas Rápidas

### Prueba 1: Ver Servidor Web
```
Buscar: WEB-SERVER-01
Resultado: Verás conexiones desde LOAD-BALANCER-01 y hacia APP-SERVER-01
```

### Prueba 2: Ver Base de Datos
```
Buscar: DB-SERVER-01
Resultado: Verás todas las aplicaciones que se conectan a la BD
```

### Prueba 3: Ver Servidor de Monitoreo
```
Buscar: MONITOR-SERVER-01
Resultado: Verás conexiones hacia todos los servidores monitoreados
```

---

## 🎨 Controles del Grafo

| Acción | Cómo hacerlo |
|--------|--------------|
| **Zoom In** | Rueda del mouse hacia arriba |
| **Zoom Out** | Rueda del mouse hacia abajo |
| **Mover vista** | Arrastra el fondo del grafo |
| **Mover nodo** | Arrastra un nodo individual |
| **Ajustar vista** | Haz clic en el botón "Fit View" |
| **Ver detalles** | Pasa el mouse sobre las conexiones |

---

## 📁 Usar tu Propio Archivo

### Formato Mínimo Requerido

Tu archivo Excel debe tener estas columnas:

| source | destination | port | protocol |
|--------|-------------|------|----------|
| SERVER-A | SERVER-B | 80 | TCP |
| SERVER-B | SERVER-C | 3306 | TCP |

### Nombres Alternativos Aceptados

El sistema detecta automáticamente estas variaciones:

**Para "source":**
- origen, from, source_server, source_host, servidor_origen

**Para "destination":**
- destino, to, dest, destination_server, servidor_destino

**Para "port":**
- puerto, destination_port, dest_port, puerto_destino

**Para "protocol":**
- protocolo, proto

### Columnas Opcionales (Recomendadas)

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| service | Nombre del servicio | HTTP, MySQL, Redis |
| source_app | Aplicación origen | Frontend, Backend |
| destination_app | Aplicación destino | Database, Cache |

---

## 🔍 Ejemplos de Búsqueda

### Búsqueda Exacta
```
Buscar: "APP-SERVER-01"
Encuentra: APP-SERVER-01
```

### Búsqueda Parcial
```
Buscar: "APP"
Encuentra: APP-SERVER-01, APP-SERVER-02
```

### Búsqueda Case-Insensitive
```
Buscar: "app-server"
Encuentra: APP-SERVER-01, APP-SERVER-02
```

---

## ❓ Preguntas Frecuentes

### ¿Cuántos servidores puedo visualizar?
El sistema maneja hasta 1000 servidores sin problemas. Para más, considera filtrar por aplicación.

### ¿Puedo exportar el grafo?
Actualmente no, pero está en la lista de mejoras futuras.

### ¿Los datos se guardan?
Los datos se mantienen en memoria durante la sesión. Al recargar la página, debes volver a cargar el archivo.

### ¿Funciona con archivos de Matilda/Cloudamize?
Sí, el parser detecta automáticamente el formato de múltiples herramientas.

### ¿Puedo ver más de 2 niveles de dependencias?
Actualmente está limitado a 2 niveles para mantener el grafo legible.

---

## 🐛 Solución de Problemas Rápida

### Problema: "npm no reconocido"
```batch
# Solución: Instala Node.js primero
1-INSTALAR-NODEJS.bat
```

### Problema: El grafo no se muestra
```
1. Presiona F12 para abrir la consola del navegador
2. Busca errores en rojo
3. Recarga la página (Ctrl+R)
4. Intenta cargar el archivo nuevamente
```

### Problema: "No se encontró hoja de dependencias"
```
1. Abre el Excel
2. Verifica que tenga una hoja con datos
3. Renombra la hoja a "Dependencies" o "Network"
4. Asegúrate de que tenga las columnas: source, destination, port, protocol
```

### Problema: Búsqueda sin resultados
```
1. Verifica que el nombre del servidor esté en el archivo
2. Intenta buscar solo parte del nombre (ej: "APP" en vez de "APP-SERVER-01")
3. Revisa que el archivo se haya cargado correctamente
```

---

## 📚 Documentación Adicional

- **Guía Completa**: `DEPENDENCY-MAP-GUIDE.md`
- **README Técnico**: `DEPENDENCY-MODULE-README.md`
- **Resumen de Implementación**: `MODULO-DEPENDENCIAS-COMPLETADO.md`

---

## 🎉 ¡Listo!

Ahora tienes un mapa interactivo de todas las dependencias de tu infraestructura.

**Próximos pasos sugeridos:**
1. Explora el archivo de ejemplo
2. Carga tu propio archivo de dependencias
3. Identifica grupos de servidores para migración
4. Documenta las dependencias críticas
5. Planifica tu migración a AWS

**¿Necesitas ayuda?** Revisa los archivos de documentación o abre la consola del navegador para ver logs detallados.

---

**¡Feliz mapeo de dependencias!** 🗺️✨
