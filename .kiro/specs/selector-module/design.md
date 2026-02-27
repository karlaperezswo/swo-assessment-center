# Design Document: Módulo Selector de Herramientas de Migración

## Metadata
- **Feature Name:** selector-module
- **Type:** New Feature
- **Status:** Design Phase
- **Created:** 2024-02-24
- **Owner:** karla-dev
- **Branch:** tool-selector-karla-dev

---

## 1. Overview

### 1.1 Purpose
Crear un módulo completamente independiente dentro del MAP Center que automatice la selección de herramientas de assessment para migraciones AWS mediante un cuestionario interactivo de 28 preguntas.

### 1.2 Goals
- Automatizar proceso manual actual (Excel) a sistema web profesional
- Reducir tiempo de selección de herramienta de 10 minutos a 3 minutos
- Proporcionar justificación objetiva basada en datos
- Mantener historial de decisiones para análisis y aprendizaje
- Generar reportes profesionales (PDF/CSV) para clientes

### 1.3 Non-Goals
- NO modificar lógica existente del MAP Center
- NO integrar con datos de MPA/Excel (auto-fill)
- NO crear templates pre-configurados
- NO implementar modo "Express" de preguntas reducidas

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Selector    │  │   Results    │  │   History    │     │
│  │  Stepper     │  │   Dashboard  │  │   Analytics  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express + Lambda)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Session    │  │ Calculation  │  │   Export     │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                         AWS S3
                            │
┌─────────────────────────────────────────────────────────────┐
│                    S3 Bucket Structure                      │
│  /selector/config/      - questions.json, matrix.json      │
│  /selector/sessions/    - Auto-saved progress              │
│  /selector/results/     - Final calculations               │
│  /selector/exports/     - PDF/CSV files                    │
│  /selector/history/     - Historical index                 │
└─────────────────────────────────────────────────────────────┘
```


### 2.2 Component Breakdown

#### 2.2.1 Frontend Components (NEW)
All components in `frontend/src/components/selector/`:

- **SelectorMain.tsx** - Main container component
- **SelectorQuestionList.tsx** - Single-page scrollable list (all 28 questions)
- **SelectorQuestion.tsx** - Individual question component with validation
- **SelectorProgress.tsx** - Progress bar indicator
- **SelectorResults.tsx** - Results dashboard
- **SelectorRadarChart.tsx** - Comparative radar chart
- **SelectorScoreTable.tsx** - Score table display
- **SelectorRecommendation.tsx** - Recommended tool badge
- **SelectorHistory.tsx** - Historical assessments (5 per page)
- **SelectorExport.tsx** - Export buttons (PDF/CSV)

**Note:** No stepper/pagination - all questions on single scrollable page.

#### 2.2.2 Backend Services (NEW)
All services in `backend/src/services/selector/`:

- **SelectorConfigService.ts** - Load questions.json and matrix.json
- **SelectorSessionService.ts** - Auto-save/load sessions
- **SelectorCalculationService.ts** - Score calculation logic
- **SelectorExportService.ts** - PDF/CSV generation
- **SelectorHistoryService.ts** - History management (paginated)

#### 2.2.3 API Routes (NEW)
All routes under `/api/selector`:

```typescript
// Configuration
GET  /api/selector/config/questions
GET  /api/selector/config/matrix

// Sessions (auto-save every answer)
POST /api/selector/session/save
GET  /api/selector/session/load/:clientName/:timestamp
GET  /api/selector/session/list/:clientName

// Calculation
POST /api/selector/calculate

// Results
GET  /api/selector/result/:clientName/:timestamp

// Export
POST /api/selector/export/pdf
POST /api/selector/export/csv
GET  /api/selector/export/download/:clientName/:timestamp/:format

// History (paginated: 5 per page)
GET  /api/selector/history?page=1&limit=5
GET  /api/selector/history/:clientName?page=1&limit=5
GET  /api/selector/history/stats
```

---

## 3. Data Models

### 3.1 Questions Configuration (questions.json)

```json
{
  "version": "1.0",
  "categories": [
    {
      "id": "infrastructure",
      "name": "Infraestructura Actual",
      "description": "Preguntas sobre el estado actual de la infraestructura",
      "questions": [
        {
          "id": "q1",
          "text": "¿Se cuenta con un RVTools completo o inventario?",
          "type": "boolean",
          "options": ["Si", "No"],
          "helpText": "RVTools es una herramienta de inventario VMware"
        }
      ]
    }
  ]
}
```

### 3.2 Scoring Matrix (matrix.json)

```json
{
  "version": "1.0",
  "tools": ["migrationEvaluator", "cloudamize", "matilda", "concierto"],
  "scoring": {
    "q1": {
      "Si": {
        "migrationEvaluator": 0,
        "cloudamize": 0,
        "matilda": 3,
        "concierto": 1
      },
      "No": {
        "migrationEvaluator": 1,
        "cloudamize": 2,
        "matilda": 1,
        "concierto": 2
      }
    }
  }
}
```


### 3.3 Session Data (Auto-saved)

```typescript
interface SelectorSession {
  clientName: string;
  timestamp: string;
  answers: Array<{
    questionId: string;
    answer: string;
    answeredAt: string;
  }>;
  progress: number; // 0-100
  lastUpdated: string;
  status: 'in_progress' | 'completed';
}
```

### 3.4 Result Data

```typescript
interface SelectorResult {
  clientName: string;
  timestamp: string;
  answers: SelectorAnswer[];
  scores: {
    migrationEvaluator: { absolute: number; percentage: number };
    cloudamize: { absolute: number; percentage: number };
    matilda: { absolute: number; percentage: number };
    concierto: { absolute: number; percentage: number };
  };
  recommended: string;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number; // % difference between 1st and 2nd
  decisiveFactors: Array<{
    questionId: string;
    questionText: string;
    answer: string;
    impact: number; // Points difference it caused
  }>;
  metadata: {
    totalQuestions: number;
    answeredQuestions: number;
    calculatedAt: string;
  };
}
```

### 3.5 History Index

```json
{
  "version": "1.0",
  "assessments": [
    {
      "clientName": "Acme Corp",
      "timestamp": "2024-02-24T10:30:00Z",
      "recommended": "Matilda",
      "confidence": "high",
      "scores": {
        "migrationEvaluator": 34,
        "cloudamize": 46,
        "matilda": 55,
        "concierto": 52
      }
    }
  ],
  "stats": {
    "totalAssessments": 150,
    "toolDistribution": {
      "migrationEvaluator": 20,
      "cloudamize": 35,
      "matilda": 60,
      "concierto": 35
    },
    "averageScores": {
      "migrationEvaluator": 38.5,
      "cloudamize": 44.2,
      "matilda": 52.8,
      "concierto": 48.3
    }
  }
}
```

---

## 4. Business Logic

### 4.1 Score Calculation Algorithm

```typescript
function calculateScores(answers: SelectorAnswer[], matrix: ScoringMatrix): Scores {
  // 1. Initialize scores
  const scores = {
    migrationEvaluator: 0,
    cloudamize: 0,
    matilda: 0,
    concierto: 0
  };

  // 2. Sum points from matrix
  answers.forEach(answer => {
    const questionScores = matrix.scoring[answer.questionId][answer.answer];
    scores.migrationEvaluator += questionScores.migrationEvaluator;
    scores.cloudamize += questionScores.cloudamize;
    scores.matilda += questionScores.matilda;
    scores.concierto += questionScores.concierto;
  });

  // 3. Calculate max possible score
  const maxPossible = calculateMaxPossible(matrix, answers.length);

  // 4. Calculate percentages
  const percentages = {
    migrationEvaluator: (scores.migrationEvaluator / maxPossible) * 100,
    cloudamize: (scores.cloudamize / maxPossible) * 100,
    matilda: (scores.matilda / maxPossible) * 100,
    concierto: (scores.concierto / maxPossible) * 100
  };

  return { absolute: scores, percentages };
}
```


### 4.2 Confidence Level Calculation

```typescript
function calculateConfidence(scores: number[]): {
  level: 'low' | 'medium' | 'high';
  score: number;
} {
  const sorted = scores.sort((a, b) => b - a);
  const first = sorted[0];
  const second = sorted[1];
  
  const difference = ((first - second) / first) * 100;
  
  if (difference < 5) return { level: 'low', score: difference };
  if (difference < 15) return { level: 'medium', score: difference };
  return { level: 'high', score: difference };
}
```

### 4.3 Decisive Factors Detection

```typescript
function findDecisiveFactors(
  answers: SelectorAnswer[],
  matrix: ScoringMatrix,
  topTool: string,
  secondTool: string
): DecisiveFactor[] {
  const impacts = answers.map(answer => {
    const scores = matrix.scoring[answer.questionId][answer.answer];
    const impact = Math.abs(scores[topTool] - scores[secondTool]);
    
    return {
      questionId: answer.questionId,
      questionText: getQuestionText(answer.questionId),
      answer: answer.answer,
      impact
    };
  });
  
  // Return top 5 most impactful
  return impacts.sort((a, b) => b.impact - a.impact).slice(0, 5);
}
```

### 4.4 Auto-Save Logic

```typescript
// Frontend: Debounced auto-save every answer
const handleAnswerChange = useDebouncedCallback(
  async (questionId: string, answer: string) => {
    const updatedAnswers = [...answers, { questionId, answer }];
    const progress = (updatedAnswers.length / totalQuestions) * 100;
    
    await api.post('/api/selector/session/save', {
      clientName,
      timestamp,
      answers: updatedAnswers,
      progress,
      status: progress === 100 ? 'completed' : 'in_progress'
    });
  },
  500 // 500ms debounce
);
```

---

## 5. User Interface Design

### 5.1 Navigation Integration

**Location:** New tab in PhaseNavigator after "Migrate"

```
[Assess] [Mobilize] [Migrate] [Selector] ← NEW
```

**⚠️ Modification Required:** `frontend/src/App.tsx`
- Add "Selector" to phase navigation
- Add SelectorPhase component to render

### 5.2 Questionnaire Layout (Single Page)

**IMPORTANT:** All 28 questions are displayed on a single scrollable page, grouped by category.

```
┌─────────────────────────────────────────────────────┐
│  Assessment: Acme Corp                               │
│  Progress: 25 / 28 respondidas                       │
│  ⚠️ Faltan 3 preguntas por responder                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  📦 INFRAESTRUCTURA ACTUAL (5 preguntas)            │
├─────────────────────────────────────────────────────┤
│  ✅ Q1: ¿Tiene acceso a RVTools completo?          │
│      [●Sí] [○No]                                    │
│                                                      │
│  ✅ Q2: ¿Cuántos servidores tiene?                 │
│      [○<30] [●100-500] [○500-999] [○>1000]         │
│                                                      │
│  ❌ Q3: ¿Qué tipo de virtualización usa?           │ ← ROJO
│      [○VMware] [○Hyper-V] [○KVM] [○Otro]           │
│      ⚠️ Esta pregunta es obligatoria                │
│                                                      │
│  ✅ Q4: ...                                         │
│  ✅ Q5: ...                                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🔌 CONECTIVIDAD (3 preguntas)                      │
├─────────────────────────────────────────────────────┤
│  ✅ Q6: ...                                         │
│  ❌ Q7: ...                                         │ ← ROJO
│  ✅ Q8: ...                                         │
└─────────────────────────────────────────────────────┘

... (todas las 11 categorías visibles en scroll)

┌─────────────────────────────────────────────────────┐
│  [Calcular Recomendación] ← Deshabilitado          │
│  ⚠️ Debes responder todas las preguntas (3 faltan) │
└─────────────────────────────────────────────────────┘
```

**Key UX Rules:**
1. ❌ NO pagination or "Next Category" buttons
2. ✅ All questions visible in single scrollable page
3. ✅ Questions grouped visually by category headers
4. ✅ Unanswered questions highlighted in RED with warning icon
5. ✅ All 28 questions are MANDATORY
6. ✅ "Calculate" button disabled until all answered
7. ✅ Clear counter showing "X / 28 respondidas"
8. ✅ Auto-save after each answer (500ms debounce)

### 5.3 Results Dashboard

```
┌─────────────────────────────────────────────────────┐
│  🏆 Herramienta Recomendada: MATILDA               │
│     Nivel de Confianza: Alto (18% diferencia)      │
└─────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────────────────┐
│  Radar Chart     │  │  Score Table                 │
│  (4 tools)       │  │  Migration Evaluator: 34     │
│                  │  │  Cloudamize: 46              │
│                  │  │  Matilda: 55 ⭐              │
│                  │  │  Concierto: 52               │
└──────────────────┘  └──────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Factores Decisivos:                                │
│  1. Kubernetes en producción (+3 Matilda)           │
│  2. Compliance restrictions (+2 Matilda)            │
│  3. >100TB datos (+2 Cloudamize)                    │
└─────────────────────────────────────────────────────┘

[Export PDF] [Export CSV] [View History]
```


### 5.4 History View

```
┌─────────────────────────────────────────────────────┐
│  📊 Historial de Assessments                        │
│                                                      │
│  Mostrando 1-5 de 47 assessments    [< 1 2 3 >]    │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Acme Corp - 2024-02-24                       │  │
│  │ Recomendado: Matilda (55 pts) - Alta conf.  │  │
│  │ [Ver Detalles] [Exportar]                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ TechCo - 2024-02-20                          │  │
│  │ Recomendado: Cloudamize (48 pts) - Media    │  │
│  │ [Ver Detalles] [Exportar]                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Estadísticas Globales:                             │
│  • Total assessments: 47                            │
│  • Matilda: 60% | Cloudamize: 25% | Otros: 15%     │
│  • Promedio Matilda: 52.8 pts                       │
└─────────────────────────────────────────────────────┘
```

---

## 6. S3 Storage Structure

```
assessment-center-files/
└── selector/
    ├── config/
    │   ├── questions.json          # 28 questions organized by category
    │   └── matrix.json             # Scoring matrix for all tools
    │
    ├── sessions/
    │   └── {clientName}/
    │       └── {timestamp}.json    # Auto-saved session
    │
    ├── results/
    │   └── {clientName}/
    │       └── {timestamp}.json    # Final calculation result
    │
    ├── exports/
    │   └── {clientName}/
    │       ├── {timestamp}.pdf     # PDF report
    │       └── {timestamp}.csv     # CSV export
    │
    └── history/
        └── index.json              # Global index (paginated access)
```

**File Lifecycle:**
- **sessions/**: Kept for 30 days, then archived
- **results/**: Kept permanently
- **exports/**: Kept for 7 days, then deleted (can be regenerated)
- **history/index.json**: Updated on every new assessment

---

## 7. Export Formats

### 7.1 PDF Report Structure

```
┌─────────────────────────────────────────┐
│  [SoftwareOne Logo]                     │
│                                          │
│  REPORTE DE SELECCIÓN DE HERRAMIENTA    │
│  DE ASSESSMENT                           │
│                                          │
│  Cliente: Acme Corp                      │
│  Fecha: 24 de Febrero, 2024             │
└─────────────────────────────────────────┘

HERRAMIENTA RECOMENDADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 MATILDA
Nivel de Confianza: Alto (18% de diferencia)

PUNTAJES DETALLADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tool                  | Puntaje | Porcentaje
─────────────────────────────────────────
Migration Evaluator   |   34    |   40.5%
Cloudamize            |   46    |   54.8%
Matilda              |   55    |   65.5% ⭐
Concierto            |   52    |   61.9%

[Radar Chart Image]

FACTORES DECISIVOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Clústeres de Kubernetes en producción
   Respuesta: Sí
   Impacto: +3 puntos para Matilda

2. Restricciones de compliance
   Respuesta: Sí
   Impacto: +3 puntos para Matilda

...

RESPUESTAS COMPLETAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Table with all 28 questions and answers]
```


### 7.2 CSV Export Format

```csv
SELECTOR DE HERRAMIENTA - REPORTE
Cliente,Acme Corp
Fecha,2024-02-24T10:30:00Z
Herramienta Recomendada,Matilda
Nivel de Confianza,Alto

PUNTAJES
Herramienta,Puntaje Absoluto,Porcentaje
Migration Evaluator,34,40.5%
Cloudamize,46,54.8%
Matilda,55,65.5%
Concierto,52,61.9%

RESPUESTAS
Pregunta,Respuesta,ME,Cloudamize,Matilda,Concierto
"¿Se cuenta con RVTools?",No,1,2,1,2
"¿Cuántos servidores?",100-500,1,2,2,2
...
```

---

## 8. Integration Points

### 8.1 Backend Integration (⚠️ Modifications Required)

**File:** `backend/src/index.ts`

```typescript
// ADD IMPORT
import { selectorRouter } from './routes/selectorRoutes';

// ADD ROUTE
app.use('/api/selector', selectorRouter);
```

**Impact:** Minimal - Only adds new route, doesn't modify existing ones

---

### 8.2 Frontend Integration (⚠️ Modifications Required)

**File:** `frontend/src/App.tsx`

**Changes:**
1. Add Selector to phase types
2. Add Selector state management
3. Add SelectorPhase component to render
4. Add "Selector" tab to PhaseNavigator

```typescript
// ADD TYPE
type MigrationPhase = 'assess' | 'mobilize' | 'migrate' | 'selector';

// ADD STATE
const [selectorData, setSelectorData] = useState<SelectorData | null>(null);

// ADD PHASE STATUS
const [phaseStatus, setPhaseStatus] = useState<PhaseStatus>({
  assess: 'in_progress',
  mobilize: 'not_started',
  migrate: 'not_started',
  selector: 'not_started' // NEW
});

// ADD RENDER CASE
{currentPhase === 'selector' && (
  <SelectorPhase
    onComplete={() => handlePhaseComplete('selector')}
  />
)}
```

**Impact:** Medium - Modifies main App component but in isolated sections

---

### 8.3 Types Integration (⚠️ Modifications Required)

**File:** `frontend/src/types/assessment.ts`

**Changes:** Add Selector types at the end of file

```typescript
// ============================================
// Selector Module Types (NEW)
// ============================================

export interface SelectorQuestion {
  id: string;
  category: string;
  text: string;
  type: 'boolean' | 'multiple';
  options: string[];
  helpText?: string;
}

export interface SelectorAnswer {
  questionId: string;
  answer: string;
  answeredAt: string;
}

export interface SelectorSession {
  clientName: string;
  timestamp: string;
  answers: SelectorAnswer[];
  progress: number;
  lastUpdated: string;
  status: 'in_progress' | 'completed';
}

export interface SelectorResult {
  clientName: string;
  timestamp: string;
  scores: {
    migrationEvaluator: { absolute: number; percentage: number };
    cloudamize: { absolute: number; percentage: number };
    matilda: { absolute: number; percentage: number };
    concierto: { absolute: number; percentage: number };
  };
  recommended: string;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number;
  decisiveFactors: Array<{
    questionId: string;
    questionText: string;
    answer: string;
    impact: number;
  }>;
}

export interface SelectorHistoryItem {
  clientName: string;
  timestamp: string;
  recommended: string;
  confidence: string;
  scores: Record<string, number>;
}

export interface SelectorHistory {
  assessments: SelectorHistoryItem[];
  total: number;
  page: number;
  limit: number;
  stats: {
    totalAssessments: number;
    toolDistribution: Record<string, number>;
    averageScores: Record<string, number>;
  };
}
```

**Impact:** Minimal - Only adds types, doesn't modify existing ones

---

## 9. Testing Strategy

### 9.1 Unit Tests
- SelectorCalculationService: Score calculation logic
- SelectorConfigService: JSON parsing and validation
- SelectorSessionService: Auto-save/load logic
- Frontend components: Render and interaction tests

### 9.2 Integration Tests
- API endpoints: Request/response validation
- S3 operations: File upload/download
- End-to-end flow: Complete questionnaire → Results → Export

### 9.3 Manual Testing Checklist
- [ ] Complete questionnaire with all 28 questions
- [ ] Verify auto-save after each answer
- [ ] Load saved session and continue
- [ ] Verify score calculation matches Excel
- [ ] Export PDF and verify format
- [ ] Export CSV and verify data
- [ ] View history with pagination
- [ ] Verify statistics calculation

---

## 10. Deployment Strategy

### 10.1 Phase 1: Backend Infrastructure
1. Create S3 prefixes structure
2. Upload questions.json and matrix.json
3. Deploy backend services
4. Deploy API routes
5. Test API endpoints

### 10.2 Phase 2: Frontend Components
1. Create Selector components
2. Integrate with App.tsx
3. Test UI flow
4. Test auto-save functionality

### 10.3 Phase 3: Export & History
1. Implement PDF generation
2. Implement CSV export
3. Implement history pagination
4. Test export downloads

### 10.4 Phase 4: Testing & Polish
1. End-to-end testing
2. UI/UX refinements
3. Performance optimization
4. Documentation

---

## 11. Success Metrics

- **Time Reduction:** From 10 minutes (Excel) to <3 minutes (Web)
- **Accuracy:** 100% match with Excel calculations
- **Adoption:** 80% of team using web tool within 1 month
- **User Satisfaction:** >4/5 rating from team
- **Export Usage:** >50% of assessments exported to PDF

---

## 12. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Conflicts with existing code | High | Strict isolation, no shared logic |
| S3 prefix collisions | Medium | Use unique `/selector/` prefix |
| Performance issues with history | Medium | Implement pagination (5 per page) |
| PDF generation failures | Low | Fallback to CSV, retry logic |
| Auto-save conflicts | Low | Debounce saves, use timestamps |

---

## 13. Future Enhancements (Out of Scope)

- Auto-fill from MPA data
- Templates by industry
- Express mode (5 questions)
- AI-powered recommendations
- Integration with other MAP Center phases
- Multi-language support
- Custom scoring matrix editor

---

## 14. Appendix

### 14.1 Tool Descriptions

**Migration Evaluator:**
- AWS native tool
- Best for: Quick assessments, AWS-centric migrations
- Limitations: Limited customization

**Cloudamize:**
- Third-party SaaS
- Best for: Detailed performance analysis, multi-cloud
- Limitations: Requires agent installation

**Matilda:**
- Enterprise platform
- Best for: Complex environments, compliance requirements
- Limitations: Higher cost, longer setup

**Concierto:**
- Hybrid approach
- Best for: Agentless discovery, quick turnaround
- Limitations: Less detailed metrics

### 14.2 References
- Base documentation: `/base_docs_selector/`
- Scoring matrix: `Matriz_Seleccion_MAP_Extendida 1.xlsx`
- Decision diagram: `Diagrama de decision de herramienta-v2.png`

---

**End of Design Document**
