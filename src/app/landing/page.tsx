
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Gift, Users, QrCode, Smartphone, Film, Heart, Share2, MessageCircle, Video, Camera, Calendar, AlertCircle, Star, Shield, Contact, Phone } from 'lucide-react';
import { WaveLogo } from '@/components/ui/wave-logo';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface TimeLeft {
  jours: number;
  heures: number;
  minutes: number;
  secondes: number;
}

export default function PageInviteVisiteur() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    jours: 6,
    heures: 23,
    minutes: 59,
    secondes: 58
  });

  const [showCreatePot, setShowCreatePot] = useState(false);
  const [showSponsorDialog, setShowSponsorDialog] = useState(false);
  const [birthdayDate, setBirthdayDate] = useState('');
  const [birthdayError, setBirthdayError] = useState('');


  // État pour le parrainage
  const [sponsorData, setSponsorData] = useState({
    relation: '', // ami, amie, membre_famille
    personName: '',
    personEmail: '',
    personPhone: '',
    personBirthday: '',
    invitationMessage: ''
  });
  const [sponsorError, setSponsorError] = useState('');

  // NOUVEAU : État pour l'invitation via contacts WhatsApp
  const [whatsappContacts, setWhatsappContacts] = useState<any[]>([]);
  const [showWhatsappContacts, setShowWhatsappContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [hasWhatsappPermission, setHasWhatsappPermission] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);

  // Données de démonstration pour Awa
  const birthdayGirl = {
    name: 'Awa',
    fullName: 'Awa Diallo',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    targetDate: '2024-12-25T00:00:00Z'
  };

  const potData = {
    currentAmount: 24000,
    targetAmount: 50000,
    participants: 23,
    progressPercentage: 48
  };

  // Compte à rebours en temps réel
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secondes > 0) {
          return { ...prev, secondes: prev.secondes - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, secondes: 59 };
        } else if (prev.heures > 0) {
          return { ...prev, heures: prev.heures - 1, minutes: 59, secondes: 59 };
        } else if (prev.jours > 0) {
          return { ...prev, jours: prev.jours - 1, heures: 23, minutes: 59, secondes: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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


  const validateSponsorBirthdayDate = (date: string) => {
    if (!date) {
      setSponsorError('Veuillez sélectionner la date d\'anniversaire de la personne');
      return false;
    }

    const today = new Date();
    const birthday = new Date(date);
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 10) {
      setSponsorError('L\'anniversaire doit être dans au moins 10 jours pour être parrainé');
      return false;
    }

    if (diffDays > 30) {
      setSponsorError('L\'anniversaire doit être dans moins de 30 jours pour être parrainé');
      return false;
    }

    setSponsorError('');
    return true;
  };

  const handleCreatePot = () => {
    if (validateBirthdayDate(birthdayDate)) {
      toast.success('Redirection vers la création de votre cagnotte...');
      window.open('/create-cagnotte', '_blank');
    }
  };


  const handleSponsorPerson = () => {
    if (!sponsorData.relation) {
      setSponsorError('Veuillez sélectionner votre relation avec la personne');
      return;
    }
    if (!sponsorData.personName) {
      setSponsorError('Veuillez saisir le nom de la personne');
      return;
    }
    if (!sponsorData.personEmail && !sponsorData.personPhone) {
      setSponsorError('Veuillez fournir au moins un email ou un téléphone');
      return;
    }
    if (!validateSponsorBirthdayDate(sponsorData.personBirthday)) {
      return;
    }

    toast.success(`Invitation de parrainage envoyée à ${sponsorData.personName} !`);
    toast.info(`Relation: ${sponsorData.relation} • Vous recevrez 10 points s'il/elle accepte`);
    
    // Rediriger vers la page de parrainage
    const params = new URLSearchParams({
      sponsor: 'true',
      relation: sponsorData.relation,
      person_name: sponsorData.personName,
      person_email: sponsorData.personEmail,
      person_phone: sponsorData.personPhone,
      person_birthday: sponsorData.personBirthday
    });
    
    window.open(`/create-cagnotte?${params.toString()}`, '_blank');
    setShowSponsorDialog(false);
  };

  const handleConnectFacebook = () => {
    toast.success('Connexion réussie !');
    window.open('/owner', '_blank');
  };

  const handleParticipate = () => {
    const waveUrl = `https://wave.com/pay?amount=5000&recipient=+221771234567&reference=awa-birthday`;
    window.open(waveUrl, '_blank');
    toast.success('Redirection vers Wave pour participer');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-yellow-400 via-orange-400 to-red-500 relative overflow-hidden">
      {/* Éléments décoratifs animés */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-60"
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
            {['🎉', '🎂', '🎁', '🎈', '🎊', '🍰', '🎵', '⭐', '🎭', '🎪', '🎨', '🎯', '🌟', '✨', '🎀', '🎗️'][Math.floor(Math.random() * 16)]}
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Section principale avec profil à gauche */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Profil de la fille d'anniversaire - À GAUCHE */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="bg-white/40 backdrop-blur-xl border-white/60 shadow-2xl sticky top-8">
              <CardContent className="p-6 text-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Avatar className="h-40 w-40 mx-auto mb-4 border-4 border-white/80 shadow-2xl">
                    <AvatarImage 
                      src={birthdayGirl.profileImage} 
                      alt={birthdayGirl.fullName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-orange-500 text-white text-3xl font-bold">
                      {birthdayGirl.name}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-lg">
                  {birthdayGirl.fullName}
                </h2>
                <p className="text-gray-800 text-sm mb-4 drop-shadow font-semibold">
                  🎂 Anniversaire le 25 décembre
                </p>
                <div className="bg-white/30 rounded-lg p-3 mb-4 backdrop-blur-sm border border-white/50">
                  <p className="text-gray-900 text-sm drop-shadow font-medium">
                    "Aide-Awa à remplir sa cagnotte WOLO SENEGAL !"
                  </p>
                </div>
                
                {/* Statistiques dans le profil */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-800 drop-shadow font-semibold">Participants</span>
                    <span className="text-gray-900 font-bold text-lg drop-shadow">{potData.participants}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-800 drop-shadow font-semibold">Progression</span>
                    <span className="text-gray-900 font-bold text-lg drop-shadow">{potData.progressPercentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contenu principal - À DROITE */}
          <div className="lg:col-span-9 space-y-8">
            {/* Titre principal */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 drop-shadow-2xl">
                J-{timeLeft.jours} avant l'anniversaire de {birthdayGirl.name}
              </h1>
              <p className="text-xl text-gray-800 mb-2 drop-shadow-lg font-semibold">
                Aide-{birthdayGirl.name} à remplir sa cagnotte WOLO SENEGAL !
              </p>
              <p className="text-lg text-gray-800 flex items-center justify-center gap-2 drop-shadow font-medium">
                🎬 Cadeau Cinéma : séance grand écran + popcorn
              </p>
            </motion.div>

            {/* Compte à rebours avec sablier FORT */}
            <motion.div
              className="flex justify-center gap-6 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {[
                { value: timeLeft.jours, label: 'Jours' },
                { value: timeLeft.heures, label: 'Heures' },
                { value: timeLeft.minutes, label: 'Minutes' },
                { value: timeLeft.secondes, label: 'Secondes' }
              ].map((unit, index) => (
                <motion.div
                  key={unit.label}
                  className="flex flex-col items-center"
                  whileHover={{ scale: 1.05 }}
                  animate={unit.label === 'Secondes' ? { 
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={unit.label === 'Secondes' ? {
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse"
                  } : {}}
                >
                  <div className="bg-white/50 backdrop-blur-lg rounded-xl p-6 min-w-[100px] text-center border-2 border-white/70 shadow-2xl">
                    <div className="text-4xl font-bold text-gray-900 drop-shadow-lg">
                      {unit.value.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="text-sm text-gray-900 mt-3 font-bold drop-shadow">
                    {unit.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Progression avec SABLIER ANIMÉ FORT */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card className="bg-white/40 backdrop-blur-xl border-white/60 shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-bold text-gray-900 drop-shadow-lg">
                      La cagnotte grandit 🎁
                    </span>
                    <span className="text-3xl font-bold text-gray-900 drop-shadow-lg">
                      {potData.progressPercentage}%
                    </span>
                  </div>
                  
                  <div className="relative mb-6">
                    <Progress 
                      value={potData.progressPercentage} 
                      className="h-6 bg-white/40 border-2 border-white/60 shadow-lg"
                    />
                    
                    {/* SABLIER ANIMÉ FORT */}
                    <motion.div
                      className="absolute -top-4 h-12 w-12 text-6xl filter drop-shadow-2xl"
                      style={{ left: `${Math.min(potData.progressPercentage, 90)}%` }}
                      animate={{ 
                        rotate: [0, 180, 360],
                        scale: [1, 1.3, 1],
                        y: [0, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      ⏳
                    </motion.div>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <div className="text-gray-900 drop-shadow font-medium">
                      <span className="text-base">Plus il y a de participations, plus le cadeau cinéma sera généreux.</span>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center justify-center gap-6">
                    <motion.div 
                      className="flex items-center gap-3 bg-white/50 backdrop-blur-lg rounded-xl px-6 py-4 border-2 border-white/70 shadow-xl"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Users className="h-6 w-6 text-gray-900 drop-shadow" />
                      <div className="text-gray-900">
                        <motion.span 
                          className="font-bold text-2xl drop-shadow-lg"
                          key={potData.participants}
                          initial={{ scale: 1.3, color: "#fbbf24" }}
                          animate={{ scale: 1, color: "#111827" }}
                          transition={{ duration: 0.5 }}
                        >
                          {potData.participants}
                        </motion.span>
                        <span className="text-base ml-2 drop-shadow font-semibold">Participants</span>
                      </div>
                    </motion.div>

                    <div className="text-center">
                      <div className="text-base text-gray-800 drop-shadow font-semibold">Progression</div>
                      <div className="text-3xl font-bold text-gray-900 drop-shadow-lg">
                        {potData.progressPercentage}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Boutons d'action principaux - LAYOUT CORRIGÉ EN VERTICAL */}
            <motion.div
              className="flex flex-col gap-6 justify-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={handleParticipate}
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-16 py-8 text-3xl rounded-full shadow-2xl border-4 border-green-300/70 drop-shadow-2xl flex items-center gap-3"
                  >
                    <WaveLogo size={48} className="drop-shadow-lg" />
                    Participer maintenant
                  </Button>
                </motion.div>

                {/* BOUTONS CORRIGÉS - LAYOUT VERTICAL POUR ÉVITER LA LARGEUR EXCESSIVE */}
                <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                  <Button
                    onClick={() => setShowCreatePot(!showCreatePot)}
                    variant="outline"
                    size="lg"
                    className="border-white/60 text-gray-900 hover:bg-white/30 bg-white/60 px-8 py-4 text-xl rounded-full shadow-xl backdrop-blur-sm font-semibold w-full"
                  >
                    <Gift className="h-6 w-6 mr-2" />
                    Créez votre propre cagnotte
                  </Button>


                  {/* NOUVEAU BOUTON - Parrainer un ami/amie ou membre de la famille AVEC WHATSAPP */}
                  <Dialog open={showSponsorDialog} onOpenChange={setShowSponsorDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-purple-400/60 text-purple-900 hover:bg-purple-100/30 bg-purple-50/60 px-8 py-4 text-xl rounded-full shadow-xl backdrop-blur-sm font-semibold w-full"
                      >
                        <Star className="h-6 w-6 mr-2" />
                        Parrainez un ami/amie ou membre de la famille
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Parrainer quelqu'un pour son anniversaire</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* NOUVEAU : Section WhatsApp en haut */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Contact className="h-5 w-5 text-green-600" />
                            <h4 className="text-slate-800 font-semibold">Invitation rapide via vos contacts WhatsApp</h4>
                          </div>
                          <p className="text-green-700 text-sm mb-4">
                            Accédez à votre liste de contacts WhatsApp et invitez plusieurs amis en même temps !
                          </p>
                          
                          <div className="flex gap-3">
                            <Button
                              onClick={requestWhatsappContactsAccess}
                              disabled={isLoadingContacts}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              {isLoadingContacts ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Chargement...
                                </>
                              ) : (
                                <>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Accéder à mes contacts
                                </>
                              )}
                            </Button>
                            
                            {hasWhatsappPermission && (
                              <Button
                                onClick={() => setShowWhatsappContacts(true)}
                                variant="outline"
                                size="sm"
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Voir contacts ({whatsappContacts.length})
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

                        {/* Relation avec la personne */}
                        <div className="space-y-2">
                          <Label htmlFor="relation" className="text-sm font-medium">
                            Relation avec la personne ? *
                          </Label>
                          <Select
                            value={sponsorData.relation}
                            onValueChange={(value) => setSponsorData(prev => ({ ...prev, relation: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez votre relation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ami">Ami</SelectItem>
                              <SelectItem value="amie">Amie</SelectItem>
                              <SelectItem value="membre_famille">Membre de la famille</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Nom de la personne */}
                        <div className="space-y-2">
                          <Label htmlFor="personName" className="text-sm font-medium">
                            Nom de la personne *
                          </Label>
                          <Input
                            id="personName"
                            value={sponsorData.personName}
                            onChange={(e) => {
                              setSponsorData(prev => ({ ...prev, personName: e.target.value }));
                              // Auto-générer le message d'invitation
                              if (e.target.value) {
                                setSponsorData(prev => ({
                                  ...prev,
                                  invitationMessage: `Salut ${e.target.value} ! 🎉 J'ai découvert WOLO SENEGAL, une super plateforme pour organiser des cagnottes d'anniversaire avec des cadeaux cinéma ! Ton anniversaire approche et je pense que ça pourrait t'intéresser. Tu veux que WOLO gère ta cagnotte d'anniversaire ? C'est gratuit et très facile ! 🎂🎁`
                                }));
                              }
                            }}
                            placeholder="Prénom et nom de la personne"
                          />
                        </div>

                        {/* Contact */}
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="personEmail" className="text-sm font-medium">
                              Email
                            </Label>
                            <Input
                              id="personEmail"
                              type="email"
                              value={sponsorData.personEmail}
                              onChange={(e) => setSponsorData(prev => ({ ...prev, personEmail: e.target.value }))}
                              placeholder="email@exemple.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="personPhone" className="text-sm font-medium">
                              Téléphone
                            </Label>
                            <Input
                              id="personPhone"
                              type="tel"
                              value={sponsorData.personPhone}
                              onChange={(e) => setSponsorData(prev => ({ ...prev, personPhone: e.target.value }))}
                              placeholder="+221 77 123 45 67"
                            />
                          </div>
                        </div>

                        {/* Date d'anniversaire */}
                        <div className="space-y-2">
                          <Label htmlFor="personBirthday" className="text-sm font-medium">
                            Date d'anniversaire *
                          </Label>
                          <Input
                            id="personBirthday"
                            type="date"
                            value={sponsorData.personBirthday}
                            onChange={(e) => {
                              setSponsorData(prev => ({ ...prev, personBirthday: e.target.value }));
                              validateSponsorBirthdayDate(e.target.value);
                            }}
                          />
                          {sponsorError && (
                            <Alert className="border-red-300 bg-red-50">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-700 font-medium">
                                {sponsorError}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        {/* Système de points expliqué */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-800">Système de points WOLO</span>
                          </div>
                          <div className="text-purple-700 text-sm space-y-1">
                            <p>🎯 <strong>10 points</strong> dès que votre filleul accepte</p>
                            <p>📈 <strong>Points bonus</strong> selon la croissance de sa cagnotte :</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                              <li>+5 points si sa cagnotte atteint 25 000 FCFA</li>
                              <li>+10 points si sa cagnotte atteint 50 000 FCFA</li>
                              <li>+20 points si sa cagnotte atteint 100 000 FCFA</li>
                            </ul>
                          </div>
                        </div>

                        <Button
                          onClick={handleSponsorPerson}
                          disabled={
                            !sponsorData.relation ||
                            !sponsorData.personName || 
                            (!sponsorData.personEmail && !sponsorData.personPhone) ||
                            !sponsorData.personBirthday || 
                            !!sponsorError
                          }
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
                        >
                          <Star className="h-5 w-5 mr-2" />
                          Envoyer l'invitation de parrainage
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Formulaire de création de cagnotte personnelle */}
                {showCreatePot && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-white/40 backdrop-blur-xl border-white/60 shadow-2xl">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                          Créer votre cagnotte d'anniversaire
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="birthday" className="text-gray-900 font-semibold">
                              Date de votre anniversaire
                            </Label>
                            <Input
                              id="birthday"
                              type="date"
                              value={birthdayDate}
                              onChange={(e) => {
                                setBirthdayDate(e.target.value);
                                validateBirthdayDate(e.target.value);
                              }}
                              className="bg-white/50 border-white/60 text-gray-900"
                            />
                            {birthdayError && (
                              <Alert className="mt-2 border-red-400 bg-red-50/80">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-red-800 font-medium">
                                  {birthdayError}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>

                          <div className="bg-blue-50/80 p-4 rounded-lg border border-blue-200">
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

                          <Button
                            onClick={handleCreatePot}
                            disabled={!birthdayDate || !!birthdayError}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3"
                          >
                            Créer ma cagnotte
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Section fonctionnalités - TEXTE MODIFIÉ */}
        <motion.section 
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12 drop-shadow-2xl">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Gift,
                title: 'Créez votre propre cagnotte',
                description: 'Connectez-vous via votre compte et créez votre cagnotte d\'anniversaire'
              },
              {
                icon: Users,
                title: 'Invitez vos amis',
                description: 'Partagez automatiquement sur tous vos réseaux sociaux et recevez des donations'
              },
              {
                icon: Film,
                title: 'Profitez du cinéma',
                description: 'Recevez vos QR codes et profitez de votre séance cinéma avec vos invités'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="bg-white/35 backdrop-blur-lg border-white/50 h-full hover:bg-white/45 transition-all duration-300 shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <feature.icon className="h-16 w-16 text-gray-900 mx-auto mb-6 drop-shadow-lg" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4 drop-shadow">
                      {feature.title}
                    </h3>
                    <p className="text-gray-800 drop-shadow font-medium">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Final */}
        <motion.section 
          className="text-center mt-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <Card className="bg-gradient-to-r from-yellow-400/50 via-orange-400/50 to-red-400/50 backdrop-blur-xl border-yellow-400/70 shadow-2xl">
            <CardContent className="p-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-6 drop-shadow-2xl">
                Prêt à célébrer votre anniversaire ?
              </h2>
              <p className="text-gray-800 text-xl mb-8 drop-shadow-lg font-semibold">
                Rejoignez WOLO SENEGAL et transformez votre anniversaire en expérience cinéma mémorable
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    onClick={handleConnectFacebook}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-12 py-6 text-xl rounded-full"
                  >
                    🚀 Commencer maintenant
                  </Button>
                </motion.div>
                <a href="/demo" target="_blank" rel="noopener noreferrer">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-gray-900 hover:bg-white/20 bg-white/50 px-12 py-6 text-xl rounded-full shadow-2xl backdrop-blur-sm font-semibold"
                    >
                      Voir la démo
                    </Button>
                  </motion.div>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer avec nouveau copyright */}
        <motion.footer 
          className="mt-20 text-center text-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 0.8 }}
        >
          <p className="drop-shadow font-semibold">© 2025 WOLO SENEGAL® - From Connect Africa® —</p>
          <p className="text-sm mt-3 drop-shadow font-medium">
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
