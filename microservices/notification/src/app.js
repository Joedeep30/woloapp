// =====================================================
// WOLO NOTIFICATION MICROSERVICE
// Multi-channel smart notifications with user preferences
// Invisible delivery + Maximum engagement
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
const notificationRoutes = require('./routes/notification-routes');
const preferencesRoutes = require('./routes/preferences-routes');
const templateRoutes = require('./routes/template-routes');

// Import notification services
const SMSService = require('./services/sms-service');
const EmailService = require('./services/email-service');
const PushNotificationService = require('./services/push-notification-service');
const WhatsAppService = require('./services/whatsapp-service');

class NotificationApp {
  constructor() {
    this.app = express();
    this.port = process.env.NOTIFICATION_PORT || 3005;
    this.server = null;
    this.isShuttingDown = false;
    
    // Initialize security monitoring
    this.securityMonitor = new SecurityMonitoringService({
      serviceName: 'notification',
      enableBehaviorAnalytics: true,
      riskScoreThreshold: 65,
      alertChannels: ['email', 'dashboard']
    });

    // Initialize notification services
    this.notificationServices = {};

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
          scriptSrc: ["'self'", "https://fcm.googleapis.com"], // Allow FCM
          connectSrc: ["'self'", "https://fcm.googleapis.com"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://fcm.googleapis.com'] 
        : ['http://localhost:3000', 'http://localhost:3001', 'https://fcm.googleapis.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Compression for faster responses
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '2mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request tracking
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.startTime = Date.now();
      next();
    });

    // Request logging
    this.app.use(requestLogger);

    // Rate limiting for notification sending
    const notificationLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Generous limit for notifications
      message: { 
        error: 'Too many notification requests', 
        message: 'Please wait before sending more notifications' 
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
    this.app.use(notificationLimiter);

    // Stricter rate limiting for bulk notifications
    const bulkLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Only 10 bulk sends per hour
      message: { 
        error: 'Bulk notification limit reached', 
        message: 'You can only send 10 bulk notifications per hour' 
      },
      keyGenerator: (req) => req.user?.id || req.ip
    });

    // Apply bulk limiter to bulk notification endpoints
    this.app.use('/api/v1/notifications/bulk', bulkLimiter);
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const services = this.getServiceHealth();
      
      res.json({
        service: 'notification',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        channels: {
          sms: services.sms ? 'active' : 'inactive',
          email: services.email ? 'active' : 'inactive',
          push: services.push ? 'active' : 'inactive',
          whatsapp: services.whatsapp ? 'active' : 'inactive'
        }
      });
    });

    // API routes with version prefix
    this.app.use('/api/v1/notifications', notificationRoutes);
    this.app.use('/api/v1/preferences', preferencesRoutes);
    this.app.use('/api/v1/templates', templateRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'WOLO Notification Service',
        message: 'Keeping everyone connected! 📱📧📞',
        version: '1.0.0',
        channels: ['SMS', 'Email', 'Push', 'WhatsApp'],
        features: [
          'Smart delivery timing',
          'User preferences',
          'Template management',
          'Multi-channel routing',
          'Delivery analytics'
        ],
        endpoints: {
          notifications: '/api/v1/notifications',
          preferences: '/api/v1/preferences',
          templates: '/api/v1/templates'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Notification endpoint not found',
        message: 'This notification endpoint does not exist',
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

      logger.error('Notification Service Error:', {
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
        message: 'Notification service error',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: err.stack })
      });
    });
  }

  setupSecurityMonitoring() {
    // Monitor security events
    this.securityMonitor.on('security:incident', (incident) => {
      logger.warn('Security incident in Notification Service:', incident);
    });

    this.securityMonitor.on('security:alert', (alert) => {
      logger.error('Security alert in Notification Service:', alert);
    });

    // Middleware to log notification events
    this.app.use((req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Log notification sending attempts
        if (req.path.includes('notification') && req.method === 'POST') {
          req.app.locals.securityMonitor?.logSecurityEvent({
            type: 'notification_sent',
            userId: req.user?.id,
            ip: req.ip,
            endpoint: req.path,
            success: res.statusCode < 400,
            timestamp: new Date()
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
      logger.info('🚀 Initializing Notification Service...');

      // Initialize database connection
      const database = await initializeDatabase();
      this.app.locals.db = database;
      logger.info('✅ Database connected');

      // Initialize cache
      const cache = await initializeCache();
      this.app.locals.cache = cache;
      logger.info('✅ Cache connected');

      // Initialize notification services
      await this.initializeNotificationServices();
      logger.info('✅ Notification services initialized');

      // Verify configuration
      this.verifyNotificationConfig();
      logger.info('✅ Notification configuration verified');

      logger.info('📱 Notification Service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Notification Service:', error);
      throw error;
    }
  }

  async initializeNotificationServices() {
    try {
      // Initialize SMS service (using your WhatsApp Business API or SMS provider)
      this.notificationServices.sms = new SMSService({
        provider: process.env.SMS_PROVIDER || 'whatsapp_business',
        apiKey: process.env.WHATSAPP_BUSINESS_API_KEY,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
      });

      // Initialize Email service (using SendGrid)
      this.notificationServices.email = new EmailService({
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.FROM_EMAIL || 'noreply@wolo.app',
        fromName: process.env.FROM_NAME || 'WOLO'
      });

      // Initialize Push notification service (using Firebase)
      this.notificationServices.push = new PushNotificationService({
        provider: 'firebase',
        serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      // Initialize WhatsApp service (separate from SMS for rich features)
      this.notificationServices.whatsapp = new WhatsAppService({
        apiKey: process.env.WHATSAPP_BUSINESS_API_KEY,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
      });

      // Store services in app locals for route access
      this.app.locals.notificationServices = this.notificationServices;

      logger.info('📧 Email service initialized');
      logger.info('📱 Push notification service initialized'); 
      logger.info('💬 SMS/WhatsApp services initialized');

    } catch (error) {
      logger.error('❌ Failed to initialize notification services:', error);
      throw error;
    }
  }

  verifyNotificationConfig() {
    const requiredEnvVars = [
      'SENDGRID_API_KEY',
      'WHATSAPP_BUSINESS_API_KEY',
      'FIREBASE_SERVICE_ACCOUNT_KEY'
    ];

    const missing = requiredEnvVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      logger.warn(`⚠️ Missing optional notification environment variables: ${missing.join(', ')}`);
      logger.info('ℹ️ Some notification channels may be disabled');
    } else {
      logger.info('✅ All notification configuration variables present');
    }
  }

  getServiceHealth() {
    return {
      sms: !!this.notificationServices.sms,
      email: !!this.notificationServices.email,
      push: !!this.notificationServices.push,
      whatsapp: !!this.notificationServices.whatsapp
    };
  }

  async start() {
    try {
      await this.initialize();

      this.server = this.app.listen(this.port, () => {
        logger.info(`📱 Notification Service running on port ${this.port}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info('📧 Ready to send amazing notifications!');
        logger.info('🔔 Multi-channel delivery active');
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    } catch (error) {
      logger.error('❌ Failed to start Notification Service:', error);
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

      // Close notification service connections
      if (this.notificationServices) {
        for (const [name, service] of Object.entries(this.notificationServices)) {
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

      logger.info('📱 Notification Service shutdown complete');
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
module.exports = NotificationApp;

// Start server if this file is run directly
if (require.main === module) {
  const app = new NotificationApp();
  app.start().catch(error => {
    logger.error('💥 Failed to start Notification Service:', error);
    process.exit(1);
  });
}