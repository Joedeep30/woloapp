
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';

const setPreferredPackSchema = z.object({
  pot_id: z.number(),
  package_id: z.number(),
  preferred_message: z.string().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    
    if (id) {
      // Récupérer la préférence d'un utilisateur spécifique
      const usersCrud = new CrudOperations('users', params.token);
      const user = await usersCrud.findById(id);
      
      if (!user) {
        return createErrorResponse({
          errorMessage: 'Utilisateur non trouvé',
          status: 404,
        });
      }
      
      let preferredPackage = null;
      if (user.preferred_pack_id) {
        const packagesCrud = new CrudOperations('partner_packages', params.token);
        preferredPackage = await packagesCrud.findById(user.preferred_pack_id);
      }
      
      return createSuccessResponse({
        user_id: user.id,
        preferred_pack_id: user.preferred_pack_id,
        preferred_package: preferredPackage
      });
    } else if (potId) {
      // Récupérer la préférence pour une cagnotte spécifique
      const potsCrud = new CrudOperations('pots', params.token);
      const pot = await potsCrud.findById(potId);
      
      if (!pot) {
        return createErrorResponse({
          errorMessage: 'Cagnotte non trouvée',
          status: 404,
        });
      }
      
      let preferredPackage = null;
      if (pot.preferred_package_id) {
        const packagesCrud = new CrudOperations('partner_packages', params.token);
        preferredPackage = await packagesCrud.findById(pot.preferred_package_id);
      }
      
      return createSuccessResponse({
        pot_id: pot.id,
        preferred_package_id: pot.preferred_package_id,
        preferred_package_message: pot.preferred_package_message,
        preferred_package: preferredPackage
      });
    } else {
      return createErrorResponse({
        errorMessage: 'ID utilisateur ou ID cagnotte requis',
        status: 400,
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la préférence:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération de la préférence',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = setPreferredPackSchema.parse(body);
    
    const potsCrud = new CrudOperations('pots', params.token);
    const packagesCrud = new CrudOperations('partner_packages', params.token);
    
    // Vérifier si la cagnotte existe et appartient à l'utilisateur
    const pot = await potsCrud.findById(validatedData.pot_id);
    if (!pot) {
      return createErrorResponse({
        errorMessage: 'Cagnotte non trouvée',
        status: 404,
      });
    }
    
    if (pot.user_id !== parseInt(params.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à modifier cette cagnotte',
        status: 403,
      });
    }
    
    // Vérifier si le package existe et est actif
    const package_ = await packagesCrud.findById(validatedData.package_id);
    if (!package_ || !package_.is_active) {
      return createErrorResponse({
        errorMessage: 'Package non trouvé ou inactif',
        status: 404,
      });
    }
    
    // Mettre à jour la cagnotte avec la préférence
    const updatedPot = await potsCrud.update(validatedData.pot_id, {
      preferred_package_id: validatedData.package_id,
      preferred_package_message: validatedData.preferred_message || 
        `${pot.birthday_person_name || 'Cette personne'} souhaiterait que sa cagnotte l'aide à réaliser ${package_.package_name.toLowerCase()}`
    });
    
    // Tracker l'événement
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    await analyticsCrud.create({
      pot_id: validatedData.pot_id,
      user_id: parseInt(params.payload?.sub || '0'),
      event_type: 'preferred_pack_selected',
      event_category: 'user_interaction',
      event_data: {
        package_id: validatedData.package_id,
        package_name: package_.package_name,
        package_type: package_.package_type
      }
    });
    
    return createSuccessResponse({
      pot: updatedPot,
      preferred_package: package_
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la définition de la préférence:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la définition de la préférence',
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
    const { preferred_message } = body;
    
    const potsCrud = new CrudOperations('pots', params.token);
    
    // Vérifier si la cagnotte existe et appartient à l'utilisateur
    const pot = await potsCrud.findById(id);
    if (!pot) {
      return createErrorResponse({
        errorMessage: 'Cagnotte non trouvée',
        status: 404,
      });
    }
    
    if (pot.user_id !== parseInt(params.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à modifier cette cagnotte',
        status: 403,
      });
    }
    
    // Mettre à jour le message de préférence
    const updatedPot = await potsCrud.update(id, {
      preferred_package_message: preferred_message
    });
    
    return createSuccessResponse(updatedPot);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message de préférence:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour du message de préférence',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de la cagnotte requis',
        status: 400,
      });
    }
    
    const potsCrud = new CrudOperations('pots', params.token);
    
    // Vérifier si la cagnotte existe et appartient à l'utilisateur
    const pot = await potsCrud.findById(id);
    if (!pot) {
      return createErrorResponse({
        errorMessage: 'Cagnotte non trouvée',
        status: 404,
      });
    }
    
    if (pot.user_id !== parseInt(params.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à modifier cette cagnotte',
        status: 403,
      });
    }
    
    // Supprimer la préférence
    const updatedPot = await potsCrud.update(id, {
      preferred_package_id: null,
      preferred_package_message: null
    });
    
    // Tracker l'événement
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    await analyticsCrud.create({
      pot_id: parseInt(id),
      user_id: parseInt(params.payload?.sub || '0'),
      event_type: 'preferred_pack_removed',
      event_category: 'user_interaction',
      event_data: {
        previous_package_id: pot.preferred_package_id
      }
    });
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression de la préférence:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression de la préférence',
      status: 500,
    });
  }
}, true);
