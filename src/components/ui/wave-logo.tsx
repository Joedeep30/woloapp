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
      {/* Wave Senegal Penguin Logo - Enhanced */}
      
      {/* Shadow for depth */}
      <ellipse cx="52" cy="67" rx="24" ry="28" fill="#000000" opacity="0.1" />
      
      {/* Penguin body - Darker for contrast */}
      <ellipse cx="50" cy="65" rx="25" ry="30" fill="#0F172A" stroke="#334155" strokeWidth="1" />
      
      {/* Penguin belly - Pure white for contrast */}
      <ellipse cx="50" cy="62" rx="18" ry="22" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
      
      {/* Penguin head - Matching body */}
      <circle cx="50" cy="35" r="20" fill="#0F172A" stroke="#334155" strokeWidth="1" />
      
      {/* Penguin beak - Wave orange/yellow */}
      <path d="M42 38 L58 38 L50 45 Z" fill="#FF6B35" stroke="#DC2626" strokeWidth="0.5" />
      
      {/* Penguin eyes - Larger and more expressive */}
      <circle cx="43" cy="32" r="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.5" />
      <circle cx="57" cy="32" r="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.5" />
      <circle cx="43" cy="32" r="2" fill="#0F172A" />
      <circle cx="57" cy="32" r="2" fill="#0F172A" />
      
      {/* Eye shine */}
      <circle cx="44" cy="31" r="0.8" fill="#FFFFFF" />
      <circle cx="58" cy="31" r="0.8" fill="#FFFFFF" />
      
      {/* Penguin wings - More defined */}
      <ellipse cx="28" cy="55" rx="10" ry="18" fill="#0F172A" transform="rotate(-25 28 55)" stroke="#334155" strokeWidth="0.5" />
      <ellipse cx="72" cy="55" rx="10" ry="18" fill="#0F172A" transform="rotate(25 72 55)" stroke="#334155" strokeWidth="0.5" />
      
      {/* Penguin feet - Wave orange */}
      <ellipse cx="40" cy="92" rx="5" ry="3" fill="#FF6B35" stroke="#DC2626" strokeWidth="0.5" />
      <ellipse cx="60" cy="92" rx="5" ry="3" fill="#FF6B35" stroke="#DC2626" strokeWidth="0.5" />
      
      {/* Wave pattern on belly - Wave blue */}
      <path d="M32 52 Q40 48 50 52 T68 52" stroke="#0EA5E9" strokeWidth="2.5" fill="none" opacity="0.8" />
      <path d="M32 60 Q40 56 50 60 T68 60" stroke="#0EA5E9" strokeWidth="2.5" fill="none" opacity="0.8" />
      <path d="M32 68 Q40 64 50 68 T68 68" stroke="#0EA5E9" strokeWidth="2" fill="none" opacity="0.6" />
      
      {/* Wave logo accent */}
      <circle cx="50" cy="20" r="3" fill="#0EA5E9" opacity="0.7" />
      <text x="50" y="24" textAnchor="middle" fontSize="8" fill="#0EA5E9" fontWeight="bold">W</text>
    </svg>
  );
};

export default WaveLogo;