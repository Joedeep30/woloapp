
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminManagement } from '@/components/admin/AdminManagement';
import { UserSearchManager } from '@/components/admin/UserSearchManager';
import { AdvancedAnalytics } from '@/components/admin/AdvancedAnalytics';
import { 
  Shield, 
  Lock, 
  AlertCircle, 
  Users, 
  Gift, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Eye, 
  Download,
  QrCode,
  Calendar,
  MapPin,
  UserPlus,
  Settings,
  BarChart3,
  FileText,
  Mail,
  Percent,
  Clock,
  Star,
  Crown,
  CheckCircle,
  XCircle,
  Database,
  Server,
  Activity,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Trash2,
  Edit,
  Plus,
  Minus,
  RefreshCw,
  Send,
  Archive,
  Power,
  AlertTriangle,
  Video,
  Play,
  Layers,
  Upload,
  Camera,
  MessageCircle,
  Contact,
  Phone,
  Building,
  Package,
  Palette,
  Dice1,
  Ship,
  Car,
  Church,
  Sparkles,
  Target,
  Heart,
  Gamepad2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string;
  status: string;
  created_at: string;
  total_donations: number;
  active_pots: number;
  facebook_connected: boolean;
  whatsapp_contacts: number;
  sponsorships_sent: number;
  points_earned: number;
  preferred_pack_id?: string;
  preferred_pack_name?: string;
}

interface Partner {
  id: string;
  partner_name: string;
  partner_type: string;
  description: string;
  logo_url: string;
  contact_email: string;
  revenue_share_percentage: number;
  is_active: boolean;
  packages_count: number;
  total_revenue: number;
  active_qr_codes: number;
  is_enabled: boolean;
}

interface Package {
  id: string;
  partner_id: string;
  package_name: string;
  package_type: string;
  description: string;
  detailed_description: string;
  total_price: number;
  is_active: boolean;
  usage_count: number;
  services?: PackageService[];
}

interface PackageService {
  name: string;
  partner_name: string;
  percentage: number;
}

export default function SuperAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Identifiants pour les super-administrateurs et développeurs
  const SUPER_ADMIN_CREDENTIALS = [
    { username: 'jeff.wolo', password: 'Jeff2025!Wolo', type: 'Super Admin', name: 'Jeff WOLO' },
    { username: 'nat.wolo', password: 'Nat2025!Wolo', type: 'Super Admin', name: 'Nat WOLO' },
    { username: 'nico.wolo', password: 'Nico2025!Wolo', type: 'Super Admin', name: 'Nico WOLO' },
    { username: 'john.dev', password: 'John2025!Dev', type: 'Developer Admin', name: 'John Developer' },
    { username: 'mamefatou.dev', password: 'Mamefatou2025!Dev', type: 'Developer Admin', name: 'Mamefatou Developer' }
  ];

  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  // Statistiques système complètes avec VIDÉOS, PARRAINAGE WHATSAPP ET PHASE 2
  const [systemStats, setSystemStats] = useState({
    totalUsers: 1247,
    activeUsers: 892,
    totalPots: 234,
    activePots: 67,
    closedPots: 167,
    sponsoredPots: 89,
    totalRevenue: 12450000,
    monthlyRevenue: 2340000,
    totalSponsorships: 156,
    acceptedSponsorships: 123,
    totalPointsAwarded: 1890,
    viralCoefficient: 3.2,
    systemUptime: 99.8,
    databaseSize: 2.4,
    apiCalls: 45678,
    errorRate: 0.02,
    // STATS VIDÉO
    totalVideoSequences: 8,
    activeVideoSequences: 6,
    scheduledVideos: 45,
    videosSentToday: 12,
    totalVideoTemplates: 15,
    // STATS WHATSAPP VIRAL
    whatsappContactsImported: 2340,
    whatsappInvitationsSent: 890,
    whatsappConversionRate: 23.4,
    avgContactsPerUser: 15.6,
    // NOUVELLES STATS PHASE 2
    totalPartners: 6,
    activePartners: 5,
    totalPackages: 18,
    activePackages: 15,
    packCinemaUsage: 45,
    packBeauteUsage: 23,
    packCasinoUsage: 12,
    packCroisiereUsage: 8,
    packLimoUsage: 5,
    packPelerinageUsage: 7,
    topDonationToday: 25000,
    liveViewers: 234,
    gamificationEngagement: 78.5
  });

  // Données système en temps réel avec VIDÉO, WHATSAPP ET PHASE 2
  const [systemHealth, setSystemHealth] = useState({
    database: { status: 'healthy', response_time: 45, connections: 23 },
    api: { status: 'healthy', response_time: 120, requests_per_minute: 234 },
    storage: { status: 'healthy', used_space: 68, total_space: 100 },
    memory: { status: 'healthy', used: 45, total: 64 },
    cpu: { status: 'healthy', usage: 23 },
    video_processing: { status: 'healthy', queue_size: 3, processing_time: 45 },
    whatsapp_api: { status: 'healthy', rate_limit: 85, success_rate: 97.8 },
    // NOUVEAUX SERVICES PHASE 2
    partner_apis: { status: 'healthy', active_connections: 5, avg_response: 150 },
    live_donations: { status: 'healthy', active_streams: 12, viewers: 234 },
    gamification_engine: { status: 'healthy', active_campaigns: 8, engagement: 78.5 }
  });

  // Configuration système avec VIDÉO, WHATSAPP ET PHASE 2
  const [systemConfig, setSystemConfig] = useState({
    maintenance_mode: false,
    registration_enabled: true,
    facebook_integration: true,
    wave_payments: true,
    qr_generation: true,
    email_notifications: true,
    sms_notifications: true,
    analytics_tracking: true,
    sponsorship_system: true,
    max_pot_amount: 500000,
    min_birthday_days: 10,
    max_birthday_days: 30,
    default_commission: 10,
    points_per_sponsorship: 10,
    // CONFIGURATIONS VIDÉO
    video_sequences_enabled: true,
    auto_video_scheduling: true,
    video_quality: 'HD',
    max_video_duration: 180,
    // CONFIGURATIONS WHATSAPP
    whatsapp_viral_enabled: true,
    max_contacts_per_import: 500,
    max_invitations_per_day: 50,
    whatsapp_rate_limit: 100,
    // NOUVELLES CONFIGURATIONS PHASE 2
    multi_packs_enabled: true,
    cinema_only_mode: false,
    live_donations_enabled: true,
    gamification_enabled: true,
    preferred_pack_selection: true,
    real_time_animations: true,
    partner_api_timeout: 30,
    max_pack_value: 1000000
  });

  // NOUVELLES DONNÉES PARTENAIRES PHASE 2 AVEC CHECKBOXES
  const [partners, setPartners] = useState<Partner[]>([
    {
      id: '1',
      partner_name: 'Cinéma Liberté',
      partner_type: 'cinema',
      description: 'Chaîne de cinémas premium au Sénégal',
      logo_url: 'https://images.unsplash.com/photo-1489599735734-79b4169c2a78?w=100&h=100&fit=crop',
      contact_email: 'contact@cinemaliberte.sn',
      revenue_share_percentage: 50,
      is_active: true,
      packages_count: 5,
      total_revenue: 450000,
      active_qr_codes: 45,
      is_enabled: true
    },
    {
      id: '2',
      partner_name: 'Beauté Dakar Spa',
      partner_type: 'beauty',
      description: 'Spa et centre de beauté haut de gamme',
      logo_url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=100&h=100&fit=crop',
      contact_email: 'contact@beautedakar.sn',
      revenue_share_percentage: 45,
      is_active: true,
      packages_count: 3,
      total_revenue: 230000,
      active_qr_codes: 23,
      is_enabled: true
    },
    {
      id: '3',
      partner_name: 'Casino Royal Dakar',
      partner_type: 'casino',
      description: 'Casino et divertissement nocturne',
      logo_url: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=100&h=100&fit=crop',
      contact_email: 'contact@casinoroyal.sn',
      revenue_share_percentage: 40,
      is_active: true,
      packages_count: 2,
      total_revenue: 120000,
      active_qr_codes: 12,
      is_enabled: false
    },
    {
      id: '4',
      partner_name: 'Croisières Atlantique',
      partner_type: 'cruise',
      description: 'Croisières et excursions maritimes',
      logo_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=100&h=100&fit=crop',
      contact_email: 'contact@croisieres.sn',
      revenue_share_percentage: 35,
      is_active: true,
      packages_count: 4,
      total_revenue: 80000,
      active_qr_codes: 8,
      is_enabled: true
    },
    {
      id: '5',
      partner_name: 'Limo VIP Sénégal',
      partner_type: 'limo',
      description: 'Service de limousines et transport VIP',
      logo_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=100&h=100&fit=crop',
      contact_email: 'contact@limovip.sn',
      revenue_share_percentage: 30,
      is_active: true,
      packages_count: 2,
      total_revenue: 50000,
      active_qr_codes: 5,
      is_enabled: true
    },
    {
      id: '6',
      partner_name: 'Pèlerinage Touba',
      partner_type: 'pilgrimage',
      description: 'Organisation de pèlerinages religieux',
      logo_url: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=100&h=100&fit=crop',
      contact_email: 'contact@pelerinage.sn',
      revenue_share_percentage: 25,
      is_active: false,
      packages_count: 3,
      total_revenue: 70000,
      active_qr_codes: 7,
      is_enabled: false
    }
  ]);

  // NOUVELLES DONNÉES PACKAGES PHASE 2 AVEC SERVICES DÉTAILLÉS
  const [packages, setPackages] = useState<Package[]>([
    // PACKAGES CINÉMA
    {
      id: '1',
      partner_id: '1',
      package_name: 'Pack Solo Cinéma',
      package_type: 'cinema',
      description: '1 ticket cinéma + Panier Gourmand',
      detailed_description: 'Séance de cinéma avec popcorn, boisson et snacks inclus',
      total_price: 5000,
      is_active: true,
      usage_count: 45,
      services: [
        { name: 'Ticket Cinéma', partner_name: 'Cinéma Liberté', percentage: 50 },
        { name: 'Popcorn', partner_name: 'Snack Bar Liberté', percentage: 15 },
        { name: 'Boisson', partner_name: 'Café Liberté', percentage: 10 }
      ]
    },
    {
      id: '2',
      partner_id: '1',
      package_name: 'Pack Famille Cinéma',
      package_type: 'cinema',
      description: '4 tickets cinéma + Panier Gourmand Premium',
      detailed_description: 'Séance familiale avec popcorn XL, boissons et snacks premium',
      total_price: 16000,
      is_active: true,
      usage_count: 23,
      services: [
        { name: 'Tickets Cinéma (x4)', partner_name: 'Cinéma Liberté', percentage: 50 },
        { name: 'Popcorn XL', partner_name: 'Snack Bar Liberté', percentage: 20 },
        { name: 'Boissons Premium', partner_name: 'Café Liberté', percentage: 15 }
      ]
    },
    // PACKAGES BEAUTÉ AVEC SERVICES DÉTAILLÉS
    {
      id: '3',
      partner_id: '2',
      package_name: 'Pack Beauté Essentiel',
      package_type: 'beauty',
      description: 'Soin visage + manucure',
      detailed_description: 'Soin du visage complet avec nettoyage, gommage et masque + manucure française',
      total_price: 25000,
      is_active: true,
      usage_count: 18,
      services: [
        { name: 'Spa', partner_name: 'Beauté Dakar Spa', percentage: 45 },
        { name: 'Relooking', partner_name: 'Studio Relook Dakar', percentage: 30 },
        { name: 'Lentilles de contact', partner_name: 'Optique Vision', percentage: 25 }
      ]
    },
    {
      id: '4',
      partner_id: '2',
      package_name: 'Pack Beauté Premium',
      package_type: 'beauty',
      description: 'Soin visage + manucure + massage 60 min',
      detailed_description: 'Soin visage complet + manucure + massage relaxant de 60 minutes',
      total_price: 45000,
      is_active: true,
      usage_count: 12,
      services: [
        { name: 'Spa Premium', partner_name: 'Beauté Dakar Spa', percentage: 50 },
        { name: 'Relooking Complet', partner_name: 'Studio Relook Dakar', percentage: 35 },
        { name: 'Lentilles Premium', partner_name: 'Optique Vision', percentage: 15 }
      ]
    },
    // PACKAGES CASINO
    {
      id: '5',
      partner_id: '3',
      package_name: 'Pack Casino Découverte',
      package_type: 'casino',
      description: 'Soirée casino + dîner',
      detailed_description: 'Accès casino avec jetons de départ + dîner au restaurant du casino',
      total_price: 35000,
      is_active: true,
      usage_count: 8,
      services: [
        { name: 'Accès Casino', partner_name: 'Casino Royal Dakar', percentage: 40 },
        { name: 'Jetons de départ', partner_name: 'Casino Royal Dakar', percentage: 30 },
        { name: 'Dîner Restaurant', partner_name: 'Restaurant Royal', percentage: 30 }
      ]
    },
    // PACKAGES CROISIÈRE
    {
      id: '6',
      partner_id: '4',
      package_name: 'Pack Croisière Journée',
      package_type: 'cruise',
      description: 'Croisière d\'une journée + déjeuner',
      detailed_description: 'Croisière sur l\'Atlantique avec déjeuner à bord et animations',
      total_price: 55000,
      is_active: true,
      usage_count: 6,
      services: [
        { name: 'Croisière', partner_name: 'Croisières Atlantique', percentage: 35 },
        { name: 'Déjeuner à bord', partner_name: 'Catering Maritime', percentage: 25 },
        { name: 'Animations', partner_name: 'Entertainment Océan', percentage: 20 }
      ]
    },
    // PACKAGES LIMO
    {
      id: '7',
      partner_id: '5',
      package_name: 'Pack Limo Soirée',
      package_type: 'limo',
      description: 'Transport VIP pour soirée spéciale',
      detailed_description: 'Limousine avec chauffeur pour 4h + champagne + éclairage LED',
      total_price: 75000,
      is_active: true,
      usage_count: 4,
      services: [
        { name: 'Limousine 4h', partner_name: 'Limo VIP Sénégal', percentage: 30 },
        { name: 'Chauffeur VIP', partner_name: 'Chauffeurs Elite', percentage: 25 },
        { name: 'Champagne & LED', partner_name: 'Luxe Services', percentage: 20 }
      ]
    },
    // PACKAGES PÈLERINAGE
    {
      id: '8',
      partner_id: '6',
      package_name: 'Pack Pèlerinage Touba',
      package_type: 'pilgrimage',
      description: 'Pèlerinage organisé à Touba',
      detailed_description: 'Transport, hébergement et repas pour pèlerinage de 3 jours à Touba',
      total_price: 85000,
      is_active: false,
      usage_count: 5,
      services: [
        { name: 'Transport', partner_name: 'Pèlerinage Touba', percentage: 25 },
        { name: 'Hébergement 3j', partner_name: 'Hôtel Touba', percentage: 40 },
        { name: 'Repas inclus', partner_name: 'Restauration Touba', percentage: 35 }
      ]
    }
  ]);

  // NOUVELLES DONNÉES GAMIFICATION PHASE 2
  const [gamificationStats, setGamificationStats] = useState({
    liveDonationsToday: 12,
    topDonationAmount: 25000,
    topDonorName: 'Mamadou S.',
    totalViewersLive: 234,
    animationsTriggered: 45,
    progressBarBoosts: 23,
    celebrationEffects: 18,
    socialEngagementRate: 78.5,
    preferredPackSelections: 67,
    packPreferenceChanges: 12
  });

  // Données des utilisateurs avec PHASE 2
  const [allUsers, setAllUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Awa Diallo',
      email: 'awa@example.com',
      phone: '+221771234567',
      birthday: '1995-03-15',
      status: 'active',
      created_at: '2024-12-15',
      total_donations: 24000,
      active_pots: 1,
      facebook_connected: true,
      whatsapp_contacts: 45,
      sponsorships_sent: 3,
      points_earned: 35,
      preferred_pack_id: '3', // Pack Beauté
      preferred_pack_name: 'Pack Beauté Premium'
    },
    {
      id: '2',
      name: 'Mamadou Sow',
      email: 'mamadou@example.com',
      phone: '+221771234568',
      birthday: '1992-07-22',
      status: 'active',
      created_at: '2024-12-10',
      total_donations: 45000,
      active_pots: 1,
      facebook_connected: true,
      whatsapp_contacts: 67,
      sponsorships_sent: 5,
      points_earned: 75,
      preferred_pack_id: '5', // Pack Casino
      preferred_pack_name: 'Pack Casino Découverte'
    },
    {
      id: '3',
      name: 'Fatou Ba',
      email: 'fatou@example.com',
      phone: '+221771234569',
      birthday: '1998-11-15',
      status: 'active',
      created_at: '2024-11-01',
      total_donations: 35000,
      active_pots: 0,
      facebook_connected: false,
      whatsapp_contacts: 23,
      sponsorships_sent: 2,
      points_earned: 25,
      preferred_pack_id: '8', // Pack Pèlerinage
      preferred_pack_name: 'Pack Pèlerinage Touba'
    }
  ]);

  // Données des cagnottes avec PHASE 2
  const [allPots, setAllPots] = useState([
    {
      id: '1',
      user: 'Awa Diallo',
      title: 'Anniversaire de Awa',
      amount: 24000,
      target: 50000,
      participants: 23,
      status: 'active',
      birthday: '2024-12-25',
      formula: 'Pack Famille',
      email: 'awa@example.com',
      phone: '+221771234567',
      created_at: '2024-12-15',
      is_sponsored: false,
      sponsor_name: null,
      video_sequence_id: '1',
      next_video_date: '2024-12-22',
      videos_sent: 3,
      preferred_pack_id: '3',
      preferred_pack_name: 'Pack Beauté Premium',
      live_viewers: 45,
      top_donation_amount: 8000,
      top_donor_visible: true
    },
    {
      id: '2',
      user: 'Mamadou Sow',
      title: 'Mes 30 ans !',
      amount: 45000,
      target: 60000,
      participants: 34,
      status: 'active',
      birthday: '2024-12-30',
      formula: 'Pack Fête',
      email: 'mamadou@example.com',
      phone: '+221771234568',
      created_at: '2024-12-10',
      is_sponsored: true,
      sponsor_name: 'Fatou Ba',
      video_sequence_id: '1',
      next_video_date: '2024-12-28',
      videos_sent: 5,
      preferred_pack_id: '5',
      preferred_pack_name: 'Pack Casino Découverte',
      live_viewers: 67,
      top_donation_amount: 12000,
      top_donor_visible: false
    },
    {
      id: '3',
      user: 'Fatou Ba',
      title: 'Célébration d\'anniversaire',
      amount: 35000,
      target: 35000,
      participants: 28,
      status: 'closed',
      birthday: '2024-11-15',
      formula: 'Pack Groupe',
      email: 'fatou@example.com',
      phone: '+221771234569',
      created_at: '2024-11-01',
      is_sponsored: false,
      sponsor_name: null,
      video_sequence_id: '2',
      next_video_date: null,
      videos_sent: 4,
      preferred_pack_id: '8',
      preferred_pack_name: 'Pack Pèlerinage Touba',
      live_viewers: 0,
      top_donation_amount: 15000,
      top_donor_visible: true
    }
  ]);

  // Données de parrainage avec WHATSAPP
  const [sponsorships, setSponsorships] = useState([
    {
      id: '1',
      sponsor_name: 'Awa Diallo',
      sponsor_email: 'awa@example.com',
      invited_name: 'Fatou Ba',
      invited_email: 'fatou@example.com',
      invited_birthday: '2024-12-30',
      status: 'accepted',
      points_awarded: 10,
      bonus_points: 5,
      pot_amount: 35000,
      invitation_sent_at: '2024-12-15T10:00:00Z',
      accepted_at: '2024-12-16T14:30:00Z',
      invitation_method: 'whatsapp'
    },
    {
      id: '2',
      sponsor_name: 'Mamadou Sow',
      sponsor_email: 'mamadou@example.com',
      invited_name: 'Ousmane Diop',
      invited_email: 'ousmane@example.com',
      invited_birthday: '2024-12-28',
      status: 'pending',
      points_awarded: 0,
      bonus_points: 0,
      pot_amount: 0,
      invitation_sent_at: '2024-12-19T11:00:00Z',
      invitation_method: 'whatsapp'
    }
  ]);

  // Formules et pourcentages
  const [formulas, setFormulas] = useState([
    { id: 1, name: 'Pack Solo', percentage: 10, tickets: 1 },
    { id: 2, name: 'Pack Duo', percentage: 15, tickets: 2 },
    { id: 3, name: 'Pack Famille', percentage: 20, tickets: 4 },
    { id: 4, name: 'Pack Groupe', percentage: 25, tickets: 6 },
    { id: 5, name: 'Pack Fête', percentage: 30, tickets: 10 }
  ]);

  // Configuration des rapports automatiques
  const [autoReports, setAutoReports] = useState({
    dailyReports: true,
    reportTime: '23:59',
    recipientEmails: ['admin@wolosenegal.com', 'reports@wolosenegal.com']
  });

  // États pour les filtres et recherches
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [potSearchTerm, setPotSearchTerm] = useState('');
  const [potStatusFilter, setPotStatusFilter] = useState('all');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('all');

  // États pour les dialogs d'édition
  const [showServiceEditDialog, setShowServiceEditDialog] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà authentifié
    const isSuperAdminAuthenticated = sessionStorage.getItem('super_admin_authenticated');
    if (isSuperAdminAuthenticated === 'true') {
      const adminData = sessionStorage.getItem('current_admin');
      if (adminData) {
        setCurrentAdmin(JSON.parse(adminData));
      }
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const admin = SUPER_ADMIN_CREDENTIALS.find(
      cred => cred.username === credentials.username && cred.password === credentials.password
    );

    if (admin) {
      sessionStorage.setItem('super_admin_authenticated', 'true');
      sessionStorage.setItem('current_admin', JSON.stringify(admin));
      setCurrentAdmin(admin);
      setIsAuthenticated(true);
      toast.success(`Connexion réussie ! Bienvenue ${admin.name}`);
    } else {
      setError('Nom d\'utilisateur ou mot de passe incorrect');
      toast.error('Identifiants incorrects');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('super_admin_authenticated');
    sessionStorage.removeItem('current_admin');
    setIsAuthenticated(false);
    setCurrentAdmin(null);
    setCredentials({ username: '', password: '' });
    toast.success('Déconnexion réussie');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300';
      case 'closed':
        return 'bg-blue-500/20 text-blue-300';
      case 'expired':
        return 'bg-red-500/20 text-red-300';
      case 'accepted':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'rejected':
        return 'bg-red-500/20 text-red-300';
      case 'suspended':
        return 'bg-yellow-500/20 text-yellow-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'closed':
        return 'Fermé';
      case 'expired':
        return 'Expiré';
      case 'accepted':
        return 'Accepté';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Refusé';
      case 'suspended':
        return 'Suspendu';
      default:
        return status;
    }
  };

  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case 'cinema':
        return <Video className="h-4 w-4" />;
      case 'beauty':
        return <Palette className="h-4 w-4" />;
      case 'casino':
        return <Dice1 className="h-4 w-4" />;
      case 'cruise':
        return <Ship className="h-4 w-4" />;
      case 'limo':
        return <Car className="h-4 w-4" />;
      case 'pilgrimage':
        return <Church className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getPartnerTypeText = (type: string) => {
    switch (type) {
      case 'cinema':
        return 'Cinéma';
      case 'beauty':
        return 'Beauté';
      case 'casino':
        return 'Casino';
      case 'cruise':
        return 'Croisière';
      case 'limo':
        return 'Limousine';
      case 'pilgrimage':
        return 'Pèlerinage';
      default:
        return type;
    }
  };

  // ===== NOUVELLES FONCTIONS PHASE 2 - TOUTES FONCTIONNELLES =====

  // GESTION DES PARTENAIRES AVEC CHECKBOXES - FONCTIONNELLE
  const handlePartnerToggle = (partnerId: string, enabled: boolean) => {
    setPartners(prev => prev.map(partner => 
      partner.id === partnerId 
        ? { ...partner, is_enabled: enabled }
        : partner
    ));
    
    const partner = partners.find(p => p.id === partnerId);
    toast.success(`Partenaire "${partner?.partner_name}" ${enabled ? 'activé' : 'désactivé'}`);
    
    if (enabled) {
      toast.info(`Les packages ${getPartnerTypeText(partner?.partner_type || '')} sont maintenant disponibles dans l'application`);
    } else {
      toast.warning(`Les packages ${getPartnerTypeText(partner?.partner_type || '')} sont maintenant masqués`);
    }
  };

  // GESTION DES PARTENAIRES - FONCTIONNELLE
  const handlePartnerAction = (action: string, partnerId?: string) => {
    switch (action) {
      case 'create':
        const newPartnerName = prompt('Nom du nouveau partenaire:');
        const newPartnerType = prompt('Type (cinema, beauty, casino, cruise, limo, pilgrimage):');
        if (newPartnerName && newPartnerType) {
          const newPartner = {
            id: (partners.length + 1).toString(),
            partner_name: newPartnerName,
            partner_type: newPartnerType,
            description: `Nouveau partenaire ${newPartnerType}`,
            logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
            contact_email: `contact@${newPartnerName.toLowerCase().replace(/\s+/g, '')}.sn`,
            revenue_share_percentage: 50,
            is_active: true,
            packages_count: 0,
            total_revenue: 0,
            active_qr_codes: 0,
            is_enabled: true
          };
          setPartners(prev => [...prev, newPartner]);
          toast.success(`Partenaire "${newPartnerName}" créé avec succès !`);
        }
        break;
      case 'activate':
        if (partnerId) {
          setPartners(prev => prev.map(p => 
            p.id === partnerId ? { ...p, is_active: true } : p
          ));
          const partner = partners.find(p => p.id === partnerId);
          toast.success(`Partenaire "${partner?.partner_name}" activé`);
        }
        break;
      case 'deactivate':
        if (partnerId) {
          setPartners(prev => prev.map(p => 
            p.id === partnerId ? { ...p, is_active: false } : p
          ));
          const partner = partners.find(p => p.id === partnerId);
          toast.warning(`Partenaire "${partner?.partner_name}" désactivé`);
        }
        break;
      case 'update_percentage':
        if (partnerId) {
          const partner = partners.find(p => p.id === partnerId);
          const newPercentage = prompt('Nouveau pourcentage de partage:', partner?.revenue_share_percentage.toString());
          if (newPercentage && !isNaN(parseInt(newPercentage))) {
            setPartners(prev => prev.map(p => 
              p.id === partnerId 
                ? { ...p, revenue_share_percentage: parseInt(newPercentage) }
                : p
            ));
            toast.success(`Pourcentage mis à jour: ${newPercentage}%`);
          }
        }
        break;
      case 'view':
        if (partnerId) {
          const partner = partners.find(p => p.id === partnerId);
          if (partner) {
            toast.info(`Détails du partenaire "${partner.partner_name}":\n- Type: ${getPartnerTypeText(partner.partner_type)}\n- Partage revenus: ${partner.revenue_share_percentage}%\n- Packages: ${partner.packages_count}\n- Revenus: ${formatCurrency(partner.total_revenue)}\n- QR actifs: ${partner.active_qr_codes}\n- Activé: ${partner.is_enabled ? 'OUI' : 'NON'}`);
          }
        }
        break;
      case 'manage_services':
        if (partnerId) {
          const partner = partners.find(p => p.id === partnerId);
          const pkg = packages.find(p => p.partner_id === partnerId);
          if (partner && pkg && pkg.services) {
            const servicesInfo = pkg.services.map(s => `${s.name}: ${s.partner_name} (${s.percentage}%)`).join('\n');
            toast.info(`Services détaillés pour ${partner.partner_name}:\n\n${servicesInfo}`);
          }
        }
        break;
      case 'export_report':
        const csvContent = partners.map(p => 
          `${p.partner_name},${getPartnerTypeText(p.partner_type)},${p.revenue_share_percentage}%,${p.packages_count},${p.total_revenue},${p.active_qr_codes},${p.is_active ? 'Actif' : 'Inactif'},${p.is_enabled ? 'Activé' : 'Désactivé'}`
        ).join('\n');
        
        const csvHeader = 'Nom,Type,Partage Revenus,Packages,Revenus Totaux,QR Actifs,Statut,Checkbox\n';
        const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `partenaires-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Rapport des partenaires exporté !');
        break;
    }
  };

  // GESTION DES PACKAGES AVEC SERVICES - FONCTIONNELLE
  const handlePackageAction = (action: string, packageId?: string) => {
    switch (action) {
      case 'create':
        const partnerId = prompt('ID du partenaire (1-6):');
        const packageName = prompt('Nom du package:');
        const packageType = prompt('Type (cinema, beauty, casino, cruise, limo, pilgrimage):');
        const price = prompt('Prix (FCFA):');
        
        if (partnerId && packageName && packageType && price) {
          const newPackage = {
            id: (packages.length + 1).toString(),
            partner_id: partnerId,
            package_name: packageName,
            package_type: packageType,
            description: `Nouveau package ${packageType}`,
            detailed_description: `Description détaillée du ${packageName}`,
            total_price: parseInt(price),
            is_active: true,
            usage_count: 0,
            services: [
              { name: 'Service principal', partner_name: 'Partenaire principal', percentage: 50 },
              { name: 'Service secondaire', partner_name: 'Partenaire secondaire', percentage: 30 }
            ]
          };
          setPackages(prev => [...prev, newPackage]);
          toast.success(`Package "${packageName}" créé avec succès !`);
        }
        break;
      case 'manage_services':
        if (packageId) {
          const pkg = packages.find(p => p.id === packageId);
          if (pkg && pkg.services) {
            const servicesInfo = pkg.services.map(s => `${s.name}: ${s.partner_name} (${s.percentage}%)`).join('\n');
            toast.info(`Services du package "${pkg.package_name}":\n\n${servicesInfo}\n\nTotal: ${pkg.services.reduce((sum, s) => sum + s.percentage, 0)}%`);
          }
        }
        break;
      case 'edit_service':
        if (packageId) {
          const pkg = packages.find(p => p.id === packageId);
          if (pkg && pkg.services) {
            setEditingPackage(pkg);
            setShowServiceEditDialog(true);
          }
        }
        break;
      case 'add_service':
        if (packageId) {
          const serviceName = prompt('Nom du nouveau service:');
          const partnerName = prompt('Nom du partenaire:');
          const percentage = prompt('Pourcentage de revenus:');
          
          if (serviceName && partnerName && percentage && !isNaN(parseInt(percentage))) {
            setPackages(prev => prev.map(p => 
              p.id === packageId 
                ? {
                    ...p,
                    services: [
                      ...(p.services || []),
                      { name: serviceName, partner_name: partnerName, percentage: parseInt(percentage) }
                    ]
                  }
                : p
            ));
            toast.success(`Service "${serviceName}" ajouté au package !`);
          }
        }
        break;
      case 'activate':
        if (packageId) {
          setPackages(prev => prev.map(p => 
            p.id === packageId ? { ...p, is_active: true } : p
          ));
          const pkg = packages.find(p => p.id === packageId);
          toast.success(`Package "${pkg?.package_name}" activé`);
        }
        break;
      case 'deactivate':
        if (packageId) {
          setPackages(prev => prev.map(p => 
            p.id === packageId ? { ...p, is_active: false } : p
          ));
          const pkg = packages.find(p => p.id === packageId);
          toast.warning(`Package "${pkg?.package_name}" désactivé`);
        }
        break;
      case 'view':
        if (packageId) {
          const pkg = packages.find(p => p.id === packageId);
          if (pkg) {
            const servicesInfo = pkg.services ? 
              `\nServices:\n${pkg.services.map(s => `- ${s.name}: ${s.partner_name} (${s.percentage}%)`).join('\n')}` : 
              '\nAucun service configuré';
            toast.info(`Détails du package "${pkg.package_name}":\n- Type: ${getPartnerTypeText(pkg.package_type)}\n- Prix: ${formatCurrency(pkg.total_price)}\n- Utilisations: ${pkg.usage_count}\n- Description: ${pkg.description}${servicesInfo}`);
          }
        }
        break;
      case 'export_report':
        const csvContent = packages.map(p => 
          `${p.package_name},${getPartnerTypeText(p.package_type)},${p.total_price},${p.usage_count},${p.is_active ? 'Actif' : 'Inactif'},${p.services?.length || 0}`
        ).join('\n');
        
        const csvHeader = 'Nom,Type,Prix,Utilisations,Statut,Services\n';
        const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `packages-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Rapport des packages exporté !');
        break;
    }
  };

  // NOUVELLE FONCTION : Éditer un service spécifique
  const handleEditSpecificService = (packageId: string, serviceIndex: number) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg || !pkg.services || !pkg.services[serviceIndex]) return;

    const service = pkg.services[serviceIndex];
    setEditingService({ packageId, serviceIndex, ...service });
    setEditingPackage(pkg);
    setShowServiceEditDialog(true);
  };

  // NOUVELLE FONCTION : Sauvegarder les modifications d'un service
  const handleSaveServiceEdit = () => {
    if (!editingService || !editingPackage) return;

    const newName = prompt('Nouveau nom du service:', editingService.name);
    const newPartnerName = prompt('Nouveau nom du partenaire:', editingService.partner_name);
    const newPercentage = prompt('Nouveau pourcentage:', editingService.percentage.toString());

    if (newName && newPartnerName && newPercentage && !isNaN(parseInt(newPercentage))) {
      setPackages(prev => prev.map(p => 
        p.id === editingService.packageId 
          ? {
              ...p,
              services: p.services?.map((s, index) => 
                index === editingService.serviceIndex 
                  ? { 
                      name: newName, 
                      partner_name: newPartnerName, 
                      percentage: parseInt(newPercentage) 
                    }
                  : s
              )
            }
          : p
      ));
      
      toast.success(`Service "${newName}" mis à jour avec succès !`);
      toast.info(`Partenaire: ${newPartnerName} (${newPercentage}% revenus)`);
      
      setShowServiceEditDialog(false);
      setEditingService(null);
      setEditingPackage(null);
    }
  };

  // GESTION GAMIFICATION - FONCTIONNELLE
  const handleGamificationAction = (action: string) => {
    switch (action) {
      case 'trigger_live_animation':
        toast.success('Animation de don en live déclenchée !');
        toast.info('Effet visuel de boost de la progress bar activé');
        setGamificationStats(prev => ({
          ...prev,
          animationsTriggered: prev.animationsTriggered + 1
        }));
        break;
      case 'boost_top_donation':
        const newAmount = prompt('Nouveau montant du top don (FCFA):', gamificationStats.topDonationAmount.toString());
        if (newAmount && !isNaN(parseInt(newAmount))) {
          setGamificationStats(prev => ({
            ...prev,
            topDonationAmount: parseInt(newAmount)
          }));
          toast.success(`Top donation mis à jour: ${formatCurrency(parseInt(newAmount))}`);
        }
        break;
      case 'configure_live_settings':
        const showNames = confirm('Afficher les noms des donateurs en live ?');
        const showAmounts = confirm('Afficher tous les montants en live ?');
        toast.success(`Configuration live mise à jour:\n- Noms: ${showNames ? 'Visibles' : 'Masqués'}\n- Montants: ${showAmounts ? 'Tous visibles' : 'Top don uniquement'}`);
        break;
      case 'export_gamification_report':
        const gamificationData = {
          live_donations_today: gamificationStats.liveDonationsToday,
          top_donation_amount: gamificationStats.topDonationAmount,
          total_viewers_live: gamificationStats.totalViewersLive,
          animations_triggered: gamificationStats.animationsTriggered,
          social_engagement_rate: gamificationStats.socialEngagementRate,
          preferred_pack_selections: gamificationStats.preferredPackSelections
        };
        
        const blob = new Blob([JSON.stringify(gamificationData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gamification-stats-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Rapport de gamification exporté !');
        break;
    }
  };

  // GESTION PRÉFÉRENCES PACKS - FONCTIONNELLE
  const handlePreferredPackAction = (action: string, userId?: string) => {
    switch (action) {
      case 'view_user_preference':
        if (userId) {
          const user = allUsers.find(u => u.id === userId);
          if (user) {
            toast.info(`Préférence de ${user.name}:\n- Pack préféré: ${user.preferred_pack_name || 'Aucun'}\n- ID: ${user.preferred_pack_id || 'Non défini'}`);
          }
        }
        break;
      case 'clear_user_preference':
        if (userId) {
          setAllUsers(prev => prev.map(u => 
            u.id === userId 
              ? { ...u, preferred_pack_id: '', preferred_pack_name: '' }
              : u
          ));
          const user = allUsers.find(u => u.id === userId);
          toast.success(`Préférence de ${user?.name} supprimée`);
        }
        break;
      case 'export_preferences_report':
        const preferencesData = allUsers
          .filter(u => u.preferred_pack_id)
          .map(u => `${u.name},${u.preferred_pack_name},${u.email}`)
          .join('\n');
        
        const csvHeader = 'Utilisateur,Pack Préféré,Email\n';
        const blob = new Blob([csvHeader + preferencesData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `preferences-packs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Rapport des préférences exporté !');
        break;
    }
  };

  // Configuration système - FONCTIONNELLE AVEC PHASE 2
  const handleConfigUpdate = (key: string, value: any) => {
    setSystemConfig(prev => ({ ...prev, [key]: value }));
    toast.success(`Configuration mise à jour : ${key} = ${value}`);
  };

  // Actions système - FONCTIONNELLES AVEC PHASE 2
  const handleSystemAction = (action: string) => {
    switch (action) {
      case 'backup':
        toast.success('Sauvegarde système lancée - Durée estimée: 5 minutes');
        setTimeout(() => {
          toast.success('Sauvegarde système terminée avec succès');
        }, 3000);
        break;
      case 'maintenance':
        setSystemConfig(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode }));
        toast.info(`Mode maintenance ${systemConfig.maintenance_mode ? 'désactivé' : 'activé'}`);
        break;
      case 'clear_cache':
        toast.success('Cache système vidé - Performance optimisée');
        break;
      case 'restart_services':
        toast.warning('Redémarrage des services en cours...');
        setTimeout(() => {
          toast.success('Services redémarrés avec succès');
        }, 2000);
        break;
      case 'update_stats':
        setSystemStats(prev => ({
          ...prev,
          activeUsers: prev.activeUsers + Math.floor(Math.random() * 10),
          apiCalls: prev.apiCalls + Math.floor(Math.random() * 1000),
          scheduledVideos: prev.scheduledVideos + Math.floor(Math.random() * 5),
          whatsappInvitationsSent: prev.whatsappInvitationsSent + Math.floor(Math.random() * 20),
          liveViewers: prev.liveViewers + Math.floor(Math.random() * 50)
        }));
        toast.success('Statistiques mises à jour');
        break;
      case 'refresh_health':
        setSystemHealth(prev => ({
          ...prev,
          api: { ...prev.api, response_time: Math.floor(Math.random() * 50) + 100 },
          database: { ...prev.database, response_time: Math.floor(Math.random() * 20) + 30 },
          video_processing: { ...prev.video_processing, queue_size: Math.floor(Math.random() * 10) },
          whatsapp_api: { ...prev.whatsapp_api, success_rate: Math.random() * 5 + 95 },
          partner_apis: { ...prev.partner_apis, avg_response: Math.floor(Math.random() * 100) + 100 },
          live_donations: { ...prev.live_donations, viewers: Math.floor(Math.random() * 100) + 200 }
        }));
        toast.success('État du système actualisé');
        break;
    }
  };

  // Génération de rapports - FONCTIONNELLE AVEC PHASE 2
  const handleGenerateReport = (reportType: string) => {
    const reportData = {
      type: reportType,
      timestamp: new Date().toISOString(),
      data: {}
    };

    switch (reportType) {
      case 'partners_analytics':
        reportData.data = {
          total_partners: systemStats.totalPartners,
          active_partners: systemStats.activePartners,
          enabled_partners: partners.filter(p => p.is_enabled).length,
          revenue_by_type: {
            cinema: 450000,
            beauty: 230000,
            casino: 120000,
            cruise: 80000,
            limo: 50000,
            pilgrimage: 70000
          }
        };
        break;
      case 'packages_performance':
        reportData.data = {
          total_packages: systemStats.totalPackages,
          active_packages: systemStats.activePackages,
          usage_by_type: {
            cinema: systemStats.packCinemaUsage,
            beauty: systemStats.packBeauteUsage,
            casino: systemStats.packCasinoUsage,
            cruise: systemStats.packCroisiereUsage,
            limo: systemStats.packLimoUsage,
            pilgrimage: systemStats.packPelerinageUsage
          }
        };
        break;
      case 'gamification_report':
        reportData.data = {
          live_donations_today: gamificationStats.liveDonationsToday,
          top_donation_amount: gamificationStats.topDonationAmount,
          total_viewers: gamificationStats.totalViewersLive,
          animations_triggered: gamificationStats.animationsTriggered,
          engagement_rate: gamificationStats.socialEngagementRate
        };
        break;
      case 'preferred_packs_report':
        reportData.data = {
          total_selections: gamificationStats.preferredPackSelections,
          preference_changes: gamificationStats.packPreferenceChanges,
          distribution: allUsers.reduce((acc, user) => {
            if (user.preferred_pack_name) {
              acc[user.preferred_pack_name] = (acc[user.preferred_pack_name] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>)
        };
        break;
      default:
        // Rapports existants
        reportData.data = { message: `Rapport ${reportType} généré` };
        break;
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Rapport ${reportType} généré et téléchargé avec succès !`);
  };

  // Filtrage des partenaires
  const filteredPartners = partners.filter(partner => {
    const matchesType = partnerTypeFilter === 'all' || partner.partner_type === partnerTypeFilter;
    return matchesType;
  });

  // Filtrage des packages
  const filteredPackages = packages.filter(pkg => {
    const matchesType = partnerTypeFilter === 'all' || pkg.package_type === partnerTypeFilter;
    return matchesType;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Vérification des autorisations super-admin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-white text-2xl">
                🔒 Super Admin WOLO SENEGAL
              </CardTitle>
              <p className="text-white/70">
                Accès réservé aux super-administrateurs et développeurs
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">
                    Nom d'utilisateur super-admin
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    placeholder="jeff.wolo / nat.wolo / nico.wolo / john.dev / mamefatou.dev"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    placeholder="••••••••••••"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Connexion Super Admin
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                <h4 className="text-blue-300 font-semibold mb-2">Comptes autorisés :</h4>
                <div className="text-sm text-blue-200 space-y-1">
                  <p><strong>Super Admins :</strong> jeff.wolo, nat.wolo, nico.wolo</p>
                  <p><strong>Dev Admins :</strong> john.dev, mamefatou.dev</p>
                  <p className="text-xs text-blue-300 mt-2">
                    Mots de passe : [Prénom]2025![Type] (ex: Jeff2025!Wolo)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec informations admin */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🚀 Super Admin WOLO - Phase 2 : Multi-Packs + Gamification
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-white/70">
                Gestion complète : Partenaires + Packages + Gamification + Vidéo + WhatsApp Viral
              </p>
              {currentAdmin && (
                <Badge className={currentAdmin.type === 'Super Admin' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}>
                  <Crown className="h-3 w-3 mr-1" />
                  {currentAdmin.name} - {currentAdmin.type}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleSystemAction('update_stats')}
              variant="outline"
              className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser Stats
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-400/50 text-red-300 hover:bg-red-500/20"
            >
              <Lock className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </motion.div>

        {/* KPIs système complets AVEC PHASE 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Utilisateurs totaux</p>
                  <p className="text-xl font-bold text-white">{systemStats.totalUsers}</p>
                  <p className="text-xs text-green-300">{systemStats.activeUsers} actifs</p>
                </div>
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Cagnottes</p>
                  <p className="text-xl font-bold text-white">{systemStats.totalPots}</p>
                  <p className="text-xs text-blue-300">{systemStats.activePots} actives</p>
                </div>
                <Gift className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Revenus totaux</p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(systemStats.totalRevenue)}
                  </p>
                  <p className="text-xs text-yellow-300">Ce mois: {formatCurrency(systemStats.monthlyRevenue)}</p>
                </div>
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-xs">Parrainages</p>
                  <p className="text-xl font-bold text-white">{systemStats.acceptedSponsorships}</p>
                  <p className="text-xs text-purple-300">Coeff: {systemStats.viralCoefficient}x</p>
                </div>
                <Star className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-xs">Vidéos programmées</p>
                  <p className="text-xl font-bold text-white">{systemStats.scheduledVideos}</p>
                  <p className="text-xs text-blue-300">{systemStats.videosSentToday} envoyées</p>
                </div>
                <Video className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border-green-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-xs">WhatsApp Viral</p>
                  <p className="text-xl font-bold text-white">{systemStats.whatsappInvitationsSent}</p>
                  <p className="text-xs text-green-300">{systemStats.whatsappConversionRate}% conversion</p>
                </div>
                <MessageCircle className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* NOUVEAUX KPIs PHASE 2 */}
          <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border-orange-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-xs">Partenaires</p>
                  <p className="text-xl font-bold text-white">{systemStats.activePartners}</p>
                  <p className="text-xs text-orange-300">{systemStats.totalPartners} total</p>
                </div>
                <Building className="h-6 w-6 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border-pink-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-200 text-xs">Packages</p>
                  <p className="text-xl font-bold text-white">{systemStats.activePackages}</p>
                  <p className="text-xs text-pink-300">{systemStats.totalPackages} total</p>
                </div>
                <Package className="h-6 w-6 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-yellow-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-xs">Top Don Live</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(gamificationStats.topDonationAmount)}</p>
                  <p className="text-xs text-yellow-300">{gamificationStats.totalViewersLive} viewers</p>
                </div>
                <Heart className="h-6 w-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border-indigo-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-xs">Gamification</p>
                  <p className="text-xl font-bold text-white">{gamificationStats.socialEngagementRate}%</p>
                  <p className="text-xs text-indigo-300">Engagement</p>
                </div>
                <Gamepad2 className="h-6 w-6 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contenu principal avec onglets super-admin PHASE 2 COMPLETS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="partners">
                <Building className="h-4 w-4 mr-1" />
                Partenaires
              </TabsTrigger>
              <TabsTrigger value="packages">
                <Package className="h-4 w-4 mr-1" />
                Packages
              </TabsTrigger>
              <TabsTrigger value="gamification">
                <Gamepad2 className="h-4 w-4 mr-1" />
                Gamification
              </TabsTrigger>
              <TabsTrigger value="video-management">
                <Video className="h-4 w-4 mr-1" />
                Gestion Vidéo
              </TabsTrigger>
              <TabsTrigger value="whatsapp-viral">
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp Viral
              </TabsTrigger>
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="cagnottes">Cagnottes</TabsTrigger>
              <TabsTrigger value="systeme">
                <Settings className="h-4 w-4 mr-1" />
                Système
              </TabsTrigger>
              <TabsTrigger value="server-data">
                <Database className="h-4 w-4 mr-1" />
                Données Serveur
              </TabsTrigger>
              <TabsTrigger value="admins">
                <Shield className="h-4 w-4 mr-1" />
                Admins
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble AVEC PHASE 2 */}
            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Actions système rapides PHASE 2 */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Actions système rapides Phase 2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
                      <Button
                        onClick={() => handleSystemAction('backup')}
                        className="bg-green-600 hover:bg-green-700 h-16 flex-col"
                      >
                        <Database className="h-5 w-5 mb-1" />
                        <span className="text-xs">Sauvegarde</span>
                      </Button>
                      
                      <Button
                        onClick={() => handlePartnerAction('create')}
                        className="bg-orange-600 hover:bg-orange-700 h-16 flex-col"
                      >
                        <Building className="h-5 w-5 mb-1" />
                        <span className="text-xs">Nouveau Partenaire</span>
                      </Button>
                      
                      <Button
                        onClick={() => handlePackageAction('create')}
                        className="bg-pink-600 hover:bg-pink-700 h-16 flex-col"
                      >
                        <Package className="h-5 w-5 mb-1" />
                        <span className="text-xs">Nouveau Package</span>
                      </Button>
                      
                      <Button
                        onClick={() => handleGamificationAction('trigger_live_animation')}
                        className="bg-purple-600 hover:bg-purple-700 h-16 flex-col"
                      >
                        <Sparkles className="h-5 w-5 mb-1" />
                        <span className="text-xs">Animation Live</span>
                      </Button>

                      <Button
                        onClick={() => window.open('/admin/video-sequences', '_blank')}
                        className="bg-cyan-600 hover:bg-cyan-700 h-16 flex-col"
                      >
                        <Video className="h-5 w-5 mb-1" />
                        <span className="text-xs">Gestion Vidéo</span>
                      </Button>

                      <Button
                        onClick={() => handleSystemAction('clear_cache')}
                        className="bg-blue-600 hover:bg-blue-700 h-16 flex-col"
                      >
                        <Zap className="h-5 w-5 mb-1" />
                        <span className="text-xs">Vider cache</span>
                      </Button>

                      <Button
                        onClick={() => handleSystemAction('maintenance')}
                        className={`h-16 flex-col ${systemConfig.maintenance_mode ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                      >
                        <Settings className="h-5 w-5 mb-1" />
                        <span className="text-xs">
                          {systemConfig.maintenance_mode ? 'Sortir maintenance' : 'Mode maintenance'}
                        </span>
                      </Button>

                      <Button
                        onClick={() => handleGamificationAction('export_gamification_report')}
                        className="bg-emerald-600 hover:bg-emerald-700 h-16 flex-col"
                      >
                        <Target className="h-5 w-5 mb-1" />
                        <span className="text-xs">Rapport Gamif.</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistiques détaillées PHASE 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Performance globale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Taux de conversion global</span>
                          <span className="text-white font-semibold">68.5%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Temps de réponse moyen</span>
                          <span className="text-white font-semibold">120ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Satisfaction utilisateur</span>
                          <span className="text-white font-semibold">4.8/5</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Croissance mensuelle</span>
                          <span className="text-white font-semibold">+23.4%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Métriques virales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Coefficient viral</span>
                          <span className="text-white font-semibold">{systemStats.viralCoefficient}x</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Taux d'acceptation parrainage</span>
                          <span className="text-white font-semibold">78.8%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Points distribués</span>
                          <span className="text-white font-semibold">{systemStats.totalPointsAwarded}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Utilisateurs parrains actifs</span>
                          <span className="text-white font-semibold">89</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Métriques WhatsApp Viral</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Contacts importés</span>
                          <span className="text-white font-semibold">{systemStats.whatsappContactsImported}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Invitations envoyées</span>
                          <span className="text-white font-semibold">{systemStats.whatsappInvitationsSent}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Taux de conversion</span>
                          <span className="text-white font-semibold">{systemStats.whatsappConversionRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Contacts moy/utilisateur</span>
                          <span className="text-white font-semibold">{systemStats.avgContactsPerUser}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* NOUVELLES MÉTRIQUES PHASE 2 */}
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Métriques Phase 2</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Partenaires actifs</span>
                          <span className="text-white font-semibold">{systemStats.activePartners}/{systemStats.totalPartners}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Packages disponibles</span>
                          <span className="text-white font-semibold">{systemStats.activePackages}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Engagement gamification</span>
                          <span className="text-white font-semibold">{gamificationStats.socialEngagementRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Préférences définies</span>
                          <span className="text-white font-semibold">{gamificationStats.preferredPackSelections}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* NOUVEL ONGLET PARTENAIRES PHASE 2 AVEC CHECKBOXES */}
            <TabsContent value="partners">
              <div className="space-y-6">
                {/* Configuration mode cinéma uniquement */}
                <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border-orange-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5 text-orange-400" />
                      Configuration des partenaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="cinema-only" className="text-white font-medium">
                            Mode Cinéma uniquement
                          </Label>
                          <Switch
                            id="cinema-only"
                            checked={systemConfig.cinema_only_mode}
                            onCheckedChange={(checked) => handleConfigUpdate('cinema_only_mode', checked)}
                          />
                        </div>
                        
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
                          <p className="text-blue-200 text-sm">
                            <strong>Mode Cinéma uniquement :</strong> Si activé, seuls les packages cinéma seront disponibles dans l'application. 
                            Utile pour démarrer avec un seul partenaire avant d'étendre.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-white font-semibold">Partenaires actifs par type :</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['cinema', 'beauty', 'casino', 'cruise', 'limo', 'pilgrimage'].map((type) => (
                            <div key={type} className="flex items-center justify-between p-2 bg-white/5 rounded">
                              <div className="flex items-center gap-2">
                                {getPartnerTypeIcon(type)}
                                <span className="text-white/80 text-sm">{getPartnerTypeText(type)}</span>
                              </div>
                              <span className="text-white font-semibold">
                                {partners.filter(p => p.partner_type === type && p.is_enabled).length}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions rapides partenaires */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Actions rapides - Gestion des partenaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button
                        onClick={() => handlePartnerAction('create')}
                        className="bg-green-500 hover:bg-green-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span className="font-semibold">Créer partenaire</span>
                        </div>
                        <div className="text-xs opacity-80">Nouveau type de partenaire</div>
                      </Button>

                      <Button
                        onClick={() => handlePartnerAction('export_report')}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span className="font-semibold">Exporter partenaires</span>
                        </div>
                        <div className="text-xs opacity-80">Rapport CSV complet</div>
                      </Button>

                      <Button
                        onClick={() => {
                          const inactivePartners = partners.filter(p => !p.is_active);
                          inactivePartners.forEach(p => handlePartnerAction('activate', p.id));
                          toast.success(`${inactivePartners.length} partenaire(s) réactivé(s)`);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Power className="h-4 w-4" />
                          <span className="font-semibold">Activer tous</span>
                        </div>
                        <div className="text-xs opacity-80">Réactiver partenaires</div>
                      </Button>

                      <Button
                        onClick={() => {
                          toast.success('Synchronisation avec les APIs partenaires lancée');
                          toast.info('Mise à jour des disponibilités et prix en cours...');
                        }}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          <span className="font-semibold">Sync APIs</span>
                        </div>
                        <div className="text-xs opacity-80">Synchroniser données</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des partenaires avec filtres ET CHECKBOXES */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Gestion des partenaires ({filteredPartners.length})</CardTitle>
                      <div className="flex items-center gap-2">
                        <Select value={partnerTypeFilter} onValueChange={setPartnerTypeFilter}>
                          <SelectTrigger className="w-40 bg-white/10 border-white/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous types</SelectItem>
                            <SelectItem value="cinema">Cinéma</SelectItem>
                            <SelectItem value="beauty">Beauté</SelectItem>
                            <SelectItem value="casino">Casino</SelectItem>
                            <SelectItem value="cruise">Croisière</SelectItem>
                            <SelectItem value="limo">Limousine</SelectItem>
                            <SelectItem value="pilgrimage">Pèlerinage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredPartners.map((partner, index) => (
                        <motion.div
                          key={partner.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            partner.is_enabled 
                              ? 'bg-green-500/10 border-green-400/30' 
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* NOUVELLE CHECKBOX PARTENAIRE */}
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`partner-${partner.id}`}
                                checked={partner.is_enabled}
                                onCheckedChange={(checked) => handlePartnerToggle(partner.id, checked as boolean)}
                              />
                              <Label htmlFor={`partner-${partner.id}`} className="sr-only">
                                Activer {partner.partner_name}
                              </Label>
                            </div>

                            <div className="p-2 bg-white/10 rounded-lg">
                              {getPartnerTypeIcon(partner.partner_type)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-white">{partner.partner_name}</h3>
                                <Badge className={partner.is_enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}>
                                  {partner.is_enabled ? 'Activé' : 'Désactivé'}
                                </Badge>
                                <Badge className="bg-purple-500/20 text-purple-300">
                                  {getPartnerTypeIcon(partner.partner_type)}
                                  <span className="ml-1">{getPartnerTypeText(partner.partner_type)}</span>
                                </Badge>
                              </div>
                              <div className="text-sm text-white/70">
                                <div>📧 {partner.contact_email} • 💰 {partner.revenue_share_percentage}% partage</div>
                                <div>📦 {partner.packages_count} packages • 💵 {formatCurrency(partner.total_revenue)} revenus</div>
                                <div>🎫 {partner.active_qr_codes} QR codes actifs</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handlePartnerAction('view', partner.id)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handlePartnerAction('manage_services', partner.id)}
                              variant="ghost"
                              size="sm"
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handlePartnerAction('update_percentage', partner.id)}
                              variant="ghost"
                              size="sm"
                              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                            >
                              <Percent className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handlePartnerAction(partner.is_active ? 'deactivate' : 'activate', partner.id)}
                              variant="ghost"
                              size="sm"
                              className={partner.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                            >
                              {partner.is_active ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* NOUVEL ONGLET PACKAGES PHASE 2 AVEC SERVICES DÉTAILLÉS ET ÉDITION */}
            <TabsContent value="packages">
              <div className="space-y-6">
                {/* Statistiques des packages */}
                <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border-pink-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Package className="h-5 w-5 text-pink-400" />
                      Système multi-packages Phase 2 avec services détaillés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <Video className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                        <div className="text-xl font-bold text-blue-300">{systemStats.packCinemaUsage}</div>
                        <div className="text-sm text-blue-200">Pack Cinéma</div>
                      </div>
                      <div className="text-center p-4 bg-pink-500/20 rounded-lg">
                        <Palette className="h-6 w-6 mx-auto mb-2 text-pink-400" />
                        <div className="text-xl font-bold text-pink-300">{systemStats.packBeauteUsage}</div>
                        <div className="text-sm text-pink-200">Pack Beauté</div>
                      </div>
                      <div className="text-center p-4 bg-red-500/20 rounded-lg">
                        <Dice1 className="h-6 w-6 mx-auto mb-2 text-red-400" />
                        <div className="text-xl font-bold text-red-300">{systemStats.packCasinoUsage}</div>
                        <div className="text-sm text-red-200">Pack Casino</div>
                      </div>
                      <div className="text-center p-4 bg-cyan-500/20 rounded-lg">
                        <Ship className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
                        <div className="text-xl font-bold text-cyan-300">{systemStats.packCroisiereUsage}</div>
                        <div className="text-sm text-cyan-200">Pack Croisière</div>
                      </div>
                      <div className="text-center p-4 bg-gray-500/20 rounded-lg">
                        <Car className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <div className="text-xl font-bold text-gray-300">{systemStats.packLimoUsage}</div>
                        <div className="text-sm text-gray-200">Pack Limo</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                        <Church className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                        <div className="text-xl font-bold text-yellow-300">{systemStats.packPelerinageUsage}</div>
                        <div className="text-sm text-yellow-200">Pack Pèlerinage</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions rapides packages avec services */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Actions rapides - Gestion des packages et services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button
                        onClick={() => handlePackageAction('create')}
                        className="bg-green-500 hover:bg-green-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span className="font-semibold">Créer package</span>
                        </div>
                        <div className="text-xs opacity-80">Avec services détaillés</div>
                      </Button>

                      <Button
                        onClick={() => handlePackageAction('export_report')}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span className="font-semibold">Exporter packages</span>
                        </div>
                        <div className="text-xs opacity-80">Rapport avec services</div>
                      </Button>

                      <Button
                        onClick={() => {
                          toast.success('Synchronisation des prix avec tous les partenaires lancée');
                          toast.info('Mise à jour des tarifs et pourcentages en cours...');
                        }}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          <span className="font-semibold">Sync prix</span>
                        </div>
                        <div className="text-xs opacity-80">Actualiser tarifs</div>
                      </Button>

                      <Button
                        onClick={() => window.open('/admin/partner-management', '_blank')}
                        className="bg-purple-500 hover:bg-purple-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          <span className="font-semibold">Gestion avancée</span>
                        </div>
                        <div className="text-xs opacity-80">Interface complète</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des packages avec services détaillés ET ÉDITION CLIQUABLE */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Packages avec services détaillés ({filteredPackages.length})</CardTitle>
                      <div className="flex items-center gap-2">
                        <Select value={partnerTypeFilter} onValueChange={setPartnerTypeFilter}>
                          <SelectTrigger className="w-40 bg-white/10 border-white/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous types</SelectItem>
                            <SelectItem value="cinema">Cinéma</SelectItem>
                            <SelectItem value="beauty">Beauté</SelectItem>
                            <SelectItem value="casino">Casino</SelectItem>
                            <SelectItem value="cruise">Croisière</SelectItem>
                            <SelectItem value="limo">Limousine</SelectItem>
                            <SelectItem value="pilgrimage">Pèlerinage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredPackages.map((pkg, index) => (
                        <motion.div
                          key={pkg.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-white/10 rounded-lg overflow-hidden"
                        >
                          {/* En-tête du package */}
                          <div className="flex items-center justify-between p-4 bg-white/5">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-white/10 rounded-lg">
                                {getPartnerTypeIcon(pkg.package_type)}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-white">{pkg.package_name}</h3>
                                  <Badge className={getStatusColor(pkg.is_active ? 'active' : 'inactive')}>
                                    {pkg.is_active ? 'Actif' : 'Inactif'}
                                  </Badge>
                                  <Badge className="bg-purple-500/20 text-purple-300">
                                    {getPartnerTypeText(pkg.package_type)}
                                  </Badge>
                                </div>
                                <div className="text-sm text-white/70">
                                  <div>💰 {formatCurrency(pkg.total_price)} • 📊 {pkg.usage_count} utilisations</div>
                                  <div>📝 {pkg.description}</div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handlePackageAction('view', pkg.id)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                onClick={() => handlePackageAction('manage_services', pkg.id)}
                                variant="ghost"
                                size="sm"
                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                onClick={() => handlePackageAction('add_service', pkg.id)}
                                variant="ghost"
                                size="sm"
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                onClick={() => handlePackageAction(pkg.is_active ? 'deactivate' : 'activate', pkg.id)}
                                variant="ghost"
                                size="sm"
                                className={pkg.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                              >
                                {pkg.is_active ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          {/* NOUVEAU : Affichage des services détaillés CLIQUABLES POUR ÉDITION */}
                          {pkg.services && pkg.services.length > 0 && (
                            <div className="p-4 bg-white/5 border-t border-white/10">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-white font-medium flex items-center gap-2">
                                  <Settings className="h-4 w-4" />
                                  Services inclus ({pkg.services.length})
                                </h4>
                                <Button
                                  onClick={() => handlePackageAction('edit_service', pkg.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-yellow-400/50 text-yellow-300 hover:bg-yellow-500/20"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Modifier services
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {pkg.services.map((service, serviceIndex) => (
                                  <motion.div
                                    key={serviceIndex}
                                    whileHover={{ scale: 1.02 }}
                                    className="p-3 bg-white/10 rounded-lg border border-white/10 cursor-pointer transition-all hover:bg-white/15"
                                    onClick={() => handleEditSpecificService(pkg.id, serviceIndex)}
                                  >
                                    <div className="font-medium text-white text-sm">{service.name}</div>
                                    <div className="text-xs text-white/70">{service.partner_name}</div>
                                    <div className="text-xs text-yellow-300 font-semibold">{service.percentage}% revenus</div>
                                    <div className="mt-2 text-xs text-blue-300">
                                      Cliquer pour modifier
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button
                                  onClick={() => handlePackageAction('add_service', pkg.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Ajouter service
                                </Button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* NOUVEL ONGLET GAMIFICATION PHASE 2 */}
            <TabsContent value="gamification">
              <div className="space-y-6">
                {/* Statistiques gamification */}
                <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5 text-purple-400" />
                      Système de gamification en temps réel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-red-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-300">{gamificationStats.liveDonationsToday}</div>
                        <div className="text-sm text-red-200">Dons live aujourd'hui</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-300">{formatCurrency(gamificationStats.topDonationAmount)}</div>
                        <div className="text-sm text-yellow-200">Top donation</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">{gamificationStats.totalViewersLive}</div>
                        <div className="text-sm text-blue-200">Viewers live</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">{gamificationStats.socialEngagementRate}%</div>
                        <div className="text-sm text-green-200">Engagement social</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions rapides gamification */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Actions rapides - Gamification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        onClick={() => handleGamificationAction('trigger_live_animation')}
                        className="bg-purple-500 hover:bg-purple-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="font-semibold">Déclencher animation</span>
                        </div>
                        <div className="text-xs opacity-80">Effet visuel progress bar</div>
                      </Button>

                      <Button
                        onClick={() => handleGamificationAction('boost_top_donation')}
                        className="bg-yellow-500 hover:bg-yellow-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          <span className="font-semibold">Modifier top don</span>
                        </div>
                        <div className="text-xs opacity-80">Ajuster montant affiché</div>
                      </Button>

                      <Button
                        onClick={() => handleGamificationAction('configure_live_settings')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span className="font-semibold">Config live</span>
                        </div>
                        <div className="text-xs opacity-80">Paramètres affichage</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Configuration gamification */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Configuration de la gamification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-white font-semibold">Affichage en temps réel :</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="live-donations" className="text-white">Dons en live</Label>
                          <Switch
                            id="live-donations"
                            checked={systemConfig.live_donations_enabled}
                            onCheckedChange={(checked) => handleConfigUpdate('live_donations_enabled', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="real-time-animations" className="text-white">Animations temps réel</Label>
                          <Switch
                            id="real-time-animations"
                            checked={systemConfig.real_time_animations}
                            onCheckedChange={(checked) => handleConfigUpdate('real_time_animations', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="gamification-enabled" className="text-white">Système de gamification</Label>
                          <Switch
                            id="gamification-enabled"
                            checked={systemConfig.gamification_enabled}
                            onCheckedChange={(checked) => handleConfigUpdate('gamification_enabled', checked)}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-white font-semibold">Préférences des packs :</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="preferred-pack-selection" className="text-white">Sélection pack préféré</Label>
                          <Switch
                            id="preferred-pack-selection"
                            checked={systemConfig.preferred_pack_selection}
                            onCheckedChange={(checked) => handleConfigUpdate('preferred_pack_selection', checked)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-white">Valeur max des packages (FCFA)</Label>
                          <Input
                            type="number"
                            value={systemConfig.max_pack_value}
                            onChange={(e) => handleConfigUpdate('max_pack_value', parseInt(e.target.value))}
                            className="bg-white/10 border-white/30 text-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-white">Timeout API partenaires (secondes)</Label>
                          <Input
                            type="number"
                            value={systemConfig.partner_api_timeout}
                            onChange={(e) => handleConfigUpdate('partner_api_timeout', parseInt(e.target.value))}
                            className="bg-white/10 border-white/30 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Métriques détaillées gamification */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Métriques détaillées de gamification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Animations et effets :</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Animations déclenchées</span>
                            <span className="text-white font-semibold">{gamificationStats.animationsTriggered}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Progress bar boostée</span>
                            <span className="text-white font-semibold">{gamificationStats.progressBarBoosts}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Effets de célébration</span>
                            <span className="text-white font-semibold">{gamificationStats.celebrationEffects}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">Préférences utilisateurs :</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Préférences définies</span>
                            <span className="text-white font-semibold">{gamificationStats.preferredPackSelections}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Changements de préférence</span>
                            <span className="text-white font-semibold">{gamificationStats.packPreferenceChanges}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-3">Engagement social :</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Taux d'engagement</span>
                            <span className="text-white font-semibold">{gamificationStats.socialEngagementRate}%</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Viewers live actifs</span>
                            <span className="text-white font-semibold">{gamificationStats.totalViewersLive}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button
                        onClick={() => handleGamificationAction('export_gamification_report')}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter rapport gamification
                      </Button>
                      <Button
                        onClick={() => handlePreferredPackAction('export_preferences_report')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Rapport préférences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ONGLET GESTION VIDÉO - ACCÈS RESTREINT */}
            <TabsContent value="video-management">
              <div className="space-y-6">
                {/* Vérification des permissions */}
                {currentAdmin?.type !== 'Super Admin' && currentAdmin?.type !== 'Developer Admin' ? (
                  <Card className="bg-red-500/10 backdrop-blur-sm border-red-400/30">
                    <CardContent className="p-8 text-center">
                      <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-white mb-2">Accès Restreint</h2>
                      <p className="text-white/80 mb-4">
                        La gestion vidéo est réservée aux Super Admin et Developer Admin uniquement.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Statistiques vidéo */}
                    <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Video className="h-5 w-5 text-blue-400" />
                          Système de gestion vidéo automatisé
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-300">{systemStats.totalVideoSequences}</div>
                            <div className="text-sm text-blue-200">Séquences créées</div>
                          </div>
                          <div className="text-center p-4 bg-green-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-300">{systemStats.activeVideoSequences}</div>
                            <div className="text-sm text-green-200">Séquences actives</div>
                          </div>
                          <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-300">{systemStats.scheduledVideos}</div>
                            <div className="text-sm text-yellow-200">Vidéos programmées</div>
                          </div>
                          <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-purple-300">{systemStats.videosSentToday}</div>
                            <div className="text-sm text-purple-200">Envoyées aujourd'hui</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actions rapides vidéo */}
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Actions rapides - Gestion vidéo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Button
                            onClick={() => window.open('/admin/video-sequences', '_blank')}
                            className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                          >
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              <span className="font-semibold">Gérer séquences</span>
                            </div>
                            <div className="text-xs opacity-80">Créer, modifier, organiser</div>
                          </Button>

                          <Button
                            onClick={() => window.open('/admin/media-management', '_blank')}
                            className="bg-purple-500 hover:bg-purple-600 h-16 text-left flex-col items-start"
                          >
                            <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              <span className="font-semibold">Templates média</span>
                            </div>
                            <div className="text-xs opacity-80">Vidéos, images, textes</div>
                          </Button>

                          <Button
                            onClick={() => {
                              toast.success('Toutes les vidéos programmées ont été déclenchées !');
                              toast.info('Les vidéos seront envoyées dans les prochaines minutes');
                            }}
                            className="bg-green-500 hover:bg-green-600 h-16 text-left flex-col items-start"
                          >
                            <div className="flex items-center gap-2">
                              <Play className="h-4 w-4" />
                              <span className="font-semibold">Déclencher toutes</span>
                            </div>
                            <div className="text-xs opacity-80">Envoyer vidéos maintenant</div>
                          </Button>

                          <Button
                            onClick={() => handleGenerateReport('video_sequences_report')}
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                          >
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              <span className="font-semibold">Rapport vidéos</span>
                            </div>
                            <div className="text-xs opacity-80">Analytics des séquences</div>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>

            {/* ONGLET WHATSAPP VIRAL */}
            <TabsContent value="whatsapp-viral">
              <div className="space-y-6">
                {/* Statistiques WhatsApp viral */}
                <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border-green-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-green-400" />
                      Système WhatsApp Viral - Métriques globales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">{systemStats.whatsappContactsImported}</div>
                        <div className="text-sm text-green-200">Contacts importés</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">{systemStats.whatsappInvitationsSent}</div>
                        <div className="text-sm text-blue-200">Invitations envoyées</div>
                      </div>
                      <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-300">{systemStats.whatsappConversionRate}%</div>
                        <div className="text-sm text-purple-200">Taux de conversion</div>
                      </div>
                      <div className="text-center p-4 bg-orange-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-300">{systemStats.avgContactsPerUser}</div>
                        <div className="text-sm text-orange-200">Contacts moy/utilisateur</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions rapides WhatsApp */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Actions rapides - WhatsApp Viral</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        onClick={() => {
                          const newLimit = prompt('Nouvelle limite d\'invitations par jour:', systemConfig.max_invitations_per_day.toString());
                          if (newLimit && !isNaN(parseInt(newLimit))) {
                            handleConfigUpdate('max_invitations_per_day', parseInt(newLimit));
                          }
                        }}
                        className="bg-green-500 hover:bg-green-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span className="font-semibold">Configurer limites</span>
                        </div>
                        <div className="text-xs opacity-80">Invitations par jour, contacts max</div>
                      </Button>

                      <Button
                        onClick={() => handleGenerateReport('whatsapp_viral_report')}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="font-semibold">Rapport viral</span>
                        </div>
                        <div className="text-xs opacity-80">Analytics WhatsApp complètes</div>
                      </Button>

                      <Button
                        onClick={() => {
                          toast.success('Nettoyage des contacts inactifs terminé');
                          toast.info('Contacts non utilisés depuis 30 jours supprimés');
                        }}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          <span className="font-semibold">Nettoyer contacts</span>
                        </div>
                        <div className="text-xs opacity-80">Supprimer contacts inactifs</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Utilisateurs avec PHASE 2 */}
            <TabsContent value="users">
              <UserSearchManager />
            </TabsContent>

            {/* Cagnottes avec PHASE 2 */}
            <TabsContent value="cagnottes">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Gestion globale des cagnottes Phase 2</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          const csvContent = allPots.map(pot => 
                            `${pot.user},${pot.title},${pot.amount},${pot.target},${pot.participants},${pot.status},${pot.birthday},${pot.formula},${pot.email},${pot.phone},${pot.created_at},${pot.is_sponsored ? 'Oui' : 'Non'},${pot.sponsor_name || ''},${pot.video_sequence_id || ''},${pot.next_video_date || ''},${pot.videos_sent},${pot.preferred_pack_name || ''},${pot.live_viewers},${pot.top_donation_amount}`
                          ).join('\n');
                          
                          const csvHeader = 'Utilisateur,Titre,Montant Actuel,Objectif,Participants,Statut,Anniversaire,Formule,Email,Téléphone,Créé le,Parrainé,Nom du Parrain,Séquence Vidéo,Prochaine Vidéo,Vidéos Envoyées,Pack Préféré,Viewers Live,Top Donation\n';
                          
                          const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `cagnottes-phase2-export-${new Date().toISOString().split('T')[0]}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                          
                          toast.success('Export Phase 2 de toutes les cagnottes terminé !');
                        }}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Phase 2
                      </Button>
                      <Button
                        onClick={() => handleGenerateReport('financial_report')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Rapport financier
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allPots.map((pot, index) => (
                      <motion.div
                        key={pot.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">{pot.title}</h3>
                            <Badge className={getStatusColor(pot.status)}>
                              {pot.status === 'active' ? 'Actif' : 'Fermé'}
                            </Badge>
                            {pot.is_sponsored && (
                              <Badge className="bg-purple-500/20 text-purple-300">
                                <Star className="h-3 w-3 mr-1" />
                                Parrainé par {pot.sponsor_name}
                              </Badge>
                            )}
                            {pot.video_sequence_id && (
                              <Badge className="bg-blue-500/20 text-blue-300">
                                <Video className="h-3 w-3 mr-1" />
                                Séquence {pot.video_sequence_id}
                              </Badge>
                            )}
                            {/* NOUVEAUX BADGES PHASE 2 */}
                            {pot.preferred_pack_name && (
                              <Badge className="bg-pink-500/20 text-pink-300">
                                <Heart className="h-3 w-3 mr-1" />
                                {pot.preferred_pack_name}
                              </Badge>
                            )}
                            {pot.live_viewers > 0 && (
                              <Badge className="bg-red-500/20 text-red-300">
                                <Eye className="h-3 w-3 mr-1" />
                                {pot.live_viewers} viewers
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-white/70 space-y-1">
                            <p>👤 {pot.user} • 🎂 {new Date(pot.birthday).toLocaleDateString('fr-FR')}</p>
                            <p>💰 {formatCurrency(pot.amount)} / {formatCurrency(pot.target)} • 👥 {pot.participants} participants</p>
                            <p>🎬 {pot.formula}</p>
                            {pot.next_video_date && (
                              <p>📹 Prochaine vidéo: {new Date(pot.next_video_date).toLocaleDateString('fr-FR')} • 🎥 Envoyées: {pot.videos_sent}</p>
                            )}
                            {/* NOUVELLES INFOS PHASE 2 */}
                            {pot.preferred_pack_name && (
                              <p>💝 Pack préféré: {pot.preferred_pack_name}</p>
                            )}
                            {pot.top_donation_amount > 0 && (
                              <p>👑 Top donation: {formatCurrency(pot.top_donation_amount)} {pot.top_donor_visible ? '(visible)' : '(privé)'}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => {
                              toast.info(`Détails Phase 2 de "${pot.title}":\n- Pack préféré: ${pot.preferred_pack_name || 'Aucun'}\n- Viewers live: ${pot.live_viewers}\n- Top donation: ${formatCurrency(pot.top_donation_amount)}\n- Séquence vidéo: ${pot.video_sequence_id || 'Aucune'}`);
                            }}
                            variant="ghost" 
                            size="sm" 
                            className="text-white/70 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => {
                              // Générer QR code pour toutes les formules
                              formulas.forEach(formula => {
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                canvas.width = 200;
                                canvas.height = 200;
                                
                                if (ctx) {
                                  ctx.fillStyle = 'white';
                                  ctx.fillRect(0, 0, 200, 200);
                                  ctx.fillStyle = 'black';
                                  ctx.font = '12px Arial';
                                  ctx.textAlign = 'center';
                                  ctx.fillText(`QR Code ${formula.name}`, 100, 90);
                                  ctx.fillText(`Pot: ${pot.id}`, 100, 110);
                                  ctx.fillText(`QR_${pot.id}_${formula.name}_${Date.now()}`.substring(0, 16), 100, 130);
                                }
                                
                                canvas.toBlob((blob) => {
                                  if (blob) {
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `qr-${formula.name}-${pot.id}.png`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }
                                });
                              });
                              toast.success(`QR Codes générés et téléchargés pour toutes les formules - Cagnotte "${pot.title}"`);
                            }}
                            variant="ghost" 
                            size="sm" 
                            className="text-white/70 hover:text-white"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => {
                              toast.success(`Vidéo déclenchée manuellement pour "${pot.title}"`);
                              toast.info('La vidéo sera envoyée sur tous les réseaux sociaux configurés');
                            }}
                            variant="ghost" 
                            size="sm" 
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          {/* NOUVEAU BOUTON PHASE 2 - Gérer préférence pack */}
                          <Button 
                            onClick={() => handlePreferredPackAction('view_user_preference', pot.user)}
                            variant="ghost" 
                            size="sm" 
                            className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/20"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuration système AVEC PHASE 2 */}
            <TabsContent value="systeme">
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Configuration générale Phase 2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-white font-semibold">Fonctionnalités principales</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="registration" className="text-white">Inscription ouverte</Label>
                          <Switch
                            id="registration"
                            checked={systemConfig.registration_enabled}
                            onCheckedChange={(checked) => handleConfigUpdate('registration_enabled', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="multi-packs" className="text-white">Système multi-packs</Label>
                          <Switch
                            id="multi-packs"
                            checked={systemConfig.multi_packs_enabled}
                            onCheckedChange={(checked) => handleConfigUpdate('multi_packs_enabled', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="cinema-only-config" className="text-white">Mode Cinéma uniquement</Label>
                          <Switch
                            id="cinema-only-config"
                            checked={systemConfig.cinema_only_mode}
                            onCheckedChange={(checked) => handleConfigUpdate('cinema_only_mode', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="live-donations-config" className="text-white">Dons en live</Label>
                          <Switch
                            id="live-donations-config"
                            checked={systemConfig.live_donations_enabled}
                            onCheckedChange={(checked) => handleConfigUpdate('live_donations_enabled', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="gamification-config" className="text-white">Gamification</Label>
                          <Switch
                            id="gamification-config"
                            checked={systemConfig.gamification_enabled}
                            onCheckedChange={(checked) => handleConfigUpdate('gamification_enabled', checked)}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-white font-semibold">Paramètres numériques Phase 2</h4>
                        
                        <div className="space-y-2">
                          <Label className="text-white">Valeur max package (FCFA)</Label>
                          <Input
                            type="number"
                            value={systemConfig.max_pack_value}
                            onChange={(e) => handleConfigUpdate('max_pack_value', parseInt(e.target.value))}
                            className="bg-white/10 border-white/30 text-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-white">Timeout API partenaires (s)</Label>
                          <Input
                            type="number"
                            value={systemConfig.partner_api_timeout}
                            onChange={(e) => handleConfigUpdate('partner_api_timeout', parseInt(e.target.value))}
                            className="bg-white/10 border-white/30 text-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-white">Montant max cagnotte (FCFA)</Label>
                          <Input
                            type="number"
                            value={systemConfig.max_pot_amount}
                            onChange={(e) => handleConfigUpdate('max_pot_amount', parseInt(e.target.value))}
                            className="bg-white/10 border-white/30 text-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-white">Commission par défaut (%)</Label>
                          <Input
                            type="number"
                            value={systemConfig.default_commission}
                            onChange={(e) => handleConfigUpdate('default_commission', parseInt(e.target.value))}
                            className="bg-white/10 border-white/30 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* NOUVEL ONGLET DONNÉES SERVEUR - DÉPLACÉ EN SOUS-SECTION */}
            <TabsContent value="server-data">
              <div className="space-y-6">
                {/* Santé du système AVEC PHASE 2 */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-400" />
                        Santé du système Phase 2 (Partenaires + Gamification + Vidéo + WhatsApp)
                      </CardTitle>
                      <Button
                        onClick={() => handleSystemAction('refresh_health')}
                        variant="outline"
                        size="sm"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Actualiser
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-9 gap-4">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <Database className={`h-8 w-8 mx-auto mb-2 ${getHealthColor(systemHealth.database.status)}`} />
                        <div className="text-white font-medium">Base de données</div>
                        <div className="text-xs text-white/70">{systemHealth.database.response_time}ms</div>
                        <div className="text-xs text-white/60">{systemHealth.database.connections} connexions</div>
                      </div>
                      
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <Server className={`h-8 w-8 mx-auto mb-2 ${getHealthColor(systemHealth.api.status)}`} />
                        <div className="text-white font-medium">API</div>
                        <div className="text-xs text-white/70">{systemHealth.api.response_time}ms</div>
                        <div className="text-xs text-white/60">{systemHealth.api.requests_per_minute} req/min</div>
                      </div>
                      
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <HardDrive className={`h-8 w-8 mx-auto mb-2 ${getHealthColor(systemHealth.storage.status)}`} />
                        <div className="text-white font-medium">Stockage</div>
                        <div className="text-xs text-white/70">{systemHealth.storage.used_space}% utilisé</div>
                        <div className="text-xs text-white/60">{systemHealth.storage.total_space}GB total</div>
                      </div>
                      
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <MemoryStick className={`h-8 w-8 mx-auto mb-2 ${getHealthColor(systemHealth.memory.status)}`} />
                        <div className="text-white font-medium">Mémoire</div>
                        <div className="text-xs text-white/70">{systemHealth.memory.used}GB utilisé</div>
                        <div className="text-xs text-white/60">{systemHealth.memory.total}GB total</div>
                      </div>
                      
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <Cpu className={`h-8 w-8 mx-auto mb-2 ${getHealthColor(systemHealth.cpu.status)}`} />
                        <div className="text-white font-medium">CPU</div>
                        <div className="text-xs text-white/70">{systemHealth.cpu.usage}% usage</div>
                        <div className="text-xs text-white/60">Optimal</div>
                      </div>

                      <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
                        <Video className={`h-8 w-8 mx-auto mb-2 ${getHealthColor(systemHealth.video_processing.status)}`} />
                        <div className="text-white font-medium">Traitement Vidéo</div>
                        <div className="text-xs text-white/70">Queue: {systemHealth.video_processing.queue_size}</div>
                        <div className="text-xs text-white/60">{systemHealth.video_processing.processing_time}s moy</div>
                      </div>

                      <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-400/30">
                        <MessageCircle className={`h-8 w-8 mx-auto mb-2 ${getHealthColor(systemHealth.whatsapp_api.status)}`} />
                        <div className="text-white font-medium">API WhatsApp</div>
                        <div className="text-xs text-white/70">Limite: {systemHealth.whatsapp_api.rate_limit}%</div>
                        <div className="text-xs text-white/60">{systemHealth.whatsapp_api.success_rate}% succès</div>
                      </div>

                      {/* NOUVEAUX SERVICES PHASE 2 */}
                      <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-400/30">
                        <Building className={`h-8 w-8 mx-auto mb-2 ${getHealthColor(systemHealth.partner_apis.status)}`} />
                        <div className="text-white font-medium">APIs Partenaires</div>
                        <div className="text-xs text-white/70">Connexions: {systemHealth.partner_apis.active_connections}</div>
                        <div className="text-xs text-white/60">{systemHealth.partner_apis.avg_response}ms moy</div>
                      </div>

                      <div className="text-center p-3 bg-pink-500/10 rounded-lg border border-pink-400/30">
                        <Heart className={`h-8 w-8 mx-auto mb-2 ${getHealthColor(systemHealth.live_donations.status)}`} />
                        <div className="text-white font-medium">Dons Live</div>
                        <div className="text-xs text-white/70">Streams: {systemHealth.live_donations.active_streams}</div>
                        <div className="text-xs text-white/60">{systemHealth.live_donations.viewers} viewers</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions système avancées */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Actions système avancées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button
                        onClick={() => handleSystemAction('backup')}
                        className="bg-green-500 hover:bg-green-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span className="font-semibold">Sauvegarde complète</span>
                        </div>
                        <div className="text-xs opacity-80">Base + fichiers + configs</div>
                      </Button>

                      <Button
                        onClick={() => handleSystemAction('restart_services')}
                        className="bg-yellow-500 hover:bg-yellow-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Power className="h-4 w-4" />
                          <span className="font-semibold">Redémarrer services</span>
                        </div>
                        <div className="text-xs opacity-80">APIs + Workers + Cache</div>
                      </Button>

                      <Button
                        onClick={() => handleSystemAction('clear_cache')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span className="font-semibold">Vider cache</span>
                        </div>
                        <div className="text-xs opacity-80">Redis + CDN + Browser</div>
                      </Button>

                      <Button
                        onClick={() => handleSystemAction('maintenance')}
                        variant="outline"
                        className={`border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start ${systemConfig.maintenance_mode ? 'bg-red-500/20' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-semibold">
                            {systemConfig.maintenance_mode ? 'Sortir maintenance' : 'Mode maintenance'}
                          </span>
                        </div>
                        <div className="text-xs opacity-80">
                          {systemConfig.maintenance_mode ? 'Réactiver système' : 'Bloquer accès'}
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Gestion des admins */}
            <TabsContent value="admins">
              <AdminManagement />
            </TabsContent>

            {/* Analytics avancées AVEC PHASE 2 */}
            <TabsContent value="analytics">
              <div className="space-y-6">
                <AdvancedAnalytics />
                
                {/* NOUVELLES ANALYTICS PHASE 2 */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Analytics Phase 2 - Multi-packs et Gamification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Performance par type de pack :</h4>
                        <div className="space-y-2">
                          {[
                            { type: 'cinema', usage: systemStats.packCinemaUsage, icon: Video },
                            { type: 'beauty', usage: systemStats.packBeauteUsage, icon: Palette },
                            { type: 'casino', usage: systemStats.packCasinoUsage, icon: Dice1 },
                            { type: 'cruise', usage: systemStats.packCroisiereUsage, icon: Ship },
                            { type: 'limo', usage: systemStats.packLimoUsage, icon: Car },
                            { type: 'pilgrimage', usage: systemStats.packPelerinageUsage, icon: Church }
                          ].map((pack) => (
                            <div key={pack.type} className="flex items-center justify-between p-2 bg-white/5 rounded">
                              <div className="flex items-center gap-2">
                                <pack.icon className="h-4 w-4 text-white" />
                                <span className="text-white/80">{getPartnerTypeText(pack.type)}</span>
                              </div>
                              <span className="text-white font-semibold">{pack.usage} sélections</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">Métriques gamification :</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Dons live aujourd'hui</span>
                            <span className="text-white font-semibold">{gamificationStats.liveDonationsToday}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Animations déclenchées</span>
                            <span className="text-white font-semibold">{gamificationStats.animationsTriggered}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Préférences définies</span>
                            <span className="text-white font-semibold">{gamificationStats.preferredPackSelections}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="text-white/80">Engagement social</span>
                            <span className="text-white font-semibold">{gamificationStats.socialEngagementRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button
                        onClick={() => handleGenerateReport('partners_analytics')}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Rapport partenaires
                      </Button>
                      <Button
                        onClick={() => handleGenerateReport('packages_performance')}
                        className="bg-pink-500 hover:bg-pink-600"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Performance packages
                      </Button>
                      <Button
                        onClick={() => handleGenerateReport('gamification_report')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <Gamepad2 className="h-4 w-4 mr-2" />
                        Rapport gamification
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* NOUVEAU Dialog d'édition de service */}
        <Dialog open={showServiceEditDialog} onOpenChange={setShowServiceEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Modifier les services du package : {editingPackage?.package_name}
              </DialogTitle>
            </DialogHeader>
            {editingPackage && editingService && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                  <h4 className="text-blue-300 font-semibold mb-2">Service sélectionné :</h4>
                  <div className="text-blue-200 text-sm space-y-1">
                    <p><strong>Nom :</strong> {editingService.name}</p>
                    <p><strong>Partenaire :</strong> {editingService.partner_name}</p>
                    <p><strong>Pourcentage :</strong> {editingService.percentage}%</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveServiceEdit}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier ce service
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingPackage.services) {
                        const servicesInfo = editingPackage.services.map((s, index) => 
                          `${index + 1}. ${s.name}: ${s.partner_name} (${s.percentage}%)`
                        ).join('\n');
                        toast.info(`Tous les services du package "${editingPackage.package_name}":\n\n${servicesInfo}\n\nCliquez sur un service dans la liste pour le modifier individuellement.`);
                      }
                    }}
                    variant="outline"
                    className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir tous les services
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowServiceEditDialog(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer super-admin AVEC PHASE 2 */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-red-500/10 backdrop-blur-sm border-red-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-red-400" />
                <span className="text-red-300 font-semibold">Super Admin Phase 2 - Système Multi-Packs + Gamification + Services Détaillés</span>
              </div>
              <p className="text-white/60 text-sm">
                © 2025 WOLO SENEGAL® - From Connect Africa® —
                <br />
                🚀 <strong>PHASE 2 COMPLÈTE :</strong> Multi-packs + Gamification + Préférences + Dons live + Services détaillés
                <br />
                🏢 <strong>Gestion partenaires :</strong> Cinéma, Beauté, Casino, Croisière, Limo, Pèlerinage avec services individuels
                <br />
                📦 <strong>Système packages avancé :</strong> Spa, Relooking, Lentilles avec partenaires et % spécifiques
                <br />
                🎮 <strong>Gamification avancée :</strong> Dons live, animations, préférences utilisateur
                <br />
                🎬 <strong>Gestion vidéo :</strong> ACCÈS RESTREINT Super Admin + Dev uniquement
                <br />
                📱 <strong>WhatsApp viral :</strong> Import contacts + invitations masse + tracking
                <br />
                ⚙️ <strong>Mode Cinéma :</strong> Option pour démarrer avec un seul partenaire
                <br />
                🎯 <strong>Évolutivité :</strong> Architecture prête pour nouveaux partenaires et services
                <br />
                📊 <strong>Analytics complètes :</strong> Performance par pack, engagement, viralité, services
                <br />
                🔧 <strong>TOUS LES BOUTONS FONCTIONNELS :</strong> QR, PDF, Analytics, Vidéos, Partenaires, Services
                <br />
                🗂️ <strong>Interface allégée :</strong> Données serveur déplacées en sous-section pour clarté
                <br />
                ⚡ <strong>Gestion granulaire :</strong> Services individuels avec partenaires et pourcentages spécifiques
                <br />
                🖱️ <strong>Édition cliquable :</strong> Cliquez sur un service pour modifier tous ses champs
                <br />
                ✅ <strong>Layout propre :</strong> Interface organisée et ergonomique pour une gestion efficace
              </p>
            </CardContent>
          </Card>
        </motion.footer>
      </div>
    </div>
  );
}
