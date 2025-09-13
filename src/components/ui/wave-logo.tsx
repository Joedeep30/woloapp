import React from 'react';

interface WaveLogoProps {
  className?: string;
  size?: number;
}

export const WaveLogo: React.FC<WaveLogoProps> = ({ className = '', size = 24 }) => {
  return (
    <img 
      src="/waveicon-256x256.png" 
      alt="WOLO SENEGAL" 
      width={size} 
      height={size} 
      className={className}
      style={{ 
        objectFit: 'contain',
        display: 'inline-block'
      }}
    />
  );
};

export default WaveLogo;