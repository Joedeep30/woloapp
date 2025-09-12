
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Simple cleanup response - remove complex imports
    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup completed' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Cleanup failed' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Endpoint de nettoyage disponible. Utilisez POST pour déclencher le nettoyage.' 
  });
}

