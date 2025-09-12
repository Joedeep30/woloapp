
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, AlertCircle, Gift, ArrowLeft, UserPlus, Mail, MessageCircle, Users, Star, Crown, Shield, Contact, Phone } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CreateCagnottePage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthdayDate: '',
    title: '',
    description: ''
  });
  const [birthdayError, setBirthdayError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // État pour le système de parrainage
  const [sponsorshipData, setSponsorshipData] = useState({
    invitedName: '',
    invitedEmail: '',
    invitedPhone: '',
    invitedBirthday: '',
    invitationMessage: '',
    relation: ''
  });
  const [sponsorshipError, setSponsorshipError] = useState('');
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);

  // NOUVEAU : État pour créer une cagnotte pour un mineur de la famille
  const [minorCagnotteData, setMinorCagnotteData] = useState({
    minorRelationType: 'enfant', // Seule option disponible maintenant
    minorName: '',
    minorBirthday: ''
  });
  const [minorCagnotteError, setMinorCagnotteError] = useState('');
  const [isCreatingForMinor, setIsCreatingForMinor] = useState(false);

  // NOUVEAU : État pour l'invitation via contacts WhatsApp
  const [whatsappContacts, setWhatsappContacts] = useState<any[]>([]);
  const [showWhatsappContacts, setShowWhatsappContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [hasWhatsappPermission, setHasWhatsappPermission] = useState(false);

  const validateBirthdayDate = (date: string) => {
    if (!date) {
      setBirthdayError('Veuillez sélectionner votre date d\'anniversaire');
      return false;
    }

    const today = new Date();
    const birthday = new Date(date);
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 10) {
      setBirthdayError('Votre anniversaire doit être dans au moins 10 jours pour créer une cagnotte');
      return false;
    }

    if (diffDays > 30) {
      setBirthdayError('Votre anniversaire doit être dans moins de 30 jours pour créer une cagnotte');
      return false;
    }

    setBirthdayError('');
    return true;
  };

  const validateSponsorshipBirthday = (date: string) => {
    if (!date) {
      setSponsorshipError('Veuillez sélectionner la date d\'anniversaire de la personne');
      return false;
    }

    const today = new Date();
    const birthday = new Date(date);
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 10) {
      setSponsorshipError('L\'anniversaire doit être dans au moins 10 jours pour être parrainé');
      return false;
    }

    if (diffDays > 30) {
      setSponsorshipError('L\'anniversaire doit être dans moins de 30 jours pour être parrainé');
      return false;
    }

    setSponsorshipError('');
    return true;
  };

  // NOUVELLE FONCTION : Validation pour cagnotte mineur famille
  const validateMinorCagnotteBirthday = (date: string) => {
    if (!date) {
      setMinorCagnotteError('Veuillez sélectionner la date d\'anniversaire du mineur');
      return false;
    }

    const today = new Date();
    const birthday = new Date(date);
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 10) {
      setMinorCagnotteError('L\'anniversaire doit être dans au moins 10 jours pour créer une cagnotte');
      return false;
    }

    if (diffDays > 30) {
      setMinorCagnotteError('L\'anniversaire doit être dans moins de 30 jours pour créer une cagnotte');
      return false;
    }

    setMinorCagnotteError('');
    return true;
  };

  // NOUVELLE FONCTION : Demander l'accès aux contacts WhatsApp
  const requestWhatsappContactsAccess = async () => {
    try {
      setIsLoadingContacts(true);
      
      // Vérifier si l'API Contacts est disponible
      if (!('contacts' in navigator) || !navigator.contacts) {
        toast.error('L\'accès aux contacts n\'est pas supporté sur cet appareil');
        return;
      }

      // Demander la permission d'accès aux contacts
      const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: true });
      
      if (contacts && contacts.length > 0) {
        // Filtrer et formater les contacts avec numéros de téléphone
        const formattedContacts = contacts
          .filter((contact: any) => contact.tel && contact.tel.length > 0)
          .map((contact: any, index: number) => ({
            id: `contact_${index}`,
            name: contact.name || 'Contact sans nom',
            phone: contact.tel[0] || '',
            isSelected: false
          }));

        setWhatsappContacts(formattedContacts);
        setHasWhatsappPermission(true);
        setShowWhatsappContacts(true);
        
        toast.success(`${formattedContacts.length} contacts WhatsApp chargés !`);
      } else {
        toast.info('Aucun contact trouvé ou accès refusé');
      }
    } catch (error) {
      console.error('Erreur lors de l\'accès aux contacts:', error);
      
      // Fallback : Simuler des contacts pour la démo
      const mockContacts = [
        { id: 'contact_1', name: 'Fatou Ba', phone: '+221771234567', isSelected: false },
        { id: 'contact_2', name: 'Ousmane Diop', phone: '+221771234568', isSelected: false },
        { id: 'contact_3', name: 'Aminata Fall', phone: '+221771234569', isSelected: false },
        { id: 'contact_4', name: 'Mamadou Sow', phone: '+221771234570', isSelected: false },
        { id: 'contact_5', name: 'Khadija Ndiaye', phone: '+221771234571', isSelected: false }
      ];
      
      setWhatsappContacts(mockContacts);
      setHasWhatsappPermission(true);
      setShowWhatsappContacts(true);
      
      toast.success('Contacts WhatsApp simulés chargés pour la démo !');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // NOUVELLE FONCTION : Sélectionner/désélectionner un contact
  const handleContactSelection = (contactId: string, selected: boolean) => {
    if (selected) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  // NOUVELLE FONCTION : Sélectionner tous les contacts
  const handleSelectAllContacts = (selected: boolean) => {
    if (selected) {
      setSelectedContacts(whatsappContacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  // NOUVELLE FONCTION : Envoyer invitations aux contacts sélectionnés
  const handleSendWhatsappInvitations = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Veuillez sélectionner au moins un contact');
      return;
    }

    setIsSendingInvitation(true);
    
    try {
      const selectedContactsData = whatsappContacts.filter(c => selectedContacts.includes(c.id));
      
      // Simuler l'envoi d'invitations de parrainage via WhatsApp
      for (const contact of selectedContactsData) {
        const invitationMessage = `Salut ${contact.name} ! 🎉 J'ai découvert WOLO SENEGAL, une super plateforme pour organiser des cagnottes d'anniversaire avec des cadeaux cinéma ! Ton anniversaire approche et je pense que ça pourrait t'intéresser. Tu veux que WOLO gère ta cagnotte d'anniversaire ? C'est gratuit et très facile ! 🎂🎁`;
        
        // Ouvrir WhatsApp avec le message pré-rempli
        const whatsappUrl = `https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(invitationMessage)}`;
        
        // Ouvrir dans un nouvel onglet avec un délai pour éviter le blocage des popups
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, selectedContactsData.indexOf(contact) * 500);
      }
      
      toast.success(`Invitations de parrainage envoyées à ${selectedContacts.length} contact(s) WhatsApp !`);
      toast.info('Vous recevrez 10 points pour chaque personne qui accepte et crée sa cagnotte !');
      
      // Réinitialiser la sélection
      setSelectedContacts([]);
      setShowWhatsappContacts(false);
      
    } catch (error) {
      toast.error('Erreur lors de l\'envoi des invitations WhatsApp');
    } finally {
      setIsSendingInvitation(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'birthdayDate') {
      validateBirthdayDate(value);
    }
    
    // Auto-générer le titre si prénom est rempli
    if (field === 'firstName' && value) {
      setFormData(prev => ({ 
        ...prev, 
        title: `Anniversaire de ${value}`,
        description: `Aide-${value} à remplir sa cagnotte WOLO SENEGAL !`
      }));
    }
  };

  const handleSponsorshipInputChange = (field: string, value: string) => {
    setSponsorshipData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'invitedBirthday') {
      validateSponsorshipBirthday(value);
    }

    // Auto-générer le message d'invitation
    if (field === 'invitedName' && value) {
      setSponsorshipData(prev => ({
        ...prev,
        invitationMessage: `Salut ${value} ! 🎉 J'ai découvert WOLO SENEGAL, une super plateforme pour organiser des cagnottes d'anniversaire avec des cadeaux cinéma ! Ton anniversaire approche et je pense que ça pourrait t'intéresser. Tu veux que WOLO gère ta cagnotte d'anniversaire ? C'est gratuit et très facile ! 🎂🎁`
      }));
    }
  };

  // NOUVELLE FONCTION : Gestion des changements pour cagnotte mineur famille
  const handleMinorCagnotteInputChange = (field: string, value: string) => {
    setMinorCagnotteData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'minorBirthday') {
      validateMinorCagnotteBirthday(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBirthdayDate(formData.birthdayDate)) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simuler la création de la cagnotte
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Cagnotte créée avec succès !');
      
      // Rediriger vers la page propriétaire unifiée
      const userId = formData.firstName.toLowerCase();
      window.location.href = `/owner?user=${userId}`;
      
    } catch (error) {
      toast.error('Erreur lors de la création de la cagnotte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSponsorshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSponsorshipBirthday(sponsorshipData.invitedBirthday)) {
      return;
    }

    if (!sponsorshipData.invitedName || (!sponsorshipData.invitedEmail && !sponsorshipData.invitedPhone)) {
      setSponsorshipError('Veuillez remplir le nom et au moins un moyen de contact');
      return;
    }

    if (!sponsorshipData.relation) {
      setSponsorshipError('Veuillez sélectionner votre relation avec la personne');
      return;
    }

    setIsSendingInvitation(true);
    
    try {
      // Simuler l'envoi de l'invitation de parrainage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Générer un token d'invitation unique
      const invitationToken = `WOLO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const invitationUrl = `${window.location.origin}/sponsorship/accept/${invitationToken}`;
      
      // Simuler l'envoi par email ou SMS
      if (sponsorshipData.invitedEmail) {
        // Envoi par email
        console.log('Envoi email à:', sponsorshipData.invitedEmail);
        console.log('URL d\'invitation:', invitationUrl);
        toast.success(`Invitation de parrainage envoyée par email à ${sponsorshipData.invitedName} !`);
      } else if (sponsorshipData.invitedPhone) {
        // Envoi par SMS
        console.log('Envoi SMS à:', sponsorshipData.invitedPhone);
        console.log('URL d\'invitation:', invitationUrl);
        toast.success(`Invitation de parrainage envoyée par SMS à ${sponsorshipData.invitedName} !`);
      }
      
      // Réinitialiser le formulaire
      setSponsorshipData({
        invitedName: '',
        invitedEmail: '',
        invitedPhone: '',
        invitedBirthday: '',
        invitationMessage: '',
        relation: ''
      });
      
      toast.info('Vous recevrez 10 points dès que la personne accepte et crée sa cagnotte !');
      
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'invitation de parrainage');
    } finally {
      setIsSendingInvitation(false);
    }
  };

  // NOUVELLE FONCTION : Soumission pour cagnotte mineur famille
  const handleMinorCagnotteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!minorCagnotteData.minorName) {
      setMinorCagnotteError('Veuillez saisir le nom du mineur');
      return;
    }
    if (!validateMinorCagnotteBirthday(minorCagnotteData.minorBirthday)) {
      return;
    }

    setIsCreatingForMinor(true);
    
    try {
      // Simuler la création de la cagnotte pour un mineur de la famille
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Cagnotte créée pour ${minorCagnotteData.minorName} !`);
      toast.info(`Relation familiale obligatoire`);
      
      // Rediriger vers la page propriétaire avec les paramètres
      const userId = minorCagnotteData.minorName.toLowerCase().replace(/\s+/g, '');
      window.location.href = `/owner?user=${userId}&for_minor=true`;
      
    } catch (error) {
      toast.error('Erreur lors de la création de la cagnotte');
    } finally {
      setIsCreatingForMinor(false);
    }
  };

  // Authentification avec Apple Sign-In
  const handleAppleLogin = () => {
    toast.info('Connexion Apple ID en cours...');
    setTimeout(() => {
      toast.success('Connexion Apple réussie !');
      window.location.href = '/owner'; // REDIRECTION VERS LA PAGE UNIFIÉE
    }, 2000);
  };

  // Authentification avec Google
  const handleGoogleLogin = () => {
    toast.info('Connexion Google en cours...');
    setTimeout(() => {
      toast.success('Connexion Google réussie !');
      window.location.href = '/owner'; // REDIRECTION VERS LA PAGE UNIFIÉE
    }, 2000);
  };

  // Authentification avec Facebook
  const handleFacebookLogin = () => {
    toast.info('Connexion Facebook en cours...');
    setTimeout(() => {
      toast.success('Connexion Facebook réussie !');
      window.location.href = '/owner'; // REDIRECTION VERS LA PAGE UNIFIÉE
    }, 2000);
  };

  // Authentification avec d'autres réseaux sociaux
  const handleSocialLogin = (provider: string) => {
    switch (provider) {
      case 'twitter':
        toast.info('Connexion Twitter/X en cours...');
        break;
      case 'linkedin':
        toast.info('Connexion LinkedIn en cours...');
        break;
      case 'tiktok':
        toast.info('Connexion TikTok en cours...');
        break;
      case 'snapchat':
        toast.info('Connexion Snapchat en cours...');
        break;
      case 'instagram':
        toast.info('Instagram ne propose pas de connexion OAuth, mais vous pourrez partager vos cagnottes !');
        break;
      default:
        toast.error('Méthode de connexion non supportée');
    }
    
    setTimeout(() => {
      toast.success(`Connexion ${provider} réussie !`);
      window.location.href = '/owner'; // REDIRECTION VERS LA PAGE UNIFIÉE
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Éléments décoratifs animés - couleurs douces */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-20"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: -50,
              rotate: 0 
            }}
            animate={{ 
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
              rotate: 360,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)
            }}
            transition={{ 
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
          >
            {['🎉', '🎂', '🎁', '🎈', '🎊', '🍰', '🎵', '⭐'][Math.floor(Math.random() * 8)]}
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link href="/landing">
            <Button variant="ghost" className="text-slate-700 hover:bg-white/50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-slate-800">
            Créer votre cagnotte ou parrainer quelqu'un
          </h1>
          
          <div className="w-20" /> {/* Spacer */}
        </motion.div>

        {/* Contenu principal avec onglets - LOGIQUE CORRIGÉE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Tabs defaultValue="create" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg border border-slate-200">
              <TabsTrigger value="create" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-700">
                <Gift className="h-4 w-4 mr-2" />
                Créer ma cagnotte
              </TabsTrigger>
              <TabsTrigger value="minor" className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-slate-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Pour un mineur de ma famille
              </TabsTrigger>
              <TabsTrigger value="sponsor" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-700">
                <Star className="h-4 w-4 mr-2" />
                Parrainer quelqu'un
              </TabsTrigger>
            </TabsList>

            {/* ONGLET CRÉATION DE CAGNOTTE PERSONNELLE */}
            <TabsContent value="create">
              <Card className="bg-white border-slate-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-800 text-center flex items-center justify-center gap-2">
                    <Gift className="h-6 w-6 text-blue-600" />
                    Créez votre propre cagnotte d'anniversaire
                  </CardTitle>
                  <p className="text-slate-600 text-center">
                    ✅ <strong>Ouvert aux filles ET aux garçons</strong> - Interface unifiée pour tous
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Options d'authentification multiples avec icônes plus petites */}
                  <div className="mb-8">
                    <h3 className="text-slate-700 font-semibold mb-4 text-center">
                      Connectez-vous via votre compte préféré
                    </h3>
                    
                    {/* Bouton Google principal */}
                    <div className="mb-4">
                      <Button
                        onClick={handleGoogleLogin}
                        className="w-full bg-black hover:bg-gray-800 text-white flex items-center justify-center gap-3 py-3"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="font-medium">Continuer avec Google</span>
                      </Button>
                    </div>

                    {/* Autres options avec icônes plus petites */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={handleFacebookLogin}
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white flex items-center justify-center gap-1 py-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span className="text-sm">Facebook</span>
                      </Button>
                      
                      <Button
                        onClick={handleAppleLogin}
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white flex items-center justify-center gap-1 py-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        <span className="text-sm">Apple</span>
                      </Button>
                    </div>

                    <div className="my-6 flex items-center">
                      <Separator className="flex-1 bg-slate-300" />
                      <span className="mx-3 text-sm uppercase text-slate-500 font-semibold">OU</span>
                      <Separator className="flex-1 bg-slate-300" />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informations personnelles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-slate-700 font-semibold">
                          Prénom *
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Votre prénom"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-slate-700 font-semibold">
                          Nom *
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Votre nom"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email" className="text-slate-700 font-semibold">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="votre@email.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-slate-700 font-semibold">
                          Téléphone *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="+221 77 123 45 67"
                          required
                        />
                      </div>
                    </div>

                    {/* Date d'anniversaire */}
                    <div>
                      <Label htmlFor="birthdayDate" className="text-slate-700 font-semibold">
                        Date de votre anniversaire *
                      </Label>
                      <Input
                        id="birthdayDate"
                        type="date"
                        value={formData.birthdayDate}
                        onChange={(e) => handleInputChange('birthdayDate', e.target.value)}
                        className="bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      {birthdayError && (
                        <Alert className="mt-2 border-red-300 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 font-medium">
                            {birthdayError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Informations sur la cagnotte */}
                    <div>
                      <Label htmlFor="title" className="text-slate-700 font-semibold">
                        Titre de votre cagnotte *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Anniversaire de..."
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-slate-700 font-semibold">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Aide-moi à remplir ma cagnotte WOLO SENEGAL !"
                      />
                    </div>

                    {/* Conditions */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-1">Conditions :</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>L'anniversaire doit être dans 10 à 30 jours</li>
                            <li>Vous gérerez la cagnotte pour ce mineur</li>
                            <li><strong>Relation familiale obligatoire</strong></li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Bouton de soumission */}
                    <Button
                      type="submit"
                      disabled={isLoading || !!birthdayError || !formData.firstName || !formData.birthdayDate}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-lg shadow-lg"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <Gift className="h-5 w-5 mr-2" />
                          Créer ma cagnotte
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOUVEL ONGLET - CRÉER POUR UN MINEUR DE LA FAMILLE */}
            <TabsContent value="minor">
              <Card className="bg-white border-slate-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-800 text-center flex items-center justify-center gap-2">
                    <UserPlus className="h-6 w-6 text-green-600" />
                    Créez et gérez une cagnotte pour un mineur de votre famille
                  </CardTitle>
                  <p className="text-slate-600 text-center">
                    Gérez la cagnotte d'anniversaire d'un mineur de votre famille
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Authentification requise avec icônes plus petites */}
                  <div className="mb-8">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Authentification requise</span>
                      </div>
                      <p className="text-blue-700 text-sm mb-3">
                        Pour gérer la cagnotte d'un mineur, vous devez d'abord vous identifier avec votre compte :
                      </p>
                      
                      {/* Bouton Google principal */}
                      <div className="mb-3">
                        <Button
                          onClick={handleGoogleLogin}
                          className="w-full bg-black hover:bg-gray-800 text-white flex items-center justify-center gap-3 py-3"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          <span className="font-medium">Continuer avec Google</span>
                        </Button>
                      </div>

                      {/* Autres options avec icônes plus petites */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={handleFacebookLogin}
                          variant="outline"
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white flex items-center justify-center gap-1 py-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          <span className="text-sm">Facebook</span>
                        </Button>
                        
                        <Button
                          onClick={handleAppleLogin}
                          variant="outline"
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white flex items-center justify-center gap-1 py-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                          <span className="text-sm">Apple</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleMinorCagnotteSubmit} className="space-y-6">
                    {/* Nom du mineur */}
                    <div className="space-y-2">
                      <Label htmlFor="minorName" className="text-slate-700 font-semibold">
                        Nom du mineur *
                      </Label>
                      <Input
                        id="minorName"
                        value={minorCagnotteData.minorName}
                        onChange={(e) => handleMinorCagnotteInputChange('minorName', e.target.value)}
                        className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500"
                        placeholder="Prénom et nom du mineur"
                        required
                      />
                    </div>

                    {/* Date d'anniversaire */}
                    <div className="space-y-2">
                      <Label htmlFor="minorBirthday" className="text-slate-700 font-semibold">
                        Date d'anniversaire *
                      </Label>
                      <Input
                        id="minorBirthday"
                        type="date"
                        value={minorCagnotteData.minorBirthday}
                        onChange={(e) => handleMinorCagnotteInputChange('minorBirthday', e.target.value)}
                        className="bg-white border-slate-300 text-slate-800 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                      {minorCagnotteError && (
                        <Alert className="mt-2 border-red-300 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 font-medium">
                            {minorCagnotteError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Conditions spécifiques - TEXTE CORRIGÉ */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="text-sm text-green-800">
                          <p className="font-semibold mb-1">Conditions :</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>L'anniversaire doit être dans 10 à 30 jours</li>
                            <li>Vous gérerez la cagnotte pour ce mineur</li>
                            <li><strong>Relation familiale obligatoire</strong></li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={
                        isCreatingForMinor || 
                        !minorCagnotteData.minorName || 
                        !minorCagnotteData.minorBirthday || 
                        !!minorCagnotteError
                      }
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-lg shadow-lg"
                      size="lg"
                    >
                      {isCreatingForMinor ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5 mr-2" />
                          Créer la cagnotte pour {minorCagnotteData.minorName || 'ce mineur'}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ONGLET PARRAINAGE - LOGIQUE CORRIGÉE AVEC WHATSAPP */}
            <TabsContent value="sponsor">
              <Card className="bg-white border-slate-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-800 text-center flex items-center justify-center gap-2">
                    <Star className="h-6 w-6 text-purple-600" />
                    Parrainer un ami/amie ou membre de la famille
                  </CardTitle>
                  <p className="text-slate-600 text-center">
                    Invitez vos amis et gagnez des points ! 🌟
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Système de points expliqué */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <h4 className="text-slate-800 font-semibold">Système de points WOLO</h4>
                    </div>
                    <div className="text-slate-700 text-sm space-y-2">
                      <p>🎯 <strong>10 points</strong> dès que votre filleul accepte et crée sa cagnotte</p>
                      <p>📈 <strong>Points bonus</strong> selon la croissance de sa cagnotte :</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>+5 points si sa cagnotte atteint 25 000 FCFA</li>
                        <li>+10 points si sa cagnotte atteint 50 000 FCFA</li>
                        <li>+20 points si sa cagnotte atteint 100 000 FCFA</li>
                      </ul>
                      <p>🔄 <strong>Effet viral :</strong> Plus vos filleuls réussissent, plus vous gagnez !</p>
                      <p>⚠️ <strong>Limite :</strong> 1 seul parrain par personne (premier arrivé)</p>
                    </div>
                  </div>

                  {/* NOUVEAU : Invitation via contacts WhatsApp */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Contact className="h-5 w-5 text-green-600" />
                      <h4 className="text-slate-800 font-semibold">Invitation rapide via vos contacts WhatsApp</h4>
                    </div>
                    <p className="text-green-700 text-sm mb-4">
                      Accédez à votre liste de contacts WhatsApp et invitez plusieurs amis en même temps pour le parrainage !
                    </p>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={requestWhatsappContactsAccess}
                        disabled={isLoadingContacts}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isLoadingContacts ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Chargement...
                          </>
                        ) : (
                          <>
                            <Phone className="h-4 w-4 mr-2" />
                            Accéder à mes contacts WhatsApp
                          </>
                        )}
                      </Button>
                      
                      {hasWhatsappPermission && (
                        <Button
                          onClick={() => setShowWhatsappContacts(true)}
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Voir mes contacts ({whatsappContacts.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Dialog pour sélection des contacts WhatsApp */}
                  <Dialog open={showWhatsappContacts} onOpenChange={setShowWhatsappContacts}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle>Sélectionner vos contacts WhatsApp pour le parrainage</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Contrôles de sélection */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="select-all-contacts"
                              checked={selectedContacts.length === whatsappContacts.length && whatsappContacts.length > 0}
                              onCheckedChange={handleSelectAllContacts}
                            />
                            <Label htmlFor="select-all-contacts" className="font-medium">
                              Tout sélectionner ({selectedContacts.length}/{whatsappContacts.length})
                            </Label>
                          </div>
                          
                          <Button
                            onClick={handleSendWhatsappInvitations}
                            disabled={selectedContacts.length === 0 || isSendingInvitation}
                            className="bg-green-500 hover:bg-green-600"
                            size="sm"
                          >
                            {isSendingInvitation ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Envoi...
                              </>
                            ) : (
                              <>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Inviter ({selectedContacts.length})
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Liste des contacts avec cases à cocher */}
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {whatsappContacts.map((contact) => (
                            <div key={contact.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              selectedContacts.includes(contact.id)
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            }`}>
                              <Checkbox
                                id={`contact-${contact.id}`}
                                checked={selectedContacts.includes(contact.id)}
                                onCheckedChange={(checked) => handleContactSelection(contact.id, checked as boolean)}
                              />
                              
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{contact.name}</div>
                                <div className="text-sm text-gray-600">{contact.phone}</div>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                WhatsApp
                              </div>
                            </div>
                          ))}
                        </div>

                        {whatsappContacts.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Contact className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun contact WhatsApp trouvé</p>
                            <p className="text-sm">Assurez-vous d'avoir des contacts dans votre téléphone</p>
                          </div>
                        )}

                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-blue-700 text-sm">
                            💡 <strong>Astuce :</strong> Sélectionnez plusieurs contacts pour envoyer des invitations de parrainage en masse. 
                            Chaque personne qui accepte vous rapportera 10 points + bonus selon leur succès !
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <form onSubmit={handleSponsorshipSubmit} className="space-y-6">
                    {/* Relation avec la personne */}
                    <div>
                      <Label htmlFor="relation" className="text-slate-700 font-semibold">
                        Relation avec la personne ? *
                      </Label>
                      <Select
                        value={sponsorshipData.relation}
                        onValueChange={(value) => handleSponsorshipInputChange('relation', value)}
                      >
                        <SelectTrigger className="bg-white border-slate-300 text-slate-800">
                          <SelectValue placeholder="Sélectionnez votre relation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ami">Ami</SelectItem>
                          <SelectItem value="amie">Amie</SelectItem>
                          <SelectItem value="membre_famille">Membre de la famille</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Informations de la personne à parrainer */}
                    <div>
                      <Label htmlFor="invitedName" className="text-slate-700 font-semibold">
                        Nom de la personne à parrainer *
                      </Label>
                      <Input
                        id="invitedName"
                        value={sponsorshipData.invitedName}
                        onChange={(e) => handleSponsorshipInputChange('invitedName', e.target.value)}
                        className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500"
                        placeholder="Prénom et nom de votre ami(e)"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invitedEmail" className="text-slate-700 font-semibold">
                          Email de la personne
                        </Label>
                        <Input
                          id="invitedEmail"
                          type="email"
                          value={sponsorshipData.invitedEmail}
                          onChange={(e) => handleSponsorshipInputChange('invitedEmail', e.target.value)}
                          className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500"
                          placeholder="email@exemple.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invitedPhone" className="text-slate-700 font-semibold">
                          Téléphone de la personne
                        </Label>
                        <Input
                          id="invitedPhone"
                          type="tel"
                          value={sponsorshipData.invitedPhone}
                          onChange={(e) => handleSponsorshipInputChange('invitedPhone', e.target.value)}
                          className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500"
                          placeholder="+221 77 123 45 67"
                        />
                      </div>
                    </div>

                    {/* Date d'anniversaire de la personne */}
                    <div>
                      <Label htmlFor="invitedBirthday" className="text-slate-700 font-semibold">
                        Date d'anniversaire de la personne *
                      </Label>
                      <Input
                        id="invitedBirthday"
                        type="date"
                        value={sponsorshipData.invitedBirthday}
                        onChange={(e) => handleSponsorshipInputChange('invitedBirthday', e.target.value)}
                        className="bg-white border-slate-300 text-slate-800 focus:border-purple-500 focus:ring-purple-500"
                        required
                      />
                      {sponsorshipError && (
                        <Alert className="mt-2 border-red-300 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 font-medium">
                            {sponsorshipError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Message d'invitation personnalisé */}
                    <div>
                      <Label htmlFor="invitationMessage" className="text-slate-700 font-semibold">
                        Message d'invitation personnalisé
                      </Label>
                      <textarea
                        id="invitationMessage"
                        value={sponsorshipData.invitationMessage}
                        onChange={(e) => handleSponsorshipInputChange('invitationMessage', e.target.value)}
                        className="w-full h-24 bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 rounded-md p-3 resize-none focus:border-purple-500 focus:ring-purple-500"
                        placeholder="Votre message d'invitation sera généré automatiquement..."
                      />
                    </div>

                    {/* Conditions de parrainage */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div className="text-sm text-purple-800">
                          <p className="font-semibold mb-1">Conditions de parrainage :</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>L'anniversaire de la personne doit être dans 10 à 30 jours</li>
                            <li>Vous pouvez parrainer autant de personnes que vous voulez</li>
                            <li>Mais chaque personne ne peut avoir qu'un seul parrain</li>
                            <li>Vous devez fournir au moins un email ou un téléphone</li>
                            <li>La personne doit accepter d'être parrainée</li>
                            <li>✅ <strong>Filles ET garçons</strong> peuvent être parrainés</li>
                            <li>🚫 <strong>Vous ne pouvez PAS créer directement leur cagnotte</strong></li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Méthodes d'envoi */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="submit"
                        disabled={isSendingInvitation || !!sponsorshipError || !sponsorshipData.invitedName || !sponsorshipData.invitedBirthday || (!sponsorshipData.invitedEmail && !sponsorshipData.invitedPhone) || !sponsorshipData.relation}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-lg shadow-lg"
                        size="lg"
                      >
                        {isSendingInvitation ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Mail className="h-5 w-5 mr-2" />
                            Envoyer par Email
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        onClick={() => {
                          if (!sponsorshipData.invitedPhone) {
                            toast.error('Veuillez saisir le numéro de téléphone');
                            return;
                          }
                          
                          const smsText = encodeURIComponent(sponsorshipData.invitationMessage || `Salut ${sponsorshipData.invitedName} ! Tu es invité(e) à créer ta cagnotte d'anniversaire sur WOLO SENEGAL !`);
                          window.open(`sms:${sponsorshipData.invitedPhone}?body=${smsText}`, '_blank');
                          toast.success('Application SMS ouverte avec le message d\'invitation !');
                        }}
                        disabled={!sponsorshipData.invitedPhone || !!sponsorshipError}
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white font-bold py-4 text-lg shadow-lg"
                        size="lg"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Envoyer par SMS
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Section informative sur les avantages - LOGIQUE CORRIGÉE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">
                Logique WOLO corrigée
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Gift className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-slate-800 font-semibold mb-2">Votre propre cagnotte</h3>
                  <p className="text-slate-600 text-sm">
                    Créez et gérez votre cagnotte d'anniversaire personnelle
                  </p>
                </div>

                <div className="text-center">
                  <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-slate-800 font-semibold mb-2">Mineur de votre famille</h3>
                  <p className="text-slate-600 text-sm">
                    Créez et gérez une cagnotte pour un mineur de votre famille uniquement
                  </p>
                </div>

                <div className="text-center">
                  <div className="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Star className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-slate-800 font-semibold mb-2">Parrainage viral</h3>
                  <p className="text-slate-600 text-sm">
                    Pour toute autre personne, utilisez le système de parrainage et gagnez des points
                  </p>
                </div>
              </div>

              {/* NOUVEAU : Section WhatsApp */}
              <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-5 w-5 text-green-600" />
                  <h4 className="text-slate-800 font-semibold">Invitation via contacts WhatsApp</h4>
                </div>
                <div className="text-slate-700 text-sm space-y-2">
                  <p>📱 <strong>Accès aux contacts :</strong> Importez votre liste de contacts WhatsApp</p>
                  <p>✅ <strong>Sélection multiple :</strong> Invitez plusieurs amis en même temps</p>
                  <p>🚀 <strong>Envoi automatique :</strong> Messages WhatsApp pré-remplis avec vos invitations</p>
                  <p>⭐ <strong>Points garantis :</strong> 10 points par acceptation + bonus selon leur succès</p>
                  <p>🔒 <strong>Confidentialité :</strong> Vos contacts restent privés et sécurisés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center text-slate-600"
        >
          <p className="text-sm font-semibold">
            © 2025 WOLO SENEGAL® - From Connect Africa® —
            <br />
            Les dons sont collectés via Wave Business. Des frais de service s'appliquent.
            <br />
            Important: la cagnotte est exclusivement destinée aux partenaires. Aucun argent ne sera remis aux bénéficiaires de la cagnotte.
            <br />
            📱 <strong>NOUVEAU :</strong> Invitation de parrainage via vos contacts WhatsApp pour un effet viral maximal !
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
