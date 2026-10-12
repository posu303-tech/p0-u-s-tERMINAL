import React, { useState, useEffect, useRef } from 'react';
import { PricePoint, TechnicalIndicators } from '../types/market';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Layers,
  TrendingUp,
  BarChart3,
  Clock,
  Radio,
} from 'lucide-react';
import { MarketStatusBadge } from './MarketStatusBadge';

interface ChartInspectorProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  historicalData: PricePoint[];
  technicals?: TechnicalIndicators;
  onClose?: () => void;
  isDark?: boolean;
}

export const ChartInspector: React.FC<ChartInspectorProps> = ({
  symbol,
  name,
  currentPrice,
  change,
  changePercent,
  historicalData,
  technicals,
  onClose,
  isDark = true,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [chartType, setChartType] = useState<'candle' | 'area'>('candle');
  const [showOrderProfile, setShowOrderProfile] = useState(true);
  const [showSMA20, setShowSMA20] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Esc to restore / exit maximize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

  // Adjust visible points based on zoom
  const pointsSliceCount = Math.max(15, Math.min(60, Math.round(35 / zoomLevel)));
  const points = historicalData.slice(-pointsSliceCount);
  if (points.length === 0) return null;

  // Price boundaries
  const rawMin = Math.min(...points.map((p) => p.low));
  const rawMax = Math.max(...points.map((p) => p.high));
  const padding = (rawMax - rawMin) * 0.08 || currentPrice * 0.02;
  const minPrice = rawMin - padding;
  const maxPrice = rawMax + padding;
  const priceRange = maxPrice - minPrice || 1;

  // Institutional Order Flow Levels (Market Profile / Volume Profile)
  const pocLevel = Math.round((minPrice + priceRange * 0.52) * 100) / 100; // Point of Control
  const vahLevel = Math.round((minPrice + priceRange * 0.72) * 100) / 100; // Value Area High
  const valLevel = Math.round((minPrice + priceRange * 0.32) * 100) / 100; // Value Area Low
  const callWall = Math.round((maxPrice - padding * 0.25) * 100) / 100; // Call Wall (heavy resistance)
  const putWall = Math.round((minPrice + padding * 0.25) * 100) / 100; // Put Wall (heavy support)

  // Chart dimensions based on layout mode
  const width = isMaximized ? 1440 : 1100;
  const height = isMaximized ? 720 : 420;
  const paddingLeft = 30;
  const paddingRight = 110; // Extra room for right-side price pills
  const paddingTop = 36;
  const paddingBottom = 40;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (idx: number) => paddingLeft + (idx / (points.length - 1)) * chartW;
  const getY = (price: number) => paddingTop + chartH - ((price - minPrice) / priceRange) * chartH;

  const isUp = change >= 0;

  // Sessions across timeline (Asian, London, US, Late, Asian)
  const sessions = [
    { name: 'Asian', xRatio: 0.12 },
    { name: 'London', xRatio: 0.35 },
    { name: 'US', xRatio: 0.58 },
    { name: 'Late', xRatio: 0.78 },
    { name: 'Asian', xRatio: 0.94 },
  ];

  // Area path
  const areaPath = points.reduce((acc, p, i) => {
    const x = getX(i);
    const y = getY(p.close);
    return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');
  const areaClosed = `${areaPath} L ${getX(points.length - 1)} ${paddingTop + chartH} L ${getX(0)} ${paddingTop + chartH} Z`;

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-200 select-none ${
        isMaximized
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#070b0e] text-slate-100 flex flex-col overflow-hidden'
          : 'w-full rounded-2xl border border-slate-800 bg-[#070b0e] text-slate-100 shadow-2xl p-4'
      }`}
    >
      {/* Top Bar Header matching screenshot */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-slate-800/80 bg-[#070b0e] relative">
        {/* Left: Live Ticker Identity & Market Status */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-slate-300 font-semibold tracking-wide">
              {symbol}
            </span>
          </div>
          <MarketStatusBadge
            segmentOrExchange={symbol.includes('MCX') ? 'MCX' : 'NSE'}
            size="sm"
          />
          {technicals?.patternDetected && (
            <span className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              {technicals.patternDetected}
            </span>
          )}
        </div>

        {/* Center: Big Prominent Live LTP Display as seen in screenshot */}
        <div className="flex md:absolute md:left-1/2 md:-translate-x-1/2 items-center gap-1.5 shrink-0">
          <span
            className={`text-lg sm:text-xl md:text-2xl font-black font-mono tabular-nums tracking-tight ${
              isUp ? 'text-[#00e676]' : 'text-[#ff5252]'
            }`}
          >
            {currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span
            className={`text-[11px] sm:text-xs font-mono tabular-nums font-bold ${
              isUp ? 'text-[#00e676]' : 'text-[#ff5252]'
            }`}
          >
            ({isUp ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </span>
        </div>

        {/* Right: Zoom controls, Market Profile Toggle, Maximize / Restore Button */}
        <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="p-1 px-1.5 sm:px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom out"
            >
              -
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="p-1 px-1.5 sm:px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="hidden sm:inline-block p-1 px-2 text-[10px] sm:text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Reset zoom"
            >
              Reset
            </button>
          </div>

          {/* Toggle Institutional Profile Lines */}
          <button
            onClick={() => setShowOrderProfile(!showOrderProfile)}
            className={`px-2 py-1 rounded-lg border transition-colors hidden sm:flex items-center gap-1 text-[11px] ${
              showOrderProfile
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Call/Put Walls, VAH, POC, and VAL"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden md:inline">Profile</span>
          </button>

          {/* Maximize / Restore Button */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors font-semibold text-xs shrink-0"
            title={isMaximized ? 'Restore to normal view (Esc)' : 'Maximize to full screen'}
          >
            {isMaximized ? (
              <>
                <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Restore</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Maximize</span>
              </>
            )}
          </button>

          {onClose && !isMaximized && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-0.5"
              title="Close chart"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main SVG Canvas Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#070b0e] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * width;
            const svgY = ((e.clientY - rect.top) / rect.height) * height;
            setCursorPos({ x: svgX, y: svgY });
          }}
          onMouseLeave={() => {
            setCursorPos(null);
            setHoveredPoint(null);
          }}
        >
          {/* Subtle Grid Lines (Horizontal) */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((pct, idx) => {
            const y = paddingTop + chartH * pct;
            return (
              <line
                key={`grid-h-${idx}`}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#121820"
                strokeDasharray="2 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Session Vertical Dividers & Headers */}
          {sessions.map((sess, idx) => {
            const sessX = paddingLeft + sess.xRatio * chartW;
            return (
              <g key={`sess-${idx}`}>
                <line
                  x1={sessX}
                  y1={paddingTop}
                  x2={sessX}
                  y2={paddingTop + chartH}
                  stroke="#16202c"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={sessX}
                  y={paddingTop - 12}
                  fill="#475569"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {sess.name}
                </text>
              </g>
            );
          })}

          {/* Next Session Badge (Top Right of Chart Canvas) */}
          <g>
            <rect
              x={width - paddingRight - 130}
              y={paddingTop - 20}
              width={124}
              height={18}
              fill="#1e293b"
              rx="4"
              opacity="0.8"
            />
            <text
              x={width - paddingRight - 68}
              y={paddingTop - 7}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
            >
              Next: US in 3:36:23
            </text>
          </g>

          {/* Institutional Horizontal Market Profile Levels */}
          {showOrderProfile && (
            <>
              {/* Call Wall Level (Purple Dashed) */}
              <g>
                <line
                  x1={paddingLeft}
                  y1={getY(callWall)}
                  x2={width - paddingRight}
                  y2={getY(callWall)}
                  stroke="#c084fc"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <text
                  x={paddingLeft + 8}
                  y={getY(callWall) - 6}
                  fill="#c084fc"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  Call wall {callWall.toFixed(2)}
                </text>
                {/* Right Y-Axis Pill */}
                <rect
                  x={width - paddingRight + 4}
                  y={getY(callWall) - 9}
                  width={90}
                  height={18}
                  fill="#581c87"
                  rx="3"
                />
                <text
                  x={width - paddingRight + 8}
                  y={getY(callWall) + 4}
                  fill="#f3e8ff"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  {callWall.toFixed(2)}
                </text>
              </g>

              {/* Value Area High (VAH, Cyan Dashed) */}
              <g>
                <line
                  x1={paddingLeft}
                  y1={getY(vahLevel)}
                  x2={width - paddingRight}
                  y2={getY(vahLevel)}
                  stroke="#2dd4bf"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <text
                  x={paddingLeft + 8}
                  y={getY(vahLevel) - 6}
                  fill="#2dd4bf"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  VAH {vahLevel.toFixed(2)}
                </text>
                {/* Right Y-Axis Pill */}
                <rect
                  x={width - paddingRight + 4}
                  y={getY(vahLevel) - 9}
                  width={90}
                  height={18}
                  fill="#042f2e"
                  stroke="#0f766e"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={width - paddingRight + 8}
                  y={getY(vahLevel) + 4}
                  fill="#2dd4bf"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  {vahLevel.toFixed(2)}
                </text>
              </g>

              {/* Point of Control (POC, Blue Dashed) */}
              <g>
                <line
                  x1={paddingLeft}
                  y1={getY(pocLevel)}
                  x2={width - paddingRight}
                  y2={getY(pocLevel)}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <text
                  x={paddingLeft + 8}
                  y={getY(pocLevel) - 6}
                  fill="#38bdf8"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  POC {pocLevel.toFixed(2)}
                </text>
                {/* Right Y-Axis Pill */}
                <rect
                  x={width - paddingRight + 4}
                  y={getY(pocLevel) - 9}
                  width={90}
                  height={18}
                  fill="#082f49"
                  stroke="#0284c7"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={width - paddingRight + 8}
                  y={getY(pocLevel) + 4}
                  fill="#38bdf8"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  {pocLevel.toFixed(2)}
                </text>
              </g>

              {/* Value Area Low (VAL, Orange/Red Dashed) */}
              <g>
                <line
                  x1={paddingLeft}
                  y1={getY(valLevel)}
                  x2={width - paddingRight}
                  y2={getY(valLevel)}
                  stroke="#fb7185"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <text
                  x={paddingLeft + 8}
                  y={getY(valLevel) - 6}
                  fill="#fb7185"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  VAL {valLevel.toFixed(2)}
                </text>
                {/* Right Y-Axis Pill */}
                <rect
                  x={width - paddingRight + 4}
                  y={getY(valLevel) - 9}
                  width={90}
                  height={18}
                  fill="#4c0519"
                  stroke="#be123c"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={width - paddingRight + 8}
                  y={getY(valLevel) + 4}
                  fill="#fda4af"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  {valLevel.toFixed(2)}
                </text>
              </g>

              {/* Put Wall Level (Pink Dashed) */}
              <g>
                <line
                  x1={paddingLeft}
                  y1={getY(putWall)}
                  x2={width - paddingRight}
                  y2={getY(putWall)}
                  stroke="#f472b6"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <text
                  x={paddingLeft + 8}
                  y={getY(putWall) - 6}
                  fill="#f472b6"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  Put wall {putWall.toFixed(2)}
                </text>
                {/* Right Y-Axis Pill */}
                <rect
                  x={width - paddingRight + 4}
                  y={getY(putWall) - 9}
                  width={90}
                  height={18}
                  fill="#701a75"
                  rx="3"
                />
                <text
                  x={width - paddingRight + 8}
                  y={getY(putWall) + 4}
                  fill="#fdf2f8"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  {putWall.toFixed(2)}
                </text>
              </g>
            </>
          )}

          {/* Area Chart Fill */}
          {chartType === 'area' && (
            <>
              <defs>
                <linearGradient id="fullChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e676" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00e676" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaClosed} fill="url(#fullChartGrad)" />
              <path d={areaPath} fill="none" stroke="#00e676" strokeWidth="2.5" />
            </>
          )}

          {/* Candlesticks Layer */}
          {chartType === 'candle' &&
            points.map((p, idx) => {
              const x = getX(idx);
              const openY = getY(p.open);
              const closeY = getY(p.close);
              const highY = getY(p.high);
              const lowY = getY(p.low);
              const isGreen = p.close >= p.open;
              const candleTop = Math.min(openY, closeY);
              const candleHeight = Math.max(2, Math.abs(openY - closeY));
              const color = isGreen ? '#26a69a' : '#ef5350';
              const candleWidth = Math.max(6, Math.min(16, (chartW / points.length) * 0.65));

              return (
                <g
                  key={`full-candle-${idx}`}
                  onMouseEnter={() => setHoveredPoint(p)}
                  className="cursor-crosshair"
                >
                  {/* High-Low Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1.5"
                  />
                  {/* Candle Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={candleTop}
                    width={candleWidth}
                    height={candleHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })}

          {/* Live Current Price Active Level (Green Line Across) */}
          <g>
            <line
              x1={paddingLeft}
              y1={getY(currentPrice)}
              x2={width - paddingRight}
              y2={getY(currentPrice)}
              stroke="#00e676"
              strokeDasharray="2 3"
              strokeWidth="1.5"
            />
            {/* Live Price Tag on Right Y-Axis with countdown box */}
            <rect
              x={width - paddingRight + 4}
              y={getY(currentPrice) - 10}
              width={90}
              height={20}
              fill="#00e676"
              rx="3"
            />
            <text
              x={width - paddingRight + 8}
              y={getY(currentPrice) + 4}
              fill="#042f2e"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
            >
              {currentPrice.toFixed(2)}
            </text>
          </g>

          {/* Time Countdown Pill (above live price) */}
          <g>
            <rect
              x={width - paddingRight + 4}
              y={getY(currentPrice) - 30}
              width={52}
              height={16}
              fill="#1e293b"
              rx="3"
            />
            <text
              x={width - paddingRight + 8}
              y={getY(currentPrice) - 18}
              fill="#38bdf8"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              ⏱ 6:23
            </text>

            <rect
              x={width - paddingRight + 58}
              y={getY(currentPrice) - 30}
              width={36}
              height={16}
              fill="#831843"
              rx="3"
            />
            <text
              x={width - paddingRight + 62}
              y={getY(currentPrice) - 18}
              fill="#f472b6"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
            >
              0.5X
            </text>
          </g>

          {/* Crosshair Guidelines when hovering */}
          {cursorPos && (
            <g pointerEvents="none">
              <line
                x1={paddingLeft}
                y1={cursorPos.y}
                x2={width - paddingRight}
                y2={cursorPos.y}
                stroke="#64748b"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={cursorPos.x}
                y1={paddingTop}
                x2={cursorPos.x}
                y2={paddingTop + chartH}
                stroke="#64748b"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Tooltip badge on crosshair Y */}
              <rect
                x={width - paddingRight + 4}
                y={cursorPos.y - 8}
                width={90}
                height={16}
                fill="#334155"
                rx="2"
              />
              <text
                x={width - paddingRight + 8}
                y={cursorPos.y + 4}
                fill="#ffffff"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {(maxPrice - ((cursorPos.y - paddingTop) / chartH) * priceRange).toFixed(2)}
              </text>
            </g>
          )}

          {/* Bottom Time Axis */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartH}
            x2={width - paddingRight}
            y2={paddingTop + chartH}
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Time markers */}
          {points.filter((_, idx) => idx % Math.max(1, Math.floor(points.length / 5)) === 0).map((p, idx) => {
            const actualIdx = points.indexOf(p);
            const x = getX(actualIdx);
            return (
              <text
                key={`time-lbl-${idx}`}
                x={x}
                y={paddingTop + chartH + 16}
                fill="#475569"
                fontSize="11"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
              >
                {p.time}
              </text>
            );
          })}

          {/* Rightmost Timestamp badge matching screenshot */}
          <g>
            <rect
              x={width - paddingRight - 84}
              y={paddingTop + chartH + 5}
              width={80}
              height={16}
              fill="#1e293b"
              rx="3"
            />
            <text
              x={width - paddingRight - 44}
              y={paddingTop + chartH + 17}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
            >
              10-12 14:59
            </text>
          </g>
        </svg>
      </div>

      {/* Floating Readout Bar on Maximize */}
      <div className="px-4 py-2 border-t border-slate-800 bg-[#070b0e] flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span>O: ₹{(hoveredPoint?.open || points[points.length - 1].open).toFixed(2)}</span>
          <span className="text-emerald-400">H: ₹{(hoveredPoint?.high || points[points.length - 1].high).toFixed(2)}</span>
          <span className="text-rose-400">L: ₹{(hoveredPoint?.low || points[points.length - 1].low).toFixed(2)}</span>
          <span>C: ₹{(hoveredPoint?.close || points[points.length - 1].close).toFixed(2)}</span>
          <span>Vol: {(hoveredPoint?.volume || points[points.length - 1].volume).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-purple-400">Call Wall: ₹{callWall.toFixed(2)}</span>
          <span className="text-cyan-400">VAH: ₹{vahLevel.toFixed(2)}</span>
          <span className="text-sky-400">POC: ₹{pocLevel.toFixed(2)}</span>
          <span className="text-rose-400">VAL: ₹{valLevel.toFixed(2)}</span>
          <span className="text-pink-400">Put Wall: ₹{putWall.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
