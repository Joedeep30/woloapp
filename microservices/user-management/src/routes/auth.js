const express = require('express');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const { authenticateToken, sensitiveEndpointLimiter } = require('../middleware/auth');

const router = express.Router();

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

// Registration rate limiting
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    error: 'Too many registration attempts',
    message: 'Trop de tentatives d\'inscription. Réessayez dans 1 heure.'
  }
});

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', 
  registerLimiter,
  sensitiveEndpointLimiter,
  authController.register
);

/**
 * @route POST /auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', 
  authLimiter,
  sensitiveEndpointLimiter,
  authController.login
);

/**
 * @route POST /auth/social-login
 * @desc Social login (Google, Facebook, Apple)
 * @access Public
 */
router.post('/social-login', 
  authLimiter,
  authController.socialLogin
);

/**
 * @route POST /auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh-token', 
  authLimiter,
  authController.refreshToken
);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', 
  authenticateToken,
  authController.logout
);

/**
 * @route GET /auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', 
  authenticateToken,
  authController.getMe
);

/**
 * @route POST /auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', 
  sensitiveEndpointLimiter,
  async (req, res) => {
    // TODO: Implement password reset request
    res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: 'Fonctionnalité en cours de développement'
    });
  }
);

/**
 * @route POST /auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', 
  sensitiveEndpointLimiter,
  async (req, res) => {
    // TODO: Implement password reset
    res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: 'Fonctionnalité en cours de développement'
    });
  }
);

/**
 * @route POST /auth/verify-email
 * @desc Verify email address
 * @access Public
 */
router.post('/verify-email', 
  async (req, res) => {
    // TODO: Implement email verification
    res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: 'Fonctionnalité en cours de développement'
    });
  }
);

/**
 * @route POST /auth/resend-verification
 * @desc Resend email verification
 * @access Private
 */
router.post('/resend-verification', 
  authenticateToken,
  sensitiveEndpointLimiter,
  async (req, res) => {
    // TODO: Implement resend verification
    res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: 'Fonctionnalité en cours de développement'
    });
  }
);

module.exports = router;