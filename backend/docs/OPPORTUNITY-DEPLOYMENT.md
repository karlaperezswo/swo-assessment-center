# Sales Opportunity Analyzer - Deployment Guide

## Overview

This guide covers the deployment configuration for the Sales Opportunity Analyzer feature, including AWS permissions, environment variables, and infrastructure setup.

## Prerequisites

- AWS Account with appropriate permissions
- Existing AWS Assessment Center deployment
- AWS Bedrock access enabled in your region
- S3 bucket for file storage (existing or new)

## AWS Permissions

### Lambda IAM Role Updates

The Lambda function requires additional permissions for Bedrock and S3 operations.

#### Required Permissions

Add the following permissions to your Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeModel",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
      ]
    },
    {
      "Sid": "S3FileOperations",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:*:*:log-group:/aws/lambda/assessment-center-*"
      ]
    }
  ]
}
```

#### AWS CLI Commands

```bash
# Get your Lambda function's role name
aws lambda get-function --function-name assessment-center-backend \
  --query 'Configuration.Role' --output text

# Attach Bedrock policy
aws iam put-role-policy \
  --role-name YourLambdaRoleName \
  --policy-name BedrockAccess \
  --policy-document file://bedrock-policy.json

# Attach S3 policy (if not already attached)
aws iam put-role-policy \
  --role-name YourLambdaRoleName \
  --policy-name S3FileAccess \
  --policy-document file://s3-policy.json
```

## Environment Variables

Add the following environment variables to your Lambda function:

### Required Variables

```bash
# AWS Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1  # Or your preferred region

# S3 Configuration (reuse existing bucket)
S3_BUCKET_NAME=your-assessment-center-bucket
S3_REGION=us-east-1

# Application Configuration
NODE_ENV=production
```

### Optional Variables

```bash
# Bedrock Configuration
BEDROCK_MAX_RETRIES=3
BEDROCK_TIMEOUT_MS=30000

# File Upload Limits
MAX_PDF_SIZE_MB=50
MAX_EXCEL_SIZE_MB=10

# Export Configuration
EXPORT_URL_EXPIRATION_HOURS=1
```

### Setting Environment Variables

**AWS Console:**
1. Navigate to Lambda → Functions → assessment-center-backend
2. Configuration → Environment variables
3. Add each variable with its value

**AWS CLI:**
```bash
aws lambda update-function-configuration \
  --function-name assessment-center-backend \
  --environment Variables="{
    BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0,
    BEDROCK_REGION=us-east-1,
    S3_BUCKET_NAME=your-bucket-name,
    S3_REGION=us-east-1,
    NODE_ENV=production
  }"
```

## S3 Bucket Configuration

### CORS Configuration

Update your S3 bucket CORS to allow PDF uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://your-frontend-domain.com",
      "http://localhost:3005"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Apply CORS:**
```bash
aws s3api put-bucket-cors \
  --bucket your-bucket-name \
  --cors-configuration file://s3-cors-config.json
```

### Lifecycle Policy

Ensure temporary files are automatically deleted:

```json
{
  "Rules": [
    {
      "Id": "DeleteTemporaryFiles",
      "Status": "Enabled",
      "Prefix": "uploads/",
      "Expiration": {
        "Days": 1
      }
    },
    {
      "Id": "DeleteExportFiles",
      "Status": "Enabled",
      "Prefix": "exports/",
      "Expiration": {
        "Days": 1
      }
    }
  ]
}
```

**Apply Lifecycle Policy:**
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket your-bucket-name \
  --lifecycle-configuration file://s3-lifecycle.json
```

### Encryption

Ensure server-side encryption is enabled:

```bash
aws s3api put-bucket-encryption \
  --bucket your-bucket-name \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

## CloudWatch Configuration

### Log Groups

The application automatically creates log groups. Ensure retention is configured:

```bash
# Set log retention to 7 days
aws logs put-retention-policy \
  --log-group-name /aws/lambda/assessment-center-backend \
  --retention-in-days 7
```

### Alarms (Optional)

Create CloudWatch alarms for monitoring:

```bash
# Alarm for Bedrock errors
aws cloudwatch put-metric-alarm \
  --alarm-name opportunity-analyzer-bedrock-errors \
  --alarm-description "Alert on Bedrock API errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=assessment-center-backend
```

## Bedrock Setup

### Enable Bedrock Access

1. Navigate to AWS Bedrock console
2. Select your region (us-east-1 recommended)
3. Request access to Claude 3.5 Sonnet model
4. Wait for approval (usually instant for existing AWS accounts)

### Verify Access

```bash
# Test Bedrock access
aws bedrock list-foundation-models \
  --region us-east-1 \
  --query 'modelSummaries[?contains(modelId, `claude-3-5-sonnet`)]'
```

## Lambda Configuration Updates

### Memory and Timeout

Update Lambda configuration for AI processing:

```bash
aws lambda update-function-configuration \
  --function-name assessment-center-backend \
  --memory-size 2048 \
  --timeout 60
```

**Recommended Settings:**
- Memory: 2048 MB (for PDF parsing and AI processing)
- Timeout: 60 seconds (Bedrock calls can take 20-30 seconds)

### Concurrency

Set reserved concurrency to prevent throttling:

```bash
aws lambda put-function-concurrency \
  --function-name assessment-center-backend \
  --reserved-concurrent-executions 10
```

## Frontend Deployment

### Environment Variables

Update frontend environment variables:

```bash
# .env.production
VITE_API_URL=https://your-api-gateway-url.amazonaws.com
```

### Build and Deploy

```bash
# Build frontend with new components
cd frontend
npm run build

# Deploy to Amplify/S3/CloudFront
# (Follow your existing deployment process)
```

## Verification

### Test Endpoints

```bash
# Test analyze endpoint
curl -X POST https://your-api-url/api/opportunities/analyze \
  -F "mpaFile=@test-mpa.xlsx" \
  -F "mraFile=@test-mra.pdf"

# Test list endpoint
curl "https://your-api-url/api/opportunities/list?sessionId=test-session"
```

### Monitor Logs

```bash
# Watch Lambda logs
aws logs tail /aws/lambda/assessment-center-backend --follow

# Filter for opportunity analyzer logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/assessment-center-backend \
  --filter-pattern "OpportunityAnalyzer"
```

## Cost Estimation

### AWS Bedrock Costs

- Model: Claude 3.5 Sonnet
- Input: ~$3 per 1M tokens
- Output: ~$15 per 1M tokens
- Typical analysis: ~2,000 input tokens, ~1,500 output tokens
- **Cost per analysis: ~$0.03**

### S3 Costs

- Storage: Minimal (files deleted after 1 day)
- Requests: ~$0.005 per 1,000 requests
- **Cost per analysis: ~$0.001**

### Lambda Costs

- Additional execution time: ~10-15 seconds per analysis
- Memory: 2048 MB
- **Cost per analysis: ~$0.002**

**Total estimated cost per analysis: ~$0.033**

## Rollback Plan

If issues occur, disable the feature:

1. Remove opportunity routes from backend
2. Hide opportunity tab in frontend
3. Revert Lambda permissions (optional)

```bash
# Quick disable via environment variable
aws lambda update-function-configuration \
  --function-name assessment-center-backend \
  --environment Variables="{FEATURE_OPPORTUNITIES_ENABLED=false}"
```

## Troubleshooting

### Bedrock Access Denied

**Error:** `AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel`

**Solution:**
1. Verify IAM role has Bedrock permissions
2. Check Bedrock model access is enabled in console
3. Verify region supports Claude 3.5 Sonnet

### PDF Parsing Failures

**Error:** `Failed to parse PDF: Invalid file format`

**Solution:**
1. Verify PDF is not encrypted or password-protected
2. Check PDF size is under 50MB
3. Ensure PDF contains extractable text (not scanned images)

### S3 Upload Failures

**Error:** `Access Denied` when uploading to S3

**Solution:**
1. Verify Lambda role has S3 PutObject permission
2. Check bucket policy allows Lambda access
3. Verify bucket exists and is in correct region

## Security Checklist

- [ ] Bedrock permissions limited to specific model
- [ ] S3 bucket has encryption enabled
- [ ] CORS configured for production domain only
- [ ] CloudWatch logs retention configured
- [ ] Lambda timeout set appropriately
- [ ] Environment variables configured
- [ ] API Gateway throttling enabled (if applicable)
- [ ] Sensitive data anonymization verified

## Support

For deployment issues, contact:
- DevOps Team: devops@example.com
- AWS Support: Open ticket in AWS Console

## Next Steps

After deployment:
1. Test with sample MPA and MRA files
2. Monitor CloudWatch logs for errors
3. Review Bedrock usage in AWS Cost Explorer
4. Gather user feedback
5. Plan for DynamoDB migration (see DYNAMODB-MIGRATION.md)
