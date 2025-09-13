// =====================================================
// WOLO POT MANAGEMENT SERVICE - Entry Point
// Birthday pot creation, management, and discovery
// =====================================================

const PotManagementApp = require('./src/app');

// Create and start the pot management service
const app = new PotManagementApp();

app.start().catch(error => {
  console.error('💥 Failed to start Pot Management Service:', error);
  process.exit(1);
});

// Export for testing purposes
module.exports = app;