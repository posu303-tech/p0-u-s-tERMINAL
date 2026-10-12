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
    ltp: 22363.35,
    change: -157.1,
    changePercent: -0.7,
    high: 22651.1,
    low: 22304.45,
    open: 22593.2,
    prevClose: 22520.45,
    volume: 382400000,
    advances: 18,
    declines: 32,
    sparkline: [22520, 22570, 22590, 22510, 22440, 22380, 22363.35],
  },
  {
    symbol: 'BANKNIFTY',
    name: 'Nifty Bank Index',
    segment: 'NSE',
    ltp: 55256.65,
    change: 741.6,
    changePercent: 1.36,
    high: 55419.3,
    low: 54709.05,
    open: 54850.0,
    prevClose: 54515.05,
    volume: 184500000,
    advances: 10,
    declines: 2,
    sparkline: [54515, 54710, 54920, 55080, 55190, 55220, 55256.65],
  },
  {
    symbol: 'SENSEX',
    name: 'BSE SENSEX 30',
    segment: 'BSE',
    ltp: 71924.68,
    change: -547.65,
    changePercent: -0.76,
    high: 72884.25,
    low: 71676.1,
    open: 72650.0,
    prevClose: 72472.33,
    volume: 245000000,
    advances: 11,
    declines: 19,
    sparkline: [72472, 72580, 72420, 72150, 72030, 71950, 71924.68],
  },
  {
    symbol: 'NIFTY IT',
    name: 'Nifty IT Index',
    segment: 'NSE',
    ltp: 28574.9,
    change: 838.2,
    changePercent: 3.02,
    high: 28776.75,
    low: 27901.85,
    open: 27905.85,
    prevClose: 27736.7,
    volume: 82000000,
    advances: 8,
    declines: 2,
    sparkline: [27736, 27920, 28150, 28380, 28520, 28590, 28574.9],
  },
  {
    symbol: 'BSE 100',
    name: 'BSE 100 Broadcap',
    segment: 'BSE',
    ltp: 24076.68,
    change: 283.54,
    changePercent: 1.19,
    high: 24150.0,
    low: 23890.0,
    open: 23910.0,
    prevClose: 23793.14,
    volume: 310000000,
    advances: 58,
    declines: 42,
    sparkline: [23793, 23880, 23950, 24010, 24050, 24065, 24076.68],
  },
  {
    symbol: 'MCX iCOMDEX',
    name: 'MCX Composite Commodity Index',
    segment: 'MCX',
    ltp: 21850.4,
    change: 142.6,
    changePercent: 0.66,
    high: 21920.0,
    low: 21740.0,
    open: 21760.0,
    prevClose: 21707.8,
    volume: 98000000,
    advances: 11,
    declines: 5,
    sparkline: [21707, 21740, 21790, 21820, 21840, 21845, 21850.4],
  },
];

// Initial Liquid Equities
export const INITIAL_EQUITIES: EquityData[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    exchange: 'NSE',
    sector: 'Energy & Petrochemicals',
    ltp: 1157.3,
    change: 12.5,
    changePercent: 1.09,
    open: 1148.0,
    high: 1165.4,
    low: 1142.0,
    prevClose: 1144.8,
    volume: 14850000,
    vwap: 1154.2,
    marketCapCrores: 1980000,
    peRatio: 26.2,
    week52High: 1608.9,
    week52Low: 1110.5,
    openInterest: 64800000,
    oiChangePercent: 3.8,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 16.8,
    impliedVolatility: 17.4,
    depth: generateDepth(1157.3),
    historical30d: generateHistorical30D(1157.3),
    technicals: calculateTechnicals(generateHistorical30D(1157.3), 1157.3),
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd.',
    exchange: 'NSE',
    sector: 'Information Technology',
    ltp: 2142.6,
    change: 48.2,
    changePercent: 2.3,
    open: 2102.0,
    high: 2165.0,
    low: 2095.0,
    prevClose: 2094.4,
    volume: 4820000,
    vwap: 2138.4,
    marketCapCrores: 1480000,
    peRatio: 28.6,
    week52High: 2390.0,
    week52Low: 1680.0,
    openInterest: 28400000,
    oiChangePercent: 4.5,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 14.2,
    impliedVolatility: 15.1,
    depth: generateDepth(2142.6),
    historical30d: generateHistorical30D(2142.6),
    technicals: calculateTechnicals(generateHistorical30D(2142.6), 2142.6),
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    exchange: 'NSE',
    sector: 'Banking & Financials',
    ltp: 704.25,
    change: 6.8,
    changePercent: 0.98,
    open: 698.0,
    high: 708.5,
    low: 695.2,
    prevClose: 697.45,
    volume: 24600000,
    vwap: 702.8,
    marketCapCrores: 1340000,
    peRatio: 18.4,
    week52High: 897.0,
    week52Low: 681.5,
    openInterest: 82400000,
    oiChangePercent: 3.2,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 17.5,
    impliedVolatility: 18.2,
    depth: generateDepth(704.25),
    historical30d: generateHistorical30D(704.25),
    technicals: calculateTechnicals(generateHistorical30D(704.25), 704.25),
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    exchange: 'NSE',
    sector: 'Information Technology',
    ltp: 1021.8,
    change: 14.6,
    changePercent: 1.45,
    open: 1010.0,
    high: 1028.0,
    low: 1004.5,
    prevClose: 1007.2,
    volume: 12400000,
    vwap: 1018.5,
    marketCapCrores: 815000,
    peRatio: 26.8,
    week52High: 1180.0,
    week52Low: 940.0,
    openInterest: 52100000,
    oiChangePercent: 2.8,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 18.9,
    impliedVolatility: 19.8,
    depth: generateDepth(1021.8),
    historical30d: generateHistorical30D(1021.8),
    technicals: calculateTechnicals(generateHistorical30D(1021.8), 1021.8),
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd.',
    exchange: 'NSE',
    sector: 'Banking & Financials',
    ltp: 1340.6,
    change: 12.4,
    changePercent: 0.93,
    open: 1332.0,
    high: 1348.0,
    low: 1326.0,
    prevClose: 1328.2,
    volume: 9800000,
    vwap: 1338.2,
    marketCapCrores: 945000,
    peRatio: 17.8,
    week52High: 1385.0,
    week52Low: 913.0,
    openInterest: 38400000,
    oiChangePercent: 2.4,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 15.6,
    impliedVolatility: 16.5,
    depth: generateDepth(1340.6),
    historical30d: generateHistorical30D(1340.6),
    technicals: calculateTechnicals(generateHistorical30D(1340.6), 1340.6),
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd.',
    exchange: 'NSE',
    sector: 'Automobile',
    ltp: 409.3,
    change: 5.4,
    changePercent: 1.34,
    open: 404.0,
    high: 412.5,
    low: 401.0,
    prevClose: 403.9,
    volume: 18900000,
    vwap: 408.0,
    marketCapCrores: 285000,
    peRatio: 12.8,
    week52High: 508.95,
    week52Low: 306.0,
    openInterest: 46200000,
    oiChangePercent: 3.9,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 24.8,
    impliedVolatility: 26.2,
    depth: generateDepth(409.3),
    historical30d: generateHistorical30D(409.3),
    technicals: calculateTechnicals(generateHistorical30D(409.3), 409.3),
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    exchange: 'BSE',
    sector: 'Public Sector Banking',
    ltp: 959.1,
    change: 19.1,
    changePercent: 2.03,
    open: 945.0,
    high: 964.5,
    low: 940.0,
    prevClose: 940.0,
    volume: 18400000,
    vwap: 954.8,
    marketCapCrores: 875000,
    peRatio: 11.2,
    week52High: 1234.7,
    week52Low: 857.25,
    openInterest: 58900000,
    oiChangePercent: 4.1,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 21.0,
    impliedVolatility: 22.3,
    depth: generateDepth(959.1),
    historical30d: generateHistorical30D(959.1),
    technicals: calculateTechnicals(generateHistorical30D(959.1), 959.1),
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd.',
    exchange: 'NSE',
    sector: 'Telecommunications',
    ltp: 1765.75,
    change: -12.4,
    changePercent: -0.7,
    open: 1782.0,
    high: 1790.0,
    low: 1758.0,
    prevClose: 1778.15,
    volume: 4800000,
    vwap: 1770.2,
    marketCapCrores: 1101000,
    peRatio: 58.4,
    week52High: 2174.5,
    week52Low: 1726.3,
    openInterest: 24500000,
    oiChangePercent: -1.2,
    oiBuildup: 'Long Unwinding',
    historicalVolatility30d: 19.2,
    impliedVolatility: 20.1,
    depth: generateDepth(1765.75),
    historical30d: generateHistorical30D(1765.75),
    technicals: calculateTechnicals(generateHistorical30D(1765.75), 1765.75),
  },
  {
    symbol: 'LT',
    name: 'Larsen & Toubro Ltd.',
    exchange: 'BSE',
    sector: 'Capital Goods & Infrastructure',
    ltp: 3636.1,
    change: 28.5,
    changePercent: 0.79,
    open: 3615.0,
    high: 3652.0,
    low: 3602.0,
    prevClose: 3607.6,
    volume: 2400000,
    vwap: 3629.4,
    marketCapCrores: 504000,
    peRatio: 36.4,
    week52High: 4440.0,
    week52Low: 3288.1,
    openInterest: 12800000,
    oiChangePercent: 2.5,
    oiBuildup: 'Long Buildup',
    historicalVolatility30d: 18.0,
    impliedVolatility: 19.0,
    depth: generateDepth(3636.1),
    historical30d: generateHistorical30D(3636.1),
    technicals: calculateTechnicals(generateHistorical30D(3636.1), 3636.1),
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
    ltp: 149930,
    change: -620,
    changePercent: -0.41,
    high: 150889,
    low: 149600,
    open: 150889,
    prevClose: 150550,
    lotSize: 100,
    unit: '10 grams',
    expiry: '05-DEC-2026',
    volume: 24240,
    openInterest: 18500,
    oiChangePercent: 3.2,
    settlementPrice: 150550,
    globalBenchmarkPrice: 'COMEX Gold $2,668.50/oz (+0.42%)',
    historical30d: generateHistorical30D(149930, 0.008),
  },
  {
    symbol: 'SILVER_MCX',
    name: 'Silver 30kg Contract',
    category: 'Bullion',
    ltp: 223789,
    change: -1761,
    changePercent: -0.78,
    high: 226100,
    low: 222800,
    open: 225550,
    prevClose: 225550,
    lotSize: 30,
    unit: '1 kg',
    expiry: '05-DEC-2026',
    volume: 42100,
    openInterest: 28400,
    oiChangePercent: 4.8,
    settlementPrice: 225550,
    globalBenchmarkPrice: 'COMEX Silver $31.84/oz (+0.75%)',
    historical30d: generateHistorical30D(223789, 0.015),
  },
  {
    symbol: 'CRUDEOIL_MCX',
    name: 'Crude Oil 100 BBL',
    category: 'Energy',
    ltp: 8685,
    change: -145,
    changePercent: -1.64,
    high: 8890,
    low: 8620,
    open: 8810,
    prevClose: 8830,
    lotSize: 100,
    unit: '1 Barrel',
    expiry: '19-NOV-2026',
    volume: 112400,
    openInterest: 24900,
    oiChangePercent: -2.1,
    settlementPrice: 8830,
    globalBenchmarkPrice: 'WTI Crude $90.40/bbl (-1.45%)',
    historical30d: generateHistorical30D(8685, 0.022),
  },
  {
    symbol: 'NATGAS_MCX',
    name: 'Natural Gas 1250 MMBTU',
    category: 'Energy',
    ltp: 268.4,
    change: 4.8,
    changePercent: 1.82,
    high: 272.0,
    low: 262.5,
    open: 264.0,
    prevClose: 263.6,
    lotSize: 1250,
    unit: '1 MMBTU',
    expiry: '25-NOV-2026',
    volume: 64200,
    openInterest: 31200,
    oiChangePercent: 6.4,
    settlementPrice: 263.6,
    globalBenchmarkPrice: 'Henry Hub $3.15/MMBtu (+1.95%)',
    historical30d: generateHistorical30D(268.4, 0.035),
  },
  {
    symbol: 'COPPER_MCX',
    name: 'Copper 2.5 MT',
    category: 'Metals',
    ltp: 912.4,
    change: 6.8,
    changePercent: 0.75,
    high: 918.5,
    low: 906.0,
    open: 908.0,
    prevClose: 905.6,
    lotSize: 2500,
    unit: '1 kg',
    expiry: '30-NOV-2026',
    volume: 12800,
    openInterest: 8400,
    oiChangePercent: 1.8,
    settlementPrice: 905.6,
    globalBenchmarkPrice: 'LME Copper $9,810/MT (+0.70%)',
    historical30d: generateHistorical30D(912.4, 0.012),
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
    value: '96.32',
    numericValue: 96.32,
    unit: '₹ per $',
    change: '-0.29 ₹',
    trend: 'down',
    impactLevel: 'Medium',
    lastUpdated: 'Live Forex',
    commentary: 'RBI reference rate at 96.61; onshore rupee trades around 96.32 against USD.',
  },
  {
    id: 'brent-crude',
    name: 'Brent Crude Oil Benchmark',
    category: 'Commodity',
    value: '$103.20',
    numericValue: 103.2,
    unit: 'USD/bbl',
    change: '-$1.45',
    trend: 'down',
    impactLevel: 'High',
    lastUpdated: 'Global ICE',
    commentary: 'Softening geopolitical risk premiums and global demand indicators ease import bill pressures for India.',
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
