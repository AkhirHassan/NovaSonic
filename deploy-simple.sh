#!/bin/bash

STACK_NAME="nova-sonic-simple"
REGION="us-east-1"

echo "Deploying simple Nova Sonic app..."

# Delete existing stack if it exists
aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION --profile new-account 2>/dev/null
sleep 30

# Deploy new stack
aws cloudformation deploy \
  --template-file cloudformation-simple.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_IAM \
  --region $REGION \
  --profile new-account

# Get outputs
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --profile new-account \
  --query 'Stacks[0].Outputs[?OutputKey==`ApplicationURL`].OutputValue' \
  --output text