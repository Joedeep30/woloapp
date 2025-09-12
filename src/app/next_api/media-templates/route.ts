
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { z } from 'zod';

const createMediaTemplateSchema = z.object({
  template_name: z.string().min(3, 'Le nom du template doit contenir au moins 3 caractères'),
  template_type: z.enum(['social_share', 'invitation', 'sponsorship', 'notification', 'birthday_greeting']),
  category: z.enum(['facebook', 'instagram', 'whatsapp', 'tiktok', 'snapchat', 'twitter', 'linkedin', 'email', 'sms', 'general']),
  content_type: z.enum(['video', 'image', 'text', 'mixed']),
  description: z.string().optional(),
  original_file_url: z.string().optional(),
  original_filename: z.string().optional(),
  file_size: z.number().optional(),
  mime_type: z.string().optional(),
  message_content: z.string().optional()
});

const updateMediaTemplateSchema = z.object({
  template_name: z.string().min(3).optional(),
  description: z.string().optional(),
  message_content: z.string().optional(),
  is_active: z.boolean().optional()
});

export const GET = requestMiddleware(async (request: NextRequest) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const templateType = searchParams.get('template_type');
    const category = searchParams.get('category');
    const contentType = searchParams.get('content_type');
    const isActive = searchParams.get('is_active');
    
    const adminToken = await generateAdminUserToken();
    const mediaTemplatesCrud = new CrudOperations('admin_media_templates', adminToken);
    
    const filters: Record<string, any> = {};
    if (templateType) filters.template_type = templateType;
    if (category) filters.category = category;
    if (contentType) filters.content_type = contentType;
    if (isActive !== null) filters.is_active = isActive === 'true';
    
    const templates = await mediaTemplatesCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(templates);
  } catch (error) {
    console.error('Erreur lors de la récupération des templates média:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des templates média',
      status: 500,
    });
  }
}, false);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createMediaTemplateSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent créer des templates média',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const mediaTemplatesCrud = new CrudOperations('admin_media_templates', adminToken);
    
    // Vérifier si un template avec ce nom existe déjà
    const existingTemplates = await mediaTemplatesCrud.findMany({
      template_name: validatedData.template_name
    });
    
    if (existingTemplates && existingTemplates.length > 0) {
      return createErrorResponse({
        errorMessage: 'Un template avec ce nom existe déjà',
        status: 409,
      });
    }
    
    const templateData = {
      ...validatedData,
      created_by_admin_id: parseInt(params.payload?.sub || '0'),
      is_active: true
    };
    
    const newTemplate = await mediaTemplatesCrud.create(templateData);
    
    // Enregistrer l'historique
    const historyData = {
      template_id: newTemplate.id,
      action: 'created',
      new_values: templateData,
      modified_by_admin_id: parseInt(params.payload?.sub || '0'),
      modification_reason: 'Création initiale du template'
    };
    
    const historyCrud = new CrudOperations('admin_media_template_history', adminToken);
    await historyCrud.create(historyData);
    
    return createSuccessResponse(newTemplate, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du template média:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création du template média',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du template requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updateMediaTemplateSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent modifier des templates média',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const mediaTemplatesCrud = new CrudOperations('admin_media_templates', adminToken);
    
    // Vérifier si le template existe
    const existingTemplate = await mediaTemplatesCrud.findById(id);
    if (!existingTemplate) {
      return createErrorResponse({
        errorMessage: 'Template média non trouvé',
        status: 404,
      });
    }
    
    const updatedTemplate = await mediaTemplatesCrud.update(id, validatedData);
    
    // Enregistrer l'historique
    const historyData = {
      template_id: parseInt(id),
      action: validatedData.is_active === false ? 'deactivated' : 
              validatedData.is_active === true ? 'activated' : 'updated',
      old_values: existingTemplate,
      new_values: validatedData,
      modified_by_admin_id: parseInt(params.payload?.sub || '0'),
      modification_reason: 'Modification par administrateur'
    };
    
    const historyCrud = new CrudOperations('admin_media_template_history', adminToken);
    await historyCrud.create(historyData);
    
    return createSuccessResponse(updatedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour du template média:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour du template média',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du template requis',
        status: 400,
      });
    }
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent supprimer des templates média',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const mediaTemplatesCrud = new CrudOperations('admin_media_templates', adminToken);
    
    // Vérifier si le template existe
    const existingTemplate = await mediaTemplatesCrud.findById(id);
    if (!existingTemplate) {
      return createErrorResponse({
        errorMessage: 'Template média non trouvé',
        status: 404,
      });
    }
    
    // Supprimer les formats associés
    const formatsCrud = new CrudOperations('social_media_formats', adminToken);
    const associatedFormats = await formatsCrud.findMany({ template_id: parseInt(id) });
    
    if (associatedFormats && associatedFormats.length > 0) {
      for (const format of associatedFormats) {
        await formatsCrud.delete(format.id);
      }
    }
    
    // Supprimer le template
    await mediaTemplatesCrud.delete(id);
    
    // Enregistrer l'historique
    const historyData = {
      template_id: parseInt(id),
      action: 'deleted',
      old_values: existingTemplate,
      modified_by_admin_id: parseInt(params.payload?.sub || '0'),
      modification_reason: 'Suppression par administrateur'
    };
    
    const historyCrud = new CrudOperations('admin_media_template_history', adminToken);
    await historyCrud.create(historyData);
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression du template média:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression du template média',
      status: 500,
    });
  }
}, true);
