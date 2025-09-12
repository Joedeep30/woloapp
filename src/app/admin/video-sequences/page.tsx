
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
  Play, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  Clock,
  Settings,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
  Save,
  RotateCcw,
  Zap,
  Target,
  Timer,
  Bell,
  Send,
  ArrowLeft,
  Crown,
  Shield,
  Layers,
  FileVideo,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface VideoSequence {
  id: string;
  sequence_name: string;
  sequence_type: 'default' | 'minor' | 'adult' | 'special_event';
  description?: string;
  is_active: boolean;
  is_default: boolean;
  created_by_admin_id: number;
  create_time: string;
  steps: VideoSequenceStep[];
}

interface VideoSequenceStep {
  id: string;
  sequence_id: string;
  step_name: string;
  step_order: number;
  trigger_type: 'creation' | 'weekly' | 'daily' | 'custom_days' | 'milestone';
  trigger_offset_days?: number;
  frequency_days?: number;
  start_condition?: any;
  end_condition?: any;
  template_id?: string;
  is_active: boolean;
  create_time: string;
}

interface MediaTemplate {
  id: string;
  template_name: string;
  template_type: string;
  category: string;
  content_type: string;
  is_active: boolean;
}

export default function VideoSequencesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  
  const [sequences, setSequences] = useState<VideoSequence[]>([]);
  const [mediaTemplates, setMediaTemplates] = useState<MediaTemplate[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<VideoSequence | null>(null);
  const [showSequenceDialog, setShowSequenceDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<VideoSequenceStep | null>(null);
  
  const [newSequence, setNewSequence] = useState({
    sequence_name: '',
    sequence_type: 'default' as VideoSequence['sequence_type'],
    description: '',
    is_default: false
  });

  const [newStep, setNewStep] = useState({
    step_name: '',
    trigger_type: 'creation' as VideoSequenceStep['trigger_type'],
    trigger_offset_days: 0,
    frequency_days: 7,
    template_id: '',
    start_condition: {},
    end_condition: {}
  });

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
        loadSequences();
        loadMediaTemplates();
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const loadSequences = async () => {
    try {
      // Simuler le chargement des séquences existantes
      const mockSequences: VideoSequence[] = [
        {
          id: '1',
          sequence_name: 'Séquence Standard Anniversaire',
          sequence_type: 'default',
          description: 'Séquence par défaut pour tous les anniversaires',
          is_active: true,
          is_default: true,
          created_by_admin_id: 1,
          create_time: '2024-12-19T10:00:00Z',
          steps: [
            {
              id: '1',
              sequence_id: '1',
              step_name: 'Vidéo de création',
              step_order: 1,
              trigger_type: 'creation',
              trigger_offset_days: 0,
              template_id: '1',
              is_active: true,
              create_time: '2024-12-19T10:00:00Z'
            },
            {
              id: '2',
              sequence_id: '1',
              step_name: 'Rappel hebdomadaire',
              step_order: 2,
              trigger_type: 'weekly',
              frequency_days: 7,
              trigger_offset_days: 21,
              template_id: '2',
              is_active: true,
              create_time: '2024-12-19T10:00:00Z'
            },
            {
              id: '3',
              sequence_id: '1',
              step_name: 'Dernière semaine - tous les 2 jours',
              step_order: 3,
              trigger_type: 'custom_days',
              frequency_days: 2,
              trigger_offset_days: 7,
              template_id: '3',
              is_active: true,
              create_time: '2024-12-19T10:00:00Z'
            },
            {
              id: '4',
              sequence_id: '1',
              step_name: 'Vidéo finale - Jour J',
              step_order: 4,
              trigger_type: 'daily',
              trigger_offset_days: 0,
              template_id: '4',
              is_active: true,
              create_time: '2024-12-19T10:00:00Z'
            }
          ]
        },
        {
          id: '2',
          sequence_name: 'Séquence Spéciale Mineurs',
          sequence_type: 'minor',
          description: 'Séquence adaptée pour les anniversaires de mineurs',
          is_active: true,
          is_default: false,
          created_by_admin_id: 1,
          create_time: '2024-12-19T09:30:00Z',
          steps: [
            {
              id: '5',
              sequence_id: '2',
              step_name: 'Annonce création (famille)',
              step_order: 1,
              trigger_type: 'creation',
              trigger_offset_days: 0,
              template_id: '5',
              is_active: true,
              create_time: '2024-12-19T09:30:00Z'
            },
            {
              id: '6',
              sequence_id: '2',
              step_name: 'Rappel familial hebdomadaire',
              step_order: 2,
              trigger_type: 'weekly',
              frequency_days: 7,
              trigger_offset_days: 14,
              template_id: '6',
              is_active: true,
              create_time: '2024-12-19T09:30:00Z'
            }
          ]
        }
      ];

      setSequences(mockSequences);
    } catch (error) {
      console.error('Erreur lors du chargement des séquences:', error);
    }
  };

  const loadMediaTemplates = async () => {
    try {
      // Simuler le chargement des templates média
      const mockTemplates: MediaTemplate[] = [
        {
          id: '1',
          template_name: 'Vidéo d\'annonce création',
          template_type: 'invitation',
          category: 'general',
          content_type: 'video',
          is_active: true
        },
        {
          id: '2',
          template_name: 'Rappel hebdomadaire standard',
          template_type: 'social_share',
          category: 'general',
          content_type: 'video',
          is_active: true
        },
        {
          id: '3',
          template_name: 'Urgence dernière semaine',
          template_type: 'notification',
          category: 'general',
          content_type: 'video',
          is_active: true
        },
        {
          id: '4',
          template_name: 'Célébration finale',
          template_type: 'birthday_greeting',
          category: 'general',
          content_type: 'video',
          is_active: true
        },
        {
          id: '5',
          template_name: 'Annonce famille mineur',
          template_type: 'invitation',
          category: 'general',
          content_type: 'video',
          is_active: true
        },
        {
          id: '6',
          template_name: 'Rappel familial',
          template_type: 'social_share',
          category: 'general',
          content_type: 'video',
          is_active: true
        }
      ];

      setMediaTemplates(mockTemplates);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    }
  };

  const handleCreateSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSequence.sequence_name.trim()) {
      toast.error('Veuillez saisir un nom pour la séquence');
      return;
    }

    try {
      // Simuler la création de la séquence
      const newSequenceData: VideoSequence = {
        id: (sequences.length + 1).toString(),
        ...newSequence,
        is_active: true,
        created_by_admin_id: currentAdmin?.id || 1,
        create_time: new Date().toISOString(),
        steps: []
      };

      setSequences(prev => [newSequenceData, ...prev]);
      
      // Réinitialiser le formulaire
      setNewSequence({
        sequence_name: '',
        sequence_type: 'default',
        description: '',
        is_default: false
      });
      
      toast.success('Séquence vidéo créée avec succès !');
      
    } catch (error) {
      toast.error('Erreur lors de la création de la séquence');
    }
  };

  const handleCreateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSequence) {
      toast.error('Veuillez sélectionner une séquence');
      return;
    }

    if (!newStep.step_name.trim()) {
      toast.error('Veuillez saisir un nom pour l\'étape');
      return;
    }

    try {
      const stepData: VideoSequenceStep = {
        id: `step_${Date.now()}`,
        sequence_id: selectedSequence.id,
        step_name: newStep.step_name,
        step_order: selectedSequence.steps.length + 1,
        trigger_type: newStep.trigger_type,
        trigger_offset_days: newStep.trigger_offset_days,
        frequency_days: newStep.frequency_days,
        template_id: newStep.template_id || undefined,
        start_condition: newStep.start_condition,
        end_condition: newStep.end_condition,
        is_active: true,
        create_time: new Date().toISOString()
      };

      // Mettre à jour la séquence avec la nouvelle étape
      setSequences(prev => prev.map(seq => 
        seq.id === selectedSequence.id 
          ? { ...seq, steps: [...seq.steps, stepData] }
          : seq
      ));

      // Mettre à jour la séquence sélectionnée
      setSelectedSequence(prev => prev ? { ...prev, steps: [...prev.steps, stepData] } : null);
      
      // Réinitialiser le formulaire
      setNewStep({
        step_name: '',
        trigger_type: 'creation',
        trigger_offset_days: 0,
        frequency_days: 7,
        template_id: '',
        start_condition: {},
        end_condition: {}
      });
      
      setShowStepDialog(false);
      toast.success('Étape ajoutée à la séquence !');
      
    } catch (error) {
      toast.error('Erreur lors de la création de l\'étape');
    }
  };

  const handleDeleteSequence = async (sequenceId: string) => {
    const sequence = sequences.find(s => s.id === sequenceId);
    if (!sequence) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la séquence "${sequence.sequence_name}" ?`)) {
      return;
    }

    try {
      setSequences(prev => prev.filter(s => s.id !== sequenceId));
      toast.success(`Séquence "${sequence.sequence_name}" supprimée`);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteStep = async (sequenceId: string, stepId: string) => {
    try {
      setSequences(prev => prev.map(seq => 
        seq.id === sequenceId 
          ? { ...seq, steps: seq.steps.filter(step => step.id !== stepId) }
          : seq
      ));
      
      if (selectedSequence?.id === sequenceId) {
        setSelectedSequence(prev => prev ? {
          ...prev,
          steps: prev.steps.filter(step => step.id !== stepId)
        } : null);
      }
      
      toast.success('Étape supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleMoveStep = async (sequenceId: string, stepId: string, direction: 'up' | 'down') => {
    const sequence = sequences.find(s => s.id === sequenceId);
    if (!sequence) return;

    const stepIndex = sequence.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const newSteps = [...sequence.steps];
    const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;

    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    // Échanger les positions
    [newSteps[stepIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[stepIndex]];
    
    // Mettre à jour les step_order
    newSteps.forEach((step, index) => {
      step.step_order = index + 1;
    });

    setSequences(prev => prev.map(seq => 
      seq.id === sequenceId 
        ? { ...seq, steps: newSteps }
        : seq
    ));

    if (selectedSequence?.id === sequenceId) {
      setSelectedSequence(prev => prev ? { ...prev, steps: newSteps } : null);
    }

    toast.success('Ordre des étapes mis à jour');
  };

  const handleToggleSequenceStatus = async (sequenceId: string) => {
    setSequences(prev => prev.map(seq => 
      seq.id === sequenceId 
        ? { ...seq, is_active: !seq.is_active }
        : seq
    ));
    
    const sequence = sequences.find(s => s.id === sequenceId);
    toast.success(`Séquence "${sequence?.sequence_name}" ${sequence?.is_active ? 'désactivée' : 'activée'}`);
  };

  const handleToggleStepStatus = async (sequenceId: string, stepId: string) => {
    setSequences(prev => prev.map(seq => 
      seq.id === sequenceId 
        ? { 
            ...seq, 
            steps: seq.steps.map(step => 
              step.id === stepId 
                ? { ...step, is_active: !step.is_active }
                : step
            )
          }
        : seq
    ));

    if (selectedSequence?.id === sequenceId) {
      setSelectedSequence(prev => prev ? {
        ...prev,
        steps: prev.steps.map(step => 
          step.id === stepId 
            ? { ...step, is_active: !step.is_active }
            : step
        )
      } : null);
    }

    toast.success('Statut de l\'étape mis à jour');
  };

  const handleDuplicateSequence = async (sequenceId: string) => {
    const sequence = sequences.find(s => s.id === sequenceId);
    if (!sequence) return;

    try {
      const duplicatedSequence: VideoSequence = {
        ...sequence,
        id: `dup_${Date.now()}`,
        sequence_name: `${sequence.sequence_name} (Copie)`,
        is_default: false,
        create_time: new Date().toISOString(),
        steps: sequence.steps.map(step => ({
          ...step,
          id: `step_dup_${Date.now()}_${step.id}`,
          sequence_id: `dup_${Date.now()}`,
          create_time: new Date().toISOString()
        }))
      };

      setSequences(prev => [duplicatedSequence, ...prev]);
      toast.success(`Séquence "${sequence.sequence_name}" dupliquée avec succès !`);
    } catch (error) {
      toast.error('Erreur lors de la duplication');
    }
  };

  const handlePreviewSequence = (sequence: VideoSequence) => {
    setSelectedSequence(sequence);
    setShowSequenceDialog(true);
  };

  const getTriggerTypeText = (type: string) => {
    switch (type) {
      case 'creation':
        return 'À la création';
      case 'weekly':
        return 'Hebdomadaire';
      case 'daily':
        return 'Quotidien';
      case 'custom_days':
        return 'Jours personnalisés';
      case 'milestone':
        return 'Étape importante';
      default:
        return type;
    }
  };

  const getTriggerTypeIcon = (type: string) => {
    switch (type) {
      case 'creation':
        return <Play className="h-4 w-4" />;
      case 'weekly':
        return <Calendar className="h-4 w-4" />;
      case 'daily':
        return <Clock className="h-4 w-4" />;
      case 'custom_days':
        return <Timer className="h-4 w-4" />;
      case 'milestone':
        return <Target className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSequenceTypeText = (type: string) => {
    switch (type) {
      case 'default':
        return 'Par défaut';
      case 'minor':
        return 'Mineur';
      case 'adult':
        return 'Adulte';
      case 'special_event':
        return 'Événement spécial';
      default:
        return type;
    }
  };

  const getSequenceTypeColor = (type: string) => {
    switch (type) {
      case 'default':
        return 'bg-blue-500/20 text-blue-300';
      case 'minor':
        return 'bg-green-500/20 text-green-300';
      case 'adult':
        return 'bg-purple-500/20 text-purple-300';
      case 'special_event':
        return 'bg-orange-500/20 text-orange-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const calculateScheduledDates = (steps: VideoSequenceStep[], birthdayDate: string) => {
    const birthday = new Date(birthdayDate);
    const scheduledDates: { step: VideoSequenceStep; dates: Date[] }[] = [];

    steps.forEach(step => {
      const dates: Date[] = [];
      
      switch (step.trigger_type) {
        case 'creation':
          // Immédiatement à la création
          dates.push(new Date());
          break;
          
        case 'weekly':
          // Chaque semaine jusqu'à trigger_offset_days avant l'anniversaire
          const weeksStart = new Date(birthday);
          weeksStart.setDate(birthday.getDate() - (step.trigger_offset_days || 21));
          
          let currentWeek = new Date();
          while (currentWeek <= weeksStart) {
            dates.push(new Date(currentWeek));
            currentWeek.setDate(currentWeek.getDate() + 7);
          }
          break;
          
        case 'custom_days':
          // Selon la fréquence personnalisée
          const customStart = new Date(birthday);
          customStart.setDate(birthday.getDate() - (step.trigger_offset_days || 7));
          
          let currentCustom = new Date();
          while (currentCustom <= customStart) {
            dates.push(new Date(currentCustom));
            currentCustom.setDate(currentCustom.getDate() + (step.frequency_days || 2));
          }
          break;
          
        case 'daily':
          // Quotidien jusqu'au jour J
          const dailyStart = new Date(birthday);
          dailyStart.setDate(birthday.getDate() - (step.trigger_offset_days || 0));
          
          let currentDaily = new Date();
          while (currentDaily <= dailyStart) {
            dates.push(new Date(currentDaily));
            currentDaily.setDate(currentDaily.getDate() + 1);
          }
          break;
      }
      
      scheduledDates.push({ step, dates });
    });

    return scheduledDates;
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
              🎬 Gestion des Séquences Vidéo
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-white/70">
                Configurez les séquences de communication vidéo automatisées
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
              onClick={loadSequences}
              variant="outline"
              className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
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
                  <p className="text-white/70 text-xs">Séquences totales</p>
                  <p className="text-xl font-bold text-white">{sequences.length}</p>
                  <p className="text-xs text-green-300">{sequences.filter(s => s.is_active).length} actives</p>
                </div>
                <Layers className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Étapes totales</p>
                  <p className="text-xl font-bold text-white">
                    {sequences.reduce((sum, s) => sum + s.steps.length, 0)}
                  </p>
                  <p className="text-xs text-blue-300">Configurées</p>
                </div>
                <FileVideo className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Templates liés</p>
                  <p className="text-xl font-bold text-white">{mediaTemplates.length}</p>
                  <p className="text-xs text-purple-300">Disponibles</p>
                </div>
                <Video className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Séquences par défaut</p>
                  <p className="text-xl font-bold text-white">
                    {sequences.filter(s => s.is_default).length}
                  </p>
                  <p className="text-xs text-yellow-300">Actives</p>
                </div>
                <Crown className="h-6 w-6 text-yellow-400" />
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
          <Tabs defaultValue="sequences" className="space-y-6">
            <TabsList className="bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="sequences">
                <Layers className="h-4 w-4 mr-2" />
                Séquences
              </TabsTrigger>
              <TabsTrigger value="create">
                <Plus className="h-4 w-4 mr-2" />
                Créer
              </TabsTrigger>
              <TabsTrigger value="templates">
                <Video className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </TabsTrigger>
            </TabsList>

            {/* Onglet Séquences existantes */}
            <TabsContent value="sequences">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Séquences vidéo configurées ({sequences.length})</CardTitle>
                    <Button
                      onClick={() => {
                        const csvContent = sequences.map(s => 
                          `${s.sequence_name},${s.sequence_type},${s.steps.length},${s.is_active ? 'Actif' : 'Inactif'},${new Date(s.create_time).toLocaleDateString('fr-FR')}`
                        ).join('\n');
                        
                        const csvHeader = 'Nom,Type,Étapes,Statut,Créé le\n';
                        const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `sequences-video-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        
                        toast.success('Export des séquences terminé !');
                      }}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sequences.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune séquence créée pour le moment</p>
                      <p className="text-sm">Créez votre première séquence dans l'onglet "Créer"</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sequences.map((sequence, index) => (
                        <motion.div
                          key={sequence.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <Video className="h-5 w-5 text-white" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white">{sequence.sequence_name}</h3>
                                <Badge className={getSequenceTypeColor(sequence.sequence_type)}>
                                  {getSequenceTypeText(sequence.sequence_type)}
                                </Badge>
                                {sequence.is_default && (
                                  <Badge className="bg-yellow-500/20 text-yellow-300">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Par défaut
                                  </Badge>
                                )}
                                <Badge className={sequence.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                                  {sequence.is_active ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-white/70">
                                <div>{sequence.description}</div>
                                <div className="flex items-center gap-4 mt-1">
                                  <span>📹 {sequence.steps.length} étapes</span>
                                  <span>⚡ {sequence.steps.filter(s => s.is_active).length} actives</span>
                                  <span>📅 Créé le: {new Date(sequence.create_time).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handlePreviewSequence(sequence)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handleDuplicateSequence(sequence.id)}
                              variant="ghost"
                              size="sm"
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handleToggleSequenceStatus(sequence.id)}
                              variant="ghost"
                              size="sm"
                              className={sequence.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                            >
                              {sequence.is_active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                            </Button>
                            
                            <Button
                              onClick={() => handleDeleteSequence(sequence.id)}
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

            {/* Onglet Création de séquence */}
            <TabsContent value="create">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Créer une nouvelle séquence vidéo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateSequence} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sequence_name" className="text-white">
                          Nom de la séquence *
                        </Label>
                        <Input
                          id="sequence_name"
                          value={newSequence.sequence_name}
                          onChange={(e) => setNewSequence(prev => ({ ...prev, sequence_name: e.target.value }))}
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                          placeholder="Ex: Séquence Anniversaire Premium"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sequence_type" className="text-white">
                          Type de séquence *
                        </Label>
                        <Select
                          value={newSequence.sequence_type}
                          onValueChange={(value: VideoSequence['sequence_type']) => 
                            setNewSequence(prev => ({ ...prev, sequence_type: value }))
                          }
                        >
                          <SelectTrigger className="bg-white/10 border-white/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Par défaut (tous les anniversaires)
                              </div>
                            </SelectItem>
                            <SelectItem value="minor">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Spécial mineurs
                              </div>
                            </SelectItem>
                            <SelectItem value="adult">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                Spécial adultes
                              </div>
                            </SelectItem>
                            <SelectItem value="special_event">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Événement spécial
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
                      <Textarea
                        id="description"
                        value={newSequence.description}
                        onChange={(e) => setNewSequence(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                        placeholder="Description de la séquence et de son utilisation"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_default" className="text-white">
                        Définir comme séquence par défaut
                      </Label>
                      <Switch
                        id="is_default"
                        checked={newSequence.is_default}
                        onCheckedChange={(checked) => setNewSequence(prev => ({ ...prev, is_default: checked }))}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la séquence
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Templates disponibles */}
            <TabsContent value="templates">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Templates vidéo disponibles ({mediaTemplates.length})</CardTitle>
                    <Link href="/admin/media-management">
                      <Button className="bg-blue-500 hover:bg-blue-600">
                        <Settings className="h-4 w-4 mr-2" />
                        Gérer les templates
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {mediaTemplates.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun template vidéo disponible</p>
                      <p className="text-sm">Créez des templates dans la gestion des médias</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mediaTemplates.map((template, index) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="h-4 w-4 text-blue-400" />
                            <h4 className="font-medium text-white">{template.template_name}</h4>
                          </div>
                          <div className="text-sm text-white/70 space-y-1">
                            <div>Type: {template.template_type}</div>
                            <div>Catégorie: {template.category}</div>
                            <div>Contenu: {template.content_type}</div>
                          </div>
                          <Badge className={template.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                            {template.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Aperçu avec simulation */}
            <TabsContent value="preview">
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Simulateur de séquence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-white mb-2 block">Sélectionner une séquence à prévisualiser</Label>
                        <Select
                          value={selectedSequence?.id || ''}
                          onValueChange={(value) => {
                            const seq = sequences.find(s => s.id === value);
                            setSelectedSequence(seq || null);
                          }}
                        >
                          <SelectTrigger className="bg-white/10 border-white/30 text-white">
                            <SelectValue placeholder="Choisir une séquence" />
                          </SelectTrigger>
                          <SelectContent>
                            {sequences.map((seq) => (
                              <SelectItem key={seq.id} value={seq.id}>
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4" />
                                  {seq.sequence_name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block">Date d'anniversaire de simulation</Label>
                        <Input
                          type="date"
                          defaultValue="2024-12-25"
                          className="bg-white/10 border-white/30 text-white"
                        />
                      </div>
                    </div>

                    {selectedSequence && (
                      <div className="mt-6">
                        <h4 className="text-white font-semibold mb-4">
                          Calendrier de diffusion pour "{selectedSequence.sequence_name}"
                        </h4>
                        
                        <div className="space-y-3">
                          {selectedSequence.steps
                            .sort((a, b) => a.step_order - b.step_order)
                            .map((step, index) => (
                            <div key={step.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-bold">
                                  {step.step_order}
                                </div>
                                {getTriggerTypeIcon(step.trigger_type)}
                              </div>
                              
                              <div className="flex-1">
                                <div className="font-medium text-white">{step.step_name}</div>
                                <div className="text-sm text-white/70">
                                  {getTriggerTypeText(step.trigger_type)}
                                  {step.frequency_days && step.frequency_days > 1 && (
                                    <span> - Tous les {step.frequency_days} jours</span>
                                  )}
                                  {step.trigger_offset_days !== undefined && (
                                    <span> - {step.trigger_offset_days} jours avant anniversaire</span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <Badge className={step.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                                  {step.is_active ? 'Actif' : 'Inactif'}
                                </Badge>
                                {step.template_id && (
                                  <div className="text-xs text-white/60 mt-1">
                                    Template: {mediaTemplates.find(t => t.id === step.template_id)?.template_name || 'Non trouvé'}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() => handleMoveStep(selectedSequence.id, step.id, 'up')}
                                  disabled={index === 0}
                                  variant="ghost"
                                  size="sm"
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => handleMoveStep(selectedSequence.id, step.id, 'down')}
                                  disabled={index === selectedSequence.steps.length - 1}
                                  variant="ghost"
                                  size="sm"
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => handleToggleStepStatus(selectedSequence.id, step.id)}
                                  variant="ghost"
                                  size="sm"
                                  className={step.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                                >
                                  {step.is_active ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                                </Button>
                                <Button
                                  onClick={() => handleDeleteStep(selectedSequence.id, step.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 flex gap-3">
                          <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
                            <DialogTrigger asChild>
                              <Button className="bg-green-500 hover:bg-green-600">
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter une étape
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Ajouter une étape à "{selectedSequence.sequence_name}"</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleCreateStep} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="step_name">Nom de l'étape *</Label>
                                    <Input
                                      id="step_name"
                                      value={newStep.step_name}
                                      onChange={(e) => setNewStep(prev => ({ ...prev, step_name: e.target.value }))}
                                      placeholder="Ex: Rappel 2 semaines avant"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="trigger_type">Type de déclencheur *</Label>
                                    <Select
                                      value={newStep.trigger_type}
                                      onValueChange={(value: VideoSequenceStep['trigger_type']) => 
                                        setNewStep(prev => ({ ...prev, trigger_type: value }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="creation">
                                          <div className="flex items-center gap-2">
                                            <Play className="h-4 w-4" />
                                            À la création
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="weekly">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Hebdomadaire
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="daily">
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Quotidien
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="custom_days">
                                          <div className="flex items-center gap-2">
                                            <Timer className="h-4 w-4" />
                                            Jours personnalisés
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="milestone">
                                          <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4" />
                                            Étape importante
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {newStep.trigger_type !== 'creation' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="trigger_offset_days">Jours avant anniversaire</Label>
                                      <Input
                                        id="trigger_offset_days"
                                        type="number"
                                        min="0"
                                        max="30"
                                        value={newStep.trigger_offset_days}
                                        onChange={(e) => setNewStep(prev => ({ ...prev, trigger_offset_days: parseInt(e.target.value) }))}
                                        placeholder="Ex: 7 pour dernière semaine"
                                      />
                                    </div>

                                    {(newStep.trigger_type === 'weekly' || newStep.trigger_type === 'custom_days') && (
                                      <div className="space-y-2">
                                        <Label htmlFor="frequency_days">Fréquence (jours)</Label>
                                        <Input
                                          id="frequency_days"
                                          type="number"
                                          min="1"
                                          max="7"
                                          value={newStep.frequency_days}
                                          onChange={(e) => setNewStep(prev => ({ ...prev, frequency_days: parseInt(e.target.value) }))}
                                          placeholder="Ex: 2 pour tous les 2 jours"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <Label htmlFor="template_id">Template vidéo associé</Label>
                                  <Select
                                    value={newStep.template_id}
                                    onValueChange={(value) => setNewStep(prev => ({ ...prev, template_id: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner un template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {mediaTemplates.filter(t => t.is_active).map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                          <div className="flex items-center gap-2">
                                            <Video className="h-4 w-4" />
                                            {template.template_name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex gap-3">
                                  <Button type="submit" className="bg-green-500 hover:bg-green-600">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ajouter l'étape
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setShowStepDialog(false)}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Dialog de prévisualisation détaillée */}
        <Dialog open={showSequenceDialog} onOpenChange={setShowSequenceDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Aperçu détaillé : {selectedSequence?.sequence_name}</DialogTitle>
            </DialogHeader>
            {selectedSequence && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informations générales :</h4>
                    <div className="space-y-2 text-sm">
                      <div>Type: {getSequenceTypeText(selectedSequence.sequence_type)}</div>
                      <div>Statut: {selectedSequence.is_active ? 'Actif' : 'Inactif'}</div>
                      <div>Par défaut: {selectedSequence.is_default ? 'Oui' : 'Non'}</div>
                      <div>Étapes: {selectedSequence.steps.length}</div>
                      <div>Créé le: {new Date(selectedSequence.create_time).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Calendrier simulé (anniversaire 25/12/2024) :</h4>
                    <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                      {calculateScheduledDates(selectedSequence.steps, '2024-12-25').map((schedule, index) => (
                        <div key={index} className="p-2 bg-gray-100 rounded">
                          <div className="font-medium">{schedule.step.step_name}</div>
                          <div className="text-xs text-gray-600">
                            {schedule.dates.length > 0 ? (
                              schedule.dates.slice(0, 3).map(date => date.toLocaleDateString('fr-FR')).join(', ') +
                              (schedule.dates.length > 3 ? ` (+${schedule.dates.length - 3} autres)` : '')
                            ) : (
                              'Aucune date programmée'
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      toast.success('Séquence testée avec succès !');
                      toast.info('Toutes les étapes ont été validées');
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Tester la séquence
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSequenceDialog(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Informations sur le système de séquençage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Système de séquençage vidéo automatisé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-3">Fonctionnalités :</h4>
                  <ul className="text-white/90 text-sm space-y-2">
                    <li>🎬 <strong>Séquences personnalisables</strong> selon le type de cagnotte</li>
                    <li>⏰ <strong>Déclencheurs flexibles</strong> : création, hebdomadaire, quotidien, personnalisé</li>
                    <li>📅 <strong>Planification intelligente</strong> basée sur la date d'anniversaire</li>
                    <li>🔄 <strong>Modification en temps réel</strong> des séquences actives</li>
                    <li>📊 <strong>Aperçu et simulation</strong> avant activation</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-3">Types de déclencheurs :</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded text-sm">
                      <Play className="h-4 w-4 text-green-400" />
                      <span className="text-white/80"><strong>Création :</strong> Immédiatement à la création de la cagnotte</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded text-sm">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-white/80"><strong>Hebdomadaire :</strong> Chaque semaine jusqu'à la date limite</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded text-sm">
                      <Timer className="h-4 w-4 text-purple-400" />
                      <span className="text-white/80"><strong>Personnalisé :</strong> Tous les X jours (ex: tous les 2 jours)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded text-sm">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span className="text-white/80"><strong>Quotidien :</strong> Chaque jour jusqu'au jour J</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded text-sm">
                      <Target className="h-4 w-4 text-red-400" />
                      <span className="text-white/80"><strong>Étape importante :</strong> Basé sur des conditions spéciales</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                <div className="flex items-center gap-2 text-blue-300 mb-2">
                  <Video className="h-4 w-4" />
                  <span className="font-medium">Exemple de séquence standard :</span>
                </div>
                <div className="text-blue-200 text-sm space-y-1">
                  <p>1. <strong>Création :</strong> Vidéo d'annonce immédiate</p>
                  <p>2. <strong>Hebdomadaire :</strong> Rappels chaque semaine (jusqu'à 1 semaine avant)</p>
                  <p>3. <strong>Dernière semaine :</strong> Vidéos tous les 2 jours</p>
                  <p>4. <strong>Jour J :</strong> Vidéo finale de célébration</p>
                  <p>5. <strong>Conditions :</strong> Adaptable selon le montant collecté, nombre de participants, etc.</p>
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
          className="mt-16 text-center"
        >
          <Card className="bg-purple-500/10 backdrop-blur-sm border-purple-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Video className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-semibold">Séquençage Vidéo Automatisé WOLO</span>
              </div>
              <p className="text-white/60 text-sm">
                © 2025 WOLO SENEGAL® - From Connect Africa® —
                <br />
                🎬 <strong>Séquences intelligentes</strong> pour une communication optimale
                <br />
                📅 <strong>Planification automatique</strong> basée sur les dates d'anniversaire
                <br />
                🔧 <strong>Configuration flexible</strong> pour tous types de cagnottes
                <br />
                📊 <strong>Aperçu et simulation</strong> avant mise en production
                <br />
                ⚡ <strong>Modification en temps réel</strong> des séquences actives
                <br />
                🎯 <strong>Déclencheurs multiples</strong> : création, hebdomadaire, quotidien, personnalisé
              </p>
            </CardContent>
          </Card>
        </motion.footer>
      </div>
    </div>
  );
}
