
#!/usr/bin/env node

// Script de nettoyage post-build pour s'assurer que tous les processus se terminent

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Démarrage du nettoyage post-build...');

try {
  // Nettoyer les fichiers temporaires
  const tempDirs = [
    '.next/cache',
    '.next/server/chunks',
    'node_modules/.cache',
    '.turbo'
  ];
  
  tempDirs.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        console.log(`🗑️ Nettoyage de ${dir}...`);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn(`⚠️ Impossible de nettoyer ${dir}:`, error.message);
    }
  });
  
  // Forcer la fermeture des processus Node.js restants
  try {
    console.log('🛑 Arrêt des processus Node.js restants...');
    
    if (process.platform === 'win32') {
      execSync('taskkill /f /im node.exe /t', { stdio: 'ignore' });
      execSync('taskkill /f /im "next-server" /t', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "next-server" || true', { stdio: 'ignore' });
      execSync('pkill -f "webpack" || true', { stdio: 'ignore' });
      execSync('pkill -f "turbopack" || true', { stdio: 'ignore' });
      execSync('pkill -f "node.*build" || true', { stdio: 'ignore' });
    }
  } catch (error) {
    // Ignorer les erreurs de kill
    console.log('ℹ️ Processus déjà fermés ou non trouvés');
  }
  
  console.log('✅ Nettoyage post-build terminé avec succès');
  
  // Forcer la sortie du processus de nettoyage
  setTimeout(() => {
    console.log('🚪 Sortie du script de nettoyage...');
    process.exit(0);
  }, 1000);
  
} catch (error) {
  console.error('❌ Erreur lors du nettoyage post-build:', error);
  
  // Même en cas d'erreur, forcer la sortie
  setTimeout(() => {
    process.exit(1);
  }, 1000);
}

// Timeout de sécurité pour le script de nettoyage
setTimeout(() => {
  console.log('⏰ Timeout du script de nettoyage - Sortie forcée');
  process.exit(0);
}, 10000); // 10 secondes max
