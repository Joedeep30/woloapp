const config = require('../../../shared/config');

// Simple service discovery for development
const services = {
  'user-management': {
    name: 'user-management-service',
    port: config.SERVICES.USER_MANAGEMENT.PORT,
    healthPath: '/health',
    status: 'unknown'
  },
  'pot-management': {
    name: 'pot-management-service', 
    port: config.SERVICES.POT_MANAGEMENT.PORT,
    healthPath: '/health',
    status: 'unknown'
  },
  'payment-processing': {
    name: 'payment-service',
    port: config.SERVICES.PAYMENT.PORT,
    healthPath: '/health',
    status: 'unknown'
  },
  'notification': {
    name: 'notification-service',
    port: config.SERVICES.NOTIFICATION.PORT,
    healthPath: '/health',
    status: 'unknown'
  },
  'identity-service': {
    name: 'identity-verification-service',
    port: config.SERVICES.IDENTITY_VERIFICATION.PORT,
    healthPath: '/health',
    status: 'unknown'
  },
  'analytics': {
    name: 'analytics-service',
    port: config.SERVICES.ANALYTICS.PORT,
    healthPath: '/health',
    status: 'unknown'
  }
};

// Get service configuration
const getService = (serviceName) => {
  return services[serviceName] || null;
};

// Get all registered services
const getAllServices = () => {
  return services;
};

// Register a service (simplified)
const registerService = (serviceName, serviceConfig) => {
  services[serviceName] = {
    ...services[serviceName],
    ...serviceConfig,
    registeredAt: new Date()
  };
  console.log(`✅ Service registered: ${serviceName}`);
};

// Update service health status
const updateServiceHealth = (serviceName, status) => {
  if (services[serviceName]) {
    services[serviceName].status = status;
    services[serviceName].lastHealthCheck = new Date();
  }
};

module.exports = {
  getService,
  getAllServices,
  registerService,
  updateServiceHealth
};