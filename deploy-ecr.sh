#!/bin/bash

STACK_NAME="novasonic-app-stack"
REGION="ap-southeast-2"
PROFILE="new-account"

echo "Deploying Nova Sonic App with ECR..."

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file cloudformation-ecr.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION \
  --profile $PROFILE

if [ $? -eq 0 ]; then
  echo "CloudFormation deployment successful!"
  
  # Get ECR repository URI
  ECR_URI=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryURI`].OutputValue' \
    --output text \
    --region $REGION \
    --profile $PROFILE)
  
  echo "ECR Repository: $ECR_URI"
  
  # Login to ECR
  echo "Logging into ECR..."
  aws ecr get-login-password --region $REGION --profile $PROFILE | docker login --username AWS --password-stdin $ECR_URI
  
  # Build and push Docker image
  echo "Building Docker image..."
  docker build -t novasonic-app .
  docker tag novasonic-app:latest $ECR_URI:latest
  
  echo "Pushing to ECR..."
  docker push $ECR_URI:latest
  
  # Get service URL
  SERVICE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceUrl`].OutputValue' \
    --output text \
    --region $REGION \
    --profile $PROFILE)
  
  echo "Your Nova Sonic app will be available at: $SERVICE_URL"
  echo "Note: It may take a few minutes for the service to start."
else
  echo "Deployment failed!"
  exit 1
fi