// =====================================================
// WOLO PAYMENT PROCESSING SERVICE - Entry Point
// Wave integration with invisible security + seamless UX
// =====================================================

const PaymentProcessingApp = require('./src/app');

// Create and start the payment processing service
const app = new PaymentProcessingApp();

app.start().catch(error => {
  console.error('💥 Failed to start Payment Processing Service:', error);
  process.exit(1);
});

// Export for testing purposes
module.exports = app;