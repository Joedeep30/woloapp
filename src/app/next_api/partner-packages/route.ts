
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { z } from 'zod';

const createPackageSchema = z.object({
  partner_id: z.number(),
  package_name: z.string().min(3, 'Le nom du package doit contenir au moins 3 caractères'),
  package_type: z.enum(['cinema', 'beauty', 'casino', 'cruise', 'limo', 'pilgrimage']),
  description: z.string().optional(),
  detailed_description: z.string().optional(),
  min_tickets: z.number().positive().default(1),
  max_tickets: z.number().positive().default(1),
  includes_extras: z.array(z.string()).default([]),
  price_per_unit: z.number().positive().optional(),
  total_price: z.number().positive(),
  package_image_url: z.string().url().optional(),
  terms_conditions: z.string().optional(),
  validity_days: z.number().positive().default(365)
});

const updatePackageSchema = z.object({
  package_name: z.string().min(3).optional(),
  description: z.string().optional(),
  detailed_description: z.string().optional(),
  min_tickets: z.number().positive().optional(),
  max_tickets: z.number().positive().optional(),
  includes_extras: z.array(z.string()).optional(),
  price_per_unit: z.number().positive().optional(),
  total_price: z.number().positive().optional(),
  package_image_url: z.string().url().optional(),
  terms_conditions: z.string().optional(),
  validity_days: z.number().positive().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().optional()
});

export const GET = requestMiddleware(async (request: NextRequest) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partner_id');
    const packageType = searchParams.get('package_type');
    const isActive = searchParams.get('is_active');
    
    const adminToken = await generateAdminUserToken();
    const packagesCrud = new CrudOperations('partner_packages', adminToken);
    
    const filters: Record<string, any> = {};
    if (partnerId) filters.partner_id = parseInt(partnerId);
    if (packageType) filters.package_type = packageType;
    if (isActive !== null) filters.is_active = isActive === 'true';
    
    const packages = await packagesCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'display_order', direction: 'asc' }
    });
    
    return createSuccessResponse(packages);
  } catch (error) {
    console.error('Erreur lors de la récupération des packages:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des packages',
      status: 500,
    });
  }
}, false);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createPackageSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent créer des packages',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const packagesCrud = new CrudOperations('partner_packages', adminToken);
    const partnersCrud = new CrudOperations('partners', adminToken);
    
    // Vérifier si le partenaire existe
    const partner = await partnersCrud.findById(validatedData.partner_id);
    if (!partner) {
      return createErrorResponse({
        errorMessage: 'Partenaire non trouvé',
        status: 404,
      });
    }
    
    // Vérifier que le type de package correspond au type de partenaire
    if (partner.partner_type !== validatedData.package_type) {
      return createErrorResponse({
        errorMessage: 'Le type de package doit correspondre au type de partenaire',
        status: 400,
      });
    }
    
    const packageData = {
      ...validatedData,
      includes_extras: JSON.stringify(validatedData.includes_extras),
      is_active: true,
      display_order: 0
    };
    
    const newPackage = await packagesCrud.create(packageData);
    
    // Tracker l'événement
    const analyticsCrud = new CrudOperations('analytics_events', adminToken);
    await analyticsCrud.create({
      event_type: 'package_created',
      event_category: 'admin_action',
      event_data: {
        partner_id: validatedData.partner_id,
        package_type: validatedData.package_type,
        package_name: validatedData.package_name,
        total_price: validatedData.total_price
      }
    });
    
    return createSuccessResponse(newPackage, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du package:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création du package',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du package requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updatePackageSchema.parse(body);
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent modifier des packages',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const packagesCrud = new CrudOperations('partner_packages', adminToken);
    
    // Vérifier si le package existe
    const existingPackage = await packagesCrud.findById(id);
    if (!existingPackage) {
      return createErrorResponse({
        errorMessage: 'Package non trouvé',
        status: 404,
      });
    }
    
    // Préparer les données de mise à jour
    let updateData: any = { ...validatedData };
    if (validatedData.includes_extras) {
      updateData.includes_extras = JSON.stringify(validatedData.includes_extras);
    }
    
    const updatedPackage = await packagesCrud.update(id, updateData);
    
    // Tracker l'événement
    const analyticsCrud = new CrudOperations('analytics_events', adminToken);
    await analyticsCrud.create({
      event_type: 'package_updated',
      event_category: 'admin_action',
      event_data: {
        package_id: parseInt(id),
        changes: validatedData
      }
    });
    
    return createSuccessResponse(updatedPackage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour du package:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour du package',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du package requis',
        status: 400,
      });
    }
    
    // Vérifier que l'utilisateur est admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent supprimer des packages',
        status: 403,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const packagesCrud = new CrudOperations('partner_packages', adminToken);
    
    // Vérifier si le package existe
    const existingPackage = await packagesCrud.findById(id);
    if (!existingPackage) {
      return createErrorResponse({
        errorMessage: 'Package non trouvé',
        status: 404,
      });
    }
    
    // Vérifier s'il y a des cagnottes qui utilisent ce package
    const potPackagesCrud = new CrudOperations('pot_packages', adminToken);
    const associatedPots = await potPackagesCrud.findMany({ package_id: parseInt(id) });
    
    if (associatedPots && associatedPots.length > 0) {
      return createErrorResponse({
        errorMessage: 'Impossible de supprimer un package utilisé par des cagnottes',
        status: 400,
      });
    }
    
    // Marquer comme inactif plutôt que supprimer
    await packagesCrud.update(id, { is_active: false });
    
    // Tracker l'événement
    const analyticsCrud = new CrudOperations('analytics_events', adminToken);
    await analyticsCrud.create({
      event_type: 'package_deactivated',
      event_category: 'admin_action',
      event_data: {
        package_id: parseInt(id),
        package_name: existingPackage.package_name
      }
    });
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression du package:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression du package',
      status: 500,
    });
  }
}, true);
