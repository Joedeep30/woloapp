
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserPlus, 
  Star, 
  Users, 
  Mail, 
  MessageCircle, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  TrendingUp,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface Sponsorship {
  id: string;
  sponsor_user_id: number;
  invited_name: string;
  invited_email?: string;
  invited_phone?: string;
  invited_birthday: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  points_awarded: number;
  bonus_points: number;
  pot_amount: number;
  invitation_sent_at: string;
  accepted_at?: string;
}

interface UserPoints {
  total_points: number;
  available_points: number;
  lifetime_points: number;
  current_level: string;
}

interface SponsorshipManagerProps {
  userId: string;
  className?: string;
}

export function SponsorshipManager({ userId, className = "" }: SponsorshipManagerProps) {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newSponsorship, setNewSponsorship] = useState({
    invited_name: '',
    invited_email: '',
    invited_phone: '',
    invited_birthday: '',
    invitation_method: 'email' as 'email' | 'sms' | 'whatsapp',
    invitation_message: ''
  });

  const loadSponsorships = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sponsorshipsData, pointsData] = await Promise.all([
        api.get(`/sponsorships?sponsor_user_id=${userId}`),
        api.get(`/points?user_id=${userId}`)
      ]);
      
      setSponsorships(sponsorshipsData);
      setUserPoints(pointsData.balance);
    } catch (error: any) {
      console.error('Erreur lors du chargement des parrainages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSponsorships();
  }, [loadSponsorships]);

  const validateBirthdayDate = (date: string) => {
    if (!date) return false;

    const today = new Date();
    const birthday = new Date(date);
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 10 && diffDays <= 30;
  };

  const handleSponsorshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBirthdayDate(newSponsorship.invited_birthday)) {
      toast.error('L\'anniversaire doit être dans 10 à 30 jours');
      return;
    }

    if (!newSponsorship.invited_name || (!newSponsorship.invited_email && !newSponsorship.invited_phone)) {
      toast.error('Veuillez remplir le nom et au moins un moyen de contact');
      return;
    }

    try {
      setIsLoading(true);
      
      const sponsorshipData = {
        invited_name: newSponsorship.invited_name,
        invited_email: newSponsorship.invited_email || undefined,
        invited_phone: newSponsorship.invited_phone || undefined,
        invited_birthday: newSponsorship.invited_birthday,
        invitation_method: newSponsorship.invitation_method,
        invitation_message: newSponsorship.invitation_message || undefined
      };

      const result = await api.post('/sponsorships', sponsorshipData);
      
      setSponsorships(prev => [result, ...prev]);
      setNewSponsorship({
        invited_name: '',
        invited_email: '',
        invited_phone: '',
        invited_birthday: '',
        invitation_method: 'email',
        invitation_message: ''
      });
      
      toast.success(`Invitation de parrainage envoyée à ${newSponsorship.invited_name} !`);
      toast.info('Vous recevrez 10 points dès que la personne accepte et crée sa cagnotte !');
      
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewSponsorship(prev => ({ ...prev, [field]: value }));
    
    // Auto-générer le message d'invitation
    if (field === 'invited_name' && value) {
      setNewSponsorship(prev => ({
        ...prev,
        invitation_message: `Salut ${value} ! 🎉 J'ai découvert WOLO SENEGAL, une super plateforme pour organiser des cagnottes d'anniversaire avec des cadeaux cinéma ! Ton anniversaire approche et je pense que ça pourrait t'intéresser. Tu veux que WOLO gère ta cagnotte d'anniversaire ? C'est gratuit et très facile ! 🎂🎁`
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'rejected':
        return 'bg-red-500/20 text-red-300';
      case 'expired':
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-blue-500/20 text-blue-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepté';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Refusé';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistiques de points */}
      {userPoints && (
        <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-400" />
              Vos points WOLO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-300">{userPoints.total_points}</div>
                <div className="text-sm text-purple-200">Points totaux</div>
              </div>
              <div className="text-center p-4 bg-green-500/20 rounded-lg">
                <div className="text-2xl font-bold text-green-300">{userPoints.available_points}</div>
                <div className="text-sm text-green-200">Points disponibles</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-300">{userPoints.lifetime_points}</div>
                <div className="text-sm text-yellow-200">Points à vie</div>
              </div>
              <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-300 capitalize">{userPoints.current_level}</div>
                <div className="text-sm text-blue-200">Niveau actuel</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire de parrainage */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Parrainer quelqu'un
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSponsorshipSubmit} className="space-y-4">
            <div>
              <Label htmlFor="invited_name" className="text-white font-medium">
                Nom de la personne à parrainer *
              </Label>
              <Input
                id="invited_name"
                value={newSponsorship.invited_name}
                onChange={(e) => handleInputChange('invited_name', e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                placeholder="Prénom et nom de votre ami(e)"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invited_email" className="text-white font-medium">
                  Email
                </Label>
                <Input
                  id="invited_email"
                  type="email"
                  value={newSponsorship.invited_email}
                  onChange={(e) => handleInputChange('invited_email', e.target.value)}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <Label htmlFor="invited_phone" className="text-white font-medium">
                  Téléphone
                </Label>
                <Input
                  id="invited_phone"
                  type="tel"
                  value={newSponsorship.invited_phone}
                  onChange={(e) => handleInputChange('invited_phone', e.target.value)}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                  placeholder="+221 77 123 45 67"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="invited_birthday" className="text-white font-medium">
                Date d'anniversaire *
              </Label>
              <Input
                id="invited_birthday"
                type="date"
                value={newSponsorship.invited_birthday}
                onChange={(e) => handleInputChange('invited_birthday', e.target.value)}
                className="bg-white/10 border-white/30 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="invitation_method" className="text-white font-medium">
                Méthode d'invitation
              </Label>
              <Select
                value={newSponsorship.invitation_method}
                onValueChange={(value: 'email' | 'sms' | 'whatsapp') => 
                  setNewSponsorship(prev => ({ ...prev, invitation_method: value }))
                }
              >
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invitation_message" className="text-white font-medium">
                Message personnalisé
              </Label>
              <textarea
                id="invitation_message"
                value={newSponsorship.invitation_message}
                onChange={(e) => handleInputChange('invitation_message', e.target.value)}
                className="w-full h-24 bg-white/10 border border-white/30 text-white placeholder:text-white/60 rounded-md p-3 resize-none"
                placeholder="Message généré automatiquement..."
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste des parrainages */}
      {sponsorships.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              Mes parrainages ({sponsorships.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sponsorships.map((sponsorship, index) => (
                <motion.div
                  key={sponsorship.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-500 text-white">
                        {sponsorship.invited_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{sponsorship.invited_name}</h4>
                        <Badge className={getStatusColor(sponsorship.status)}>
                          {getStatusIcon(sponsorship.status)}
                          <span className="ml-1">{getStatusText(sponsorship.status)}</span>
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-white/70">
                        <div>🎂 Anniversaire: {new Date(sponsorship.invited_birthday).toLocaleDateString('fr-FR')}</div>
                        <div>📧 {sponsorship.invited_email}</div>
                        <div>📅 Invité le: {new Date(sponsorship.invitation_sent_at).toLocaleDateString('fr-FR')}</div>
                        {sponsorship.accepted_at && (
                          <div>✅ Accepté le: {new Date(sponsorship.accepted_at).toLocaleDateString('fr-FR')}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      {sponsorship.status === 'accepted' && sponsorship.pot_amount > 0 && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">
                            {formatCurrency(sponsorship.pot_amount)}
                          </div>
                          <div className="text-xs text-white/70">Cagnotte filleul</div>
                        </div>
                      )}
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400">
                          {sponsorship.points_awarded + sponsorship.bonus_points}
                        </div>
                        <div className="text-xs text-white/70">Points gagnés</div>
                        {sponsorship.bonus_points > 0 && (
                          <div className="text-xs text-yellow-300">
                            +{sponsorship.bonus_points} bonus
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Système de points expliqué */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Comment gagner des points ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">Points de base :</h4>
              <ul className="text-white/90 text-sm space-y-2">
                <li>🎯 <strong>10 points</strong> dès que votre filleul accepte</li>
                <li>📧 <strong>Invitation envoyée</strong> par email ou SMS</li>
                <li>⏰ <strong>Valide 7 jours</strong> après envoi</li>
                <li>👤 <strong>1 seul parrain</strong> par personne</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Points bonus :</h4>
              <ul className="text-white/90 text-sm space-y-2">
                <li>💰 <strong>+5 points</strong> si cagnotte atteint 25 000 FCFA</li>
                <li>💎 <strong>+10 points</strong> si cagnotte atteint 50 000 FCFA</li>
                <li>👑 <strong>+20 points</strong> si cagnotte atteint 100 000 FCFA</li>
                <li>🚀 <strong>Effet viral :</strong> Plus vos filleuls réussissent, plus vous gagnez !</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {sponsorships.length === 0 && (
        <div className="text-center py-8 text-white/60">
          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Vous n'avez pas encore parrainé quelqu'un</p>
          <p className="text-sm">Commencez à parrainer pour gagner des points et développer votre réseau !</p>
        </div>
      )}
    </div>
  );
}
