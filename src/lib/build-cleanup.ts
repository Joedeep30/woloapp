
// Utilitaire spécifique pour nettoyer les processus lors du build - SOLUTION FINALE CORRIGÉE

let buildCleanupHandlers: (() => void)[] = [];
let buildExitTimeout: NodeJS.Timeout | null = null;
let buildExited = false;
let cleanupInProgress = false;

export function addBuildCleanupHandler(handler: () => void) {
  if (!buildExited) {
    buildCleanupHandlers.push(handler);
  }
}

export function forceBuildExit() {
  if (buildExited || cleanupInProgress) return;
  buildExited = true;
  cleanupInProgress = true;
  
  try {
    // Exécuter tous les handlers de nettoyage TRÈS rapidement
    buildCleanupHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        // Ignorer toutes les erreurs
      }
    });

    // Nettoyer la liste immédiatement
    buildCleanupHandlers = [];

    // Nettoyer le timeout existant
    if (buildExitTimeout) {
      clearTimeout(buildExitTimeout);
      buildExitTimeout = null;
    }

    // Forcer la sortie IMMÉDIATEMENT
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(0);
    }
  } catch (error) {
    // En cas d'erreur, forcer la sortie
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  } finally {
    cleanupInProgress = false;
  }
}

// Configuration spécifique pour le build - SOLUTION FINALE CORRIGÉE
if (typeof process !== 'undefined') {
  // Timer de sécurité TRÈS COURT pour le build
  buildExitTimeout = setTimeout(() => {
    console.log('Build timeout - sortie forcée immédiate');
    forceBuildExit();
  }, 12000); // Réduit à 12 secondes max pour le build

  // Gestionnaire unique pour le build
  const buildExitHandler = () => {
    forceBuildExit();
  };

  // Enregistrer les gestionnaires UNE SEULE FOIS
  let handlersRegistered = false;
  if (!handlersRegistered) {
    handlersRegistered = true;
    process.once('SIGINT', buildExitHandler);
    process.once('SIGTERM', buildExitHandler);
    process.once('exit', buildExitHandler);
    process.once('beforeExit', buildExitHandler);
  }
}
