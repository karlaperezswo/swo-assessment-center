# 🚀 Migration Planner - Guía Completa

## Descripción

El Migration Planner es una herramienta integrada en el módulo de dependencias que calcula automáticamente las "waves" (olas) de migración a AWS basándose en las dependencias entre servidores.

---

## 🎯 ¿Qué es una Wave de Migración?

Una **wave** es un grupo de servidores que pueden migrarse juntos porque:
1. No dependen de servidores que aún no han sido migrados
2. Todas sus dependencias ya están en waves anteriores
3. Pueden migrarse en paralelo sin romper la aplicación

---

## 🔄 Algoritmo de Cálculo

### Wave 1: Infraestructura Base
- Servidores **sin dependencias** (no dependen de nadie)
- Ejemplos: Bases de datos, servicios de caché, storage
- Estos deben migrarse primero

### Wave 2+: Capas Superiores
- Servidores que **solo dependen** de servidores en waves anteriores
- Wave N = max(wave de dependencias) + 1
- Ejemplos: APIs que dependen de DB (Wave 1), Web servers que dependen de APIs (Wave 2)

### Última Wave: Dependencias Circulares
- Servidores con **dependencias circulares** detectadas
- Requieren revisión manual antes de migrar
- Se marcan con advertencia

---

## 🎨 Características Visuales

### Colores de Waves
```
Wave 1: Verde (#48bb78)   - Infraestructura base
Wave 2: Azul (#4299e1)    - Capa de servicios
Wave 3: Naranja (#ed8936) - Capa de aplicaciones
Wave 4: Morado (#9f7aea)  - Capa de presentación
Wave 5: Rojo (#f56565)    - Servicios adicionales
Wave 6: Teal (#38b2ac)    - Servicios especiales
Wave 7: Amarillo (#ecc94b) - Servicios auxiliares
Wave 8: Rosa (#ed64a6)    - Servicios finales
```

### Iconos por Tipo de Servidor
```
🗄️ Database  - Bases de datos (MySQL, PostgreSQL, SQL Server)
⚡ Cache     - Servicios de caché (Redis, Memcached)
📬 Queue     - Colas de mensajes (Kafka, RabbitMQ)
🔐 Auth      - Servicios de autenticación (LDAP, AD)
💾 Storage   - Almacenamiento (S3, Blob Storage)
🔌 API       - APIs y servicios REST/GraphQL
📊 Analytics - Servicios de análisis y BI
📱 App       - Servidores de aplicaciones
🌐 Web       - Servidores web (Nginx, Apache)
☁️ CDN       - Content Delivery Networks
🖥️ Default   - Otros servidores
```

---

## 📊 Interfaz del Migration Planner

### Panel Izquierdo

#### 1. Estadísticas
- **Servidores**: Total de servidores a migrar
- **Conexiones**: Total de dependencias entre servidores
- **Waves**: Número de waves calculadas
- **Sin Asignar**: Servidores con dependencias circulares

#### 2. Lista de Waves
- Click en una wave para resaltarla en el grafo
- Muestra los primeros 5 servidores de cada wave
- Contador de servidores por wave
- Botón "Ver todos" para resetear filtro

#### 3. Información del Servidor Seleccionado
- **→ Depende de**: Servidores de los que depende (debe migrar después)
- **← Dependientes**: Servidores que dependen de él (deben migrar después)
- Muestra puertos de conexión

### Panel Derecho

#### Mapa de Red Interactivo (Vis.js)
- **Nodos**: Servidores coloreados por wave
- **Flechas**: Dirección de dependencia (A → B = "A depende de B")
- **Drag & Drop**: Arrastra nodos para reorganizar
- **Zoom**: Rueda del mouse para acercar/alejar
- **Pan**: Click y arrastra el fondo para mover
- **Click en nodo**: Ver información del servidor

#### Leyenda
- Muestra los colores de las primeras 6 waves
- Indica el número de wave y su color

---

## 🚀 Cómo Usar el Migration Planner

### Paso 1: Cargar Dependencias
1. Ve al módulo "Dependency Map"
2. Carga un archivo Excel MPA con dependencias
3. Espera a que se procesen las dependencias

### Paso 2: Abrir Migration Planner
1. Haz click en el botón **"Abrir Migration Planner"**
2. El sistema calculará automáticamente las waves
3. Se abrirá el planner en pantalla completa

### Paso 3: Explorar Waves
1. **Ver waves**: Lista en el panel izquierdo
2. **Filtrar por wave**: Click en una wave para resaltarla
3. **Ver detalles**: Click en un servidor para ver sus dependencias

### Paso 4: Analizar Dependencias
1. **Selecciona un servidor** en el grafo o en la lista
2. Revisa sus dependencias:
   - **→ Depende de**: Estos deben migrarse ANTES
   - **← Dependientes**: Estos deben migrarse DESPUÉS
3. Verifica que el orden de waves sea correcto

### Paso 5: Exportar Plan
1. Click en **"Exportar CSV"**
2. Se descarga un archivo con:
   - Servidor
   - Tipo
   - Wave asignada
   - Lista de dependencias
3. Usa este archivo para planificar la migración

---

## 📋 Formato del CSV Exportado

```csv
Servidor,Tipo,Wave,Dependencias
database-prod-01,database,1,
cache-prod-01,cache,1,
api-prod-01,api,2,database-prod-01;cache-prod-01
web-prod-01,web,3,api-prod-01
```

### Columnas:
- **Servidor**: Nombre del servidor
- **Tipo**: Tipo detectado automáticamente
- **Wave**: Número de wave asignada
- **Dependencias**: Lista de servidores de los que depende (separados por ;)

---

## ⚠️ Advertencias y Consideraciones

### Dependencias Circulares
Si ves servidores en la última wave con advertencia:
```
⚠️ X servidor(es) con dependencias circulares detectadas
```

**Qué significa:**
- Hay un ciclo de dependencias (A → B → C → A)
- No se puede determinar automáticamente el orden de migración

**Qué hacer:**
1. Identifica los servidores involucrados
2. Revisa las dependencias manualmente
3. Considera:
   - Romper la dependencia circular
   - Migrar juntos en la misma wave
   - Usar configuración temporal durante la migración

### Validación Manual
Siempre revisa el plan generado:
1. ✅ Verifica que las dependencias sean correctas
2. ✅ Confirma que el orden de waves tenga sentido
3. ✅ Identifica dependencias críticas
4. ✅ Planifica ventanas de mantenimiento
5. ✅ Considera rollback plans

---

## 🎯 Ejemplo Práctico

### Escenario: Aplicación Web con 3 Capas

#### Arquitectura:
```
WEB-01 → API-01 → DB-01
WEB-02 → API-01 → CACHE-01
```

#### Waves Calculadas:

**Wave 1** (Verde - Infraestructura):
- DB-01 (database)
- CACHE-01 (cache)

**Wave 2** (Azul - Servicios):
- API-01 (api) - Depende de DB-01 y CACHE-01

**Wave 3** (Naranja - Presentación):
- WEB-01 (web) - Depende de API-01
- WEB-02 (web) - Depende de API-01

#### Plan de Migración:
1. **Día 1**: Migrar DB-01 y CACHE-01
2. **Día 2**: Migrar API-01 (después de validar Wave 1)
3. **Día 3**: Migrar WEB-01 y WEB-02 (después de validar Wave 2)

---

## 🔧 Tecnologías Utilizadas

### Frontend
- **React + TypeScript**: Componente principal
- **Vis.js Network**: Visualización del grafo
- **Tailwind CSS**: Estilos y diseño
- **Lucide React**: Iconos

### Librería de Visualización
- **Vis.js v9.x**: https://visjs.github.io/vis-network/
- **CDN**: https://unpkg.com/vis-network/standalone/umd/vis-network.min.js
- Carga automática si no está disponible

### Algoritmo
- Análisis de grafos dirigidos
- Detección de dependencias circulares
- Cálculo de niveles topológicos

---

## 📈 Mejores Prácticas

### Antes de Migrar
1. ✅ Exporta el plan a CSV
2. ✅ Revisa todas las dependencias
3. ✅ Identifica dependencias críticas
4. ✅ Planifica ventanas de mantenimiento
5. ✅ Prepara rollback plans

### Durante la Migración
1. ✅ Migra wave por wave (no saltes waves)
2. ✅ Valida cada wave antes de continuar
3. ✅ Monitorea las conexiones
4. ✅ Ten un plan de rollback listo
5. ✅ Documenta problemas encontrados

### Después de Migrar
1. ✅ Valida todas las conexiones
2. ✅ Verifica el rendimiento
3. ✅ Actualiza la documentación
4. ✅ Archiva el plan de migración
5. ✅ Documenta lecciones aprendidas

---

## 🐛 Solución de Problemas

### El grafo no se muestra
**Causa**: Vis.js no se cargó correctamente
**Solución**: Recarga la página o verifica la conexión a internet

### Waves incorrectas
**Causa**: Dependencias mal definidas en el archivo Excel
**Solución**: Revisa el archivo Excel y recarga

### Muchos servidores sin asignar
**Causa**: Dependencias circulares complejas
**Solución**: Revisa manualmente las dependencias y considera romper ciclos

### El grafo está muy desordenado
**Causa**: Muchos servidores con pocas conexiones
**Solución**: 
- Usa el filtro por wave
- Arrastra nodos manualmente
- Click en "Recalcular" para reorganizar

---

## 🎓 Recursos Adicionales

### Documentación
- Vis.js Network: https://visjs.github.io/vis-network/docs/network/
- Ejemplos Vis.js: https://visjs.github.io/vis-network/examples/

### Conceptos
- Grafos dirigidos acíclicos (DAG)
- Ordenamiento topológico
- Detección de ciclos en grafos

---

## ✅ Checklist de Migración

### Pre-Migración
- [ ] Plan de migración exportado
- [ ] Dependencias validadas
- [ ] Ventanas de mantenimiento planificadas
- [ ] Rollback plan preparado
- [ ] Equipo notificado

### Por Wave
- [ ] Servidores de la wave identificados
- [ ] Dependencias de waves anteriores validadas
- [ ] Configuración de red preparada
- [ ] Monitoreo configurado
- [ ] Migración ejecutada
- [ ] Validación post-migración completada

### Post-Migración
- [ ] Todas las conexiones validadas
- [ ] Rendimiento verificado
- [ ] Documentación actualizada
- [ ] Plan archivado
- [ ] Lecciones aprendidas documentadas

---

## 🎉 Conclusión

El Migration Planner automatiza el proceso de planificación de migraciones complejas, reduciendo errores y optimizando el orden de migración. Úsalo como guía, pero siempre valida manualmente el plan generado antes de ejecutar la migración.

**¡Buena suerte con tu migración a AWS!** 🚀
