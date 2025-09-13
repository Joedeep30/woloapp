const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Service configuration
const services = [
  {
    name: 'API Gateway',
    script: 'server.js',
    directory: 'api-gateway',
    port: 3000,
    color: colors.cyan,
    emoji: '🌐'
  },
  {
    name: 'User Management',
    script: 'server.js', 
    directory: 'user-management',
    port: 3001,
    color: colors.blue,
    emoji: '👤'
  },
  {
    name: 'Pot Management',
    script: 'server.js',
    directory: 'pot-management', 
    port: 3002,
    color: colors.green,
    emoji: '🎁'
  },
  {
    name: 'Sponsorship Service',
    script: 'server.js',
    directory: 'sponsorship-service',
    port: 3003, 
    color: colors.yellow,
    emoji: '🤝'
  },
  {
    name: 'Payment Service',
    script: 'server.js',
    directory: 'payment-service',
    port: 3004,
    color: colors.magenta,
    emoji: '💳'
  },
  {
    name: 'Notification Service',
    script: 'server.js',
    directory: 'notification-service',
    port: 3005,
    color: colors.red,
    emoji: '📢'
  },
  {
    name: 'Identity Verification',
    script: 'server.js',
    directory: 'identity-service',
    port: 3006,
    color: colors.bright + colors.blue,
    emoji: '🆔'
  },
  {
    name: 'Analytics Service',
    script: 'server.js',
    directory: 'analytics-service',
    port: 3007,
    color: colors.bright + colors.green,
    emoji: '📈'
  }
];

// Track running processes
const processes = new Map();

/**
 * Start a single service
 */
function startService(service) {
  return new Promise((resolve, reject) => {
    const servicePath = path.join(__dirname, service.directory);
    const scriptPath = path.join(servicePath, service.script);
    
    console.log(`${service.color}${service.emoji} Starting ${service.name}...${colors.reset}`);
    
    const childProcess = spawn('node', [scriptPath], {
      cwd: servicePath,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Store process reference
    processes.set(service.name, {
      process: childProcess,
      service: service,
      started: false
    });

    // Handle process output
    childProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${service.color}[${service.emoji} ${service.name}]${colors.reset} ${output}`);
        
        // Check if service has started successfully
        if (output.includes(`running on port ${service.port}`) && !processes.get(service.name).started) {
          processes.get(service.name).started = true;
          resolve(service);
        }
      }
    });

    childProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        console.error(`${service.color}[${service.emoji} ${service.name}] ERROR:${colors.reset} ${colors.red}${error}${colors.reset}`);
      }
    });

    // Handle process exit
    childProcess.on('exit', (code, signal) => {
      console.log(`${service.color}${service.emoji} ${service.name} exited with code ${code} (signal: ${signal})${colors.reset}`);
      processes.delete(service.name);
    });

    // Handle process errors
    childProcess.on('error', (error) => {
      console.error(`${service.color}${service.emoji} Failed to start ${service.name}:${colors.reset} ${colors.red}${error.message}${colors.reset}`);
      reject(error);
    });

    // Timeout after 30 seconds if service doesn't start
    setTimeout(() => {
      if (!processes.get(service.name)?.started) {
        reject(new Error(`${service.name} failed to start within timeout`));
      }
    }, 30000);
  });
}

/**
 * Start all services
 */
async function startAllServices() {
  console.log(`${colors.bright}${colors.cyan}🚀 Starting WOLO Microservices Architecture${colors.reset}`);
  console.log(`${colors.bright}===============================================${colors.reset}`);
  console.log('');

  // Check if Node.js dependencies are installed
  console.log(`${colors.yellow}⚠️  Note: Make sure to run 'npm install' in each service directory first!${colors.reset}`);
  console.log('');

  const startTime = Date.now();
  const results = [];

  try {
    // Start API Gateway first (it's the entry point)
    const gateway = services.find(s => s.name === 'API Gateway');
    if (gateway) {
      await startService(gateway);
      results.push(gateway);
      console.log(`${colors.green}✅ ${gateway.emoji} ${gateway.name} started successfully${colors.reset}`);
    }

    // Start other services in parallel (but wait a bit for gateway to be ready)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const otherServices = services.filter(s => s.name !== 'API Gateway');
    const servicePromises = otherServices.map(async (service) => {
      try {
        await startService(service);
        results.push(service);
        console.log(`${colors.green}✅ ${service.emoji} ${service.name} started successfully${colors.reset}`);
        return service;
      } catch (error) {
        console.error(`${colors.red}❌ Failed to start ${service.name}: ${error.message}${colors.reset}`);
        throw error;
      }
    });

    await Promise.all(servicePromises);

    // All services started successfully
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('');
    console.log(`${colors.bright}${colors.green}🎉 All services started successfully in ${duration}s!${colors.reset}`);
    console.log(`${colors.bright}===============================================${colors.reset}`);
    console.log('');
    console.log(`${colors.bright}📋 Service Status:${colors.reset}`);
    
    results.forEach(service => {
      console.log(`   ${service.color}${service.emoji} ${service.name.padEnd(20)} - http://localhost:${service.port}${colors.reset}`);
    });

    console.log('');
    console.log(`${colors.bright}🌐 Main Endpoints:${colors.reset}`);
    console.log(`   ${colors.cyan}🚪 API Gateway:     http://localhost:3000${colors.reset}`);
    console.log(`   ${colors.green}❤️  Health Checks:   http://localhost:3000/health${colors.reset}`);
    console.log(`   ${colors.blue}🔍 Service Discovery: http://localhost:3000/services${colors.reset}`);
    console.log('');
    console.log(`${colors.yellow}💡 Tip: All API requests should go through the API Gateway (port 3000)${colors.reset}`);
    console.log(`${colors.yellow}   Example: POST http://localhost:3000/api/users/auth/login${colors.reset}`);
    console.log('');
    console.log(`${colors.red}⏹️  Press Ctrl+C to stop all services${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ Failed to start all services: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Graceful shutdown of all services
 */
function shutdown() {
  console.log(`\n${colors.yellow}📥 Shutting down all services...${colors.reset}`);
  
  let shutdownCount = 0;
  const totalServices = processes.size;

  if (totalServices === 0) {
    console.log(`${colors.green}✅ All services already stopped${colors.reset}`);
    process.exit(0);
  }

  processes.forEach(({ process, service }, name) => {
    console.log(`${service.color}⏹️  Stopping ${service.name}...${colors.reset}`);
    
    // Send SIGTERM for graceful shutdown
    process.kill('SIGTERM');
    
    // Force kill after 10 seconds
    setTimeout(() => {
      if (processes.has(name)) {
        console.log(`${service.color}💀 Force killing ${service.name}${colors.reset}`);
        process.kill('SIGKILL');
      }
    }, 10000);
  });

  // Monitor shutdown progress
  const shutdownInterval = setInterval(() => {
    const remainingServices = processes.size;
    if (remainingServices === 0) {
      clearInterval(shutdownInterval);
      console.log(`${colors.green}✅ All services stopped gracefully${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.yellow}⏳ Waiting for ${remainingServices} services to stop...${colors.reset}`);
    }
  }, 2000);

  // Force exit after 30 seconds
  setTimeout(() => {
    console.log(`${colors.red}⚠️  Force exit after timeout${colors.reset}`);
    process.exit(1);
  }, 30000);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}💥 Uncaught Exception: ${error.message}${colors.reset}`);
  shutdown();
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  console.error(`${colors.red}💥 Unhandled Rejection: ${reason}${colors.reset}`);
  shutdown();
});

// Start the show!
startAllServices().catch((error) => {
  console.error(`${colors.red}💥 Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});