
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
}

interface TimeLeft {
  jours: number;
  heures: number;
  minutes: number;
  secondes: number;
}

export function CountdownTimer({ targetDate, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    jours: 0,
    heures: 0,
    minutes: 0,
    secondes: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          jours: Math.floor(difference / (1000 * 60 * 60 * 24)),
          heures: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          secondes: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ jours: 0, heures: 0, minutes: 0, secondes: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [targetDate]);

  const timeUnits = [
    { value: timeLeft.jours, label: 'Jours' },
    { value: timeLeft.heures, label: 'Heures' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.secondes, label: 'Secondes' }
  ];

  return (
    <div className={`flex justify-center gap-4 ${className}`}>
      {timeUnits.map((unit, index) => (
        <motion.div
          key={unit.label}
          className="flex flex-col items-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <motion.div
            className="bg-white/30 backdrop-blur-sm rounded-lg p-3 min-w-[60px] text-center border border-white/40 shadow-lg"
            whileHover={{ scale: 1.05 }}
            key={unit.value}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-2xl font-bold text-white drop-shadow-lg">
              {unit.value.toString().padStart(2, '0')}
            </div>
          </motion.div>
          <div className="text-sm text-white/90 mt-1 font-semibold drop-shadow">
            {unit.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
