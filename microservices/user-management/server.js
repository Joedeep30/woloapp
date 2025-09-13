const app = require('./src/app');
const config = require('../shared/config');
const databaseProvider = require('../shared/providers/database');
const cacheProvider = require('../shared/providers/cache');

const PORT = config.SERVICES.USER_MANAGEMENT.PORT;

async function startServer() {
  try {
    console.log('🚀 Starting WOLO User Management Service...');
    
    // Initialize database connection
    console.log('📦 Initializing database connection...');
    await databaseProvider.initialize();
    
    // Initialize cache connection
    console.log('🗄️  Initializing cache connection...');
    await cacheProvider.initialize();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`✅ User Management Service running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Authentication endpoints: http://localhost:${PORT}/auth`);
      console.log(`👤 Profile endpoints: http://localhost:${PORT}/profile`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log('=' .repeat(60));
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n📥 Received ${signal}. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          // Close database connections
          await databaseProvider.close();
          console.log('📦 Database connections closed');
          
          // Close cache connections
          await cacheProvider.close();
          console.log('🗄️  Cache connections closed');
          
          console.log('✅ Graceful shutdown completed');
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
    console.error('❌ Failed to start User Management Service:', error);
    process.exit(1);
  }
}

startServer();