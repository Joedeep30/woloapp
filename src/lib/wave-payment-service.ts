import CrudOperations from './crud-operations';
import { PointsEngine } from './points-engine';

export interface WavePaymentRequest {
  pot_id: number;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  amount: number;
  message?: string;
  is_anonymous: boolean;
  show_name_consent: boolean;
  show_amount_consent: boolean;
  return_url?: string;
}

export interface WaveWebhookPayload {
  id: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  customer_id: string;
  merchant_id: string;
  reference: string;
  when: string;
  payment_method: string;
  last_payment_error?: string;
}

export class WavePaymentService {
  private baseUrl: string;
  private apiKey: string;
  private merchantId: string;
  private webhookSecret: string;

  constructor(token: string) {
    this.baseUrl = process.env.WAVE_API_URL || 'https://api.wave.com';
    this.apiKey = process.env.WAVE_API_KEY || '';
    this.merchantId = process.env.WAVE_MERCHANT_ID || '';
    this.webhookSecret = process.env.WAVE_WEBHOOK_SECRET || '';
  }

  /**
   * Initialize a Wave payment
   */
  async initiatePayment(paymentRequest: WavePaymentRequest): Promise<{ 
    payment_url: string; 
    wave_transaction_id: string; 
    donation_id: number 
  }> {
    try {
      // Create donation record first
      const donationsCrud = new CrudOperations('donations', await this.getAdminToken());
      const donation = await donationsCrud.create({
        pot_id: paymentRequest.pot_id,
        donor_name: paymentRequest.donor_name || null,
        donor_email: paymentRequest.donor_email || null,
        donor_phone: paymentRequest.donor_phone || null,
        amount: paymentRequest.amount,
        is_anonymous: paymentRequest.is_anonymous,
        show_name_consent: paymentRequest.show_name_consent,
        show_amount_consent: paymentRequest.show_amount_consent,
        message: paymentRequest.message || null,
        payment_method: 'wave',
        status: 'pending',
        wave_payment_status: 'pending'
      });

      // Generate unique reference
      const reference = `WOLO_${donation.id}_${Date.now()}`;

      // Prepare Wave payment request
      const wavePayload = {
        amount: paymentRequest.amount,
        currency: 'XOF', // West African CFA Franc
        customer_email: paymentRequest.donor_email || '',
        customer_name: paymentRequest.donor_name || 'Donateur',
        reference: reference,
        return_url: paymentRequest.return_url || `${process.env.NEXT_PUBLIC_BASE_URL}/donation/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donation/cancelled`,
        webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/wave`,
        metadata: {
          pot_id: paymentRequest.pot_id.toString(),
          donation_id: donation.id.toString(),
          donor_phone: paymentRequest.donor_phone || '',
          message: paymentRequest.message || ''
        }
      };

      // Make API call to Wave (this is a mock implementation)
      const waveResponse = await this.makeWaveAPICall('/v1/checkout/sessions', 'POST', wavePayload);

      if (!waveResponse.success) {
        throw new Error(waveResponse.message || 'Wave API error');
      }

      // Update donation with Wave transaction ID
      await donationsCrud.update(donation.id, {
        wave_transaction_id: waveResponse.wave_session_id,
        modify_time: new Date().toISOString()
      });

      return {
        payment_url: waveResponse.wave_launch_url,
        wave_transaction_id: waveResponse.wave_session_id,
        donation_id: donation.id
      };

    } catch (error) {
      console.error('Error initiating Wave payment:', error);
      throw error;
    }
  }

  /**
   * Process Wave webhook (idempotent)
   */
  async processWebhook(webhookPayload: WaveWebhookPayload, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(webhookPayload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const adminToken = await this.getAdminToken();
      const donationsCrud = new CrudOperations('donations', adminToken);

      // Find donation by Wave transaction ID
      const donations = await donationsCrud.findMany({
        wave_transaction_id: webhookPayload.id
      });

      if (!donations || donations.length === 0) {
        console.warn(`No donation found for Wave transaction ${webhookPayload.id}`);
        return;
      }

      const donation = donations[0];

      // Idempotency check - if already processed, skip
      if (donation.status === 'completed' && webhookPayload.status === 'success') {
        console.log(`Webhook already processed for donation ${donation.id}`);
        return;
      }

      if (donation.status === 'failed' && webhookPayload.status === 'failed') {
        console.log(`Webhook already processed for failed donation ${donation.id}`);
        return;
      }

      // Map Wave status to our status
      let newStatus = 'pending';
      let waveStatus = webhookPayload.status;

      switch (webhookPayload.status) {
        case 'success':
          newStatus = 'completed';
          await this.handleSuccessfulPayment(donation, adminToken);
          break;
        case 'failed':
        case 'cancelled':
          newStatus = 'failed';
          break;
      }

      // Update donation status
      await donationsCrud.update(donation.id, {
        status: newStatus,
        wave_payment_status: waveStatus,
        processed_at: webhookPayload.status === 'success' ? new Date().toISOString() : null,
        modify_time: new Date().toISOString()
      });

      console.log(`Processed Wave webhook for donation ${donation.id}: ${webhookPayload.status}`);

    } catch (error) {
      console.error('Error processing Wave webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment - update pot and award points
   */
  private async handleSuccessfulPayment(donation: any, adminToken: string): Promise<void> {
    try {
      // Update pot amount
      const potsCrud = new CrudOperations('pots', adminToken);
      const pot = await potsCrud.findById(donation.pot_id);

      if (pot) {
        const newAmount = parseFloat(pot.current_amount || '0') + parseFloat(donation.amount);
        await potsCrud.update(pot.id, {
          current_amount: newAmount,
          modify_time: new Date().toISOString()
        });

        // Check if this is a sponsored pot and award growth bonuses
        await this.checkSponsorshipBonuses(pot.id, newAmount, adminToken);

        // Award first donation bonus to sponsor (if applicable)
        if (parseFloat(pot.current_amount || '0') === 0) { // This was the first donation
          await this.awardFirstDonationBonus(pot.id, adminToken);
        }
      }

      // Send notification to pot owner
      const notificationsCrud = new CrudOperations('notifications', adminToken);
      await notificationsCrud.create({
        user_id: pot?.user_id,
        pot_id: donation.pot_id,
        type: 'donation_received',
        title: 'Nouveau don reçu ! 🎉',
        message: `${donation.donor_name || 'Un donateur'} a contribué ${this.formatAmount(donation.amount)} CFA à votre cagnotte.`,
        channel: 'email',
        recipient: pot?.birthday_person_email,
        status: 'pending'
      });

      // Log analytics
      const analyticsCrud = new CrudOperations('analytics_events', adminToken);
      await analyticsCrud.create({
        pot_id: donation.pot_id,
        user_id: pot?.user_id,
        event_type: 'donation_completed',
        event_category: 'conversion',
        event_data: {
          amount: parseFloat(donation.amount),
          donor_name: donation.donor_name,
          payment_method: 'wave',
          is_anonymous: donation.is_anonymous,
          pot_total_after: parseFloat(pot?.current_amount || '0') + parseFloat(donation.amount)
        }
      });

    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  /**
   * Check and award sponsorship bonuses for pot growth
   */
  private async checkSponsorshipBonuses(potId: number, newAmount: number, adminToken: string): Promise<void> {
    try {
      const sponsorshipsCrud = new CrudOperations('sponsorships', adminToken);
      
      // Find sponsorship for this pot
      const sponsorships = await sponsorshipsCrud.findMany({
        pot_id: potId,
        status: 'accepted'
      });

      if (sponsorships && sponsorships.length > 0) {
        const sponsorship = sponsorships[0];
        const pointsEngine = new PointsEngine(adminToken);
        
        // Calculate growth bonuses
        await pointsEngine.calculatePotGrowthBonus(potId, sponsorship.sponsor_user_id);
      }

    } catch (error) {
      console.error('Error checking sponsorship bonuses:', error);
    }
  }

  /**
   * Award 5 points to sponsor for first donation
   */
  private async awardFirstDonationBonus(potId: number, adminToken: string): Promise<void> {
    try {
      const sponsorshipsCrud = new CrudOperations('sponsorships', adminToken);
      
      // Find sponsorship for this pot
      const sponsorships = await sponsorshipsCrud.findMany({
        pot_id: potId,
        status: 'accepted'
      });

      if (sponsorships && sponsorships.length > 0) {
        const sponsorship = sponsorships[0];
        const pointsEngine = new PointsEngine(adminToken);
        
        // Award first donation bonus
        await pointsEngine.awardPoints({
          user_id: sponsorship.sponsor_user_id,
          transaction_type: 'bonus',
          points_amount: 5,
          source_type: 'first_donation',
          source_id: sponsorship.id,
          description: `Bonus première donation de votre filleul`,
          metadata: {
            pot_id: potId,
            invited_user_id: sponsorship.invited_user_id
          }
        });
      }

    } catch (error) {
      console.error('Error awarding first donation bonus:', error);
    }
  }

  /**
   * Verify Wave webhook signature
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // In production, implement proper HMAC SHA256 verification
      // For now, just check if signature exists
      return signature && signature.length > 0;

      // Real implementation would be:
      // const crypto = require('crypto');
      // const expectedSignature = crypto
      //   .createHmac('sha256', this.webhookSecret)
      //   .update(JSON.stringify(payload))
      //   .digest('hex');
      // return signature === expectedSignature;

    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Make API call to Wave (mock implementation)
   */
  private async makeWaveAPICall(endpoint: string, method: string, data: any): Promise<any> {
    try {
      // This is a mock implementation
      // In production, use the actual Wave API
      
      console.log(`Mock Wave API call: ${method} ${endpoint}`, data);

      // Simulate API response
      if (endpoint === '/v1/checkout/sessions' && method === 'POST') {
        return {
          success: true,
          wave_session_id: `wave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          wave_launch_url: `https://checkout.wave.com/session/${Date.now()}`,
          message: 'Payment session created successfully'
        };
      }

      return { success: false, message: 'Unknown endpoint' };

    } catch (error) {
      console.error('Error making Wave API call:', error);
      return { success: false, message: 'API call failed' };
    }
  }

  /**
   * Get refund for a donation
   */
  async refundDonation(donationId: number, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const adminToken = await this.getAdminToken();
      const donationsCrud = new CrudOperations('donations', adminToken);

      const donation = await donationsCrud.findById(donationId);
      if (!donation) {
        return { success: false, message: 'Donation non trouvée' };
      }

      if (donation.status !== 'completed') {
        return { success: false, message: 'Seuls les dons complétés peuvent être remboursés' };
      }

      // Call Wave refund API (mock)
      const refundResponse = await this.makeWaveAPICall(
        `/v1/transactions/${donation.wave_transaction_id}/refund`, 
        'POST', 
        { reason }
      );

      if (refundResponse.success) {
        await donationsCrud.update(donationId, {
          status: 'refunded',
          modify_time: new Date().toISOString()
        });

        // Update pot amount
        const potsCrud = new CrudOperations('pots', adminToken);
        const pot = await potsCrud.findById(donation.pot_id);
        if (pot) {
          const newAmount = Math.max(0, parseFloat(pot.current_amount || '0') - parseFloat(donation.amount));
          await potsCrud.update(pot.id, {
            current_amount: newAmount,
            modify_time: new Date().toISOString()
          });
        }

        return { success: true, message: 'Remboursement effectué avec succès' };
      }

      return { success: false, message: 'Échec du remboursement Wave' };

    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, message: 'Erreur lors du remboursement' };
    }
  }

  /**
   * Get admin token
   */
  private async getAdminToken(): Promise<string> {
    const { generateAdminUserToken } = await import('./auth');
    return await generateAdminUserToken();
  }

  /**
   * Format amount in CFA
   */
  private formatAmount(amount: any): string {
    return new Intl.NumberFormat('fr-FR').format(parseFloat(amount || '0'));
  }

  /**
   * Get donation status from Wave (for reconciliation)
   */
  async checkPaymentStatus(waveTransactionId: string): Promise<any> {
    try {
      const response = await this.makeWaveAPICall(`/v1/transactions/${waveTransactionId}`, 'GET', {});
      return response;

    } catch (error) {
      console.error('Error checking Wave payment status:', error);
      return { success: false, message: 'Erreur lors de la vérification du statut' };
    }
  }

  /**
   * Daily reconciliation of payments
   */
  async reconcilePayments(): Promise<void> {
    try {
      console.log('🔍 Starting Wave payments reconciliation...');

      const adminToken = await this.getAdminToken();
      const donationsCrud = new CrudOperations('donations', adminToken);

      // Get all pending donations older than 30 minutes
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      const pendingDonations = await donationsCrud.findMany({
        status: 'pending',
        payment_method: 'wave'
      });

      if (pendingDonations && pendingDonations.length > 0) {
        for (const donation of pendingDonations) {
          if (new Date(donation.create_time) < thirtyMinutesAgo) {
            // Check status with Wave
            const waveStatus = await this.checkPaymentStatus(donation.wave_transaction_id);
            
            if (waveStatus.success && waveStatus.status === 'success') {
              // Process as successful payment
              await this.handleSuccessfulPayment(donation, adminToken);
              await donationsCrud.update(donation.id, {
                status: 'completed',
                processed_at: new Date().toISOString()
              });
              console.log(`✅ Reconciled successful payment for donation ${donation.id}`);
            } else if (waveStatus.status === 'failed' || waveStatus.status === 'cancelled') {
              // Mark as failed
              await donationsCrud.update(donation.id, {
                status: 'failed'
              });
              console.log(`❌ Reconciled failed payment for donation ${donation.id}`);
            }
          }
        }
      }

      console.log('✅ Wave payments reconciliation completed');

    } catch (error) {
      console.error('❌ Error in Wave payments reconciliation:', error);
    }
  }
}