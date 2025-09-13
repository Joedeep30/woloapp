const express = require('express');
const databaseProvider = require('../../../shared/providers/database');
const cacheProvider = require('../../../shared/providers/cache');
const config = require('../../../shared/config');

const router = express.Router();

/**
 * @route GET /health
 * @desc Basic health check
 * @access Public
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const health = {
      service: 'WOLO User Management Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: config.NODE_ENV,
      checks: {
        database: 'unknown',
        cache: 'unknown',
        memory: 'unknown'
      },
      responseTime: 0
    };

    // Database health check
    try {
      await databaseProvider.healthCheck();
      health.checks.database = 'healthy';
    } catch (error) {
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
      console.error('Database health check failed:', error.message);
    }

    // Cache health check
    try {
      await cacheProvider.healthCheck();
      health.checks.cache = 'healthy';
    } catch (error) {
      health.checks.cache = 'unhealthy';
      health.status = 'degraded';
      console.error('Cache health check failed:', error.message);
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    // Alert if memory usage is too high (>500MB heap used)
    if (memoryUsageMB.heapUsed > 500) {
      health.checks.memory = 'warning';
      health.status = health.status === 'healthy' ? 'warning' : health.status;
    } else {
      health.checks.memory = 'healthy';
    }

    health.memory = memoryUsageMB;
    health.responseTime = Date.now() - startTime;

    // Determine HTTP status code
    let statusCode = 200;
    if (health.status === 'degraded') {
      statusCode = 503; // Service Unavailable
    } else if (health.status === 'warning') {
      statusCode = 200; // OK but with warnings
    }

    res.status(statusCode).json(health);

  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(503).json({
      service: 'WOLO User Management Service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime
    });
  }
});

/**
 * @route GET /health/detailed
 * @desc Detailed health check with all dependencies
 * @access Public
 */
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const health = {
      service: 'WOLO User Management Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: config.NODE_ENV,
      pid: process.pid,
      memory: {},
      checks: {},
      dependencies: {},
      responseTime: 0
    };

    // Memory usage
    const memoryUsage = process.memoryUsage();
    health.memory = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      heapUsedPercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    };

    // Database detailed check
    const dbStart = Date.now();
    try {
      await databaseProvider.healthCheck();
      
      // Test a simple query
      const testQuery = await databaseProvider.find('users', {}, true);
      
      health.dependencies.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
        connection: 'active',
        recordCount: Array.isArray(testQuery) ? testQuery.length : 0
      };
    } catch (error) {
      health.dependencies.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
        error: error.message,
        connection: 'failed'
      };
      health.status = 'degraded';
    }

    // Cache detailed check
    const cacheStart = Date.now();
    try {
      await cacheProvider.healthCheck();
      
      // Test cache operations
      const testKey = `health_check_${Date.now()}`;
      await cacheProvider.set(testKey, { test: true }, 10);
      const testValue = await cacheProvider.get(testKey);
      await cacheProvider.delete(testKey);
      
      health.dependencies.cache = {
        status: 'healthy',
        responseTime: Date.now() - cacheStart,
        connection: 'active',
        operationsWorking: testValue && testValue.test === true
      };

      // Get cache statistics if available
      const cacheStats = await cacheProvider.getStats();
      if (cacheStats) {
        health.dependencies.cache.stats = cacheStats;
      }
      
    } catch (error) {
      health.dependencies.cache = {
        status: 'unhealthy',
        responseTime: Date.now() - cacheStart,
        error: error.message,
        connection: 'failed'
      };
      health.status = 'degraded';
    }

    // System checks
    health.checks = {
      memory: health.memory.heapUsed > 500 ? 'warning' : 'healthy',
      uptime: health.uptime > 0 ? 'healthy' : 'unhealthy',
      environment: config.NODE_ENV === 'production' ? 'production' : 'development'
    };

    // CPU usage (if available)
    if (process.cpuUsage) {
      const cpuUsage = process.cpuUsage();
      health.cpu = {
        user: cpuUsage.user,
        system: cpuUsage.system
      };
    }

    health.responseTime = Date.now() - startTime;

    // Determine overall status
    const hasUnhealthy = Object.values(health.dependencies).some(dep => dep.status === 'unhealthy');
    const hasWarning = Object.values(health.checks).some(check => check === 'warning');

    if (hasUnhealthy) {
      health.status = 'degraded';
    } else if (hasWarning) {
      health.status = 'warning';
    }

    // Determine HTTP status code
    let statusCode = 200;
    if (health.status === 'degraded') {
      statusCode = 503;
    }

    res.status(statusCode).json(health);

  } catch (error) {
    console.error('Detailed health check error:', error);
    
    res.status(503).json({
      service: 'WOLO User Management Service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime
    });
  }
});

/**
 * @route GET /health/ready
 * @desc Kubernetes readiness probe
 * @access Public
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if service is ready to accept requests
    await databaseProvider.healthCheck();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'WOLO User Management Service'
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      service: 'WOLO User Management Service',
      error: error.message
    });
  }
});

/**
 * @route GET /health/live
 * @desc Kubernetes liveness probe
 * @access Public
 */
router.get('/live', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'WOLO User Management Service',
    uptime: process.uptime()
  });
});

module.exports = router;