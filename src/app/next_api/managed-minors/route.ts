
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';

const createManagedMinorSchema = z.object({
  minor_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  minor_birthday: z.string().refine((date) => {
    const birthday = new Date(date);
    const today = new Date();
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 10 && diffDays <= 30;
  }, {
    message: "L'anniversaire doit être dans 10 à 30 jours"
  }),
  relationship_type: z.enum(['enfant', 'frere_soeur', 'neveu_niece'], {
    errorMap: () => ({ message: 'Relation familiale invalide' })
  }),
  created_by_name: z.string().min(2, 'Nom du créateur requis')
});

const updateManagedMinorSchema = z.object({
  minor_name: z.string().min(2).optional(),
  relationship_type: z.enum(['enfant', 'frere_soeur', 'neveu_niece']).optional(),
  is_active: z.boolean().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get('manager_user_id');
    const isActive = searchParams.get('is_active');
    
    const managedMinorsCrud = new CrudOperations('managed_minors', params.token);
    
    const filters: Record<string, any> = {};
    if (managerId) {
      filters.manager_user_id = parseInt(managerId);
    } else {
      // Si pas de manager spécifié, utiliser l'utilisateur connecté
      filters.manager_user_id = parseInt(params.payload?.sub || '0');
    }
    if (isActive !== null) filters.is_active = isActive === 'true';
    
    const minors = await managedMinorsCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(minors);
  } catch (error) {
    console.error('Erreur lors de la récupération des mineurs gérés:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des mineurs gérés',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createManagedMinorSchema.parse(body);
    
    const managedMinorsCrud = new CrudOperations('managed_minors', params.token);
    const duplicateAttemptsCrud = new CrudOperations('minor_duplicate_attempts', params.token);
    
    // Vérifier si ce mineur existe déjà dans le système
    const existingMinors = await managedMinorsCrud.findMany({
      minor_name: validatedData.minor_name,
      minor_birthday: validatedData.minor_birthday,
      is_active: true
    });
    
    if (existingMinors && existingMinors.length > 0) {
      const existingMinor = existingMinors[0];
      
      // Enregistrer la tentative de doublon
      await duplicateAttemptsCrud.create({
        attempted_by_user_id: parseInt(params.payload?.sub || '0'),
        attempted_by_name: validatedData.created_by_name,
        existing_minor_id: existingMinor.id,
        existing_manager_name: existingMinor.created_by_name,
        minor_name: validatedData.minor_name,
        minor_birthday: validatedData.minor_birthday
      });
      
      return createErrorResponse({
        errorMessage: `Cet enfant est déjà géré dans le système par "${existingMinor.created_by_name}"`,
        status: 409,
      });
    }
    
    const minorData = {
      manager_user_id: parseInt(params.payload?.sub || '0'),
      minor_name: validatedData.minor_name,
      minor_birthday: validatedData.minor_birthday,
      relationship_type: validatedData.relationship_type,
      created_by_name: validatedData.created_by_name,
      is_active: true
    };
    
    const newMinor = await managedMinorsCrud.create(minorData);
    
    // Créer une notification
    const notificationsCrud = new CrudOperations('notifications', params.token);
    await notificationsCrud.create({
      user_id: parseInt(params.payload?.sub || '0'),
      type: 'minor_added',
      title: 'Mineur ajouté avec succès',
      message: `${validatedData.minor_name} a été ajouté à votre gestion`,
      channel: 'email',
      recipient: params.payload?.email || '',
      status: 'pending'
    });
    
    return createSuccessResponse(newMinor, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du mineur géré:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'ajout du mineur',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du mineur requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updateManagedMinorSchema.parse(body);
    
    const managedMinorsCrud = new CrudOperations('managed_minors', params.token);
    
    // Vérifier si le mineur existe et appartient à l'utilisateur
    const existingMinor = await managedMinorsCrud.findById(id);
    if (!existingMinor) {
      return createErrorResponse({
        errorMessage: 'Mineur non trouvé',
        status: 404,
      });
    }
    
    if (existingMinor.manager_user_id !== parseInt(params.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à modifier ce mineur',
        status: 403,
      });
    }
    
    const updatedMinor = await managedMinorsCrud.update(id, validatedData);
    return createSuccessResponse(updatedMinor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour du mineur géré:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour du mineur',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du mineur requis',
        status: 400,
      });
    }
    
    const managedMinorsCrud = new CrudOperations('managed_minors', params.token);
    
    // Vérifier si le mineur existe et appartient à l'utilisateur
    const existingMinor = await managedMinorsCrud.findById(id);
    if (!existingMinor) {
      return createErrorResponse({
        errorMessage: 'Mineur non trouvé',
        status: 404,
      });
    }
    
    if (existingMinor.manager_user_id !== parseInt(params.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à supprimer ce mineur',
        status: 403,
      });
    }
    
    // Marquer comme inactif plutôt que supprimer
    await managedMinorsCrud.update(id, { is_active: false });
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression du mineur géré:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression du mineur',
      status: 500,
    });
  }
}, true);
