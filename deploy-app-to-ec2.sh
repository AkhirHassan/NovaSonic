#!/bin/bash

# Deploy Nova Sonic App to EC2 Instance
echo "Deploying Nova Sonic app to EC2..."

# Variables
EC2_IP="44.203.226.65"
KEY_FILE="/tmp/nova-sonic-key.pem"
EC2_USER="ec2-user"

# Create deployment package
echo "Creating deployment package..."
tar -czf nova-app.tar.gz \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    --exclude="*.pem" \
    --exclude="*.tar.gz" \
    package.json \
    tsconfig.json \
    public/ \
    src/ \
    lambda/

# Copy files to EC2
echo "Copying files to EC2..."
scp -i $KEY_FILE -o StrictHostKeyChecking=no nova-app.tar.gz $EC2_USER@$EC2_IP:/home/ec2-user/

# SSH and setup app
echo "Setting up app on EC2..."
ssh -i $KEY_FILE -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP << 'EOF'
# Extract app
cd /home/ec2-user
tar -xzf nova-app.tar.gz

# Install dependencies
npm install
npm install -g typescript ts-node

# Build the app
npm run build

# Create systemd service for the app
sudo tee /etc/systemd/system/nova-sonic-app.service > /dev/null << 'SERVICE'
[Unit]
Description=Nova Sonic Speech App
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user
ExecStart=/usr/bin/node dist/simple-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=AWS_PROFILE=default
Environment=AWS_REGION=us-east-1

[Install]
WantedBy=multi-user.target
SERVICE

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable nova-sonic-app
sudo systemctl start nova-sonic-app

# Check status
sudo systemctl status nova-sonic-app
EOF

# Clean up
rm nova-app.tar.gz

echo "=== DEPLOYMENT COMPLETE ==="
echo "EC2 Instance: $EC2_IP"
echo "CloudFront HTTPS URL: https://d30drlg41rg7br.cloudfront.net"
echo "Direct HTTP URL: http://$EC2_IP:3001"
echo ""
echo "SSH Command: ssh -i $KEY_FILE $EC2_USER@$EC2_IP"
echo ""
echo "Check app status: sudo systemctl status nova-sonic-app"
echo "View logs: sudo journalctl -u nova-sonic-app -f"