# BharatPulse Terminal: Real-Time Market Monitoring & Analytics (NSE · BSE · MCX)

A high-performance, institutional-grade browser dashboard built for active financial market participants to monitor live indices, equities, futures & options (F&O) chains, and MCX commodities without execution risk. Features WebCrypto AES-256-GCM client-side encrypted authentication tailored for instant GitHub cloning, technical pattern breakout alerts, India VIX analysis, macroeconomic indicators, multilingual accessibility, offline IndexedDB trend caching, and automated PDF executive report exports.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Authentication Recommendation for GitHub Deployment**:
> You requested guidance on which authentication method to use for running the application directly from GitHub.
> 
> **Recommended Solution: Client-Side WebCrypto AES-256-GCM Encrypted Local Vault with PBKDF2 Key Derivation + IndexedDB**
> - **Why it is superior for GitHub**: Zero external cloud dependencies, zero GCP/Firebase project setup, zero API keys or billing required. Any developer or trader who clones the repository from GitHub can run `npm install && npm run dev` (or deploy to GitHub Pages / Vercel) immediately.
> - **Privacy & True End-to-End Encryption (E2EE)**: Watchlists, alert thresholds, custom trade notes, and cached tick histories are encrypted in memory using the user's master password/PIN via the browser's native `window.crypto.subtle` (PBKDF2 with 100,000 SHA-256 iterations and AES-GCM 256-bit). Data stored in `IndexedDB` is encrypted at rest; nothing is ever transmitted to an unencrypted external server.
> - **Portability**: Includes password-protected Encrypted Vault Export/Import (`.bpvault.json`) so users can migrate their watchlists and alert setups across multiple machines.

- **Confirmed Architecture**:
  - **Auth & Storage**: Native Client-Side WebCrypto E2E Encrypted Vault + IndexedDB offline cache (ideal for zero-config GitHub deployments).
  - **Market Segments**: NSE (Nifty 50, Bank Nifty, Nifty IT, FinNifty, Midcap), BSE (Sensex, BSE 100), MCX (Gold, Silver, Crude Oil, Natural Gas, Copper).
  - **F&O Analytics**: Option chain matrix (Calls/Puts, Strikes, OI, Change in OI, IV, PCR, Max Pain indicator).
  - **Execution Constraint**: Read-only monitoring terminal (no broker order routing; explicit compliance badges).
  - **Alerts Engine**: Real-time evaluation of price thresholds and technical patterns (Breakouts, RSI divergences, Golden Cross, Bollinger squeezes) with browser notifications and audio cues.
  - **Reporting & Export**: Client-side automated PDF generation with canvas chart snapshots and CSV export for all table views.
  - **Languages**: English, Hindi (हिंदी), Gujarati (ગુજરાતી), Marathi (मराठी), and Tamil (தமிழ்).

---

### 1. Overview & Core Concept

- **What It Does**: BharatPulse Terminal is an all-in-one browser monitoring console for Indian financial markets (NSE, BSE, MCX). It streams high-frequency simulated and benchmark-calibrated market ticks, calculates real-time volatility metrics (India VIX & HV30), tracks open interest dynamics, correlates macroeconomic indicators (RBI Repo, 10Y Yield, CPI, USD/INR, Brent), and triggers instant visual/audio alerts upon price thresholds or classical chart pattern triggers.
- **Target Audience**: Financial analysts, active day and swing traders, options strategists, commodity hedgers, and researchers who require institutional-grade situational awareness across cash, derivatives, and commodities without risking accidental order execution.
- **Key Value**: Delivers Bloomberg-level multi-segment visibility with zero cloud setup friction, strict cryptographic data privacy, full offline historical playback, and comprehensive multi-language accessibility.

---

### 2. User Experience & Visual Design

#### Top Bar Contract
Adheres strictly to the one-row, three-zone contract (`gap-8`, single line):
- **Zone 1 (Brand Wordmark)**: `BharatPulse Terminal` (in bold display sans with subtle exchange segment indicator).
- **Zone 2 (Navigation Segments)**: 5 concise single-line text links: `Overview`, `Equities`, `Derivatives (F&O)`, `Commodities (MCX)`, `Macro & Sentiment`.
- **Zone 3 (Actions & Status)**: Market Status badge (`NSE/BSE/MCX OPEN`), Language Selector (`EN / HI / GU / MR / TA`), Dark/Light mode toggle, and Vault Security Lock button.

#### Visual Identity & Theme
- **Aesthetic Direction**: High-contrast, institutional trading terminal inspired by professional desks (clean lines, high data density, zero playful decorative fluff).
- **Color System (60-30-10 Rule)**:
  - *60% Neutral Canvas*: Deep obsidian slate (`#0B0F17`) in dark mode; crisp clinical paper (`#F8FAFC`) in light mode.
  - *30% Structural Surfaces*: Subtle dark navy/graphite cards (`#111827`), hairline borders (`#1F2937`), and subdued typography.
  - *10% Functional Accent*: Financial green (`#10B981` / Bullish), financial crimson (`#EF4444` / Bearish), amber (`#F59E0B` / Alert Trigger), and terminal cyan (`#06B6D4` / Active Tabs & Highlights).
- **Typography**:
  - *Display / Section Headings*: `Plus Jakarta Sans` with balanced line wraps.
  - *Data & Metrics*: `JetBrains Mono` and `font-variant-numeric: tabular-nums` for all numbers, decimal places, percentages, lot sizes, and timestamps to eliminate column jitter.
  - *Zero-Pill Discipline*: Categories, timestamps, and volume metrics are rendered as unboxed text separated by typographic middots (`·`). Interactive controls use sleek segmented buttons.

#### Key User Flows
1. **First-Time Access / Vault Unlock**: User is greeted with the Encrypted Vault onboarding or unlock prompt (Enter Master Password or quick 6-digit PIN). The app derives the AES-GCM key and decrypts watchlists, alert rules, and cached history from IndexedDB.
2. **Multi-Segment Monitoring**:
   - *Overview*: Key ticker tape for Nifty 50, Sensex, Bank Nifty, MCX Gold; Fear & Greed gauge, Top Gainers/Losers, India VIX curve.
   - *Equities*: NSE/BSE screener with real-time bid/ask depth (Level 2 simulation), Volume Weighted Average Price (VWAP), 52-week high/low, and 1-click interactive candlestick/area chart.
   - *Derivatives (F&O)*: Live Option Chain matrix for Nifty and Bank Nifty with Put-Call Ratio (PCR), Max Pain calculation, Open Interest buildup tags (*Long Buildup*, *Short Covering*, *Short Buildup*, *Long Unwinding*).
   - *MCX Commodities*: Bullion (Gold, Silver), Energy (Crude, NatGas), Metals (Copper, Zinc) with lot sizes, basis, and international correlation metrics.
   - *Macro & Sentiment*: RBI Repo rate, India 10Y Yield, USD/INR, CPI Inflation, FII/DII institutional net flows, and financial news headlines with sentiment ratings.
3. **Custom Alert Management**: User sets threshold triggers (e.g., `NIFTY 50 > 25,200` or `RSI(14) Oversold < 30 on RELIANCE` or `Double Bottom Pattern on TATAMOTORS`). Alerts trigger toast banners, audio pings, and persist in an alert history drawer.
4. **Data Export & Reporting**:
   - 1-click CSV download for any active dataset.
   - Automated institutional PDF report generator (compiles executive market summary, index levels, top movers, F&O sentiment, and charts with downloadable PDF output).
5. **Offline Mode**: If internet drops, an offline indicator appears; the app switches seamlessly to IndexedDB cached historical ticks with time-scrubbing controls.

---

### 3. Key Product Decisions & Trade-Offs

- **Client-Side WebCrypto Vault vs. External Cloud Auth**:
  - *Chosen*: Native `SubtleCrypto` PBKDF2 + AES-GCM encrypted local vault stored in browser `IndexedDB`.
  - *Why*: Direct execution from any GitHub clone without configuration, keys, or accounts. Delivers airtight data confidentiality for proprietary watchlists and threshold strategies.
- **High-Frequency Tick Engine vs. External Polling**:
  - *Chosen*: Client-side streaming tick engine calibrated against realistic NSE/BSE/MCX market dynamics, Brownian motion with jump-diffusion for volatility, and order book depth generation.
  - *Why*: Free public financial APIs for Indian markets (NSE/BSE/MCX) severely rate-limit or block browser cross-origin requests (CORS). A realistic streaming engine guarantees deterministic 100% uptime, custom tick speeds, and reproducible technical patterns for stress-testing alerts.
- **Interactive Candlestick & Volume Charts**:
  - *Chosen*: Responsive SVG + HTML5 Canvas hybrid charting with crosshair tooltips, technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands), and volume/OI profile bars.
  - *Why*: Ultra-fast render cycles, zero bulky external chart license constraints, smooth pan/zoom, and pixel-perfect printing into PDF export.
- **Client-Side PDF Generation**:
  - *Chosen*: Structured HTML printable layout with dedicated print CSS media and automated data-driven vector report export.
  - *Why*: Instant generation with zero server dependencies or heavy Node headless browsers.

---

### 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             BharatPulse Web App                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Top Bar: Brand · Segment Tabs · Market Status · Language · Dark Mode · Vault Lock │
└─────────┬──────────────────────────────────────────────────────────────┬─────────┘
          │                                                              │
┌─────────▼────────────────────────────────────────┐ ┌───────────────────▼─────────┐
│               Security & Auth                    │ │           Offline Engine     │
│   WebCrypto API (PBKDF2 + AES-256-GCM)           │ │       IndexedDB Cache Engine │
│   Master Password / PIN Encrypted Vault          │ │       Snapshot & Tick Replay │
└─────────┬────────────────────────────────────────┘ └───────────────────┬─────────┘
          │                                                              │
┌─────────▼──────────────────────────────────────────────────────────────▼─────────┐
│                          Core Reactive Market Store                              │
│  - Live Indices (NSE / BSE / MCX)          - Historical Volume & OI Matrix       │
│  - Equity Watchlist (LTP, Depth, VWAP)     - Macro Indicators (Repo, Yield, FX)  │
│  - F&O Option Chain (OI, IV, PCR, Pain)    - Sentiment Scores & News Feed        │
│  - MCX Commodities (Bullion, Energy)       - Real-time India VIX & HV30          │
└─────────┬──────────────────────────────────────────────────────────────┬─────────┘
          │                                                              │
┌─────────▼────────────────────────────┐       ┌─────────────────────────▼─────────┐
│       Pattern & Alert Engine         │       │        Export & Report Module     │
│ - Price Breakout & Cross Triggers    │       │ - CSV Exporter (Multi-segment)    │
│ - Technical Patterns (RSI, MA Cross) │       │ - Automated PDF Institutional Doc │
│ - Web Audio & Toast Notifications    │       │ - Encrypted Vault Backup (.json)  │
└──────────────────────────────────────┘       └───────────────────────────────────┘
```

#### Component & Module Strategy
- `src/types/market.ts`: Complete TypeScript definitions for Indices, Equities, Option Chains, Commodities, Macro Indicators, Alerts, and Encrypted Vault structures.
- `src/services/cryptoVault.ts`: WebCrypto PBKDF2 key derivation, AES-GCM encryption/decryption, IndexedDB persistence, and vault export/import.
- `src/services/marketEngine.ts`: Real-time multi-segment tick generator, realistic order book depth, volatility calculation, and technical pattern detectors.
- `src/services/pdfReportGenerator.ts`: Institutional market report compiler with summaries, tables, and printable layout.
- `src/services/csvExport.ts`: CSV formatting and download trigger for indices, equities, F&O chains, and alerts.
- `src/i18n/translations.ts`: Comprehensive dictionary for English, Hindi, Gujarati, Marathi, and Tamil.
- `src/components/Navbar.tsx`: Top Bar Contract implementation with market ticker, language switcher, theme toggle, and security status.
- `src/components/OverviewView.tsx`: Terminal landing view with market status, ticker marquee, index summary cards, Fear & Greed gauge, VIX tracker, and top movers.
- `src/components/EquitiesView.tsx`: NSE/BSE stock screener, bid/ask depth modal, technical indicators, and interactive chart inspector.
- `src/components/DerivativesView.tsx`: Full Option Chain matrix for Nifty/BankNifty, strikes, Calls/Puts, Open Interest buildup classification, PCR, and Max Pain.
- `src/components/CommoditiesView.tsx`: MCX Gold, Silver, Crude, Natural Gas, Base Metals tracking with contract expiries and international spread indicators.
- `src/components/MacroSentimentView.tsx`: Macroeconomic dashboard (RBI Repo, 10Y Yield, CPI, USD/INR, Brent) + Sentiment analysis with FII/DII flow and news feed.
- `src/components/AlertsManagerModal.tsx`: Alert creation, pattern trigger rule selector, threshold builder, audio chime test, and trigger history log.
- `src/components/VaultAuthModal.tsx`: Passkey/PIN setup, login, lock/unlock, and encrypted backup management.
- `src/components/ChartInspector.tsx`: Interactive candlestick & volume chart with timeframe selector (1M, 5M, 15M, 1D), moving averages, RSI, and Bollinger bands.

---

### Verification & Testing Plan
1. **Compilation Check**: Run `compile_applet` to verify zero TypeScript errors and pristine bundling.
2. **Encryption & Vault Validation**: Verify that creating an alert and locking the vault encrypts data in IndexedDB, and unlocking with correct credentials restores all state.
3. **Data Integrity & Streaming**: Verify live tick updates across NSE, BSE, and MCX without memory leaks or UI lag.
4. **Pattern & Threshold Alerts**: Trigger an alert rule (e.g. crossing price or RSI threshold) and confirm visual banner + audio alert notification.
5. **CSV & PDF Export**: Test CSV download for all 4 market segments and test PDF report preview/download.
6. **Multi-Language Switch**: Toggle between English, Hindi, Gujarati, Marathi, and Tamil to ensure zero missing translation keys or layout clipping.
7. **Offline Cache Behavior**: Simulate offline mode and verify that historical charts and cached data load immediately from IndexedDB.
