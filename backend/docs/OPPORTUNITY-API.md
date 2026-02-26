# Sales Opportunity Analyzer API Documentation

## Overview

The Sales Opportunity Analyzer API provides endpoints for analyzing Migration Portfolio Assessment (MPA) and Migration Readiness Assessment (MRA) files to identify sales opportunities using AWS Bedrock AI.

## Base URL

- Development: `http://localhost:4000/api/opportunities`
- Production: `https://your-domain.com/api/opportunities`

## Authentication

No authentication required for MVP. All endpoints are publicly accessible.

## Endpoints

### 1. Analyze Opportunities

Analyzes MPA Excel and MRA PDF files to identify sales opportunities.

**Endpoint:** `POST /api/opportunities/analyze`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `mpaFile` (File, required): MPA Excel file (.xlsx format)
- `mraFile` (File, required): MRA PDF file (.pdf format, max 50MB)

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-string",
    "opportunities": [
      {
        "id": "uuid",
        "title": "Modernización de Base de Datos",
        "priority": "High",
        "estimatedARR": 250000,
        "reasoning": "El cliente tiene múltiples bases de datos SQL Server...",
        "talkingPoints": [
          "Reducción de costos de licenciamiento...",
          "Mejora en rendimiento y escalabilidad...",
          "Automatización de backups y recuperación..."
        ],
        "nextSteps": [
          "Realizar workshop de modernización de bases de datos",
          "Preparar propuesta de migración a Amazon RDS"
        ],
        "relatedServices": ["Amazon RDS", "AWS DMS", "Amazon Aurora"],
        "status": "Nueva",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "summary": {
      "totalOpportunities": 5,
      "totalEstimatedARR": 850000,
      "highPriorityCount": 2
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid files
  ```json
  {
    "success": false,
    "error": "Both MPA and MRA files are required"
  }
  ```

- `422 Unprocessable Entity`: File processing error
  ```json
  {
    "success": false,
    "error": "Failed to parse PDF: Invalid file format"
  }
  ```

- `502 Bad Gateway`: Bedrock service error
  ```json
  {
    "success": false,
    "error": "Bedrock analysis failed after 3 retries"
  }
  ```

---

### 2. List Opportunities

Retrieves opportunities for a session with optional filtering.

**Endpoint:** `GET /api/opportunities/list`

**Query Parameters:**
- `sessionId` (string, required): Session identifier from analysis
- `priority` (string, optional): Comma-separated priorities (High,Medium,Low)
- `minARR` (number, optional): Minimum estimated ARR
- `maxARR` (number, optional): Maximum estimated ARR
- `status` (string, optional): Comma-separated statuses (Nueva,En Progreso,Ganada,Perdida,Descartada)
- `search` (string, optional): Search term for title, reasoning, or talking points

**Example Request:**
```
GET /api/opportunities/list?sessionId=abc123&priority=High,Medium&minARR=100000
```

**Response:**

```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "id": "uuid",
        "title": "Modernización de Base de Datos",
        "priority": "High",
        "estimatedARR": 250000,
        "reasoning": "...",
        "talkingPoints": ["..."],
        "nextSteps": ["..."],
        "relatedServices": ["..."],
        "status": "Nueva",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 3
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing sessionId
  ```json
  {
    "success": false,
    "error": "sessionId is required"
  }
  ```

- `404 Not Found`: Session not found
  ```json
  {
    "success": false,
    "error": "Session not found"
  }
  ```

---

### 3. Update Opportunity Status

Updates the status of a specific opportunity.

**Endpoint:** `PATCH /api/opportunities/:id/status`

**Path Parameters:**
- `id` (string, required): Opportunity ID

**Request Body:**
```json
{
  "status": "En Progreso"
}
```

**Valid Status Values:**
- `Nueva`
- `En Progreso`
- `Ganada`
- `Perdida`
- `Descartada`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Modernización de Base de Datos",
    "priority": "High",
    "estimatedARR": 250000,
    "reasoning": "...",
    "talkingPoints": ["..."],
    "nextSteps": ["..."],
    "relatedServices": ["..."],
    "status": "En Progreso",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid status value
  ```json
  {
    "success": false,
    "error": "Invalid status value"
  }
  ```

- `404 Not Found`: Opportunity not found
  ```json
  {
    "success": false,
    "error": "Opportunity not found"
  }
  ```

---

### 4. Export Sales Playbook

Generates and exports a sales playbook document.

**Endpoint:** `POST /api/opportunities/export`

**Request Body:**
```json
{
  "sessionId": "uuid-string",
  "format": "pdf",
  "opportunityIds": ["uuid1", "uuid2"]
}
```

**Parameters:**
- `sessionId` (string, required): Session identifier
- `format` (string, required): Export format (`pdf` or `docx`)
- `opportunityIds` (array, optional): Specific opportunities to export (exports all if omitted)

**Response:**

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3.amazonaws.com/bucket/playbook-abc123.pdf?signature=...",
    "expiresAt": "2024-01-15T12:30:00Z",
    "filename": "playbook-abc123-20240115.pdf"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing required parameters
  ```json
  {
    "success": false,
    "error": "sessionId and format are required"
  }
  ```

- `404 Not Found`: Session not found
  ```json
  {
    "success": false,
    "error": "Session not found"
  }
  ```

- `500 Internal Server Error`: Export generation failed
  ```json
  {
    "success": false,
    "error": "Failed to generate playbook"
  }
  ```

---

## Data Models

### Opportunity

```typescript
interface Opportunity {
  id: string;                    // UUID
  title: string;                 // Spanish title
  priority: 'High' | 'Medium' | 'Low';
  estimatedARR: number;          // Annual Recurring Revenue in USD
  reasoning: string;             // Spanish explanation (2-3 sentences)
  talkingPoints: string[];       // 3-5 Spanish talking points
  nextSteps: string[];           // 2-4 Spanish action items
  relatedServices: string[];     // AWS service names
  status: OpportunityStatus;
  createdAt: Date;
  updatedAt: Date;
}

type OpportunityStatus = 
  | 'Nueva' 
  | 'En Progreso' 
  | 'Ganada' 
  | 'Perdida' 
  | 'Descartada';
```

### Analysis Summary

```typescript
interface AnalysisSummary {
  totalOpportunities: number;
  totalEstimatedARR: number;
  highPriorityCount: number;
}
```

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message in Spanish"
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: File processing error
- `500 Internal Server Error`: Server error
- `502 Bad Gateway`: External service error (Bedrock)
- `503 Service Unavailable`: Service temporarily unavailable

---

## Rate Limiting

No rate limiting implemented in MVP.

---

## File Size Limits

- MPA Excel files: No explicit limit (typically < 10MB)
- MRA PDF files: 50MB maximum

---

## Security Considerations

### Data Anonymization

All sensitive data (IP addresses, hostnames, company names) is anonymized before being sent to AWS Bedrock. The anonymization is reversible only within the backend service.

### Data Retention

- Uploaded files: Stored temporarily in S3 with automatic deletion after processing
- Opportunities: Stored in-memory for MVP (session-based, cleared on server restart)
- Export files: Stored in S3 with 1-hour expiration

### HTTPS

All API calls should be made over HTTPS in production.

---

## Examples

### Complete Analysis Flow

```bash
# 1. Analyze files
curl -X POST http://localhost:4000/api/opportunities/analyze \
  -F "mpaFile=@/path/to/mpa.xlsx" \
  -F "mraFile=@/path/to/mra.pdf"

# Response: { "success": true, "data": { "sessionId": "abc123", ... } }

# 2. List opportunities
curl "http://localhost:4000/api/opportunities/list?sessionId=abc123"

# 3. Update opportunity status
curl -X PATCH http://localhost:4000/api/opportunities/uuid123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "En Progreso"}'

# 4. Export playbook
curl -X POST http://localhost:4000/api/opportunities/export \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "abc123", "format": "pdf"}'
```

---

## Support

For issues or questions, contact the development team.
