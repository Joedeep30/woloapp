
// Gestionnaire de sortie forcée pour le build - SOLUTION ULTIME

let exitForced = false;

export function forceImmediateExit() {
  if (exitForced) return;
  exitForced = true;
  
  // Sortie immédiate sans aucun nettoyage
  if (typeof process !== 'undefined' && process.exit) {
    process.exit(0);
  }
}

// Timer de sécurité ultime
if (typeof process !== 'undefined') {
  setTimeout(() => {
    if (!exitForced) {
      console.log('Timer de sécurité ultime - sortie forcée');
      forceImmediateExit();
    }
  }, 5000); // 5 secondes maximum
  
  // Gestionnaire ultra-simple
  const ultimateExitHandler = () => {
    forceImmediateExit();
  };
  
  // Enregistrer une seule fois
  process.once('SIGINT', ultimateExitHandler);
  process.once('SIGTERM', ultimateExitHandler);
}
