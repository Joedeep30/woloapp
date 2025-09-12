
#!/usr/bin/env node

// Script pour forcer la sortie du processus de build

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Script de sortie forcée pour le build...');

function forceKillProcesses() {
  try {
    console.log('🛑 Arrêt forcé de tous les processus Node.js...');
    
    if (process.platform === 'win32') {
      // Windows
      try {
        execSync('taskkill /f /im node.exe /t', { stdio: 'ignore' });
        execSync('taskkill /f /im "next-server" /t', { stdio: 'ignore' });
      } catch (e) {
        // Ignorer les erreurs
      }
    } else {
      // Unix/Linux/macOS
      try {
        execSync('pkill -f "next" || true', { stdio: 'ignore' });
        execSync('pkill -f "node.*next" || true', { stdio: 'ignore' });
        execSync('pkill -f "webpack" || true', { stdio: 'ignore' });
        execSync('pkill -f "turbopack" || true', { stdio: 'ignore' });
      } catch (e) {
        // Ignorer les erreurs
      }
    }
    
    console.log('✅ Processus forcés à se terminer');
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt forcé:', error);
  }
}

function cleanupBuildArtifacts() {
  try {
    console.log('🧹 Nettoyage des artefacts de build...');
    
    const pathsToClean = [
      '.next/cache',
      '.next/server',
      '.next/static',
      'node_modules/.cache',
      '.turbo'
    ];
    
    pathsToClean.forEach(dirPath => {
      try {
        if (fs.existsSync(dirPath)) {
          console.log(`🗑️ Nettoyage de ${dirPath}...`);
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      } catch (error) {
        console.warn(`⚠️ Impossible de nettoyer ${dirPath}:`, error.message);
      }
    });
    
    console.log('✅ Artefacts de build nettoyés');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

function main() {
  try {
    // Nettoyer les artefacts
    cleanupBuildArtifacts();
    
    // Attendre un peu
    setTimeout(() => {
      // Forcer l'arrêt des processus
      forceKillProcesses();
      
      // Sortir du script
      setTimeout(() => {
        console.log('🚪 Script de sortie forcée terminé');
        process.exit(0);
      }, 1000);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erreur dans le script de sortie forcée:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();

// Forcer la sortie après 10 secondes maximum
setTimeout(() => {
  console.log('⏰ Timeout du script - Sortie forcée');
  process.exit(0);
}, 10000);
