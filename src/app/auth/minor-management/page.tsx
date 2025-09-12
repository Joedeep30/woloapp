
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  UserPlus, 
  AlertCircle, 
  CheckCircle,
  Users,
  Calendar,
  ArrowLeft,
  Crown,
  Settings,
  Trash2,
  Send,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ManagedMinor {
  id: string;
  minor_name: string;
  minor_birthday: string;
  pot_id?: string;
  pot_status?: string;
  pot_amount?: number;
  created_by_name: string;
  is_active: boolean;
  can_transfer: boolean;
}

function MinorManagementContent() {
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [managedMinors, setManagedMinors] = useState<ManagedMinor[]>([]);
  const [duplicateError, setDuplicateError] = useState<string>('');

  // Paramètres de création de cagnotte pour mineur
  const action = searchParams.get('action');
  const minorName = searchParams.get('minor_name');
  const minorBirthday = searchParams.get('minor_birthday');

  useEffect(() => {
    // Simuler la vérification d'authentification
    const checkAuth = async () => {
      const isAuth = sessionStorage.getItem('user_authenticated');
      if (isAuth === 'true') {
        const userData = JSON.parse(sessionStorage.getItem('user_data') || '{}');
        setUser(userData);
        setIsAuthenticated(true);
        await loadManagedMinors(userData.id);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const loadManagedMinors = async (userId: string) => {
    // Simuler le chargement des mineurs gérés
    const mockMinors: ManagedMinor[] = [
      {
        id: '1',
        minor_name: 'Petit Moussa',
        minor_birthday: '2024-12-28',
        pot_id: 'pot_1',
        pot_status: 'active',
        pot_amount: 15000,
        created_by_name: 'Fatou Diallo',
        is_active: true,
        can_transfer: true
      },
      {
        id: '2',
        minor_name: 'Aïcha Ba',
        minor_birthday: '2024-12-30',
        created_by_name: 'Fatou Diallo',
        is_active: true,
        can_transfer: true
      }
    ];

    setManagedMinors(mockMinors);
  };

  const handleSocialAuth = async (provider: string) => {
    toast.info(`Connexion ${provider} en cours...`);
    
    // Simuler l'authentification
    setTimeout(async () => {
      const userData = {
        id: 'user_123',
        name: 'Fatou Diallo',
        email: 'fatou@example.com',
        provider: provider
      };

      sessionStorage.setItem('user_authenticated', 'true');
      sessionStorage.setItem('user_data', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success(`Connexion ${provider} réussie !`);
      
      // Charger les mineurs gérés
      await loadManagedMinors(userData.id);
      
      // Si on vient pour créer une cagnotte de mineur, procéder
      if (action === 'create_minor_pot' && minorName && minorBirthday) {
        await handleCreateMinorPot();
      }
    }, 2000);
  };

  const handleCreateMinorPot = async () => {
    if (!minorName || !minorBirthday) {
      toast.error('Données du mineur manquantes');
      return;
    }

    try {
      // Vérifier si ce mineur existe déjà dans le système
      const existingMinor = managedMinors.find(m => 
        m.minor_name.toLowerCase() === minorName.toLowerCase() && 
        m.minor_birthday === minorBirthday
      );

      if (existingMinor) {
        setDuplicateError(`Cet enfant est déjà géré dans le système par "${existingMinor.created_by_name}"`);
        toast.error(`Cet enfant est déjà géré dans le système par "${existingMinor.created_by_name}"`);
        return;
      }

      // Créer le mineur et sa cagnotte
      const newMinor: ManagedMinor = {
        id: `minor_${Date.now()}`,
        minor_name: minorName,
        minor_birthday: minorBirthday,
        pot_id: `pot_${Date.now()}`,
        pot_status: 'active',
        pot_amount: 0,
        created_by_name: user.name,
        is_active: true,
        can_transfer: true
      };

      setManagedMinors(prev => [...prev, newMinor]);
      
      toast.success(`Cagnotte créée pour ${minorName} !`);
      toast.info(`Relation familiale obligatoire`);
      
      // Rediriger vers le dashboard de gestion
      setTimeout(() => {
        window.location.href = `/owner?minor_id=${newMinor.id}`;
      }, 2000);
      
    } catch (error) {
      toast.error('Erreur lors de la création de la cagnotte');
    }
  };

  const handleTransferManagement = async (minorId: string) => {
    const minor = managedMinors.find(m => m.id === minorId);
    if (!minor) return;

    const newManagerEmail = prompt(`Transférer la gestion de ${minor.minor_name} à (email) :`);
    if (!newManagerEmail || !newManagerEmail.includes('@')) {
      toast.error('Email invalide');
      return;
    }

    try {
      // Simuler le transfert
      toast.info(`Demande de transfert envoyée à ${newManagerEmail}`);
      toast.success(`${newManagerEmail} recevra un email pour accepter la gestion de ${minor.minor_name}`);
      
      // Marquer comme en cours de transfert
      setManagedMinors(prev => prev.map(m => 
        m.id === minorId 
          ? { ...m, can_transfer: false }
          : m
      ));
      
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateDaysUntilBirthday = (birthday: string) => {
    const today = new Date();
    const birthdayDate = new Date(birthday);
    const diffTime = birthdayDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden p-6">
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
            className="max-w-md mx-auto"
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
                      <Shield className="h-8 w-8 text-blue-300" />
                    </div>
                  </div>
                  <CardTitle className="text-white text-2xl mb-2">
                    🔐 Authentification requise
                  </CardTitle>
                  <p className="text-white/90">
                    Pour gérer la cagnotte d'un mineur, vous devez d'abord vous identifier
                  </p>
                </motion.div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informations sur la demande */}
                {action === 'create_minor_pot' && minorName && (
                  <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <h4 className="text-blue-200 font-semibold mb-2">Demande en cours :</h4>
                    <div className="text-white/90 text-sm space-y-1">
                      <p>👶 <strong>Mineur :</strong> {minorName}</p>
                      <p>🎂 <strong>Anniversaire :</strong> {minorBirthday ? new Date(minorBirthday).toLocaleDateString('fr-FR') : 'Non spécifié'}</p>
                      <p>👨‍👩‍👧‍👦 <strong>Relation :</strong> Enfant</p>
                    </div>
                  </div>
                )}

                {/* Options d'authentification avec icônes plus petites */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-center">
                    Connectez-vous avec votre compte :
                  </h3>
                  
                  {/* Bouton Google principal */}
                  <Button
                    onClick={() => handleSocialAuth('Google')}
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
                  
                  {/* Autres options avec icônes plus petites */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleSocialAuth('Facebook')}
                      variant="outline"
                      className="border-white/40 text-white hover:bg-white/10 bg-white/20 flex items-center justify-center gap-1 py-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="text-xs">Facebook</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleSocialAuth('Apple')}
                      variant="outline"
                      className="border-white/40 text-white hover:bg-white/10 bg-white/20 flex items-center justify-center gap-1 py-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      <span className="text-xs">Apple</span>
                    </Button>
                  </div>
                </div>

                {/* Pourquoi l'authentification est requise */}
                <div className="p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-300 mt-0.5" />
                    <div className="text-sm text-yellow-200">
                      <p className="font-semibold mb-1">Pourquoi l'authentification ?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Sécurité et protection des mineurs</li>
                        <li>Vérification de l'identité du gestionnaire</li>
                        <li>Prévention des abus et doublons</li>
                        <li>Traçabilité des responsabilités</li>
                        <li>Possibilité de transfert de gestion</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Link href="/landing">
                    <Button variant="ghost" className="text-white/70 hover:bg-white/10">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour à l'accueil
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden p-6">
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🔐 Gestion des Mineurs - {user?.name}
            </h1>
            <p className="text-white/70">
              Gérez les cagnottes d'anniversaire des mineurs de votre famille
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500/30 text-green-200 border border-green-400/50">
              <CheckCircle className="h-3 w-3 mr-1" />
              Authentifié via {user?.provider}
            </Badge>
            <Link href="/landing">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Message d'erreur de doublon */}
        {duplicateError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-red-400 bg-red-500/20 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 text-red-300" />
              <AlertDescription className="text-red-200 font-medium">
                {duplicateError}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Dashboard de gestion des mineurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{managedMinors.length}</div>
                <div className="text-sm text-white/70">Mineurs gérés</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {managedMinors.filter(m => m.pot_id).length}
                </div>
                <div className="text-sm text-white/70">Cagnottes actives</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(managedMinors.reduce((sum, m) => sum + (m.pot_amount || 0), 0))}
                </div>
                <div className="text-sm text-white/70">Total collecté</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {managedMinors.filter(m => m.can_transfer).length}
                </div>
                <div className="text-sm text-white/70">Transférables</div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des mineurs gérés */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Mineurs sous votre gestion ({managedMinors.length})
                </CardTitle>
                <Button
                  onClick={() => window.open('/create-cagnotte?tab=minor', '_blank')}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un mineur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {managedMinors.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{minor.minor_name}</h3>
                          <Badge className="bg-blue-500/20 text-blue-300">
                            Enfant
                          </Badge>
                          {minor.pot_id && (
                            <Badge className="bg-green-500/20 text-green-300">
                              <Gift className="h-3 w-3 mr-1" />
                              Cagnotte active
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-white/70 space-y-1">
                          <p>🎂 Anniversaire: {new Date(minor.minor_birthday).toLocaleDateString('fr-FR')}</p>
                          <p>⏰ Dans: {calculateDaysUntilBirthday(minor.minor_birthday)} jours</p>
                          {minor.pot_amount && (
                            <p>💰 Montant collecté: {formatCurrency(minor.pot_amount)}</p>
                          )}
                          <p>👤 Créé par: {minor.created_by_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {minor.pot_id && (
                          <Button
                            onClick={() => window.open(`/owner?minor_id=${minor.id}`, '_blank')}
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {minor.can_transfer && (
                          <Button
                            onClick={() => handleTransferManagement(minor.id)}
                            variant="ghost"
                            size="sm"
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        
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

          {/* Informations importantes */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Système de protection des mineurs
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
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-3">Gestion :</h4>
                  <ul className="text-white/90 text-sm space-y-2">
                    <li>🔄 <strong>Transfert de gestion</strong> entre membres de la famille</li>
                    <li>👨‍👩‍👧‍👦 <strong>Relation autorisée :</strong> Enfant uniquement</li>
                    <li>📱 <strong>Dashboard unifié</strong> pour gérer tous vos mineurs</li>
                    <li>⚡ <strong>Actions rapides :</strong> Créer, transférer, supprimer</li>
                  </ul>
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
          className="mt-16 text-center text-white/80"
        >
          <p className="text-sm font-semibold">
            © 2025 WOLO SENEGAL® - From Connect Africa® —
            <br />
            🔐 Système sécurisé de gestion des cagnottes pour mineurs
            <br />
            👶 Protection et traçabilité complète des responsabilités
          </p>
        </motion.footer>
      </div>
    </div>
  );
}

export default function MinorManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Chargement...</p>
        </div>
      </div>
    }>
      <MinorManagementContent />
    </Suspense>
  );
}
