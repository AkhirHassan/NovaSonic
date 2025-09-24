#!/bin/bash

# Deploy Nova Sonic App to AWS
STACK_NAME="nova-sonic-app"
KEY_PAIR_NAME="nova-sonic-key"

echo "Deploying Nova Sonic App to AWS..."

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file cloudformation.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides KeyPairName=$KEY_PAIR_NAME \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Get outputs
echo "Getting stack outputs..."
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs' \
  --output table

echo "Deployment complete!"