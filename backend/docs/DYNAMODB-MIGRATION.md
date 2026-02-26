# DynamoDB Migration Guide

## Overview

This guide provides a migration path from the current in-memory opportunity storage to persistent DynamoDB storage. The architecture is designed to support this migration without requiring API changes.

## Current Architecture

### In-Memory Storage (MVP)

```typescript
// backend/src/services/OpportunityStorageService.ts
class InMemoryOpportunityStorage implements OpportunityStorageService {
  private storage: Map<string, Opportunity[]> = new Map();
  
  async storeOpportunities(opportunities: Opportunity[], sessionId: string): Promise<void> {
    this.storage.set(sessionId, opportunities);
  }
  
  async getOpportunities(sessionId: string, filters?: OpportunityFilters): Promise<Opportunity[]> {
    const opportunities = this.storage.get(sessionId) || [];
    return this.applyFilters(opportunities, filters);
  }
}
```

**Limitations:**
- Data lost on server restart
- No persistence across Lambda invocations
- Limited to single instance
- No historical tracking

## Target Architecture

### DynamoDB Storage

```typescript
// backend/src/services/DynamoDBOpportunityStorage.ts
class DynamoDBOpportunityStorage implements OpportunityStorageService {
  private dynamoDB: DynamoDBClient;
  private tableName: string;
  
  async storeOpportunities(opportunities: Opportunity[], sessionId: string): Promise<void> {
    // Batch write to DynamoDB
  }
  
  async getOpportunities(sessionId: string, filters?: OpportunityFilters): Promise<Opportunity[]> {
    // Query DynamoDB with filters
  }
}
```

**Benefits:**
- Persistent storage
- Scalable across instances
- Historical tracking
- Advanced querying capabilities

## DynamoDB Table Schema

### Table: `OpportunitySessions`

**Primary Key:**
- Partition Key: `sessionId` (String)
- Sort Key: `opportunityId` (String)

**Attributes:**
```typescript
{
  sessionId: string;           // PK: Session identifier
  opportunityId: string;       // SK: Opportunity UUID
  title: string;               // Opportunity title
  priority: string;            // High, Medium, Low
  estimatedARR: number;        // Annual Recurring Revenue
  reasoning: string;           // Analysis reasoning
  talkingPoints: string[];     // Array of talking points
  nextSteps: string[];         // Array of next steps
  relatedServices: string[];   // Array of AWS services
  status: string;              // Nueva, En Progreso, etc.
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
  ttl: number;                 // Unix timestamp for auto-deletion
}
```

### Global Secondary Indexes

#### 1. Status Index
**Purpose:** Query opportunities by status across sessions

- Partition Key: `status` (String)
- Sort Key: `updatedAt` (String)
- Projection: ALL

**Use Case:** Find all "En Progreso" opportunities

#### 2. Priority Index
**Purpose:** Query high-priority opportunities

- Partition Key: `priority` (String)
- Sort Key: `estimatedARR` (Number)
- Projection: ALL

**Use Case:** Find all High priority opportunities sorted by ARR

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'DynamoDB table for Sales Opportunity Analyzer'

Resources:
  OpportunitySessionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: OpportunitySessions
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: sessionId
          AttributeType: S
        - AttributeName: opportunityId
          AttributeType: S
        - AttributeName: status
          AttributeType: S
        - AttributeName: priority
          AttributeType: S
        - AttributeName: updatedAt
          AttributeType: S
        - AttributeName: estimatedARR
          AttributeType: N
      KeySchema:
        - AttributeName: sessionId
          KeyType: HASH
        - AttributeName: opportunityId
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: StatusIndex
          KeySchema:
            - AttributeName: status
              KeyType: HASH
            - AttributeName: updatedAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: PriorityIndex
          KeySchema:
            - AttributeName: priority
              KeyType: HASH
            - AttributeName: estimatedARR
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Application
          Value: AssessmentCenter
        - Key: Component
          Value: OpportunityAnalyzer

Outputs:
  TableName:
    Description: DynamoDB table name
    Value: !Ref OpportunitySessionsTable
    Export:
      Name: OpportunitySessionsTableName
  
  TableArn:
    Description: DynamoDB table ARN
    Value: !GetAtt OpportunitySessionsTable.Arn
    Export:
      Name: OpportunitySessionsTableArn
```

## Migration Steps

### Phase 1: Create DynamoDB Table

```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name opportunity-analyzer-storage \
  --template-body file://dynamodb-table.yaml \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name opportunity-analyzer-storage \
  --region us-east-1

# Get table name
aws cloudformation describe-stacks \
  --stack-name opportunity-analyzer-storage \
  --query 'Stacks[0].Outputs[?OutputKey==`TableName`].OutputValue' \
  --output text
```

### Phase 2: Update IAM Permissions

Add DynamoDB permissions to Lambda role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem",
        "dynamodb:BatchGetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/OpportunitySessions",
        "arn:aws:dynamodb:*:*:table/OpportunitySessions/index/*"
      ]
    }
  ]
}
```

```bash
aws iam put-role-policy \
  --role-name YourLambdaRoleName \
  --policy-name DynamoDBOpportunityAccess \
  --policy-document file://dynamodb-policy.json
```

### Phase 3: Implement DynamoDB Storage Service

Create new implementation:

```typescript
// backend/src/services/DynamoDBOpportunityStorage.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand, 
  UpdateCommand,
  BatchWriteCommand 
} from '@aws-sdk/lib-dynamodb';
import { OpportunityStorageService, Opportunity, OpportunityFilters } from '../types';

export class DynamoDBOpportunityStorage implements OpportunityStorageService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'OpportunitySessions';
  }

  async storeOpportunities(opportunities: Opportunity[], sessionId: string): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

    // Batch write opportunities
    const batches = this.chunkArray(opportunities, 25); // DynamoDB batch limit

    for (const batch of batches) {
      const putRequests = batch.map(opp => ({
        PutRequest: {
          Item: {
            sessionId,
            opportunityId: opp.id,
            ...opp,
            ttl,
          }
        }
      }));

      await this.docClient.send(new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: putRequests
        }
      }));
    }
  }

  async getOpportunities(sessionId: string, filters?: OpportunityFilters): Promise<Opportunity[]> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId
      }
    }));

    let opportunities = (result.Items || []) as Opportunity[];

    // Apply filters
    if (filters) {
      opportunities = this.applyFilters(opportunities, filters);
    }

    return opportunities;
  }

  async updateStatus(id: string, status: string): Promise<void> {
    // Need to find sessionId first (requires GSI or scan)
    // For now, store sessionId in a separate mapping or pass it as parameter
    
    await this.docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { sessionId: 'session-id', opportunityId: id },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    }));
  }

  async getOpportunity(id: string): Promise<Opportunity | null> {
    // Similar challenge - need sessionId
    // Consider adding opportunityId GSI or maintaining id->sessionId mapping
    throw new Error('Not implemented - requires GSI on opportunityId');
  }

  private applyFilters(opportunities: Opportunity[], filters: OpportunityFilters): Opportunity[] {
    // Same filtering logic as in-memory implementation
    let filtered = opportunities;

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(opp => filters.priority!.includes(opp.priority));
    }

    if (filters.minARR !== undefined) {
      filtered = filtered.filter(opp => opp.estimatedARR >= filters.minARR!);
    }

    if (filters.maxARR !== undefined) {
      filtered = filtered.filter(opp => opp.estimatedARR <= filters.maxARR!);
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(opp => filters.status!.includes(opp.status));
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.title.toLowerCase().includes(searchLower) ||
        opp.reasoning.toLowerCase().includes(searchLower) ||
        opp.talkingPoints.some(tp => tp.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

### Phase 4: Update Service Factory

Add environment variable to switch implementations:

```typescript
// backend/src/services/OpportunityStorageService.ts
import { InMemoryOpportunityStorage } from './InMemoryOpportunityStorage';
import { DynamoDBOpportunityStorage } from './DynamoDBOpportunityStorage';

export function createOpportunityStorageService(): OpportunityStorageService {
  const storageType = process.env.OPPORTUNITY_STORAGE_TYPE || 'memory';
  
  if (storageType === 'dynamodb') {
    return new DynamoDBOpportunityStorage();
  }
  
  return new InMemoryOpportunityStorage();
}
```

### Phase 5: Deploy and Test

```bash
# Set environment variable
aws lambda update-function-configuration \
  --function-name assessment-center-backend \
  --environment Variables="{
    OPPORTUNITY_STORAGE_TYPE=dynamodb,
    DYNAMODB_TABLE_NAME=OpportunitySessions,
    ...other variables...
  }"

# Test with sample data
curl -X POST https://your-api-url/api/opportunities/analyze \
  -F "mpaFile=@test-mpa.xlsx" \
  -F "mraFile=@test-mra.pdf"

# Verify data in DynamoDB
aws dynamodb scan \
  --table-name OpportunitySessions \
  --limit 5
```

### Phase 6: Monitor and Validate

```bash
# Monitor DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=OpportunitySessions \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --period 3600 \
  --statistics Sum

# Check for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/assessment-center-backend \
  --filter-pattern "DynamoDB ERROR"
```

## Cost Estimation

### DynamoDB Costs (On-Demand Pricing)

**Assumptions:**
- 100 analyses per month
- Average 5 opportunities per analysis
- 500 total opportunities stored
- 1,000 read requests per month
- 500 write requests per month

**Costs:**
- Write requests: 500 × $1.25 per million = $0.000625
- Read requests: 1,000 × $0.25 per million = $0.00025
- Storage: 500 items × 5KB × $0.25 per GB-month = $0.0006
- **Total: ~$0.002 per month**

### Comparison with In-Memory

| Feature | In-Memory | DynamoDB |
|---------|-----------|----------|
| Cost | $0 | ~$0.002/month |
| Persistence | No | Yes |
| Scalability | Limited | Unlimited |
| Historical Data | No | Yes (with TTL) |
| Multi-Instance | No | Yes |

## Rollback Plan

If issues occur with DynamoDB:

```bash
# Switch back to in-memory storage
aws lambda update-function-configuration \
  --function-name assessment-center-backend \
  --environment Variables="{OPPORTUNITY_STORAGE_TYPE=memory}"

# Data in DynamoDB remains intact for future retry
```

## Advanced Features (Future)

### 1. Opportunity History Tracking

Add `version` attribute to track changes:

```typescript
interface OpportunityVersion {
  sessionId: string;
  opportunityId: string;
  version: number;
  status: string;
  updatedAt: string;
  updatedBy: string;
}
```

### 2. Cross-Session Analytics

Query opportunities across all sessions:

```typescript
// Find all high-priority opportunities
const result = await docClient.send(new QueryCommand({
  TableName: tableName,
  IndexName: 'PriorityIndex',
  KeyConditionExpression: 'priority = :priority',
  ExpressionAttributeValues: {
    ':priority': 'High'
  }
}));
```

### 3. Opportunity Templates

Store common opportunity patterns:

```typescript
interface OpportunityTemplate {
  templateId: string;
  title: string;
  talkingPoints: string[];
  nextSteps: string[];
  relatedServices: string[];
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('DynamoDBOpportunityStorage', () => {
  it('should store and retrieve opportunities', async () => {
    const storage = new DynamoDBOpportunityStorage();
    const opportunities = [/* test data */];
    
    await storage.storeOpportunities(opportunities, 'test-session');
    const retrieved = await storage.getOpportunities('test-session');
    
    expect(retrieved).toHaveLength(opportunities.length);
  });
});
```

### Integration Tests

```bash
# Create test table
aws dynamodb create-table \
  --table-name OpportunitySessions-Test \
  --attribute-definitions ... \
  --key-schema ...

# Run tests
DYNAMODB_TABLE_NAME=OpportunitySessions-Test npm test

# Delete test table
aws dynamodb delete-table --table-name OpportunitySessions-Test
```

## Support

For migration assistance:
- Database Team: database@example.com
- AWS Support: Open DynamoDB ticket

## References

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
