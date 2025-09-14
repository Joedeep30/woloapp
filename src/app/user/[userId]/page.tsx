
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserProfileCard } from '@/components/wolo/UserProfileCard';
import { CountdownTimer } from '@/components/wolo/CountdownTimer';
import { ProgressBar } from '@/components/wolo/ProgressBar';
import { ParticipantCounter } from '@/components/wolo/ParticipantCounter';
import { 
  Gift, 
  CreditCard, 
  Users, 
  QrCode, 
  Video, 
  MessageCircle, 
  Camera, 
  Share2, 
  Facebook, 
  Settings, 
  TrendingUp, 
  Play,
  Eye,
  EyeOff,
  Crown,
  Heart,
  CheckCircle,
  Send,
  Download,
  UserPlus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { User, Pot, Formula, Donation } from '@/types/wolo';
import formulasData from '@/data/formulas.json';
import { WaveLogo } from '@/components/ui/wave-logo';

interface UserPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default function UserPage({ params }: UserPageProps) {
  const [userId, setUserId] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [pot, setPot] = useState<Pot | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideoDialog, setShowVideoDialog] = useState(false);

  // Résoudre les paramètres asynchrones
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.userId);
    };
    resolveParams();
  }, [params]);

  // Données de démonstration basées sur l'userId
  useEffect(() => {
    if (!userId) return;

    setTimeout(() => {
      const mockUser: User = {
        id: userId,
        email: `${userId}@example.com`,
        first_name: userId === 'awa' ? 'Awa' : 'Utilisateur',
        last_name: userId === 'awa' ? 'Diallo' : 'WOLO',
        profile_picture_url: userId === 'awa' 
          ? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        phone: '+221 77 123 45 67',
        birthday: '1995-03-15',
        is_facebook_user: true,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const mockPot: Pot = {
        id: '1',
        user_id: userId,
        title: `Anniversaire de ${mockUser.first_name}`,
        description: `Aide-${mockUser.first_name} à remplir sa cagnotte WOLO SENEGAL !`,
        target_amount: 50000,
        current_amount: 24000,
        birthday_date: '2024-12-25',
        status: 'active',
        is_public: true,
        allow_anonymous_donations: true,
        show_donor_names: true,
        countdown_end: '2024-12-25T00:00:00Z',
        create_time: new Date().toISOString(),
        modify_time: new Date().toISOString()
      };

      const mockDonations: Donation[] = [
        {
          id: '1',
          pot_id: '1',
          donor_name: 'Mamadou Sow',
          amount: 8000,
          is_anonymous: false,
          show_name_consent: true,
          show_amount_consent: false,
          message: `Joyeux anniversaire ${mockUser.first_name} ! 🎉`,
          payment_method: 'wave',
          status: 'completed',
          create_time: new Date().toISOString()
        },
        {
          id: '2',
          pot_id: '1',
          donor_name: 'Fatou Ba',
          amount: 5000,
          is_anonymous: false,
          show_name_consent: true,
          show_amount_consent: false,
          payment_method: 'wave',
          status: 'completed',
          create_time: new Date().toISOString()
        },
        {
          id: '3',
          pot_id: '1',
          donor_name: 'Donateur Généreux',
          amount: 11000,
          is_anonymous: false,
          show_name_consent: false,
          show_amount_consent: true,
          message: 'Profite bien de ton anniversaire !',
          payment_method: 'wave',
          status: 'completed',
          create_time: new Date().toISOString()
        }
      ];

      setUser(mockUser);
      setPot(mockPot);
      setDonations(mockDonations);
      setIsLoading(false);
    }, 1000);
  }, [userId]);

  const handleDonate = () => {
    const waveUrl = `https://wave.com/pay?amount=5000&recipient=${user?.phone}&reference=${pot?.id}`;
    window.open(waveUrl, '_blank');
    toast.success('Redirection vers Wave pour le paiement');
  };

  // Partage vidéo sur les murs (pour le propriétaire) - FONCTIONNEL AVEC INSTAGRAM
  const handleVideoWallShare = () => {
    const videoUrl = `${window.location.origin}/video/birthday-invitation-${userId}`;
    const shareText = `Regardez ma vidéo d'invitation pour mon anniversaire ! ${videoUrl}`;
    
    const platforms = [
      {
        name: 'Facebook',
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
        delay: 0
      },
      {
        name: 'WhatsApp',
        url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        delay: 500
      },
      {
        name: 'Twitter',
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
        delay: 1000
      },
      {
        name: 'Instagram',
        url: `https://www.instagram.com/`,
        delay: 1500,
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
    
    toast.success('Vidéo d\'invitation partagée sur tous vos réseaux sociaux (Facebook, WhatsApp, Twitter, Instagram) !');
  };

  // Invitation directe aux contacts - FONCTIONNEL AVEC INSTAGRAM
  const handleDirectInvite = (platform: string) => {
    const inviteText = `Salut ! Tu es invité(e) à mon anniversaire ! Participe à ma cagnotte WOLO : ${window.location.origin}/user/${userId}`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank');
        toast.success('WhatsApp ouvert avec le message d\'invitation !');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/user/${userId}`)}`, '_blank');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Chargement de votre page...</p>
        </div>
      </div>
    );
  }

  if (!user || !pot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center">
        <Card className="bg-white/20 backdrop-blur-sm border-white/30">
          <CardContent className="p-8 text-center">
            <p className="text-white text-lg font-semibold">Utilisateur non trouvé</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/user/${user.id}`;
  const participantCount = donations.filter(d => d.status === 'completed').length;
  const progressPercentage = pot.target_amount ? (pot.current_amount / pot.target_amount) * 100 : 0;

  // Trouver le plus gros don pour l'affichage public
  const biggestDonation = donations
    .filter(d => d.status === 'completed')
    .sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Éléments décoratifs animés */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xl opacity-30"
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
        {/* Header avec profil utilisateur Facebook */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-4 border-blue-400/60">
                    <AvatarImage src={user.profile_picture_url} alt={user.first_name} />
                    <AvatarFallback className="bg-orange-500 text-white text-xl">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
                    <Facebook className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">
                      {user.first_name} {user.last_name}
                    </h1>
                    <Badge className="bg-blue-500/30 text-blue-200 border border-blue-400/50">
                      <Facebook className="h-3 w-3 mr-1" />
                      Connecté Facebook
                    </Badge>
                  </div>
                  
                  <p className="text-white/70 mb-1">
                    🎂 {pot.title}
                  </p>
                  <p className="text-white/60 text-sm">
                    📱 {user.phone} • ✉️ {user.email}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">
                      {formatCurrency(pot.current_amount)}
                    </div>
                    <div className="text-white/70">collectés</div>
                  </div>
                  
                  {/* BOUTON ADMIN - ACCÈS AU DASHBOARD COMPLET */}
                  <Button
                    onClick={() => {
                      toast.success('Redirection vers votre dashboard de gestion...');
                      window.open('/owner', '_blank');
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-6 py-3 rounded-full shadow-xl"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Dashboard Propriétaire
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Titre et description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl">
            {pot.title}
          </h1>
          <p className="text-xl text-white/95 mb-2 drop-shadow-lg font-semibold">
            {pot.description}
          </p>
          <p className="text-lg text-white/90 drop-shadow font-medium">
            🎬 Cadeau Cinéma : séance grand écran + popcorn
          </p>
        </motion.div>

        {/* Compte à rebours */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-8"
        >
          <CountdownTimer 
            targetDate={pot.countdown_end || pot.birthday_date} 
            className="mb-4"
          />
        </motion.div>

        {/* Barre de progression et participants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-8 space-y-4"
        >
          <ProgressBar 
            current={pot.current_amount} 
            target={pot.target_amount}
          />
          <div className="flex justify-center">
            <ParticipantCounter count={participantCount} />
          </div>
        </motion.div>

        {/* Section de partage simplifiée - FOCUS SUR LE PARTAGE AVEC INSTAGRAM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mb-8 space-y-6"
        >
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
                  ✅ Tous les réseaux sociaux sont pré-sélectionnés par défaut (Facebook, WhatsApp, Twitter, Instagram)
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
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram (Story)
                </Button>
              </motion.div>

              <p className="text-sm text-white/90 text-center font-medium">
                Sélectionnez individuellement ou envoyez à TOUS vos contacts
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Affichage du plus gros don uniquement */}
        {biggestDonation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-yellow-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  Plus gros donateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-yellow-400/50">
                    <AvatarFallback className="bg-yellow-500 text-white">
                      {biggestDonation.show_name_consent && biggestDonation.donor_name ? 
                        biggestDonation.donor_name.slice(0, 2).toUpperCase() : 
                        '❤️'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-lg">
                      {biggestDonation.show_name_consent && biggestDonation.donor_name
                        ? biggestDonation.donor_name
                        : 'Donateur anonyme'
                      }
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">
                      {formatCurrency(biggestDonation.amount)}
                    </div>
                  </div>
                </div>
                {biggestDonation.message && (
                  <div className="mt-3 p-3 bg-white/10 rounded-lg">
                    <p className="text-sm text-white/80 italic">
                      "{biggestDonation.message}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Boutons d'action principaux */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-col gap-6 justify-center mb-8"
        >
          <div className="space-y-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex justify-center"
            >
              <Button
                onClick={handleDonate}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-16 py-8 text-3xl rounded-full shadow-2xl border-4 border-green-300/70 drop-shadow-2xl flex items-center justify-center gap-4"
              >
                <WaveLogo size={48} className="drop-shadow-lg" />
                Participer maintenant
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer avec nouveau copyright */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-16 text-center text-white/80"
        >
          <p className="text-sm font-semibold">
            © 2025 WOLO SENEGAL® - From Connect Africa® —
            <br />
            Les dons sont collectés via Wave Business. Des frais de service s'appliquent.
            <br />
            Important: la cagnotte est exclusivement destinée aux partenaires. Aucun argent ne sera remis aux bénéficiaires de la cagnotte.
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
