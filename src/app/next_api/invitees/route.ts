
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';

const createInviteeSchema = z.object({
  pot_id: z.number(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  whatsapp_number: z.string().optional(),
  email: z.string().email().optional(),
  invitation_method: z.enum(['manual', 'bulk_import', 'social_invite']).default('manual')
}).refine((data) => data.whatsapp_number || data.email, {
  message: "Au moins un numéro WhatsApp ou un email est requis",
  path: ["whatsapp_number"]
});

const updateInviteeSchema = z.object({
  name: z.string().min(2).optional(),
  whatsapp_number: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(['invited', 'confirmed', 'attended', 'no_show']).optional(),
  invitation_sent: z.boolean().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    const status = searchParams.get('status');
    
    const inviteesCrud = new CrudOperations('invitees', params.token);
    
    const filters: Record<string, any> = {};
    if (potId) filters.pot_id = parseInt(potId);
    if (status) filters.status = status;
    
    const invitees = await inviteesCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(invitees);
  } catch (error) {
    console.error('Erreur lors de la récupération des invités:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des invités',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createInviteeSchema.parse(body);
    
    const inviteesCrud = new CrudOperations('invitees', params.token);
    
    const inviteeData = {
      ...validatedData,
      invitation_sent: false,
      qr_code_generated: false,
      status: 'invited'
    };
    
    const newInvitee = await inviteesCrud.create(inviteeData);
    return createSuccessResponse(newInvitee, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création de l\'invité:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'ajout de l\'invité',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de l\'invité requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updateInviteeSchema.parse(body);
    
    const inviteesCrud = new CrudOperations('invitees', params.token);
    
    // Vérifier si l'invité existe
    const existingInvitee = await inviteesCrud.findById(id);
    if (!existingInvitee) {
      return createErrorResponse({
        errorMessage: 'Invité non trouvé',
        status: 404,
      });
    }
    
    const updatedInvitee = await inviteesCrud.update(id, validatedData);
    return createSuccessResponse(updatedInvitee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour de l\'invité:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour de l\'invité',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de l\'invité requis',
        status: 400,
      });
    }
    
    const inviteesCrud = new CrudOperations('invitees', params.token);
    
    // Vérifier si l'invité existe
    const existingInvitee = await inviteesCrud.findById(id);
    if (!existingInvitee) {
      return createErrorResponse({
        errorMessage: 'Invité non trouvé',
        status: 404,
      });
    }
    
    await inviteesCrud.delete(id);
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'invité:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression de l\'invité',
      status: 500,
    });
  }
}, true);
