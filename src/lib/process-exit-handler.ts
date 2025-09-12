
// Handler global pour forcer la sortie propre du processus lors du build

let exitHandlerRegistered = false;
let isExiting = false;

export function registerProcessExitHandler() {
  if (exitHandlerRegistered || typeof process === 'undefined') {
    return;
  }
  
  exitHandlerRegistered = true;
  console.log('🔧 Enregistrement du handler de sortie global...');
  
  const forceExit = (signal: string, code: number = 0) => {
    if (isExiting) {
      return;
    }
    
    isExiting = true;
    console.log(`🛑 Signal ${signal} reçu - Nettoyage et sortie forcée...`);
    
    try {
      // Nettoyer rapidement les ressources critiques
      cleanupResources();
      
      // Forcer la sortie après un délai minimal
      setTimeout(() => {
        console.log('🚪 Sortie forcée du processus...');
        process.exit(code);
      }, 100);
      
    } catch (error) {
      console.error('❌ Erreur lors de la sortie:', error);
      process.exit(1);
    }
  };
  
  // Enregistrer les handlers pour tous les signaux
  process.on('SIGINT', () => forceExit('SIGINT', 0));
  process.on('SIGTERM', () => forceExit('SIGTERM', 0));
  process.on('SIGUSR1', () => forceExit('SIGUSR1', 0));
  process.on('SIGUSR2', () => forceExit('SIGUSR2', 0));
  
  // Handler pour les erreurs non gérées
  process.on('uncaughtException', (error) => {
    console.error('💥 Exception non gérée:', error);
    forceExit('UNCAUGHT_EXCEPTION', 1);
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('💥 Promesse rejetée:', reason);
    forceExit('UNHANDLED_REJECTION', 1);
  });
  
  // Handler pour beforeExit
  process.on('beforeExit', (code) => {
    console.log(`🚪 beforeExit avec code: ${code}`);
    if (code === 0) {
      forceExit('BEFORE_EXIT', 0);
    }
  });
  
  // Handler pour exit
  process.on('exit', (code) => {
    console.log(`🚪 Processus fermé avec code: ${code}`);
  });
  
  console.log('✅ Handler de sortie global configuré');
}

function cleanupResources() {
  try {
    console.log('🧹 Nettoyage des ressources...');
    
    if (typeof global !== 'undefined') {
      const globalObj = global as any;
      
      // Fermer toutes les connexions actives
      if (globalObj._activeConnections) {
        globalObj._activeConnections.forEach((conn: any) => {
          try {
            if (conn && typeof conn.destroy === 'function') {
              conn.destroy();
            }
            if (conn && typeof conn.close === 'function') {
              conn.close();
            }
            if (conn && typeof conn.end === 'function') {
              conn.end();
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
      
      // Nettoyer les handles Node.js - VERSION CORRIGÉE POUR TYPESCRIPT
      try {
        const processAny = process as any;
        if (typeof processAny._getActiveHandles === 'function') {
          const handles = processAny._getActiveHandles();
          if (Array.isArray(handles)) {
            handles.forEach((handle: any) => {
              try {
                if (handle && typeof handle.close === 'function') {
                  handle.close();
                }
                if (handle && typeof handle.unref === 'function') {
                  handle.unref();
                }
              } catch (e) {
                // Ignorer les erreurs
              }
            });
          }
        }
      } catch (e) {
        // Ignorer les erreurs si la méthode n'existe pas
        console.log('ℹ️ _getActiveHandles non disponible, ignoré');
      }
      
      // Nettoyer les requests actives - VERSION CORRIGÉE POUR TYPESCRIPT
      try {
        const processAny = process as any;
        if (typeof processAny._getActiveRequests === 'function') {
          const requests = processAny._getActiveRequests();
          if (Array.isArray(requests)) {
            requests.forEach((request: any) => {
              try {
                if (request && typeof request.abort === 'function') {
                  request.abort();
                }
                if (request && typeof request.destroy === 'function') {
                  request.destroy();
                }
              } catch (e) {
                // Ignorer les erreurs
              }
            });
          }
        }
      } catch (e) {
        // Ignorer les erreurs si la méthode n'existe pas
        console.log('ℹ️ _getActiveRequests non disponible, ignoré');
      }
    }
    
    console.log('✅ Ressources nettoyées');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Auto-configuration
if (typeof process !== 'undefined') {
  registerProcessExitHandler();
}
