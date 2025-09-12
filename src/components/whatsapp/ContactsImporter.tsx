
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Contact, 
  Phone, 
  Users, 
  MessageCircle, 
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  isSelected: boolean;
  isExistingUser?: boolean;
}

interface ContactsImporterProps {
  onContactsImported?: (contacts: WhatsAppContact[]) => void;
  onInvitationsSent?: (selectedContacts: WhatsAppContact[]) => void;
  className?: string;
}

export function ContactsImporter({ 
  onContactsImported, 
  onInvitationsSent, 
  className = "" 
}: ContactsImporterProps) {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);

  // Demander l'accès aux contacts WhatsApp
  const requestContactsAccess = async () => {
    try {
      setIsLoadingContacts(true);
      
      // Vérifier si l'API Contacts est disponible
      if (!('contacts' in navigator) || !navigator.contacts) {
        // Fallback pour les navigateurs qui ne supportent pas l'API Contacts
        await loadMockContacts();
        return;
      }

      // Demander la permission d'accès aux contacts
      const contactsData = await (navigator as any).contacts.select(['name', 'tel'], { multiple: true });
      
      if (contactsData && contactsData.length > 0) {
        // Filtrer et formater les contacts avec numéros de téléphone
        const formattedContacts = contactsData
          .filter((contact: any) => contact.tel && contact.tel.length > 0)
          .map((contact: any, index: number) => ({
            id: `contact_${index}`,
            name: contact.name || 'Contact sans nom',
            phone: contact.tel[0] || '',
            isSelected: false,
            isExistingUser: Math.random() > 0.7 // Simuler des utilisateurs existants
          }));

        setContacts(formattedContacts);
        setHasPermission(true);
        setShowContactsDialog(true);
        
        toast.success(`${formattedContacts.length} contacts WhatsApp chargés !`);
        onContactsImported?.(formattedContacts);
      } else {
        toast.info('Aucun contact trouvé ou accès refusé');
      }
    } catch (error) {
      console.error('Erreur lors de l\'accès aux contacts:', error);
      await loadMockContacts();
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Charger des contacts de démonstration
  const loadMockContacts = async () => {
    const mockContacts: WhatsAppContact[] = [
      { id: 'contact_1', name: 'Fatou Ba', phone: '+221771234567', isSelected: false, isExistingUser: true },
      { id: 'contact_2', name: 'Ousmane Diop', phone: '+221771234568', isSelected: false, isExistingUser: false },
      { id: 'contact_3', name: 'Aminata Fall', phone: '+221771234569', isSelected: false, isExistingUser: false },
      { id: 'contact_4', name: 'Mamadou Sow', phone: '+221771234570', isSelected: false, isExistingUser: true },
      { id: 'contact_5', name: 'Khadija Ndiaye', phone: '+221771234571', isSelected: false, isExistingUser: false },
      { id: 'contact_6', name: 'Ibrahima Sarr', phone: '+221771234572', isSelected: false, isExistingUser: false },
      { id: 'contact_7', name: 'Aïssatou Diallo', phone: '+221771234573', isSelected: false, isExistingUser: true }
    ];
    
    setContacts(mockContacts);
    setHasPermission(true);
    setShowContactsDialog(true);
    
    toast.success('Contacts WhatsApp simulés chargés pour la démo !');
    onContactsImported?.(mockContacts);
  };

  // Sélectionner/désélectionner un contact
  const handleContactSelection = (contactId: string, selected: boolean) => {
    if (selected) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  // Sélectionner tous les contacts
  const handleSelectAllContacts = (selected: boolean) => {
    if (selected) {
      setSelectedContacts(contacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  // Envoyer invitations aux contacts sélectionnés
  const handleSendInvitations = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Veuillez sélectionner au moins un contact');
      return;
    }

    setIsSendingInvitations(true);
    
    try {
      const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
      
      // Simuler l'envoi d'invitations de parrainage via WhatsApp
      for (const contact of selectedContactsData) {
        const invitationMessage = `Salut ${contact.name} ! 🎉 J'ai découvert WOLO SENEGAL, une super plateforme pour organiser des cagnottes d'anniversaire avec des cadeaux cinéma ! Ton anniversaire approche et je pense que ça pourrait t'intéresser. Tu veux que WOLO gère ta cagnotte d'anniversaire ? C'est gratuit et très facile ! 🎂🎁`;
        
        // Ouvrir WhatsApp avec le message pré-rempli
        const whatsappUrl = `https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(invitationMessage)}`;
        
        // Ouvrir dans un nouvel onglet avec un délai pour éviter le blocage des popups
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, selectedContactsData.indexOf(contact) * 500);
      }
      
      toast.success(`Invitations de parrainage envoyées à ${selectedContacts.length} contact(s) WhatsApp !`);
      toast.info('Vous recevrez 10 points pour chaque personne qui accepte et crée sa cagnotte !');
      
      // Callback pour notifier le parent
      onInvitationsSent?.(selectedContactsData);
      
      // Réinitialiser la sélection
      setSelectedContacts([]);
      setShowContactsDialog(false);
      
    } catch (error) {
      toast.error('Erreur lors de l\'envoi des invitations WhatsApp');
    } finally {
      setIsSendingInvitations(false);
    }
  };

  // Exporter les contacts sélectionnés
  const handleExportContacts = () => {
    if (selectedContacts.length === 0) {
      toast.error('Veuillez sélectionner au moins un contact');
      return;
    }

    const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
    const csvContent = selectedContactsData.map(contact => 
      `${contact.name},${contact.phone},${contact.isExistingUser ? 'Oui' : 'Non'}`
    ).join('\n');
    
    const csvHeader = 'Nom,Téléphone,Utilisateur WOLO\n';
    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-whatsapp-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Export des contacts sélectionnés terminé !');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bouton principal d'accès aux contacts */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Contact className="h-5 w-5 text-green-600" />
            Invitation via vos contacts WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 text-sm mb-4">
            Accédez à votre liste de contacts WhatsApp et invitez plusieurs amis en même temps pour le parrainage !
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={requestContactsAccess}
              disabled={isLoadingContacts}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoadingContacts ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Chargement...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Accéder à mes contacts WhatsApp
                </>
              )}
            </Button>
            
            {hasPermission && (
              <Button
                onClick={() => setShowContactsDialog(true)}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Voir mes contacts ({contacts.length})
              </Button>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-700 text-sm">
              💡 <strong>Astuce :</strong> Sélectionnez plusieurs contacts pour envoyer des invitations de parrainage en masse. 
              Chaque personne qui accepte vous rapportera 10 points + bonus selon leur succès !
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour sélection des contacts WhatsApp */}
      <Dialog open={showContactsDialog} onOpenChange={setShowContactsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Sélectionner vos contacts WhatsApp pour le parrainage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Contrôles de sélection */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="select-all-contacts"
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  onCheckedChange={handleSelectAllContacts}
                />
                <Label htmlFor="select-all-contacts" className="font-medium">
                  Tout sélectionner ({selectedContacts.length}/{contacts.length})
                </Label>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSendInvitations}
                  disabled={selectedContacts.length === 0 || isSendingInvitations}
                  className="bg-green-500 hover:bg-green-600"
                  size="sm"
                >
                  {isSendingInvitations ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Inviter ({selectedContacts.length})
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleExportContacts}
                  disabled={selectedContacts.length === 0}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            {/* Liste des contacts avec cases à cocher */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedContacts.includes(contact.id)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}>
                  <Checkbox
                    id={`contact-${contact.id}`}
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={(checked) => handleContactSelection(contact.id, checked as boolean)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      {contact.isExistingUser && (
                        <Badge className="bg-blue-500/20 text-blue-700 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Déjà utilisateur WOLO
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{contact.phone}</div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    WhatsApp
                  </div>
                </div>
              ))}
            </div>

            {contacts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Contact className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun contact WhatsApp trouvé</p>
                <p className="text-sm">Assurez-vous d'avoir des contacts dans votre téléphone</p>
              </div>
            )}

            {/* Statistiques des contacts */}
            {contacts.length > 0 && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{contacts.length}</div>
                  <div className="text-xs text-gray-600">Total contacts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {contacts.filter(c => c.isExistingUser).length}
                  </div>
                  <div className="text-xs text-gray-600">Déjà utilisateurs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {contacts.filter(c => !c.isExistingUser).length}
                  </div>
                  <div className="text-xs text-gray-600">Nouveaux prospects</div>
                </div>
              </div>
            )}

            {/* Informations sur le système de points */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 mb-2">
                <Star className="h-4 w-4" />
                <span className="font-medium">Système de points WOLO :</span>
              </div>
              <div className="text-purple-600 text-sm space-y-1">
                <p>🎯 <strong>10 points</strong> pour chaque invitation acceptée</p>
                <p>📈 <strong>Points bonus</strong> selon le succès de leur cagnotte</p>
                <p>🔄 <strong>Effet viral :</strong> Plus vos filleuls réussissent, plus vous gagnez</p>
                <p>⚠️ <strong>Note :</strong> Les utilisateurs existants peuvent aussi être parrainés</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statistiques d'utilisation */}
      {hasPermission && contacts.length > 0 && (
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vos contacts WhatsApp ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{contacts.length}</div>
                <div className="text-sm text-green-700">Contacts importés</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {contacts.filter(c => c.isExistingUser).length}
                </div>
                <div className="text-sm text-blue-700">Déjà utilisateurs</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">
                  {contacts.filter(c => !c.isExistingUser).length}
                </div>
                <div className="text-sm text-purple-700">Nouveaux prospects</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">
                  {Math.round((contacts.filter(c => !c.isExistingUser).length / contacts.length) * 100)}%
                </div>
                <div className="text-sm text-orange-700">Potentiel viral</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => setShowContactsDialog(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Envoyer invitations
              </Button>
              <Button
                onClick={() => {
                  const csvContent = contacts.map(contact => 
                    `${contact.name},${contact.phone},${contact.isExistingUser ? 'Oui' : 'Non'}`
                  ).join('\n');
                  
                  const csvHeader = 'Nom,Téléphone,Utilisateur WOLO\n';
                  const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `tous-contacts-whatsapp-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  
                  toast.success('Export de tous les contacts terminé !');
                }}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter tous
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
