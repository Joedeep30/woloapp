
import { NextRequest } from 'next/server';
import { requestMiddleware, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';

export const GET = requestMiddleware(async (request: NextRequest) => {
  try {
    const { limit, offset, search } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const adminType = searchParams.get('admin_type');
    const isActive = searchParams.get('is_active');
    
    // Utiliser un token admin pour les opérations CRUD
    const adminToken = await generateAdminUserToken();
    const woloAdminsCrud = new CrudOperations('wolo_admins', adminToken);

    // Construire les filtres
    const filters: Record<string, any> = {};
    if (adminType) filters.admin_type = adminType;
    if (isActive !== null) filters.is_active = isActive === 'true';
    
    let admins = await woloAdminsCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: {
        column: 'create_time',
        direction: 'desc'
      }
    });

    // Filtrer par recherche côté application si nécessaire
    if (search && admins) {
      const searchLower = search.toLowerCase();
      admins = admins.filter(admin => 
        admin.username.toLowerCase().includes(searchLower) ||
        admin.email.toLowerCase().includes(searchLower) ||
        admin.first_name.toLowerCase().includes(searchLower) ||
        admin.last_name.toLowerCase().includes(searchLower)
      );
    }

    // Supprimer les mots de passe des résultats
    const safeAdmins = admins?.map(admin => {
      const { password, ...safeAdmin } = admin;
      return safeAdmin;
    }) || [];

    return createSuccessResponse(safeAdmins);

  } catch (error) {
    console.error('Erreur lors de la récupération des admins:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des administrateurs',
      status: 500,
    });
  }
}, false);
