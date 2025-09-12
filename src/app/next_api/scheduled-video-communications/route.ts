
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { z } from 'zod';

const scheduleVideoSchema = z.object({
  pot_id: z.number(),
  sequence_step_id: z.number(),
  template_id: z.number(),
  scheduled_date: z.string(),
  platforms: z.array(z.string()).default(['facebook', 'whatsapp', 'instagram', 'tiktok']),
  recipient_data: z.any().optional()
});

const updateScheduledVideoSchema = z.object({
  scheduled_date: z.string().optional(),
  status: z.enum(['scheduled', 'sent', 'failed', 'cancelled', 'processing']).optional(),
  platforms: z.array(z.string()).optional(),
  error_message: z.string().optional(),
  retry_count: z.number().optional(),
  sent_at: z.string().optional()
});

export const GET = requestMiddleware(async (request: NextRequest) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    const status = searchParams.get('status');
    const sequenceStepId = searchParams.get('sequence_step_id');
    const scheduledDate = searchParams.get('scheduled_date');
    
    const adminToken = await generateAdminUserToken();
    const scheduledVideosCrud = new CrudOperations('scheduled_video_communications', adminToken);
    
    const filters: Record<string, any> = {};
    if (potId) filters.pot_id = parseInt(potId);
    if (status) filters.status = status;
    if (sequenceStepId) filters.sequence_step_id = parseInt(sequenceStepId);
    
    let scheduledVideos = await scheduledVideosCrud.findMany(filters, {
      limit: limit || 100,
      offset: offset || 0,
      orderBy: { column: 'scheduled_date', direction: 'asc' }
    });
    
    // Filtrer par date si spécifié
    if (scheduledDate && scheduledVideos) {
      const targetDate = new Date(scheduledDate);
      scheduledVideos = scheduledVideos.filter(video => {
        const videoDate = new Date(video.scheduled_date);
        return videoDate.toDateString() === targetDate.toDateString();
      });
    }
    
    return createSuccessResponse(scheduledVideos);
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos programmées:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des vidéos programmées',
      status: 500,
    });
  }
}, false);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = scheduleVideoSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin ou propriétaire de la cagnotte
    const adminToken = await generateAdminUserToken();
    const potsCrud = new CrudOperations('pots', adminToken);
    
    // Vérifier si la cagnotte existe
    const pot = await potsCrud.findById(validatedData.pot_id);
    if (!pot) {
      return createErrorResponse({
        errorMessage: 'Cagnotte non trouvée',
        status: 404,
      });
    }
    
    // Vérifier les permissions
    const isAdmin = params.payload?.role === 'app20250905024110cvidyeburp_v1_admin_user';
    const isPotOwner = pot.user_id === parseInt(params.payload?.sub || '0');
    
    if (!isAdmin && !isPotOwner) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à programmer des vidéos pour cette cagnotte',
        status: 403,
      });
    }
    
    const scheduledVideosCrud = new CrudOperations('scheduled_video_communications', adminToken);
    
    const videoData = {
      ...validatedData,
      status: 'scheduled',
      retry_count: 0
    };
    
    const newScheduledVideo = await scheduledVideosCrud.create(videoData);
    
    // Tracker l'événement
    const analyticsCrud = new CrudOperations('analytics_events', adminToken);
    await analyticsCrud.create({
      pot_id: validatedData.pot_id,
      user_id: parseInt(params.payload?.sub || '0'),
      event_type: 'video_scheduled',
      event_category: 'system_event',
      event_data: {
        sequence_step_id: validatedData.sequence_step_id,
        template_id: validatedData.template_id,
        scheduled_date: validatedData.scheduled_date,
        platforms: validatedData.platforms
      }
    });
    
    return createSuccessResponse(newScheduledVideo, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la programmation de la vidéo:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la programmation de la vidéo',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de la vidéo programmée requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updateScheduledVideoSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent modifier des vidéos programmées',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const scheduledVideosCrud = new CrudOperations('scheduled_video_communications', adminToken);
    
    // Vérifier si la vidéo programmée existe
    const existingVideo = await scheduledVideosCrud.findById(id);
    if (!existingVideo) {
      return createErrorResponse({
        errorMessage: 'Vidéo programmée non trouvée',
        status: 404,
      });
    }
    
    // Créer un objet de mise à jour
    const updateData: any = { ...validatedData };
    
    // Si le statut change vers 'sent', enregistrer la date d'envoi
    if (validatedData.status === 'sent' && existingVideo.status !== 'sent') {
      updateData.sent_at = new Date().toISOString();
    }
    
    const updatedVideo = await scheduledVideosCrud.update(id, updateData);
    
    // Tracker l'événement si la vidéo est envoyée
    if (validatedData.status === 'sent') {
      const analyticsCrud = new CrudOperations('analytics_events', adminToken);
      await analyticsCrud.create({
        pot_id: existingVideo.pot_id,
        event_type: 'video_sent',
        event_category: 'marketing',
        event_data: {
          sequence_step_id: existingVideo.sequence_step_id,
          template_id: existingVideo.template_id,
          platforms: existingVideo.platforms,
          sent_at: updateData.sent_at
        }
      });
    }
    
    return createSuccessResponse(updatedVideo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour de la vidéo programmée:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour de la vidéo programmée',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de la vidéo programmée requis',
        status: 400,
      });
    }
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent supprimer des vidéos programmées',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const scheduledVideosCrud = new CrudOperations('scheduled_video_communications', adminToken);
    
    // Vérifier si la vidéo programmée existe
    const existingVideo = await scheduledVideosCrud.findById(id);
    if (!existingVideo) {
      return createErrorResponse({
        errorMessage: 'Vidéo programmée non trouvée',
        status: 404,
      });
    }
    
    // Marquer comme annulée plutôt que supprimer
    await scheduledVideosCrud.update(id, { 
      status: 'cancelled',
      error_message: 'Annulée par administrateur'
    });
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la vidéo programmée:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'annulation de la vidéo programmée',
      status: 500,
    });
  }
}, true);
