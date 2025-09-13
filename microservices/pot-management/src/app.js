// =====================================================
// WOLO POT MANAGEMENT MICROSERVICE
// Core service for birthday pot creation, management, and discovery
// Invisible security + Maximum ease of use
// =====================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

// Import shared modules
const { initializeDatabase } = require('../../shared/database/supabase');
const { initializeCache } = require('../../shared/cache/redis');
const { authMiddleware, optionalAuth } = require('../../shared/auth/jwt-auth');
const SecurityMonitoringService = require('../../shared/security/security-monitoring');
const { logger, requestLogger } = require('../../shared/utils/logger');

// Import route handlers
const potRoutes = require('./routes/pot-routes');
const discoveryRoutes = require('./routes/discovery-routes');
const analyticsRoutes = require('./routes/analytics-routes');

class PotManagementApp {
  constructor() {
    this.app = express();
    this.port = process.env.POT_MANAGEMENT_PORT || 3003;
    this.server = null;
    this.isShuttingDown = false;
    
    // Initialize security monitoring
    this.securityMonitor = new SecurityMonitoringService({
      serviceName: 'pot-management',
      enableBehaviorAnalytics: true,
      riskScoreThreshold: 60, // More lenient for pot creation
      suspiciousLocationRadius: 1000 // Allow more geographic flexibility
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupSecurityMonitoring();
  }

  setupMiddleware() {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration for cross-origin requests
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Compression for faster responses
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' })); // Allow image uploads
    this.app.use(express.urlencoded({ extended: true }));

    // Request tracking
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.startTime = Date.now();
      next();
    });

    // Request logging
    this.app.use(requestLogger);

    // Rate limiting - generous for smooth UX
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Generous limit for pot browsing
      message: { error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
      }
    });
    this.app.use(limiter);

    // Strict rate limiting for pot creation (prevent spam)
    const creationLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 pot creations per hour
      message: { error: 'You can only create 5 pots per hour' },
      keyGenerator: (req) => {
        return req.user?.id || req.ip;
      }
    });

    // Apply creation limiter only to POST /pots
    this.app.use('/api/v1/pots', (req, res, next) => {
      if (req.method === 'POST') {
        return creationLimiter(req, res, next);
      }
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        service: 'pot-management',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes with version prefix
    this.app.use('/api/v1/pots', potRoutes);
    this.app.use('/api/v1/discovery', discoveryRoutes);
    this.app.use('/api/v1/pot-analytics', analyticsRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'WOLO Pot Management Service',
        message: 'Creating magical birthday experiences! 🎂✨',
        version: '1.0.0',
        endpoints: {
          pots: '/api/v1/pots',
          discovery: '/api/v1/discovery',
          analytics: '/api/v1/pot-analytics'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: 'This pot endpoint does not exist',
        requestId: req.requestId
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((err, req, res, next) => {
      // Log security events for certain errors
      if (err.status === 401 || err.status === 403) {
        this.securityMonitor.logSecurityEvent({
          type: 'authorization_error',
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          error: err.message
        });
      }

      logger.error('Pot Management Error:', {
        error: err.message,
        stack: err.stack,
        requestId: req.requestId,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.path}`
      });

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal server error',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: err.stack })
      });
    });
  }

  setupSecurityMonitoring() {
    // Monitor security events
    this.securityMonitor.on('security:incident', (incident) => {
      logger.warn('Security incident in Pot Management:', incident);
    });

    this.securityMonitor.on('security:alert', (alert) => {
      logger.error('Security alert in Pot Management:', alert);
    });

    // Middleware to log security events
    this.app.use((req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Log potential security events
        if (res.statusCode >= 400) {
          req.app.locals.securityMonitor?.logSecurityEvent({
            type: 'error_response',
            userId: req.user?.id,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path,
            statusCode: res.statusCode,
            method: req.method
          });
        }

        return originalSend.call(this, data);
      };

      next();
    });

    // Store security monitor in app locals for access in routes
    this.app.locals.securityMonitor = this.securityMonitor;
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing Pot Management Service...');

      // Initialize database connection
      const database = await initializeDatabase();
      this.app.locals.db = database;
      logger.info('✅ Database connected');

      // Initialize cache
      const cache = await initializeCache();
      this.app.locals.cache = cache;
      logger.info('✅ Cache connected');

      logger.info('🎂 Pot Management Service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Pot Management Service:', error);
      throw error;
    }
  }

  async start() {
    try {
      await this.initialize();

      this.server = this.app.listen(this.port, () => {
        logger.info(`🎉 Pot Management Service running on port ${this.port}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info('🎂 Ready to create amazing birthday experiences!');
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    } catch (error) {
      logger.error('❌ Failed to start Pot Management Service:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    logger.info(`📥 Received ${signal}, starting graceful shutdown...`);

    try {
      // Stop accepting new connections
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('✅ HTTP server closed');
      }

      // Close database connections
      if (this.app.locals.db) {
        // Supabase client doesn't need explicit closing
        logger.info('✅ Database connections closed');
      }

      // Close cache connections
      if (this.app.locals.cache) {
        await this.app.locals.cache.quit();
        logger.info('✅ Cache connections closed');
      }

      logger.info('🎂 Pot Management Service shutdown complete');
      process.exit(0);

    } catch (error) {
      logger.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  // Method to get Express app (for testing)
  getApp() {
    return this.app;
  }
}

// Export for use in other modules
module.exports = PotManagementApp;

// Start server if this file is run directly
if (require.main === module) {
  const app = new PotManagementApp();
  app.start().catch(error => {
    logger.error('💥 Failed to start Pot Management Service:', error);
    process.exit(1);
  });
}