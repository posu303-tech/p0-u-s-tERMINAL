/**
 * BharatPulse Terminal
 * Real-Time Market Monitoring & Analytics (NSE · BSE · MCX)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertRule,
  AlertTriggerLog,
  CommodityData,
  EquityData,
  IndexData,
  LanguageCode,
  MacroIndicator,
  OptionChainData,
  SentimentData,
} from './types/market';
import {
  INITIAL_COMMODITIES,
  INITIAL_EQUITIES,
  INITIAL_INDICES,
  INITIAL_MACRO,
  INITIAL_SENTIMENT,
  evaluateAlertRules,
  generateOptionChain,
  playAlertChime,
} from './services/marketEngine';
import { CryptoVault, DecryptedVaultPayload } from './services/cryptoVault';
import { TRANSLATIONS } from './i18n/translations';
import { getAssetMarketStatus } from './services/marketHours';
import { Navbar } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { EquitiesView } from './components/EquitiesView';
import { DerivativesView } from './components/DerivativesView';
import { CommoditiesView } from './components/CommoditiesView';
import { MacroSentimentView } from './components/MacroSentimentView';
import { ChartInspector } from './components/ChartInspector';
import { AlertsManagerModal } from './components/AlertsManagerModal';
import { VaultAuthModal } from './components/VaultAuthModal';
import { ReportModal } from './components/ReportModal';
import {
  Play,
  Pause,
  AlertTriangle,
  X,
  Volume2,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';

export default function App() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Market Datasets
  const [indices, setIndices] = useState<IndexData[]>(INITIAL_INDICES);
  const [equities, setEquities] = useState<EquityData[]>(INITIAL_EQUITIES);
  const [commodities, setCommodities] = useState<CommodityData[]>(INITIAL_COMMODITIES);
  const [macro, setMacro] = useState<MacroIndicator[]>(INITIAL_MACRO);
  const [sentiment, setSentiment] = useState<SentimentData>(INITIAL_SENTIMENT);
  const [optionChain, setOptionChain] = useState<OptionChainData>(() =>
    generateOptionChain(INITIAL_INDICES[0].ltp, 'NIFTY')
  );
  const [bankNiftyChain, setBankNiftyChain] = useState<OptionChainData>(() =>
    generateOptionChain(INITIAL_INDICES[1].ltp, 'BANKNIFTY')
  );

  // Streaming Engine Controls
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [tickSpeed, setTickSpeed] = useState<number>(1000); // 1s tick
  const [simulateOffMarket, setSimulateOffMarket] = useState<boolean>(false);

  // Encrypted Vault State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [vaultData, setVaultData] = useState<DecryptedVaultPayload>({
    watchlists: ['RELIANCE', 'TCS', 'HDFCBANK', 'NIFTY 50', 'GOLD_MCX'],
    alerts: [
      {
        id: 'initial-alert-1',
        symbol: 'NIFTY 50',
        name: 'NIFTY 50 Benchmark',
        segment: 'NSE',
        condition: 'PRICE_ABOVE',
        threshold: 22500,
        soundEnabled: true,
        isActive: true,
        createdAt: Date.now(),
        triggerCount: 0,
        notes: 'Breakout above key psychological resistance',
      },
      {
        id: 'initial-alert-2',
        symbol: 'RELIANCE',
        name: 'Reliance Industries Ltd.',
        segment: 'NSE',
        condition: 'PRICE_ABOVE',
        threshold: 1180,
        soundEnabled: true,
        isActive: true,
        createdAt: Date.now(),
        triggerCount: 0,
        notes: 'Resistance breakout test',
      },
    ],
    triggerLogs: [],
    userNotes: {},
  });

  // Modal Visibility
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Active Symbol and Timeframe in Chart Inspector
  const [inspectSymbol, setInspectSymbol] = useState<string | null>('NIFTY 50');
  const [chartTimeframe, setChartTimeframe] = useState<string>('5m');

  // Floating Toast Notifications for Real-Time Alert Fires
  const [toastAlerts, setToastAlerts] = useState<AlertTriggerLog[]>([]);

  // Translations
  const t = TRANSLATIONS[language];

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Dark Mode class with root HTML document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Real-Time High-Frequency Tick Streaming Engine
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Determine exchange active session state
      const nseStatus = getAssetMarketStatus('NSE');
      const mcxStatus = getAssetMarketStatus('MCX');

      // Only tick assets whose exchange is currently open, unless off-market simulation is explicitly enabled
      const shouldTickNSE = simulateOffMarket || nseStatus.isOpen;
      const shouldTickMCX = simulateOffMarket || mcxStatus.isOpen;

      // If markets are closed and simulation is off, prices remain frozen at official exchange close
      if (!shouldTickNSE && !shouldTickMCX) {
        return;
      }

      // 1. Update Benchmark Indices (NSE/BSE) only during active session or when simulated
      if (shouldTickNSE) {
        setIndices((prev) =>
          prev.map((idx) => {
            const deltaPct = (Math.random() - 0.49) * 0.0015; // Realistic tick
            const newLtp = Math.round(idx.ltp * (1 + deltaPct) * 100) / 100;
            const newChange = Math.round((newLtp - idx.prevClose) * 100) / 100;
            const newChangePct = Math.round((newChange / idx.prevClose) * 10000) / 100;
            const newHigh = Math.max(idx.high, newLtp);
            const newLow = Math.min(idx.low, newLtp);
            const newSparkline = [...idx.sparkline.slice(-15), newLtp];

            return {
              ...idx,
              ltp: newLtp,
              change: newChange,
              changePercent: newChangePct,
              high: newHigh,
              low: newLow,
              sparkline: newSparkline,
              volume: idx.volume + Math.round(Math.random() * 25000),
            };
          })
        );

        // 2. Update Equities
        setEquities((prev) =>
          prev.map((eq) => {
            const deltaPct = (Math.random() - 0.488) * 0.002;
            const newLtp = Math.round(eq.ltp * (1 + deltaPct) * 100) / 100;
            const newChange = Math.round((newLtp - eq.prevClose) * 100) / 100;
            const newChangePct = Math.round((newChange / eq.prevClose) * 10000) / 100;
            const newHigh = Math.max(eq.high, newLtp);
            const newLow = Math.min(eq.low, newLtp);

            // Update latest historical point
            const updatedHist = [...eq.historical30d];
            if (updatedHist.length > 0) {
              const last = { ...updatedHist[updatedHist.length - 1] };
              last.close = newLtp;
              last.high = Math.max(last.high, newLtp);
              last.low = Math.min(last.low, newLtp);
              updatedHist[updatedHist.length - 1] = last;
            }

            return {
              ...eq,
              ltp: newLtp,
              change: newChange,
              changePercent: newChangePct,
              high: newHigh,
              low: newLow,
              volume: eq.volume + Math.round(Math.random() * 800),
              historical30d: updatedHist,
            };
          })
        );

        // 4. Update Option Chains
        setOptionChain((prev) => generateOptionChain(prev.underlyingLTP, 'NIFTY'));
        setBankNiftyChain((prev) => generateOptionChain(prev.underlyingLTP, 'BANKNIFTY'));
      }

      // 3. Update MCX Commodities
      if (shouldTickMCX) {
        setCommodities((prev) =>
          prev.map((c) => {
            const deltaPct = (Math.random() - 0.49) * 0.0018;
            const newLtp = Math.round(c.ltp * (1 + deltaPct) * 10) / 10;
            const newChange = Math.round((newLtp - c.prevClose) * 10) / 10;
            const newChangePct = Math.round((newChange / c.prevClose) * 10000) / 100;
            return {
              ...c,
              ltp: newLtp,
              change: newChange,
              changePercent: newChangePct,
              high: Math.max(c.high, newLtp),
              low: Math.min(c.low, newLtp),
              volume: c.volume + Math.round(Math.random() * 20),
            };
          })
        );
      }

      // 5. Evaluate Alert Rules & Technical Patterns only if prices changed
      const evaluation = evaluateAlertRules(
        vaultData.alerts,
        equities,
        indices,
        commodities
      );

      if (evaluation.newTriggers.length > 0) {
        // Append to trigger log
        setVaultData((prev) => {
          const updated = {
            ...prev,
            alerts: evaluation.updatedAlerts,
            triggerLogs: [...evaluation.newTriggers, ...prev.triggerLogs].slice(0, 100),
          };
          // Persist to encrypted storage if unlocked
          CryptoVault.persistActiveData(updated);
          return updated;
        });

        // Show floating toast
        setToastAlerts((prev) => [...evaluation.newTriggers, ...prev].slice(0, 4));
      }
    }, tickSpeed);

    return () => clearInterval(interval);
  }, [isStreaming, tickSpeed, simulateOffMarket, vaultData.alerts, equities, indices, commodities]);

  // Handle Vault Unlock / Setup success
  const handleUnlockSuccess = (payload: DecryptedVaultPayload) => {
    setIsVaultUnlocked(true);
    setVaultData(payload);
  };

  // Watchlist Toggle
  const handleToggleWatchlist = (symbol: string) => {
    setVaultData((prev) => {
      const exists = prev.watchlists.includes(symbol);
      const nextWatchlist = exists
        ? prev.watchlists.filter((s) => s !== symbol)
        : [...prev.watchlists, symbol];
      const updated = { ...prev, watchlists: nextWatchlist };
      CryptoVault.persistActiveData(updated);
      return updated;
    });
  };

  // Alert Save
  const handleSaveAlert = (newAlert: AlertRule) => {
    setVaultData((prev) => {
      const updated = {
        ...prev,
        alerts: [newAlert, ...prev.alerts],
      };
      CryptoVault.persistActiveData(updated);
      return updated;
    });
  };

  // Alert Delete
  const handleDeleteAlert = (id: string) => {
    setVaultData((prev) => {
      const updated = {
        ...prev,
        alerts: prev.alerts.filter((a) => a.id !== id),
      };
      CryptoVault.persistActiveData(updated);
      return updated;
    });
  };

  // Alert Toggle Active/Inactive
  const handleToggleAlert = (id: string) => {
    setVaultData((prev) => {
      const updated = {
        ...prev,
        alerts: prev.alerts.map((a) =>
          a.id === id ? { ...a, isActive: !a.isActive } : a
        ),
      };
      CryptoVault.persistActiveData(updated);
      return updated;
    });
  };

  // Clear Trigger Logs
  const handleClearLogs = () => {
    setVaultData((prev) => {
      const updated = { ...prev, triggerLogs: [] };
      CryptoVault.persistActiveData(updated);
      return updated;
    });
  };

  // Remove toast item
  const handleDismissToast = (id: string) => {
    setToastAlerts((prev) => prev.filter((t) => t.id !== id));
  };

  // Find asset data for Chart Inspector
  const inspectedAsset = (() => {
    if (!inspectSymbol) return null;
    const idx = indices.find((i) => i.symbol === inspectSymbol);
    if (idx) {
      return {
        symbol: idx.symbol,
        name: idx.name,
        ltp: idx.ltp,
        change: idx.change,
        changePercent: idx.changePercent,
        history: equities[0]?.historical30d || [],
        technicals: equities[0]?.technicals,
      };
    }
    const eq = equities.find((e) => e.symbol === inspectSymbol);
    if (eq) {
      return {
        symbol: eq.symbol,
        name: eq.name,
        ltp: eq.ltp,
        change: eq.change,
        changePercent: eq.changePercent,
        history: eq.historical30d,
        technicals: eq.technicals,
      };
    }
    const cmd = commodities.find((c) => c.symbol === inspectSymbol);
    if (cmd) {
      return {
        symbol: cmd.symbol,
        name: cmd.name,
        ltp: cmd.ltp,
        change: cmd.change,
        changePercent: cmd.changePercent,
        history: cmd.historical30d,
        technicals: undefined,
      };
    }
    return null;
  })();

  const unreadTriggers = vaultData.triggerLogs.filter((l) => !l.read).length;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Strict Top Bar Contract Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        isDark={isDark}
        setIsDark={setIsDark}
        isVaultUnlocked={isVaultUnlocked}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
        onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        alertCount={vaultData.alerts.length}
        unreadTriggers={unreadTriggers}
        isOffline={isOffline}
      />

      {/* Real-Time Live Ticker Tape Strip */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 overflow-x-auto whitespace-nowrap py-1.5 px-4 text-xs font-mono scrollbar-none flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {indices.map((idx) => {
            const isUp = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                onClick={() => setInspectSymbol(idx.symbol)}
                className="inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-white font-sans">{idx.symbol}</span>
                <span className="tabular-nums text-slate-200">
                  ₹{idx.ltp.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                </span>
                <span
                  className={`tabular-nums font-semibold ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? '+' : ''}
                  {idx.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Streaming Rate, Market Closed Freeze Notice & Simulation Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {!getAssetMarketStatus('NSE').isOpen && (
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono border flex items-center gap-1.5 ${
                  simulateOffMarket
                    ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
                title={
                  simulateOffMarket
                    ? 'Simulated off-hours price movements active for testing'
                    : 'NSE/BSE is closed (09:15-15:30 IST). Prices are strictly frozen at official exchange close.'
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    simulateOffMarket ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
                  }`}
                />
                <span className="hidden sm:inline">
                  {simulateOffMarket ? 'Off-Hours Sim Active' : 'Market Closed · Prices Frozen'}
                </span>
                <span className="sm:hidden">
                  {simulateOffMarket ? 'Sim Active' : 'Closed · Frozen'}
                </span>
              </span>

              <button
                onClick={() => setSimulateOffMarket(!simulateOffMarket)}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono border transition-colors ${
                  simulateOffMarket
                    ? 'bg-amber-500/20 border-amber-600 text-amber-200 hover:bg-amber-500/30'
                    : 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60'
                }`}
                title={
                  simulateOffMarket
                    ? 'Restore realistic market freeze at official close'
                    : 'Simulate synthetic price fluctuations while market is closed'
                }
              >
                {simulateOffMarket ? 'Freeze at Close' : 'Simulate Off-Hours'}
              </button>
            </div>
          )}

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              isStreaming
                ? 'bg-slate-800 text-slate-300 hover:text-white'
                : 'bg-emerald-600 text-white'
            }`}
            title={isStreaming ? t.pauseStream : t.resumeStream}
          >
            {isStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isStreaming ? 'Stream Active' : 'Paused'}</span>
          </button>

          <select
            value={tickSpeed}
            onChange={(e) => setTickSpeed(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-mono"
            title="Tick Rate Frequency"
          >
            <option value={1000}>1.0s Tick</option>
            <option value={500}>0.5s Fast</option>
            <option value={2000}>2.0s Slow</option>
          </select>
        </div>
      </div>

      {/* Main Content Viewport - Full Screen Space Utilization */}
      <main className="flex-1 w-full px-2 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Floating Real-Time Trigger Notification Banners */}
        {toastAlerts.length > 0 && (
          <div className="space-y-2">
            {toastAlerts.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-amber-950/90 border border-amber-600/80 text-amber-200 text-xs flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white font-mono">{t.symbol}</span>
                    <span className="ml-1.5">{t.message}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDismissToast(t.id)}
                  className="p-1 rounded text-amber-400 hover:text-white hover:bg-amber-900/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Selected Chart Inspector Panel (Full width or full screen modal) */}
        {inspectedAsset && (
          <div className="animate-in fade-in duration-200">
            <ChartInspector
              symbol={inspectedAsset.symbol}
              name={inspectedAsset.name}
              currentPrice={inspectedAsset.ltp}
              change={inspectedAsset.change}
              changePercent={inspectedAsset.changePercent}
              historicalData={inspectedAsset.history}
              technicals={inspectedAsset.technicals}
              timeframe={chartTimeframe}
              onTimeframeChange={setChartTimeframe}
              onClose={() => setInspectSymbol(null)}
              isDark={isDark}
            />
          </div>
        )}

        {/* Segment View Routing */}
        {activeTab === 'overview' && (
          <OverviewView
            indices={indices}
            equities={equities}
            commodities={commodities}
            sentiment={sentiment}
            language={language}
            onSelectSymbolForChart={(sym) => setInspectSymbol(sym)}
            isDark={isDark}
          />
        )}

        {activeTab === 'equities' && (
          <EquitiesView
            equities={equities}
            language={language}
            onSelectSymbolForChart={(sym) => setInspectSymbol(sym)}
            watchlist={vaultData.watchlists}
            onToggleWatchlist={handleToggleWatchlist}
            isDark={isDark}
          />
        )}

        {activeTab === 'derivatives' && (
          <DerivativesView
            optionChain={optionChain}
            bankNiftyChain={bankNiftyChain}
            equities={equities}
            indices={indices}
            language={language}
            onSelectSymbolForChart={(sym) => setInspectSymbol(sym)}
            isDark={isDark}
          />
        )}

        {activeTab === 'commodities' && (
          <CommoditiesView
            commodities={commodities}
            language={language}
            onSelectSymbolForChart={(sym) => setInspectSymbol(sym)}
            isDark={isDark}
          />
        )}

        {activeTab === 'macro' && (
          <MacroSentimentView
            macro={macro}
            sentiment={sentiment}
            language={language}
            isDark={isDark}
          />
        )}
      </main>

      {/* Footer & Compliance Legal Disclosure */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-3 sm:px-5 lg:px-6 text-xs text-slate-500">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-400">
              p0$u's tERMINAL · Quantitative Market Surveillance & Risk Intelligence
            </p>
            <p className="text-[11px] mt-0.5">
              Strictly for monitoring & educational analysis. Non-execution compliant with SEBI regulations.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span>WebCrypto AES-256-GCM Vault</span>
            <span>·</span>
            <span>IndexedDB Offline Cache</span>
            <span>·</span>
            <span>Zero-Cloud GitHub Portable</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VaultAuthModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onUnlockSuccess={handleUnlockSuccess}
        language={language}
        isDark={isDark}
      />

      <AlertsManagerModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={vaultData.alerts}
        triggerLogs={vaultData.triggerLogs}
        onSaveAlert={handleSaveAlert}
        onDeleteAlert={handleDeleteAlert}
        onToggleAlert={handleToggleAlert}
        onClearLogs={handleClearLogs}
        equities={equities}
        indices={indices}
        commodities={commodities}
        language={language}
        isDark={isDark}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        indices={indices}
        equities={equities}
        optionChain={optionChain}
        commodities={commodities}
        macro={macro}
        sentiment={sentiment}
        isDark={isDark}
      />
    </div>
  );
}
