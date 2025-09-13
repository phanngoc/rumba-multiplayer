#!/bin/bash

# Script to deploy EventBridge auto start/stop setup
set -e

echo "🚀 Deploying EventBridge Auto Start/Stop Setup for Rumba EC2..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
echo "🔍 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS credentials configured"

# Initialize Terraform
echo "🔧 Initializing Terraform..."
terraform init

# Plan deployment
echo "📋 Planning deployment..."
terraform plan -out=tfplan

# Ask for confirmation
echo ""
echo "⚠️  This will create:"
echo "   - 2 Lambda functions (start/stop EC2)"
echo "   - 2 EventBridge rules (8:00 AM start, 9:00 PM stop)"
echo "   - IAM roles and policies"
echo "   - CloudWatch logs"
echo ""
read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Apply deployment
echo "🚀 Deploying infrastructure..."
terraform apply tfplan

# Get outputs
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Outputs:"
terraform output

echo ""
echo "🔍 Testing Lambda functions..."

# Test stop function
echo "Testing stop function..."
aws lambda invoke --function-name stop-rumba-instance --payload '{}' /tmp/stop-response.json
echo "Stop function response:"
cat /tmp/stop-response.json
echo ""

# Test start function
echo "Testing start function..."
aws lambda invoke --function-name start-rumba-instance --payload '{}' /tmp/start-response.json
echo "Start function response:"
cat /tmp/start-response.json
echo ""

# Show EventBridge rules
echo "📅 EventBridge Rules:"
aws events list-rules --name-prefix "rumba" --query 'Rules[*].[Name,State,ScheduleExpression]' --output table

echo ""
echo "🎉 Setup completed! Your EC2 instance will now:"
echo "   - Stop automatically at 21:00 UTC (4:00 AM VN time)"
echo "   - Start automatically at 8:00 UTC (3:00 PM VN time)"
echo ""
echo "📚 For more information, see EVENTBRIDGE-SETUP.md"
