
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';

const createPotSchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères'),
  description: z.string().optional(),
  target_amount: z.number().positive().optional(),
  birthday_date: z.string().refine((date) => {
    const birthday = new Date(date);
    const today = new Date();
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 10 && diffDays <= 30;
  }, {
    message: "La date d'anniversaire doit être dans 10 à 30 jours"
  }),
  is_public: z.boolean().default(true),
  allow_anonymous_donations: z.boolean().default(true),
  show_donor_names: z.boolean().default(true)
});

const updatePotSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().optional(),
  target_amount: z.number().positive().optional(),
  status: z.enum(['active', 'closed', 'expired', 'cancelled']).optional(),
  is_public: z.boolean().optional(),
  allow_anonymous_donations: z.boolean().optional(),
  show_donor_names: z.boolean().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const isPublic = searchParams.get('is_public');
    
    const potsCrud = new CrudOperations('pots', params.token);
    
    const filters: Record<string, any> = {};
    if (userId) filters.user_id = parseInt(userId);
    if (status) filters.status = status;
    if (isPublic !== null) filters.is_public = isPublic === 'true';
    
    const pots = await potsCrud.findMany(filters, {
      limit: limit || 20,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(pots);
  } catch (error) {
    console.error('Erreur lors de la récupération des cagnottes:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des cagnottes',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createPotSchema.parse(body);
    
    const potsCrud = new CrudOperations('pots', params.token);
    
    // Vérifier si l'utilisateur a déjà une cagnotte active
    const existingPots = await potsCrud.findMany({
      user_id: parseInt(params.payload?.sub || '0'),
      status: 'active'
    });
    
    if (existingPots && existingPots.length > 0) {
      return createErrorResponse({
        errorMessage: 'Vous avez déjà une cagnotte active',
        status: 409,
      });
    }
    
    const potData = {
      ...validatedData,
      user_id: parseInt(params.payload?.sub || '0'),
      current_amount: 0,
      status: 'active',
      countdown_end: new Date(validatedData.birthday_date + 'T23:59:59Z').toISOString()
    };
    
    const newPot = await potsCrud.create(potData);
    
    // Créer une notification
    const notificationsCrud = new CrudOperations('notifications', params.token);
    await notificationsCrud.create({
      user_id: parseInt(params.payload?.sub || '0'),
      pot_id: newPot.id,
      type: 'pot_created',
      title: 'Cagnotte créée avec succès',
      message: `Votre cagnotte "${validatedData.title}" a été créée avec succès`,
      channel: 'email',
      recipient: params.payload?.email || '',
      status: 'pending'
    });
    
    return createSuccessResponse(newPot, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création de la cagnotte:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création de la cagnotte',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de la cagnotte requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updatePotSchema.parse(body);
    
    const potsCrud = new CrudOperations('pots', params.token);
    
    // Vérifier si la cagnotte existe et appartient à l'utilisateur
    const existingPot = await potsCrud.findById(id);
    if (!existingPot) {
      return createErrorResponse({
        errorMessage: 'Cagnotte non trouvée',
        status: 404,
      });
    }
    
    if (existingPot.user_id !== parseInt(params.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à modifier cette cagnotte',
        status: 403,
      });
    }
    
    const updatedPot = await potsCrud.update(id, validatedData);
    return createSuccessResponse(updatedPot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour de la cagnotte:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour de la cagnotte',
      status: 500,
    });
  }
}, true);
