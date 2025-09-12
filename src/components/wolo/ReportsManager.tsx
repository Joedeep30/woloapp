
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Download, 
  Eye, 
  BarChart3, 
  QrCode, 
  Share2, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface Report {
  id: string;
  report_type: string;
  report_name: string;
  status: string;
  file_path?: string;
  file_size?: number;
  create_time: string;
  expires_at?: string;
  error_message?: string;
  download_count: number;
}

interface ReportsManagerProps {
  potId?: string;
  className?: string;
}

export function ReportsManager({ potId, className = "" }: ReportsManagerProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newReport, setNewReport] = useState({
    type: 'donation_summary',
    name: ''
  });

  const reportTypes = [
    {
      value: 'donation_summary',
      label: 'Résumé des donations',
      icon: DollarSign,
      description: 'Statistiques complètes des donations reçues'
    },
    {
      value: 'qr_usage',
      label: 'Utilisation des QR codes',
      icon: QrCode,
      description: 'Analyse de l\'utilisation des QR codes'
    },
    {
      value: 'social_analytics',
      label: 'Analytics des réseaux sociaux',
      icon: Share2,
      description: 'Performance des partages sur les réseaux sociaux'
    },
    {
      value: 'financial_report',
      label: 'Rapport financier',
      icon: BarChart3,
      description: 'Analyse financière détaillée'
    }
  ];

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = potId ? `?pot_id=${potId}` : '';
      const reportsData = await api.get(`/reports${params}`);
      setReports(reportsData);
    } catch (error: any) {
      console.error('Erreur lors du chargement des rapports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [potId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const generateReport = async () => {
    if (!newReport.name.trim()) {
      toast.error('Veuillez saisir un nom pour le rapport');
      return;
    }

    setIsGenerating(true);
    try {
      const reportData = {
        report_type: newReport.type,
        report_name: newReport.name,
        ...(potId && { pot_id: parseInt(potId) }),
        parameters: {
          generated_at: new Date().toISOString(),
          include_charts: true,
          format: 'pdf'
        }
      };

      const newReportData = await api.post('/reports', reportData);
      
      setReports(prev => [newReportData, ...prev]);
      setNewReport({ type: 'donation_summary', name: '' });
      
      toast.success('Génération du rapport lancée ! Vous serez notifié quand il sera prêt.');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (report: Report) => {
    if (report.status !== 'completed' || !report.file_path) {
      toast.error('Le rapport n\'est pas encore prêt au téléchargement');
      return;
    }

    try {
      // Simuler le téléchargement
      const link = document.createElement('a');
      link.href = report.file_path;
      link.download = `${report.report_name}.pdf`;
      link.click();
      
      // Incrémenter le compteur de téléchargements
      await api.put(`/reports?id=${report.id}`, {
        download_count: report.download_count + 1
      });
      
      // Mettre à jour localement
      setReports(prev => prev.map(r => 
        r.id === report.id 
          ? { ...r, download_count: r.download_count + 1 }
          : r
      ));
      
      toast.success('Rapport téléchargé avec succès !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du téléchargement');
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      await api.delete(`/reports?id=${reportId}`);
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success('Rapport supprimé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'failed':
        return 'bg-red-500/20 text-red-300';
      case 'expired':
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-blue-500/20 text-blue-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'generating':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'failed':
        return 'Échec';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getReportTypeInfo = (type: string) => {
    return reportTypes.find(rt => rt.value === type) || reportTypes[0];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Générateur de rapports */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générer un nouveau rapport
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-type" className="text-white">
                Type de rapport
              </Label>
              <Select
                value={newReport.type}
                onValueChange={(value) => setNewReport(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-name" className="text-white">
                Nom du rapport
              </Label>
              <Input
                id="report-name"
                value={newReport.name}
                onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Rapport mensuel décembre 2024"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
              />
            </div>
          </div>

          <Button
            onClick={generateReport}
            disabled={isGenerating || !newReport.name.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Génération en cours...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Générer le rapport
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Liste des rapports */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Chargement des rapports...</p>
        </div>
      ) : reports.length > 0 ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              Rapports générés ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report, index) => {
                const typeInfo = getReportTypeInfo(report.report_type);
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <typeInfo.icon className="h-5 w-5 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">{report.report_name}</h4>
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1">{getStatusText(report.status)}</span>
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-white/70">
                          <div>{typeInfo.label}</div>
                          <div className="flex items-center gap-4 mt-1">
                            <span>Créé le: {new Date(report.create_time).toLocaleDateString('fr-FR')}</span>
                            {report.file_size && (
                              <span>Taille: {formatFileSize(report.file_size)}</span>
                            )}
                            {report.download_count > 0 && (
                              <span>Téléchargé: {report.download_count} fois</span>
                            )}
                          </div>
                          {report.expires_at && (
                            <div className="text-yellow-300 text-xs mt-1">
                              Expire le: {new Date(report.expires_at).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                          {report.error_message && (
                            <div className="text-red-300 text-xs mt-1">
                              Erreur: {report.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {report.status === 'completed' && (
                        <Button
                          onClick={() => downloadReport(report)}
                          variant="ghost"
                          size="sm"
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          toast.info(`Rapport: ${report.report_name}\nType: ${typeInfo.label}\nStatut: ${getStatusText(report.status)}`);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        onClick={() => deleteReport(report.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 text-white/60">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun rapport généré pour le moment</p>
          <p className="text-sm">Créez votre premier rapport ci-dessus</p>
        </div>
      )}
    </div>
  );
}
