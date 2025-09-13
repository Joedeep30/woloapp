import CrudOperations from './crud-operations';
import { PointsEngine } from './points-engine';
import { generateAdminUserToken } from './auth';

export interface ScheduledPot {
  sponsorship_id: number;
  user_id: number;
  birthday_date: string;
  scheduled_open_date: string;
  full_name: string;
  email: string;
  phone: string;
  is_minor: boolean;
}

export class SchedulerService {
  private adminToken: string = '';

  constructor() {
    this.initializeToken();
  }

  private async initializeToken() {
    this.adminToken = await generateAdminUserToken();
  }

  /**
   * Check for pots that need to be created (J-30 before birthday)
   */
  async checkAndCreateScheduledPots(): Promise<void> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      console.log('🗓️ Checking for pots to create at J-30...');

      const sponsorshipsCrud = new CrudOperations('sponsorships', this.adminToken);
      const potsCrud = new CrudOperations('pots', this.adminToken);
      const pointsEngine = new PointsEngine(this.adminToken);

      // Find accepted sponsorships without pots that should be opened now
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(in30Days.getDate() + 30);

      const sponsorships = await sponsorshipsCrud.findMany({
        status: 'accepted',
        pot_id: null // No pot created yet
      });

      if (!sponsorships || sponsorships.length === 0) {
        console.log('No sponsorships to process');
        return;
      }

      for (const sponsorship of sponsorships) {
        const birthdayDate = new Date(sponsorship.invited_birthday);
        const potShouldOpen = new Date(birthdayDate);
        potShouldOpen.setDate(potShouldOpen.getDate() - 30); // J-30

        // If pot should open today or earlier, create it
        if (potShouldOpen <= today) {
          await this.createScheduledPot(sponsorship, pointsEngine);
        }
      }

    } catch (error) {
      console.error('❌ Error in scheduler service:', error);
    }
  }

  /**
   * Create a pot for an accepted sponsorship
   */
  private async createScheduledPot(sponsorship: any, pointsEngine: PointsEngine): Promise<void> {
    try {
      const potsCrud = new CrudOperations('pots', this.adminToken);
      const profilesCrud = new CrudOperations('profiles', this.adminToken);

      // Get user profile to check if minor
      const profiles = await profilesCrud.findMany({
        user_id: sponsorship.invited_user_id
      });

      const profile = profiles?.[0];
      const isMinor = profile ? this.calculateAge(profile.dob) < 18 : false;

      // Create pot data
      const potData = {
        user_id: sponsorship.invited_user_id,
        title: `Anniversaire de ${sponsorship.invited_name}`,
        description: `Aidez ${sponsorship.invited_name.split(' ')[0]} à célébrer son anniversaire avec WOLO SENEGAL !`,
        target_amount: 25000, // Default target
        current_amount: 0,
        birthday_date: sponsorship.invited_birthday,
        status: isMinor ? 'scheduled' : 'active', // Keep private for minors
        is_public: !isMinor, // Private for minors until ID verification
        allow_anonymous_donations: true,
        show_donor_names: true,
        birthday_person_name: sponsorship.invited_name,
        birthday_person_email: sponsorship.invited_email,
        birthday_person_phone: sponsorship.invited_phone,
        birthday_person_user_id: sponsorship.invited_user_id,
        is_self_birthday: true,
        countdown_end: new Date(sponsorship.invited_birthday + 'T23:59:59Z').toISOString()
      };

      const pot = await potsCrud.create(potData);

      // Update sponsorship with pot_id
      await new CrudOperations('sponsorships', this.adminToken).update(sponsorship.id, {
        pot_id: pot.id
      });

      // Award additional points to sponsor for pot opening (4 points)
      await pointsEngine.awardPoints({
        user_id: sponsorship.sponsor_user_id,
        transaction_type: 'earned',
        points_amount: 4,
        source_type: 'pot_opening',
        source_id: sponsorship.id,
        description: `Points pour ouverture automatique de cagnotte J-30: ${sponsorship.invited_name}`,
        metadata: {
          pot_id: pot.id,
          invited_user_id: sponsorship.invited_user_id,
          scheduled_opening: true
        }
      });

      // Send notification to the birthday person
      const notificationsCrud = new CrudOperations('notifications', this.adminToken);
      await notificationsCrud.create({
        user_id: sponsorship.invited_user_id,
        pot_id: pot.id,
        type: 'pot_opened',
        title: 'Votre cagnotte d\'anniversaire est ouverte ! 🎉',
        message: `Votre cagnotte pour le ${new Date(sponsorship.invited_birthday).toLocaleDateString('fr-FR')} est maintenant active. Partagez-la avec vos amis !`,
        channel: 'email',
        recipient: sponsorship.invited_email,
        status: 'pending'
      });

      // Send notification to sponsor
      const sponsorCrud = new CrudOperations('users', this.adminToken);
      const sponsor = await sponsorCrud.findById(sponsorship.sponsor_user_id);
      
      if (sponsor) {
        await notificationsCrud.create({
          user_id: sponsorship.sponsor_user_id,
          pot_id: pot.id,
          type: 'sponsored_pot_opened',
          title: 'Cagnotte de votre filleul ouverte ! +4 points 🎯',
          message: `La cagnotte de ${sponsorship.invited_name} est maintenant active. Vous gagnez 4 points !`,
          channel: 'email',
          recipient: sponsor.email,
          status: 'pending'
        });
      }

      // Log analytics
      const analyticsCrud = new CrudOperations('analytics_events', this.adminToken);
      await analyticsCrud.create({
        pot_id: pot.id,
        user_id: sponsorship.invited_user_id,
        event_type: 'pot_auto_created',
        event_category: 'system_event',
        event_data: {
          sponsorship_id: sponsorship.id,
          sponsor_user_id: sponsorship.sponsor_user_id,
          is_minor: isMinor,
          days_before_birthday: 30,
          auto_created: true
        }
      });

      console.log(`✅ Created pot for ${sponsorship.invited_name} (ID: ${pot.id})`);

    } catch (error) {
      console.error(`❌ Error creating pot for sponsorship ${sponsorship.id}:`, error);
    }
  }

  /**
   * Check for pots that need reminder notifications
   */
  async sendBirthdayReminders(): Promise<void> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      console.log('📧 Checking for birthday reminders...');

      const potsCrud = new CrudOperations('pots', this.adminToken);
      const notificationsCrud = new CrudOperations('notifications', this.adminToken);

      const today = new Date();
      
      // Find active pots with birthdays in 7 days, 3 days, and 1 day
      const reminderDays = [7, 3, 1];

      for (const days of reminderDays) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + days);
        
        const dateStr = targetDate.toISOString().split('T')[0];

        const pots = await potsCrud.findMany({
          status: 'active',
          birthday_date: dateStr
        });

        if (pots && pots.length > 0) {
          for (const pot of pots) {
            // Check if reminder already sent for this day
            const existingReminder = await notificationsCrud.findMany({
              pot_id: pot.id,
              type: `birthday_reminder_${days}d`,
              status: ['sent', 'pending']
            });

            if (!existingReminder || existingReminder.length === 0) {
              // Send reminder
              await notificationsCrud.create({
                user_id: pot.user_id,
                pot_id: pot.id,
                type: `birthday_reminder_${days}d`,
                title: `${days} jour${days > 1 ? 's' : ''} avant votre anniversaire ! 🎂`,
                message: `Votre anniversaire approche ! Partagez votre cagnotte pour atteindre votre objectif de ${this.formatAmount(pot.target_amount)} CFA.`,
                channel: 'email',
                recipient: pot.birthday_person_email,
                status: 'pending'
              });

              console.log(`📧 Sent ${days}d reminder for ${pot.birthday_person_name}`);
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Error sending birthday reminders:', error);
    }
  }

  /**
   * Process expired pots and clean up
   */
  async processExpiredPots(): Promise<void> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      console.log('🧹 Processing expired pots...');

      const potsCrud = new CrudOperations('pots', this.adminToken);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find pots where birthday was yesterday or earlier and status is still active
      const expiredPots = await potsCrud.findMany({
        status: 'active'
      });

      if (expiredPots && expiredPots.length > 0) {
        for (const pot of expiredPots) {
          const birthdayDate = new Date(pot.birthday_date);
          birthdayDate.setHours(23, 59, 59, 999);

          if (birthdayDate < today) {
            // Mark pot as closed
            await potsCrud.update(pot.id, {
              status: 'closed',
              modify_time: new Date().toISOString()
            });

            // Generate QR codes if pot reached target
            if (pot.current_amount >= pot.target_amount) {
              await this.generateQRCodesForPot(pot.id);
            }

            console.log(`🔒 Closed expired pot: ${pot.title} (ID: ${pot.id})`);
          }
        }
      }

    } catch (error) {
      console.error('❌ Error processing expired pots:', error);
    }
  }

  /**
   * Generate QR codes for successful pots
   */
  private async generateQRCodesForPot(potId: number): Promise<void> {
    try {
      const qrCrud = new CrudOperations('qr_codes', this.adminToken);
      const inviteesCrud = new CrudOperations('invitees', this.adminToken);

      // Get all confirmed invitees
      const invitees = await inviteesCrud.findMany({
        pot_id: potId,
        status: 'confirmed'
      });

      if (invitees && invitees.length > 0) {
        for (const invitee of invitees) {
          const qrCode = `WOLO_QR_${potId}_${invitee.id}_${Date.now()}`;
          
          await qrCrud.create({
            pot_id: potId,
            invitee_id: invitee.id,
            code: qrCode,
            qr_type: 'invitee',
            payload: {
              pot_id: potId,
              invitee_id: invitee.id,
              name: invitee.name,
              tickets: 1,
              generated_at: new Date().toISOString()
            },
            status: 'issued'
          });
        }

        console.log(`🎫 Generated ${invitees.length} QR codes for pot ${potId}`);
      }

    } catch (error) {
      console.error(`❌ Error generating QR codes for pot ${potId}:`, error);
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

  /**
   * Format amount in CFA
   */
  private formatAmount(amount: any): string {
    return new Intl.NumberFormat('fr-FR').format(parseFloat(amount || '0'));
  }

  /**
   * Main cron job function - call this from your deployment's cron
   */
  async runDailyTasks(): Promise<void> {
    console.log('🚀 Starting daily scheduler tasks...');
    
    try {
      await this.checkAndCreateScheduledPots();
      await this.sendBirthdayReminders();
      await this.processExpiredPots();
      
      console.log('✅ Daily scheduler tasks completed successfully');
    } catch (error) {
      console.error('❌ Error in daily scheduler tasks:', error);
    }
  }
}