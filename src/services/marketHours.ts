/**
 * Indian Financial Markets Trading Hours & Real-Time Session Engine
 * Covers:
 * - NSE / BSE Equity & Derivatives (Equities, F&O, Indices): 09:15 AM - 03:30 PM IST (Mon - Fri)
 * - MCX Commodity Futures & Options: 09:00 AM - 11:30 PM IST (Mon - Fri)
 * 
 * Accurately determines:
 * 1. Whether market is currently OPEN or CLOSED for any given segment or asset.
 * 2. Next opening time & day with precise IST timestamp and human-readable formatting.
 */

export interface MarketStatusInfo {
  isOpen: boolean;
  statusText: 'OPEN' | 'CLOSED';
  sessionLabel: string;
  nextOpenText: string;
  nextOpenTimeFormatted: string; // e.g. "Tomorrow 09:15 AM IST" or "Mon 09:15 AM IST"
  scheduleSummary: string; // e.g. "Mon-Fri 09:15 AM - 03:30 PM IST"
}

/**
 * Returns the current date converted to Indian Standard Time (UTC + 5:30)
 */
export function getISTDate(date: Date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
}

const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Computes live market session state and exact next market opening for an asset or exchange.
 * @param segmentOrExchange 'NSE' | 'BSE' | 'MCX' | 'COMMODITY' | string
 * @param refDate Optional reference date (defaults to current time)
 */
export function getAssetMarketStatus(
  segmentOrExchange: string,
  refDate: Date = new Date()
): MarketStatusInfo {
  const seg = (segmentOrExchange || 'NSE').toUpperCase();
  const isCommodity = seg === 'MCX' || seg === 'COMMODITY';

  const ist = getISTDate(refDate);
  const day = ist.getDay(); // 0 is Sun, 6 is Sat
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const currentTotalMins = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;

  if (isCommodity) {
    // MCX Commodities: Monday - Friday 09:00 AM to 11:30 PM IST
    const openMins = 9 * 60; // 09:00 AM
    const closeMins = 23 * 60 + 30; // 11:30 PM

    if (!isWeekend && currentTotalMins >= openMins && currentTotalMins < closeMins) {
      return {
        isOpen: true,
        statusText: 'OPEN',
        sessionLabel: 'MCX Active Session',
        nextOpenText: 'Closes at 11:30 PM IST',
        nextOpenTimeFormatted: 'Open · Closes 11:30 PM IST',
        scheduleSummary: 'Mon-Fri 09:00 AM – 11:30 PM IST',
      };
    }

    // Market is CLOSED for MCX
    let daysToAdd = 0;
    if (!isWeekend && currentTotalMins < openMins) {
      daysToAdd = 0; // Opens today at 09:00 AM
    } else if (day === 5 && currentTotalMins >= closeMins) {
      daysToAdd = 3; // Friday night -> Opens Monday morning
    } else if (day === 6) {
      daysToAdd = 2; // Saturday -> Opens Monday morning
    } else if (day === 0) {
      daysToAdd = 1; // Sunday -> Opens Monday morning
    } else {
      daysToAdd = 1; // Mon-Thu after close -> Opens tomorrow morning
    }

    let dayLabel = 'Today';
    if (daysToAdd === 1) {
      dayLabel = 'Tomorrow';
    } else if (daysToAdd > 1) {
      const nextDayIdx = (day + daysToAdd) % 7;
      dayLabel = FULL_DAYS[nextDayIdx];
    }

    const nextOpening = `${dayLabel} 09:00 AM IST`;

    return {
      isOpen: false,
      statusText: 'CLOSED',
      sessionLabel: 'MCX Session Closed',
      nextOpenText: `Opens ${nextOpening}`,
      nextOpenTimeFormatted: nextOpening,
      scheduleSummary: 'Mon-Fri 09:00 AM – 11:30 PM IST',
    };
  } else {
    // NSE / BSE Equities, Indices, F&O: Monday - Friday 09:15 AM to 03:30 PM IST
    const openMins = 9 * 60 + 15; // 09:15 AM
    const closeMins = 15 * 60 + 30; // 03:30 PM

    if (!isWeekend && currentTotalMins >= openMins && currentTotalMins < closeMins) {
      return {
        isOpen: true,
        statusText: 'OPEN',
        sessionLabel: 'Normal Trading Session',
        nextOpenText: 'Closes at 03:30 PM IST',
        nextOpenTimeFormatted: 'Open · Closes 03:30 PM IST',
        scheduleSummary: 'Mon-Fri 09:15 AM – 03:30 PM IST',
      };
    }

    // Market is CLOSED for NSE / BSE
    let daysToAdd = 0;
    if (!isWeekend && currentTotalMins < openMins) {
      daysToAdd = 0; // Opens today at 09:15 AM
    } else if (day === 5 && currentTotalMins >= closeMins) {
      daysToAdd = 3; // Friday evening -> Opens Monday morning
    } else if (day === 6) {
      daysToAdd = 2; // Saturday -> Opens Monday morning
    } else if (day === 0) {
      daysToAdd = 1; // Sunday -> Opens Monday morning
    } else {
      daysToAdd = 1; // Mon-Thu after close -> Opens tomorrow morning
    }

    let dayLabel = 'Today';
    if (daysToAdd === 1) {
      dayLabel = 'Tomorrow';
    } else if (daysToAdd > 1) {
      const nextDayIdx = (day + daysToAdd) % 7;
      dayLabel = FULL_DAYS[nextDayIdx];
    }

    const nextOpening = `${dayLabel} 09:15 AM IST`;

    return {
      isOpen: false,
      statusText: 'CLOSED',
      sessionLabel: 'NSE/BSE Market Closed',
      nextOpenText: `Opens ${nextOpening}`,
      nextOpenTimeFormatted: nextOpening,
      scheduleSummary: 'Mon-Fri 09:15 AM – 03:30 PM IST',
    };
  }
}
