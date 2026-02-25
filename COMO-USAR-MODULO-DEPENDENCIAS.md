# 🗺️ Cómo Usar el Módulo de Mapa de Dependencias

## ✅ El Módulo YA Está Funcionando

Todo lo que pediste ya está implementado y funcionando en:
**http://localhost:3005**

---

## 📍 Ubicación del Módulo

### Paso 1: Abrir la Aplicación
```
http://localhost:3005
```

### Paso 2: Navegar al Módulo
1. Haz clic en la fase **"Assess"** (primera pestaña)
2. Busca la pestaña **"Mapa de Dependencias"** (icono de red 🌐)
3. Haz clic en ella

---

## 🎯 Funcionalidades Disponibles

### 1️⃣ CARGAR ARCHIVO EXCEL MPA

**Ubicación**: Sección superior del módulo

**Qué hace**:
- Permite cargar archivos Excel con dependencias de red
- Compatible con: Matilda, Cloudamize, Concierto, AWS MPA

**Columnas que detecta automáticamente**:
- ✅ **Servidor Origen**: source, origen, from, source_server, source_host
- ✅ **Servidor Destino**: destination, destino, to, dest, destination_server
- ✅ **Puerto**: port, puerto, destination_port, dest_port
- ✅ **Protocolo**: protocol, protocolo, proto
- ✅ **Aplicación Origen**: source_app, app_origen
- ✅ **Aplicación Destino**: destination_app, app_destino
- ✅ **Servicio**: service, servicio, service_name

**Cómo usar**:
1. Haz clic en **"Seleccionar archivo"**
2. Elige tu archivo Excel MPA
3. Haz clic en **"Cargar"**
4. Espera 2-3 segundos

**Resultado**:
- 📊 Verás estadísticas: Total dependencias, servidores únicos, aplicaciones, puertos
- 🗺️ Se mostrará el grafo completo de dependencias

---

### 2️⃣ BUSCAR SERVIDOR

**Ubicación**: Sección de búsqueda (debajo de la carga)

**Qué hace**:
- Busca un servidor específico por nombre
- Muestra todas sus dependencias (entrantes y salientes)
- Filtra el grafo para mostrar solo conexiones relacionadas

**Cómo usar**:
1. Escribe el nombre del servidor en el campo de búsqueda
   - Ejemplo: "APP-SERVER-01"
   - Ejemplo: "WEB-SERVER"
   - Ejemplo: "DB"
2. Presiona **Enter** o haz clic en **"Buscar"**

**Resultado**:
Verás 4 secciones:

#### A) Conexiones Entrantes (Verde)
Lista de servidores que SE CONECTAN A tu servidor buscado:
```
Servidor Origen → Tu Servidor
Protocolo:Puerto (Servicio)
```

Ejemplo:
```
WEB-SERVER-01
TCP:8080 (HTTP)
```

#### B) Conexiones Salientes (Azul)
Lista de servidores a los que TU SERVIDOR SE CONECTA:
```
Tu Servidor → Servidor Destino
Protocolo:Puerto (Servicio)
```

Ejemplo:
```
DB-SERVER-01
TCP:3306 (MySQL)
```

#### C) Aplicaciones Relacionadas
Badges con nombres de aplicaciones involucradas:
```
[Frontend] [Backend] [Database]
```

#### D) Grafo Filtrado
Visualización gráfica de todas las dependencias relacionadas (hasta 2 niveles)

---

### 3️⃣ VISUALIZACIÓN DEL GRAFO

**Ubicación**: Sección inferior (canvas grande)

**Qué muestra**:
- 🔵 **Nodos azules**: Servidores
- 🟢 **Nodos verdes**: Aplicaciones
- ➡️ **Flechas animadas**: Conexiones con dirección
- 🏷️ **Etiquetas**: Protocolo:Puerto en cada conexión

**Controles**:
- **Zoom In/Out**: Rueda del mouse o botones +/-
- **Mover vista**: Arrastra el fondo del grafo
- **Mover nodo**: Arrastra un nodo individual
- **Ajustar vista**: Botón "Fit View" (ajusta todo en pantalla)

**Información en las conexiones**:
Cada flecha muestra:
```
TCP:8080
```
Donde:
- TCP = Protocolo
- 8080 = Puerto

---

## 📋 Formato del Archivo Excel

### Estructura Mínima Requerida

Tu archivo Excel debe tener una hoja con estas columnas:

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| source / origen | Servidor que inicia la conexión | WEB-SERVER-01 |
| destination / destino | Servidor que recibe la conexión | APP-SERVER-01 |
| port / puerto | Puerto de la conexión | 8080 |
| protocol / protocolo | Protocolo usado | TCP |

### Columnas Opcionales (Recomendadas)

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| service / servicio | Nombre del servicio | HTTP, MySQL, Redis |
| source_app | Aplicación origen | Frontend |
| destination_app | Aplicación destino | Backend |
| source_ip | IP del servidor origen | 192.168.1.10 |
| destination_ip | IP del servidor destino | 192.168.1.20 |

### Ejemplo de Datos

```
| source        | destination   | port | protocol | service | source_app | destination_app |
|---------------|---------------|------|----------|---------|------------|-----------------|
| WEB-SERVER-01 | APP-SERVER-01 | 8080 | TCP      | HTTP    | Frontend   | Backend         |
| APP-SERVER-01 | DB-SERVER-01  | 3306 | TCP      | MySQL   | Backend    | Database        |
| APP-SERVER-01 | CACHE-01      | 6379 | TCP      | Redis   | Backend    | Cache           |
```

---

## 🎬 Ejemplo Paso a Paso

### Escenario: Analizar dependencias de APP-SERVER-01

#### Paso 1: Cargar Archivo
1. Abre http://localhost:3005
2. Ve a Assess → Mapa de Dependencias
3. Carga tu archivo Excel MPA
4. Verás el grafo completo

#### Paso 2: Buscar Servidor
1. En el campo de búsqueda, escribe: **APP-SERVER-01**
2. Presiona Enter

#### Paso 3: Analizar Resultados

**Conexiones Entrantes** (quién se conecta a APP-SERVER-01):
```
✅ WEB-SERVER-01
   TCP:8080 (HTTP)
   
✅ WEB-SERVER-02
   TCP:8080 (HTTP)
   
✅ API-GATEWAY-01
   TCP:8080 (HTTP)
```

**Conexiones Salientes** (a quién se conecta APP-SERVER-01):
```
✅ DB-SERVER-01
   TCP:3306 (MySQL)
   
✅ CACHE-SERVER-01
   TCP:6379 (Redis)
   
✅ MQ-SERVER-01
   TCP:5672 (RabbitMQ)
```

**Aplicaciones Relacionadas**:
```
[Frontend] [Backend] [Database] [Cache] [MessageQueue]
```

**Grafo Filtrado**:
Muestra visualmente todas estas conexiones con flechas y nodos coloreados.

---

## 📊 Información que Obtienes

### Estadísticas Generales (después de cargar)
- **Total de Dependencias**: Número total de conexiones
- **Servidores Únicos**: Cantidad de servidores diferentes
- **Aplicaciones Únicas**: Cantidad de aplicaciones identificadas
- **Puertos Únicos**: Cantidad de puertos diferentes utilizados

### Por Servidor (después de buscar)
- **Conexiones Entrantes**: Lista completa con origen, puerto, protocolo
- **Conexiones Salientes**: Lista completa con destino, puerto, protocolo
- **Servidores Relacionados**: Todos los servidores conectados directa o indirectamente
- **Aplicaciones Relacionadas**: Todas las aplicaciones involucradas
- **Grafo de Dependencias**: Visualización hasta 2 niveles de profundidad

---

## 🎯 Casos de Uso

### 1. Planificar Migración
**Objetivo**: Identificar qué servidores migrar juntos

**Cómo**:
1. Busca el servidor principal de una aplicación
2. Revisa sus dependencias entrantes y salientes
3. Identifica el grupo completo de servidores relacionados
4. Planifica migrarlos en la misma ola

### 2. Análisis de Impacto
**Objetivo**: Evaluar impacto de apagar un servidor

**Cómo**:
1. Busca el servidor que planeas apagar
2. Revisa las conexiones entrantes (quién depende de él)
3. Identifica servicios que se verán afectados
4. Planifica alternativas o notificaciones

### 3. Documentar Arquitectura
**Objetivo**: Crear documentación de dependencias

**Cómo**:
1. Carga el archivo MPA completo
2. Busca cada servidor crítico
3. Captura las listas de dependencias
4. Usa el grafo visual para presentaciones

### 4. Troubleshooting
**Objetivo**: Identificar causa de problemas de conectividad

**Cómo**:
1. Busca el servidor con problemas
2. Revisa todas sus conexiones
3. Verifica puertos y protocolos
4. Identifica posibles cuellos de botella

---

## 🔍 Búsqueda Avanzada

### Búsqueda Parcial
No necesitas el nombre completo:
```
Buscar: "APP"
Encuentra: APP-SERVER-01, APP-SERVER-02, APP-GATEWAY-01
```

### Búsqueda Case-Insensitive
No importan mayúsculas/minúsculas:
```
Buscar: "web-server"
Encuentra: WEB-SERVER-01, WEB-SERVER-02
```

### Dependencias Transitivas
El sistema busca hasta 2 niveles:
```
Buscar: APP-SERVER-01

Nivel 0: APP-SERVER-01
Nivel 1: WEB-SERVER-01, DB-SERVER-01, CACHE-01
Nivel 2: LOAD-BALANCER-01, DB-REPLICA-01
```

---

## 📁 Archivo de Ejemplo

Ya tienes un archivo de ejemplo listo para probar:

**Ubicación**:
```
C:\kiro\swo-assessment-center\sample-dependencies.xlsx
```

**Contenido**:
- 33 dependencias de red
- 16 servidores únicos
- 13 aplicaciones diferentes
- Arquitectura completa de 3 capas

**Servidores para probar búsqueda**:
- APP-SERVER-01
- WEB-SERVER-01
- DB-SERVER-01
- CACHE-SERVER-01
- MONITOR-SERVER-01

---

## ✅ Checklist de Uso

Antes de usar con tus datos reales:

- [ ] Aplicación corriendo en http://localhost:3005
- [ ] Backend corriendo en http://localhost:4000
- [ ] Probaste con sample-dependencies.xlsx
- [ ] Entiendes cómo cargar archivos
- [ ] Entiendes cómo buscar servidores
- [ ] Entiendes cómo leer el grafo
- [ ] Tu archivo Excel tiene las columnas correctas

---

## 🐛 Solución de Problemas

### No veo la pestaña "Mapa de Dependencias"
**Solución**: 
- Verifica que estés en la fase "Assess"
- Recarga la página (Ctrl+R)
- Verifica que el frontend esté corriendo

### Error al cargar archivo
**Solución**:
- Verifica que sea un archivo .xlsx o .xls
- Asegúrate de que tenga las columnas: source, destination, port, protocol
- Revisa que la hoja tenga datos

### Búsqueda sin resultados
**Solución**:
- Verifica el nombre del servidor (búsqueda parcial funciona)
- Asegúrate de que el servidor exista en el archivo cargado
- Intenta buscar solo parte del nombre

### Grafo no se muestra
**Solución**:
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Recarga la página
- Verifica que reactflow esté instalado

---

## 🎉 ¡Listo para Usar!

El módulo está completamente funcional con todas las características que pediste:

✅ Carga de archivos Excel MPA  
✅ Detección automática de columnas  
✅ Búsqueda por nombre de servidor  
✅ Listado de dependencias (origen y destino)  
✅ Información de puertos y protocolos  
✅ Aplicaciones relacionadas  
✅ Gráfico visual interactivo  
✅ Dependencias transitivas  

**Abre http://localhost:3005 y empieza a explorar tus dependencias!** 🗺️✨

---

**¿Necesitas ayuda?** Revisa:
- DEPENDENCY-MAP-GUIDE.md (guía completa)
- INICIO-RAPIDO-DEPENDENCIAS.md (tutorial rápido)
- ARQUITECTURA-DEPENDENCIAS.txt (detalles técnicos)
