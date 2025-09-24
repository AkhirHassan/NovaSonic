#!/bin/bash

FUNCTION_NAME="nova-sonic-connect"
ROLE_ARN="arn:aws:iam::207529100869:role/lambda-bedrock-role"

echo "Installing dependencies..."
npm install

echo "Creating deployment package..."
zip -r function.zip index.js node_modules/ package.json

echo "Creating/updating Lambda function..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512 \
  || aws lambda update-function-code \
     --function-name $FUNCTION_NAME \
     --zip-file fileb://function.zip

echo "Lambda function deployed!"
echo "Function ARN:"
aws lambda get-function --function-name $FUNCTION_NAME --query 'Configuration.FunctionArn' --output text