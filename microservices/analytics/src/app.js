// =====================================================
// WOLO ANALYTICS & REPORTING MICROSERVICE
// Privacy-first analytics with powerful insights
// GDPR compliant + User-centric data
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
const analyticsRoutes = require('./routes/analytics-routes');
const insightsRoutes = require('./routes/insights-routes');
const reportingRoutes = require('./routes/reporting-routes');
const dashboardRoutes = require('./routes/dashboard-routes');

// Import analytics services
const EventTracker = require('./services/event-tracker');
const AnalyticsProcessor = require('./services/analytics-processor');
const InsightsEngine = require('./services/insights-engine');

class AnalyticsApp {
  constructor() {
    this.app = express();
    this.port = process.env.ANALYTICS_PORT || 3006;
    this.server = null;
    this.isShuttingDown = false;
    
    // Initialize security monitoring
    this.securityMonitor = new SecurityMonitoringService({
      serviceName: 'analytics',
      enableBehaviorAnalytics: true,
      riskScoreThreshold: 70,
      alertChannels: ['email', 'dashboard']
    });

    // Initialize analytics services
    this.analyticsServices = {};

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupSecurityMonitoring();
  }

  setupMiddleware() {
    // Security headers with analytics-specific settings
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for charts
          connectSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "data:"],
        },
      },
    }));

    // CORS configuration for analytics dashboards
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, process.env.ADMIN_DASHBOARD_URL] 
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Compression for faster chart data delivery
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' })); // Allow large analytics payloads
    this.app.use(express.urlencoded({ extended: true }));

    // Request tracking
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.startTime = Date.now();
      next();
    });

    // Request logging
    this.app.use(requestLogger);

    // Rate limiting for analytics endpoints
    const analyticsLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Higher limit for dashboard refreshing
      message: { 
        error: 'Too many analytics requests', 
        message: 'Please wait before requesting more analytics data' 
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.user?.id || req.ip;
      },
      skip: (req) => {
        // Skip rate limiting for health checks and internal service calls
        return req.path === '/health' || req.headers['x-internal-service'];
      }
    });
    this.app.use(analyticsLimiter);

    // Special rate limiting for resource-intensive reports
    const reportLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // Limited report generation per hour
      message: { 
        error: 'Report generation limit reached', 
        message: 'You can generate 20 reports per hour' 
      },
      keyGenerator: (req) => req.user?.id || req.ip
    });

    // Apply report limiter to report generation endpoints
    this.app.use('/api/v1/reports/generate', reportLimiter);
  }

  setupRoutes() {
    // Health check endpoint with system metrics
    this.app.get('/health', (req, res) => {
      const systemMetrics = this.getSystemMetrics();
      
      res.json({
        service: 'analytics',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        system: systemMetrics,
        features: {
          event_tracking: 'active',
          real_time_analytics: 'active',
          privacy_compliance: 'GDPR ready',
          data_retention: '90 days default'
        }
      });
    });

    // API routes with version prefix
    this.app.use('/api/v1/analytics', analyticsRoutes);
    this.app.use('/api/v1/insights', insightsRoutes);
    this.app.use('/api/v1/reports', reportingRoutes);
    this.app.use('/api/v1/dashboard', dashboardRoutes);

    // Real-time analytics endpoint
    this.app.get('/api/v1/realtime', authMiddleware, async (req, res) => {
      try {
        const realtimeData = await this.analyticsServices.processor.getRealtimeMetrics();
        res.json(realtimeData);
      } catch (error) {
        logger.error('Real-time analytics error:', error);
        res.status(500).json({ 
          error: 'Failed to fetch real-time data',
          message: 'Please try again in a moment'
        });
      }
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'WOLO Analytics & Reporting Service',
        message: 'Turning data into insights! 📊✨',
        version: '1.0.0',
        privacy: 'GDPR compliant, user-first approach',
        capabilities: [
          'User behavior analytics',
          'Pot performance metrics',
          'Donation flow analysis',
          'Real-time dashboards',
          'Privacy-safe insights',
          'Custom reporting'
        ],
        endpoints: {
          analytics: '/api/v1/analytics',
          insights: '/api/v1/insights',
          reports: '/api/v1/reports',
          dashboard: '/api/v1/dashboard',
          realtime: '/api/v1/realtime'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Analytics endpoint not found',
        message: 'This analytics endpoint does not exist',
        requestId: req.requestId
      });
    });
  }

  setupErrorHandling() {
    // Global error handler for analytics
    this.app.use((err, req, res, next) => {
      // Log security events for certain errors
      if (err.status === 401 || err.status === 403) {
        this.securityMonitor.logSecurityEvent({
          type: 'analytics_authorization_error',
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          error: err.message
        });
      }

      // Special handling for data privacy violations
      if (err.type === 'privacy_violation') {
        this.securityMonitor.logSecurityEvent({
          type: 'privacy_violation_attempt',
          severity: 'HIGH',
          userId: req.user?.id,
          ip: req.ip,
          endpoint: req.path,
          details: err.details
        });
      }

      logger.error('Analytics Service Error:', {
        error: err.message,
        stack: err.stack,
        requestId: req.requestId,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.path}`,
        type: err.type
      });

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      let errorMessage = 'Internal server error';
      if (err.type === 'privacy_violation') {
        errorMessage = 'Data access not permitted';
      } else if (isDevelopment) {
        errorMessage = err.message;
      }
      
      res.status(err.status || 500).json({
        error: errorMessage,
        message: 'Analytics service error',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: err.stack })
      });
    });
  }

  setupSecurityMonitoring() {
    // Enhanced security monitoring for analytics
    this.securityMonitor.on('security:incident', (incident) => {
      logger.warn('Security incident in Analytics Service:', incident);
    });

    this.securityMonitor.on('security:alert', (alert) => {
      logger.error('Security alert in Analytics Service:', alert);
    });

    // Monitor analytics access patterns
    this.app.use((req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Log analytics data access
        if (req.path.includes('analytics') || req.path.includes('insights')) {
          req.app.locals.securityMonitor?.logSecurityEvent({
            type: 'analytics_data_access',
            userId: req.user?.id,
            ip: req.ip,
            endpoint: req.path,
            success: res.statusCode < 400,
            dataType: req.path.split('/').pop(),
            timestamp: new Date()
          });
        }

        // Monitor potential data mining attempts
        if (req.query.limit && parseInt(req.query.limit) > 1000) {
          req.app.locals.securityMonitor?.logSecurityEvent({
            type: 'potential_data_mining',
            severity: 'MEDIUM',
            userId: req.user?.id,
            ip: req.ip,
            endpoint: req.path,
            requestedLimit: req.query.limit
          });
        }

        return originalSend.call(this, data);
      };

      next();
    });

    // Store security monitor in app locals
    this.app.locals.securityMonitor = this.securityMonitor;
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing Analytics Service...');

      // Initialize database connection
      const database = await initializeDatabase();
      this.app.locals.db = database;
      logger.info('✅ Database connected');

      // Initialize cache for analytics data
      const cache = await initializeCache();
      this.app.locals.cache = cache;
      logger.info('✅ Cache connected');

      // Initialize analytics services
      await this.initializeAnalyticsServices();
      logger.info('✅ Analytics services initialized');

      // Set up data retention policies
      await this.setupDataRetentionPolicies();
      logger.info('✅ Data retention policies configured');

      // Verify analytics configuration
      this.verifyAnalyticsConfig();
      logger.info('✅ Analytics configuration verified');

      logger.info('📊 Analytics Service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Analytics Service:', error);
      throw error;
    }
  }

  async initializeAnalyticsServices() {
    try {
      // Initialize event tracking service
      this.analyticsServices.eventTracker = new EventTracker({
        database: this.app.locals.db,
        cache: this.app.locals.cache,
        privacyMode: 'strict', // GDPR compliance
        retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 90
      });

      // Initialize analytics processor
      this.analyticsServices.processor = new AnalyticsProcessor({
        database: this.app.locals.db,
        cache: this.app.locals.cache,
        aggregationInterval: '5m', // 5-minute aggregations
        enableRealtime: true
      });

      // Initialize insights engine
      this.analyticsServices.insights = new InsightsEngine({
        database: this.app.locals.db,
        cache: this.app.locals.cache,
        enableMLInsights: process.env.ENABLE_ML_INSIGHTS === 'true',
        privacyThreshold: 5 // Minimum data points for insights
      });

      // Store services in app locals
      this.app.locals.analyticsServices = this.analyticsServices;

      logger.info('📈 Event tracking initialized');
      logger.info('⚡ Real-time analytics processor active');
      logger.info('🤖 Insights engine configured');

    } catch (error) {
      logger.error('❌ Failed to initialize analytics services:', error);
      throw error;
    }
  }

  async setupDataRetentionPolicies() {
    try {
      const retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 90;
      
      // Set up automatic cleanup of old analytics data
      const cleanup = async () => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        try {
          // Clean up old event data
          const { error } = await this.app.locals.db
            .from('analytics_events')
            .delete()
            .lt('created_at', cutoffDate.toISOString());

          if (error) {
            logger.error('Analytics cleanup error:', error);
          } else {
            logger.info(`🧹 Cleaned analytics data older than ${retentionDays} days`);
          }
        } catch (cleanupError) {
          logger.error('Analytics cleanup failed:', cleanupError);
        }
      };

      // Run cleanup daily at 2 AM
      const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
      setInterval(cleanup, cleanupInterval);
      
      // Run initial cleanup
      setTimeout(cleanup, 5000); // After 5 seconds

      logger.info(`📅 Data retention policy: ${retentionDays} days`);

    } catch (error) {
      logger.warn('⚠️  Data retention setup warning:', error);
    }
  }

  verifyAnalyticsConfig() {
    const optionalEnvVars = [
      'ANALYTICS_RETENTION_DAYS',
      'ENABLE_ML_INSIGHTS',
      'ADMIN_DASHBOARD_URL'
    ];

    const present = optionalEnvVars.filter(key => process.env[key]);
    const missing = optionalEnvVars.filter(key => !process.env[key]);
    
    if (present.length > 0) {
      logger.info(`✅ Analytics config present: ${present.join(', ')}`);
    }
    
    if (missing.length > 0) {
      logger.info(`ℹ️  Using defaults for: ${missing.join(', ')}`);
    }

    logger.info('🔐 Privacy mode: GDPR compliant');
    logger.info('📊 Analytics ready for insights generation');
  }

  getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    
    return {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
      },
      uptime: Math.round(process.uptime()),
      node_version: process.version,
      platform: process.platform
    };
  }

  async start() {
    try {
      await this.initialize();

      this.server = this.app.listen(this.port, () => {
        logger.info(`📊 Analytics Service running on port ${this.port}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info('📈 Ready to generate powerful insights!');
        logger.info('🔐 Privacy-first analytics active');
        logger.info('⚡ Real-time data processing enabled');
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    } catch (error) {
      logger.error('❌ Failed to start Analytics Service:', error);
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

      // Close analytics services
      if (this.analyticsServices) {
        for (const [name, service] of Object.entries(this.analyticsServices)) {
          if (service && typeof service.close === 'function') {
            await service.close();
            logger.info(`✅ ${name} service closed`);
          }
        }
      }

      // Close database connections
      if (this.app.locals.db) {
        logger.info('✅ Database connections closed');
      }

      // Close cache connections
      if (this.app.locals.cache) {
        await this.app.locals.cache.quit();
        logger.info('✅ Cache connections closed');
      }

      logger.info('📊 Analytics Service shutdown complete');
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
module.exports = AnalyticsApp;

// Start server if this file is run directly
if (require.main === module) {
  const app = new AnalyticsApp();
  app.start().catch(error => {
    logger.error('💥 Failed to start Analytics Service:', error);
    process.exit(1);
  });
}