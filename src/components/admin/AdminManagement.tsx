
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
import { 
  UserPlus, 
  Users, 
  Shield, 
  Code, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  Crown,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface WoloAdmin {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  admin_type: 'super_admin' | 'developer_admin';
  is_active: boolean;
  last_login_at?: string;
  create_time: string;
}

export function AdminManagement() {
  const [admins, setAdmins] = useState<WoloAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    admin_type: 'developer_admin' as 'super_admin' | 'developer_admin'
  });

  // Charger la liste des administrateurs
  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/next_api/admin/list');
      const result = await response.json();
      
      if (result.success) {
        setAdmins(result.data);
      } else {
        toast.error('Erreur lors du chargement des administrateurs');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialiser les administrateurs par défaut
  const initializeDefaultAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/next_api/admin/init-default', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        const { created, skipped, summary } = result.data;
        
        if (created.length > 0) {
          toast.success(`${created.length} administrateur(s) créé(s) avec succès`);
        }
        
        if (skipped.length > 0) {
          toast.info(`${skipped.length} administrateur(s) ignoré(s) (déjà existants)`);
        }
        
        // Recharger la liste
        await loadAdmins();
      } else {
        toast.error('Erreur lors de l\'initialisation');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // Créer un nouvel administrateur
  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const response = await fetch('/next_api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Administrateur créé avec succès');
        setFormData({
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          admin_type: 'developer_admin'
        });
        await loadAdmins();
      } else {
        toast.error(result.errorMessage || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const getAdminTypeIcon = (type: string) => {
    return type === 'super_admin' ? <Crown className="h-4 w-4" /> : <Code className="h-4 w-4" />;
  };

  const getAdminTypeBadge = (type: string) => {
    return type === 'super_admin' 
      ? <Badge className="bg-yellow-500/20 text-yellow-300">Super Admin</Badge>
      : <Badge className="bg-blue-500/20 text-blue-300">Dev Admin</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Administrateurs</h2>
          <p className="text-white/70">Créer et gérer les comptes administrateurs WOLO</p>
        </div>
        <Button
          onClick={initializeDefaultAdmins}
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Settings className="h-4 w-4 mr-2" />
          Initialiser Admins par Défaut
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-white/10 backdrop-blur-sm">
          <TabsTrigger value="list">
            <Users className="h-4 w-4 mr-2" />
            Liste des Admins
          </TabsTrigger>
          <TabsTrigger value="create">
            <UserPlus className="h-4 w-4 mr-2" />
            Créer un Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Administrateurs WOLO ({admins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/70">Chargement...</p>
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-white/40" />
                  <p className="text-white/60">Aucun administrateur trouvé</p>
                  <p className="text-sm text-white/40">Cliquez sur "Initialiser Admins par Défaut" pour créer les comptes de base</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {admins.map((admin, index) => (
                    <motion.div
                      key={admin.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/10 rounded-lg">
                          {getAdminTypeIcon(admin.admin_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">
                              {admin.first_name} {admin.last_name}
                            </h3>
                            {getAdminTypeBadge(admin.admin_type)}
                            {admin.is_active ? (
                              <Badge className="bg-green-500/20 text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Actif
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-300">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Inactif
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-white/70">
                            @{admin.username} • {admin.email}
                          </div>
                          <div className="text-xs text-white/50">
                            Créé le {new Date(admin.create_time).toLocaleDateString('fr-FR')}
                            {admin.last_login_at && (
                              <span> • Dernière connexion: {new Date(admin.last_login_at).toLocaleDateString('fr-FR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Créer un Nouvel Administrateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 border-blue-400/50 bg-blue-500/10">
                <Shield className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  <strong>Types d'administrateurs :</strong>
                  <br />
                  • <strong>Super Admin :</strong> Accès complet à toutes les fonctionnalités
                  <br />
                  • <strong>Dev Admin :</strong> Accès limité aux aspects techniques et développement
                </AlertDescription>
              </Alert>

              <form onSubmit={createAdmin} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-white">
                      Prénom *
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      placeholder="Prénom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-white">
                      Nom *
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      placeholder="Nom"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">
                    Nom d'utilisateur *
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    placeholder="nom.utilisateur"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    placeholder="email@wolosenegal.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Mot de passe *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50 pr-10"
                      placeholder="Mot de passe sécurisé"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_type" className="text-white">
                    Type d'administrateur *
                  </Label>
                  <Select
                    value={formData.admin_type}
                    onValueChange={(value: 'super_admin' | 'developer_admin') => 
                      setFormData(prev => ({ ...prev, admin_type: value }))
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer_admin">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Administrateur Développeur
                        </div>
                      </SelectItem>
                      <SelectItem value="super_admin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Super Administrateur
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Créer l'Administrateur
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
