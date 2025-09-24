#!/bin/bash

# Deploy Nova Speech App with EC2 and CloudFront to New Account
echo "Deploying CloudFormation stack to new account..."

# Set variables
NEW_ACCOUNT_PROFILE="new-account"
REGION="us-east-1"
STACK_NAME="nova-sonic-app-stack"
KEY_PAIR_NAME="nova-sonic-key"

# Check if key pair exists, create if not
echo "Checking for key pair..."
if ! aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME --profile $NEW_ACCOUNT_PROFILE --region $REGION >/dev/null 2>&1; then
    echo "Creating key pair..."
    aws ec2 create-key-pair \
        --key-name $KEY_PAIR_NAME \
        --query 'KeyMaterial' \
        --output text \
        --profile $NEW_ACCOUNT_PROFILE \
        --region $REGION > ${KEY_PAIR_NAME}.pem
    chmod 400 ${KEY_PAIR_NAME}.pem
    echo "Key pair created and saved as ${KEY_PAIR_NAME}.pem"
else
    echo "Key pair already exists"
fi

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://cloudformation-cloudfront.yaml \
    --parameters ParameterKey=KeyPairName,ParameterValue=$KEY_PAIR_NAME \
    --capabilities CAPABILITY_IAM \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION

echo "Stack creation initiated. Waiting for completion..."
aws cloudformation wait stack-create-complete \
    --stack-name $STACK_NAME \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION

# Get outputs
echo "Getting stack outputs..."
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
    --output text \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION)

INSTANCE_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue' \
    --output text \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION)

PUBLIC_IP=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
    --output text \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION)

echo "=== DEPLOYMENT COMPLETE ==="
echo "CloudFront HTTPS URL: $CLOUDFRONT_URL"
echo "EC2 Instance ID: $INSTANCE_ID"
echo "EC2 Public IP: $PUBLIC_IP"
echo "SSH Command: ssh -i ${KEY_PAIR_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""
echo "Next steps:"
echo "1. SSH to EC2 instance"
echo "2. Install Node.js and dependencies"
echo "3. Deploy Nova Sonic app"
echo "4. Access via CloudFront URL for HTTPS"