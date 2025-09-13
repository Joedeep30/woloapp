// =====================================================
// WOLO NOTIFICATION SERVICE - Entry Point
// Multi-channel smart notifications with user preferences
// =====================================================

const NotificationApp = require('./src/app');

// Create and start the notification service
const app = new NotificationApp();

app.start().catch(error => {
  console.error('💥 Failed to start Notification Service:', error);
  process.exit(1);
});

// Export for testing purposes
module.exports = app;