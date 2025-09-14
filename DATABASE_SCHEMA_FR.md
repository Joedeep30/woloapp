# WOLO SÉNÉGAL — Documentation du Schéma de Base de Données

**Propriétaire du Document :** Joe Deep (Fondateur)  
**Rédigé par :** Assistant IA (Architecture de Données)  
**Version :** 1.0 (FR) — *schéma complet avec suivi du statut d'implémentation*  
**Date :** 14 janvier 2025

---

## 1) Aperçu du Schéma

La base de données WoloApp est conçue avec une **approche microservices-first** utilisant PostgreSQL comme magasin de données principal. Chaque service a son propre schéma logique tout en résidant dans une seule base de données initialement, avec la possibilité de séparer en bases de données distinctes lors du passage à l'échelle.

> Légende statut: ✅ Terminé | 🚧 En cours | ❌ Non implémenté | 🟡 À valider

### **Statut d'Implémentation Actuel**
- **Moteur de Base de Données** : PostgreSQL (planifié)
- **Couche ORM/Requête** : PostgREST + endpoints API personnalisés
- **Système de Migration** : Pas encore implémenté
- **Données de Test** : Pas encore implémenté
- **Stratégie de Sauvegarde** : Pas encore implémenté

---

## 2) Statut d'Implémentation par Service

### ✅ **PLANIFIÉ & DOCUMENTÉ**
- Conception complète du schéma à travers tous les microservices
- Mappage des relations et contraintes de clés étrangères
- Stratégies d'indexation pour optimisation des performances
- Structure de rétention des données et conformité à la vie privée

### 🚧 **EN COURS**
- Configuration de la base de données PostgreSQL
- Scripts de migration de schéma initiaux
- Configuration PostgREST
- Endpoints API CRUD de base

### ❌ **PAS ENCORE IMPLÉMENTÉ**
- Création physique de la base de données
- Configuration du système de migration
- Scripts d'initialisation de données
- Implémentation de l'audit logging
- Procédures de sauvegarde et récupération

---

## 3) Services et Tables de Base de Données Principaux

### **3.1 Service d'Identité**
**Objectif** : Authentification, sessions et rôles utilisateur

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Table des utilisateurs (identité principale)
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
    
    -- Assurer au moins une méthode de contact
    CONSTRAINT check_contact_method CHECK (
        phone IS NOT NULL OR email IS NOT NULL
    )
);

-- Table des sessions (gestion des tokens JWT)
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

-- Tokens de réinitialisation de mot de passe
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fonctionnalités Clés** :
- Authentification multi-fournisseur (téléphone/email/réseaux sociaux)
- Contrôle d'accès basé sur les rôles (RBAC)
- Gestion des sessions avec suivi des appareils
- Flux sécurisé de réinitialisation de mot de passe

### **3.2 Service de Profils**
**Objectif** : Données de profil utilisateur, date de naissance, préférences et vérification d'identité

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Profils utilisateur (informations utilisateur étendues)
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    locale VARCHAR(10) DEFAULT 'fr-SN',
    timezone VARCHAR(50) DEFAULT 'Africa/Dakar',
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- Relation de tuteur (pour mineurs <18 ans)
    guardian_user_id UUID REFERENCES users(id),
    relationship_type VARCHAR(50), -- 'parent', 'guardian', 'sibling', etc.
    
    -- Vérification d'identité (spécialement pour utilisateurs <18 ans)
    id_number VARCHAR(50),
    id_type VARCHAR(20), -- 'passport', 'national_id', 'birth_certificate'
    id_country VARCHAR(3), -- Code pays ISO
    id_hash VARCHAR(255), -- ID haché pour la vie privée
    id_media_url VARCHAR(500), -- URL de stockage chiffré pour document d'identité
    id_verified_at TIMESTAMP WITH TIME ZONE,
    id_verified_by UUID REFERENCES users(id),
    
    -- Vie privée et préférences
    is_profile_public BOOLEAN DEFAULT true,
    allow_contact_by_sponsors BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "whatsapp": true}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte de vérification d'âge
    CONSTRAINT check_minor_has_guardian CHECK (
        CASE WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 18 
        THEN guardian_user_id IS NOT NULL AND relationship_type IS NOT NULL
        ELSE true END
    )
);

-- Informations d'adresse (optionnel)
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'primary', -- 'primary', 'billing', 'delivery'
    street_address TEXT,
    city VARCHAR(100),
    region VARCHAR(100), -- Régions du Sénégal
    country VARCHAR(3) DEFAULT 'SEN',
    postal_code VARCHAR(10),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fonctionnalités Clés** :
- Profils utilisateur complets avec localisation
- Gestion des relations tuteur/mineur
- Système de vérification d'identité pour conformité
- Gestion flexible des adresses
- Contrôles de confidentialité et préférences

### **3.3 Service de Parrainage**
**Objectif** : Système de parrainage, invitations et gestion des points

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Relations de parrainage/sponsorship
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    invited_phone VARCHAR(20),
    invited_email VARCHAR(255),
    invited_name VARCHAR(255),
    invitation_message TEXT,
    
    -- Suivi du statut de parrainage
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'accepted', 'expired', 'declined'
    sponsored_user_id UUID REFERENCES users(id),
    
    -- Collecte d'identité pour utilisateurs <18 ans
    both_ids_collected BOOLEAN DEFAULT false,
    sponsor_id_verified BOOLEAN DEFAULT false,
    sponsored_id_verified BOOLEAN DEFAULT false,
    
    -- Timing
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Assurer méthode de contact pour invitation
    CONSTRAINT check_invitation_contact CHECK (
        invited_phone IS NOT NULL OR invited_email IS NOT NULL
    )
);

-- Registre de points pour sponsors
CREATE TABLE points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    referral_id UUID REFERENCES referrals(id),
    
    -- Détails de transaction de points
    event_type VARCHAR(50) NOT NULL, -- 'referral_accepted', 'pot_opened', 'first_donation'
    points_earned INTEGER NOT NULL DEFAULT 0,
    points_spent INTEGER NOT NULL DEFAULT 0,
    
    -- Statut et maturation des points
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'matured', 'revoked'
    matured_at TIMESTAMP WITH TIME ZONE,
    
    -- Multiplicateurs de boost sponsor
    base_multiplier DECIMAL(3,2) DEFAULT 1.00,
    sponsor_boost_multiplier DECIMAL(3,2) DEFAULT 1.00,
    
    description TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion de points en crédits
CREATE TABLE points_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    points_converted INTEGER NOT NULL,
    credits_issued INTEGER NOT NULL, -- En francs CFA
    conversion_rate DECIMAL(10,4) NOT NULL, -- Taux points vers CFA
    applied_to_pot_id UUID, -- Quelle cagnotte a reçu le crédit
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Limites quotidiennes invitations et suivi
CREATE TABLE sponsor_daily_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    limit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Limites quotidiennes
    max_invitations_per_day INTEGER NOT NULL DEFAULT 50,
    invitations_sent_today INTEGER NOT NULL DEFAULT 0,
    
    -- Suivi sélection batch
    current_batch_start INTEGER DEFAULT 0, -- Position début dans liste contacts
    preferred_selection_method VARCHAR(20) DEFAULT 'batch', -- 'batch', 'individual'
    
    -- Suivi réinitialisation
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE,
    
    -- Métriques engagement
    consecutive_active_days INTEGER DEFAULT 0,
    total_lifetime_invitations INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Assurer un enregistrement par parrain par jour
    UNIQUE(sponsor_user_id, limit_date),
    
    -- Assurer ne pas dépasser limite quotidienne
    CONSTRAINT check_daily_limit CHECK (invitations_sent_today <= max_invitations_per_day)
);

-- Batches sélection contacts pour parrains
CREATE TABLE sponsor_contact_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Configuration batch
    batch_number INTEGER NOT NULL DEFAULT 1, -- Quel batch de 50 pour la journée
    start_position INTEGER NOT NULL, -- Index début dans liste contacts
    end_position INTEGER NOT NULL, -- Index fin dans liste contacts
    
    -- Statut batch
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'selected', 'sent', 'skipped'
    selected_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    
    -- Snapshot données contacts (pour cohérence)
    contact_snapshot JSONB, -- Array objets contact pour ce batch
    
    -- Préférences sélection
    auto_selected BOOLEAN DEFAULT false,
    manual_selections JSONB, -- Array IDs contacts sélectionnés manuellement
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Assurer positions batch logiques
    CONSTRAINT check_batch_positions CHECK (end_position > start_position),
    CONSTRAINT check_batch_size CHECK (end_position - start_position <= 50)
);

-- Table referrals améliorée avec suivi limites quotidiennes
ALTER TABLE referrals ADD COLUMN daily_limit_id UUID REFERENCES sponsor_daily_limits(id);
ALTER TABLE referrals ADD COLUMN batch_id UUID REFERENCES sponsor_contact_batches(id);
ALTER TABLE referrals ADD COLUMN invitation_order INTEGER; -- Ordre dans la journée (1-50)
```

**Fonctionnalités Clés** :
- Système d'invitation de parrainage complet
- Gain et suivi de points avec mesures anti-fraude
- Workflow de vérification d'identité pour mineurs
- Conversion flexible des points en crédits monétaires
- Piste d'audit détaillée pour toutes les transactions de points

### **3.4 Service de Cagnottes**
**Objectif** : Gestion des cagnottes d'anniversaire, planification et cycle de vie

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Cagnottes d'anniversaire (entité principale)
CREATE TABLE pots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Configuration de cagnotte
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount_cfa INTEGER NOT NULL CHECK (target_amount_cfa > 0),
    birthday_date DATE NOT NULL,
    
    -- Planification et cycle de vie de cagnotte
    scheduled_open_at TIMESTAMP WITH TIME ZONE NOT NULL, -- J-30 avant anniversaire
    actual_opened_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Gestion du statut
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'open', 'funded', 'expired', 'closed'
    visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'public', 'friends_only'
    
    -- Sélection de pack préféré
    preferred_pack_id UUID, -- Référence packs.id (défini dans service Packs)
    
    -- Paramètres de cagnotte
    allow_anonymous_donations BOOLEAN DEFAULT true,
    show_donor_names BOOLEAN DEFAULT true,
    enable_messages BOOLEAN DEFAULT true,
    
    -- Partage social
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Média
    cover_image_url VARCHAR(500),
    gallery_images JSONB, -- Array d'URLs d'images
    
    -- Auto-création depuis parrainage
    created_from_referral_id UUID REFERENCES referrals(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Assurer date d'ouverture avant anniversaire
    CONSTRAINT check_open_before_birthday CHECK (
        scheduled_open_at <= (birthday_date - INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE
    )
);

-- Invitations et partage de cagnottes
CREATE TABLE pot_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pot_id UUID NOT NULL REFERENCES pots(id) ON DELETE CASCADE,
    invited_by_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Détails d'invitation
    invitation_method VARCHAR(20) NOT NULL, -- 'whatsapp', 'sms', 'email', 'social'
    recipient_identifier VARCHAR(255) NOT NULL, -- téléphone, email, ou handle social
    custom_message TEXT,
    
    -- Suivi
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Statistiques et analyses de cagnottes
CREATE TABLE pot_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pot_id UUID NOT NULL REFERENCES pots(id) ON DELETE CASCADE,
    
    -- Instantanés quotidiens
    snapshot_date DATE NOT NULL,
    total_raised_cfa INTEGER DEFAULT 0,
    donor_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4), -- Donations / Vues
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(pot_id, snapshot_date)
);
```

**Fonctionnalités Clés** :
- Système automatisé d'ouverture de cagnotte J-30
- Gestion complète du cycle de vie des cagnottes
- Suivi des partages sociaux et invitations
- Métriques d'analyse et de performance
- Contrôles flexibles de visibilité et confidentialité

### **3.5 Service de Donations**
**Objectif** : Intégration paiement Wave, gestion des transactions et registre

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Transactions de donation
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pot_id UUID NOT NULL REFERENCES pots(id),
    
    -- Informations du donateur (peut être anonyme)
    donor_user_id UUID REFERENCES users(id), -- NULL pour anonyme
    donor_name VARCHAR(255), -- Pour donateurs anonymes
    donor_phone VARCHAR(20), -- Téléphone de paiement Wave
    
    -- Détails de transaction
    amount_cfa INTEGER NOT NULL CHECK (amount_cfa > 0),
    wave_transaction_id VARCHAR(100) UNIQUE,
    wave_payment_url TEXT,
    
    -- Statut de transaction
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'succeeded', 'failed', 'refunded'
    
    -- Flux de paiement
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    wave_notified_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Message et préférences
    donation_message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    show_amount BOOLEAN DEFAULT true,
    
    -- Données webhook Wave
    wave_webhook_data JSONB,
    
    -- Détection de fraude
    ip_address INET,
    user_agent TEXT,
    risk_score INTEGER DEFAULT 0, -- 0-100, plus haut = plus risqué
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Événements webhook Wave (idempotence et audit)
CREATE TABLE wave_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wave_event_id VARCHAR(100) UNIQUE NOT NULL, -- De Wave
    event_type VARCHAR(50) NOT NULL,
    donation_id UUID REFERENCES donations(id),
    
    -- Charge utile webhook
    raw_payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    
    -- Idempotence
    idempotency_key VARCHAR(255) UNIQUE,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions de remboursement
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES donations(id),
    refunded_by_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Détails de remboursement
    amount_cfa INTEGER NOT NULL,
    reason VARCHAR(20) NOT NULL, -- 'user_request', 'fraud', 'failed_pot', 'admin_action'
    reason_description TEXT,
    
    -- Suivi remboursement Wave
    wave_refund_id VARCHAR(100),
    wave_refund_status VARCHAR(20) DEFAULT 'pending',
    
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agrégats d'analyses de donation
CREATE TABLE donation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Période de temps
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Métriques agrégées
    total_amount_cfa BIGINT DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    unique_donors INTEGER DEFAULT 0,
    average_donation_cfa INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4), -- Transactions réussies / Total transactions
    
    -- Répartition géographique
    region_breakdown JSONB, -- {"Dakar": 15000, "Thiès": 8000, ...}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(period_type, period_start, period_end)
);
```

**Fonctionnalités Clés** :
- Intégration complète Wave Mobile Money
- Traitement idempotent des webhooks
- Détection de fraude complète
- Options flexibles d'anonymat du donateur
- Analyses et rapports automatisés

### **3.6 Service de Packs**
**Objectif** : Packages de récompenses, tarification et gestion des partenaires

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Packages/produits de récompense
CREATE TABLE packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Détails du pack
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'cinema', 'restaurant', 'spa', 'experience'
    
    -- Tarification
    base_price_cfa INTEGER NOT NULL CHECK (base_price_cfa > 0),
    discounted_price_cfa INTEGER,
    
    -- Disponibilité
    is_active BOOLEAN DEFAULT true,
    available_from DATE,
    available_until DATE,
    max_redemptions_per_user INTEGER DEFAULT 1,
    total_available_quantity INTEGER,
    
    -- Média
    image_url VARCHAR(500),
    gallery_images JSONB,
    
    -- Information partenaire
    partner_id UUID, -- Référence partners.id
    venue_restrictions JSONB, -- Lieux spécifiques où valide
    
    -- Conditions générales
    terms_and_conditions TEXT,
    redemption_instructions TEXT,
    validity_days INTEGER DEFAULT 90, -- Jours valides après anniversaire
    
    -- SEO et marketing
    seo_title VARCHAR(255),
    seo_description TEXT,
    marketing_tags TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organisations partenaires
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Détails partenaire
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'cinema', 'restaurant', 'spa', 'retail'
    description TEXT,
    
    -- Informations de contact
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Détails commerciaux
    business_registration VARCHAR(100),
    tax_id VARCHAR(50),
    
    -- Conditions financières
    revenue_split_percentage DECIMAL(5,2) NOT NULL CHECK (revenue_split_percentage BETWEEN 0 AND 100),
    payment_terms VARCHAR(20) DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly'
    minimum_payout_cfa INTEGER DEFAULT 10000,
    
    -- Lieux/emplacements
    venues JSONB, -- Array d'objets lieu avec adresses
    
    -- Statut et vérification
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'terminated'
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_user_id UUID REFERENCES users(id),
    
    -- Paramètres
    auto_approve_redemptions BOOLEAN DEFAULT false,
    notification_preferences JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campagnes promotionnelles de sponsors
CREATE TABLE sponsor_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_company_name VARCHAR(255) NOT NULL,
    
    -- Détails de campagne
    campaign_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Ciblage
    target_demographics JSONB, -- Âge, région, intérêts
    pack_categories TEXT[], -- Quelles catégories de pack booster
    
    -- Configuration de boost
    points_multiplier DECIMAL(3,2) DEFAULT 1.5, -- Boost 1.5x points
    budget_cfa INTEGER NOT NULL,
    spent_cfa INTEGER DEFAULT 0,
    
    -- Timing de campagne
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    
    -- Suivi de performance
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fonctionnalités Clés** :
- Système de package de récompense flexible
- Gestion du partage de revenus partenaires
- Système de campagne et boost sponsor
- Restrictions de lieu et emplacement
- Contrôles complets de tarification et disponibilité

### **3.7 Service QR/Rachat**
**Objectif** : Génération de codes QR, validation et règlement partenaire

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Codes QR pour rachat
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pot_id UUID NOT NULL REFERENCES pots(id),
    pack_id UUID NOT NULL REFERENCES packs(id),
    
    -- Détails du code QR
    code VARCHAR(100) NOT NULL UNIQUE, -- La valeur réelle du code QR
    qr_image_url VARCHAR(500), -- Image QR générée
    
    -- Détails de rachat
    redeemable_from TIMESTAMP WITH TIME ZONE NOT NULL, -- Date anniversaire
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Basé sur validité pack
    
    -- Suivi de statut
    status VARCHAR(20) DEFAULT 'issued', -- 'issued', 'redeemed', 'expired', 'cancelled'
    
    -- Suivi de rachat
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_by_partner_id UUID REFERENCES partners(id),
    redeemed_at_venue JSONB, -- Détails du lieu où racheté
    partner_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Assurer expiration après date rachetable
    CONSTRAINT check_valid_redemption_period CHECK (expires_at > redeemable_from)
);

-- Règlements et paiements partenaires
CREATE TABLE partner_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    
    -- Période de règlement
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Détails financiers
    total_redemptions_count INTEGER DEFAULT 0,
    total_revenue_cfa INTEGER DEFAULT 0,
    partner_share_cfa INTEGER DEFAULT 0,
    wolo_commission_cfa INTEGER DEFAULT 0,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'disputed'
    
    -- Suivi de paiement
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Documentation de support
    invoice_url VARCHAR(500),
    receipt_url VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(partner_id, period_start, period_end)
);

-- Piste d'audit de rachat QR
CREATE TABLE qr_redemption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id),
    
    -- Détails de tentative de rachat
    partner_user_id UUID REFERENCES users(id), -- Admin partenaire qui a scanné
    attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Résultat de validation
    validation_result VARCHAR(20) NOT NULL, -- 'success', 'expired', 'already_used', 'invalid'
    error_message TEXT,
    
    -- Contexte
    ip_address INET,
    user_agent TEXT,
    venue_context JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fonctionnalités Clés** :
- Génération et gestion sécurisées de codes QR
- Système de validation de rachat partenaire
- Calculs de règlement automatisés
- Piste d'audit complète pour conformité
- Restrictions flexibles de lieu et timing

### **3.8 Service de Notifications**
**Objectif** : Messagerie multi-canal (Email, SMS, WhatsApp)

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Modèles de notification
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification du modèle
    template_key VARCHAR(100) NOT NULL UNIQUE, -- ex : 'referral_accepted'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Contenu du modèle
    subject VARCHAR(500), -- Pour email
    body_text TEXT NOT NULL,
    body_html TEXT, -- Pour email
    
    -- Canaux supportés
    channels VARCHAR(20)[] DEFAULT ARRAY['email'], -- 'email', 'sms', 'whatsapp'
    
    -- Localisation
    locale VARCHAR(10) DEFAULT 'fr-SN',
    
    -- Variables du modèle (pour documentation)
    variables JSONB, -- {"user_name": "string", "amount": "number"}
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File et livraison de notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Destinataire
    user_id UUID REFERENCES users(id),
    recipient_identifier VARCHAR(255) NOT NULL, -- email/téléphone pour le canal
    
    -- Détails du message
    template_id UUID NOT NULL REFERENCES notification_templates(id),
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'whatsapp'
    
    -- Contenu (après traitement du modèle)
    subject VARCHAR(500),
    body TEXT NOT NULL,
    
    -- Données du modèle utilisé
    template_data JSONB,
    
    -- Statut de livraison
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
    
    -- Planification
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Suivi fournisseur
    provider VARCHAR(50), -- 'resend', 'twilio', 'whatsapp_business'
    provider_message_id VARCHAR(255),
    provider_response JSONB,
    
    -- Logique de retry
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Gestion d'erreurs
    error_message TEXT,
    error_code VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Préférences de notification (niveau utilisateur)
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Préférences de canal
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    whatsapp_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    
    -- Préférences de type d'événement
    referral_notifications BOOLEAN DEFAULT true,
    pot_notifications BOOLEAN DEFAULT true,
    donation_notifications BOOLEAN DEFAULT true,
    marketing_notifications BOOLEAN DEFAULT false,
    
    -- Contrôles de fréquence
    digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'immediate', 'daily', 'weekly'
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyses et métriques de notifications
CREATE TABLE notification_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Période de temps
    date DATE NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    
    -- Métriques
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    bounce_count INTEGER DEFAULT 0,
    
    -- Engagement (pour email/WhatsApp)
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    
    -- Taux calculés
    delivery_rate DECIMAL(5,4),
    open_rate DECIMAL(5,4),
    click_rate DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, template_key, channel)
);
```

**Fonctionnalités Clés** :
- Système de notification multi-canal
- Gestion de modèles avec localisation
- Contrôles de préférences utilisateur et heures calmes
- Suivi de livraison et analyses complètes
- Logique de retry avec backoff exponentiel

### **3.9 Service d'Analyses**
**Objectif** : Suivi d'événements, intelligence d'affaires et métriques de performance

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Suivi d'événements (actions utilisateur)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification d'événement
    event_name VARCHAR(100) NOT NULL, -- 'pot_created', 'donation_made', etc.
    event_category VARCHAR(50) NOT NULL, -- 'pot', 'referral', 'donation'
    
    -- Contexte utilisateur
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    anonymous_id VARCHAR(100), -- Pour utilisateurs non connectés
    
    -- Propriétés d'événement
    properties JSONB, -- Données d'événement flexibles
    
    -- Contexte
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    page_url VARCHAR(500),
    
    -- Info appareil/plateforme
    platform VARCHAR(20), -- 'web', 'mobile_app', 'api'
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    os VARCHAR(50),
    browser VARCHAR(50),
    
    -- Info géographique
    country VARCHAR(3), -- Code pays ISO
    region VARCHAR(100),
    city VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agrégats de métriques d'affaires
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Période de temps
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'daily_active_users', 'revenue', etc.
    
    -- Valeur métrique
    metric_value DECIMAL(15,4) NOT NULL,
    metric_count INTEGER,
    
    -- Dimensions
    dimensions JSONB, -- {"region": "Dakar", "age_group": "18-25"}
    
    -- Métriques de comparaison
    previous_period_value DECIMAL(15,4),
    period_over_period_change DECIMAL(8,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(metric_date, metric_type, dimensions)
);

-- Analyse d'entonnoir utilisateur
CREATE TABLE funnel_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration d'entonnoir
    funnel_name VARCHAR(100) NOT NULL, -- 'sponsorship_conversion', 'pot_creation'
    step_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    
    -- Période de temps
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Métriques
    users_entered INTEGER DEFAULT 0,
    users_completed INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,4),
    
    -- Segmentation
    segment_filters JSONB, -- {"age_group": "18-25", "region": "Dakar"}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(funnel_name, step_number, period_start, period_end, segment_filters)
);

-- Configurations et résultats de tests A/B
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration de test
    test_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Paramètres de test
    variants JSONB NOT NULL, -- {"control": {...}, "variant_a": {...}}
    traffic_allocation JSONB NOT NULL, -- {"control": 0.5, "variant_a": 0.5}
    
    -- Métriques cibles
    primary_metric VARCHAR(100) NOT NULL,
    secondary_metrics TEXT[],
    
    -- Timing de test
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
    
    -- Résultats
    results JSONB, -- Résultats d'analyse statistique
    winner_variant VARCHAR(50),
    confidence_level DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignations de participants tests A/B
CREATE TABLE ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES ab_tests(id),
    
    -- Identification du participant
    user_id UUID REFERENCES users(id),
    anonymous_id VARCHAR(100),
    
    -- Détails d'assignation
    variant VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contexte
    ip_address INET,
    user_agent TEXT,
    
    UNIQUE(test_id, user_id),
    UNIQUE(test_id, anonymous_id)
);
```

**Fonctionnalités Clés** :
- Système de suivi d'événements complet
- Agrégation et surveillance de métriques d'affaires
- Capacités d'analyse d'entonnoir utilisateur
- Framework de tests A/B avec analyse statistique
- Segmentation et filtrage flexibles

### **3.10 Service d'Administration**
**Objectif** : Feature flags, outils administratifs et configuration système

#### **Statut des Tables** : ❌ Non Créées

```sql
-- Feature flags et bascules système
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification du flag
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration du flag
    is_enabled BOOLEAN DEFAULT false,
    flag_type VARCHAR(20) DEFAULT 'boolean', -- 'boolean', 'string', 'number', 'json'
    flag_value JSONB,
    
    -- Configuration de déploiement
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    target_user_groups TEXT[], -- ['beta_users', 'premium_users']
    target_regions TEXT[], -- ['Dakar', 'Thiès']
    
    -- Environnement
    environment VARCHAR(20) DEFAULT 'production', -- 'development', 'staging', 'production'
    
    -- Audit
    created_by_user_id UUID REFERENCES users(id),
    last_modified_by_user_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuration système
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Clé de configuration
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    
    -- Métadonnées
    description TEXT,
    data_type VARCHAR(20) NOT NULL, -- 'string', 'number', 'boolean', 'object', 'array'
    is_sensitive BOOLEAN DEFAULT false, -- Pour secrets/mots de passe
    
    -- Validation
    validation_rules JSONB, -- Schéma JSON pour validation
    
    -- Spécifique à l'environnement
    environment VARCHAR(20) DEFAULT 'production',
    
    -- Audit
    last_modified_by_user_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal d'audit pour actions admin
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Information acteur
    actor_user_id UUID REFERENCES users(id),
    actor_type VARCHAR(20) NOT NULL, -- 'user', 'system', 'api'
    actor_ip INET,
    
    -- Détails d'action
    action VARCHAR(100) NOT NULL, -- 'user_suspended', 'pot_deleted', 'refund_processed'
    resource_type VARCHAR(50) NOT NULL, -- 'user', 'pot', 'donation'
    resource_id UUID,
    
    -- Détails de changement
    old_values JSONB,
    new_values JSONB,
    
    -- Contexte
    reason TEXT,
    metadata JSONB,
    
    -- Timing
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contexte de requête
    request_id VARCHAR(100),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vérifications de santé et surveillance système
CREATE TABLE system_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification du service
    service_name VARCHAR(100) NOT NULL,
    check_name VARCHAR(100) NOT NULL,
    
    -- Statut de santé
    status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'unhealthy'
    response_time_ms INTEGER,
    
    -- Détails de vérification
    check_data JSONB, -- Données de santé spécifiques au service
    error_message TEXT,
    
    -- Timing
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions et activité utilisateur admin
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Détails de session
    session_token_hash VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    
    -- Suivi spécifique admin
    admin_level VARCHAR(20) NOT NULL, -- 'regular', 'super', 'partner', 'sponsor'
    permissions_granted TEXT[], -- Permissions spécifiques pour cette session
    
    -- Cycle de vie de session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    terminated_at TIMESTAMP WITH TIME ZONE,
    termination_reason VARCHAR(50), -- 'logout', 'timeout', 'revoked'
    
    -- Sécurité
    is_suspicious BOOLEAN DEFAULT false,
    security_flags JSONB
);
```

**Fonctionnalités Clés** :
- Système de feature flag complet avec déploiements graduels
- Gestion flexible de configuration système
- Piste d'audit complète pour conformité
- Surveillance et alertes de santé système
- Suivi de session admin amélioré avec fonctionnalités de sécurité

---

## 4) Index de Base de Données et Performance

### **Index Critiques pour Performance** (❌ Non Créés)

```sql
-- Utilisateurs et authentification
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_roles ON users USING GIN(roles);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Profils et relations
CREATE INDEX idx_profiles_date_of_birth ON profiles(date_of_birth);
CREATE INDEX idx_profiles_guardian_user_id ON profiles(guardian_user_id) WHERE guardian_user_id IS NOT NULL;

-- Parrainages et points
CREATE INDEX idx_referrals_sponsor_user_id ON referrals(sponsor_user_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_daily_limit_id ON referrals(daily_limit_id) WHERE daily_limit_id IS NOT NULL;
CREATE INDEX idx_referrals_invitation_order ON referrals(invitation_order) WHERE invitation_order IS NOT NULL;
CREATE INDEX idx_points_ledger_sponsor_user_id ON points_ledger(sponsor_user_id);
CREATE INDEX idx_points_ledger_status ON points_ledger(status);

-- Limites quotidiennes invitations
CREATE INDEX idx_sponsor_daily_limits_user_date ON sponsor_daily_limits(sponsor_user_id, limit_date);
CREATE INDEX idx_sponsor_daily_limits_next_reset ON sponsor_daily_limits(next_reset_at);
CREATE INDEX idx_sponsor_contact_batches_user_date ON sponsor_contact_batches(sponsor_user_id, batch_date);
CREATE INDEX idx_sponsor_contact_batches_status ON sponsor_contact_batches(status);

-- Cagnottes et cycle de vie
CREATE INDEX idx_pots_owner_user_id ON pots(owner_user_id);
CREATE INDEX idx_pots_status ON pots(status);
CREATE INDEX idx_pots_scheduled_open_at ON pots(scheduled_open_at);
CREATE INDEX idx_pots_birthday_date ON pots(birthday_date);

-- Donations et paiements
CREATE INDEX idx_donations_pot_id ON donations(pot_id);
CREATE INDEX idx_donations_donor_user_id ON donations(donor_user_id) WHERE donor_user_id IS NOT NULL;
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_wave_transaction_id ON donations(wave_transaction_id) WHERE wave_transaction_id IS NOT NULL;

-- Codes QR et rachat
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_pot_id ON qr_codes(pot_id);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX idx_notification_templates_template_key ON notification_templates(template_key);

-- Analyses
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);

-- Audit et admin
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id) WHERE actor_user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

## 5) Stratégie de Migration de Données

### **Phases de Migration** (❌ Non Implémenté)

**Phase 1 : Fondation Core**
- Tables utilisateurs, profils et authentification
- Système de parrainage et points de base
- Index essentiels pour performance

**Phase 2 : Logique Métier**
- Systèmes cagnottes, donations et QR
- Gestion partenaires et packs
- Infrastructure de notifications

**Phase 3 : Analyses et Admin**
- Tables d'analyses et rapports
- Outils admin et journal d'audit
- Framework de tests A/B

**Phase 4 : Optimisations**
- Index additionnels basés sur patterns de requête
- Partitionnement pour grandes tables
- Politiques d'archivage et rétention

---

## 6) Stratégie de Sauvegarde et Récupération

### **Exigences de Sauvegarde** (❌ Non Implémenté)

- **Sauvegardes automatisées quotidiennes** avec rétention 30 jours
- **Capacité de récupération point-dans-le-temps**
- **Réplication de sauvegarde inter-région** pour reprise après sinistre
- **Tests réguliers de restauration** pour valider intégrité des sauvegardes

### **Politiques de Rétention de Données**

- **Données utilisateur** : Conservées jusqu'à suppression compte + 30 jours
- **Données financières** : 7 ans pour conformité
- **Événements d'analyse** : 2 ans pour intelligence d'affaires
- **Journaux d'audit** : 5 ans pour sécurité et conformité
- **Données de session** : 90 jours maximum

---

## 7) Sécurité et Conformité

### **Mesures de Protection des Données** (🚧 En Planification)

- **Chiffrement au repos** pour champs sensibles (numéros ID, données paiement)
- **Chiffrement en transit** pour toutes connexions base de données
- **Hachage au niveau champ** pour informations personnellement identifiables
- **Sécurité au niveau ligne** pour accès données multi-tenant
- **Audits de sécurité réguliers** et tests de pénétration

### **Fonctionnalités de Conformité Vie Privée**

- **Fonctionnalité d'export de données style GDPR**
- **Implémentation du droit à l'oubli**
- **Suivi de consentement** pour communications marketing
- **Principes de minimisation des données** dans conception schéma
- **Piste d'audit** pour tous accès et modifications de données

---

## 8) Surveillance et Observabilité

### **Surveillance Base de Données** (❌ Non Implémenté)

- **Suivi performance des requêtes** avec alertes requêtes lentes
- **Surveillance et optimisation pool de connexions**
- **Analyse tendances stockage et croissance**
- **Surveillance succès/échec sauvegardes**
- **Détection et alerte événements sécurité**

### **Métriques Clés à Suivre**

- Temps de réponse requêtes (P95, P99)
- Utilisation pool de connexions base de données
- Taux de croissance stockage
- Taux transactions échouées
- Sessions utilisateurs concurrentes
- Violations intégrité données

---

## 9) Développement et Tests

### **Workflow de Développement Base de Données** (❌ Non Implémenté)

- **Versioning de schéma** avec scripts de migration
- **Tests automatisés** de fonctions et contraintes base de données
- **Tests de performance** avec volumes de données réalistes
- **Initialisation de données** pour environnements développement et test
- **Documentation schéma** auto-générée à partir du code

### **Stratégie de Données de Test**

- **Données de production anonymisées** pour environnements staging
- **Génération de données synthétiques** pour tests de charge
- **Jeux de données sécurisés conformité** pour développement
- **Actualisation automatisée des données** pour environnements de test

---

## 10) Considérations de Scalabilité Future

### **Stratégies de Passage à l'Échelle** (Implémentation Future)

- **Sharding de base de données** par ID utilisateur ou région géographique
- **Replicas de lecture** pour charges de travail analyses et rapports
- **Partitionnement de tables** pour grandes données time-series
- **Séparation bases de données microservices** au fur et à mesure que services mûrissent
- **Implémentation couche cache** pour données fréquemment accédées

### **Pipeline d'Optimisation Performance**

- **Optimisation requêtes** basée sur patterns d'usage production
- **Réglage et maintenance index** automatisés
- **Optimisation pooling de connexions**
- **Réglage paramètres base de données** pour charges de travail spécifiques
- **Recommandations mise à l'échelle matériel** basées sur croissance

---

**Cette documentation du Schéma de Base de Données sera mise à jour au fur et à mesure de l'avancement de l'implémentation et de l'identification de nouvelles exigences.**

— **Fin Schéma Base de Données v1.0 (FR)** —