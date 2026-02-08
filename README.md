# ☁️ AWS Horizontal Scaling Infrastructure

> **Production-ready, horizontally scalable infrastructure on AWS demonstrating Auto Scaling, Load Balancing, and stateless architecture design.**

![AWS](https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

---

## 🌟 Project Highlights

- ✅ **Auto Scaling** - Dynamically scale from 2 to 10 instances based on CPU load
- ✅ **Zero Downtime** - Rolling deployment capability with no service interruption
- ✅ **Self-Healing** - Automatic instance replacement on failure (validated)
- ✅ **High Availability** - Multi-AZ deployment with health monitoring
- ✅ **70% Cost Savings** - Through intelligent auto-scaling vs static infrastructure
- ✅ **Stateless Architecture** - Redis session management across all instances

## 📖 Complete Documentation

👉 **[AWS Horizontal Scaling Project - Full Technical Write-up](AWS_HORIZONTAL_SCALING_PROJECT.md)**

This comprehensive document includes:
- Detailed architecture diagrams
- Component configurations
- Testing & validation results
- Cost analysis & optimization
- Troubleshooting examples
- Skills demonstrated

---

## 🏗️ Architecture

A complete AWS horizontal scaling implementation with:

- **Application Load Balancer** - Layer 7 load balancing with health checks
- **Auto Scaling Group** - CPU-based scaling (2-10 instances)
- **EC2 Instances** - Containerized Node.js application
- **ElastiCache Redis** - Centralized session storage with replication
- **Amazon S3** - Stateless file storage
- **ECR** - Private Docker registry
- **Security Groups** - Multi-layer security
- **IAM Roles** - Least privilege access

## 🎯 Key Features

✅ **Stateless Architecture** - No local state, horizontally scalable  
✅ **Redis Session Management** - Shared sessions via ElastiCache  
✅ **S3 File Storage** - Direct uploads, no local disk dependency  
✅ **Health Monitoring** - ELB health checks with auto-recovery  
✅ **Docker Containerization** - Multi-stage builds, non-root user  
✅ **Security Hardened** - IAM roles, security groups, encryption  
✅ **Cost Optimized** - Auto-scaling based on demand  

---

## 📊 Implementation Results

| Metric | Result |
|--------|--------|
| **High Availability** | Multi-AZ deployment with health checks |
| **Auto Scaling** | 2-10 instances configured (CPU-based) |
| **Deployments** | Zero-downtime capability (rolling updates) |
| **Self-Healing** | Validated (replaced terminated instance) |
| **Cost Savings** | 70% potential vs static 10-instance setup |
| **Session Persistence** | Working across all instances (Redis) |

---

## 🏗️ Project Structure

```
aws-horizontal-scaling/
├── README.md                           # This file
├── AWS_HORIZONTAL_SCALING_PROJECT.md   # ⭐ Complete project documentation
├── .env.example                        # Environment template (no secrets)
├── .gitignore                          # Git ignore rules
│
├── app/                                # Application code
│   ├── server.js                       # Stateless Node.js application
│   ├── package.json                    # Dependencies
│   └── public/
│       └── index.html                  # Task manager UI
│
├── infrastructure/                     # Infrastructure as Code
│   ├── Dockerfile                      # Multi-stage container build
│   ├── docker-compose.yml              # Local development setup
│   ├── user-data.sh                    # EC2 initialization script
│   └── deploy.ps1                      # Docker build & push automation
│
└── docs/                               # Documentation
    ├── ARCHITECTURE.md                 # System architecture details
    ├── AWS_DEPLOYMENT_CHECKLIST.md     # Step-by-step AWS setup
    └── APP_FEATURES.md                 # Application features
```

**Note:** Sensitive files like `.env` and AWS-specific configs are excluded for security.

---

## 💼 Skills Demonstrated

### AWS Services
- **EC2** - Launch templates, user data, instance management
- **Auto Scaling** - Scaling policies, health checks, lifecycle hooks
- **Elastic Load Balancing** - ALB, target groups, health monitoring
- **ElastiCache** - Redis replication, multi-AZ, failover
- **S3** - Bucket policies, file uploads, IAM integration
- **ECR** - Container registry, image management
- **IAM** - Roles, policies, least privilege
- **VPC** - Security groups, network configuration
- **CloudWatch** - Metrics, alarms, monitoring

### DevOps & Infrastructure
- ✅ Horizontal scaling architecture
- ✅ High availability & fault tolerance
- ✅ Infrastructure as Code principles
- ✅ Docker containerization
- ✅ Stateless application design
- ✅ Session management strategies
- ✅ Load balancing configuration
- ✅ Auto-scaling policies
- ✅ Zero-downtime deployment
- ✅ Cost optimization
- ✅ Security best practices
- ✅ Monitoring & troubleshooting

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended for Local Testing)

1. **Clone and setup:**
```bash
cd c:\Users\Admin\Documents\Projects\DEVOPS\HZScaling
cp .env.example .env
# Edit .env with your AWS credentials
```

2. **Start the application:**
```bash
docker-compose up --build
```

3. **Access:**
- Application: http://localhost:3000
- Health Check: http://localhost:3000/health
- Redis Commander: http://localhost:8081

### Option 2: Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Setup environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Redis (in Docker):**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

4. **Run the app:**
```bash
npm start
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page with instance info |
| `/health` | GET | Health check (for AWS ELB) |
| `/session` | GET | Demo session persistence in Redis |
| `/upload` | POST | Upload file to S3 |
| `/api/data` | GET | Example API endpoint |
| `/load/:duration` | GET | CPU load test for ASG testing |

### Testing the Health Check
```bash
curl http://localhost:3000/health
```

### Testing Session Persistence
```bash
# Hit multiple times, view count increases (stored in Redis)
curl http://localhost:3000/session
```

### Testing File Upload
```bash
curl -F "file=@myfile.pdf" http://localhost:3000/upload
```

### Testing Auto-Scaling (CPU Load)
```bash
# Generates 10 seconds of CPU load
curl http://localhost:3000/load/10000
```

---

## 🐳 Building the Docker Image

### Build for local testing:
```bash
docker build -t stateless-app:latest .
```

### Build for AWS ECR:
```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t stateless-app:latest .
docker tag stateless-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/stateless-app:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/stateless-app:latest
```

---

## ☁️ AWS Deployment Guide

### Prerequisites

1. **Create an S3 Bucket:**
```bash
aws s3 mb s3://my-app-uploads-bucket --region us-east-1
```

2. **Create ElastiCache Redis Cluster:**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id my-app-sessions \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

3. **Create ECR Repository:**
```bash
aws ecr create-repository --repository-name stateless-app --region us-east-1
```

### Creating the AMI

1. Launch an EC2 instance (Amazon Linux 2023 or Ubuntu)
2. Install Docker:
```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user
```

3. Pull and run your container:
```bash
docker pull <account-id>.dkr.ecr.us-east-1.amazonaws.com/stateless-app:latest
docker run -d -p 80:3000 \
  -e REDIS_URL="redis://<your-elasticache-endpoint>:6379" \
  -e AWS_REGION="us-east-1" \
  -e S3_BUCKET_NAME="my-app-uploads-bucket" \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/stateless-app:latest
```

4. Create AMI from this instance

### User Data Script for Launch Template

```bash
#!/bin/bash
# Update system
yum update -y

# Start Docker
systemctl start docker

# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Pull and run application
docker run -d -p 80:3000 \
  --restart unless-stopped \
  -e NODE_ENV=production \
  -e REDIS_URL="redis://<your-elasticache-endpoint>:6379" \
  -e AWS_REGION="us-east-1" \
  -e S3_BUCKET_NAME="my-app-uploads-bucket" \
  -e SESSION_SECRET="<generate-secure-secret>" \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/stateless-app:latest
```

### Launch Template Configuration

- **AMI:** Your created AMI
- **Instance Type:** t3.micro (or larger)
- **IAM Role:** Create role with policies:
  - `AmazonS3FullAccess` (or scoped to your bucket)
  - `AmazonElastiCacheFullAccess` (or scoped)
  - `AmazonEC2ContainerRegistryReadOnly`
- **Security Group:** Allow HTTP (80) and HTTPS (443)
- **User Data:** Use script above

### Auto Scaling Group Configuration

- **Desired Capacity:** 2
- **Minimum:** 2
- **Maximum:** 10
- **Scaling Policy:** Target Tracking
  - Metric: Average CPU Utilization
  - Target: 50%

### Application Load Balancer

- **Type:** Application Load Balancer
- **Scheme:** Internet-facing
- **Target Group:**
  - Protocol: HTTP
  - Port: 80
  - Health Check Path: `/health`
  - Healthy Threshold: 2
  - Unhealthy Threshold: 3
  - Interval: 30 seconds

---

## 🧪 Testing Your Scaling Setup

### 1. Verify Health Checks
```bash
curl http://<your-lb-dns>/health
```

### 2. Test Session Persistence
Hit the session endpoint multiple times through the load balancer. The view count should persist even if you hit different instances.

### 3. Simulate High Load
```bash
# Generate load on multiple terminals
for i in {1..100}; do curl http://<your-lb-dns>/load/5000 & done
```

Watch your ASG scale up in the AWS Console!

---

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Application port | No (default: 3000) |
| `NODE_ENV` | Environment (development/production) | No |
| `REDIS_URL` | Redis connection URL | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `AWS_REGION` | AWS region | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes* |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes* |
| `S3_BUCKET_NAME` | S3 bucket for uploads | Yes |

*Use IAM roles on EC2 instead of hardcoded credentials

---

## 📊 Monitoring

The application includes:
- Health check endpoint for ELB
- Instance ID in all responses
- Redis connection status monitoring
- Graceful shutdown handling

---

## 🔒 Security Checklist

- ✅ Helmet.js enabled
- ✅ CORS configured
- ✅ Non-root Docker user
- ✅ No hardcoded secrets (use environment variables)
- ✅ Session cookies with httpOnly and secure flags
- ✅ File upload size limits

---

## 🐛 Troubleshooting

**Redis Connection Issues:**
```bash
# Test Redis connectivity
docker exec -it redis-session-store redis-cli ping
```

**S3 Upload Failures:**
- Verify bucket exists and IAM permissions
- Check AWS credentials in .env
- Ensure bucket region matches AWS_REGION

**Container Not Starting:**
```bash
# Check logs
docker logs stateless-app
```

---

## 📚 Additional Resources

- [AWS Auto Scaling Documentation](https://docs.aws.amazon.com/autoscaling/)
- [AWS Elastic Load Balancing](https://docs.aws.amazon.com/elasticloadbalancing/)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 📝 License

MIT

---

**Questions?** Open an issue or check the AWS documentation linked above!
