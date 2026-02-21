#!/bin/bash
echo "Testing upload endpoint..."
curl -v -X POST \
  https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod/api/report/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@package.json"
