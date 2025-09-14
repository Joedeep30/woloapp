# WOLO SENEGAL — Database Schema Documentation

**Document Owner:** Joe Deep (Founder)
**Written by:** AI Assistant (Data Architecture)
**Version:** 1.0 (EN) — *comprehensive schema with implementation status tracking*
**Date:** January 14, 2025

---

## 1) Schema Overview

The WoloApp database is designed with a **microservices-first approach** using PostgreSQL as the primary data store. Each service has its own logical schema while residing in a single database initially, with the ability to split into separate databases as we scale.

### **Current Implementation Status**
- **Database Engine**: PostgreSQL (planned)
- **ORM/Query Layer**: PostgREST + custom API endpoints
- **Migration System**: Not yet implemented
- **Seed Data**: Not yet implemented
- **Backup Strategy**: Not yet implemented

---

## 2) Implementation Status by Service

### ✅ **PLANNED & DOCUMENTED**
- Complete schema design across all microservices
- Relationship mappings and foreign key constraints
- Index strategies for performance optimization
- Data retention and privacy compliance structure

### 🚧 **IN PROGRESS**
- PostgreSQL database setup
- Initial schema migration scripts
- PostgREST configuration
- Basic CRUD API endpoints

### ❌ **NOT YET IMPLEMENTED**
- Physical database creation
- Migration system setup
- Data seeding scripts
- Audit logging implementation
- Backup and recovery procedures

---

## 3) Core Database Services & Tables

### **3.1 Identity Service**
**Purpose**: Authentication, sessions, and user roles

#### **Tables Status**: ❌ Not Created

```sql
-- Users table (core identity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'phone', -- 'phone', 'google', 'facebook'
    roles TEXT[] DEFAULT ARRAY['user'], -- ['user', 'admin', 'super_admin', 'partner']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure at least one contact method
    CONSTRAINT check_contact_method CHECK (
        phone IS NOT NULL OR email IS NOT NULL
    )
);

-- Sessions table (JWT token management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT false
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- Multi-provider authentication (phone/email/social)
- Role-based access control (RBAC)
- Session management with device tracking
- Secure password reset flow

### **3.2 Profiles Service**
**Purpose**: User profile data, DOB, preferences, and identity verification

#### **Tables Status**: ❌ Not Created

```sql
-- User profiles (extended user information)
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    locale VARCHAR(10) DEFAULT 'fr-SN',
    timezone VARCHAR(50) DEFAULT 'Africa/Dakar',
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- Guardian relationship (for minors <18)
    guardian_user_id UUID REFERENCES users(id),
    relationship_type VARCHAR(50), -- 'parent', 'guardian', 'sibling', etc.
    
    -- Identity verification (especially for <18 users)
    id_number VARCHAR(50),
    id_type VARCHAR(20), -- 'passport', 'national_id', 'birth_certificate'
    id_country VARCHAR(3), -- ISO country code
    id_hash VARCHAR(255), -- Hashed ID for privacy
    id_media_url VARCHAR(500), -- Encrypted storage URL for ID document
    id_verified_at TIMESTAMP WITH TIME ZONE,
    id_verified_by UUID REFERENCES users(id),
    
    -- Privacy & preferences
    is_profile_public BOOLEAN DEFAULT true,
    allow_contact_by_sponsors BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "whatsapp": true}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Age verification constraint
    CONSTRAINT check_minor_has_guardian CHECK (
        CASE WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 18 
        THEN guardian_user_id IS NOT NULL AND relationship_type IS NOT NULL
        ELSE true END
    )
);

-- Address information (optional)
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'primary', -- 'primary', 'billing', 'delivery'
    street_address TEXT,
    city VARCHAR(100),
    region VARCHAR(100), -- Senegal regions
    country VARCHAR(3) DEFAULT 'SEN',
    postal_code VARCHAR(10),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- Comprehensive user profiles with localization
- Guardian/minor relationship management
- Identity verification system for compliance
- Flexible address management
- Privacy controls and preferences

### **3.3 Referral Service**
**Purpose**: Sponsorship system, invitations, and points management

#### **Tables Status**: ❌ Not Created

```sql
-- Referral/sponsorship relationships
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    invited_phone VARCHAR(20),
    invited_email VARCHAR(255),
    invited_name VARCHAR(255),
    invitation_message TEXT,
    
    -- Referral status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'accepted', 'expired', 'declined'
    sponsored_user_id UUID REFERENCES users(id),
    
    -- Identity collection for <18 users
    both_ids_collected BOOLEAN DEFAULT false,
    sponsor_id_verified BOOLEAN DEFAULT false,
    sponsored_id_verified BOOLEAN DEFAULT false,
    
    -- Timing
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure contact method for invitation
    CONSTRAINT check_invitation_contact CHECK (
        invited_phone IS NOT NULL OR invited_email IS NOT NULL
    )
);

-- Points ledger for sponsors
CREATE TABLE points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    referral_id UUID REFERENCES referrals(id),
    
    -- Point transaction details
    event_type VARCHAR(50) NOT NULL, -- 'referral_accepted', 'pot_opened', 'first_donation'
    points_earned INTEGER NOT NULL DEFAULT 0,
    points_spent INTEGER NOT NULL DEFAULT 0,
    
    -- Point status and maturation
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'matured', 'revoked'
    matured_at TIMESTAMP WITH TIME ZONE,
    
    -- Sponsor boost multipliers
    base_multiplier DECIMAL(3,2) DEFAULT 1.00,
    sponsor_boost_multiplier DECIMAL(3,2) DEFAULT 1.00,
    
    description TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points conversion to credits
CREATE TABLE points_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    points_converted INTEGER NOT NULL,
    credits_issued INTEGER NOT NULL, -- In CFA francs
    conversion_rate DECIMAL(10,4) NOT NULL, -- Points to CFA rate
    applied_to_pot_id UUID, -- Which pot received the credit
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily invitation limits and tracking
CREATE TABLE sponsor_daily_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    limit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Daily limits
    max_invitations_per_day INTEGER NOT NULL DEFAULT 50,
    invitations_sent_today INTEGER NOT NULL DEFAULT 0,
    
    -- Batch selection tracking
    current_batch_start INTEGER DEFAULT 0, -- Starting position in contact list
    preferred_selection_method VARCHAR(20) DEFAULT 'batch', -- 'batch', 'individual'
    
    -- Reset tracking
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE,
    
    -- Engagement metrics
    consecutive_active_days INTEGER DEFAULT 0,
    total_lifetime_invitations INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per sponsor per day
    UNIQUE(sponsor_user_id, limit_date),
    
    -- Ensure we don't exceed daily limit
    CONSTRAINT check_daily_limit CHECK (invitations_sent_today <= max_invitations_per_day)
);

-- Contact selection batches for sponsors
CREATE TABLE sponsor_contact_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Batch configuration
    batch_number INTEGER NOT NULL DEFAULT 1, -- Which batch of 50 for the day
    start_position INTEGER NOT NULL, -- Starting index in contact list
    end_position INTEGER NOT NULL, -- Ending index in contact list
    
    -- Batch status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'selected', 'sent', 'skipped'
    selected_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    
    -- Contact data snapshot (for consistency)
    contact_snapshot JSONB, -- Array of contact objects for this batch
    
    -- Selection preferences
    auto_selected BOOLEAN DEFAULT false,
    manual_selections JSONB, -- Array of manually selected contact IDs
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure logical batch positions
    CONSTRAINT check_batch_positions CHECK (end_position > start_position),
    CONSTRAINT check_batch_size CHECK (end_position - start_position <= 50)
);

-- Enhanced referrals table with daily limit tracking
ALTER TABLE referrals ADD COLUMN daily_limit_id UUID REFERENCES sponsor_daily_limits(id);
ALTER TABLE referrals ADD COLUMN batch_id UUID REFERENCES sponsor_contact_batches(id);
ALTER TABLE referrals ADD COLUMN invitation_order INTEGER; -- Order within the day (1-50)
```

**Key Features**:
- Complete sponsorship invitation system
- Points earning and tracking with anti-fraud measures
- Identity verification workflow for minors
- Flexible point conversion to monetary credits
- Detailed audit trail for all point transactions

### **3.4 Pots Service**
**Purpose**: Birthday pot management, scheduling, and lifecycle

#### **Tables Status**: ❌ Not Created

```sql
-- Birthday pots (main entity)
CREATE TABLE pots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Pot configuration
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount_cfa INTEGER NOT NULL CHECK (target_amount_cfa > 0),
    birthday_date DATE NOT NULL,
    
    -- Pot scheduling and lifecycle
    scheduled_open_at TIMESTAMP WITH TIME ZONE NOT NULL, -- J-30 before birthday
    actual_opened_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status management
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'open', 'funded', 'expired', 'closed'
    visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'public', 'friends_only'
    
    -- Preferred pack selection
    preferred_pack_id UUID, -- References packs.id (defined in Packs service)
    
    -- Pot settings
    allow_anonymous_donations BOOLEAN DEFAULT true,
    show_donor_names BOOLEAN DEFAULT true,
    enable_messages BOOLEAN DEFAULT true,
    
    -- Social sharing
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Media
    cover_image_url VARCHAR(500),
    gallery_images JSONB, -- Array of image URLs
    
    -- Auto-creation from referral
    created_from_referral_id UUID REFERENCES referrals(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure open date is before birthday
    CONSTRAINT check_open_before_birthday CHECK (
        scheduled_open_at <= (birthday_date - INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE
    )
);

-- Pot invitations and sharing
CREATE TABLE pot_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pot_id UUID NOT NULL REFERENCES pots(id) ON DELETE CASCADE,
    invited_by_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Invitation details
    invitation_method VARCHAR(20) NOT NULL, -- 'whatsapp', 'sms', 'email', 'social'
    recipient_identifier VARCHAR(255) NOT NULL, -- phone, email, or social handle
    custom_message TEXT,
    
    -- Tracking
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pot statistics and analytics
CREATE TABLE pot_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pot_id UUID NOT NULL REFERENCES pots(id) ON DELETE CASCADE,
    
    -- Daily snapshots
    snapshot_date DATE NOT NULL,
    total_raised_cfa INTEGER DEFAULT 0,
    donor_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4), -- Donations / Views
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(pot_id, snapshot_date)
);
```

**Key Features**:
- Automated J-30 pot opening system
- Comprehensive pot lifecycle management
- Social sharing and invitation tracking
- Analytics and performance metrics
- Flexible visibility and privacy controls

### **3.5 Donations Service**
**Purpose**: Wave payment integration, transaction management, and ledger

#### **Tables Status**: ❌ Not Created

```sql
-- Donation transactions
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pot_id UUID NOT NULL REFERENCES pots(id),
    
    -- Donor information (can be anonymous)
    donor_user_id UUID REFERENCES users(id), -- NULL for anonymous
    donor_name VARCHAR(255), -- For anonymous donors
    donor_phone VARCHAR(20), -- Wave payment phone
    
    -- Transaction details
    amount_cfa INTEGER NOT NULL CHECK (amount_cfa > 0),
    wave_transaction_id VARCHAR(100) UNIQUE,
    wave_payment_url TEXT,
    
    -- Transaction status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'succeeded', 'failed', 'refunded'
    
    -- Payment flow
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    wave_notified_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Message and preferences
    donation_message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    show_amount BOOLEAN DEFAULT true,
    
    -- Wave webhook data
    wave_webhook_data JSONB,
    
    -- Fraud detection
    ip_address INET,
    user_agent TEXT,
    risk_score INTEGER DEFAULT 0, -- 0-100, higher = more risky
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wave webhook events (idempotency and audit)
CREATE TABLE wave_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wave_event_id VARCHAR(100) UNIQUE NOT NULL, -- From Wave
    event_type VARCHAR(50) NOT NULL,
    donation_id UUID REFERENCES donations(id),
    
    -- Webhook payload
    raw_payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    
    -- Idempotency
    idempotency_key VARCHAR(255) UNIQUE,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refund transactions
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES donations(id),
    refunded_by_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Refund details
    amount_cfa INTEGER NOT NULL,
    reason VARCHAR(20) NOT NULL, -- 'user_request', 'fraud', 'failed_pot', 'admin_action'
    reason_description TEXT,
    
    -- Wave refund tracking
    wave_refund_id VARCHAR(100),
    wave_refund_status VARCHAR(20) DEFAULT 'pending',
    
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donation analytics aggregates
CREATE TABLE donation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Aggregate metrics
    total_amount_cfa BIGINT DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    unique_donors INTEGER DEFAULT 0,
    average_donation_cfa INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4), -- Successful / Total transactions
    
    -- Geographic breakdown
    region_breakdown JSONB, -- {"Dakar": 15000, "Thiès": 8000, ...}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(period_type, period_start, period_end)
);
```

**Key Features**:
- Complete Wave Mobile Money integration
- Idempotent webhook processing
- Comprehensive fraud detection
- Flexible donor anonymity options
- Automated analytics and reporting

### **3.6 Packs Service**
**Purpose**: Reward packages, pricing, and partner management

#### **Tables Status**: ❌ Not Created

```sql
-- Reward packages/products
CREATE TABLE packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pack details
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'cinema', 'restaurant', 'spa', 'experience'
    
    -- Pricing
    base_price_cfa INTEGER NOT NULL CHECK (base_price_cfa > 0),
    discounted_price_cfa INTEGER,
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    available_from DATE,
    available_until DATE,
    max_redemptions_per_user INTEGER DEFAULT 1,
    total_available_quantity INTEGER,
    
    -- Media
    image_url VARCHAR(500),
    gallery_images JSONB,
    
    -- Partner information
    partner_id UUID, -- References partners.id
    venue_restrictions JSONB, -- Specific venues where valid
    
    -- Terms and conditions
    terms_and_conditions TEXT,
    redemption_instructions TEXT,
    validity_days INTEGER DEFAULT 90, -- Days valid after birthday
    
    -- SEO and marketing
    seo_title VARCHAR(255),
    seo_description TEXT,
    marketing_tags TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner organizations
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Partner details
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'cinema', 'restaurant', 'spa', 'retail'
    description TEXT,
    
    -- Contact information
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Business details
    business_registration VARCHAR(100),
    tax_id VARCHAR(50),
    
    -- Financial terms
    revenue_split_percentage DECIMAL(5,2) NOT NULL CHECK (revenue_split_percentage BETWEEN 0 AND 100),
    payment_terms VARCHAR(20) DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly'
    minimum_payout_cfa INTEGER DEFAULT 10000,
    
    -- Venues/locations
    venues JSONB, -- Array of venue objects with addresses
    
    -- Status and verification
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'terminated'
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_user_id UUID REFERENCES users(id),
    
    -- Settings
    auto_approve_redemptions BOOLEAN DEFAULT false,
    notification_preferences JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsor promotional campaigns
CREATE TABLE sponsor_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_company_name VARCHAR(255) NOT NULL,
    
    -- Campaign details
    campaign_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Targeting
    target_demographics JSONB, -- Age, region, interests
    pack_categories TEXT[], -- Which pack categories to boost
    
    -- Boost configuration
    points_multiplier DECIMAL(3,2) DEFAULT 1.5, -- 1.5x points boost
    budget_cfa INTEGER NOT NULL,
    spent_cfa INTEGER DEFAULT 0,
    
    -- Campaign timing
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    
    -- Performance tracking
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- Flexible reward package system
- Partner revenue sharing management  
- Sponsor campaign and boost system
- Venue and location restrictions
- Comprehensive pricing and availability controls

### **3.7 QR/Redemption Service**
**Purpose**: QR code generation, validation, and partner settlement

#### **Tables Status**: ❌ Not Created

```sql
-- QR codes for redemption
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pot_id UUID NOT NULL REFERENCES pots(id),
    pack_id UUID NOT NULL REFERENCES packs(id),
    
    -- QR code details
    code VARCHAR(100) NOT NULL UNIQUE, -- The actual QR code value
    qr_image_url VARCHAR(500), -- Generated QR image
    
    -- Redemption details
    redeemable_from TIMESTAMP WITH TIME ZONE NOT NULL, -- Birthday date
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Based on pack validity
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'issued', -- 'issued', 'redeemed', 'expired', 'cancelled'
    
    -- Redemption tracking
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_by_partner_id UUID REFERENCES partners(id),
    redeemed_at_venue JSONB, -- Venue details where redeemed
    partner_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure expiry is after redeemable date
    CONSTRAINT check_valid_redemption_period CHECK (expires_at > redeemable_from)
);

-- Partner settlements and payments
CREATE TABLE partner_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    
    -- Settlement period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Financial details
    total_redemptions_count INTEGER DEFAULT 0,
    total_revenue_cfa INTEGER DEFAULT 0,
    partner_share_cfa INTEGER DEFAULT 0,
    wolo_commission_cfa INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'disputed'
    
    -- Payment tracking
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Supporting documentation
    invoice_url VARCHAR(500),
    receipt_url VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(partner_id, period_start, period_end)
);

-- QR redemption audit trail
CREATE TABLE qr_redemption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id),
    
    -- Redemption attempt details
    partner_user_id UUID REFERENCES users(id), -- Partner admin who scanned
    attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation result
    validation_result VARCHAR(20) NOT NULL, -- 'success', 'expired', 'already_used', 'invalid'
    error_message TEXT,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    venue_context JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- Secure QR code generation and management
- Partner redemption validation system
- Automated settlement calculations
- Comprehensive audit trail for compliance
- Flexible venue and timing restrictions

### **3.8 Notifications Service**
**Purpose**: Multi-channel messaging (Email, SMS, WhatsApp)

#### **Tables Status**: ❌ Not Created

```sql
-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template identification
    template_key VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'referral_accepted'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template content
    subject VARCHAR(500), -- For email
    body_text TEXT NOT NULL,
    body_html TEXT, -- For email
    
    -- Channels supported
    channels VARCHAR(20)[] DEFAULT ARRAY['email'], -- 'email', 'sms', 'whatsapp'
    
    -- Localization
    locale VARCHAR(10) DEFAULT 'fr-SN',
    
    -- Template variables (for documentation)
    variables JSONB, -- {"user_name": "string", "amount": "number"}
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification queue and delivery
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient
    user_id UUID REFERENCES users(id),
    recipient_identifier VARCHAR(255) NOT NULL, -- email/phone for the channel
    
    -- Message details
    template_id UUID NOT NULL REFERENCES notification_templates(id),
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'whatsapp'
    
    -- Content (after template processing)
    subject VARCHAR(500),
    body TEXT NOT NULL,
    
    -- Template data used
    template_data JSONB,
    
    -- Delivery status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Provider tracking
    provider VARCHAR(50), -- 'resend', 'twilio', 'whatsapp_business'
    provider_message_id VARCHAR(255),
    provider_response JSONB,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_message TEXT,
    error_code VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences (user-level)
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Channel preferences
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    whatsapp_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    
    -- Event type preferences
    referral_notifications BOOLEAN DEFAULT true,
    pot_notifications BOOLEAN DEFAULT true,
    donation_notifications BOOLEAN DEFAULT true,
    marketing_notifications BOOLEAN DEFAULT false,
    
    -- Frequency controls
    digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'immediate', 'daily', 'weekly'
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification analytics and metrics
CREATE TABLE notification_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    date DATE NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    
    -- Metrics
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    bounce_count INTEGER DEFAULT 0,
    
    -- Engagement (for email/WhatsApp)
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    
    -- Calculated rates
    delivery_rate DECIMAL(5,4),
    open_rate DECIMAL(5,4),
    click_rate DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, template_key, channel)
);
```

**Key Features**:
- Multi-channel notification system
- Template management with localization
- User preference controls and quiet hours
- Comprehensive delivery tracking and analytics
- Retry logic with exponential backoff

### **3.9 Analytics Service**
**Purpose**: Event tracking, business intelligence, and performance metrics

#### **Tables Status**: ❌ Not Created

```sql
-- Event tracking (user actions)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_name VARCHAR(100) NOT NULL, -- 'pot_created', 'donation_made', etc.
    event_category VARCHAR(50) NOT NULL, -- 'pot', 'referral', 'donation'
    
    -- User context
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    anonymous_id VARCHAR(100), -- For non-logged-in users
    
    -- Event properties
    properties JSONB, -- Flexible event data
    
    -- Context
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    page_url VARCHAR(500),
    
    -- Device/platform info
    platform VARCHAR(20), -- 'web', 'mobile_app', 'api'
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    os VARCHAR(50),
    browser VARCHAR(50),
    
    -- Geographic info
    country VARCHAR(3), -- ISO country code
    region VARCHAR(100),
    city VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business metrics aggregates
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'daily_active_users', 'revenue', etc.
    
    -- Metric value
    metric_value DECIMAL(15,4) NOT NULL,
    metric_count INTEGER,
    
    -- Dimensions
    dimensions JSONB, -- {"region": "Dakar", "age_group": "18-25"}
    
    -- Comparison metrics
    previous_period_value DECIMAL(15,4),
    period_over_period_change DECIMAL(8,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(metric_date, metric_type, dimensions)
);

-- User funnel analysis
CREATE TABLE funnel_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Funnel configuration
    funnel_name VARCHAR(100) NOT NULL, -- 'sponsorship_conversion', 'pot_creation'
    step_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metrics
    users_entered INTEGER DEFAULT 0,
    users_completed INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,4),
    
    -- Segmentation
    segment_filters JSONB, -- {"age_group": "18-25", "region": "Dakar"}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(funnel_name, step_number, period_start, period_end, segment_filters)
);

-- A/B test configurations and results
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Test configuration
    test_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Test parameters
    variants JSONB NOT NULL, -- {"control": {...}, "variant_a": {...}}
    traffic_allocation JSONB NOT NULL, -- {"control": 0.5, "variant_a": 0.5}
    
    -- Target metrics
    primary_metric VARCHAR(100) NOT NULL,
    secondary_metrics TEXT[],
    
    -- Test timing
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
    
    -- Results
    results JSONB, -- Statistical analysis results
    winner_variant VARCHAR(50),
    confidence_level DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test participant assignments
CREATE TABLE ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES ab_tests(id),
    
    -- Participant identification
    user_id UUID REFERENCES users(id),
    anonymous_id VARCHAR(100),
    
    -- Assignment details
    variant VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    UNIQUE(test_id, user_id),
    UNIQUE(test_id, anonymous_id)
);
```

**Key Features**:
- Comprehensive event tracking system
- Business metrics aggregation and monitoring
- User funnel analysis capabilities
- A/B testing framework with statistical analysis
- Flexible segmentation and filtering

### **3.10 Admin Service**
**Purpose**: Feature flags, administrative tools, and system configuration

#### **Tables Status**: ❌ Not Created

```sql
-- Feature flags and system toggles
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Flag identification
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Flag configuration
    is_enabled BOOLEAN DEFAULT false,
    flag_type VARCHAR(20) DEFAULT 'boolean', -- 'boolean', 'string', 'number', 'json'
    flag_value JSONB,
    
    -- Rollout configuration
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    target_user_groups TEXT[], -- ['beta_users', 'premium_users']
    target_regions TEXT[], -- ['Dakar', 'Thiès']
    
    -- Environment
    environment VARCHAR(20) DEFAULT 'production', -- 'development', 'staging', 'production'
    
    -- Audit
    created_by_user_id UUID REFERENCES users(id),
    last_modified_by_user_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration key
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    
    -- Metadata
    description TEXT,
    data_type VARCHAR(20) NOT NULL, -- 'string', 'number', 'boolean', 'object', 'array'
    is_sensitive BOOLEAN DEFAULT false, -- For secrets/passwords
    
    -- Validation
    validation_rules JSONB, -- JSON schema for validation
    
    -- Environment-specific
    environment VARCHAR(20) DEFAULT 'production',
    
    -- Audit
    last_modified_by_user_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for admin actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor information
    actor_user_id UUID REFERENCES users(id),
    actor_type VARCHAR(20) NOT NULL, -- 'user', 'system', 'api'
    actor_ip INET,
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- 'user_suspended', 'pot_deleted', 'refund_processed'
    resource_type VARCHAR(50) NOT NULL, -- 'user', 'pot', 'donation'
    resource_id UUID,
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    reason TEXT,
    metadata JSONB,
    
    -- Timing
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Request context
    request_id VARCHAR(100),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health and monitoring
CREATE TABLE system_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Service identification
    service_name VARCHAR(100) NOT NULL,
    check_name VARCHAR(100) NOT NULL,
    
    -- Health status
    status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'unhealthy'
    response_time_ms INTEGER,
    
    -- Check details
    check_data JSONB, -- Service-specific health data
    error_message TEXT,
    
    -- Timing
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin user sessions and activity
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Session details
    session_token_hash VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    
    -- Admin-specific tracking
    admin_level VARCHAR(20) NOT NULL, -- 'regular', 'super', 'partner', 'sponsor'
    permissions_granted TEXT[], -- Specific permissions for this session
    
    -- Session lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    terminated_at TIMESTAMP WITH TIME ZONE,
    termination_reason VARCHAR(50), -- 'logout', 'timeout', 'revoked'
    
    -- Security
    is_suspicious BOOLEAN DEFAULT false,
    security_flags JSONB
);
```

**Key Features**:
- Comprehensive feature flag system with gradual rollouts
- Flexible system configuration management
- Complete audit trail for compliance
- System health monitoring and alerting
- Enhanced admin session tracking with security features

---

## 4) Database Indexes & Performance

### **Performance-Critical Indexes** (❌ Not Created)

```sql
-- Users and authentication
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_roles ON users USING GIN(roles);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Profiles and relationships
CREATE INDEX idx_profiles_date_of_birth ON profiles(date_of_birth);
CREATE INDEX idx_profiles_guardian_user_id ON profiles(guardian_user_id) WHERE guardian_user_id IS NOT NULL;

-- Referrals and points
CREATE INDEX idx_referrals_sponsor_user_id ON referrals(sponsor_user_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_points_ledger_sponsor_user_id ON points_ledger(sponsor_user_id);
CREATE INDEX idx_points_ledger_status ON points_ledger(status);

-- Pots and lifecycle
CREATE INDEX idx_pots_owner_user_id ON pots(owner_user_id);
CREATE INDEX idx_pots_status ON pots(status);
CREATE INDEX idx_pots_scheduled_open_at ON pots(scheduled_open_at);
CREATE INDEX idx_pots_birthday_date ON pots(birthday_date);

-- Donations and payments
CREATE INDEX idx_donations_pot_id ON donations(pot_id);
CREATE INDEX idx_donations_donor_user_id ON donations(donor_user_id) WHERE donor_user_id IS NOT NULL;
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_wave_transaction_id ON donations(wave_transaction_id) WHERE wave_transaction_id IS NOT NULL;

-- QR codes and redemption
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_pot_id ON qr_codes(pot_id);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX idx_notification_templates_template_key ON notification_templates(template_key);

-- Analytics
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);

-- Audit and admin
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id) WHERE actor_user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

## 5) Data Migration Strategy

### **Migration Phases** (❌ Not Implemented)

**Phase 1: Core Foundation**
- Users, profiles, and authentication tables
- Basic referral and points system
- Essential indexes for performance

**Phase 2: Business Logic**
- Pots, donations, and QR systems
- Partner and pack management
- Notification infrastructure

**Phase 3: Analytics & Admin**
- Analytics and reporting tables
- Admin tools and audit logging
- A/B testing framework

**Phase 4: Optimizations**
- Additional indexes based on query patterns
- Partitioning for large tables
- Archive and retention policies

---

## 6) Backup and Recovery Strategy

### **Backup Requirements** (❌ Not Implemented)

- **Daily automated backups** with 30-day retention
- **Point-in-time recovery** capability
- **Cross-region backup replication** for disaster recovery
- **Regular restore testing** to validate backup integrity

### **Data Retention Policies**

- **User data**: Retained until account deletion + 30 days
- **Financial data**: 7 years for compliance
- **Analytics events**: 2 years for business intelligence
- **Audit logs**: 5 years for security and compliance
- **Session data**: 90 days maximum

---

## 7) Security and Compliance

### **Data Protection Measures** (🚧 In Planning)

- **Encryption at rest** for sensitive fields (ID numbers, payment data)
- **Encryption in transit** for all database connections
- **Field-level hashing** for personally identifiable information
- **Row-level security** for multi-tenant data access
- **Regular security audits** and penetration testing

### **Privacy Compliance Features**

- **GDPR-style data export** functionality
- **Right to be forgotten** implementation
- **Consent tracking** for marketing communications
- **Data minimization** principles in schema design
- **Audit trail** for all data access and modifications

---

## 8) Monitoring and Observability

### **Database Monitoring** (❌ Not Implemented)

- **Query performance tracking** with slow query alerts
- **Connection pool monitoring** and optimization
- **Storage and growth trend analysis**
- **Backup success/failure monitoring**
- **Security event detection and alerting**

### **Key Metrics to Track**

- Query response times (P95, P99)
- Database connection utilization
- Storage growth rate
- Failed transaction rates
- Concurrent user sessions
- Data integrity violations

---

## 9) Development and Testing

### **Database Development Workflow** (❌ Not Implemented)

- **Schema versioning** with migration scripts
- **Automated testing** of database functions and constraints
- **Performance testing** with realistic data volumes
- **Data seeding** for development and testing environments
- **Schema documentation** auto-generation from code

### **Test Data Strategy**

- **Anonymized production data** for staging environments
- **Synthetic data generation** for load testing
- **Compliance-safe test datasets** for development
- **Automated data refresh** for testing environments

---

## 10) Future Scalability Considerations

### **Scaling Strategies** (Future Implementation)

- **Database sharding** by user ID or geographic region
- **Read replicas** for analytics and reporting workloads
- **Table partitioning** for large time-series data
- **Microservice database separation** as services mature
- **Caching layer** implementation for frequently accessed data

### **Performance Optimization Pipeline**

- **Query optimization** based on production usage patterns
- **Index tuning** and maintenance automation
- **Connection pooling** optimization
- **Database parameter tuning** for specific workloads
- **Hardware scaling** recommendations based on growth

---

**This Database Schema documentation will be updated as implementation progresses and new requirements are identified.**

— **End Database Schema v1.0 (EN)** —