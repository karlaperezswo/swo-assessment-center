# Mejoras en la Exportación de Dependencias

## Cambios Realizados

### 1. Botón "Seleccionar Archivo"
- Se agregó un nuevo botón "Seleccionar Archivo" en el mapa de dependencias
- El input de archivo ahora está oculto y se activa mediante el botón
- Se muestra el nombre del archivo seleccionado en un área visual
- Notificación toast cuando se selecciona un archivo
- El botón "Cargar" se mantiene para procesar el archivo

### 2. Exportación Directa a PDF y Word
Los botones de exportación ahora generan archivos nativos directamente:

#### Exportar PDF
- Genera archivos PDF reales usando Puppeteer
- El archivo se descarga automáticamente en formato PDF
- Incluye formato profesional con colores y tablas
- Fallback a HTML si la generación de PDF falla

#### Exportar Word
- Genera archivos .docx nativos usando la librería `docx`
- El archivo se descarga automáticamente en formato Word
- Formato profesional con tablas, colores y estilos
- Compatible con Microsoft Word y LibreOffice

## Arquitectura Técnica

### Backend
1. **dependencyController.ts**
   - Modificado para enviar archivos binarios directamente
   - Usa `responseType: 'blob'` para manejar datos binarios
   - Establece headers correctos (Content-Type, Content-Disposition)

2. **dependencyService.ts**
   - Método `exportToDocument()` ahora es async y retorna Buffer
   - Para PDF: usa Puppeteer para convertir HTML a PDF
   - Para Word: usa DocumentGeneratorService para generar .docx
   - Retorna objeto con: buffer, filename, mimeType

3. **documentGeneratorService.ts**
   - Nuevo método `generateWordDocumentBuffer()` que retorna Buffer
   - Usa `Packer.toBuffer()` de la librería docx
   - Genera documentos Word con formato profesional

### Frontend
1. **DependencyMap.tsx**
   - Función `handleExport()` modificada para manejar blobs binarios
   - Usa `responseType: 'blob'` en la petición axios
   - Crea URL temporal para descargar el archivo
   - Extrae filename del header Content-Disposition
   - Notificaciones mejoradas con nombre de archivo

## Dependencias Utilizadas

### Ya instaladas:
- `docx`: ^8.5.0 - Generación de documentos Word
- `puppeteer`: ^21.6.1 - Generación de PDFs desde HTML

### No se requieren instalaciones adicionales
Todas las dependencias necesarias ya están en el package.json del backend.

## Flujo de Exportación

1. Usuario hace clic en "Exportar PDF" o "Exportar Word"
2. Frontend envía petición POST a `/api/dependencies/export` con formato deseado
3. Backend genera el documento en el formato solicitado:
   - PDF: HTML → Puppeteer → PDF Buffer
   - Word: Datos → docx → DOCX Buffer
4. Backend envía el buffer binario con headers apropiados
5. Frontend recibe el blob y crea una descarga automática
6. Archivo se descarga con el nombre correcto y extensión apropiada

## Ventajas

✅ Archivos nativos (no HTML disfrazado)
✅ Mejor experiencia de usuario
✅ No requiere conversión manual
✅ Formato profesional
✅ Compatible con todas las aplicaciones de oficina
✅ Fallback a HTML si algo falla

## Uso

1. Cargar archivo Excel de dependencias
2. Opcionalmente buscar un servidor específico
3. Hacer clic en "Exportar PDF" o "Exportar Word"
4. El archivo se descarga automáticamente

## Notas Técnicas

- Puppeteer requiere Chrome/Chromium instalado en el servidor
- En producción (Lambda), usar `chrome-aws-lambda` para Puppeteer
- Los archivos generados incluyen fecha en el nombre
- El nombre del servidor se sanitiza para evitar caracteres inválidos
