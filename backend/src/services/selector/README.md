# Selector Services

This directory contains all backend services for the Selector module.

## Services

### SelectorConfigService

Service responsible for loading and caching configuration files (questions.json and matrix.json).

**Features:**
- Load questions configuration with validation
- Load scoring matrix configuration with validation
- In-memory caching to reduce I/O operations
- Zod schema validation for data integrity
- Support for local file system (development) and S3 (production)
- Configuration integrity validation

**Usage:**

```typescript
import { SelectorConfigService } from './services/selector/SelectorConfigService';

// Load questions
const questions = await SelectorConfigService.loadQuestions();
console.log(`Loaded ${questions.totalQuestions} questions`);

// Load matrix
const matrix = await SelectorConfigService.loadMatrix();
console.log(`Loaded ${matrix.tools.length} tools`);

// Get specific question
const question = await SelectorConfigService.getQuestionById('q1');

// Validate integrity
const validation = await SelectorConfigService.validateIntegrity();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}

// Clear cache (useful for testing)
SelectorConfigService.clearCache();

// Reload all configurations
const configs = await SelectorConfigService.reload();
```

**Environment Variables:**
- `USE_S3`: Set to `'true'` to load from S3, otherwise loads from local file system

**Testing:**

Run the test script to verify the service is working correctly:

```bash
cd backend
npx ts-node src/services/selector/test-config-service.ts
```

## Configuration Files

### questions.json

Located at: `backend/src/config/selector/questions.json`

Structure:
```json
{
  "version": "1.0",
  "totalQuestions": 28,
  "categories": [
    {
      "id": "infrastructure",
      "name": "Infraestructura Actual",
      "description": "...",
      "questions": [
        {
          "id": "q1",
          "text": "...",
          "type": "boolean",
          "options": ["Si", "No"],
          "helpText": "..."
        }
      ]
    }
  ]
}
```

### matrix.json

Located at: `backend/src/config/selector/matrix.json`

Structure:
```json
{
  "version": "1.0",
  "tools": ["migrationEvaluator", "cloudamize", "matilda", "concierto"],
  "scoring": {
    "q1": {
      "Si": { "migrationEvaluator": 0, "cloudamize": 0, "matilda": 3, "concierto": 1 },
      "No": { "migrationEvaluator": 1, "cloudamize": 2, "matilda": 1, "concierto": 2 }
    }
  }
}
```

The service automatically normalizes this to a flat array format for easier processing.

## Next Services to Implement

1. **SelectorSessionService** - Session management (save/load/list)
2. **SelectorCalculationService** - Score calculation and recommendation logic
3. **SelectorExportService** - PDF and CSV export generation
4. **SelectorHistoryService** - Historical data management and statistics
