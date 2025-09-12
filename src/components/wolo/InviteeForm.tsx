
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, QrCode, Send, Download } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

const inviteeSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  whatsapp_number: z.string().optional(),
  email: z.string().email('Email invalide').optional(),
}).refine((data) => data.whatsapp_number || data.email, {
  message: "Au moins un numéro WhatsApp ou un email est requis",
  path: ["whatsapp_number"]
});

type InviteeFormData = z.infer<typeof inviteeSchema>;

interface Invitee {
  id: string;
  name: string;
  whatsapp_number?: string;
  email?: string;
  qr_code_generated: boolean;
  invitation_sent: boolean;
  status: string;
}

interface InviteeFormProps {
  potId: string;
  invitees: Invitee[];
  onInviteeAdded: (invitee: Invitee) => void;
  onInviteeRemoved: (inviteeId: string) => void;
  onGenerateQRCodes: () => void;
  className?: string;
}

export function InviteeForm({ 
  potId, 
  invitees, 
  onInviteeAdded, 
  onInviteeRemoved, 
  onGenerateQRCodes,
  className = "" 
}: InviteeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteeFormData>({
    resolver: zodResolver(inviteeSchema)
  });

  const onSubmit = async (data: InviteeFormData) => {
    setIsLoading(true);
    try {
      // Appeler l'API pour créer l'invité
      const newInvitee = await api.post('/invitees', {
        pot_id: parseInt(potId),
        ...data
      });

      // Tracker l'événement
      await api.post('/analytics', {
        pot_id: parseInt(potId),
        event_type: 'invitee_added',
        event_category: 'user_interaction',
        event_data: {
          invitation_method: 'manual'
        }
      });

      onInviteeAdded({
        id: newInvitee.id.toString(),
        name: newInvitee.name,
        whatsapp_number: newInvitee.whatsapp_number,
        email: newInvitee.email,
        qr_code_generated: newInvitee.qr_code_generated,
        invitation_sent: newInvitee.invitation_sent,
        status: newInvitee.status
      });

      reset();
      toast.success('Invité ajouté avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'ajout de l\'invité');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveInvitee = async (inviteeId: string) => {
    try {
      await api.delete(`/invitees?id=${inviteeId}`);
      onInviteeRemoved(inviteeId);
      toast.success('Invité supprimé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleGenerateQRCodes = async () => {
    setIsGeneratingQR(true);
    try {
      // Générer des QR codes pour tous les invités qui n'en ont pas
      const inviteesWithoutQR = invitees.filter(inv => !inv.qr_code_generated);
      
      const qrPromises = inviteesWithoutQR.map(async (invitee) => {
        return api.post('/qr-codes', {
          pot_id: parseInt(potId),
          invitee_id: parseInt(invitee.id),
          qr_type: 'invitee',
          payload: {
            invitee_name: invitee.name,
            pot_id: potId
          }
        });
      });

      await Promise.all(qrPromises);

      // Tracker l'événement
      await api.post('/analytics', {
        pot_id: parseInt(potId),
        event_type: 'qr_codes_generated',
        event_category: 'system_event',
        event_data: {
          count: inviteesWithoutQR.length
        }
      });

      onGenerateQRCodes();
      toast.success(`${inviteesWithoutQR.length} QR codes générés avec succès !`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération des QR codes');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleSendInvitations = async () => {
    try {
      // Simuler l'envoi d'invitations
      const inviteesWithoutInvitation = invitees.filter(inv => !inv.invitation_sent);
      
      // Mettre à jour le statut des invitations
      const updatePromises = inviteesWithoutInvitation.map(async (invitee) => {
        return api.put(`/invitees?id=${invitee.id}`, {
          invitation_sent: true,
          invitation_sent_at: new Date().toISOString()
        });
      });

      await Promise.all(updatePromises);

      // Tracker l'événement
      await api.post('/analytics', {
        pot_id: parseInt(potId),
        event_type: 'invitations_sent',
        event_category: 'marketing',
        event_data: {
          count: inviteesWithoutInvitation.length,
          channels: ['whatsapp', 'email']
        }
      });

      toast.success(`Invitations envoyées à ${inviteesWithoutInvitation.length} personnes !`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi des invitations');
    }
  };

  const handleDownloadQRCodes = async () => {
    try {
      // Générer un rapport PDF avec tous les QR codes
      await api.post('/reports', {
        report_type: 'qr_usage',
        report_name: `QR_Codes_Pot_${potId}`,
        pot_id: parseInt(potId),
        parameters: {
          include_qr_images: true,
          format: 'pdf'
        }
      });

      toast.success('Génération du PDF en cours... Vous recevrez une notification quand il sera prêt.');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération du PDF');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Formulaire d'ajout */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Ajouter des invités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                {...register('name')}
                placeholder="Nom de l'invité"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  {...register('whatsapp_number')}
                  placeholder="Numéro WhatsApp (optionnel)"
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Email (optionnel)"
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                  disabled={isLoading}
                />
              </div>
            </div>

            {errors.whatsapp_number && (
              <p className="text-red-400 text-sm">{errors.whatsapp_number.message}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ajout...
                </>
              ) : (
                'Ajouter l\'invité'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste des invités */}
      {invitees.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">
              Invités ({invitees.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleSendInvitations}
                className="bg-blue-500 hover:bg-blue-600"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer invitations
              </Button>
              <Button
                onClick={handleGenerateQRCodes}
                disabled={isGeneratingQR}
                className="bg-green-500 hover:bg-green-600"
                size="sm"
              >
                {isGeneratingQR ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Générer QR
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownloadQRCodes}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {invitees.map((invitee, index) => (
                <motion.div
                  key={invitee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{invitee.name}</div>
                    <div className="text-sm text-white/70">
                      {invitee.whatsapp_number && (
                        <span>📱 {invitee.whatsapp_number}</span>
                      )}
                      {invitee.whatsapp_number && invitee.email && ' • '}
                      {invitee.email && (
                        <span>✉️ {invitee.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {invitee.qr_code_generated && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        QR généré
                      </Badge>
                    )}
                    {invitee.invitation_sent && (
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        <Send className="h-3 w-3 mr-1" />
                        Envoyé
                      </Badge>
                    )}
                    <Button
                      onClick={() => handleRemoveInvitee(invitee.id)}
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

            {/* Statistiques */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {invitees.filter(i => i.qr_code_generated).length}
                  </div>
                  <div className="text-xs text-white/70">QR générés</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {invitees.filter(i => i.invitation_sent).length}
                  </div>
                  <div className="text-xs text-white/70">Invitations envoyées</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {invitees.filter(i => i.status === 'confirmed').length}
                  </div>
                  <div className="text-xs text-white/70">Confirmés</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {invitees.length === 0 && (
        <div className="text-center py-8 text-white/60">
          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun invité ajouté pour le moment</p>
          <p className="text-sm">Ajoutez des invités pour générer leurs QR codes et envoyer des invitations</p>
        </div>
      )}
    </div>
  );
}
