#!/bin/bash

SERVICE_NAME="nova-sonic-app"
ROLE_ARN="arn:aws:iam::207529100869:role/AppRunnerInstanceRole"

# Create App Runner service
aws apprunner create-service \
  --service-name $SERVICE_NAME \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "public.ecr.aws/docker/library/node:18-alpine",
      "ImageConfiguration": {
        "Port": "3001"
      },
      "ImageRepositoryType": "ECR_PUBLIC"
    },
    "AutoDeploymentsEnabled": false
  }' \
  --instance-configuration '{
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB",
    "InstanceRoleArn": "'$ROLE_ARN'"
  }'

echo "App Runner service created!"
echo "Check status with: aws apprunner describe-service --service-arn <service-arn>"