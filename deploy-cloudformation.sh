#!/bin/bash

# Deploy Nova Sonic App with CloudFormation
STACK_NAME="novasonic-app-stack"
GITHUB_REPO_URL="https://github.com/abdulrahman305/novasonic-app"
REGION="ap-southeast-2"
PROFILE="new-account"

echo "Deploying Nova Sonic App to App Runner..."

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file cloudformation-template.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    GitHubRepoUrl=$GITHUB_REPO_URL \
    GitHubBranch=main \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION \
  --profile $PROFILE

# Get the service URL
if [ $? -eq 0 ]; then
  echo "Deployment successful!"
  SERVICE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceUrl`].OutputValue' \
    --output text \
    --region $REGION \
    --profile $PROFILE)
  
  echo "Your Nova Sonic app is available at: $SERVICE_URL"
else
  echo "Deployment failed!"
  exit 1
fi