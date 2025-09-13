const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

const config = require('../../shared/config');
const databaseProvider = require('../../shared/providers/database');
const cacheProvider = require('../../shared/providers/cache');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const healthRoutes = require('./routes/health');

const app = express();

// Trust proxy for accurate IP addresses
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
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
      retryAfter: '15 minutes'
    });
  }
});

app.use(limiter);

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

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  
  // Log request start
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${req.id}`);
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
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

// Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'WOLO User Management Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      authentication: '/auth',
      profiles: '/profile'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Endpoint ${req.method} ${req.originalUrl} non trouvé`,
    requestId: req.id
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR - Request ID: ${req.id}`, error);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Données de requête invalides',
      details: error.message,
      requestId: req.id
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Token d\'authentification requis ou invalide',
      requestId: req.id
    });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      message: 'Fichier trop volumineux',
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

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down gracefully...');
  
  try {
    // Close database connections
    await databaseProvider.close();
    
    // Close cache connections
    await cacheProvider.close();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

module.exports = app;