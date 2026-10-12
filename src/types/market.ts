/**
 * Core Domain Types for BharatPulse Terminal (NSE, BSE, MCX)
 */

export type MarketSegment = 'NSE' | 'BSE' | 'MCX';

export type LanguageCode = 'en' | 'hi' | 'gu' | 'mr' | 'ta';

export interface PricePoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi?: number;
}

export interface Level2DepthRow {
  bidOrders: number;
  bidQty: number;
  bidPrice: number;
  askPrice: number;
  askQty: number;
  askOrders: number;
}

export interface IndexData {
  symbol: string;
  name: string;
  segment: MarketSegment;
  ltp: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number;
  advances: number;
  declines: number;
  vixContribution?: number;
  sparkline: number[];
}

export interface TechnicalIndicators {
  rsi14: number;
  sma20: number;
  sma50: number;
  sma200: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  atr14: number;
  support1: number;
  resistance1: number;
  patternDetected?: string; // e.g. "Double Bottom", "Golden Cross", "Bullish Flag"
}

export interface EquityData {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  vwap: number;
  marketCapCrores: number;
  peRatio: number;
  week52High: number;
  week52Low: number;
  openInterest: number;
  oiChangePercent: number;
  oiBuildup: 'Long Buildup' | 'Short Buildup' | 'Long Unwinding' | 'Short Covering';
  historical30d: PricePoint[];
  depth: Level2DepthRow[];
  technicals: TechnicalIndicators;
  historicalVolatility30d: number;
  impliedVolatility: number;
}

export interface OptionStrike {
  strikePrice: number;
  callOI: number;
  callChangeOI: number;
  callIV: number;
  callLTP: number;
  callNetChange: number;
  callVolume: number;
  putOI: number;
  putChangeOI: number;
  putIV: number;
  putLTP: number;
  putNetChange: number;
  putVolume: number;
}

export interface OptionChainData {
  underlyingSymbol: string;
  underlyingLTP: number;
  expiryDate: string;
  expiries: string[];
  totalCallOI: number;
  totalPutOI: number;
  totalCallVolume: number;
  totalPutVolume: number;
  pcr: number; // Put Call Ratio
  maxPain: number; // Max Pain strike
  atmIV: number;
  strikes: OptionStrike[];
}

export interface CommodityData {
  symbol: string;
  name: string;
  category: 'Bullion' | 'Energy' | 'Metals' | 'Agri';
  ltp: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  lotSize: number;
  unit: string;
  expiry: string;
  volume: number;
  openInterest: number;
  oiChangePercent: number;
  settlementPrice: number;
  globalBenchmarkPrice: string; // e.g. "COMEX Gold $2,642/oz"
  historical30d: PricePoint[];
}

export interface MacroIndicator {
  id: string;
  name: string;
  category: 'Monetary' | 'Inflation' | 'Growth' | 'Currency' | 'Commodity';
  value: string;
  numericValue: number;
  unit: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  impactLevel: 'High' | 'Medium' | 'Low';
  lastUpdated: string;
  commentary: string;
}

export interface FinancialNewsItem {
  id: string;
  time: string;
  headline: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1.0 to 1.0
  affectedSegments: string[];
  summary: string;
}

export interface SentimentData {
  fearGreedIndex: number; // 0 (Extreme Fear) to 100 (Extreme Greed)
  fearGreedLabel: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  fiiNetCrores: number;
  diiNetCrores: number;
  advanceDeclineRatio: number;
  indiaVix: number;
  indiaVixChange: number;
  socialSentimentScore: number; // % Bullish
  newsHeadlines: FinancialNewsItem[];
}

export type AlertCondition =
  | 'PRICE_ABOVE'
  | 'PRICE_BELOW'
  | 'RSI_OVERSOLD'
  | 'RSI_OVERBOUGHT'
  | 'MA_GOLDEN_CROSS'
  | 'MA_DEATH_CROSS'
  | 'BOLLINGER_BREAKOUT'
  | 'DOUBLE_BOTTOM'
  | 'DOUBLE_TOP'
  | 'HIGH_VOLATILITY';

export interface AlertRule {
  id: string;
  symbol: string;
  name: string;
  segment: MarketSegment;
  condition: AlertCondition;
  threshold: number;
  soundEnabled: boolean;
  isActive: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
  triggerCount: number;
  notes?: string;
}

export interface AlertTriggerLog {
  id: string;
  alertId: string;
  symbol: string;
  condition: AlertCondition;
  message: string;
  threshold: number;
  triggeredPrice: number;
  timestamp: number;
  read: boolean;
}

export interface VaultState {
  isInitialized: boolean;
  isUnlocked: boolean;
  lastUnlockedTime: number | null;
  watchlists: string[];
  alerts: AlertRule[];
  triggerLogs: AlertTriggerLog[];
  userNotes: Record<string, string>;
}
