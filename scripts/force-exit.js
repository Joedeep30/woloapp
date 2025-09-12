
#!/usr/bin/env node

// Script pour forcer la sortie du processus en cas de blocage

const { execSync } = require('child_process');

console.log('🔄 Script de sortie forcée...');

try {
  // Attendre un peu pour laisser le temps au processus de se terminer naturellement
  setTimeout(() => {
    console.log('⏰ Timeout atteint - Sortie forcée...');
    
    try {
      // Tuer tous les processus Node.js liés au projet
      if (process.platform === 'win32') {
        execSync('taskkill /f /im node.exe /t', { stdio: 'ignore' });
      } else {
        execSync('pkill -f "next" || true', { stdio: 'ignore' });
        execSync('pkill -f "node.*next" || true', { stdio: 'ignore' });
      }
    } catch (error) {
      // Ignorer les erreurs de kill
    }
    
    console.log('✅ Processus forcés à se terminer');
    process.exit(0);
  }, 5000); // 5 secondes
  
} catch (error) {
  console.error('❌ Erreur dans le script de sortie forcée:', error);
  process.exit(1);
}
