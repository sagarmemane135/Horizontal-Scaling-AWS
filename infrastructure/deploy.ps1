# PowerShell Deployment Script for AWS
# This script builds and pushes your Docker image to AWS ECR

$ErrorActionPreference = "Stop"

# Configuration - Replace with your AWS values
$AWS_REGION = "ap-south-1"  # Your AWS region
$ECR_ACCOUNT_ID = "YOUR_AWS_ACCOUNT_ID"  # Replace with your 12-digit AWS account ID
$ECR_REPO_NAME = "stateless-app"
$IMAGE_TAG = "latest"
$ECR_REPO_URI = "$ECR_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AWS ECR Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build Docker image
Write-Host "[1/4] Building Docker image..." -ForegroundColor Yellow
docker build -t ${ECR_REPO_NAME}:${IMAGE_TAG} .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image built successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Authenticate with ECR
Write-Host "[2/4] Authenticating with AWS ECR..." -ForegroundColor Yellow
$ecrPassword = aws ecr get-login-password --region $AWS_REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get ECR login password!" -ForegroundColor Red
    exit 1
}

$ecrPassword | docker login --username AWS --password-stdin $ECR_REPO_URI

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ECR authentication failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Authenticated with ECR" -ForegroundColor Green
Write-Host ""

# Step 3: Tag image
Write-Host "[3/4] Tagging Docker image..." -ForegroundColor Yellow
docker tag ${ECR_REPO_NAME}:${IMAGE_TAG} ${ECR_REPO_URI}:${IMAGE_TAG}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker tag failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image tagged: $ECR_REPO_URI:$IMAGE_TAG" -ForegroundColor Green
Write-Host ""

# Step 4: Push to ECR
Write-Host "[4/4] Pushing image to ECR..." -ForegroundColor Yellow
docker push ${ECR_REPO_URI}:${IMAGE_TAG}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image pushed to ECR successfully!" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Repository: $ECR_REPO_URI" -ForegroundColor White
Write-Host "Image Tag: $IMAGE_TAG" -ForegroundColor White
Write-Host ""
Write-Host "✓ Ready for AWS deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create Launch Template with this image" -ForegroundColor White
Write-Host "2. Configure Auto Scaling Group" -ForegroundColor White
Write-Host "3. Setup Application Load Balancer" -ForegroundColor White
Write-Host ""
Write-Host "See AWS_DEPLOYMENT_CHECKLIST.md for details" -ForegroundColor Cyan
