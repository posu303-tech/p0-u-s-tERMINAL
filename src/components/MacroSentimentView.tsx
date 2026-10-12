import React from 'react';
import { LanguageCode, MacroIndicator, SentimentData } from '../types/market';
import { TRANSLATIONS } from '../i18n/translations';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Flame,
  Globe,
  Radio,
  FileCheck,
} from 'lucide-react';

interface MacroSentimentViewProps {
  macro: MacroIndicator[];
  sentiment: SentimentData;
  language: LanguageCode;
  isDark?: boolean;
}

export const MacroSentimentView: React.FC<MacroSentimentViewProps> = ({
  macro,
  sentiment,
  language,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-6">
      {/* Macro Indicators Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Key Macroeconomic Indicators & Policy Anchors
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Central Bank & Sovereign Metrics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {macro.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-cyan-400 uppercase tracking-wider text-[10px] font-semibold">
                    {m.category}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      m.impactLevel === 'High'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Impact: {m.impactLevel}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">{m.name}</h3>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black font-mono tabular-nums text-white">
                    {m.value}
                  </span>
                  <span
                    className={`text-xs font-mono ${
                      m.trend === 'down'
                        ? 'text-emerald-400'
                        : m.trend === 'up'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {m.change}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {m.commentary}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>Release: {m.lastUpdated}</span>
                <span className="text-slate-400">Unit: {m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quantitative Market Sentiment Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Sentiment Modeling & Institutional Positioning
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fear & Greed Index Gauge */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Multi-Factor Fear & Greed Index
            </span>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono tabular-nums text-white">
                  {sentiment.fearGreedIndex}
                </span>
                <span className="text-sm font-bold text-emerald-400 uppercase font-mono">
                  {sentiment.fearGreedLabel}
                </span>
              </div>
              <div className="w-full h-2 rounded-full mt-2 bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 relative">
                <div
                  className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-md -ml-1"
                  style={{ left: `${sentiment.fearGreedIndex}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1 font-mono pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Social Media Sentiment:</span>
                <span className="text-emerald-400 font-bold">{sentiment.socialSentimentScore}% Bullish</span>
              </div>
              <div className="flex justify-between">
                <span>Advance/Decline Ratio:</span>
                <span className="text-cyan-400 font-bold">{sentiment.advanceDeclineRatio} : 1</span>
              </div>
            </div>
          </div>

          {/* FII / DII Institutional Flows */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Institutional Net Cash Investments
            </span>
            <div className="space-y-2.5 my-3">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-300 font-mono">Foreign Inst. (FII/FPI):</span>
                <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                  +₹{sentiment.fiiNetCrores.toLocaleString('en-IN')} Cr
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-300 font-mono">Domestic Inst. (DII/MFs):</span>
                <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                  +₹{sentiment.diiNetCrores.toLocaleString('en-IN')} Cr
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono border-t border-slate-800 pt-2">
              Combined institutional liquidity infusion: +₹{(sentiment.fiiNetCrores + sentiment.diiNetCrores).toLocaleString('en-IN')} Crore.
            </p>
          </div>

          {/* Volatility Regime */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Real-Time Volatility Regime
            </span>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono tabular-nums text-white">
                  {sentiment.indiaVix.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  (India VIX)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Implied option pricing indicates minimal tail-risk hedging. Range expansion anticipated above 16.50 threshold.
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono border-t border-slate-800 pt-2 flex justify-between">
              <span>Risk State:</span>
              <span className="text-emerald-400 font-bold">Complacent / Bullish Trend</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
