import React from 'react';

interface WaveLogoProps {
  className?: string;
  size?: number;
}

export const WaveLogo: React.FC<WaveLogoProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Wave Mobile Penguin Logo */}
      
      {/* Shadow for depth */}
      <ellipse cx="52" cy="67" rx="24" ry="28" fill="#000000" opacity="0.1" />
      
      {/* Penguin body - Wave blue */}
      <ellipse cx="50" cy="65" rx="25" ry="30" fill="#003366" stroke="#0066CC" strokeWidth="1" />
      
      {/* Penguin belly - Pure white */}
      <ellipse cx="50" cy="62" rx="18" ry="22" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="0.5" />
      
      {/* Penguin head */}
      <circle cx="50" cy="35" r="20" fill="#003366" stroke="#0066CC" strokeWidth="1" />
      
      {/* Penguin beak - Wave orange */}
      <path d="M42 38 L58 38 L50 45 Z" fill="#FF6600" stroke="#E55A00" strokeWidth="0.5" />
      
      {/* Penguin eyes */}
      <circle cx="43" cy="32" r="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.5" />
      <circle cx="57" cy="32" r="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.5" />
      <circle cx="43" cy="32" r="2" fill="#003366" />
      <circle cx="57" cy="32" r="2" fill="#003366" />
      
      {/* Eye shine */}
      <circle cx="44" cy="31" r="0.8" fill="#FFFFFF" />
      <circle cx="58" cy="31" r="0.8" fill="#FFFFFF" />
      
      {/* Penguin wings */}
      <ellipse cx="28" cy="55" rx="10" ry="18" fill="#003366" transform="rotate(-25 28 55)" stroke="#0066CC" strokeWidth="0.5" />
      <ellipse cx="72" cy="55" rx="10" ry="18" fill="#003366" transform="rotate(25 72 55)" stroke="#0066CC" strokeWidth="0.5" />
      
      {/* Penguin feet - Wave orange */}
      <ellipse cx="40" cy="92" rx="5" ry="3" fill="#FF6600" stroke="#E55A00" strokeWidth="0.5" />
      <ellipse cx="60" cy="92" rx="5" ry="3" fill="#FF6600" stroke="#E55A00" strokeWidth="0.5" />
      
      {/* Wave pattern on belly */}
      <path d="M32 52 Q40 48 50 52 T68 52" stroke="#0066CC" strokeWidth="2" fill="none" opacity="0.8" />
      <path d="M32 60 Q40 56 50 60 T68 60" stroke="#0066CC" strokeWidth="2" fill="none" opacity="0.8" />
      <path d="M32 68 Q40 64 50 68 T68 68" stroke="#0066CC" strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
  );
};

export default WaveLogo;