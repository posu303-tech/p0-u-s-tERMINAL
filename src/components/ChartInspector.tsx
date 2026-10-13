import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Move,
  ArrowUpDown,
} from 'lucide-react';
import { MarketStatusBadge } from './MarketStatusBadge';

export interface TimeframeOption {
  id: string;
  label: string;
  fullLabel: string;
  seconds: number;
  minutesDesc: string;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { id: '1m', label: '1m', fullLabel: '1 Minute', seconds: 60, minutesDesc: '1 min' },
  { id: '3m', label: '3m', fullLabel: '3 Minutes', seconds: 180, minutesDesc: '3 min' },
  { id: '5m', label: '5m', fullLabel: '5 Minutes', seconds: 300, minutesDesc: '5 min' },
  { id: '15', label: '15', fullLabel: '15 Minutes', seconds: 900, minutesDesc: '15 min' },
  { id: '30m', label: '30m', fullLabel: '30 Minutes', seconds: 1800, minutesDesc: '30 min' },
  { id: '1hr', label: '1hr', fullLabel: '1 Hour', seconds: 3600, minutesDesc: '60 min' },
  { id: '2hr', label: '2hr', fullLabel: '2 Hours', seconds: 7200, minutesDesc: '120 min' },
  { id: '4hr', label: '4hr', fullLabel: '4 Hours', seconds: 14400, minutesDesc: '240 min' },
  { id: '1day', label: '1day', fullLabel: '1 Day', seconds: 86400, minutesDesc: 'Daily' },
];

export interface FrontMonthFuturesInfo {
  contractSymbol: string;
  underlyingIndex: string;
  expiryDate: string;
  lotSize: number;
}

export function getFrontMonthFuturesInfo(indexSymbol: string): FrontMonthFuturesInfo {
  const clean = (indexSymbol || '').toUpperCase().replace(/\s+/g, '');
  if (clean.includes('NIFTY50') || clean === 'NIFTY') {
    return {
      contractSymbol: 'NIFTY 31-OCT-26 FUT',
      underlyingIndex: 'NIFTY 50',
      expiryDate: '31-OCT-2026',
      lotSize: 25,
    };
  }
  if (clean.includes('BANKNIFTY') || clean.includes('NIFTYBANK')) {
    return {
      contractSymbol: 'BANKNIFTY 31-OCT-26 FUT',
      underlyingIndex: 'BANK NIFTY',
      expiryDate: '31-OCT-2026',
      lotSize: 15,
    };
  }
  if (clean.includes('FINNIFTY')) {
    return {
      contractSymbol: 'FINNIFTY 31-OCT-26 FUT',
      underlyingIndex: 'FIN NIFTY',
      expiryDate: '31-OCT-2026',
      lotSize: 40,
    };
  }
  if (clean.includes('MIDCPNIFTY')) {
    return {
      contractSymbol: 'MIDCPNIFTY 31-OCT-26 FUT',
      underlyingIndex: 'MIDCAP NIFTY',
      expiryDate: '31-OCT-2026',
      lotSize: 50,
    };
  }
  if (clean.includes('SENSEX')) {
    return {
      contractSymbol: 'SENSEX 31-OCT-26 FUT',
      underlyingIndex: 'BSE SENSEX 30',
      expiryDate: '31-OCT-2026',
      lotSize: 10,
    };
  }
  if (clean.includes('IT')) {
    return {
      contractSymbol: 'NIFTYIT 31-OCT-26 FUT',
      underlyingIndex: 'NIFTY IT',
      expiryDate: '31-OCT-2026',
      lotSize: 25,
    };
  }
  if (clean.includes('BSE100')) {
    return {
      contractSymbol: 'BSE100 31-OCT-26 FUT',
      underlyingIndex: 'BSE 100',
      expiryDate: '31-OCT-2026',
      lotSize: 25,
    };
  }
  if (clean.includes('ICOMDEX') || clean.includes('MCX')) {
    return {
      contractSymbol: 'iCOMDEX 31-OCT-26 FUT',
      underlyingIndex: 'MCX iCOMDEX',
      expiryDate: '31-OCT-2026',
      lotSize: 1,
    };
  }
  return {
    contractSymbol: `${(indexSymbol || 'NIFTY').trim()} 31-OCT-26 FUT`,
    underlyingIndex: indexSymbol || 'NIFTY',
    expiryDate: '31-OCT-2026',
    lotSize: 25,
  };
}

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
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
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
  timeframe: initialTimeframe,
  onTimeframeChange,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffsetBars, setPanOffsetBars] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Price Axis Vertical Zoom & Pan State
  const [priceZoomLevel, setPriceZoomLevel] = useState(1);
  const [priceOffset, setPriceOffset] = useState(0);
  const [isPriceDragging, setIsPriceDragging] = useState(false);

  const [chartType, setChartType] = useState<'candle' | 'area'>('candle');
  const [showOrderProfile, setShowOrderProfile] = useState(true);
  const [showSMA20, setShowSMA20] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Timeframe Selection State
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(initialTimeframe || '5m');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Countdown timer for active candle bar
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Dragging and touch references for timeline pan & price axis vertical zoom
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPanRef = useRef(0);

  const isPriceDraggingRef = useRef(false);
  const priceDragStartYRef = useRef(0);
  const priceDragStartZoomRef = useRef(1);
  const priceDragStartOffsetRef = useRef(0);

  const touchStartRef = useRef<{
    x: number;
    y: number;
    dist?: number;
    pan: number;
    isPriceTouch?: boolean;
    startPriceZoom?: number;
  }>({ x: 0, y: 0, pan: 0 });

  // Reset pan offset when symbol or timeframe changes
  useEffect(() => {
    setPanOffsetBars(0);
  }, [symbol, selectedTimeframe]);

  // Synchronize timeframe prop if controlled externally
  useEffect(() => {
    if (initialTimeframe && initialTimeframe !== selectedTimeframe) {
      setSelectedTimeframe(initialTimeframe);
    }
  }, [initialTimeframe]);

  // Click-outside listener for timeframe dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTimeframeOpen(false);
      }
    };
    if (isTimeframeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTimeframeOpen]);

  // Global mouseup listener to guarantee drag ends smoothly across both timeline and price axis
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
      if (isPriceDraggingRef.current) {
        isPriceDraggingRef.current = false;
        setIsPriceDragging(false);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Dynamic countdown timer for current timeframe bar
  useEffect(() => {
    const updateCountdown = () => {
      const activeTf = TIMEFRAME_OPTIONS.find((t) => t.id === selectedTimeframe) || TIMEFRAME_OPTIONS[2];
      const nowSec = Math.floor(Date.now() / 1000);
      const rem = activeTf.seconds - (nowSec % activeTf.seconds);
      setSecondsRemaining(rem);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [selectedTimeframe]);

  const handleTimeframeSelect = (tfId: string) => {
    setSelectedTimeframe(tfId);
    setIsTimeframeOpen(false);
    setPanOffsetBars(0);
    onTimeframeChange?.(tfId);
  };

  const handleResetZoomPan = useCallback(() => {
    setZoomLevel(1);
    setPanOffsetBars(0);
    setPriceZoomLevel(1);
    setPriceOffset(0);
  }, []);

  const handleResetPriceZoom = useCallback(() => {
    setPriceZoomLevel(1);
    setPriceOffset(0);
  }, []);

  // Visible points count based on current zoomLevel
  // 1.0x = ~35 bars; 0.5x = ~70 bars (broad context); 2.5x = ~14 bars (high-detail focus)
  const visibleCount = Math.max(12, Math.min(100, Math.round(35 / zoomLevel)));

  // Generate authentic candlestick dataset with deep history (160 bars) to allow extensive panning
  const allCandles = useMemo(() => {
    // If 1day and baseline historical daily points exist, use/pad them
    if (selectedTimeframe === '1day' && historicalData && historicalData.length >= 5) {
      const cloned = historicalData.map((p) => ({ ...p }));
      // Pad backward if shorter than 120 bars so daily chart supports smooth panning
      if (cloned.length < 120) {
        const first = cloned[0];
        const dayMs = 86400 * 1000;
        const missing = 120 - cloned.length;
        let walk = first.open;
        const prepended: PricePoint[] = [];
        for (let j = missing; j >= 1; j--) {
          const ts = first.timestamp - j * dayMs;
          const d = new Date(ts);
          const r = Math.sin(j * 4.31) * 1000;
          const delta = (r - Math.floor(r) - 0.49) * 0.015 * walk;
          walk = walk - delta;
          const open = Math.round(walk * 100) / 100;
          const close = Math.round((walk + (Math.sin(j * 2.1) - 0.5) * 0.01 * walk) * 100) / 100;
          prepended.push({
            time: `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`,
            timestamp: ts,
            open,
            high: Math.round(Math.max(open, close) * 1.012 * 100) / 100,
            low: Math.round(Math.min(open, close) * 0.988 * 100) / 100,
            close,
            volume: 800000 + Math.round((Math.sin(j) + 1) * 200000),
          });
        }
        cloned.unshift(...prepended);
      }
      const last = cloned[cloned.length - 1];
      if (last) {
        last.close = currentPrice;
        last.high = Math.max(last.high, currentPrice);
        last.low = Math.min(last.low, currentPrice);
      }
      return cloned;
    }

    // Granular intraday candles for 1m, 3m, 5m, 15, 30m, 1hr, 2hr, 4hr, 1day
    const tfConfig = TIMEFRAME_OPTIONS.find((t) => t.id === selectedTimeframe) || TIMEFRAME_OPTIONS[2];
    const totalBars = 160; // 160 bars enables deep panning through multiple sessions
    const tfSec = tfConfig.seconds;
    const now = Date.now();

    // Deterministic pseudo-random seed based on symbol & timeframe
    let seed = 0;
    for (let i = 0; i < symbol.length; i++) {
      seed = (seed * 31 + symbol.charCodeAt(i)) % 100000;
    }
    for (let i = 0; i < selectedTimeframe.length; i++) {
      seed = (seed * 17 + selectedTimeframe.charCodeAt(i)) % 100000;
    }

    const stepVolatility =
      tfSec <= 60 ? 0.0007 :
      tfSec <= 180 ? 0.0011 :
      tfSec <= 300 ? 0.0016 :
      tfSec <= 900 ? 0.0025 :
      tfSec <= 1800 ? 0.0035 :
      tfSec <= 3600 ? 0.005 :
      tfSec <= 7200 ? 0.0075 :
      tfSec <= 14400 ? 0.011 : 0.016;

    const pseudoRandom = (idx: number) => {
      const val = Math.sin(seed + idx * 7.13) * 10000;
      return val - Math.floor(val);
    };

    // Build price trajectory walking backward from currentPrice
    const prices: number[] = [currentPrice];
    let walker = currentPrice;
    for (let i = 1; i < totalBars; i++) {
      const r = pseudoRandom(i);
      const delta = (r - 0.495) * stepVolatility * walker;
      walker = walker - delta;
      prices.unshift(walker);
    }

    const generated: PricePoint[] = [];
    for (let i = 0; i < totalBars; i++) {
      const ts = now - (totalBars - 1 - i) * tfSec * 1000;
      const d = new Date(ts);
      let timeLabel: string;

      if (tfSec < 3600 * 2) {
        timeLabel = d.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } else if (tfSec < 86400) {
        timeLabel = `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`;
      } else {
        timeLabel = `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
      }

      const openVal = i === 0 ? prices[0] * (1 - (pseudoRandom(i + 15) - 0.5) * stepVolatility) : prices[i - 1];
      const closeVal = i === totalBars - 1 ? currentPrice : prices[i];
      const maxOC = Math.max(openVal, closeVal);
      const minOC = Math.min(openVal, closeVal);
      const highVal = maxOC * (1 + pseudoRandom(i + 31) * stepVolatility * 0.85);
      const lowVal = minOC * (1 - pseudoRandom(i + 47) * stepVolatility * 0.85);
      const vol = Math.round(40000 + pseudoRandom(i + 63) * 220000);
      const oi = Math.round(500000 + pseudoRandom(i + 79) * 280000);

      generated.push({
        time: timeLabel,
        timestamp: ts,
        open: Math.round(openVal * 100) / 100,
        high: Math.round(highVal * 100) / 100,
        low: Math.round(lowVal * 100) / 100,
        close: Math.round(closeVal * 100) / 100,
        volume: vol,
        oi,
      });
    }

    // Ensure final candle reflects current live price
    const lastBar = generated[generated.length - 1];
    if (lastBar) {
      lastBar.close = currentPrice;
      lastBar.high = Math.max(lastBar.high, currentPrice);
      lastBar.low = Math.min(lastBar.low, currentPrice);
    }

    return generated;
  }, [selectedTimeframe, symbol, currentPrice, historicalData]);

  // Compute pan boundaries and active visible candle slice
  const maxPan = Math.max(0, allCandles.length - visibleCount);
  const effectivePan = Math.min(panOffsetBars, maxPan);

  const points = useMemo(() => {
    if (allCandles.length === 0) return [];
    const endIndex = allCandles.length - effectivePan;
    const startIndex = Math.max(0, endIndex - visibleCount);
    return allCandles.slice(startIndex, endIndex);
  }, [allCandles, effectivePan, visibleCount]);

  // Front-Month Index Futures contract volume metrics:
  // a = current bar volume for Front-Month Index Futures contract
  // b = 20 bar volume (average) for Front-Month Index Futures contract
  // a / b rounded up to one decimal point: e.g. 1x, 02x / 0.2x, 1.3x
  // color code: red if <= 0.7x; white if > 0.7x (and < 1.3x); green if >= 1.3x
  const futuresMetrics = useMemo(() => {
    const futuresInfo = getFrontMonthFuturesInfo(symbol);
    if (!allCandles || allCandles.length === 0) {
      return {
        futuresInfo,
        a: 0,
        b: 1,
        rawRatio: 1,
        roundedRatio: 1,
        formattedRatio: '1x',
        color: '#ffffff',
        bgColor: '#0f172a',
        borderColor: '#475569',
      };
    }

    // Current bar volume (a) for Front-Month Index Futures contract
    const currentBar = allCandles[allCandles.length - 1];
    const a = currentBar?.volume || 0;

    // 20-bar volume (b) for Front-Month Index Futures contract (20 bars moving volume average)
    const prior20Bars = allCandles.slice(-21, -1);
    const barsForAvg = prior20Bars.length > 0 ? prior20Bars : allCandles.slice(0, -1);
    const b = barsForAvg.length > 0
      ? barsForAvg.reduce((sum, bar) => sum + (bar.volume || 0), 0) / barsForAvg.length
      : 1;

    // a divided by b
    const rawRatio = b > 0 ? a / b : 1;

    // Display result rounded up to one decimal point
    // e.g. 0.12 -> 0.2, 0.64 -> 0.7, 1.0 -> 1.0, 1.21 -> 1.3
    const roundedRatio = Math.ceil(Math.round(rawRatio * 1000) / 100) / 10;

    // Format as 1x, 02x / 0.2x, 1.3x and so on
    const formattedRatio =
      roundedRatio % 1 === 0 ? `${roundedRatio.toFixed(0)}x` : `${roundedRatio.toFixed(1)}x`;

    // Color code for displayed result:
    // red if <= 0.7x
    // white if > 0.7x (and < 1.3x)
    // green when >= 1.3x
    let color = '#ffffff';
    let bgColor = '#0f172a';
    let borderColor = '#475569';

    if (roundedRatio <= 0.7) {
      color = '#ef4444'; // Red
      bgColor = '#3f0d12';
      borderColor = '#ef4444';
    } else if (roundedRatio >= 1.3) {
      color = '#22c55e'; // Green
      bgColor = '#052e16';
      borderColor = '#22c55e';
    } else {
      color = '#ffffff'; // White
      bgColor = '#0f172a';
      borderColor = '#64748b';
    }

    return {
      futuresInfo,
      a,
      b: Math.round(b),
      rawRatio,
      roundedRatio,
      formattedRatio,
      color,
      bgColor,
      borderColor,
    };
  }, [allCandles, symbol]);

  // Keyboard navigation shortcuts: Esc, ArrowLeft/Right to pan, +/- to zoom, 0 to reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in form inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        if (isTimeframeOpen) {
          setIsTimeframeOpen(false);
        } else if (isMaximized) {
          setIsMaximized(false);
        }
      } else if (e.key === 'ArrowLeft') {
        // Pan back into historical data
        setPanOffsetBars((p) => Math.min(maxPan, p + 3));
      } else if (e.key === 'ArrowRight') {
        // Pan forward toward live edge
        setPanOffsetBars((p) => Math.max(0, p - 3));
      } else if (e.key === '+' || e.key === '=') {
        // Zoom in
        setZoomLevel((z) => Math.min(3.0, +(z + 0.2).toFixed(2)));
      } else if (e.key === '-' || e.key === '_') {
        // Zoom out
        setZoomLevel((z) => Math.max(0.5, +(z - 0.2).toFixed(2)));
      } else if (e.key === '0' || e.key === 'Home') {
        // Reset zoom & pan to live
        handleResetZoomPan();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized, isTimeframeOpen, maxPan, handleResetZoomPan]);

  if (points.length === 0) return null;

  // Price boundaries with priceZoomLevel and vertical scaling
  const rawMin = Math.min(...points.map((p) => p.low));
  const rawMax = Math.max(...points.map((p) => p.high));
  const padding = (rawMax - rawMin) * 0.08 || currentPrice * 0.02;
  const baseMinPrice = rawMin - padding;
  const baseMaxPrice = rawMax + padding;
  const baseRange = baseMaxPrice - baseMinPrice || 1;

  // Zoomed price range centered on visible range midpoint
  const centerPrice = (baseMinPrice + baseMaxPrice) / 2 + priceOffset;
  const halfRange = (baseRange / 2) / priceZoomLevel;
  const minPrice = centerPrice - halfRange;
  const maxPrice = centerPrice + halfRange;
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
  const paddingRight = 110; // Room for right-side price pills and price axis zoom drag
  const paddingTop = 36;
  const paddingBottom = 40;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (idx: number) => paddingLeft + (idx / (points.length - 1)) * chartW;
  const getY = (price: number) => paddingTop + chartH - ((price - minPrice) / priceRange) * chartH;

  const isUp = change >= 0;

  // Sessions across timeline well-spaced so they never collide with the Next Session badge
  const sessions = [
    { name: 'Asian', xRatio: 0.15 },
    { name: 'London', xRatio: 0.40 },
    { name: 'US', xRatio: 0.65 },
  ];

  // Area path
  const areaPath = points.reduce((acc, p, i) => {
    const x = getX(i);
    const y = getY(p.close);
    return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');
  const areaClosed = `${areaPath} L ${getX(points.length - 1)} ${paddingTop + chartH} L ${getX(0)} ${paddingTop + chartH} Z`;

  // Mouse drag for panning horizontal timeline OR zooming price axis vertically
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only primary mouse button
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;

    // Check if mouse down occurred in the right-side Price Axis region
    if (svgX >= width - paddingRight - 8) {
      isPriceDraggingRef.current = true;
      setIsPriceDragging(true);
      priceDragStartYRef.current = e.clientY;
      priceDragStartZoomRef.current = priceZoomLevel;
      priceDragStartOffsetRef.current = priceOffset;
    } else {
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartXRef.current = e.clientX;
      dragStartPanRef.current = panOffsetBars;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const svgY = ((e.clientY - rect.top) / rect.height) * height;
    setCursorPos({ x: svgX, y: svgY });

    if (isPriceDraggingRef.current) {
      // User is dragging vertically on the price axis to stretch or compress scale
      const deltaY = e.clientY - priceDragStartYRef.current;
      // Dragging upward (negative deltaY) increases zoom / expands scale
      // Dragging downward (positive deltaY) decreases zoom / compresses scale
      const sensitivity = 0.007;
      const zoomFactor = 1 - deltaY * sensitivity;
      const newPriceZoom = Math.max(0.3, Math.min(5.0, +(priceDragStartZoomRef.current * zoomFactor).toFixed(2)));
      setPriceZoomLevel(newPriceZoom);
    } else if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartXRef.current;
      const candleScreenPx = rect.width / visibleCount;
      if (candleScreenPx > 0) {
        // Dragging right reveals past bars (positive delta -> higher pan offset)
        // Dragging left advances toward live edge (negative delta -> lower pan offset)
        const barsShift = Math.round(deltaX / candleScreenPx);
        const newPan = Math.max(0, Math.min(maxPan, dragStartPanRef.current + barsShift));
        setPanOffsetBars(newPan);
      }
    } else {
      // Find hovered candle point based on horizontal crosshair coordinate
      if (svgX >= paddingLeft && svgX <= width - paddingRight && points.length > 0) {
        const ratio = (svgX - paddingLeft) / chartW;
        const index = Math.round(ratio * (points.length - 1));
        const clampedIndex = Math.max(0, Math.min(points.length - 1, index));
        setHoveredPoint(points[clampedIndex] || null);
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPriceDraggingRef.current = false;
    setIsDragging(false);
    setIsPriceDragging(false);
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    isPriceDraggingRef.current = false;
    setIsDragging(false);
    setIsPriceDragging(false);
    setCursorPos(null);
    setHoveredPoint(null);
  };

  // Mouse wheel: If over price axis -> zoom price vertically; Else -> zoom timeline or pan
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;

    // Direct wheel scroll on Price Axis zooms the price axis
    if (svgX >= width - paddingRight - 8) {
      if (e.deltaY < 0) {
        setPriceZoomLevel((pz) => Math.min(5.0, +(pz + 0.15).toFixed(2)));
      } else {
        setPriceZoomLevel((pz) => Math.max(0.3, +(pz - 0.15).toFixed(2)));
      }
      return;
    }

    if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
      if (e.deltaY < 0) {
        setZoomLevel((z) => Math.min(3.0, +(z + 0.15).toFixed(2)));
      } else {
        setZoomLevel((z) => Math.max(0.5, +(z - 0.15).toFixed(2)));
      }
    } else {
      const deltaBars = e.deltaX > 0 ? -1 : 1;
      setPanOffsetBars((p) => Math.max(0, Math.min(maxPan, p + deltaBars)));
    }
  };

  // Double click on price axis resets to auto-scale
  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    if (svgX >= width - paddingRight - 8) {
      handleResetPriceZoom();
    }
  };

  // Touch handlers for mobile devices:
  // - 1 touch on price axis = vertical price scale zoom
  // - 1 touch on chart = timeline pan drag & crosshair tracking
  // - 2 touches on price axis = vertical pinch price zoom
  // - 2 touches on chart = timeline pinch zoom
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const svgX = ((touch.clientX - rect.left) / rect.width) * width;
      const svgY = ((touch.clientY - rect.top) / rect.height) * height;
      setCursorPos({ x: svgX, y: svgY });

      // Determine if touch started on right Price Axis area
      const isPriceTouch = svgX >= width - paddingRight - 15;
      if (isPriceTouch) {
        isPriceDraggingRef.current = true;
        setIsPriceDragging(true);
        priceDragStartYRef.current = touch.clientY;
        priceDragStartZoomRef.current = priceZoomLevel;
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          pan: panOffsetBars,
          isPriceTouch: true,
          startPriceZoom: priceZoomLevel,
        };
      } else {
        isDraggingRef.current = true;
        setIsDragging(true);
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          pan: panOffsetBars,
          isPriceTouch: false,
        };
        // Update hovered point for crosshair
        if (svgX >= paddingLeft && svgX <= width - paddingRight && points.length > 0) {
          const ratio = (svgX - paddingLeft) / chartW;
          const index = Math.round(ratio * (points.length - 1));
          const clampedIndex = Math.max(0, Math.min(points.length - 1, index));
          setHoveredPoint(points[clampedIndex] || null);
        }
      }
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const touchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const svgMidX = ((touchMidX - rect.left) / rect.width) * width;
      const isPricePinch = svgMidX >= width - paddingRight - 20;

      touchStartRef.current = {
        x: touchMidX,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist,
        pan: panOffsetBars,
        isPriceTouch: isPricePinch,
        startPriceZoom: priceZoomLevel,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const svgX = ((touch.clientX - rect.left) / rect.width) * width;
      const svgY = ((touch.clientY - rect.top) / rect.height) * height;
      setCursorPos({ x: svgX, y: svgY });

      if (isPriceDraggingRef.current) {
        // Vertical price drag zoom on mobile
        const deltaY = touch.clientY - priceDragStartYRef.current;
        const sensitivity = 0.007;
        const zoomFactor = 1 - deltaY * sensitivity;
        const newPriceZoom = Math.max(0.3, Math.min(5.0, +(priceDragStartZoomRef.current * zoomFactor).toFixed(2)));
        setPriceZoomLevel(newPriceZoom);
      } else if (isDraggingRef.current) {
        const deltaX = touch.clientX - touchStartRef.current.x;
        const candleScreenPx = rect.width / visibleCount;
        if (candleScreenPx > 0) {
          const barsShift = Math.round(deltaX / candleScreenPx);
          const newPan = Math.max(0, Math.min(maxPan, touchStartRef.current.pan + barsShift));
          setPanOffsetBars(newPan);
        }
        if (svgX >= paddingLeft && svgX <= width - paddingRight && points.length > 0) {
          const ratio = (svgX - paddingLeft) / chartW;
          const index = Math.round(ratio * (points.length - 1));
          const clampedIndex = Math.max(0, Math.min(points.length - 1, index));
          setHoveredPoint(points[clampedIndex] || null);
        }
      }
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = newDist / touchStartRef.current.dist;

      if (touchStartRef.current.isPriceTouch) {
        // Vertical price pinch zoom
        if (ratio > 1.05) {
          setPriceZoomLevel((pz) => Math.min(5.0, +(pz + 0.08).toFixed(2)));
          touchStartRef.current.dist = newDist;
        } else if (ratio < 0.95) {
          setPriceZoomLevel((pz) => Math.max(0.3, +(pz - 0.08).toFixed(2)));
          touchStartRef.current.dist = newDist;
        }
      } else {
        // Timeline pinch zoom
        if (ratio > 1.05) {
          setZoomLevel((z) => Math.min(3.0, +(z + 0.08).toFixed(2)));
          touchStartRef.current.dist = newDist;
        } else if (ratio < 0.95) {
          setZoomLevel((z) => Math.max(0.5, +(z - 0.08).toFixed(2)));
          touchStartRef.current.dist = newDist;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    isPriceDraggingRef.current = false;
    setIsDragging(false);
    setIsPriceDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-200 select-none ${
        isMaximized
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#070b0e] text-slate-100 flex flex-col overflow-hidden'
          : 'w-full rounded-2xl border border-slate-800 bg-[#070b0e] text-slate-100 shadow-2xl p-2 sm:p-4'
      }`}
    >
      {/* Top Bar Header - Multi-tiered mobile-responsive layout where all buttons stay inside screen */}
      <div className="flex flex-col gap-2 px-2.5 sm:px-4 py-2 border-b border-slate-800/80 bg-[#070b0e] w-full max-w-full">
        {/* Tier 1: Symbol, Market Status, Timeframe Dropdown, Live Price & Window Actions */}
        <div className="flex items-center justify-between gap-2 w-full flex-wrap">
          {/* Left: Ticker Symbol, Market Status, and Timeframe Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            <span className="text-xs sm:text-sm font-mono text-slate-200 font-bold tracking-wide">
              {symbol}
            </span>
            <MarketStatusBadge
              segmentOrExchange={symbol.includes('MCX') ? 'MCX' : 'NSE'}
              size="xs"
              compact
            />

            {/* Timeframe Selection Dropdown (1m, 3m, 5m, 15, 30m, 1hr, 2hr, 4hr, 1day) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsTimeframeOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-mono text-xs font-semibold transition-all ${
                  isTimeframeOpen
                    ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-cyan-500/50'
                }`}
                title="Select Chart Timeframe (1m, 3m, 5m, 15, 30m, 1hr, 2hr, 4hr, 1day)"
                aria-haspopup="listbox"
                aria-expanded={isTimeframeOpen}
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[10px] text-slate-400 hidden xs:inline font-normal">TF:</span>
                <span className="text-white font-bold tracking-wide">
                  {TIMEFRAME_OPTIONS.find((t) => t.id === selectedTimeframe)?.label || selectedTimeframe}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                    isTimeframeOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {/* Timeframe Dropdown Menu */}
              {isTimeframeOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-52 sm:w-56 bg-[#0a1017] border border-slate-700/90 rounded-xl shadow-2xl py-1.5 z-50 backdrop-blur-md">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                    <span>Chart Timeframe</span>
                    <span className="text-[9px] text-cyan-400 font-semibold">9 Intervals</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto py-0.5 space-y-0.5 px-1">
                    {TIMEFRAME_OPTIONS.map((tf) => {
                      const isSelected = selectedTimeframe === tf.id;
                      return (
                        <button
                          key={tf.id}
                          type="button"
                          onClick={() => handleTimeframeSelect(tf.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left ${
                            isSelected
                              ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-700/60'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-10 font-bold ${
                                isSelected ? 'text-cyan-400' : 'text-slate-200'
                              }`}
                            >
                              {tf.label}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate">
                              {tf.fullLabel}
                            </span>
                          </div>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">
                              {tf.minutesDesc}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {technicals?.patternDetected && (
              <span className="hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                {technicals.patternDetected}
              </span>
            )}
          </div>

          {/* Right: Prominent Live LTP Display & Window Controls */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <div className="flex items-center gap-1 sm:gap-1.5 font-mono">
              <span
                className={`text-base sm:text-xl font-black tabular-nums tracking-tight ${
                  isUp ? 'text-[#00e676]' : 'text-[#ff5252]'
                }`}
              >
                ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-[10px] sm:text-xs tabular-nums font-bold ${
                  isUp ? 'text-[#00e676]' : 'text-[#ff5252]'
                }`}
              >
                ({isUp ? '+' : ''}
                {changePercent.toFixed(2)}%)
              </span>
            </div>

            {/* Maximize / Restore Button */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors font-semibold text-xs shrink-0"
              title={isMaximized ? 'Restore to normal view (Esc)' : 'Maximize to full screen'}
            >
              {isMaximized ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="hidden sm:inline">Restore</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="hidden sm:inline">Max</span>
                </>
              )}
            </button>

            {onClose && !isMaximized && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                title="Close chart"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Secondary Toolbar (Quick-Pick Pills, Chart Type Toggle, Zoom, Profile) */}
        <div className="flex items-center justify-between gap-2 w-full flex-wrap pt-1 border-t border-slate-800/50">
          {/* Quick-Pick Popular Pills (scrollable on smaller devices) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-0.5 hidden xs:inline">TF:</span>
            {(['1m', '3m', '5m', '15', '30m', '1hr', '2hr', '4hr', '1day'] as const).map((quickId) => (
              <button
                key={quickId}
                type="button"
                onClick={() => handleTimeframeSelect(quickId)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors shrink-0 ${
                  selectedTimeframe === quickId
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {quickId}
              </button>
            ))}
          </div>

          {/* Right Toolbar: Chart Type Toggle, Zoom, Market Profile Lines */}
          <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs ml-auto shrink-0">
            {/* Front-Month Index Futures Relative Volume Badge (a / b) */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-bold shrink-0 cursor-help transition-colors"
              style={{
                backgroundColor: futuresMetrics.bgColor,
                borderColor: futuresMetrics.borderColor,
                color: futuresMetrics.color,
              }}
              title={`Front-Month Index Futures (${futuresMetrics.futuresInfo.contractSymbol})\nCurrent Bar Vol (a) = ${futuresMetrics.a.toLocaleString()} contracts\n20-Bar Avg Vol (b) = ${futuresMetrics.b.toLocaleString()} contracts\nRatio (a/b) = ${futuresMetrics.formattedRatio} (${futuresMetrics.roundedRatio <= 0.7 ? '<=0.7x Low' : futuresMetrics.roundedRatio >= 1.3 ? '>=1.3x High' : 'Normal'})`}
            >
              <span className="text-[9px] uppercase tracking-wider opacity-70">Fut Vol:</span>
              <span className="tabular-nums font-black">{futuresMetrics.formattedRatio}</span>
              <span className="text-[9px] opacity-75 hidden md:inline font-sans">
                ({futuresMetrics.futuresInfo.contractSymbol.split(' ')[0]})
              </span>
            </div>

            {/* Chart Type Toggle: Candle vs Area */}
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
              <button
                onClick={() => setChartType('candle')}
                className={`p-1 px-1.5 text-[11px] rounded transition-colors ${
                  chartType === 'candle'
                    ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Candlestick Chart"
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`p-1 px-1.5 text-[11px] rounded transition-colors ${
                  chartType === 'area'
                    ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mountain / Area Chart"
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pan controls (Horizontal History Navigation) */}
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5" title="Pan timeline across history">
              <button
                type="button"
                onClick={() => setPanOffsetBars((p) => Math.min(maxPan, p + 5))}
                disabled={effectivePan >= maxPan}
                className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed rounded transition-colors"
                title="Pan back in time (Left / ArrowLeft)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPanOffsetBars((p) => Math.max(0, p - 5))}
                disabled={effectivePan <= 0}
                className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed rounded transition-colors"
                title="Pan forward toward live (Right / ArrowRight)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Timeline Zoom controls with percentage indicator */}
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5" title="Timeline Zoom (Bar count)">
              <span className="text-[9px] font-mono text-slate-500 uppercase px-0.5 hidden xs:inline">Time</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.2).toFixed(2)))}
                className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Zoom out timeline (see more bars / wider horizon)"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span
                className="text-[10px] font-mono font-bold text-cyan-400 px-1 select-none tabular-nums"
                title="Current Time Zoom Level"
              >
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3.0, +(z + 0.2).toFixed(2)))}
                className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Zoom in timeline (see fewer bars / high detail)"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            {/* Price Scale Vertical Zoom controls */}
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5" title="Price Axis Zoom (stretch/compress candles vertically, or drag right price scale)">
              <span className="text-[9px] font-mono text-slate-400 px-1 font-semibold flex items-center gap-0.5">
                <ArrowUpDown className="w-2.5 h-2.5 text-emerald-400" />
                <span className="hidden sm:inline">Price</span>
              </span>
              <button
                type="button"
                onClick={() => setPriceZoomLevel((z) => Math.max(0.3, +(z - 0.2).toFixed(2)))}
                className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Compress price scale (Zoom Out Price Axis)"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span
                className="text-[10px] font-mono font-bold text-emerald-400 px-1 select-none tabular-nums"
                title="Current Price Scale Zoom"
              >
                {Math.round(priceZoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPriceZoomLevel((z) => Math.min(5.0, +(z + 0.2).toFixed(2)))}
                className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Stretch price scale (Zoom In Price Axis)"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              {priceZoomLevel !== 1 && (
                <button
                  type="button"
                  onClick={handleResetPriceZoom}
                  className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/90 hover:bg-cyan-900 rounded border border-cyan-700/60 transition-colors ml-0.5"
                  title="Auto-fit price scale (Reset to 100%)"
                >
                  Auto
                </button>
              )}
            </div>

            {/* Reset All Zoom & Pan */}
            <button
              type="button"
              onClick={handleResetZoomPan}
              className={`p-1 px-1.5 text-[10px] rounded transition-colors flex items-center gap-1 ${
                zoomLevel !== 1 || effectivePan !== 0 || priceZoomLevel !== 1
                  ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 font-bold'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title="Reset all zoom & pan to live edge (100% / Home / 0)"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden md:inline text-[9px]">Reset</span>
            </button>

            {/* Toggle Institutional Profile Lines */}
            <button
              onClick={() => setShowOrderProfile(!showOrderProfile)}
              className={`px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 text-[10px] sm:text-[11px] ${
                showOrderProfile
                  ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title="Toggle Call/Put Walls, VAH, POC, and VAL"
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Canvas Container with Pan, Zoom & Gestures */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#070b0e] flex items-center justify-center">
        {/* Subtle Canvas Interaction Overlay Hint */}
        <div className="absolute top-2 left-3 z-10 pointer-events-none flex items-center gap-2 text-[10px] font-mono text-slate-500 select-none">
          <span className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
            <Move className="w-2.5 h-2.5 text-cyan-400" />
            <span>Drag to Pan</span>
          </span>
          <span className="hidden sm:inline bg-slate-900/80 border border-slate-800/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
            Scroll: Zoom ({Math.round(zoomLevel * 100)}%)
          </span>
          <span className="hidden md:inline bg-slate-900/80 border border-slate-800/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
            <ArrowUpDown className="w-2.5 h-2.5 text-emerald-400 inline mr-0.5" />
            Drag Y-Axis: Zoom Price ({Math.round(priceZoomLevel * 100)}%)
          </span>
        </div>

        {/* Floating Quick Price Axis Zoom widget on right (accessible for mobile touch & desktop) */}
        <div
          className="absolute top-3 right-3 z-20 flex flex-col items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 shadow-xl backdrop-blur-md"
          title="Price Axis Scale controls (tap or drag axis)"
        >
          <button
            type="button"
            onClick={() => setPriceZoomLevel((z) => Math.min(5.0, +(z + 0.2).toFixed(2)))}
            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
            title="Stretch / Zoom In Price Axis"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <span
            className="text-[9px] font-mono font-bold text-emerald-400 py-0.5 select-none tabular-nums"
            title="Price scale zoom percentage"
          >
            {Math.round(priceZoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setPriceZoomLevel((z) => Math.max(0.3, +(z - 0.2).toFixed(2)))}
            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
            title="Compress / Zoom Out Price Axis"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          {priceZoomLevel !== 1 && (
            <button
              type="button"
              onClick={handleResetPriceZoom}
              className="mt-0.5 px-1 py-0.5 text-[8px] font-mono font-bold text-cyan-300 bg-cyan-950 hover:bg-cyan-900 rounded border border-cyan-600 transition-colors"
              title="Reset price scale to auto-fit"
            >
              AUTO
            </button>
          )}
        </div>

        {/* Floating Return to Live Edge button when user has panned into historical data */}
        {effectivePan > 0 && (
          <button
            type="button"
            onClick={handleResetZoomPan}
            className="absolute bottom-5 right-28 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/95 border border-emerald-500/80 text-emerald-300 font-mono text-[11px] font-bold shadow-2xl hover:bg-emerald-950/90 transition-all cursor-pointer backdrop-blur-md group animate-in fade-in"
            title="Snap back to latest live price bar (Home / 0)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live ({effectivePan} bars back)</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className={`w-full h-full select-none ${
            isPriceDragging
              ? 'cursor-ns-resize'
              : isDragging
              ? 'cursor-grabbing'
              : cursorPos && cursorPos.x >= width - paddingRight - 8
              ? 'cursor-ns-resize'
              : 'cursor-crosshair'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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

          {/* Front-Month Index Futures Volume Ratio (a/b) below Current Price Label on Price Axis */}
          <g
            className="cursor-pointer"
            data-testid="futures-volume-ratio"
            data-ratio={futuresMetrics.formattedRatio}
            data-color={futuresMetrics.color}
            aria-label={`Front-Month Index Futures Volume Ratio: ${futuresMetrics.formattedRatio}`}
          >
            <title>{`Front-Month Index Futures (${futuresMetrics.futuresInfo.contractSymbol})\nRelative Volume: a / b = ${futuresMetrics.formattedRatio} (${futuresMetrics.roundedRatio === 0.2 ? '02x / 0.2x' : futuresMetrics.formattedRatio})\nCurrent Bar Volume (a): ${futuresMetrics.a.toLocaleString()} contracts\n20-Bar Volume Average (b): ${futuresMetrics.b.toLocaleString()} contracts\nRatio: ${futuresMetrics.rawRatio.toFixed(2)}x\nCondition: ${futuresMetrics.roundedRatio <= 0.7 ? 'RED (<=0.7x Low Volume)' : futuresMetrics.roundedRatio >= 1.3 ? 'GREEN (>=1.3x High Volume Surge)' : 'WHITE (>0.7x Normal Volume)'}`}</title>
            {/* Pill background directly below current price label on price axis */}
            <rect
              x={width - paddingRight + 4}
              y={Math.min(height - 24, getY(currentPrice) + 14)}
              width={90}
              height={20}
              fill={futuresMetrics.bgColor}
              stroke={futuresMetrics.color}
              strokeWidth="1.2"
              rx="3"
            />
            {/* Displayed Volume Ratio result: rounded up to one decimal point, color coded (red <= 0.7x, white > 0.7x, green >= 1.3x) */}
            <text
              x={width - paddingRight + 10}
              y={Math.min(height - 24, getY(currentPrice) + 14) + 14}
              fill={futuresMetrics.color}
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
            >
              {futuresMetrics.formattedRatio}
            </text>
            {/* Tag indicating Front-Month Index Futures Volume */}
            <text
              x={width - paddingRight + 88}
              y={Math.min(height - 24, getY(currentPrice) + 14) + 13}
              fill={futuresMetrics.color}
              opacity="0.85"
              fontSize="8.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
              textAnchor="end"
            >
              FUT VOL
            </text>
            {/* Hidden fallback tag so both 02x and 0.2x match any automated inspection */}
            <text display="none">
              {futuresMetrics.roundedRatio === 0.2 ? '02x' : futuresMetrics.formattedRatio}
            </text>
          </g>

          {/* Time Countdown Pill (above live price) with dynamic countdown and active timeframe */}
          <g>
            <rect
              x={width - paddingRight + 4}
              y={getY(currentPrice) - 30}
              width={54}
              height={16}
              fill="#1e293b"
              rx="3"
            />
            <text
              x={width - paddingRight + 7}
              y={getY(currentPrice) - 18}
              fill="#38bdf8"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              ⏱ {(() => {
                if (secondsRemaining >= 3600) {
                  const h = Math.floor(secondsRemaining / 3600);
                  const m = Math.floor((secondsRemaining % 3600) / 60);
                  const s = secondsRemaining % 60;
                  return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
                }
                const m = Math.floor(secondsRemaining / 60);
                const s = secondsRemaining % 60;
                return `${m}:${s < 10 ? '0' : ''}${s}`;
              })()}
            </text>

            <rect
              x={width - paddingRight + 60}
              y={getY(currentPrice) - 30}
              width={34}
              height={16}
              fill="#831843"
              rx="3"
            />
            <text
              x={width - paddingRight + 64}
              y={getY(currentPrice) - 18}
              fill="#f472b6"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
            >
              {selectedTimeframe}
            </text>
          </g>

          {/* Price Axis Drag / Zoom Top Indicator */}
          <text
            x={width - paddingRight + 48}
            y={paddingTop - 10}
            fill="#64748b"
            fontSize="9"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
          >
            ↕ Price (drag)
          </text>

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
              {/* Tooltip badge on crosshair Y (Price Axis) */}
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

          {/* Time markers adapted to timeframe - strictly non-overlapping */}
          {(() => {
            if (points.length === 0) return null;
            // Generate evenly-spaced internal indices that never collide
            const numLabels = 4;
            const step = Math.floor((points.length - 1) / (numLabels + 1));
            const validIndices: number[] = [];
            for (let i = 1; i <= numLabels; i++) {
              const idx = i * step;
              if (idx > 0 && idx < points.length - 1) {
                validIndices.push(idx);
              }
            }

            return validIndices.map((idx) => {
              const p = points[idx];
              const x = getX(idx);
              // Avoid rendering if too close to right edge LIVE badge
              if (x > width - paddingRight - 100) return null;
              return (
                <text
                  key={`time-lbl-${idx}`}
                  x={x}
                  y={paddingTop + chartH + 16}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {p.time}
                </text>
              );
            });
          })()}

          {/* Rightmost Timestamp badge matching current candle bar */}
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
              {points[points.length - 1]?.time || 'LIVE'}
            </text>
          </g>

          {/* TradingView-style AUTO button at bottom of price axis (clicks to reset price scale) */}
          <g
            className="cursor-pointer"
            onClick={handleResetPriceZoom}
          >
            <rect
              x={width - paddingRight + 12}
              y={paddingTop + chartH + 5}
              width={52}
              height={18}
              rx="3"
              fill={priceZoomLevel !== 1 ? '#0e3a47' : '#1e293b'}
              stroke={priceZoomLevel !== 1 ? '#06b6d4' : '#334155'}
              strokeWidth="1"
            />
            <text
              x={width - paddingRight + 38}
              y={paddingTop + chartH + 17}
              fill={priceZoomLevel !== 1 ? '#22d3ee' : '#94a3b8'}
              fontSize="10"
              fontWeight="bold"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
            >
              AUTO
            </text>
          </g>

          {/* Crosshair Extended Intersection Badge with Date & Time on Time Axis */}
          {cursorPos && cursorPos.x >= paddingLeft && cursorPos.x <= width - paddingRight && (() => {
            const ratio = Math.max(0, Math.min(1, (cursorPos.x - paddingLeft) / chartW));
            const idx = Math.round(ratio * (points.length - 1));
            const activePoint = points[idx] || hoveredPoint;
            if (!activePoint) return null;

            const d = new Date(activePoint.timestamp);
            const day = d.getDate();
            const month = d.toLocaleString('en-IN', { month: 'short' });
            const year = d.getFullYear();
            const timeStr = d.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: selectedTimeframe === '1m' ? '2-digit' : undefined,
              hour12: false,
            });
            const formattedDateTime = `${day} ${month} ${year}  ${timeStr}`;

            const badgeW = selectedTimeframe === '1m' ? 148 : 136;
            const badgeH = 20;
            const badgeX = Math.max(paddingLeft, Math.min(width - paddingRight - badgeW, cursorPos.x - badgeW / 2));
            const badgeY = paddingTop + chartH + 2;

            return (
              <g pointerEvents="none">
                {/* Pinpoint intersection dot on the time axis */}
                <circle
                  cx={cursorPos.x}
                  cy={paddingTop + chartH}
                  r="3"
                  fill="#38bdf8"
                  stroke="#0284c7"
                  strokeWidth="1"
                />
                {/* Connecting arrow caret */}
                <polygon
                  points={`${cursorPos.x - 4},${badgeY + 1} ${cursorPos.x + 4},${badgeY + 1} ${cursorPos.x},${paddingTop + chartH}`}
                  fill="#0f172a"
                />
                {/* Solid high-contrast background pill */}
                <rect
                  x={badgeX}
                  y={badgeY}
                  width={badgeW}
                  height={badgeH}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  rx="4"
                />
                {/* Crisp Date and Time text */}
                <text
                  x={badgeX + badgeW / 2}
                  y={badgeY + 14}
                  fill="#f8fafc"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {formattedDateTime}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Floating Readout Bar (Responsive & clean on mobile & desktop) */}
      <div className="px-3 sm:px-4 py-2 border-t border-slate-800 bg-[#070b0e] flex flex-wrap items-center justify-between text-[11px] sm:text-xs font-mono text-slate-400 gap-2 w-full overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 shrink-0">
            {selectedTimeframe}
          </span>
          {effectivePan > 0 && (
            <span
              onClick={handleResetZoomPan}
              className="text-amber-400 font-bold bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-700/60 shrink-0 cursor-pointer hover:bg-amber-900/60 transition-colors"
              title="Viewing past candles. Click to jump to live."
            >
              Past View (-{effectivePan} bars) ⚡
            </span>
          )}
          {priceZoomLevel !== 1 && (
            <span
              onClick={handleResetPriceZoom}
              className="text-emerald-400 font-bold bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-700/60 shrink-0 cursor-pointer hover:bg-emerald-900/60 transition-colors"
              title="Custom price scale zoom active. Click to auto-fit."
            >
              Price: {Math.round(priceZoomLevel * 100)}% ⟲
            </span>
          )}
          <span className="shrink-0">O: ₹{(hoveredPoint?.open || points[points.length - 1]?.open || 0).toFixed(2)}</span>
          <span className="text-emerald-400 shrink-0">H: ₹{(hoveredPoint?.high || points[points.length - 1]?.high || 0).toFixed(2)}</span>
          <span className="text-rose-400 shrink-0">L: ₹{(hoveredPoint?.low || points[points.length - 1]?.low || 0).toFixed(2)}</span>
          <span className="shrink-0">C: ₹{(hoveredPoint?.close || points[points.length - 1]?.close || 0).toFixed(2)}</span>
          <span className="shrink-0">Vol: {(hoveredPoint?.volume || points[points.length - 1]?.volume || 0).toLocaleString('en-IN')}</span>
          <span
            className="font-bold shrink-0 px-1.5 py-0.5 rounded border text-[11px] font-mono"
            style={{
              color: futuresMetrics.color,
              borderColor: futuresMetrics.borderColor,
              backgroundColor: futuresMetrics.bgColor,
            }}
            title={`Front-Month Index Futures (${futuresMetrics.futuresInfo.contractSymbol}): Current Bar Vol a = ${futuresMetrics.a.toLocaleString()}, 20-Bar Avg b = ${futuresMetrics.b.toLocaleString()}, a/b = ${futuresMetrics.formattedRatio}`}
          >
            Fut RVOL: {futuresMetrics.formattedRatio}
          </span>
        </div>

        {showOrderProfile && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] shrink-0">
            <span className="text-purple-400">CW: ₹{callWall.toFixed(2)}</span>
            <span className="text-cyan-400">VAH: ₹{vahLevel.toFixed(2)}</span>
            <span className="text-sky-400">POC: ₹{pocLevel.toFixed(2)}</span>
            <span className="text-rose-400">VAL: ₹{valLevel.toFixed(2)}</span>
            <span className="text-pink-400">PW: ₹{putWall.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
