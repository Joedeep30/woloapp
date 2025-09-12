
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Gift, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  AlertCircle,
  Star,
  Users,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { Separator } from '@/components/ui/separator';

interface SponsorshipAcceptPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function SponsorshipAcceptPage({ params }: SponsorshipAcceptPageProps) {
  const [token, setToken] = useState<string>('');
  const [sponsorshipData, setSponsorshipData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [hasDeclined, setHasDeclined] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Résoudre les paramètres asynchrones
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setToken(resolvedParams.token);
    };
    resolveParams();
  }, [params]);

  // Charger les données de parrainage
  useEffect(() => {
    if (!token) return;

    // Simuler le chargement des données de parrainage
    setTimeout(() => {
      // Données de démonstration
      const mockSponsorshipData = {
        id: '1',
        sponsor: {
          name: 'Mamadou Sow',
          profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        invited: {
          name: 'Fatou Ba',
          email: 'fatou@example.com',
          phone: '+221771234569',
          birthday: '2024-12-30'
        },
        message: 'Salut Fatou ! 🎉 J\'ai découvert WOLO SENEGAL, une super plateforme pour organiser des cagnottes d\'anniversaire avec des cadeaux cinéma ! Ton anniversaire approche et je pense que ça pourrait t\'intéresser. Tu veux que WOLO gère ta cagnotte d\'anniversaire ? C\'est gratuit et très facile ! 🎂🎁',
        status: 'pending',
        expiresAt: '2024-12-25T23:59:59Z',
        pointsForSponsor: 10,
        bonusPointsAvailable: [
          { threshold: 25000, points: 5 },
          { threshold: 50000, points: 10 },
          { threshold: 100000, points: 20 }
        ]
      };

      setSponsorshipData(mockSponsorshipData);
      
      // Pré-remplir le formulaire avec les données connues
      setUserFormData(prev => ({
        ...prev,
        firstName: mockSponsorshipData.invited.name.split(' ')[0] || '',
        lastName: mockSponsorshipData.invited.name.split(' ').slice(1).join(' ') || '',
        email: mockSponsorshipData.invited.email || '',
        phone: mockSponsorshipData.invited.phone || ''
      }));
      
      setIsLoading(false);
    }, 1500);
  }, [token]);

  const handleAccept = () => {
    setHasAccepted(true);
    toast.success('Merci d\'avoir accepté ! Veuillez maintenant créer votre compte.');
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    
    try {
      // Simuler le refus
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasDeclined(true);
      toast.info('Invitation déclinée. Merci de nous avoir fait savoir.');
      
      // Rediriger vers la page d'accueil après 3 secondes
      setTimeout(() => {
        window.location.href = '/landing';
      }, 3000);
      
    } catch (error) {
      toast.error('Erreur lors du traitement de votre réponse');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userFormData.password !== userFormData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (userFormData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simuler la création du compte et de la cagnotte
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Notifier le parrain et attribuer les points
      toast.success('Compte créé avec succès ! Votre cagnotte est maintenant active.');
      toast.success(`${sponsorshipData.sponsor.name} a reçu ${sponsorshipData.pointsForSponsor} points pour vous avoir parrainé !`);
      
      // Rediriger vers la nouvelle cagnotte
      const userId = userFormData.firstName.toLowerCase();
      window.location.href = `/user/${userId}?owner=true&sponsored=true`;
      
    } catch (error) {
      toast.error('Erreur lors de la création du compte');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`Connexion ${provider} en cours...`);
    
    // Simuler la connexion sociale et création automatique de la cagnotte
    setTimeout(() => {
      toast.success(`Connexion ${provider} réussie ! Votre cagnotte est créée automatiquement.`);
      toast.success(`${sponsorshipData?.sponsor?.name} a reçu ${sponsorshipData?.pointsForSponsor} points !`);
      
      const userId = sponsorshipData?.invited?.name?.split(' ')[0]?.toLowerCase() || 'user';
      window.location.href = `/user/${userId}?owner=true&sponsored=true`;
    }, 2000);
  };

  const calculateDaysUntilBirthday = (birthday: string) => {
    const today = new Date();
    const birthdayDate = new Date(birthday);
    const diffTime = birthdayDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Chargement de votre invitation...</p>
        </div>
      </div>
    );
  }

  if (!sponsorshipData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 flex items-center justify-center p-6">
        <Card className="bg-white/20 backdrop-blur-sm border-white/30 max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Invitation non trouvée</h2>
            <p className="text-white/80 mb-4">
              Cette invitation de parrainage n'existe pas ou a expiré.
            </p>
            <Button
              onClick={() => window.location.href = '/landing'}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasDeclined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-500 via-slate-500 to-gray-600 flex items-center justify-center p-6">
        <Card className="bg-white/20 backdrop-blur-sm border-white/30 max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Invitation déclinée</h2>
            <p className="text-white/80 mb-4">
              Merci de nous avoir fait savoir. Vous pouvez toujours créer votre cagnotte plus tard !
            </p>
            <p className="text-white/60 text-sm">
              Redirection automatique dans quelques secondes...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilBirthday = calculateDaysUntilBirthday(sponsorshipData.invited.birthday);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-30"
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {!hasAccepted ? (
            /* Page d'invitation initiale */
            <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-2xl">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-20 w-20 border-4 border-white/50">
                      <AvatarFallback className="bg-orange-500 text-white text-xl">
                        {sponsorshipData.sponsor.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-white text-2xl mb-2">
                    🎉 Vous êtes invité(e) par {sponsorshipData.sponsor.name} !
                  </CardTitle>
                  <p className="text-white/90">
                    Votre anniversaire approche dans {daysUntilBirthday} jours
                  </p>
                </motion.div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Message personnalisé du parrain */}
                <div className="p-4 bg-white/10 rounded-lg border border-white/30">
                  <h4 className="text-white font-semibold mb-2">Message de {sponsorshipData.sponsor.name} :</h4>
                  <p className="text-white/90 text-sm italic">
                    "{sponsorshipData.message}"
                  </p>
                </div>

                {/* Informations sur l'invitation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg">
                    <span className="text-blue-200">Votre nom :</span>
                    <span className="text-white font-semibold">{sponsorshipData.invited.name}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg">
                    <span className="text-green-200">Date d'anniversaire :</span>
                    <span className="text-white font-semibold">
                      {new Date(sponsorshipData.invited.birthday).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-500/20 rounded-lg">
                    <span className="text-purple-200">Temps restant :</span>
                    <Badge className="bg-purple-500/30 text-purple-200">
                      <Calendar className="h-3 w-3 mr-1" />
                      {daysUntilBirthday} jours
                    </Badge>
                  </div>
                </div>

                {/* Avantages WOLO */}
                <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-400/30">
                  <h4 className="text-yellow-200 font-semibold mb-3 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Qu'est-ce que WOLO SENEGAL vous offre ?
                  </h4>
                  <ul className="text-white/90 text-sm space-y-2">
                    <li>🎬 <strong>Cadeaux cinéma :</strong> Séances + popcorn + boissons</li>
                    <li>💳 <strong>Paiements sécurisés :</strong> Via Wave Business</li>
                    <li>📱 <strong>Partage facile :</strong> Sur tous vos réseaux sociaux</li>
                    <li>🎁 <strong>QR codes :</strong> Pour vos invités au cinéma</li>
                    <li>📊 <strong>Suivi en temps réel :</strong> De votre cagnotte</li>
                  </ul>
                </div>

                {/* Points pour le parrain */}
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-400/30">
                  <h4 className="text-purple-200 font-semibold mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Votre parrain gagnera des points :
                  </h4>
                  <div className="text-white/90 text-sm space-y-1">
                    <p>🎯 <strong>{sponsorshipData.pointsForSponsor} points</strong> dès que vous acceptez</p>
                    <p>📈 <strong>Points bonus</strong> selon votre succès :</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      {sponsorshipData.bonusPointsAvailable.map((bonus: any, index: number) => (
                        <li key={index}>
                          +{bonus.points} points si votre cagnotte atteint {bonus.threshold.toLocaleString()} FCFA
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Question principale */}
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-white">
                    Acceptez-vous que WOLO SENEGAL gère votre cagnotte d'anniversaire ?
                  </h3>
                  
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleAccept}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3"
                      size="lg"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Oui, j'accepte !
                    </Button>
                    
                    <Button
                      onClick={handleDecline}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-red-400/50 text-red-300 hover:bg-red-500/20 px-8 py-3"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Traitement...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 mr-2" />
                          Non merci
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Formulaire de création de compte après acceptation */
            <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-2xl">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <CardTitle className="text-white text-2xl mb-2">
                    Parfait ! Créons votre compte WOLO
                  </CardTitle>
                  <p className="text-white/90">
                    Confirmez vos informations et créez votre mot de passe
                  </p>
                </motion.div>
              </CardHeader>
              <CardContent>
                {/* Options d'authentification rapide */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-4 text-center">
                    Connexion rapide (recommandée)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <GoogleLoginButton />
                    
                    <Button
                      onClick={() => handleSocialLogin('Apple')}
                      variant="outline"
                      className="w-full border-white/40 text-white hover:bg-white/10 bg-white/20"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      Continuer avec Apple
                    </Button>
                  </div>

                  <div className="my-4 flex items-center">
                    <Separator className="flex-1 bg-white/30" />
                    <span className="mx-3 text-sm uppercase text-white/70 font-semibold">OU</span>
                    <Separator className="flex-1 bg-white/30" />
                  </div>
                </div>

                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-white font-semibold">
                        Prénom *
                      </Label>
                      <Input
                        id="firstName"
                        value={userFormData.firstName}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="bg-white/20 border-white/40 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-white font-semibold">
                        Nom *
                      </Label>
                      <Input
                        id="lastName"
                        value={userFormData.lastName}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="bg-white/20 border-white/40 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-white font-semibold">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-white/20 border-white/40 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-white font-semibold">
                        Téléphone *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={userFormData.phone}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-white/20 border-white/40 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password" className="text-white font-semibold">
                        Mot de passe *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-white/20 border-white/40 text-white placeholder:text-white/60"
                        placeholder="Au moins 6 caractères"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-white font-semibold">
                        Confirmer le mot de passe *
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={userFormData.confirmPassword}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-white/20 border-white/40 text-white placeholder:text-white/60"
                        placeholder="Répétez votre mot de passe"
                        required
                      />
                    </div>
                  </div>

                  {/* Récapitulatif */}
                  <div className="p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                    <h4 className="text-green-200 font-semibold mb-2 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Récapitulatif de votre cagnotte :
                    </h4>
                    <div className="text-white/90 text-sm space-y-1">
                      <p>🎂 <strong>Anniversaire :</strong> {new Date(sponsorshipData.invited.birthday).toLocaleDateString('fr-FR')}</p>
                      <p>⏰ <strong>Dans :</strong> {daysUntilBirthday} jours</p>
                      <p>👤 <strong>Parrainé par :</strong> {sponsorshipData.sponsor.name}</p>
                      <p>🎁 <strong>Titre :</strong> Anniversaire de {userFormData.firstName || sponsorshipData.invited.name}</p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 text-lg"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Création de votre cagnotte...
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5 mr-2" />
                        Créer ma cagnotte et récompenser mon parrain
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center text-white/80"
        >
          <p className="text-sm font-semibold">
            © 2025 WOLO SENEGAL® - From Connect Africa® —
            <br />
            Système de parrainage viral pour développer la communauté WOLO
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
