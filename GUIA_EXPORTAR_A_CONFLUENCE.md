# Guía para Exportar la Wiki a Confluence

## Opción 1: Importación Manual (Más Fácil - Recomendada)

### Paso 1: Preparar Confluence
1. Accede a tu espacio de Confluence
2. Crea un nuevo espacio llamado "MAP Assessment Wiki" (o el nombre que prefieras)
3. Dentro del espacio, crea una página principal llamada "Inicio"

### Paso 2: Estructura de Páginas en Confluence
Crea esta jerarquía de páginas (puedes hacerlo después de importar):

```
📄 Inicio (página principal)
├── 📄 Introducción al Programa MAP
├── 📄 MAP Assessment
├── 📄 Herramientas de Colecta
│   ├── 📄 Cloudamize
│   ├── 📄 Concierto
│   └── 📄 Matilda
├── 📄 Cuestionario de Infraestructura
├── 📄 Diagrama de Infraestructura
├── 📄 Immersion Days
├── 📄 Checklist de Entregables Finales
├── 📄 Recursos y Descargables
├── 📄 Preguntas Frecuentes (FAQ)
├── 📄 Glosario de Términos
└── 📄 Contacto y Soporte
```

### Paso 3: Importar Contenido

#### Método A: Copiar y Pegar (Más Simple)
1. Abre cada archivo HTML en tu navegador
2. Selecciona todo el contenido (Ctrl+A)
3. Copia (Ctrl+C)
4. En Confluence, crea una nueva página
5. Pega el contenido (Ctrl+V)
6. Confluence convertirá automáticamente el formato
7. Ajusta el formato si es necesario

#### Método B: Usar el Editor HTML de Confluence
1. En Confluence, crea una nueva página
2. Click en "..." (más opciones) → "Insert" → "Markup"
3. Selecciona "HTML"
4. Abre el archivo HTML correspondiente en un editor de texto
5. Copia solo el contenido dentro de `<main class="main-content">`
6. Pégalo en el editor HTML de Confluence
7. Click en "Insert"

### Paso 4: Agregar Logos
1. Sube los logos de SoftwareONE y AWS a Confluence
2. En cada página, agrega los logos en el header usando:
   - Insert → Image → Upload
   - O crea un template de página con los logos

### Paso 5: Crear Índice de Navegación
En la página principal, crea un índice usando el macro "Page Tree":
1. Edit página → "/" → busca "Page Tree"
2. Configura para mostrar todas las páginas hijas
3. Esto creará un menú de navegación automático

## Opción 2: Importación Automatizada con Script

### Requisitos
- Python 3.7 o superior instalado
- Acceso a Confluence con permisos de edición

### Paso 1: Ejecutar el Script de Conversión
```bash
# En la terminal, navega a la carpeta del proyecto
cd "ruta/a/tu/proyecto"

# Ejecuta el script de conversión
python confluence-export/converter.py
```

Esto generará archivos `.confluence` en la carpeta `confluence-export/pages/`

### Paso 2: Importar los Archivos Generados
1. Abre cada archivo `.confluence` generado
2. Copia el contenido (después de la línea "TÍTULO:")
3. En Confluence:
   - Crea nueva página
   - Click en "..." → "Insert" → "Markup" → "HTML"
   - Pega el contenido
   - Click "Insert"

## Opción 3: Usar la API de Confluence (Avanzado)

Si tienes acceso a la API de Confluence, puedo crear un script que suba todo automáticamente.

### Lo que necesito de ti:
1. URL de tu instancia de Confluence (ej: `https://tuempresa.atlassian.net`)
2. Tu email de Confluence
3. Un API Token (lo puedes generar en: https://id.atlassian.com/manage-profile/security/api-tokens)
4. El ID o nombre del espacio donde quieres crear las páginas

### Cómo obtener un API Token:
1. Ve a https://id.atlassian.com/manage-profile/security/api-tokens
2. Click en "Create API token"
3. Dale un nombre (ej: "Wiki MAP Import")
4. Copia el token generado (guárdalo en un lugar seguro)

### Una vez que tengas estos datos:
Dime y crearé un script que:
- Se conecte a tu Confluence
- Cree automáticamente todas las páginas
- Suba todo el contenido
- Organice la jerarquía
- Configure los enlaces entre páginas

## Recomendación Final

**Para empezar rápido:** Usa la Opción 1 (Método A - Copiar y Pegar)
- Es la más simple
- No requiere configuración técnica
- Confluence hace la conversión automáticamente
- Puedes empezar ahora mismo

**Para automatizar completamente:** Usa la Opción 3 (API)
- Requiere configuración inicial
- Pero sube todo en minutos
- Mantiene la estructura perfecta
- Ideal si tienes muchas páginas

## Ventajas de Confluence vs HTML

✅ **Editor visual intuitivo** - Edita como en Word
✅ **Colaboración en tiempo real** - Varios usuarios editando
✅ **Control de versiones** - Historial completo de cambios
✅ **Comentarios y menciones** - Feedback directo en las páginas
✅ **Búsqueda potente** - Encuentra contenido fácilmente
✅ **Permisos granulares** - Control de quién ve qué
✅ **Macros útiles** - Tablas de contenido, alertas, etc.
✅ **Responsive automático** - Se ve bien en móviles
✅ **Integraciones** - Jira, Slack, etc.

## ¿Necesitas Ayuda?

Dime qué opción prefieres y te ayudo con los siguientes pasos:
- Opción 1: Te guío paso a paso
- Opción 2: Ejecutamos el script juntos
- Opción 3: Creo el script de importación automática (necesito tus credenciales de API)
