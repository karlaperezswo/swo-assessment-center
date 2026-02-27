# Implementation Plan: Sales Opportunity Analyzer

## Overview

This implementation plan breaks down the Sales Opportunity Analyzer feature into incremental coding tasks. The approach follows a layered architecture: first establishing core services (PDF parsing, anonymization), then integrating AI analysis (Bedrock), followed by storage and API layers, and finally the frontend dashboard and export functionality. Each task builds on previous work, with property-based tests integrated throughout to validate correctness early.

## Tasks

- [x] 1. Set up project dependencies and type definitions
  - Install required npm packages: `@aws-sdk/client-bedrock-runtime`, `pdf-parse`, `fast-check` (dev)
  - Create shared type definitions for Opportunity, MraData, AnonymizedData, and API request/response types
  - Add types to `shared/types/` directory for use across backend and frontend
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Implement PDF Parser Service
  - [x] 2.1 Create PdfParserService class with parsePdf and validatePdf methods
    - Use `pdf-parse` library to extract text from PDF buffers
    - Implement heuristic-based section detection for maturity level, security gaps, DR strategy
    - Return structured MraData object with extracted sections and raw text
    - Handle parsing errors gracefully with descriptive error messages
    - _Requirements: 1.2, 1.4_

  - [x]* 2.2 Write property test for PDF file size validation
    - **Property 1: File Size Validation**
    - **Validates: Requirements 1.1**

  - [x]* 2.3 Write unit tests for PDF parsing with sample documents
    - Test with English and Spanish sample MRA PDFs
    - Verify 95% extraction accuracy against known content
    - Test error handling with corrupted PDFs
    - _Requirements: 1.2, 12.1_

- [x] 3. Implement Anonymization Service
  - [x] 3.1 Create AnonymizationService class with anonymize and deanonymize methods
    - Implement regex-based detection for IP addresses, hostnames, company names
    - Generate anonymized tokens (IP_001, HOST_001, COMPANY_A)
    - Maintain bidirectional mapping for deanonymization
    - Preserve architecture patterns, technology stacks, maturity levels
    - Validate no sensitive patterns remain after anonymization
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x]* 3.2 Write property test for comprehensive sensitive data anonymization
    - **Property 4: Comprehensive Sensitive Data Anonymization**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.6**

  - [x]* 3.3 Write property test for preservation of non-sensitive data
    - **Property 5: Preservation of Non-Sensitive Data**
    - **Validates: Requirements 2.4**

  - [x]* 3.4 Write property test for anonymization round-trip
    - **Property 6: Anonymization Round-Trip**
    - **Validates: Requirements 2.5**

- [x] 4. Implement Bedrock Service
  - [x] 4.1 Create BedrockService class with analyzeOpportunities and buildPrompt methods
    - Use `@aws-sdk/client-bedrock-runtime` with Claude 3.5 Sonnet model
    - Implement structured prompt generation with MPA and MRA data summaries
    - Add retry logic with exponential backoff (3 retries: 1s, 2s, 4s)
    - Set 30-second timeout for API calls
    - Validate response is valid JSON before returning
    - Log all requests to CloudWatch with anonymized data samples
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

  - [x]* 4.2 Write property test for Bedrock prompt contains required data
    - **Property 7: Bedrock Prompt Contains Required Data**
    - **Validates: Requirements 3.2**

  - [x]* 4.3 Write property test for Bedrock response validation
    - **Property 8: Bedrock Response Validation**
    - **Validates: Requirements 3.6**

  - [x]* 4.4 Write property test for CloudWatch logging without sensitive data
    - **Property 9: CloudWatch Logging Without Sensitive Data**
    - **Validates: Requirements 3.5, 9.5**

  - [x]* 4.5 Write unit test for Bedrock retry logic
    - Simulate transient failures and verify 3 retry attempts
    - Verify exponential backoff timing
    - _Requirements: 3.4, 12.3_

- [x] 5. Checkpoint - Ensure core services work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Opportunity Analyzer Service
  - [x] 6.1 Create OpportunityAnalyzerService class with parseOpportunities and validateOpportunity methods
    - Parse JSON response from Bedrock into Opportunity objects
    - Generate UUID for each opportunity
    - Set initial status to 'Nueva'
    - Validate all required fields present and valid
    - Deanonymize any remaining tokens in text fields
    - Sort opportunities by priority then ARR
    - Add createdAt and updatedAt timestamps
    - _Requirements: 4.1, 4.2, 4.3, 5.2_

  - [x]* 6.2 Write property test for opportunity required fields
    - **Property 10: Opportunity Required Fields**
    - **Validates: Requirements 4.1, 4.4, 4.5, 4.6**

  - [x]* 6.3 Write property test for valid priority values
    - **Property 11: Valid Priority Values**
    - **Validates: Requirements 4.2**

  - [x]* 6.4 Write property test for opportunity sort order
    - **Property 12: Opportunity Sort Order**
    - **Validates: Requirements 4.3**

  - [x]* 6.5 Write property test for initial status is Nueva
    - **Property 14: Initial Status is Nueva**
    - **Validates: Requirements 5.2**

  - [x]* 6.6 Write property test for Spanish language output
    - **Property 16: Spanish Language Output**
    - **Validates: Requirements 6.3**

  - [x]* 6.7 Write property test for minimum opportunity count
    - **Property 30: Minimum Opportunity Count**
    - **Validates: Requirements 12.4**

- [x] 7. Implement Opportunity Storage Service
  - [x] 7.1 Create OpportunityStorageService interface and in-memory implementation
    - Define interface with storeOpportunities, getOpportunities, updateStatus, getOpportunity methods
    - Implement InMemoryOpportunityStorage using Map with sessionId as key
    - Implement filter logic for priority, ARR range, status
    - Implement search across title, reasoning, talkingPoints
    - Document DynamoDB migration path in code comments
    - _Requirements: 5.1, 5.3, 5.4, 7.3, 7.4, 11.1, 11.2, 11.3_

  - [x]* 7.2 Write property test for valid opportunity status values
    - **Property 13: Valid Opportunity Status Values**
    - **Validates: Requirements 5.1, 5.3**

  - [x]* 7.3 Write property test for status update persistence
    - **Property 15: Status Update Persistence**
    - **Validates: Requirements 5.4**

  - [x]* 7.4 Write property test for list endpoint filtering
    - **Property 27: List Endpoint Filtering**
    - **Validates: Requirements 10.3**

  - [x]* 7.5 Write property test for search functionality
    - **Property 19: Search Functionality**
    - **Validates: Requirements 7.4**

  - [x]* 7.6 Write property test for on-demand generation
    - **Property 29: On-Demand Generation**
    - **Validates: Requirements 11.3**

  - [x]* 7.7 Write property test for concurrent request safety
    - **Property 31: Concurrent Request Safety**
    - **Validates: Requirements 12.5**

- [x] 8. Implement API endpoints and controllers
  - [x] 8.1 Create OpportunityController with analyze, list, updateStatus methods
    - Implement POST /api/opportunities/analyze endpoint
    - Accept multipart form data with mpaFile and mraFile
    - Orchestrate: parse PDF → parse Excel → anonymize → Bedrock → analyze → store
    - Return sessionId and opportunities array
    - Implement GET /api/opportunities/list with query parameter filters
    - Implement PATCH /api/opportunities/:id/status for status updates
    - Add comprehensive error handling with appropriate HTTP status codes
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_

  - [x] 8.2 Create opportunityRoutes.ts with route definitions
    - Define routes with multer middleware for file uploads
    - Configure multer to accept PDF and Excel files up to 50MB
    - Add validation middleware for request parameters
    - Wire routes to OpportunityController methods
    - _Requirements: 10.1, 10.3, 10.5_

  - [x] 8.3 Integrate opportunity routes into main Express app
    - Import and mount opportunityRoutes in src/index.ts
    - Ensure routes are accessible at /api/opportunities/*
    - _Requirements: 10.1_

  - [x]* 8.4 Write property test for S3 storage after processing
    - **Property 2: S3 Storage After Processing**
    - **Validates: Requirements 1.3**

  - [x]* 8.5 Write property test for error messages on failure
    - **Property 3: Error Messages on Failure**
    - **Validates: Requirements 1.4**

  - [x]* 8.6 Write property test for error response format
    - **Property 28: Error Response Format**
    - **Validates: Requirements 10.6**

  - [x]* 8.7 Write property test for no sensitive data to Bedrock
    - **Property 26: No Sensitive Data to Bedrock**
    - **Validates: Requirements 9.6**

  - [x]* 8.8 Write unit tests for API endpoints
    - Test analyze endpoint with sample MPA and MRA files
    - Test list endpoint with various filter combinations
    - Test updateStatus endpoint with valid and invalid status values
    - Test error handling for missing files, invalid formats
    - _Requirements: 10.1, 10.3, 10.5, 10.6_

- [x] 9. Checkpoint - Ensure backend API is functional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Export Service
  - [x] 10.1 Create ExportService class with generatePlaybook and getDownloadUrl methods
    - Reuse existing docxService patterns for document generation
    - Implement document structure: title page, TOC, executive summary, opportunities by priority
    - Format opportunities with full details, talking points, next steps
    - Calculate and include total estimated ARR in summary
    - Upload generated document to S3 with 1-hour retention
    - Return signed URL for download
    - Support both PDF and Word formats
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 10.2 Create export API endpoint in OpportunityController
    - Implement POST /api/opportunities/export endpoint
    - Accept sessionId, format (pdf/docx), optional opportunityIds
    - Call ExportService to generate document
    - Return download URL with expiration time
    - _Requirements: 10.4_

  - [x]* 10.3 Write property test for export format support
    - **Property 21: Export Format Support**
    - **Validates: Requirements 8.1, 8.2**

  - [x]* 10.4 Write property test for export includes all opportunities
    - **Property 22: Export Includes All Opportunities**
    - **Validates: Requirements 8.3**

  - [x]* 10.5 Write property test for export summary with total ARR
    - **Property 23: Export Summary with Total ARR**
    - **Validates: Requirements 8.5**

  - [x]* 10.6 Write property test for Spanish export content
    - **Property 17: Spanish Export Content**
    - **Validates: Requirements 6.5**

  - [x]* 10.7 Write property test for S3 encryption metadata
    - **Property 24: S3 Encryption Metadata**
    - **Validates: Requirements 9.2**

  - [x]* 10.8 Write property test for S3 retention policy applied
    - **Property 25: S3 Retention Policy Applied**
    - **Validates: Requirements 9.3**

  - [x]* 10.9 Write unit test for export endpoint
    - Test PDF export with sample opportunities
    - Test Word export with sample opportunities
    - Verify download URL is valid and expires after 1 hour
    - _Requirements: 8.6, 10.4_

- [x] 11. Implement frontend opportunity dashboard
  - [x] 11.1 Create OpportunityDashboard component with tab integration
    - Add "Oportunidades de Venta" tab to existing assessment interface
    - Create container component with state management for opportunities
    - Implement loading and error states
    - Wire up to backend API endpoints
    - _Requirements: 7.1_

  - [x] 11.2 Create OpportunityList component with grid/list view
    - Display opportunity cards in responsive grid layout
    - Implement OpportunityCard component showing title, priority, ARR, status
    - Add visual indicators for high-value opportunities (ARR > $200K)
    - Handle empty state with helpful message
    - _Requirements: 7.2, 7.6, 7.7_

  - [x] 11.3 Create OpportunityFilters component
    - Add filter controls for priority (High/Medium/Low)
    - Add filter controls for ARR range (min/max inputs)
    - Add filter controls for status (Nueva, En Progreso, etc.)
    - Add search input for text search
    - Apply filters to opportunity list in real-time
    - _Requirements: 7.3, 7.4_

  - [x] 11.4 Create OpportunityDetail component
    - Display full opportunity details in modal or side panel
    - Show all fields: title, priority, ARR, reasoning, talking points, next steps, related services
    - Add status update dropdown
    - Implement status update API call
    - _Requirements: 7.5_

  - [x] 11.5 Create ExportButton component
    - Add export button to dashboard toolbar
    - Implement format selection (PDF/Word)
    - Call export API endpoint
    - Handle download URL and trigger browser download
    - Show loading state during export generation
    - _Requirements: 8.1, 8.2_

  - [x]* 11.6 Write property test for opportunity card required information
    - **Property 18: Opportunity Card Required Information**
    - **Validates: Requirements 7.2**

  - [x]* 11.7 Write property test for high-value opportunity indicators
    - **Property 20: High-Value Opportunity Indicators**
    - **Validates: Requirements 7.6**

  - [ ]* 11.8 Write unit tests for frontend components
    - Test OpportunityDashboard renders correctly
    - Test OpportunityList displays opportunities
    - Test OpportunityFilters apply filters correctly
    - Test OpportunityDetail shows full information
    - Test ExportButton triggers export
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 12. Implement file upload flow for MRA PDFs
  - [x] 12.1 Update existing upload component to accept PDF files
    - Modify file type validation to accept both Excel and PDF
    - Update UI to show two file upload zones or combined zone
    - Add validation for required files (both MPA and MRA)
    - Update upload logic to send both files to analyze endpoint
    - _Requirements: 1.1_

  - [x] 12.2 Add upload progress and error handling
    - Show upload progress for both files
    - Display parsing progress and status
    - Handle and display errors from backend
    - Show success message with opportunity count
    - _Requirements: 1.4_

- [x] 13. Integration and end-to-end wiring
  - [x] 13.1 Wire frontend upload flow to opportunity analysis
    - Connect upload component to POST /api/opportunities/analyze
    - Store sessionId in frontend state after analysis
    - Navigate to opportunity dashboard after successful analysis
    - Pass sessionId to dashboard for opportunity retrieval
    - _Requirements: 10.1, 10.2_

  - [x] 13.2 Wire opportunity dashboard to backend APIs
    - Implement API client functions for list, updateStatus, export
    - Connect OpportunityList to GET /api/opportunities/list
    - Connect OpportunityDetail to PATCH /api/opportunities/:id/status
    - Connect ExportButton to POST /api/opportunities/export
    - Handle API errors and display user-friendly messages in Spanish
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ]* 13.3 Write integration tests for end-to-end flow
    - Test complete flow: upload → parse → analyze → display → export
    - Test concurrent analysis requests
    - Test error recovery scenarios
    - _Requirements: 12.5_

- [x] 14. Final checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Documentation and deployment preparation
  - [x] 15.1 Update API documentation
    - Document all new endpoints with request/response examples
    - Add authentication notes (none required for MVP)
    - Document error codes and messages
    - _Requirements: 10.1, 10.3, 10.4, 10.5_

  - [x] 15.2 Update deployment configuration
    - Add Bedrock permissions to Lambda IAM role
    - Configure CloudWatch log groups for opportunity analysis
    - Update S3 bucket CORS for PDF uploads
    - Add environment variables for Bedrock model ID
    - _Requirements: 3.1, 3.5_

  - [x] 15.3 Create migration guide for DynamoDB integration
    - Document storage abstraction interface
    - Provide DynamoDB table schema
    - Document code changes needed for migration
    - Include cost estimates for DynamoDB usage
    - _Requirements: 11.4, 11.5_

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows a bottom-up approach: services → API → frontend
- All Spanish language output is handled by Bedrock's prompt engineering
- Storage abstraction enables future DynamoDB migration without API changes
- Security is enforced through anonymization before any external API calls
