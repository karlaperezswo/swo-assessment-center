# 📖 Guía de Uso - Diagramas de Wave Interactivos

## 🎯 ¿Qué son los Diagramas de Wave?

Los diagramas de wave son visualizaciones interactivas que muestran las dependencias específicas de cada wave de migración. Te permiten:

- Ver qué servidores están en cada wave
- Identificar dependencias internas (dentro de la wave)
- Detectar dependencias externas (con otras waves)
- Validar la planificación antes de migrar
- Exportar diagramas para documentación

---

## 🚀 Cómo Usar

### 1️⃣ Ver Diagrama de una Wave

**Opción A: Hover (Automático)**
1. Abre el Migration Planner
2. Pasa el mouse sobre cualquier wave card
3. El diagrama se muestra automáticamente
4. Aparece badge "🎨 Diagrama" en la wave

**Opción B: Botón Manual**
1. Abre el Migration Planner
2. Click en botón "Ver Diagrama" de la wave
3. Se abre el modal con el diagrama

### 2️⃣ Interpretar el Diagrama

**Servidores Resaltados (Borde Blanco)**
- Son los servidores que pertenecen a esta wave
- Fuente más grande y en negrita
- Tooltip muestra "✓ Wave X"

**Servidores Grises (Borde Normal)**
- Son dependencias externas (de otras waves)
- Fuente más pequeña
- Tooltip muestra "⚠️ Dependencia externa"

**Conexiones de Color (Gruesas)**
- Conexiones entre servidores de la misma wave
- Color de la wave (verde, azul, naranja, etc.)
- Opacidad 80%

**Conexiones Grises (Delgadas)**
- Conexiones con servidores de otras waves
- Color gris claro
- Opacidad 30%

### 3️⃣ Mover Servidores entre Waves

1. Arrastra un servidor de una wave
2. Suéltalo en otra wave
3. El diagrama se regenera automáticamente
4. Ves los cambios reflejados inmediatamente

**Ejemplo:**
```
Wave 1: [Server-A, Server-B, Server-C]
         ↓ Arrastrar Server-B a Wave 2
Wave 1: [Server-A, Server-C]
Wave 2: [Server-B, ...]

→ Diagrama de Wave 1 se regenera automáticamente
→ Diagrama de Wave 2 se regenera automáticamente
```

### 4️⃣ Recalcular Waves

1. Haz cambios manuales moviendo servidores
2. Click en botón "Recalcular"
3. Las waves se recalculan desde cero
4. Si hay un diagrama abierto, se regenera automáticamente

### 5️⃣ Exportar Diagrama

1. Abre el diagrama de una wave
2. Click en botón "Exportar PNG"
3. Se descarga imagen del diagrama
4. Nombre: `wave-X-diagram-YYYY-MM-DD.png`

---

## 📊 Información del Footer

El footer del modal muestra información útil:

**Leyenda Visual**
- 🔵 Círculo con borde blanco = Servidores de la wave
- ⚪ Círculo gris = Dependencias externas

**Contador de Conexiones**
- "5 internas, 3 externas"
- Internas: Conexiones dentro de la wave
- Externas: Conexiones con otras waves

---

## 💡 Casos de Uso Prácticos

### Caso 1: Validar Wave Antes de Migrar

**Problema:** Quieres asegurarte de que Wave 1 no tiene muchas dependencias externas

**Solución:**
1. Hover sobre Wave 1
2. Ver diagrama
3. Contar conexiones grises (externas)
4. Si hay muchas, considerar mover servidores
5. Exportar diagrama para documentación

### Caso 2: Optimizar Distribución de Servidores

**Problema:** Wave 3 tiene demasiadas dependencias externas

**Solución:**
1. Hover sobre Wave 3
2. Identificar servidores con muchas conexiones grises
3. Arrastrar esos servidores a waves más apropiadas
4. Ver regeneración automática del diagrama
5. Validar que las dependencias externas disminuyeron

### Caso 3: Documentar Planificación

**Problema:** Necesitas documentar la planificación de migración

**Solución:**
1. Abrir diagrama de cada wave
2. Exportar a PNG
3. Incluir imágenes en documento de planificación
4. Compartir con equipo de migración

### Caso 4: Análisis de Impacto

**Problema:** Quieres saber el impacto de mover un servidor

**Solución:**
1. Hover sobre wave origen
2. Ver diagrama actual
3. Arrastrar servidor a otra wave
4. Ver regeneración automática
5. Comparar antes/después
6. Decidir si el cambio es beneficioso

---

## 🎨 Colores de Servidores

Los servidores tienen colores según su tipo:

- 🗄️ **Database** (Rojo): Bases de datos
- ⚡ **Cache** (Naranja): Redis, Memcache
- 🔐 **Auth** (Rosa): Autenticación, LDAP
- 🔌 **API** (Verde): APIs, REST, GraphQL
- 📱 **App** (Azul): Aplicaciones
- 🌐 **Web** (Teal): Servidores web
- 💾 **Storage** (Cyan): Almacenamiento, S3
- 🖥️ **Otros** (Gris): Servidores genéricos

---

## ⚡ Tips y Trucos

### Tip 1: Hover Rápido
Pasa el mouse rápidamente sobre varias waves para comparar sus diagramas

### Tip 2: Exportar Todo
Exporta el diagrama de cada wave para tener documentación completa

### Tip 3: Validar Cambios
Después de mover servidores, siempre revisa el diagrama para validar

### Tip 4: Minimizar Dependencias Externas
Intenta que cada wave tenga pocas conexiones grises (externas)

### Tip 5: Usar Badges
Los badges "📊 Mapa activo" y "🎨 Diagrama" te ayudan a saber qué estás viendo

---

## 🔍 Solución de Problemas

### Problema: El diagrama no se muestra
**Solución:** 
- Verifica que la wave tenga servidores
- Verifica que haya dependencias
- Intenta hacer click en "Ver Diagrama"

### Problema: El diagrama no se regenera
**Solución:**
- Cierra y abre el diagrama nuevamente
- Click en "Recalcular"
- Refresca la página

### Problema: No puedo exportar el diagrama
**Solución:**
- Espera a que el diagrama termine de cargar
- Verifica que el navegador permita descargas
- Intenta nuevamente

### Problema: Las conexiones se ven mal
**Solución:**
- Arrastra los nodos manualmente para reorganizar
- Haz zoom para ver mejor
- Espera a que la física se estabilice

---

## 📚 Glosario

**Wave**: Grupo de servidores que se migran juntos

**Dependencia Interna**: Conexión entre dos servidores de la misma wave

**Dependencia Externa**: Conexión entre un servidor de la wave y otro de diferente wave

**Criticidad**: Nivel de importancia de un servidor (alta, media, baja)

**Recalcular**: Regenerar las waves desde cero usando el algoritmo

**Diagrama**: Visualización gráfica de dependencias

**Nodo**: Servidor en el diagrama

**Edge**: Conexión entre servidores

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)
- Revisar diagrama de cada wave antes de migrar
- Exportar diagramas para documentación
- Minimizar dependencias externas
- Validar cambios después de mover servidores
- Usar hover para comparación rápida

### ❌ DON'T (No Hacer)
- No migrar sin revisar el diagrama
- No ignorar dependencias externas
- No mover servidores sin validar impacto
- No olvidar exportar diagramas
- No confiar solo en el algoritmo automático

---

## 🚀 Flujo de Trabajo Recomendado

### Paso 1: Análisis Inicial
1. Abrir Migration Planner
2. Hover sobre cada wave
3. Identificar waves problemáticas
4. Exportar diagramas

### Paso 2: Optimización
1. Identificar servidores mal ubicados
2. Mover servidores entre waves
3. Validar regeneración automática
4. Repetir hasta optimizar

### Paso 3: Validación
1. Revisar diagrama de cada wave
2. Verificar dependencias externas mínimas
3. Exportar diagramas finales
4. Documentar decisiones

### Paso 4: Ejecución
1. Migrar waves en orden
2. Usar diagramas como referencia
3. Validar después de cada wave
4. Ajustar si es necesario

---

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa esta guía
2. Consulta los logs en la consola del navegador
3. Verifica que las dependencias estén cargadas
4. Intenta recalcular las waves

---

## 🎉 ¡Listo para Usar!

Ahora tienes todas las herramientas para:

✅ Visualizar dependencias por wave
✅ Optimizar distribución de servidores
✅ Validar planificación de migración
✅ Documentar decisiones
✅ Ejecutar migraciones con confianza

**¡Buena suerte con tu migración!** 🚀
