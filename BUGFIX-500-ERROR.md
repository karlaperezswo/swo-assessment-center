# 🐛 Bugfix: 500 Internal Server Error en /api/opportunities/analyze

## Problema
Al intentar analizar oportunidades, el endpoint `/api/opportunities/analyze` devolvía un error 500 (Internal Server Error).

## Causa Raíz
El `OpportunityController` estaba usando `require()` para importar dinámicamente el `QuestionnaireParserService`:

```typescript
// ❌ ANTES (causaba error 500)
const QuestionnaireParserService = require('../services/QuestionnaireParserService').QuestionnaireParserService;
const questionnaireParser = new QuestionnaireParserService();
```

Este enfoque puede causar problemas en entornos TypeScript/ES6 modules, especialmente cuando:
- El módulo usa `export class` en lugar de `module.exports`
- El transpilador genera código ES6 modules
- Hay incompatibilidades entre CommonJS y ES6 modules

## Solución
Cambiar a import estático en la parte superior del archivo:

```typescript
// ✅ DESPUÉS (funciona correctamente)
import { QuestionnaireParserService } from '../services/QuestionnaireParserService';

export class OpportunityController {
  private questionnaireParser: QuestionnaireParserService;

  constructor() {
    this.questionnaireParser = new QuestionnaireParserService();
  }

  analyze = async (req: Request, res: Response): Promise<void> => {
    // ...
    if (questionnaireFile) {
      questionnaireData = await this.questionnaireParser.parseQuestionnaire(questionnaireFile.buffer);
    }
  }
}
```

## Archivos Modificados
- `backend/src/controllers/OpportunityController.ts`:
  - Agregado import de `QuestionnaireParserService` en línea 12
  - Agregado campo privado `questionnaireParser` en la clase
  - Instanciado en el constructor
  - Removido `require()` dinámico en el método `analyze`

## Verificación
- ✅ Sin errores de compilación TypeScript
- ✅ Imports correctos
- ✅ Instanciación en constructor
- ✅ Uso correcto en método `analyze`

## Testing
Para verificar que el fix funciona:

1. Reiniciar el servidor backend
2. Subir MPA + MRA + Cuestionario (opcional)
3. Hacer clic en "Completar Assess Phase"
4. Verificar que el análisis se ejecuta sin error 500
5. Verificar que las oportunidades se generan correctamente

## Notas
- Este patrón (import estático + instanciación en constructor) es consistente con los otros servicios en el controlador
- Evita problemas de module resolution en tiempo de ejecución
- Mejora la type safety y el autocompletado en el IDE

---

**Fecha**: 2026-02-22  
**Estado**: ✅ RESUELTO  
**Severidad**: Alta (bloqueaba funcionalidad principal)
