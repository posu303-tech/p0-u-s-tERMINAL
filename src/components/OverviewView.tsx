import React from 'react';
import {
  CommodityData,
  EquityData,
  IndexData,
  LanguageCode,
  SentimentData,
} from '../types/market';
import { TRANSLATIONS } from '../i18n/translations';
import { exportIndicesToCSV } from '../services/csvExport';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Radio,
} from 'lucide-react';
import { MarketStatusBadge } from './MarketStatusBadge';

interface OverviewViewProps {
  indices: IndexData[];
  equities: EquityData[];
  commodities: CommodityData[];
  sentiment: SentimentData;
  language: LanguageCode;
  onSelectSymbolForChart: (symbol: string) => void;
  isDark?: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  indices,
  equities,
  commodities,
  sentiment,
  language,
  onSelectSymbolForChart,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];

  const topGainers = [...equities].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...equities].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Benchmark Indices Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Live Exchange Benchmarks (NSE · BSE · MCX)
            </h2>
            <span className="text-xs text-slate-500 font-mono">· 6 Indices Monitored</span>
          </div>
          <button
            onClick={() => exportIndicesToCSV(indices)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {t.exportCSV}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {indices.map((idx) => {
            const isUp = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                onClick={() => onSelectSymbolForChart(idx.symbol)}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all cursor-pointer group hover:border-cyan-500/50 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base tracking-tight font-sans">
                        {idx.symbol}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {idx.segment}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{idx.name}</p>
                    <div className="mt-1.5">
                      <MarketStatusBadge segmentOrExchange={idx.segment} size="sm" />
                    </div>
                  </div>
                  <div
                    className={`flex items-center text-xs font-semibold font-mono tabular-nums px-2 py-0.5 rounded ${
                      isUp ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                    }`}
                  >
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {isUp ? '+' : ''}
                    {idx.changePercent.toFixed(2)}%
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-slate-800/60">
                  <span className="text-2xl font-bold font-mono tabular-nums text-white">
                    ₹{idx.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? '+' : ''}
                    {idx.change.toFixed(2)}
                  </span>
                </div>

                {/* Range bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500 mb-1">
                    <span>L: ₹{idx.low.toFixed(1)}</span>
                    <span>H: ₹{idx.high.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, ((idx.ltp - idx.low) / (idx.high - idx.low || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                  <span>Adv: {idx.advances} · Dec: {idx.declines}</span>
                  <span className="text-cyan-400 group-hover:underline">Inspect Chart →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sentiment & Volatility Cockpit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fear & Greed Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.fearGreedIndex}
            </span>
            <span className="text-xs text-amber-400 font-mono font-semibold">
              {sentiment.fearGreedLabel}
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tabular-nums text-white">
                {sentiment.fearGreedIndex}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            {/* Visual gradient bar */}
            <div className="w-full h-2 rounded-full mt-2 bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 relative">
              <div
                className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md -ml-1"
                style={{ left: `${sentiment.fearGreedIndex}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0 (Extreme Fear)</span>
              <span>50 (Neutral)</span>
              <span>100 (Extreme Greed)</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mt-2 border-t border-slate-800 pt-2">
            Derived from 30D volatility index, market breadth (A/D ratio {sentiment.advanceDeclineRatio}), FII flow, and option PCR trends.
          </p>
        </div>

        {/* Institutional Flow & Volatility */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Institutional Net Activity
            </span>
            <span className="text-xs text-emerald-400 font-mono font-semibold">Net Buyers</span>
          </div>

          <div className="space-y-3 my-1">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-300">{t.fiiFlow}</span>
              <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                +₹{sentiment.fiiNetCrores.toLocaleString('en-IN')} Cr
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-300">{t.diiFlow}</span>
              <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                +₹{sentiment.diiNetCrores.toLocaleString('en-IN')} Cr
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between font-mono">
            <span>Market Breadth:</span>
            <span className="text-cyan-400 font-semibold">{sentiment.advanceDeclineRatio}:1 (Advancing)</span>
          </div>
        </div>

        {/* Real-time India VIX & Implied Volatility Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.indiaVix}
            </span>
            <span className="text-xs text-cyan-400 font-mono font-semibold">Low Volatility Regime</span>
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black font-mono tabular-nums text-white">
                {sentiment.indiaVix.toFixed(2)}
              </span>
              <span
                className={`text-xs font-mono font-semibold ${
                  sentiment.indiaVixChange <= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {sentiment.indiaVixChange <= 0 ? '' : '+'}
                {sentiment.indiaVixChange.toFixed(2)} pts
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>HV30 (30D Hist. Vol):</span>
                <span className="text-slate-200">14.2%</span>
              </div>
              <div className="flex justify-between">
                <span>ATM Nifty IV:</span>
                <span className="text-slate-200">12.8%</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 border-t border-slate-800 pt-2 leading-relaxed">
            Sub-15 VIX indicates complacency and disciplined range-bound option premium pricing.
          </p>
        </div>
      </div>

      {/* Top Gainers & Losers Heavyweights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gainers */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Top Equity Gainers
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">NSE Cash</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {topGainers.map((g) => (
              <div
                key={g.symbol}
                onClick={() => onSelectSymbolForChart(g.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-900/80 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs font-mono">{g.symbol}</span>
                    <span className="text-[10px] text-slate-400">· {g.sector}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">Vol: {(g.volume / 100000).toFixed(1)}L</span>
                    <MarketStatusBadge segmentOrExchange={g.exchange} size="sm" />
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-white tabular-nums">
                    ₹{g.ltp.toFixed(2)}
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold tabular-nums">
                    +{g.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Losers */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Top Equity Losers
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">NSE Cash</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {topLosers.map((l) => (
              <div
                key={l.symbol}
                onClick={() => onSelectSymbolForChart(l.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-900/80 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs font-mono">{l.symbol}</span>
                    <span className="text-[10px] text-slate-400">· {l.sector}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">Vol: {(l.volume / 100000).toFixed(1)}L</span>
                    <MarketStatusBadge segmentOrExchange={l.exchange} size="sm" />
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-white tabular-nums">
                    ₹{l.ltp.toFixed(2)}
                  </div>
                  <div className="text-xs text-rose-400 font-semibold tabular-nums">
                    {l.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Financial News & Sentiment Analysis Feed */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.newsAndSentiment}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Curated Financial Feeds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sentiment.newsHeadlines.map((news) => (
            <div
              key={news.id}
              className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
                  <span>{news.source}</span>
                  <span>{news.time}</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
                  {news.headline}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-normal">
                  {news.summary}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      news.sentiment === 'bullish'
                        ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60'
                        : news.sentiment === 'bearish'
                        ? 'text-rose-400 bg-rose-950/80 border border-rose-800/60'
                        : 'text-slate-400 bg-slate-800'
                    }`}
                  >
                    {news.sentiment} (Score: {news.score})
                  </span>
                </div>
                <span className="text-slate-500 font-mono">{news.affectedSegments.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
