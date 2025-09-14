
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { z } from 'zod';

const createPlatformFormatSchema = z.object({
  template_id: z.number(),
  platform: z.enum(['facebook', 'instagram', 'whatsapp', 'tiktok', 'snapchat', 'twitter', 'linkedin']),
  format_type: z.enum(['post', 'story', 'reel', 'video', 'cover', 'profile', 'thumbnail']),
  width: z.number().optional(),
  height: z.number().optional(),
  max_duration_seconds: z.number().optional(),
  max_file_size_mb: z.number().optional(),
  supported_formats: z.array(z.string()),
  aspect_ratio: z.string().optional()
});

const updatePlatformFormatSchema = z.object({
  formatted_file_url: z.string().optional(),
  formatted_filename: z.string().optional(),
  processing_status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  processing_error: z.string().optional()
});

export const GET = requestMiddleware(async (request: NextRequest) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('template_id');
    const platform = searchParams.get('platform');
    const formatType = searchParams.get('format_type');
    const processingStatus = searchParams.get('processing_status');
    
    const adminToken = await generateAdminUserToken();
    const formatsCrud = new CrudOperations('social_media_formats', adminToken);
    
    const filters: Record<string, any> = {};
    if (templateId) filters.template_id = parseInt(templateId);
    if (platform) filters.platform = platform;
    if (formatType) filters.format_type = formatType;
    if (processingStatus) filters.processing_status = processingStatus;
    
    const formats = await formatsCrud.findMany(filters, {
      limit: limit || 100,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(formats);
  } catch (error) {
    console.error('Erreur lors de la récupération des formats de plateforme:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des formats de plateforme',
      status: 500,
    });
  }
}, false);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createPlatformFormatSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent créer des formats de plateforme',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const formatsCrud = new CrudOperations('social_media_formats', adminToken);
    
    // Vérifier si le template existe
    const templatesCrud = new CrudOperations('admin_media_templates', adminToken);
    const template = await templatesCrud.findById(validatedData.template_id);
    
    if (!template) {
      return createErrorResponse({
        errorMessage: 'Template média non trouvé',
        status: 404,
      });
    }
    
    const formatData = {
      ...validatedData,
      processing_status: 'pending'
    };
    
    const newFormat = await formatsCrud.create(formatData);
    
    // Déterminer les hôtes applicatifs/médias à utiliser
    const appHost = process.env.APP_PUBLIC_HOST 
      || process.env.NEXT_PUBLIC_APP_HOST 
      || process.env.APP_PUBLIC_URL 
      || process.env.NEXT_PUBLIC_APP_URL 
      || request.nextUrl.origin;
    const mediaHost = process.env.MEDIA_HOST 
      || process.env.NEXT_PUBLIC_MEDIA_HOST 
      || process.env.MEDIA_BASE_URL 
      || process.env.NEXT_PUBLIC_MEDIA_URL 
      || appHost;
    
    // Lancer le traitement asynchrone du format
    setTimeout(async () => {
      try {
        // Simuler le traitement du format
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Mettre à jour le statut
        await formatsCrud.update(newFormat.id, {
          processing_status: 'completed',
          formatted_file_url: `${mediaHost}/formatted/${newFormat.id}.${validatedData.supported_formats[0]}`,
          formatted_filename: `${validatedData.platform}_${validatedData.format_type}.${validatedData.supported_formats[0]}`
        });
        
      } catch (error) {
        console.error('Erreur lors du traitement du format:', error);
        await formatsCrud.update(newFormat.id, {
          processing_status: 'failed',
          processing_error: 'Erreur lors du traitement automatique'
        });
      }
    }, 1000);
    
    return createSuccessResponse(newFormat, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du format de plateforme:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création du format de plateforme',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du format requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updatePlatformFormatSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent modifier des formats de plateforme',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const formatsCrud = new CrudOperations('social_media_formats', adminToken);
    
    // Vérifier si le format existe
    const existingFormat = await formatsCrud.findById(id);
    if (!existingFormat) {
      return createErrorResponse({
        errorMessage: 'Format de plateforme non trouvé',
        status: 404,
      });
    }
    
    const updatedFormat = await formatsCrud.update(id, validatedData);
    return createSuccessResponse(updatedFormat);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour du format de plateforme:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour du format de plateforme',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du format requis',
        status: 400,
      });
    }
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent supprimer des formats de plateforme',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const formatsCrud = new CrudOperations('social_media_formats', adminToken);
    
    // Vérifier si le format existe
    const existingFormat = await formatsCrud.findById(id);
    if (!existingFormat) {
      return createErrorResponse({
        errorMessage: 'Format de plateforme non trouvé',
        status: 404,
      });
    }
    
    await formatsCrud.delete(id);
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression du format de plateforme:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression du format de plateforme',
      status: 500,
    });
  }
}, true);
