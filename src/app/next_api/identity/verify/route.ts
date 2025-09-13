import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IdentityVerificationService, VerificationRequest } from '@/lib/identity-verification-service';
import { z } from 'zod';

// Validation schema
const IdentityDocumentSchema = z.object({
  id_number: z.string().min(1, 'Numéro de pièce requis'),
  id_type: z.enum(['carte_identite', 'passeport', 'acte_naissance']),
  id_country: z.string().min(2, 'Pays requis'),
  document_photo: z.string().optional(), // Base64 encoded photo
  holder_name: z.string().min(1, 'Nom du titulaire requis'),
  holder_dob: z.string().min(1, 'Date de naissance requise')
});

const GuardianConsentSchema = z.object({
  guardian_user_id: z.number().int().positive(),
  minor_user_id: z.number().int().positive(),
  consent_given: z.boolean(),
  consent_date: z.string().optional(),
  relationship_type: z.enum(['parent', 'tuteur_legal', 'autre']),
  guardian_signature: z.string().optional()
});

const VerificationRequestSchema = z.object({
  sponsorship_id: z.number().int().positive(),
  minor_user_id: z.number().int().positive(),
  sponsor_user_id: z.number().int().positive(),
  minor_id_document: IdentityDocumentSchema,
  sponsor_id_document: IdentityDocumentSchema,
  guardian_consent: GuardianConsentSchema,
  relationship_proof: z.string().optional()
});

/**
 * POST /api/identity/verify - Submit identity verification for under-18 user
 * 
 * This endpoint handles the submission of identity verification documents
 * and guardian consent for users under 18 years old.
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    // Validate request body
    const validationResult = VerificationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          details: errors
        },
        { status: 400 }
      );
    }

    const verificationRequest: VerificationRequest = validationResult.data;

    // Verify the authenticated user is either the minor or the sponsor
    if (userId !== verificationRequest.minor_user_id && 
        userId !== verificationRequest.sponsor_user_id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé pour cette demande' },
        { status: 403 }
      );
    }

    // Additional validations
    if (!verificationRequest.guardian_consent.consent_given) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le consentement du tuteur est requis pour les mineurs' 
        },
        { status: 400 }
      );
    }

    // Validate that sponsor is the guardian giving consent
    if (verificationRequest.sponsor_user_id !== verificationRequest.guardian_consent.guardian_user_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le parrain doit être le tuteur légal donnant son consentement' 
        },
        { status: 400 }
      );
    }

    // Basic age validation from documents
    const minorBirthDate = new Date(verificationRequest.minor_id_document.holder_dob);
    const currentDate = new Date();
    const age = currentDate.getFullYear() - minorBirthDate.getFullYear();
    
    if (age >= 18) {
      // Check exact age considering month and day
      const monthDiff = currentDate.getMonth() - minorBirthDate.getMonth();
      if (monthDiff > 0 || (monthDiff === 0 && currentDate.getDate() >= minorBirthDate.getDate())) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cette procédure est réservée aux utilisateurs de moins de 18 ans' 
          },
          { status: 400 }
        );
      }
    }

    // Validate document photo format if provided
    if (verificationRequest.minor_id_document.document_photo) {
      if (!isValidBase64Image(verificationRequest.minor_id_document.document_photo)) {
        return NextResponse.json(
          { success: false, error: 'Format de photo invalide pour le document du mineur' },
          { status: 400 }
        );
      }
    }

    if (verificationRequest.sponsor_id_document.document_photo) {
      if (!isValidBase64Image(verificationRequest.sponsor_id_document.document_photo)) {
        return NextResponse.json(
          { success: false, error: 'Format de photo invalide pour le document du parrain' },
          { status: 400 }
        );
      }
    }

    // Submit verification request
    const verificationService = new IdentityVerificationService();
    const result = await verificationService.submitVerificationRequest(verificationRequest);

    // Return success response
    return NextResponse.json({
      success: true,
      verification_id: result.verification_id,
      status: result.status,
      message: result.message,
      next_steps: [
        'Votre demande a été soumise pour examen',
        'Vous recevrez une notification par email dans 24-48h',
        'En cas d\'approbation, la cagnotte deviendra publique automatiquement'
      ]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in identity verification:', error);
    
    // Handle specific errors
    if (error.message?.includes('User not found')) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (error.message?.includes('Sponsorship not found')) {
      return NextResponse.json(
        { success: false, error: 'Parrainage non trouvé' },
        { status: 404 }
      );
    }

    if (error.message?.includes('already verified')) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur déjà vérifié' },
        { status: 409 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        message: 'Une erreur s\'est produite lors du traitement de votre demande'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/identity/verify - Get verification status for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const verificationService = new IdentityVerificationService();

    // Get verification status
    const status = await verificationService.getVerificationStatus(userId);
    
    // Check if user needs verification
    const needsVerification = await verificationService.needsIdentityVerification(userId);

    return NextResponse.json({
      success: true,
      user_id: userId,
      needs_verification: needsVerification,
      verifications: status,
      can_submit_new_verification: needsVerification && !status.has_pending_verification
    });

  } catch (error: any) {
    console.error('Error getting verification status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération du statut',
        message: 'Impossible de récupérer le statut de vérification'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to validate base64 image format
 */
function isValidBase64Image(base64String: string): boolean {
  try {
    // Check if it's a valid base64 data URL
    if (!base64String.startsWith('data:image/')) {
      return false;
    }

    // Extract the base64 part
    const base64Data = base64String.split(',')[1];
    if (!base64Data) return false;

    // Validate base64 format
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(base64Data)) {
      return false;
    }

    // Check if it can be decoded
    Buffer.from(base64Data, 'base64');
    
    // Check image type
    const mimeType = base64String.split(';')[0].split(':')[1];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    return allowedTypes.includes(mimeType);

  } catch (error) {
    return false;
  }
}