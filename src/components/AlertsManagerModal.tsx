import React, { useState } from 'react';
import {
  AlertCondition,
  AlertRule,
  AlertTriggerLog,
  EquityData,
  IndexData,
  CommodityData,
  LanguageCode,
} from '../types/market';
import { playAlertChime } from '../services/marketEngine';
import { exportAlertLogsToCSV } from '../services/csvExport';
import { TRANSLATIONS } from '../i18n/translations';
import {
  Bell,
  Volume2,
  Trash2,
  Plus,
  History,
  Download,
  CheckCircle,
  X,
  AlertTriangle,
  VolumeX,
} from 'lucide-react';

interface AlertsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertRule[];
  triggerLogs: AlertTriggerLog[];
  onSaveAlert: (alert: AlertRule) => void;
  onDeleteAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  onClearLogs: () => void;
  equities: EquityData[];
  indices: IndexData[];
  commodities: CommodityData[];
  language: LanguageCode;
  isDark?: boolean;
}

export const AlertsManagerModal: React.FC<AlertsManagerModalProps> = ({
  isOpen,
  onClose,
  alerts,
  triggerLogs,
  onSaveAlert,
  onDeleteAlert,
  onToggleAlert,
  onClearLogs,
  equities,
  indices,
  commodities,
  language,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');

  // Form states
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NIFTY 50');
  const [condition, setCondition] = useState<AlertCondition>('PRICE_ABOVE');
  const [threshold, setThreshold] = useState<number>(25200);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  // Build searchable symbol list
  const allSymbols = [
    ...indices.map((i) => ({ symbol: i.symbol, name: i.name, segment: i.segment, ltp: i.ltp })),
    ...equities.map((e) => ({ symbol: e.symbol, name: e.name, segment: e.exchange, ltp: e.ltp })),
    ...commodities.map((c) => ({ symbol: c.symbol, name: c.name, segment: 'MCX', ltp: c.ltp })),
  ];

  const handleSymbolChange = (sym: string) => {
    setSelectedSymbol(sym);
    const item = allSymbols.find((s) => s.symbol === sym);
    if (item) {
      if (condition === 'PRICE_ABOVE') setThreshold(Math.round(item.ltp * 1.01 * 10) / 10);
      else if (condition === 'PRICE_BELOW') setThreshold(Math.round(item.ltp * 0.99 * 10) / 10);
      else if (condition.includes('RSI')) setThreshold(condition === 'RSI_OVERSOLD' ? 30 : 70);
    }
  };

  const handleConditionChange = (c: AlertCondition) => {
    setCondition(c);
    const item = allSymbols.find((s) => s.symbol === selectedSymbol);
    if (c === 'RSI_OVERSOLD') setThreshold(30);
    else if (c === 'RSI_OVERBOUGHT') setThreshold(70);
    else if (c === 'PRICE_ABOVE' && item) setThreshold(Math.round(item.ltp * 1.01 * 10) / 10);
    else if (c === 'PRICE_BELOW' && item) setThreshold(Math.round(item.ltp * 0.99 * 10) / 10);
    else setThreshold(0);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const item = allSymbols.find((s) => s.symbol === selectedSymbol);
    const newRule: AlertRule = {
      id: `alert-${Date.now()}`,
      symbol: selectedSymbol,
      name: item?.name || selectedSymbol,
      segment: (item?.segment as any) || 'NSE',
      condition,
      threshold: Number(threshold) || 0,
      soundEnabled,
      isActive: true,
      createdAt: Date.now(),
      triggerCount: 0,
      notes,
    };
    onSaveAlert(newRule);
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] flex flex-col ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Customizable Threshold & Pattern Alerts</h3>
              <p className="text-xs text-slate-400">
                Real-time technical surveillance for price levels, RSI extremes, and breakouts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between mt-4 mb-4">
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'rules'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Alert Rules ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Trigger Log ({triggerLogs.length})
            </button>
          </div>

          <button
            onClick={() => playAlertChime('alert')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            Test Audio Chime
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'rules' ? (
            <div className="space-y-6">
              {/* Alert Creation Form */}
              <form
                onSubmit={handleCreate}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-4"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Define New Surveillance Rule
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Symbol selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Asset Symbol</label>
                    <select
                      value={selectedSymbol}
                      onChange={(e) => handleSymbolChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    >
                      {allSymbols.map((s) => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.symbol} ({s.segment} · ₹{s.ltp.toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Condition selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Condition Trigger</label>
                    <select
                      value={condition}
                      onChange={(e) => handleConditionChange(e.target.value as AlertCondition)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    >
                      <option value="PRICE_ABOVE">{t.priceAbove}</option>
                      <option value="PRICE_BELOW">{t.priceBelow}</option>
                      <option value="RSI_OVERSOLD">{t.rsiOversold}</option>
                      <option value="RSI_OVERBOUGHT">{t.rsiOverbought}</option>
                      <option value="MA_GOLDEN_CROSS">{t.goldenCross}</option>
                      <option value="BOLLINGER_BREAKOUT">{t.bollingerBreakout}</option>
                      <option value="DOUBLE_BOTTOM">Double Bottom Formation</option>
                    </select>
                  </div>

                  {/* Threshold input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Threshold Value
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={threshold}
                      onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                      disabled={condition === 'MA_GOLDEN_CROSS' || condition === 'DOUBLE_BOTTOM'}
                      placeholder={condition.includes('RSI') ? 'e.g. 30' : 'e.g. 25200'}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono tabular-nums disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Sound Chime on Trigger</span>
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional memo (e.g. key resistance level)"
                      className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-300 w-56"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Activate Alert
                  </button>
                </div>
              </form>

              {/* Existing Alerts Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Configured Surveillance Rules ({alerts.length})
                </h4>

                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    {t.noAlertsConfigured}
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
                    {alerts.map((al) => (
                      <div
                        key={al.id}
                        className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-950/80 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onToggleAlert(al.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              al.isActive
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : 'bg-slate-800 border-slate-700 text-slate-500'
                            }`}
                            title={al.isActive ? 'Active (Click to mute)' : 'Muted (Click to resume)'}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white font-mono">{al.symbol}</span>
                              <span className="text-slate-400">· {al.condition.replace(/_/g, ' ')}</span>
                              {al.threshold > 0 && (
                                <span className="font-mono text-cyan-400 tabular-nums">
                                  @ {al.threshold.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            {al.notes && <p className="text-[11px] text-slate-400">{al.notes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono tabular-nums text-slate-400">
                          <span>Fired: {al.triggerCount}x</span>
                          <button
                            onClick={() => onDeleteAlert(al.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* History Trigger Logs */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Real-time log of fired threshold triggers and pattern events.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportAlertLogsToCSV(triggerLogs)}
                    disabled={triggerLogs.length === 0}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </button>
                  <button
                    onClick={onClearLogs}
                    disabled={triggerLogs.length === 0}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-800 text-rose-400 hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                  >
                    Clear Log
                  </button>
                </div>
              </div>

              {triggerLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No alerts triggered in this session.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden font-mono text-xs">
                  {triggerLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-950/40 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-100 font-sans">{log.message}</p>
                          <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                            <span>{new Date(log.timestamp).toLocaleTimeString('en-IN')}</span>
                            <span>·</span>
                            <span>Price: ₹{log.triggeredPrice.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
