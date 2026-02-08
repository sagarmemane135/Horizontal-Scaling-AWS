# Architecture Diagrams

## Local Development Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Docker Host (Your Computer)                │
│                                                                │
│  ┌────────────────────────┐      ┌─────────────────────────┐│
│  │  stateless-app         │      │  redis-session-store    ││
│  │  (Node.js/Express)     │◄────►│  (Redis 7)              ││
│  │  Port: 3000           │      │  Port: 6379             ││
│  │                        │      │                         ││
│  │  - Health: /health     │      │  Session Storage:       ││
│  │  - Session: /session   │      │  - User sessions        ││
│  │  - Upload: /upload     │      │  - View counts          ││
│  │  - Load: /load/:ms     │      │  - Shared state         ││
│  └────────────────────────┘      └─────────────────────────┘│
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  redis-commander (Optional)                            │  │
│  │  Port: 8081 - Web UI for viewing Redis data            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │
         │ HTTP Requests
         ▼
    ┌─────────┐
    │ Browser │
    └─────────┘
```

---

## AWS Production Architecture (Horizontal Scaling)

```
                          ┌────────────────┐
                          │   Internet     │
                          └────────┬───────┘
                                   │
                          ┌────────▼────────┐
                          │  Route 53 (DNS) │ (Optional)
                          └────────┬────────┘
                                   │
                          ┌────────▼─────────────────────────────┐
                          │  Application Load Balancer (ALB)     │
                          │  - Health Checks: /health            │
                          │  - Distributes traffic               │
                          │  - SSL Termination (Optional)        │
                          └────────┬─────────────────────────────┘
                                   │
              ┏────────────────────┼────────────────────┓
              │                    │                    │
    ┌─────────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
    │  EC2 Instance 1  │  │ EC2 Instance 2 │  │ EC2 Instance N │
    │  ┌────────────┐  │  │ ┌────────────┐ │  │ ┌────────────┐ │
    │  │   Docker   │  │  │ │   Docker   │ │  │ │   Docker   │ │
    │  │            │  │  │ │            │ │  │ │            │ │
    │  │ Node.js    │  │  │ │ Node.js    │ │  │ │ Node.js    │ │
    │  │ App        │  │  │ │ App        │ │  │ │ App        │ │
    │  └────────────┘  │  │ └────────────┘ │  │ └────────────┘ │
    └──────────────────┘  └────────────────┘  └────────────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                      ┌────────────┴──────────────┐
                      │                           │
            ┌─────────▼───────────┐    ┌─────────▼──────────┐
            │  ElastiCache Redis  │    │      AWS S3        │
            │  (Session Store)    │    │  (File Uploads)    │
            │                     │    │                    │
            │  - Shared Sessions  │    │  - Images          │
            │  - Multi-AZ         │    │  - Documents       │
            │  - Auto Failover    │    │  - User Files      │
            └─────────────────────┘    └────────────────────┘
```

### Auto Scaling Group Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Auto Scaling Group                         │
│                                                                │
│  Min: 2 instances │ Desired: 2 │ Max: 10 instances           │
│                                                                │
│  Scaling Trigger: CPU > 50%                                   │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              CloudWatch Metrics                         │  │
│  │  - CPU Utilization                                      │  │
│  │  - Network In/Out                                       │  │
│  │  - Request Count                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Scaling Policies                           │  │
│  │                                                          │  │
│  │  CPU > 50% for 2 minutes → Scale OUT (add instance)    │  │
│  │  CPU < 30% for 5 minutes → Scale IN (remove instance)  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagram

### Normal Request Flow

```
1. User Request
   │
   ▼
2. DNS Resolution (Route 53)
   │
   ▼
3. Load Balancer (ALB)
   │
   ├──► Health Check (/health)
   │
   ▼
4. Target Group Selection
   │
   ├──► Instance 1 (Available)
   ├──► Instance 2 (Available)
   └──► Instance 3 (Available)
   │
   ▼
5. Selected Instance
   │
   ├──► Check Redis Session
   │    └──► Get/Set Session Data
   │
   ├──► Process Request
   │
   ├──► Upload to S3 (if file upload)
   │
   ▼
6. Return Response
   │
   ▼
7. User Receives Response
```

### Scaling Event Flow

```
┌─────────────────────────────────────────────────────┐
│  1. High Traffic / CPU Load                         │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  2. CloudWatch Detects: CPU > 50% for 2 min         │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  3. Auto Scaling Group Triggered                    │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  4. Launch NEW EC2 Instance from Launch Template    │
│     - Run User Data Script                          │
│     - Pull Docker Image from ECR                    │
│     - Start Application Container                   │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  5. Health Check: Wait for /health to return 200    │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  6. Add Instance to Target Group                    │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  7. Load Balancer Distributes Traffic to New        │
│     Instance                                         │
└─────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  8. When Traffic Decreases: Scale IN                │
│     - Remove instance from Target Group             │
│     - Drain connections                             │
│     - Terminate instance                            │
└─────────────────────────────────────────────────────┘
```

---

## Multi-Region Architecture (Optional Advanced)

```
┌─────────────────────────────────────────────────────────┐
│                     Route 53                            │
│  Geo-Routing / Latency-Based Routing                    │
└──────────────┬─────────────────────┬────────────────────┘
               │                     │
    ┌──────────▼─────────┐  ┌───────▼──────────┐
    │   us-east-1        │  │   eu-west-1      │
    │                    │  │                  │
    │  ┌──────────────┐  │  │ ┌──────────────┐│
    │  │     ALB      │  │  │ │     ALB      ││
    │  └──────┬───────┘  │  │ └──────┬───────┘│
    │         │          │  │        │        │
    │  ┌──────▼───────┐  │  │ ┌──────▼───────┐│
    │  │  ASG (2-10)  │  │  │ │  ASG (2-10)  ││
    │  └──────┬───────┘  │  │ └──────┬───────┘│
    │         │          │  │        │        │
    │  ┌──────▼───────┐  │  │ ┌──────▼───────┐│
    │  │ ElastiCache  │  │  │ │ ElastiCache  ││
    │  │   Redis      │  │  │ │   Redis      ││
    │  └──────────────┘  │  │ └──────────────┘│
    └────────────────────┘  └──────────────────┘
                │                    │
                └────────┬───────────┘
                         │
                  ┌──────▼────────┐
                  │  Global S3    │
                  │  (Replication)│
                  └───────────────┘
```

---

## Data Flow Diagram

### Session Management

```
┌──────────────┐     1. Request with     ┌───────────────┐
│   User A     │────────SessionID───────►│  Instance 1   │
└──────────────┘                          └───────┬───────┘
                                                  │
                                          2. Check Session
                                                  │
                                                  ▼
                                          ┌───────────────┐
                                          │     Redis     │
                                          │               │
      ┌───────────────────────────────────│  session:123  │
      │                                   │  {            │
      │                                   │   views: 5    │
      │                                   │   user: "A"   │
      │                                   │  }            │
      │                                   └───────────────┘
      │                                           │
      │                                   3. Update Session
      │                                           │
      ▼                                           ▼
┌──────────────┐    4. Next Request     ┌───────────────┐
│   User A     │───────────────────────►│  Instance 3   │
└──────────────┘                         └───────┬───────┘
                                                 │
                                         5. Same Session!
                                                 │
                                                 ▼
                                         ┌───────────────┐
                                         │     Redis     │
                                         │  session:123  │
                                         │  { views: 6 } │
                                         └───────────────┘
```

### File Upload Flow

```
┌──────────┐   1. Upload    ┌───────────┐   2. Stream   ┌────────┐
│  Client  │──────File─────►│  Any EC2  │──────to──────►│   S3   │
└──────────┘                 │ Instance  │               └────────┘
                             └───────────┘                    │
                                                              │
     ┌────────────────────────────────────────────────────────┘
     │
     │ 3. File accessible from ANY instance
     │
     ▼
┌─────────────┐   ┌────────────┐   ┌────────────┐
│ Instance 1  │   │ Instance 2 │   │ Instance N │
│ Can access  │   │ Can access │   │ Can access │
│ S3 files    │   │ S3 files   │   │ S3 files   │
└─────────────┘   └────────────┘   └────────────┘
```

---

## Monitoring Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudWatch Dashboard                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Active          │  │  Request Count   │                │
│  │  Instances: 3    │  │  1,250 req/min   │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  CPU Utilization (%)                                   │ │
│  │  ████████████████░░░░░░░░ 65%                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Request Latency (ms)                                  │ │
│  │  p50: 45ms  p95: 120ms  p99: 250ms                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Health Check Status                                   │ │
│  │  Healthy: 3/3  ✓                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Scaling Events (Last 24h)                             │ │
│  │  Scale Out: 2 events                                   │ │
│  │  Scale In: 1 event                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Cost Optimization Architecture

```
┌─────────────────────────────────────────────────────┐
│  Strategies to Reduce Costs                         │
├─────────────────────────────────────────────────────┤
│                                                       │
│  1. Reserved Instances / Savings Plans               │
│     └─► Save up to 72% on baseline capacity         │
│                                                       │
│  2. Spot Instances for Non-Critical Workloads        │
│     └─► Save up to 90% for burst capacity           │
│                                                       │
│  3. Right-Size Instances                             │
│     └─► Use t3.micro/small instead of t3.large      │
│                                                       │
│  4. S3 Lifecycle Policies                            │
│     └─► Move old files to Glacier                   │
│                                                       │
│  5. ElastiCache Reserved Nodes                       │
│     └─► 30-50% savings                              │
│                                                       │
│  6. Aggressive Scale-In Policies                     │
│     └─► Terminate idle instances quickly            │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────┐
│            Security Layers                           │
└─────────────────────────────────────────────────────┘
         │
         ├──► 1. WAF (Web Application Firewall)
         │    └─► DDoS Protection, Rate Limiting
         │
         ├──► 2. ALB Security Group
         │    └─► Allow: 80, 443 from 0.0.0.0/0
         │
         ├──► 3. EC2 Security Group
         │    └─► Allow: 80 from ALB SG only
         │
         ├──► 4. Redis Security Group
         │    └─► Allow: 6379 from EC2 SG only
         │
         ├──► 5. S3 Bucket Policies
         │    └─► IAM Role-based access only
         │
         ├──► 6. IAM Roles (No Hardcoded Keys)
         │    └─► EC2 Instance Profile
         │
         ├──► 7. Encryption
         │    ├─► SSL/TLS for data in transit
         │    └─► S3/Redis encryption at rest
         │
         └──► 8. VPC Configuration
              └─► Private subnets for Redis/EC2
```
