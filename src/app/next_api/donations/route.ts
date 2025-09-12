
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';

const createDonationSchema = z.object({
  pot_id: z.number(),
  donor_name: z.string().optional(),
  donor_email: z.string().email().optional(),
  donor_phone: z.string().optional(),
  amount: z.number().positive('Le montant doit être positif'),
  is_anonymous: z.boolean().default(false),
  show_name_consent: z.boolean().default(true),
  show_amount_consent: z.boolean().default(true),
  message: z.string().optional(),
  payment_method: z.string().default('wave'),
  referrer_source: z.string().optional(),
  device_type: z.enum(['mobile', 'desktop', 'tablet']).optional()
});

const updateDonationSchema = z.object({
  wave_transaction_id: z.string().optional(),
  wave_payment_status: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  processed_at: z.string().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('payment_method');
    
    const donationsCrud = new CrudOperations('donations', params.token);
    
    const filters: Record<string, any> = {};
    if (potId) filters.pot_id = parseInt(potId);
    if (status) filters.status = status;
    if (paymentMethod) filters.payment_method = paymentMethod;
    
    const donations = await donationsCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(donations);
  } catch (error) {
    console.error('Erreur lors de la récupération des donations:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des donations',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createDonationSchema.parse(body);
    
    const donationsCrud = new CrudOperations('donations', params.token);
    const potsCrud = new CrudOperations('pots', params.token);
    
    // Vérifier que la cagnotte existe et est active
    const pot = await potsCrud.findById(validatedData.pot_id);
    if (!pot) {
      return createErrorResponse({
        errorMessage: 'Cagnotte non trouvée',
        status: 404,
      });
    }
    
    if (pot.status !== 'active') {
      return createErrorResponse({
        errorMessage: 'Cette cagnotte n\'accepte plus de donations',
        status: 400,
      });
    }
    
    const donationData = {
      ...validatedData,
      status: 'pending',
      conversion_time_seconds: Math.floor(Math.random() * 300) + 30 // Simulation
    };
    
    const newDonation = await donationsCrud.create(donationData);
    
    // Simuler le traitement du paiement Wave (en réalité, cela se ferait via webhook)
    setTimeout(async () => {
      try {
        // Mettre à jour la donation comme complétée
        await donationsCrud.update(newDonation.id, {
          status: 'completed',
          wave_transaction_id: `WAVE_${Date.now()}`,
          wave_payment_status: 'SUCCESS',
          processed_at: new Date().toISOString()
        });
        
        // Mettre à jour le montant de la cagnotte
        await potsCrud.update(validatedData.pot_id, {
          current_amount: pot.current_amount + validatedData.amount
        });
        
        // Créer une notification pour le propriétaire de la cagnotte
        const notificationsCrud = new CrudOperations('notifications', params.token);
        await notificationsCrud.create({
          user_id: pot.user_id,
          pot_id: validatedData.pot_id,
          type: 'donation_received',
          title: 'Nouvelle donation reçue',
          message: `Vous avez reçu une donation de ${validatedData.amount} FCFA`,
          channel: 'email',
          recipient: 'user@example.com', // À récupérer depuis la table users
          status: 'pending'
        });
      } catch (error) {
        console.error('Erreur lors du traitement de la donation:', error);
      }
    }, 2000);
    
    return createSuccessResponse(newDonation, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création de la donation:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création de la donation',
      status: 500,
    });
  }
}, false); // Pas besoin d'authentification pour créer une donation

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de la donation requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updateDonationSchema.parse(body);
    
    const donationsCrud = new CrudOperations('donations', params.token);
    
    // Vérifier si la donation existe
    const existingDonation = await donationsCrud.findById(id);
    if (!existingDonation) {
      return createErrorResponse({
        errorMessage: 'Donation non trouvée',
        status: 404,
      });
    }
    
    const updatedDonation = await donationsCrud.update(id, validatedData);
    
    // Si la donation est marquée comme complétée, mettre à jour la cagnotte
    if (validatedData.status === 'completed' && existingDonation.status !== 'completed') {
      const potsCrud = new CrudOperations('pots', params.token);
      const pot = await potsCrud.findById(existingDonation.pot_id);
      
      if (pot) {
        await potsCrud.update(existingDonation.pot_id, {
          current_amount: pot.current_amount + existingDonation.amount
        });
      }
    }
    
    return createSuccessResponse(updatedDonation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour de la donation:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour de la donation',
      status: 500,
    });
  }
}, true);
