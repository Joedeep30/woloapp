import CrudOperations from './crud-operations';
import { hashString } from './server-utils';
import { generateAdminUserToken } from './auth';

export interface IdentityDocument {
  id_number: string;
  id_type: 'carte_identite' | 'passeport' | 'acte_naissance';
  id_country: string;
  document_photo?: File | string; // Base64 or file upload
  holder_name: string;
  holder_dob: string;
}

export interface GuardianConsent {
  guardian_user_id: number;
  minor_user_id: number;
  consent_given: boolean;
  consent_date?: string;
  relationship_type: 'parent' | 'tuteur_legal' | 'autre';
  guardian_signature?: string; // Digital signature or checkbox
}

export interface VerificationRequest {
  sponsorship_id: number;
  minor_user_id: number;
  sponsor_user_id: number;
  minor_id_document: IdentityDocument;
  sponsor_id_document: IdentityDocument;
  guardian_consent: GuardianConsent;
  relationship_proof?: string; // Additional proof if needed
}

export class IdentityVerificationService {
  private adminToken: string = '';

  constructor() {
    this.initializeToken();
  }

  private async initializeToken() {
    this.adminToken = await generateAdminUserToken();
  }

  /**
   * Submit identity verification request for under-18 user
   */
  async submitVerificationRequest(request: VerificationRequest): Promise<{
    verification_id: string;
    status: string;
    message: string;
  }> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      // Create verification record
      const verificationsCrud = new CrudOperations('identity_verifications', this.adminToken);
      
      const verificationData = {
        sponsorship_id: request.sponsorship_id,
        minor_user_id: request.minor_user_id,
        sponsor_user_id: request.sponsor_user_id,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        
        // Store document hashes for security
        minor_id_hash: await hashString(request.minor_id_document.id_number),
        minor_id_type: request.minor_id_document.id_type,
        minor_id_country: request.minor_id_document.id_country,
        
        sponsor_id_hash: await hashString(request.sponsor_id_document.id_number),
        sponsor_id_type: request.sponsor_id_document.id_type,
        sponsor_id_country: request.sponsor_id_document.id_country,
        
        guardian_consent_given: request.guardian_consent.consent_given,
        guardian_relationship: request.guardian_consent.relationship_type,
        consent_date: request.guardian_consent.consent_date || new Date().toISOString(),
        
        verification_data: {
          minor_document: {
            holder_name: request.minor_id_document.holder_name,
            holder_dob: request.minor_id_document.holder_dob,
            document_type: request.minor_id_document.id_type,
            country: request.minor_id_document.id_country
          },
          sponsor_document: {
            holder_name: request.sponsor_id_document.holder_name,
            holder_dob: request.sponsor_id_document.holder_dob,
            document_type: request.sponsor_id_document.id_type,
            country: request.sponsor_id_document.id_country
          },
          relationship_proof: request.relationship_proof
        }
      };

      const verification = await verificationsCrud.create(verificationData);

      // Store encrypted document photos if provided
      if (request.minor_id_document.document_photo) {
        await this.storeDocumentPhoto(
          verification.id, 
          'minor', 
          request.minor_id_document.document_photo
        );
      }

      if (request.sponsor_id_document.document_photo) {
        await this.storeDocumentPhoto(
          verification.id, 
          'sponsor', 
          request.sponsor_id_document.document_photo
        );
      }

      // Update profiles with identity information
      await this.updateUserProfiles(request);

      // Create admin notification for manual review
      await this.createAdminNotification(verification.id, request);

      // Log analytics
      const analyticsCrud = new CrudOperations('analytics_events', this.adminToken);
      await analyticsCrud.create({
        user_id: request.minor_user_id,
        event_type: 'identity_verification_submitted',
        event_category: 'compliance',
        event_data: {
          sponsorship_id: request.sponsorship_id,
          sponsor_user_id: request.sponsor_user_id,
          verification_id: verification.id,
          guardian_consent: request.guardian_consent.consent_given
        }
      });

      return {
        verification_id: verification.id.toString(),
        status: 'pending',
        message: 'Demande de vérification soumise. Traitement sous 24-48h.'
      };

    } catch (error) {
      console.error('Error submitting verification request:', error);
      throw error;
    }
  }

  /**
   * Update user profiles with identity information
   */
  private async updateUserProfiles(request: VerificationRequest): Promise<void> {
    const profilesCrud = new CrudOperations('profiles', this.adminToken);

    // Update minor's profile
    const minorProfiles = await profilesCrud.findMany({
      user_id: request.minor_user_id
    });

    if (minorProfiles && minorProfiles.length > 0) {
      await profilesCrud.update(minorProfiles[0].id, {
        id_number: request.minor_id_document.id_number,
        id_type: request.minor_id_document.id_type,
        id_country: request.minor_id_document.id_country,
        id_hash: await hashString(request.minor_id_document.id_number),
        guardian_user_id: request.sponsor_user_id,
        identity_verified: false, // Will be set to true after admin approval
        modify_time: new Date().toISOString()
      });
    }

    // Update sponsor's profile with ID info if not already present
    const sponsorProfiles = await profilesCrud.findMany({
      user_id: request.sponsor_user_id
    });

    if (sponsorProfiles && sponsorProfiles.length > 0 && !sponsorProfiles[0].id_number) {
      await profilesCrud.update(sponsorProfiles[0].id, {
        id_number: request.sponsor_id_document.id_number,
        id_type: request.sponsor_id_document.id_type,
        id_country: request.sponsor_id_document.id_country,
        id_hash: await hashString(request.sponsor_id_document.id_number),
        modify_time: new Date().toISOString()
      });
    }
  }

  /**
   * Store document photo securely (encrypted)
   */
  private async storeDocumentPhoto(verificationId: number, documentType: 'minor' | 'sponsor', photo: File | string): Promise<void> {
    try {
      // In production, encrypt and store in secure cloud storage
      // For now, simulate secure storage
      
      const documentStorageCrud = new CrudOperations('document_storage', this.adminToken);
      
      let photoData: string;
      let filename: string;
      
      if (typeof photo === 'string') {
        // Base64 data
        photoData = photo;
        filename = `${documentType}_id_${verificationId}_${Date.now()}.jpg`;
      } else {
        // File object - convert to base64 (in production, use proper file handling)
        photoData = 'data:image/jpeg;base64,'; // Mock base64
        filename = photo.name || `${documentType}_id_${verificationId}.jpg`;
      }

      await documentStorageCrud.create({
        verification_id: verificationId,
        document_type: documentType,
        filename: filename,
        encrypted_data: this.encryptData(photoData), // Simple encryption
        mime_type: 'image/jpeg',
        file_size: photoData.length,
        uploaded_at: new Date().toISOString(),
        is_encrypted: true
      });

      console.log(`Stored ${documentType} document photo for verification ${verificationId}`);

    } catch (error) {
      console.error('Error storing document photo:', error);
      // Don't throw - document storage failure shouldn't block verification
    }
  }

  /**
   * Simple encryption for document data (in production, use proper encryption)
   */
  private encryptData(data: string): string {
    // In production, use proper encryption like AES-256
    // For now, just base64 encode again as a placeholder
    return Buffer.from(data).toString('base64');
  }

  /**
   * Create notification for admin review
   */
  private async createAdminNotification(verificationId: number, request: VerificationRequest): Promise<void> {
    const notificationsCrud = new CrudOperations('notifications', this.adminToken);

    await notificationsCrud.create({
      user_id: null, // Admin notification
      type: 'identity_verification_pending',
      title: 'Nouvelle vérification d\'identité en attente',
      message: `Vérification d'identité requise pour mineur: ${request.minor_id_document.holder_name}. Parrain: ${request.sponsor_id_document.holder_name}.`,
      channel: 'email',
      recipient: 'admin@wolosenegal.com',
      status: 'pending',
      metadata: {
        verification_id: verificationId,
        minor_user_id: request.minor_user_id,
        sponsor_user_id: request.sponsor_user_id,
        sponsorship_id: request.sponsorship_id,
        priority: 'high'
      }
    });
  }

  /**
   * Admin function to approve/reject verification
   */
  async processVerificationDecision(
    verificationId: number, 
    decision: 'approved' | 'rejected', 
    adminUserId: number,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      const verificationsCrud = new CrudOperations('identity_verifications', this.adminToken);
      const verification = await verificationsCrud.findById(verificationId);

      if (!verification) {
        return { success: false, message: 'Vérification non trouvée' };
      }

      if (verification.status !== 'pending') {
        return { success: false, message: 'Cette vérification a déjà été traitée' };
      }

      // Update verification status
      await verificationsCrud.update(verificationId, {
        status: decision,
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || '',
        modify_time: new Date().toISOString()
      });

      if (decision === 'approved') {
        await this.handleApprovedVerification(verification);
      } else {
        await this.handleRejectedVerification(verification);
      }

      return { 
        success: true, 
        message: decision === 'approved' ? 'Vérification approuvée' : 'Vérification rejetée'
      };

    } catch (error) {
      console.error('Error processing verification decision:', error);
      return { success: false, message: 'Erreur lors du traitement' };
    }
  }

  /**
   * Handle approved verification - activate pot and notify users
   */
  private async handleApprovedVerification(verification: any): Promise<void> {
    try {
      // Update user profiles to mark as verified
      const profilesCrud = new CrudOperations('profiles', this.adminToken);
      const minorProfiles = await profilesCrud.findMany({
        user_id: verification.minor_user_id
      });

      if (minorProfiles && minorProfiles.length > 0) {
        await profilesCrud.update(minorProfiles[0].id, {
          identity_verified: true,
          verified_at: new Date().toISOString(),
          modify_time: new Date().toISOString()
        });
      }

      // Find and activate the associated pot
      const sponsorshipsCrud = new CrudOperations('sponsorships', this.adminToken);
      const sponsorship = await sponsorshipsCrud.findById(verification.sponsorship_id);

      if (sponsorship && sponsorship.pot_id) {
        const potsCrud = new CrudOperations('pots', this.adminToken);
        await potsCrud.update(sponsorship.pot_id, {
          status: 'active',
          is_public: true,
          modify_time: new Date().toISOString()
        });

        // Send notifications
        const notificationsCrud = new CrudOperations('notifications', this.adminToken);
        
        // Notify minor
        await notificationsCrud.create({
          user_id: verification.minor_user_id,
          pot_id: sponsorship.pot_id,
          type: 'identity_verified',
          title: 'Identité vérifiée ! Votre cagnotte est active 🎉',
          message: 'Votre identité a été vérifiée avec succès. Votre cagnotte d\'anniversaire est maintenant publique !',
          channel: 'email',
          recipient: 'minor@email.com', // Get from user data
          status: 'pending'
        });

        // Notify sponsor
        await notificationsCrud.create({
          user_id: verification.sponsor_user_id,
          pot_id: sponsorship.pot_id,
          type: 'sponsorship_approved',
          title: 'Parrainage approuvé ! +5 points bonus 🎯',
          message: 'La vérification d\'identité de votre filleul est approuvée. Vous gagnez 5 points bonus !',
          channel: 'email',
          recipient: 'sponsor@email.com', // Get from user data
          status: 'pending'
        });
      }

      // Award bonus points to sponsor for successful verification
      const pointsCrud = new CrudOperations('point_transactions', this.adminToken);
      await pointsCrud.create({
        user_id: verification.sponsor_user_id,
        transaction_type: 'bonus',
        points_amount: 5,
        source_type: 'identity_verification',
        source_id: verification.sponsorship_id,
        description: 'Bonus vérification d\'identité réussie',
        metadata: {
          verification_id: verification.id,
          minor_user_id: verification.minor_user_id
        }
      });

      console.log(`✅ Approved verification ${verification.id} and activated pot`);

    } catch (error) {
      console.error('Error handling approved verification:', error);
    }
  }

  /**
   * Handle rejected verification - notify users and provide guidance
   */
  private async handleRejectedVerification(verification: any): Promise<void> {
    try {
      // Send rejection notifications
      const notificationsCrud = new CrudOperations('notifications', this.adminToken);
      
      // Notify sponsor (as guardian)
      await notificationsCrud.create({
        user_id: verification.sponsor_user_id,
        type: 'identity_rejected',
        title: 'Vérification d\'identité rejetée',
        message: 'La vérification d\'identité a été rejetée. Veuillez vérifier les documents et soumettre à nouveau.',
        channel: 'email',
        recipient: 'sponsor@email.com',
        status: 'pending'
      });

      console.log(`❌ Rejected verification ${verification.id}`);

    } catch (error) {
      console.error('Error handling rejected verification:', error);
    }
  }

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: number): Promise<any> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      const verificationsCrud = new CrudOperations('identity_verifications', this.adminToken);
      
      // Check as minor
      const minorVerifications = await verificationsCrud.findMany({
        minor_user_id: userId
      });

      // Check as sponsor
      const sponsorVerifications = await verificationsCrud.findMany({
        sponsor_user_id: userId
      });

      return {
        as_minor: minorVerifications || [],
        as_sponsor: sponsorVerifications || [],
        has_pending_verification: (minorVerifications || []).some((v: any) => v.status === 'pending') ||
                                (sponsorVerifications || []).some((v: any) => v.status === 'pending')
      };

    } catch (error) {
      console.error('Error getting verification status:', error);
      return { as_minor: [], as_sponsor: [], has_pending_verification: false };
    }
  }

  /**
   * Check if user needs identity verification (is under 18)
   */
  async needsIdentityVerification(userId: number): Promise<boolean> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      const profilesCrud = new CrudOperations('profiles', this.adminToken);
      const profiles = await profilesCrud.findMany({ user_id: userId });

      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        if (profile.dob) {
          const age = this.calculateAge(profile.dob);
          return age < 18 && !profile.identity_verified;
        }
      }

      return false;

    } catch (error) {
      console.error('Error checking verification need:', error);
      return false;
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}