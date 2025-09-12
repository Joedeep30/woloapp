
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Video, 
  Image as ImageIcon, 
  MessageSquare, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Crown,
  Star,
  Users,
  Send,
  Share2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Smartphone,
  Globe,
  Zap,
  Layers,
  Crop,
  Palette,
  FileText,
  Archive,
  RefreshCw,
  ArrowLeft,
  Bell,
  Gift,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface MediaTemplate {
  id: string;
  template_name: string;
  template_type: 'social_share' | 'invitation' | 'sponsorship' | 'notification' | 'birthday_greeting';
  category: 'facebook' | 'instagram' | 'whatsapp' | 'tiktok' | 'snapchat' | 'twitter' | 'linkedin' | 'email' | 'sms' | 'general';
  content_type: 'video' | 'image' | 'text' | 'mixed';
  description?: string;
  original_file_url?: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  message_content?: string;
  is_active: boolean;
  created_by_admin_id: number;
  create_time: string;
}

interface PlatformFormat {
  id: string;
  platform: string;
  format_type: string;
  width?: number;
  height?: number;
  max_duration_seconds?: number;
  max_file_size_mb?: number;
  supported_formats: string[];
  aspect_ratio?: string;
  formatted_file_url?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
}

interface PlatformSpec {
  width: number;
  height: number;
  aspect_ratio: string;
  max_size: number;
  max_duration_seconds?: number;
}

export default function MediaManagementPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  
  const [mediaTemplates, setMediaTemplates] = useState<MediaTemplate[]>([]);
  const [platformFormats, setPlatformFormats] = useState<PlatformFormat[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isProcessingFormats, setIsProcessingFormats] = useState(false);
  
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    template_type: 'social_share' as MediaTemplate['template_type'],
    category: 'general' as MediaTemplate['category'],
    content_type: 'video' as MediaTemplate['content_type'],
    description: '',
    message_content: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState<MediaTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showFormatDialog, setShowFormatDialog] = useState(false);

  // Formats prédéfinis pour chaque plateforme - CORRECTION DES PROPRIÉTÉS
  const platformSpecs: Record<string, Record<string, PlatformSpec>> = {
    facebook: {
      post: { width: 1200, height: 630, aspect_ratio: '1.91:1', max_size: 8 },
      story: { width: 1080, height: 1920, aspect_ratio: '9:16', max_size: 4 },
      video: { width: 1280, height: 720, aspect_ratio: '16:9', max_duration_seconds: 240, max_size: 100 }
    },
    instagram: {
      post: { width: 1080, height: 1080, aspect_ratio: '1:1', max_size: 8 },
      story: { width: 1080, height: 1920, aspect_ratio: '9:16', max_size: 4 },
      reel: { width: 1080, height: 1920, aspect_ratio: '9:16', max_duration_seconds: 90, max_size: 100 }
    },
    tiktok: {
      video: { width: 1080, height: 1920, aspect_ratio: '9:16', max_duration_seconds: 180, max_size: 100 }
    },
    whatsapp: {
      status: { width: 1080, height: 1920, aspect_ratio: '9:16', max_size: 16 }
    },
    twitter: {
      post: { width: 1200, height: 675, aspect_ratio: '16:9', max_size: 5 },
      video: { width: 1280, height: 720, aspect_ratio: '16:9', max_duration_seconds: 140, max_size: 512 }
    },
    snapchat: {
      story: { width: 1080, height: 1920, aspect_ratio: '9:16', max_size: 32 }
    },
    linkedin: {
      post: { width: 1200, height: 627, aspect_ratio: '1.91:1', max_size: 5 }
    }
  };

  useEffect(() => {
    // Vérifier l'authentification admin
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
        loadMediaTemplates();
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const loadMediaTemplates = async () => {
    try {
      // Simuler le chargement des templates existants
      const mockTemplates: MediaTemplate[] = [
        {
          id: '1',
          template_name: 'Vidéo d\'invitation anniversaire standard',
          template_type: 'invitation',
          category: 'general',
          content_type: 'video',
          description: 'Vidéo d\'invitation générique pour tous les anniversaires',
          original_file_url: 'https://example.com/videos/birthday-invitation.mp4',
          original_filename: 'birthday-invitation.mp4',
          file_size: 15728640, // 15MB
          mime_type: 'video/mp4',
          is_active: true,
          created_by_admin_id: 1,
          create_time: '2024-12-19T10:00:00Z'
        },
        {
          id: '2',
          template_name: 'Message de parrainage WhatsApp',
          template_type: 'sponsorship',
          category: 'whatsapp',
          content_type: 'text',
          description: 'Template de message pour invitations de parrainage via WhatsApp',
          message_content: 'Salut {invited_name} ! 🎉 J\'ai découvert WOLO SENEGAL, une super plateforme pour organiser des cagnottes d\'anniversaire avec des cadeaux cinéma ! Ton anniversaire approche et je pense que ça pourrait t\'intéresser. Tu veux que WOLO gère ta cagnotte d\'anniversaire ? C\'est gratuit et très facile ! 🎂🎁',
          is_active: true,
          created_by_admin_id: 1,
          create_time: '2024-12-19T09:30:00Z'
        },
        {
          id: '3',
          template_name: 'Image de partage Facebook',
          template_type: 'social_share',
          category: 'facebook',
          content_type: 'image',
          description: 'Image optimisée pour les partages Facebook',
          original_file_url: 'https://example.com/images/facebook-share.jpg',
          original_filename: 'facebook-share.jpg',
          file_size: 2097152, // 2MB
          mime_type: 'image/jpeg',
          is_active: true,
          created_by_admin_id: 1,
          create_time: '2024-12-19T08:15:00Z'
        }
      ];

      setMediaTemplates(mockTemplates);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const maxSize = 100 * 1024 * 1024; // 100MB max
    if (file.size > maxSize) {
      toast.error('Le fichier ne doit pas dépasser 100MB');
      return;
    }

    const allowedTypes = ['video/mp4', 'video/mov', 'image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format de fichier non supporté. Utilisez MP4, MOV, JPG, PNG ou GIF');
      return;
    }

    setIsUploadingMedia(true);
    
    try {
      // Simuler l'upload
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Créer une URL temporaire pour la démo
      const fileUrl = URL.createObjectURL(file);
      
      // Mettre à jour le template avec le fichier
      setNewTemplate(prev => ({
        ...prev,
        template_name: prev.template_name || file.name.split('.')[0],
        content_type: file.type.startsWith('video/') ? 'video' : 'image'
      }));
      
      toast.success('Fichier uploadé avec succès !');
      toast.info('Le fichier sera automatiquement formaté pour toutes les plateformes');
      
    } catch (error) {
      toast.error('Erreur lors de l\'upload du fichier');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTemplate.template_name.trim()) {
      toast.error('Veuillez saisir un nom pour le template');
      return;
    }

    try {
      setIsUploadingMedia(true);
      
      // Simuler la création du template
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTemplateData: MediaTemplate = {
        id: (mediaTemplates.length + 1).toString(),
        ...newTemplate,
        is_active: true,
        created_by_admin_id: currentAdmin?.id || 1,
        create_time: new Date().toISOString()
      };
      
      setMediaTemplates(prev => [newTemplateData, ...prev]);
      
      // Réinitialiser le formulaire
      setNewTemplate({
        template_name: '',
        template_type: 'social_share',
        category: 'general',
        content_type: 'video',
        description: '',
        message_content: ''
      });
      
      toast.success('Template créé avec succès !');
      
      // Lancer le formatage automatique pour toutes les plateformes
      if (newTemplateData.content_type === 'video' || newTemplateData.content_type === 'image') {
        handleAutoFormatForAllPlatforms(newTemplateData.id);
      }
      
    } catch (error) {
      toast.error('Erreur lors de la création du template');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleAutoFormatForAllPlatforms = async (templateId: string) => {
    setIsProcessingFormats(true);
    
    try {
      toast.info('Formatage automatique en cours pour toutes les plateformes...');
      
      // Créer tous les formats de manière séquentielle pour éviter les erreurs de promesses
      const allFormats: PlatformFormat[] = [];
      
      for (const [platform, specs] of Object.entries(platformSpecs)) {
        for (const [formatType, spec] of Object.entries(specs)) {
          // Simuler le traitement
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
          
          const newFormat: PlatformFormat = {
            id: `${templateId}_${platform}_${formatType}`,
            platform,
            format_type: formatType,
            width: spec.width,
            height: spec.height,
            max_duration_seconds: spec.max_duration_seconds,
            max_file_size_mb: spec.max_size,
            supported_formats: platform === 'tiktok' ? ['mp4'] : ['mp4', 'mov', 'jpg', 'png'],
            aspect_ratio: spec.aspect_ratio,
            formatted_file_url: `https://example.com/formatted/${templateId}_${platform}_${formatType}.mp4`,
            processing_status: 'completed'
          };
          
          allFormats.push(newFormat);
        }
      }
      
      setPlatformFormats(prev => [...prev, ...allFormats]);
      
      toast.success('Formatage terminé pour toutes les plateformes !');
      toast.info(`${allFormats.length} formats générés automatiquement`);
      
    } catch (error) {
      toast.error('Erreur lors du formatage automatique');
    } finally {
      setIsProcessingFormats(false);
    }
  };

  const handleToggleTemplateStatus = async (templateId: string) => {
    setMediaTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, is_active: !template.is_active }
        : template
    ));
    
    const template = mediaTemplates.find(t => t.id === templateId);
    toast.success(`Template "${template?.template_name}" ${template?.is_active ? 'désactivé' : 'activé'}`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const template = mediaTemplates.find(t => t.id === templateId);
    if (!template) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le template "${template.template_name}" ?`)) {
      return;
    }

    try {
      setMediaTemplates(prev => prev.filter(t => t.id !== templateId));
      setPlatformFormats(prev => prev.filter(f => !f.id.startsWith(templateId)));
      
      toast.success(`Template "${template.template_name}" supprimé`);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handlePreviewTemplate = (template: MediaTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDialog(true);
  };

  const handleDownloadFormat = (format: PlatformFormat) => {
    if (!format.formatted_file_url) {
      toast.error('Fichier formaté non disponible');
      return;
    }

    // Simuler le téléchargement
    const link = document.createElement('a');
    link.href = format.formatted_file_url;
    link.download = `${format.platform}_${format.format_type}.${format.supported_formats[0]}`;
    link.click();
    
    toast.success(`Format ${format.platform} ${format.format_type} téléchargé !`);
  };

  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case 'social_share':
        return <Share2 className="h-4 w-4" />;
      case 'invitation':
        return <Send className="h-4 w-4" />;
      case 'sponsorship':
        return <Star className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      case 'birthday_greeting':
        return <Gift className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTemplateTypeText = (type: string) => {
    switch (type) {
      case 'social_share':
        return 'Partage social';
      case 'invitation':
        return 'Invitation';
      case 'sponsorship':
        return 'Parrainage';
      case 'notification':
        return 'Notification';
      case 'birthday_greeting':
        return 'Vœux d\'anniversaire';
      default:
        return type;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'tiktok':
        return <Video className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'text':
        return <MessageSquare className="h-4 w-4" />;
      case 'mixed':
        return <Layers className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'failed':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-blue-500/20 text-blue-300';
    }
  };

  const getProcessingStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'processing':
        return 'En cours';
      case 'failed':
        return 'Échec';
      default:
        return 'En attente';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
              Cette page est réservée aux DevAdmin et SuperAdmin uniquement.
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🎬 Gestion des Médias et Communications
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-white/70">
                Gérez tous les contenus vidéo, images et messages pour les réseaux sociaux
              </p>
              {currentAdmin && (
                <Badge className="bg-purple-500/20 text-purple-300">
                  <Crown className="h-3 w-3 mr-1" />
                  {currentAdmin.name} - {currentAdmin.type || 'Admin'}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={loadMediaTemplates}
              variant="outline"
              className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Link href="/admin">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour Admin
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Statistiques rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Templates totaux</p>
                  <p className="text-xl font-bold text-white">{mediaTemplates.length}</p>
                  <p className="text-xs text-green-300">{mediaTemplates.filter(t => t.is_active).length} actifs</p>
                </div>
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Formats générés</p>
                  <p className="text-xl font-bold text-white">{platformFormats.length}</p>
                  <p className="text-xs text-blue-300">{platformFormats.filter(f => f.processing_status === 'completed').length} prêts</p>
                </div>
                <Layers className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Plateformes</p>
                  <p className="text-xl font-bold text-white">{Object.keys(platformSpecs).length}</p>
                  <p className="text-xs text-purple-300">Supportées</p>
                </div>
                <Globe className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">En traitement</p>
                  <p className="text-xl font-bold text-white">
                    {platformFormats.filter(f => f.processing_status === 'processing').length}
                  </p>
                  <p className="text-xs text-yellow-300">Formats</p>
                </div>
                <Zap className="h-6 w-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contenu principal avec onglets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList className="bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="templates">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="create">
                <Upload className="h-4 w-4 mr-2" />
                Créer
              </TabsTrigger>
              <TabsTrigger value="formats">
                <Layers className="h-4 w-4 mr-2" />
                Formats
              </TabsTrigger>
              <TabsTrigger value="platforms">
                <Settings className="h-4 w-4 mr-2" />
                Plateformes
              </TabsTrigger>
            </TabsList>

            {/* Onglet Templates existants */}
            <TabsContent value="templates">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Templates de médias ({mediaTemplates.length})</CardTitle>
                    <Button
                      onClick={() => {
                        const csvContent = mediaTemplates.map(t => 
                          `${t.template_name},${t.template_type},${t.category},${t.content_type},${t.is_active ? 'Actif' : 'Inactif'},${new Date(t.create_time).toLocaleDateString('fr-FR')}`
                        ).join('\n');
                        
                        const csvHeader = 'Nom,Type,Catégorie,Contenu,Statut,Créé le\n';
                        const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `templates-media-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        
                        toast.success('Export des templates terminé !');
                      }}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {mediaTemplates.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun template créé pour le moment</p>
                      <p className="text-sm">Créez votre premier template dans l'onglet "Créer"</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mediaTemplates.map((template, index) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-lg">
                              {getContentTypeIcon(template.content_type)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white">{template.template_name}</h3>
                                <Badge className="bg-blue-500/20 text-blue-300">
                                  {getTemplateTypeIcon(template.template_type)}
                                  <span className="ml-1">{getTemplateTypeText(template.template_type)}</span>
                                </Badge>
                                <Badge className="bg-purple-500/20 text-purple-300">
                                  {getCategoryIcon(template.category)}
                                  <span className="ml-1 capitalize">{template.category}</span>
                                </Badge>
                                <Badge className={template.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                                  {template.is_active ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-white/70">
                                <div>{template.description}</div>
                                <div className="flex items-center gap-4 mt-1">
                                  <span>Type: {template.content_type}</span>
                                  {template.file_size && (
                                    <span>Taille: {formatFileSize(template.file_size)}</span>
                                  )}
                                  <span>Créé le: {new Date(template.create_time).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handlePreviewTemplate(template)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handleAutoFormatForAllPlatforms(template.id)}
                              variant="ghost"
                              size="sm"
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                              disabled={isProcessingFormats}
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handleToggleTemplateStatus(template.id)}
                              variant="ghost"
                              size="sm"
                              className={template.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                            >
                              {template.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            
                            <Button
                              onClick={() => handleDeleteTemplate(template.id)}
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
            </TabsContent>

            {/* Onglet Création de template */}
            <TabsContent value="create">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Créer un nouveau template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTemplate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="template_name" className="text-white">
                          Nom du template *
                        </Label>
                        <Input
                          id="template_name"
                          value={newTemplate.template_name}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, template_name: e.target.value }))}
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                          placeholder="Ex: Vidéo invitation anniversaire"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template_type" className="text-white">
                          Type de template *
                        </Label>
                        <Select
                          value={newTemplate.template_type}
                          onValueChange={(value: MediaTemplate['template_type']) => 
                            setNewTemplate(prev => ({ ...prev, template_type: value }))
                          }
                        >
                          <SelectTrigger className="bg-white/10 border-white/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="social_share">
                              <div className="flex items-center gap-2">
                                <Share2 className="h-4 w-4" />
                                Partage social
                              </div>
                            </SelectItem>
                            <SelectItem value="invitation">
                              <div className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Invitation
                              </div>
                            </SelectItem>
                            <SelectItem value="sponsorship">
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4" />
                                Parrainage
                              </div>
                            </SelectItem>
                            <SelectItem value="notification">
                              <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Notification
                              </div>
                            </SelectItem>
                            <SelectItem value="birthday_greeting">
                              <div className="flex items-center gap-2">
                                <Gift className="h-4 w-4" />
                                Vœux d'anniversaire
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-white">
                          Plateforme cible *
                        </Label>
                        <Select
                          value={newTemplate.category}
                          onValueChange={(value: MediaTemplate['category']) => 
                            setNewTemplate(prev => ({ ...prev, category: value }))
                          }
                        >
                          <SelectTrigger className="bg-white/10 border-white/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Général (toutes plateformes)
                              </div>
                            </SelectItem>
                            <SelectItem value="facebook">
                              <div className="flex items-center gap-2">
                                <Facebook className="h-4 w-4" />
                                Facebook
                              </div>
                            </SelectItem>
                            <SelectItem value="instagram">
                              <div className="flex items-center gap-2">
                                <Instagram className="h-4 w-4" />
                                Instagram
                              </div>
                            </SelectItem>
                            <SelectItem value="whatsapp">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                WhatsApp
                              </div>
                            </SelectItem>
                            <SelectItem value="tiktok">
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                TikTok
                              </div>
                            </SelectItem>
                            <SelectItem value="snapchat">
                              <div className="flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                Snapchat
                              </div>
                            </SelectItem>
                            <SelectItem value="twitter">
                              <div className="flex items-center gap-2">
                                <Twitter className="h-4 w-4" />
                                Twitter
                              </div>
                            </SelectItem>
                            <SelectItem value="linkedin">
                              <div className="flex items-center gap-2">
                                <Linkedin className="h-4 w-4" />
                                LinkedIn
                              </div>
                            </SelectItem>
                            <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                              </div>
                            </SelectItem>
                            <SelectItem value="sms">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                SMS
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="content_type" className="text-white">
                          Type de contenu *
                        </Label>
                        <Select
                          value={newTemplate.content_type}
                          onValueChange={(value: MediaTemplate['content_type']) => 
                            setNewTemplate(prev => ({ ...prev, content_type: value }))
                          }
                        >
                          <SelectTrigger className="bg-white/10 border-white/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                Vidéo
                              </div>
                            </SelectItem>
                            <SelectItem value="image">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Image
                              </div>
                            </SelectItem>
                            <SelectItem value="text">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Texte
                              </div>
                            </SelectItem>
                            <SelectItem value="mixed">
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Mixte
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                        placeholder="Description du template"
                      />
                    </div>

                    {/* Upload de fichier pour vidéo/image */}
                    {(newTemplate.content_type === 'video' || newTemplate.content_type === 'image' || newTemplate.content_type === 'mixed') && (
                      <div className="space-y-2">
                        <Label htmlFor="file-upload" className="text-white">
                          Fichier média
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept={newTemplate.content_type === 'video' ? 'video/*' : newTemplate.content_type === 'image' ? 'image/*' : 'video/*,image/*'}
                          onChange={handleFileUpload}
                          disabled={isUploadingMedia}
                          className="bg-white/10 border-white/30 text-white cursor-pointer"
                        />
                        <p className="text-xs text-white/60">
                          Formats supportés : {newTemplate.content_type === 'video' ? 'MP4, MOV' : newTemplate.content_type === 'image' ? 'JPG, PNG, GIF' : 'MP4, MOV, JPG, PNG, GIF'} (max 100MB)
                        </p>
                      </div>
                    )}

                    {/* Contenu textuel */}
                    {(newTemplate.content_type === 'text' || newTemplate.content_type === 'mixed') && (
                      <div className="space-y-2">
                        <Label htmlFor="message_content" className="text-white">
                          Contenu du message
                        </Label>
                        <Textarea
                          id="message_content"
                          value={newTemplate.message_content}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, message_content: e.target.value }))}
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                          rows={4}
                          placeholder="Contenu du message avec variables : {user_name}, {birthday_date}, {pot_url}, etc."
                        />
                        <p className="text-xs text-white/60">
                          Variables disponibles : {'{user_name}'}, {'{birthday_date}'}, {'{pot_url}'}, {'{sponsor_name}'}, {'{invited_name}'}
                        </p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isUploadingMedia}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      {isUploadingMedia ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Créer le template
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Formats générés */}
            <TabsContent value="formats">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Formats générés automatiquement ({platformFormats.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {platformFormats.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun format généré pour le moment</p>
                      <p className="text-sm">Les formats seront créés automatiquement lors de l'upload de médias</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {platformFormats.map((format, index) => (
                        <motion.div
                          key={format.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-lg">
                              {getCategoryIcon(format.platform)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-white capitalize">
                                  {format.platform} - {format.format_type}
                                </h4>
                                <Badge className={getProcessingStatusColor(format.processing_status)}>
                                  {format.processing_status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                                  {format.processing_status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {format.processing_status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                                  {getProcessingStatusText(format.processing_status)}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-white/70">
                                <div className="flex items-center gap-4">
                                  {format.width && format.height && (
                                    <span>📐 {format.width}x{format.height}</span>
                                  )}
                                  {format.aspect_ratio && (
                                    <span>📏 {format.aspect_ratio}</span>
                                  )}
                                  {format.max_duration_seconds && (
                                    <span>⏱️ {format.max_duration_seconds}s max</span>
                                  )}
                                  {format.max_file_size_mb && (
                                    <span>💾 {format.max_file_size_mb}MB max</span>
                                  )}
                                </div>
                                {format.processing_error && (
                                  <div className="text-red-300 text-xs mt-1">
                                    Erreur: {format.processing_error}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {format.processing_status === 'completed' && (
                              <Button
                                onClick={() => handleDownloadFormat(format)}
                                variant="ghost"
                                size="sm"
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              onClick={() => {
                                toast.info(`Format ${format.platform} ${format.format_type}:\n- Dimensions: ${format.width}x${format.height}\n- Ratio: ${format.aspect_ratio}\n- Statut: ${getProcessingStatusText(format.processing_status)}`);
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-white/70 hover:text-white hover:bg-white/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Configuration des plateformes */}
            <TabsContent value="platforms">
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Spécifications des plateformes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Object.entries(platformSpecs).map(([platform, specs]) => (
                        <div key={platform} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center gap-2 mb-3">
                            {getCategoryIcon(platform)}
                            <h4 className="font-semibold text-white capitalize">{platform}</h4>
                          </div>
                          
                          <div className="space-y-2">
                            {Object.entries(specs).map(([formatType, spec]) => (
                              <div key={formatType} className="text-sm text-white/70 p-2 bg-white/5 rounded">
                                <div className="font-medium text-white capitalize mb-1">{formatType}</div>
                                <div className="space-y-1">
                                  <div>📐 {spec.width}x{spec.height} ({spec.aspect_ratio})</div>
                                  {spec.max_duration_seconds && (
                                    <div>⏱️ Durée max: {spec.max_duration_seconds}s</div>
                                  )}
                                  <div>💾 Taille max: {spec.max_size}MB</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Informations sur le formatage automatique */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      Formatage automatique
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Fonctionnalités :</h4>
                        <ul className="text-white/90 text-sm space-y-2">
                          <li>🎬 <strong>Redimensionnement automatique</strong> selon les spécifications</li>
                          <li>📐 <strong>Recadrage intelligent</strong> pour respecter les ratios</li>
                          <li>🎨 <strong>Optimisation qualité</strong> pour chaque plateforme</li>
                          <li>⚡ <strong>Compression adaptative</strong> selon les limites de taille</li>
                          <li>🔄 <strong>Conversion de format</strong> automatique</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">Plateformes supportées :</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.keys(platformSpecs).map((platform) => (
                            <div key={platform} className="flex items-center gap-2 p-2 bg-white/5 rounded text-sm">
                              {getCategoryIcon(platform)}
                              <span className="text-white/80 capitalize">{platform}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                      <div className="flex items-center gap-2 text-blue-300 mb-2">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium">Processus automatique :</span>
                      </div>
                      <div className="text-blue-200 text-sm space-y-1">
                        <p>1. <strong>Upload :</strong> Téléchargez votre fichier source (vidéo ou image)</p>
                        <p>2. <strong>Analyse :</strong> Le système analyse les dimensions et la qualité</p>
                        <p>3. <strong>Formatage :</strong> Génération automatique pour toutes les plateformes</p>
                        <p>4. <strong>Optimisation :</strong> Compression et ajustement selon les spécifications</p>
                        <p>5. <strong>Validation :</strong> Vérification de la conformité aux standards</p>
                        <p>6. <strong>Distribution :</strong> Fichiers prêts pour utilisation sur chaque réseau</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Dialog de prévisualisation */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Aperçu du template : {selectedTemplate?.template_name}</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informations :</h4>
                    <div className="space-y-2 text-sm">
                      <div>Type: {getTemplateTypeText(selectedTemplate.template_type)}</div>
                      <div>Plateforme: {selectedTemplate.category}</div>
                      <div>Contenu: {selectedTemplate.content_type}</div>
                      {selectedTemplate.file_size && (
                        <div>Taille: {formatFileSize(selectedTemplate.file_size)}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Aperçu :</h4>
                    {selectedTemplate.content_type === 'video' && (
                      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Aperçu vidéo</p>
                        </div>
                      </div>
                    )}
                    {selectedTemplate.content_type === 'image' && (
                      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Aperçu image</p>
                        </div>
                      </div>
                    )}
                    {selectedTemplate.message_content && (
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm">{selectedTemplate.message_content}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAutoFormatForAllPlatforms(selectedTemplate.id)}
                    disabled={isProcessingFormats}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Formater pour toutes les plateformes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTemplateDialog(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-purple-500/10 backdrop-blur-sm border-purple-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Video className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-semibold">Gestion Avancée des Médias WOLO</span>
              </div>
              <p className="text-white/60 text-sm">
                © 2025 WOLO SENEGAL® - From Connect Africa® —
                <br />
                🎬 <strong>Gestion centralisée</strong> de tous les contenus vidéo et messages
                <br />
                📱 <strong>Formatage automatique</strong> pour toutes les plateformes sociales
                <br />
                🎨 <strong>Optimisation intelligente</strong> selon les spécifications de chaque réseau
                <br />
                📊 <strong>Templates réutilisables</strong> pour invitations, parrainage et partages
                <br />
                🔧 <strong>Interface DevAdmin/SuperAdmin</strong> pour un contrôle total des communications
              </p>
            </CardContent>
          </Card>
        </motion.footer>
      </div>
    </div>
  );
}
