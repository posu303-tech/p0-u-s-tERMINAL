import React from 'react';
import { getAssetMarketStatus } from '../services/marketHours';
import { Clock } from 'lucide-react';

interface MarketStatusBadgeProps {
  segmentOrExchange: string; // 'NSE' | 'BSE' | 'MCX' | etc.
  showNextOpen?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'inline' | 'stacked' | 'pill' | 'compact';
  compact?: boolean;
}

export const MarketStatusBadge: React.FC<MarketStatusBadgeProps> = ({
  segmentOrExchange,
  showNextOpen = true,
  size = 'sm',
  className = '',
  variant = 'inline',
  compact = false,
}) => {
  const status = getAssetMarketStatus(segmentOrExchange);
  const isOpen = status.isOpen;

  // Shorten next open time for compact display (e.g. "Today 09:15 AM IST" -> "09:15 AM")
  const shortNextOpen = status.nextOpenTimeFormatted
    .replace(' IST', '')
    .replace('Today ', '')
    .trim();

  if (compact || variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
          isOpen
            ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400'
            : 'bg-rose-950/70 border-rose-800/80 text-rose-300'
        } ${className}`}
        title={`${segmentOrExchange}: ${status.sessionLabel} (${status.scheduleSummary}). ${status.nextOpenText}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
          }`}
        />
        <span>{isOpen ? 'OPEN' : 'CLOSED'}</span>
        {!isOpen && showNextOpen && (
          <span className="text-amber-300/90 font-normal">
            · {shortNextOpen}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] font-semibold border shrink-0 ${
          isOpen
            ? 'bg-emerald-950/80 border-emerald-700/70 text-emerald-300'
            : 'bg-rose-950/80 border-rose-800/80 text-rose-300'
        } ${className}`}
        title={`${status.sessionLabel} (${status.scheduleSummary}). ${status.nextOpenText}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
          }`}
        />
        <span>{isOpen ? 'OPEN' : 'CLOSED'}</span>
        {!isOpen && showNextOpen && (
          <>
            <span className="text-slate-500 font-normal">·</span>
            <span className="text-amber-300/90 font-normal flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 inline shrink-0" />
              <span>Next: {shortNextOpen}</span>
            </span>
          </>
        )}
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col text-[10px] sm:text-[11px] font-mono leading-tight shrink-0 ${className}`}>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`}
          />
          <span
            className={`font-bold tracking-wider ${
              isOpen ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        {!isOpen && showNextOpen && (
          <div className="text-[10px] text-amber-300/90 mt-0.5 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 shrink-0 text-amber-400/80" />
            <span>Opens {shortNextOpen}</span>
          </div>
        )}
      </div>
    );
  }

  // Default 'inline' variant - cleanly styled to prevent any overlap
  return (
    <div
      className={`inline-flex items-center gap-1 font-mono shrink-0 ${
        size === 'xs' ? 'text-[9px]' : size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]'
      } ${className}`}
      title={`${status.sessionLabel} (${status.scheduleSummary}) - Next: ${status.nextOpenTimeFormatted}`}
    >
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
          isOpen
            ? 'bg-emerald-950/70 border border-emerald-800/80 text-emerald-400'
            : 'bg-rose-950/70 border border-rose-800/80 text-rose-400'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
          }`}
        />
        {isOpen ? 'OPEN' : 'CLOSED'}
      </span>

      {!isOpen && showNextOpen && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300/90 font-medium whitespace-nowrap"
          title={`Exchange resumes: ${status.nextOpenTimeFormatted}`}
        >
          <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span>Next: {shortNextOpen}</span>
        </span>
      )}
    </div>
  );
};

