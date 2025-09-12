
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { z } from 'zod';

const createPartnerSchema = z.object({
  partner_name: z.string().min(3, 'Le nom du partenaire doit contenir au moins 3 caractères'),
  partner_type: z.enum(['cinema', 'beauty', 'casino', 'cruise', 'limo', 'pilgrimage']),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  revenue_share_percentage: z.number().min(0).max(100).default(50),
  api_endpoint: z.string().url().optional(),
  api_key: z.string().optional(),
  operating_hours: z.any().optional(),
  partner_emails: z.array(z.string().email()).default([]),
  notification_preferences: z.any().optional()
});

const updatePartnerSchema = z.object({
  partner_name: z.string().min(3).optional(),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  revenue_share_percentage: z.number().min(0).max(100).optional(),
  api_endpoint: z.string().url().optional(),
  api_key: z.string().optional(),
  is_active: z.boolean().optional(),
  operating_hours: z.any().optional(),
  partner_emails: z.array(z.string().email()).optional(),
  notification_preferences: z.any().optional()
});

export const GET = requestMiddleware(async (request: NextRequest) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const partnerType = searchParams.get('partner_type');
    const isActive = searchParams.get('is_active');
    
    const adminToken = await generateAdminUserToken();
    const partnersCrud = new CrudOperations('partners', adminToken);
    
    const filters: Record<string, any> = {};
    if (partnerType) filters.partner_type = partnerType;
    if (isActive !== null) filters.is_active = isActive === 'true';
    
    const partners = await partnersCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(partners);
  } catch (error) {
    console.error('Erreur lors de la récupération des partenaires:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des partenaires',
      status: 500,
    });
  }
}, false);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createPartnerSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent créer des partenaires',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const partnersCrud = new CrudOperations('partners', adminToken);
    
    // Vérifier si un partenaire avec ce nom existe déjà
    const existingPartners = await partnersCrud.findMany({
      partner_name: validatedData.partner_name
    });
    
    if (existingPartners && existingPartners.length > 0) {
      return createErrorResponse({
        errorMessage: 'Un partenaire avec ce nom existe déjà',
        status: 409,
      });
    }
    
    const partnerData = {
      ...validatedData,
      is_active: true,
      revenue_share_history: JSON.stringify([{
        percentage: validatedData.revenue_share_percentage,
        changed_at: new Date().toISOString(),
        changed_by: 'admin'
      }])
    };
    
    const newPartner = await partnersCrud.create(partnerData);
    
    return createSuccessResponse(newPartner, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du partenaire:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création du partenaire',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du partenaire requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updatePartnerSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent modifier des partenaires',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const partnersCrud = new CrudOperations('partners', adminToken);
    
    // Vérifier si le partenaire existe
    const existingPartner = await partnersCrud.findById(id);
    if (!existingPartner) {
      return createErrorResponse({
        errorMessage: 'Partenaire non trouvé',
        status: 404,
      });
    }
    
    // Si le pourcentage de partage change, l'ajouter à l'historique
    let updateData: any = { ...validatedData };
    if (validatedData.revenue_share_percentage && validatedData.revenue_share_percentage !== existingPartner.revenue_share_percentage) {
      const currentHistory = existingPartner.revenue_share_history ? JSON.parse(existingPartner.revenue_share_history) : [];
      currentHistory.push({
        percentage: validatedData.revenue_share_percentage,
        changed_at: new Date().toISOString(),
        changed_by: params.payload?.email || 'admin'
      });
      updateData.revenue_share_history = JSON.stringify(currentHistory);
    }
    
    const updatedPartner = await partnersCrud.update(id, updateData);
    
    return createSuccessResponse(updatedPartner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour du partenaire:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour du partenaire',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du partenaire requis',
        status: 400,
      });
    }
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent supprimer des partenaires',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const partnersCrud = new CrudOperations('partners', adminToken);
    
    // Vérifier si le partenaire existe
    const existingPartner = await partnersCrud.findById(id);
    if (!existingPartner) {
      return createErrorResponse({
        errorMessage: 'Partenaire non trouvé',
        status: 404,
      });
    }
    
    // Vérifier s'il y a des packages associés
    const packagesCrud = new CrudOperations('partner_packages', adminToken);
    const associatedPackages = await packagesCrud.findMany({ partner_id: parseInt(id) });
    
    if (associatedPackages && associatedPackages.length > 0) {
      return createErrorResponse({
        errorMessage: 'Impossible de supprimer un partenaire qui a des packages associés',
        status: 400,
      });
    }
    
    // Marquer comme inactif plutôt que supprimer
    await partnersCrud.update(id, { is_active: false });
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression du partenaire:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression du partenaire',
      status: 500,
    });
  }
}, true);
