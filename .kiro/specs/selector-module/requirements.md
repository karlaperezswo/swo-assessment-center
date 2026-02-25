# Requirements Document: Módulo Selector de Herramientas de Migración

## Metadata
- **Feature Name:** selector-module
- **Derived From:** design.md
- **Status:** Requirements Phase
- **Created:** 2024-02-24
- **Owner:** karla-dev

---

## 1. Business Requirements

### BR-1: Tool Selection Automation
**As a** migration consultant
**I want** an automated tool selection system
**So that** I can quickly determine the best assessment tool for each client

**Acceptance Criteria:**
- System presents 28 questions organized by category
- System calculates scores for 4 tools automatically
- System recommends the highest-scoring tool
- Process takes <3 minutes (vs 10 minutes manual)

### BR-2: Objective Decision Making
**As a** migration consultant
**I want** data-driven tool recommendations
**So that** I can justify my selection to clients and stakeholders

**Acceptance Criteria:**
- Scoring based on predefined matrix
- Confidence level calculated (low/medium/high)
- Top 5 decisive factors identified
- Transparent calculation methodology

### BR-3: Professional Reporting
**As a** migration consultant
**I want** to generate professional reports
**So that** I can share recommendations with clients

**Acceptance Criteria:**
- PDF export with SWO branding
- CSV export for data analysis
- Reports include all answers and justification
- Downloads available immediately after completion

### BR-4: Historical Analysis
**As a** migration team lead
**I want** to view past assessments
**So that** I can learn from previous decisions and identify patterns

**Acceptance Criteria:**
- View last 5 assessments with pagination
- Search by client name
- View global statistics (tool distribution, averages)
- Compare current assessment with historical data


---

## 2. Functional Requirements

### FR-1: Questionnaire System

#### FR-1.1: Question Display
- Display 28 questions organized in 8 categories
- Show category name and description
- Display progress indicator (X/28 questions)
- Show help text for complex questions

#### FR-1.2: Answer Input
- Boolean questions: Two radio buttons (Sí/No)
- Multiple choice: Radio buttons for all options
- Only one answer per question allowed
- Clear visual indication of selected answer

#### FR-1.3: Navigation
- Step-by-step flow by category
- "Next" button to advance
- "Previous" button to go back
- "Skip" option for non-mandatory questions (if any)

### FR-2: Auto-Save Functionality

#### FR-2.1: Save Trigger
- Auto-save after EVERY answer selection
- Debounce saves by 500ms to avoid conflicts
- Save includes: clientName, timestamp, answers, progress

#### FR-2.2: Session Management
- Generate unique timestamp on session start
- Store session in S3 under `/selector/sessions/{clientName}/{timestamp}.json`
- Update existing session on each save
- Mark session as 'completed' when all questions answered

#### FR-2.3: Session Recovery
- Load previous session by clientName + timestamp
- Restore all answers and progress
- Allow user to continue from where they left off
- List available sessions for a client

### FR-3: Score Calculation

#### FR-3.1: Scoring Logic
- Load scoring matrix from `/selector/config/matrix.json`
- For each answer, add points according to matrix
- Calculate absolute scores for all 4 tools
- Calculate percentage scores: (score / max_possible) * 100

#### FR-3.2: Winner Determination
- Identify tool with highest absolute score
- Handle ties: Select first tool alphabetically
- Store recommended tool in result

#### FR-3.3: Confidence Calculation
- Calculate % difference between 1st and 2nd place
- Assign confidence level:
  - <5% difference: Low
  - 5-15% difference: Medium
  - >15% difference: High

#### FR-3.4: Decisive Factors
- For each question, calculate impact: |score_1st - score_2nd|
- Sort by impact descending
- Return top 5 most impactful questions
- Include question text and selected answer

### FR-4: Results Display

#### FR-4.1: Recommendation Badge
- Display recommended tool prominently
- Show confidence level with color coding:
  - Low: Yellow
  - Medium: Orange
  - High: Green
- Show confidence percentage

#### FR-4.2: Score Table
- Display all 4 tools with absolute and percentage scores
- Highlight recommended tool (bold, star icon)
- Sort by score descending
- Show visual bar for each percentage

#### FR-4.3: Radar Chart
- Display comparative radar chart with 4 axes (one per tool)
- Use percentage scores for visualization
- Color-code recommended tool
- Interactive tooltips on hover

#### FR-4.4: Decisive Factors List
- Display top 5 factors in order of impact
- Show question text, answer, and point difference
- Explain why each factor was decisive


### FR-5: Export Functionality

#### FR-5.1: PDF Export
- Generate PDF with SWO branding (logo, colors)
- Include sections:
  - Cover page (client, date, recommended tool)
  - Score table with percentages
  - Radar chart image
  - Decisive factors list
  - Complete Q&A table (all 28 questions)
- Store in `/selector/exports/{clientName}/{timestamp}.pdf`
- Provide download link valid for 7 days

#### FR-5.2: CSV Export
- Generate CSV with structure:
  - Header: Client, Date, Recommended Tool, Confidence
  - Scores section: Tool, Absolute, Percentage
  - Answers section: Question, Answer, ME, Cloudamize, Matilda, Concierto
- Store in `/selector/exports/{clientName}/{timestamp}.csv`
- Provide download link valid for 7 days

#### FR-5.3: Export Triggers
- "Export PDF" button on results page
- "Export CSV" button on results page
- "Export" button on history items
- Generate on-demand (not pre-generated)

### FR-6: History & Analytics

#### FR-6.1: History List
- Display last 5 assessments by default
- Pagination: 5 assessments per page
- Show for each assessment:
  - Client name
  - Date/time
  - Recommended tool
  - Confidence level
  - Absolute scores
- Sort by date descending (newest first)

#### FR-6.2: Search & Filter
- Search by client name (partial match)
- Filter by recommended tool
- Filter by confidence level
- Filter by date range

#### FR-6.3: Global Statistics
- Total assessments count
- Tool distribution (pie chart):
  - % of times each tool was recommended
- Average scores per tool
- Most common decisive factors

#### FR-6.4: Client History
- View all assessments for a specific client
- Compare scores across assessments
- Identify trends (e.g., always recommends Matilda)

---

## 3. Non-Functional Requirements

### NFR-1: Performance
- Page load time: <2 seconds
- Auto-save response time: <500ms
- Score calculation: <1 second
- PDF generation: <5 seconds
- History page load: <2 seconds

### NFR-2: Reliability
- Auto-save success rate: >99%
- Zero data loss on session recovery
- Calculation accuracy: 100% match with Excel
- Export success rate: >95%

### NFR-3: Usability
- Mobile-responsive design
- Keyboard navigation support
- Clear error messages
- Progress indicator always visible
- Undo/redo for answers

### NFR-4: Security
- Client names sanitized (no special characters in S3 keys)
- Session data encrypted at rest (S3 default encryption)
- No PII stored beyond client name
- Export links expire after 7 days

### NFR-5: Maintainability
- Questions editable via JSON (no code changes)
- Scoring matrix editable via JSON
- Modular component structure
- Comprehensive error logging

### NFR-6: Scalability
- Support 100+ concurrent users
- Handle 1000+ historical assessments
- Pagination prevents memory issues
- S3 storage scales automatically

---

## 4. Technical Requirements

### TR-1: Frontend
- React 18+ with TypeScript
- TailwindCSS for styling (inherit existing styles)
- Recharts for radar chart
- Axios for API calls
- React Hook Form for form management

### TR-2: Backend
- Node.js 20+ with TypeScript
- Express.js for API
- AWS SDK for S3 operations
- docx library for PDF generation (or similar)
- Zod for validation

### TR-3: Storage
- AWS S3 for all file storage
- Prefix: `/selector/` (isolated from other modules)
- JSON format for config and data
- Binary format for exports (PDF/CSV)

### TR-4: API
- RESTful API design
- JSON request/response format
- HTTP status codes: 200, 400, 404, 500
- Error responses include message and code

---

## 5. Constraints

### C-1: Isolation
- MUST NOT modify existing MAP Center code
- MUST NOT reuse existing services/logic
- MUST use separate S3 prefixes
- MUST use separate API routes

### C-2: Integration Points
- MAY modify App.tsx to add Selector tab
- MAY modify index.ts to add Selector routes
- MAY add types to assessment.ts
- All modifications MUST be minimal and isolated

### C-3: Data
- Questions MUST match provided Excel (28 questions)
- Scoring matrix MUST match provided Excel
- Calculation MUST produce identical results to Excel

### C-4: Timeline
- Phase 1 (Backend): 1 week
- Phase 2 (Frontend): 1 week
- Phase 3 (Export/History): 3 days
- Phase 4 (Testing): 2 days
- Total: ~3 weeks

---

## 6. Dependencies

### D-1: External
- AWS S3 bucket (existing: assessment-center-files)
- AWS credentials configured
- Node.js 20+ installed
- npm packages (listed in package.json)

### D-2: Internal
- Existing MAP Center infrastructure
- Existing UI components (shadcn/ui)
- Existing TailwindCSS configuration
- Existing API client (lib/api.ts)

---

## 7. Acceptance Criteria Summary

### Phase 1: Core Functionality
- [ ] 28 questions displayed correctly
- [ ] Auto-save works after each answer
- [ ] Score calculation matches Excel
- [ ] Results display correctly
- [ ] Recommended tool is accurate

### Phase 2: Export
- [ ] PDF export generates correctly
- [ ] CSV export generates correctly
- [ ] Downloads work reliably
- [ ] Exports include all required data

### Phase 3: History
- [ ] History list displays last 5 assessments
- [ ] Pagination works (5 per page)
- [ ] Search by client works
- [ ] Statistics calculate correctly

### Phase 4: Integration
- [ ] Selector tab appears in navigation
- [ ] No conflicts with existing modules
- [ ] Styles match existing UI
- [ ] Performance meets requirements

---

## 8. Out of Scope

- Auto-fill from MPA data
- Templates by industry
- Express mode (reduced questions)
- AI-powered recommendations
- Multi-language support
- Custom scoring matrix editor
- Integration with other MAP Center phases
- Email notifications
- Collaborative editing
- Version control for assessments

---

**End of Requirements Document**
