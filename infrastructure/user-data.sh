#!/bin/bash

# AWS User Data Script for Launch Template
# This script runs automatically when an EC2 instance launches

# Enable error handling
set -e

# Log output to file
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting user data script..."

# Update system packages
echo "Updating system..."
yum update -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    yum install -y docker
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user
else
    echo "Docker already installed"
    systemctl start docker
fi

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
fi

# Configuration variables - REPLACE WITH YOUR AWS VALUES
AWS_REGION="ap-south-1"  # Your AWS region
ECR_ACCOUNT_ID="YOUR_AWS_ACCOUNT_ID"  # Your 12-digit AWS account ID
ECR_REPO_NAME="stateless-app"  # Your ECR repository name
IMAGE_TAG="latest"
REDIS_ENDPOINT="your-redis-cluster.xxxxx.0001.region.cache.amazonaws.com"  # Your ElastiCache endpoint
S3_BUCKET_NAME="your-s3-bucket-name"  # Your S3 bucket name
SESSION_SECRET="<GENERATE_SECURE_SECRET>"  # Generate with: openssl rand -base64 32

# Authenticate with ECR
echo "Authenticating with ECR..."
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin \
    $ECR_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Pull the latest image
echo "Pulling Docker image..."
docker pull $ECR_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:$IMAGE_TAG

# Stop and remove existing container if running
echo "Cleaning up old containers..."
docker stop stateless-app 2>/dev/null || true
docker rm stateless-app 2>/dev/null || true

# Run the application container
echo "Starting application container..."
docker run -d \
    --name stateless-app \
    --restart unless-stopped \
    -p 80:3000 \
    -e NODE_ENV=production \
    -e PORT=3000 \
    -e REDIS_URL="redis://$REDIS_ENDPOINT:6379" \
    -e AWS_REGION="$AWS_REGION" \
    -e S3_BUCKET_NAME="$S3_BUCKET_NAME" \
    -e SESSION_SECRET="$SESSION_SECRET" \
    $ECR_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:$IMAGE_TAG

# Wait for container to be healthy
echo "Waiting for container to be healthy..."
for i in {1..30}; do
    if docker inspect --format='{{.State.Health.Status}}' stateless-app 2>/dev/null | grep -q "healthy"; then
        echo "Container is healthy!"
        break
    fi
    echo "Waiting for health check... ($i/30)"
    sleep 2
done

# Verify the application is running
echo "Verifying application..."
sleep 5
if curl -s http://localhost/health | grep -q "UP"; then
    echo "✓ Application is running and healthy!"
else
    echo "✗ Warning: Application health check failed"
fi

echo "User data script completed!"
exit 0
