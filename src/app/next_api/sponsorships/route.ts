
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateRandomString } from '@/lib/server-utils';
import { z } from 'zod';

const createSponsorshipSchema = z.object({
  invited_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  invited_email: z.string().email().optional(),
  invited_phone: z.string().optional(),
  invited_birthday: z.string().refine((date) => {
    const birthday = new Date(date);
    const today = new Date();
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 10 && diffDays <= 30;
  }, {
    message: "L'anniversaire doit être dans 10 à 30 jours"
  }),
  invitation_method: z.enum(['email', 'sms', 'whatsapp']).default('email'),
  invitation_message: z.string().optional()
}).refine((data) => data.invited_email || data.invited_phone, {
  message: "Au moins un email ou un téléphone est requis",
  path: ["invited_email"]
});

const updateSponsorshipSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
  invited_user_id: z.number().optional(),
  pot_id: z.number().optional(),
  points_awarded: z.number().optional(),
  bonus_points: z.number().optional(),
  accepted_at: z.string().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const sponsorUserId = searchParams.get('sponsor_user_id');
    const status = searchParams.get('status');
    const invitationToken = searchParams.get('invitation_token');
    
    const sponsorshipsCrud = new CrudOperations('sponsorships', params.token);
    
    const filters: Record<string, any> = {};
    if (sponsorUserId) filters.sponsor_user_id = parseInt(sponsorUserId);
    if (status) filters.status = status;
    if (invitationToken) filters.invitation_token = invitationToken;
    
    const sponsorships = await sponsorshipsCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(sponsorships);
  } catch (error) {
    console.error('Erreur lors de la récupération des parrainages:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des parrainages',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createSponsorshipSchema.parse(body);
    
    const sponsorshipsCrud = new CrudOperations('sponsorships', params.token);
    
    // Vérifier si cette personne n'a pas déjà un parrain
    const existingSponsorships = await sponsorshipsCrud.findMany({
      invited_email: validatedData.invited_email,
      status: 'accepted'
    });
    
    if (existingSponsorships && existingSponsorships.length > 0) {
      return createErrorResponse({
        errorMessage: 'Cette personne a déjà un parrain actif',
        status: 409,
      });
    }
    
    // Générer un token d'invitation unique
    const invitationToken = generateRandomString(32);
    
    // Calculer la date d'expiration (7 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const sponsorshipData = {
      sponsor_user_id: parseInt(params.payload?.sub || '0'),
      invited_name: validatedData.invited_name,
      invited_email: validatedData.invited_email,
      invited_phone: validatedData.invited_phone,
      invited_birthday: validatedData.invited_birthday,
      invitation_method: validatedData.invitation_method,
      invitation_message: validatedData.invitation_message,
      invitation_token: invitationToken,
      status: 'pending',
      invitation_sent_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };
    
    const newSponsorship = await sponsorshipsCrud.create(sponsorshipData);
    
    // Envoyer l'invitation (simulation)
    const invitationUrl = `${request.headers.get('origin')}/sponsorship/accept/${invitationToken}`;
    
    // Créer une notification pour l'envoi d'invitation
    const notificationsCrud = new CrudOperations('notifications', params.token);
    await notificationsCrud.create({
      user_id: parseInt(params.payload?.sub || '0'),
      type: 'sponsorship_invitation_sent',
      title: 'Invitation de parrainage envoyée',
      message: `Invitation envoyée à ${validatedData.invited_name}`,
      channel: validatedData.invitation_method === 'email' ? 'email' : 'sms',
      recipient: validatedData.invited_email || validatedData.invited_phone || '',
      status: 'pending'
    });
    
    // Tracker l'événement
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    await analyticsCrud.create({
      user_id: parseInt(params.payload?.sub || '0'),
      event_type: 'sponsorship_invitation_sent',
      event_category: 'viral_marketing',
      event_data: {
        invited_name: validatedData.invited_name,
        invitation_method: validatedData.invitation_method,
        days_until_birthday: Math.ceil((new Date(validatedData.invited_birthday).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }
    });
    
    return createSuccessResponse({
      ...newSponsorship,
      invitation_url: invitationUrl
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du parrainage:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création de l\'invitation de parrainage',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du parrainage requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updateSponsorshipSchema.parse(body);
    
    const sponsorshipsCrud = new CrudOperations('sponsorships', params.token);
    
    // Vérifier si le parrainage existe
    const existingSponsorship = await sponsorshipsCrud.findById(id);
    if (!existingSponsorship) {
      return createErrorResponse({
        errorMessage: 'Parrainage non trouvé',
        status: 404,
      });
    }
    
    const updatedSponsorship = await sponsorshipsCrud.update(id, validatedData);
    
    // Si le parrainage est accepté, attribuer les points au parrain
    if (validatedData.status === 'accepted' && existingSponsorship.status !== 'accepted') {
      const userPointsCrud = new CrudOperations('user_points', params.token);
      const pointTransactionsCrud = new CrudOperations('point_transactions', params.token);
      
      // Vérifier si le parrain a déjà des points
      const existingPoints = await userPointsCrud.findMany({
        user_id: existingSponsorship.sponsor_user_id
      });
      
      const basePoints = 10; // Points de base pour un parrainage accepté
      
      if (existingPoints && existingPoints.length > 0) {
        // Mettre à jour les points existants
        const currentPoints = existingPoints[0];
        await userPointsCrud.update(currentPoints.id, {
          total_points: currentPoints.total_points + basePoints,
          available_points: currentPoints.available_points + basePoints,
          lifetime_points: currentPoints.lifetime_points + basePoints
        });
      } else {
        // Créer un nouveau record de points
        await userPointsCrud.create({
          user_id: existingSponsorship.sponsor_user_id,
          total_points: basePoints,
          available_points: basePoints,
          lifetime_points: basePoints,
          current_level: 'bronze'
        });
      }
      
      // Enregistrer la transaction de points
      await pointTransactionsCrud.create({
        user_id: existingSponsorship.sponsor_user_id,
        transaction_type: 'sponsorship_accepted',
        points_amount: basePoints,
        source_type: 'sponsorship',
        source_id: parseInt(id),
        description: `Parrainage accepté par ${existingSponsorship.invited_name}`
      });
      
      // Mettre à jour le parrainage avec les points attribués
      await sponsorshipsCrud.update(id, {
        points_awarded: basePoints
      });
      
      // Créer une notification pour le parrain
      const notificationsCrud = new CrudOperations('notifications', params.token);
      await notificationsCrud.create({
        user_id: existingSponsorship.sponsor_user_id,
        type: 'sponsorship_accepted',
        title: 'Parrainage accepté !',
        message: `${existingSponsorship.invited_name} a accepté votre parrainage et vous avez gagné ${basePoints} points !`,
        channel: 'email',
        recipient: 'sponsor@example.com', // À récupérer depuis la table users
        status: 'pending'
      });
    }
    
    return createSuccessResponse(updatedSponsorship);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour du parrainage:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour du parrainage',
      status: 500,
    });
  }
}, true);
