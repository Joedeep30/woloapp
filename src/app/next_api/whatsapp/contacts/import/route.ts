import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WhatsAppService, WhatsAppContact } from '@/lib/whatsapp-service';
import { z } from 'zod';

// Validation schema
const ContactSchema = z.object({
  phone_number: z.string().min(1, 'Numéro de téléphone requis'),
  name: z.string().optional(),
  country_code: z.string().optional()
});

const ImportRequestSchema = z.object({
  contacts: z.array(ContactSchema).min(1, 'Au moins un contact requis'),
  campaign_name: z.string().optional()
});

/**
 * POST /api/whatsapp/contacts/import - Import contacts from user's WhatsApp
 * 
 * This endpoint allows users to import their WhatsApp contacts for messaging campaigns.
 * In production, this would integrate with WhatsApp Business API for contact import.
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
    const validationResult = ImportRequestSchema.safeParse(body);
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

    const { contacts, campaign_name } = validationResult.data;

    // Check contact count limits (prevent abuse)
    if (contacts.length > 1000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Trop de contacts',
          message: 'Maximum 1000 contacts par importation'
        },
        { status: 400 }
      );
    }

    // Validate at least some contacts have valid phone numbers
    const validContacts = contacts.filter(contact => {
      const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
      return phoneRegex.test(contact.phone_number.replace(/\s/g, ''));
    });

    if (validContacts.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Aucun numéro valide trouvé',
          message: 'Vérifiez le format des numéros de téléphone'
        },
        { status: 400 }
      );
    }

    // Import contacts using WhatsApp service
    const whatsappService = new WhatsAppService();
    const importResult = await whatsappService.importContacts(userId, validContacts as WhatsAppContact[]);

    // Return success response with statistics
    return NextResponse.json({
      success: true,
      message: 'Importation terminée',
      statistics: {
        total_provided: contacts.length,
        valid_contacts: validContacts.length,
        imported_count: importResult.imported_count,
        skipped_count: importResult.skipped_count,
        error_count: importResult.errors.length
      },
      details: {
        imported: importResult.imported_count,
        skipped: `${importResult.skipped_count} (déjà existants)`,
        errors: importResult.errors.slice(0, 10), // Limit error details to first 10
        has_more_errors: importResult.errors.length > 10
      },
      next_steps: [
        'Vos contacts ont été importés avec succès',
        'Vous pouvez maintenant créer une campagne de messages',
        'Les utilisateurs WOLO existants ont été identifiés automatiquement'
      ]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error importing WhatsApp contacts:', error);
    
    // Handle specific errors
    if (error.message?.includes('Rate limit')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Limite atteinte',
          message: 'Trop d\'importations récentes. Réessayez dans quelques minutes.'
        },
        { status: 429 }
      );
    }

    if (error.message?.includes('Invalid phone')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Format de numéro invalide',
          message: 'Vérifiez le format des numéros de téléphone'
        },
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        message: 'Une erreur s\'est produite lors de l\'importation'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/contacts/import - Get user's imported contacts
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
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const wolo_users_only = url.searchParams.get('wolo_users_only') === 'true';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Paramètres de pagination invalides' },
        { status: 400 }
      );
    }

    // Get contacts from database
    const whatsappService = new WhatsAppService();
    
    // Note: This would need to be implemented in WhatsAppService
    // For now, return a mock response structure
    const contacts: any[] = []; // await whatsappService.getUserContacts(userId, { page, limit, search, wolo_users_only });
    
    return NextResponse.json({
      success: true,
      contacts: contacts,
      pagination: {
        current_page: page,
        per_page: limit,
        total_contacts: 0, // Would be from actual query
        total_pages: 0,
        has_next_page: false,
        has_prev_page: page > 1
      },
      filters: {
        search: search || null,
        wolo_users_only: wolo_users_only
      },
      summary: {
        total_contacts: 0,
        wolo_users: 0,
        external_contacts: 0,
        opted_out: 0
      }
    });

  } catch (error: any) {
    console.error('Error getting imported contacts:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des contacts',
        message: 'Impossible de récupérer la liste des contacts'
      },
      { status: 500 }
    );
  }
}