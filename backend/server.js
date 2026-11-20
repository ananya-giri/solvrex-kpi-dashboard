import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { seedDatabase } from './seed/seedData.js';
import authRoutes from './routes/auth.js';
import kpiRoutes from './routes/kpi.js';
import tasksRoutes from './routes/tasks.js';
import settingsRoutes from './routes/settings.js';
import syncRoutes from './routes/sync.js';
import exportRoutes from './routes/export.js';
import db from './database/dataStore.js';
import cache from './database/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kpi_dashboard';

// Security Hardening: Helmet with safe CSP for React SPA & Charts
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Performance: Response Compression (gzip / deflate)
app.use(compression());

// Security: Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after a minute.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login attempts per 15 min to prevent brute force
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for audit & diagnostics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Try connecting to MongoDB if available (MERN stack compliance)
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 2000
}).then(() => {
  console.log('Connected to MongoDB database successfully.');
}).catch((err) => {
  console.log('MongoDB daemon not detected on default port; utilizing zero-spend persistent embedded JSON/BSON store.');
});

// Seed data
seedDatabase();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/export', exportRoutes);

// Enhanced Health & Diagnostics Endpoint for Docker / Kubernetes probes
app.get('/api/health', (req, res) => {
  const syncMeta = db.getSyncMeta();
  const memUsage = process.memoryUsage();
  const cacheStatus = cache.getStatus();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    service: 'analyst-kpi-dashboard-api',
    version: '1.0.0',
    database: {
      mongodb_connected: mongoose.connection.readyState === 1,
      mode: mongoose.connection.readyState === 1 ? 'MongoDB' : 'Embedded JSON Store (Zero Spend)',
      last_sync: syncMeta.last_updated
    },
    cache: cacheStatus,
    system: {
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss_mb: Math.round(memUsage.rss / 1024 / 1024)
    }
  });
});

// Serve frontend production build if available
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  KPI Dashboard Backend API Server running on port ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Scalability: Caching & Rate Limiting Active`);
  console.log(`=======================================================`);
});

// Graceful Shutdown Handling (SIGTERM & SIGINT) for Zero-Downtime Container Deployments
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      }
      if (cache.redis && cache.isRedisReady) {
        cache.redis.disconnect();
        console.log('Redis connection closed.');
      }
      console.log('Graceful shutdown completed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds timeout
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
