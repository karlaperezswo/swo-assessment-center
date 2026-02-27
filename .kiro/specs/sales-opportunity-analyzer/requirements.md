# Requirements Document: Sales Opportunity Analyzer

## Introduction

The Sales Opportunity Analyzer is a new module for the AWS Assessment Center that leverages AWS Bedrock AI to analyze Migration Portfolio Assessment (MPA) Excel files and Migration Readiness Assessment (MRA) PDF documents. The system identifies and prioritizes sales opportunities for pre-sales teams by analyzing infrastructure data, maturity levels, and identified gaps. The analyzer anonymizes sensitive data before AI processing, generates actionable insights with estimated value, and provides a comprehensive sales playbook in Spanish.

## Glossary

- **MPA**: Migration Portfolio Assessment - Excel file containing infrastructure inventory (servers, databases, applications)
- **MRA**: Migration Readiness Assessment - PDF document containing maturity levels, security gaps, and readiness analysis
- **Bedrock**: AWS Bedrock - Managed AI service providing access to foundation models like Claude
- **Opportunity**: A potential sales engagement identified from assessment data, including priority, value, and action items
- **Sales_Playbook**: Exportable document containing all opportunities with talking points and next steps
- **Anonymization_Service**: Component that masks sensitive data (IPs, hostnames, company identifiers) before AI processing
- **ARR**: Annual Recurring Revenue - Estimated yearly value of an opportunity
- **Assessment_Center**: The existing AWS assessment application that processes MPA files
- **Parser_Service**: Component that extracts and structures content from PDF documents
- **Bedrock_Service**: Component that interfaces with AWS Bedrock API for AI analysis
- **Opportunity_Analyzer**: Component that processes Bedrock responses into structured opportunities
- **Dashboard**: Integrated UI component displaying opportunities with filters and search

## Requirements

### Requirement 1: PDF Document Upload and Processing

**User Story:** As a sales engineer, I want to upload MRA PDF documents alongside MPA Excel files, so that the system can analyze both infrastructure data and readiness assessments together.

#### Acceptance Criteria

1. WHEN a user uploads an MRA PDF document, THE Assessment_Center SHALL accept PDF files up to 50MB in size
2. WHEN a PDF is uploaded, THE Parser_Service SHALL extract text content with at least 95% accuracy
3. WHEN PDF processing completes, THE Assessment_Center SHALL store the file temporarily in S3 with the same retention policy as MPA files
4. WHEN PDF processing fails, THE Assessment_Center SHALL return a descriptive error message to the user
5. THE Assessment_Center SHALL process PDF files in memory before S3 storage to minimize disk usage

### Requirement 2: Data Anonymization

**User Story:** As a security officer, I want sensitive data anonymized before sending to Bedrock, so that we protect client confidentiality while still enabling meaningful analysis.

#### Acceptance Criteria

1. WHEN processing assessment data for Bedrock, THE Anonymization_Service SHALL replace all IP addresses with anonymized tokens
2. WHEN processing assessment data for Bedrock, THE Anonymization_Service SHALL replace all hostnames with anonymized tokens
3. WHEN processing assessment data for Bedrock, THE Anonymization_Service SHALL remove or mask company-specific identifiable information
4. WHEN anonymizing data, THE Anonymization_Service SHALL preserve architecture patterns, technology stacks, maturity levels, and gap information
5. THE Anonymization_Service SHALL maintain a mapping between original and anonymized values for result interpretation
6. WHEN anonymization completes, THE Anonymization_Service SHALL validate that no sensitive patterns remain in the output

### Requirement 3: AWS Bedrock Integration

**User Story:** As a sales engineer, I want the system to use AWS Bedrock AI to analyze assessment data, so that I receive intelligent insights about sales opportunities.

#### Acceptance Criteria

1. THE Bedrock_Service SHALL use the Claude 3.5 Sonnet model for opportunity analysis
2. WHEN invoking Bedrock, THE Bedrock_Service SHALL send anonymized MPA and MRA data in a structured prompt
3. WHEN Bedrock responds, THE Bedrock_Service SHALL complete the analysis within 30 seconds
4. WHEN Bedrock invocation fails, THE Bedrock_Service SHALL retry up to 3 times with exponential backoff
5. THE Bedrock_Service SHALL log all analysis requests to CloudWatch with anonymized data samples
6. WHEN Bedrock returns a response, THE Bedrock_Service SHALL validate the response structure before processing

### Requirement 4: Opportunity Identification and Prioritization

**User Story:** As a sales engineer, I want the system to identify and prioritize sales opportunities, so that I can focus on the most valuable engagements first.

#### Acceptance Criteria

1. WHEN analyzing assessment data, THE Opportunity_Analyzer SHALL generate opportunities with title, priority level, estimated ARR, reasoning, talking points, next steps, and related AWS services
2. THE Opportunity_Analyzer SHALL assign priority levels of High, Medium, or Low based on estimated value and strategic importance
3. WHEN multiple opportunities are identified, THE Opportunity_Analyzer SHALL sort them by priority level then by estimated ARR
4. WHEN generating opportunities, THE Opportunity_Analyzer SHALL ensure each opportunity includes at least 3 specific talking points
5. WHEN generating opportunities, THE Opportunity_Analyzer SHALL ensure each opportunity includes at least 2 actionable next steps
6. THE Opportunity_Analyzer SHALL associate each opportunity with relevant AWS services from the assessment data

### Requirement 5: Opportunity State Management

**User Story:** As a sales manager, I want to track opportunity states, so that I can monitor progress and outcomes of identified opportunities.

#### Acceptance Criteria

1. THE Assessment_Center SHALL support opportunity states: Nueva, En Progreso, Ganada, Perdida, Descartada
2. WHEN an opportunity is first created, THE Assessment_Center SHALL set its state to Nueva
3. WHEN a user updates an opportunity state, THE Assessment_Center SHALL validate the new state is one of the allowed values
4. WHEN a user updates an opportunity state, THE Assessment_Center SHALL persist the change immediately
5. THE Dashboard SHALL display the current state for each opportunity with visual indicators

### Requirement 6: Multi-Language Support

**User Story:** As a sales engineer working with Spanish-speaking clients, I want the system to interpret English or Spanish input and always respond in Spanish, so that I have consistent Spanish-language materials for client conversations.

#### Acceptance Criteria

1. WHEN processing MRA documents in English, THE Bedrock_Service SHALL interpret the content correctly
2. WHEN processing MRA documents in Spanish, THE Bedrock_Service SHALL interpret the content correctly
3. WHEN generating opportunities, THE Opportunity_Analyzer SHALL produce all text content in Spanish
4. WHEN generating talking points, THE Opportunity_Analyzer SHALL use natural, professional Spanish appropriate for business contexts
5. WHEN exporting sales playbooks, THE Assessment_Center SHALL format all content in Spanish

### Requirement 7: Dashboard Integration and Visualization

**User Story:** As a sales engineer, I want to view opportunities in an integrated dashboard with filters and search, so that I can quickly find relevant opportunities and take action.

#### Acceptance Criteria

1. THE Dashboard SHALL display opportunities in a new "Oportunidades de Venta" section within the existing assessment interface
2. WHEN displaying opportunities, THE Dashboard SHALL show opportunity cards with title, priority, estimated ARR, and state at a glance
3. THE Dashboard SHALL provide filters for priority level, estimated value range, and opportunity state
4. THE Dashboard SHALL provide search functionality across opportunity titles, reasoning, and talking points
5. WHEN a user clicks an opportunity card, THE Dashboard SHALL display a detail view with full analysis and action items
6. THE Dashboard SHALL provide visual indicators for high-value opportunities (ARR > $200K)
7. WHEN no opportunities match filters, THE Dashboard SHALL display a helpful message

### Requirement 8: Sales Playbook Export

**User Story:** As a sales engineer, I want to export a sales playbook to PDF or Word format, so that I can share professional documentation with my team and clients.

#### Acceptance Criteria

1. THE Assessment_Center SHALL provide an export function that generates sales playbooks in PDF format
2. THE Assessment_Center SHALL provide an export function that generates sales playbooks in Word format
3. WHEN exporting a playbook, THE Assessment_Center SHALL include all opportunities with their complete details
4. WHEN exporting a playbook, THE Assessment_Center SHALL format the document professionally with proper headings and structure
5. WHEN exporting a playbook, THE Assessment_Center SHALL include a summary section with total estimated ARR
6. WHEN export completes, THE Assessment_Center SHALL provide a download link valid for 1 hour

### Requirement 9: Security and Encryption

**User Story:** As a security officer, I want all data transmissions encrypted and sensitive data protected, so that we maintain security compliance and protect client information.

#### Acceptance Criteria

1. THE Assessment_Center SHALL transmit all data over HTTPS with TLS 1.2 or higher
2. WHEN storing files in S3, THE Assessment_Center SHALL use server-side encryption with AES-256
3. WHEN storing files in S3, THE Assessment_Center SHALL apply the same retention policy as existing MPA files
4. WHEN the retention period expires, THE Assessment_Center SHALL automatically delete files from S3
5. THE Assessment_Center SHALL log all errors and analysis requests to CloudWatch without including sensitive data
6. THE Bedrock_Service SHALL never send non-anonymized data to the Bedrock API

### Requirement 10: API Endpoints

**User Story:** As a frontend developer, I want well-defined API endpoints for opportunity operations, so that I can build a responsive and functional user interface.

#### Acceptance Criteria

1. THE Assessment_Center SHALL provide a POST /api/opportunities/analyze endpoint that accepts MPA Excel and MRA PDF files
2. WHEN /api/opportunities/analyze is called, THE Assessment_Center SHALL return a list of identified opportunities within 30 seconds
3. THE Assessment_Center SHALL provide a GET /api/opportunities/list endpoint that returns opportunities with optional filters
4. THE Assessment_Center SHALL provide a POST /api/opportunities/export endpoint that generates and returns a sales playbook
5. THE Assessment_Center SHALL provide a PATCH /api/opportunities/:id/status endpoint that updates opportunity state
6. WHEN any endpoint encounters an error, THE Assessment_Center SHALL return appropriate HTTP status codes and error messages

### Requirement 11: Data Persistence Strategy

**User Story:** As a system architect, I want the system designed for easy migration from in-memory to persistent storage, so that we can scale the solution cost-effectively in the future.

#### Acceptance Criteria

1. THE Assessment_Center SHALL implement opportunity storage using an abstraction layer that supports multiple backends
2. WHEN operating in MVP mode, THE Assessment_Center SHALL store opportunities in memory only
3. THE Assessment_Center SHALL generate opportunities on-demand when requested
4. THE Assessment_Center SHALL design the storage abstraction to support DynamoDB integration without API changes
5. THE Assessment_Center SHALL document the migration path from in-memory to DynamoDB storage

### Requirement 12: Performance and Reliability

**User Story:** As a sales engineer, I want the system to perform reliably and quickly, so that I can efficiently analyze assessments and generate opportunities.

#### Acceptance Criteria

1. WHEN parsing PDF documents, THE Parser_Service SHALL achieve at least 95% text extraction accuracy
2. WHEN analyzing assessment data, THE Bedrock_Service SHALL complete processing within 30 seconds
3. WHEN the system encounters transient errors, THE Assessment_Center SHALL retry failed operations up to 3 times
4. WHEN generating opportunities, THE Opportunity_Analyzer SHALL produce at least 3 opportunities for typical assessment data
5. THE Assessment_Center SHALL handle concurrent analysis requests without data corruption
