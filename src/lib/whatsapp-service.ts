import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';

export interface WhatsAppContact {
  phone_number: string;
  name?: string;
  user_id?: number;
  imported_at?: string;
  last_message_sent?: string;
  opt_out?: boolean;
  country_code?: string;
}

export interface BulkMessage {
  message_text: string;
  recipients: string[]; // Phone numbers
  template_name?: string;
  template_variables?: { [key: string]: string };
  scheduled_for?: string; // ISO date string
  campaign_name?: string;
}

export interface MessageStatus {
  phone_number: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
}

export interface WhatsAppApiConfig {
  access_token: string;
  phone_number_id: string;
  webhook_verify_token: string;
  business_account_id: string;
  api_version: string;
}

export class WhatsAppService {
  private adminToken: string = '';
  private config: WhatsAppApiConfig;

  constructor() {
    this.initializeToken();
    
    // Initialize with environment variables or default config
    this.config = {
      access_token: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      webhook_verify_token: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      api_version: process.env.WHATSAPP_API_VERSION || 'v18.0'
    };
  }

  private async initializeToken() {
    this.adminToken = await generateAdminUserToken();
  }

  /**
   * Import contacts from user's WhatsApp
   * In practice, this would be done through WhatsApp Business API
   */
  async importContacts(userId: number, contactList: WhatsAppContact[]): Promise<{
    imported_count: number;
    skipped_count: number;
    errors: string[];
  }> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      const contactsCrud = new CrudOperations('whatsapp_contacts', this.adminToken);

      for (const contact of contactList) {
        try {
          // Validate phone number format
          const cleanPhoneNumber = this.cleanPhoneNumber(contact.phone_number);
          if (!cleanPhoneNumber) {
            errors.push(`Numéro invalide: ${contact.phone_number}`);
            skippedCount++;
            continue;
          }

          // Check if contact already exists
          const existingContacts = await contactsCrud.findMany({
            user_id: userId,
            phone_number: cleanPhoneNumber
          });

          if (existingContacts && existingContacts.length > 0) {
            skippedCount++;
            continue;
          }

          // Create contact record
          await contactsCrud.create({
            user_id: userId,
            phone_number: cleanPhoneNumber,
            name: contact.name || '',
            country_code: contact.country_code || this.extractCountryCode(cleanPhoneNumber),
            imported_at: new Date().toISOString(),
            opt_out: false,
            is_wolo_user: false // Will be updated if we find matching user
          });

          importedCount++;

          // Check if this contact is already a WOLO user
          await this.checkIfWoloUser(cleanPhoneNumber);

        } catch (contactError) {
          console.error(`Error importing contact ${contact.phone_number}:`, contactError);
          errors.push(`Erreur pour ${contact.phone_number}: ${contactError}`);
          skippedCount++;
        }
      }

      // Log analytics
      const analyticsCrud = new CrudOperations('analytics_events', this.adminToken);
      await analyticsCrud.create({
        user_id: userId,
        event_type: 'contacts_imported',
        event_category: 'whatsapp',
        event_data: {
          imported_count: importedCount,
          skipped_count: skippedCount,
          total_contacts: contactList.length,
          errors_count: errors.length
        }
      });

      console.log(`✅ Imported ${importedCount} contacts for user ${userId}`);

      return {
        imported_count: importedCount,
        skipped_count: skippedCount,
        errors: errors
      };

    } catch (error) {
      console.error('Error importing WhatsApp contacts:', error);
      throw error;
    }
  }

  /**
   * Send bulk messages to contacts
   */
  async sendBulkMessage(userId: number, bulkMessage: BulkMessage): Promise<{
    queued_count: number;
    failed_count: number;
    message_id: string;
    errors: string[];
  }> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      let queuedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Create message campaign record
      const campaignsCrud = new CrudOperations('message_campaigns', this.adminToken);
      const campaign = await campaignsCrud.create({
        user_id: userId,
        campaign_name: bulkMessage.campaign_name || `Message ${new Date().toISOString()}`,
        message_text: bulkMessage.message_text,
        template_name: bulkMessage.template_name,
        recipient_count: bulkMessage.recipients.length,
        status: 'processing',
        scheduled_for: bulkMessage.scheduled_for || new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      const messagesCrud = new CrudOperations('whatsapp_messages', this.adminToken);

      // Process each recipient
      for (const phoneNumber of bulkMessage.recipients) {
        try {
          const cleanPhone = this.cleanPhoneNumber(phoneNumber);
          if (!cleanPhone) {
            errors.push(`Numéro invalide: ${phoneNumber}`);
            failedCount++;
            continue;
          }

          // Check opt-out status
          const isOptedOut = await this.checkOptOutStatus(cleanPhone);
          if (isOptedOut) {
            errors.push(`Utilisateur opted out: ${phoneNumber}`);
            failedCount++;
            continue;
          }

          // Queue message for sending
          await messagesCrud.create({
            campaign_id: campaign.id,
            user_id: userId,
            recipient_phone: cleanPhone,
            message_text: bulkMessage.message_text,
            template_name: bulkMessage.template_name,
            template_variables: bulkMessage.template_variables || {},
            status: 'queued',
            scheduled_for: bulkMessage.scheduled_for || new Date().toISOString(),
            queued_at: new Date().toISOString()
          });

          queuedCount++;

        } catch (messageError) {
          console.error(`Error queueing message to ${phoneNumber}:`, messageError);
          errors.push(`Erreur pour ${phoneNumber}: ${messageError}`);
          failedCount++;
        }
      }

      // Update campaign status
      await campaignsCrud.update(campaign.id, {
        status: queuedCount > 0 ? 'queued' : 'failed',
        queued_count: queuedCount,
        failed_count: failedCount,
        updated_at: new Date().toISOString()
      });

      // If messages are not scheduled for later, start sending immediately
      if (!bulkMessage.scheduled_for) {
        await this.processPendingMessages(campaign.id);
      }

      // Log analytics
      const analyticsCrud = new CrudOperations('analytics_events', this.adminToken);
      await analyticsCrud.create({
        user_id: userId,
        event_type: 'bulk_message_initiated',
        event_category: 'whatsapp',
        event_data: {
          campaign_id: campaign.id,
          queued_count: queuedCount,
          failed_count: failedCount,
          total_recipients: bulkMessage.recipients.length,
          template_name: bulkMessage.template_name
        }
      });

      console.log(`✅ Queued ${queuedCount} messages for campaign ${campaign.id}`);

      return {
        queued_count: queuedCount,
        failed_count: failedCount,
        message_id: campaign.id.toString(),
        errors: errors
      };

    } catch (error) {
      console.error('Error sending bulk messages:', error);
      throw error;
    }
  }

  /**
   * Process pending messages in queue (to be called by a scheduled job)
   */
  async processPendingMessages(campaignId?: number): Promise<void> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      const messagesCrud = new CrudOperations('whatsapp_messages', this.adminToken);
      
      // Build query conditions
      const queryConditions: any = { 
        status: 'queued',
        scheduled_for: `<=${new Date().toISOString()}`
      };

      if (campaignId) {
        queryConditions.campaign_id = campaignId;
      }

      const pendingMessages = await messagesCrud.findMany(queryConditions);

      if (!pendingMessages || pendingMessages.length === 0) {
        console.log('No pending messages to process');
        return;
      }

      console.log(`Processing ${pendingMessages.length} pending messages...`);

      // Process messages in batches to avoid rate limits
      const batchSize = 5; // WhatsApp Business API rate limit consideration
      for (let i = 0; i < pendingMessages.length; i += batchSize) {
        const batch = pendingMessages.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (message) => {
          try {
            await this.sendSingleMessage(message);
          } catch (error) {
            console.error(`Failed to send message ${message.id}:`, error);
            await messagesCrud.update(message.id, {
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              failed_at: new Date().toISOString()
            });
          }
        }));

        // Wait between batches to respect rate limits
        if (i + batchSize < pendingMessages.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      }

      console.log('✅ Finished processing pending messages');

    } catch (error) {
      console.error('Error processing pending messages:', error);
    }
  }

  /**
   * Send a single message via WhatsApp Business API
   */
  private async sendSingleMessage(message: any): Promise<void> {
    try {
      if (!this.config.access_token || !this.config.phone_number_id) {
        throw new Error('WhatsApp Business API not configured');
      }

      const messagesCrud = new CrudOperations('whatsapp_messages', this.adminToken);

      // Update message status to sending
      await messagesCrud.update(message.id, {
        status: 'sending',
        sending_at: new Date().toISOString()
      });

      // Prepare API request
      const apiUrl = `https://graph.facebook.com/${this.config.api_version}/${this.config.phone_number_id}/messages`;
      
      let messagePayload: any;

      if (message.template_name) {
        // Use template message
        messagePayload = {
          messaging_product: 'whatsapp',
          to: message.recipient_phone,
          type: 'template',
          template: {
            name: message.template_name,
            language: {
              code: 'fr' // French for Senegal
            },
            components: message.template_variables ? [
              {
                type: 'body',
                parameters: Object.values(message.template_variables).map(value => ({
                  type: 'text',
                  text: value
                }))
              }
            ] : []
          }
        };
      } else {
        // Use text message
        messagePayload = {
          messaging_product: 'whatsapp',
          to: message.recipient_phone,
          type: 'text',
          text: {
            body: message.message_text
          }
        };
      }

      // Make API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${responseData.error?.message || 'Unknown error'}`);
      }

      // Update message as sent
      await messagesCrud.update(message.id, {
        status: 'sent',
        whatsapp_message_id: responseData.messages[0]?.id,
        sent_at: new Date().toISOString(),
        api_response: responseData
      });

      console.log(`✅ Message sent to ${message.recipient_phone}`);

    } catch (error) {
      console.error(`Error sending message to ${message.recipient_phone}:`, error);
      throw error;
    }
  }

  /**
   * Handle WhatsApp webhook notifications (delivery status, etc.)
   */
  async handleWebhookNotification(webhookData: any): Promise<void> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      const messagesCrud = new CrudOperations('whatsapp_messages', this.adminToken);

      // Process status updates
      if (webhookData.entry?.[0]?.changes?.[0]?.value?.statuses) {
        const statuses = webhookData.entry[0].changes[0].value.statuses;

        for (const status of statuses) {
          const whatsappMessageId = status.id;
          const newStatus = status.status; // 'delivered', 'read', 'failed'

          // Find message by WhatsApp message ID
          const messages = await messagesCrud.findMany({
            whatsapp_message_id: whatsappMessageId
          });

          if (messages && messages.length > 0) {
            const message = messages[0];
            const updateData: any = {
              status: newStatus,
              updated_at: new Date().toISOString()
            };

            if (newStatus === 'delivered') {
              updateData.delivered_at = new Date().toISOString();
            } else if (newStatus === 'read') {
              updateData.read_at = new Date().toISOString();
            } else if (newStatus === 'failed') {
              updateData.error_message = status.errors?.[0]?.title || 'Message failed';
              updateData.failed_at = new Date().toISOString();
            }

            await messagesCrud.update(message.id, updateData);
            
            console.log(`Updated message ${message.id} status to ${newStatus}`);
          }
        }
      }

      // Process incoming messages (user replies)
      if (webhookData.entry?.[0]?.changes?.[0]?.value?.messages) {
        const incomingMessages = webhookData.entry[0].changes[0].value.messages;

        for (const incomingMessage of incomingMessages) {
          await this.handleIncomingMessage(incomingMessage);
        }
      }

    } catch (error) {
      console.error('Error handling WhatsApp webhook:', error);
    }
  }

  /**
   * Handle incoming messages from users
   */
  private async handleIncomingMessage(incomingMessage: any): Promise<void> {
    try {
      const incomingMessagesCrud = new CrudOperations('whatsapp_incoming_messages', this.adminToken);
      
      await incomingMessagesCrud.create({
        whatsapp_message_id: incomingMessage.id,
        from_phone: incomingMessage.from,
        message_type: incomingMessage.type,
        message_text: incomingMessage.text?.body || '',
        timestamp: new Date(parseInt(incomingMessage.timestamp) * 1000).toISOString(),
        processed: false,
        received_at: new Date().toISOString()
      });

      // Check if it's an opt-out message
      const messageText = incomingMessage.text?.body?.toLowerCase();
      if (messageText && ['stop', 'arrêt', 'arreter', 'desabonner'].includes(messageText)) {
        await this.handleOptOut(incomingMessage.from);
      }

      console.log(`Received message from ${incomingMessage.from}`);

    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  /**
   * Handle user opt-out
   */
  private async handleOptOut(phoneNumber: string): Promise<void> {
    try {
      const contactsCrud = new CrudOperations('whatsapp_contacts', this.adminToken);
      
      // Update all contact records for this phone number
      const contacts = await contactsCrud.findMany({ phone_number: phoneNumber });
      
      for (const contact of contacts || []) {
        await contactsCrud.update(contact.id, {
          opt_out: true,
          opted_out_at: new Date().toISOString()
        });
      }

      console.log(`User ${phoneNumber} opted out from WhatsApp messages`);

    } catch (error) {
      console.error(`Error handling opt-out for ${phoneNumber}:`, error);
    }
  }

  /**
   * Clean and validate phone number format
   */
  private cleanPhoneNumber(phoneNumber: string): string | null {
    try {
      // Remove all non-digit characters except +
      let cleaned = phoneNumber.replace(/[^\d+]/g, '');
      
      // If doesn't start with +, assume Senegal (+221)
      if (!cleaned.startsWith('+')) {
        if (cleaned.startsWith('221')) {
          cleaned = '+' + cleaned;
        } else if (cleaned.startsWith('7') && cleaned.length === 9) {
          // Senegal mobile number format
          cleaned = '+221' + cleaned;
        } else {
          // Assume local Senegal number
          cleaned = '+221' + cleaned;
        }
      }

      // Validate length (international format should be 10-15 digits)
      const digitsOnly = cleaned.replace(/[^\d]/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return null;
      }

      return cleaned;

    } catch (error) {
      console.error('Error cleaning phone number:', error);
      return null;
    }
  }

  /**
   * Extract country code from phone number
   */
  private extractCountryCode(phoneNumber: string): string {
    try {
      if (phoneNumber.startsWith('+221')) return 'SN'; // Senegal
      if (phoneNumber.startsWith('+1')) return 'US';
      if (phoneNumber.startsWith('+33')) return 'FR';
      if (phoneNumber.startsWith('+212')) return 'MA';
      // Add more country codes as needed
      
      return 'SN'; // Default to Senegal

    } catch (error) {
      return 'SN';
    }
  }

  /**
   * Check if contact has opted out
   */
  private async checkOptOutStatus(phoneNumber: string): Promise<boolean> {
    try {
      const contactsCrud = new CrudOperations('whatsapp_contacts', this.adminToken);
      const contacts = await contactsCrud.findMany({ 
        phone_number: phoneNumber,
        opt_out: true 
      });

      return contacts && contacts.length > 0;

    } catch (error) {
      console.error('Error checking opt-out status:', error);
      return false;
    }
  }

  /**
   * Check if a contact is already a WOLO user
   */
  private async checkIfWoloUser(phoneNumber: string): Promise<void> {
    try {
      const profilesCrud = new CrudOperations('profiles', this.adminToken);
      const profiles = await profilesCrud.findMany({ telephone: phoneNumber });

      if (profiles && profiles.length > 0) {
        const contactsCrud = new CrudOperations('whatsapp_contacts', this.adminToken);
        const contacts = await contactsCrud.findMany({ phone_number: phoneNumber });

        for (const contact of contacts || []) {
          await contactsCrud.update(contact.id, {
            is_wolo_user: true,
            wolo_user_id: profiles[0].user_id,
            updated_at: new Date().toISOString()
          });
        }

        console.log(`Contact ${phoneNumber} is a WOLO user`);
      }

    } catch (error) {
      console.error('Error checking if WOLO user:', error);
    }
  }

  /**
   * Get message delivery statistics for a campaign
   */
  async getCampaignStats(campaignId: number): Promise<{
    total_messages: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    pending: number;
  }> {
    try {
      if (!this.adminToken) {
        this.adminToken = await generateAdminUserToken();
      }

      const messagesCrud = new CrudOperations('whatsapp_messages', this.adminToken);
      const messages = await messagesCrud.findMany({ campaign_id: campaignId });

      if (!messages) {
        return { total_messages: 0, sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 };
      }

      const stats = {
        total_messages: messages.length,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        pending: 0
      };

      messages.forEach((message: any) => {
        switch (message.status) {
          case 'sent':
            stats.sent++;
            break;
          case 'delivered':
            stats.delivered++;
            break;
          case 'read':
            stats.read++;
            break;
          case 'failed':
            stats.failed++;
            break;
          case 'queued':
          case 'sending':
            stats.pending++;
            break;
        }
      });

      return stats;

    } catch (error) {
      console.error('Error getting campaign stats:', error);
      return { total_messages: 0, sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 };
    }
  }
}