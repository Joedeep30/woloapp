
// Handler de sortie ultra-simplifié pour éviter les boucles

let exitHandled = false;

if (typeof process !== 'undefined' && !exitHandled) {
  exitHandled = true;
  
  const simpleExit = () => {
    if (typeof process !== 'undefined') {
      process.exit(0);
    }
  };
  
  // Handler unique et simple
  process.on('SIGINT', simpleExit);
  process.on('SIGTERM', simpleExit);
  process.on('beforeExit', simpleExit);
  
  // Timeout de sécurité pour forcer la sortie
  if (process.env.NODE_ENV === 'production' || process.argv.includes('build')) {
    setTimeout(() => {
      console.log('Timeout de build - Sortie forcée');
      process.exit(0);
    }, 120000); // 2 minutes max
  }
}
