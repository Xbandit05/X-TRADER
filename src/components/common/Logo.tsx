/**
 * BANDITRADES — Brand Identity & Vector Logos
 * Stylized minimalist bandit mask incorporating letter B and candlestick motif
 */

import React from 'react';

interface LogoProps {
  variant?: 'horizontal' | 'compact' | 'icon' | 'watermark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const BanditMark: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Outer Hexagonal Shield / Precision Frame */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="10"
        className="fill-[#151A20] stroke-[#00C781]/40 dark:stroke-[#00C781]/60"
        strokeWidth="1.75"
      />

      {/* Candlestick Wicks (Precision Motif) */}
      <line x1="24" y1="7" x2="24" y2="13" stroke="#00C781" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="35" x2="24" y2="41" stroke="#00C781" strokeWidth="2" strokeLinecap="round" />

      {/* Stylized Bandit Mask Visor Cutout */}
      <path
        d="M11 20C11 18.3431 12.3431 17 14 17H34C35.6569 17 37 18.3431 37 20V26C37 27.6569 35.6569 29 34 29H14C12.3431 29 11 27.6569 11 26V20Z"
        fill="#0B0D10"
        className="stroke-[#00C781]"
        strokeWidth="1.5"
      />

      {/* Angular Bandit Eye Slits (Sharpened Gaze) */}
      <path
        d="M16 22.5L21 21.5L20 24.5L16 22.5Z"
        fill="#00C781"
      />
      <path
        d="M32 22.5L27 21.5L28 24.5L32 22.5Z"
        fill="#00C781"
      />

      {/* Central Geometric 'B' spine / Candlestick Real Body */}
      <rect
        x="23"
        y="14"
        width="2"
        height="20"
        fill="#00C781"
        rx="1"
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showTagline = false
}) => {
  const markSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 52
  };

  if (variant === 'icon') {
    return <BanditMark size={markSizes[size]} className={className} />;
  }

  if (variant === 'watermark') {
    return (
      <div className={`pointer-events-none select-none opacity-5 flex items-center gap-3 ${className}`}>
        <BanditMark size={64} />
        <div>
          <div className="font-extrabold text-3xl tracking-tight text-slate-900 dark:text-white font-mono">
            BANDITRADES
          </div>
          <div className="text-xs tracking-widest uppercase font-medium">
            TRADE SMART. MOVE WITH PRECISION.
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <BanditMark size={markSizes[size]} />
        <div className="flex flex-col">
          <div className="flex items-baseline font-bold tracking-tight">
            <span className="text-slate-900 dark:text-[#F4F6F8] font-extrabold tracking-tight text-lg">
              BANDIT
            </span>
            <span className="text-[#00C781] font-semibold text-xs ml-1 tracking-wider">
              TRADES
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Main Horizontal Wordmark
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BanditMark size={markSizes[size]} />
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span className="text-slate-900 dark:text-[#F4F6F8] font-extrabold tracking-tight text-xl">
            BANDIT
          </span>
          <span className="text-[#00C781] font-bold text-sm tracking-widest ml-1">
            TRADES
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] tracking-widest text-slate-500 dark:text-[#AAB3BF] font-medium uppercase mt-1">
            TRADE SMART. MOVE WITH PRECISION.
          </span>
        )}
      </div>
    </div>
  );
};
