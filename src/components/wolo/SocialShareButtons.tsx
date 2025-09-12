
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Video, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface SocialShareButtonsProps {
  potId: string;
  shareUrl: string;
  title: string;
  description: string;
  className?: string;
}

// Composant Instagram Icon séparé
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export function SocialShareButtons({ 
  potId, 
  shareUrl, 
  title, 
  description, 
  className = "" 
}: SocialShareButtonsProps) {
  const [isSharing, setIsSharing] = useState(false);

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      platform: 'whatsapp',
      action: () => shareToWhatsApp()
    },
    {
      name: 'Facebook',
      icon: Share2,
      color: 'bg-blue-600 hover:bg-blue-700',
      platform: 'facebook',
      action: () => shareToFacebook()
    },
    {
      name: 'TikTok',
      icon: Video,
      color: 'bg-black hover:bg-gray-800',
      platform: 'tiktok',
      action: () => shareToTikTok()
    },
    {
      name: 'Snapchat',
      icon: Camera,
      color: 'bg-yellow-400 hover:bg-yellow-500',
      platform: 'snapchat',
      action: () => shareToSnapchat()
    },
    {
      name: 'Instagram',
      icon: InstagramIcon,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      platform: 'instagram',
      action: () => shareToInstagram()
    }
  ];

  const trackShare = async (platform: string) => {
    try {
      // Enregistrer le partage dans l'API
      await api.post('/social-shares', {
        pot_id: parseInt(potId),
        platform: platform,
        share_url: shareUrl,
        is_automatic: false
      });

      // Tracker l'événement analytics
      await api.post('/analytics', {
        pot_id: parseInt(potId),
        event_type: 'share_click',
        event_category: 'user_interaction',
        event_data: {
          platform: platform,
          share_url: shareUrl
        }
      });
    } catch (error) {
      console.error('Erreur lors du tracking du partage:', error);
    }
  };

  const shareToWhatsApp = async () => {
    const text = encodeURIComponent(`${title}\n\n${description}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    await trackShare('whatsapp');
    toast.success('Partagé sur WhatsApp !');
  };

  const shareToFacebook = async () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    await trackShare('facebook');
    toast.success('Partagé sur Facebook !');
  };

  const shareToTikTok = async () => {
    // TikTok ne permet pas de partage direct d'URL, on copie le lien
    navigator.clipboard.writeText(shareUrl);
    await trackShare('tiktok');
    toast.success('Lien copié ! Collez-le dans votre vidéo TikTok');
  };

  const shareToSnapchat = async () => {
    // Snapchat ne permet pas de partage direct d'URL, on copie le lien
    navigator.clipboard.writeText(shareUrl);
    await trackShare('snapchat');
    toast.success('Lien copié ! Partagez-le sur Snapchat');
  };

  const shareToInstagram = async () => {
    // Instagram ne permet pas de partage direct d'URL, on copie le lien et ouvre Instagram
    navigator.clipboard.writeText(`${title}\n\n${description}\n\n${shareUrl}`);
    window.open('https://www.instagram.com/', '_blank');
    await trackShare('instagram');
    toast.success('Lien copié ! Partagez-le dans votre story Instagram');
  };

  const shareToAll = async () => {
    setIsSharing(true);
    
    try {
      // Partage automatique sur tous les réseaux pré-sélectionnés
      const sharePromises = socialPlatforms.map(async (platform) => {
        await platform.action();
        
        // Enregistrer comme partage automatique
        await api.post('/social-shares', {
          pot_id: parseInt(potId),
          platform: platform.platform,
          share_url: shareUrl,
          is_automatic: true
        });
      });
      
      await Promise.all(sharePromises);
      
      // Tracker l'événement de partage automatique
      await api.post('/analytics', {
        pot_id: parseInt(potId),
        event_type: 'auto_share_all',
        event_category: 'marketing',
        event_data: {
          platforms: socialPlatforms.map(p => p.platform),
          share_url: shareUrl
        }
      });
      
      toast.success('Invitations partagées sur tous vos réseaux (y compris Instagram) !');
    } catch (error) {
      console.error('Erreur lors du partage automatique:', error);
      toast.error('Erreur lors du partage automatique');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bouton de partage automatique */}
      <Button
        onClick={shareToAll}
        disabled={isSharing}
        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-3"
        size="lg"
      >
        {isSharing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Partage en cours...
          </>
        ) : (
          'Partager sur tous les réseaux (+ Instagram)'
        )}
      </Button>

      {/* Boutons individuels harmonisés */}
      <div className="grid grid-cols-2 gap-3">
        {socialPlatforms.slice(0, 2).map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              onClick={platform.action}
              className={`w-full ${platform.color} text-white h-12`}
              variant="default"
              disabled={isSharing}
            >
              <platform.icon className="h-4 w-4 mr-2" />
              <span className="ml-2">{platform.name}</span>
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {socialPlatforms.slice(2).map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 2) * 0.1 }}
          >
            <Button
              onClick={platform.action}
              className={`w-full ${platform.color} text-white h-12 text-sm`}
              variant="default"
              disabled={isSharing}
            >
              <platform.icon className="h-4 w-4" />
              <span className="ml-1">{platform.name}</span>
            </Button>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-white/70 text-center">
        Chaque partage est automatiquement enregistré pour les statistiques.
        Les liens sont trackés pour mesurer l'efficacité de vos invitations.
        <br />
        <strong>Instagram :</strong> Pas de connexion OAuth, mais partage via story disponible !
      </p>
    </div>
  );
}
