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
      {/* Wave Logo - Exact reproduction */}
      
      {/* Blue circular background */}
      <circle cx="50" cy="50" r="48" fill="#00BFFF" />
      
      {/* Penguin body - black */}
      <ellipse cx="50" cy="60" rx="15" ry="20" fill="#000000" />
      
      {/* Penguin belly - white */}
      <ellipse cx="50" cy="58" rx="10" ry="15" fill="#FFFFFF" />
      
      {/* Penguin head - black */}
      <circle cx="50" cy="35" r="12" fill="#000000" />
      
      {/* Penguin beak - orange/yellow */}
      <path d="M45 38 L55 38 L50 42 Z" fill="#FFA500" />
      
      {/* Penguin eyes - white circles */}
      <circle cx="46" cy="32" r="2.5" fill="#FFFFFF" />
      <circle cx="54" cy="32" r="2.5" fill="#FFFFFF" />
      
      {/* Eye pupils - black dots */}
      <circle cx="46" cy="32" r="1" fill="#000000" />
      <circle cx="54" cy="32" r="1" fill="#000000" />
      
      {/* Penguin flippers/wings - black */}
      <ellipse cx="35" cy="50" rx="6" ry="12" fill="#000000" transform="rotate(-20 35 50)" />
      <ellipse cx="65" cy="50" rx="6" ry="12" fill="#000000" transform="rotate(20 65 50)" />
      
      {/* Wave text at bottom */}
      <text x="50" y="88" 
            textAnchor="middle" 
            fontSize="10" 
            fill="#FFFFFF" 
            fontWeight="bold" 
            fontFamily="Arial, sans-serif">
        wave
      </text>
    </svg>
  );
};

export default WaveLogo;