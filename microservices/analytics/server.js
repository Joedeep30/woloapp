// =====================================================
// WOLO ANALYTICS SERVICE - Entry Point
// Privacy-first analytics with powerful insights
// =====================================================

const AnalyticsApp = require('./src/app');

// Create and start the analytics service
const app = new AnalyticsApp();

app.start().catch(error => {
  console.error('💥 Failed to start Analytics Service:', error);
  process.exit(1);
});

// Export for testing purposes
module.exports = app;