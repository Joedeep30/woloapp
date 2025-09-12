
// Handler global pour forcer la sortie propre du processus

let exitInProgress = false;

export function setupGlobalExitHandler() {
  if (typeof process === 'undefined' || exitInProgress) {
    return;
  }
  
  console.log('🔧 Configuration du handler de sortie global...');
  
  const handleExit = (signal: string, code: number = 0) => {
    if (exitInProgress) {
      return;
    }
    
    exitInProgress = true;
    console.log(`🛑 Signal ${signal} reçu - Sortie en cours...`);
    
    try {
      // Nettoyer rapidement les ressources critiques
      if (typeof global !== 'undefined') {
        const globalObj = global as any;
        
        // Fermer toutes les connexions actives
        if (globalObj._activeConnections) {
          globalObj._activeConnections.forEach((conn: any) => {
            try {
              if (conn && typeof conn.destroy === 'function') {
                conn.destroy();
              }
            } catch (e) {
              // Ignorer les erreurs
            }
          });
          globalObj._activeConnections = [];
        }
        
        // Nettoyer les timers actifs
        if (globalObj._activeTimers) {
          globalObj._activeTimers.forEach((timer: any) => {
            try {
              clearTimeout(timer);
              clearInterval(timer);
            } catch (e) {
              // Ignorer les erreurs
            }
          });
          globalObj._activeTimers = [];
        }
      }
      
      // Forcer la sortie après un délai minimal
      setTimeout(() => {
        console.log('🚪 Sortie forcée du processus...');
        process.exit(code);
      }, 10);
      
    } catch (error) {
      console.error('❌ Erreur lors de la sortie:', error);
      process.exit(1);
    }
  };
  
  // Enregistrer les handlers pour tous les signaux
  process.on('SIGINT', () => handleExit('SIGINT', 0));
  process.on('SIGTERM', () => handleExit('SIGTERM', 0));
  process.on('SIGUSR1', () => handleExit('SIGUSR1', 0));
  process.on('SIGUSR2', () => handleExit('SIGUSR2', 0));
  
  // Handler pour les erreurs non gérées
  process.on('uncaughtException', (error) => {
    console.error('💥 Exception non gérée:', error);
    handleExit('UNCAUGHT_EXCEPTION', 1);
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('💥 Promesse rejetée:', reason);
    handleExit('UNHANDLED_REJECTION', 1);
  });
  
  // Handler pour beforeExit
  process.on('beforeExit', (code) => {
    console.log(`🚪 beforeExit avec code: ${code}`);
    if (code === 0) {
      handleExit('BEFORE_EXIT', 0);
    }
  });
  
  // Handler pour exit
  process.on('exit', (code) => {
    console.log(`🚪 Processus fermé avec code: ${code}`);
  });
  
  console.log('✅ Handler de sortie global configuré');
}

// Auto-configuration
setupGlobalExitHandler();
