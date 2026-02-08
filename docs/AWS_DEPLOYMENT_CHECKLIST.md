# AWS Infrastructure Checklist

Use this checklist when deploying the application to AWS.

## ☁️ Prerequisites

### 1. AWS Account Setup
- [ ] AWS account created and configured
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] IAM user with appropriate permissions created

### 2. Create S3 Bucket
```bash
aws s3 mb s3://my-app-uploads-unique-name --region us-east-1
```
- [ ] S3 bucket created
- [ ] Bucket name noted: _________________

### 3. Create ElastiCache Redis
```bash
aws elasticache create-replication-group \
  --replication-group-id my-app-sessions \
  --replication-group-description "Session store for stateless app" \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-clusters 2 \
  --automatic-failover-enabled
```
- [ ] Redis cluster created
- [ ] Endpoint noted: _________________

### 4. Create ECR Repository
```bash
aws ecr create-repository --repository-name stateless-app --region us-east-1
```
- [ ] ECR repository created
- [ ] Repository URI noted: _________________

---

## 🐳 Build and Push Docker Image

```bash
# Build image
docker build -t stateless-app:latest .

# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag stateless-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/stateless-app:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/stateless-app:latest
```

- [ ] Docker image built
- [ ] Image pushed to ECR

---

## 🔐 IAM Role for EC2 Instances

Create IAM role with these policies:
- [ ] `AmazonS3FullAccess` (or custom policy for your bucket)
- [ ] `AmazonElastiCacheFullAccess` (or custom policy)
- [ ] `AmazonEC2ContainerRegistryReadOnly`

Role name: _________________

---

## 🔒 Security Groups

### Application Security Group
- [ ] Inbound: HTTP (80) from Load Balancer SG
- [ ] Inbound: HTTPS (443) from Load Balancer SG
- [ ] Outbound: All traffic

### Load Balancer Security Group
- [ ] Inbound: HTTP (80) from 0.0.0.0/0
- [ ] Inbound: HTTPS (443) from 0.0.0.0/0
- [ ] Outbound: All traffic

### Redis Security Group
- [ ] Inbound: Redis (6379) from Application SG
- [ ] Outbound: All traffic

---

## 🖥️ Create Launch Template

1. **Go to EC2 Console > Launch Templates > Create**

2. **Configuration:**
   - Name: `stateless-app-template`
   - AMI: Amazon Linux 2023 (or your custom AMI)
   - Instance type: `t3.micro` (or larger)
   - Key pair: (select your key pair)
   - Security groups: Application SG (created above)
   - IAM instance profile: (select role created above)

3. **User Data:** (paste from user-data.sh with your values)
   - [ ] Update `AWS_REGION`
   - [ ] Update `ECR_ACCOUNT_ID`
   - [ ] Update `REDIS_ENDPOINT`
   - [ ] Update `S3_BUCKET_NAME`
   - [ ] Update `SESSION_SECRET` (generate secure random string)

- [ ] Launch template created

---

## ⚖️ Create Load Balancer

1. **Go to EC2 Console > Load Balancers > Create Load Balancer**

2. **Select Application Load Balancer**

3. **Basic Configuration:**
   - Name: `stateless-app-alb`
   - Scheme: Internet-facing
   - IP address type: IPv4

4. **Network Mapping:**
   - [ ] Select at least 2 Availability Zones
   - [ ] Select public subnets

5. **Security Groups:**
   - [ ] Select Load Balancer SG

6. **Create Target Group:**
   - Name: `stateless-app-targets`
   - Protocol: HTTP
   - Port: 80
   - VPC: (select your VPC)
   - Health check path: `/health`
   - Health check interval: 30 seconds
   - Healthy threshold: 2
   - Unhealthy threshold: 3
   - Timeout: 5 seconds

- [ ] Load balancer created
- [ ] DNS name noted: _________________

---

## 📈 Create Auto Scaling Group

1. **Go to EC2 Console > Auto Scaling Groups > Create**

2. **Choose Launch Template:**
   - [ ] Select `stateless-app-template`

3. **Network:**
   - [ ] Select same subnets as Load Balancer

4. **Load Balancing:**
   - [ ] Attach to existing load balancer
   - [ ] Select `stateless-app-targets` target group
   - [ ] Enable health checks from ELB

5. **Group Size:**
   - Desired capacity: `2`
   - Minimum capacity: `2`
   - Maximum capacity: `10`

6. **Scaling Policies:**
   - [ ] Target tracking scaling policy
   - Metric: Average CPU Utilization
   - Target value: `50`

- [ ] Auto Scaling Group created

---

## ✅ Testing

### Basic Health Check
```bash
curl http://<load-balancer-dns>/health
```
- [ ] Health check returns 200 OK

### Session Persistence Test
```bash
# Run multiple times
curl http://<load-balancer-dns>/session
```
- [ ] View count increases
- [ ] Works across different instance IDs

### Load Balancer Distribution
```bash
# Make 10 requests and check different instances respond
for i in {1..10}; do curl -s http://<load-balancer-dns>/ | grep instance; done
```
- [ ] Multiple instance IDs visible

### File Upload Test
```bash
curl -F "file=@test.txt" http://<load-balancer-dns>/upload
```
- [ ] File uploaded to S3
- [ ] Verify in S3 console

### Auto-Scaling Test
```bash
# Generate heavy load
for i in {1..50}; do curl http://<load-balancer-dns>/load/10000 & done
```
- [ ] CPU utilization increases in CloudWatch
- [ ] New instances launch (check ASG console)
- [ ] After 5-10 minutes, instances automatically terminate when load decreases

---

## 🎯 Optional Enhancements

- [ ] Setup Route 53 custom domain
- [ ] Add HTTPS certificate with ACM
- [ ] Configure CloudWatch alarms
- [ ] Setup CloudWatch Logs
- [ ] Enable detailed monitoring
- [ ] Configure backup for Redis
- [ ] Setup S3 lifecycle policies
- [ ] Add WAF for security
- [ ] Setup CI/CD pipeline (CodePipeline)

---

## 📊 Monitoring URLs

- **EC2 Dashboard:** https://console.aws.amazon.com/ec2
- **Auto Scaling Groups:** https://console.aws.amazon.com/ec2/autoscaling
- **Load Balancers:** https://console.aws.amazon.com/ec2/v2#LoadBalancers
- **CloudWatch:** https://console.aws.amazon.com/cloudwatch
- **S3 Buckets:** https://console.aws.amazon.com/s3
- **ElastiCache:** https://console.aws.amazon.com/elasticache

---

## 🐛 Troubleshooting

### Instances Unhealthy in Target Group
- Check security group allows traffic from ALB
- Verify application is running on port 80
- Check health check path returns 200
- SSH into instance and check: `docker logs stateless-app`

### Application Not Starting
- Check user data script logs: `cat /var/log/user-data.log`
- Verify IAM role has ECR pull permissions
- Check Redis connectivity from instance

### Sessions Not Persisting
- Verify Redis endpoint is correct
- Check security group allows port 6379
- Test Redis: `redis-cli -h <endpoint> ping`

---

## 💰 Cost Estimate (us-east-1, approximate)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| EC2 (2x t3.micro) | On-demand | ~$15 |
| ALB | 1 ALB, light traffic | ~$20 |
| ElastiCache (Redis) | cache.t3.micro | ~$12 |
| S3 | 10GB storage, light requests | ~$1 |
| Data Transfer | 100GB/month | ~$9 |
| **Total** | | **~$57/month** |

*Costs increase with auto-scaling and traffic*

---

## 🎓 Learning Resources

- [ ] AWS Auto Scaling documentation
- [ ] AWS Load Balancing best practices
- [ ] Redis performance tuning
- [ ] Docker security best practices
