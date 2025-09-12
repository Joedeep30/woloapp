
// Gestionnaire d'urgence pour forcer la sortie du processus - SOLUTION FINALE CORRIGÉE

let emergencyExitTriggered = false;
let emergencyTimer: NodeJS.Timeout | null = null;

export function triggerEmergencyExit(reason: string = 'Emergency exit triggered') {
  if (emergencyExitTriggered) return;
  emergencyExitTriggered = true;
  
  console.log(`Emergency exit: ${reason}`);
  
  try {
    // Nettoyer le timer d'urgence
    if (emergencyTimer) {
      clearTimeout(emergencyTimer);
      emergencyTimer = null;
    }
    
    // Nettoyer immédiatement sans attendre
    if (typeof global !== 'undefined') {
      // Nettoyer les variables globales
      (global as any).__cleanup = true;
    }
    
    // Forcer la sortie IMMÉDIATEMENT
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

// Auto-déclenchement en cas de timeout global - RÉDUIT
if (typeof process !== 'undefined') {
  // Timer d'urgence global TRÈS COURT
  emergencyTimer = setTimeout(() => {
    if (!emergencyExitTriggered) {
      triggerEmergencyExit('Global timeout reached');
    }
  }, 5000); // Réduit à 5 secondes maximum pour tout le processus
}
