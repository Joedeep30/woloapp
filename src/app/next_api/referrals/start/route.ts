import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';
import { generateRandomString } from '@/lib/server-utils';

const startReferralSchema = z.object({
  invited_name: z.string().min(1, 'Nom requis'),
  invited_email: z.string().email().optional(),
  invited_phone: z.string().min(8, 'Téléphone requis').optional(),
  invited_birthday: z.string().min(10, 'Date d\'anniversaire requise'),
  relationship: z.enum(['ami', 'amie', 'membre_famille']),
  invitation_method: z.enum(['email', 'sms', 'whatsapp']).default('email'),
  invitation_message: z.string().optional(),
  is_minor: z.boolean().default(false),
  minor_relationship_type: z.enum(['enfant', 'frere_soeur', 'neveu_niece']).optional()
}).refine((data) => data.invited_email || data.invited_phone, {
  message: "Email ou téléphone requis",
  path: ["invited_email"]
}).refine((data) => !data.is_minor || data.minor_relationship_type, {
  message: "Type de relation familiale requis pour les mineurs",
  path: ["minor_relationship_type"]
});

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = startReferralSchema.parse(body);

    if (!params.payload?.sub) {
      return createErrorResponse({
        errorMessage: 'Authentification requise',
        status: 401,
      });
    }

    // Verify birthday is within 10-30 days
    const birthdayDate = new Date(validatedData.invited_birthday);
    const today = new Date();
    const diffTime = birthdayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 10 || diffDays > 30) {
      return createErrorResponse({
        errorMessage: 'L\'anniversaire doit être dans 10 à 30 jours',
        status: 400,
      });
    }

    const sponsorshipsCrud = new CrudOperations('sponsorships', params.token);
    
    // Check if this person was already sponsored
    const existingSponsorship = await sponsorshipsCrud.findMany({
      invited_email: validatedData.invited_email || null,
      invited_phone: validatedData.invited_phone || null,
      status: 'pending'
    });

    if (existingSponsorship && existingSponsorship.length > 0) {
      return createErrorResponse({
        errorMessage: 'Cette personne a déjà été parrainée',
        status: 409,
      });
    }

    // Generate unique invitation token
    const invitationToken = `WOLO_REF_${Date.now()}_${generateRandomString(12)}`;
    const inviteLink = `${request.nextUrl.origin}/referrals/accept/${invitationToken}`;

    // Create sponsorship record
    const sponsorshipData = {
      sponsor_user_id: parseInt(params.payload.sub),
      invited_name: validatedData.invited_name,
      invited_email: validatedData.invited_email || null,
      invited_phone: validatedData.invited_phone || null,
      invited_birthday: validatedData.invited_birthday,
      invitation_method: validatedData.invitation_method,
      invitation_message: validatedData.invitation_message || 
        `Salut ${validatedData.invited_name} ! 🎉 J'ai découvert WOLO SENEGAL, une super plateforme pour organiser des cagnottes d'anniversaire avec des cadeaux cinéma ! Ton anniversaire approche et je pense que ça pourrait t'intéresser. Rejoins-moi : ${inviteLink}`,
      invitation_token: invitationToken,
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      invitation_sent_at: new Date().toISOString()
    };

    const sponsorship = await sponsorshipsCrud.create(sponsorshipData);

    // If minor, create relationship record
    if (validatedData.is_minor && validatedData.minor_relationship_type) {
      const relationshipsCrud = new CrudOperations('pot_relationships', params.token);
      await relationshipsCrud.create({
        pot_id: null, // Will be filled when pot is created
        relationship_type: 'membre_famille',
        is_minor: true,
        minor_relationship_type: validatedData.minor_relationship_type,
        additional_info: {
          sponsorship_id: sponsorship.id,
          sponsor_name: params.payload.email,
          notes: 'Relation familiale pour mineur'
        }
      });
    }

    // Log analytics event
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    await analyticsCrud.create({
      user_id: parseInt(params.payload.sub),
      event_type: 'sponsorship_started',
      event_category: 'referral',
      event_data: {
        invited_name: validatedData.invited_name,
        invitation_method: validatedData.invitation_method,
        is_minor: validatedData.is_minor,
        relationship: validatedData.relationship
      }
    });

    return createSuccessResponse({
      sponsorship_id: sponsorship.id,
      invitation_token: invitationToken,
      invite_link: inviteLink,
      expires_at: sponsorshipData.expires_at,
      invited_name: validatedData.invited_name,
      message: 'Invitation de parrainage créée avec succès'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    console.error('Erreur lors de la création du parrainage:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la création du parrainage',
      status: 500,
    });
  }
}, true);