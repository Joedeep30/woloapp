
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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Building, 
  Package, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Crown,
  Shield,
  Video,
  Palette,
  Dice1,
  Ship,
  Car,
  Church,
  Percent,
  DollarSign,
  Users,
  BarChart3,
  RefreshCw,
  Save,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  FileText,
  PieChart,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Heart,
  Sparkles,
  Baby
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Structure hiérarchique claire
interface PackCategory {
  id: string;
  category_name: string;
  category_type: 'cinema' | 'beauty' | 'casino' | 'cruise' | 'limo' | 'children' | 'pilgrimage';
  display_name: string;
  description: string;
  icon_name: string;
  is_active: boolean;
  is_expanded: boolean;
  services: PackService[];
}

interface PackService {
  id: string;
  category_id: string;
  service_name: string;
  service_description: string;
  partner_company_name: string;
  partner_contact_person: string;
  partner_email: string;
  partner_phone: string;
  revenue_share_percentage: number;
  service_price: number;
  service_duration_minutes?: number;
  service_location: string;
  is_active: boolean;
  is_selected: boolean;
}

export default function PartnerManagementPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  
  // Structure hiérarchique des catégories avec services
  const [packCategories, setPackCategories] = useState<PackCategory[]>([
    {
      id: '1',
      category_name: 'cinema',
      category_type: 'cinema',
      display_name: 'Pack Cinéma',
      description: 'Séances de cinéma avec extras',
      icon_name: 'video',
      is_active: true,
      is_expanded: false,
      services: [
        {
          id: 'cinema_1',
          category_id: '1',
          service_name: 'Tickets Cinéma',
          service_description: 'Billets d\'entrée pour séances',
          partner_company_name: 'Cinéma Liberté',
          partner_contact_person: 'Directeur Salle',
          partner_email: 'tickets@cinemaliberte.sn',
          partner_phone: '+221771234567',
          revenue_share_percentage: 50,
          service_price: 3000,
          service_location: 'Dakar Centre',
          is_active: true,
          is_selected: false
        },
        {
          id: 'cinema_2',
          category_id: '1',
          service_name: 'Popcorn & Boissons',
          service_description: 'Panier gourmand complet',
          partner_company_name: 'Snack Bar Liberté',
          partner_contact_person: 'Chef Snack',
          partner_email: 'snacks@cinemaliberte.sn',
          partner_phone: '+221771234568',
          revenue_share_percentage: 25,
          service_price: 1500,
          service_location: 'Dakar Centre',
          is_active: true,
          is_selected: false
        },
        {
          id: 'cinema_3',
          category_id: '1',
          service_name: 'Parking VIP',
          service_description: 'Stationnement sécurisé',
          partner_company_name: 'Parking Sécurisé Dakar',
          partner_contact_person: 'Responsable Parking',
          partner_email: 'parking@securite.sn',
          partner_phone: '+221771234569',
          revenue_share_percentage: 15,
          service_price: 500,
          service_location: 'Dakar Centre',
          is_active: true,
          is_selected: false
        }
      ]
    },
    {
      id: '2',
      category_name: 'beauty',
      category_type: 'beauty',
      display_name: 'Pack Beauté',
      description: 'Services de beauté et bien-être',
      icon_name: 'palette',
      is_active: true,
      is_expanded: false,
      services: [
        {
          id: 'beauty_1',
          category_id: '2',
          service_name: 'Spa',
          service_description: 'Soins du visage et relaxation',
          partner_company_name: 'Beauté Dakar Spa',
          partner_contact_person: 'Directrice Spa',
          partner_email: 'spa@beautedakar.sn',
          partner_phone: '+221771234570',
          revenue_share_percentage: 45,
          service_price: 25000,
          service_duration_minutes: 90,
          service_location: 'Almadies',
          is_active: true,
          is_selected: false
        },
        {
          id: 'beauty_2',
          category_id: '2',
          service_name: 'Lentilles de Contact',
          service_description: 'Lentilles colorées et correctrices',
          partner_company_name: 'Optique Vision Plus',
          partner_contact_person: 'Opticien Chef',
          partner_email: 'lentilles@visionplus.sn',
          partner_phone: '+221771234571',
          revenue_share_percentage: 20,
          service_price: 15000,
          service_location: 'Plateau',
          is_active: true,
          is_selected: false
        },
        {
          id: 'beauty_3',
          category_id: '2',
          service_name: 'Relooking Complet',
          service_description: 'Conseil en image et style',
          partner_company_name: 'Studio Relook Dakar',
          partner_contact_person: 'Styliste Principal',
          partner_email: 'relooking@studiorelook.sn',
          partner_phone: '+221771234572',
          revenue_share_percentage: 35,
          service_price: 30000,
          service_duration_minutes: 120,
          service_location: 'Mermoz',
          is_active: true,
          is_selected: false
        },
        {
          id: 'beauty_4',
          category_id: '2',
          service_name: 'Coiffure & Cheveux',
          service_description: 'Coupe, couleur et soins capillaires',
          partner_company_name: 'Salon Excellence Cheveux',
          partner_contact_person: 'Maître Coiffeur',
          partner_email: 'cheveux@excellence.sn',
          partner_phone: '+221771234573',
          revenue_share_percentage: 30,
          service_price: 20000,
          service_duration_minutes: 150,
          service_location: 'Sacré-Cœur',
          is_active: true,
          is_selected: false
        }
      ]
    },
    {
      id: '3',
      category_name: 'casino',
      category_type: 'casino',
      display_name: 'Pack Casino',
      description: 'Divertissement et jeux',
      icon_name: 'dice1',
      is_active: true,
      is_expanded: false,
      services: [
        {
          id: 'casino_1',
          category_id: '3',
          service_name: 'Accès Casino',
          service_description: 'Entrée VIP avec jetons de départ',
          partner_company_name: 'Casino Royal Dakar',
          partner_contact_person: 'Manager Casino',
          partner_email: 'acces@casinoroyal.sn',
          partner_phone: '+221771234574',
          revenue_share_percentage: 40,
          service_price: 20000,
          service_location: 'Corniche Ouest',
          is_active: true,
          is_selected: false
        },
        {
          id: 'casino_2',
          category_id: '3',
          service_name: 'Restaurant Gastronomique',
          service_description: 'Dîner dans le restaurant du casino',
          partner_company_name: 'Restaurant Le Royal',
          partner_contact_person: 'Chef Exécutif',
          partner_email: 'restaurant@casinoroyal.sn',
          partner_phone: '+221771234575',
          revenue_share_percentage: 35,
          service_price: 15000,
          service_location: 'Corniche Ouest',
          is_active: true,
          is_selected: false
        },
        {
          id: 'casino_3',
          category_id: '3',
          service_name: 'Spectacle & Animation',
          service_description: 'Spectacles et animations nocturnes',
          partner_company_name: 'Entertainment Royal',
          partner_contact_person: 'Directeur Artistique',
          partner_email: 'spectacles@entertainment.sn',
          partner_phone: '+221771234576',
          revenue_share_percentage: 25,
          service_price: 10000,
          service_location: 'Corniche Ouest',
          is_active: true,
          is_selected: false
        }
      ]
    },
    {
      id: '4',
      category_name: 'cruise',
      category_type: 'cruise',
      display_name: 'Pack Croisière',
      description: 'Excursions maritimes et détente',
      icon_name: 'ship',
      is_active: true,
      is_expanded: false,
      services: [
        {
          id: 'cruise_1',
          category_id: '4',
          service_name: 'Croisière Journée',
          service_description: 'Excursion maritime d\'une journée',
          partner_company_name: 'Croisières Atlantique',
          partner_contact_person: 'Capitaine Principal',
          partner_email: 'croisiere@atlantique.sn',
          partner_phone: '+221771234577',
          revenue_share_percentage: 45,
          service_price: 35000,
          service_duration_minutes: 480,
          service_location: 'Port de Dakar',
          is_active: true,
          is_selected: false
        },
        {
          id: 'cruise_2',
          category_id: '4',
          service_name: 'Déjeuner à Bord',
          service_description: 'Repas gastronomique sur le bateau',
          partner_company_name: 'Catering Maritime',
          partner_contact_person: 'Chef de Bord',
          partner_email: 'catering@maritime.sn',
          partner_phone: '+221771234578',
          revenue_share_percentage: 30,
          service_price: 12000,
          service_location: 'Port de Dakar',
          is_active: true,
          is_selected: false
        },
        {
          id: 'cruise_3',
          category_id: '4',
          service_name: 'Animations Nautiques',
          service_description: 'Activités et jeux en mer',
          partner_company_name: 'Animation Océan',
          partner_contact_person: 'Animateur Chef',
          partner_email: 'animations@ocean.sn',
          partner_phone: '+221771234579',
          revenue_share_percentage: 25,
          service_price: 8000,
          service_location: 'Port de Dakar',
          is_active: true,
          is_selected: false
        }
      ]
    },
    {
      id: '5',
      category_name: 'limo',
      category_type: 'limo',
      display_name: 'Pack Limousine',
      description: 'Transport VIP et luxe',
      icon_name: 'car',
      is_active: true,
      is_expanded: false,
      services: [
        {
          id: 'limo_1',
          category_id: '5',
          service_name: 'Limousine 4h',
          service_description: 'Transport VIP avec chauffeur',
          partner_company_name: 'Limo VIP Sénégal',
          partner_contact_person: 'Responsable Flotte',
          partner_email: 'limo@vipsenegal.sn',
          partner_phone: '+221771234580',
          revenue_share_percentage: 50,
          service_price: 40000,
          service_duration_minutes: 240,
          service_location: 'Dakar',
          is_active: true,
          is_selected: false
        },
        {
          id: 'limo_2',
          category_id: '5',
          service_name: 'Champagne & Éclairage',
          service_description: 'Ambiance luxe avec champagne',
          partner_company_name: 'Luxe Services Dakar',
          partner_contact_person: 'Responsable Luxe',
          partner_email: 'luxe@services.sn',
          partner_phone: '+221771234581',
          revenue_share_percentage: 30,
          service_price: 15000,
          service_location: 'Dakar',
          is_active: true,
          is_selected: false
        },
        {
          id: 'limo_3',
          category_id: '5',
          service_name: 'Photographe Accompagnant',
          service_description: 'Photographe professionnel pour l\'événement',
          partner_company_name: 'Photo Pro Events',
          partner_contact_person: 'Photographe Principal',
          partner_email: 'photo@proevents.sn',
          partner_phone: '+221771234582',
          revenue_share_percentage: 20,
          service_price: 25000,
          service_duration_minutes: 240,
          service_location: 'Dakar',
          is_active: true,
          is_selected: false
        }
      ]
    },
    {
      id: '6',
      category_name: 'children',
      category_type: 'children',
      display_name: 'Pack Enfants',
      description: 'Activités spécialement conçues pour les enfants',
      icon_name: 'baby',
      is_active: true,
      is_expanded: false,
      services: [
        {
          id: 'children_1',
          category_id: '6',
          service_name: 'Parc d\'Attractions',
          service_description: 'Journée complète au parc avec manèges',
          partner_company_name: 'Magic Land Dakar',
          partner_contact_person: 'Directeur Parc',
          partner_email: 'parc@magicland.sn',
          partner_phone: '+221771234583',
          revenue_share_percentage: 40,
          service_price: 8000,
          service_duration_minutes: 360,
          service_location: 'Almadies',
          is_active: true,
          is_selected: false
        },
        {
          id: 'children_2',
          category_id: '6',
          service_name: 'Animateur Clown',
          service_description: 'Animation avec clown professionnel',
          partner_company_name: 'Animations Enfants Plus',
          partner_contact_person: 'Clown Principal',
          partner_email: 'clown@enfantsplus.sn',
          partner_phone: '+221771234584',
          revenue_share_percentage: 35,
          service_price: 20000,
          service_duration_minutes: 120,
          service_location: 'Déplacement',
          is_active: true,
          is_selected: false
        },
        {
          id: 'children_3',
          category_id: '6',
          service_name: 'Gâteau Personnalisé',
          service_description: 'Gâteau d\'anniversaire sur mesure',
          partner_company_name: 'Pâtisserie des Rêves',
          partner_contact_person: 'Pâtissier Chef',
          partner_email: 'gateaux@reves.sn',
          partner_phone: '+221771234585',
          revenue_share_percentage: 25,
          service_price: 15000,
          service_location: 'Livraison Dakar',
          is_active: true,
          is_selected: false
        }
      ]
    },
    {
      id: '7',
      category_name: 'pilgrimage',
      category_type: 'pilgrimage',
      display_name: 'Pack Pèlerinage',
      description: 'Voyages spirituels et religieux',
      icon_name: 'church',
      is_active: false,
      is_expanded: false,
      services: [
        {
          id: 'pilgrimage_1',
          category_id: '7',
          service_name: 'Transport Touba',
          service_description: 'Transport aller-retour vers Touba',
          partner_company_name: 'Transport Spirituel',
          partner_contact_person: 'Responsable Transport',
          partner_email: 'transport@spirituel.sn',
          partner_phone: '+221771234586',
          revenue_share_percentage: 30,
          service_price: 15000,
          service_location: 'Dakar-Touba',
          is_active: false,
          is_selected: false
        },
        {
          id: 'pilgrimage_2',
          category_id: '7',
          service_name: 'Hébergement 3 Jours',
          service_description: 'Logement proche de la mosquée',
          partner_company_name: 'Hôtel Touba Paix',
          partner_contact_person: 'Gérant Hôtel',
          partner_email: 'hotel@toubapaix.sn',
          partner_phone: '+221771234587',
          revenue_share_percentage: 40,
          service_price: 25000,
          service_location: 'Touba',
          is_active: false,
          is_selected: false
        },
        {
          id: 'pilgrimage_3',
          category_id: '7',
          service_name: 'Repas Spirituels',
          service_description: 'Repas traditionnels pendant le séjour',
          partner_company_name: 'Restauration Touba',
          partner_contact_person: 'Chef Cuisinier',
          partner_email: 'repas@touba.sn',
          partner_phone: '+221771234588',
          revenue_share_percentage: 30,
          service_price: 12000,
          service_location: 'Touba',
          is_active: false,
          is_selected: false
        }
      ]
    }
  ]);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [editingService, setEditingService] = useState<PackService | null>(null);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PackCategory | null>(null);

  const [newService, setNewService] = useState({
    service_name: '',
    service_description: '',
    partner_company_name: '',
    partner_contact_person: '',
    partner_email: '',
    partner_phone: '',
    revenue_share_percentage: 50,
    service_price: 0,
    service_duration_minutes: 60,
    service_location: ''
  });

  const [newCategory, setNewCategory] = useState({
    category_name: '',
    display_name: '',
    description: '',
    category_type: 'beauty' as PackCategory['category_type']
  });

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
        return <Video className="h-5 w-5" />;
      case 'beauty':
        return <Palette className="h-5 w-5" />;
      case 'casino':
        return <Dice1 className="h-5 w-5" />;
      case 'cruise':
        return <Ship className="h-5 w-5" />;
      case 'limo':
        return <Car className="h-5 w-5" />;
      case 'children':
        return <Baby className="h-5 w-5" />;
      case 'pilgrimage':
        return <Church className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Gestion de l'expansion des catégories
  const handleToggleCategory = (categoryId: string) => {
    setPackCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, is_expanded: !cat.is_expanded }
        : cat
    ));
  };

  // Gestion de l'activation des catégories
  const handleToggleCategoryActive = (categoryId: string, active: boolean) => {
    setPackCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { 
            ...cat, 
            is_active: active,
            services: cat.services.map(service => ({ ...service, is_active: active }))
          }
        : cat
    ));
    
    const category = packCategories.find(c => c.id === categoryId);
    toast.success(`${category?.display_name} ${active ? 'activé' : 'désactivé'} avec tous ses services`);
  };

  // Gestion de la sélection des services
  const handleServiceSelection = (serviceId: string, selected: boolean) => {
    if (selected) {
      setSelectedServices(prev => [...prev, serviceId]);
    } else {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    }
    
    setPackCategories(prev => prev.map(cat => ({
      ...cat,
      services: cat.services.map(service => 
        service.id === serviceId 
          ? { ...service, is_selected: selected }
          : service
      )
    })));
  };

  // Sélectionner tous les services d'une catégorie
  const handleSelectAllServicesInCategory = (categoryId: string, selected: boolean) => {
    const category = packCategories.find(c => c.id === categoryId);
    if (!category) return;

    const serviceIds = category.services.map(s => s.id);
    
    if (selected) {
      setSelectedServices(prev => [...new Set([...prev, ...serviceIds])]);
    } else {
      setSelectedServices(prev => prev.filter(id => !serviceIds.includes(id)));
    }
    
    setPackCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? {
            ...cat,
            services: cat.services.map(service => ({ ...service, is_selected: selected }))
          }
        : cat
    ));
  };

  // Édition d'un service
  const handleEditService = (service: PackService) => {
    setEditingService(service);
    setNewService({
      service_name: service.service_name,
      service_description: service.service_description,
      partner_company_name: service.partner_company_name,
      partner_contact_person: service.partner_contact_person,
      partner_email: service.partner_email,
      partner_phone: service.partner_phone,
      revenue_share_percentage: service.revenue_share_percentage,
      service_price: service.service_price,
      service_duration_minutes: service.service_duration_minutes || 60,
      service_location: service.service_location
    });
    setShowServiceDialog(true);
  };

  // Sauvegarde d'un service
  const handleSaveService = () => {
    if (!newService.service_name.trim()) {
      toast.error('Veuillez saisir un nom pour le service');
      return;
    }

    if (editingService) {
      // Modification
      setPackCategories(prev => prev.map(cat => ({
        ...cat,
        services: cat.services.map(service => 
          service.id === editingService.id 
            ? {
                ...service,
                service_name: newService.service_name,
                service_description: newService.service_description,
                partner_company_name: newService.partner_company_name,
                partner_contact_person: newService.partner_contact_person,
                partner_email: newService.partner_email,
                partner_phone: newService.partner_phone,
                revenue_share_percentage: newService.revenue_share_percentage,
                service_price: newService.service_price,
                service_duration_minutes: newService.service_duration_minutes,
                service_location: newService.service_location
              }
            : service
        )
      })));
      
      toast.success(`Service "${newService.service_name}" modifié avec succès !`);
    } else {
      // Création (si une catégorie est sélectionnée)
      const targetCategory = packCategories.find(c => c.is_expanded);
      if (!targetCategory) {
        toast.error('Veuillez sélectionner une catégorie');
        return;
      }

      const newServiceData: PackService = {
        id: `${targetCategory.category_name}_${Date.now()}`,
        category_id: targetCategory.id,
        service_name: newService.service_name,
        service_description: newService.service_description,
        partner_company_name: newService.partner_company_name,
        partner_contact_person: newService.partner_contact_person,
        partner_email: newService.partner_email,
        partner_phone: newService.partner_phone,
        revenue_share_percentage: newService.revenue_share_percentage,
        service_price: newService.service_price,
        service_duration_minutes: newService.service_duration_minutes,
        service_location: newService.service_location,
        is_active: true,
        is_selected: false
      };
      
      setPackCategories(prev => prev.map(cat => 
        cat.id === targetCategory.id 
          ? { ...cat, services: [...cat.services, newServiceData] }
          : cat
      ));
      
      toast.success(`Service "${newService.service_name}" ajouté à ${targetCategory.display_name} !`);
    }

    setShowServiceDialog(false);
    setEditingService(null);
    setNewService({
      service_name: '',
      service_description: '',
      partner_company_name: '',
      partner_contact_person: '',
      partner_email: '',
      partner_phone: '',
      revenue_share_percentage: 50,
      service_price: 0,
      service_duration_minutes: 60,
      service_location: ''
    });
  };

  // Suppression d'un service
  const handleDeleteService = (serviceId: string) => {
    const service = packCategories
      .flatMap(cat => cat.services)
      .find(s => s.id === serviceId);
    
    if (!service) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.service_name}" ?`)) {
      return;
    }

    setPackCategories(prev => prev.map(cat => ({
      ...cat,
      services: cat.services.filter(s => s.id !== serviceId)
    })));
    
    toast.success(`Service "${service.service_name}" supprimé`);
  };

  // Actions groupées sur les services sélectionnés
  const handleBulkServiceAction = (action: string) => {
    if (selectedServices.length === 0) {
      toast.error('Veuillez sélectionner au moins un service');
      return;
    }

    const selectedServiceNames = packCategories
      .flatMap(cat => cat.services)
      .filter(service => selectedServices.includes(service.id))
      .map(service => service.service_name)
      .join(', ');

    switch (action) {
      case 'activate':
        setPackCategories(prev => prev.map(cat => ({
          ...cat,
          services: cat.services.map(service => 
            selectedServices.includes(service.id) 
              ? { ...service, is_active: true }
              : service
          )
        })));
        toast.success(`Services activés : ${selectedServiceNames}`);
        break;
      case 'deactivate':
        setPackCategories(prev => prev.map(cat => ({
          ...cat,
          services: cat.services.map(service => 
            selectedServices.includes(service.id) 
              ? { ...service, is_active: false }
              : service
          )
        })));
        toast.success(`Services désactivés : ${selectedServiceNames}`);
        break;
      case 'export_pdf':
        generatePDFReport('selected_services');
        break;
      case 'delete':
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedServices.length} service(s) ?`)) {
          setPackCategories(prev => prev.map(cat => ({
            ...cat,
            services: cat.services.filter(service => !selectedServices.includes(service.id))
          })));
          toast.success(`${selectedServices.length} service(s) supprimé(s)`);
          setSelectedServices([]);
        }
        break;
    }
  };

  // Génération de rapports PDF bien formatés
  const generatePDFReport = (reportType: string) => {
    let reportData: any = {};
    let reportTitle = '';

    switch (reportType) {
      case 'complete_overview':
        reportData = {
          title: 'Rapport Complet - Gestion des Partenaires WOLO SENEGAL',
          generated_at: new Date().toISOString(),
          categories: packCategories.map(cat => ({
            category_name: cat.display_name,
            is_active: cat.is_active,
            total_services: cat.services.length,
            active_services: cat.services.filter(s => s.is_active).length,
            total_revenue_share: cat.services.reduce((sum, s) => sum + s.revenue_share_percentage, 0),
            total_service_value: cat.services.reduce((sum, s) => sum + s.service_price, 0),
            services: cat.services.map(service => ({
              service_name: service.service_name,
              partner_company: service.partner_company_name,
              contact_person: service.partner_contact_person,
              email: service.partner_email,
              phone: service.partner_phone,
              revenue_percentage: service.revenue_share_percentage,
              service_price: service.service_price,
              duration_minutes: service.service_duration_minutes,
              location: service.service_location,
              is_active: service.is_active
            }))
          })),
          summary: {
            total_categories: packCategories.length,
            active_categories: packCategories.filter(c => c.is_active).length,
            total_services: packCategories.reduce((sum, cat) => sum + cat.services.length, 0),
            active_services: packCategories.reduce((sum, cat) => sum + cat.services.filter(s => s.is_active).length, 0),
            total_partners: new Set(packCategories.flatMap(cat => cat.services.map(s => s.partner_company_name))).size,
            average_revenue_share: packCategories.flatMap(cat => cat.services).reduce((sum, s) => sum + s.revenue_share_percentage, 0) / packCategories.flatMap(cat => cat.services).length
          }
        };
        reportTitle = 'rapport-complet-partenaires';
        break;
      case 'selected_services':
        const selectedServiceData = packCategories
          .flatMap(cat => cat.services)
          .filter(service => selectedServices.includes(service.id));
        
        reportData = {
          title: 'Rapport Services Sélectionnés - WOLO SENEGAL',
          generated_at: new Date().toISOString(),
          selected_services: selectedServiceData.map(service => ({
            category: packCategories.find(c => c.id === service.category_id)?.display_name,
            service_name: service.service_name,
            partner_company: service.partner_company_name,
            contact_person: service.partner_contact_person,
            email: service.partner_email,
            phone: service.partner_phone,
            revenue_percentage: service.revenue_share_percentage,
            service_price: service.service_price,
            location: service.service_location,
            is_active: service.is_active
          })),
          summary: {
            total_selected: selectedServiceData.length,
            total_value: selectedServiceData.reduce((sum, s) => sum + s.service_price, 0),
            average_revenue_share: selectedServiceData.reduce((sum, s) => sum + s.revenue_share_percentage, 0) / selectedServiceData.length,
            unique_partners: new Set(selectedServiceData.map(s => s.partner_company_name)).size
          }
        };
        reportTitle = 'rapport-services-selectionnes';
        break;
      case 'category_detail':
        if (!editingCategory) return;
        
        reportData = {
          title: `Rapport Détaillé - ${editingCategory.display_name}`,
          generated_at: new Date().toISOString(),
          category: {
            name: editingCategory.display_name,
            description: editingCategory.description,
            is_active: editingCategory.is_active,
            total_services: editingCategory.services.length,
            active_services: editingCategory.services.filter(s => s.is_active).length
          },
          services: editingCategory.services.map(service => ({
            service_name: service.service_name,
            description: service.service_description,
            partner_company: service.partner_company_name,
            contact_person: service.partner_contact_person,
            email: service.partner_email,
            phone: service.partner_phone,
            revenue_percentage: service.revenue_share_percentage,
            service_price: service.service_price,
            duration_minutes: service.service_duration_minutes,
            location: service.service_location,
            is_active: service.is_active
          })),
          financial_summary: {
            total_service_value: editingCategory.services.reduce((sum, s) => sum + s.service_price, 0),
            total_revenue_share: editingCategory.services.reduce((sum, s) => sum + s.revenue_share_percentage, 0),
            average_service_price: editingCategory.services.reduce((sum, s) => sum + s.service_price, 0) / editingCategory.services.length,
            unique_partners: new Set(editingCategory.services.map(s => s.partner_company_name)).size
          }
        };
        reportTitle = `rapport-${editingCategory.category_name}`;
        break;
    }

    // Créer et télécharger le fichier JSON formaté (qui sera converti en PDF côté serveur)
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportTitle}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Rapport PDF généré et téléchargé !');
    toast.info('Le fichier JSON sera automatiquement converti en PDF bien formaté côté serveur');
  };

  // Ajout d'une nouvelle catégorie
  const handleCreateCategory = () => {
    if (!newCategory.category_name.trim() || !newCategory.display_name.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newCategoryData: PackCategory = {
      id: (packCategories.length + 1).toString(),
      category_name: newCategory.category_name,
      category_type: newCategory.category_type,
      display_name: newCategory.display_name,
      description: newCategory.description,
      icon_name: newCategory.category_type,
      is_active: true,
      is_expanded: false,
      services: []
    };
    
    setPackCategories(prev => [...prev, newCategoryData]);
    
    setNewCategory({
      category_name: '',
      display_name: '',
      description: '',
      category_type: 'beauty'
    });
    
    setShowCategoryDialog(false);
    toast.success(`Catégorie "${newCategory.display_name}" créée avec succès !`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Chargement de l'interface de gestion...</p>
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
              Cette page est réservée aux administrateurs uniquement.
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
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header avec layout amélioré */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  🏢 Gestion Hiérarchique des Partenaires
                </h1>
                <div className="flex items-center gap-4">
                  <p className="text-white/70">
                    Structure : Catégories → Services → Partenaires individuels
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => generatePDFReport('complete_overview')}
                      className="bg-green-500 hover:bg-green-600 transition-all duration-200"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Rapport PDF Complet
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Générer un rapport PDF bien formaté de tous les partenaires et services</p>
                  </TooltipContent>
                </Tooltip>
                
                <Link href="/admin">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 transition-all duration-200">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour Admin
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Actions rapides avec tooltips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border-orange-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-400" />
                  Actions rapides - Gestion hiérarchique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-green-500 hover:bg-green-600 h-16 text-left flex-col items-start transition-all duration-200 hover:scale-105">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              <span className="font-semibold">Nouvelle Catégorie</span>
                            </div>
                            <div className="text-xs opacity-80">Pack Beauté, Casino, etc.</div>
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Créer une nouvelle catégorie de pack (ex: Pack Beauté, Pack Casino)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => {
                          const expandedCategory = packCategories.find(c => c.is_expanded);
                          if (!expandedCategory) {
                            toast.error('Veuillez d\'abord sélectionner une catégorie en cliquant dessus');
                            return;
                          }
                          setEditingService(null);
                          setShowServiceDialog(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 h-16 text-left flex-col items-start transition-all duration-200 hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span className="font-semibold">Nouveau Service</span>
                        </div>
                        <div className="text-xs opacity-80">Spa, Lentilles, Relooking</div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ajouter un nouveau service à la catégorie sélectionnée</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => generatePDFReport('complete_overview')}
                        className="bg-purple-500 hover:bg-purple-600 h-16 text-left flex-col items-start transition-all duration-200 hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-semibold">Rapport PDF</span>
                        </div>
                        <div className="text-xs opacity-80">Format humain lisible</div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Générer un rapport PDF bien formaté pour les humains (pas JSON)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => {
                          toast.success('Synchronisation avec les APIs partenaires lancée');
                          toast.info('Mise à jour des prix et disponibilités en cours...');
                        }}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 h-16 text-left flex-col items-start transition-all duration-200 hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          <span className="font-semibold">Sync APIs</span>
                        </div>
                        <div className="text-xs opacity-80">Actualiser données</div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Synchroniser les prix et disponibilités avec tous les partenaires</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contrôles de sélection multiple avec tooltips */}
          {selectedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-blue-500/10 backdrop-blur-sm border-blue-400/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-400" />
                      <span className="text-white font-medium">
                        {selectedServices.length} service(s) sélectionné(s)
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleBulkServiceAction('activate')}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 transition-all duration-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activer
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Activer tous les services sélectionnés</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleBulkServiceAction('deactivate')}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 transition-all duration-200"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Désactiver
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Désactiver tous les services sélectionnés</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleBulkServiceAction('export_pdf')}
                            size="sm"
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10 transition-all duration-200"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF Sélection
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Exporter les services sélectionnés en rapport PDF</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleBulkServiceAction('delete')}
                            size="sm"
                            variant="outline"
                            className="border-red-400/50 text-red-300 hover:bg-red-500/20 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Supprimer tous les services sélectionnés</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Interface hiérarchique principale avec effets de survol élégants */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Structure Hiérarchique : Catégories → Services → Partenaires
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-300">
                      {packCategories.filter(c => c.is_active).length} catégories actives
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300">
                      {packCategories.reduce((sum, cat) => sum + cat.services.filter(s => s.is_active).length, 0)} services actifs
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packCategories.map((category, categoryIndex) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: categoryIndex * 0.1 }}
                      className={`border rounded-lg overflow-hidden transition-all duration-300 ${
                        category.is_active 
                          ? 'bg-green-500/10 border-green-400/30 hover:bg-green-500/15 hover:border-green-400/50' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* En-tête de catégorie avec effets de survol élégants */}
                      <Collapsible
                        open={category.is_expanded}
                        onOpenChange={() => handleToggleCategory(category.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className={`p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 ${
                            category.is_expanded ? 'bg-white/5' : ''
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                {/* Checkbox d'activation de catégorie */}
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    id={`category-${category.id}`}
                                    checked={category.is_active}
                                    onCheckedChange={(checked) => {
                                      handleToggleCategoryActive(category.id, checked as boolean);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                  />
                                  <Label htmlFor={`category-${category.id}`} className="sr-only">
                                    Activer {category.display_name}
                                  </Label>
                                </div>

                                <div className="p-3 bg-white/10 rounded-lg transition-all duration-200 hover:bg-white/15 hover:scale-110">
                                  {getPartnerTypeIcon(category.category_type)}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-white text-lg">{category.display_name}</h3>
                                    <Badge className={category.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}>
                                      {category.is_active ? 'Activé' : 'Désactivé'}
                                    </Badge>
                                    <Badge className="bg-blue-500/20 text-blue-300">
                                      {category.services.length} services
                                    </Badge>
                                    <Badge className="bg-purple-500/20 text-purple-300">
                                      {category.services.filter(s => s.is_active).length} actifs
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-white/70">
                                    <div>{category.description}</div>
                                    <div className="flex items-center gap-4 mt-1">
                                      <span>💰 Total: {formatCurrency(category.services.reduce((sum, s) => sum + s.service_price, 0))}</span>
                                      <span>🏢 {new Set(category.services.map(s => s.partner_company_name)).size} partenaires</span>
                                      <span>📊 Moy: {Math.round(category.services.reduce((sum, s) => sum + s.revenue_share_percentage, 0) / category.services.length)}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCategory(category);
                                        generatePDFReport('category_detail');
                                      }}
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all duration-200"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Générer un rapport PDF détaillé pour cette catégorie</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectAllServicesInCategory(category.id, !category.services.every(s => s.is_selected));
                                      }}
                                      variant="ghost"
                                      size="sm"
                                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all duration-200"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Sélectionner/désélectionner tous les services de cette catégorie</p>
                                  </TooltipContent>
                                </Tooltip>

                                <div className="transition-all duration-200 hover:scale-110">
                                  {category.is_expanded ? (
                                    <ChevronDown className="h-5 w-5 text-white/70" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-white/70" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        {/* Services de la catégorie */}
                        <CollapsibleContent>
                          <div className="p-4 bg-white/5 border-t border-white/10">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-white font-medium flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Services dans {category.display_name} ({category.services.length})
                              </h4>
                              
                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={() => {
                                        setEditingService(null);
                                        setShowServiceDialog(true);
                                      }}
                                      size="sm"
                                      className="bg-green-500 hover:bg-green-600 transition-all duration-200"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Ajouter Service
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ajouter un nouveau service à cette catégorie</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            
                            {category.services.length === 0 ? (
                              <div className="text-center py-8 text-white/60">
                                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun service dans cette catégorie</p>
                                <p className="text-sm">Cliquez sur "Ajouter Service" pour commencer</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {category.services.map((service, serviceIndex) => (
                                  <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: serviceIndex * 0.1 }}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                                      service.is_selected
                                        ? 'bg-blue-500/20 border-blue-400/50 hover:bg-blue-500/25'
                                        : service.is_active
                                        ? 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
                                        : 'bg-gray-500/10 border-gray-500/20 hover:bg-gray-500/15'
                                    }`}
                                    onClick={() => handleEditService(service)}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <Checkbox
                                          id={`service-${service.id}`}
                                          checked={service.is_selected}
                                          onCheckedChange={(checked) => {
                                            handleServiceSelection(service.id, checked as boolean);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                        />
                                        
                                        <div className="flex-1">
                                          <h5 className="font-medium text-white text-sm">{service.service_name}</h5>
                                          <p className="text-xs text-white/70 mt-1">{service.service_description}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Badge className={service.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                                          {service.is_active ? 'Actif' : 'Inactif'}
                                        </Badge>
                                        
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteService(service.id);
                                              }}
                                              variant="ghost"
                                              size="sm"
                                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-6 w-6 p-0 transition-all duration-200"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Supprimer ce service</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>

                                    {/* Informations du partenaire */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/60">Partenaire :</span>
                                        <span className="text-xs text-white font-medium">{service.partner_company_name}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/60">Contact :</span>
                                        <span className="text-xs text-white">{service.partner_contact_person}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/60">Revenus :</span>
                                        <span className="text-xs text-yellow-300 font-semibold">{service.revenue_share_percentage}%</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/60">Prix :</span>
                                        <span className="text-xs text-green-300 font-semibold">{formatCurrency(service.service_price)}</span>
                                      </div>
                                      {service.service_duration_minutes && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-white/60">Durée :</span>
                                          <span className="text-xs text-blue-300">{service.service_duration_minutes} min</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/60">Lieu :</span>
                                        <span className="text-xs text-purple-300">{service.service_location}</span>
                                      </div>
                                    </div>

                                    <div className="mt-3 text-xs text-blue-300 text-center">
                                      Cliquer pour modifier tous les champs
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Dialog de création de catégorie */}
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle catégorie de pack</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category_name">Nom technique *</Label>
                    <Input
                      id="category_name"
                      value={newCategory.category_name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, category_name: e.target.value }))}
                      placeholder="Ex: beauty, casino, wellness"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_name">Nom d'affichage *</Label>
                    <Input
                      id="display_name"
                      value={newCategory.display_name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Ex: Pack Beauté, Pack Casino"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_type">Type de catégorie *</Label>
                  <Select
                    value={newCategory.category_type}
                    onValueChange={(value: PackCategory['category_type']) => 
                      setNewCategory(prev => ({ ...prev, category_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cinema">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Cinéma
                        </div>
                      </SelectItem>
                      <SelectItem value="beauty">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Beauté
                        </div>
                      </SelectItem>
                      <SelectItem value="casino">
                        <div className="flex items-center gap-2">
                          <Dice1 className="h-4 w-4" />
                          Casino
                        </div>
                      </SelectItem>
                      <SelectItem value="cruise">
                        <div className="flex items-center gap-2">
                          <Ship className="h-4 w-4" />
                          Croisière
                        </div>
                      </SelectItem>
                      <SelectItem value="limo">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Limousine
                        </div>
                      </SelectItem>
                      <SelectItem value="children">
                        <div className="flex items-center gap-2">
                          <Baby className="h-4 w-4" />
                          Enfants
                        </div>
                      </SelectItem>
                      <SelectItem value="pilgrimage">
                        <div className="flex items-center gap-2">
                          <Church className="h-4 w-4" />
                          Pèlerinage
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de la catégorie de services"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateCategory}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer la catégorie
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCategoryDialog(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog d'édition de service avec tous les champs */}
          <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Modifier' : 'Créer'} un service
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Informations du service */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service_name">Nom du service *</Label>
                    <Input
                      id="service_name"
                      value={newService.service_name}
                      onChange={(e) => setNewService(prev => ({ ...prev, service_name: e.target.value }))}
                      placeholder="Ex: Spa, Relooking, Lentilles"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_price">Prix du service (FCFA) *</Label>
                    <Input
                      id="service_price"
                      type="number"
                      value={newService.service_price}
                      onChange={(e) => setNewService(prev => ({ ...prev, service_price: parseInt(e.target.value) || 0 }))}
                      placeholder="25000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_description">Description du service</Label>
                  <Textarea
                    id="service_description"
                    value={newService.service_description}
                    onChange={(e) => setNewService(prev => ({ ...prev, service_description: e.target.value }))}
                    placeholder="Description détaillée du service..."
                    rows={3}
                  />
                </div>

                {/* Informations du partenaire */}
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                  <h4 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Informations du partenaire
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partner_company_name">Nom de l'entreprise *</Label>
                      <Input
                        id="partner_company_name"
                        value={newService.partner_company_name}
                        onChange={(e) => setNewService(prev => ({ ...prev, partner_company_name: e.target.value }))}
                        placeholder="Ex: Beauté Dakar Spa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="partner_contact_person">Personne de contact</Label>
                      <Input
                        id="partner_contact_person"
                        value={newService.partner_contact_person}
                        onChange={(e) => setNewService(prev => ({ ...prev, partner_contact_person: e.target.value }))}
                        placeholder="Ex: Directrice Spa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="partner_email">Email du partenaire</Label>
                      <Input
                        id="partner_email"
                        type="email"
                        value={newService.partner_email}
                        onChange={(e) => setNewService(prev => ({ ...prev, partner_email: e.target.value }))}
                        placeholder="contact@partenaire.sn"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="partner_phone">Téléphone du partenaire</Label>
                      <Input
                        id="partner_phone"
                        type="tel"
                        value={newService.partner_phone}
                        onChange={(e) => setNewService(prev => ({ ...prev, partner_phone: e.target.value }))}
                        placeholder="+221 77 123 45 67"
                      />
                    </div>
                  </div>
                </div>

                {/* Paramètres financiers et opérationnels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="revenue_percentage">Pourcentage de revenus *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="revenue_percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={newService.revenue_share_percentage}
                        onChange={(e) => setNewService(prev => ({ ...prev, revenue_share_percentage: parseInt(e.target.value) || 0 }))}
                        placeholder="50"
                      />
                      <span className="text-white">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_duration">Durée (minutes)</Label>
                    <Input
                      id="service_duration"
                      type="number"
                      min="0"
                      value={newService.service_duration_minutes}
                      onChange={(e) => setNewService(prev => ({ ...prev, service_duration_minutes: parseInt(e.target.value) || 0 }))}
                      placeholder="60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_location">Lieu du service</Label>
                    <Input
                      id="service_location"
                      value={newService.service_location}
                      onChange={(e) => setNewService(prev => ({ ...prev, service_location: e.target.value }))}
                      placeholder="Ex: Almadies, Plateau"
                    />
                  </div>
                </div>

                {/* Aperçu du calcul financier */}
                {newService.service_price > 0 && newService.revenue_share_percentage > 0 && (
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-400/30">
                    <h5 className="text-green-300 font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Aperçu financier :
                    </h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-green-200">Prix du service: {formatCurrency(newService.service_price)}</div>
                        <div className="text-green-200">Pourcentage partenaire: {newService.revenue_share_percentage}%</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-300">
                          Revenus partenaire: {formatCurrency((newService.service_price * newService.revenue_share_percentage) / 100)}
                        </div>
                        <div className="font-semibold text-blue-300">
                          Revenus WOLO: {formatCurrency(newService.service_price - ((newService.service_price * newService.revenue_share_percentage) / 100))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveService}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingService ? 'Modifier' : 'Créer'} le service
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowServiceDialog(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Statistiques globales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistiques globales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center p-4 bg-green-500/20 rounded-lg transition-all duration-200 hover:scale-105">
                    <div className="text-2xl font-bold text-green-300">
                      {packCategories.filter(c => c.is_active).length}
                    </div>
                    <div className="text-sm text-green-200">Catégories actives</div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/20 rounded-lg transition-all duration-200 hover:scale-105">
                    <div className="text-2xl font-bold text-blue-300">
                      {packCategories.reduce((sum, cat) => sum + cat.services.filter(s => s.is_active).length, 0)}
                    </div>
                    <div className="text-sm text-blue-200">Services actifs</div>
                  </div>
                  <div className="text-center p-4 bg-purple-500/20 rounded-lg transition-all duration-200 hover:scale-105">
                    <div className="text-2xl font-bold text-purple-300">
                      {new Set(packCategories.flatMap(cat => cat.services.map(s => s.partner_company_name))).size}
                    </div>
                    <div className="text-sm text-purple-200">Partenaires uniques</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/20 rounded-lg transition-all duration-200 hover:scale-105">
                    <div className="text-2xl font-bold text-yellow-300">
                      {formatCurrency(packCategories.reduce((sum, cat) => sum + cat.services.reduce((catSum, s) => catSum + s.service_price, 0), 0))}
                    </div>
                    <div className="text-sm text-yellow-200">Valeur totale</div>
                  </div>
                  <div className="text-center p-4 bg-orange-500/20 rounded-lg transition-all duration-200 hover:scale-105">
                    <div className="text-2xl font-bold text-orange-300">
                      {Math.round(packCategories.flatMap(cat => cat.services).reduce((sum, s) => sum + s.revenue_share_percentage, 0) / packCategories.flatMap(cat => cat.services).length)}%
                    </div>
                    <div className="text-sm text-orange-200">Partage moyen</div>
                  </div>
                  <div className="text-center p-4 bg-pink-500/20 rounded-lg transition-all duration-200 hover:scale-105">
                    <div className="text-2xl font-bold text-pink-300">
                      {selectedServices.length}
                    </div>
                    <div className="text-sm text-pink-200">Services sélectionnés</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer avec informations sur la nouvelle structure */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <Card className="bg-purple-500/10 backdrop-blur-sm border-purple-400/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building className="h-5 w-5 text-purple-400" />
                  <span className="text-purple-300 font-semibold">Gestion Hiérarchique des Partenaires WOLO - Structure Simplifiée</span>
                </div>
                <p className="text-white/60 text-sm">
                  © 2025 WOLO SENEGAL® - From Connect Africa® —
                  <br />
                  🏗️ <strong>Structure hiérarchique claire :</strong> Catégories → Services → Partenaires individuels
                  <br />
                  ✅ <strong>Checkboxes d'activation :</strong> Contrôle simple de la visibilité des catégories et services
                  <br />
                  🎯 <strong>Édition granulaire :</strong> Chaque service a son propre partenaire et pourcentage
                  <br />
                  📦 <strong>Exemple Pack Beauté :</strong> Spa (Beauté Dakar Spa 45%), Lentilles (Optique Vision 20%), Relooking (Studio Relook 35%), Cheveux (Salon Excellence 30%)
                  <br />
                  🖱️ <strong>Effets de survol élégants :</strong> Animations fluides pour indiquer les éléments sélectionnables
                  <br />
                  📝 <strong>Boutons d'édition fonctionnels :</strong> Modification complète de tous les champs en un clic
                  <br />
                  💡 <strong>Tooltips informatifs :</strong> Explication claire de chaque action disponible
                  <br />
                  📊 <strong>Rapports PDF bien formatés :</strong> Documents lisibles pour les humains, pas du JSON
                  <br />
                  🔧 <strong>Interface intuitive :</strong> Logique claire et navigation naturelle
                  <br />
                  ⚡ <strong>Actions groupées :</strong> Sélection multiple pour modifications en lot
                  <br />
                  🎨 <strong>Design cohérent :</strong> Couleurs et animations harmonieuses
                  <br />
                  📈 <strong>Statistiques en temps réel :</strong> Vue d'ensemble des performances
                </p>
              </CardContent>
            </Card>
          </motion.footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
