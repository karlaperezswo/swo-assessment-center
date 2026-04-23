# Wiki MAP Assessment - SoftwareONE & AWS

Documentación completa para consultores que ejecutan MAP Assessments de AWS.

## Estructura del Proyecto

```
├── index.html                          # Página principal
├── styles.css                          # Estilos globales
├── README.md                           # Este archivo
├── assets/                             # Recursos multimedia
│   ├── softwareone-logo.png           # Logo de SoftwareONE
│   └── aws-logo.png                   # Logo de AWS
└── pages/                              # Páginas de contenido
    ├── introduccion-programa.html      # Introducción al Programa MAP
    ├── map-assessment.html             # Proceso de MAP Assessment
    ├── herramientas-colecta.html       # Guía de herramientas
    ├── cloudamize.html                 # Documentación Cloudamize
    ├── concierto.html                  # Documentación Concierto
    ├── matilda.html                    # Documentación Matilda
    ├── cuestionario-infraestructura.html  # Cuestionario
    ├── diagrama-infraestructura.html   # Guía de diagramación
    ├── immersion-days.html             # Immersion Days
    ├── checklist-entregables.html      # Checklist final
    ├── recursos.html                   # Recursos y descargables
    ├── faq.html                        # Preguntas frecuentes
    ├── glosario.html                   # Glosario de términos
    └── contacto.html                   # Contacto y soporte
```

## Características

- **Diseño limpio y profesional** con base blanca y acentos sutiles
- **Navegación intuitiva** con menú lateral persistente
- **Responsive design** que se adapta a diferentes dispositivos
- **Estructura organizada** siguiendo el flujo del MAP Assessment
- **Contenido completo** con guías, plantillas y recursos

## Navegación Principal

1. **Inicio** - Landing page con resumen ejecutivo
2. **Introducción al Programa MAP** - Fundamentos del programa
3. **MAP Assessment** - Proceso detallado de assessment
4. **Herramientas de Colecta** - Guías de Cloudamize, Concierto y Matilda
5. **Cuestionario de Infraestructura** - Proceso y plantillas
6. **Diagrama de Infraestructura** - Guía de diagramación
7. **Immersion Days** - Materiales y videos de capacitación
8. **Checklist de Entregables Finales** - Verificación completa
9. **Recursos y Descargables** - Biblioteca de recursos
10. **Preguntas Frecuentes** - FAQ
11. **Glosario de Términos** - Definiciones técnicas
12. **Contacto y Soporte** - Información de contacto

## Instalación

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No requiere servidor web (puede ejecutarse localmente)

### Pasos
1. Descarga o clona este repositorio
2. Coloca los logos de SoftwareONE y AWS en la carpeta `assets/`
3. Abre `index.html` en tu navegador

### Para Servidor Web
Si deseas hospedar en un servidor web:
```bash
# Copia todos los archivos al directorio del servidor
cp -r * /var/www/html/map-wiki/

# O usa un servidor simple de Python
python -m http.server 8000
```

## Personalización

### Logos
Reemplaza los archivos en la carpeta `assets/`:
- `softwareone-logo.png` (recomendado: 200x50px)
- `aws-logo.png` (recomendado: 200x50px)

### Colores
Edita `styles.css` para cambiar la paleta de colores:
```css
/* Colores principales */
--color-base: #FFFFFF;
--color-texto: #333333;
--color-aws: #232F3E;
--color-acento: #FF9900;
```

### Contenido
Todos los archivos HTML pueden editarse directamente. Mantén la estructura de:
- Header con logos
- Sidebar con navegación
- Main content con breadcrumbs
- Footer

## Mantenimiento

### Actualización de Contenido
1. Edita los archivos HTML correspondientes
2. Mantén consistencia en el formato
3. Actualiza la fecha en el footer si es necesario

### Agregar Nueva Página
1. Crea el archivo HTML en la carpeta `pages/`
2. Copia la estructura de una página existente
3. Actualiza el menú de navegación en todos los archivos
4. Agrega enlaces desde páginas relevantes

## Mejores Prácticas

- **Mantén la consistencia** en formato y estilo
- **Actualiza regularmente** con nuevas lecciones aprendidas
- **Valida los enlaces** periódicamente
- **Solicita feedback** de los consultores que usan la wiki
- **Versiona los cambios** importantes

## Soporte

Para preguntas o sugerencias sobre esta wiki:
- Email: wiki-feedback@softwareone.com
- Teams: Canal MAP Assessment

## Licencia

© 2026 SoftwareONE. Uso interno exclusivo para consultores de SoftwareONE.

## Changelog

### Versión 1.0 (Febrero 2026)
- Lanzamiento inicial de la wiki
- 14 páginas de contenido completo
- Estructura de navegación implementada
- Diseño responsive
- Integración de logos SoftwareONE y AWS
