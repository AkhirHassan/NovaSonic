# AWS App Runner Deployment with CodeCommit

## Prerequisites
- AWS CLI configured
- CodeCommit repository created
- IAM permissions for App Runner and Bedrock

## Steps

### 1. Push to CodeCommit
```bash
# Add CodeCommit remote (replace with your actual repo name)
git remote add codecommit https://git-codecommit.ap-southeast-2.amazonaws.com/v1/repos/your-repo-name

# Push code
git add .
git commit -m "Add App Runner deployment files"
git push codecommit main
```

### 2. Create App Runner Service
1. Go to AWS App Runner console
2. Click "Create service"
3. Source: Repository
4. Repository provider: AWS CodeCommit
5. Repository: Select your CodeCommit repo
6. Branch: main
7. Configuration: Use apprunner.yaml
8. Service name: novasonic-app
9. Create service

### 3. Configure IAM Role
App Runner will create a service role. Add these policies:
- AmazonBedrockFullAccess (or custom Bedrock policy)
- CloudWatchLogsFullAccess

### 4. Environment Variables
Set in App Runner console if needed:
- AWS_REGION=ap-southeast-2
- Any other custom variables

## Access
Your app will be available at the App Runner provided URL on port 3009.