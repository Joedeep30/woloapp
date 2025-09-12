
// Gestionnaire de connexions pour éviter les fuites

class ConnectionManager {
  private static instance: ConnectionManager;
  private connections: Set<any> = new Set();
  private timers: Set<any> = new Set();
  private isShuttingDown = false;
  private shutdownTimer: NodeJS.Timeout | null = null;

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  addConnection(connection: any) {
    if (!this.isShuttingDown) {
      this.connections.add(connection);
    }
  }

  removeConnection(connection: any) {
    this.connections.delete(connection);
  }

  addTimer(timer: any) {
    if (!this.isShuttingDown) {
      this.timers.add(timer);
    }
  }

  removeTimer(timer: any) {
    this.timers.delete(timer);
  }

  shutdown() {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log('🧹 Fermeture du gestionnaire de connexions...');
    
    try {
      // Fermer toutes les connexions rapidement
      this.connections.forEach(connection => {
        try {
          if (connection && typeof connection.close === 'function') {
            connection.close();
          }
          if (connection && typeof connection.destroy === 'function') {
            connection.destroy();
          }
          if (connection && typeof connection.end === 'function') {
            connection.end();
          }
        } catch (error) {
          // Ignorer les erreurs de fermeture
        }
      });
      
      // Nettoyer tous les timers rapidement
      this.timers.forEach(timer => {
        try {
          clearTimeout(timer);
          clearInterval(timer);
        } catch (error) {
          // Ignorer les erreurs
        }
      });
      
      this.connections.clear();
      this.timers.clear();
      
      console.log('✅ Gestionnaire de connexions fermé');
      
      // Programmer la sortie forcée
      if (this.shutdownTimer) {
        clearTimeout(this.shutdownTimer);
      }
      
      this.shutdownTimer = setTimeout(() => {
        console.log('🚪 Sortie forcée après fermeture du gestionnaire...');
        if (typeof process !== 'undefined') {
          process.exit(0);
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Erreur lors de la fermeture:', error);
      if (typeof process !== 'undefined') {
        process.exit(1);
      }
    }
  }
}

export const connectionManager = ConnectionManager.getInstance();

// Enregistrer le nettoyage automatique avec sortie forcée
if (typeof process !== 'undefined') {
  let exitHandlerRegistered = false;
  
  const registerExitHandler = () => {
    if (exitHandlerRegistered) return;
    exitHandlerRegistered = true;
    
    process.on('exit', () => {
      connectionManager.shutdown();
    });
    
    process.on('SIGINT', () => {
      connectionManager.shutdown();
    });
    
    process.on('SIGTERM', () => {
      connectionManager.shutdown();
    });
    
    process.on('beforeExit', () => {
      connectionManager.shutdown();
    });
    
    process.on('uncaughtException', (error) => {
      console.error('💥 Exception critique:', error);
      connectionManager.shutdown();
    });
    
    process.on('unhandledRejection', (reason) => {
      console.error('💥 Promesse rejetée:', reason);
      connectionManager.shutdown();
    });
  };
  
  registerExitHandler();
}
