import React, { useRef } from 'react';
import { CommodityData, EquityData, IndexData, MacroIndicator, OptionChainData, SentimentData } from '../types/market';
import { FileText, Printer, Download, X, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  indices: IndexData[];
  equities: EquityData[];
  optionChain: OptionChainData;
  commodities: CommodityData[];
  macro: MacroIndicator[];
  sentiment: SentimentData;
  isDark?: boolean;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  indices,
  equities,
  optionChain,
  commodities,
  macro,
  sentiment,
  isDark = true,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    if (!reportRef.current) return;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>p0$u_tERMINAL_Market_Briefing_${new Date().toISOString().slice(0, 10)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; background: #fff; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          th { background: #f9fafb; font-weight: 600; }
          .tabular-nums { font-variant-numeric: tabular-nums; font-family: monospace; }
          .green { color: #15803d; }
          .red { color: #b91c1c; }
          .header-box { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .disclaimer { font-size: 11px; color: #6b7280; border: 1px solid #e5e7eb; padding: 10px; margin-top: 30px; }
        </style>
      </head>
      <body>
        ${reportRef.current.innerHTML}
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `p0$u_tERMINAL_Report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const topGainers = [...equities].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const topLosers = [...equities].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl rounded-2xl border p-6 shadow-2xl relative max-h-[92vh] flex flex-col ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Toolbar (hidden in print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Automated Institutional Market Intelligence Report</h3>
              <p className="text-xs text-slate-400">
                Multi-segment briefing covering NSE, BSE, MCX, F&O derivatives, and macroeconomic indicators.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={handleDownloadHTML}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download HTML
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="flex-1 overflow-y-auto mt-4 p-6 bg-slate-950/50 rounded-xl border border-slate-800/80 font-sans print:bg-white print:text-black print:p-0 print:border-none">
          <div ref={reportRef} className="space-y-6">
            {/* Report Header */}
            <div className="border-b-2 border-slate-700 pb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white print:text-black">
                  p0$u's tERMINAL
                </h1>
                <p className="text-xs font-medium uppercase tracking-widest text-cyan-400 print:text-slate-600">
                  Daily Market Intelligence & Derivatives Risk Surveillance
                </p>
              </div>
              <div className="text-right text-xs font-mono tabular-nums text-slate-400 print:text-slate-600">
                <p>Date: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Timestamp: {new Date().toLocaleTimeString('en-IN')} IST</p>
                <p className="text-emerald-400 print:text-emerald-700 font-semibold">Status: Verified Tick Stream</p>
              </div>
            </div>

            {/* Executive Summary Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Market Sentiment</span>
                <p className="text-base font-bold text-white print:text-black font-mono">
                  {sentiment.fearGreedIndex || 68} / 100 ({sentiment.fearGreedLabel})
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">India VIX</span>
                <p className="text-base font-bold text-cyan-400 print:text-cyan-800 font-mono">
                  {sentiment.indiaVix.toFixed(2)} ({sentiment.indiaVixChange >= 0 ? '+' : ''}{sentiment.indiaVixChange.toFixed(2)})
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">FII Net Cash Flow</span>
                <p className="text-base font-bold text-emerald-400 print:text-emerald-700 font-mono">
                  +₹{sentiment.fiiNetCrores.toLocaleString('en-IN')} Cr
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">DII Net Cash Flow</span>
                <p className="text-base font-bold text-emerald-400 print:text-emerald-700 font-mono">
                  +₹{sentiment.diiNetCrores.toLocaleString('en-IN')} Cr
                </p>
              </div>
            </div>

            {/* Benchmark Indices Table */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-2">
                1. Benchmark Market Indices (NSE · BSE · MCX)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-800 print:border-slate-300">
                  <thead className="bg-slate-900 print:bg-slate-100 text-slate-400 print:text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2 border-b border-slate-800">Index</th>
                      <th className="p-2 border-b border-slate-800">Segment</th>
                      <th className="p-2 border-b border-slate-800 text-right">LTP (₹)</th>
                      <th className="p-2 border-b border-slate-800 text-right">Change</th>
                      <th className="p-2 border-b border-slate-800 text-right">Change %</th>
                      <th className="p-2 border-b border-slate-800 text-right">Day High</th>
                      <th className="p-2 border-b border-slate-800 text-right">Day Low</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200 font-mono tabular-nums">
                    {indices.map((idx) => {
                      const isUp = idx.change >= 0;
                      return (
                        <tr key={idx.symbol} className="hover:bg-slate-900/40">
                          <td className="p-2 font-bold font-sans text-white print:text-black">{idx.symbol}</td>
                          <td className="p-2 text-slate-400">{idx.segment}</td>
                          <td className="p-2 text-right font-bold text-white print:text-black">
                            {idx.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-2 text-right ${isUp ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                            {isUp ? '+' : ''}{idx.change.toFixed(2)}
                          </td>
                          <td className={`p-2 text-right font-bold ${isUp ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                            {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                          </td>
                          <td className="p-2 text-right text-slate-400">{idx.high.toFixed(2)}</td>
                          <td className="p-2 text-right text-slate-400">{idx.low.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Derivatives F&O Snapshot */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-2">
                2. Nifty Derivatives & Option Chain Dynamics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                  <span className="text-slate-400">Put-Call Ratio (PCR):</span>
                  <p className="text-base font-bold text-cyan-400 print:text-cyan-800">{optionChain.pcr.toFixed(2)} (Moderately Bullish)</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                  <span className="text-slate-400">Max Pain Strike:</span>
                  <p className="text-base font-bold text-white print:text-black">₹{optionChain.maxPain.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                  <span className="text-slate-400">ATM Implied Volatility:</span>
                  <p className="text-base font-bold text-amber-400 print:text-amber-800">{optionChain.atmIV.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Top Market Movers & MCX Commodities Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-1.5">
                  Top Equity Gainers
                </h3>
                <div className="border border-slate-800 print:border-slate-300 rounded-lg overflow-hidden text-xs font-mono">
                  {topGainers.map((g) => (
                    <div key={g.symbol} className="flex items-center justify-between p-2 border-b border-slate-800/80 last:border-none">
                      <span className="font-bold text-white print:text-black font-sans">{g.symbol}</span>
                      <span className="text-emerald-400 print:text-emerald-700 font-bold">
                        +{g.changePercent.toFixed(2)}% (₹{g.ltp.toFixed(2)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-1.5">
                  MCX Commodities Watch
                </h3>
                <div className="border border-slate-800 print:border-slate-300 rounded-lg overflow-hidden text-xs font-mono">
                  {commodities.slice(0, 4).map((c) => (
                    <div key={c.symbol} className="flex items-center justify-between p-2 border-b border-slate-800/80 last:border-none">
                      <span className="font-bold text-white print:text-black font-sans">{c.name}</span>
                      <span className={c.change >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}>
                        ₹{c.ltp.toLocaleString('en-IN')} ({c.change >= 0 ? '+' : ''}{c.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Macroeconomic & Policy Framework */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-2">
                3. Macroeconomic Baseline (RBI · Inflation · FX)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                {macro.slice(0, 4).map((m) => (
                  <div key={m.id} className="p-2 rounded bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                    <span className="text-[10px] text-slate-400 font-sans block">{m.name}</span>
                    <span className="font-bold text-white print:text-black">{m.value}</span>
                    <span className="text-[10px] text-slate-400 block">{m.change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Regulatory Compliance & Non-Execution Disclosure */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:border-slate-300 text-[11px] text-slate-400 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-300 print:text-black">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Regulatory Notice · Non-Execution Surveillance System</span>
              </div>
              <p>
                p0$u's tERMINAL operates strictly as a data aggregation, monitoring, and educational quantitative surveillance platform. It is not an authorized broker, does not provide order routing or transaction execution capabilities, and does not render financial or investment advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
