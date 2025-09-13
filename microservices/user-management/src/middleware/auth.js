const jwt = require('jsonwebtoken');
const config = require('../../../shared/config');
const databaseProvider = require('../../../shared/providers/database');
const cacheProvider = require('../../../shared/providers/cache');

/**
 * JWT Authentication Middleware
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Token d\'accès requis'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT.SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Token expiré. Veuillez vous reconnecter.'
        });
      }
      
      return res.status(403).json({
        success: false,
        error: 'Invalid token',
        message: 'Token invalide'
      });
    }

    // Check token type
    if (decoded.type !== 'access') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token type',
        message: 'Type de token invalide'
      });
    }

    // Check if user exists and is active
    const user = await databaseProvider.findOne('users', { id: decoded.userId }, true);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: 'Account inactive',
        message: 'Compte désactivé'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      user: user
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Erreur d\'authentification'
    });
  }
};

/**
 * Optional authentication middleware (for endpoints that work with or without auth)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without auth
      req.user = null;
      return next();
    }

    // Try to authenticate
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT.SECRET);
      
      if (decoded.type === 'access') {
        const user = await databaseProvider.findOne('users', { id: decoded.userId }, true);
        
        if (user && user.status !== 'inactive') {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            user: user
          };
        }
      }
    } catch (error) {
      // Ignore token errors for optional auth
      console.warn('Optional auth token error:', error.message);
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Continue without auth on errors
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Authentification requise'
        });
      }

      const userRoles = req.user.user.roles || ['user'];
      const hasRequiredRole = roles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: 'Permissions insuffisantes'
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization failed',
        message: 'Erreur d\'autorisation'
      });
    }
  };
};

/**
 * Rate limiting middleware for sensitive endpoints
 */
const sensitiveEndpointLimiter = async (req, res, next) => {
  try {
    const identifier = req.ip || 'unknown';
    const key = `sensitive_limit:${identifier}`;
    
    const requests = await cacheProvider.get(key) || 0;
    const limit = 10; // 10 requests per hour for sensitive endpoints
    const windowMs = 60 * 60 * 1000; // 1 hour

    if (requests >= limit) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Trop de tentatives. Réessayez dans une heure.',
        retryAfter: '1 hour'
      });
    }

    await cacheProvider.set(key, requests + 1, Math.floor(windowMs / 1000));
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Continue on error to not block the request
    next();
  }
};

/**
 * Admin-only middleware
 */
const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Moderator or Admin middleware
 */
const requireModerator = requireRole(['moderator', 'admin', 'super_admin']);

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireModerator,
  sensitiveEndpointLimiter
};