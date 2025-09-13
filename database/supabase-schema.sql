-- =====================================================
-- WOLO DATABASE SCHEMA FOR SUPABASE
-- Complete database structure for birthday pot app
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'locked')),
  provider VARCHAR(20) DEFAULT 'email' CHECK (provider IN ('email', 'google', 'facebook')),
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  locked_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  telephone VARCHAR(20),
  avatar_url TEXT,
  bio TEXT,
  points_balance INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'security_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. POTS TABLE (Birthday Pots)
-- =====================================================
CREATE TABLE pots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(12, 2) DEFAULT 0 CHECK (current_amount >= 0),
  birthday_date TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'expired', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. DONATIONS TABLE
-- =====================================================
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pot_id UUID REFERENCES pots(id) ON DELETE CASCADE,
  donor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  payment_method VARCHAR(50) DEFAULT 'wave_mobile',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  wave_transaction_id TEXT,
  wave_payment_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. SPONSORSHIPS TABLE (Adult sponsors for minors)
-- =====================================================
CREATE TABLE sponsorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  minor_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(50) NOT NULL, -- 'parent', 'guardian', 'family', 'friend'
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  permissions JSONB DEFAULT '{"can_create_pots": true, "can_receive_donations": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(sponsor_user_id, minor_user_id)
);

-- =====================================================
-- 6. POINT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'earned', 'spent', 'bonus', 'referral'
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  related_entity_type VARCHAR(50), -- 'donation', 'pot', 'referral'
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. IDENTITY VERIFICATIONS TABLE
-- =====================================================
CREATE TABLE identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  minor_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sponsor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_type VARCHAR(50) NOT NULL, -- 'family_name', 'sms_guardian', 'social_vouching'
  verification_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'donation_received', 'pot_completed', 'birthday_reminder'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional notification data
  channels TEXT[] DEFAULT ARRAY['push'], -- 'push', 'email', 'sms', 'whatsapp'
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT true,
  donation_notifications BOOLEAN DEFAULT true,
  birthday_reminders BOOLEAN DEFAULT true,
  marketing_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- 10. ANALYTICS EVENTS TABLE (Privacy-first)
-- =====================================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. SECURITY AUDIT LOG TABLE
-- =====================================================
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100),
  operation VARCHAR(10), -- 'INSERT', 'UPDATE', 'DELETE', 'SELECT'
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  service VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  details JSONB
);

-- =====================================================
-- 12. SECURITY INCIDENTS TABLE
-- =====================================================
CREATE TABLE security_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Profile indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_public ON profiles(is_public);

-- Pot indexes
CREATE INDEX idx_pots_user_id ON pots(user_id);
CREATE INDEX idx_pots_status ON pots(status);
CREATE INDEX idx_pots_public ON pots(is_public);
CREATE INDEX idx_pots_birthday_date ON pots(birthday_date);
CREATE INDEX idx_pots_created_at ON pots(created_at);

-- Donation indexes
CREATE INDEX idx_donations_pot_id ON donations(pot_id);
CREATE INDEX idx_donations_donor_user_id ON donations(donor_user_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at);

-- Sponsorship indexes
CREATE INDEX idx_sponsorships_sponsor ON sponsorships(sponsor_user_id);
CREATE INDEX idx_sponsorships_minor ON sponsorships(minor_user_id);
CREATE INDEX idx_sponsorships_status ON sponsorships(status);

-- Point transaction indexes
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Analytics indexes
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Security indexes
CREATE INDEX idx_security_audit_log_table_name ON security_audit_log(table_name);
CREATE INDEX idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_timestamp ON security_audit_log(timestamp);

CREATE INDEX idx_security_incidents_event_type ON security_incidents(event_type);
CREATE INDEX idx_security_incidents_user_id ON security_incidents(user_id);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pots_updated_at BEFORE UPDATE ON pots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsorships_updated_at BEFORE UPDATE ON sponsorships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_identity_verifications_updated_at BEFORE UPDATE ON identity_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to process successful donations
CREATE OR REPLACE FUNCTION process_successful_donation(
    p_donation_id UUID,
    p_pot_id UUID,
    p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
    -- Update donation status to completed
    UPDATE donations 
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_donation_id;
    
    -- Update pot current amount
    UPDATE pots 
    SET current_amount = current_amount + p_amount, updated_at = NOW()
    WHERE id = p_pot_id;
    
    -- Award points to donor (10 points per 1000 CFA donated)
    INSERT INTO point_transactions (user_id, type, amount, description, related_entity_type, related_entity_id)
    SELECT 
        donor_user_id,
        'earned',
        GREATEST(1, FLOOR(p_amount / 1000) * 10)::INTEGER,
        'Points earned from donation',
        'donation',
        p_donation_id
    FROM donations 
    WHERE id = p_donation_id;
    
    -- Update donor's points balance
    UPDATE profiles 
    SET points_balance = points_balance + GREATEST(1, FLOOR(p_amount / 1000) * 10)::INTEGER
    WHERE user_id = (SELECT donor_user_id FROM donations WHERE id = p_donation_id);
END;
$$ LANGUAGE plpgsql;