import React from 'react';
import Image from 'next/image';

interface WaveLogoProps {
  className?: string;
  size?: number;
}

export const WaveLogo: React.FC<WaveLogoProps> = ({ className = '', size = 24 }) => {
  return (
    <Image
      src="/waveicon-256x256.png"
      alt="Wave Logo"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        borderRadius: '50%'
      }}
    />
  );
};

export default WaveLogo;