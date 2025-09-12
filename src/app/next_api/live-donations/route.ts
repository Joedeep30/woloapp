
import { NextRequest } from 'next/server';
import { requestMiddleware, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    
    if (!potId) {
      return createErrorResponse({
        errorMessage: 'ID de la cagnotte requis',
        status: 400,
      });
    }
    
    const donationsCrud = new CrudOperations('donations', params.token);
    const potsCrud = new CrudOperations('pots', params.token);
    
    // Récupérer la cagnotte pour vérifier les paramètres de visibilité
    const pot = await potsCrud.findById(potId);
    if (!pot) {
      return createErrorResponse({
        errorMessage: 'Cagnotte non trouvée',
        status: 404,
      });
    }
    
    // Récupérer toutes les donations complétées pour cette cagnotte
    const donations = await donationsCrud.findMany(
      { 
        pot_id: parseInt(potId),
        status: 'completed'
      },
      {
        orderBy: { column: 'amount', direction: 'desc' }
      }
    );
    
    if (!donations || donations.length === 0) {
      return createSuccessResponse({
        pot_id: parseInt(potId),
        top_donation: null,
        total_participants: 0,
        total_amount: 0,
        live_viewers: 0
      });
    }
    
    // Trouver le plus gros don
    const topDonation = donations[0];
    
    // Calculer les statistiques
    const totalParticipants = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
    
    // Simuler le nombre de viewers live
    const liveViewers = Math.floor(Math.random() * 50) + totalParticipants;
    
    // Préparer les données du top don selon les paramètres de visibilité
    const topDonationData = {
      id: topDonation.id,
      amount: parseFloat(topDonation.amount.toString()),
      donor_name: (topDonation.show_name_consent && pot.allow_donor_names_display) 
        ? (topDonation.donor_name || 'Donateur généreux')
        : 'Donateur généreux',
      message: topDonation.message,
      create_time: topDonation.create_time,
      is_anonymous: topDonation.is_anonymous,
      show_name: topDonation.show_name_consent && pot.allow_donor_names_display,
      show_amount: true // Le top don est toujours visible
    };
    
    return createSuccessResponse({
      pot_id: parseInt(potId),
      top_donation: topDonationData,
      total_participants: totalParticipants,
      total_amount: totalAmount,
      live_viewers: liveViewers,
      last_updated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des dons live:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des dons live',
      status: 500,
    });
  }
}, false); // Pas besoin d'authentification pour voir les dons live publics

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    
    if (!potId) {
      return createErrorResponse({
        errorMessage: 'ID de la cagnotte requis',
        status: 400,
      });
    }
    
    // Déclencher une animation de célébration pour un nouveau don
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    await analyticsCrud.create({
      pot_id: parseInt(potId),
      user_id: params.payload?.sub ? parseInt(params.payload.sub) : null,
      event_type: 'live_animation_triggered',
      event_category: 'gamification',
      event_data: {
        animation_type: 'donation_celebration',
        triggered_at: new Date().toISOString()
      }
    });
    
    return createSuccessResponse({
      animation_triggered: true,
      pot_id: parseInt(potId),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors du déclenchement de l\'animation:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors du déclenchement de l\'animation',
      status: 500,
    });
  }
}, true);
