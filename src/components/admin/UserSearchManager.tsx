
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Users, 
  Eye, 
  Download, 
  QrCode,
  Calendar,
  Mail,
  Phone,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string;
  status: string;
  created_at: string;
  total_donations: number;
  active_pots: number;
  facebook_connected: boolean;
}

interface UserSearchManagerProps {
  className?: string;
}

export function UserSearchManager({ className = "" }: UserSearchManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriteria, setSearchCriteria] = useState('name');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Données de démonstration
  const getMockUsers = (): User[] => [
    {
      id: '1',
      name: 'Awa Diallo',
      email: 'awa@example.com',
      phone: '+221771234567',
      birthday: '1995-03-15',
      status: 'active',
      created_at: '2024-12-15',
      total_donations: 24000,
      active_pots: 1,
      facebook_connected: true
    },
    {
      id: '2',
      name: 'Mamadou Sow',
      email: 'mamadou@example.com',
      phone: '+221771234568',
      birthday: '1992-07-22',
      status: 'active',
      created_at: '2024-12-10',
      total_donations: 45000,
      active_pots: 1,
      facebook_connected: true
    },
    {
      id: '3',
      name: 'Fatou Ba',
      email: 'fatou@example.com',
      phone: '+221771234569',
      birthday: '1998-11-15',
      status: 'active',
      created_at: '2024-11-01',
      total_donations: 35000,
      active_pots: 0,
      facebook_connected: false
    },
    {
      id: '4',
      name: 'Ousmane Diop',
      email: 'ousmane@example.com',
      phone: '+221771234570',
      birthday: '1990-05-08',
      status: 'suspended',
      created_at: '2024-10-15',
      total_donations: 0,
      active_pots: 0,
      facebook_connected: false
    }
  ];

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simuler le chargement depuis l'API
      setTimeout(() => {
        const mockUsers = getMockUsers();
        setUsers(mockUsers);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
      setIsLoading(false);
    }
  }, []);

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Filtrer par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        switch (searchCriteria) {
          case 'name':
            return user.name.toLowerCase().includes(searchLower);
          case 'email':
            return user.email.toLowerCase().includes(searchLower);
          case 'phone':
            return user.phone.includes(searchTerm);
          case 'birthday':
            return user.birthday.includes(searchTerm);
          default:
            return user.name.toLowerCase().includes(searchLower) ||
                   user.email.toLowerCase().includes(searchLower);
        }
      });
    }

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Filtrer par date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(user => new Date(user.created_at) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(user => new Date(user.created_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(user => new Date(user.created_at) >= filterDate);
          break;
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, searchCriteria, statusFilter, dateFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300';
      case 'suspended':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'deleted':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'suspended':
        return 'Suspendu';
      case 'deleted':
        return 'Supprimé';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleViewUserDetails = (userId: string) => {
    toast.info(`Affichage des détails de l'utilisateur ${userId}`);
  };

  const handleDownloadUserData = (userId: string) => {
    toast.success(`Téléchargement des données utilisateur ${userId}`);
  };

  const handleGenerateUserQR = (userId: string) => {
    toast.success(`QR Code généré pour l'utilisateur ${userId}`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtres de recherche */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche avancée d'utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-white">Critère de recherche</Label>
              <Select value={searchCriteria} onValueChange={setSearchCriteria}>
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Téléphone</SelectItem>
                  <SelectItem value="birthday">Date anniversaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Terme de recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder={`Rechercher par ${searchCriteria}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="suspended">Suspendus</SelectItem>
                  <SelectItem value="deleted">Supprimés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Période</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={loadUsers}
              disabled={isLoading}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Filter className="h-4 w-4 mr-2" />
              Réinitialiser filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats de recherche */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              Résultats ({filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''})
            </CardTitle>
            <Button
              onClick={() => toast.success('Export des résultats en cours...')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/70">Chargement des utilisateurs...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun utilisateur trouvé</p>
              <p className="text-sm">Modifiez vos critères de recherche</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      <Badge className={getStatusColor(user.status)}>
                        {getStatusText(user.status)}
                      </Badge>
                      {user.facebook_connected && (
                        <Badge className="bg-blue-500/20 text-blue-300">
                          Facebook
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-white/70 space-y-1">
                      <p className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Anniversaire: {new Date(user.birthday).toLocaleDateString('fr-FR')}
                      </p>
                      <p>💰 Total donations: {formatCurrency(user.total_donations)} • 🎁 Pots actifs: {user.active_pots}</p>
                      <p>📅 Inscrit le: {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleViewUserDetails(user.id)}
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDownloadUserData(user.id)}
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleGenerateUserQR(user.id)}
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques de recherche */}
      {filteredUsers.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Statistiques des résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {filteredUsers.filter(u => u.status === 'active').length}
                </div>
                <div className="text-sm text-white/70">Utilisateurs actifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {filteredUsers.filter(u => u.facebook_connected).length}
                </div>
                <div className="text-sm text-white/70">Connectés Facebook</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {filteredUsers.reduce((sum, u) => sum + u.active_pots, 0)}
                </div>
                <div className="text-sm text-white/70">Pots actifs total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {formatCurrency(filteredUsers.reduce((sum, u) => sum + u.total_donations, 0))}
                </div>
                <div className="text-sm text-white/70">Total donations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
