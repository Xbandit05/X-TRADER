/**
 * CLOUD X — Master Brand Identity & Vector Logos
 * TradeZella-grade sleek aesthetic: High-contrast typography with electric cyan/mint accent
 */

import React from 'react';

interface LogoProps {
  variant?: 'horizontal' | 'compact' | 'icon' | 'watermark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const CloudXMark: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="cloudGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B2FE" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="cloudCardBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#131926" />
          <stop offset="1" stopColor="#0B0F17" />
        </linearGradient>
      </defs>

      {/* Outer Rounded Container with TradeZella Border Glow */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        fill="url(#cloudCardBg)"
        stroke="url(#cloudGrad)"
        strokeWidth="1.75"
        strokeOpacity="0.8"
      />

      {/* Cloud Silhouette with subtle precision cuts */}
      <path
        d="M17 31C14.7909 31 13 29.2091 13 27C13 24.9654 14.5165 23.2847 16.5 23.031C16.8927 18.5284 20.6791 15 25.25 15C30.2206 15 34.25 19.0294 34.25 24C34.25 24.1685 34.2449 24.3359 34.2348 24.5019C35.819 25.0457 37 26.5414 37 28.3C37 30.5091 35.2091 32.3 33 32.3H17Z"
        fill="#1A2332"
        stroke="#00B2FE"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central High-Tech Precision 'X' motif */}
      <path
        d="M20 21L28 29M28 21L20 29"
        stroke="url(#cloudGrad)"
        strokeWidth="2.75"
        strokeLinecap="round"
      />

      {/* Candlestick precision wicks */}
      <circle cx="20" cy="21" r="1.5" fill="#00B2FE" />
      <circle cx="28" cy="29" r="1.5" fill="#10B981" />
      <circle cx="28" cy="21" r="1.5" fill="#00B2FE" />
      <circle cx="20" cy="29" r="1.5" fill="#10B981" />
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
    return <CloudXMark size={markSizes[size]} className={className} />;
  }

  if (variant === 'watermark') {
    return (
      <div className={`pointer-events-none select-none opacity-5 flex items-center gap-3 ${className}`}>
        <CloudXMark size={64} />
        <div>
          <div className="font-extrabold text-3xl tracking-tight text-slate-900 dark:text-white font-mono">
            CLOUD X
          </div>
          <div className="text-xs tracking-widest uppercase font-medium">
            TRADE WITH CLARITY. MOVE WITH PRECISION.
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <CloudXMark size={markSizes[size]} />
        <div className="flex flex-col">
          <div className="flex items-baseline font-bold tracking-tight">
            <span className="text-slate-900 dark:text-[#F8FAFC] font-extrabold tracking-tight text-lg">
              CLOUD
            </span>
            <span className="text-[#00B2FE] font-black text-lg ml-1 tracking-wider bg-gradient-to-r from-[#00B2FE] to-[#10B981] bg-clip-text text-transparent">
              X
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Main Horizontal Wordmark
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CloudXMark size={markSizes[size]} />
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span className="text-slate-900 dark:text-[#F8FAFC] font-black tracking-tight text-xl">
            CLOUD
          </span>
          <span className="font-black text-xl ml-1 tracking-wider bg-gradient-to-r from-[#00B2FE] to-[#10B981] bg-clip-text text-transparent">
            X
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] tracking-widest text-slate-500 dark:text-[#94A3B8] font-medium uppercase mt-1">
            TRADE SMART · MOVE WITH PRECISION
          </span>
        )}
      </div>
    </div>
  );
};
