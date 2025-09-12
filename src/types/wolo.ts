
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  phone?: string;
  birthday?: string;
  facebook_id?: string;
  is_facebook_user: boolean;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
}

export interface Pot {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_amount?: number;
  current_amount: number;
  birthday_date: string;
  status: 'active' | 'closed' | 'expired' | 'cancelled';
  is_public: boolean;
  allow_anonymous_donations: boolean;
  show_donor_names: boolean;
  countdown_end?: string;
  create_time: string;
  modify_time: string;
}

export interface Formula {
  id: number;
  name: string;
  description?: string;
  min_tickets: number;
  max_tickets: number;
  includes_popcorn: boolean;
  includes_drinks: boolean;
  includes_snacks: boolean;
  price_per_ticket?: number;
  total_price?: number;
  is_active: boolean;
  display_order: number;
}

export interface Donation {
  id: string;
  pot_id: string;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  amount: number;
  wave_transaction_id?: string;
  wave_payment_status?: string;
  is_anonymous: boolean;
  show_name_consent: boolean;
  show_amount_consent: boolean;
  message?: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_at?: string;
  create_time: string;
}

export interface Invitee {
  id: string;
  pot_id: string;
  name: string;
  whatsapp_number?: string;
  email?: string;
  invitation_sent: boolean;
  invitation_sent_at?: string;
  qr_code_generated: boolean;
  status: 'invited' | 'confirmed' | 'attended' | 'no_show';
  create_time: string;
}

export interface QRCode {
  id: string;
  pot_id: string;
  invitee_id?: string;
  code: string;
  qr_type: 'invitee' | 'master' | 'admin';
  payload?: any;
  status: 'issued' | 'scanned' | 'redeemed' | 'expired';
  issued_at: string;
  scanned_at?: string;
  redeemed_at?: string;
  scanned_by?: string;
  cinema_location?: string;
}

export interface SocialShare {
  id: string;
  pot_id: string;
  platform: 'facebook' | 'whatsapp' | 'tiktok' | 'snapchat';
  shared_by_user_id?: string;
  share_url?: string;
  is_automatic: boolean;
  share_count: number;
  last_shared_at: string;
}

export interface CinemaPartner {
  id: string;
  name: string;
  location?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  revenue_share_percentage: number;
  api_endpoint?: string;
  api_key?: string;
  is_active: boolean;
  operating_hours?: any;
}

export interface Notification {
  id: string;
  user_id?: string;
  pot_id?: string;
  type: 'donation_received' | 'pot_created' | 'invitation_sent' | 'qr_generated';
  title?: string;
  message?: string;
  channel: 'email' | 'whatsapp' | 'sms';
  recipient: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sent_at?: string;
  error_message?: string;
}
