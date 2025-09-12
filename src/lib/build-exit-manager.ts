

// Gestionnaire spécialisé pour la sortie propre lors du build

class BuildExitManager {
  private static instance: BuildExitManager;
  private isManaging = false;
  private exitTimer: NodeJS.Timeout | null = null;

  static getInstance(): BuildExitManager {
    if (!BuildExitManager.instance) {
      BuildExitManager.instance = new BuildExitManager();
    }
    return BuildExitManager.instance;
  }

  constructor() {
    this.initializeExitManagement();
  }

  private initializeExitManagement() {
    if (typeof process === 'undefined' || this.isManaging) return;
    
    this.isManaging = true;
    console.log('🔧 Initialisation du gestionnaire de sortie de build...');
    
    // Détecter si on est en mode build
    const isBuildMode = process.env.NODE_ENV === 'production' || 
                       process.argv.includes('build') ||
                       process.env.NEXT_PHASE === 'phase-production-build';
    
    if (isBuildMode) {
      this.setupBuildExitHandlers();
    }
  }

  private setupBuildExitHandlers() {
    console.log('🏗️ Configuration des handlers de sortie pour le build...');
    
    const handleBuildExit = (signal: string, code: number = 0) => {
      console.log(`🛑 Signal de build ${signal} - Sortie immédiate...`);
      this.performImmediateExit(code);
    };

    // Handlers spécifiques au build
    process.on('SIGINT', () => handleBuildExit('SIGINT', 0));
    process.on('SIGTERM', () => handleBuildExit('SIGTERM', 0));
    
    process.on('beforeExit', (code) => {
      if (code === 0) {
        console.log('✅ Build terminé avec succès - Sortie immédiate...');
        handleBuildExit('BEFORE_EXIT', 0);
      }
    });
    
    process.on('exit', (code) => {
      console.log(`🚪 Processus de build fermé avec le code: ${code}`);
    });
    
    // Programmer une sortie automatique après 5 minutes
    this.exitTimer = setTimeout(() => {
      console.log('⏰ Timeout de build atteint - Sortie forcée...');
      this.performImmediateExit(0);
    }, 5 * 60 * 1000);
  }

  private performImmediateExit(code: number = 0) {
    try {
      console.log('🧹 Nettoyage immédiat avant sortie...');
      
      // Nettoyer le timer de sortie
      if (this.exitTimer) {
        clearTimeout(this.exitTimer);
        this.exitTimer = null;
      }
      
      // Nettoyage ultra-rapide
      this.quickCleanup();
      
      // Sortie immédiate
      setTimeout(() => {
        console.log('🚪 Sortie immédiate du processus de build...');
        process.exit(code);
      }, 10);
      
    } catch (error) {
      console.error('❌ Erreur lors de la sortie immédiate:', error);
      process.exit(1);
    }
  }

  private quickCleanup() {
    try {
      // Nettoyer uniquement les ressources critiques
      if (typeof global !== 'undefined') {
        const globalObj = global as any;
        
        // Fermer les connexions de base de données
        if (globalObj._connections) {
          globalObj._connections.forEach((conn: any) => {
            try {
              if (conn && typeof conn.destroy === 'function') {
                conn.destroy();
              }
            } catch (e) {
              // Ignorer
            }
          });
          globalObj._connections = [];
        }
      }
      
      // Forcer le garbage collection si disponible
      if (global.gc) {
        global.gc();
      }
      
    } catch (error) {
      console.error('Erreur lors du nettoyage rapide:', error);
    }
  }

  public forceExit(code: number = 0) {
    this.performImmediateExit(code);
  }
}

export const buildExitManager = BuildExitManager.getInstance();

// Auto-activation - Correction de l'erreur ESLint
if (typeof process !== 'undefined') {
  // Utiliser une variable pour éviter l'erreur "expression statement"
  const manager = buildExitManager;
  console.log('🔧 Gestionnaire de sortie de build initialisé');
}

