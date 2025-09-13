import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';
import { hashString } from '@/lib/server-utils';
import { userRegisterCallback } from '@/lib/user-register';

const acceptReferralSchema = z.object({
  referral_code: z.string().min(1, 'Code de parrainage requis'),
  full_name: z.string().min(1, 'Nom complet requis'),
  email: z.string().email('Email valide requis'),
  phone: z.string().min(8, 'Numéro de téléphone requis'),
  password: z.string().min(6, 'Mot de passe requis (minimum 6 caractères)'),
  dob: z.string().min(10, 'Date de naissance requise'),
  relationship: z.enum(['ami', 'amie', 'membre_famille']).optional(),
  // For minors (under 18)
  id_number: z.string().optional(),
  id_type: z.enum(['carte_identite', 'passeport', 'acte_naissance']).optional(),
  id_country: z.string().default('SN'),
  parrain_id_number: z.string().optional(),
  parrain_id_type: z.enum(['carte_identite', 'passeport']).optional(),
  guardian_consent: z.boolean().default(false)
});

// Helper function to calculate age
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = acceptReferralSchema.parse(body);

    const sponsorshipsCrud = new CrudOperations('sponsorships', params.token);
    const usersCrud = new CrudOperations('users', params.token);
    const profilesCrud = new CrudOperations('profiles', params.token);
    
    // Find the sponsorship by token
    const sponsorships = await sponsorshipsCrud.findMany({
      invitation_token: validatedData.referral_code,
      status: 'pending'
    });

    if (!sponsorships || sponsorships.length === 0) {
      return createErrorResponse({
        errorMessage: 'Code de parrainage invalide ou expiré',
        status: 404,
      });
    }

    const sponsorship = sponsorships[0];

    // Check if invitation is expired
    if (new Date(sponsorship.expires_at) < new Date()) {
      return createErrorResponse({
        errorMessage: 'Cette invitation de parrainage a expiré',
        status: 410,
      });
    }

    // Check if user already exists
    const existingUsers = await usersCrud.findMany({
      email: validatedData.email
    });

    if (existingUsers && existingUsers.length > 0) {
      return createErrorResponse({
        errorMessage: 'Un compte existe déjà avec cet email',
        status: 409,
      });
    }

    // Calculate age to determine if minor
    const age = calculateAge(validatedData.dob);
    const isMinor = age < 18;

    // For minors, additional validation
    if (isMinor) {
      if (!validatedData.id_number || !validatedData.id_type || 
          !validatedData.parrain_id_number || !validatedData.parrain_id_type) {
        return createErrorResponse({
          errorMessage: 'Pièces d\'identité requises pour les mineurs (parrain et filleul)',
          status: 400,
        });
      }

      if (!validatedData.guardian_consent) {
        return createErrorResponse({
          errorMessage: 'Consentement du représentant légal requis',
          status: 400,
        });
      }
    }

    // Create user account
    const hashedPassword = await hashString(validatedData.password);
    const userData = {
      email: validatedData.email,
      password: hashedPassword,
      phone: validatedData.phone,
      first_name: validatedData.full_name.split(' ')[0],
      last_name: validatedData.full_name.split(' ').slice(1).join(' ') || '',
      birthday: validatedData.dob,
      is_sponsored: true,
      sponsored_by: sponsorship.sponsor_user_id,
      auth_provider: 'email'
    };

    const newUser = await usersCrud.create(userData);

    // Create user profile with identity info
    const profileData = {
      user_id: newUser.id,
      full_name: validatedData.full_name,
      dob: validatedData.dob,
      locale: 'fr-SN',
      id_number: validatedData.id_number || null,
      id_type: validatedData.id_type || null,
      id_country: validatedData.id_country,
      id_hash: validatedData.id_number ? await hashString(validatedData.id_number) : null
    };

    // If minor, add guardian info
    if (isMinor) {
      profileData.guardian_user_id = sponsorship.sponsor_user_id;
    }

    await profilesCrud.create(profileData);

    // Update sponsorship status
    await sponsorshipsCrud.update(sponsorship.id, {
      status: 'accepted',
      invited_user_id: newUser.id,
      accepted_at: new Date().toISOString()
    });

    // Award initial points to sponsor (10 points base)
    const pointRulesCrud = new CrudOperations('point_rules', params.token);
    const basePointRule = await pointRulesCrud.findMany({
      rule_name: 'Parrainage de base',
      is_active: true
    });

    if (basePointRule && basePointRule.length > 0) {
      const pointsToAward = basePointRule[0].points_value || 10;
      
      // Update sponsor's points
      const userPointsCrud = new CrudOperations('user_points', params.token);
      const sponsorPoints = await userPointsCrud.findMany({
        user_id: sponsorship.sponsor_user_id
      });

      if (sponsorPoints && sponsorPoints.length > 0) {
        await userPointsCrud.update(sponsorPoints[0].id, {
          total_points: (sponsorPoints[0].total_points || 0) + pointsToAward,
          available_points: (sponsorPoints[0].available_points || 0) + pointsToAward,
          lifetime_points: (sponsorPoints[0].lifetime_points || 0) + pointsToAward,
          modify_time: new Date().toISOString()
        });
      } else {
        // Create new points record
        await userPointsCrud.create({
          user_id: sponsorship.sponsor_user_id,
          total_points: pointsToAward,
          available_points: pointsToAward,
          lifetime_points: pointsToAward
        });
      }

      // Log point transaction
      const pointTransactionsCrud = new CrudOperations('point_transactions', params.token);
      await pointTransactionsCrud.create({
        user_id: sponsorship.sponsor_user_id,
        transaction_type: 'earned',
        points_amount: pointsToAward,
        source_type: 'sponsorship',
        source_id: sponsorship.id,
        description: `Points de parrainage pour l'acceptation de ${validatedData.full_name}`,
        metadata: {
          invited_user_id: newUser.id,
          invited_name: validatedData.full_name,
          is_minor: isMinor
        }
      });
    }

    // Schedule pot creation for J-30
    const birthdayDate = new Date(sponsorship.invited_birthday);
    const potOpenDate = new Date(birthdayDate);
    potOpenDate.setDate(potOpenDate.getDate() - 30); // 30 days before birthday

    // If pot should already be open (birthday is within 30 days), create it now
    const shouldCreateNow = potOpenDate <= new Date();

    let potId = null;
    if (shouldCreateNow) {
      const potsCrud = new CrudOperations('pots', params.token);
      const potData = {
        user_id: newUser.id,
        title: `Anniversaire de ${validatedData.full_name}`,
        description: `Aidez ${validatedData.full_name.split(' ')[0]} à célébrer son anniversaire !`,
        target_amount: 25000, // Default target
        birthday_date: sponsorship.invited_birthday,
        status: isMinor ? 'scheduled' : 'active', // Keep private for minors until ID verification
        is_public: !isMinor, // Private for minors until verification
        birthday_person_name: validatedData.full_name,
        birthday_person_email: validatedData.email,
        birthday_person_phone: validatedData.phone,
        birthday_person_user_id: newUser.id,
        is_self_birthday: true
      };

      const pot = await potsCrud.create(potData);
      potId = pot.id;

      // Update sponsorship with pot_id
      await sponsorshipsCrud.update(sponsorship.id, {
        pot_id: pot.id
      });
    }

    // Call user registration callback for any additional setup
    await userRegisterCallback(newUser);

    // Log analytics
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    await analyticsCrud.create({
      user_id: newUser.id,
      event_type: 'referral_accepted',
      event_category: 'conversion',
      event_data: {
        sponsor_user_id: sponsorship.sponsor_user_id,
        is_minor: isMinor,
        pot_created: shouldCreateNow,
        pot_id: potId
      }
    });

    return createSuccessResponse({
      user_id: newUser.id,
      message: 'Compte créé avec succès via parrainage',
      is_minor: isMinor,
      pot_created: shouldCreateNow,
      pot_id: potId,
      sponsor_points_awarded: basePointRule?.[0]?.points_value || 10,
      pot_opens_at: shouldCreateNow ? null : potOpenDate.toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    console.error('Erreur lors de l\'acceptation du parrainage:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'acceptation du parrainage',
      status: 500,
    });
  }
}, false); // No auth required for accepting invitations