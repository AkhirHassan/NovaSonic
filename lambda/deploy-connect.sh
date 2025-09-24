#!/bin/bash

FUNCTION_NAME="nova-sonic-connect"
ROLE_ARN="arn:aws:iam::207529100869:role/lambda-bedrock-role"

echo "Installing dependencies..."
npm install

echo "Creating deployment package..."
zip -r connect-function.zip connect-integration.js node_modules/ package.json

echo "Creating/updating Lambda function..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler connect-integration.handler \
  --zip-file fileb://connect-function.zip \
  --timeout 30 \
  --memory-size 512 \
  || aws lambda update-function-code \
     --function-name $FUNCTION_NAME \
     --zip-file fileb://connect-function.zip

echo "Getting function ARN..."
FUNCTION_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query 'Configuration.FunctionArn' --output text)
echo "Lambda Function ARN: $FUNCTION_ARN"

echo ""
echo "Next steps:"
echo "1. Go to Amazon Connect console"
echo "2. Create a new Contact Flow"
echo "3. Add 'Invoke AWS Lambda function' block"
echo "4. Use this ARN: $FUNCTION_ARN"
echo "5. Set parameter: customerInput = $.CustomerInput"