#!/bin/bash

# Deploy Nova Speech App to New AWS Account
echo "Deploying to new AWS account..."

# Set variables
NEW_ACCOUNT_PROFILE="new-account"
REGION="us-east-1"  # Change if needed
FUNCTION_NAME="nova-speech-app"

# Create Lambda execution role
echo "Creating Lambda execution role..."
aws iam create-role \
  --role-name lambda-bedrock-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' \
  --profile $NEW_ACCOUNT_PROFILE \
  --region $REGION

# Attach policies
aws iam attach-role-policy \
  --role-name lambda-bedrock-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  --profile $NEW_ACCOUNT_PROFILE

aws iam attach-role-policy \
  --role-name lambda-bedrock-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess \
  --profile $NEW_ACCOUNT_PROFILE

# Wait for role propagation
echo "Waiting for role propagation..."
sleep 10

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile $NEW_ACCOUNT_PROFILE)
echo "Account ID: $ACCOUNT_ID"

# Package Lambda function
cd lambda
zip -r nova-speech-app.zip web-app-handler.js

# Create Lambda function
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs18.x \
  --role arn:aws:iam::$ACCOUNT_ID:role/lambda-bedrock-role \
  --handler web-app-handler.handler \
  --zip-file fileb://nova-speech-app.zip \
  --timeout 30 \
  --memory-size 512 \
  --profile $NEW_ACCOUNT_PROFILE \
  --region $REGION

echo "Deployment complete!"
echo "Lambda function: $FUNCTION_NAME"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"