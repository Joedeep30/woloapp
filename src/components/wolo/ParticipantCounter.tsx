
"use client";

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface ParticipantCounterProps {
  count: number;
  className?: string;
}

export function ParticipantCounter({ count, className = "" }: ParticipantCounterProps) {
  return (
    <motion.div 
      className={`flex items-center gap-2 bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/40 shadow-lg ${className}`}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Users className="h-5 w-5 text-white drop-shadow" />
      <div className="text-white">
        <span className="font-bold text-lg drop-shadow-lg">{count}</span>
        <span className="text-sm ml-1 drop-shadow font-semibold">
          {count === 1 ? 'Participant' : 'Participants'}
        </span>
      </div>
    </motion.div>
  );
}
