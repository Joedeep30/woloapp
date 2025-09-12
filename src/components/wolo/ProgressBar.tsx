
"use client";

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  current: number;
  target?: number;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ 
  current, 
  target, 
  className = "",
  showPercentage = true 
}: ProgressBarProps) {
  const percentage = target ? Math.min((current / target) * 100, 100) : 0;
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-white drop-shadow-lg">
          La cagnotte grandit 🎁
        </span>
        {showPercentage && (
          <span className="text-xl font-bold text-white drop-shadow-lg">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      
      <div className="relative">
        <Progress 
          value={percentage} 
          className="h-6 bg-white/30 border-2 border-white/50 shadow-lg"
        />
        
        {/* SABLIER ANIMÉ FORT - Version améliorée avec meilleure visibilité */}
        <motion.div
          className="absolute -top-8 h-16 w-16 text-6xl filter drop-shadow-2xl"
          style={{ left: `${Math.min(percentage, 85)}%` }}
          animate={{ 
            rotate: [0, 180, 360],
            scale: [1, 1.4, 1],
            y: [0, -8, 0],
            filter: [
              "drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))",
              "drop-shadow(0 0 20px rgba(255, 255, 0, 1))",
              "drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))"
            ]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ⏳
        </motion.div>
        
        {/* Particules scintillantes autour du sablier - Plus visibles */}
        <motion.div
          className="absolute -top-6 h-3 w-3 bg-yellow-300 rounded-full shadow-lg"
          style={{ left: `${Math.min(percentage + 5, 90)}%` }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            x: [0, 15, 0],
            y: [0, -15, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0.2
          }}
        />
        <motion.div
          className="absolute -top-4 h-2 w-2 bg-white rounded-full shadow-lg"
          style={{ left: `${Math.min(percentage - 3, 87)}%` }}
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
            x: [0, -12, 0],
            y: [0, -12, 0]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: 0.5
          }}
        />
        <motion.div
          className="absolute -top-5 h-2 w-2 bg-orange-300 rounded-full shadow-lg"
          style={{ left: `${Math.min(percentage + 2, 92)}%` }}
          animate={{
            scale: [0, 1.3, 0],
            opacity: [0, 1, 0],
            x: [0, 8, 0],
            y: [0, -18, 0]
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: 0.8
          }}
        />
      </div>
      
      <div className="text-sm text-white/95 drop-shadow font-medium">
        Plus il y a de participations, plus le cadeau cinéma sera généreux.
        <br />
        Les montants exacts restent privés jusqu'à clôture pilote.
      </div>
    </div>
  );
}
