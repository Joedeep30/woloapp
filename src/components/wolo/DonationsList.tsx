
"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Eye, EyeOff, Crown } from 'lucide-react';
import { Donation } from '@/types/wolo';

interface DonationsListProps {
  donations: Donation[];
  isOwner?: boolean;
  className?: string;
}

export function DonationsList({ donations, isOwner = false, className = "" }: DonationsListProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'failed':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  };

  // Trouver le plus gros don pour l'affichage public
  const biggestDonation = donations
    .filter(d => d.status === 'completed')
    .sort((a, b) => b.amount - a.amount)[0];

  // Donations visibles selon le contexte
  const visibleDonations = isOwner 
    ? donations 
    : donations.filter(d => d.show_amount_consent && d.show_name_consent);

  if (donations.length === 0) {
    return (
      <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
        <CardContent className="p-8 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-white/40" />
          <p className="text-white/60">Aucune donation pour le moment</p>
          <p className="text-sm text-white/40">Soyez le premier à contribuer !</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Affichage du plus gros don (section publique) */}
      {!isOwner && biggestDonation && (
        <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-yellow-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              Plus gros don
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-yellow-400/50">
                <AvatarFallback className="bg-yellow-500 text-white">
                  {biggestDonation.donor_name ? 
                    biggestDonation.donor_name.slice(0, 2).toUpperCase() : 
                    '❤️'
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold text-white">
                  {biggestDonation.show_name_consent && biggestDonation.donor_name
                    ? biggestDonation.donor_name
                    : 'Donateur anonyme'
                  }
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {formatAmount(biggestDonation.amount)}
                </div>
              </div>
            </div>
            {biggestDonation.message && (
              <div className="mt-3 p-2 bg-white/10 rounded-lg">
                <p className="text-sm text-white/80 italic">
                  "{biggestDonation.message}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Liste complète des dons (visible par le célébré uniquement) */}
      {isOwner && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              Tous les dons reçus ({donations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {donations.map((donation, index) => (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-500 text-white text-xs">
                        {donation.donor_name ? 
                          donation.donor_name.slice(0, 2).toUpperCase() : 
                          '❤️'
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-white text-sm">
                        {donation.is_anonymous || !donation.donor_name
                          ? 'Donateur anonyme'
                          : donation.donor_name
                        }
                      </div>
                      <div className="text-xs text-white/60">
                        {new Date(donation.create_time).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {formatAmount(donation.amount)}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(donation.status)}`}
                      >
                        {getStatusText(donation.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div title="Nom visible publiquement">
                        {donation.show_name_consent ? (
                          <Eye className="h-3 w-3 text-green-400" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-red-400" />
                        )}
                      </div>
                      <div title="Montant visible publiquement">
                        {donation.show_amount_consent ? (
                          <Eye className="h-3 w-3 text-green-400" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-red-400" />
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

      {/* Montant toujours visible */}
      <div className="text-center">
        <div className="text-sm text-white/70 mb-1">Montant total collecté</div>
        <div className="text-3xl font-bold text-white">
          {formatAmount(donations
            .filter(d => d.status === 'completed')
            .reduce((sum, d) => sum + d.amount, 0)
          )}
        </div>
      </div>
    </div>
  );
}
