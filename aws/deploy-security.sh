#!/usr/bin/env bash
# Deploy the KMS → Secrets → WAF stacks in order for swo-assessment-center v2.
# Usage: ./aws/deploy-security.sh [dev|staging|prod]
set -euo pipefail

ENV_NAME="${1:-dev}"
REGION="${AWS_REGION:-us-east-1}"
DIR="$(dirname "$0")"

echo "Deploying security stacks for env=$ENV_NAME region=$REGION"

# 1. KMS CMK
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "swo-assessment-kms-${ENV_NAME}" \
  --template-file "${DIR}/kms-stack.yaml" \
  --parameter-overrides EnvName="$ENV_NAME" \
  --no-fail-on-empty-changeset

KEY_ARN=$(aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "swo-assessment-kms-${ENV_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='KeyArn'].OutputValue" \
  --output text)

# 2. Secrets Manager (depends on KMS key)
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "swo-assessment-secrets-${ENV_NAME}" \
  --template-file "${DIR}/secrets-stack.yaml" \
  --parameter-overrides EnvName="$ENV_NAME" KmsKeyArn="$KEY_ARN" \
  --no-fail-on-empty-changeset

# 3. WAFv2
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "swo-assessment-waf-${ENV_NAME}" \
  --template-file "${DIR}/waf-stack.yaml" \
  --parameter-overrides EnvName="$ENV_NAME" \
  --no-fail-on-empty-changeset

echo ""
echo "✅ Security stacks deployed."
echo "   Next: associate WAF WebACL with the API Gateway stage:"
echo "     aws wafv2 associate-web-acl --web-acl-arn \$WAF_ARN --resource-arn \$APIGW_STAGE_ARN"
