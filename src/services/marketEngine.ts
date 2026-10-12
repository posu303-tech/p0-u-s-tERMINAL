/**
 * BharatPulse Real-Time Multi-Segment Market Engine (NSE · BSE · MCX)
 * Generates calibrated market ticks, option chains, depth books, macro trackers,
 * technical indicators, pattern detections, and alert evaluation.
 */

import {
  AlertCondition,
  AlertRule,
  AlertTriggerLog,
  CommodityData,
  EquityData,
  FinancialNewsItem,
  IndexData,
  Level2DepthRow,
  MacroIndicator,
  OptionChainData,
  OptionStrike,
  PricePoint,
  SentimentData,
  TechnicalIndicators,
} from '../types/market';

// Synthetic Sound Generator using Web Audio API
export function playAlertChime(type: 'bullish' | 'bearish' | 'alert' = 'alert'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (type === 'bullish') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    } else if (type === 'bearish') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
    } else {
      osc.frequency.setValueAtTime(740, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.12);
    }

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Audio context may be restricted by browser policy prior to user gesture
  }
}

// Generate realistic 30-day historical OHLCV + OI data points
function generateHistorical30D(basePrice: number, volatility: number = 0.015): PricePoint[] {
  const points: PricePoint[] = [];
  let currentPrice = basePrice * 0.94;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 30; i >= 0; i--) {
    const timestamp = now - i * dayMs;
    const dateStr = new Date(timestamp).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
    const changeFactor = 1 + (Math.random() - 0.49) * volatility * 2;
    const open = currentPrice;
    currentPrice = Math.round(open * changeFactor * 100) / 100;
    const high = Math.round(Math.max(open, currentPrice) * (1 + Math.random() * 0.01) * 100) / 100;
    const low = Math.round(Math.min(open, currentPrice) * (1 - Math.random() * 0.01) * 100) / 100;
    const close = currentPrice;
    const volume = Math.round(150000 + Math.random() * 450000);
    const oi = Math.round(800000 + Math.random() * 300000);

    points.push({
      time: dateStr,
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      oi,
    });
  }
  return points;
}

// Compute Technical Indicators from Price Points
function calculateTechnicals(points: PricePoint[], ltp: number): TechnicalIndicators {
  const closes = points.map((p) => p.close);
  if (closes.length === 0) {
    return {
      rsi14: 50,
      sma20: ltp,
      sma50: ltp,
      sma200: ltp,
      macd: 0,
      macdSignal: 0,
      macdHist: 0,
      bollingerUpper: ltp * 1.03,
      bollingerMiddle: ltp,
      bollingerLower: ltp * 0.97,
      atr14: ltp * 0.015,
      support1: ltp * 0.98,
      resistance1: ltp * 1.02,
    };
  }

  // RSI 14
  let gains = 0;
  let losses = 0;
  const period = Math.min(14, closes.length - 1);
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period || 1;
  const avgLoss = losses / period || 1;
  const rs = avgGain / (avgLoss || 0.0001);
  const rsi14 = Math.round((100 - 100 / (1 + rs)) * 10) / 10;

  // Simple Moving Averages
  const calcSMA = (n: number) => {
    const slice = closes.slice(-n);
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100;
  };
  const sma20 = calcSMA(Math.min(20, closes.length));
  const sma50 = calcSMA(Math.min(50, closes.length));
  const sma200 = calcSMA(Math.min(200, closes.length));

  // Bollinger Bands
  const stdDev =
    Math.sqrt(
      closes
        .slice(-20)
        .map((c) => Math.pow(c - sma20, 2))
        .reduce((a, b) => a + b, 0) / Math.min(20, closes.length)
    ) || ltp * 0.015;

  const bollingerUpper = Math.round((sma20 + 2 * stdDev) * 100) / 100;
  const bollingerLower = Math.round((sma20 - 2 * stdDev) * 100) / 100;

  // MACD
  const macd = Math.round((ltp - sma20) * 10) / 10;
  const macdSignal = Math.round(macd * 0.85 * 10) / 10;
  const macdHist = Math.round((macd - macdSignal) * 10) / 10;

  // Pattern detection logic
  let pattern: string | undefined;
  if (sma20 > sma50 && closes[closes.length - 2] <= sma50) {
    pattern = 'Golden Cross (SMA20 > SMA50)';
  } else if (rsi14 < 32) {
    pattern = 'Oversold Reversal (RSI < 32)';
  } else if (rsi14 > 72) {
    pattern = 'Overbought Squeeze (RSI > 72)';
  } else if (ltp > bollingerUpper) {
    pattern = 'Upper Band Breakout';
  } else if (ltp < bollingerLower) {
    pattern = 'Lower Band Bounce';
  } else if (Math.abs(ltp - sma20) / sma20 < 0.003) {
    pattern = 'Consolidation Base';
  }

  return {
    rsi14,
    sma20,
    sma50,
    sma200,
    macd,
    macdSignal,
    macdHist,
    bollingerUpper,
    bollingerMiddle: sma20,
    bollingerLower,
    atr14: Math.round(stdDev * 100) / 100,
    support1: Math.round(ltp * 0.985 * 100) / 100,
    resistance1: Math.round(ltp * 1.018 * 100) / 100,
    patternDetected: pattern,
  };
}

// Generate realistic 5-level Order Book Depth
function generateDepth(ltp: number): Level2DepthRow[] {
  const depth: Level2DepthRow[] = [];
  const tickSize = ltp > 1000 ? 0.25 : 0.05;

  for (let i = 1; i <= 5; i++) {
    const bidPrice = Math.round((ltp - i * tickSize) * 100) / 100;
    const askPrice = Math.round((ltp + i * tickSize) * 100) / 100;
    const bidQty = Math.round(150 + Math.random() * 850) * 25;
    const askQty = Math.round(150 + Math.random() * 850) * 25;
    const bidOrders = Math.round(5 + Math.random() * 35);
    const askOrders = Math.round(5 + Math.random() * 35);

    depth.push({
      bidOrders,
      bidQty,
      bidPrice,
      askPrice,
      askQty,
      askOrders,
    });
  }
  return depth;
}

// Initial Indian Indices (NSE, BSE, MCX)
export const INITIAL_INDICES: IndexData[] = [
  {
    symbol: 'NIFTY 50',
    name: 'NIFTY 50 Benchmark',
    segment: 'NSE',
    ltp: 25145.8,
    change: 112.4,
    changePercent: 0.45,
    high: 25210.0,
    low: 25060.2,
    open: 25080.0,
    prevClose: 25033.4,
    volume: 382400000,
    advances: 34,
    declines: 16,
    sparkline: [25033, 25070, 25095, 25060, 25110, 25135, 25145],
  },
  {
    symbol: 'BANKNIFTY',
    name: 'Nifty Bank Index',
    segment: 'NSE',
    ltp: 51840.5,
    change: 320.15,
    changePercent: 0.62,
    high: 51980.0,
    low: 51610.0,
    open: 51650.0,
    prevClose: 51520.35,
    volume: 184500000,
    advances: 9,
    declines: 3,
    sparkline: [51520, 51610, 51720, 51680, 51790, 51820, 51840],
  },
  {
    symbol: 'SENSEX',
    name: 'BSE SENSEX 30',
    segment: 'BSE',
    ltp: 81920.4,
    change: 365.8,
    changePercent: 0.45,
    high: 82110.0,
    low: 81680.0,
    open: 81710.0,
    prevClose: 81554.6,
    volume: 245000000,
    advances: 21,
    declines: 9,
    sparkline: [81554, 81690, 81780, 81720, 81860, 81900, 81920],
  },
  {
    symbol: 'NIFTY IT',
    name: 'Nifty IT Index',
    segment: 'NSE',
    ltp: 42150.2,
    change: -185.3,
    changePercent: -0.44,
    high: 42400.0,
    low: 42080.0,
    open: 42350.0,
    prevClose: 42335.5,
    volume: 82000000,
    advances: 3,
    declines: 7,
    sparkline: [42335, 42380, 42290, 42200, 42180, 42120, 42150],
  },
  {
    symbol: 'BSE 100',
    name: 'BSE 100 Broadcap',
    segment: 'BSE',
    ltp: 26310.75,
    change: 145.2,
    changePercent: 0.55,
    high: 26380.0,
    low: 26210.0,
    open: 26230.0,
    prevClose: 26165.55,
    volume: 310000000,
    advances: 68,
    declines: 32,
    sparkline: [26165, 26210, 26260, 26240, 26290, 26300, 26310],
  },
  {
    symbol: 'MCX iCOMDEX',
    name: 'MCX Composite Commodity Index',
    segment: 'MCX',
    ltp: 16420.3,
    change: 85.6,
    changePercent: 0.52,
    high: 16480.0,
    low: 16360.0,
    open: 16380.0,
    prevClose: 16334.7,
    volume: 98000000,
    advances: 12,
    declines: 4,
    sparkline: [16334, 16360, 16390, 16380, 16410, 16430, 16420],
  },
];

// Initial Liquid Equities
export const INITIAL_EQUITIES: EquityData[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    exchange: 'NSE',
    sector: 'Energy & Petrochemicals',
    ltp: 2985.4,
    change: 22.8,
    changePercent: 0.77,
    open: 2970.0,
    high: 2998.0,
    low: 2962.5,
    prevClose: 2962.6,
    volume: 4850000,
    vwap: 2981.2,
    marketCapCrores: 2021000,
    peRatio: 28.4,
    week52High: 3217.9,
    week52Low: 2221.0,
    openInterest: 32800000,
    oiChangePercent: 4.2,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 16.8,
    impliedVolatility: 17.4,
    depth: generateDepth(2985.4),
    historical30d: generateHistorical30D(2985.4),
    technicals: calculateTechnicals(generateHistorical30D(2985.4), 2985.4),
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd.',
    exchange: 'NSE',
    sector: 'Information Technology',
    ltp: 4180.25,
    change: -18.75,
    changePercent: -0.45,
    open: 4210.0,
    high: 4225.0,
    low: 4165.0,
    prevClose: 4199.0,
    volume: 1820000,
    vwap: 4188.4,
    marketCapCrores: 1512000,
    peRatio: 31.2,
    week52High: 4592.25,
    week52Low: 3312.0,
    openInterest: 14200000,
    oiChangePercent: -1.8,
    oiBuildup: 'Long Unwinding',
    historicalVolatility30d: 14.2,
    impliedVolatility: 15.1,
    depth: generateDepth(4180.25),
    historical30d: generateHistorical30D(4180.25),
    technicals: calculateTechnicals(generateHistorical30D(4180.25), 4180.25),
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    exchange: 'NSE',
    sector: 'Banking & Financials',
    ltp: 1682.9,
    change: 14.5,
    changePercent: 0.87,
    open: 1672.0,
    high: 1690.0,
    low: 1668.0,
    prevClose: 1668.4,
    volume: 12400000,
    vwap: 1680.1,
    marketCapCrores: 1280000,
    peRatio: 19.8,
    week52High: 1794.0,
    week52Low: 1363.5,
    openInterest: 48900000,
    oiChangePercent: 5.6,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 17.5,
    impliedVolatility: 18.2,
    depth: generateDepth(1682.9),
    historical30d: generateHistorical30D(1682.9),
    technicals: calculateTechnicals(generateHistorical30D(1682.9), 1682.9),
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    exchange: 'NSE',
    sector: 'Information Technology',
    ltp: 1892.4,
    change: -12.1,
    changePercent: -0.64,
    open: 1910.0,
    high: 1915.0,
    low: 1885.0,
    prevClose: 1904.5,
    volume: 5100000,
    vwap: 1896.3,
    marketCapCrores: 785000,
    peRatio: 29.5,
    week52High: 1991.45,
    week52Low: 1358.35,
    openInterest: 26500000,
    oiChangePercent: 2.1,
    oiBuildup: 'Short Buildup',
    historicalVolatility30d: 18.9,
    impliedVolatility: 19.8,
    depth: generateDepth(1892.4),
    historical30d: generateHistorical30D(1892.4),
    technicals: calculateTechnicals(generateHistorical30D(1892.4), 1892.4),
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd.',
    exchange: 'NSE',
    sector: 'Banking & Financials',
    ltp: 1248.6,
    change: 11.2,
    changePercent: 0.91,
    open: 1240.0,
    high: 1254.0,
    low: 1238.0,
    prevClose: 1237.4,
    volume: 8900000,
    vwap: 1246.8,
    marketCapCrores: 878000,
    peRatio: 18.2,
    week52High: 1300.0,
    week52Low: 913.0,
    openInterest: 31200000,
    oiChangePercent: 3.8,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 15.6,
    impliedVolatility: 16.5,
    depth: generateDepth(1248.6),
    historical30d: generateHistorical30D(1248.6),
    technicals: calculateTechnicals(generateHistorical30D(1248.6), 1248.6),
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd.',
    exchange: 'NSE',
    sector: 'Automobile',
    ltp: 964.15,
    change: 18.4,
    changePercent: 1.95,
    open: 948.0,
    high: 970.0,
    low: 945.0,
    prevClose: 945.75,
    volume: 14200000,
    vwap: 961.0,
    marketCapCrores: 355000,
    peRatio: 11.4,
    week52High: 1179.0,
    week52Low: 615.0,
    openInterest: 42100000,
    oiChangePercent: 7.4,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 26.4,
    impliedVolatility: 28.1,
    depth: generateDepth(964.15),
    historical30d: generateHistorical30D(964.15),
    technicals: calculateTechnicals(generateHistorical30D(964.15), 964.15),
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    exchange: 'BSE',
    sector: 'Public Sector Banking',
    ltp: 815.3,
    change: 6.8,
    changePercent: 0.84,
    open: 810.0,
    high: 819.5,
    low: 808.0,
    prevClose: 808.5,
    volume: 16500000,
    vwap: 814.2,
    marketCapCrores: 727000,
    peRatio: 10.9,
    week52High: 912.0,
    week52Low: 555.25,
    openInterest: 55400000,
    oiChangePercent: 2.9,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 21.0,
    impliedVolatility: 22.3,
    depth: generateDepth(815.3),
    historical30d: generateHistorical30D(815.3),
    technicals: calculateTechnicals(generateHistorical30D(815.3), 815.3),
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd.',
    exchange: 'NSE',
    sector: 'Telecommunications',
    ltp: 1680.5,
    change: -4.2,
    changePercent: -0.25,
    open: 1690.0,
    high: 1698.0,
    low: 1675.0,
    prevClose: 1684.7,
    volume: 3400000,
    vwap: 1682.1,
    marketCapCrores: 994000,
    peRatio: 62.4,
    week52High: 1779.0,
    week52Low: 912.0,
    openInterest: 19800000,
    oiChangePercent: -0.8,
    oiBuildup: 'Short Covering',
    historicalVolatility30d: 19.2,
    impliedVolatility: 20.1,
    depth: generateDepth(1680.5),
    historical30d: generateHistorical30D(1680.5),
    technicals: calculateTechnicals(generateHistorical30D(1680.5), 1680.5),
  },
  {
    symbol: 'LT',
    name: 'Larsen & Toubro Ltd.',
    exchange: 'BSE',
    sector: 'Capital Goods & Infrastructure',
    ltp: 3620.0,
    change: 38.5,
    changePercent: 1.08,
    open: 3590.0,
    high: 3635.0,
    low: 3585.0,
    prevClose: 3581.5,
    volume: 2100000,
    vwap: 3612.4,
    marketCapCrores: 498000,
    peRatio: 37.1,
    week52High: 3919.9,
    week52Low: 2862.0,
    openInterest: 11200000,
    oiChangePercent: 4.1,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 18.0,
    impliedVolatility: 19.0,
    depth: generateDepth(3620.0),
    historical30d: generateHistorical30D(3620.0),
    technicals: calculateTechnicals(generateHistorical30D(3620.0), 3620.0),
  },
];

// Generate Option Chain around ATM Strike
export function generateOptionChain(
  underlyingLTP: number,
  symbol: string = 'NIFTY',
  expiryDate: string = '31-OCT-2026 (Monthly Expiry)'
): OptionChainData {
  let strikeInterval = 50;
  if (symbol === 'BANKNIFTY') strikeInterval = 100;
  else if (symbol === 'MIDCPNIFTY' || symbol === 'TATAMOTORS' || symbol === 'SBIN') strikeInterval = 10;
  else if (symbol === 'HDFCBANK' || symbol === 'INFY' || symbol === 'ICICIBANK') strikeInterval = 20;
  else if (underlyingLTP > 10000) strikeInterval = 50;
  else if (underlyingLTP > 2000) strikeInterval = 20;
  else if (underlyingLTP > 500) strikeInterval = 10;
  else strikeInterval = 5;

  const atmStrike = Math.round(underlyingLTP / strikeInterval) * strikeInterval;
  const strikesCount = 15;
  const strikes: OptionStrike[] = [];

  let totalCallOI = 0;
  let totalPutOI = 0;
  let totalCallVol = 0;
  let totalPutVol = 0;

  for (let i = -Math.floor(strikesCount / 2); i <= Math.floor(strikesCount / 2); i++) {
    const strike = atmStrike + i * strikeInterval;
    const moneyness = strike - underlyingLTP;

    // Call stats
    const callIntrinsic = Math.max(0, underlyingLTP - strike);
    const callTimeValue = Math.max(12, 180 - Math.abs(moneyness) * 0.45);
    const callLTP = Math.round((callIntrinsic + callTimeValue) * 10) / 10;
    const callNetChange = Math.round((callIntrinsic > 0 ? 8.5 : -4.2) + (Math.random() - 0.45) * 5);
    const callOI = Math.round(Math.max(10000, (85000 - Math.abs(moneyness) * 45) * (strike >= atmStrike ? 1.6 : 0.7)));
    const callChangeOI = Math.round((Math.random() - 0.4) * 15000);
    const callIV = Math.round((12.5 + Math.abs(moneyness) * 0.005 + (Math.random() - 0.5) * 0.4) * 10) / 10;
    const callVolume = Math.round(callOI * 1.8);

    // Put stats
    const putIntrinsic = Math.max(0, strike - underlyingLTP);
    const putTimeValue = Math.max(12, 180 - Math.abs(moneyness) * 0.45);
    const putLTP = Math.round((putIntrinsic + putTimeValue) * 10) / 10;
    const putNetChange = Math.round((putIntrinsic > 0 ? 9.2 : -5.1) + (Math.random() - 0.45) * 5);
    const putOI = Math.round(Math.max(10000, (85000 - Math.abs(moneyness) * 45) * (strike <= atmStrike ? 1.7 : 0.65)));
    const putChangeOI = Math.round((Math.random() - 0.35) * 16000);
    const putIV = Math.round((13.1 + Math.abs(moneyness) * 0.005 + (Math.random() - 0.5) * 0.4) * 10) / 10;
    const putVolume = Math.round(putOI * 1.9);

    totalCallOI += callOI;
    totalPutOI += putOI;
    totalCallVol += callVolume;
    totalPutVol += putVolume;

    strikes.push({
      strikePrice: strike,
      callOI,
      callChangeOI,
      callIV,
      callLTP,
      callNetChange,
      callVolume,
      putOI,
      putChangeOI,
      putIV,
      putLTP,
      putNetChange,
      putVolume,
    });
  }

  const pcr = Math.round((totalPutOI / (totalCallOI || 1)) * 100) / 100;
  // Calculate Max Pain: strike where option writers lose the least
  let minLoss = Infinity;
  let maxPainStrike = atmStrike;
  strikes.forEach((testStrike) => {
    let loss = 0;
    strikes.forEach((s) => {
      // Call buyers profit if testStrike > s.strikePrice
      if (testStrike.strikePrice > s.strikePrice) {
        loss += (testStrike.strikePrice - s.strikePrice) * s.callOI;
      }
      // Put buyers profit if testStrike < s.strikePrice
      if (testStrike.strikePrice < s.strikePrice) {
        loss += (s.strikePrice - testStrike.strikePrice) * s.putOI;
      }
    });
    if (loss < minLoss) {
      minLoss = loss;
      maxPainStrike = testStrike.strikePrice;
    }
  });

  return {
    underlyingSymbol: symbol,
    underlyingLTP,
    expiryDate,
    expiries: [
      '24-OCT-2026 (Weekly Expiry)',
      '31-OCT-2026 (Monthly Expiry)',
      '07-NOV-2026 (Weekly Expiry)',
      '14-NOV-2026 (Weekly Expiry)',
      '28-NOV-2026 (Monthly Expiry)',
      '26-DEC-2026 (Quarterly Expiry)',
    ],
    totalCallOI,
    totalPutOI,
    totalCallVolume: totalCallVol,
    totalPutVolume: totalPutVol,
    pcr,
    maxPain: maxPainStrike,
    atmIV: 12.8,
    strikes,
  };
}

// Initial MCX Commodities Data
export const INITIAL_COMMODITIES: CommodityData[] = [
  {
    symbol: 'GOLD_MCX',
    name: 'Gold Mini (100g)',
    category: 'Bullion',
    ltp: 76480,
    change: 410,
    changePercent: 0.54,
    high: 76650,
    low: 76120,
    open: 76180,
    prevClose: 76070,
    lotSize: 100,
    unit: '10 grams',
    expiry: '05-DEC-2026',
    volume: 18240,
    openInterest: 14500,
    oiChangePercent: 3.2,
    settlementPrice: 76070,
    globalBenchmarkPrice: 'COMEX Gold $2,668.50/oz (+0.42%)',
    historical30d: generateHistorical30D(76480, 0.008),
  },
  {
    symbol: 'SILVER_MCX',
    name: 'Silver 30kg Contract',
    category: 'Bullion',
    ltp: 91850,
    change: 720,
    changePercent: 0.79,
    high: 92300,
    low: 91200,
    open: 91400,
    prevClose: 91130,
    lotSize: 30,
    unit: '1 kg',
    expiry: '05-DEC-2026',
    volume: 34100,
    openInterest: 22100,
    oiChangePercent: 4.8,
    settlementPrice: 91130,
    globalBenchmarkPrice: 'COMEX Silver $31.84/oz (+0.75%)',
    historical30d: generateHistorical30D(91850, 0.015),
  },
  {
    symbol: 'CRUDEOIL_MCX',
    name: 'Crude Oil 100 BBL',
    category: 'Energy',
    ltp: 6140,
    change: -65,
    changePercent: -1.05,
    high: 6230,
    low: 6110,
    open: 6215,
    prevClose: 6205,
    lotSize: 100,
    unit: '1 Barrel',
    expiry: '19-NOV-2026',
    volume: 89400,
    openInterest: 18900,
    oiChangePercent: -2.1,
    settlementPrice: 6205,
    globalBenchmarkPrice: 'WTI Crude $73.40/bbl (-1.10%)',
    historical30d: generateHistorical30D(6140, 0.022),
  },
  {
    symbol: 'NATGAS_MCX',
    name: 'Natural Gas 1250 MMBTU',
    category: 'Energy',
    ltp: 218.4,
    change: 4.8,
    changePercent: 2.25,
    high: 221.0,
    low: 212.5,
    open: 214.0,
    prevClose: 213.6,
    lotSize: 1250,
    unit: '1 MMBTU',
    expiry: '25-NOV-2026',
    volume: 64200,
    openInterest: 31200,
    oiChangePercent: 6.4,
    settlementPrice: 213.6,
    globalBenchmarkPrice: 'Henry Hub $2.61/MMBtu (+2.35%)',
    historical30d: generateHistorical30D(218.4, 0.035),
  },
  {
    symbol: 'COPPER_MCX',
    name: 'Copper 2.5 MT',
    category: 'Metals',
    ltp: 842.1,
    change: 6.3,
    changePercent: 0.75,
    high: 846.5,
    low: 837.0,
    open: 838.0,
    prevClose: 835.8,
    lotSize: 2500,
    unit: '1 kg',
    expiry: '30-NOV-2026',
    volume: 12800,
    openInterest: 8400,
    oiChangePercent: 1.8,
    settlementPrice: 835.8,
    globalBenchmarkPrice: 'LME Copper $9,810/MT (+0.70%)',
    historical30d: generateHistorical30D(842.1, 0.012),
  },
];

// Macroeconomic Indicators
export const INITIAL_MACRO: MacroIndicator[] = [
  {
    id: 'repo-rate',
    name: 'RBI Policy Repo Rate',
    category: 'Monetary',
    value: '6.50%',
    numericValue: 6.5,
    unit: '%',
    change: '0.00 bps (Held)',
    trend: 'flat',
    impactLevel: 'High',
    lastUpdated: 'Oct 2026 MPC Meet',
    commentary: 'MPC maintained status quo to ensure durable alignment of CPI inflation with 4.0% target while supporting domestic consumption.',
  },
  {
    id: 'cpi-inflation',
    name: 'India CPI Inflation',
    category: 'Inflation',
    value: '3.65%',
    numericValue: 3.65,
    unit: '% YoY',
    change: '-0.15% MoM',
    trend: 'down',
    impactLevel: 'High',
    lastUpdated: 'Latest Release',
    commentary: 'Favorable kharif harvest and food disinflation tempered headline index well within the RBI tolerance band (2%-6%).',
  },
  {
    id: 'gdp-growth',
    name: 'Real GDP Growth Rate',
    category: 'Growth',
    value: '6.80%',
    numericValue: 6.8,
    unit: '% YoY',
    change: '+0.10%',
    trend: 'up',
    impactLevel: 'High',
    lastUpdated: 'Q2 2026 Estimates',
    commentary: 'Capital expenditure expansion by Union government and rural demand recovery drive sustained industrial momentum.',
  },
  {
    id: 'in-10y-yield',
    name: 'India 10-Year G-Sec Yield',
    category: 'Monetary',
    value: '6.78%',
    numericValue: 6.78,
    unit: '%',
    change: '-4.2 bps',
    trend: 'down',
    impactLevel: 'Medium',
    lastUpdated: 'Live Market',
    commentary: 'Global bond index inclusion inflows and sovereign debt fiscal consolidation keep benchmark yields anchored below 6.85%.',
  },
  {
    id: 'usdinr',
    name: 'USD / INR Exchange Rate',
    category: 'Currency',
    value: '83.94',
    numericValue: 83.94,
    unit: '₹ per $',
    change: '+0.04 ₹',
    trend: 'up',
    impactLevel: 'Medium',
    lastUpdated: 'Live Forex',
    commentary: 'RBI active liquidity interventions in onshore forwards contain rupee volatility amidst US Dollar index resilience.',
  },
  {
    id: 'brent-crude',
    name: 'Brent Crude Oil Benchmark',
    category: 'Commodity',
    value: '$78.40',
    numericValue: 78.4,
    unit: 'USD/bbl',
    change: '-$0.85',
    trend: 'down',
    impactLevel: 'High',
    lastUpdated: 'Global ICE',
    commentary: 'Softening global demand indicators offset geopolitical risk premiums; net positive for Indian current account deficit.',
  },
];

// Initial News Feed with Sentiment
export const INITIAL_NEWS: FinancialNewsItem[] = [
  {
    id: 'news-1',
    time: '14:22 IST',
    headline: 'RBI Governor signals sustained financial stability with comfortable banking system liquidity buffer',
    source: 'Press Trust of India',
    sentiment: 'bullish',
    score: 0.75,
    affectedSegments: ['NSE', 'BANKNIFTY'],
    summary: 'Monetary policy stance remains focused on withdrawal of accommodation while providing ample sectoral credit to manufacturing.',
  },
  {
    id: 'news-2',
    time: '13:48 IST',
    headline: 'FIIs turn net buyers of ₹1,240 Crore in cash segment; DIIs inject ₹2,150 Crore across heavyweights',
    source: 'Exchange Clearing Data',
    sentiment: 'bullish',
    score: 0.88,
    affectedSegments: ['NIFTY 50', 'SENSEX'],
    summary: 'Institutional appetite reflects robust domestic corporate earnings projections and resilient mutual fund SIP book inflows.',
  },
  {
    id: 'news-3',
    time: '13:10 IST',
    headline: 'Global crude softening eases import bill concerns for Indian oil marketing and paint companies',
    source: 'Reuters Financial',
    sentiment: 'bullish',
    score: 0.62,
    affectedSegments: ['MCX', 'RELIANCE'],
    summary: 'WTI & Brent slip 1.1% on elevated US inventory builds, providing margin headroom for domestic downstream refiners.',
  },
  {
    id: 'news-4',
    time: '12:15 IST',
    headline: 'IT sector faces cautious client discretionary budget allocations heading into upcoming quarter',
    source: 'Bloomberg India',
    sentiment: 'bearish',
    score: -0.45,
    affectedSegments: ['NIFTY IT', 'TCS', 'INFY'],
    summary: 'Tier-1 IT players report extended deal decision cycles for non-essential digital transformation initiatives.',
  },
  {
    id: 'news-5',
    time: '11:05 IST',
    headline: 'Automobile passenger vehicle dispatches show 9.2% growth driven by premium SUV demand',
    source: 'SIAM Flash Data',
    sentiment: 'bullish',
    score: 0.7,
    affectedSegments: ['TATAMOTORS', 'NSE'],
    summary: 'Tata Motors and Mahindra report robust booking backlogs and expanding EV adoption metrics.',
  },
];

// Initial Sentiment Overview
export const INITIAL_SENTIMENT: SentimentData = {
  fearGreedIndex: 68,
  fearGreedLabel: 'Greed',
  fiiNetCrores: 1240.5,
  diiNetCrores: 2150.8,
  advanceDeclineRatio: 1.65,
  indiaVix: 13.45,
  indiaVixChange: -0.35,
  socialSentimentScore: 72,
  newsHeadlines: INITIAL_NEWS,
};

// Check alert triggers against latest asset state
export function evaluateAlertRules(
  alerts: AlertRule[],
  equities: EquityData[],
  indices: IndexData[],
  commodities: CommodityData[]
): { updatedAlerts: AlertRule[]; newTriggers: AlertTriggerLog[] } {
  const newTriggers: AlertTriggerLog[] = [];
  const updatedAlerts = alerts.map((alert) => {
    if (!alert.isActive) return alert;

    // Find target asset
    let currentLtp = 0;
    let rsi = 50;
    let sma20 = 0;
    let sma50 = 0;
    let bollingerUpper = 0;
    let pattern = '';

    const eq = equities.find((e) => e.symbol === alert.symbol);
    const idx = indices.find((i) => i.symbol === alert.symbol);
    const cmd = commodities.find((c) => c.symbol === alert.symbol);

    if (eq) {
      currentLtp = eq.ltp;
      rsi = eq.technicals.rsi14;
      sma20 = eq.technicals.sma20;
      sma50 = eq.technicals.sma50;
      bollingerUpper = eq.technicals.bollingerUpper;
      pattern = eq.technicals.patternDetected || '';
    } else if (idx) {
      currentLtp = idx.ltp;
    } else if (cmd) {
      currentLtp = cmd.ltp;
    } else {
      return alert;
    }

    let shouldTrigger = false;
    let triggerMsg = '';

    switch (alert.condition) {
      case 'PRICE_ABOVE':
        if (currentLtp >= alert.threshold) {
          shouldTrigger = true;
          triggerMsg = `${alert.symbol} surged above threshold of ₹${alert.threshold.toLocaleString('en-IN')} (LTP: ₹${currentLtp.toLocaleString('en-IN')})`;
        }
        break;
      case 'PRICE_BELOW':
        if (currentLtp <= alert.threshold) {
          shouldTrigger = true;
          triggerMsg = `${alert.symbol} fell below threshold of ₹${alert.threshold.toLocaleString('en-IN')} (LTP: ₹${currentLtp.toLocaleString('en-IN')})`;
        }
        break;
      case 'RSI_OVERSOLD':
        if (rsi <= alert.threshold) {
          shouldTrigger = true;
          triggerMsg = `${alert.symbol} RSI(14) hit oversold level ${rsi} (Threshold: <= ${alert.threshold})`;
        }
        break;
      case 'RSI_OVERBOUGHT':
        if (rsi >= alert.threshold) {
          shouldTrigger = true;
          triggerMsg = `${alert.symbol} RSI(14) reached overbought level ${rsi} (Threshold: >= ${alert.threshold})`;
        }
        break;
      case 'MA_GOLDEN_CROSS':
        if (sma20 > sma50) {
          shouldTrigger = true;
          triggerMsg = `${alert.symbol} formed Golden Cross: SMA20 (${sma20}) > SMA50 (${sma50})`;
        }
        break;
      case 'BOLLINGER_BREAKOUT':
        if (currentLtp >= bollingerUpper) {
          shouldTrigger = true;
          triggerMsg = `${alert.symbol} pierced Upper Bollinger Band at ₹${bollingerUpper.toLocaleString('en-IN')}`;
        }
        break;
      case 'DOUBLE_BOTTOM':
        if (pattern.includes('Double Bottom') || pattern.includes('Oversold')) {
          shouldTrigger = true;
          triggerMsg = `${alert.symbol} confirmed Bullish Reversal / Double Bottom pattern`;
        }
        break;
      default:
        break;
    }

    if (shouldTrigger) {
      // Prevent rapid repeated triggers within 60 seconds
      const now = Date.now();
      if (!alert.lastTriggeredAt || now - alert.lastTriggeredAt > 60000) {
        if (alert.soundEnabled) {
          playAlertChime('alert');
        }
        newTriggers.push({
          id: `trig-${now}-${Math.random().toString(36).substring(2, 6)}`,
          alertId: alert.id,
          symbol: alert.symbol,
          condition: alert.condition,
          message: triggerMsg,
          threshold: alert.threshold,
          triggeredPrice: currentLtp,
          timestamp: now,
          read: false,
        });

        return {
          ...alert,
          lastTriggeredAt: now,
          triggerCount: (alert.triggerCount || 0) + 1,
        };
      }
    }

    return alert;
  });

  return { updatedAlerts, newTriggers };
}
