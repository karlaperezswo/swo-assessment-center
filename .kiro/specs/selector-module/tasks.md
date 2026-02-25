# Implementation Tasks: Módulo Selector

## Metadata
- **Feature:** selector-module
- **Status:** Ready for Implementation
- **Created:** 2024-02-24
- **Owner:** karla-dev
- **Branch:** tool-selector-karla-dev

---

## Task Status Legend
- `[ ]` Not started
- `[-]` In progress
- `[x]` Completed
- `[~]` Queued

---

## Phase 1: Backend Infrastructure (Week 1)

### 1. Setup & Configuration
- [ ] 1.1 Create backend service folder structure
  - [ ] 1.1.1 Create `backend/src/services/selector/` directory
  - [ ] 1.1.2 Create `backend/src/routes/` for selectorRoutes.ts
  - [ ] 1.1.3 Create `backend/src/controllers/selector/` directory

- [ ] 1.2 Create configuration files
  - [ ] 1.2.1 Create `questions.json` with 28 questions
  - [ ] 1.2.2 Create `matrix.json` with scoring data
  - [ ] 1.2.3 Upload config files to S3 `/selector/config/`

### 2. Backend Services

- [x] 2.1 SelectorConfigService
  - [x] 2.1.1 Implement `loadQuestions()` method
  - [x] 2.1.2 Implement `loadMatrix()` method
  - [x] 2.1.3 Add caching for config files
  - [x] 2.1.4 Add validation with Zod schemas

- [x] 2.2 SelectorSessionService
  - [x] 2.2.1 Implement `saveSession()` method
  - [x] 2.2.2 Implement `loadSession()` method
  - [x] 2.2.3 Implement `listSessions()` method
  - [x] 2.2.4 Add S3 integration for session storage
  - [x] 2.2.5 Add timestamp generation logic

- [x] 2.3 SelectorCalculationService
  - [x] 2.3.1 Implement `calculateScores()` method
  - [x] 2.3.2 Implement `calculateConfidence()` method
  - [x] 2.3.3 Implement `findDecisiveFactors()` method
  - [x] 2.3.4 Add percentage calculation logic
  - [x] 2.3.5 Add validation for complete answers

- [ ] 2.4 SelectorExportService
  - [ ] 2.4.1 Implement `generatePDF()` method
  - [ ] 2.4.2 Implement `generateCSV()` method
  - [ ] 2.4.3 Add PDF template with SWO branding
  - [ ] 2.4.4 Add radar chart generation for PDF
  - [ ] 2.4.5 Add S3 upload for exports

- [ ] 2.5 SelectorHistoryService
  - [ ] 2.5.1 Implement `addToHistory()` method
  - [ ] 2.5.2 Implement `getHistory()` with pagination
  - [ ] 2.5.3 Implement `getClientHistory()` method
  - [ ] 2.5.4 Implement `getStatistics()` method
  - [ ] 2.5.5 Add index.json management


### 3. API Routes & Controllers

- [-] 3.1 Create selectorRoutes.ts
  - [x] 3.1.1 Define all route endpoints
  - [ ] 3.1.2 Add route validation middleware
  - [ ] 3.1.3 Add error handling middleware

- [-] 3.2 Create SelectorController
  - [x] 3.2.1 Implement `getQuestions()` handler
  - [ ] 3.2.2 Implement `getMatrix()` handler
  - [ ] 3.2.3 Implement `saveSession()` handler
  - [ ] 3.2.4 Implement `loadSession()` handler
  - [ ] 3.2.5 Implement `listSessions()` handler
  - [x] 3.2.6 Implement `calculate()` handler
  - [ ] 3.2.7 Implement `getResult()` handler
  - [ ] 3.2.8 Implement `exportPDF()` handler
  - [ ] 3.2.9 Implement `exportCSV()` handler
  - [ ] 3.2.10 Implement `downloadExport()` handler
  - [ ] 3.2.11 Implement `getHistory()` handler
  - [ ] 3.2.12 Implement `getClientHistory()` handler
  - [ ] 3.2.13 Implement `getStatistics()` handler

### 4. Integration Points (⚠️ Modifications)

- [ ] 4.1 Modify backend/src/index.ts
  - [x] 4.1.1 Import selectorRouter
  - [x] 4.1.2 Add route: `app.use('/api/selector', selectorRouter)`
  - [ ] 4.1.3 Test that existing routes still work

- [ ] 4.2 Add TypeScript types
  - [x] 4.2.1 Create `backend/src/types/selector.ts`
  - [ ] 4.2.2 Define all interfaces (Session, Result, etc.)
  - [ ] 4.2.3 Export types for frontend use

### 5. Testing

- [ ] 5.1 Unit tests for services
  - [ ] 5.1.1 Test SelectorCalculationService
  - [ ] 5.1.2 Test SelectorConfigService
  - [ ] 5.1.3 Test SelectorSessionService

- [ ] 5.2 Integration tests for API
  - [ ] 5.2.1 Test all GET endpoints
  - [ ] 5.2.2 Test all POST endpoints
  - [ ] 5.2.3 Test error scenarios

---

## Phase 2: Frontend Components (Week 2)

### 6. Component Structure

- [ ] 6.1 Create component folder
  - [ ] 6.1.1 Create `frontend/src/components/selector/` directory
  - [ ] 6.1.2 Create index.ts for exports

- [ ] 6.2 Create base components
  - [ ] 6.2.1 Create SelectorPhase.tsx (single-page component)
  - [ ] 6.2.2 Create SelectorQuestionList.tsx (scrollable list)
  - [ ] 6.2.3 Create SelectorQuestion.tsx (individual question with validation)
  - [ ] 6.2.4 Create SelectorProgress.tsx (progress bar)

### 7. Questionnaire Flow (Single Page - NO Stepper)

- [ ] 7.1 Implement Single-Page Question List
  - [ ] 7.1.1 Display ALL 28 questions in scrollable container
  - [ ] 7.1.2 Group questions by category with visual headers
  - [ ] 7.1.3 Add answer selection logic
  - [ ] 7.1.4 Remove category navigation (no Next/Previous buttons)
  - [ ] 7.1.5 Ensure smooth scrolling between categories

- [ ] 7.2 Implement Mandatory Question Validation
  - [ ] 7.2.1 Highlight unanswered questions with RED border
  - [ ] 7.2.2 Add warning icon (⚠️) to unanswered questions
  - [ ] 7.2.3 Show "Esta pregunta es obligatoria" message
  - [ ] 7.2.4 Update counter "X / 28 respondidas" in real-time
  - [ ] 7.2.5 Disable "Calculate" button until ALL 28 answered
  - [ ] 7.2.6 Show message "Debes responder todas las preguntas (X faltan)"

- [ ] 7.3 Implement auto-save
  - [ ] 7.3.1 Add debounced save hook (500ms)
  - [ ] 7.3.2 Call API on every answer change
  - [ ] 7.3.3 Show save status indicator
  - [ ] 7.3.4 Handle save errors gracefully

- [ ] 7.4 Implement session recovery
  - [ ] 7.4.1 Add "Load Session" button
  - [ ] 7.4.2 Fetch available sessions for client
  - [ ] 7.4.3 Restore answers and progress
  - [ ] 7.4.4 Continue from last answered question

### 8. Results Display

- [ ] 8.1 Create SelectorResults.tsx
  - [ ] 8.1.1 Add results container layout
  - [ ] 8.1.2 Fetch calculation results from API
  - [ ] 8.1.3 Display loading state

- [ ] 8.2 Create SelectorRecommendation.tsx
  - [ ] 8.2.1 Display recommended tool badge
  - [ ] 8.2.2 Add confidence level indicator
  - [ ] 8.2.3 Add color coding (low/medium/high)
  - [ ] 8.2.4 Show confidence percentage

- [ ] 8.3 Create SelectorScoreTable.tsx
  - [ ] 8.3.1 Display all 4 tools with scores
  - [ ] 8.3.2 Show absolute and percentage scores
  - [ ] 8.3.3 Highlight recommended tool
  - [ ] 8.3.4 Add visual progress bars

- [ ] 8.4 Create SelectorRadarChart.tsx
  - [ ] 8.4.1 Integrate Recharts library
  - [ ] 8.4.2 Configure 4-axis radar chart
  - [ ] 8.4.3 Use percentage scores for data
  - [ ] 8.4.4 Add tooltips and legend
  - [ ] 8.4.5 Color-code recommended tool

- [ ] 8.5 Create decisive factors display
  - [ ] 8.5.1 Display top 5 factors list
  - [ ] 8.5.2 Show question text and answer
  - [ ] 8.5.3 Show impact (point difference)
  - [ ] 8.5.4 Add explanatory text


### 9. Export Functionality

- [ ] 9.1 Create SelectorExport.tsx
  - [ ] 9.1.1 Add "Export PDF" button
  - [ ] 9.1.2 Add "Export CSV" button
  - [ ] 9.1.3 Handle export API calls
  - [ ] 9.1.4 Show loading state during generation
  - [ ] 9.1.5 Trigger download on success
  - [ ] 9.1.6 Handle export errors

### 10. History & Analytics

- [ ] 10.1 Create SelectorHistory.tsx
  - [ ] 10.1.1 Fetch history from API (paginated)
  - [ ] 10.1.2 Display list of last 5 assessments
  - [ ] 10.1.3 Add pagination controls (prev/next)
  - [ ] 10.1.4 Show assessment details (client, date, tool, scores)
  - [ ] 10.1.5 Add "View Details" button
  - [ ] 10.1.6 Add "Export" button per item

- [ ] 10.2 Add search functionality
  - [ ] 10.2.1 Add search input for client name
  - [ ] 10.2.2 Implement client-side filtering
  - [ ] 10.2.3 Show "No results" state

- [ ] 10.3 Add statistics display
  - [ ] 10.3.1 Fetch global statistics from API
  - [ ] 10.3.2 Display total assessments count
  - [ ] 10.3.3 Display tool distribution (pie chart or bars)
  - [ ] 10.3.4 Display average scores per tool

### 11. Frontend Integration (⚠️ Modifications)

- [x] 11.1 Modify frontend/src/components/phases/AssessPhase.tsx
  - [x] 11.1.1 Import SelectorPhase component
  - [x] 11.1.2 Import Target icon from lucide-react
  - [x] 11.1.3 Add 'selector' to tabs array (after 'immersion-day')
  - [x] 11.1.4 Add SelectorPhase render case
  - [ ] 11.1.5 Test that existing sub-tabs still work

- [x] 11.2 Modify frontend/src/types/assessment.ts
  - [x] 11.2.1 Add SelectorQuestion interface
  - [x] 11.2.2 Add SelectorAnswer interface
  - [x] 11.2.3 Add SelectorSession interface
  - [x] 11.2.4 Add SelectorResult interface
  - [x] 11.2.5 Add SelectorHistory interface

- [x] 11.3 Verify sub-tab integration
  - [x] 11.3.1 Selector appears after "Día de Inmersión"
  - [x] 11.3.2 Target icon displays correctly
  - [ ] 11.3.3 Test sub-tab switching

### 12. Styling & UX

- [ ] 12.1 Inherit existing styles
  - [ ] 12.1.1 Use existing TailwindCSS classes
  - [ ] 12.1.2 Use existing shadcn/ui components
  - [ ] 12.1.3 Match color scheme and typography
  - [ ] 12.1.4 Ensure consistent spacing

- [ ] 12.2 Responsive design
  - [ ] 12.2.1 Test on mobile (320px+)
  - [ ] 12.2.2 Test on tablet (768px+)
  - [ ] 12.2.3 Test on desktop (1024px+)
  - [ ] 12.2.4 Adjust layouts for each breakpoint

- [ ] 12.3 Accessibility
  - [ ] 12.3.1 Add ARIA labels
  - [ ] 12.3.2 Ensure keyboard navigation
  - [ ] 12.3.3 Add focus indicators
  - [ ] 12.3.4 Test with screen reader

---

## Phase 3: Export & History Polish (Days 15-17)

### 13. PDF Generation Enhancement

- [ ] 13.1 Improve PDF template
  - [ ] 13.1.1 Add SWO logo and branding
  - [ ] 13.1.2 Improve typography and spacing
  - [ ] 13.1.3 Add page numbers
  - [ ] 13.1.4 Add table of contents

- [ ] 13.2 Add radar chart to PDF
  - [ ] 13.2.1 Generate chart as image
  - [ ] 13.2.2 Embed image in PDF
  - [ ] 13.2.3 Ensure proper sizing

### 14. History Enhancements

- [ ] 14.1 Add advanced filtering
  - [ ] 14.1.1 Filter by recommended tool
  - [ ] 14.1.2 Filter by confidence level
  - [ ] 14.1.3 Filter by date range

- [ ] 14.2 Add comparison feature
  - [ ] 14.2.1 Select 2 assessments to compare
  - [ ] 14.2.2 Show side-by-side comparison
  - [ ] 14.2.3 Highlight differences

---

## Phase 4: Testing & Deployment (Days 18-20)

### 15. End-to-End Testing

- [ ] 15.1 Complete flow testing
  - [ ] 15.1.1 Test full questionnaire completion
  - [ ] 15.1.2 Test auto-save at each step
  - [ ] 15.1.3 Test session recovery
  - [ ] 15.1.4 Test score calculation accuracy
  - [ ] 15.1.5 Test PDF export
  - [ ] 15.1.6 Test CSV export
  - [ ] 15.1.7 Test history pagination

- [ ] 15.2 Error scenario testing
  - [ ] 15.2.1 Test network failures
  - [ ] 15.2.2 Test S3 failures
  - [ ] 15.2.3 Test invalid data
  - [ ] 15.2.4 Test concurrent saves

- [ ] 15.3 Performance testing
  - [ ] 15.3.1 Test with 100+ historical assessments
  - [ ] 15.3.2 Test auto-save latency
  - [ ] 15.3.3 Test PDF generation time
  - [ ] 15.3.4 Test page load times

### 16. Cross-browser Testing

- [ ] 16.1 Test on Chrome
- [ ] 16.2 Test on Firefox
- [ ] 16.3 Test on Safari
- [ ] 16.4 Test on Edge

### 17. Documentation

- [ ] 17.1 Create user guide
  - [ ] 17.1.1 How to complete questionnaire
  - [ ] 17.1.2 How to interpret results
  - [ ] 17.1.3 How to export reports
  - [ ] 17.1.4 How to view history

- [ ] 17.2 Create technical documentation
  - [ ] 17.2.1 API documentation
  - [ ] 17.2.2 Component documentation
  - [ ] 17.2.3 Deployment guide
  - [ ] 17.2.4 Troubleshooting guide

### 18. Deployment

- [ ] 18.1 Deploy backend
  - [ ] 18.1.1 Build TypeScript
  - [ ] 18.1.2 Create Lambda package
  - [ ] 18.1.3 Upload to S3
  - [ ] 18.1.4 Update Lambda function
  - [ ] 18.1.5 Test API endpoints in production

- [ ] 18.2 Deploy frontend
  - [ ] 18.2.1 Build React app
  - [ ] 18.2.2 Upload to S3 or Amplify
  - [ ] 18.2.3 Test in production
  - [ ] 18.2.4 Verify all features work

- [ ] 18.3 Upload configuration
  - [ ] 18.3.1 Upload questions.json to S3
  - [ ] 18.3.2 Upload matrix.json to S3
  - [ ] 18.3.3 Verify config loads correctly

### 19. Final Validation

- [ ] 19.1 Verify isolation
  - [ ] 19.1.1 Confirm no existing code modified (except integration points)
  - [ ] 19.1.2 Confirm existing features still work
  - [ ] 19.1.3 Confirm S3 prefixes are isolated

- [ ] 19.2 Verify requirements
  - [ ] 19.2.1 All 28 questions present
  - [ ] 19.2.2 Scoring matches Excel
  - [ ] 19.2.3 Auto-save works reliably
  - [ ] 19.2.4 Exports generate correctly
  - [ ] 19.2.5 History pagination works

- [ ] 19.3 Performance validation
  - [ ] 19.3.1 Page load < 2 seconds
  - [ ] 19.3.2 Auto-save < 500ms
  - [ ] 19.3.3 Calculation < 1 second
  - [ ] 19.3.4 PDF generation < 5 seconds

---

## Summary

**Total Tasks:** 19 major tasks, ~150 sub-tasks
**Estimated Time:** 3 weeks (15 working days)
**Critical Path:** Backend Services → Frontend Components → Integration → Testing

**Integration Points (⚠️ Require Approval):**
1. backend/src/index.ts (add route)
2. frontend/src/components/phases/AssessPhase.tsx (add sub-tab)
3. frontend/src/types/assessment.ts (add types)

**New Files Created:** ~30 files
**Existing Files Modified:** 3 files (minimal changes)

---

**End of Tasks Document**
