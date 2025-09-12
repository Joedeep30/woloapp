
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, Eye, Scan, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface QRCodeData {
  id: string;
  code: string;
  qr_type: string;
  status: string;
  issued_at: string;
  scanned_at?: string;
  invitee_id?: string;
  payload?: any;
}

interface QRCodeGeneratorProps {
  potId: string;
  invitees: any[];
  className?: string;
}

export function QRCodeGenerator({ potId, invitees, className = "" }: QRCodeGeneratorProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Charger les QR codes existants
  const loadQRCodes = useCallback(async () => {
    try {
      setIsLoading(true);
      const codes = await api.get(`/qr-codes?pot_id=${potId}`);
      setQrCodes(codes);
    } catch (error: any) {
      console.error('Erreur lors du chargement des QR codes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [potId]);

  useEffect(() => {
    loadQRCodes();
  }, [loadQRCodes]);

  const generateQRCode = async (inviteeId?: string, type: string = 'invitee') => {
    try {
      const payload = {
        pot_id: parseInt(potId),
        qr_type: type,
        ...(inviteeId && { invitee_id: parseInt(inviteeId) }),
        payload: {
          pot_id: potId,
          ...(inviteeId && { invitee_id: inviteeId }),
          generated_at: new Date().toISOString()
        }
      };

      const newQRCode = await api.post('/qr-codes', payload);
      
      setQrCodes(prev => [...prev, newQRCode]);
      
      // Tracker l'événement
      await api.post('/analytics', {
        pot_id: parseInt(potId),
        event_type: 'qr_generated',
        event_category: 'system_event',
        event_data: {
          qr_type: type,
          invitee_id: inviteeId
        }
      });

      return newQRCode;
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la génération du QR code');
    }
  };

  const generateAllQRCodes = async () => {
    setIsGenerating(true);
    try {
      // Générer des QR codes pour tous les invités qui n'en ont pas
      const inviteesWithoutQR = invitees.filter(invitee => 
        !qrCodes.some(qr => qr.invitee_id === invitee.id)
      );

      const promises = inviteesWithoutQR.map(invitee => 
        generateQRCode(invitee.id, 'invitee')
      );

      await Promise.all(promises);
      
      toast.success(`${inviteesWithoutQR.length} QR codes générés avec succès !`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération des QR codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMasterQRCode = async () => {
    try {
      await generateQRCode(undefined, 'master');
      toast.success('QR code maître généré avec succès !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération du QR code maître');
    }
  };

  const downloadQRCode = async (qrCode: QRCodeData) => {
    try {
      // Générer l'image QR code (simulation)
      const qrText = `https://wolo-cagnotte.zoer.ai/qr/${qrCode.code}`;
      
      // Dans une vraie implémentation, on utiliserait une librairie comme qrcode
      // Pour la démo, on simule le téléchargement
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200;
      canvas.height = 200;
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', 100, 100);
        ctx.fillText(qrCode.code.substring(0, 8), 100, 120);
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `qr-code-${qrCode.code}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
      
      toast.success('QR code téléchargé !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-blue-500/20 text-blue-300';
      case 'scanned':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'redeemed':
        return 'bg-green-500/20 text-green-300';
      case 'expired':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'issued':
        return 'Émis';
      case 'scanned':
        return 'Scanné';
      case 'redeemed':
        return 'Utilisé';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  };

  const getInviteeName = (inviteeId?: string) => {
    if (!inviteeId) return 'QR Maître';
    const invitee = invitees.find(inv => inv.id === inviteeId);
    return invitee ? invitee.name : 'Invité inconnu';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Actions */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gestion des QR Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={generateAllQRCodes}
              disabled={isGenerating}
              className="bg-green-500 hover:bg-green-600"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Génération...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Générer tous les QR
                </>
              )}
            </Button>
            
            <Button
              onClick={generateMasterQRCode}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Maître
            </Button>
            
            <Button
              onClick={() => {
                // Générer un rapport PDF avec tous les QR codes
                api.post('/reports', {
                  report_type: 'qr_usage',
                  report_name: `QR_Codes_${potId}`,
                  pot_id: parseInt(potId)
                });
                toast.success('Génération du rapport PDF en cours...');
              }}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des QR codes */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Chargement des QR codes...</p>
        </div>
      ) : qrCodes.length > 0 ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              QR Codes générés ({qrCodes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {qrCodes.map((qrCode, index) => (
                <motion.div
                  key={qrCode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">
                        {getInviteeName(qrCode.invitee_id)}
                      </h4>
                      <Badge className={getStatusColor(qrCode.status)}>
                        {getStatusText(qrCode.status)}
                      </Badge>
                      {qrCode.qr_type === 'master' && (
                        <Badge className="bg-purple-500/20 text-purple-300">
                          Maître
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-white/70">
                      <div>Code: {qrCode.code}</div>
                      <div>Émis le: {new Date(qrCode.issued_at).toLocaleDateString('fr-FR')}</div>
                      {qrCode.scanned_at && (
                        <div>Scanné le: {new Date(qrCode.scanned_at).toLocaleDateString('fr-FR')}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => downloadQRCode(qrCode)}
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        // Afficher les détails du QR code
                        toast.info(`QR Code: ${qrCode.code}\nStatut: ${getStatusText(qrCode.status)}`);
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

            {/* Statistiques */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {qrCodes.filter(qr => qr.status === 'issued').length}
                  </div>
                  <div className="text-xs text-white/70">Émis</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {qrCodes.filter(qr => qr.status === 'scanned').length}
                  </div>
                  <div className="text-xs text-white/70">Scannés</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {qrCodes.filter(qr => qr.status === 'redeemed').length}
                  </div>
                  <div className="text-xs text-white/70">Utilisés</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {qrCodes.length > 0 ? Math.round((qrCodes.filter(qr => qr.status === 'redeemed').length / qrCodes.length) * 100) : 0}%
                  </div>
                  <div className="text-xs text-white/70">Taux d'utilisation</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 text-white/60">
          <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun QR code généré pour le moment</p>
          <p className="text-sm">Cliquez sur "Générer tous les QR" pour commencer</p>
        </div>
      )}
    </div>
  );
}
