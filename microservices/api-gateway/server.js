const app = require('./src/app');
const config = require('../shared/config');
const cacheProvider = require('../shared/providers/cache');

const PORT = config.API_GATEWAY.PORT;

async function startGateway() {
  try {
    console.log('🚀 Starting WOLO API Gateway...');
    
    // Initialize cache connection
    console.log('🗄️  Initializing cache connection...');
    await cacheProvider.initialize();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`✅ API Gateway running on port ${PORT}`);
      console.log(`🌐 Gateway endpoint: http://localhost:${PORT}`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 Service discovery: http://localhost:${PORT}/services`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log('🎯 Available services:');
      console.log(`   👤 Users: http://localhost:${PORT}/api/users`);
      console.log(`   🎁 Pots: http://localhost:${PORT}/api/pots`);
      console.log(`   🤝 Sponsorship: http://localhost:${PORT}/api/sponsorship`);
      console.log(`   💳 Payments: http://localhost:${PORT}/api/payments`);
      console.log(`   📢 Notifications: http://localhost:${PORT}/api/notifications`);
      console.log(`   🆔 Identity: http://localhost:${PORT}/api/identity`);
      console.log(`   📈 Analytics: http://localhost:${PORT}/api/analytics`);
      console.log('=' .repeat(80));
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n📥 Received ${signal}. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log('🔌 Gateway server closed');
        
        try {
          // Close cache connections
          await cacheProvider.close();
          console.log('🗄️  Cache connections closed');
          
          console.log('✅ Gateway shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.log('⏰ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
}

startGateway();