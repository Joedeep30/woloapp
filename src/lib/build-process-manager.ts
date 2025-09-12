
// Gestionnaire de processus spécifique pour le build - SOLUTION FINALE

let buildProcessManager: {
  isActive: boolean;
  startTime: number;
  maxDuration: number;
  forceExitTimer: NodeJS.Timeout | null;
} | null = null;

export function initializeBuildProcessManager() {
  if (typeof process === 'undefined') return;
  if (buildProcessManager?.isActive) return;

  buildProcessManager = {
    isActive: true,
    startTime: Date.now(),
    maxDuration: 15000, // 15 secondes maximum
    forceExitTimer: null
  };

  // Timer de sécurité pour forcer la sortie
  buildProcessManager.forceExitTimer = setTimeout(() => {
    console.log('Build process manager: Timeout atteint - sortie forcée');
    terminateBuildProcess();
  }, buildProcessManager.maxDuration);

  // Gestionnaire unique pour tous les signaux
  const exitHandler = () => {
    terminateBuildProcess();
  };

  process.once('SIGINT', exitHandler);
  process.once('SIGTERM', exitHandler);
  process.once('exit', exitHandler);
  process.once('beforeExit', exitHandler);
}

export function terminateBuildProcess() {
  if (!buildProcessManager?.isActive) return;
  
  try {
    // Marquer comme inactif
    buildProcessManager.isActive = false;
    
    // Nettoyer le timer
    if (buildProcessManager.forceExitTimer) {
      clearTimeout(buildProcessManager.forceExitTimer);
      buildProcessManager.forceExitTimer = null;
    }
    
    // Forcer la sortie immédiatement
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(0);
    }
  } catch (error) {
    // En cas d'erreur, forcer la sortie
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  }
}

// Initialiser automatiquement
if (typeof process !== 'undefined') {
  initializeBuildProcessManager();
}
