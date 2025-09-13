// =====================================================
// WOLO PAYMENT PROCESSING MICROSERVICE
// Wave integration with invisible security + seamless UX
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
const { authMiddleware } = require('../../shared/auth/jwt-auth');
const SecurityMonitoringService = require('../../shared/security/security-monitoring');
const { logger, requestLogger } = require('../../shared/utils/logger');

// Import route handlers
const donationRoutes = require('./routes/donation-routes');
const paymentRoutes = require('./routes/payment-routes');
const walletRoutes = require('./routes/wallet-routes');

class PaymentProcessingApp {
  constructor() {
    this.app = express();
    this.port = process.env.PAYMENT_PROCESSING_PORT || 3004;
    this.server = null;
    this.isShuttingDown = false;
    
    // Initialize security monitoring with stricter settings for payments
    this.securityMonitor = new SecurityMonitoringService({
      serviceName: 'payment-processing',
      enableBehaviorAnalytics: true,
      riskScoreThreshold: 50, // Stricter for financial transactions
      suspiciousLocationRadius: 500, // Tighter geographic controls
      enableGeoBlocking: true, // Enable geographic restrictions
      alertChannels: ['email', 'sms', 'dashboard'] // All alert channels for payments
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupSecurityMonitoring();
  }

  setupMiddleware() {
    // Enhanced security headers for payment processing
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "https://js.wave.com"], // Allow Wave scripts
          connectSrc: ["'self'", "https://api.wave.com"], // Allow Wave API calls
          frameSrc: ["'none'"], // No iframes for security
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://js.wave.com'] 
        : ['http://localhost:3000', 'http://localhost:3001', 'https://js.wave.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Wave-Signature']
    }));

    // Compression for faster responses
    this.app.use(compression());

    // Body parsing with enhanced limits for payment data
    this.app.use(express.json({ 
      limit: '1mb',
      verify: (req, res, buf, encoding) => {
        // Store raw body for webhook signature verification
        if (req.path.startsWith('/api/v1/webhooks')) {
          req.rawBody = buf.toString(encoding || 'utf8');
        }
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Request tracking
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.startTime = Date.now();
      next();
    });

    // Request logging
    this.app.use(requestLogger);

    // Strict rate limiting for payment endpoints
    const paymentLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // Much lower limit for payment operations
      message: { 
        error: 'Too many payment requests', 
        message: 'Please wait before making another payment' 
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Rate limit by user ID for authenticated requests
        return req.user?.id || req.ip;
      },
      skip: (req) => {
        // Skip rate limiting for health checks and webhooks
        return req.path === '/health' || req.path.startsWith('/api/v1/webhooks');
      }
    });
    this.app.use(paymentLimiter);

    // Ultra-strict rate limiting for donation creation
    const donationLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 3, // Only 3 donations per minute
      message: { 
        error: 'Please slow down', 
        message: 'You can only make 3 donations per minute' 
      },
      keyGenerator: (req) => req.user?.id || req.ip
    });

    // Apply donation limiter only to POST /donations
    this.app.use('/api/v1/donations', (req, res, next) => {
      if (req.method === 'POST') {
        return donationLimiter(req, res, next);
      }
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        service: 'payment-processing',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        payment_provider: 'Wave',
        security: 'banking-grade'
      });
    });

    // API routes with version prefix
    this.app.use('/api/v1/donations', donationRoutes);
    this.app.use('/api/v1/payments', paymentRoutes);
    this.app.use('/api/v1/wallets', walletRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'WOLO Payment Processing Service',
        message: 'Secure, lightning-fast payments! 💰⚡',
        version: '1.0.0',
        provider: 'Wave Money Senegal',
        security: 'Banking-grade encryption',
        endpoints: {
          donations: '/api/v1/donations',
          payments: '/api/v1/payments',
          wallets: '/api/v1/wallets'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Payment endpoint not found',
        message: 'This payment endpoint does not exist',
        requestId: req.requestId
      });
    });
  }

  setupErrorHandling() {
    // Enhanced error handling for payment operations
    this.app.use((err, req, res, next) => {
      // Log critical security events for payment errors
      if (err.status === 401 || err.status === 403 || req.path.includes('payment')) {
        this.securityMonitor.logSecurityEvent({
          type: 'payment_error',
          severity: 'HIGH',
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          error: err.message,
          amount: req.body?.amount,
          method: req.method
        });
      }

      logger.error('Payment Processing Error:', {
        error: err.message,
        stack: err.stack,
        requestId: req.requestId,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.path}`,
        body: req.method === 'POST' ? req.body : undefined
      });

      // Never expose sensitive payment errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isPaymentError = req.path.includes('payment') || req.path.includes('donation');
      
      let errorMessage = 'Internal server error';
      if (isPaymentError) {
        errorMessage = 'Payment processing failed';
      } else if (isDevelopment) {
        errorMessage = err.message;
      }
      
      res.status(err.status || 500).json({
        error: errorMessage,
        message: isPaymentError ? 'Please try your payment again' : 'Please try again in a moment',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        support: isPaymentError ? 'Contact support if this persists' : undefined,
        ...(isDevelopment && !isPaymentError && { 
          debug: err.message,
          stack: err.stack 
        })
      });
    });
  }

  setupSecurityMonitoring() {
    // Enhanced security monitoring for financial operations
    this.securityMonitor.on('security:incident', (incident) => {
      logger.warn('Payment Security Incident:', {
        ...incident,
        service: 'payment-processing'
      });
    });

    this.securityMonitor.on('security:alert', (alert) => {
      logger.error('Payment Security Alert:', {
        ...alert,
        service: 'payment-processing',
        priority: 'CRITICAL'
      });
    });

    // Monitor all payment-related requests
    this.app.use((req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Log payment security events
        if (req.path.includes('payment') || req.path.includes('donation')) {
          req.app.locals.securityMonitor?.logSecurityEvent({
            type: 'payment_transaction',
            userId: req.user?.id,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            amount: req.body?.amount,
            success: res.statusCode < 400,
            timestamp: new Date()
          });
        }

        // Log failed payment attempts
        if (res.statusCode >= 400 && (req.path.includes('payment') || req.path.includes('donation'))) {
          req.app.locals.securityMonitor?.logSecurityEvent({
            type: 'payment_failure',
            severity: 'MEDIUM',
            userId: req.user?.id,
            ip: req.ip,
            endpoint: req.path,
            statusCode: res.statusCode,
            amount: req.body?.amount,
            reason: 'payment_failed'
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
      logger.info('🚀 Initializing Payment Processing Service...');

      // Initialize database connection
      const database = await initializeDatabase();
      this.app.locals.db = database;
      logger.info('✅ Database connected');

      // Initialize cache
      const cache = await initializeCache();
      this.app.locals.cache = cache;
      logger.info('✅ Cache connected');

      // Initialize Wave API client
      this.initializeWaveAPI();
      logger.info('✅ Wave API initialized');

      // Verify environment variables
      this.verifyPaymentConfig();
      logger.info('✅ Payment configuration verified');

      logger.info('💰 Payment Processing Service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Payment Processing Service:', error);
      throw error;
    }
  }

  initializeWaveAPI() {
    // Initialize Wave API client
    const waveConfig = {
      apiKey: process.env.WAVE_API_KEY,
      secretKey: process.env.WAVE_SECRET_KEY,
      baseURL: process.env.WAVE_API_URL || 'https://api.wave.com/v1',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    };

    // Store Wave config in app locals
    this.app.locals.waveConfig = waveConfig;
    
    logger.info(`💰 Wave API configured for ${waveConfig.environment} environment`);
  }

  verifyPaymentConfig() {
    const required = [
      'WAVE_API_KEY',
      'WAVE_SECRET_KEY',
      'WAVE_WEBHOOK_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required payment environment variables: ${missing.join(', ')}`);
    }

    // Verify Wave API key format
    if (!process.env.WAVE_API_KEY.startsWith('wave_')) {
      logger.warn('⚠️ Wave API key may be invalid - should start with "wave_"');
    }

    logger.info('✅ All payment configuration variables present');
  }

  async start() {
    try {
      await this.initialize();

      this.server = this.app.listen(this.port, () => {
        logger.info(`💰 Payment Processing Service running on port ${this.port}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info('⚡ Ready for lightning-fast payments!');
        logger.info('🛡️ Banking-grade security active');
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    } catch (error) {
      logger.error('❌ Failed to start Payment Processing Service:', error);
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
        logger.info('✅ Database connections closed');
      }

      // Close cache connections
      if (this.app.locals.cache) {
        await this.app.locals.cache.quit();
        logger.info('✅ Cache connections closed');
      }

      logger.info('💰 Payment Processing Service shutdown complete');
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
module.exports = PaymentProcessingApp;

// Start server if this file is run directly
if (require.main === module) {
  const app = new PaymentProcessingApp();
  app.start().catch(error => {
    logger.error('💥 Failed to start Payment Processing Service:', error);
    process.exit(1);
  });
}