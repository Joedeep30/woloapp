
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Shield, Crown } from 'lucide-react';
import Link from 'next/link';

interface TimeLeft {
  jours: number;
  heures: number;
  minutes: number;
  secondes: number;
}

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    jours: 0,
    heures: 0,
    minutes: 0,
    secondes: 0
  });
  const [email, setEmail] = useState('');

  const launchDate = new Date('2025-02-01T00:00:00Z');

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
    console.log('Email submitted:', email);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Admin access buttons */}
      <div className="absolute top-6 right-6 flex gap-3 z-10">
        <Link href="/admin">
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </Link>
        <Link href="/super-admin">
          <Button variant="outline" className="border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/10">
            <Crown className="h-4 w-4 mr-2" />
            Super Admin
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 flex flex-col items-center justify-center min-h-screen">
        {/* WOLO Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-center mb-8"
        >
          <div className="relative mb-6">
            <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="50%" stopColor="#FF00D4" />
                  <stop offset="100%" stopColor="#FFB800" />
                </linearGradient>
              </defs>
              <text
                x="60"
                y="80"
                fontSize="80"
                fontWeight="bold"
                textAnchor="middle"
                fill="url(#gradient1)"
                fontFamily="Arial, sans-serif"
              >
                W
              </text>
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-2">WOLO</h1>
          <p className="text-2xl text-white/80 tracking-wider">SENEGAL</p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4"
          >
            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm">
              🚀 Bientôt Disponible
            </span>
          </motion.div>
        </motion.div>

        {/* Main title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Wolo Senegal is being engineered...
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Notre plateforme révolutionnaire de cagnottes collaboratives arrive bientôt.
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex gap-6 mb-12"
        >
          {[
            { value: timeLeft.jours, label: 'Jours' },
            { value: timeLeft.heures, label: 'Heures' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.secondes, label: 'Secondes' }
          ].map((unit) => (
            <motion.div
              key={unit.label}
              className="flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 min-w-[100px] border border-white/30">
                <div className="text-3xl md:text-4xl font-bold text-white text-center">
                  {String(unit.value).padStart(2, '0')}
                </div>
                <div className="text-white/70 text-sm text-center mt-2 font-medium">
                  {unit.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Email subscription */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="w-full max-w-md"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-white/60 text-sm">
            © 2025 WOLO SENEGAL® - From Connect Africa®
          </p>
        </motion.div>
      </div>
    </div>
  );
}


