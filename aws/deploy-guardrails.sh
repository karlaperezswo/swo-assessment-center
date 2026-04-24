#!/usr/bin/env bash
# Deploy the Bedrock Guardrail stack for swo-assessment-center.
# Usage: ./aws/deploy-guardrails.sh [dev|staging|prod]
set -euo pipefail

ENV_NAME="${1:-dev}"
STACK_NAME="swo-assessment-guardrails-${ENV_NAME}"
TEMPLATE="$(dirname "$0")/guardrails-stack.yaml"
REGION="${AWS_REGION:-us-east-1}"

echo "Deploying stack '$STACK_NAME' in region '$REGION' (env=$ENV_NAME)"

aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE" \
  --parameter-overrides EnvName="$ENV_NAME" \
  --no-fail-on-empty-changeset

echo ""
aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table

GID=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='GuardrailId'].OutputValue" --output text)
GVER=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='GuardrailVersion'].OutputValue" --output text)

echo ""
echo "Export in your environment:"
echo "  export BEDROCK_GUARDRAIL_ID=$GID"
echo "  export BEDROCK_GUARDRAIL_VERSION=$GVER"
