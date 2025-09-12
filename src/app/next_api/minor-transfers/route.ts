
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateRandomString } from '@/lib/server-utils';
import { z } from 'zod';

const createTransferSchema = z.object({
  minor_id: z.number(),
  to_user_email: z.string().email('Email invalide'),
  to_user_name: z.string().min(2, 'Nom du destinataire requis'),
  transfer_reason: z.string().optional()
});

const acceptTransferSchema = z.object({
  transfer_token: z.string().min(1, 'Token de transfert requis')
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const minorId = searchParams.get('minor_id');
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');
    
    const transfersCrud = new CrudOperations('minor_management_transfers', params.token);
    
    const filters: Record<string, any> = {};
    if (minorId) filters.minor_id = parseInt(minorId);
    if (status) filters.status = status;
    if (userId) {
      // Rechercher les transferts où l'utilisateur est impliqué
      const userIdInt = parseInt(userId);
      const allTransfers = await transfersCrud.findMany({}, {
        limit: limit || 50,
        offset: offset || 0,
        orderBy: { column: 'create_time', direction: 'desc' }
      });
      
      const userTransfers = allTransfers?.filter(t => 
        t.from_user_id === userIdInt || t.to_user_id === userIdInt
      ) || [];
      
      return createSuccessResponse(userTransfers);
    }
    
    const transfers = await transfersCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(transfers);
  } catch (error) {
    console.error('Erreur lors de la récupération des transferts:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des transferts',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createTransferSchema.parse(body);
    
    const transfersCrud = new CrudOperations('minor_management_transfers', params.token);
    const managedMinorsCrud = new CrudOperations('managed_minors', params.token);
    const usersCrud = new CrudOperations('users', params.token);
    
    // Vérifier si le mineur existe et appartient à l'utilisateur
    const minor = await managedMinorsCrud.findById(validatedData.minor_id);
    if (!minor) {
      return createErrorResponse({
        errorMessage: 'Mineur non trouvé',
        status: 404,
      });
    }
    
    if (minor.manager_user_id !== parseInt(params.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à transférer ce mineur',
        status: 403,
      });
    }
    
    // Vérifier si l'utilisateur destinataire existe
    const toUsers = await usersCrud.findMany({ email: validatedData.to_user_email });
    if (!toUsers || toUsers.length === 0) {
      return createErrorResponse({
        errorMessage: 'L\'utilisateur destinataire n\'existe pas dans le système',
        status: 404,
      });
    }
    
    const toUser = toUsers[0];
    
    // Vérifier s'il n'y a pas déjà un transfert en cours pour ce mineur
    const pendingTransfers = await transfersCrud.findMany({
      minor_id: validatedData.minor_id,
      status: 'pending'
    });
    
    if (pendingTransfers && pendingTransfers.length > 0) {
      return createErrorResponse({
        errorMessage: 'Un transfert est déjà en cours pour ce mineur',
        status: 409,
      });
    }
    
    // Générer un token de transfert unique
    const transferToken = generateRandomString(32);
    
    // Calculer la date d'expiration (7 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const transferData = {
      minor_id: validatedData.minor_id,
      from_user_id: parseInt(params.payload?.sub || '0'),
      to_user_id: toUser.id,
      from_user_name: minor.created_by_name,
      to_user_name: validatedData.to_user_name,
      transfer_reason: validatedData.transfer_reason,
      transfer_token: transferToken,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    };
    
    const newTransfer = await transfersCrud.create(transferData);
    
    // Créer une notification pour le destinataire
    const notificationsCrud = new CrudOperations('notifications', params.token);
    await notificationsCrud.create({
      user_id: toUser.id,
      type: 'minor_transfer_request',
      title: 'Demande de transfert de gestion',
      message: `${minor.created_by_name} souhaite vous transférer la gestion de ${minor.minor_name}`,
      channel: 'email',
      recipient: validatedData.to_user_email,
      status: 'pending'
    });
    
    // URL d'acceptation du transfert
    const acceptUrl = `${request.headers.get('origin')}/minor-transfer/accept/${transferToken}`;
    
    return createSuccessResponse({
      ...newTransfer,
      accept_url: acceptUrl
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du transfert:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la demande de transfert',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = acceptTransferSchema.parse(body);
    
    const transfersCrud = new CrudOperations('minor_management_transfers', params.token);
    const managedMinorsCrud = new CrudOperations('managed_minors', params.token);
    
    // Trouver le transfert par token
    const transfers = await transfersCrud.findMany({
      transfer_token: validatedData.transfer_token,
      status: 'pending'
    });
    
    if (!transfers || transfers.length === 0) {
      return createErrorResponse({
        errorMessage: 'Demande de transfert non trouvée ou expirée',
        status: 404,
      });
    }
    
    const transfer = transfers[0];
    
    // Vérifier si le transfert n'a pas expiré
    if (new Date(transfer.expires_at) < new Date()) {
      await transfersCrud.update(transfer.id, { status: 'expired' });
      return createErrorResponse({
        errorMessage: 'Cette demande de transfert a expiré',
        status: 400,
      });
    }
    
    // Vérifier que l'utilisateur connecté est bien le destinataire
    if (transfer.to_user_id !== parseInt(params.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à accepter ce transfert',
        status: 403,
      });
    }
    
    // Effectuer le transfert
    await managedMinorsCrud.update(transfer.minor_id, {
      manager_user_id: transfer.to_user_id,
      created_by_name: transfer.to_user_name
    });
    
    // Marquer le transfert comme accepté
    await transfersCrud.update(transfer.id, {
      status: 'accepted',
      accepted_at: new Date().toISOString()
    });
    
    // Créer des notifications
    const notificationsCrud = new CrudOperations('notifications', params.token);
    
    // Notification pour l'ancien gestionnaire
    await notificationsCrud.create({
      user_id: transfer.from_user_id,
      type: 'minor_transfer_completed',
      title: 'Transfert de gestion accepté',
      message: `${transfer.to_user_name} a accepté la gestion du mineur`,
      channel: 'email',
      recipient: 'from_user@example.com', // À récupérer depuis la table users
      status: 'pending'
    });
    
    // Notification pour le nouveau gestionnaire
    await notificationsCrud.create({
      user_id: transfer.to_user_id,
      type: 'minor_management_received',
      title: 'Gestion de mineur transférée',
      message: `Vous gérez maintenant le mineur transféré par ${transfer.from_user_name}`,
      channel: 'email',
      recipient: params.payload?.email || '',
      status: 'pending'
    });
    
    return createSuccessResponse({
      transfer_id: transfer.id,
      minor_id: transfer.minor_id,
      new_manager: transfer.to_user_name
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de l\'acceptation du transfert:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'acceptation du transfert',
      status: 500,
    });
  }
}, true);
