import React from 'react';
import { LanguageCode } from '../types/market';
import { TRANSLATIONS } from '../i18n/translations';
import { Lock, Unlock, Moon, Sun, Bell, FileText, Wifi, WifiOff } from 'lucide-react';
import { MarketStatusBadge } from './MarketStatusBadge';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: LanguageCode;
  setLanguage?: (lang: LanguageCode) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  isVaultUnlocked: boolean;
  onOpenVaultModal: () => void;
  onOpenAlertsModal: () => void;
  onOpenReportModal: () => void;
  alertCount: number;
  unreadTriggers: number;
  isOffline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  isDark,
  setIsDark,
  isVaultUnlocked,
  onOpenVaultModal,
  onOpenAlertsModal,
  onOpenReportModal,
  alertCount,
  unreadTriggers,
  isOffline,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      {/* Main Top Bar Row: strictly aligned on both mobile & desktop */}
      <div className="w-full px-3 sm:px-5 lg:px-6 h-14 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('overview');
            }}
            className="text-base font-black tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
            <span>p0$u's tERMINAL</span>
            <span className="hidden sm:inline text-xs font-mono font-normal text-slate-400">
              NSE · BSE · MCX
            </span>
          </a>
        </div>

        {/* Zone 2: Desktop 5 single-line clean navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'overview' ? 'text-cyan-400 font-bold' : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navOverview}
          </button>
          <button
            onClick={() => setActiveTab('equities')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'equities' ? 'text-cyan-400 font-bold' : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navEquities}
          </button>
          <button
            onClick={() => setActiveTab('derivatives')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'derivatives' ? 'text-cyan-400 font-bold' : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navDerivatives}
          </button>
          <button
            onClick={() => setActiveTab('commodities')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'commodities' ? 'text-cyan-400 font-bold' : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navCommodities}
          </button>
          <button
            onClick={() => setActiveTab('macro')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'macro' ? 'text-cyan-400 font-bold' : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navMacro}
          </button>
        </nav>

        {/* Zone 3: Primary actions & security controls - tightly aligned on mobile & desktop */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Offline indicator */}
          {isOffline ? (
            <div
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded bg-amber-950/60 border border-amber-800/80 text-amber-400 text-[10px] sm:text-[11px] font-mono shrink-0"
              title="Network disconnected. Displaying verified local IndexedDB cache."
            >
              <WifiOff className="w-3 h-3" />
              <span className="hidden md:inline">Offline</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-emerald-400 shrink-0">
              <Wifi className="w-3 h-3" />
              <span>LIVE</span>
            </div>
          )}

          {/* Alerts Trigger Bell */}
          <button
            onClick={onOpenAlertsModal}
            className="relative p-1.5 sm:p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors shrink-0 flex items-center justify-center"
            title="Custom Alerts & Pattern Surveillance"
          >
            <Bell className="w-4 h-4" />
            {unreadTriggers > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono">
                {unreadTriggers}
              </span>
            )}
          </button>

          {/* Institutional Report Trigger */}
          <button
            onClick={onOpenReportModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Generate PDF Briefing"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Report</span>
          </button>

          {/* E2EE Vault Security Button - neatly sized on mobile and desktop */}
          <button
            onClick={onOpenVaultModal}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors shrink-0 ${
              isVaultUnlocked
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-cyan-950/60 border-cyan-800 text-cyan-300 hover:bg-cyan-900/60'
            }`}
            title={isVaultUnlocked ? 'Vault Unlocked · Click to Lock or Export' : 'Vault Locked · Click to Unlock'}
          >
            {isVaultUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isVaultUnlocked ? 'Vault Open' : 'E2EE Vault'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 sm:p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors shrink-0 flex items-center justify-center"
            title="Toggle Visual Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Mobile-Only Horizontal Navigation Strip (Ensures all tabs are easily accessible and aligned on mobile) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto whitespace-nowrap px-3 py-1.5 border-t border-slate-800/80 bg-slate-950 scrollbar-none text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            activeTab === 'overview' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.navOverview}
        </button>
        <button
          onClick={() => setActiveTab('equities')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            activeTab === 'equities' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.navEquities}
        </button>
        <button
          onClick={() => setActiveTab('derivatives')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            activeTab === 'derivatives' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.navDerivatives}
        </button>
        <button
          onClick={() => setActiveTab('commodities')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            activeTab === 'commodities' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.navCommodities}
        </button>
        <button
          onClick={() => setActiveTab('macro')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            activeTab === 'macro' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.navMacro}
        </button>
      </div>

      {/* Compliance & Market Status Sub-strip */}
      <div className="bg-slate-900/80 border-t border-slate-800/80 px-3 sm:px-4 py-1 text-[10px] sm:text-[11px] flex items-center justify-between font-mono text-slate-400 gap-2 flex-wrap">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="text-amber-400 font-semibold truncate">{t.monitoringOnlyNotice}</span>
          <span className="hidden md:inline text-slate-500">·</span>
          <span className="hidden md:inline text-slate-400">SEBI Non-Execution Analytics Compliant</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-400 shrink-0 text-[10px] ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">NSE:</span>
            <MarketStatusBadge segmentOrExchange="NSE" size="sm" />
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">MCX:</span>
            <MarketStatusBadge segmentOrExchange="MCX" size="sm" />
          </div>
        </div>
      </div>
    </header>
  );
};
