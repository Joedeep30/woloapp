
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Gift,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  totalRevenue: number;
  totalUsers: number;
  totalPots: number;
  conversionRate: number;
  avgDonation: number;
  topFormula: string;
  growthRate: number;
  activeParticipants: number;
}

interface AdvancedAnalyticsProps {
  className?: string;
}

export function AdvancedAnalytics({ className = "" }: AdvancedAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 2450000,
    totalUsers: 156,
    totalPots: 110,
    conversionRate: 68.5,
    avgDonation: 7500,
    topFormula: 'Pack Famille',
    growthRate: 23.4,
    activeParticipants: 1234
  });

  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);

  const [chartData] = useState({
    dailyRevenue: [
      { date: '2024-12-15', revenue: 45000, users: 12 },
      { date: '2024-12-16', revenue: 52000, users: 15 },
      { date: '2024-12-17', revenue: 38000, users: 9 },
      { date: '2024-12-18', revenue: 67000, users: 18 },
      { date: '2024-12-19', revenue: 71000, users: 21 }
    ],
    formulaDistribution: [
      { name: 'Pack Solo', value: 25, revenue: 125000 },
      { name: 'Pack Duo', value: 30, revenue: 270000 },
      { name: 'Pack Famille', value: 35, revenue: 560000 },
      { name: 'Pack Groupe', value: 8, revenue: 182400 },
      { name: 'Pack Fête', value: 2, revenue: 70000 }
    ],
    platformShares: [
      { platform: 'Facebook', shares: 45, conversions: 23 },
      { platform: 'WhatsApp', shares: 38, conversions: 19 },
      { platform: 'TikTok', shares: 12, conversions: 4 },
      { platform: 'Snapchat', shares: 8, conversions: 2 }
    ]
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simuler le chargement des analytics
      setTimeout(() => {
        // Mettre à jour les données selon la période sélectionnée
        const multiplier = timeRange === '7d' ? 0.3 : timeRange === '30d' ? 1 : 2.5;
        setAnalyticsData(prev => ({
          ...prev,
          totalRevenue: Math.round(prev.totalRevenue * multiplier),
          growthRate: Math.round((Math.random() * 30 + 10) * 10) / 10
        }));
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      toast.error('Erreur lors du chargement des analytics');
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportAnalytics = () => {
    toast.success('Export des analytics en cours...');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Contrôles */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Avancées
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 bg-white/10 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={loadAnalytics}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleExportAnalytics}
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs détaillés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Revenus totaux</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(analyticsData.totalRevenue)}
                </p>
                <p className="text-xs text-green-300">+{analyticsData.growthRate}% croissance</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Taux de conversion</p>
                <p className="text-2xl font-bold text-white">{analyticsData.conversionRate}%</p>
                <p className="text-xs text-blue-300">Visiteurs → Donateurs</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Don moyen</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(analyticsData.avgDonation)}
                </p>
                <p className="text-xs text-purple-300">Par transaction</p>
              </div>
              <Gift className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Participants actifs</p>
                <p className="text-2xl font-bold text-white">{analyticsData.activeParticipants}</p>
                <p className="text-xs text-green-300">Dernières 24h</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus quotidiens */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Revenus quotidiens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.dailyRevenue.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="font-medium text-white">
                      {new Date(day.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-sm text-white/70">{day.users} nouveaux utilisateurs</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{formatCurrency(day.revenue)}</div>
                    <div className="text-xs text-green-300">
                      +{Math.round((day.revenue / 50000) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribution des formules */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Performance des formules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.formulaDistribution.map((formula, index) => (
                <div key={formula.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{formula.name}</span>
                    <span className="text-white/70">{formula.value}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${formula.value}%` }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                    />
                  </div>
                  <div className="text-xs text-white/60">
                    Revenus: {formatCurrency(formula.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance des plateformes */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Performance des plateformes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.platformShares.map((platform, index) => (
                <div key={platform.platform} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="font-medium text-white">{platform.platform}</div>
                    <div className="text-sm text-white/70">{platform.shares} partages</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{platform.conversions}</div>
                    <div className="text-xs text-green-300">
                      {Math.round((platform.conversions / platform.shares) * 100)}% conversion
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Métriques avancées */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Métriques avancées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Temps moyen de conversion</span>
                <span className="text-white font-semibold">3.2 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Taux de rétention</span>
                <span className="text-white font-semibold">84.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Score de satisfaction</span>
                <span className="text-white font-semibold">4.8/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">QR codes utilisés</span>
                <span className="text-white font-semibold">89.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Partages viraux</span>
                <span className="text-white font-semibold">2.4x</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights et recommandations */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Insights et recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-400/30">
              <h4 className="text-green-300 font-semibold mb-2">📈 Tendance positive</h4>
              <p className="text-white/80 text-sm">
                Le Pack Famille génère 40% plus de revenus que prévu. 
                Considérez augmenter sa visibilité.
              </p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-400/30">
              <h4 className="text-yellow-300 font-semibold mb-2">⚠️ Attention</h4>
              <p className="text-white/80 text-sm">
                Les partages TikTok ont un faible taux de conversion. 
                Optimisez le contenu pour cette plateforme.
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
              <h4 className="text-blue-300 font-semibold mb-2">💡 Opportunité</h4>
              <p className="text-white/80 text-sm">
                Les utilisateurs Facebook convertissent 3x mieux. 
                Investissez davantage dans cette plateforme.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => toast.success('Rapport détaillé généré')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Rapport détaillé
            </Button>
            <Button
              onClick={() => toast.success('Rapport de performance généré')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance report
            </Button>
            <Button
              onClick={() => toast.success('Analyse prédictive générée')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyse prédictive
            </Button>
            <Button
              onClick={() => toast.success('Rapport partenaires généré')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Rapport partenaires
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
