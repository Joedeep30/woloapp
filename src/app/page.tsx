
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

  // Set launch date to 10 days from now
  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + 10);

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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{ 
              x: Math.random() * 1200,
              y: Math.random() * 800,
            }}
            animate={{ 
              y: [null, -20, 20],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "reverse",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 flex flex-col items-center justify-center min-h-screen">
        {/* IMPROVED WOLO Logo - Bigger and Better */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-center mb-8"
        >
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
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <span className="inline-block px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-lg font-medium">
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
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            animate={{ 
              textShadow: [
                "0 0 0px rgba(255,255,255,0)",
                "0 0 10px rgba(255,255,255,0.3)",
                "0 0 0px rgba(255,255,255,0)"
              ]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Wolo Senegal is being engineered...
          </motion.h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Notre plateforme révolutionnaire de cagnottes collaboratives arrive bientôt.
          </p>
        </motion.div>

        {/* FIXED Countdown - 10 days and counting */}
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
              animate={unit.label === 'Secondes' ? { 
                scale: [1, 1.02, 1],
              } : {}}
              transition={unit.label === 'Secondes' ? {
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              } : {}}
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
              <motion.h3 
                className="text-2xl font-bold text-white text-center mb-6"
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 5px rgba(255,255,255,0.2)",
                    "0 0 0px rgba(255,255,255,0)"
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                Soyez les premiers informés
              </motion.h3>
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
          {/* Subtle heartbeat animation for the copyright */}
          <motion.p 
            className="text-white/40 text-xs mt-2"
            animate={{ 
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Made with ❤️ in Senegal
          </motion.p>
          {/* Version indicator */}
          <motion.p 
            className="text-white/30 text-xs mt-1"
            animate={{ 
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            v1.0.0
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}



