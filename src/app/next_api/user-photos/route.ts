

import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';

const uploadUserPhotoSchema = z.object({
  photo_url: z.string().url('URL de photo invalide'),
  photo_filename: z.string().min(1, 'Nom de fichier requis'),
  file_size: z.number().positive('Taille de fichier invalide'),
  mime_type: z.string().min(1, 'Type MIME requis')
});

const uploadMinorPhotoSchema = z.object({
  minor_id: z.number(),
  photo_url: z.string().url('URL de photo invalide'),
  photo_filename: z.string().min(1, 'Nom de fichier requis'),
  file_size: z.number().positive('Taille de fichier invalide'),
  mime_type: z.string().min(1, 'Type MIME requis')
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minorId = searchParams.get('minor_id');
    
    if (minorId) {
      // Récupérer les photos d'un mineur spécifique
      const minorPhotosCrud = new CrudOperations('minor_profile_photos', params.token);
      
      const photos = await minorPhotosCrud.findMany({
        minor_id: parseInt(minorId),
        is_active: true
      }, {
        orderBy: { column: 'create_time', direction: 'desc' }
      });
      
      return createSuccessResponse(photos);
    } else {
      // Récupérer la photo de profil de l'utilisateur connecté
      const usersCrud = new CrudOperations('users', params.token);
      const user = await usersCrud.findById(params.payload?.sub || '0');
      
      if (!user) {
        return createErrorResponse({
          errorMessage: 'Utilisateur non trouvé',
          status: 404,
        });
      }
      
      return createSuccessResponse({
        custom_profile_photo_url: user.custom_profile_photo_url,
        custom_photo_filename: user.custom_photo_filename,
        custom_photo_uploaded_at: user.custom_photo_uploaded_at
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des photos:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des photos',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const isMinorPhoto = 'minor_id' in body;
    
    if (isMinorPhoto) {
      // Upload de photo pour un mineur
      const validatedData = uploadMinorPhotoSchema.parse(body);
      
      const managedMinorsCrud = new CrudOperations('managed_minors', params.token);
      const minorPhotosCrud = new CrudOperations('minor_profile_photos', params.token);
      
      // Vérifier que le mineur existe et appartient à l'utilisateur
      const minor = await managedMinorsCrud.findById(validatedData.minor_id);
      if (!minor) {
        return createErrorResponse({
          errorMessage: 'Mineur non trouvé',
          status: 404,
        });
      }
      
      if (minor.manager_user_id !== parseInt(params.payload?.sub || '0')) {
        return createErrorResponse({
          errorMessage: 'Vous n\'êtes pas autorisé à modifier la photo de ce mineur',
          status: 403,
        });
      }
      
      // Désactiver l'ancienne photo si elle existe
      const existingPhotos = await minorPhotosCrud.findMany({
        minor_id: validatedData.minor_id,
        is_active: true
      });
      
      if (existingPhotos && existingPhotos.length > 0) {
        for (const photo of existingPhotos) {
          await minorPhotosCrud.update(photo.id, { is_active: false });
        }
      }
      
      // Créer la nouvelle photo
      const photoData = {
        minor_id: validatedData.minor_id,
        photo_url: validatedData.photo_url,
        photo_filename: validatedData.photo_filename,
        file_size: validatedData.file_size,
        mime_type: validatedData.mime_type,
        uploaded_by_user_id: parseInt(params.payload?.sub || '0'),
        is_active: true
      };
      
      const newPhoto = await minorPhotosCrud.create(photoData);
      
      // Créer une notification
      const notificationsCrud = new CrudOperations('notifications', params.token);
      await notificationsCrud.create({
        user_id: parseInt(params.payload?.sub || '0'),
        type: 'minor_photo_updated',
        title: 'Photo de mineur mise à jour',
        message: `Photo de ${minor.minor_name} mise à jour avec succès`,
        channel: 'email',
        recipient: params.payload?.email || '',
        status: 'pending'
      });
      
      return createSuccessResponse(newPhoto, 201);
      
    } else {
      // Upload de photo pour l'utilisateur connecté
      const validatedData = uploadUserPhotoSchema.parse(body);
      
      const usersCrud = new CrudOperations('users', params.token);
      
      // Mettre à jour la photo de profil de l'utilisateur
      const updatedUser = await usersCrud.update(params.payload?.sub || '0', {
        custom_profile_photo_url: validatedData.photo_url,
        custom_photo_filename: validatedData.photo_filename,
        custom_photo_uploaded_at: new Date().toISOString()
      });
      
      // Créer une notification
      const notificationsCrud = new CrudOperations('notifications', params.token);
      await notificationsCrud.create({
        user_id: parseInt(params.payload?.sub || '0'),
        type: 'profile_photo_updated',
        title: 'Photo de profil mise à jour',
        message: 'Votre photo de profil a été mise à jour avec succès',
        channel: 'email',
        recipient: params.payload?.email || '',
        status: 'pending'
      });
      
      return createSuccessResponse({
        custom_profile_photo_url: updatedUser.custom_profile_photo_url,
        custom_photo_filename: updatedUser.custom_photo_filename,
        custom_photo_uploaded_at: updatedUser.custom_photo_uploaded_at
      }, 201);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de l\'upload de photo:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'upload de photo',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minorId = searchParams.get('minor_id');
    
    if (minorId) {
      // Supprimer la photo d'un mineur
      const managedMinorsCrud = new CrudOperations('managed_minors', params.token);
      const minorPhotosCrud = new CrudOperations('minor_profile_photos', params.token);
      
      // Vérifier que le mineur appartient à l'utilisateur
      const minor = await managedMinorsCrud.findById(minorId);
      if (!minor) {
        return createErrorResponse({
          errorMessage: 'Mineur non trouvé',
          status: 404,
        });
      }
      
      if (minor.manager_user_id !== parseInt(params.payload?.sub || '0')) {
        return createErrorResponse({
          errorMessage: 'Vous n\'êtes pas autorisé à supprimer la photo de ce mineur',
          status: 403,
        });
      }
      
      // Désactiver toutes les photos du mineur
      const existingPhotos = await minorPhotosCrud.findMany({
        minor_id: parseInt(minorId),
        is_active: true
      });
      
      if (existingPhotos && existingPhotos.length > 0) {
        for (const photo of existingPhotos) {
          await minorPhotosCrud.update(photo.id, { is_active: false });
        }
      }
      
      return createSuccessResponse({ minor_id: minorId });
      
    } else {
      // Supprimer la photo de profil de l'utilisateur connecté
      const usersCrud = new CrudOperations('users', params.token);
      
      await usersCrud.update(params.payload?.sub || '0', {
        custom_profile_photo_url: null,
        custom_photo_filename: null,
        custom_photo_uploaded_at: null
      });
      
      return createSuccessResponse({ user_id: params.payload?.sub });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de photo:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression de photo',
      status: 500,
    });
  }
}, true);

