
// Nettoyage spécifique pour les composants serveur

export function cleanupServerResources() {
  try {
    // Nettoyer les ressources serveur spécifiques
    if (typeof global !== 'undefined') {
      const globalObj = global as any;
      
      // Nettoyer les caches
      if (globalObj._serverCache) {
        globalObj._serverCache.clear?.();
        delete globalObj._serverCache;
      }
      
      // Nettoyer les connexions de base de données
      if (globalObj._dbConnections) {
        globalObj._dbConnections.forEach((conn: any) => {
          try {
            conn.end?.();
            conn.destroy?.();
          } catch (e) {
            // Ignorer les erreurs
          }
        });
        delete globalObj._dbConnections;
      }
      
      // Nettoyer les workers
      if (globalObj._workers) {
        globalObj._workers.forEach((worker: any) => {
          try {
            worker.terminate?.();
          } catch (e) {
            // Ignorer les erreurs
          }
        });
        delete globalObj._workers;
      }
    }
    
    console.log('🧹 Ressources serveur nettoyées');
  } catch (error) {
    console.error('Erreur lors du nettoyage des ressources serveur:', error);
  }
}

// Auto-nettoyage lors de la fermeture du serveur
if (typeof process !== 'undefined') {
  process.on('SIGTERM', cleanupServerResources);
  process.on('SIGINT', cleanupServerResources);
  process.on('exit', cleanupServerResources);
}
