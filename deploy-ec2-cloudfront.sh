#!/bin/bash

# Deploy Nova Sonic App to EC2 with CloudFront
STACK_NAME="nova-sonic-cloudfront"
KEY_PAIR_NAME="nova-sonic-key"
REGION="us-east-1"

echo "Deploying Nova Sonic App to EC2 with CloudFront..."

# Check if key pair exists, create if not
if ! aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME --region $REGION >/dev/null 2>&1; then
    echo "Creating key pair: $KEY_PAIR_NAME"
    aws ec2 create-key-pair --key-name $KEY_PAIR_NAME --region $REGION --query 'KeyMaterial' --output text > ${KEY_PAIR_NAME}.pem
    chmod 400 ${KEY_PAIR_NAME}.pem
    echo "Key pair created and saved as ${KEY_PAIR_NAME}.pem"
fi

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file cloudformation-with-cloudfront.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides KeyPairName=$KEY_PAIR_NAME \
  --capabilities CAPABILITY_IAM \
  --region $REGION \
  --profile new-account

if [ $? -eq 0 ]; then
    echo "Stack deployed successfully!"
    
    # Get stack outputs
    echo "Getting stack outputs..."
    OUTPUTS=$(aws cloudformation describe-stacks \
      --stack-name $STACK_NAME \
      --region $REGION \
      --profile new-account \
      --query 'Stacks[0].Outputs')
    
    echo "$OUTPUTS" | jq -r '.[] | "\(.OutputKey): \(.OutputValue)"'
    
    # Get instance IP for file upload
    INSTANCE_IP=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="PublicIP") | .OutputValue')
    
    echo ""
    echo "Waiting for instance to be ready..."
    sleep 60
    
    # Upload application files
    echo "Uploading application files to EC2..."
    scp -i ${KEY_PAIR_NAME}.pem -o StrictHostKeyChecking=no -r src/ public/ package.json tsconfig.json ec2-user@$INSTANCE_IP:/home/ec2-user/nova-speech-app/
    
    # Start the application
    echo "Starting application on EC2..."
    ssh -i ${KEY_PAIR_NAME}.pem -o StrictHostKeyChecking=no ec2-user@$INSTANCE_IP << 'EOF'
cd /home/ec2-user/nova-speech-app
npm install
pm2 start npm --name "nova-speech-app" -- start
pm2 startup
pm2 save
EOF
    
    echo ""
    echo "Deployment complete!"
    echo "CloudFront URL: $(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontURL") | .OutputValue')"
    echo "Direct URL: $(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="DirectURL") | .OutputValue')"
    
else
    echo "Stack deployment failed!"
    exit 1
fi