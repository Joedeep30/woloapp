"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";

interface TimeLeft {
  jours: number;
  heures: number;
  minutes: number;
  secondes: number;
}

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    jours: 10,
    heures: 0,
    minutes: 0,
    secondes: 0
  });
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  // Set launch date to 10 days from now - fixed with useMemo
  const launchDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 10);
    return date;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          jours: Math.floor(distance / (1000 * 60 * 60 * 24)),
          heures: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          secondes: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [launchDate]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Show toast notification for email submission
    toast({
      title: "Inscription réussie!",
      description: "Merci! Vous serez informé lors du lancement.",
    });
    setEmail('');
  };

  // This is a simple comment to trigger deployment

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Simple background without animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none"></div>

      <div className="container mx-auto px-4 py-8 relative z-10 flex flex-col items-center justify-center min-h-screen">
        {/* WOLO Logo */}
        <div className="text-center mb-8">
          <div className="relative mb-8">
            <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
              <defs>
                <linearGradient id="wolo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="25%" stopColor="#0099FF" />
                  <stop offset="50%" stopColor="#FF00D4" />
                  <stop offset="75%" stopColor="#FF6B00" />
                  <stop offset="100%" stopColor="#FFB800" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <text
                x="100"
                y="130"
                fontSize="120"
                fontWeight="900"
                textAnchor="middle"
                fill="url(#wolo-gradient)"
                fontFamily="Arial Black, sans-serif"
                filter="url(#glow)"
              >
                W
              </text>
            </svg>
          </div>
          
          <h1 className="text-6xl font-black text-white mb-3 tracking-tight">WOLO</h1>
          <p className="text-3xl text-white/90 tracking-widest font-light">SENEGAL</p>
          
          <div className="mt-6">
            <span className="inline-block px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-lg font-medium">
              🚀 Bientôt Disponible
            </span>
          </div>
        </div>

        {/* Main title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Wolo Senegal is being engineered...
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Notre plateforme révolutionnaire de cagnottes collaboratives arrive bientôt.
          </p>
        </div>

        {/* Countdown - 10 days and counting */}
        <div className="flex gap-6 mb-12">
          {[
            { value: timeLeft.jours, label: 'Jours' },
            { value: timeLeft.heures, label: 'Heures' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.secondes, label: 'Secondes' }
          ].map((unit) => (
            <div
              key={unit.label}
              className="flex flex-col items-center"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 min-w-[100px] border border-white/30">
                <div className="text-3xl md:text-4xl font-bold text-white text-center">
                  {String(unit.value).padStart(2, '0')}
                </div>
                <div className="text-white/70 text-sm text-center mt-2 font-medium">
                  {unit.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Email subscription */}
        <div className="w-full max-w-md">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white text-center mb-6">
                Soyez les premiers informés
              </h3>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white/50"
                  required
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg"
                >
                  M&apos;inscrire
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-white/60 text-sm">
            © 2025 WOLO SENEGAL® - From Connect Africa®
          </p>
          <p className="text-white/40 text-xs mt-2">
            Made with ❤️ in Senegal
          </p>
          <p className="text-white/30 text-xs mt-1">
            v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}