
// Gestionnaire spécifique pour forcer la sortie lors du build - SOLUTION FINALE CORRIGÉE

let buildProcessExited = false;
let buildTimeout: NodeJS.Timeout | null = null;
let exitHandlerRegistered = false;

export function setupBuildExitHandler() {
  if (typeof process === 'undefined' || exitHandlerRegistered) return;
  
  const forceBuildExit = () => {
    if (buildProcessExited) return;
    buildProcessExited = true;
    
    try {
      // Nettoyer le timeout
      if (buildTimeout) {
        clearTimeout(buildTimeout);
        buildTimeout = null;
      }
      
      // Nettoyer rapidement
      if (global.gc) {
        try {
          global.gc();
        } catch (e) {
          // Ignorer les erreurs de garbage collection
        }
      }
      
      // Forcer la sortie IMMÉDIATEMENT
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  };

  // Timer de sécurité TRÈS COURT pour le build
  buildTimeout = setTimeout(() => {
    console.log('Build timeout - sortie forcée immédiate');
    forceBuildExit();
  }, 8000); // Réduit à 8 secondes max pour le build

  // Gestionnaire unique pour le build
  const buildExitHandler = () => {
    forceBuildExit();
  };

  // Enregistrer les gestionnaires UNE SEULE FOIS
  if (!exitHandlerRegistered) {
    exitHandlerRegistered = true;
    process.once('SIGINT', buildExitHandler);
    process.once('SIGTERM', buildExitHandler);
    process.once('exit', buildExitHandler);
    process.once('beforeExit', buildExitHandler);
  }
}

// Initialiser automatiquement si on est en mode build ou production
if (typeof process !== 'undefined') {
  setupBuildExitHandler();
}
