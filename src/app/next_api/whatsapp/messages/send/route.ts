import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WhatsAppService, BulkMessage } from '@/lib/whatsapp-service';
import { z } from 'zod';

// Validation schema
const BulkMessageSchema = z.object({
  message_text: z.string().min(1, 'Message text required').max(4096, 'Message trop long'),
  recipients: z.array(z.string().min(1, 'Numéro requis')).min(1, 'Au moins un destinataire requis').max(100, 'Maximum 100 destinataires par envoi'),
  template_name: z.string().optional(),
  template_variables: z.record(z.string()).optional(),
  scheduled_for: z.string().datetime().optional(),
  campaign_name: z.string().min(1, 'Nom de campagne requis').max(100, 'Nom trop long')
});

/**
 * POST /api/whatsapp/messages/send - Send bulk WhatsApp messages
 * 
 * This endpoint handles sending bulk messages to WhatsApp contacts.
 * Messages can be sent immediately or scheduled for later.
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
    const validationResult = BulkMessageSchema.safeParse(body);
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

    const bulkMessageData: BulkMessage = validationResult.data;

    // Additional validations
    
    // Check for duplicate recipients
    const uniqueRecipients = [...new Set(bulkMessageData.recipients)];
    if (uniqueRecipients.length !== bulkMessageData.recipients.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Destinataires dupliqués détectés',
          message: 'Supprimez les numéros en double'
        },
        { status: 400 }
      );
    }

    // Validate phone number formats
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
    const invalidNumbers = bulkMessageData.recipients.filter(phone => 
      !phoneRegex.test(phone.replace(/\s/g, ''))
    );

    if (invalidNumbers.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Numéros invalides détectés',
          details: invalidNumbers.slice(0, 5).join(', ') + (invalidNumbers.length > 5 ? '...' : ''),
          invalid_count: invalidNumbers.length
        },
        { status: 400 }
      );
    }

    // Check if scheduled time is in the future (if provided)
    if (bulkMessageData.scheduled_for) {
      const scheduledDate = new Date(bulkMessageData.scheduled_for);
      const now = new Date();
      
      if (scheduledDate <= now) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Heure de programmation invalide',
            message: 'L\'heure programmée doit être dans le futur'
          },
          { status: 400 }
        );
      }

      // Don't allow scheduling more than 30 days in advance
      const maxScheduleDate = new Date();
      maxScheduleDate.setDate(maxScheduleDate.getDate() + 30);
      
      if (scheduledDate > maxScheduleDate) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Programmation trop lointaine',
            message: 'Maximum 30 jours à l\'avance'
          },
          { status: 400 }
        );
      }
    }

    // Check template variables if template is used
    if (bulkMessageData.template_name && !bulkMessageData.template_variables) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Variables du template manquantes',
          message: 'Les variables sont requises pour les templates'
        },
        { status: 400 }
      );
    }

    // Validate message content for common issues
    const messageValidation = validateMessageContent(bulkMessageData.message_text);
    if (!messageValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Contenu du message invalide',
          details: messageValidation.errors
        },
        { status: 400 }
      );
    }

    // Send bulk message using WhatsApp service
    const whatsappService = new WhatsAppService();
    const sendResult = await whatsappService.sendBulkMessage(userId, bulkMessageData);

    // Prepare response based on results
    const responseData = {
      success: true,
      message: bulkMessageData.scheduled_for ? 'Messages programmés avec succès' : 'Messages envoyés avec succès',
      campaign: {
        id: sendResult.message_id,
        name: bulkMessageData.campaign_name,
        scheduled_for: bulkMessageData.scheduled_for || null,
        status: bulkMessageData.scheduled_for ? 'scheduled' : 'sending'
      },
      statistics: {
        total_recipients: bulkMessageData.recipients.length,
        queued_successfully: sendResult.queued_count,
        failed_to_queue: sendResult.failed_count,
        success_rate: Math.round((sendResult.queued_count / bulkMessageData.recipients.length) * 100)
      },
      details: {
        errors: sendResult.errors.slice(0, 10), // Limit to first 10 errors
        has_more_errors: sendResult.errors.length > 10,
        total_errors: sendResult.errors.length
      },
      next_steps: [
        bulkMessageData.scheduled_for 
          ? `Messages programmés pour ${new Date(bulkMessageData.scheduled_for).toLocaleString('fr-FR')}`
          : 'Messages en cours d\'envoi',
        'Vous pouvez suivre le statut dans votre tableau de bord',
        'Les destinataires recevront les messages selon la disponibilité de l\'API WhatsApp'
      ]
    };

    // Include warnings if some messages failed to queue
    if (sendResult.failed_count > 0) {
      responseData.message += ` (${sendResult.failed_count} échec${sendResult.failed_count > 1 ? 's' : ''})`;
    }

    return NextResponse.json(responseData, { status: 201 });

  } catch (error: any) {
    console.error('Error sending bulk WhatsApp messages:', error);
    
    // Handle specific errors
    if (error.message?.includes('Rate limit')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Limite de débit atteinte',
          message: 'Trop de messages envoyés récemment. Réessayez dans quelques minutes.'
        },
        { status: 429 }
      );
    }

    if (error.message?.includes('WhatsApp API not configured')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service non configuré',
          message: 'L\'API WhatsApp Business n\'est pas configurée'
        },
        { status: 503 }
      );
    }

    if (error.message?.includes('Insufficient balance')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Solde insuffisant',
          message: 'Crédit WhatsApp insuffisant pour envoyer ces messages'
        },
        { status: 402 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        message: 'Une erreur s\'est produite lors de l\'envoi des messages'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/messages/send - Get campaign status and delivery statistics
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

    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaign_id');

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'ID de campagne requis' },
        { status: 400 }
      );
    }

    const campaignIdNum = parseInt(campaignId);
    if (isNaN(campaignIdNum)) {
      return NextResponse.json(
        { success: false, error: 'ID de campagne invalide' },
        { status: 400 }
      );
    }

    // Get campaign statistics
    const whatsappService = new WhatsAppService();
    const stats = await whatsappService.getCampaignStats(campaignIdNum);

    return NextResponse.json({
      success: true,
      campaign_id: campaignIdNum,
      statistics: {
        total_messages: stats.total_messages,
        sent: stats.sent,
        delivered: stats.delivered,
        read: stats.read,
        failed: stats.failed,
        pending: stats.pending,
        delivery_rate: stats.total_messages > 0 ? Math.round((stats.delivered / stats.total_messages) * 100) : 0,
        read_rate: stats.delivered > 0 ? Math.round((stats.read / stats.delivered) * 100) : 0,
        success_rate: stats.total_messages > 0 ? Math.round(((stats.sent + stats.delivered + stats.read) / stats.total_messages) * 100) : 0
      },
      status: stats.pending > 0 ? 'in_progress' : stats.failed === stats.total_messages ? 'failed' : 'completed'
    });

  } catch (error: any) {
    console.error('Error getting campaign statistics:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques',
        message: 'Impossible de récupérer les données de la campagne'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate message content for common issues
 */
function validateMessageContent(messageText: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for empty or whitespace-only message
  if (!messageText.trim()) {
    errors.push('Le message ne peut pas être vide');
    return { valid: false, errors };
  }

  // Check for suspicious spam-like content
  const spamIndicators = [
    /click here/gi,
    /urgent/gi,
    /winner/gi,
    /congratulations/gi,
    /free money/gi,
    /claim now/gi
  ];

  const suspiciousPatterns = spamIndicators.filter(pattern => pattern.test(messageText));
  if (suspiciousPatterns.length > 2) {
    errors.push('Le message contient du contenu potentiellement spam');
  }

  // Check for too many special characters or emojis
  const specialCharCount = (messageText.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g) || []).length;
  const emojiCount = (messageText.match(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu) || []).length;

  if (specialCharCount + emojiCount > messageText.length * 0.3) {
    errors.push('Trop de caractères spéciaux ou d\'emojis');
  }

  // Check for URLs (may need special handling)
  const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = messageText.match(urlPattern);
  
  if (urls && urls.length > 2) {
    errors.push('Trop de liens dans le message');
  }

  // Warn about shortened URLs
  const shortUrlPattern = /(bit\.ly|tinyurl|t\.co|short\.link)/gi;
  if (shortUrlPattern.test(messageText)) {
    errors.push('Les liens raccourcis peuvent être bloqués par WhatsApp');
  }

  return { valid: errors.length === 0, errors };
}