#!/usr/bin/env bash
# Deploy the Cognito User Pool stack for swo-assessment-center v2.
# Usage: ./aws/deploy-cognito.sh [dev|staging|prod]
set -euo pipefail

ENV_NAME="${1:-dev}"
STACK_NAME="swo-assessment-cognito-${ENV_NAME}"
TEMPLATE="$(dirname "$0")/cognito-stack.yaml"
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
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset

echo ""
echo "✅ Stack deployed. Outputs:"
aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table
