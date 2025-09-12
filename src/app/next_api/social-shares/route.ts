
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';

const createShareSchema = z.object({
  pot_id: z.number(),
  platform: z.enum(['facebook', 'whatsapp', 'tiktok', 'snapchat']),
  share_url: z.string().optional(),
  is_automatic: z.boolean().default(true)
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    const platform = searchParams.get('platform');
    
    const socialSharesCrud = new CrudOperations('social_shares', params.token);
    
    const filters: Record<string, any> = {};
    if (potId) filters.pot_id = parseInt(potId);
    if (platform) filters.platform = platform;
    
    const shares = await socialSharesCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'last_shared_at', direction: 'desc' }
    });
    
    return createSuccessResponse(shares);
  } catch (error) {
    console.error('Erreur lors de la récupération des partages:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des partages sociaux',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createShareSchema.parse(body);
    
    const socialSharesCrud = new CrudOperations('social_shares', params.token);
    
    // Vérifier si un partage existe déjà pour cette combinaison pot/platform
    const existingShares = await socialSharesCrud.findMany({
      pot_id: validatedData.pot_id,
      platform: validatedData.platform
    });
    
    if (existingShares && existingShares.length > 0) {
      // Mettre à jour le partage existant
      const existingShare = existingShares[0];
      const updatedShare = await socialSharesCrud.update(existingShare.id, {
        share_count: existingShare.share_count + 1,
        last_shared_at: new Date().toISOString(),
        share_url: validatedData.share_url || existingShare.share_url
      });
      
      return createSuccessResponse(updatedShare);
    } else {
      // Créer un nouveau partage
      const shareData = {
        ...validatedData,
        shared_by_user_id: params.payload?.sub ? parseInt(params.payload.sub) : null,
        share_count: 1,
        last_shared_at: new Date().toISOString()
      };
      
      const newShare = await socialSharesCrud.create(shareData);
      return createSuccessResponse(newShare, 201);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du partage:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'enregistrement du partage',
      status: 500,
    });
  }
}, true);
