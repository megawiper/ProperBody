import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

const Logo: React.FC<Props> = ({ className = "", size = 48 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer Shield/Circle */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        
        {/* Abstract Body Shape */}
        <path 
          d="M50 20C55.5228 20 60 15.5228 60 10C60 4.47715 55.5228 0 50 0C44.4772 0 40 4.47715 40 10C40 15.5228 44.4772 20 50 20Z" 
          fill="url(#logoGradient)" 
        />
        <path 
          d="M50 25C35 25 25 35 25 55V70C25 85 35 95 50 100C65 95 75 85 75 70V55C75 35 65 25 50 25ZM50 90C40 85 35 75 35 70V60C35 50 40 40 50 40C60 40 65 50 65 60V70C65 75 60 85 50 90Z" 
          fill="url(#logoGradient)" 
          fillOpacity="0.8"
        />
        
        {/* Pulse Line / DNA Element */}
        <path 
          d="M30 55 H40 L45 45 L55 65 L60 55 H70" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default Logo;