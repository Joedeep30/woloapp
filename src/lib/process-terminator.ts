

// Terminateur de processus pour forcer la sortie propre

class ProcessTerminator {
  private static instance: ProcessTerminator;
  private isTerminating = false;
  private terminationTimeout: NodeJS.Timeout | null = null;

  static getInstance(): ProcessTerminator {
    if (!ProcessTerminator.instance) {
      ProcessTerminator.instance = new ProcessTerminator();
    }
    return ProcessTerminator.instance;
  }

  constructor() {
    this.setupTerminationHandlers();
  }

  private setupTerminationHandlers() {
    if (typeof process === 'undefined') return;

    const terminate = (signal: string, code: number = 0) => {
      if (this.isTerminating) return;
      
      this.isTerminating = true;
      console.log(`🛑 Terminaison forcée - Signal: ${signal}`);
      
      this.forceTermination(code);
    };

    // Handlers de signaux
    process.on('SIGINT', () => terminate('SIGINT', 0));
    process.on('SIGTERM', () => terminate('SIGTERM', 0));
    process.on('SIGUSR1', () => terminate('SIGUSR1', 0));
    process.on('SIGUSR2', () => terminate('SIGUSR2', 0));
    
    // Handlers d'erreurs
    process.on('uncaughtException', (error) => {
      console.error('💥 Exception critique:', error);
      terminate('UNCAUGHT_EXCEPTION', 1);
    });
    
    process.on('unhandledRejection', (reason) => {
      console.error('💥 Promesse rejetée critique:', reason);
      terminate('UNHANDLED_REJECTION', 1);
    });
    
    // Handler pour beforeExit
    process.on('beforeExit', (code) => {
      console.log(`🚪 beforeExit - Code: ${code}`);
      if (code === 0) {
        terminate('BEFORE_EXIT', 0);
      }
    });
  }

  private forceTermination(exitCode: number = 0) {
    try {
      console.log('🧹 Nettoyage rapide avant terminaison...');
      
      // Nettoyer les ressources critiques rapidement
      this.quickCleanup();
      
      // Programmer la terminaison forcée
      if (this.terminationTimeout) {
        clearTimeout(this.terminationTimeout);
      }
      
      this.terminationTimeout = setTimeout(() => {
        console.log('🚪 Terminaison forcée du processus...');
        
        try {
          // Dernière tentative de nettoyage
          if (global.gc) {
            global.gc();
          }
          
          // Sortie forcée
          process.exit(exitCode);
        } catch (e) {
          console.error('Erreur lors de la terminaison:', e);
          // Sortie d'urgence
          process.kill(process.pid, 'SIGKILL');
        }
      }, 50); // Délai très court
      
    } catch (error) {
      console.error('❌ Erreur lors de la terminaison:', error);
      process.exit(1);
    }
  }

  private quickCleanup() {
    try {
      // Nettoyer les connexions ouvertes
      if (typeof global !== 'undefined') {
        const globalObj = global as any;
        
        // Fermer les connexions de base de données
        if (globalObj._dbConnections) {
          globalObj._dbConnections.forEach((conn: any) => {
            try {
              if (conn && typeof conn.end === 'function') {
                conn.end();
              }
            } catch (e) {
              // Ignorer
            }
          });
          delete globalObj._dbConnections;
        }
        
        // Nettoyer les timers
        if (globalObj._timers) {
          Object.keys(globalObj._timers).forEach(id => {
            try {
              clearTimeout(parseInt(id));
              clearInterval(parseInt(id));
            } catch (e) {
              // Ignorer
            }
          });
          delete globalObj._timers;
        }
      }
      
      // Nettoyer les handles Node.js - VERSION CORRIGÉE POUR TYPESCRIPT
      try {
        const processAny = process as any;
        if (typeof processAny._getActiveHandles === 'function') {
          const handles = processAny._getActiveHandles();
          if (Array.isArray(handles)) {
            handles.forEach((handle: any) => {
              try {
                if (handle && typeof handle.unref === 'function') {
                  handle.unref();
                }
              } catch (e) {
                // Ignorer
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
                // Ignorer
              }
            });
          }
        }
      } catch (e) {
        // Ignorer les erreurs si la méthode n'existe pas
        console.log('ℹ️ _getActiveRequests non disponible, ignoré');
      }
      
      console.log('✅ Nettoyage rapide terminé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage rapide:', error);
    }
  }

  public terminate(exitCode: number = 0) {
    this.forceTermination(exitCode);
  }
}

export const processTerminator = ProcessTerminator.getInstance();

// Auto-activation pour les builds
if (typeof process !== 'undefined') {
  const isBuildProcess = process.env.NODE_ENV === 'production' || 
                        process.argv.includes('build') ||
                        process.env.NEXT_PHASE === 'phase-production-build';
  
  if (isBuildProcess) {
    console.log('🔧 Terminateur de processus activé pour le build');
    
    // Programmer une terminaison automatique après 3 minutes
    setTimeout(() => {
      console.log('⏰ Timeout de build - Terminaison automatique...');
      processTerminator.terminate(0);
    }, 3 * 60 * 1000);
  }
}

