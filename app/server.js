require('dotenv').config();
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const os = require('os');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.HOSTNAME || `instance-${Math.random().toString(36).substr(2, 9)}`;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false  // Allow inline scripts for our UI
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Redis client for sessions
let redisClient;
let sessionMiddleware;

async function initializeRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('connect', () => console.log('✓ Connected to Redis'));

    await redisClient.connect();

    // Session configuration with Redis
    sessionMiddleware = session({
      store: new RedisStore({ client: redisClient }),
      secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
      }
    });

    app.use(sessionMiddleware);
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    console.log('⚠ Running without session support');
  }
}

// AWS S3 configuration for file uploads
let s3Client;
let upload;

function initializeS3() {
  try {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Configure multer to upload directly to S3
    upload = multer({
      storage: multerS3({
        s3: s3Client,
        bucket: process.env.S3_BUCKET_NAME || 'my-app-uploads',
        metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
          const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
          cb(null, uniqueName);
        }
      }),
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    });

    console.log('✓ S3 upload configured');
  } catch (error) {
    console.error('S3 configuration warning:', error.message);
    // Fallback to memory storage for local development
    upload = multer({ storage: multer.memoryStorage() });
  }
}

// Initialize integrations and start server
async function startServer() {
  await initializeRedis();
  initializeS3();

  // ==================== ROUTES ====================

  // Health check endpoint (critical for AWS ELB)
  app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    instance: os.hostname(),
    uptime: process.uptime(),
    redis: redisClient?.isOpen ? 'connected' : 'disconnected'
  };

  if (redisClient?.isOpen) {
    res.status(200).json(healthCheck);
  } else {
    res.status(503).json({ ...healthCheck, status: 'DEGRADED' });
  }
});

// Task Management API
app.get('/api/tasks', (req, res) => {
  if (!req.session.tasks) {
    req.session.tasks = [];
  }
  res.json({ 
    tasks: req.session.tasks,
    instance: INSTANCE_ID
  });
});

app.post('/api/tasks', (req, res) => {
  if (!req.session.tasks) {
    req.session.tasks = [];
  }
  
  const { title, description, priority } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const task = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    title,
    description: description || '',
    priority: priority || 'medium',
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  req.session.tasks.push(task);
  
  res.json({
    message: 'Task created',
    task,
    instance: INSTANCE_ID
  });
});

app.put('/api/tasks/:id/toggle', (req, res) => {
  if (!req.session.tasks) {
    return res.status(404).json({ error: 'No tasks found' });
  }
  
  const task = req.session.tasks.find(t => t.id === req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  task.completed = !task.completed;
  
  res.json({
    message: 'Task updated',
    task,
    instance: INSTANCE_ID
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  if (!req.session.tasks) {
    return res.status(404).json({ error: 'No tasks found' });
  }
  
  const initialLength = req.session.tasks.length;
  req.session.tasks = req.session.tasks.filter(t => t.id !== req.params.id);
  
  if (req.session.tasks.length === initialLength) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json({
    message: 'Task deleted',
    instance: INSTANCE_ID
  });
});

// File tracking API
app.get('/api/files', (req, res) => {
  if (!req.session.files) {
    req.session.files = [];
  }
  res.json({ 
    files: req.session.files,
    instance: INSTANCE_ID
  });
});

// Session demo route
app.get('/session', (req, res) => {
  if (!req.session) {
    return res.status(503).json({ error: 'Session store not available' });
  }

  if (!req.session.views) {
    req.session.views = 1;
    req.session.firstVisit = new Date().toISOString();
  } else {
    req.session.views++;
  }

  res.json({
    message: 'Session data stored in Redis (shared across all instances)',
    sessionId: req.sessionID,
    views: req.session.views,
    firstVisit: req.session.firstVisit,
    instance: INSTANCE_ID
  });
});

// File upload route (to S3)
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileInfo = {
    originalname: req.file.originalname,
    key: req.file.key || req.file.originalname,
    location: req.file.location || 'memory',
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadedAt: new Date().toISOString()
  };
  
  // Store file info in session
  if (!req.session.files) {
    req.session.files = [];
  }
  req.session.files.push(fileInfo);

  res.json({
    message: 'File uploaded successfully to S3',
    file: fileInfo,
    instance: INSTANCE_ID
  });
});

// API endpoint example
app.get('/api/data', (req, res) => {
  res.json({
    data: [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 200 },
      { id: 3, name: 'Item 3', value: 300 }
    ],
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString()
  });
});

// Simulate CPU load (for testing auto-scaling)
app.get('/load/:duration?', (req, res) => {
  const duration = parseInt(req.params.duration) || 5000;
  const start = Date.now();
  
  // CPU-intensive operation
  while (Date.now() - start < duration) {
    Math.sqrt(Math.random());
  }

  res.json({
    message: 'Load test completed',
    duration: `${duration}ms`,
    instance: INSTANCE_ID
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    instance: INSTANCE_ID
  });
});

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      instance: INSTANCE_ID
    });
  });

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════╗
║  🚀 Stateless Application Server               ║
║  Port: ${PORT}                                  ║
║  Instance ID: ${INSTANCE_ID}                    ║
║  Health Check: http://localhost:${PORT}/health  ║
╚════════════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

// Start the application
startServer();
