# 🎯 Guía Visual - Cómo Usar el Módulo de Dependencias

## ✅ TODO ESTÁ LISTO Y FUNCIONANDO

El módulo ya tiene TODAS las funcionalidades implementadas y está corriendo en tu máquina.

---

## 🌐 PASO 1: Abrir la Aplicación

### Abre tu navegador y ve a:
```
http://localhost:3005
```

**Verás la pantalla principal del MAP (Migration Assessment Platform)**

---

## 📍 PASO 2: Ir al Módulo de Dependencias

### En la pantalla principal:

1. **Haz clic en la fase "Assess"** (primera pestaña en la parte superior)
2. **Busca la pestaña "Mapa de Dependencias"** (tiene un icono de red 🌐)
3. **Haz clic en "Mapa de Dependencias"**

```
┌─────────────────────────────────────────────────────────────┐
│ [Assess] [Mobilize] [Migrate]                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Pestañas dentro de Assess:                                  │
│ • Descubrimiento Rápido                                     │
│ • 🌐 Mapa de Dependencias  ← AQUÍ                          │
│ • Reporte TCO                                               │
│ • Preparación para Migración                                │
│ • ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📤 PASO 3: Subir Archivo Excel

### Verás esta pantalla:

```
┌─────────────────────────────────────────────────────────────┐
│ 🌐 Mapa de Dependencias de Red                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Archivo Excel de Dependencias (MPA)                         │
│ [Seleccionar archivo...]                    [Cargar]        │
│ Soporta archivos de Matilda, Cloudamize, Concierto         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Acciones:

1. **Haz clic en "Seleccionar archivo"**
2. **Busca tu archivo Excel** (o usa `sample-dependencies.xlsx` para probar)
3. **Haz clic en "Cargar"**
4. **Espera 2-3 segundos** mientras se procesa

---

## 🎉 PASO 4: Ver Resultados AUTOMÁTICOS

### Después de cargar, AUTOMÁTICAMENTE verás:

### A) Estadísticas (4 Tarjetas)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│      33      │      16      │      13      │      12      │
│ Dependencias │  Servidores  │ Aplicaciones │   Puertos    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### B) Sección de Búsqueda
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Buscar Dependencias                                      │
├─────────────────────────────────────────────────────────────┤
│ [Buscar por nombre de servidor...]        [Buscar]         │
└─────────────────────────────────────────────────────────────┘
```

### C) Tabla Completa de Dependencias
```
┌─────────────────────────────────────────────────────────────┐
│ 💾 Todas las Dependencias (33)                              │
├─────────────────────────────────────────────────────────────┤
│ Servidor  │ Servidor  │ Puerto │ Proto │ Servicio │ App   │
│ Origen    │ Destino   │        │       │          │ Orig  │
├───────────┼───────────┼────────┼───────┼──────────┼───────┤
│ WEB-01    │ APP-01    │ 8080   │ TCP   │ HTTP     │ Front │
│ APP-01    │ DB-01     │ 3306   │ TCP   │ MySQL    │ Back  │
│ APP-01    │ CACHE-01  │ 6379   │ TCP   │ Redis    │ Back  │
│ ...       │ ...       │ ...    │ ...   │ ...      │ ...   │
└───────────┴───────────┴────────┴───────┴──────────┴───────┘
```

### D) Gráfico Visual Interactivo
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Visualización de Dependencias                            │
│                                [Exportar PDF] [Exportar Word]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         🔵 WEB-SERVER-01                                    │
│              │                                               │
│              │ TCP:8080                                      │
│              ↓                                               │
│         🔵 APP-SERVER-01                                    │
│              │                                               │
│              ├─ TCP:3306 ──→ 🔵 DB-SERVER-01               │
│              │                                               │
│              └─ TCP:6379 ──→ 🔵 CACHE-SERVER-01            │
│                                                              │
│ [Zoom +/-] [Pan] [Fit View]                                 │
│ 🔵 Servidores  🟢 Aplicaciones                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 PASO 5: Buscar un Servidor Específico

### Para ver las dependencias de un servidor:

1. **Escribe el nombre del servidor** en el campo de búsqueda
   - Ejemplo: `APP-SERVER-01`
   - Ejemplo: `WEB-SERVER`
   - Ejemplo: `DB`

2. **Presiona Enter** o haz clic en "Buscar"

3. **Verás automáticamente:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🖥️ APP-SERVER-01                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Conexiones Entrantes (2)    │ Conexiones Salientes (3)     │
│ ┌─────────────────────────┐ │ ┌─────────────────────────┐  │
│ │ WEB-SERVER-01           │ │ │ DB-SERVER-01            │  │
│ │ TCP:8080 (HTTP)         │ │ │ TCP:3306 (MySQL)        │  │
│ │                         │ │ │                         │  │
│ │ WEB-SERVER-02           │ │ │ CACHE-SERVER-01         │  │
│ │ TCP:8080 (HTTP)         │ │ │ TCP:6379 (Redis)        │  │
│ └─────────────────────────┘ │ │                         │  │
│                              │ │ MQ-SERVER-01            │  │
│                              │ │ TCP:5672 (RabbitMQ)     │  │
│                              │ └─────────────────────────┘  │
│                                                              │
│ Aplicaciones Relacionadas:                                  │
│ [Frontend] [Backend] [Database] [Cache] [MessageQueue]      │
│                                                              │
│ Grafo Filtrado (solo dependencias relacionadas):            │
│ [Muestra solo los servidores conectados a APP-SERVER-01]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📥 PASO 6: Exportar Reporte

### Para descargar un reporte:

1. **Haz clic en "Exportar HTML/PDF"** o **"Exportar Word"**
   - Los botones están en la cabecera del grafo visual

2. **Se descarga automáticamente** un archivo HTML

3. **Abre el archivo HTML** en tu navegador

4. **Guarda como PDF:**
   - Presiona `Ctrl + P`
   - Selecciona "Guardar como PDF"
   - Haz clic en "Guardar"

### El reporte incluye:

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Reporte de Dependencias de Red                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Servidor Analizado: APP-SERVER-01                           │
│ Fecha: 24/02/2024 18:35:00                                  │
│ Total dependencias: 33                                       │
│ Servidores únicos: 16                                        │
│                                                              │
│ 🔽 Conexiones Entrantes (2)                                 │
│ ┌────────────┬───────┬──────────┬──────────┬──────────┐    │
│ │ Origen     │ Puerto│ Protocolo│ Servicio │ App      │    │
│ ├────────────┼───────┼──────────┼──────────┼──────────┤    │
│ │ WEB-01     │ 8080  │ TCP      │ HTTP     │ Frontend │    │
│ │ WEB-02     │ 8080  │ TCP      │ HTTP     │ Frontend │    │
│ └────────────┴───────┴──────────┴──────────┴──────────┘    │
│                                                              │
│ 🔼 Conexiones Salientes (3)                                 │
│ ┌────────────┬───────┬──────────┬──────────┬──────────┐    │
│ │ Destino    │ Puerto│ Protocolo│ Servicio │ App      │    │
│ ├────────────┼───────┼──────────┼──────────┼──────────┤    │
│ │ DB-01      │ 3306  │ TCP      │ MySQL    │ Database │    │
│ │ CACHE-01   │ 6379  │ TCP      │ Redis    │ Cache    │    │
│ │ MQ-01      │ 5672  │ TCP      │ RabbitMQ │ Queue    │    │
│ └────────────┴───────┴──────────┴──────────┴──────────┘    │
│                                                              │
│ 🖥️ Servidores Relacionados                                  │
│ WEB-SERVER-01, WEB-SERVER-02, DB-SERVER-01, CACHE-01...    │
│                                                              │
│ 📱 Aplicaciones Relacionadas                                │
│ Frontend, Backend, Database, Cache, MessageQueue            │
│                                                              │
│ © 2024 SoftwareOne - AWS Migration Assessment Platform      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎮 Controles del Gráfico

### Interactúa con el grafo visual:

| Acción | Cómo hacerlo |
|--------|--------------|
| **Zoom In** | Rueda del mouse hacia arriba |
| **Zoom Out** | Rueda del mouse hacia abajo |
| **Mover vista** | Arrastra el fondo del grafo |
| **Mover nodo** | Arrastra un nodo individual |
| **Ajustar vista** | Botón "Fit View" en los controles |
| **Ver detalles** | Pasa el mouse sobre las conexiones |

---

## 📋 Formato del Archivo Excel

### Tu archivo Excel debe tener estas columnas:

**MÍNIMAS (requeridas):**
- `source` o `origen` → Servidor que inicia la conexión
- `destination` o `destino` → Servidor que recibe la conexión
- `port` o `puerto` → Puerto de la conexión
- `protocol` o `protocolo` → Protocolo (TCP, UDP, etc.)

**OPCIONALES (recomendadas):**
- `service` o `servicio` → Nombre del servicio (HTTP, MySQL, etc.)
- `source_app` → Aplicación origen
- `destination_app` → Aplicación destino
- `source_ip` → IP del servidor origen
- `destination_ip` → IP del servidor destino

### Ejemplo de datos:

```
| source        | destination   | port | protocol | service | source_app | destination_app |
|---------------|---------------|------|----------|---------|------------|-----------------|
| WEB-SERVER-01 | APP-SERVER-01 | 8080 | TCP      | HTTP    | Frontend   | Backend         |
| APP-SERVER-01 | DB-SERVER-01  | 3306 | TCP      | MySQL   | Backend    | Database        |
| APP-SERVER-01 | CACHE-01      | 6379 | TCP      | Redis   | Backend    | Cache           |
```

### El parser lee TODAS las pestañas automáticamente:
- No importa en qué pestaña estén tus datos
- Busca en todas las pestañas del Excel
- Combina todos los datos encontrados
- Muestra en consola qué pestañas procesó

---

## 🎯 Ejemplo Completo Paso a Paso

### Escenario: Analizar dependencias de tu infraestructura

#### 1. Preparar archivo
```
✓ Tienes un Excel con dependencias de Matilda/Cloudamize/Concierto
✓ El archivo tiene columnas: source, destination, port, protocol
✓ (Opcional) También tiene: service, source_app, destination_app
```

#### 2. Abrir aplicación
```
✓ Abre http://localhost:3005
✓ Click en "Assess"
✓ Click en "Mapa de Dependencias"
```

#### 3. Cargar archivo
```
✓ Click en "Seleccionar archivo"
✓ Elige tu Excel
✓ Click en "Cargar"
✓ Espera 2-3 segundos
```

#### 4. Ver resultados automáticos
```
✓ Estadísticas: 150 dependencias, 45 servidores, 20 aplicaciones
✓ Tabla completa con todas las 150 dependencias
✓ Grafo visual con todos los 45 servidores conectados
```

#### 5. Buscar servidor crítico
```
✓ Escribe "PROD-APP-01" en búsqueda
✓ Presiona Enter
✓ Ve 8 conexiones entrantes y 12 salientes
✓ Identifica todas las aplicaciones dependientes
```

#### 6. Exportar para presentación
```
✓ Click en "Exportar HTML/PDF"
✓ Abre el archivo descargado
✓ Guarda como PDF
✓ Comparte con el equipo
```

---

## ✅ Checklist de Uso

Antes de empezar, verifica:

- [ ] Aplicación corriendo en http://localhost:3005
- [ ] Backend corriendo en http://localhost:4000
- [ ] Tienes un archivo Excel con dependencias
- [ ] El Excel tiene columnas: source, destination, port, protocol

Para probar:

- [ ] Usa `sample-dependencies.xlsx` (en la raíz del proyecto)
- [ ] Carga el archivo
- [ ] Ve las estadísticas y tabla
- [ ] Busca "APP-SERVER-01"
- [ ] Exporta el reporte

---

## 🐛 Solución de Problemas

### No veo la pestaña "Mapa de Dependencias"
**Solución:**
- Verifica que estés en la fase "Assess"
- Recarga la página (Ctrl+R)
- Verifica que el frontend esté corriendo

### Error al cargar archivo
**Solución:**
- Verifica que sea un archivo .xlsx o .xls
- Asegúrate de que tenga las columnas mínimas
- Revisa que tenga datos (no esté vacío)
- Mira la consola del navegador (F12) para ver el error

### No se muestra el grafo
**Solución:**
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica que reactflow esté instalado
- Recarga la página

### Búsqueda sin resultados
**Solución:**
- Verifica el nombre del servidor
- Intenta buscar solo parte del nombre
- Asegúrate de que el servidor exista en el archivo

---

## 📞 Ayuda Adicional

### Documentación disponible:
- `MEJORAS-MODULO-COMPLETADAS.md` - Todas las funcionalidades
- `COMO-USAR-MODULO-DEPENDENCIAS.md` - Guía completa
- `DEPENDENCY-MAP-GUIDE.md` - Guía detallada
- `MODULO-LISTO-PARA-USAR.txt` - Resumen visual

### Archivos de ejemplo:
- `sample-dependencies.xlsx` - 33 dependencias de ejemplo
- Ubicación: `C:\kiro\swo-assessment-center\sample-dependencies.xlsx`

---

## 🎉 ¡Listo para Usar!

**El módulo está 100% funcional con:**
- ✅ Carga de archivos Excel
- ✅ Lectura de TODAS las pestañas
- ✅ Tabla completa de dependencias
- ✅ Búsqueda por servidor
- ✅ Gráfico visual interactivo
- ✅ Exportación a PDF/Word
- ✅ Visualización automática

**Abre http://localhost:3005 y empieza a explorar!** 🗺️✨

---

**Estado:** ✅ FUNCIONANDO  
**URL:** http://localhost:3005  
**Ubicación:** Assess → Mapa de Dependencias  
**Archivo de prueba:** sample-dependencies.xlsx
