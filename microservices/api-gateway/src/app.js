const express = require('express');
const httpProxy = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

const config = require('../../shared/config');
const cacheProvider = require('../../shared/providers/cache');

const authMiddleware = require('./middleware/auth');
const serviceDiscovery = require('./services/serviceDiscovery');
const loadBalancer = require('./services/loadBalancer');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
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
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://wolosenegal.com',
      'https://www.wolosenegal.com',
      'https://app.wolosenegal.com'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key']
};

app.use(cors(corsOptions));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: config.API_GATEWAY.RATE_LIMIT.WINDOW_MS,
  max: config.API_GATEWAY.RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Trop de requêtes. Réessayez plus tard.',
    retryAfter: Math.floor(config.API_GATEWAY.RATE_LIMIT.WINDOW_MS / 60000) + ' minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        success: false,
        error: 'Invalid JSON',
        message: 'Format JSON invalide'
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request ID and logging middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-Gateway', 'WOLO-API-Gateway');
  
  const start = Date.now();
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Gateway Request ID: ${req.id} - IP: ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(
      `[${new Date().toISOString()}] ${logLevel} - ` +
      `${req.method} ${req.path} - ` +
      `Status: ${res.statusCode} - ` +
      `Duration: ${duration}ms - ` +
      `Request ID: ${req.id}`
    );
  });
  
  next();
});

// Service health tracking middleware
app.use(async (req, res, next) => {
  // Track request patterns for load balancing
  if (req.path.startsWith('/api/')) {
    const serviceName = req.path.split('/')[2]; // Extract service name from path
    await loadBalancer.recordRequest(serviceName, req.method);
  }
  next();
});

// Authentication middleware for protected routes
const protectedRoutes = [
  '/api/users/profile',
  '/api/pots',
  '/api/donations',
  '/api/payments',
  '/api/wallets',
  '/api/notifications',
  '/api/preferences',
  '/api/analytics',
  '/api/insights',
  '/api/reports',
  '/api/dashboard',
  '/api/realtime'
];

app.use((req, res, next) => {
  const needsAuth = protectedRoutes.some(route => req.path.startsWith(route));
  
  if (needsAuth) {
    return authMiddleware.authenticateToken(req, res, next);
  }
  
  // Optional auth for other routes
  return authMiddleware.optionalAuth(req, res, next);
});

// Service proxy configuration
const createProxyMiddleware = (serviceName, serviceConfig) => {
  return httpProxy.createProxyMiddleware({
    target: serviceConfig.target || `http://localhost:${serviceConfig.PORT}`,
    changeOrigin: true,
    pathRewrite: serviceConfig.pathRewrite || {
      [`^/api/${serviceName}`]: `/api/v1/${serviceName}`
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}:`, err.message);
      
      res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: `Service ${serviceName} temporairement indisponible`,
        requestId: req.id,
        service: serviceName
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add request ID to proxy request
      proxyReq.setHeader('X-Request-ID', req.id);
      proxyReq.setHeader('X-Gateway-Forward', 'true');
      
      // Forward user information if authenticated
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.userId);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Roles', JSON.stringify(req.user.roles || ['user']));
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add gateway headers to response
      proxyRes.headers['X-Gateway'] = 'WOLO-API-Gateway';
      proxyRes.headers['X-Service'] = serviceName;
    },
    timeout: serviceConfig.timeout || 30000,
    proxyTimeout: serviceConfig.timeout || 30000
  });
};

// Service routes with load balancing
app.use('/api/users', async (req, res, next) => {
  try {
    const instance = await loadBalancer.getHealthyInstance('user-management-service');
    if (!instance) {
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'Service utilisateur temporairement indisponible'
      });
    }
    
    // Create dynamic proxy for the healthy instance
    const proxy = httpProxy.createProxyMiddleware({
      target: `http://localhost:${instance.port}`,
      changeOrigin: true,
      pathRewrite: { '^/api/users': '' },
      timeout: 30000,
      onError: (err, req, res) => {
        loadBalancer.markInstanceUnhealthy('user-management-service', instance);
        console.error('User service proxy error:', err.message);
        
        res.status(503).json({
          success: false,
          error: 'Service error',
          message: 'Erreur du service utilisateur',
          requestId: req.id
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('X-Request-ID', req.id);
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.userId);
          proxyReq.setHeader('X-User-Email', req.user.email);
        }
      }
    });
    
    proxy(req, res, next);
  } catch (error) {
    console.error('User service routing error:', error);
    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      message: 'Service utilisateur temporairement indisponible'
    });
  }
});

// Route configurations for all microservices
const serviceRoutes = {
  'pots': {
    PORT: 3003,
    target: process.env.POT_MANAGEMENT_URL || 'http://localhost:3003',
    timeout: 15000
  },
  'discovery': {
    PORT: 3003,
    target: process.env.POT_MANAGEMENT_URL || 'http://localhost:3003',
    timeout: 10000,
    pathRewrite: { '^/api/discovery': '/api/v1/discovery' }
  },
  'donations': {
    PORT: 3004,
    target: process.env.PAYMENT_PROCESSING_URL || 'http://localhost:3004',
    timeout: 20000
  },
  'payments': {
    PORT: 3004,
    target: process.env.PAYMENT_PROCESSING_URL || 'http://localhost:3004',
    timeout: 20000
  },
  'wallets': {
    PORT: 3004,
    target: process.env.PAYMENT_PROCESSING_URL || 'http://localhost:3004',
    timeout: 15000,
    pathRewrite: { '^/api/wallets': '/api/v1/wallets' }
  },
  'notifications': {
    PORT: 3005,
    target: process.env.NOTIFICATION_URL || 'http://localhost:3005',
    timeout: 10000
  },
  'templates': {
    PORT: 3005,
    target: process.env.NOTIFICATION_URL || 'http://localhost:3005',
    timeout: 10000,
    pathRewrite: { '^/api/templates': '/api/v1/templates' }
  },
  'preferences': {
    PORT: 3005,
    target: process.env.NOTIFICATION_URL || 'http://localhost:3005',
    timeout: 10000,
    pathRewrite: { '^/api/preferences': '/api/v1/preferences' }
  },
  'analytics': {
    PORT: 3006,
    target: process.env.ANALYTICS_URL || 'http://localhost:3006',
    timeout: 25000
  },
  'insights': {
    PORT: 3006,
    target: process.env.ANALYTICS_URL || 'http://localhost:3006',
    timeout: 20000,
    pathRewrite: { '^/api/insights': '/api/v1/insights' }
  },
  'reports': {
    PORT: 3006,
    target: process.env.ANALYTICS_URL || 'http://localhost:3006',
    timeout: 30000,
    pathRewrite: { '^/api/reports': '/api/v1/reports' }
  },
  'dashboard': {
    PORT: 3006,
    target: process.env.ANALYTICS_URL || 'http://localhost:3006',
    timeout: 15000,
    pathRewrite: { '^/api/dashboard': '/api/v1/dashboard' }
  },
  'realtime': {
    PORT: 3006,
    target: process.env.ANALYTICS_URL || 'http://localhost:3006',
    timeout: 10000,
    pathRewrite: { '^/api/realtime': '/api/v1/realtime' }
  }
};

// Set up proxy routes for each service
Object.keys(serviceRoutes).forEach(serviceName => {
  const serviceConfig = serviceRoutes[serviceName];
  app.use(`/api/${serviceName}`, createProxyMiddleware(serviceName, serviceConfig));
});

// Gateway health check
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const health = {
      service: 'WOLO API Gateway',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: config.NODE_ENV,
      services: {},
      cache: 'unknown',
      responseTime: 0
    };

    // Check cache
    try {
      await cacheProvider.healthCheck();
      health.cache = 'healthy';
    } catch (error) {
      health.cache = 'unhealthy';
      health.status = 'degraded';
    }

    // Check all registered services
    const services = await serviceDiscovery.getAllServices();
    
    for (const [serviceName, instances] of Object.entries(services)) {
      const healthyInstances = instances.filter(instance => instance.health === 'healthy');
      
      health.services[serviceName] = {
        total_instances: instances.length,
        healthy_instances: healthyInstances.length,
        status: healthyInstances.length > 0 ? 'available' : 'unavailable'
      };
      
      if (healthyInstances.length === 0) {
        health.status = 'degraded';
      }
    }

    health.responseTime = Date.now() - startTime;

    const statusCode = health.status === 'degraded' ? 503 : 200;
    res.status(statusCode).json(health);

  } catch (error) {
    console.error('Gateway health check error:', error);
    
    res.status(503).json({
      service: 'WOLO API Gateway',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime
    });
  }
});

// Gateway info endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'WOLO API Gateway',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    endpoints: {
      health: '/health',
      services: {
        users: '/api/users',
        pots: '/api/pots',
        sponsorship: '/api/sponsorship',
        payments: '/api/payments',
        notifications: '/api/notifications',
        identity: '/api/identity',
        analytics: '/api/analytics'
      }
    },
    documentation: {
      message: 'API Gateway pour les services WOLO',
      authentication: 'Bearer token required for protected endpoints',
      rateLimit: `${config.API_GATEWAY.RATE_LIMIT.MAX_REQUESTS} requests per ${Math.floor(config.API_GATEWAY.RATE_LIMIT.WINDOW_MS / 60000)} minutes`
    }
  });
});

// Service discovery endpoint
app.get('/services', async (req, res) => {
  try {
    const services = await serviceDiscovery.getAllServices();
    
    res.json({
      success: true,
      services: services,
      total_services: Object.keys(services).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Service discovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Service discovery failed',
      message: 'Erreur lors de la découverte des services'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Endpoint ${req.method} ${req.originalUrl} non trouvé`,
    requestId: req.id,
    availableEndpoints: {
      users: '/api/users',
      pots: '/api/pots',
      sponsorship: '/api/sponsorship',
      payments: '/api/payments',
      notifications: '/api/notifications',
      identity: '/api/identity',
      analytics: '/api/analytics'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(`[${new Date().toISOString()}] GATEWAY ERROR - Request ID: ${req.id}`, error);

  // Handle proxy errors
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Service unavailable',
      message: 'Service temporairement indisponible',
      requestId: req.id
    });
  }

  if (error.code === 'ETIMEDOUT') {
    return res.status(504).json({
      success: false,
      error: 'Gateway timeout',
      message: 'Délai d\'attente dépassé',
      requestId: req.id
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = config.NODE_ENV === 'production' 
    ? 'Une erreur interne s\'est produite' 
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: 'Internal Server Error',
    message: message,
    requestId: req.id,
    ...(config.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Gateway shutting down gracefully...');
  
  try {
    await cacheProvider.close();
    console.log('✅ Gateway shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during gateway shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;