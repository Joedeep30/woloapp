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
      {/* Wave Mobile Senegal Logo - Redesigned */}
      
      {/* Background Circle - Wave Brand Colors */}
      <circle cx="50" cy="50" r="48" fill="#00A6FF" stroke="#0066CC" strokeWidth="2" />
      
      {/* Wave Symbol - Stylized W */}
      <path d="M20 30 L35 70 L45 45 L55 70 L65 45 L75 70 L80 30" 
            stroke="#FFFFFF" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" />
      
      {/* Wave Text */}
      <text x="50" y="85" 
            textAnchor="middle" 
            fontSize="12" 
            fill="#FFFFFF" 
            fontWeight="bold" 
            fontFamily="Arial, sans-serif">
        WAVE
      </text>
      
      {/* Mobile Icon */}
      <rect x="42" y="15" width="16" height="20" rx="3" fill="#FFFFFF" opacity="0.9" />
      <rect x="44" y="17" width="12" height="16" rx="1" fill="#00A6FF" />
      
      {/* Signal waves */}
      <path d="M35 20 Q40 15 45 20" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M55 20 Q60 15 65 20" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7" />
    </svg>
  );
};

export default WaveLogo;