
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { UserProfileCard } from '@/components/wolo/UserProfileCard';
import { CountdownTimer } from '@/components/wolo/CountdownTimer';
import { ProgressBar } from '@/components/wolo/ProgressBar';
import { ParticipantCounter } from '@/components/wolo/ParticipantCounter';
import { User } from '@/types/wolo';

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const demoUser: User = {
    id: 'demo',
    email: 'awa@example.com',
    first_name: 'Awa',
    last_name: 'Diallo',
    profile_picture_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    phone: '+221 77 123 45 67',
    is_facebook_user: true,
    status: 'active',
    created_at: new Date().toISOString()
  };

  const demoSteps = [
    {
      title: 'Profil utilisateur',
      description: 'Profil en haut à gauche avec photo et informations Facebook',
      component: <UserProfileCard user={demoUser} />
    },
    {
      title: 'Compte à rebours',
      description: 'Countdown dynamique jusqu\'à l\'anniversaire',
      component: <CountdownTimer targetDate="2024-12-25T00:00:00Z" />
    },
    {
      title: 'Progression de la cagnotte',
      description: 'Barre de progression avec sablier animé',
      component: <ProgressBar current={24000} target={50000} />
    },
    {
      title: 'Nombre de participants',
      description: 'Compteur des contributeurs',
      component: <ParticipantCounter count={23} />
    }
  ];

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % demoSteps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + demoSteps.length) % demoSteps.length);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // Auto-play functionality
  useState(() => {
    if (isPlaying) {
      const interval = setInterval(nextStep, 3000);
      return () => clearInterval(interval);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-20"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: -50,
              rotate: 0 
            }}
            animate={{ 
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
              rotate: 360
            }}
            transition={{ 
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          >
            🎭
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link href="https://wolo-cagnotte.zoer.ai/landing">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-white">
            Démo WOLO SENEGAL
          </h1>
          
          <div className="w-20" /> {/* Spacer */}
        </motion.div>

        {/* Demo Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-4 mb-8"
        >
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={prevStep}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Précédent
          </Button>
          
          <Button
            onClick={nextStep}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Suivant
          </Button>
          
          <Button
            onClick={resetDemo}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-2 mb-8"
        >
          {demoSteps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-white scale-125' 
                  : 'bg-white/30'
              }`}
            />
          ))}
        </motion.div>

        {/* Demo Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-white/20 backdrop-blur-lg border-white/30 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                  Étape {currentStep + 1} / {demoSteps.length}
                </Badge>
              </div>
              <CardTitle className="text-2xl text-white">
                {demoSteps[currentStep].title}
              </CardTitle>
              <p className="text-white/80">
                {demoSteps[currentStep].description}
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex justify-center">
                {demoSteps[currentStep].component}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Demo Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              title: 'Interface festive',
              description: 'Animations et effets visuels pour une expérience joyeuse',
              icon: '🎉'
            },
            {
              title: 'Temps réel',
              description: 'Mise à jour instantanée des donations et participants',
              icon: '⚡'
            },
            {
              title: 'Mobile-first',
              description: 'Optimisé pour tous les appareils mobiles',
              icon: '📱'
            },
            {
              title: 'Sécurisé',
              description: 'Paiements sécurisés via Wave Business',
              icon: '🔒'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-full">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-12"
        >
          <Card className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-lg border-yellow-400/30 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Prêt à créer votre cagnotte ?
              </h2>
              <p className="text-white/90 mb-6">
                Rejoignez WOLO SENEGAL et transformez votre anniversaire en expérience mémorable
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="https://wolo-cagnotte.zoer.ai/landing">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full"
                  >
                    Commencer maintenant
                  </Button>
                </Link>
                <Link href="https://wolo-cagnotte.zoer.ai/user/demo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-full"
                  >
                    Voir page utilisateur
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
