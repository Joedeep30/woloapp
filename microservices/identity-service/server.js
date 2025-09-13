// =====================================================
// WOLO IDENTITY SERVICE - Entry Point
// Identity verification and security management
// =====================================================

// Check if the service has an app.js file
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'app.js');

if (fs.existsSync(appPath)) {
  const IdentityApp = require('./src/app');
  
  // Create and start the identity service
  const app = new IdentityApp();
  
  app.start().catch(error => {
    console.error('💥 Failed to start Identity Service:', error);
    process.exit(1);
  });
  
  module.exports = app;
} else {
  // Fallback basic server for identity service
  const express = require('express');
  const app = express();
  const PORT = process.env.IDENTITY_PORT || 3006;
  
  app.use(express.json());
  
  app.get('/health', (req, res) => {
    res.json({
      service: 'identity-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      message: 'Basic identity service running - needs full implementation'
    });
  });
  
  app.get('/', (req, res) => {
    res.json({
      service: 'WOLO Identity Service',
      message: 'Identity verification and security! 🆔🔒',
      version: '1.0.0',
      status: 'basic implementation'
    });
  });
  
  app.listen(PORT, () => {
    console.log(`🆔 Identity Service running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log('⚠️  Note: This is a basic implementation - full service needs to be built');
  });
  
  module.exports = app;
}