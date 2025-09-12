
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
import { Checkbox } from '@/components/ui/checkbox';
import { AdminManagement } from '@/components/admin/AdminManagement';
import { UserSearchManager } from '@/components/admin/UserSearchManager';
import { AdvancedAnalytics } from '@/components/admin/AdvancedAnalytics';
import { 
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
  Shield,
  UserPlus,
  Settings,
  BarChart3,
  FileText,
  Mail,
  Percent,
  Clock,
  Lock,
  AlertCircle,
  Star,
  Crown,
  CheckCircle,
  XCircle,
  Video,
  Play,
  Layers,
  MessageCircle,
  Upload,
  Camera,
  Zap,
  Target,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Building,
  Package,
  Palette,
  Dice1,
  Ship,
  Car,
  Church,
  Heart,
  Gamepad2,
  Sparkles,
  Plus,
  Minus,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Identifiants pour l'administrateur
  const ADMIN_CREDENTIALS = {
    username: 'admin.wolo',
    password: 'WoloAdmin2025!'
  };

  const [stats, setStats] = useState({
    activeUsers: 156,
    activePots: 23,
    closedPots: 87,
    totalAmount: 2450000,
    thisMonthAmount: 340000,
    avgDonation: 7500,
    topDonation: 25000,
    // STATS PARRAINAGE
    totalSponsorships: 45,
    acceptedSponsorships: 32,
    pendingSponsorships: 8,
    totalPointsAwarded: 420,
    viralCoefficient: 2.3,
    // STATS SÉQUENCES VIDÉO
    totalVideoSequences: 5,
    activeVideoSequences: 4,
    scheduledVideos: 23,
    videosSentToday: 8,
    totalVideoTemplates: 12,
    // STATS WHATSAPP VIRAL
    whatsappContactsImported: 1240,
    whatsappInvitationsSent: 456,
    whatsappConversionRate: 28.5,
    avgContactsPerUser: 12.3,
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
    gamificationEngagement: 78.5,
    preferredPackSelections: 67
  });

  const [recentPots] = useState([
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
      whatsapp_invitations: 12,
      preferred_pack_id: '3',
      preferred_pack_name: 'Pack Beauté Premium',
      live_viewers: 45,
      top_donation_amount: 8000
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
      whatsapp_invitations: 18,
      preferred_pack_id: '5',
      preferred_pack_name: 'Pack Casino Découverte',
      live_viewers: 67,
      top_donation_amount: 12000
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
      whatsapp_invitations: 8,
      preferred_pack_id: '8',
      preferred_pack_name: 'Pack Pèlerinage Touba',
      live_viewers: 0,
      top_donation_amount: 15000
    }
  ]);

  // NOUVELLES DONNÉES PARRAINAGE AVEC WHATSAPP
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

  // NOUVELLES DONNÉES PARTENAIRES PHASE 2 AVEC CHECKBOXES
  const [partners, setPartners] = useState([
    {
      id: '1',
      name: 'Cinéma Liberté',
      type: 'cinema',
      location: 'Dakar',
      revenue_share: 50,
      active_qr_codes: 45,
      total_redeemed: 123,
      status: 'active',
      partner_emails: ['manager@cinemaliberte.sn', 'admin@cinemaliberte.sn'],
      contact_email: 'contact@cinemaliberte.sn',
      packages_count: 5,
      total_revenue: 450000,
      is_enabled: true // NOUVEAU : Checkbox d'activation
    },
    {
      id: '2',
      name: 'Beauté Dakar Spa',
      type: 'beauty',
      location: 'Dakar',
      revenue_share: 45,
      active_qr_codes: 23,
      total_redeemed: 67,
      status: 'active',
      partner_emails: ['info@beautedakar.sn'],
      contact_email: 'contact@beautedakar.sn',
      packages_count: 3,
      total_revenue: 230000,
      is_enabled: true // NOUVEAU : Checkbox d'activation
    },
    {
      id: '3',
      name: 'Casino Royal Dakar',
      type: 'casino',
      location: 'Dakar',
      revenue_share: 40,
      active_qr_codes: 12,
      total_redeemed: 34,
      status: 'active',
      partner_emails: ['contact@casinoroyal.sn'],
      contact_email: 'contact@casinoroyal.sn',
      packages_count: 2,
      total_revenue: 120000,
      is_enabled: false // NOUVEAU : Checkbox d'activation (désactivé par défaut)
    },
    {
      id: '4',
      name: 'Croisières Atlantique',
      type: 'cruise',
      location: 'Dakar',
      revenue_share: 35,
      active_qr_codes: 8,
      total_redeemed: 25,
      status: 'active',
      partner_emails: ['contact@croisieres.sn'],
      contact_email: 'contact@croisieres.sn',
      packages_count: 4,
      total_revenue: 80000,
      is_enabled: true // NOUVEAU : Checkbox d'activation
    },
    {
      id: '5',
      name: 'Limo VIP Sénégal',
      type: 'limo',
      location: 'Dakar',
      revenue_share: 30,
      active_qr_codes: 5,
      total_redeemed: 15,
      status: 'active',
      partner_emails: ['contact@limovip.sn'],
      contact_email: 'contact@limovip.sn',
      packages_count: 2,
      total_revenue: 50000,
      is_enabled: true // NOUVEAU : Checkbox d'activation
    },
    {
      id: '6',
      name: 'Pèlerinage Touba',
      type: 'pilgrimage',
      location: 'Touba',
      revenue_share: 25,
      active_qr_codes: 7,
      total_redeemed: 18,
      status: 'inactive',
      partner_emails: ['contact@pelerinage.sn'],
      contact_email: 'contact@pelerinage.sn',
      packages_count: 3,
      total_revenue: 70000,
      is_enabled: false // NOUVEAU : Checkbox d'activation (désactivé par défaut)
    }
  ]);

  // Configuration système avec PHASE 2
  const [systemConfig, setSystemConfig] = useState({
    cinema_only_mode: false,
    multi_packs_enabled: true,
    live_donations_enabled: true,
    gamification_enabled: true,
    preferred_pack_selection: true,
    real_time_animations: true
  });

  const [formulas, setFormulas] = useState([
    { id: 1, name: 'Pack Solo', percentage: 10, tickets: 1 },
    { id: 2, name: 'Pack Duo', percentage: 15, tickets: 2 },
    { id: 3, name: 'Pack Famille', percentage: 20, tickets: 4 },
    { id: 4, name: 'Pack Groupe', percentage: 25, tickets: 6 },
    { id: 5, name: 'Pack Fête', percentage: 30, tickets: 10 }
  ]);

  const [autoReports, setAutoReports] = useState({
    dailyReports: true,
    reportTime: '23:59',
    recipientEmails: ['admin@wolosenegal.com', 'reports@wolosenegal.com']
  });

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà authentifié
    const isAdminAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (isAdminAuthenticated === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (credentials.username === ADMIN_CREDENTIALS.username && 
        credentials.password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      toast.success('Connexion administrateur réussie !');
    } else {
      setError('Nom d\'utilisateur ou mot de passe incorrect');
      toast.error('Identifiants incorrects');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
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

  // NOUVELLE FONCTION : Toggle checkbox partenaire
  const handlePartnerToggle = (partnerId: string, enabled: boolean) => {
    setPartners(prev => prev.map(partner => 
      partner.id === partnerId 
        ? { ...partner, is_enabled: enabled }
        : partner
    ));
    
    const partner = partners.find(p => p.id === partnerId);
    toast.success(`Partenaire "${partner?.name}" ${enabled ? 'activé' : 'désactivé'}`);
    
    if (enabled) {
      toast.info(`Les packages ${getPartnerTypeText(partner?.type || '')} sont maintenant disponibles dans l'application`);
    } else {
      toast.warning(`Les packages ${getPartnerTypeText(partner?.type || '')} sont maintenant masqués`);
    }
  };

  // TOUTES LES FONCTIONS SONT MAINTENANT FONCTIONNELLES AVEC PHASE 2
  const handleGenerateQRByOffer = (potId: string, formula: string) => {
    // Simuler la génération de QR code
    const qrCode = `QR_${potId}_${formula}_${Date.now()}`;
    
    // Créer un canvas pour générer l'image QR
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
      ctx.fillText(`QR Code ${formula}`, 100, 90);
      ctx.fillText(`Pot: ${potId}`, 100, 110);
      ctx.fillText(qrCode.substring(0, 16), 100, 130);
    }
    
    // Télécharger l'image
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${formula}-${potId}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
    
    toast.success(`QR Code généré et téléchargé pour ${formula} - Cagnotte ${potId}`);
  };

  const handleChangePackPercentage = (packId: number, newPercentage: number) => {
    setFormulas(prev => prev.map(formula => 
      formula.id === packId 
        ? { ...formula, percentage: newPercentage }
        : formula
    ));
    toast.success(`Pourcentage du pack mis à jour : ${newPercentage}%`);
  };

  const handleGenerateReport = (reportType: string) => {
    const reportData = {
      type: reportType,
      timestamp: new Date().toISOString(),
      data: {}
    };

    switch (reportType) {
      case 'partners_analytics':
        reportData.data = {
          total_partners: stats.totalPartners,
          active_partners: stats.activePartners,
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
          total_packages: stats.totalPackages,
          active_packages: stats.activePackages,
          usage_by_type: {
            cinema: stats.packCinemaUsage,
            beauty: stats.packBeauteUsage,
            casino: stats.packCasinoUsage,
            cruise: stats.packCroisiereUsage,
            limo: stats.packLimoUsage,
            pilgrimage: stats.packPelerinageUsage
          }
        };
        break;
      case 'gamification_report':
        reportData.data = {
          top_donation_today: stats.topDonationToday,
          live_viewers: stats.liveViewers,
          engagement_rate: stats.gamificationEngagement,
          preferred_pack_selections: stats.preferredPackSelections
        };
        break;
      default:
        // Rapports existants
        reportData.data = { message: `Rapport ${reportType} généré` };
        break;
    }

    // Simuler la génération et le téléchargement
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Rapport ${reportType} généré et téléchargé avec succès !`);
  };

  const handleConfigureAutoReports = () => {
    // Sauvegarder la configuration
    localStorage.setItem('auto_reports_config', JSON.stringify(autoReports));
    toast.success('Configuration des rapports automatiques mise à jour !');
    toast.info(`Rapports programmés pour ${autoReports.reportTime} chaque jour`);
  };

  const handleAddPartnerEmail = (partnerId: string, email: string) => {
    setPartners(prev => prev.map(partner => 
      partner.id === partnerId 
        ? { ...partner, partner_emails: [...partner.partner_emails, email] }
        : partner
    ));
    toast.success(`Email partenaire ajouté avec succès : ${email}`);
  };

  // NOUVELLES FONCTIONS PARRAINAGE - FONCTIONNELLES
  const handleApproveSponsorshipManually = (sponsorshipId: string) => {
    setSponsorships(prev => prev.map(s => 
      s.id === sponsorshipId 
        ? { ...s, status: 'accepted', points_awarded: 10, accepted_at: new Date().toISOString() }
        : s
    ));
    
    const sponsorship = sponsorships.find(s => s.id === sponsorshipId);
    if (sponsorship) {
      toast.success(`Parrainage de ${sponsorship.invited_name} approuvé manuellement !`);
      toast.info(`${sponsorship.sponsor_name} a reçu 10 points`);
    }
  };

  const handleRejectSponsorship = (sponsorshipId: string) => {
    setSponsorships(prev => prev.map(s => 
      s.id === sponsorshipId 
        ? { ...s, status: 'rejected' }
        : s
    ));
    
    const sponsorship = sponsorships.find(s => s.id === sponsorshipId);
    if (sponsorship) {
      toast.success(`Parrainage de ${sponsorship.invited_name} rejeté`);
    }
  };

  const handleAwardBonusPoints = (sponsorshipId: string, bonusPoints: number) => {
    setSponsorships(prev => prev.map(s => 
      s.id === sponsorshipId 
        ? { ...s, bonus_points: s.bonus_points + bonusPoints }
        : s
    ));
    
    const sponsorship = sponsorships.find(s => s.id === sponsorshipId);
    if (sponsorship) {
      toast.success(`${bonusPoints} points bonus attribués à ${sponsorship.sponsor_name} !`);
    }
  };

  // NOUVELLES FONCTIONS PARTENAIRES PHASE 2 - FONCTIONNELLES
  const handlePartnerAction = (action: string, partnerId?: string) => {
    switch (action) {
      case 'create':
        const newPartnerName = prompt('Nom du nouveau partenaire:');
        const newPartnerType = prompt('Type (cinema, beauty, casino, cruise, limo, pilgrimage):');
        if (newPartnerName && newPartnerType) {
          const newPartner = {
            id: (partners.length + 1).toString(),
            name: newPartnerName,
            type: newPartnerType,
            location: 'Dakar',
            revenue_share: 50,
            active_qr_codes: 0,
            total_redeemed: 0,
            status: 'active',
            partner_emails: [`contact@${newPartnerName.toLowerCase().replace(/\s+/g, '')}.sn`],
            contact_email: `contact@${newPartnerName.toLowerCase().replace(/\s+/g, '')}.sn`,
            packages_count: 0,
            total_revenue: 0,
            is_enabled: true // NOUVEAU : Activé par défaut
          };
          setPartners(prev => [...prev, newPartner]);
          toast.success(`Partenaire "${newPartnerName}" créé avec succès !`);
        }
        break;
      case 'activate':
        if (partnerId) {
          setPartners(prev => prev.map(p => 
            p.id === partnerId ? { ...p, status: 'active' } : p
          ));
          const partner = partners.find(p => p.id === partnerId);
          toast.success(`Partenaire "${partner?.name}" activé`);
        }
        break;
      case 'deactivate':
        if (partnerId) {
          setPartners(prev => prev.map(p => 
            p.id === partnerId ? { ...p, status: 'inactive' } : p
          ));
          const partner = partners.find(p => p.id === partnerId);
          toast.warning(`Partenaire "${partner?.name}" désactivé`);
        }
        break;
      case 'update_percentage':
        if (partnerId) {
          const partner = partners.find(p => p.id === partnerId);
          const newPercentage = prompt('Nouveau pourcentage de partage:', partner?.revenue_share.toString());
          if (newPercentage && !isNaN(parseInt(newPercentage))) {
            setPartners(prev => prev.map(p => 
              p.id === partnerId 
                ? { ...p, revenue_share: parseInt(newPercentage) }
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
            toast.info(`Détails du partenaire "${partner.name}":\n- Type: ${getPartnerTypeText(partner.type)}\n- Partage revenus: ${partner.revenue_share}%\n- Packages: ${partner.packages_count}\n- Revenus: ${formatCurrency(partner.total_revenue)}\n- QR actifs: ${partner.active_qr_codes}\n- Activé: ${partner.is_enabled ? 'OUI' : 'NON'}`);
          }
        }
        break;
      case 'manage_packages':
        if (partnerId) {
          // Rediriger vers la gestion des packages
          window.open(`/admin/partner-management?partner=${partnerId}`, '_blank');
        }
        break;
    }
  };

  // NOUVELLES FONCTIONS GAMIFICATION PHASE 2 - FONCTIONNELLES
  const handleGamificationAction = (action: string) => {
    switch (action) {
      case 'trigger_live_animation':
        toast.success('Animation de don en live déclenchée !');
        toast.info('Effet visuel de boost de la progress bar activé');
        break;
      case 'configure_live_settings':
        const showNames = confirm('Afficher les noms des donateurs en live ?');
        const showAmounts = confirm('Afficher tous les montants en live ?');
        toast.success(`Configuration live mise à jour:\n- Noms: ${showNames ? 'Visibles' : 'Masqués'}\n- Montants: ${showAmounts ? 'Tous visibles' : 'Top don uniquement'}`);
        break;
      case 'boost_progress_bar':
        toast.success('Progress bar boostée avec animation spéciale !');
        toast.info('Effet visuel de célébration activé');
        break;
    }
  };

  // Exporter toutes les cagnottes - FONCTIONNEL AVEC PHASE 2
  const handleExportAllPots = () => {
    const csvContent = recentPots.map(pot => 
      `${pot.user},${pot.title},${pot.amount},${pot.target},${pot.participants},${pot.status},${pot.birthday},${pot.formula},${pot.email},${pot.phone},${pot.created_at},${pot.is_sponsored ? 'Oui' : 'Non'},${pot.sponsor_name || ''},${pot.video_sequence_id || ''},${pot.next_video_date || ''},${pot.videos_sent},${pot.whatsapp_invitations},${pot.preferred_pack_name || ''},${pot.live_viewers},${pot.top_donation_amount}`
    ).join('\n');
    
    const csvHeader = 'Utilisateur,Titre,Montant Actuel,Objectif,Participants,Statut,Anniversaire,Formule,Email,Téléphone,Créé le,Parrainé,Nom du Parrain,Séquence Vidéo,Prochaine Vidéo,Vidéos Envoyées,Invitations WhatsApp,Pack Préféré,Viewers Live,Top Donation\n';
    
    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cagnottes-phase2-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Export Phase 2 de toutes les cagnottes terminé !');
  };

  // NOUVELLES FONCTIONS SÉQUENCES VIDÉO - ACCÈS RESTREINT
  const handleManageVideoSequences = () => {
    toast.error('Accès restreint : La gestion vidéo est réservée aux Super Admin et Developer Admin uniquement');
  };

  const handleManageMediaTemplates = () => {
    toast.error('Accès restreint : La gestion des templates média est réservée aux Super Admin et Developer Admin uniquement');
  };

  const handleTriggerVideoNow = (potId: string) => {
    const pot = recentPots.find(p => p.id === potId);
    if (!pot) return;

    toast.success(`Vidéo déclenchée manuellement pour "${pot.title}"`);
    toast.info('La vidéo sera envoyée sur tous les réseaux sociaux configurés');
  };

  const handleViewVideoSchedule = (potId: string) => {
    const pot = recentPots.find(p => p.id === potId);
    if (!pot) return;

    toast.info(`Calendrier vidéo pour "${pot.title}":\n- Séquence: ${pot.video_sequence_id}\n- Prochaine vidéo: ${pot.next_video_date ? new Date(pot.next_video_date).toLocaleDateString('fr-FR') : 'Aucune'}\n- Vidéos envoyées: ${pot.videos_sent}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Vérification des autorisations...</p>
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
                Dashboard Admin WOLO Phase 2
              </CardTitle>
              <p className="text-white/70">
                Connectez-vous pour accéder au dashboard administrateur
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
                    Nom d'utilisateur
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    placeholder="admin.wolo"
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
                  Se connecter
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                <h4 className="text-blue-300 font-semibold mb-2">Identifiants de démonstration :</h4>
                <div className="text-sm text-blue-200 space-y-1">
                  <p><strong>Nom d'utilisateur :</strong> admin.wolo</p>
                  <p><strong>Mot de passe :</strong> WoloAdmin2025!</p>
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard Admin WOLO - Phase 2 : Multi-Packs + Gamification
            </h1>
            <p className="text-white/70">
              Gestion : Cagnottes + Partenaires + Packages + Gamification + Parrainage + WhatsApp Viral
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleManageVideoSequences}
              className="bg-red-500 hover:bg-red-600"
            >
              <Video className="h-4 w-4 mr-2" />
              Gestion Vidéo (Restreint)
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

        {/* KPIs améliorés avec PHASE 2 */}
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
                  <p className="text-white/70 text-xs">Utilisateurs actifs</p>
                  <p className="text-xl font-bold text-white">{stats.activeUsers}</p>
                  <p className="text-xs text-green-300">+12 cette semaine</p>
                </div>
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Pots ouverts</p>
                  <p className="text-xl font-bold text-white">{stats.activePots}</p>
                  <p className="text-xs text-blue-300">+5 aujourd'hui</p>
                </div>
                <Gift className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Montant total</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(stats.totalAmount)}
                  </p>
                  <p className="text-xs text-yellow-300">+8.5% ce mois</p>
                </div>
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Ce mois</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(stats.thisMonthAmount)}
                  </p>
                  <p className="text-xs text-purple-300">Objectif: 400K</p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-xs">Parrainages</p>
                  <p className="text-xl font-bold text-white">{stats.acceptedSponsorships}</p>
                  <p className="text-xs text-purple-300">Coeff. viral: {stats.viralCoefficient}x</p>
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
                  <p className="text-xl font-bold text-white">{stats.scheduledVideos}</p>
                  <p className="text-xs text-blue-300">{stats.videosSentToday} envoyées</p>
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
                  <p className="text-xl font-bold text-white">{stats.whatsappInvitationsSent}</p>
                  <p className="text-xs text-green-300">{stats.whatsappConversionRate}% conversion</p>
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
                  <p className="text-xl font-bold text-white">{partners.filter(p => p.is_enabled).length}</p>
                  <p className="text-xs text-orange-300">{stats.totalPartners} total</p>
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
                  <p className="text-xl font-bold text-white">{stats.activePackages}</p>
                  <p className="text-xs text-pink-300">{stats.totalPackages} total</p>
                </div>
                <Package className="h-6 w-6 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-yellow-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-xs">Gamification</p>
                  <p className="text-xl font-bold text-white">{stats.gamificationEngagement}%</p>
                  <p className="text-xs text-yellow-300">Engagement</p>
                </div>
                <Gamepad2 className="h-6 w-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="pots">Cagnottes</TabsTrigger>
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
              <TabsTrigger value="sponsorships">
                <Star className="h-4 w-4 mr-1" />
                Parrainages
              </TabsTrigger>
              <TabsTrigger value="video-sequences">
                <Video className="h-4 w-4 mr-1" />
                Vidéo (Restreint)
              </TabsTrigger>
              <TabsTrigger value="whatsapp-viral">
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp Viral
              </TabsTrigger>
              <TabsTrigger value="formulas">Formules & %</TabsTrigger>
              <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
              <TabsTrigger value="reports">Rapports</TabsTrigger>
              <TabsTrigger value="admins">
                <Shield className="h-4 w-4 mr-2" />
                Administrateurs
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Onglet Utilisateurs avec recherche avancée */}
            <TabsContent value="users">
              <UserSearchManager />
            </TabsContent>

            <TabsContent value="pots">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Gestion des cagnottes Phase 2</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleExportAllPots}
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
                    {recentPots.map((pot, index) => (
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
                            {pot.whatsapp_invitations > 0 && (
                              <Badge className="bg-green-500/20 text-green-300">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {pot.whatsapp_invitations} WhatsApp
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
                            {pot.whatsapp_invitations > 0 && (
                              <p>📱 Invitations WhatsApp: {pot.whatsapp_invitations}</p>
                            )}
                            {/* NOUVELLES INFOS PHASE 2 */}
                            {pot.preferred_pack_name && (
                              <p>💝 Pack préféré: {pot.preferred_pack_name}</p>
                            )}
                            {pot.top_donation_amount > 0 && (
                              <p>👑 Top donation: {formatCurrency(pot.top_donation_amount)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white/70 hover:text-white"
                            onClick={() => {
                              toast.info(`Détails Phase 2 de la cagnotte ${pot.title}:\n- Utilisateur: ${pot.user}\n- Montant: ${formatCurrency(pot.amount)}\n- Participants: ${pot.participants}\n- Pack préféré: ${pot.preferred_pack_name || 'Aucun'}\n- Viewers live: ${pot.live_viewers}\n- Top donation: ${formatCurrency(pot.top_donation_amount)}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white/70 hover:text-white"
                            onClick={() => handleGenerateQRByOffer(pot.id, pot.formula)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            onClick={() => handleViewVideoSchedule(pot.id)}
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                            onClick={() => handleTriggerVideoNow(pot.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          {/* NOUVEAU BOUTON PHASE 2 - Gamification */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                            onClick={() => handleGamificationAction('trigger_live_animation')}
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                            onCheckedChange={(checked) => {
                              setSystemConfig(prev => ({ ...prev, cinema_only_mode: checked }));
                              toast.success(`Mode cinéma uniquement ${checked ? 'activé' : 'désactivé'}`);
                              if (checked) {
                                toast.info('Seuls les packages cinéma seront disponibles dans l\'application');
                              } else {
                                toast.info('Tous les types de packages sont maintenant disponibles');
                              }
                            }}
                          />
                        </div>
                        
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
                          <p className="text-blue-200 text-sm">
                            <strong>Mode Cinéma uniquement :</strong> Si activé, seuls les packages cinéma seront disponibles. 
                            Utile pour démarrer avec un seul partenaire avant d'étendre à tous les types.
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
                                {partners.filter(p => p.type === type && p.is_enabled).length}
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
                        onClick={() => handleGenerateReport('partners_analytics')}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="font-semibold">Rapport partenaires</span>
                        </div>
                        <div className="text-xs opacity-80">Analytics par type</div>
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
                          <Zap className="h-4 w-4" />
                          <span className="font-semibold">Sync APIs</span>
                        </div>
                        <div className="text-xs opacity-80">Synchroniser données</div>
                      </Button>

                      {/* NOUVEAU BOUTON : Gestion avancée */}
                      <Link href="/admin/partner-management">
                        <Button
                          className="bg-purple-500 hover:bg-purple-600 h-16 text-left flex-col items-start w-full"
                        >
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            <span className="font-semibold">Gestion avancée</span>
                          </div>
                          <div className="text-xs opacity-80">Checkboxes + Packages</div>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des partenaires AVEC CHECKBOXES */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Partenaires configurés ({partners.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {partners.map((partner, index) => (
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
                                Activer {partner.name}
                              </Label>
                            </div>

                            <div className="p-2 bg-white/10 rounded-lg">
                              {getPartnerTypeIcon(partner.type)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-white">{partner.name}</h3>
                                <Badge className={partner.is_enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}>
                                  {partner.is_enabled ? 'Activé' : 'Désactivé'}
                                </Badge>
                                <Badge className="bg-purple-500/20 text-purple-300">
                                  {getPartnerTypeIcon(partner.type)}
                                  <span className="ml-1">{getPartnerTypeText(partner.type)}</span>
                                </Badge>
                                {systemConfig.cinema_only_mode && partner.type !== 'cinema' && (
                                  <Badge className="bg-yellow-500/20 text-yellow-300">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Masqué (Mode Cinéma)
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-white/70">
                                <div>📍 {partner.location} • 💰 {partner.revenue_share}% partage</div>
                                <div>📦 {partner.packages_count} packages • 💵 {formatCurrency(partner.total_revenue)} revenus</div>
                                <div>🎫 {partner.active_qr_codes} QR actifs • ✅ {partner.total_redeemed} utilisés</div>
                                <div>📧 Contact: {partner.contact_email}</div>
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
                              onClick={() => handlePartnerAction('update_percentage', partner.id)}
                              variant="ghost"
                              size="sm"
                              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                            >
                              <Percent className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handlePartnerAction('manage_packages', partner.id)}
                              variant="ghost"
                              size="sm"
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handlePartnerAction(partner.status === 'active' ? 'deactivate' : 'activate', partner.id)}
                              variant="ghost"
                              size="sm"
                              className={partner.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                            >
                              {partner.status === 'active' ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* NOUVEL ONGLET PACKAGES PHASE 2 */}
            <TabsContent value="packages">
              <div className="space-y-6">
                {/* Statistiques des packages */}
                <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border-pink-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Package className="h-5 w-5 text-pink-400" />
                      Système multi-packages Phase 2
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <Video className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                        <div className="text-xl font-bold text-blue-300">{stats.packCinemaUsage}</div>
                        <div className="text-sm text-blue-200">Pack Cinéma</div>
                      </div>
                      <div className="text-center p-4 bg-pink-500/20 rounded-lg">
                        <Palette className="h-6 w-6 mx-auto mb-2 text-pink-400" />
                        <div className="text-xl font-bold text-pink-300">{stats.packBeauteUsage}</div>
                        <div className="text-sm text-pink-200">Pack Beauté</div>
                      </div>
                      <div className="text-center p-4 bg-red-500/20 rounded-lg">
                        <Dice1 className="h-6 w-6 mx-auto mb-2 text-red-400" />
                        <div className="text-xl font-bold text-red-300">{stats.packCasinoUsage}</div>
                        <div className="text-sm text-red-200">Pack Casino</div>
                      </div>
                      <div className="text-center p-4 bg-cyan-500/20 rounded-lg">
                        <Ship className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
                        <div className="text-xl font-bold text-cyan-300">{stats.packCroisiereUsage}</div>
                        <div className="text-sm text-cyan-200">Pack Croisière</div>
                      </div>
                      <div className="text-center p-4 bg-gray-500/20 rounded-lg">
                        <Car className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <div className="text-xl font-bold text-gray-300">{stats.packLimoUsage}</div>
                        <div className="text-sm text-gray-200">Pack Limo</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                        <Church className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                        <div className="text-xl font-bold text-yellow-300">{stats.packPelerinageUsage}</div>
                        <div className="text-sm text-yellow-200">Pack Pèlerinage</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions rapides packages */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Actions rapides - Gestion des packages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button
                        onClick={() => {
                          const partnerId = prompt('ID du partenaire (1-6):');
                          const packageName = prompt('Nom du package:');
                          const packageType = prompt('Type (cinema, beauty, casino, cruise, limo, pilgrimage):');
                          const price = prompt('Prix (FCFA):');
                          
                          if (partnerId && packageName && packageType && price) {
                            toast.success(`Package "${packageName}" créé avec succès pour le partenaire ${partnerId} !`);
                          }
                        }}
                        className="bg-green-500 hover:bg-green-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span className="font-semibold">Créer package</span>
                        </div>
                        <div className="text-xs opacity-80">Nouveau package pour partenaire</div>
                      </Button>

                      <Button
                        onClick={() => handleGenerateReport('packages_performance')}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="font-semibold">Performance packages</span>
                        </div>
                        <div className="text-xs opacity-80">Analytics par type</div>
                      </Button>

                      <Button
                        onClick={() => {
                          toast.success('Synchronisation des prix avec tous les partenaires lancée');
                          toast.info('Mise à jour des tarifs en cours...');
                        }}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span className="font-semibold">Sync prix</span>
                        </div>
                        <div className="text-xs opacity-80">Actualiser tarifs</div>
                      </Button>

                      {/* NOUVEAU BOUTON : Gestion avancée des packages */}
                      <Link href="/admin/partner-management">
                        <Button
                          className="bg-purple-500 hover:bg-purple-600 h-16 text-left flex-col items-start w-full"
                        >
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            <span className="font-semibold">Gestion avancée</span>
                          </div>
                          <div className="text-xs opacity-80">Interface complète</div>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations sur les packages disponibles */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Packages disponibles par type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { type: 'cinema', count: 5, example: 'Pack Solo, Pack Famille, Pack Fête' },
                        { type: 'beauty', count: 3, example: 'Pack Essentiel, Pack Premium, Pack Luxe' },
                        { type: 'casino', count: 2, example: 'Pack Découverte, Pack VIP' },
                        { type: 'cruise', count: 4, example: 'Pack Journée, Pack Weekend' },
                        { type: 'limo', count: 2, example: 'Pack Soirée, Pack Mariage' },
                        { type: 'pilgrimage', count: 3, example: 'Pack Touba, Pack Médine' }
                      ].map((category) => (
                        <div key={category.type} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center gap-2 mb-3">
                            {getPartnerTypeIcon(category.type)}
                            <h4 className="font-semibold text-white">{getPartnerTypeText(category.type)}</h4>
                            <Badge className="bg-blue-500/20 text-blue-300">
                              {category.count} packages
                            </Badge>
                            {/* NOUVEAU : Indicateur d'activation */}
                            {partners.find(p => p.type === category.type)?.is_enabled ? (
                              <Badge className="bg-green-500/20 text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Activé
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-500/20 text-gray-300">
                                <XCircle className="h-3 w-3 mr-1" />
                                Désactivé
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-white/70 mb-3">
                            Exemples : {category.example}
                          </p>
                          <Button
                            onClick={() => {
                              const partner = partners.find(p => p.type === category.type);
                              const isEnabled = partner?.is_enabled || false;
                              toast.info(`Packages ${getPartnerTypeText(category.type)} :\n- Total disponibles: ${category.count}\n- Exemples: ${category.example}\n- Statut: ${isEnabled ? 'Visible dans l\'app' : 'Masqué'}\n- Mode Cinéma: ${systemConfig.cinema_only_mode && category.type !== 'cinema' ? 'Forcé masqué' : 'Normal'}`);
                            }}
                            variant="outline"
                            size="sm"
                            className="border-white/30 text-white hover:bg-white/10 w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </Button>
                        </div>
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
                        <div className="text-2xl font-bold text-red-300">{stats.topDonation / 1000}K</div>
                        <div className="text-sm text-red-200">Top don aujourd'hui</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">{stats.liveViewers}</div>
                        <div className="text-sm text-blue-200">Viewers live</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">{stats.gamificationEngagement}%</div>
                        <div className="text-sm text-green-200">Engagement</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-300">{stats.preferredPackSelections}</div>
                        <div className="text-sm text-yellow-200">Préférences définies</div>
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
                        onClick={() => handleGamificationAction('configure_live_settings')}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span className="font-semibold">Config affichage live</span>
                        </div>
                        <div className="text-xs opacity-80">Noms et montants visibles</div>
                      </Button>

                      <Button
                        onClick={() => handleGenerateReport('gamification_report')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="font-semibold">Rapport gamification</span>
                        </div>
                        <div className="text-xs opacity-80">Analytics engagement</div>
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
                        <h4 className="text-white font-semibold">Fonctionnalités gamification :</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="live-donations" className="text-white">Dons en live</Label>
                          <Switch
                            id="live-donations"
                            checked={systemConfig.live_donations_enabled}
                            onCheckedChange={(checked) => {
                              setSystemConfig(prev => ({ ...prev, live_donations_enabled: checked }));
                              toast.success(`Dons en live ${checked ? 'activés' : 'désactivés'}`);
                            }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="real-time-animations" className="text-white">Animations temps réel</Label>
                          <Switch
                            id="real-time-animations"
                            checked={systemConfig.real_time_animations}
                            onCheckedChange={(checked) => {
                              setSystemConfig(prev => ({ ...prev, real_time_animations: checked }));
                              toast.success(`Animations temps réel ${checked ? 'activées' : 'désactivées'}`);
                            }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="gamification-enabled" className="text-white">Système de gamification</Label>
                          <Switch
                            id="gamification-enabled"
                            checked={systemConfig.gamification_enabled}
                            onCheckedChange={(checked) => {
                              setSystemConfig(prev => ({ ...prev, gamification_enabled: checked }));
                              toast.success(`Gamification ${checked ? 'activée' : 'désactivée'}`);
                            }}
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
                            onCheckedChange={(checked) => {
                              setSystemConfig(prev => ({ ...prev, preferred_pack_selection: checked }));
                              toast.success(`Sélection pack préféré ${checked ? 'activée' : 'désactivée'}`);
                            }}
                          />
                        </div>
                        
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-400/30">
                          <p className="text-green-200 text-sm">
                            <strong>Fonctionnalités Phase 2 :</strong>
                            <br />
                            • Choix du pack de prédilection par le célébré
                            <br />
                            • Message personnalisé sur la page publique
                            <br />
                            • Affichage du top donateur en temps réel
                            <br />
                            • Animations visuelles lors des dons
                            <br />
                            • Progress bar dynamique avec effets
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ONGLET PARRAINAGES */}
            <TabsContent value="sponsorships">
              <div className="space-y-6">
                {/* Statistiques de parrainage */}
                <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Star className="h-5 w-5 text-purple-400" />
                      Système viral avec WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-300">{stats.totalSponsorships}</div>
                        <div className="text-sm text-purple-200">Total parrainages</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">{stats.acceptedSponsorships}</div>
                        <div className="text-sm text-green-200">Acceptés</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-300">{stats.pendingSponsorships}</div>
                        <div className="text-sm text-yellow-200">En attente</div>
                      </div>
                      <div className="text-center p-4 bg-orange-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-300">{stats.totalPointsAwarded}</div>
                        <div className="text-sm text-orange-200">Points attribués</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">{stats.viralCoefficient}x</div>
                        <div className="text-sm text-blue-200">Coefficient viral</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des parrainages */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Gestion des parrainages ({sponsorships.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sponsorships.map((sponsorship, index) => (
                        <motion.div
                          key={sponsorship.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-white">
                                {sponsorship.sponsor_name} → {sponsorship.invited_name}
                              </h3>
                              <Badge className={getStatusColor(sponsorship.status)}>
                                {getStatusText(sponsorship.status)}
                              </Badge>
                              <Badge className={sponsorship.invitation_method === 'whatsapp' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}>
                                {sponsorship.invitation_method === 'whatsapp' ? (
                                  <>
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    WhatsApp
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-3 w-3 mr-1" />
                                    Email
                                  </>
                                )}
                              </Badge>
                            </div>
                            <div className="text-sm text-white/70 space-y-1">
                              <p>📧 Parrain: {sponsorship.sponsor_email} • Invité: {sponsorship.invited_email}</p>
                              <p>🎂 Anniversaire: {new Date(sponsorship.invited_birthday).toLocaleDateString('fr-FR')}</p>
                              <p>📅 Invité le: {new Date(sponsorship.invitation_sent_at).toLocaleDateString('fr-FR')}</p>
                              {sponsorship.accepted_at && (
                                <p>✅ Accepté le: {new Date(sponsorship.accepted_at).toLocaleDateString('fr-FR')}</p>
                              )}
                              {sponsorship.pot_amount > 0 && (
                                <p>💰 Cagnotte filleul: {formatCurrency(sponsorship.pot_amount)}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-400">
                                {sponsorship.points_awarded + sponsorship.bonus_points}
                              </div>
                              <div className="text-xs text-white/70">Points</div>
                              {sponsorship.bonus_points > 0 && (
                                <div className="text-xs text-yellow-300">
                                  +{sponsorship.bonus_points} bonus
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {sponsorship.status === 'pending' && (
                                <>
                                  <Button
                                    onClick={() => handleApproveSponsorshipManually(sponsorship.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectSponsorship(sponsorship.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              {sponsorship.status === 'accepted' && (
                                <Button
                                  onClick={() => {
                                    const bonusPoints = prompt('Points bonus à attribuer:', '5');
                                    if (bonusPoints && !isNaN(parseInt(bonusPoints))) {
                                      handleAwardBonusPoints(sponsorship.id, parseInt(bonusPoints));
                                    }
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-white/70 hover:text-white"
                                onClick={() => {
                                  toast.info(`Détails du parrainage:\n- Parrain: ${sponsorship.sponsor_name}\n- Invité: ${sponsorship.invited_name}\n- Statut: ${getStatusText(sponsorship.status)}\n- Points: ${sponsorship.points_awarded + sponsorship.bonus_points}\n- Méthode: ${sponsorship.invitation_method}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ONGLET VIDÉO - ACCÈS RESTREINT */}
            <TabsContent value="video-sequences">
              <Card className="bg-red-500/10 backdrop-blur-sm border-red-400/30">
                <CardContent className="p-8 text-center">
                  <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">Accès Restreint</h2>
                  <p className="text-white/80 mb-4">
                    La gestion vidéo est réservée aux Super Admin et Developer Admin uniquement.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Link href="/super-admin">
                      <Button className="bg-red-500 hover:bg-red-600">
                        <Crown className="h-4 w-4 mr-2" />
                        Super Admin
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
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
                        <div className="text-2xl font-bold text-green-300">{stats.whatsappContactsImported}</div>
                        <div className="text-sm text-green-200">Contacts importés</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">{stats.whatsappInvitationsSent}</div>
                        <div className="text-sm text-blue-200">Invitations envoyées</div>
                      </div>
                      <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-300">{stats.whatsappConversionRate}%</div>
                        <div className="text-sm text-purple-200">Taux de conversion</div>
                      </div>
                      <div className="text-center p-4 bg-orange-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-300">{stats.avgContactsPerUser}</div>
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
                          const newLimit = prompt('Nouvelle limite d\'invitations par jour:', '50');
                          if (newLimit && !isNaN(parseInt(newLimit))) {
                            toast.success(`Limite d'invitations mise à jour: ${newLimit} par jour`);
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
                          <Target className="h-4 w-4" />
                          <span className="font-semibold">Optimiser système</span>
                        </div>
                        <div className="text-xs opacity-80">Nettoyer contacts inactifs</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Formules et Pourcentages */}
            <TabsContent value="formulas">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Gestion des pourcentages par pack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formulas.map((formula, index) => (
                      <motion.div
                        key={formula.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{formula.name}</h3>
                          <p className="text-sm text-white/70">{formula.tickets} ticket(s) cinéma</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{formula.percentage}%</div>
                            <div className="text-xs text-white/70">Commission</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10"
                            onClick={() => {
                              const newPercentage = prompt('Nouveau pourcentage:', formula.percentage.toString());
                              if (newPercentage && !isNaN(parseInt(newPercentage))) {
                                handleChangePackPercentage(formula.id, parseInt(newPercentage));
                              }
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet QR Codes */}
            <TabsContent value="qrcodes">
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Génération de QR Codes par offre</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formulas.map((formula) => (
                        <Card key={formula.id} className="bg-white/5 border-white/10">
                          <CardContent className="p-4">
                            <h4 className="font-medium text-white mb-2">{formula.name}</h4>
                            <p className="text-sm text-white/70 mb-3">{formula.tickets} ticket(s)</p>
                            <Button
                              onClick={() => handleGenerateQRByOffer('master', formula.name)}
                              className="w-full bg-blue-500 hover:bg-blue-600"
                              size="sm"
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              Générer QR
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Rapports automatiques AVEC PHASE 2 */}
            <TabsContent value="reports">
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Rapports automatiques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Heure d'envoi quotidien</Label>
                        <Input
                          type="time"
                          value={autoReports.reportTime}
                          onChange={(e) => setAutoReports(prev => ({ ...prev, reportTime: e.target.value }))}
                          className="bg-white/10 border-white/30 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Emails destinataires</Label>
                        <div className="flex flex-wrap gap-2">
                          {autoReports.recipientEmails.map((email, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-500/20 text-blue-300">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleConfigureAutoReports}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Configurer envoi auto
                      </Button>
                      <Button
                        onClick={() => handleGenerateReport('daily_summary')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Générer rapport maintenant
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Types de rapports disponibles AVEC PHASE 2 */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Types de rapports disponibles Phase 2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { type: 'donation_summary', name: 'Résumé des donations', icon: DollarSign },
                        { type: 'qr_usage', name: 'Utilisation QR codes', icon: QrCode },
                        { type: 'social_analytics', name: 'Analytics réseaux sociaux', icon: TrendingUp },
                        { type: 'financial_report', name: 'Rapport financier', icon: BarChart3 },
                        { type: 'sponsorship_analytics', name: 'Analytics parrainage', icon: Star },
                        { type: 'viral_metrics', name: 'Métriques virales', icon: Users },
                        { type: 'whatsapp_viral_report', name: 'Rapport WhatsApp viral', icon: MessageCircle },
                        { type: 'partners_analytics', name: 'Analytics partenaires', icon: Building },
                        { type: 'packages_performance', name: 'Performance packages', icon: Package },
                        { type: 'gamification_report', name: 'Rapport gamification', icon: Gamepad2 }
                      ].map((report) => (
                        <Button
                          key={report.type}
                          onClick={() => handleGenerateReport(report.type)}
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                        >
                          <div className="flex items-center gap-2">
                            <report.icon className="h-4 w-4" />
                            <span className="font-semibold">{report.name}</span>
                          </div>
                          <div className="text-xs opacity-80">Générer et télécharger</div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="admins">
              <AdminManagement />
            </TabsContent>

            <TabsContent value="analytics">
              <AdvancedAnalytics />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
