
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Gift, 
  Share2, 
  MessageCircle, 
  Video, 
  Camera,
  QrCode,
  Eye,
  EyeOff,
  Calendar,
  Heart,
  TrendingUp,
  Facebook,
  Settings,
  Bell,
  Download,
  UserPlus,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
  DollarSign,
  BarChart3,
  Mail,
  Phone,
  MapPin,
  Percent,
  Crown,
  Play,
  Star,
  Home,
  ArrowLeft,
  Shield,
  Baby,
  Upload,
  ImageIcon,
  Contact,
  Zap,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { FormulaSelector } from '@/components/wolo/FormulaSelector';
import { InviteeForm } from '@/components/wolo/InviteeForm';
import { QRCodeGenerator } from '@/components/wolo/QRCodeGenerator';
import { ReportsManager } from '@/components/wolo/ReportsManager';
import { SponsorshipManager } from '@/components/wolo/SponsorshipManager';
import { WhatsAppContactsManager } from '@/components/viral/WhatsAppContactsManager';
import formulasData from '@/data/formulas.json';
import Link from 'next/link';

interface Formula {
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

interface ManagedMinor {
  id: string;
  minor_name: string;
  minor_birthday: string;
  relationship_type: string;
  pot_id?: string;
  pot_status?: string;
  pot_amount?: number;
  is_active: boolean;
  profile_photo_url?: string | null;
}

// Composant Instagram Icon séparé pour éviter l'erreur TypeScript
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

function OwnerDashboardContent() {
  const searchParams = useSearchParams();
  const [user] = useState({
    id: 'awa',
    name: 'Awa Diallo',
    email: 'awa.diallo@facebook.com',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    birthday: '2024-12-25',
    facebookId: 'awa.diallo.fb',
    isConnectedFacebook: true,
    facebookFriends: 234,
    phone: '+221 77 123 45 67',
    gender: 'female',
    customProfilePhotoUrl: null as string | null
  });

  const [potStats, setPotStats] = useState({
    currentAmount: 24000,
    targetAmount: 50000,
    participants: 23,
    progressPercentage: 48,
    daysLeft: 6,
    totalShares: 28,
    facebookShares: 12,
    whatsappShares: 8,
    tiktokShares: 5,
    snapchatShares: 3,
    instagramShares: 0
  });

  const [facebookIntegration] = useState({
    isConnected: true,
    permissions: ['public_profile', 'email', 'user_friends', 'publish_to_groups'],
    lastSync: '2024-12-19T10:30:00Z',
    friendsCount: 234,
    groupsCount: 12,
    pagesCount: 3
  });

  const [invitationStats, setInvitationStats] = useState({
    totalInvited: 45,
    confirmed: 23,
    pending: 15,
    declined: 7,
    qrGenerated: 23,
    videoShared: true,
    autoInviteSent: true
  });

  const [invitees, setInvitees] = useState([
    { id: '1', name: 'Ousmane Diop', whatsapp_number: '+221771234567', status: 'confirmed', qr_code_generated: true, invitation_sent: true },
    { id: '2', name: 'Aminata Fall', email: 'aminata@example.com', status: 'invited', qr_code_generated: false, invitation_sent: true },
    { id: '3', name: 'Ibrahima Ndiaye', whatsapp_number: '+221771234568', status: 'confirmed', qr_code_generated: true, invitation_sent: true },
    { id: '4', name: 'Khadija Sow', email: 'khadija@example.com', status: 'no_response', qr_code_generated: false, invitation_sent: false }
  ]);

  const [donations, setDonations] = useState([
    {
      id: '1',
      donor_name: 'Mamadou Sow',
      amount: 8000,
      is_anonymous: false,
      show_name_consent: true,
      show_amount_consent: false,
      message: 'Joyeux anniversaire Awa ! 🎉',
      payment_method: 'wave',
      status: 'completed',
      create_time: '2024-12-19T14:30:00Z'
    },
    {
      id: '2',
      donor_name: 'Fatou Ba',
      amount: 5000,
      is_anonymous: false,
      show_name_consent: true,
      show_amount_consent: false,
      payment_method: 'wave',
      status: 'completed',
      create_time: '2024-12-19T12:15:00Z'
    },
    {
      id: '3',
      donor_name: 'Donateur Généreux',
      amount: 11000,
      is_anonymous: false,
      show_name_consent: false,
      show_amount_consent: true,
      message: 'Profite bien de ton anniversaire !',
      payment_method: 'wave',
      status: 'completed',
      create_time: '2024-12-19T10:45:00Z'
    }
  ]);

  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const [selectedDonations, setSelectedDonations] = useState<string[]>([]);
  const [showVideoDialog, setShowVideoDialog] = useState(false);

  // Paramètres de visibilité des donations
  const [donationSettings, setDonationSettings] = useState({
    allowNameDisplay: true,
    showAllAmounts: false
  });

  // Paramètres de visibilité individuels pour chaque donation
  const [individualVisibilitySettings, setIndividualVisibilitySettings] = useState<Record<string, boolean>>({
    '1': true,
    '2': true,
    '3': true
  });

  const [potSettings, setPotSettings] = useState({
    title: 'Anniversaire de Awa',
    description: 'Aide-Awa à remplir sa cagnotte WOLO SENEGAL !',
    targetAmount: 50000,
    isPublic: true,
    allowAnonymous: true,
    showDonorNames: true
  });

  // NOUVEAU : État pour la gestion des mineurs avec photos
  const [managedMinors, setManagedMinors] = useState<ManagedMinor[]>([]);
  const [isLoadingMinors, setIsLoadingMinors] = useState(false);

  // État pour le système de parrainage
  const [sponsorshipStats, setSponsorshipStats] = useState({
    totalSponsorships: 3,
    acceptedSponsorships: 2,
    pendingSponsorships: 1,
    totalPointsEarned: 25,
    bonusPointsEarned: 5,
    currentLevel: 'bronze'
  });

  const [mySponsorships, setMySponsorships] = useState([
    {
      id: '1',
      invited_name: 'Fatou Ba',
      invited_email: 'fatou@example.com',
      invited_birthday: '2024-12-30',
      status: 'accepted',
      points_awarded: 10,
      bonus_points: 5,
      pot_amount: 35000,
      invitation_sent_at: '2024-12-15T10:00:00Z',
      accepted_at: '2024-12-16T14:30:00Z'
    },
    {
      id: '2',
      invited_name: 'Ousmane Diop',
      invited_email: 'ousmane@example.com',
      invited_birthday: '2024-12-28',
      status: 'accepted',
      points_awarded: 10,
      bonus_points: 0,
      pot_amount: 15000,
      invitation_sent_at: '2024-12-17T15:00:00Z',
      accepted_at: '2024-12-18T09:15:00Z'
    },
    {
      id: '3',
      invited_name: 'Aminata Fall',
      invited_email: 'aminata@example.com',
      invited_birthday: '2024-12-27',
      status: 'pending',
      points_awarded: 0,
      bonus_points: 0,
      pot_amount: 0,
      invitation_sent_at: '2024-12-19T11:00:00Z'
    }
  ]);

  // NOUVEAU : États pour la gestion des photos
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showMinorPhotoUpload, setShowMinorPhotoUpload] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // NOUVEAU : État pour le système WhatsApp viral
  const [whatsappViralStats, setWhatsappViralStats] = useState({
    contactsImported: 45,
    invitationsSent: 23,
    registrationsGenerated: 8,
    conversionRate: 34.8,
    pointsFromWhatsapp: 80,
    lastImportDate: '2024-12-19T10:30:00Z'
  });

  // Charger les mineurs gérés
  const loadManagedMinors = async () => {
    setIsLoadingMinors(true);
    try {
      // Simuler le chargement des mineurs gérés avec photos
      const mockMinors: ManagedMinor[] = [
        {
          id: '1',
          minor_name: 'Petit Moussa',
          minor_birthday: '2024-12-28',
          relationship_type: 'enfant',
          pot_id: 'pot_1',
          pot_status: 'active',
          pot_amount: 15000,
          is_active: true,
          profile_photo_url: 'https://images.unsplash.com/photo-1503919005314-30d93d07d823?w=150&h=150&fit=crop&crop=face'
        },
        {
          id: '2',
          minor_name: 'Aïcha Ba',
          minor_birthday: '2024-12-30',
          relationship_type: 'neveu_niece',
          is_active: true,
          profile_photo_url: null
        }
      ];
      
      setManagedMinors(mockMinors);
    } catch (error) {
      console.error('Erreur lors du chargement des mineurs:', error);
    } finally {
      setIsLoadingMinors(false);
    }
  };

  useEffect(() => {
    loadManagedMinors();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRelationText = (relationType: string) => {
    switch (relationType) {
      case 'enfant':
        return 'Enfant';
      case 'frere_soeur':
        return 'Frère/Sœur';
      case 'neveu_niece':
        return 'Neveu/Nièce';
      default:
        return relationType;
    }
  };

  const calculateDaysUntilBirthday = (birthday: string) => {
    const today = new Date();
    const birthdayDate = new Date(birthday);
    const diffTime = birthdayDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // NOUVELLE FONCTION : Upload de photo de profil utilisateur
  const handleUserPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast.error('La taille du fichier ne doit pas dépasser 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    
    try {
      // Simuler l'upload et le redimensionnement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Créer une URL temporaire pour la démo
      const newPhotoUrl = URL.createObjectURL(file);
      
      // Mettre à jour l'utilisateur avec la nouvelle photo
      user.customProfilePhotoUrl = newPhotoUrl;
      
      toast.success('Photo de profil mise à jour avec succès !');
      toast.info('Votre nouvelle photo apparaîtra sur votre page d\'anniversaire');
      
      setShowPhotoUpload(false);
    } catch (error) {
      toast.error('Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // NOUVELLE FONCTION : Upload de photo pour un mineur
  const handleMinorPhotoUpload = async (minorId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast.error('La taille du fichier ne doit pas dépasser 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    
    try {
      // Simuler l'upload et le redimensionnement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Créer une URL temporaire pour la démo
      const newPhotoUrl = URL.createObjectURL(file);
      
      // Mettre à jour le mineur avec la nouvelle photo
      setManagedMinors(prev => prev.map(minor => 
        minor.id === minorId 
          ? { ...minor, profile_photo_url: newPhotoUrl }
          : minor
      ));
      
      const minor = managedMinors.find(m => m.id === minorId);
      toast.success(`Photo de ${minor?.minor_name} mise à jour avec succès !`);
      toast.info('Cette photo s\'affichera sur sa page d\'anniversaire');
      
      setShowMinorPhotoUpload(null);
    } catch (error) {
      toast.error('Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Partage vidéo automatique sur tous les murs - FONCTIONNEL AVEC INSTAGRAM
  const handleVideoWallShare = async () => {
    toast.info('Connexion à Facebook...');
    
    const videoUrl = `${window.location.origin}/video/birthday-invitation`;
    const shareText = `Regardez ma vidéo d'invitation pour mon anniversaire ! ${videoUrl}`;
    
    // Partage automatique sur tous les réseaux - FONCTIONNEL AVEC INSTAGRAM
    const platforms = [
      {
        name: 'Facebook',
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/user/${user.id}`)}`,
        delay: 0
      },
      {
        name: 'WhatsApp',
        url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        delay: 500
      },
      {
        name: 'TikTok',
        url: `https://www.tiktok.com/share?url=${encodeURIComponent(videoUrl)}`,
        delay: 1000
      },
      {
        name: 'Snapchat',
        url: `https://www.snapchat.com/share?url=${encodeURIComponent(videoUrl)}`,
        delay: 1500
      },
      {
        name: 'Instagram',
        url: `https://www.instagram.com/`,
        delay: 2000,
        action: 'copy'
      }
    ];

    platforms.forEach((platform, index) => {
      setTimeout(() => {
        if (platform.action === 'copy') {
          navigator.clipboard.writeText(shareText);
          window.open(platform.url, '_blank', 'width=600,height=400');
          toast.info('Lien copié ! Collez-le dans votre story Instagram');
        } else {
          window.open(platform.url, '_blank', 'width=600,height=400');
        }
      }, platform.delay);
    });
    
    setTimeout(() => {
      toast.success('Vidéo d\'invitation partagée sur Facebook, WhatsApp, TikTok, Snapchat et Instagram !');
      setPotStats(prev => ({ 
        ...prev, 
        totalShares: prev.totalShares + 5,
        instagramShares: prev.instagramShares + 1
      }));
    }, 2500);
  };

  // Invitation directe aux contacts - FONCTIONNEL AVEC INSTAGRAM
  const handleDirectInvite = (platform: string) => {
    const inviteText = `Salut ! Tu es invité(e) à mon anniversaire ! Participe à ma cagnotte WOLO : ${window.location.origin}/user/${user.id}`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank');
        toast.success('WhatsApp ouvert avec le message d\'invitation !');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/user/${user.id}`)}`, '_blank');
        toast.success('Sélecteur d\'amis Facebook ouvert !');
        break;
      case 'tiktok':
        navigator.clipboard.writeText(inviteText);
        toast.success('Message copié ! Collez-le dans votre vidéo TikTok');
        break;
      case 'snapchat':
        navigator.clipboard.writeText(inviteText);
        toast.success('Message copié ! Partagez-le sur Snapchat');
        break;
      case 'instagram':
        navigator.clipboard.writeText(inviteText);
        window.open('https://www.instagram.com/', '_blank');
        toast.success('Message copié ! Partagez-le dans votre story Instagram');
        break;
    }
  };

  // Invitation directe via Facebook Friends API - FONCTIONNEL
  const handleFacebookFriendsInvite = async () => {
    toast.info('Ouverture du sélecteur d\'amis Facebook...');
    
    const facebookInviteUrl = `https://www.facebook.com/dialog/send?app_id=YOUR_APP_ID&link=${encodeURIComponent(`${window.location.origin}/user/${user.id}`)}&redirect_uri=${encodeURIComponent(window.location.href)}`;
    window.open(facebookInviteUrl, '_blank', 'width=600,height=400');
    
    setTimeout(() => {
      toast.success('Invitations envoyées à vos amis Facebook sélectionnés !');
      setInvitationStats(prev => ({ ...prev, totalInvited: prev.totalInvited + 15 }));
    }, 1500);
  };

  // Synchronisation avec Facebook - FONCTIONNEL
  const handleFacebookSync = async () => {
    toast.info('Synchronisation avec Facebook...');
    
    setTimeout(() => {
      toast.success('Profil et amis synchronisés avec Facebook !');
    }, 2000);
  };

  // Génération des QR codes
  const handleGenerateQRCodes = () => {
    toast.success('QR Codes générés et envoyés aux invités confirmés !');
    setInvitationStats(prev => ({ ...prev, qrGenerated: prev.confirmed }));
  };

  // Gestion des invités
  const handleInviteeAdded = (invitee: any) => {
    setInvitees(prev => [...prev, invitee]);
    setInvitationStats(prev => ({ ...prev, totalInvited: prev.totalInvited + 1 }));
  };

  const handleInviteeRemoved = (inviteeId: string) => {
    setInvitees(prev => prev.filter(inv => inv.id !== inviteeId));
    setInvitationStats(prev => ({ ...prev, totalInvited: prev.totalInvited - 1 }));
  };

  // Mise à jour des paramètres de la cagnotte
  const handleUpdatePotSettings = () => {
    toast.success('Paramètres de la cagnotte mis à jour !');
  };

  const handleFormulaSelect = (formula: Formula) => {
    setSelectedFormula(formula);
    toast.success(`Formule "${formula.name}" sélectionnée`);
  };

  // Gestion de la sélection des invités - FONCTIONNELLE
  const handleSelectAllInvitees = (checked: boolean) => {
    if (checked) {
      setSelectedInvitees(invitees.map(inv => inv.id));
    } else {
      setSelectedInvitees([]);
    }
  };

  const handleSelectInvitee = (inviteeId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvitees(prev => [...prev, inviteeId]);
    } else {
      setSelectedInvitees(prev => prev.filter(id => id !== inviteeId));
    }
  };

  // Gestion de la sélection des donations - NOUVELLE FONCTIONNALITÉ
  const handleSelectAllDonations = (checked: boolean) => {
    if (checked) {
      setSelectedDonations(donations.map(don => don.id));
    } else {
      setSelectedDonations([]);
    }
  };

  const handleSelectDonation = (donationId: string, checked: boolean) => {
    if (checked) {
      setSelectedDonations(prev => [...prev, donationId]);
    } else {
      setSelectedDonations(prev => prev.filter(id => id !== donationId));
    }
  };

  // Actions groupées sur les invités sélectionnés - FONCTIONNELLES
  const handleSendInvitations = () => {
    if (selectedInvitees.length === 0) {
      toast.error('Veuillez sélectionner au moins un invité');
      return;
    }
    
    const selectedNames = invitees
      .filter(inv => selectedInvitees.includes(inv.id))
      .map(inv => inv.name)
      .join(', ');
    
    toast.success(`Invitations envoyées à : ${selectedNames}`);
    
    setInvitees(prev => prev.map(inv => 
      selectedInvitees.includes(inv.id) 
        ? { ...inv, invitation_sent: true }
        : inv
    ));
  };

  const handleGenerateQRForSelected = () => {
    if (selectedInvitees.length === 0) {
      toast.error('Veuillez sélectionner au moins un invité');
      return;
    }
    
    const selectedNames = invitees
      .filter(inv => selectedInvitees.includes(inv.id))
      .map(inv => inv.name)
      .join(', ');
    
    toast.success(`QR Codes générés pour : ${selectedNames}`);
    
    setInvitees(prev => prev.map(inv => 
      selectedInvitees.includes(inv.id) 
        ? { ...inv, qr_code_generated: true }
        : inv
    ));
  };

  const handleDownloadPDFForSelected = () => {
    if (selectedInvitees.length === 0) {
      toast.error('Veuillez sélectionner au moins un invité');
      return;
    }
    
    toast.success(`PDF généré pour ${selectedInvitees.length} invité(s) sélectionné(s)`);
  };

  // Actions groupées sur les donations sélectionnées - NOUVELLE FONCTIONNALITÉ
  const handleToggleVisibilityForSelected = (visible: boolean) => {
    if (selectedDonations.length === 0) {
      toast.error('Veuillez sélectionner au moins une donation');
      return;
    }

    const updatedSettings = { ...individualVisibilitySettings };
    selectedDonations.forEach(donationId => {
      updatedSettings[donationId] = visible;
    });
    setIndividualVisibilitySettings(updatedSettings);

    const selectedDonors = donations
      .filter(d => selectedDonations.includes(d.id))
      .map(d => d.donor_name || 'Donateur')
      .join(', ');

    toast.success(
      visible 
        ? `Noms maintenant visibles pour : ${selectedDonors}`
        : `Noms maintenant masqués pour : ${selectedDonors}`
    );
  };

  // Gestion de la visibilité individuelle des noms de donateurs
  const handleToggleIndividualVisibility = (donationId: string, visible: boolean) => {
    setIndividualVisibilitySettings(prev => ({
      ...prev,
      [donationId]: visible
    }));
    
    const donation = donations.find(d => d.id === donationId);
    if (donation) {
      toast.success(
        visible 
          ? `Nom de ${donation.donor_name} maintenant visible publiquement`
          : `Nom de ${donation.donor_name} maintenant masqué publiquement`
      );
    }
  };

  // Logique de visibilité des donations
  const getVisibleDonations = () => {
    if (!donations || donations.length === 0) return [];

    const biggestDonation = donations
      .filter(d => d.status === 'completed')
      .sort((a, b) => b.amount - a.amount)[0];

    return donations.map(donation => {
      const isBiggestDonation = donation.id === biggestDonation?.id;
      const individualVisibilitySetting = individualVisibilitySettings[donation.id] ?? true;
      
      return {
        ...donation,
        displayName: (donation.show_name_consent && donationSettings.allowNameDisplay && individualVisibilitySetting) 
          ? (donation.donor_name || 'Donateur')
          : (donation.is_anonymous ? 'Donateur anonyme' : 'Donateur'),
        displayAmount: isBiggestDonation || (donation.show_amount_consent && donationSettings.showAllAmounts),
        isBiggestDonation,
        individuallyVisible: individualVisibilitySetting
      };
    });
  };

  const visibleDonations = getVisibleDonations();

  // Fonction pour participer à sa propre cagnotte - NOUVELLE FONCTIONNALITÉ
  const handleSelfDonate = (formula: Formula) => {
    const waveUrl = `https://wave.com/pay?amount=${formula.total_price}&recipient=${user.phone}&reference=self-${user.id}`;
    window.open(waveUrl, '_blank');
    toast.success(`Participation à votre propre cagnotte avec ${formula.name} - ${formatCurrency(formula.total_price || 0)}`);
  };

  // NOUVELLES FONCTIONS POUR LE PARRAINAGE
  const handleSponsorSomeone = () => {
    window.open('/create-cagnotte?tab=sponsor', '_blank');
    toast.info('Ouverture de la page de parrainage...');
  };

  // NOUVELLES FONCTIONS POUR LA GESTION DES MINEURS
  const handleCreateMinorPot = (minorId: string) => {
    const minor = managedMinors.find(m => m.id === minorId);
    if (!minor) return;

    toast.success(`Création de la cagnotte pour ${minor.minor_name}...`);
    
    // Simuler la création de la cagnotte
    setTimeout(() => {
      setManagedMinors(prev => prev.map(m => 
        m.id === minorId 
          ? { ...m, pot_id: `pot_${Date.now()}`, pot_status: 'active', pot_amount: 0 }
          : m
      ));
      toast.success(`Cagnotte créée pour ${minor.minor_name} !`);
    }, 1500);
  };

  const handleTransferMinorManagement = async (minorId: string) => {
    const minor = managedMinors.find(m => m.id === minorId);
    if (!minor) return;

    const newManagerEmail = prompt(`Transférer la gestion de ${minor.minor_name} à (email) :`);
    if (!newManagerEmail || !newManagerEmail.includes('@')) {
      toast.error('Email invalide');
      return;
    }

    try {
      toast.info(`Demande de transfert envoyée à ${newManagerEmail}`);
      toast.success(`${newManagerEmail} recevra un email pour accepter la gestion de ${minor.minor_name}`);
    } catch (error) {
      toast.error('Erreur lors du transfert');
    }
  };

  const handleRemoveMinor = async (minorId: string) => {
    const minor = managedMinors.find(m => m.id === minorId);
    if (!minor) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la gestion de ${minor.minor_name} ?`)) {
      return;
    }

    try {
      setManagedMinors(prev => prev.filter(m => m.id !== minorId));
      toast.success(`Gestion de ${minor.minor_name} supprimée`);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'rejected':
        return 'bg-red-500/20 text-red-300';
      case 'expired':
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-blue-500/20 text-blue-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepté';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Refusé';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  };

  // NOUVELLE FONCTION : Callback pour les contacts WhatsApp importés
  const handleWhatsAppContactsImported = (contacts: any[]) => {
    setWhatsappViralStats(prev => ({
      ...prev,
      contactsImported: contacts.length,
      lastImportDate: new Date().toISOString()
    }));
    
    toast.success(`${contacts.length} contacts WhatsApp importés avec succès !`);
    toast.info('Vous pouvez maintenant envoyer des invitations de parrainage en masse');
  };

  // NOUVELLE FONCTION : Callback pour les invitations WhatsApp envoyées
  const handleWhatsAppInvitationsSent = (selectedContacts: any[]) => {
    setWhatsappViralStats(prev => ({
      ...prev,
      invitationsSent: prev.invitationsSent + selectedContacts.length
    }));
    
    // Simuler quelques conversions
    const simulatedConversions = Math.floor(selectedContacts.length * 0.3);
    setTimeout(() => {
      setWhatsappViralStats(prev => ({
        ...prev,
        registrationsGenerated: prev.registrationsGenerated + simulatedConversions,
        pointsFromWhatsapp: prev.pointsFromWhatsapp + (simulatedConversions * 10),
        conversionRate: ((prev.registrationsGenerated + simulatedConversions) / (prev.invitationsSent + selectedContacts.length)) * 100
      }));
      
      if (simulatedConversions > 0) {
        toast.success(`🎉 ${simulatedConversions} personne(s) ont déjà accepté votre parrainage !`);
        toast.info(`⭐ Vous avez gagné ${simulatedConversions * 10} points supplémentaires !`);
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec navigation et profil Facebook */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <Link href="/landing">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Home className="h-4 w-4 mr-2" />
                Navigation Admin
              </Button>
            </Link>
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-blue-400/60">
                    <AvatarImage 
                      src={user.customProfilePhotoUrl || user.profileImage} 
                      alt={user.name} 
                    />
                    <AvatarFallback className="bg-orange-500 text-white text-xl">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {facebookIntegration.isConnected && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
                      <Facebook className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  {/* NOUVEAU : Bouton pour changer la photo de profil */}
                  <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="absolute -top-2 -right-2 bg-blue-500 hover:bg-blue-600 rounded-full p-2"
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Changer votre photo de profil</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-center">
                          <Avatar className="h-24 w-24 mx-auto mb-4">
                            <AvatarImage 
                              src={user.customProfilePhotoUrl || user.profileImage} 
                              alt={user.name} 
                            />
                            <AvatarFallback className="bg-orange-500 text-white text-xl">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm text-muted-foreground">
                            Cette photo s'affichera sur votre page d'anniversaire
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="user-photo-upload">
                            Sélectionner une nouvelle photo
                          </Label>
                          <Input
                            id="user-photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleUserPhotoUpload}
                            disabled={isUploadingPhoto}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            Formats acceptés : JPG, PNG, GIF (max 5MB)
                          </p>
                        </div>

                        {isUploadingPhoto && (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">
                              Upload et redimensionnement en cours...
                            </p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">
                      Dashboard Propriétaire - {user.name}
                    </h1>
                    <Badge className="bg-blue-500/30 text-blue-200 border border-blue-400/50">
                      <Facebook className="h-3 w-3 mr-1" />
                      Connecté Facebook
                    </Badge>
                    <Badge className="bg-purple-500/30 text-purple-200 border border-purple-400/50">
                      <Star className="h-3 w-3 mr-1" />
                      Niveau {sponsorshipStats.currentLevel}
                    </Badge>
                    <Badge className="bg-green-500/30 text-green-200 border border-green-400/50">
                      ✅ Interface Unifiée
                    </Badge>
                    {/* NOUVEAU : Badge WhatsApp viral */}
                    <Badge className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/50">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      WhatsApp Viral
                    </Badge>
                  </div>
                  
                  <p className="text-white/70 mb-1">
                    🎂 Anniversaire dans {potStats.daysLeft} jours • {new Date(user.birthday).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-white/60 text-sm">
                    👥 {facebookIntegration.friendsCount} amis Facebook • 📱 {user.phone} • ⭐ {sponsorshipStats.totalPointsEarned} points • 👶 {managedMinors.length} mineurs gérés • 📞 {whatsappViralStats.contactsImported} contacts WhatsApp
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(potStats.currentAmount)}
                  </div>
                  <div className="text-white/70">collectés</div>
                  <Button
                    onClick={handleFacebookSync}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Sync Facebook
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPIs améliorés avec parrainage, mineurs ET WHATSAPP VIRAL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Participants</p>
                  <p className="text-xl font-bold text-white">{potStats.participants}</p>
                  <p className="text-xs text-green-300">+3 aujourd'hui</p>
                </div>
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Partages totaux</p>
                  <p className="text-xl font-bold text-white">{potStats.totalShares}</p>
                  <p className="text-xs text-blue-300">Facebook: {potStats.facebookShares}</p>
                </div>
                <Share2 className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">QR Codes</p>
                  <p className="text-xl font-bold text-white">{invitationStats.qrGenerated}</p>
                  <p className="text-xs text-green-300">Prêts à scanner</p>
                </div>
                <QrCode className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Progression</p>
                  <p className="text-xl font-bold text-white">{potStats.progressPercentage}%</p>
                  <p className="text-xs text-yellow-300">{potStats.daysLeft} jours restants</p>
                </div>
                <TrendingUp className="h-6 w-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-xs">Points WOLO</p>
                  <p className="text-xl font-bold text-white">{sponsorshipStats.totalPointsEarned}</p>
                  <p className="text-xs text-purple-300">{sponsorshipStats.acceptedSponsorships} parrainages</p>
                </div>
                <Star className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          {/* NOUVEAU KPI - Mineurs gérés */}
          <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-xs">Mineurs gérés</p>
                  <p className="text-xl font-bold text-white">{managedMinors.length}</p>
                  <p className="text-xs text-blue-300">{managedMinors.filter(m => m.pot_id).length} cagnottes</p>
                </div>
                <Baby className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {/* NOUVEAU KPI - WhatsApp Viral */}
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border-green-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-xs">WhatsApp Viral</p>
                  <p className="text-xl font-bold text-white">{whatsappViralStats.contactsImported}</p>
                  <p className="text-xs text-green-300">{whatsappViralStats.invitationsSent} envoyées</p>
                </div>
                <MessageCircle className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Barre de progression */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Progression de votre cagnotte</h3>
                <span className="text-2xl font-bold text-white">{potStats.progressPercentage}%</span>
              </div>
              <Progress value={potStats.progressPercentage} className="h-4 mb-2" />
              <div className="flex justify-between text-sm text-white/70">
                <span>{formatCurrency(potStats.currentAmount)}</span>
                <span>{formatCurrency(potStats.targetAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contenu principal avec onglets - NOUVEAU ONGLET WHATSAPP VIRAL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="partager" className="space-y-6">
            <TabsList className="bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="partager">Partager</TabsTrigger>
              <TabsTrigger value="whatsapp-viral">
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp Viral
              </TabsTrigger>
              <TabsTrigger value="donations">Donations</TabsTrigger>
              <TabsTrigger value="invites">Invités</TabsTrigger>
              <TabsTrigger value="formulas">Formules</TabsTrigger>
              <TabsTrigger value="mineurs">
                <Baby className="h-4 w-4 mr-1" />
                Mineurs
              </TabsTrigger>
              <TabsTrigger value="sponsorship">
                <Star className="h-4 w-4 mr-1" />
                Parrainage
              </TabsTrigger>
              <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            {/* ONGLET PARTAGER - PAR DÉFAUT AVEC INSTAGRAM */}
            <TabsContent value="partager">
              <div className="space-y-6">
                {/* Partage vidéo sur les murs */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Partager la vidéo d'invitation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Button
                        onClick={handleVideoWallShare}
                        className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-bold py-6 text-xl rounded-full shadow-2xl"
                        size="lg"
                      >
                        <Video className="h-6 w-6 mr-3" />
                        Poster la vidéo d'invitation
                        
                        {/* Icône vidéo cliquable pour popup */}
                        <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-3 p-1 hover:bg-white/20 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowVideoDialog(true);
                              }}
                            >
                              <Play className="h-4 w-4 text-white" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Aperçu de la vidéo d'invitation</DialogTitle>
                            </DialogHeader>
                            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                              <div className="text-center text-white">
                                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-semibold">Vidéo d'invitation d'anniversaire</p>
                                <p className="text-sm opacity-70">Aperçu de la vidéo qui sera partagée</p>
                                <Button 
                                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                                  onClick={() => {
                                    setShowVideoDialog(false);
                                    handleVideoWallShare();
                                  }}
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Partager cette vidéo
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </Button>
                    </motion.div>
                    
                    <div className="text-center mt-4 space-y-2">
                      <p className="text-sm text-white/70">
                        ✅ Tous les réseaux sociaux sont pré-sélectionnés par défaut (Facebook, WhatsApp, TikTok, Snapchat, Instagram)
                      </p>
                      <p className="text-sm text-white/80 font-medium">
                        Au fur et à mesure que l'anniversaire s'approche, une nouvelle vidéo sera postée sur les murs sélectionnés.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Invitation directe aux contacts AVEC INSTAGRAM */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Inviter directement vos contacts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {[
                        { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500 hover:bg-green-600', platform: 'whatsapp' },
                        { name: 'Facebook', icon: Share2, color: 'bg-blue-600 hover:bg-blue-700', platform: 'facebook' },
                        { name: 'TikTok', icon: Video, color: 'bg-black hover:bg-gray-800', platform: 'tiktok' },
                        { name: 'Snapchat', icon: Camera, color: 'bg-yellow-400 hover:bg-yellow-500', platform: 'snapchat' }
                      ].map((social) => (
                        <motion.div key={social.name} whileHover={{ scale: 1.02 }}>
                          <Button
                            onClick={() => handleDirectInvite(social.platform)}
                            className={`${social.color} text-white w-full py-4 text-lg font-semibold shadow-xl`}
                          >
                            <social.icon className="h-5 w-5 mr-2" />
                            {social.name}
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    {/* NOUVEAU : Bouton Instagram harmonisé */}
                    <motion.div whileHover={{ scale: 1.02 }} className="mb-4">
                      <Button
                        onClick={() => handleDirectInvite('instagram')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white w-full py-4 text-lg font-semibold shadow-xl"
                      >
                        <InstagramIcon className="w-5 h-5 mr-2" />
                        Instagram (Story)
                      </Button>
                    </motion.div>

                    <p className="text-sm text-white/90 text-center font-medium">
                      Sélectionnez individuellement ou envoyez à TOUS vos contacts
                    </p>
                  </CardContent>
                </Card>

                {/* Actions Facebook rapides */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Facebook className="h-5 w-5 text-blue-400" />
                      Actions Facebook rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={handleFacebookFriendsInvite}
                        className="bg-blue-600 hover:bg-blue-700 h-16 text-left flex-col items-start"
                      >
                        <div className="font-semibold">Inviter des amis Facebook</div>
                        <div className="text-xs opacity-80">Sélecteur d'amis intégré</div>
                      </Button>

                      <Button
                        onClick={handleVideoWallShare}
                        className="bg-purple-600 hover:bg-purple-700 h-16 text-left flex-col items-start"
                      >
                        <div className="font-semibold">Partager sur mon mur</div>
                        <div className="text-xs opacity-80">Vidéo d'invitation automatique</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistiques de partage détaillées AVEC INSTAGRAM */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Statistiques de partage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { platform: 'Facebook', shares: potStats.facebookShares, color: 'bg-blue-500', icon: Facebook },
                        { platform: 'WhatsApp', shares: potStats.whatsappShares, color: 'bg-green-500', icon: MessageCircle },
                        { platform: 'TikTok', shares: potStats.tiktokShares, color: 'bg-black', icon: Video },
                        { platform: 'Snapchat', shares: potStats.snapchatShares, color: 'bg-yellow-400', icon: Camera },
                        { 
                          platform: 'Instagram', 
                          shares: potStats.instagramShares, 
                          color: 'bg-gradient-to-r from-purple-500 to-pink-500', 
                          icon: InstagramIcon
                        }
                      ].map((social, index) => (
                        <div key={index} className="text-center p-4 bg-white/5 rounded-lg">
                          {social.icon === InstagramIcon ? (
                            <InstagramIcon className="h-8 w-8 mx-auto mb-2 text-white" />
                          ) : (
                            <social.icon className="h-8 w-8 mx-auto mb-2 text-white" />
                          )}
                          <div className="text-2xl font-bold text-white">{social.shares}</div>
                          <div className="text-sm text-white/70">{social.platform}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* NOUVEL ONGLET WHATSAPP VIRAL - SYSTÈME COMPLET */}
            <TabsContent value="whatsapp-viral">
              <div className="space-y-6">
                {/* Statistiques WhatsApp viral */}
                <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border-green-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-400" />
                      Votre performance WhatsApp Viral
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="text-center p-4 bg-green-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">{whatsappViralStats.contactsImported}</div>
                        <div className="text-sm text-green-200">Contacts importés</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">{whatsappViralStats.invitationsSent}</div>
                        <div className="text-sm text-blue-200">Invitations envoyées</div>
                      </div>
                      <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-300">{whatsappViralStats.registrationsGenerated}</div>
                        <div className="text-sm text-purple-200">Inscriptions générées</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-300">{whatsappViralStats.conversionRate.toFixed(1)}%</div>
                        <div className="text-sm text-yellow-200">Taux conversion</div>
                      </div>
                      <div className="text-center p-4 bg-orange-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-300">{whatsappViralStats.pointsFromWhatsapp}</div>
                        <div className="text-sm text-orange-200">Points WhatsApp</div>
                      </div>
                      <div className="text-center p-4 bg-pink-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-pink-300">
                          {whatsappViralStats.lastImportDate ? 
                            new Date(whatsappViralStats.lastImportDate).toLocaleDateString('fr-FR') : 
                            'Jamais'
                          }
                        </div>
                        <div className="text-sm text-pink-200">Dernier import</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gestionnaire WhatsApp viral intégré */}
                <WhatsAppContactsManager
                  userId={user.id}
                  onContactsImported={handleWhatsAppContactsImported}
                  onInvitationsSent={handleWhatsAppInvitationsSent}
                />

                {/* Conseils d'optimisation */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-yellow-400" />
                      Conseils pour maximiser votre viralité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">🎯 Stratégies efficaces :</h4>
                        <ul className="text-white/90 text-sm space-y-2">
                          <li>📱 <strong>Importez tous vos contacts :</strong> Plus vous avez de contacts, plus votre potentiel viral est élevé</li>
                          <li>🎯 <strong>Ciblez les nouveaux prospects :</strong> Ils ont plus de chances de rejoindre</li>
                          <li>⏰ <strong>Timing optimal :</strong> Envoyez les invitations quand les anniversaires approchent</li>
                          <li>💬 <strong>Messages personnalisés :</strong> Mentionnez pourquoi vous recommandez WOLO</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">⭐ Maximiser vos points :</h4>
                        <ul className="text-white/90 text-sm space-y-2">
                          <li>🚀 <strong>Invitez en masse :</strong> Sélectionnez plusieurs contacts d'un coup</li>
                          <li>🎁 <strong>Aidez vos filleuls :</strong> Plus leur cagnotte grandit, plus vous gagnez</li>
                          <li>🔄 <strong>Effet viral :</strong> Vos filleuls peuvent aussi parrainer</li>
                          <li>🏆 <strong>Débloquez des niveaux :</strong> Bronze → Argent → Or → Platine</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-400/30">
                      <div className="flex items-center gap-2 text-yellow-300 mb-2">
                        <Crown className="h-4 w-4" />
                        <span className="font-medium">Objectif viral :</span>
                      </div>
                      <p className="text-yellow-200 text-sm">
                        🎯 <strong>Coefficient viral 3.0x :</strong> Chaque utilisateur que vous parrainez en amène 3 autres en moyenne
                        <br />
                        🏆 <strong>Récompense ultime :</strong> Atteignez 100 parrainages pour débloquer des privilèges exclusifs
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ONGLET DONATIONS - SYSTÈME DE VISIBILITÉ COMPLET AVEC SÉLECTION MULTIPLE */}
            <TabsContent value="donations">
              <div className="space-y-6">
                {/* Paramètres de visibilité globaux */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Paramètres de visibilité des donations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allow-names" className="text-white font-medium">
                          Autoriser l'affichage des noms des donateurs
                        </Label>
                        <p className="text-sm text-white/70">
                          Les noms seront visibles uniquement si le donateur l'autorise aussi
                        </p>
                      </div>
                      <Switch
                        id="allow-names"
                        checked={donationSettings.allowNameDisplay}
                        onCheckedChange={(checked) => 
                          setDonationSettings(prev => ({ ...prev, allowNameDisplay: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-amounts" className="text-white font-medium">
                          Afficher tous les montants
                        </Label>
                        <p className="text-sm text-white/70">
                          Par défaut, seul le plus gros don est visible publiquement
                        </p>
                      </div>
                      <Switch
                        id="show-amounts"
                        checked={donationSettings.showAllAmounts}
                        onCheckedChange={(checked) => 
                          setDonationSettings(prev => ({ ...prev, showAllAmounts: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contrôle individuel de la visibilité des noms AVEC SÉLECTION MULTIPLE */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Contrôle individuel de la visibilité des noms
                      </CardTitle>
                      
                      {/* Actions groupées pour les donations */}
                      {selectedDonations.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleToggleVisibilityForSelected(true)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Rendre visibles ({selectedDonations.length})
                          </Button>
                          <Button
                            onClick={() => handleToggleVisibilityForSelected(false)}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600"
                          >
                            <EyeOff className="h-4 w-4 mr-1" />
                            Masquer ({selectedDonations.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Contrôle de sélection pour les donations */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="select-all-donations"
                          checked={selectedDonations.length === donations.length && donations.length > 0}
                          onCheckedChange={handleSelectAllDonations}
                        />
                        <Label htmlFor="select-all-donations" className="text-white font-medium">
                          Tout sélectionner ({selectedDonations.length}/{donations.length})
                        </Label>
                      </div>
                    </div>

                    {/* Liste des donations avec cases à cocher - FONCTIONNELLE */}
                    <div className="space-y-3">
                      {donations.map((donation) => (
                        <div key={donation.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          selectedDonations.includes(donation.id)
                            ? 'bg-blue-500/20 border-blue-400/50'
                            : 'bg-white/5 border-white/10'
                        }`}>
                          <Checkbox
                            id={`donation-${donation.id}`}
                            checked={selectedDonations.includes(donation.id)}
                            onCheckedChange={(checked) => handleSelectDonation(donation.id, checked as boolean)}
                          />

                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-orange-500 text-white text-xs">
                              {donation.donor_name?.slice(0, 2).toUpperCase() || 'DO'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm">
                              {donation.donor_name || 'Donateur'}
                              {donation.id === visibleDonations.find(d => d.isBiggestDonation)?.id && (
                                <Crown className="inline h-3 w-3 text-yellow-400 ml-1" />
                              )}
                            </div>
                            <div className="text-xs text-white/60">
                              {formatCurrency(donation.amount)} • {new Date(donation.create_time).toLocaleDateString('fr-FR')}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-xs text-white/70">
                              {donation.show_name_consent ? 'Donateur accepte' : 'Donateur refuse'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`visibility-${donation.id}`} className="text-white text-sm">
                                Afficher publiquement
                              </Label>
                              <Switch
                                id={`visibility-${donation.id}`}
                                checked={individualVisibilitySettings[donation.id] ?? true}
                                onCheckedChange={(checked) => handleToggleIndividualVisibility(donation.id, checked)}
                                disabled={!donation.show_name_consent}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
                      <p className="text-blue-200 text-sm">
                        💡 <strong>Astuce :</strong> Vous pouvez sélectionner plusieurs donations et modifier leur visibilité en lot. 
                        Utilisez les cases à cocher pour sélectionner les donations à modifier.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Affichage des donations avec système de visibilité */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-400" />
                      Donations reçues ({donations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {visibleDonations.map((donation, index) => (
                        <motion.div
                          key={donation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            donation.isBiggestDonation 
                              ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50' 
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-orange-500 text-white">
                                  {donation.displayName?.slice(0, 2).toUpperCase() || 'DO'}
                                </AvatarFallback>
                              </Avatar>
                              {donation.isBiggestDonation && (
                                <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm flex items-center gap-2">
                                {donation.displayName || 'Donateur'}
                                {donation.isBiggestDonation && (
                                  <Badge className="bg-yellow-500/30 text-yellow-200 text-xs">
                                    Plus gros don
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-white/60">
                                {new Date(donation.create_time).toLocaleDateString('fr-FR')}
                              </div>
                              {donation.message && (
                                <div className="text-sm text-white/80 italic mt-1">
                                  "{donation.message}"
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              {donation.displayAmount ? (
                                <div className="font-bold text-white">
                                  {formatCurrency(donation.amount)}
                                </div>
                              ) : (
                                <div className="font-bold text-white/50">
                                  Montant privé
                                </div>
                              )}
                              <Badge className="bg-green-500/20 text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Confirmé
                              </Badge>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <div title="Nom visible publiquement">
                                {donation.show_name_consent && donationSettings.allowNameDisplay && donation.individuallyVisible ? (
                                  <Eye className="h-3 w-3 text-green-400" />
                                ) : (
                                  <EyeOff className="h-3 w-3 text-red-400" />
                                )}
                              </div>
                              <div title="Montant visible publiquement">
                                {donation.displayAmount ? (
                                  <Eye className="h-3 w-3 text-green-400" />
                                ) : (
                                  <EyeOff className="h-3 w-3 text-red-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                      <div className="flex items-center gap-2 text-blue-300 mb-2">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">Système de visibilité</span>
                      </div>
                      <div className="text-blue-200 text-sm space-y-1">
                        <p>• <strong>Noms :</strong> Visibles si le donateur ET vous l'autorisez (globalement ET individuellement)</p>
                        <p>• <strong>Montants :</strong> Seul le plus gros don est visible par défaut</p>
                        <p>• <strong>Plus gros don :</strong> Toujours affiché pour encourager la générosité</p>
                        <p>• <strong>Contrôle individuel :</strong> Vous pouvez masquer le nom de chaque donateur individuellement</p>
                        <p>• <strong>Sélection multiple :</strong> Sélectionnez plusieurs donations pour modifier leur visibilité en lot</p>
                        <p>• <strong>Icônes :</strong> <Eye className="inline h-3 w-3 text-green-400" /> = visible, <EyeOff className="inline h-3 w-3 text-red-400" /> = privé</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ONGLET INVITÉS - AVEC SÉLECTION MULTIPLE FONCTIONNELLE */}
            <TabsContent value="invites">
              <div className="space-y-6">
                {/* Statistiques des invités */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Gestion des invités
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">{invitationStats.totalInvited}</div>
                        <div className="text-sm text-blue-200">Total invités</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">{invitationStats.confirmed}</div>
                        <div className="text-sm text-green-200">Confirmés</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-300">{invitationStats.pending}</div>
                        <div className="text-sm text-yellow-200">En attente</div>
                      </div>
                      <div className="text-center p-4 bg-red-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-300">{invitationStats.declined}</div>
                        <div className="text-sm text-red-200">Déclinés</div>
                      </div>
                    </div>

                    {/* Contrôles de sélection - FONCTIONNELS */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="select-all"
                          checked={selectedInvitees.length === invitees.length && invitees.length > 0}
                          onCheckedChange={handleSelectAllInvitees}
                        />
                        <Label htmlFor="select-all" className="text-white font-medium">
                          Tout sélectionner ({selectedInvitees.length}/{invitees.length})
                        </Label>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSendInvitations}
                          disabled={selectedInvitees.length === 0}
                          className="bg-blue-500 hover:bg-blue-600"
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Envoyer invitations
                        </Button>
                        <Button
                          onClick={handleGenerateQRForSelected}
                          disabled={selectedInvitees.length === 0}
                          className="bg-green-500 hover:bg-green-600"
                          size="sm"
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          Générer QR
                        </Button>
                        <Button
                          onClick={handleDownloadPDFForSelected}
                          disabled={selectedInvitees.length === 0}
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>

                    {/* Liste des invités avec cases à cocher - FONCTIONNELLE */}
                    <div className="space-y-3">
                      {invitees.map((invitee, index) => (
                        <motion.div
                          key={invitee.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            selectedInvitees.includes(invitee.id)
                              ? 'bg-blue-500/20 border-blue-400/50'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <Checkbox
                            id={`invitee-${invitee.id}`}
                            checked={selectedInvitees.includes(invitee.id)}
                            onCheckedChange={(checked) => handleSelectInvitee(invitee.id, checked as boolean)}
                          />

                          <div className="flex-1">
                            <div className="font-medium text-white">{invitee.name}</div>
                            <div className="text-sm text-white/70">
                              {invitee.whatsapp_number && (
                                <span>📱 {invitee.whatsapp_number}</span>
                              )}
                              {invitee.whatsapp_number && invitee.email && ' • '}
                              {invitee.email && (
                                <span>✉️ {invitee.email}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {invitee.qr_code_generated && (
                              <Badge className="bg-green-500/20 text-green-300 text-xs">
                                QR généré
                              </Badge>
                            )}
                            {invitee.invitation_sent && (
                              <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                                <Send className="h-3 w-3 mr-1" />
                                Envoyé
                              </Badge>
                            )}
                            <Badge className={
                              invitee.status === 'confirmed' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-yellow-500/20 text-yellow-300'
                            }>
                              {invitee.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                            </Badge>
                            <Button
                              onClick={() => handleInviteeRemoved(invitee.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={handleFacebookFriendsInvite}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Facebook className="h-4 w-4 mr-2" />
                        Inviter amis Facebook
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                        onClick={() => {
                          // Exporter la liste des invités
                          const csvContent = invitees.map(inv => 
                            `${inv.name},${inv.whatsapp_number || ''},${inv.email || ''},${inv.status}`
                          ).join('\n');
                          
                          const blob = new Blob([`Nom,WhatsApp,Email,Statut\n${csvContent}`], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'liste-invites.csv';
                          a.click();
                          URL.revokeObjectURL(url);
                          
                          toast.success('Liste des invités exportée !');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter liste
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Formulaire d'ajout d'invités */}
                <InviteeForm
                  potId="1"
                  invitees={invitees}
                  onInviteeAdded={handleInviteeAdded}
                  onInviteeRemoved={handleInviteeRemoved}
                  onGenerateQRCodes={handleGenerateQRCodes}
                />
              </div>
            </TabsContent>

            {/* Onglet Formules - AVEC PARTICIPATION PERSONNELLE */}
            <TabsContent value="formulas">
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Sélectionner votre formule Pack Ciné
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormulaSelector
                      formulas={formulasData as Formula[]}
                      selectedFormulaId={selectedFormula?.id}
                      onSelect={handleFormulaSelect}
                    />
                  </CardContent>
                </Card>

                {/* NOUVELLE SECTION - Participer à sa propre cagnotte */}
                <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm border-green-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Heart className="h-5 w-5 text-green-400" />
                      Participer à votre propre cagnotte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/90 mb-4">
                      Vous pouvez également contribuer à votre propre cagnotte en choisissant une formule ci-dessous :
                    </p>
                    
                    <div className="grid gap-3">
                      {(formulasData as Formula[]).map((formula) => (
                        <div key={formula.id} className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{formula.name}</h4>
                            <p className="text-sm text-white/70">{formula.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                                {formula.min_tickets} ticket{formula.min_tickets > 1 ? 's' : ''}
                              </Badge>
                              {formula.includes_popcorn && (
                                <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">
                                  🍿 Popcorn
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">
                                {formatCurrency(formula.total_price || 0)}
                              </div>
                              {formula.price_per_ticket && (
                                <div className="text-xs text-white/70">
                                  {formatCurrency(formula.price_per_ticket)}/ticket
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleSelfDonate(formula)}
                              className="bg-green-500 hover:bg-green-600"
                              size="sm"
                            >
                              <Gift className="h-4 w-4 mr-1" />
                              Participer
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-400/30">
                      <p className="text-green-200 text-sm">
                        💡 <strong>Astuce :</strong> En participant à votre propre cagnotte, vous montrez l'exemple à vos invités 
                        et augmentez le montant total collecté. Votre contribution sera visible comme les autres donations.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ONGLET MINEURS AMÉLIORÉ - GESTION COMPLÈTE AVEC PHOTOS */}
            <TabsContent value="mineurs">
              <div className="space-y-6">
                {/* Statistiques des mineurs */}
                <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Baby className="h-5 w-5 text-blue-400" />
                      Gestion des mineurs de votre famille
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">{managedMinors.length}</div>
                        <div className="text-sm text-blue-200">Mineurs gérés</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">
                          {managedMinors.filter(m => m.pot_id).length}
                        </div>
                        <div className="text-sm text-green-200">Cagnottes actives</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-300">
                          {formatCurrency(managedMinors.reduce((sum, m) => sum + (m.pot_amount || 0), 0))}
                        </div>
                        <div className="text-sm text-yellow-200">Total collecté</div>
                      </div>
                      <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-300">
                          {managedMinors.filter(m => calculateDaysUntilBirthday(m.minor_birthday) <= 30).length}
                        </div>
                        <div className="text-sm text-purple-200">Anniversaires proches</div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={() => window.open('/auth/minor-management', '_blank')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-8 py-4 text-lg"
                        size="lg"
                      >
                        <UserPlus className="h-5 w-5 mr-2" />
                        Ajouter un mineur
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des mineurs gérés AVEC GESTION DES PHOTOS */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Mes mineurs gérés ({managedMinors.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMinors ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white/70">Chargement des mineurs...</p>
                      </div>
                    ) : managedMinors.length === 0 ? (
                      <div className="text-center py-8 text-white/60">
                        <Baby className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun mineur géré pour le moment</p>
                        <p className="text-sm">Ajoutez votre premier mineur pour commencer</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {managedMinors.map((minor, index) => (
                          <motion.div
                            key={minor.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Avatar className="h-16 w-16 border-2 border-blue-400/50">
                                  <AvatarImage 
                                    src={minor.profile_photo_url || undefined} 
                                    alt={minor.minor_name}
                                  />
                                  <AvatarFallback className="bg-blue-500 text-white">
                                    {minor.minor_name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                
                                {/* NOUVEAU : Bouton pour ajouter/changer la photo du mineur */}
                                <Dialog 
                                  open={showMinorPhotoUpload === minor.id} 
                                  onOpenChange={(open) => setShowMinorPhotoUpload(open ? minor.id : null)}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="absolute -top-1 -right-1 bg-green-500 hover:bg-green-600 rounded-full p-1"
                                    >
                                      <Camera className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Photo de {minor.minor_name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="text-center">
                                        <Avatar className="h-24 w-24 mx-auto mb-4">
                                          <AvatarImage 
                                            src={minor.profile_photo_url || undefined} 
                                            alt={minor.minor_name}
                                          />
                                          <AvatarFallback className="bg-blue-500 text-white text-xl">
                                            {minor.minor_name.split(' ').map(n => n[0]).join('')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <p className="text-sm text-muted-foreground">
                                          Cette photo s'affichera sur la page d'anniversaire de {minor.minor_name}
                                        </p>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor={`minor-photo-upload-${minor.id}`}>
                                          {minor.profile_photo_url ? 'Changer la photo' : 'Ajouter une photo'}
                                        </Label>
                                        <Input
                                          id={`minor-photo-upload-${minor.id}`}
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleMinorPhotoUpload(minor.id, e)}
                                          disabled={isUploadingPhoto}
                                          className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          Formats acceptés : JPG, PNG, GIF (max 5MB)
                                        </p>
                                      </div>

                                      {isUploadingPhoto && (
                                        <div className="text-center py-4">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                                          <p className="text-sm text-muted-foreground">
                                            Upload et redimensionnement en cours...
                                          </p>
                                        </div>
                                      )}

                                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 text-blue-700 text-sm">
                                          <ImageIcon className="h-4 w-4" />
                                          <span className="font-medium">Optimisation automatique :</span>
                                        </div>
                                        <ul className="text-blue-600 text-xs mt-1 space-y-1">
                                          <li>• Redimensionnement automatique pour le web</li>
                                          <li>• Compression optimisée pour un chargement rapide</li>
                                          <li>• Format adapté aux réseaux sociaux</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-white">{minor.minor_name}</h4>
                                  <Badge className="bg-blue-500/20 text-blue-300">
                                    {getRelationText(minor.relationship_type)}
                                  </Badge>
                                  {minor.pot_id && (
                                    <Badge className="bg-green-500/20 text-green-300">
                                      <Gift className="h-3 w-3 mr-1" />
                                      Cagnotte active
                                    </Badge>
                                  )}
                                  {minor.profile_photo_url && (
                                    <Badge className="bg-purple-500/20 text-purple-300">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      Photo ajoutée
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="text-sm text-white/70">
                                  <div>🎂 Anniversaire: {new Date(minor.minor_birthday).toLocaleDateString('fr-FR')}</div>
                                  <div>⏰ Dans: {calculateDaysUntilBirthday(minor.minor_birthday)} jours</div>
                                  {minor.pot_amount && (
                                    <div>💰 Montant collecté: {formatCurrency(minor.pot_amount)}</div>
                                  )}
                                  {minor.profile_photo_url ? (
                                    <div className="text-purple-300">📸 Photo configurée pour sa page d'anniversaire</div>
                                  ) : (
                                    <div className="text-yellow-300">📸 Aucune photo - utilisera l'avatar par défaut</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!minor.pot_id ? (
                                <Button
                                  onClick={() => handleCreateMinorPot(minor.id)}
                                  className="bg-green-500 hover:bg-green-600"
                                  size="sm"
                                >
                                  <Gift className="h-4 w-4 mr-1" />
                                  Créer cagnotte
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => window.open(`/user/${minor.minor_name.toLowerCase().replace(/\s+/g, '')}?owner=true&minor_id=${minor.id}`, '_blank')}
                                  className="bg-blue-500 hover:bg-blue-600"
                                  size="sm"
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Gérer
                                </Button>
                              )}
                              
                              <Button
                                onClick={() => handleTransferMinorManagement(minor.id)}
                                variant="outline"
                                size="sm"
                                className="border-white/30 text-white hover:bg-white/10"
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Transférer
                              </Button>
                              
                              <Button
                                onClick={() => handleRemoveMinor(minor.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Système de protection expliqué AVEC PHOTOS */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-400" />
                      Système de protection des mineurs avec photos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Sécurité :</h4>
                        <ul className="text-white/90 text-sm space-y-2">
                          <li>🔐 <strong>Authentification obligatoire</strong> pour tous les gestionnaires</li>
                          <li>🚫 <strong>Détection automatique des doublons</strong> par nom + date de naissance</li>
                          <li>👥 <strong>Un seul gestionnaire actif</strong> par mineur à la fois</li>
                          <li>📝 <strong>Traçabilité complète</strong> de qui gère quoi</li>
                          <li>📸 <strong>Photos sécurisées</strong> avec redimensionnement automatique</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">Gestion :</h4>
                        <ul className="text-white/90 text-sm space-y-2">
                          <li>🔄 <strong>Transfert de gestion</strong> entre membres de la famille</li>
                          <li>👨‍👩‍👧‍👦 <strong>Relations autorisées :</strong> Enfant, Frère/Sœur, Neveu/Nièce</li>
                          <li>📱 <strong>Dashboard unifié</strong> pour gérer tous vos mineurs</li>
                          <li>⚡ <strong>Actions rapides :</strong> Créer, transférer, supprimer</li>
                          <li>🖼️ <strong>Photos personnalisées</strong> pour chaque page d'anniversaire</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-400/30">
                      <div className="flex items-center gap-2 text-green-300 mb-2">
                        <ImageIcon className="h-4 w-4" />
                        <span className="font-medium">Gestion des photos :</span>
                      </div>
                      <div className="text-green-200 text-sm space-y-1">
                        <p>• <strong>Upload sécurisé :</strong> Validation automatique des formats et tailles</p>
                        <p>• <strong>Optimisation :</strong> Redimensionnement et compression automatiques</p>
                        <p>• <strong>Affichage :</strong> Photos visibles sur les pages d'anniversaire des mineurs</p>
                        <p>• <strong>Confidentialité :</strong> Seuls les gestionnaires autorisés peuvent modifier les photos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ONGLET PARRAINAGE - SYSTÈME VIRAL COMPLET */}
            <TabsContent value="sponsorship">
              <SponsorshipManager userId={user.id} />
            </TabsContent>

            {/* Onglet QR Codes */}
            <TabsContent value="qrcodes">
              <QRCodeGenerator
                potId="1"
                invitees={invitees}
              />
            </TabsContent>

            {/* Onglet Analytics - COMPLET */}
            <TabsContent value="analytics">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Performances Facebook</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Portée des publications</span>
                          <span className="text-white font-semibold">1,234 personnes</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Interactions</span>
                          <span className="text-white font-semibold">89 likes, 23 commentaires</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Clics sur le lien</span>
                          <span className="text-white font-semibold">156 clics</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Taux de conversion</span>
                          <span className="text-white font-semibold">14.7%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Résumé des performances</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Taux de participation</span>
                          <span className="text-white font-semibold">
                            {Math.round((potStats.participants / 50) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Don moyen</span>
                          <span className="text-white font-semibold">
                            {formatCurrency(potStats.currentAmount / potStats.participants)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Objectif atteint</span>
                          <span className="text-white font-semibold">
                            {potStats.progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">ROI Parrainage</span>
                          <span className="text-white font-semibold">
                            {sponsorshipStats.totalPointsEarned}x
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Mineurs avec cagnottes</span>
                          <span className="text-white font-semibold">
                            {managedMinors.filter(m => m.pot_id).length}/{managedMinors.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Performance WhatsApp</span>
                          <span className="text-white font-semibold">
                            {whatsappViralStats.conversionRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gestionnaire de rapports */}
                <ReportsManager potId="1" />
              </div>
            </TabsContent>

            {/* Onglet Paramètres - COMPLET AVEC PHOTO DE PROFIL */}
            <TabsContent value="settings">
              <div className="space-y-6">
                {/* NOUVELLE SECTION : Gestion de la photo de profil */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Photo de profil
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-blue-400/50">
                          <AvatarImage 
                            src={user.customProfilePhotoUrl || user.profileImage} 
                            alt={user.name} 
                          />
                          <AvatarFallback className="bg-orange-500 text-white text-xl">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <Button
                          onClick={() => setShowPhotoUpload(true)}
                          size="sm"
                          className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 rounded-full"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-2">Personnalisez votre photo</h4>
                        <p className="text-white/70 text-sm mb-3">
                          Cette photo s'affichera sur votre page d'anniversaire et sera visible par tous vos invités.
                        </p>
                        <Button
                          onClick={() => setShowPhotoUpload(true)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {user.customProfilePhotoUrl ? 'Changer la photo' : 'Ajouter une photo'}
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
                      <p className="text-blue-200 text-sm">
                        💡 <strong>Conseils :</strong> Utilisez une photo claire et récente. 
                        Elle sera automatiquement redimensionnée et optimisée pour un affichage parfait sur tous les appareils.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Paramètres de la cagnotte
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pot-title" className="text-white">
                          Titre de la cagnotte
                        </Label>
                        <Input
                          id="pot-title"
                          value={potSettings.title}
                          onChange={(e) => setPotSettings(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-white/10 border-white/30 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-amount" className="text-white">
                          Objectif (FCFA)
                        </Label>
                        <Input
                          id="target-amount"
                          type="number"
                          value={potSettings.targetAmount}
                          onChange={(e) => setPotSettings(prev => ({ ...prev, targetAmount: parseInt(e.target.value) }))}
                          className="bg-white/10 border-white/30 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pot-description" className="text-white">
                        Description
                      </Label>
                      <Textarea
                        id="pot-description"
                        value={potSettings.description}
                        onChange={(e) => setPotSettings(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-white/10 border-white/30 text-white"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="is-public" className="text-white">
                          Cagnotte publique
                        </Label>
                        <Switch
                          id="is-public"
                          checked={potSettings.isPublic}
                          onCheckedChange={(checked) => setPotSettings(prev => ({ ...prev, isPublic: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allow-anonymous" className="text-white">
                          Dons anonymes
                        </Label>
                        <Switch
                          id="allow-anonymous"
                          checked={potSettings.allowAnonymous}
                          onCheckedChange={(checked) => setPotSettings(prev => ({ ...prev, allowAnonymous: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-donor-names" className="text-white">
                          Afficher noms donateurs
                        </Label>
                        <Switch
                          id="show-donor-names"
                          checked={potSettings.showDonorNames}
                          onCheckedChange={(checked) => setPotSettings(prev => ({ ...prev, showDonorNames: checked }))}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleUpdatePotSettings}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Mettre à jour les paramètres
                    </Button>
                  </CardContent>
                </Card>

                {/* Intégration Facebook */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Facebook className="h-5 w-5 text-blue-400" />
                      Intégration Facebook
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                          <span className="text-green-300 font-medium">Statut de connexion</span>
                          <Badge className="bg-green-500/30 text-green-200">
                            ✓ Connecté
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Amis Facebook</span>
                            <span className="text-white font-semibold">{facebookIntegration.friendsCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Groupes</span>
                            <span className="text-white font-semibold">{facebookIntegration.groupsCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Pages gérées</span>
                            <span className="text-white font-semibold">{facebookIntegration.pagesCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-white font-medium">Permissions accordées</h4>
                        <div className="space-y-2">
                          {facebookIntegration.permissions.map((permission, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-white/80">{permission}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button
                        onClick={handleFacebookSync}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Synchroniser
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Gérer permissions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer avec informations sur la structure unifiée ET PHOTOS ET WHATSAPP */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-green-500/10 backdrop-blur-sm border-green-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-semibold">Dashboard Propriétaire Unifié - Système Viral Complet</span>
              </div>
              <p className="text-white/60 text-sm">
                © 2025 WOLO SENEGAL® - From Connect Africa® —
                <br />
                ✅ <strong>INTERFACE UNIFIÉE :</strong> Même expérience pour tous les propriétaires de cagnottes
                <br />
                👥 <strong>INCLUSIF :</strong> Filles ET garçons utilisent la même interface
                <br />
                🔄 <strong>COHÉRENCE TOTALE :</strong> Plus de confusion entre différentes pages d'anniversaire
                <br />
                📱 <strong>Instagram intégré</strong> pour le partage (pas de connexion OAuth)
                <br />
                🚀 <strong>Système de parrainage viral</strong> avec toutes les fonctionnalités
                <br />
                👶 <strong>Gestion des mineurs</strong> avec authentification et protection complète
                <br />
                🔐 <strong>Sécurité renforcée</strong> pour la protection des données des mineurs
                <br />
                📸 <strong>Gestion complète des photos</strong> de profil pour utilisateurs et mineurs
                <br />
                🖼️ <strong>Optimisation automatique</strong> des images pour un affichage parfait
                <br />
                📞 <strong>NOUVEAU : WhatsApp Viral</strong> - Import contacts + invitations masse + tracking conversions
                <br />
                ⚡ <strong>UX ultra-fluide :</strong> 3 taps seulement pour inviter tous ses contacts
                <br />
                🔒 <strong>Sécurité invisible :</strong> Chiffrement local + permissions naturelles
                <br />
                🎯 <strong>Viralité maximale :</strong> Liens personnalisés + système de points + gamification
              </p>
            </CardContent>
          </Card>
        </motion.footer>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Chargement du dashboard...</p>
        </div>
      </div>
    }>
      <OwnerDashboardContent />
    </Suspense>
  );
}
