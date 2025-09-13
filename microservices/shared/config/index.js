const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Service Discovery
  CONSUL_HOST: process.env.CONSUL_HOST || 'localhost',
  CONSUL_PORT: process.env.CONSUL_PORT || 8500,
  
  // Database Configuration
  DATABASE: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CONNECTION_TIMEOUT: 30000,
    POOL_SIZE: 20
  },
  
  // Redis Configuration (for caching and session management)
  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: process.env.REDIS_PORT || 6379,
    PASSWORD: process.env.REDIS_PASSWORD,
    DB: process.env.REDIS_DB || 0,
    TTL: 3600 // 1 hour default TTL
  },
  
  // JWT Configuration
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // API Gateway Configuration
  API_GATEWAY: {
    PORT: process.env.API_GATEWAY_PORT || 3000,
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 1000
    }
  },
  
  // Microservices Configuration
  SERVICES: {
    USER_MANAGEMENT: {
      PORT: process.env.USER_SERVICE_PORT || 3001,
      NAME: 'user-management-service',
      HEALTH_CHECK_PATH: '/health'
    },
    POT_MANAGEMENT: {
      PORT: process.env.POT_SERVICE_PORT || 3002,
      NAME: 'pot-management-service',
      HEALTH_CHECK_PATH: '/health'
    },
    SPONSORSHIP: {
      PORT: process.env.SPONSORSHIP_SERVICE_PORT || 3003,
      NAME: 'sponsorship-service',
      HEALTH_CHECK_PATH: '/health'
    },
    PAYMENT: {
      PORT: process.env.PAYMENT_SERVICE_PORT || 3004,
      NAME: 'payment-service',
      HEALTH_CHECK_PATH: '/health'
    },
    NOTIFICATION: {
      PORT: process.env.NOTIFICATION_SERVICE_PORT || 3005,
      NAME: 'notification-service',
      HEALTH_CHECK_PATH: '/health'
    },
    IDENTITY_VERIFICATION: {
      PORT: process.env.IDENTITY_SERVICE_PORT || 3006,
      NAME: 'identity-verification-service',
      HEALTH_CHECK_PATH: '/health'
    },
    ANALYTICS: {
      PORT: process.env.ANALYTICS_SERVICE_PORT || 3007,
      NAME: 'analytics-service',
      HEALTH_CHECK_PATH: '/health'
    }
  },
  
  // External API Configuration
  EXTERNAL_APIS: {
    WAVE: {
      BASE_URL: process.env.WAVE_API_URL || 'https://api.wave.com',
      API_KEY: process.env.WAVE_API_KEY,
      SECRET_KEY: process.env.WAVE_SECRET_KEY,
      WEBHOOK_SECRET: process.env.WAVE_WEBHOOK_SECRET
    },
    WHATSAPP: {
      ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
      PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
      WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      API_VERSION: process.env.WHATSAPP_API_VERSION || 'v18.0'
    },
    SENDGRID: {
      API_KEY: process.env.SENDGRID_API_KEY,
      FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@wolosenegal.com'
    }
  },
  
  // Security Configuration
  SECURITY: {
    BCRYPT_ROUNDS: 12,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_TIME: 30 * 60 * 1000, // 30 minutes
    PASSWORD_MIN_LENGTH: 8
  },
  
  // Logging Configuration
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FILE_PATH: process.env.LOG_FILE_PATH || './logs',
    MAX_SIZE: '20m',
    MAX_FILES: '14d'
  },
  
  // Business Rules
  BUSINESS_RULES: {
    MIN_AGE_WITHOUT_GUARDIAN: 18,
    POT_CREATION_DAYS_BEFORE_BIRTHDAY: 30,
    POINTS_TO_CFA_RATE: 100, // 100 points = 1 CFA
    MAX_CONTACTS_IMPORT: 1000,
    MAX_BULK_MESSAGE_RECIPIENTS: 100,
    REFERRAL_BONUS_POINTS: 10,
    IDENTITY_VERIFICATION_BONUS_POINTS: 5,
    
    // Simplified Verification Settings
    VERIFICATION_APPROACH: process.env.VERIFICATION_APPROACH || 'simplified', // 'strict' or 'simplified'
    GUARDIAN_SMS_CODE_EXPIRY: 300, // 5 minutes
    MAX_FAMILY_VOUCHERS: 3, // Maximum family members who can vouch
    AUTO_APPROVE_THRESHOLD: 2, // Auto-approve if 2+ vouchers confirm
    
    // Photo ID alternatives
    ALLOW_FAMILY_NAME_VERIFICATION: true,
    ALLOW_SMS_VERIFICATION: true,
    ALLOW_SOCIAL_VOUCHING: true,
    REQUIRE_PHOTO_ID: false // Set to false for simplified approach
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

module.exports = config;