import React, { useState } from 'react';
import { EquityData, LanguageCode, Level2DepthRow } from '../types/market';
import { TRANSLATIONS } from '../i18n/translations';
import { exportEquitiesToCSV } from '../services/csvExport';
import {
  Search,
  Filter,
  Download,
  BarChart2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  X,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { MarketStatusBadge } from './MarketStatusBadge';

interface EquitiesViewProps {
  equities: EquityData[];
  language: LanguageCode;
  onSelectSymbolForChart: (symbol: string) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  isDark?: boolean;
}

export const EquitiesView: React.FC<EquitiesViewProps> = ({
  equities,
  language,
  onSelectSymbolForChart,
  watchlist,
  onToggleWatchlist,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExchange, setSelectedExchange] = useState<'ALL' | 'NSE' | 'BSE'>('ALL');
  const [selectedBuildup, setSelectedBuildup] = useState<string>('ALL');
  const [selectedDepthEquity, setSelectedDepthEquity] = useState<EquityData | null>(null);

  const filteredEquities = equities.filter((eq) => {
    const matchesSearch =
      eq.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExch = selectedExchange === 'ALL' || eq.exchange === selectedExchange;
    const matchesBuildup = selectedBuildup === 'ALL' || eq.oiBuildup === selectedBuildup;
    return matchesSearch && matchesExch && matchesBuildup;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white placeholder-slate-500"
            />
          </div>

          {/* Exchange Filter */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {(['ALL', 'NSE', 'BSE'] as const).map((exch) => (
              <button
                key={exch}
                onClick={() => setSelectedExchange(exch)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedExchange === exch
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {exch}
              </button>
            ))}
          </div>

          {/* OI Buildup Filter */}
          <select
            value={selectedBuildup}
            onChange={(e) => setSelectedBuildup(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono"
          >
            <option value="ALL">All OI Buildup</option>
            <option value="Long Buildup">Long Buildup</option>
            <option value="Short Buildup">Short Buildup</option>
            <option value="Long Unwinding">Long Unwinding</option>
            <option value="Short Covering">Short Covering</option>
          </select>
        </div>

        {/* Export CSV Button */}
        <button
          onClick={() => exportEquitiesToCSV(filteredEquities)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          {t.exportCSV}
        </button>
      </div>

      {/* Main Equities Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 w-8"></th>
                <th className="p-3">Symbol & Name</th>
                <th className="p-3">Exch / Sector</th>
                <th className="p-3 text-right">LTP (₹)</th>
                <th className="p-3 text-right">Change (%)</th>
                <th className="p-3 text-right">Volume</th>
                <th className="p-3 text-right">VWAP</th>
                <th className="p-3 text-right">Day High / Low</th>
                <th className="p-3 text-center">OI Buildup</th>
                <th className="p-3 text-center">RSI(14)</th>
                <th className="p-3 text-center">Depth / Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
              {filteredEquities.map((eq) => {
                const isUp = eq.change >= 0;
                const isSaved = watchlist.includes(eq.symbol);

                return (
                  <tr
                    key={eq.symbol}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  >
                    {/* Watchlist toggle */}
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(eq.symbol);
                        }}
                        className="text-slate-500 hover:text-amber-400 transition-colors"
                        title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Symbol */}
                    <td
                      className="p-3 font-sans"
                      onClick={() => onSelectSymbolForChart(eq.symbol)}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs group-hover:text-cyan-400 transition-colors font-mono">
                          {eq.symbol}
                        </span>
                        <MarketStatusBadge segmentOrExchange={eq.exchange} size="xs" compact />
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans line-clamp-1 mt-0.5">
                        {eq.name}
                      </div>
                    </td>

                    {/* Exchange & Sector */}
                    <td className="p-3 font-sans">
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300 mr-1.5">
                        {eq.exchange}
                      </span>
                      <span className="text-slate-400 text-xs">{eq.sector}</span>
                    </td>

                    {/* LTP */}
                    <td className="p-3 text-right font-bold text-white text-xs">
                      ₹{eq.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Change */}
                    <td className="p-3 text-right">
                      <span
                        className={`inline-flex items-center font-semibold ${
                          isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {eq.change.toFixed(2)} ({isUp ? '+' : ''}
                        {eq.changePercent.toFixed(2)}%)
                      </span>
                    </td>

                    {/* Volume */}
                    <td className="p-3 text-right text-slate-300">
                      {(eq.volume / 100000).toFixed(2)}L
                    </td>

                    {/* VWAP */}
                    <td className="p-3 text-right text-slate-400">
                      ₹{eq.vwap.toFixed(2)}
                    </td>

                    {/* High / Low */}
                    <td className="p-3 text-right text-[11px] text-slate-400">
                      <span className="text-emerald-400">H: ₹{eq.high.toFixed(1)}</span>
                      <br />
                      <span className="text-rose-400">L: ₹{eq.low.toFixed(1)}</span>
                    </td>

                    {/* OI Buildup */}
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                          eq.oiBuildup === 'Long Buildup'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : eq.oiBuildup === 'Short Buildup'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                            : eq.oiBuildup === 'Short Covering'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {eq.oiBuildup}
                      </span>
                    </td>

                    {/* RSI */}
                    <td className="p-3 text-center font-mono">
                      <span
                        className={`font-semibold ${
                          eq.technicals.rsi14 <= 30
                            ? 'text-emerald-400'
                            : eq.technicals.rsi14 >= 70
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {eq.technicals.rsi14}
                      </span>
                    </td>

                    {/* Actions: Depth + Chart */}
                    <td className="p-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDepthEquity(eq);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Level 2 Market Depth (5 Bids / 5 Asks)"
                        >
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSymbolForChart(eq.symbol);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Interactive Candlestick Chart"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Level 2 Depth Modal */}
      {selectedDepthEquity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <span>{selectedDepthEquity.symbol}</span>
                  <span className="text-xs text-slate-400 font-sans">· Level 2 Order Book Depth</span>
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-300">
                  LTP: ₹{selectedDepthEquity.ltp.toFixed(2)} (VWAP: ₹{selectedDepthEquity.vwap.toFixed(2)})
                </span>
              </div>
              <button
                onClick={() => setSelectedDepthEquity(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Depth 5x5 Table */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono">
              {/* Bid Column */}
              <div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider pb-1 border-b border-slate-800 flex justify-between">
                  <span>Orders · Qty</span>
                  <span>Bid Price (₹)</span>
                </div>
                <div className="divide-y divide-slate-800/60 mt-1">
                  {selectedDepthEquity.depth.map((d, i) => (
                    <div key={`bid-${i}`} className="py-1.5 flex justify-between text-emerald-300">
                      <span className="text-slate-400 text-[11px]">
                        {d.bidOrders} · {d.bidQty.toLocaleString('en-IN')}
                      </span>
                      <span className="font-bold tabular-nums">₹{d.bidPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ask Column */}
              <div>
                <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider pb-1 border-b border-slate-800 flex justify-between">
                  <span>Ask Price (₹)</span>
                  <span>Qty · Orders</span>
                </div>
                <div className="divide-y divide-slate-800/60 mt-1">
                  {selectedDepthEquity.depth.map((d, i) => (
                    <div key={`ask-${i}`} className="py-1.5 flex justify-between text-rose-300">
                      <span className="font-bold tabular-nums">₹{d.askPrice.toFixed(2)}</span>
                      <span className="text-slate-400 text-[11px]">
                        {d.askQty.toLocaleString('en-IN')} · {d.askOrders}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
              <span>Total Open Interest: {selectedDepthEquity.openInterest.toLocaleString('en-IN')}</span>
              <span>OI Shift: {selectedDepthEquity.oiChangePercent > 0 ? '+' : ''}{selectedDepthEquity.oiChangePercent}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
