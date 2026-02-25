# ✅ Exportación PDF y CSV Implementada

## Funcionalidad

El módulo Selector ahora permite exportar los resultados del assessment en formato PDF y CSV para compartir y archivar.

## Características

### 1. Exportación PDF

**Contenido del PDF:**
- **Header**: Título "Selector de Herramienta MAP" + "Reporte de Assessment"
- **Información del Cliente**: Nombre, fecha, session ID
- **Recomendación**: Herramienta recomendada con badge de confianza
- **Tabla de Scores**: Rank, herramienta, score absoluto, score porcentaje
- **Factores Decisivos**: Top 5 preguntas que más influyeron
- **Footer**: Timestamp de generación + "SWO Assessment Center"

**Características técnicas:**
- Librería: PDFKit
- Tamaño: Letter (8.5" x 11")
- Márgenes: 50px
- Fuentes: Helvetica, Helvetica-Bold
- Paginación automática si el contenido es largo
- Nombre de archivo: `selector-{clientName}-{sessionId}.pdf`

### 2. Exportación CSV

**Contenido del CSV:**
- **Información del Cliente**: Cliente, fecha, session ID
- **Recomendación**: Herramienta, confianza, porcentaje
- **Scores de Herramientas**: Tabla con rank, herramienta, scores
- **Respuestas del Assessment**: Todas las preguntas y respuestas con timestamps
- **Factores Decisivos**: Top 5 preguntas influyentes

**Características técnicas:**
- Formato: CSV con UTF-8 BOM (compatible con Excel)
- Separador: Coma (,)
- Comillas: Campos con comas se escapan con comillas dobles
- Nombre de archivo: `selector-{clientName}-{sessionId}.csv`

### 3. Botones de Exportación

**Ubicación**: Pantalla de resultados, después de la tabla de scores

**Botones:**
- "Exportar PDF" - Icono FileDown + texto
- "Exportar CSV" - Icono FileDown + texto

**Estados:**
- Normal: Botón outline con icono
- Loading: Spinner animado mientras genera
- Disabled: Ambos botones deshabilitados durante exportación
- Success: Toast "PDF/CSV descargado exitosamente"
- Error: Toast "Error al exportar PDF/CSV"

## API Endpoints

### POST /api/selector/export/pdf
Genera y descarga PDF del assessment

**Request Body:**
```json
{
  "session": {
    "sessionId": "uuid",
    "clientName": "Acme Corp",
    "answers": [...],
    "createdAt": "2024-02-25T10:00:00.000Z",
    "updatedAt": "2024-02-25T10:30:00.000Z",
    "completed": true
  },
  "result": {
    "recommendedTool": "Migration Evaluator",
    "confidence": "high",
    "confidencePercentage": 15.2,
    "results": [...],
    "decisiveFactors": [...]
  }
}
```

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="selector-{client}-{id}.pdf"`
- Body: PDF binary data

### POST /api/selector/export/csv
Genera y descarga CSV del assessment

**Request Body:** (mismo que PDF)

**Response:**
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="selector-{client}-{id}.csv"`
- Body: CSV text con BOM UTF-8

## Flujo de Usuario

```
1. Usuario completa assessment
2. Ve resultados con recomendación
3. Hace clic en "Exportar PDF" o "Exportar CSV"
4. Botón muestra spinner "Generando..."
5. Backend genera archivo
6. Navegador descarga automáticamente
7. Toast confirma "PDF/CSV descargado exitosamente"
8. Usuario puede abrir archivo descargado
```

## Ejemplo de PDF Generado

```
┌─────────────────────────────────────────────┐
│   Selector de Herramienta MAP               │
│   Reporte de Assessment                     │
│                                             │
│ INFORMACIÓN DEL CLIENTE                     │
│ Cliente: Acme Corp                          │
│ Fecha: 25/02/2024                           │
│ Session ID: abc-123-def                     │
│                                             │
│ HERRAMIENTA RECOMENDADA                     │
│ Migration Evaluator                         │
│ Confianza: high (15.2%)                     │
│                                             │
│ SCORES DE HERRAMIENTAS                      │
│ ┌──────┬─────────────────┬────────┬────┐   │
│ │ Rank │ Herramienta     │ Score  │ %  │   │
│ ├──────┼─────────────────┼────────┼────┤   │
│ │ #1   │ Migration Eval. │ 85 pts │85% │   │
│ │ #2   │ Cloudamize      │ 72 pts │72% │   │
│ │ #3   │ Matilda         │ 68 pts │68% │   │
│ │ #4   │ Concierto       │ 45 pts │45% │   │
│ └──────┴─────────────────┴────────┴────┘   │
│                                             │
│ FACTORES DECISIVOS                          │
│ 1. ¿Tiene acceso a AWS?                     │
│    Respuesta: Sí                            │
│    Impacto: 12.5 puntos                     │
│ ...                                         │
│                                             │
│ Generado el 25/02/2024 10:30 | SWO         │
└─────────────────────────────────────────────┘
```

## Ejemplo de CSV Generado

```csv
Selector de Herramienta MAP - Reporte de Assessment

INFORMACIÓN DEL CLIENTE
Cliente,Acme Corp
Fecha,25/02/2024
Session ID,abc-123-def

RECOMENDACIÓN
Herramienta Recomendada,Migration Evaluator
Confianza,high
Porcentaje de Confianza,15.2%

SCORES DE HERRAMIENTAS
Rank,Herramienta,Score Absoluto,Score Porcentaje
1,Migration Evaluator,85,85.0%
2,Cloudamize,72,72.0%
3,Matilda,68,68.0%
4,Concierto,45,45.0%

RESPUESTAS DEL ASSESSMENT
Pregunta ID,Respuesta,Timestamp
"¿Tiene acceso a AWS?",Sí,2024-02-25T10:15:00.000Z
...

FACTORES DECISIVOS
Pregunta,Respuesta,Impacto
"¿Tiene acceso a AWS?",Sí,12.5
...
```

## Dependencias Instaladas

**Backend:**
```json
{
  "pdfkit": "^0.15.0",
  "@types/pdfkit": "^0.13.4"
}
```

## Archivos Creados/Modificados

**Backend:**
- `backend/src/services/selector/SelectorExportService.ts` (nuevo)
  - `generatePDF()` - Genera PDF con PDFKit
  - `generateCSV()` - Genera CSV con formato UTF-8
- `backend/src/controllers/selector/SelectorController.ts` (modificado)
  - `exportPDF()` - Endpoint para PDF
  - `exportCSV()` - Endpoint para CSV
- `backend/src/routes/selectorRoutes.ts` (modificado)
  - POST `/api/selector/export/pdf`
  - POST `/api/selector/export/csv`

**Frontend:**
- `frontend/src/components/phases/SelectorPhase.tsx` (modificado)
  - Estado `exportLoading`
  - Función `handleExportPDF()`
  - Función `handleExportCSV()`
  - Botones de exportación en resultados

## Beneficios

✅ **Compartir resultados** - Enviar PDF por email a stakeholders

✅ **Archivar assessments** - Guardar histórico en formato estándar

✅ **Análisis en Excel** - Abrir CSV para análisis adicional

✅ **Documentación** - PDF profesional con branding SWO

✅ **Compliance** - Registro permanente de recomendaciones

## Próximas Mejoras (Opcionales)

- [ ] Agregar logo de SWO en PDF
- [ ] Incluir gráfico radar como imagen en PDF
- [ ] Agregar más detalles de cada herramienta
- [ ] Exportar múltiples assessments en un solo archivo
- [ ] Enviar PDF por email directamente desde la app

## Testing

Para probar:

1. Completa un assessment
2. Llega a la pantalla de resultados
3. Haz clic en "Exportar PDF"
4. Verifica que se descarga el PDF
5. Abre el PDF y revisa el contenido
6. Haz clic en "Exportar CSV"
7. Verifica que se descarga el CSV
8. Abre el CSV en Excel y revisa el formato

---

**Implementado**: 2024-02-25  
**Tiempo**: ~2 horas  
**Estado**: ✅ Funcional
