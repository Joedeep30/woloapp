
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  AlertCircle,
  Users,
  Baby,
  Shield,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface MinorTransferAcceptPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function MinorTransferAcceptPage({ params }: MinorTransferAcceptPageProps) {
  const [token, setToken] = useState<string>('');
  const [transferData, setTransferData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [hasDeclined, setHasDeclined] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Résoudre les paramètres asynchrones
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setToken(resolvedParams.token);
    };
    resolveParams();
  }, [params]);

  // Charger les données de transfert
  useEffect(() => {
    if (!token) return;

    // Simuler le chargement des données de transfert
    setTimeout(() => {
      // Données de démonstration
      const mockTransferData = {
        id: '1',
        from_user: {
          name: 'Fatou Diallo',
          email: 'fatou@example.com'
        },
        to_user: {
          name: 'Aminata Ba',
          email: 'aminata@example.com'
        },
        minor: {
          name: 'Petit Moussa',
          birthday: '2024-12-28',
          relationship_type: 'enfant'
        },
        transfer_reason: 'Je pars en voyage et ma sœur pourra mieux gérer la cagnotte de mon fils.',
        status: 'pending',
        expiresAt: '2024-12-25T23:59:59Z',
        pot_info: {
          current_amount: 15000,
          target_amount: 50000,
          participants: 8
        }
      };

      setTransferData(mockTransferData);
      setIsLoading(false);
    }, 1500);
  }, [token]);

  const handleAccept = async () => {
    setIsProcessing(true);
    
    try {
      // Simuler l'acceptation du transfert
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setHasAccepted(true);
      toast.success('Transfert accepté avec succès !');
      toast.info(`Vous gérez maintenant ${transferData.minor.name}`);
      
      // Rediriger vers le dashboard après 3 secondes
      setTimeout(() => {
        window.location.href = `/owner?minor_transferred=true`;
      }, 3000);
      
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation du transfert');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    
    try {
      // Simuler le refus
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasDeclined(true);
      toast.info('Transfert décliné. L\'ancien gestionnaire en sera informé.');
      
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

  const calculateDaysUntilBirthday = (birthday: string) => {
    const today = new Date();
    const birthdayDate = new Date(birthday);
    const diffTime = birthdayDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Chargement de la demande de transfert...</p>
        </div>
      </div>
    );
  }

  if (!transferData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 flex items-center justify-center p-6">
        <Card className="bg-white/20 backdrop-blur-sm border-white/30 max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Demande non trouvée</h2>
            <p className="text-white/80 mb-4">
              Cette demande de transfert n'existe pas ou a expiré.
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
            <h2 className="text-xl font-bold text-white mb-2">Transfert décliné</h2>
            <p className="text-white/80 mb-4">
              Merci de nous avoir fait savoir. L'ancien gestionnaire en sera informé.
            </p>
            <p className="text-white/60 text-sm">
              Redirection automatique dans quelques secondes...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 flex items-center justify-center p-6">
        <Card className="bg-white/20 backdrop-blur-sm border-white/30 max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Transfert accepté !</h2>
            <p className="text-white/80 mb-4">
              Vous gérez maintenant {transferData.minor.name}. Redirection vers votre dashboard...
            </p>
            <p className="text-white/60 text-sm">
              Redirection automatique dans quelques secondes...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilBirthday = calculateDaysUntilBirthday(transferData.minor.birthday);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
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
            👶
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-2xl">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-full">
                    <Send className="h-8 w-8 text-blue-300" />
                  </div>
                </div>
                <CardTitle className="text-white text-2xl mb-2">
                  🔄 Demande de transfert de gestion
                </CardTitle>
                <p className="text-white/90">
                  {transferData.from_user.name} souhaite vous transférer la gestion d'un mineur
                </p>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations sur le transfert */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <h4 className="text-blue-200 font-semibold mb-3 flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    Informations sur le mineur :
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                      <span className="text-blue-200">Nom :</span>
                      <span className="text-white font-semibold">{transferData.minor.name}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                      <span className="text-blue-200">Anniversaire :</span>
                      <span className="text-white font-semibold">
                        {new Date(transferData.minor.birthday).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                      <span className="text-blue-200">Relation actuelle :</span>
                      <Badge className="bg-blue-500/30 text-blue-200">
                        {getRelationText(transferData.minor.relationship_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                      <span className="text-blue-200">Temps restant :</span>
                      <Badge className="bg-purple-500/30 text-purple-200">
                        <Calendar className="h-3 w-3 mr-1" />
                        {daysUntilBirthday} jours
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Informations sur la cagnotte existante */}
                {transferData.pot_info && (
                  <div className="p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                    <h4 className="text-green-200 font-semibold mb-3">État de la cagnotte :</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                        <span className="text-green-200">Montant collecté :</span>
                        <span className="text-white font-semibold">
                          {formatCurrency(transferData.pot_info.current_amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                        <span className="text-green-200">Objectif :</span>
                        <span className="text-white font-semibold">
                          {formatCurrency(transferData.pot_info.target_amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                        <span className="text-green-200">Participants :</span>
                        <span className="text-white font-semibold">
                          {transferData.pot_info.participants}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations sur le transfert */}
                <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-400/30">
                  <h4 className="text-purple-200 font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Détails du transfert :
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                      <span className="text-purple-200">De :</span>
                      <span className="text-white font-semibold">{transferData.from_user.name}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                      <span className="text-purple-200">Vers :</span>
                      <span className="text-white font-semibold">{transferData.to_user.name}</span>
                    </div>
                    {transferData.transfer_reason && (
                      <div className="p-2 bg-white/10 rounded">
                        <span className="text-purple-200 text-sm">Raison :</span>
                        <p className="text-white/90 text-sm italic mt-1">
                          "{transferData.transfer_reason}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Responsabilités */}
                <div className="p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                  <h4 className="text-yellow-200 font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    En acceptant, vous vous engagez à :
                  </h4>
                  <ul className="text-white/90 text-sm space-y-1 list-disc list-inside">
                    <li>Gérer la cagnotte d'anniversaire de {transferData.minor.name}</li>
                    <li>Assurer le suivi des donations et invitations</li>
                    <li>Distribuer les QR codes aux invités</li>
                    <li>Respecter les souhaits du mineur pour son anniversaire</li>
                    <li>Pouvoir transférer la gestion à quelqu'un d'autre si nécessaire</li>
                  </ul>
                </div>
              </div>

              {/* Question principale */}
              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold text-white">
                  Acceptez-vous de prendre la gestion de {transferData.minor.name} ?
                </h3>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Oui, j'accepte
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleDecline}
                    disabled={isProcessing}
                    variant="outline"
                    className="border-red-400/50 text-red-300 hover:bg-red-500/20 px-8 py-3"
                    size="lg"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Non, décliner
                  </Button>
                </div>
              </div>

              {/* Informations légales */}
              <div className="p-3 bg-gray-500/20 rounded-lg border border-gray-400/30">
                <p className="text-gray-200 text-xs text-center">
                  Ce transfert est sécurisé et traçable. Toutes les actions sont enregistrées 
                  pour la protection du mineur et la transparence de la gestion.
                </p>
              </div>
            </CardContent>
          </Card>
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
            🔐 Système sécurisé de transfert de gestion pour la protection des mineurs
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
