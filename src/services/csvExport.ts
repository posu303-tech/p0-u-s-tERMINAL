/**
 * CSV Export Utility for Financial Market Datasets
 */

import { CommodityData, EquityData, IndexData, OptionChainData, AlertTriggerLog } from '../types/market';

function downloadCSVFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportIndicesToCSV(indices: IndexData[]): void {
  const headers = ['Symbol', 'Name', 'Segment', 'LTP (INR)', 'Change', 'Change %', 'High', 'Low', 'Open', 'Prev Close', 'Volume', 'Advances', 'Declines'];
  const rows = indices.map((idx) => [
    idx.symbol,
    `"${idx.name}"`,
    idx.segment,
    idx.ltp.toFixed(2),
    idx.change.toFixed(2),
    `${idx.changePercent.toFixed(2)}%`,
    idx.high.toFixed(2),
    idx.low.toFixed(2),
    idx.open.toFixed(2),
    idx.prevClose.toFixed(2),
    idx.volume,
    idx.advances,
    idx.declines,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSVFile(`p0$u_tERMINAL_Indices_${timestamp}.csv`, csv);
}

export function exportEquitiesToCSV(equities: EquityData[]): void {
  const headers = [
    'Symbol',
    'Name',
    'Exchange',
    'Sector',
    'LTP (INR)',
    'Change',
    'Change %',
    'VWAP',
    'High',
    'Low',
    'Volume',
    'Market Cap (Cr)',
    'P/E',
    '52W High',
    '52W Low',
    'Open Interest',
    'OI Buildup',
    'RSI(14)',
    'SMA20',
    'SMA50',
    'HV30 (%)',
    'IV (%)',
  ];

  const rows = equities.map((eq) => [
    eq.symbol,
    `"${eq.name}"`,
    eq.exchange,
    `"${eq.sector}"`,
    eq.ltp.toFixed(2),
    eq.change.toFixed(2),
    `${eq.changePercent.toFixed(2)}%`,
    eq.vwap.toFixed(2),
    eq.high.toFixed(2),
    eq.low.toFixed(2),
    eq.volume,
    eq.marketCapCrores,
    eq.peRatio.toFixed(1),
    eq.week52High.toFixed(2),
    eq.week52Low.toFixed(2),
    eq.openInterest,
    eq.oiBuildup,
    eq.technicals.rsi14.toFixed(1),
    eq.technicals.sma20.toFixed(2),
    eq.technicals.sma50.toFixed(2),
    eq.historicalVolatility30d.toFixed(1),
    eq.impliedVolatility.toFixed(1),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSVFile(`p0$u_tERMINAL_Equities_${timestamp}.csv`, csv);
}

export function exportOptionChainToCSV(chain: OptionChainData): void {
  const headers = [
    'Call OI',
    'Call Chg OI',
    'Call Vol',
    'Call IV',
    'Call LTP',
    'Strike Price',
    'Put LTP',
    'Put IV',
    'Put Vol',
    'Put Chg OI',
    'Put OI',
  ];

  const rows = chain.strikes.map((s) => [
    s.callOI,
    s.callChangeOI,
    s.callVolume,
    s.callIV.toFixed(1),
    s.callLTP.toFixed(2),
    s.strikePrice,
    s.putLTP.toFixed(2),
    s.putIV.toFixed(1),
    s.putVolume,
    s.putChangeOI,
    s.putOI,
  ]);

  const meta = [
    `# Underlying: ${chain.underlyingSymbol}`,
    `# Underlying LTP: ${chain.underlyingLTP.toFixed(2)}`,
    `# Expiry Date: ${chain.expiryDate}`,
    `# PCR: ${chain.pcr.toFixed(2)}`,
    `# Max Pain: ${chain.maxPain}`,
    '',
  ].join('\n');

  const csv = meta + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSVFile(`p0$u_tERMINAL_OptionChain_${chain.underlyingSymbol}_${timestamp}.csv`, csv);
}

export function exportCommoditiesToCSV(commodities: CommodityData[]): void {
  const headers = [
    'Symbol',
    'Name',
    'Category',
    'LTP (INR)',
    'Change',
    'Change %',
    'High',
    'Low',
    'Lot Size',
    'Unit',
    'Expiry',
    'Volume',
    'Open Interest',
    'Settlement Price',
    'Global Benchmark',
  ];

  const rows = commodities.map((c) => [
    c.symbol,
    `"${c.name}"`,
    c.category,
    c.ltp.toFixed(2),
    c.change.toFixed(2),
    `${c.changePercent.toFixed(2)}%`,
    c.high.toFixed(2),
    c.low.toFixed(2),
    c.lotSize,
    `"${c.unit}"`,
    c.expiry,
    c.volume,
    c.openInterest,
    c.settlementPrice.toFixed(2),
    `"${c.globalBenchmarkPrice}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSVFile(`p0$u_tERMINAL_MCX_Commodities_${timestamp}.csv`, csv);
}

export function exportAlertLogsToCSV(logs: AlertTriggerLog[]): void {
  const headers = ['Trigger ID', 'Symbol', 'Condition', 'Threshold', 'Triggered Price', 'Timestamp (IST)', 'Message'];
  const rows = logs.map((l) => [
    l.id,
    l.symbol,
    l.condition,
    l.threshold,
    l.triggeredPrice,
    new Date(l.timestamp).toLocaleString('en-IN'),
    `"${l.message.replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSVFile(`p0$u_tERMINAL_Alert_Triggers_${timestamp}.csv`, csv);
}
