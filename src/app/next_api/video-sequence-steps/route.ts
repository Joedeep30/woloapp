
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { z } from 'zod';

const createSequenceStepSchema = z.object({
  sequence_id: z.number(),
  step_name: z.string().min(3, 'Le nom de l\'étape doit contenir au moins 3 caractères'),
  step_order: z.number().positive(),
  trigger_type: z.enum(['creation', 'weekly', 'daily', 'custom_days', 'milestone']),
  trigger_offset_days: z.number().optional(),
  frequency_days: z.number().optional(),
  start_condition: z.any().optional(),
  end_condition: z.any().optional(),
  template_id: z.number().optional()
});

const updateSequenceStepSchema = z.object({
  step_name: z.string().min(3).optional(),
  step_order: z.number().positive().optional(),
  trigger_type: z.enum(['creation', 'weekly', 'daily', 'custom_days', 'milestone']).optional(),
  trigger_offset_days: z.number().optional(),
  frequency_days: z.number().optional(),
  start_condition: z.any().optional(),
  end_condition: z.any().optional(),
  template_id: z.number().optional(),
  is_active: z.boolean().optional()
});

export const GET = requestMiddleware(async (request: NextRequest) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const sequenceId = searchParams.get('sequence_id');
    const triggerType = searchParams.get('trigger_type');
    const isActive = searchParams.get('is_active');
    
    const adminToken = await generateAdminUserToken();
    const sequenceStepsCrud = new CrudOperations('video_sequence_steps', adminToken);
    
    const filters: Record<string, any> = {};
    if (sequenceId) filters.sequence_id = parseInt(sequenceId);
    if (triggerType) filters.trigger_type = triggerType;
    if (isActive !== null) filters.is_active = isActive === 'true';
    
    const steps = await sequenceStepsCrud.findMany(filters, {
      limit: limit || 100,
      offset: offset || 0,
      orderBy: { column: 'step_order', direction: 'asc' }
    });
    
    return createSuccessResponse(steps);
  } catch (error) {
    console.error('Erreur lors de la récupération des étapes de séquence:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des étapes de séquence',
      status: 500,
    });
  }
}, false);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createSequenceStepSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent créer des étapes de séquence',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const sequenceStepsCrud = new CrudOperations('video_sequence_steps', adminToken);
    const videoSequencesCrud = new CrudOperations('video_sequences', adminToken);
    
    // Vérifier si la séquence existe
    const sequence = await videoSequencesCrud.findById(validatedData.sequence_id);
    if (!sequence) {
      return createErrorResponse({
        errorMessage: 'Séquence vidéo non trouvée',
        status: 404,
      });
    }
    
    // Vérifier si l'ordre n'est pas déjà pris
    const existingSteps = await sequenceStepsCrud.findMany({
      sequence_id: validatedData.sequence_id,
      step_order: validatedData.step_order
    });
    
    if (existingSteps && existingSteps.length > 0) {
      return createErrorResponse({
        errorMessage: 'Une étape avec cet ordre existe déjà dans cette séquence',
        status: 409,
      });
    }
    
    const stepData = {
      ...validatedData,
      is_active: true
    };
    
    const newStep = await sequenceStepsCrud.create(stepData);
    
    // Enregistrer l'historique
    const historyData = {
      sequence_id: validatedData.sequence_id,
      action: 'step_added',
      new_values: stepData,
      modified_by_admin_id: parseInt(params.payload?.sub || '0'),
      modification_reason: 'Ajout d\'une nouvelle étape'
    };
    
    const historyCrud = new CrudOperations('video_sequence_history', adminToken);
    await historyCrud.create(historyData);
    
    return createSuccessResponse(newStep, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création de l\'étape de séquence:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création de l\'étape de séquence',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de l\'étape requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updateSequenceStepSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent modifier des étapes de séquence',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const sequenceStepsCrud = new CrudOperations('video_sequence_steps', adminToken);
    
    // Vérifier si l'étape existe
    const existingStep = await sequenceStepsCrud.findById(id);
    if (!existingStep) {
      return createErrorResponse({
        errorMessage: 'Étape de séquence non trouvée',
        status: 404,
      });
    }
    
    // Si l'ordre change, vérifier qu'il n'y a pas de conflit
    if (validatedData.step_order && validatedData.step_order !== existingStep.step_order) {
      const conflictingSteps = await sequenceStepsCrud.findMany({
        sequence_id: existingStep.sequence_id,
        step_order: validatedData.step_order
      });
      
      if (conflictingSteps && conflictingSteps.length > 0) {
        return createErrorResponse({
          errorMessage: 'Une étape avec cet ordre existe déjà dans cette séquence',
          status: 409,
        });
      }
    }
    
    const updatedStep = await sequenceStepsCrud.update(id, validatedData);
    
    // Enregistrer l'historique
    const historyData = {
      sequence_id: existingStep.sequence_id,
      action: 'step_modified',
      old_values: existingStep,
      new_values: validatedData,
      modified_by_admin_id: parseInt(params.payload?.sub || '0'),
      modification_reason: 'Modification d\'étape par administrateur'
    };
    
    const historyCrud = new CrudOperations('video_sequence_history', adminToken);
    await historyCrud.create(historyData);
    
    return createSuccessResponse(updatedStep);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour de l\'étape de séquence:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour de l\'étape de séquence',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de l\'étape requis',
        status: 400,
      });
    }
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent supprimer des étapes de séquence',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const sequenceStepsCrud = new CrudOperations('video_sequence_steps', adminToken);
    
    // Vérifier si l'étape existe
    const existingStep = await sequenceStepsCrud.findById(id);
    if (!existingStep) {
      return createErrorResponse({
        errorMessage: 'Étape de séquence non trouvée',
        status: 404,
      });
    }
    
    // Annuler les communications programmées pour cette étape
    const scheduledCommsCrud = new CrudOperations('scheduled_video_communications', adminToken);
    const scheduledComms = await scheduledCommsCrud.findMany({ 
      sequence_step_id: parseInt(id),
      status: 'scheduled'
    });
    
    if (scheduledComms && scheduledComms.length > 0) {
      for (const comm of scheduledComms) {
        await scheduledCommsCrud.update(comm.id, { status: 'cancelled' });
      }
    }
    
    // Supprimer l'étape
    await sequenceStepsCrud.delete(id);
    
    // Enregistrer l'historique
    const historyData = {
      sequence_id: existingStep.sequence_id,
      action: 'step_removed',
      old_values: existingStep,
      modified_by_admin_id: parseInt(params.payload?.sub || '0'),
      modification_reason: 'Suppression d\'étape par administrateur'
    };
    
    const historyCrud = new CrudOperations('video_sequence_history', adminToken);
    await historyCrud.create(historyData);
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'étape de séquence:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression de l\'étape de séquence',
      status: 500,
    });
  }
}, true);
