
import { NextRequest, NextResponse } from 'next/server';
import { cleanup, forceProcessExit } from '@/lib/process-cleanup';
import { cleanupServerResources } from '@/lib/server-cleanup';
import { executeBuildCleanup } from '@/lib/build-cleanup';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Démarrage du nettoyage manuel...');
    
    // Exécuter tous les nettoyages
    cleanup();
    cleanupServerResources();
    executeBuildCleanup();
    
    console.log('✅ Nettoyage manuel terminé');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Nettoyage terminé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage manuel:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors du nettoyage' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Endpoint de nettoyage disponible. Utilisez POST pour déclencher le nettoyage.' 
  });
}
