# Prueba del API Selector

## 🚀 Cómo levantar el proyecto

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (opcional, aún no tiene UI)
cd frontend
npm run dev
```

## 📡 Endpoints Disponibles

### 1. GET /api/selector/questions
Obtener todas las preguntas del cuestionario

```bash
curl http://localhost:4000/api/selector/questions
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "totalQuestions": 28,
    "categories": [...]
  }
}
```

### 2. POST /api/selector/session
Crear una nueva sesión

```bash
curl -X POST http://localhost:4000/api/selector/session \
  -H "Content-Type: application/json" \
  -d "{\"clientName\": \"Acme Corp\"}"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-here",
    "clientName": "Acme Corp",
    "answers": [],
    "createdAt": "2024-02-24T...",
    "updatedAt": "2024-02-24T...",
    "completed": false
  }
}
```

### 3. POST /api/selector/session/:sessionId/calculate
Calcular scores y recomendación

```bash
curl -X POST http://localhost:4000/api/selector/session/test-123/calculate \
  -H "Content-Type: application/json" \
  -d @test-session.json
```

**Archivo test-session.json:**
```json
{
  "session": {
    "sessionId": "test-123",
    "clientName": "Test Client",
    "answers": [
      {"questionId": "q1", "answer": "Si", "timestamp": "2024-02-24T10:00:00Z"},
      {"questionId": "q2", "answer": "<30", "timestamp": "2024-02-24T10:01:00Z"},
      {"questionId": "q3", "answer": "VMware", "timestamp": "2024-02-24T10:02:00Z"}
    ],
    "createdAt": "2024-02-24T10:00:00Z",
    "updatedAt": "2024-02-24T10:02:00Z",
    "completed": true
  }
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "sessionId": "test-123",
    "clientName": "Test Client",
    "recommendedTool": "matilda",
    "confidence": "medium",
    "confidencePercentage": 12.5,
    "results": [
      {
        "tool": "matilda",
        "absoluteScore": 7,
        "percentageScore": 77.78,
        "rank": 1
      },
      {
        "tool": "cloudamize",
        "absoluteScore": 5,
        "percentageScore": 55.56,
        "rank": 2
      },
      ...
    ],
    "decisiveFactors": [
      {
        "questionId": "q1",
        "questionText": "¿Se cuenta con un RVTools completo...",
        "answer": "Si",
        "impact": 2,
        "affectedTools": ["matilda", "cloudamize"]
      }
    ],
    "calculatedAt": "2024-02-24T10:03:00Z"
  }
}
```

## ✅ Lo que YA funciona:

1. ✅ Cargar configuración de preguntas (28 preguntas, 11 categorías)
2. ✅ Crear sesiones nuevas
3. ✅ Calcular scores basados en respuestas
4. ✅ Determinar herramienta recomendada
5. ✅ Calcular nivel de confianza (low/medium/high)
6. ✅ Identificar factores decisivos (top 5 preguntas)

## ⏳ Lo que falta:

1. ⏳ Guardar/cargar sesiones (saveSession, loadSession)
2. ⏳ Listar sesiones por cliente
3. ⏳ Exportar a PDF/CSV
4. ⏳ Historial y estadísticas
5. ⏳ Frontend (componentes React)

## 🧪 Prueba rápida con Postman/Insomnia:

1. Importa esta colección o crea requests manualmente
2. Primero llama a GET /questions para ver las preguntas
3. Luego POST /session para crear una sesión
4. Finalmente POST /calculate con respuestas de ejemplo

## 📊 Estado actual:

**Backend:** 25% completo
- ✅ Configuración
- ✅ Tipos TypeScript
- ✅ Servicio de cálculo
- ✅ API básica
- ⏳ Persistencia
- ⏳ Exports
- ⏳ Historial

**Frontend:** 0% completo
- Pendiente: Componentes React
