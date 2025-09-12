
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { hashString } from '@/lib/server-utils';
import { z } from 'zod';

const acceptSponsorshipSchema = z.object({
  invitation_token: z.string().min(1, 'Token d\'invitation requis'),
  user_data: z.object({
    first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    phone: z.string().min(8, 'Numéro de téléphone invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
  }),
  pot_data: z.object({
    title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères'),
    description: z.string().optional()
  }).optional()
});

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = acceptSponsorshipSchema.parse(body);
    
    const sponsorshipsCrud = new CrudOperations('sponsorships');
    const usersCrud = new CrudOperations('users');
    const potsCrud = new CrudOperations('pots');
    const userPointsCrud = new CrudOperations('user_points');
    const pointTransactionsCrud = new CrudOperations('point_transactions');
    
    // Trouver le parrainage par token
    const sponsorships = await sponsorshipsCrud.findMany({
      invitation_token: validatedData.invitation_token,
      status: 'pending'
    });
    
    if (!sponsorships || sponsorships.length === 0) {
      return createErrorResponse({
        errorMessage: 'Invitation de parrainage non trouvée ou expirée',
        status: 404,
      });
    }
    
    const sponsorship = sponsorships[0];
    
    // Vérifier si l'invitation n'a pas expiré
    if (new Date(sponsorship.expires_at) < new Date()) {
      return createErrorResponse({
        errorMessage: 'Cette invitation de parrainage a expiré',
        status: 400,
      });
    }
    
    // Vérifier si l'utilisateur n'existe pas déjà
    const existingUsers = await usersCrud.findMany({
      email: validatedData.user_data.email
    });
    
    if (existingUsers && existingUsers.length > 0) {
      return createErrorResponse({
        errorMessage: 'Un compte existe déjà avec cet email',
        status: 409,
      });
    }
    
    // Créer l'utilisateur
    const hashedPassword = await hashString(validatedData.user_data.password);
    
    const userData = {
      email: validatedData.user_data.email,
      password: hashedPassword,
      first_name: validatedData.user_data.first_name,
      last_name: validatedData.user_data.last_name,
      phone: validatedData.user_data.phone,
      birthday: sponsorship.invited_birthday,
      is_sponsored: true,
      sponsored_by: sponsorship.sponsor_user_id,
      auth_provider: 'email'
    };
    
    const newUser = await usersCrud.create(userData);
    
    // Créer la cagnotte automatiquement
    const potData = {
      user_id: newUser.id,
      title: validatedData.pot_data?.title || `Anniversaire de ${validatedData.user_data.first_name}`,
      description: validatedData.pot_data?.description || `Aide-${validatedData.user_data.first_name} à remplir sa cagnotte WOLO SENEGAL !`,
      target_amount: 50000, // Objectif par défaut
      current_amount: 0,
      birthday_date: sponsorship.invited_birthday,
      status: 'active',
      is_public: true,
      allow_anonymous_donations: true,
      show_donor_names: true,
      countdown_end: new Date(sponsorship.invited_birthday + 'T23:59:59Z').toISOString()
    };
    
    const newPot = await potsCrud.create(potData);
    
    // Mettre à jour le parrainage
    await sponsorshipsCrud.update(sponsorship.id, {
      status: 'accepted',
      invited_user_id: newUser.id,
      pot_id: newPot.id,
      accepted_at: new Date().toISOString(),
      points_awarded: 10 // Points de base
    });
    
    // Attribuer les points au parrain
    const existingPoints = await userPointsCrud.findMany({
      user_id: sponsorship.sponsor_user_id
    });
    
    const basePoints = 10;
    
    if (existingPoints && existingPoints.length > 0) {
      const currentPoints = existingPoints[0];
      await userPointsCrud.update(currentPoints.id, {
        total_points: currentPoints.total_points + basePoints,
        available_points: currentPoints.available_points + basePoints,
        lifetime_points: currentPoints.lifetime_points + basePoints
      });
    } else {
      await userPointsCrud.create({
        user_id: sponsorship.sponsor_user_id,
        total_points: basePoints,
        available_points: basePoints,
        lifetime_points: basePoints,
        current_level: 'bronze'
      });
    }
    
    // Enregistrer la transaction de points
    await pointTransactionsCrud.create({
      user_id: sponsorship.sponsor_user_id,
      transaction_type: 'sponsorship_accepted',
      points_amount: basePoints,
      source_type: 'sponsorship',
      source_id: sponsorship.id,
      description: `Parrainage accepté par ${validatedData.user_data.first_name} ${validatedData.user_data.last_name}`,
      metadata: {
        invited_user_id: newUser.id,
        pot_id: newPot.id,
        invitation_token: validatedData.invitation_token
      }
    });
    
    // Créer des notifications
    const notificationsCrud = new CrudOperations('notifications');
    
    // Notification pour le parrain
    await notificationsCrud.create({
      user_id: sponsorship.sponsor_user_id,
      pot_id: newPot.id,
      type: 'sponsorship_accepted',
      title: 'Parrainage accepté !',
      message: `${validatedData.user_data.first_name} a accepté votre parrainage et vous avez gagné ${basePoints} points !`,
      channel: 'email',
      recipient: 'sponsor@example.com', // À récupérer depuis la table users
      status: 'pending'
    });
    
    // Notification de bienvenue pour le nouveau utilisateur
    await notificationsCrud.create({
      user_id: newUser.id,
      pot_id: newPot.id,
      type: 'pot_created',
      title: 'Bienvenue sur WOLO SENEGAL !',
      message: `Votre cagnotte "${potData.title}" a été créée avec succès`,
      channel: 'email',
      recipient: validatedData.user_data.email,
      status: 'pending'
    });
    
    // Tracker l'événement d'acceptation
    const analyticsCrud = new CrudOperations('analytics_events');
    await analyticsCrud.create({
      user_id: newUser.id,
      pot_id: newPot.id,
      event_type: 'sponsorship_accepted',
      event_category: 'viral_marketing',
      event_data: {
        sponsor_user_id: sponsorship.sponsor_user_id,
        points_awarded: basePoints,
        invitation_method: sponsorship.invitation_method
      }
    });
    
    return createSuccessResponse({
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name
      },
      pot: newPot,
      sponsorship: {
        id: sponsorship.id,
        sponsor_points_awarded: basePoints
      }
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de l\'acceptation du parrainage:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'acceptation du parrainage',
      status: 500,
    });
  }
}, false); // Pas besoin d'authentification pour accepter une invitation
