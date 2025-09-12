
-- Mise à jour de la table users pour WOLO SENEGAL
ALTER TABLE users 
ADD COLUMN facebook_id VARCHAR(255) UNIQUE,
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100),
ADD COLUMN profile_picture_url TEXT,
ADD COLUMN phone VARCHAR(20),
ADD COLUMN birthday DATE,
ADD COLUMN is_facebook_user BOOLEAN DEFAULT false,
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

COMMENT ON COLUMN users.facebook_id IS 'ID Facebook pour authentification via Messenger';
COMMENT ON COLUMN users.status IS 'Statut: active, suspended, deleted';

-- Table des cagnottes (pots)
CREATE TABLE pots (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2) DEFAULT 0,
    birthday_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    is_public BOOLEAN DEFAULT true,
    allow_anonymous_donations BOOLEAN DEFAULT true,
    show_donor_names BOOLEAN DEFAULT true,
    countdown_end TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pots IS 'Cagnottes d''anniversaire des utilisateurs';
COMMENT ON COLUMN pots.status IS 'Statut: active, closed, expired, cancelled';

CREATE INDEX idx_pots_user_id ON pots(user_id);
CREATE INDEX idx_pots_status ON pots(status);
CREATE INDEX idx_pots_birthday_date ON pots(birthday_date);

-- Table des formules Pack Ciné
CREATE TABLE formulas (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    min_tickets INTEGER NOT NULL DEFAULT 1,
    max_tickets INTEGER NOT NULL DEFAULT 1,
    includes_popcorn BOOLEAN DEFAULT false,
    includes_drinks BOOLEAN DEFAULT false,
    includes_snacks BOOLEAN DEFAULT false,
    price_per_ticket DECIMAL(8,2),
    total_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE formulas IS 'Formules Pack Ciné disponibles';

CREATE INDEX idx_formulas_active ON formulas(is_active);

-- Table de liaison pot-formule
CREATE TABLE pot_formulas (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    formula_id BIGINT NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    selected_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pot_formulas IS 'Formules sélectionnées pour chaque cagnotte';

CREATE INDEX idx_pot_formulas_pot_id ON pot_formulas(pot_id);
CREATE INDEX idx_pot_formulas_formula_id ON pot_formulas(formula_id);

-- Table des donations
CREATE TABLE donations (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    donor_name VARCHAR(100),
    donor_email VARCHAR(255),
    donor_phone VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    wave_transaction_id VARCHAR(255),
    wave_payment_status VARCHAR(50),
    is_anonymous BOOLEAN DEFAULT false,
    show_name_consent BOOLEAN DEFAULT true,
    show_amount_consent BOOLEAN DEFAULT true,
    message TEXT,
    payment_method VARCHAR(50) DEFAULT 'wave',
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE donations IS 'Donations reçues via Wave ou autres moyens';
COMMENT ON COLUMN donations.status IS 'Statut: pending, completed, failed, refunded';

CREATE INDEX idx_donations_pot_id ON donations(pot_id);
CREATE INDEX idx_donations_wave_transaction_id ON donations(wave_transaction_id);
CREATE INDEX idx_donations_status ON donations(status);

-- Table des invités
CREATE TABLE invitees (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    whatsapp_number VARCHAR(20),
    email VARCHAR(255),
    invitation_sent BOOLEAN DEFAULT false,
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    qr_code_generated BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'invited',
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invitees_contact_check CHECK (whatsapp_number IS NOT NULL OR email IS NOT NULL)
);

COMMENT ON TABLE invitees IS 'Liste des invités pour chaque cagnotte';
COMMENT ON COLUMN invitees.status IS 'Statut: invited, confirmed, attended, no_show';

CREATE INDEX idx_invitees_pot_id ON invitees(pot_id);
CREATE INDEX idx_invitees_whatsapp ON invitees(whatsapp_number);
CREATE INDEX idx_invitees_email ON invitees(email);

-- Table des QR codes
CREATE TABLE qr_codes (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    invitee_id BIGINT,
    code VARCHAR(255) NOT NULL UNIQUE,
    qr_type VARCHAR(20) NOT NULL DEFAULT 'invitee',
    payload JSONB,
    status VARCHAR(20) DEFAULT 'issued',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scanned_at TIMESTAMP WITH TIME ZONE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    scanned_by VARCHAR(100),
    cinema_location VARCHAR(100),
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE qr_codes IS 'QR codes générés pour les invités et célébrants';
COMMENT ON COLUMN qr_codes.qr_type IS 'Type: invitee, master, admin';
COMMENT ON COLUMN qr_codes.status IS 'Statut: issued, scanned, redeemed, expired';

CREATE INDEX idx_qr_codes_pot_id ON qr_codes(pot_id);
CREATE INDEX idx_qr_codes_invitee_id ON qr_codes(invitee_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);

-- Table des partenaires cinéma
CREATE TABLE cinema_partners (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    revenue_share_percentage DECIMAL(5,2) DEFAULT 50.00,
    api_endpoint VARCHAR(500),
    api_key VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    operating_hours JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE cinema_partners IS 'Partenaires cinéma pour la validation des QR codes';

CREATE INDEX idx_cinema_partners_active ON cinema_partners(is_active);

-- Table des partages sur réseaux sociaux
CREATE TABLE social_shares (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    shared_by_user_id BIGINT,
    share_url TEXT,
    is_automatic BOOLEAN DEFAULT true,
    share_count INTEGER DEFAULT 1,
    last_shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE social_shares IS 'Suivi des partages sur réseaux sociaux';
COMMENT ON COLUMN social_shares.platform IS 'Plateforme: facebook, whatsapp, tiktok, snapchat';

CREATE INDEX idx_social_shares_pot_id ON social_shares(pot_id);
CREATE INDEX idx_social_shares_platform ON social_shares(platform);

-- Table des notifications
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    pot_id BIGINT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    message TEXT,
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notifications IS 'Notifications envoyées aux utilisateurs';
COMMENT ON COLUMN notifications.type IS 'Type: donation_received, pot_created, invitation_sent, qr_generated';
COMMENT ON COLUMN notifications.channel IS 'Canal: email, whatsapp, sms';
COMMENT ON COLUMN notifications.status IS 'Statut: pending, sent, failed, delivered';

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_pot_id ON notifications(pot_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Données d'exemple pour les formules Pack Ciné
INSERT INTO formulas (name, description, min_tickets, max_tickets, includes_popcorn, includes_drinks, includes_snacks, price_per_ticket, total_price, display_order) VALUES
('Pack Solo', 'Une séance cinéma pour une personne', 1, 1, false, false, false, 2500, 2500, 1),
('Pack Duo', 'Deux places de cinéma', 2, 2, true, false, false, 2500, 5500, 2),
('Pack Famille', 'Quatre places avec panier gourmand', 4, 4, true, true, true, 2500, 12000, 3),
('Pack Groupe', 'Six places avec panier gourmand complet', 6, 6, true, true, true, 2500, 18000, 4),
('Pack Fête', 'Huit places avec panier gourmand premium', 8, 8, true, true, true, 2500, 25000, 5),
('Pack Célébration', 'Dix places avec panier gourmand deluxe', 10, 10, true, true, true, 2500, 32000, 6);

-- Données d'exemple pour les partenaires cinéma
INSERT INTO cinema_partners (name, location, contact_person, contact_email, contact_phone, revenue_share_percentage, operating_hours) VALUES
('Cinéma Liberté', 'Dakar, Plateau', 'Amadou Diallo', 'contact@cinemaliberte.sn', '+221 33 123 45 67', 60.00, '{"monday": "14:00-23:00", "tuesday": "14:00-23:00", "wednesday": "14:00-23:00", "thursday": "14:00-23:00", "friday": "14:00-00:00", "saturday": "10:00-00:00", "sunday": "10:00-23:00"}'),
('Plaza Cinema', 'Dakar, Almadies', 'Fatou Seck', 'info@plazacinema.sn', '+221 33 987 65 43', 55.00, '{"monday": "15:00-22:30", "tuesday": "15:00-22:30", "wednesday": "15:00-22:30", "thursday": "15:00-22:30", "friday": "15:00-00:30", "saturday": "12:00-00:30", "sunday": "12:00-22:30"}'),
('Cinéma Sahel', 'Thiès Centre', 'Ousmane Ba', 'direction@cinemasahel.sn', '+221 33 456 78 90', 65.00, '{"monday": "16:00-22:00", "tuesday": "16:00-22:00", "wednesday": "16:00-22:00", "thursday": "16:00-22:00", "friday": "16:00-23:30", "saturday": "14:00-23:30", "sunday": "14:00-22:00"}');

-- Exemple d'utilisateur avec profil Facebook
INSERT INTO users (email, password, facebook_id, first_name, last_name, profile_picture_url, phone, birthday, is_facebook_user, role) VALUES
('awa.diop@example.com', '$2b$10$example_hashed_password', 'fb_123456789', 'Awa', 'Diop', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', '+221 77 123 45 67', '1995-03-15', true, 'app20250905024110cvidyeburp_v1_user'),
('moussa.fall@example.com', '$2b$10$example_hashed_password', 'fb_987654321', 'Moussa', 'Fall', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', '+221 76 987 65 43', '1992-07-22', true, 'app20250905024110cvidyeburp_v1_user'),
('admin@wolosenegal.com', '$2b$10$example_hashed_password', null, 'Admin', 'WOLO', null, '+221 33 123 45 67', null, false, 'app20250905024110cvidyeburp_v1_admin_user');

-- Exemple de cagnotte pour Awa
INSERT INTO pots (user_id, title, description, target_amount, birthday_date, countdown_end) VALUES
(1, 'Anniversaire de Awa - 25 ans !', 'Aide-Awa à remplir sa cagnotte SAKADO ! Cadeau Cinéma : séance grand écran + popcorn', 25000, '2024-03-15', '2024-03-15 23:59:59+00');

-- Exemples d'invités pour la cagnotte d'Awa
INSERT INTO invitees (pot_id, name, whatsapp_number, email) VALUES
(1, 'Fatima Ndiaye', '+221 77 234 56 78', 'fatima.ndiaye@example.com'),
(1, 'Ibrahima Sarr', '+221 76 345 67 89', 'ibrahima.sarr@example.com'),
(1, 'Aminata Ba', '+221 78 456 78 90', 'aminata.ba@example.com'),
(1, 'Omar Cissé', '+221 77 567 89 01', null),
(1, 'Mariama Diallo', null, 'mariama.diallo@example.com');

-- Exemples de donations pour la cagnotte d'Awa
INSERT INTO donations (pot_id, donor_name, donor_email, amount, wave_transaction_id, wave_payment_status, message, status, processed_at) VALUES
(1, 'Fatima Ndiaye', 'fatima.ndiaye@example.com', 5000, 'WAVE_TXN_001', 'completed', 'Joyeux anniversaire ma chérie ! 🎉', 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 'Ibrahima Sarr', 'ibrahima.sarr@example.com', 3000, 'WAVE_TXN_002', 'completed', 'Pour ton grand jour ! 🎂', 'completed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 'Aminata Ba', 'aminata.ba@example.com', 7500, 'WAVE_TXN_003', 'completed', 'Que cette nouvelle année te soit belle ! ✨', 'completed', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(1, 'Omar Cissé', null, 2000, 'WAVE_TXN_004', 'completed', 'Bon anniversaire ! 🎈', 'completed', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(1, 'Mariama Diallo', 'mariama.diallo@example.com', 4500, 'WAVE_TXN_005', 'completed', 'Profite bien de ta journée ! 🌟', 'completed', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Mise à jour du montant actuel de la cagnotte
UPDATE pots SET current_amount = 22000, modify_time = CURRENT_TIMESTAMP WHERE id = 1;

-- Sélection de formule pour la cagnotte d'Awa
INSERT INTO pot_formulas (pot_id, formula_id, is_locked, selected_at) VALUES
(1, 4, false, CURRENT_TIMESTAMP);

-- Génération de QR codes pour les invités
INSERT INTO qr_codes (pot_id, invitee_id, code, qr_type, payload) VALUES
(1, 1, 'WOLO_QR_001_INV_1', 'invitee', '{"pot_id": 1, "invitee_id": 1, "name": "Fatima Ndiaye", "tickets": 1}'),
(1, 2, 'WOLO_QR_002_INV_2', 'invitee', '{"pot_id": 1, "invitee_id": 2, "name": "Ibrahima Sarr", "tickets": 1}'),
(1, 3, 'WOLO_QR_003_INV_3', 'invitee', '{"pot_id": 1, "invitee_id": 3, "name": "Aminata Ba", "tickets": 1}'),
(1, 4, 'WOLO_QR_004_INV_4', 'invitee', '{"pot_id": 1, "invitee_id": 4, "name": "Omar Cissé", "tickets": 1}'),
(1, 5, 'WOLO_QR_005_INV_5', 'invitee', '{"pot_id": 1, "invitee_id": 5, "name": "Mariama Diallo", "tickets": 1}'),
(1, null, 'WOLO_QR_MASTER_001', 'master', '{"pot_id": 1, "user_id": 1, "name": "Awa Diop", "tickets": 2, "is_birthday_person": true}');

-- Partages automatiques sur réseaux sociaux
INSERT INTO social_shares (pot_id, platform, shared_by_user_id, share_url, is_automatic) VALUES
(1, 'facebook', 1, 'https://wolosenegal.com/pot/1', true),
(1, 'whatsapp', 1, 'https://wolosenegal.com/pot/1', true),
(1, 'tiktok', 1, 'https://wolosenegal.com/pot/1', true),
(1, 'snapchat', 1, 'https://wolosenegal.com/pot/1', true);

-- Table pour gérer les administrateurs WOLO
CREATE TABLE wolo_admins (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    admin_type VARCHAR(20) NOT NULL CHECK (admin_type IN ('super_admin', 'developer_admin')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_wolo_admins_username ON wolo_admins (username);
CREATE INDEX idx_wolo_admins_email ON wolo_admins (email);
CREATE INDEX idx_wolo_admins_admin_type ON wolo_admins (admin_type);
CREATE INDEX idx_wolo_admins_active ON wolo_admins (is_active);

-- Table pour gérer les permissions des administrateurs
CREATE TABLE admin_permissions (
    id BIGSERIAL PRIMARY KEY,
    admin_type VARCHAR(20) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    permission_description TEXT,
    is_active BOOLEAN DEFAULT true,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(admin_type, permission_name)
);

-- Index pour les permissions
CREATE INDEX idx_admin_permissions_type ON admin_permissions (admin_type);
CREATE INDEX idx_admin_permissions_active ON admin_permissions (is_active);

-- Insertion des Super Administrateurs
INSERT INTO wolo_admins (username, email, password, first_name, last_name, admin_type) VALUES
('jeff.wolo', 'jeff@wolosenegal.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/H/Vo7l.', 'Jeff', 'WOLO', 'super_admin'),
('nat.wolo', 'nat@wolosenegal.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/H/Vo7l.', 'Nat', 'WOLO', 'super_admin'),
('nico.wolo', 'nico@wolosenegal.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/H/Vo7l.', 'Nico', 'WOLO', 'super_admin');

-- Insertion des Administrateurs Développeurs
INSERT INTO wolo_admins (username, email, password, first_name, last_name, admin_type) VALUES
('john.dev', 'john@wolosenegal.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/H/Vo7l.', 'John', 'Developer', 'developer_admin'),
('mamefatou.dev', 'mamefatou@wolosenegal.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/H/Vo7l.', 'Mamefatou', 'Developer', 'developer_admin');

-- Permissions pour Super Administrateurs
INSERT INTO admin_permissions (admin_type, permission_name, permission_description) VALUES
('super_admin', 'manage_all_users', 'Gérer tous les utilisateurs de la plateforme'),
('super_admin', 'manage_all_pots', 'Gérer toutes les cagnottes'),
('super_admin', 'manage_admins', 'Créer et gérer les comptes administrateurs'),
('super_admin', 'view_analytics', 'Accès aux statistiques complètes'),
('super_admin', 'manage_cinema_partners', 'Gérer les partenaires cinéma'),
('super_admin', 'manage_formulas', 'Gérer les formules Pack Ciné'),
('super_admin', 'system_settings', 'Modifier les paramètres système'),
('super_admin', 'financial_reports', 'Accès aux rapports financiers'),
('super_admin', 'manage_notifications', 'Gérer les notifications système');

-- Permissions pour Administrateurs Développeurs
INSERT INTO admin_permissions (admin_type, permission_name, permission_description) VALUES
('developer_admin', 'view_system_logs', 'Consulter les logs système'),
('developer_admin', 'manage_qr_codes', 'Gérer les QR codes'),
('developer_admin', 'debug_mode', 'Accès au mode debug'),
('developer_admin', 'api_management', 'Gérer les APIs et intégrations'),
('developer_admin', 'database_queries', 'Exécuter des requêtes de diagnostic'),
('developer_admin', 'view_analytics', 'Accès aux statistiques techniques'),
('developer_admin', 'manage_notifications', 'Gérer les notifications techniques');

-- Table pour les sessions d'administration
CREATE TABLE admin_sessions (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les sessions admin
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions (admin_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions (session_token);
CREATE INDEX idx_admin_sessions_active ON admin_sessions (is_active);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions (expires_at);

COMMENT ON TABLE wolo_admins IS 'Administrateurs WOLO avec différents niveaux d''accès';
COMMENT ON TABLE admin_permissions IS 'Permissions spécifiques par type d''administrateur';
COMMENT ON TABLE admin_sessions IS 'Sessions actives des administrateurs';

-- Table pour les analytics et métriques détaillées
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT,
    user_id BIGINT,
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    session_id VARCHAR(255),
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_pot_id ON analytics_events (pot_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events (user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events (event_type);
CREATE INDEX idx_analytics_events_category ON analytics_events (event_category);
CREATE INDEX idx_analytics_events_time ON analytics_events (create_time);

COMMENT ON TABLE analytics_events IS 'Événements analytics pour le suivi des performances';
COMMENT ON COLUMN analytics_events.event_type IS 'Type: page_view, qr_scan, share_click, donation_start, donation_complete';
COMMENT ON COLUMN analytics_events.event_category IS 'Catégorie: user_interaction, system_event, marketing, conversion';

-- Table pour les logs d'activité système
CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    log_level VARCHAR(20) NOT NULL,
    component VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    message TEXT,
    error_details JSONB,
    user_id BIGINT,
    pot_id BIGINT,
    ip_address VARCHAR(45),
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_level ON system_logs (log_level);
CREATE INDEX idx_system_logs_component ON system_logs (component);
CREATE INDEX idx_system_logs_time ON system_logs (create_time);
CREATE INDEX idx_system_logs_user_id ON system_logs (user_id);

COMMENT ON TABLE system_logs IS 'Logs système pour debugging et monitoring';
COMMENT ON COLUMN system_logs.log_level IS 'Niveau: ERROR, WARN, INFO, DEBUG';

-- Table pour les rapports générés
CREATE TABLE generated_reports (
    id BIGSERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    report_name VARCHAR(200) NOT NULL,
    parameters JSONB,
    file_path TEXT,
    file_size BIGINT,
    generated_by BIGINT,
    pot_id BIGINT,
    status VARCHAR(20) DEFAULT 'generating',
    error_message TEXT,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_generated_reports_type ON generated_reports (report_type);
CREATE INDEX idx_generated_reports_generated_by ON generated_reports (generated_by);
CREATE INDEX idx_generated_reports_pot_id ON generated_reports (pot_id);
CREATE INDEX idx_generated_reports_status ON generated_reports (status);

COMMENT ON TABLE generated_reports IS 'Rapports générés et téléchargeables';
COMMENT ON COLUMN generated_reports.report_type IS 'Type: donation_summary, qr_usage, social_analytics, financial_report';
COMMENT ON COLUMN generated_reports.status IS 'Statut: generating, completed, failed, expired';

-- Table pour le suivi des performances des QR codes
CREATE TABLE qr_code_analytics (
    id BIGSERIAL PRIMARY KEY,
    qr_code_id BIGINT NOT NULL,
    scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scanner_ip VARCHAR(45),
    scanner_user_agent TEXT,
    scanner_location JSONB,
    scan_source VARCHAR(50),
    is_valid_scan BOOLEAN DEFAULT true,
    error_reason TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_analytics_qr_code_id ON qr_code_analytics (qr_code_id);
CREATE INDEX idx_qr_analytics_timestamp ON qr_code_analytics (scan_timestamp);
CREATE INDEX idx_qr_analytics_valid ON qr_code_analytics (is_valid_scan);

COMMENT ON TABLE qr_code_analytics IS 'Analytics détaillées des scans de QR codes';

-- Table pour les métriques de partage social
CREATE TABLE social_share_metrics (
    id BIGSERIAL PRIMARY KEY,
    social_share_id BIGINT NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value INTEGER DEFAULT 0,
    measurement_date DATE DEFAULT CURRENT_DATE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_metrics_share_id ON social_share_metrics (social_share_id);
CREATE INDEX idx_social_metrics_type ON social_share_metrics (metric_type);
CREATE INDEX idx_social_metrics_date ON social_share_metrics (measurement_date);

COMMENT ON TABLE social_share_metrics IS 'Métriques détaillées des partages sociaux';
COMMENT ON COLUMN social_share_metrics.metric_type IS 'Type: clicks, views, conversions, reach';

-- Ajout de colonnes pour améliorer le suivi des invitations
ALTER TABLE invitees ADD COLUMN invitation_method VARCHAR(20) DEFAULT 'manual';
ALTER TABLE invitees ADD COLUMN invitation_template_id BIGINT;
ALTER TABLE invitees ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invitees ADD COLUMN total_contributions NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN invitees.invitation_method IS 'Méthode: manual, bulk_import, social_invite';

-- Ajout de colonnes pour améliorer le suivi des donations
ALTER TABLE donations ADD COLUMN referrer_source VARCHAR(100);
ALTER TABLE donations ADD COLUMN campaign_id VARCHAR(100);
ALTER TABLE donations ADD COLUMN device_type VARCHAR(20);
ALTER TABLE donations ADD COLUMN conversion_time_seconds INTEGER;

COMMENT ON COLUMN donations.referrer_source IS 'Source de référence: facebook, whatsapp, direct, qr_code';
COMMENT ON COLUMN donations.device_type IS 'Type: mobile, desktop, tablet';

-- Données d'exemple pour les analytics
INSERT INTO analytics_events (pot_id, user_id, event_type, event_category, event_data) VALUES
(1, 1, 'page_view', 'user_interaction', '{"page": "pot_detail", "duration": 45}'),
(1, NULL, 'qr_scan', 'conversion', '{"qr_type": "invitee", "location": "cinema"}'),
(1, 1, 'share_click', 'marketing', '{"platform": "facebook", "share_type": "pot_link"}'),
(2, 2, 'donation_complete', 'conversion', '{"amount": 5000, "method": "wave"}'),
(1, NULL, 'invitation_sent', 'user_interaction', '{"method": "whatsapp", "count": 5}');

INSERT INTO system_logs (log_level, component, action, message, user_id) VALUES
('INFO', 'qr_generator', 'generate_qr_code', 'QR code généré avec succès pour l''invité', 1),
('INFO', 'wave_integration', 'payment_processed', 'Paiement Wave traité avec succès', 2),
('WARN', 'notification_service', 'send_whatsapp', 'Tentative d''envoi WhatsApp échouée, retry programmé', 1),
('INFO', 'social_share', 'facebook_share', 'Partage Facebook effectué avec succès', 1),
('INFO', 'report_generator', 'generate_report', 'Rapport de donations généré', 1);

INSERT INTO generated_reports (report_type, report_name, generated_by, pot_id, status) VALUES
('donation_summary', 'Rapport des donations - Janvier 2025', 1, 1, 'completed'),
('qr_usage', 'Utilisation des QR codes - Semaine 1', 1, 1, 'completed'),
('social_analytics', 'Performance réseaux sociaux', 1, 2, 'completed'),
('financial_report', 'Rapport financier mensuel', 1, NULL, 'generating');

-- Table pour les rapports automatiques programmés
CREATE TABLE scheduled_reports (
    id BIGSERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    report_name VARCHAR(200) NOT NULL,
    schedule_frequency VARCHAR(20) DEFAULT 'daily',
    schedule_time TIME DEFAULT '23:59:00',
    recipient_emails TEXT[],
    partner_emails TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_send_at TIMESTAMP WITH TIME ZONE,
    parameters JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_reports_active ON scheduled_reports(is_active);
CREATE INDEX idx_scheduled_reports_next_send ON scheduled_reports(next_send_at);

COMMENT ON TABLE scheduled_reports IS 'Rapports programmés pour envoi automatique';
COMMENT ON COLUMN scheduled_reports.schedule_frequency IS 'Fréquence: daily, weekly, monthly';

-- Table pour les paramètres système configurables
CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    category VARCHAR(50),
    description TEXT,
    is_editable BOOLEAN DEFAULT true,
    modified_by BIGINT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

COMMENT ON TABLE system_settings IS 'Paramètres système configurables';
COMMENT ON COLUMN system_settings.setting_type IS 'Type: string, number, boolean, json';

-- Table pour l'historique des modifications des paramètres
CREATE TABLE setting_history (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    modified_by BIGINT,
    modification_reason TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_setting_history_key ON setting_history(setting_key);
CREATE INDEX idx_setting_history_time ON setting_history(create_time);

COMMENT ON TABLE setting_history IS 'Historique des modifications des paramètres système';

-- Amélioration de la table cinema_partners pour les emails multiples
ALTER TABLE cinema_partners 
ADD COLUMN partner_emails TEXT[],
ADD COLUMN notification_preferences JSONB DEFAULT '{"daily_reports": true, "qr_alerts": true, "revenue_updates": true}',
ADD COLUMN revenue_share_history JSONB DEFAULT '[]';

COMMENT ON COLUMN cinema_partners.partner_emails IS 'Liste des emails partenaires pour notifications';
COMMENT ON COLUMN cinema_partners.notification_preferences IS 'Préférences de notification du partenaire';
COMMENT ON COLUMN cinema_partners.revenue_share_history IS 'Historique des modifications de pourcentage';

-- Insertion des paramètres par défaut pour les pourcentages des packs
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('pack_solo_percentage', '15.0', 'number', 'revenue_sharing', 'Pourcentage de commission pour le Pack Solo'),
('pack_duo_percentage', '12.0', 'number', 'revenue_sharing', 'Pourcentage de commission pour le Pack Duo'),
('pack_famille_percentage', '10.0', 'number', 'revenue_sharing', 'Pourcentage de commission pour le Pack Famille'),
('pack_groupe_percentage', '8.0', 'number', 'revenue_sharing', 'Pourcentage de commission pour le Pack Groupe'),
('default_partner_percentage', '50.0', 'number', 'revenue_sharing', 'Pourcentage par défaut pour les partenaires cinéma'),
('qr_code_expiry_hours', '24', 'number', 'qr_settings', 'Durée de validité des QR codes en heures'),
('max_qr_scans_per_code', '1', 'number', 'qr_settings', 'Nombre maximum de scans par QR code'),
('auto_report_time', '23:59', 'string', 'reporting', 'Heure d\'envoi automatique des rapports quotidiens'),
('admin_notification_emails', '["admin@wolosenegal.com"]', 'json', 'notifications', 'Emails des administrateurs pour notifications');

-- Programmation du rapport quotidien automatique
INSERT INTO scheduled_reports (report_type, report_name, schedule_frequency, schedule_time, recipient_emails, is_active, parameters) VALUES
('daily_summary', 'Rapport Quotidien WOLO', 'daily', '23:59:00', 
ARRAY['admin@wolosenegal.com', 'reports@wolosenegal.com'], 
true, 
'{"include_donations": true, "include_qr_scans": true, "include_social_metrics": true, "include_user_stats": true}'::jsonb);

-- Ajouter des colonnes pour contrôler la visibilité des donations dans la table pots
ALTER TABLE pots ADD COLUMN allow_donor_names_display BOOLEAN DEFAULT true;
ALTER TABLE pots ADD COLUMN show_all_amounts BOOLEAN DEFAULT false;

-- Modifier la table donations pour ajouter des contrôles de visibilité plus granulaires
ALTER TABLE donations ADD COLUMN show_amount_publicly BOOLEAN DEFAULT false;
ALTER TABLE donations ADD COLUMN donor_name_consent BOOLEAN DEFAULT true;

-- Créer un index pour optimiser les requêtes de visibilité
CREATE INDEX idx_donations_visibility ON donations USING btree (pot_id, show_amount_publicly, show_name_consent);

-- Ajouter des commentaires pour clarifier les nouvelles colonnes
COMMENT ON COLUMN pots.allow_donor_names_display IS 'Permet à la personne d''anniversaire d''autoriser l''affichage des noms des donateurs';
COMMENT ON COLUMN pots.show_all_amounts IS 'Affiche tous les montants (false = seul le plus gros donateur visible)';
COMMENT ON COLUMN donations.show_amount_publicly IS 'Le donateur autorise l''affichage public de son montant';
COMMENT ON COLUMN donations.donor_name_consent IS 'Le donateur autorise l''affichage de son nom (remplace show_name_consent)';

-- Mettre à jour les donations existantes pour définir le plus gros donateur comme visible
WITH max_donations AS (
  SELECT pot_id, MAX(amount) as max_amount
  FROM donations 
  WHERE status = 'completed'
  GROUP BY pot_id
)
UPDATE donations 
SET show_amount_publicly = true
FROM max_donations 
WHERE donations.pot_id = max_donations.pot_id 
  AND donations.amount = max_donations.max_amount 
  AND donations.status = 'completed';

-- Table pour gérer la visibilité individuelle des noms de donateurs
CREATE TABLE donation_visibility_settings (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    donation_id BIGINT NOT NULL,
    show_donor_name BOOLEAN DEFAULT true,
    modified_by_birthday_person BOOLEAN DEFAULT false,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pot_id, donation_id)
);

CREATE INDEX idx_donation_visibility_pot_id ON donation_visibility_settings USING btree (pot_id);
CREATE INDEX idx_donation_visibility_donation_id ON donation_visibility_settings USING btree (donation_id);
CREATE INDEX idx_donation_visibility_show_name ON donation_visibility_settings USING btree (show_donor_name);

COMMENT ON TABLE donation_visibility_settings IS 'Paramètres de visibilité individuels pour chaque donation par la personne d''anniversaire';
COMMENT ON COLUMN donation_visibility_settings.show_donor_name IS 'La personne d''anniversaire autorise l''affichage du nom de ce donateur';
COMMENT ON COLUMN donation_visibility_settings.modified_by_birthday_person IS 'Indique si le paramètre a été modifié par la personne d''anniversaire';

-- Données d'exemple pour les donations existantes
INSERT INTO donation_visibility_settings (pot_id, donation_id, show_donor_name, modified_by_birthday_person) VALUES
(1, 1, true, false),
(1, 2, true, false),
(1, 3, false, true),
(2, 4, true, false),
(2, 5, false, true);

-- Table pour les méthodes d'authentification multiples
CREATE TABLE user_auth_providers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'google', 'apple', 'facebook', 'email'
    provider_id VARCHAR(255), -- ID du provider externe
    provider_email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    auth_data JSONB, -- Données supplémentaires du provider
    is_active BOOLEAN DEFAULT true,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_id)
);

CREATE INDEX idx_user_auth_providers_user_id ON user_auth_providers(user_id);
CREATE INDEX idx_user_auth_providers_provider ON user_auth_providers(provider);
CREATE INDEX idx_user_auth_providers_provider_email ON user_auth_providers(provider_email);

COMMENT ON TABLE user_auth_providers IS 'Méthodes d''authentification multiples pour les utilisateurs';

-- Table pour le système de parrainage
CREATE TABLE sponsorships (
    id BIGSERIAL PRIMARY KEY,
    sponsor_user_id BIGINT NOT NULL, -- Utilisateur qui parraine
    invited_name VARCHAR(100) NOT NULL,
    invited_email VARCHAR(255),
    invited_phone VARCHAR(20),
    invited_birthday DATE NOT NULL,
    invitation_method VARCHAR(20) DEFAULT 'email', -- 'email', 'sms', 'whatsapp'
    invitation_message TEXT,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
    invited_user_id BIGINT, -- ID de l'utilisateur créé après acceptation
    pot_id BIGINT, -- ID de la cagnotte créée
    points_awarded INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (invited_email IS NOT NULL OR invited_phone IS NOT NULL)
);

CREATE INDEX idx_sponsorships_sponsor_user_id ON sponsorships(sponsor_user_id);
CREATE INDEX idx_sponsorships_invited_email ON sponsorships(invited_email);
CREATE INDEX idx_sponsorships_invitation_token ON sponsorships(invitation_token);
CREATE INDEX idx_sponsorships_status ON sponsorships(status);
CREATE INDEX idx_sponsorships_birthday ON sponsorships(invited_birthday);

COMMENT ON TABLE sponsorships IS 'Système de parrainage d''utilisateurs';
COMMENT ON COLUMN sponsorships.status IS 'Statut: pending, accepted, rejected, expired';

-- Table pour les points des utilisateurs
CREATE TABLE user_points (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0, -- Points disponibles pour utilisation
    lifetime_points INTEGER DEFAULT 0, -- Total des points gagnés à vie
    current_level VARCHAR(50) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_points_total ON user_points(total_points);
CREATE INDEX idx_user_points_level ON user_points(current_level);

COMMENT ON TABLE user_points IS 'Points accumulés par les utilisateurs via le parrainage';

-- Table pour l'historique des points
CREATE TABLE point_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'bonus', 'spent', 'expired'
    points_amount INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'sponsorship', 'pot_growth', 'bonus', 'redemption'
    source_id BIGINT, -- ID de la source (sponsorship_id, pot_id, etc.)
    description TEXT,
    metadata JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX idx_point_transactions_source ON point_transactions(source_type, source_id);
CREATE INDEX idx_point_transactions_time ON point_transactions(create_time);

COMMENT ON TABLE point_transactions IS 'Historique des transactions de points';

-- Table pour les règles de points
CREATE TABLE point_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_type VARCHAR(50) NOT NULL, -- 'sponsorship_base', 'pot_growth_bonus', 'level_bonus'
    points_value INTEGER NOT NULL,
    conditions JSONB, -- Conditions pour l'attribution des points
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_rules_type ON point_rules(rule_type);
CREATE INDEX idx_point_rules_active ON point_rules(is_active);

COMMENT ON TABLE point_rules IS 'Règles d''attribution des points';

-- Table pour les invitations de parrainage en attente
CREATE TABLE sponsorship_invitations (
    id BIGSERIAL PRIMARY KEY,
    sponsorship_id BIGINT NOT NULL,
    invitation_method VARCHAR(20) NOT NULL,
    recipient VARCHAR(255) NOT NULL, -- email ou numéro de téléphone
    message_content TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sponsorship_invitations_sponsorship_id ON sponsorship_invitations(sponsorship_id);
CREATE INDEX idx_sponsorship_invitations_status ON sponsorship_invitations(status);
CREATE INDEX idx_sponsorship_invitations_recipient ON sponsorship_invitations(recipient);

COMMENT ON TABLE sponsorship_invitations IS 'Invitations de parrainage envoyées';

-- Ajouter des colonnes à la table users pour supporter l'authentification multiple
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN apple_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email';
ALTER TABLE users ADD COLUMN is_sponsored BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN sponsored_by BIGINT; -- ID du parrain

-- Données d'exemple pour les règles de points
INSERT INTO point_rules (rule_name, rule_type, points_value, conditions, description) VALUES
('Parrainage de base', 'sponsorship_base', 10, '{"min_days": 10, "max_days": 30}', 'Points de base pour chaque parrainage accepté'),
('Bonus croissance 1000 FCFA', 'pot_growth_bonus', 5, '{"pot_amount_threshold": 1000}', 'Bonus quand la cagnotte parrainée atteint 1000 FCFA'),
('Bonus croissance 5000 FCFA', 'pot_growth_bonus', 10, '{"pot_amount_threshold": 5000}', 'Bonus quand la cagnotte parrainée atteint 5000 FCFA'),
('Bonus croissance 10000 FCFA', 'pot_growth_bonus', 20, '{"pot_amount_threshold": 10000}', 'Bonus quand la cagnotte parrainée atteint 10000 FCFA'),
('Bonus niveau Silver', 'level_bonus', 50, '{"level": "silver", "sponsorships_required": 5}', 'Bonus pour atteindre le niveau Silver'),
('Bonus niveau Gold', 'level_bonus', 100, '{"level": "gold", "sponsorships_required": 10}', 'Bonus pour atteindre le niveau Gold'),
('Bonus niveau Platinum', 'level_bonus', 200, '{"level": "platinum", "sponsorships_required": 20}', 'Bonus pour atteindre le niveau Platinum');

-- Données d'exemple pour les providers d'authentification
INSERT INTO user_auth_providers (user_id, provider, provider_email, is_primary) VALUES
(1, 'email', 'awa@example.com', true),
(1, 'facebook', 'awa@example.com', false);

-- Mise à jour de la table social_shares pour inclure Instagram et les nouvelles plateformes
ALTER TABLE social_shares ALTER COLUMN platform TYPE varchar(50);

-- Mise à jour du commentaire pour refléter les nouvelles plateformes
COMMENT ON COLUMN social_shares.platform IS 'Plateforme: facebook, whatsapp, instagram, tiktok, snapchat, twitter, linkedin';

-- Mise à jour de la table user_auth_providers pour supporter les nouveaux fournisseurs
ALTER TABLE user_auth_providers ALTER COLUMN provider TYPE varchar(50);

-- Ajout des nouveaux fournisseurs d'authentification dans les colonnes users
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_id varchar(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS snapchat_id varchar(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_id varchar(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id varchar(255) UNIQUE;

-- Mise à jour du commentaire auth_provider pour inclure les nouvelles options
COMMENT ON COLUMN users.auth_provider IS 'Fournisseur: email, facebook, google, apple, tiktok, snapchat, twitter, linkedin';

-- Insertion des exemples de partages sociaux avec Instagram
INSERT INTO social_shares (pot_id, platform, shared_by_user_id, share_url, is_automatic, share_count) VALUES
(1, 'instagram', 1, 'https://instagram.com/share/story', true, 1),
(1, 'tiktok', 1, 'https://tiktok.com/share', true, 1),
(1, 'snapchat', 1, 'https://snapchat.com/share', true, 1),
(2, 'instagram', 2, 'https://instagram.com/share/story', true, 1),
(2, 'tiktok', 2, 'https://tiktok.com/share', true, 1);

-- Insertion des règles de points pour les nouveaux réseaux sociaux
INSERT INTO point_rules (rule_name, rule_type, points_value, conditions, description) VALUES
('instagram_share', 'social_share', 5, '{"platform": "instagram", "min_followers": 0}', 'Points pour partage Instagram'),
('tiktok_share', 'social_share', 8, '{"platform": "tiktok", "min_followers": 0}', 'Points pour partage TikTok'),
('snapchat_share', 'social_share', 6, '{"platform": "snapchat", "min_friends": 0}', 'Points pour partage Snapchat'),
('twitter_share', 'social_share', 4, '{"platform": "twitter", "min_followers": 0}', 'Points pour partage Twitter/X'),
('linkedin_share', 'social_share', 7, '{"platform": "linkedin", "min_connections": 0}', 'Points pour partage LinkedIn');

-- Mise à jour des paramètres système pour les nouvelles plateformes
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('social_auth_tiktok_enabled', 'true', 'boolean', 'authentication', 'Activer l''authentification TikTok'),
('social_auth_snapchat_enabled', 'true', 'boolean', 'authentication', 'Activer l''authentification Snapchat'),
('social_auth_twitter_enabled', 'true', 'boolean', 'authentication', 'Activer l''authentification Twitter/X'),
('social_auth_linkedin_enabled', 'true', 'boolean', 'authentication', 'Activer l''authentification LinkedIn'),
('social_share_instagram_enabled', 'true', 'boolean', 'social_sharing', 'Activer le partage Instagram'),
('social_share_tiktok_enabled', 'true', 'boolean', 'social_sharing', 'Activer le partage TikTok'),
('social_share_snapchat_enabled', 'true', 'boolean', 'social_sharing', 'Activer le partage Snapchat');

-- Ajouter les colonnes pour distinguer le propriétaire de la cagnotte et la personne fêtée
ALTER TABLE pots ADD COLUMN birthday_person_name VARCHAR(200);
ALTER TABLE pots ADD COLUMN birthday_person_email VARCHAR(255);
ALTER TABLE pots ADD COLUMN birthday_person_phone VARCHAR(20);
ALTER TABLE pots ADD COLUMN birthday_person_user_id BIGINT;
ALTER TABLE pots ADD COLUMN is_self_birthday BOOLEAN DEFAULT true;

-- Ajouter des index pour les nouvelles colonnes
CREATE INDEX idx_pots_birthday_person_user_id ON pots USING btree (birthday_person_user_id);
CREATE INDEX idx_pots_birthday_person_email ON pots USING btree (birthday_person_email);
CREATE INDEX idx_pots_is_self_birthday ON pots USING btree (is_self_birthday);

-- Ajouter des commentaires pour clarifier la structure
COMMENT ON COLUMN pots.user_id IS 'Propriétaire/créateur de la cagnotte (celui qui la gère)';
COMMENT ON COLUMN pots.birthday_person_name IS 'Nom de la personne dont c''est l''anniversaire';
COMMENT ON COLUMN pots.birthday_person_email IS 'Email de la personne dont c''est l''anniversaire';
COMMENT ON COLUMN pots.birthday_person_phone IS 'Téléphone de la personne dont c''est l''anniversaire';
COMMENT ON COLUMN pots.birthday_person_user_id IS 'ID utilisateur de la personne fêtée (si elle a un compte)';
COMMENT ON COLUMN pots.is_self_birthday IS 'true = cagnotte pour son propre anniversaire, false = pour quelqu''un d''autre';

-- Mettre à jour les données existantes pour qu'elles soient cohérentes
UPDATE pots SET is_self_birthday = true WHERE birthday_person_user_id IS NULL;
UPDATE pots SET birthday_person_user_id = user_id WHERE is_self_birthday = true;

-- Table pour stocker les relations avec les personnes fêtées
CREATE TABLE pot_relationships (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    is_minor BOOLEAN DEFAULT FALSE,
    additional_info JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pot_relationships_pot_id ON pot_relationships (pot_id);
CREATE INDEX idx_pot_relationships_type ON pot_relationships (relationship_type);

COMMENT ON TABLE pot_relationships IS 'Relations entre le créateur de la cagnotte et la personne fêtée';
COMMENT ON COLUMN pot_relationships.relationship_type IS 'Type: ami, amie, membre_famille';
COMMENT ON COLUMN pot_relationships.is_minor IS 'Indique si la personne fêtée est mineure';
COMMENT ON COLUMN pot_relationships.additional_info IS 'Informations supplémentaires sur la relation';

-- Données d'exemple
INSERT INTO pot_relationships (pot_id, relationship_type, is_minor, additional_info) VALUES
(1, 'ami', false, '{"notes": "Meilleur ami depuis le lycée"}'),
(2, 'membre_famille', true, '{"family_relation": "cousin", "guardian_consent": true}'),
(3, 'amie', false, '{"notes": "Collègue de travail"}'),
(4, 'membre_famille', false, '{"family_relation": "soeur"}'),
(5, 'ami', true, '{"guardian_name": "Marie Dupont", "guardian_phone": "+221771234567"}');

-- Modifier la table pot_relationships pour ajouter les relations spécifiques aux mineurs
ALTER TABLE pot_relationships 
ADD COLUMN minor_relationship_type VARCHAR(50);

-- Ajouter un commentaire pour expliquer les nouvelles valeurs possibles
COMMENT ON COLUMN pot_relationships.minor_relationship_type IS 'Relation spécifique si mineur: enfant, frere_soeur, neveu_niece';

-- Ajouter une contrainte pour valider les valeurs possibles pour les mineurs
ALTER TABLE pot_relationships 
ADD CONSTRAINT check_minor_relationship 
CHECK (
    (is_minor = false AND minor_relationship_type IS NULL) OR
    (is_minor = true AND minor_relationship_type IN ('enfant', 'frere_soeur', 'neveu_niece'))
);

-- Mettre à jour le commentaire de la table
COMMENT ON TABLE pot_relationships IS 'Relations entre le créateur de la cagnotte et la personne fêtée. Si mineur, précise la relation familiale spécifique.';

-- Table pour gérer les mineurs et leurs gestionnaires
CREATE TABLE managed_minors (
    id BIGSERIAL PRIMARY KEY,
    manager_user_id BIGINT NOT NULL,
    minor_name VARCHAR(200) NOT NULL,
    minor_birthday DATE NOT NULL,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('enfant', 'frere_soeur', 'neveu_niece')),
    is_active BOOLEAN DEFAULT true,
    created_by_name VARCHAR(200) NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_minor_birthday UNIQUE (minor_name, minor_birthday)
);

CREATE INDEX idx_managed_minors_manager ON managed_minors (manager_user_id);
CREATE INDEX idx_managed_minors_birthday ON managed_minors (minor_birthday);
CREATE INDEX idx_managed_minors_active ON managed_minors (is_active);

COMMENT ON TABLE managed_minors IS 'Mineurs gérés par des utilisateurs authentifiés avec détection de doublons';
COMMENT ON COLUMN managed_minors.manager_user_id IS 'ID de l''utilisateur qui gère ce mineur';
COMMENT ON COLUMN managed_minors.relationship_type IS 'Relation familiale: enfant, frere_soeur, neveu_niece';
COMMENT ON COLUMN managed_minors.created_by_name IS 'Nom de la personne qui a créé l''entrée pour ce mineur';

-- Table pour l'historique des transferts de gestion
CREATE TABLE minor_management_transfers (
    id BIGSERIAL PRIMARY KEY,
    minor_id BIGINT NOT NULL,
    from_user_id BIGINT NOT NULL,
    to_user_id BIGINT NOT NULL,
    from_user_name VARCHAR(200) NOT NULL,
    to_user_name VARCHAR(200) NOT NULL,
    transfer_reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    transfer_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_minor_transfers_minor_id ON minor_management_transfers (minor_id);
CREATE INDEX idx_minor_transfers_from_user ON minor_management_transfers (from_user_id);
CREATE INDEX idx_minor_transfers_to_user ON minor_management_transfers (to_user_id);
CREATE INDEX idx_minor_transfers_status ON minor_management_transfers (status);
CREATE INDEX idx_minor_transfers_token ON minor_management_transfers (transfer_token);

COMMENT ON TABLE minor_management_transfers IS 'Historique des transferts de gestion de mineurs entre utilisateurs';

-- Table pour lier les cagnottes aux mineurs gérés
CREATE TABLE minor_pots (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    minor_id BIGINT NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_pot_minor UNIQUE (pot_id, minor_id)
);

CREATE INDEX idx_minor_pots_pot_id ON minor_pots (pot_id);
CREATE INDEX idx_minor_pots_minor_id ON minor_pots (minor_id);

COMMENT ON TABLE minor_pots IS 'Liaison entre les cagnottes et les mineurs gérés';

-- Table pour les tentatives de création de doublons
CREATE TABLE minor_duplicate_attempts (
    id BIGSERIAL PRIMARY KEY,
    attempted_by_user_id BIGINT NOT NULL,
    attempted_by_name VARCHAR(200) NOT NULL,
    existing_minor_id BIGINT NOT NULL,
    existing_manager_name VARCHAR(200) NOT NULL,
    minor_name VARCHAR(200) NOT NULL,
    minor_birthday DATE NOT NULL,
    attempt_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_duplicate_attempts_user ON minor_duplicate_attempts (attempted_by_user_id);
CREATE INDEX idx_duplicate_attempts_minor ON minor_duplicate_attempts (existing_minor_id);
CREATE INDEX idx_duplicate_attempts_time ON minor_duplicate_attempts (attempt_time);

COMMENT ON TABLE minor_duplicate_attempts IS 'Log des tentatives de création de mineurs déjà existants dans le système';

-- Mise à jour de la table pots pour supporter les mineurs gérés
ALTER TABLE pots ADD COLUMN managed_minor_id BIGINT;
CREATE INDEX idx_pots_managed_minor ON pots (managed_minor_id);
COMMENT ON COLUMN pots.managed_minor_id IS 'ID du mineur géré si la cagnotte est créée pour un mineur';

-- Fonction pour vérifier les contraintes d'anniversaire (10-30 jours)
CREATE OR REPLACE FUNCTION check_birthday_range(birthday_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN birthday_date BETWEEN CURRENT_DATE + INTERVAL '10 days' AND CURRENT_DATE + INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_birthday_range IS 'Vérifie que l''anniversaire est dans 10 à 30 jours';

-- Table pour les photos des mineurs gérés
CREATE TABLE minor_profile_photos (
    id BIGSERIAL PRIMARY KEY,
    minor_id BIGINT NOT NULL,
    photo_url TEXT NOT NULL,
    photo_filename VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by_user_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_minor_photos_minor_id ON minor_profile_photos (minor_id);
CREATE INDEX idx_minor_photos_active ON minor_profile_photos (is_active);
CREATE INDEX idx_minor_photos_uploaded_by ON minor_profile_photos (uploaded_by_user_id);

COMMENT ON TABLE minor_profile_photos IS 'Photos de profil des mineurs gérés pour affichage sur leurs pages d''anniversaire';

-- Ajout de colonnes pour les photos de profil personnalisées des utilisateurs
ALTER TABLE users ADD COLUMN custom_profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN custom_photo_filename VARCHAR(255);
ALTER TABLE users ADD COLUMN custom_photo_uploaded_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.custom_profile_photo_url IS 'Photo de profil personnalisée uploadée par l''utilisateur';
COMMENT ON COLUMN users.custom_photo_filename IS 'Nom du fichier de la photo personnalisée';
COMMENT ON COLUMN users.custom_photo_uploaded_at IS 'Date d''upload de la photo personnalisée';

-- Table pour les templates de médias et messages gérés par les admins
CREATE TABLE admin_media_templates (
    id BIGSERIAL PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL,
    original_file_url TEXT,
    original_filename VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    message_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by_admin_id BIGINT NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_media_templates_template_name_key UNIQUE (template_name),
    CONSTRAINT admin_media_templates_content_type_check CHECK (content_type IN ('video', 'image', 'text', 'mixed')),
    CONSTRAINT admin_media_templates_template_type_check CHECK (template_type IN ('social_share', 'invitation', 'sponsorship', 'notification', 'birthday_greeting')),
    CONSTRAINT admin_media_templates_category_check CHECK (category IN ('facebook', 'instagram', 'whatsapp', 'tiktok', 'snapchat', 'twitter', 'linkedin', 'email', 'sms', 'general'))
);

CREATE INDEX idx_admin_media_templates_type ON admin_media_templates (template_type);
CREATE INDEX idx_admin_media_templates_category ON admin_media_templates (category);
CREATE INDEX idx_admin_media_templates_active ON admin_media_templates (is_active);
CREATE INDEX idx_admin_media_templates_created_by ON admin_media_templates (created_by_admin_id);

COMMENT ON TABLE admin_media_templates IS 'Templates de médias et messages gérés par les administrateurs pour toutes les communications';
COMMENT ON COLUMN admin_media_templates.template_type IS 'Type: social_share, invitation, sponsorship, notification, birthday_greeting';
COMMENT ON COLUMN admin_media_templates.category IS 'Plateforme cible: facebook, instagram, whatsapp, tiktok, snapchat, twitter, linkedin, email, sms, general';
COMMENT ON COLUMN admin_media_templates.content_type IS 'Type de contenu: video, image, text, mixed';

-- Table pour les formats spécifiques aux réseaux sociaux
CREATE TABLE social_media_formats (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    format_type VARCHAR(50) NOT NULL,
    width INTEGER,
    height INTEGER,
    max_duration_seconds INTEGER,
    max_file_size_mb INTEGER,
    supported_formats TEXT[],
    aspect_ratio VARCHAR(20),
    formatted_file_url TEXT,
    formatted_filename VARCHAR(255),
    processing_status VARCHAR(20) DEFAULT 'pending',
    processing_error TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT social_media_formats_platform_check CHECK (platform IN ('facebook', 'instagram', 'whatsapp', 'tiktok', 'snapchat', 'twitter', 'linkedin')),
    CONSTRAINT social_media_formats_format_type_check CHECK (format_type IN ('post', 'story', 'reel', 'video', 'cover', 'profile', 'thumbnail')),
    CONSTRAINT social_media_formats_processing_status_check CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_social_formats_template_id ON social_media_formats (template_id);
CREATE INDEX idx_social_formats_platform ON social_media_formats (platform);
CREATE INDEX idx_social_formats_format_type ON social_media_formats (format_type);
CREATE INDEX idx_social_formats_status ON social_media_formats (processing_status);

COMMENT ON TABLE social_media_formats IS 'Formats spécifiques de chaque template pour différentes plateformes sociales';
COMMENT ON COLUMN social_media_formats.format_type IS 'Type de format: post, story, reel, video, cover, profile, thumbnail';
COMMENT ON COLUMN social_media_formats.processing_status IS 'Statut du traitement: pending, processing, completed, failed';

-- Table pour l'historique des modifications des templates
CREATE TABLE admin_media_template_history (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    modified_by_admin_id BIGINT NOT NULL,
    modification_reason TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_media_template_history_action_check CHECK (action IN ('created', 'updated', 'activated', 'deactivated', 'deleted'))
);

CREATE INDEX idx_template_history_template_id ON admin_media_template_history (template_id);
CREATE INDEX idx_template_history_action ON admin_media_template_history (action);
CREATE INDEX idx_template_history_time ON admin_media_template_history (create_time);

COMMENT ON TABLE admin_media_template_history IS 'Historique des modifications des templates de médias';

-- Table pour les paramètres de formatage par plateforme
CREATE TABLE platform_format_settings (
    id BIGSERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    format_type VARCHAR(50) NOT NULL,
    setting_name VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT platform_format_settings_unique_setting UNIQUE (platform, format_type, setting_name)
);

CREATE INDEX idx_platform_settings_platform ON platform_format_settings (platform);
CREATE INDEX idx_platform_settings_format_type ON platform_format_settings (format_type);
CREATE INDEX idx_platform_settings_active ON platform_format_settings (is_active);

COMMENT ON TABLE platform_format_settings IS 'Paramètres de formatage spécifiques pour chaque plateforme et type de format';

-- Insertion des paramètres de format par défaut pour les principales plateformes
INSERT INTO platform_format_settings (platform, format_type, setting_name, setting_value, description) VALUES
('facebook', 'post', 'recommended_width', '1200', 'Largeur recommandée pour les posts Facebook'),
('facebook', 'post', 'recommended_height', '630', 'Hauteur recommandée pour les posts Facebook'),
('facebook', 'post', 'aspect_ratio', '1.91:1', 'Ratio d''aspect recommandé'),
('facebook', 'story', 'recommended_width', '1080', 'Largeur pour les stories Facebook'),
('facebook', 'story', 'recommended_height', '1920', 'Hauteur pour les stories Facebook'),
('facebook', 'story', 'aspect_ratio', '9:16', 'Ratio d''aspect pour stories'),

('instagram', 'post', 'recommended_width', '1080', 'Largeur recommandée pour les posts Instagram'),
('instagram', 'post', 'recommended_height', '1080', 'Hauteur recommandée pour les posts Instagram'),
('instagram', 'post', 'aspect_ratio', '1:1', 'Ratio d''aspect carré'),
('instagram', 'story', 'recommended_width', '1080', 'Largeur pour les stories Instagram'),
('instagram', 'story', 'recommended_height', '1920', 'Hauteur pour les stories Instagram'),
('instagram', 'story', 'aspect_ratio', '9:16', 'Ratio d''aspect pour stories'),
('instagram', 'reel', 'recommended_width', '1080', 'Largeur pour les reels Instagram'),
('instagram', 'reel', 'recommended_height', '1920', 'Hauteur pour les reels Instagram'),
('instagram', 'reel', 'max_duration_seconds', '90', 'Durée maximale des reels'),

('tiktok', 'video', 'recommended_width', '1080', 'Largeur recommandée pour TikTok'),
('tiktok', 'video', 'recommended_height', '1920', 'Hauteur recommandée pour TikTok'),
('tiktok', 'video', 'aspect_ratio', '9:16', 'Ratio d''aspect vertical'),
('tiktok', 'video', 'max_duration_seconds', '180', 'Durée maximale des vidéos TikTok'),

('whatsapp', 'post', 'recommended_width', '1080', 'Largeur recommandée pour WhatsApp'),
('whatsapp', 'post', 'recommended_height', '1080', 'Hauteur recommandée pour WhatsApp'),
('whatsapp', 'story', 'recommended_width', '1080', 'Largeur pour les statuts WhatsApp'),
('whatsapp', 'story', 'recommended_height', '1920', 'Hauteur pour les statuts WhatsApp'),

('twitter', 'post', 'recommended_width', '1200', 'Largeur recommandée pour Twitter'),
('twitter', 'post', 'recommended_height', '675', 'Hauteur recommandée pour Twitter'),
('twitter', 'post', 'aspect_ratio', '16:9', 'Ratio d''aspect recommandé'),

('linkedin', 'post', 'recommended_width', '1200', 'Largeur recommandée pour LinkedIn'),
('linkedin', 'post', 'recommended_height', '627', 'Hauteur recommandée pour LinkedIn'),
('linkedin', 'post', 'aspect_ratio', '1.91:1', 'Ratio d''aspect recommandé');

-- Insertion de templates par défaut
INSERT INTO admin_media_templates (template_name, template_type, category, description, content_type, message_content, created_by_admin_id) VALUES
('Invitation Anniversaire Facebook', 'invitation', 'facebook', 'Template d''invitation pour Facebook', 'mixed', 'Vous êtes invité(e) à célébrer l''anniversaire de {birthday_person_name} ! 🎉 Participez à sa cagnotte : {pot_url}', 1),
('Partage Cagnotte Instagram', 'social_share', 'instagram', 'Template de partage pour Instagram', 'mixed', '🎂 Aidez-moi à célébrer l''anniversaire de {birthday_person_name} ! Chaque contribution compte 💝 {pot_url} #Anniversaire #Cagnotte', 1),
('Invitation Parrainage WhatsApp', 'sponsorship', 'whatsapp', 'Template d''invitation de parrainage WhatsApp', 'text', 'Salut ! Je t''invite à rejoindre WOLO pour créer ta cagnotte d''anniversaire 🎉 Utilise mon lien de parrainage : {sponsorship_url}', 1),
('Notification Don Reçu', 'notification', 'email', 'Template de notification de don reçu', 'text', 'Bonne nouvelle ! {donor_name} a contribué {amount}€ à votre cagnotte d''anniversaire 🎁', 1),
('Félicitations Anniversaire', 'birthday_greeting', 'general', 'Template de félicitations d''anniversaire', 'mixed', 'Joyeux anniversaire {birthday_person_name} ! 🎉🎂 Profitez bien de votre journée spéciale !', 1);

-- Table pour définir les séquences de communication vidéo
CREATE TABLE video_sequences (
    id BIGSERIAL PRIMARY KEY,
    sequence_name VARCHAR(100) NOT NULL,
    sequence_type VARCHAR(50) NOT NULL, -- 'default', 'minor', 'adult', 'special_event'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by_admin_id BIGINT NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT video_sequences_sequence_type_check 
    CHECK (sequence_type IN ('default', 'minor', 'adult', 'special_event'))
);

-- Table pour définir les étapes de chaque séquence
CREATE TABLE video_sequence_steps (
    id BIGSERIAL PRIMARY KEY,
    sequence_id BIGINT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- 'creation', 'weekly', 'daily', 'custom_days'
    trigger_offset_days INTEGER, -- Nombre de jours avant l'anniversaire pour déclencher
    frequency_days INTEGER, -- Fréquence en jours (7 pour hebdomadaire, 1 pour quotidien)
    start_condition JSONB, -- Conditions pour commencer cette étape
    end_condition JSONB, -- Conditions pour arrêter cette étape
    template_id BIGINT, -- Template vidéo à utiliser
    is_active BOOLEAN DEFAULT true,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT video_sequence_steps_trigger_type_check 
    CHECK (trigger_type IN ('creation', 'weekly', 'daily', 'custom_days', 'milestone'))
);

-- Table pour assigner des séquences aux cagnottes
CREATE TABLE pot_video_sequences (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    sequence_id BIGINT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    custom_settings JSONB, -- Paramètres personnalisés pour cette cagnotte
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_pot_sequence UNIQUE (pot_id, sequence_id)
);

-- Table pour planifier et suivre l'envoi des vidéos
CREATE TABLE scheduled_video_communications (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    sequence_step_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    sent_at TIMESTAMP WITH TIME ZONE,
    platforms JSONB, -- Plateformes où envoyer (facebook, whatsapp, etc.)
    recipient_data JSONB, -- Données des destinataires
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT scheduled_video_communications_status_check 
    CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled', 'processing'))
);

-- Table pour l'historique des modifications de séquences
CREATE TABLE video_sequence_history (
    id BIGSERIAL PRIMARY KEY,
    sequence_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    modified_by_admin_id BIGINT NOT NULL,
    modification_reason TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT video_sequence_history_action_check 
    CHECK (action IN ('created', 'updated', 'activated', 'deactivated', 'deleted', 'step_added', 'step_removed', 'step_modified'))
);

-- Index pour optimiser les performances
CREATE INDEX idx_video_sequences_type ON video_sequences (sequence_type);
CREATE INDEX idx_video_sequences_active ON video_sequences (is_active);
CREATE INDEX idx_video_sequences_default ON video_sequences (is_default);

CREATE INDEX idx_sequence_steps_sequence_id ON video_sequence_steps (sequence_id);
CREATE INDEX idx_sequence_steps_order ON video_sequence_steps (sequence_id, step_order);
CREATE INDEX idx_sequence_steps_trigger_type ON video_sequence_steps (trigger_type);
CREATE INDEX idx_sequence_steps_active ON video_sequence_steps (is_active);

CREATE INDEX idx_pot_sequences_pot_id ON pot_video_sequences (pot_id);
CREATE INDEX idx_pot_sequences_sequence_id ON pot_video_sequences (sequence_id);
CREATE INDEX idx_pot_sequences_active ON pot_video_sequences (is_active);

CREATE INDEX idx_scheduled_communications_pot_id ON scheduled_video_communications (pot_id);
CREATE INDEX idx_scheduled_communications_date ON scheduled_video_communications (scheduled_date);
CREATE INDEX idx_scheduled_communications_status ON scheduled_video_communications (status);
CREATE INDEX idx_scheduled_communications_step_id ON scheduled_video_communications (sequence_step_id);

CREATE INDEX idx_sequence_history_sequence_id ON video_sequence_history (sequence_id);
CREATE INDEX idx_sequence_history_action ON video_sequence_history (action);
CREATE INDEX idx_sequence_history_time ON video_sequence_history (create_time);

-- Commentaires pour la documentation
COMMENT ON TABLE video_sequences IS 'Séquences de communication vidéo configurables pour les campagnes de cagnotte';
COMMENT ON TABLE video_sequence_steps IS 'Étapes individuelles de chaque séquence avec timing et conditions';
COMMENT ON TABLE pot_video_sequences IS 'Association entre cagnottes et séquences vidéo assignées';
COMMENT ON TABLE scheduled_video_communications IS 'Planification et suivi des envois de vidéos selon les séquences';
COMMENT ON TABLE video_sequence_history IS 'Historique des modifications des séquences vidéo';

COMMENT ON COLUMN video_sequence_steps.trigger_type IS 'Type de déclencheur: creation, weekly, daily, custom_days, milestone';
COMMENT ON COLUMN video_sequence_steps.trigger_offset_days IS 'Nombre de jours avant anniversaire pour déclencher';
COMMENT ON COLUMN video_sequence_steps.frequency_days IS 'Fréquence: 7=hebdomadaire, 1=quotidien, 2=tous les 2 jours';
COMMENT ON COLUMN scheduled_video_communications.status IS 'Statut: scheduled, sent, failed, cancelled, processing';

-- Données d'exemple pour une séquence par défaut
INSERT INTO video_sequences (sequence_name, sequence_type, description, is_default, created_by_admin_id) VALUES
('Séquence Standard', 'default', 'Séquence par défaut pour toutes les cagnottes', true, 1),
('Séquence Mineur', 'minor', 'Séquence spécialisée pour les cagnottes de mineurs', false, 1),
('Séquence Adulte', 'adult', 'Séquence pour les cagnottes d''adultes', false, 1),
('Séquence Événement Spécial', 'special_event', 'Pour les anniversaires avec événements particuliers', false, 1),
('Séquence Express', 'default', 'Séquence accélérée pour les anniversaires proches', false, 1);

-- Étapes d'exemple pour la séquence standard
INSERT INTO video_sequence_steps (sequence_id, step_name, step_order, trigger_type, trigger_offset_days, frequency_days, template_id) VALUES
(1, 'Création de cagnotte', 1, 'creation', 0, NULL, 1),
(1, 'Rappel hebdomadaire', 2, 'weekly', 21, 7, 2),
(1, 'Rappel dernière semaine', 3, 'daily', 7, 2, 3),
(1, 'Rappel final', 4, 'daily', 2, 1, 4),
(1, 'Jour J', 5, 'custom_days', 0, NULL, 5);

-- Étapes pour la séquence mineur
INSERT INTO video_sequence_steps (sequence_id, step_name, step_order, trigger_type, trigger_offset_days, frequency_days, template_id) VALUES
(2, 'Création cagnotte enfant', 1, 'creation', 0, NULL, 6),
(2, 'Rappel famille hebdomadaire', 2, 'weekly', 28, 7, 7),
(2, 'Rappel famille dernière semaine', 3, 'daily', 7, 2, 8),
(2, 'Compte à rebours final', 4, 'daily', 3, 1, 9),
(2, 'Anniversaire enfant', 5, 'custom_days', 0, NULL, 10);

-- Ajouter la colonne sent_at manquante dans la table scheduled_video_communications
ALTER TABLE scheduled_video_communications 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Créer un index pour optimiser les requêtes sur sent_at
CREATE INDEX IF NOT EXISTS idx_scheduled_communications_sent_at 
ON scheduled_video_communications USING btree (sent_at);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN scheduled_video_communications.sent_at IS 'Date et heure d''envoi effectif de la communication';

-- Table pour gérer les invitations de parrainage via contacts WhatsApp
CREATE TABLE whatsapp_sponsorship_invitations (
    id BIGSERIAL PRIMARY KEY,
    sponsor_user_id BIGINT NOT NULL,
    contact_name VARCHAR(200) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    invitation_message TEXT,
    invitation_status VARCHAR(20) DEFAULT 'sent',
    whatsapp_message_id VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE,
    registered_user_id BIGINT,
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT whatsapp_invitations_status_check CHECK (invitation_status IN ('sent', 'delivered', 'read', 'clicked', 'registered', 'expired', 'failed'))
);

CREATE INDEX idx_whatsapp_invitations_sponsor ON whatsapp_sponsorship_invitations(sponsor_user_id);
CREATE INDEX idx_whatsapp_invitations_phone ON whatsapp_sponsorship_invitations(contact_phone);
CREATE INDEX idx_whatsapp_invitations_status ON whatsapp_sponsorship_invitations(invitation_status);
CREATE INDEX idx_whatsapp_invitations_token ON whatsapp_sponsorship_invitations(invitation_token);
CREATE INDEX idx_whatsapp_invitations_sent_at ON whatsapp_sponsorship_invitations(sent_at);

COMMENT ON TABLE whatsapp_sponsorship_invitations IS 'Invitations de parrainage envoyées via WhatsApp depuis la liste de contacts';
COMMENT ON COLUMN whatsapp_sponsorship_invitations.invitation_status IS 'Statut: sent, delivered, read, clicked, registered, expired, failed';
COMMENT ON COLUMN whatsapp_sponsorship_invitations.whatsapp_message_id IS 'ID du message WhatsApp pour le suivi';
COMMENT ON COLUMN whatsapp_sponsorship_invitations.invitation_token IS 'Token unique pour tracer l''invitation lors de l''inscription';

-- Table pour stocker les contacts WhatsApp importés (optionnel, pour cache)
CREATE TABLE user_whatsapp_contacts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    contact_name VARCHAR(200) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_hash VARCHAR(64) NOT NULL, -- Hash pour éviter les doublons
    is_already_user BOOLEAN DEFAULT FALSE,
    existing_user_id BIGINT,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_contact_hash UNIQUE (user_id, contact_hash)
);

CREATE INDEX idx_whatsapp_contacts_user_id ON user_whatsapp_contacts(user_id);
CREATE INDEX idx_whatsapp_contacts_phone ON user_whatsapp_contacts(contact_phone);
CREATE INDEX idx_whatsapp_contacts_existing_user ON user_whatsapp_contacts(existing_user_id);

COMMENT ON TABLE user_whatsapp_contacts IS 'Cache des contacts WhatsApp importés par les utilisateurs pour les invitations de parrainage';
COMMENT ON COLUMN user_whatsapp_contacts.contact_hash IS 'Hash MD5 du nom+téléphone pour éviter les doublons';
COMMENT ON COLUMN user_whatsapp_contacts.is_already_user IS 'Indique si ce contact est déjà utilisateur de la plateforme';

-- Exemples d'invitations WhatsApp
INSERT INTO whatsapp_sponsorship_invitations (sponsor_user_id, contact_name, contact_phone, invitation_message, invitation_token) VALUES
(1, 'Amadou Diallo', '+221771234567', 'Salut Amadou ! 🎉 J''utilise WOLO pour organiser des cagnottes d''anniversaire au cinéma. Rejoins-moi avec ce lien et gagne des points ! 🎬', 'whatsapp_inv_' || generate_random_uuid()),
(1, 'Fatou Sall', '+221772345678', 'Hey Fatou ! 🎂 Tu vas adorer WOLO - on peut créer des cagnottes pour fêter les anniversaires au cinéma ! Inscris-toi avec mon lien 🎊', 'whatsapp_inv_' || generate_random_uuid()),
(2, 'Moussa Ba', '+221773456789', 'Salut Moussa ! J''ai découvert une super app pour organiser des fêtes d''anniversaire au cinéma. Viens voir WOLO ! 🍿', 'whatsapp_inv_' || generate_random_uuid()),
(2, 'Aïcha Ndiaye', '+221774567890', 'Coucou Aïcha ! 🎈 WOLO c''est génial pour les anniversaires - on peut inviter des amis et collecter de l''argent pour le cinéma ! Rejoins-nous 🎭', 'whatsapp_inv_' || generate_random_uuid()),
(3, 'Omar Sy', '+221775678901', 'Salut Omar ! Tu connais WOLO ? C''est parfait pour organiser des sorties cinéma d''anniversaire entre amis ! Essaie avec ce lien 🎪', 'whatsapp_inv_' || generate_random_uuid());

-- Exemples de contacts WhatsApp (cache)
INSERT INTO user_whatsapp_contacts (user_id, contact_name, contact_phone, contact_hash, is_already_user) VALUES
(1, 'Amadou Diallo', '+221771234567', md5('Amadou Diallo+221771234567'), FALSE),
(1, 'Fatou Sall', '+221772345678', md5('Fatou Sall+221772345678'), FALSE),
(1, 'Khadija Mbaye', '+221773456789', md5('Khadija Mbaye+221773456789'), TRUE),
(2, 'Moussa Ba', '+221774567890', md5('Moussa Ba+221774567890'), FALSE),
(2, 'Aïcha Ndiaye', '+221775678901', md5('Aïcha Ndiaye+221775678901'), FALSE),
(2, 'Ibrahima Fall', '+221776789012', md5('Ibrahima Fall+221776789012'), TRUE),
(3, 'Omar Sy', '+221777890123', md5('Omar Sy+221777890123'), FALSE),
(3, 'Marième Faye', '+221778901234', md5('Marième Faye+221778901234'), FALSE);

-- Table pour optimiser les invitations et éviter les doublons
CREATE TABLE whatsapp_invitation_cache (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    contact_phone_hash VARCHAR(64) NOT NULL,
    contact_name VARCHAR(200) NOT NULL,
    last_invitation_sent_at TIMESTAMP WITH TIME ZONE,
    invitation_count INTEGER DEFAULT 0,
    success_rate NUMERIC(5,2) DEFAULT 0.00,
    is_blocked BOOLEAN DEFAULT FALSE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_phone_hash UNIQUE (user_id, contact_phone_hash)
);

CREATE INDEX idx_invitation_cache_user_id ON whatsapp_invitation_cache USING btree (user_id);
CREATE INDEX idx_invitation_cache_phone_hash ON whatsapp_invitation_cache USING btree (contact_phone_hash);
CREATE INDEX idx_invitation_cache_last_sent ON whatsapp_invitation_cache USING btree (last_invitation_sent_at);

COMMENT ON TABLE whatsapp_invitation_cache IS 'Cache optimisé des invitations WhatsApp pour éviter les doublons et améliorer les performances';

-- Table de métriques de viralité en temps réel
CREATE TABLE viral_metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    achievement_unlocked VARCHAR(100),
    measurement_date DATE DEFAULT CURRENT_DATE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT viral_metrics_type_check CHECK (metric_type IN ('invitations_sent', 'contacts_imported', 'successful_registrations', 'viral_coefficient', 'engagement_score'))
);

CREATE INDEX idx_viral_metrics_user_id ON viral_metrics USING btree (user_id);
CREATE INDEX idx_viral_metrics_type ON viral_metrics USING btree (metric_type);
CREATE INDEX idx_viral_metrics_date ON viral_metrics USING btree (measurement_date);

COMMENT ON TABLE viral_metrics IS 'Métriques de viralité en temps réel pour gamification et optimisation';

-- Table de tokens sécurisés pour les liens de parrainage
CREATE TABLE secure_invitation_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    sponsor_user_id BIGINT NOT NULL,
    contact_phone_hash VARCHAR(64) NOT NULL,
    token_type VARCHAR(20) DEFAULT 'whatsapp',
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT secure_invitation_tokens_token_key UNIQUE (token)
);

CREATE INDEX idx_secure_tokens_sponsor ON secure_invitation_tokens USING btree (sponsor_user_id);
CREATE INDEX idx_secure_tokens_token ON secure_invitation_tokens USING btree (token);
CREATE INDEX idx_secure_tokens_expires ON secure_invitation_tokens USING btree (expires_at);

COMMENT ON TABLE secure_invitation_tokens IS 'Tokens sécurisés temporaires pour les invitations de parrainage';

-- Table de gamification pour booster la viralité
CREATE TABLE viral_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    points_awarded INTEGER DEFAULT 0,
    bonus_reward JSONB,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT viral_achievements_type_check CHECK (achievement_type IN ('first_invite', 'invite_master', 'viral_champion', 'contact_importer', 'registration_booster'))
);

CREATE INDEX idx_viral_achievements_user_id ON viral_achievements USING btree (user_id);
CREATE INDEX idx_viral_achievements_type ON viral_achievements USING btree (achievement_type);
CREATE INDEX idx_viral_achievements_unlocked ON viral_achievements USING btree (unlocked_at);

COMMENT ON TABLE viral_achievements IS 'Système de récompenses gamifiées pour encourager la viralité';

-- Table de sessions d'invitation pour UX fluide
CREATE TABLE invitation_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    contacts_imported INTEGER DEFAULT 0,
    invitations_sent INTEGER DEFAULT 0,
    session_status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    device_info JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invitation_sessions_token_key UNIQUE (session_token),
    CONSTRAINT invitation_sessions_status_check CHECK (session_status IN ('active', 'completed', 'expired', 'cancelled'))
);

CREATE INDEX idx_invitation_sessions_user_id ON invitation_sessions USING btree (user_id);
CREATE INDEX idx_invitation_sessions_token ON invitation_sessions USING btree (session_token);
CREATE INDEX idx_invitation_sessions_status ON invitation_sessions USING btree (session_status);

COMMENT ON TABLE invitation_sessions IS 'Sessions d''invitation pour une expérience utilisateur fluide et continue';

-- Exemples de données pour les métriques virales
INSERT INTO viral_metrics (user_id, metric_type, metric_value, bonus_points, achievement_unlocked) VALUES
(1, 'invitations_sent', 5, 50, 'first_invite'),
(1, 'contacts_imported', 25, 25, 'contact_importer'),
(2, 'successful_registrations', 3, 150, 'registration_booster'),
(3, 'viral_coefficient', 12, 120, 'viral_champion'),
(4, 'engagement_score', 85, 85, 'invite_master');

-- Exemples de récompenses gamifiées
INSERT INTO viral_achievements (user_id, achievement_type, achievement_name, description, points_awarded, bonus_reward) VALUES
(1, 'first_invite', 'Premier Parrain', 'Félicitations ! Vous avez envoyé votre première invitation', 50, '{"bonus_type": "welcome", "value": "10€"}'),
(1, 'contact_importer', 'Maître des Contacts', 'Vous avez importé plus de 20 contacts', 100, '{"bonus_type": "multiplier", "value": "x2"}'),
(2, 'registration_booster', 'Recruteur Pro', '3 amis se sont inscrits grâce à vous', 200, '{"bonus_type": "cash", "value": "25€"}'),
(3, 'viral_champion', 'Champion Viral', 'Coefficient viral exceptionnel !', 300, '{"bonus_type": "premium", "value": "1_month"}'),
(4, 'invite_master', 'Maître Invitation', 'Score d''engagement supérieur à 80%', 150, '{"bonus_type": "feature", "value": "priority_support"}');

-- Exemples de tokens sécurisés
INSERT INTO secure_invitation_tokens (token, sponsor_user_id, contact_phone_hash, token_type, metadata) VALUES
('tok_whatsapp_abc123def456', 1, 'hash_contact_1', 'whatsapp', '{"contact_name": "Marie Dupont", "campaign": "birthday_2024"}'),
('tok_whatsapp_ghi789jkl012', 2, 'hash_contact_2', 'whatsapp', '{"contact_name": "Pierre Martin", "campaign": "viral_boost"}'),
('tok_whatsapp_mno345pqr678', 3, 'hash_contact_3', 'whatsapp', '{"contact_name": "Sophie Bernard", "campaign": "friend_referral"}'),
('tok_whatsapp_stu901vwx234', 4, 'hash_contact_4', 'whatsapp', '{"contact_name": "Lucas Moreau", "campaign": "family_invite"}'),
('tok_whatsapp_yza567bcd890', 5, 'hash_contact_5', 'whatsapp', '{"contact_name": "Emma Leroy", "campaign": "social_expansion"}');

-- Exemples de cache d'invitations
INSERT INTO whatsapp_invitation_cache (user_id, contact_phone_hash, contact_name, invitation_count, success_rate) VALUES
(1, 'hash_contact_1', 'Marie Dupont', 1, 100.00),
(1, 'hash_contact_2', 'Pierre Martin', 2, 50.00),
(2, 'hash_contact_3', 'Sophie Bernard', 1, 100.00),
(3, 'hash_contact_4', 'Lucas Moreau', 3, 33.33),
(4, 'hash_contact_5', 'Emma Leroy', 1, 0.00);

-- Exemples de sessions d'invitation
INSERT INTO invitation_sessions (user_id, session_token, contacts_imported, invitations_sent, session_status, device_info) VALUES
(1, 'sess_inv_abc123', 25, 5, 'completed', '{"device": "iPhone 14", "os": "iOS 17.1", "app_version": "2.1.0"}'),
(2, 'sess_inv_def456', 18, 3, 'active', '{"device": "Samsung Galaxy S23", "os": "Android 13", "app_version": "2.1.0"}'),
(3, 'sess_inv_ghi789', 32, 8, 'completed', '{"device": "iPhone 13", "os": "iOS 16.6", "app_version": "2.0.9"}'),
(4, 'sess_inv_jkl012', 12, 2, 'active', '{"device": "Google Pixel 7", "os": "Android 14", "app_version": "2.1.0"}'),
(5, 'sess_inv_mno345', 45, 12, 'completed', '{"device": "iPhone 15 Pro", "os": "iOS 17.2", "app_version": "2.1.1"}');

-- Table pour les campagnes de parrainage viral avec templates personnalisés
CREATE TABLE viral_referral_campaigns (
    id BIGSERIAL PRIMARY KEY,
    campaign_name VARCHAR(100) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('whatsapp_contacts', 'social_media', 'email_blast', 'mixed')),
    target_audience VARCHAR(50) DEFAULT 'adults',
    message_template_id BIGINT,
    reward_points INTEGER DEFAULT 50,
    bonus_multiplier NUMERIC(3,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    max_invitations_per_user INTEGER DEFAULT 100,
    success_metrics JSONB DEFAULT '{"target_registrations": 1000, "viral_coefficient": 2.5}',
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_viral_campaigns_type ON viral_referral_campaigns(campaign_type);
CREATE INDEX idx_viral_campaigns_active ON viral_referral_campaigns(is_active);

-- Table pour les actions rapides de parrainage (interface 3-taps)
CREATE TABLE quick_referral_actions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('contact_import', 'bulk_invite', 'social_share', 'qr_generate')),
    contacts_selected INTEGER DEFAULT 0,
    invitations_sent INTEGER DEFAULT 0,
    success_rate NUMERIC(5,2) DEFAULT 0.00,
    time_to_complete_seconds INTEGER,
    device_type VARCHAR(20),
    session_data JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quick_actions_user_id ON quick_referral_actions(user_id);
CREATE INDEX idx_quick_actions_type ON quick_referral_actions(action_type);

-- Table pour les templates de messages viraux personnalisables
CREATE TABLE viral_message_templates (
    id BIGSERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('whatsapp', 'sms', 'email', 'facebook', 'instagram', 'tiktok')),
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('invitation', 'reminder', 'celebration', 'milestone')),
    subject_line VARCHAR(200),
    message_content TEXT NOT NULL,
    call_to_action VARCHAR(100),
    personalization_fields JSONB DEFAULT '["first_name", "sponsor_name", "bonus_amount"]',
    emoji_style VARCHAR(20) DEFAULT 'modern',
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    success_rate NUMERIC(5,2) DEFAULT 0.00,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_viral_templates_platform ON viral_message_templates(platform);
CREATE INDEX idx_viral_templates_type ON viral_message_templates(message_type);

-- Table pour les fonctionnalités superadmin manquantes
CREATE TABLE superadmin_functions (
    id BIGSERIAL PRIMARY KEY,
    function_name VARCHAR(100) NOT NULL UNIQUE,
    function_category VARCHAR(50) NOT NULL CHECK (function_category IN ('video_management', 'qr_generation', 'pdf_reports', 'analytics', 'user_management', 'system_config')),
    function_description TEXT,
    endpoint_url VARCHAR(200),
    required_permissions JSONB DEFAULT '["super_admin"]',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    icon_name VARCHAR(50),
    button_color VARCHAR(20) DEFAULT 'primary',
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_superadmin_functions_category ON superadmin_functions(function_category);
CREATE INDEX idx_superadmin_functions_active ON superadmin_functions(is_active);

-- Table pour les sessions d'import de contacts optimisées
CREATE TABLE contact_import_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    import_method VARCHAR(20) DEFAULT 'whatsapp' CHECK (import_method IN ('whatsapp', 'phone_contacts', 'csv_upload', 'manual')),
    total_contacts INTEGER DEFAULT 0,
    processed_contacts INTEGER DEFAULT 0,
    valid_contacts INTEGER DEFAULT 0,
    duplicate_contacts INTEGER DEFAULT 0,
    invalid_contacts INTEGER DEFAULT 0,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 hours'),
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_import_user_id ON contact_import_sessions(user_id);
CREATE INDEX idx_contact_import_status ON contact_import_sessions(processing_status);

-- Table pour les récompenses virales en temps réel
CREATE TABLE viral_rewards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('first_invite', 'milestone_reached', 'viral_champion', 'speed_bonus', 'quality_bonus')),
    reward_name VARCHAR(100) NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    cash_bonus NUMERIC(10,2) DEFAULT 0.00,
    special_privileges JSONB,
    trigger_condition VARCHAR(200),
    is_claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    notification_sent BOOLEAN DEFAULT false,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_viral_rewards_user_id ON viral_rewards(user_id);
CREATE INDEX idx_viral_rewards_type ON viral_rewards(reward_type);
CREATE INDEX idx_viral_rewards_claimed ON viral_rewards(is_claimed);

-- Table pour les analytics de viralité en temps réel
CREATE TABLE viral_analytics_realtime (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL CHECK (metric_category IN ('invitations', 'registrations', 'engagement', 'conversion', 'retention')),
    metric_value NUMERIC(15,2) NOT NULL,
    previous_value NUMERIC(15,2),
    percentage_change NUMERIC(5,2),
    time_period VARCHAR(20) DEFAULT 'hourly' CHECK (time_period IN ('realtime', 'hourly', 'daily', 'weekly', 'monthly')),
    measurement_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_segment VARCHAR(50),
    campaign_id BIGINT,
    additional_data JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_viral_analytics_metric ON viral_analytics_realtime(metric_name);
CREATE INDEX idx_viral_analytics_category ON viral_analytics_realtime(metric_category);
CREATE INDEX idx_viral_analytics_timestamp ON viral_analytics_realtime(measurement_timestamp);

-- Insertion des fonctionnalités superadmin manquantes
INSERT INTO superadmin_functions (function_name, function_category, function_description, endpoint_url, display_order, icon_name, button_color) VALUES
('Gestion Vidéos', 'video_management', 'Gérer les séquences vidéo, templates et communications automatisées', '/superadmin/videos', 1, 'video', 'primary'),
('Génération QR Codes', 'qr_generation', 'Générer et gérer les QR codes pour les cagnottes et invités', '/superadmin/qr-codes', 2, 'qr-code', 'success'),
('Rapports PDF', 'pdf_reports', 'Générer et télécharger des rapports PDF détaillés', '/superadmin/pdf-reports', 3, 'file-pdf', 'danger'),
('Analytics Avancées', 'analytics', 'Tableaux de bord analytics avec métriques en temps réel', '/superadmin/analytics', 4, 'chart-line', 'info'),
('Gestion Utilisateurs', 'user_management', 'Administration complète des utilisateurs et permissions', '/superadmin/users', 5, 'users', 'warning'),
('Configuration Système', 'system_config', 'Paramètres système et configuration globale', '/superadmin/config', 6, 'cog', 'secondary');

-- Templates de messages viraux par défaut
INSERT INTO viral_message_templates (template_name, platform, message_type, subject_line, message_content, call_to_action) VALUES
('Invitation WhatsApp Moderne', 'whatsapp', 'invitation', NULL, '🎉 Salut {first_name} ! {sponsor_name} t''invite à rejoindre WOLO pour créer des cagnottes d''anniversaire magiques ! 🎂✨ Bonus de bienvenue : {bonus_amount}€ ! 🎁', 'Rejoins-nous maintenant'),
('Rappel WhatsApp Amical', 'whatsapp', 'reminder', NULL, '👋 Hey {first_name} ! Tu as raté l''invitation de {sponsor_name} ? 🤔 WOLO t''attend toujours avec ton bonus de {bonus_amount}€ ! 💰 Ne laisse pas passer cette chance ! 🚀', 'Récupère ton bonus'),
('Célébration Milestone', 'whatsapp', 'celebration', NULL, '🏆 INCROYABLE {first_name} ! Tu viens de débloquer le niveau {milestone_level} sur WOLO ! 🌟 Récompense spéciale : {reward_points} points ! 🎯', 'Voir mes récompenses'),
('Email Invitation Professionnelle', 'email', 'invitation', 'Invitation spéciale de {sponsor_name} - Bonus {bonus_amount}€', 'Bonjour {first_name},\n\n{sponsor_name} vous invite à découvrir WOLO, la plateforme révolutionnaire pour créer des cagnottes d''anniversaire.\n\nBonus de bienvenue exclusif : {bonus_amount}€\n\nRejoignez des milliers d''utilisateurs qui simplifient leurs célébrations !', 'Créer mon compte'),
('SMS Invitation Courte', 'sms', 'invitation', NULL, '{sponsor_name} t''invite sur WOLO ! Bonus {bonus_amount}€ offert. Lien: {invitation_link}', 'Rejoindre');

-- Campagnes virales par défaut
INSERT INTO viral_referral_campaigns (campaign_name, campaign_type, target_audience, reward_points, bonus_multiplier, success_metrics) VALUES
('Parrainage WhatsApp Contacts', 'whatsapp_contacts', 'adults', 100, 1.50, '{"target_registrations": 5000, "viral_coefficient": 3.0}'),
('Campagne Réseaux Sociaux', 'social_media', 'adults', 75, 1.25, '{"target_registrations": 2000, "viral_coefficient": 2.0}'),
('Invitation Email Massive', 'email_blast', 'adults', 50, 1.00, '{"target_registrations": 1000, "viral_coefficient": 1.5}'),
('Campagne Mixte Virale', 'mixed', 'adults', 125, 2.00, '{"target_registrations": 10000, "viral_coefficient": 4.0}');

-- Système multi-partenaires évolutif
CREATE TABLE partners (
    id BIGSERIAL PRIMARY KEY,
    partner_name VARCHAR(100) NOT NULL,
    partner_type VARCHAR(50) NOT NULL,
    description TEXT,
    logo_url TEXT,
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    revenue_share_percentage NUMERIC(5,2) DEFAULT 50.00,
    api_endpoint VARCHAR(500),
    api_key VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    operating_hours JSONB,
    partner_emails TEXT[],
    notification_preferences JSONB DEFAULT '{"qr_alerts": true, "daily_reports": true, "revenue_updates": true}'::jsonb,
    revenue_share_history JSONB DEFAULT '[]'::jsonb,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT partners_partner_type_check CHECK (partner_type IN ('cinema', 'beauty', 'casino', 'cruise', 'limo', 'pilgrimage'))
);

CREATE INDEX idx_partners_type ON partners (partner_type);
CREATE INDEX idx_partners_active ON partners (is_active);

-- Packages multi-partenaires
CREATE TABLE partner_packages (
    id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    package_type VARCHAR(50) NOT NULL,
    description TEXT,
    detailed_description TEXT,
    min_tickets INTEGER DEFAULT 1,
    max_tickets INTEGER DEFAULT 1,
    includes_extras JSONB DEFAULT '[]'::jsonb,
    price_per_unit NUMERIC(8,2),
    total_price NUMERIC(10,2),
    package_image_url TEXT,
    terms_conditions TEXT,
    validity_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT partner_packages_package_type_check CHECK (package_type IN ('cinema', 'beauty', 'casino', 'cruise', 'limo', 'pilgrimage'))
);

CREATE INDEX idx_partner_packages_partner_id ON partner_packages (partner_id);
CREATE INDEX idx_partner_packages_type ON partner_packages (package_type);
CREATE INDEX idx_partner_packages_active ON partner_packages (is_active);

-- Configuration système pour mode partenaire unique
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS partner_mode_config JSONB DEFAULT '{"cinema_only": false, "active_partners": ["cinema"]}'::jsonb;

-- Extension table pots pour préférences de pack
ALTER TABLE pots ADD COLUMN IF NOT EXISTS preferred_package_id BIGINT;
ALTER TABLE pots ADD COLUMN IF NOT EXISTS preferred_package_message TEXT;

CREATE INDEX idx_pots_preferred_package ON pots (preferred_package_id);

-- Liaison pots-packages
CREATE TABLE pot_packages (
    id BIGSERIAL PRIMARY KEY,
    pot_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    is_selected BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    selected_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pot_packages_pot_id ON pot_packages (pot_id);
CREATE INDEX idx_pot_packages_package_id ON pot_packages (package_id);

-- Extension donations pour gamification live
ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_top_donor BOOLEAN DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS live_display_consent BOOLEAN DEFAULT true;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS celebration_animation_triggered BOOLEAN DEFAULT false;

-- Analytics par package
CREATE TABLE package_analytics (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    partner_id BIGINT NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value NUMERIC(15,2) NOT NULL,
    measurement_date DATE DEFAULT CURRENT_DATE,
    additional_data JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT package_analytics_metric_type_check CHECK (metric_type IN ('selections', 'completions', 'revenue', 'satisfaction', 'conversion_rate'))
);

CREATE INDEX idx_package_analytics_package_id ON package_analytics (package_id);
CREATE INDEX idx_package_analytics_partner_id ON package_analytics (partner_id);
CREATE INDEX idx_package_analytics_date ON package_analytics (measurement_date);

-- Système de parrainage viral WhatsApp amélioré
CREATE TABLE viral_sponsorship_campaigns (
    id BIGSERIAL PRIMARY KEY,
    sponsor_user_id BIGINT NOT NULL,
    campaign_name VARCHAR(100) NOT NULL,
    campaign_type VARCHAR(50) DEFAULT 'whatsapp_contacts',
    target_contacts INTEGER DEFAULT 0,
    contacts_imported INTEGER DEFAULT 0,
    invitations_sent INTEGER DEFAULT 0,
    successful_registrations INTEGER DEFAULT 0,
    viral_coefficient NUMERIC(5,2) DEFAULT 0.00,
    bonus_points_earned INTEGER DEFAULT 0,
    campaign_status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT viral_campaigns_status_check CHECK (campaign_status IN ('active', 'completed', 'paused', 'cancelled'))
);

CREATE INDEX idx_viral_campaigns_sponsor ON viral_sponsorship_campaigns (sponsor_user_id);
CREATE INDEX idx_viral_campaigns_status ON viral_sponsorship_campaigns (campaign_status);

-- Récompenses de parrainage en temps réel
CREATE TABLE sponsorship_rewards_realtime (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reward_trigger VARCHAR(50) NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    cash_bonus NUMERIC(10,2) DEFAULT 0.00,
    bonus_description TEXT,
    trigger_data JSONB,
    is_claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sponsorship_rewards_trigger_check CHECK (reward_trigger IN ('first_contact_import', 'bulk_invitation', 'registration_milestone', 'viral_achievement', 'speed_bonus'))
);

CREATE INDEX idx_sponsorship_rewards_user_id ON sponsorship_rewards_realtime (user_id);
CREATE INDEX idx_sponsorship_rewards_trigger ON sponsorship_rewards_realtime (reward_trigger);
CREATE INDEX idx_sponsorship_rewards_claimed ON sponsorship_rewards_realtime (is_claimed);

-- Permissions étendues pour superadmin/dev
ALTER TABLE admin_permissions ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'standard';
ALTER TABLE admin_permissions ADD CONSTRAINT admin_permissions_access_level_check CHECK (access_level IN ('standard', 'superadmin_only', 'dev_only', 'superadmin_dev_only'));

-- Fonctions superadmin étendues
INSERT INTO superadmin_functions (function_name, function_category, function_description, endpoint_url, required_permissions, icon_name, button_color, display_order) VALUES
('Gestion Vidéos', 'video_management', 'Gestion complète des templates vidéo et séquences', '/admin/video-management', '["super_admin", "developer_admin"]', 'video', 'primary', 1),
('Gestion Partenaires', 'partner_management', 'Configuration des partenaires et leurs packages', '/admin/partners', '["super_admin", "developer_admin"]', 'business', 'success', 2),
('Génération QR Codes', 'qr_generation', 'Génération et gestion des QR codes', '/admin/qr-codes', '["super_admin", "developer_admin"]', 'qr-code', 'info', 3),
('Rapports PDF', 'pdf_reports', 'Génération de rapports PDF détaillés', '/admin/pdf-reports', '["super_admin", "developer_admin"]', 'file-pdf', 'warning', 4),
('Analytics Avancées', 'analytics', 'Tableaux de bord analytics complets', '/admin/analytics', '["super_admin", "developer_admin"]', 'chart-bar', 'secondary', 5),
('Parrainage Viral', 'viral_management', 'Gestion du système de parrainage viral', '/admin/viral-sponsorship', '["super_admin", "developer_admin"]', 'share', 'primary', 6);

-- Données d'exemple pour les partenaires
INSERT INTO partners (partner_name, partner_type, description, revenue_share_percentage, is_active) VALUES
('Cinéma Pathé', 'cinema', 'Réseau de cinémas premium avec expérience immersive', 45.00, true),
('Beauty Spa Luxe', 'beauty', 'Institut de beauté haut de gamme avec soins personnalisés', 50.00, true),
('Casino Royal', 'casino', 'Casino premium avec jeux et divertissements', 40.00, true),
('Croisières Méditerranée', 'cruise', 'Croisières de luxe en Méditerranée', 35.00, true),
('Limo VIP Service', 'limo', 'Service de limousine de prestige', 55.00, true),
('Pèlerinage Spirituel', 'pilgrimage', 'Voyages spirituels organisés', 30.00, true);

-- Packages d'exemple
INSERT INTO partner_packages (partner_id, package_name, package_type, description, detailed_description, total_price, includes_extras, is_active) VALUES
(1, 'Pack Cinéma Premium', 'cinema', 'Séance cinéma avec collations', 'Séance cinéma dans une salle premium avec popcorn, boisson et bonbons inclus', 25000, '["popcorn", "boisson", "bonbons"]', true),
(2, 'Pack Beauté Détente', 'beauty', 'Soin visage et manucure', 'Soin du visage complet avec nettoyage, gommage, masque et manucure professionnelle', 45000, '["soin_visage", "manucure", "massage_mains"]', true),
(3, 'Pack Casino Découverte', 'casino', 'Soirée casino avec jetons', 'Soirée au casino avec jetons offerts et cocktail de bienvenue', 35000, '["jetons", "cocktail", "buffet"]', true),
(4, 'Pack Croisière Weekend', 'cruise', 'Mini-croisière 2 jours', 'Croisière de 2 jours en Méditerranée avec pension complète', 150000, '["pension_complete", "animations", "excursions"]', true),
(5, 'Pack Limo Prestige', 'limo', 'Transport VIP 4 heures', 'Service de limousine avec chauffeur pour 4 heures', 80000, '["chauffeur", "champagne", "wifi"]', true),
(6, 'Pack Pèlerinage Omra', 'pilgrimage', 'Voyage spirituel à La Mecque', 'Pèlerinage Omra tout compris avec guide spirituel', 500000, '["vol", "hotel", "guide", "repas"]', true);

-- Paramètres système pour la configuration
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('partner_cinema_only_mode', 'false', 'boolean', 'partners', 'Mode cinéma uniquement activé'),
('active_partner_types', '["cinema", "beauty", "casino", "cruise", "limo", "pilgrimage"]', 'json', 'partners', 'Types de partenaires actifs'),
('viral_sponsorship_enabled', 'true', 'boolean', 'viral', 'Système de parrainage viral activé'),
('whatsapp_contact_import_enabled', 'true', 'boolean', 'viral', 'Import de contacts WhatsApp activé'),
('gamification_live_donations', 'true', 'boolean', 'gamification', 'Affichage des dons en live activé');

-- Table pour la configuration des partenaires avec checkboxes
CREATE TABLE partner_configuration (
    id BIGSERIAL PRIMARY KEY,
    partner_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    display_name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    icon_name VARCHAR(50),
    description TEXT,
    created_by_admin_id BIGINT NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT partner_configuration_partner_type_key UNIQUE (partner_type),
    CONSTRAINT partner_configuration_partner_type_check CHECK (partner_type IN ('cinema', 'beauty', 'casino', 'cruise', 'limo', 'pilgrimage'))
);

CREATE INDEX idx_partner_config_enabled ON partner_configuration USING btree (is_enabled);
CREATE INDEX idx_partner_config_order ON partner_configuration USING btree (display_order);

COMMENT ON TABLE partner_configuration IS 'Configuration des partenaires avec checkboxes pour activation/désactivation';

-- Table pour l'historique des modifications de configuration
CREATE TABLE partner_configuration_history (
    id BIGSERIAL PRIMARY KEY,
    partner_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    modified_by_admin_id BIGINT NOT NULL,
    modification_reason TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT partner_config_history_action_check CHECK (action IN ('enabled', 'disabled', 'updated', 'packages_modified'))
);

CREATE INDEX idx_partner_config_history_type ON partner_configuration_history USING btree (partner_type);
CREATE INDEX idx_partner_config_history_action ON partner_configuration_history USING btree (action);
CREATE INDEX idx_partner_config_history_time ON partner_configuration_history USING btree (create_time);

COMMENT ON TABLE partner_configuration_history IS 'Historique des modifications de configuration des partenaires';

-- Mise à jour de la table system_settings pour inclure la configuration globale
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS cinema_only_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enabled_partner_types JSONB DEFAULT '["cinema"]'::jsonb;

-- Données initiales pour la configuration des partenaires
INSERT INTO partner_configuration (partner_type, is_enabled, display_name, display_order, icon_name, description, created_by_admin_id) VALUES
('cinema', true, 'Cinéma', 1, 'film', 'Packages cinéma avec tickets et collations', 1),
('beauty', false, 'Beauté', 2, 'spa', 'Packages beauté avec soins et massages', 1),
('casino', false, 'Casino', 3, 'casino', 'Packages casino avec jetons et expériences', 1),
('cruise', false, 'Croisière', 4, 'ship', 'Packages croisière avec cabines et excursions', 1),
('limo', false, 'Limousine', 5, 'car', 'Packages limousine avec chauffeur privé', 1),
('pilgrimage', false, 'Pèlerinage', 6, 'place-of-worship', 'Packages pèlerinage avec hébergement et transport', 1);

-- Paramètres système pour le mode cinéma uniquement
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, created_by) VALUES
('cinema_only_mode', 'false', 'boolean', 'partner_management', 'Mode cinéma uniquement - désactive tous les autres partenaires', 1),
('enabled_partner_types', '["cinema"]', 'json', 'partner_management', 'Types de partenaires actuellement activés', 1)
ON CONFLICT (setting_key) DO NOTHING;

-- Données d'exemple pour les packages partenaires
INSERT INTO partner_packages (partner_id, package_name, package_type, description, detailed_description, min_tickets, max_tickets, includes_extras, price_per_unit, total_price, package_image_url, terms_conditions, validity_days, is_active, display_order) VALUES
(1, 'Pack Beauté Essentiel', 'beauty', 'Soin visage + manucure', 'Soin du visage complet avec nettoyage, gommage, masque et hydratation, suivi d''une manucure classique avec vernis au choix', 1, 1, '["soin_visage", "manucure", "vernis"]'::jsonb, 75.00, 75.00, 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400', 'Valable 12 mois, sur rendez-vous uniquement', 365, true, 1),
(1, 'Pack Beauté Premium', 'beauty', 'Soin visage + manucure + massage', 'Soin du visage premium avec masque anti-âge, manucure avec pose de vernis semi-permanent et massage relaxant de 60 minutes', 1, 1, '["soin_visage_premium", "manucure_semi_permanent", "massage_60min"]'::jsonb, 120.00, 120.00, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400', 'Valable 12 mois, sur rendez-vous uniquement', 365, true, 2),
(2, 'Pack Casino Découverte', 'casino', 'Jetons + boisson + buffet', 'Pack découverte avec 50€ de jetons, une boisson offerte et accès au buffet', 1, 1, '["jetons_50", "boisson", "buffet"]'::jsonb, 75.00, 75.00, 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400', 'Valable 6 mois, présentation obligatoire d''une pièce d''identité', 180, true, 1),
(2, 'Pack Casino VIP', 'casino', 'Jetons + repas + spectacle', 'Pack VIP avec 100€ de jetons, repas gastronomique et spectacle en soirée', 1, 1, '["jetons_100", "repas_gastronomique", "spectacle"]'::jsonb, 150.00, 150.00, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', 'Valable 6 mois, réservation obligatoire 48h à l''avance', 180, true, 2);

-- Table pour les services spécifiques de chaque package partenaire
CREATE TABLE partner_package_services (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    service_description TEXT,
    partner_name VARCHAR(100) NOT NULL,
    revenue_share_percentage NUMERIC(5,2) DEFAULT 50.00,
    service_price NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_package_services_package_id ON partner_package_services (package_id);
CREATE INDEX idx_package_services_active ON partner_package_services (is_active);

COMMENT ON TABLE partner_package_services IS 'Services spécifiques pour chaque package avec partenaires et pourcentages individuels';
COMMENT ON COLUMN partner_package_services.service_name IS 'Ex: Spa, Relooking, Lentilles de contact';
COMMENT ON COLUMN partner_package_services.partner_name IS 'Nom du partenaire spécifique pour ce service';
COMMENT ON COLUMN partner_package_services.revenue_share_percentage IS 'Pourcentage de revenus pour ce service spécifique';

-- Table pour l'historique des modifications de pourcentages
CREATE TABLE partner_service_revenue_history (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL,
    old_percentage NUMERIC(5,2),
    new_percentage NUMERIC(5,2),
    modified_by_admin_id BIGINT NOT NULL,
    modification_reason TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_revenue_history_service_id ON partner_service_revenue_history (service_id);
CREATE INDEX idx_service_revenue_history_time ON partner_service_revenue_history (create_time);

COMMENT ON TABLE partner_service_revenue_history IS 'Historique des modifications de pourcentages de revenus par service';

-- Table pour la configuration des sections d'administration
CREATE TABLE admin_section_configuration (
    id BIGSERIAL PRIMARY KEY,
    section_name VARCHAR(100) NOT NULL UNIQUE,
    section_type VARCHAR(50) NOT NULL,
    parent_section_id BIGINT,
    display_name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    access_level VARCHAR(50) DEFAULT 'admin',
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_section_type_check CHECK (section_type IN ('main', 'subsection', 'function')),
    CONSTRAINT admin_access_level_check CHECK (access_level IN ('admin', 'superadmin_only', 'dev_only', 'superadmin_dev_only'))
);

CREATE INDEX idx_admin_sections_type ON admin_section_configuration (section_type);
CREATE INDEX idx_admin_sections_parent ON admin_section_configuration (parent_section_id);
CREATE INDEX idx_admin_sections_active ON admin_section_configuration (is_active);

COMMENT ON TABLE admin_section_configuration IS 'Configuration des sections et sous-sections d''administration';

-- Table pour les données serveur (sous-section du superadmin)
CREATE TABLE server_monitoring_data (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value TEXT NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    measurement_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    alert_threshold NUMERIC(10,2),
    is_critical BOOLEAN DEFAULT false,
    additional_data JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT server_metric_category_check CHECK (metric_category IN ('cpu', 'memory', 'disk', 'network', 'database', 'application'))
);

CREATE INDEX idx_server_monitoring_category ON server_monitoring_data (metric_category);
CREATE INDEX idx_server_monitoring_timestamp ON server_monitoring_data (measurement_timestamp);
CREATE INDEX idx_server_monitoring_critical ON server_monitoring_data (is_critical);

COMMENT ON TABLE server_monitoring_data IS 'Données de monitoring serveur pour la sous-section superadmin';

-- Insertion des données de configuration des sections
INSERT INTO admin_section_configuration (section_name, section_type, display_name, display_order, icon_name, access_level) VALUES
('page_invite_visiteur', 'main', 'Page Invité/Visiteur', 1, 'users', 'admin'),
('dashboard_proprietaire', 'main', 'Dashboard Propriétaire', 2, 'dashboard', 'admin'),
('page_utilisateur', 'main', 'Page Utilisateur', 3, 'user', 'admin'),
('creer_cagnotte', 'main', 'Créer une cagnotte', 4, 'gift', 'admin'),
('page_demonstration', 'main', 'Page de démonstration', 5, 'play', 'admin'),
('dev_admin', 'main', 'Dev Admin', 6, 'settings', 'superadmin_dev_only'),
('superadmin_dashboard', 'main', 'Super Admin Dashboard', 7, 'shield', 'superadmin_only');

-- Sous-sections pour Dev Admin
INSERT INTO admin_section_configuration (section_name, section_type, parent_section_id, display_name, display_order, icon_name, access_level) VALUES
('video_management', 'subsection', (SELECT id FROM admin_section_configuration WHERE section_name = 'dev_admin'), 'Gestion Vidéo', 1, 'video', 'superadmin_dev_only'),
('partner_management', 'subsection', (SELECT id FROM admin_section_configuration WHERE section_name = 'dev_admin'), 'Gestion Partenaires', 2, 'handshake', 'superadmin_dev_only'),
('system_configuration', 'subsection', (SELECT id FROM admin_section_configuration WHERE section_name = 'dev_admin'), 'Configuration Système', 3, 'cog', 'superadmin_dev_only');

-- Sous-sections pour Super Admin
INSERT INTO admin_section_configuration (section_name, section_type, parent_section_id, display_name, display_order, icon_name, access_level) VALUES
('server_monitoring', 'subsection', (SELECT id FROM admin_section_configuration WHERE section_name = 'superadmin_dashboard'), 'Données Serveur', 1, 'server', 'superadmin_only'),
('analytics_dashboard', 'subsection', (SELECT id FROM admin_section_configuration WHERE section_name = 'superadmin_dashboard'), 'Analytics', 2, 'chart', 'superadmin_only'),
('user_management', 'subsection', (SELECT id FROM admin_section_configuration WHERE section_name = 'superadmin_dashboard'), 'Gestion Utilisateurs', 3, 'users', 'superadmin_only');

-- Exemples de services pour Package Beauté
INSERT INTO partner_package_services (package_id, service_name, service_description, partner_name, revenue_share_percentage, service_price) VALUES
(1, 'Spa Premium', 'Soin visage complet + massage relaxant 90 minutes', 'Spa Wellness Center', 45.00, 150.00),
(1, 'Relooking Complet', 'Consultation style + shopping accompagné + coiffure', 'Style & Beauty Studio', 40.00, 200.00),
(1, 'Lentilles de Contact', 'Examen vue + lentilles mensuelles premium', 'Optic Vision Plus', 35.00, 80.00),
(1, 'Manucure Française', 'Soin des ongles + pose vernis semi-permanent', 'Nail Art Boutique', 50.00, 60.00),
(1, 'Massage Thérapeutique', 'Massage dos et nuque 60 minutes', 'Zen Therapy Center', 42.00, 90.00);

-- Exemples de services pour Package Casino
INSERT INTO partner_package_services (package_id, service_name, service_description, partner_name, revenue_share_percentage, service_price) VALUES
(2, 'Soirée VIP Casino', 'Accès salon privé + jetons offerts + cocktails', 'Casino Royal Dakar', 30.00, 300.00),
(2, 'Tournoi Poker', 'Participation tournoi + coaching + repas', 'Poker Club Elite', 35.00, 250.00),
(2, 'Machine à Sous Premium', 'Crédits bonus + accès machines VIP', 'Gaming Palace', 25.00, 100.00);

-- Exemples de services pour Package Croisière
INSERT INTO partner_package_services (package_id, service_name, service_description, partner_name, revenue_share_percentage, service_price) VALUES
(3, 'Croisière Îles du Saloum', 'Weekend 2 jours/1 nuit tout compris', 'Saloum Cruise Line', 40.00, 400.00),
(3, 'Excursion Gorée', 'Journée complète avec guide + repas', 'Heritage Tours', 45.00, 120.00),
(3, 'Croisière Sunset', 'Soirée romantique avec dîner aux chandelles', 'Romantic Cruises', 38.00, 180.00);

-- Données de monitoring serveur exemples
INSERT INTO server_monitoring_data (metric_name, metric_value, metric_category, alert_threshold, is_critical) VALUES
('CPU Usage', '75%', 'cpu', 85.00, false),
('Memory Usage', '68%', 'memory', 80.00, false),
('Disk Space', '45%', 'disk', 90.00, false),
('Database Connections', '120', 'database', 200.00, false),
('Response Time', '250ms', 'application', 500.00, false),
('Network Bandwidth', '2.5 Gbps', 'network', 8.00, false),
('Active Users', '1,247', 'application', 5000.00, false),
('Error Rate', '0.02%', 'application', 1.00, false);

-- Table pour gérer l'activation/désactivation des partenaires sur le site
CREATE TABLE partner_site_activation (
    id BIGSERIAL PRIMARY KEY,
    partner_type VARCHAR(50) NOT NULL UNIQUE,
    is_active_on_site BOOLEAN DEFAULT false,
    display_name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    icon_name VARCHAR(50),
    activation_date TIMESTAMP WITH TIME ZONE,
    deactivation_date TIMESTAMP WITH TIME ZONE,
    modified_by_admin_id BIGINT NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT partner_site_activation_partner_type_check 
        CHECK (partner_type IN ('cinema', 'beauty', 'casino', 'cruise', 'limo', 'pilgrimage'))
);

CREATE INDEX idx_partner_site_activation_active ON partner_site_activation(is_active_on_site);
CREATE INDEX idx_partner_site_activation_order ON partner_site_activation(display_order);

COMMENT ON TABLE partner_site_activation IS 'Gestion de l''activation des partenaires sur le site avec checkboxes';

-- Amélioration de la table partner_package_services pour une édition complète
ALTER TABLE partner_package_services ADD COLUMN IF NOT EXISTS service_category VARCHAR(50);
ALTER TABLE partner_package_services ADD COLUMN IF NOT EXISTS service_duration_minutes INTEGER;
ALTER TABLE partner_package_services ADD COLUMN IF NOT EXISTS service_location VARCHAR(200);
ALTER TABLE partner_package_services ADD COLUMN IF NOT EXISTS service_terms TEXT;
ALTER TABLE partner_package_services ADD COLUMN IF NOT EXISTS service_image_url TEXT;
ALTER TABLE partner_package_services ADD COLUMN IF NOT EXISTS modified_by_admin_id BIGINT;

-- Table pour l'historique des modifications des services
CREATE TABLE partner_service_edit_history (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    modified_by_admin_id BIGINT NOT NULL,
    modification_reason TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_edit_history_service_id ON partner_service_edit_history(service_id);
CREATE INDEX idx_service_edit_history_time ON partner_service_edit_history(create_time);

COMMENT ON TABLE partner_service_edit_history IS 'Historique détaillé des modifications des services par les administrateurs';

-- Table pour les boutons fonctionnels de l'interface partenaires
CREATE TABLE partner_management_functions (
    id BIGSERIAL PRIMARY KEY,
    function_name VARCHAR(100) NOT NULL UNIQUE,
    function_category VARCHAR(50) NOT NULL,
    button_label VARCHAR(100) NOT NULL,
    button_color VARCHAR(20) DEFAULT 'primary',
    icon_name VARCHAR(50),
    endpoint_url VARCHAR(200),
    required_permissions JSONB DEFAULT '["admin"]',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT partner_functions_category_check 
        CHECK (function_category IN ('partner_management', 'service_editing', 'analytics', 'reporting', 'configuration'))
);

CREATE INDEX idx_partner_functions_category ON partner_management_functions(function_category);
CREATE INDEX idx_partner_functions_active ON partner_management_functions(is_active);

COMMENT ON TABLE partner_management_functions IS 'Fonctions et boutons disponibles dans l''interface de gestion des partenaires';

-- Données initiales pour l'activation des partenaires
INSERT INTO partner_site_activation (partner_type, is_active_on_site, display_name, display_order, icon_name, modified_by_admin_id) VALUES
('cinema', true, 'Cinéma', 1, 'film', 1),
('beauty', false, 'Beauté', 2, 'sparkles', 1),
('casino', false, 'Casino', 3, 'dice', 1),
('cruise', false, 'Croisière', 4, 'ship', 1),
('limo', false, 'Limousine', 5, 'car', 1),
('pilgrimage', false, 'Pèlerinage', 6, 'mosque', 1);

-- Données initiales pour les fonctions de gestion des partenaires
INSERT INTO partner_management_functions (function_name, function_category, button_label, button_color, icon_name, endpoint_url, display_order) VALUES
('add_new_service', 'service_editing', 'Ajouter Service', 'success', 'plus', '/admin/partners/services/add', 1),
('edit_service', 'service_editing', 'Modifier Service', 'warning', 'edit', '/admin/partners/services/edit', 2),
('delete_service', 'service_editing', 'Supprimer Service', 'danger', 'trash', '/admin/partners/services/delete', 3),
('view_service_history', 'service_editing', 'Historique', 'info', 'history', '/admin/partners/services/history', 4),
('activate_partner', 'partner_management', 'Activer Partenaire', 'success', 'check', '/admin/partners/activate', 5),
('deactivate_partner', 'partner_management', 'Désactiver Partenaire', 'secondary', 'x', '/admin/partners/deactivate', 6),
('partner_analytics', 'analytics', 'Analytics Partenaire', 'primary', 'chart-bar', '/admin/partners/analytics', 7),
('export_partner_data', 'reporting', 'Exporter Données', 'info', 'download', '/admin/partners/export', 8),
('partner_settings', 'configuration', 'Paramètres', 'secondary', 'settings', '/admin/partners/settings', 9);

-- Exemples de services pour les packages beauté
INSERT INTO partner_package_services (package_id, service_name, service_description, partner_name, revenue_share_percentage, service_price, service_category, service_duration_minutes, service_location, display_order) VALUES
(1, 'Spa Relaxation', 'Séance de spa complète avec massage et soins du visage', 'Spa Wellness Center', 45.00, 85000, 'spa', 120, 'Centre Ville Dakar', 1),
(1, 'Relooking Complet', 'Consultation style, coiffure et maquillage professionnel', 'Style & Beauty Studio', 40.00, 65000, 'beauty', 180, 'Plateau Dakar', 2),
(1, 'Lentilles de Contact', 'Consultation ophtalmologique et lentilles premium', 'Vision Plus Optique', 35.00, 45000, 'optical', 60, 'Almadies Dakar', 3);

-- Restructuration complète du système de partenaires pour une gestion hiérarchique intuitive

-- Table des catégories de packs (niveau supérieur)
CREATE TABLE partner_pack_categories (
    id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_type VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by_admin_id BIGINT NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT partner_pack_categories_type_check 
    CHECK (category_type IN ('cinema', 'beauty', 'casino', 'limousine', 'cruise', 'children', 'pilgrimage'))
);

CREATE INDEX idx_pack_categories_type ON partner_pack_categories(category_type);
CREATE INDEX idx_pack_categories_active ON partner_pack_categories(is_active);
CREATE INDEX idx_pack_categories_order ON partner_pack_categories(display_order);

COMMENT ON TABLE partner_pack_categories IS 'Catégories principales de packs partenaires (Cinéma, Beauté, Casino, etc.)';

-- Table des services individuels dans chaque catégorie
CREATE TABLE partner_services (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    service_description TEXT,
    partner_company_name VARCHAR(100) NOT NULL,
    partner_contact_person VARCHAR(100),
    partner_email VARCHAR(255),
    partner_phone VARCHAR(20),
    revenue_share_percentage NUMERIC(5,2) DEFAULT 50.00,
    service_price NUMERIC(10,2),
    service_duration_minutes INTEGER,
    service_location VARCHAR(200),
    service_terms TEXT,
    service_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by_admin_id BIGINT NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_partner_services_category ON partner_services(category_id);
CREATE INDEX idx_partner_services_active ON partner_services(is_active);
CREATE INDEX idx_partner_services_partner ON partner_services(partner_company_name);
CREATE INDEX idx_partner_services_order ON partner_services(category_id, display_order);

COMMENT ON TABLE partner_services IS 'Services individuels avec leurs partenaires spécifiques dans chaque catégorie';
COMMENT ON COLUMN partner_services.service_name IS 'Ex: Spa, Relooking, Lentilles, Coiffure';
COMMENT ON COLUMN partner_services.partner_company_name IS 'Nom de l''entreprise partenaire pour ce service spécifique';
COMMENT ON COLUMN partner_services.revenue_share_percentage IS 'Pourcentage spécifique à ce service/partenaire';

-- Historique des modifications des services
CREATE TABLE partner_service_modifications (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL,
    modification_type VARCHAR(50) NOT NULL,
    field_modified VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    modified_by_admin_id BIGINT NOT NULL,
    modification_reason TEXT,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT service_modifications_type_check 
    CHECK (modification_type IN ('created', 'updated', 'activated', 'deactivated', 'percentage_changed', 'partner_changed'))
);

CREATE INDEX idx_service_modifications_service ON partner_service_modifications(service_id);
CREATE INDEX idx_service_modifications_type ON partner_service_modifications(modification_type);
CREATE INDEX idx_service_modifications_time ON partner_service_modifications(create_time);

COMMENT ON TABLE partner_service_modifications IS 'Historique détaillé des modifications des services partenaires';

-- Table pour les rapports PDF générés
CREATE TABLE partner_reports_pdf (
    id BIGSERIAL PRIMARY KEY,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    category_id BIGINT,
    service_id BIGINT,
    report_period_start DATE,
    report_period_end DATE,
    pdf_file_path TEXT NOT NULL,
    pdf_file_size BIGINT,
    generated_by_admin_id BIGINT NOT NULL,
    generation_parameters JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT partner_reports_type_check 
    CHECK (report_type IN ('category_summary', 'service_detail', 'revenue_analysis', 'partner_performance', 'complete_overview'))
);

CREATE INDEX idx_partner_reports_type ON partner_reports_pdf(report_type);
CREATE INDEX idx_partner_reports_category ON partner_reports_pdf(category_id);
CREATE INDEX idx_partner_reports_service ON partner_reports_pdf(service_id);
CREATE INDEX idx_partner_reports_period ON partner_reports_pdf(report_period_start, report_period_end);

COMMENT ON TABLE partner_reports_pdf IS 'Rapports PDF générés pour la gestion des partenaires (format humain, pas JSON)';

-- Configuration des fonctions de gestion
CREATE TABLE partner_management_actions (
    id BIGSERIAL PRIMARY KEY,
    action_name VARCHAR(100) NOT NULL UNIQUE,
    action_category VARCHAR(50) NOT NULL,
    button_label VARCHAR(100) NOT NULL,
    button_color VARCHAR(20) DEFAULT 'primary',
    icon_name VARCHAR(50),
    tooltip_text VARCHAR(200),
    endpoint_url VARCHAR(200),
    required_permissions JSONB DEFAULT '["admin"]',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT partner_actions_category_check 
    CHECK (action_category IN ('category_management', 'service_editing', 'partner_contact', 'reporting', 'analytics'))
);

CREATE INDEX idx_partner_actions_category ON partner_management_actions(action_category);
CREATE INDEX idx_partner_actions_active ON partner_management_actions(is_active);

COMMENT ON TABLE partner_management_actions IS 'Actions et boutons disponibles dans l''interface de gestion avec tooltips explicatifs';

-- Données d'exemple pour les catégories
INSERT INTO partner_pack_categories (category_name, category_type, display_name, description, icon_name, display_order, created_by_admin_id) VALUES
('cinema', 'cinema', 'Cinéma', 'Partenaires cinémas et salles de projection', 'film', 1, 1),
('beauty', 'beauty', 'Pack Beauté', 'Services de beauté et bien-être', 'sparkles', 2, 1),
('casino', 'casino', 'Pack Casino', 'Services de divertissement et jeux', 'dice', 3, 1),
('limousine', 'limousine', 'Pack Limousine', 'Services de transport de luxe', 'car', 4, 1),
('cruise', 'cruise', 'Pack Croisière', 'Services de voyage et croisières', 'ship', 5, 1),
('children', 'children', 'Pack Enfants', 'Services dédiés aux enfants', 'baby', 6, 1),
('pilgrimage', 'pilgrimage', 'Pack Pèlerinage', 'Services de voyage spirituel', 'mosque', 7, 1);

-- Données d'exemple pour les services (Pack Beauté)
INSERT INTO partner_services (category_id, service_name, service_description, partner_company_name, partner_contact_person, partner_email, revenue_share_percentage, service_price, display_order, created_by_admin_id) VALUES
(2, 'Spa Relaxation', 'Séance de spa complète avec massage et soins', 'Wellness Center Dakar', 'Fatou Diop', 'fatou@wellnesscenter.sn', 15.00, 45000, 1, 1),
(2, 'Lentilles de Contact', 'Consultation et fourniture de lentilles', 'Vision Plus Optique', 'Mamadou Sall', 'mamadou@visionplus.sn', 20.00, 25000, 2, 1),
(2, 'Relooking Complet', 'Conseil en image et relooking personnalisé', 'Style Studio', 'Aïcha Ndiaye', 'aicha@stylestudio.sn', 12.00, 75000, 3, 1),
(2, 'Coiffure & Styling', 'Coupe, coiffure et styling professionnel', 'Hair Expert Salon', 'Ousmane Ba', 'ousmane@hairexpert.sn', 18.00, 35000, 4, 1);

-- Données d'exemple pour les services (Cinéma)
INSERT INTO partner_services (category_id, service_name, service_description, partner_company_name, partner_contact_person, partner_email, revenue_share_percentage, service_price, display_order, created_by_admin_id) VALUES
(1, 'Cinéma Liberté', 'Séances de cinéma avec formules diverses', 'Cinéma Liberté', 'Ibrahima Sarr', 'contact@cinemaliberte.sn', 50.00, 3500, 1, 1),
(1, 'Pathé Almadies', 'Complexe cinématographique moderne', 'Pathé Cinémas', 'Marie Dupont', 'marie@pathe.sn', 45.00, 4500, 2, 1),
(1, 'Canal Olympia', 'Salle de spectacle et cinéma', 'Canal Olympia', 'Cheikh Diallo', 'cheikh@canalolympia.sn', 40.00, 5000, 3, 1);

-- Actions de gestion avec tooltips
INSERT INTO partner_management_actions (action_name, action_category, button_label, button_color, icon_name, tooltip_text, display_order) VALUES
('create_service', 'service_editing', 'Ajouter Service', 'success', 'plus', 'Créer un nouveau service dans cette catégorie', 1),
('edit_service', 'service_editing', 'Modifier', 'primary', 'edit', 'Modifier les détails de ce service', 2),
('edit_percentage', 'service_editing', 'Ajuster %', 'warning', 'percentage', 'Modifier le pourcentage de revenus', 3),
('contact_partner', 'partner_contact', 'Contacter', 'info', 'phone', 'Contacter le partenaire de ce service', 4),
('view_analytics', 'analytics', 'Statistiques', 'secondary', 'chart-bar', 'Voir les performances de ce service', 5),
('generate_report', 'reporting', 'Rapport PDF', 'danger', 'file-pdf', 'Générer un rapport PDF détaillé', 6),
('toggle_status', 'service_editing', 'Activer/Désactiver', 'dark', 'toggle-on', 'Activer ou désactiver ce service', 7);
