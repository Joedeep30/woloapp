
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { pbkdf2Hash } from '@/lib/server-utils';
import { z } from 'zod';

const importContactsSchema = z.object({
  contacts: z.array(z.object({
    name: z.string().min(1, 'Le nom du contact est requis'),
    phone: z.string().min(8, 'Numéro de téléphone invalide')
  })).min(1, 'Au moins un contact est requis')
});

const sendInvitationsSchema = z.object({
  contact_ids: z.array(z.string()).min(1, 'Au moins un contact doit être sélectionné'),
  invitation_message: z.string().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    const contactsCrud = new CrudOperations('user_whatsapp_contacts', params.token);
    
    const filters: Record<string, any> = {
      user_id: parseInt(params.payload?.sub || '0')
    };
    
    let contacts = await contactsCrud.findMany(filters, {
      limit: limit || 100,
      offset: offset || 0,
      orderBy: { column: 'contact_name', direction: 'asc' }
    });
    
    // Filtrer par recherche côté application si nécessaire
    if (search && contacts) {
      const searchLower = search.toLowerCase();
      contacts = contacts.filter(contact => 
        contact.contact_name.toLowerCase().includes(searchLower) ||
        contact.contact_phone.includes(search)
      );
    }
    
    return createSuccessResponse(contacts);
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts WhatsApp:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des contacts WhatsApp',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = importContactsSchema.parse(body);
    
    const contactsCrud = new CrudOperations('user_whatsapp_contacts', params.token);
    const usersCrud = new CrudOperations('users', params.token);
    
    const userId = parseInt(params.payload?.sub || '0');
    const importedContacts = [];
    const skippedContacts = [];
    
    for (const contact of validatedData.contacts) {
      try {
        // Créer un hash unique pour éviter les doublons
        const contactHash = await pbkdf2Hash(`${contact.name}_${contact.phone}`);
        
        // Vérifier si ce contact existe déjà pour cet utilisateur
        const existingContacts = await contactsCrud.findMany({
          user_id: userId,
          contact_hash: contactHash
        });
        
        if (existingContacts && existingContacts.length > 0) {
          skippedContacts.push({
            name: contact.name,
            phone: contact.phone,
            reason: 'Contact déjà importé'
          });
          continue;
        }
        
        // Vérifier si ce numéro correspond à un utilisateur existant
        const existingUsers = await usersCrud.findMany({
          phone: contact.phone
        });
        
        const isExistingUser = existingUsers && existingUsers.length > 0;
        const existingUserId = isExistingUser ? existingUsers[0].id : null;
        
        // Créer le contact
        const contactData = {
          user_id: userId,
          contact_name: contact.name,
          contact_phone: contact.phone,
          contact_hash: contactHash,
          is_already_user: isExistingUser,
          existing_user_id: existingUserId
        };
        
        const newContact = await contactsCrud.create(contactData);
        importedContacts.push(newContact);
        
      } catch (error) {
        console.error(`Erreur lors de l'import du contact ${contact.name}:`, error);
        skippedContacts.push({
          name: contact.name,
          phone: contact.phone,
          reason: 'Erreur lors de l\'import'
        });
      }
    }
    
    // Tracker l'événement d'import
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    await analyticsCrud.create({
      user_id: userId,
      event_type: 'whatsapp_contacts_imported',
      event_category: 'viral_marketing',
      event_data: {
        total_contacts: validatedData.contacts.length,
        imported_count: importedContacts.length,
        skipped_count: skippedContacts.length,
        existing_users_found: importedContacts.filter(c => c.is_already_user).length
      }
    });
    
    return createSuccessResponse({
      imported: importedContacts,
      skipped: skippedContacts,
      summary: {
        total_attempted: validatedData.contacts.length,
        imported_count: importedContacts.length,
        skipped_count: skippedContacts.length,
        existing_users_found: importedContacts.filter(c => c.is_already_user).length
      }
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de l\'import des contacts WhatsApp:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'import des contacts WhatsApp',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = sendInvitationsSchema.parse(body);
    
    const contactsCrud = new CrudOperations('user_whatsapp_contacts', params.token);
    const invitationsCrud = new CrudOperations('whatsapp_sponsorship_invitations', params.token);
    
    const userId = parseInt(params.payload?.sub || '0');
    const sentInvitations = [];
    const failedInvitations = [];
    
    for (const contactId of validatedData.contact_ids) {
      try {
        // Récupérer les informations du contact
        const contact = await contactsCrud.findById(contactId);
        
        if (!contact || contact.user_id !== userId) {
          failedInvitations.push({
            contact_id: contactId,
            reason: 'Contact non trouvé ou non autorisé'
          });
          continue;
        }
        
        // Vérifier si une invitation n'a pas déjà été envoyée récemment
        const recentInvitations = await invitationsCrud.findMany({
          sponsor_user_id: userId,
          contact_phone: contact.contact_phone
        });
        
        const hasRecentInvitation = recentInvitations?.some(inv => {
          const invitationDate = new Date(inv.sent_at);
          const daysSinceInvitation = (Date.now() - invitationDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceInvitation < 7 && inv.invitation_status !== 'expired';
        });
        
        if (hasRecentInvitation) {
          failedInvitations.push({
            contact_id: contactId,
            contact_name: contact.contact_name,
            reason: 'Invitation déjà envoyée récemment'
          });
          continue;
        }
        
        // Générer un token d'invitation unique
        const invitationToken = `WOLO_WA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculer la date d'expiration (30 jours)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        // Message d'invitation par défaut
        const defaultMessage = `Salut ${contact.contact_name} ! 🎉 J'ai découvert WOLO SENEGAL, une super plateforme pour organiser des cagnottes d'anniversaire avec des cadeaux cinéma ! Ton anniversaire approche et je pense que ça pourrait t'intéresser. Tu veux que WOLO gère ta cagnotte d'anniversaire ? C'est gratuit et très facile ! 🎂🎁\n\nClique ici pour accepter: ${request.headers.get('origin')}/sponsorship/accept/${invitationToken}`;
        
        // Créer l'invitation
        const invitationData = {
          sponsor_user_id: userId,
          contact_name: contact.contact_name,
          contact_phone: contact.contact_phone,
          invitation_message: validatedData.invitation_message || defaultMessage,
          invitation_token: invitationToken,
          invitation_status: 'sent',
          expires_at: expiresAt.toISOString()
        };
        
        const newInvitation = await invitationsCrud.create(invitationData);
        sentInvitations.push({
          ...newInvitation,
          whatsapp_url: `https://wa.me/${contact.contact_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(defaultMessage)}`
        });
        
      } catch (error) {
        console.error(`Erreur lors de l'envoi d'invitation au contact ${contactId}:`, error);
        failedInvitations.push({
          contact_id: contactId,
          reason: 'Erreur lors de l\'envoi'
        });
      }
    }
    
    // Tracker l'événement d'envoi d'invitations
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    await analyticsCrud.create({
      user_id: userId,
      event_type: 'whatsapp_sponsorship_invitations_sent',
      event_category: 'viral_marketing',
      event_data: {
        total_invitations: validatedData.contact_ids.length,
        sent_count: sentInvitations.length,
        failed_count: failedInvitations.length,
        invitation_method: 'whatsapp_contacts'
      }
    });
    
    return createSuccessResponse({
      sent: sentInvitations,
      failed: failedInvitations,
      summary: {
        total_attempted: validatedData.contact_ids.length,
        sent_count: sentInvitations.length,
        failed_count: failedInvitations.length
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de l\'envoi des invitations WhatsApp:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'envoi des invitations WhatsApp',
      status: 500,
    });
  }
}, true);

export const DELETE = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du contact requis',
        status: 400,
      });
    }
    
    const contactsCrud = new CrudOperations('user_whatsapp_contacts', params.token);
    
    // Vérifier si le contact existe et appartient à l'utilisateur
    const existingContact = await contactsCrud.findById(id);
    if (!existingContact) {
      return createErrorResponse({
        errorMessage: 'Contact non trouvé',
        status: 404,
      });
    }
    
    if (existingContact.user_id !== parseInt(params.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: 'Vous n\'êtes pas autorisé à supprimer ce contact',
        status: 403,
      });
    }
    
    await contactsCrud.delete(id);
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression du contact WhatsApp:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression du contact WhatsApp',
      status: 500,
    });
  }
}, true);
