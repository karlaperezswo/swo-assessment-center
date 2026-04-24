#!/usr/bin/env bash
# Deploy the DynamoDB single-table stack for swo-assessment-center v2.
# Usage: ./aws/deploy-dynamodb.sh [dev|staging|prod]
set -euo pipefail

ENV_NAME="${1:-dev}"
STACK_NAME="swo-assessment-dynamodb-${ENV_NAME}"
TEMPLATE="$(dirname "$0")/dynamodb-stack.yaml"
REGION="${AWS_REGION:-us-east-1}"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "Template not found: $TEMPLATE" >&2
  exit 1
fi

echo "Deploying stack '$STACK_NAME' in region '$REGION' (env=$ENV_NAME)"

aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE" \
  --parameter-overrides EnvName="$ENV_NAME" \
  --no-fail-on-empty-changeset

TABLE_NAME=$(aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='TableName'].OutputValue" \
  --output text)

echo ""
echo "✅ Stack deployed."
echo "   Table: $TABLE_NAME"
echo ""
echo "Export in your environment:"
echo "   export SWO_TABLE_NAME=$TABLE_NAME"
echo "   export USE_DYNAMO_STORAGE=true"
