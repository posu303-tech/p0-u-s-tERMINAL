import React, { useState } from 'react';
import { CommodityData, LanguageCode } from '../types/market';
import { TRANSLATIONS } from '../i18n/translations';
import { exportCommoditiesToCSV } from '../services/csvExport';
import { Download, BarChart2, Globe, Flame, Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MarketStatusBadge } from './MarketStatusBadge';

interface CommoditiesViewProps {
  commodities: CommodityData[];
  language: LanguageCode;
  onSelectSymbolForChart: (symbol: string) => void;
  isDark?: boolean;
}

export const CommoditiesView: React.FC<CommoditiesViewProps> = ({
  commodities,
  language,
  onSelectSymbolForChart,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filtered = commodities.filter(
    (c) => selectedCategory === 'ALL' || c.category === selectedCategory
  );

  return (
    <div className="space-y-4">
      {/* Category Filter and CSV Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {['ALL', 'Bullion', 'Energy', 'Metals'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'All MCX' : cat}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            · {filtered.length} Contracts Active
          </span>
        </div>

        <button
          onClick={() => exportCommoditiesToCSV(filtered)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          {t.exportCSV}
        </button>
      </div>

      {/* Commodity Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const isUp = item.change >= 0;
          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbolForChart(item.symbol)}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all cursor-pointer group hover:border-cyan-500/50 relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base tracking-tight font-sans">
                      {item.name}
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                    {item.symbol} · Expiry: {item.expiry}
                  </span>
                  <div className="mt-1.5">
                    <MarketStatusBadge segmentOrExchange="MCX" size="xs" compact />
                  </div>
                </div>
                <div
                  className={`flex items-center text-xs font-semibold font-mono tabular-nums px-2 py-0.5 rounded ${
                    isUp ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {isUp ? '+' : ''}
                  {item.changePercent.toFixed(2)}%
                </div>
              </div>

              {/* Price & Unit */}
              <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-slate-800/60">
                <div>
                  <span className="text-2xl font-bold font-mono tabular-nums text-white">
                    ₹{item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-1.5">/ {item.unit}</span>
                </div>
                <span
                  className={`text-xs font-mono tabular-nums ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? '+' : ''}
                  {item.change.toFixed(2)}
                </span>
              </div>

              {/* Global Benchmark Spread */}
              <div className="mt-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  Global Benchmark:
                </span>
                <span className="text-slate-200 font-semibold">{item.globalBenchmarkPrice}</span>
              </div>

              {/* Contract Specifications */}
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                <div>
                  <span>Lot Size: </span>
                  <span className="text-white font-bold">{item.lotSize}</span>
                </div>
                <div>
                  <span>Open Interest: </span>
                  <span className="text-white font-bold">{item.openInterest.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span>Day High: </span>
                  <span className="text-emerald-400 font-bold">₹{item.high.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span>Day Low: </span>
                  <span className="text-rose-400 font-bold">₹{item.low.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-cyan-400 font-mono">
                <span>Settlement: ₹{item.settlementPrice.toLocaleString('en-IN')}</span>
                <span className="group-hover:underline">Open Chart →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
