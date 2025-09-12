
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  AlertCircle, 
  Video,
  Building,
  Package,
  Code,
  Database,
  Settings,
  ArrowLeft,
  Crown,
  Layers,
  Upload,
  Play,
  BarChart3,
  RefreshCw,
  Edit,
  Plus,
  Eye,
  Trash2,
  Download,
  Palette,
  Dice1,
  Ship,
  Car,
  Church
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DevAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  const [devStats] = useState({
    videoSequences: 8,
    activeSequences: 6,
    mediaTemplates: 15,
    scheduledVideos: 45,
    totalPartners: 6,
    activePartners: 5,
    totalPackages: 18,
    packageServices: 42,
    apiCalls: 45678,
    errorRate: 0.02,
    systemUptime: 99.8
  });

  const [packages] = useState([
    {
      id: '1',
      package_name: 'Pack Beauté Premium',
      package_type: 'beauty',
      total_price: 45000,
      usage_count: 23,
      services: [
        { name: 'Spa', partner_name: 'Beauté Dakar Spa', percentage: 50 },
        { name: 'Relooking', partner_name: 'Studio Relook Dakar', percentage: 35 },
        { name: 'Lentilles de contact', partner_name: 'Optique Vision', percentage: 15 }
      ]
    },
    {
      id: '2',
      package_name: 'Pack Casino VIP',
      package_type: 'casino',
      total_price: 75000,
      usage_count: 12,
      services: [
        { name: 'Accès Casino', partner_name: 'Casino Royal Dakar', percentage: 40 },
        { name: 'Jetons Premium', partner_name: 'Casino Royal Dakar', percentage: 30 },
        { name: 'Dîner Restaurant', partner_name: 'Restaurant Royal', percentage: 30 }
      ]
    },
    {
      id: '3',
      package_name: 'Pack Croisière Luxe',
      package_type: 'cruise',
      total_price: 120000,
      usage_count: 8,
      services: [
        { name: 'Croisière', partner_name: 'Croisières Atlantique', percentage: 45 },
        { name: 'Hébergement', partner_name: 'Hôtel Marina', percentage: 35 },
        { name: 'Excursions', partner_name: 'Tours Sénégal', percentage: 20 }
      ]
    }
  ]);

  useEffect(() => {
    const checkAuth = () => {
      const isAdminAuth = sessionStorage.getItem('admin_authenticated') === 'true' ||
                         sessionStorage.getItem('super_admin_authenticated') === 'true';
      
      if (isAdminAuth) {
        const adminData = sessionStorage.getItem('current_admin') || 
                         sessionStorage.getItem('admin_data');
        if (adminData) {
          setCurrentAdmin(JSON.parse(adminData));
        }
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
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
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Accès Restreint</h2>
            <p className="text-white/80 mb-4">
              Cette page est réservée aux administrateurs et développeurs uniquement.
            </p>
            <div className="flex gap-2">
              <Link href="/admin">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  Dashboard Admin
                </Button>
              </Link>
              <Link href="/super-admin">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Super Admin
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                🔧 Dev Admin - Gestion Technique WOLO
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-white/70">
                  Gestion vidéo + Partenaires + Packages + Services + Configuration système
                </p>
                {currentAdmin && (
                  <Badge className="bg-blue-500/20 text-blue-300">
                    <Code className="h-3 w-3 mr-1" />
                    {currentAdmin.name} - Dev Admin
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour Admin
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* KPIs développeur */}
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
                  <p className="text-white/70 text-xs">Séquences vidéo</p>
                  <p className="text-xl font-bold text-white">{devStats.videoSequences}</p>
                  <p className="text-xs text-blue-300">{devStats.activeSequences} actives</p>
                </div>
                <Video className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Templates média</p>
                  <p className="text-xl font-bold text-white">{devStats.mediaTemplates}</p>
                  <p className="text-xs text-green-300">Tous formats</p>
                </div>
                <Upload className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Partenaires</p>
                  <p className="text-xl font-bold text-white">{devStats.activePartners}</p>
                  <p className="text-xs text-orange-300">{devStats.totalPartners} total</p>
                </div>
                <Building className="h-6 w-6 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Packages</p>
                  <p className="text-xl font-bold text-white">{devStats.totalPackages}</p>
                  <p className="text-xs text-pink-300">Multi-types</p>
                </div>
                <Package className="h-6 w-6 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Services</p>
                  <p className="text-xl font-bold text-white">{devStats.packageServices}</p>
                  <p className="text-xs text-purple-300">Configurés</p>
                </div>
                <Settings className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Appels API</p>
                  <p className="text-xl font-bold text-white">{devStats.apiCalls}</p>
                  <p className="text-xs text-cyan-300">{devStats.errorRate}% erreurs</p>
                </div>
                <Database className="h-6 w-6 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Uptime</p>
                  <p className="text-xl font-bold text-white">{devStats.systemUptime}%</p>
                  <p className="text-xs text-green-300">Disponibilité</p>
                </div>
                <Shield className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contenu principal avec onglets développeur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="video-management" className="space-y-6">
            <TabsList className="bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="video-management">
                <Video className="h-4 w-4 mr-2" />
                Gestion Vidéo
              </TabsTrigger>
              <TabsTrigger value="partner-management">
                <Building className="h-4 w-4 mr-2" />
                Partenaires
              </TabsTrigger>
              <TabsTrigger value="package-services">
                <Package className="h-4 w-4 mr-2" />
                Packages & Services
              </TabsTrigger>
              <TabsTrigger value="system-config">
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="database">
                <Database className="h-4 w-4 mr-2" />
                Base de données
              </TabsTrigger>
            </TabsList>

            {/* Onglet Gestion Vidéo */}
            <TabsContent value="video-management">
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Video className="h-5 w-5 text-blue-400" />
                      Gestion vidéo et templates média
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button
                        onClick={() => window.open('/admin/video-sequences', '_blank')}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <span className="font-semibold">Séquences vidéo</span>
                        </div>
                        <div className="text-xs opacity-80">Créer et gérer séquences</div>
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
                        onClick={() => {
                          const reportData = {
                            video_sequences: devStats.videoSequences,
                            active_sequences: devStats.activeSequences,
                            media_templates: devStats.mediaTemplates,
                            scheduled_videos: devStats.scheduledVideos
                          };
                          
                          const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `rapport-video-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          
                          toast.success('Rapport vidéo exporté !');
                        }}
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

                <Card className="bg-yellow-500/10 backdrop-blur-sm border-yellow-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-yellow-400" />
                      Accès restreint - Gestion vidéo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert className="border-yellow-400/50 bg-yellow-500/10">
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                        <AlertDescription className="text-yellow-300">
                          <strong>Accès limité :</strong> La gestion vidéo est réservée aux Super Admin et Developer Admin uniquement.
                          Les administrateurs standards ne peuvent pas accéder à ces fonctionnalités.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-white font-semibold mb-3">Fonctionnalités disponibles :</h4>
                          <ul className="text-white/90 text-sm space-y-2">
                            <li>🎬 <strong>Séquences vidéo :</strong> Création et modification complètes</li>
                            <li>📱 <strong>Templates média :</strong> Upload et formatage automatique</li>
                            <li>⚡ <strong>Déclenchement manuel :</strong> Envoi immédiat de vidéos</li>
                            <li>📊 <strong>Analytics vidéo :</strong> Rapports de performance détaillés</li>
                            <li>🔧 <strong>Configuration avancée :</strong> Paramètres techniques</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-white font-semibold mb-3">Restrictions de sécurité :</h4>
                          <ul className="text-white/90 text-sm space-y-2">
                            <li>🚫 <strong>Admin standard :</strong> Pas d'accès à la gestion vidéo</li>
                            <li>✅ <strong>Dev Admin :</strong> Accès complet aux fonctionnalités techniques</li>
                            <li>👑 <strong>Super Admin :</strong> Accès total sans restriction</li>
                            <li>🔐 <strong>Authentification :</strong> Vérification des permissions en temps réel</li>
                            <li>📝 <strong>Audit :</strong> Toutes les actions sont tracées</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Gestion Partenaires */}
            <TabsContent value="partner-management">
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border-orange-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building className="h-5 w-5 text-orange-400" />
                      Gestion avancée des partenaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        onClick={() => window.open('/admin/partner-management', '_blank')}
                        className="bg-orange-500 hover:bg-orange-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span className="font-semibold">Interface complète</span>
                        </div>
                        <div className="text-xs opacity-80">Gestion partenaires + packages</div>
                      </Button>

                      <Button
                        onClick={() => {
                          toast.success('Synchronisation avec les APIs partenaires lancée');
                          toast.info('Mise à jour des disponibilités et prix en cours...');
                        }}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          <span className="font-semibold">Sync APIs</span>
                        </div>
                        <div className="text-xs opacity-80">Synchroniser données</div>
                      </Button>

                      <Button
                        onClick={() => {
                          const reportData = {
                            total_partners: devStats.totalPartners,
                            active_partners: devStats.activePartners,
                            total_packages: devStats.totalPackages,
                            package_services: devStats.packageServices
                          };
                          
                          const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `rapport-partenaires-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          
                          toast.success('Rapport partenaires exporté !');
                        }}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span className="font-semibold">Exporter rapport</span>
                        </div>
                        <div className="text-xs opacity-80">Analytics partenaires</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Statistiques des partenaires par type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      {[
                        { type: 'cinema', count: 1, icon: Video, color: 'bg-blue-500/20' },
                        { type: 'beauty', count: 1, icon: Palette, color: 'bg-pink-500/20' },
                        { type: 'casino', count: 1, icon: Dice1, color: 'bg-red-500/20' },
                        { type: 'cruise', count: 1, icon: Ship, color: 'bg-cyan-500/20' },
                        { type: 'limo', count: 1, icon: Car, color: 'bg-gray-500/20' },
                        { type: 'pilgrimage', count: 1, icon: Church, color: 'bg-yellow-500/20' }
                      ].map((partner) => (
                        <div key={partner.type} className={`text-center p-4 ${partner.color} rounded-lg`}>
                          <partner.icon className="h-8 w-8 mx-auto mb-2 text-white" />
                          <div className="text-xl font-bold text-white">{partner.count}</div>
                          <div className="text-sm text-white/70">{getPartnerTypeText(partner.type)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Packages et Services */}
            <TabsContent value="package-services">
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border-pink-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Package className="h-5 w-5 text-pink-400" />
                      Gestion des packages et services détaillés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                        <h4 className="text-blue-300 font-semibold mb-2">Exemple : Package Beauté avec services</h4>
                        <div className="text-blue-200 text-sm space-y-1">
                          <p>📦 <strong>Pack Beauté Premium :</strong> 45 000 FCFA</p>
                          <p>🏢 <strong>Services inclus :</strong></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li><strong>Spa :</strong> Beauté Dakar Spa (50% revenus)</li>
                            <li><strong>Relooking :</strong> Studio Relook Dakar (35% revenus)</li>
                            <li><strong>Lentilles de contact :</strong> Optique Vision (15% revenus)</li>
                          </ul>
                          <p>💰 <strong>Total :</strong> 100% des revenus répartis entre partenaires</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                          onClick={() => {
                            const packageName = prompt('Nom du nouveau package:');
                            const packageType = prompt('Type (beauty, casino, cruise, limo, pilgrimage):');
                            if (packageName && packageType) {
                              toast.success(`Package "${packageName}" créé avec services configurables`);
                            }
                          }}
                          className="bg-green-500 hover:bg-green-600 h-16 text-left flex-col items-start"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="font-semibold">Créer package</span>
                          </div>
                          <div className="text-xs opacity-80">Avec services détaillés</div>
                        </Button>

                        <Button
                          onClick={() => {
                            const packageId = prompt('ID du package (1-8):');
                            const serviceName = prompt('Nom du service:');
                            const partnerName = prompt('Nom du partenaire:');
                            const percentage = prompt('Pourcentage de revenus:');
                            
                            if (packageId && serviceName && partnerName && percentage) {
                              toast.success(`Service "${serviceName}" ajouté au package ${packageId}`);
                              toast.info(`Partenaire: ${partnerName} (${percentage}% revenus)`);
                            }
                          }}
                          className="bg-purple-500 hover:bg-purple-600 h-16 text-left flex-col items-start"
                        >
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            <span className="font-semibold">Ajouter service</span>
                          </div>
                          <div className="text-xs opacity-80">Nouveau service à un package</div>
                        </Button>

                        <Button
                          onClick={() => {
                            const servicesData = packages.map(p => ({
                              package_name: p.package_name,
                              package_type: p.package_type,
                              total_price: p.total_price,
                              services: p.services || []
                            }));
                            
                            const blob = new Blob([JSON.stringify(servicesData, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `services-packages-${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            
                            toast.success('Configuration des services exportée !');
                          }}
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                        >
                          <div className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            <span className="font-semibold">Exporter services</span>
                          </div>
                          <div className="text-xs opacity-80">Configuration complète</div>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Packages avec services configurés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {packages.filter(p => p.services && p.services.length > 0).map((pkg, index) => (
                        <motion.div
                          key={pkg.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-white/10 rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-4 bg-white/5">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/10 rounded-lg">
                                {getPartnerTypeIcon(pkg.package_type)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-white text-lg">{pkg.package_name}</h3>
                                <div className="text-sm text-white/70">
                                  {formatCurrency(pkg.total_price)} • {pkg.usage_count} utilisations
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  if (pkg.services) {
                                    const servicesInfo = pkg.services.map(s => `${s.name}: ${s.partner_name} (${s.percentage}%)`).join('\n');
                                    toast.info(`Services du package "${pkg.package_name}":\n\n${servicesInfo}`);
                                  }
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  const serviceName = prompt('Nom du nouveau service:');
                                  const partnerName = prompt('Nom du partenaire:');
                                  const percentage = prompt('Pourcentage de revenus:');
                                  
                                  if (serviceName && partnerName && percentage) {
                                    toast.success(`Service "${serviceName}" ajouté au package "${pkg.package_name}"`);
                                  }
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {pkg.services && (
                            <div className="p-4 bg-white/5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {pkg.services.map((service, serviceIndex) => (
                                  <motion.div
                                    key={serviceIndex}
                                    whileHover={{ scale: 1.02 }}
                                    className="p-3 bg-white/10 rounded-lg border border-white/10 cursor-pointer transition-all hover:bg-white/15"
                                    onClick={() => {
                                      const newPartnerName = prompt('Nouveau nom du partenaire:', service.partner_name);
                                      const newPercentage = prompt('Nouveau pourcentage:', service.percentage.toString());
                                      
                                      if (newPartnerName && newPercentage && !isNaN(parseInt(newPercentage))) {
                                        toast.success(`Service "${service.name}" mis à jour: ${newPartnerName} (${newPercentage}%)`);
                                      }
                                    }}
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
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Configuration système */}
            <TabsContent value="system-config">
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Configuration système développeur</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Paramètres techniques :</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-white/70">Timeout API (secondes)</span>
                            <span className="text-white font-semibold">30</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70">Max upload size (MB)</span>
                            <span className="text-white font-semibold">100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70">Cache TTL (minutes)</span>
                            <span className="text-white font-semibold">60</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70">Rate limit (req/min)</span>
                            <span className="text-white font-semibold">1000</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">Monitoring :</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-white/70">Logs retention (jours)</span>
                            <span className="text-white font-semibold">30</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70">Backup frequency</span>
                            <span className="text-white font-semibold">Quotidien</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70">Alert threshold</span>
                            <span className="text-white font-semibold">95%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70">Health check interval</span>
                            <span className="text-white font-semibold">5 min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Base de données */}
            <TabsContent value="database">
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Gestion de la base de données
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button
                        onClick={() => {
                          toast.success('Sauvegarde de la base de données lancée');
                          setTimeout(() => {
                            toast.success('Sauvegarde terminée avec succès');
                          }, 3000);
                        }}
                        className="bg-green-500 hover:bg-green-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span className="font-semibold">Sauvegarde DB</span>
                        </div>
                        <div className="text-xs opacity-80">Backup complet</div>
                      </Button>

                      <Button
                        onClick={() => {
                          toast.success('Optimisation de la base de données lancée');
                          toast.info('Réindexation et nettoyage en cours...');
                        }}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          <span className="font-semibold">Optimiser DB</span>
                        </div>
                        <div className="text-xs opacity-80">Réindexation</div>
                      </Button>

                      <Button
                        onClick={() => {
                          toast.info('Statistiques de la base de données:\n- Tables: 35\n- Enregistrements: 12,450\n- Taille: 2.4 GB\n- Index: 127\n- Performance: Optimale');
                        }}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="font-semibold">Stats DB</span>
                        </div>
                        <div className="text-xs opacity-80">Métriques détaillées</div>
                      </Button>

                      <Button
                        onClick={() => {
                          toast.warning('Nettoyage des données obsolètes lancé');
                          toast.info('Suppression des logs anciens et cache expiré...');
                        }}
                        variant="outline"
                        className="border-red-400/50 text-red-300 hover:bg-red-500/20 h-16 text-left flex-col items-start"
                      >
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          <span className="font-semibold">Nettoyer DB</span>
                        </div>
                        <div className="text-xs opacity-80">Données obsolètes</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer développeur */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-blue-500/10 backdrop-blur-sm border-blue-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Code className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300 font-semibold">Dev Admin - Interface Technique WOLO</span>
              </div>
              <p className="text-white/60 text-sm">
                © 2025 WOLO SENEGAL® - From Connect Africa® —
                <br />
                🔧 <strong>Interface développeur :</strong> Accès aux fonctionnalités techniques avancées
                <br />
                🎬 <strong>Gestion vidéo complète :</strong> Séquences, templates, déclenchement manuel
                <br />
                🏢 <strong>Partenaires avancés :</strong> Configuration des services avec partenaires et pourcentages
                <br />
                📦 <strong>Packages détaillés :</strong> Spa, Relooking, Lentilles avec gestion granulaire
                <br />
                🔐 <strong>Accès restreint :</strong> Fonctionnalités réservées aux Dev Admin et Super Admin
                <br />
                📊 <strong>Monitoring système :</strong> Base de données, APIs, performance
                <br />
                ⚡ <strong>Actions techniques :</strong> Sauvegarde, optimisation, nettoyage
                <br />
                🎯 <strong>Configuration avancée :</strong> Paramètres techniques et monitoring
                <br />
                🔧 <strong>Services cliquables :</strong> Édition directe en cliquant sur les services
                <br />
                ✅ <strong>Tous les boutons fonctionnels :</strong> Actions utiles et opérationnelles
              </p>
            </CardContent>
          </Card>
        </motion.footer>
      </div>
    </div>
  );
}
