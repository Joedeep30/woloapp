
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { z } from 'zod';

const createVideoSequenceSchema = z.object({
  sequence_name: z.string().min(3, 'Le nom de la séquence doit contenir au moins 3 caractères'),
  sequence_type: z.enum(['default', 'minor', 'adult', 'special_event']),
  description: z.string().optional(),
  is_default: z.boolean().default(false)
});

const updateVideoSequenceSchema = z.object({
  sequence_name: z.string().min(3).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional()
});

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

export const GET = requestMiddleware(async (request: NextRequest) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const sequenceType = searchParams.get('sequence_type');
    const isActive = searchParams.get('is_active');
    const isDefault = searchParams.get('is_default');
    const includeSteps = searchParams.get('include_steps') === 'true';
    
    const adminToken = await generateAdminUserToken();
    const videoSequencesCrud = new CrudOperations('video_sequences', adminToken);
    
    const filters: Record<string, any> = {};
    if (sequenceType) filters.sequence_type = sequenceType;
    if (isActive !== null) filters.is_active = isActive === 'true';
    if (isDefault !== null) filters.is_default = isDefault === 'true';
    
    const sequences = await videoSequencesCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    // Si demandé, inclure les étapes pour chaque séquence
    if (includeSteps && sequences) {
      const sequenceStepsCrud = new CrudOperations('video_sequence_steps', adminToken);
      
      for (const sequence of sequences) {
        const steps = await sequenceStepsCrud.findMany(
          { sequence_id: sequence.id },
          { orderBy: { column: 'step_order', direction: 'asc' } }
        );
        sequence.steps = steps || [];
      }
    }
    
    return createSuccessResponse(sequences);
  } catch (error) {
    console.error('Erreur lors de la récupération des séquences vidéo:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des séquences vidéo',
      status: 500,
    });
  }
}, false);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createVideoSequenceSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent créer des séquences vidéo',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const videoSequencesCrud = new CrudOperations('video_sequences', adminToken);
    
    // Vérifier si une séquence avec ce nom existe déjà
    const existingSequences = await videoSequencesCrud.findMany({
      sequence_name: validatedData.sequence_name
    });
    
    if (existingSequences && existingSequences.length > 0) {
      return createErrorResponse({
        errorMessage: 'Une séquence avec ce nom existe déjà',
        status: 409,
      });
    }
    
    // Si c'est marqué comme défaut, désactiver les autres séquences par défaut du même type
    if (validatedData.is_default) {
      const defaultSequences = await videoSequencesCrud.findMany({
        sequence_type: validatedData.sequence_type,
        is_default: true
      });
      
      if (defaultSequences && defaultSequences.length > 0) {
        for (const seq of defaultSequences) {
          await videoSequencesCrud.update(seq.id, { is_default: false });
        }
      }
    }
    
    const sequenceData = {
      ...validatedData,
      created_by_admin_id: parseInt(params.payload?.sub || '0'),
      is_active: true
    };
    
    const newSequence = await videoSequencesCrud.create(sequenceData);
    
    // Enregistrer l'historique
    const historyData = {
      sequence_id: newSequence.id,
      action: 'created',
      new_values: sequenceData,
      modified_by_admin_id: parseInt(params.payload?.sub || '0'),
      modification_reason: 'Création initiale de la séquence'
    };
    
    const historyCrud = new CrudOperations('video_sequence_history', adminToken);
    await historyCrud.create(historyData);
    
    return createSuccessResponse(newSequence, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création de la séquence vidéo:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création de la séquence vidéo',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de la séquence requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updateVideoSequenceSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent modifier des séquences vidéo',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const videoSequencesCrud = new CrudOperations('video_sequences', adminToken);
    
    // Vérifier si la séquence existe
    const existingSequence = await videoSequencesCrud.findById(id);
    if (!existingSequence) {
      return createErrorResponse({
        errorMessage: 'Séquence vidéo non trouvée',
        status: 404,
      });
    }
    
    // Si c'est marqué comme défaut, désactiver les autres séquences par défaut du même type
    if (validatedData.is_default) {
      const defaultSequences = await videoSequencesCrud.findMany({
        sequence_type: existingSequence.sequence_type,
        is_default: true
      });
      
      if (defaultSequences && defaultSequences.length > 0) {
        for (const seq of defaultSequences) {
          if (seq.id !== parseInt(id)) {
            await videoSequencesCrud.update(seq.id, { is_default: false });
          }
        }
      }
    }
    
    const updatedSequence = await videoSequencesCrud.update(id, validatedData);
    
    // Enregistrer l'historique
    const historyData = {
      sequence_id: parseInt(id),
      action: validatedData.is_active === false ? 'deactivated' : 
              validatedData.is_active === true ? 'activated' : 'updated',
      old_values: existingSequence,
      new_values: validatedData,
      modified_by_admin_id: parseInt(params.payload?.sub || '0'),
      modification_reason: 'Modification par administrateur'
    };
    
    const historyCrud = new CrudOperations('video_sequence_history', adminToken);
    await historyCrud.create(historyData);
    
    return createSuccessResponse(updatedSequence);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour de la séquence vidéo:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour de la séquence vidéo',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID de la séquence requis',
        status: 400,
      });
    }
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent supprimer des séquences vidéo',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const videoSequencesCrud = new CrudOperations('video_sequences', adminToken);
    
    // Vérifier si la séquence existe
    const existingSequence = await videoSequencesCrud.findById(id);
    if (!existingSequence) {
      return createErrorResponse({
        errorMessage: 'Séquence vidéo non trouvée',
        status: 404,
      });
    }
    
    // Supprimer les étapes associées
    const stepsCrud = new CrudOperations('video_sequence_steps', adminToken);
    const associatedSteps = await stepsCrud.findMany({ sequence_id: parseInt(id) });
    
    if (associatedSteps && associatedSteps.length > 0) {
      for (const step of associatedSteps) {
        await stepsCrud.delete(step.id);
      }
    }
    
    // Supprimer les communications programmées
    const scheduledCommsCrud = new CrudOperations('scheduled_video_communications', adminToken);
    const scheduledComms = await scheduledCommsCrud.findMany({ sequence_step_id: parseInt(id) });
    
    if (scheduledComms && scheduledComms.length > 0) {
      for (const comm of scheduledComms) {
        await scheduledCommsCrud.update(comm.id, { status: 'cancelled' });
      }
    }
    
    // Supprimer la séquence
    await videoSequencesCrud.delete(id);
    
    // Enregistrer l'historique
    const historyData = {
      sequence_id: parseInt(id),
      action: 'deleted',
      old_values: existingSequence,
      modified_by_admin_id: parseInt(params.payload?.sub || '0'),
      modification_reason: 'Suppression par administrateur'
    };
    
    const historyCrud = new CrudOperations('video_sequence_history', adminToken);
    await historyCrud.create(historyData);
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression de la séquence vidéo:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression de la séquence vidéo',
      status: 500,
    });
  }
}, true);
