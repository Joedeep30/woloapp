
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { hashString } from '@/lib/server-utils';
import { z } from 'zod';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';

const createAdminSchema = z.object({
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  admin_type: z.enum(['super_admin', 'developer_admin'], {
    errorMap: () => ({ message: 'Type d\'admin invalide' })
  })
});

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createAdminSchema.parse(body);

    // Utiliser un token admin pour les opérations CRUD
    const adminToken = await generateAdminUserToken();
    const woloAdminsCrud = new CrudOperations('wolo_admins', adminToken);

    // Vérifier si l'utilisateur ou l'email existe déjà
    const existingUsername = await woloAdminsCrud.findMany({
      username: validatedData.username
    });

    if (existingUsername && existingUsername.length > 0) {
      return createErrorResponse({
        errorMessage: 'Ce nom d\'utilisateur existe déjà',
        status: 409,
      });
    }

    const existingEmail = await woloAdminsCrud.findMany({
      email: validatedData.email
    });

    if (existingEmail && existingEmail.length > 0) {
      return createErrorResponse({
        errorMessage: 'Cet email est déjà utilisé',
        status: 409,
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await hashString(validatedData.password);

    // Créer l'administrateur
    const adminData = {
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      admin_type: validatedData.admin_type,
      is_active: true
    };

    const newAdmin = await woloAdminsCrud.create(adminData);

    // Retourner les données sans le mot de passe
    const { password, ...adminResponse } = newAdmin;

    return createSuccessResponse(adminResponse, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    console.error('Erreur lors de la création de l\'admin:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création de l\'administrateur',
      status: 500,
    });
  }
}, false);
