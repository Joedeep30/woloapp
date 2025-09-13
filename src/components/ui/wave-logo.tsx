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
      {/* Wave Senegal Penguin Logo */}
      {/* Penguin body */}
      <ellipse cx="50" cy="65" rx="25" ry="30" fill="#1E293B" />
      
      {/* Penguin belly */}
      <ellipse cx="50" cy="62" rx="18" ry="22" fill="#FFFFFF" />
      
      {/* Penguin head */}
      <circle cx="50" cy="35" r="20" fill="#1E293B" />
      
      {/* Penguin beak */}
      <path d="M45 38 L55 38 L50 42 Z" fill="#F59E0B" />
      
      {/* Penguin eyes */}
      <circle cx="44" cy="32" r="3" fill="#FFFFFF" />
      <circle cx="56" cy="32" r="3" fill="#FFFFFF" />
      <circle cx="44" cy="32" r="1.5" fill="#1E293B" />
      <circle cx="56" cy="32" r="1.5" fill="#1E293B" />
      
      {/* Penguin wings */}
      <ellipse cx="30" cy="55" rx="8" ry="15" fill="#1E293B" transform="rotate(-20 30 55)" />
      <ellipse cx="70" cy="55" rx="8" ry="15" fill="#1E293B" transform="rotate(20 70 55)" />
      
      {/* Penguin feet */}
      <ellipse cx="42" cy="90" rx="4" ry="2" fill="#F59E0B" />
      <ellipse cx="58" cy="90" rx="4" ry="2" fill="#F59E0B" />
      
      {/* Wave pattern on belly */}
      <path d="M35 55 Q42 50 50 55 T65 55" stroke="#3B82F6" strokeWidth="2" fill="none" />
      <path d="M35 65 Q42 60 50 65 T65 65" stroke="#3B82F6" strokeWidth="2" fill="none" />
    </svg>
  );
};

export default WaveLogo;