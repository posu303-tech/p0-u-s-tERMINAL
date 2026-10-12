import React, { useState, useMemo } from 'react';
import { EquityData, IndexData, LanguageCode, OptionChainData } from '../types/market';
import { TRANSLATIONS } from '../i18n/translations';
import { exportOptionChainToCSV } from '../services/csvExport';
import { generateOptionChain } from '../services/marketEngine';
import { Download, Layers, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MarketStatusBadge } from './MarketStatusBadge';

interface DerivativesViewProps {
  optionChain: OptionChainData;
  bankNiftyChain: OptionChainData;
  equities?: EquityData[];
  indices?: IndexData[];
  language: LanguageCode;
  onSelectSymbolForChart: (symbol: string) => void;
  isDark?: boolean;
}

const AVAILABLE_EXPIRIES = [
  '24-OCT-2026 (Weekly Expiry)',
  '31-OCT-2026 (Monthly Expiry)',
  '07-NOV-2026 (Weekly Expiry)',
  '14-NOV-2026 (Weekly Expiry)',
  '28-NOV-2026 (Monthly Expiry)',
  '26-DEC-2026 (Quarterly Expiry)',
];

export const DerivativesView: React.FC<DerivativesViewProps> = ({
  optionChain,
  bankNiftyChain,
  equities = [],
  indices = [],
  language,
  onSelectSymbolForChart,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedUnderlying, setSelectedUnderlying] = useState<string>('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('31-OCT-2026 (Monthly Expiry)');

  // Determine current active chain dynamically based on selected underlying and expiry
  const chain: OptionChainData = useMemo(() => {
    if (selectedUnderlying === 'NIFTY' && selectedExpiry === optionChain.expiryDate) {
      return optionChain;
    }
    if (selectedUnderlying === 'BANKNIFTY' && selectedExpiry === bankNiftyChain.expiryDate) {
      return bankNiftyChain;
    }

    // Lookup LTP for the selected underlying
    let ltp = 22363.35;
    if (selectedUnderlying === 'NIFTY') {
      ltp = optionChain.underlyingLTP;
    } else if (selectedUnderlying === 'BANKNIFTY') {
      ltp = bankNiftyChain.underlyingLTP;
    } else if (selectedUnderlying === 'FINNIFTY') {
      ltp = 23840.0;
    } else if (selectedUnderlying === 'MIDCPNIFTY') {
      ltp = 13120.0;
    } else {
      const eq = equities.find((e) => e.symbol === selectedUnderlying);
      if (eq) ltp = eq.ltp;
      else {
        const idx = indices.find((i) => i.symbol === selectedUnderlying || i.symbol.startsWith(selectedUnderlying));
        if (idx) ltp = idx.ltp;
      }
    }

    return generateOptionChain(ltp, selectedUnderlying, selectedExpiry);
  }, [selectedUnderlying, selectedExpiry, optionChain, bankNiftyChain, equities, indices]);

  const atmStrike = chain.strikes.reduce((prev, curr) =>
    Math.abs(curr.strikePrice - chain.underlyingLTP) < Math.abs(prev.strikePrice - chain.underlyingLTP) ? curr : prev
  ).strikePrice;

  return (
    <div className="space-y-4">
      {/* Underlying Asset and Expiry Date Dropdowns Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          {/* Dropdown 1: Underlying Asset Selection */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Underlying Asset:</span>
            </label>
            <select
              value={selectedUnderlying}
              onChange={(e) => setSelectedUnderlying(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono shadow-xs cursor-pointer"
            >
              <optgroup label="Index Derivatives (NSE)">
                <option value="NIFTY">NIFTY 50 (Index)</option>
                <option value="BANKNIFTY">BANK NIFTY (Index)</option>
                <option value="FINNIFTY">FIN NIFTY (Financials)</option>
                <option value="MIDCPNIFTY">MIDCAP NIFTY (Midcap Select)</option>
              </optgroup>
              <optgroup label="Stock Derivatives (F&O Heavyweights)">
                <option value="RELIANCE">RELIANCE (Reliance Ind.)</option>
                <option value="HDFCBANK">HDFCBANK (HDFC Bank)</option>
                <option value="TCS">TCS (Tata Consultancy)</option>
                <option value="INFY">INFY (Infosys)</option>
                <option value="ICICIBANK">ICICIBANK (ICICI Bank)</option>
                <option value="TATAMOTORS">TATAMOTORS (Tata Motors)</option>
                <option value="SBIN">SBIN (State Bank of India)</option>
                <option value="BHARTIARTL">BHARTIARTL (Bharti Airtel)</option>
                <option value="LT">LT (Larsen & Toubro)</option>
              </optgroup>
            </select>
          </div>

          {/* Dropdown 2: Expiry Date Selection */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Expiry Date:</span>
            </label>
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono shadow-xs cursor-pointer"
            >
              {AVAILABLE_EXPIRIES.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          {/* Live Underlying LTP badge & Market Status */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">LTP:</span>
            <span className="font-bold text-white tabular-nums px-2 py-0.5 rounded bg-slate-800">
              ₹{chain.underlyingLTP.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <MarketStatusBadge segmentOrExchange="NSE" size="sm" />
            <button
              onClick={() => onSelectSymbolForChart(selectedUnderlying === 'NIFTY' ? 'NIFTY 50' : selectedUnderlying)}
              className="text-cyan-400 hover:underline text-[11px] font-sans ml-1"
            >
              Inspect Chart →
            </button>
          </div>
        </div>

        {/* CSV Export */}
        <button
          onClick={() => exportOptionChainToCSV(chain)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          {t.exportCSV}
        </button>
      </div>

      {/* Derivative Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
            Put-Call Ratio (PCR)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-cyan-400 tabular-nums">
              {chain.pcr.toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-400 font-sans">
              {chain.pcr > 1.2 ? 'Bullish' : chain.pcr < 0.8 ? 'Bearish' : 'Neutral'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">OI Ratio (Puts/Calls)</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
            Max Pain Strike
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-white tabular-nums">
              ₹{chain.maxPain.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Least Loss Expiry Pin</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
            ATM Implied Volatility
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-amber-400 tabular-nums">
              {chain.atmIV.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Implied Risk Premium</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
            Total Open Interest
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-slate-200 tabular-nums">
              {(chain.totalCallOI / 100000).toFixed(1)}L / {(chain.totalPutOI / 100000).toFixed(1)}L
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Total CE vs PE Contracts</span>
        </div>
      </div>

      {/* Full Option Chain Matrix */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px] font-mono">
              <tr>
                <th colSpan={5} className="p-2 border-r border-slate-800 text-emerald-400 bg-emerald-950/20">
                  CALL OPTIONS (CE)
                </th>
                <th className="p-2 bg-slate-900 text-white font-bold font-sans">STRIKE</th>
                <th colSpan={5} className="p-2 border-l border-slate-800 text-rose-400 bg-rose-950/20">
                  PUT OPTIONS (PE)
                </th>
              </tr>
              <tr className="border-t border-slate-800 text-[10px] uppercase">
                {/* Call headers */}
                <th className="p-2 text-right">OI (Contracts)</th>
                <th className="p-2 text-right">Chg OI</th>
                <th className="p-2 text-right">Vol</th>
                <th className="p-2 text-right">IV (%)</th>
                <th className="p-2 text-right border-r border-slate-800 text-emerald-400 font-bold">LTP (₹)</th>
                {/* Strike header */}
                <th className="p-2 bg-slate-900 text-white font-bold">PRICE</th>
                {/* Put headers */}
                <th className="p-2 text-left border-l border-slate-800 text-rose-400 font-bold">LTP (₹)</th>
                <th className="p-2 text-left">IV (%)</th>
                <th className="p-2 text-left">Vol</th>
                <th className="p-2 text-left">Chg OI</th>
                <th className="p-2 text-left">OI (Contracts)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums text-xs">
              {chain.strikes.map((s) => {
                const isATM = s.strikePrice === atmStrike;
                const isCallITM = s.strikePrice < chain.underlyingLTP;
                const isPutITM = s.strikePrice > chain.underlyingLTP;

                return (
                  <tr
                    key={s.strikePrice}
                    className={`transition-colors hover:bg-slate-800/50 ${
                      isATM ? 'bg-cyan-950/40 ring-1 ring-cyan-500/40 font-semibold' : ''
                    }`}
                  >
                    {/* Call Columns */}
                    <td
                      className={`p-2.5 text-right text-slate-300 ${
                        isCallITM ? 'bg-emerald-950/15' : ''
                      }`}
                    >
                      {s.callOI.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`p-2.5 text-right ${
                        s.callChangeOI >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      } ${isCallITM ? 'bg-emerald-950/15' : ''}`}
                    >
                      {s.callChangeOI >= 0 ? '+' : ''}
                      {s.callChangeOI.toLocaleString('en-IN')}
                    </td>
                    <td className={`p-2.5 text-right text-slate-400 ${isCallITM ? 'bg-emerald-950/15' : ''}`}>
                      {s.callVolume.toLocaleString('en-IN')}
                    </td>
                    <td className={`p-2.5 text-right text-slate-400 ${isCallITM ? 'bg-emerald-950/15' : ''}`}>
                      {s.callIV.toFixed(1)}%
                    </td>
                    <td
                      className={`p-2.5 text-right border-r border-slate-800 font-bold text-white ${
                        isCallITM ? 'bg-emerald-950/25' : ''
                      }`}
                    >
                      ₹{s.callLTP.toFixed(2)}
                    </td>

                    {/* Strike Price (Center) */}
                    <td
                      className={`p-2.5 text-center font-bold text-white ${
                        isATM ? 'bg-cyan-900/60 text-cyan-300' : 'bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{s.strikePrice}</span>
                        {isATM && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500 text-slate-950 font-sans font-bold">
                            ATM
                          </span>
                        )}
                        {s.strikePrice === chain.maxPain && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-sans font-bold">
                            PAIN
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Put Columns */}
                    <td
                      className={`p-2.5 text-left border-l border-slate-800 font-bold text-white ${
                        isPutITM ? 'bg-rose-950/25' : ''
                      }`}
                    >
                      ₹{s.putLTP.toFixed(2)}
                    </td>
                    <td className={`p-2.5 text-left text-slate-400 ${isPutITM ? 'bg-rose-950/15' : ''}`}>
                      {s.putIV.toFixed(1)}%
                    </td>
                    <td className={`p-2.5 text-left text-slate-400 ${isPutITM ? 'bg-rose-950/15' : ''}`}>
                      {s.putVolume.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`p-2.5 text-left ${
                        s.putChangeOI >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      } ${isPutITM ? 'bg-rose-950/15' : ''}`}
                    >
                      {s.putChangeOI >= 0 ? '+' : ''}
                      {s.putChangeOI.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`p-2.5 text-left text-slate-300 ${
                        isPutITM ? 'bg-rose-950/15' : ''
                      }`}
                    >
                      {s.putOI.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
