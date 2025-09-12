
// Gestionnaire spécialisé pour forcer la sortie du processus de build - SOLUTION FINALE

let buildExitTriggered = false;
let buildExitTimer: NodeJS.Timeout | null = null;

export function forceBuildProcessExit() {
  if (buildExitTriggered) return;
  buildExitTriggered = true;
  
  try {
    // Nettoyer le timer immédiatement
    if (buildExitTimer) {
      clearTimeout(buildExitTimer);
      buildExitTimer = null;
    }
    
    // Forcer la sortie IMMÉDIATEMENT sans nettoyage
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(0);
    }
  } catch (error) {
    // En cas d'erreur, forcer la sortie avec code d'erreur
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  }
}

// Configuration pour le build uniquement
if (typeof process !== 'undefined') {
  // Timer de sécurité ULTRA COURT pour le build
  buildExitTimer = setTimeout(() => {
    console.log('Build process timeout - sortie forcée');
    forceBuildProcessExit();
  }, 6000); // 6 secondes maximum

  // Gestionnaire unique et simple
  const simpleExitHandler = () => {
    forceBuildProcessExit();
  };

  // Enregistrer UNE SEULE FOIS
  process.once('SIGINT', simpleExitHandler);
  process.once('SIGTERM', simpleExitHandler);
  process.once('exit', simpleExitHandler);
  process.once('beforeExit', simpleExitHandler);
}
