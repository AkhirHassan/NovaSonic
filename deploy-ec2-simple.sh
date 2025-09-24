#!/bin/bash

# Simple EC2 deployment for Nova Speech App
echo "Deploying EC2 instance for Nova Speech App..."

# Set variables
NEW_ACCOUNT_PROFILE="new-account"
REGION="us-east-1"
KEY_PAIR_NAME="nova-sonic-key"
INSTANCE_TYPE="t3.medium"
AMI_ID="ami-016ff47edc0224f3c"  # Amazon Linux 2023

# Create security group
echo "Creating security group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name nova-sonic-sg \
    --description "Nova Sonic App Security Group" \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION \
    --query 'GroupId' \
    --output text)

echo "Security Group ID: $SECURITY_GROUP_ID"

# Add security group rules
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 3001 \
    --cidr 0.0.0.0/0 \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION

# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y nodejs npm git

# Create app directory
mkdir -p /home/ec2-user/nova-speech-app
chown ec2-user:ec2-user /home/ec2-user/nova-speech-app

# Install PM2 for process management
npm install -g pm2

echo "EC2 instance setup complete"
EOF

# Launch EC2 instance
echo "Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_PAIR_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data file://user-data.sh \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Instance ID: $INSTANCE_ID"

# Wait for instance to be running
echo "Waiting for instance to be running..."
aws ec2 wait instance-running \
    --instance-ids $INSTANCE_ID \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --profile $NEW_ACCOUNT_PROFILE \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "=== DEPLOYMENT COMPLETE ==="
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "SSH Command: ssh -i nova-sonic-key.pem ec2-user@$PUBLIC_IP"
echo "App URL: http://$PUBLIC_IP:3001"
echo ""
echo "Next steps:"
echo "1. SSH to instance: ssh -i nova-sonic-key.pem ec2-user@$PUBLIC_IP"
echo "2. Upload your app files"
echo "3. Install dependencies: npm install"
echo "4. Start app: npm start"

# Clean up
rm user-data.sh