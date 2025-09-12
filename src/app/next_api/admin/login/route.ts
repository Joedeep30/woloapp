
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, getRequestIp } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { verifyHashString, generateRandomString, pbkdf2Hash } from '@/lib/server-utils';
import { generateToken } from '@/lib/auth';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { z } from 'zod';

const adminLoginSchema = z.object({
  username: z.string().min(1, 'Nom d\'utilisateur requis'),
  password: z.string().min(1, 'Mot de passe requis')
});

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = adminLoginSchema.parse(body);

    const ip = getRequestIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Utiliser un token admin pour les opérations CRUD
    const adminToken = await generateAdminUserToken();
    const woloAdminsCrud = new CrudOperations('wolo_admins', adminToken);
    const adminSessionsCrud = new CrudOperations('admin_sessions', adminToken);

    // Rechercher l'administrateur par nom d'utilisateur
    const admins = await woloAdminsCrud.findMany({
      username: validatedData.username,
      is_active: true
    });

    const admin = admins?.[0];

    if (!admin) {
      return createErrorResponse({
        errorMessage: 'Nom d\'utilisateur ou mot de passe incorrect',
        status: 401,
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await verifyHashString(
      validatedData.password,
      admin.password
    );

    if (!isValidPassword) {
      return createErrorResponse({
        errorMessage: 'Nom d\'utilisateur ou mot de passe incorrect',
        status: 401,
      });
    }

    // Générer un token d'accès pour l'admin
    const accessToken = await generateToken({
      sub: admin.id.toString(),
      role: 'wolo_admin',
      email: admin.email
    });

    // Générer un token de session
    const sessionToken = generateRandomString(64);
    const hashedSessionToken = await pbkdf2Hash(sessionToken);

    // Créer une session admin
    const sessionData = {
      admin_id: admin.id,
      session_token: hashedSessionToken,
      ip_address: ip,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      is_active: true
    };

    await adminSessionsCrud.create(sessionData);

    // Mettre à jour la dernière connexion
    await woloAdminsCrud.update(admin.id, {
      last_login_at: new Date().toISOString()
    });

    // Retourner les informations de l'admin (sans mot de passe)
    const { password, ...adminResponse } = admin;

    return createSuccessResponse({
      admin: adminResponse,
      access_token: accessToken,
      session_token: sessionToken,
      expires_in: 24 * 60 * 60 // 24h en secondes
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    console.error('Erreur lors de la connexion admin:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la connexion',
      status: 500,
    });
  }
}, false);
