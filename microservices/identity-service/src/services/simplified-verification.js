const databaseProvider = require('../../../shared/providers/database');
const cacheProvider = require('../../../shared/providers/cache');
const { generateAdminUserToken } = require('../../../shared/providers/auth');

/**
 * Simplified Family-Based Verification Service
 * Much more user-friendly approach for under-18 verification
 */
class SimplifiedVerificationService {
  constructor() {
    this.adminToken = '';
    this.initializeToken();
  }

  private async initializeToken() {
    this.adminToken = await generateAdminUserToken();
  }

  /**
   * APPROACH 1: Family Member Name Verification
   * Simple form asking for family member names that only they would know
   */
  async familyNameVerification(minorUserId, sponsorUserId, familyData) {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      const verificationData = {
        minor_user_id: minorUserId,
        sponsor_user_id: sponsorUserId,
        verification_type: 'family_names',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        
        // Simple family info that only they would know
        family_info: {
          mother_full_name: familyData.mother_full_name,
          father_full_name: familyData.father_full_name,
          guardian_relationship: familyData.guardian_relationship, // "mère", "père", "grand-mère", etc.
          family_surname: familyData.family_surname,
          birthplace: familyData.birthplace, // City where minor was born
          
          // Optional: Additional family context
          siblings_count: familyData.siblings_count || null,
          grandfather_name: familyData.grandfather_name || null,
          family_nickname: familyData.family_nickname || null // Pet name used at home
        },
        
        // Guardian verification
        guardian_verification: {
          phone_verified: false, // Will verify via SMS
          relationship_confirmed: false,
          consent_given: true
        }
      };

      const verificationsCrud = new CrudOperations('simplified_verifications', this.adminToken);
      const verification = await verificationsCrud.create(verificationData);

      // Send SMS verification to guardian
      await this.sendGuardianSMSVerification(verification.id, sponsorUserId);

      return {
        verification_id: verification.id,
        status: 'family_info_submitted',
        next_step: 'guardian_sms_verification',
        message: 'Information familiale soumise. SMS envoyé au tuteur pour confirmation.'
      };

    } catch (error) {
      console.error('Family name verification error:', error);
      throw error;
    }
  }

  /**
   * APPROACH 2: Simple SMS + Phone Call Verification
   * Even simpler - just verify guardian's phone and relationship
   */
  async simpleGuardianVerification(minorUserId, sponsorUserId, guardianData) {
    try {
      const verificationData = {
        minor_user_id: minorUserId,
        sponsor_user_id: sponsorUserId,
        verification_type: 'guardian_phone_simple',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        
        simple_verification: {
          guardian_phone: guardianData.guardian_phone,
          guardian_name: guardianData.guardian_name,
          relationship: guardianData.relationship, // "mère", "père", etc.
          minor_name: guardianData.minor_name,
          minor_birth_year: guardianData.minor_birth_year,
          
          // Just basic info to confirm relationship
          lives_together: guardianData.lives_together || true,
          knows_birthday: guardianData.knows_birthday || false
        }
      };

      const verification = await this.createSimpleVerification(verificationData);

      // Send SMS to guardian with simple confirmation
      await this.sendSimpleGuardianSMS(verification.id, guardianData);

      return {
        verification_id: verification.id,
        status: 'guardian_sms_sent',
        message: 'SMS de confirmation envoyé au tuteur. Simple réponse requise.',
        guardian_phone: this.maskPhoneNumber(guardianData.guardian_phone)
      };

    } catch (error) {
      console.error('Simple guardian verification error:', error);
      throw error;
    }
  }

  /**
   * APPROACH 3: Social Verification (Most User-Friendly)
   * Let existing WOLO users vouch for the relationship
   */
  async socialVerification(minorUserId, sponsorUserId, socialData) {
    try {
      const verificationData = {
        minor_user_id: minorUserId,
        sponsor_user_id: sponsorUserId,
        verification_type: 'social_vouching',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        
        social_verification: {
          relationship_type: socialData.relationship_type,
          known_duration: socialData.known_duration, // "depuis naissance", "5 ans", etc.
          voucher_contacts: socialData.voucher_contacts || [], // Other WOLO users who can vouch
          
          // Simple questions only family would know
          shared_memories: socialData.shared_memories || null,
          family_traditions: socialData.family_traditions || null,
          home_address_partial: socialData.home_address_partial || null // Just neighborhood/area
        }
      };

      const verification = await this.createSocialVerification(verificationData);

      // Notify potential vouchers
      if (socialData.voucher_contacts && socialData.voucher_contacts.length > 0) {
        await this.sendVoucherRequests(verification.id, socialData.voucher_contacts);
      }

      return {
        verification_id: verification.id,
        status: 'social_verification_initiated',
        message: 'Demandes de confirmation envoyées à vos contacts WOLO.',
        vouchers_contacted: socialData.voucher_contacts.length
      };

    } catch (error) {
      console.error('Social verification error:', error);
      throw error;
    }
  }

  /**
   * Send simple SMS to guardian for verification
   */
  async sendSimpleGuardianSMS(verificationId, guardianData) {
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code
      
      // Store verification code temporarily
      await cacheProvider.set(
        `guardian_verification:${verificationId}`, 
        verificationCode.toString(), 
        300 // 5 minutes
      );

      const smsMessage = `
WOLO: ${guardianData.guardian_name}, confirmez-vous que ${guardianData.minor_name} est votre ${guardianData.relationship} ?

Répondez OUI ${verificationCode} pour confirmer.
Répondez NON pour refuser.

Ce message concerne une cagnotte d'anniversaire.
      `.trim();

      // In production, integrate with SMS provider (Orange SMS, Twilio, etc.)
      console.log(`SMS to ${guardianData.guardian_phone}: ${smsMessage}`);
      
      // Mock SMS sending for now
      return { 
        success: true, 
        code: verificationCode, // Remove in production
        phone: guardianData.guardian_phone 
      };

    } catch (error) {
      console.error('Error sending guardian SMS:', error);
      throw error;
    }
  }

  /**
   * Process guardian SMS response
   */
  async processGuardianSMSResponse(verificationId, phoneNumber, responseMessage) {
    try {
      const storedCode = await cacheProvider.get(`guardian_verification:${verificationId}`);
      
      if (!storedCode) {
        return { 
          success: false, 
          error: 'Code expiré. Veuillez recommencer la vérification.' 
        };
      }

      const normalizedResponse = responseMessage.toUpperCase().trim();
      
      // Check for positive responses
      if (normalizedResponse.includes('OUI') && normalizedResponse.includes(storedCode)) {
        return await this.approveSimpleVerification(verificationId, 'guardian_sms_confirmed');
      }
      
      // Check for negative responses
      if (normalizedResponse.includes('NON')) {
        return await this.rejectSimpleVerification(verificationId, 'guardian_denied');
      }

      return {
        success: false,
        error: 'Réponse non reconnue. Répondez OUI + code ou NON.'
      };

    } catch (error) {
      console.error('Error processing SMS response:', error);
      throw error;
    }
  }

  /**
   * Approve verification and activate pot
   */
  async approveSimpleVerification(verificationId, approvalReason) {
    try {
      const verificationsCrud = new CrudOperations('simplified_verifications', this.adminToken);
      
      // Update verification status
      const verification = await verificationsCrud.update(verificationId, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approval_method: approvalReason,
        modify_time: new Date().toISOString()
      });

      // Find and activate associated pot
      const sponsorshipsCrud = new CrudOperations('sponsorships', this.adminToken);
      const sponsorship = await sponsorshipsCrud.findOne({ 
        minor_user_id: verification.minor_user_id,
        sponsor_user_id: verification.sponsor_user_id 
      });

      if (sponsorship && sponsorship.pot_id) {
        const potsCrud = new CrudOperations('pots', this.adminToken);
        await potsCrud.update(sponsorship.pot_id, {
          status: 'active',
          is_public: true,
          identity_verified: true,
          modify_time: new Date().toISOString()
        });

        // Award bonus points to sponsor
        await this.awardVerificationBonus(verification.sponsor_user_id);
        
        // Send success notifications
        await this.sendApprovalNotifications(verification, sponsorship.pot_id);
      }

      // Clear cache
      await cacheProvider.delete(`guardian_verification:${verificationId}`);

      return {
        success: true,
        status: 'approved',
        message: 'Vérification approuvée! Cagnotte maintenant active.',
        pot_activated: !!sponsorship?.pot_id
      };

    } catch (error) {
      console.error('Error approving verification:', error);
      throw error;
    }
  }

  /**
   * Award bonus points for successful verification
   */
  async awardVerificationBonus(sponsorUserId) {
    try {
      const pointsCrud = new CrudOperations('point_transactions', this.adminToken);
      await pointsCrud.create({
        user_id: sponsorUserId,
        transaction_type: 'bonus',
        points_amount: 5,
        source_type: 'simple_verification',
        description: 'Bonus vérification familiale réussie',
        created_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error awarding verification bonus:', error);
    }
  }

  /**
   * Send approval notifications
   */
  async sendApprovalNotifications(verification, potId) {
    try {
      const notificationsCrud = new CrudOperations('notifications', this.adminToken);
      
      // Notify minor
      await notificationsCrud.create({
        user_id: verification.minor_user_id,
        pot_id: potId,
        type: 'verification_approved',
        title: 'Vérification réussie! 🎉',
        message: 'Votre identité a été vérifiée. Votre cagnotte est maintenant active!',
        channel: 'email',
        status: 'pending'
      });

      // Notify sponsor
      await notificationsCrud.create({
        user_id: verification.sponsor_user_id,
        pot_id: potId,
        type: 'sponsorship_verified',
        title: 'Parrainage vérifié! +5 points 🎯',
        message: 'La vérification de votre filleul est terminée. Vous gagnez 5 points bonus!',
        channel: 'email',
        status: 'pending'
      });

    } catch (error) {
      console.error('Error sending approval notifications:', error);
    }
  }

  /**
   * Get simplified verification status
   */
  async getVerificationStatus(userId) {
    try {
      const verificationsCrud = new CrudOperations('simplified_verifications', this.adminToken);
      
      const verifications = await verificationsCrud.findMany({
        $or: [
          { minor_user_id: userId },
          { sponsor_user_id: userId }
        ]
      });

      return {
        verifications: verifications || [],
        has_pending: (verifications || []).some(v => v.status === 'pending'),
        has_approved: (verifications || []).some(v => v.status === 'approved')
      };

    } catch (error) {
      console.error('Error getting verification status:', error);
      return { verifications: [], has_pending: false, has_approved: false };
    }
  }

  /**
   * Helper: Mask phone number for privacy
   */
  maskPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 9) {
      return cleaned.slice(0, 3) + '****' + cleaned.slice(-2);
    }
    return '***';
  }

  /**
   * Helper: Create simple verification record
   */
  async createSimpleVerification(data) {
    const verificationsCrud = new CrudOperations('simplified_verifications', this.adminToken);
    return await verificationsCrud.create(data);
  }
}

module.exports = SimplifiedVerificationService;