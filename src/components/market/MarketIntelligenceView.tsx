/**
 * BANDITRADES — Live Market Intelligence & Real-Time Data (5 Canonical)
 * Features live bid, ask, last price, recency timestamps, source attribution,
 * and resilient provider outage handling.
 */

import React, { useState, useEffect } from 'react';
import {
  Radio,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Layers,
  Clock,
  ArrowRight,
  Shield,
  Activity,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Server,
  ExternalLink,
  Sliders,
  PauseCircle,
  PlayCircle,
  Lock
} from 'lucide-react';
import {
  CanonicalInstrument,
  CANONICAL_INSTRUMENTS,
  MarketQuote,
  MarketCandle,
  MarketStructureItem,
  EconomicEvent,
  BanditMarketBriefing,
  MarketProviderStatus
} from '../../types/index.ts';
import { api } from '../../services/api.ts';

export const MarketIntelligenceView: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<CanonicalInstrument>('US100');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [structure, setStructure] = useState<MarketStructureItem[]>([]);
  const [briefing, setBriefing] = useState<BanditMarketBriefing | null>(null);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [providerStatus, setProviderStatus] = useState<MarketProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiBriefingLoading, setAiBriefingLoading] = useState(false);
  const [aiBriefingText, setAiBriefingText] = useState<string | null>(null);
  const [togglingOutage, setTogglingOutage] = useState(false);
  const [togglingSimulation, setTogglingSimulation] = useState(false);
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [targetCalibratePrice, setTargetCalibratePrice] = useState('');
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState(false);

  // Load live market data
  const loadMarketData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [fetchedQuotes, fetchedCandles, fetchedStructure, fetchedBriefing, fetchedCalendar, fetchedStatus] = await Promise.all([
        api.getMarketQuotes(),
        api.getMarketCandles(selectedSymbol, timeframe),
        api.getMarketStructure(selectedSymbol),
        api.getMarketBriefing(selectedSymbol),
        api.getEconomicCalendar(),
        api.getMarketStatus()
      ]);

      setQuotes(fetchedQuotes);
      setCandles(fetchedCandles);
      setStructure(fetchedStructure);
      setBriefing(fetchedBriefing);
      setEconomicEvents(fetchedCalendar);
      setProviderStatus(fetchedStatus);
    } catch (err) {
      console.error('Failed to load market data:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMarketData();
    // Continuous polling every 4 seconds for live ticker updates
    const interval = setInterval(() => loadMarketData(false), 4000);
    return () => clearInterval(interval);
  }, [selectedSymbol, timeframe]);

  const handleToggleOutage = async () => {
    setTogglingOutage(true);
    try {
      const newStatus = await api.simulateOutage(!providerStatus?.isSimulatingOutage);
      setProviderStatus(newStatus);
      await loadMarketData(false);
    } catch (err) {
      console.error('Failed to toggle outage simulation:', err);
    } finally {
      setTogglingOutage(false);
    }
  };

  const handleToggleSimulationMode = async () => {
    setTogglingSimulation(true);
    try {
      const res = await api.toggleSimulationMode(!providerStatus?.simulationModeActive);
      setProviderStatus(res.status);
      setQuotes(res.quotes);
    } catch (err) {
      console.error('Failed to toggle simulation mode:', err);
    } finally {
      setTogglingSimulation(false);
    }
  };

  const handleCalibrate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetCalibratePrice);
    if (isNaN(val) || val <= 0) return;

    setCalibrating(true);
    try {
      const res = await api.calibrateMarketPrice(selectedSymbol, val);
      if (res.success) {
        setQuotes(res.quotes);
        setCalibrationSuccess(true);
        setTimeout(() => {
          setCalibrationSuccess(false);
          setShowCalibrateModal(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to calibrate price:', err);
    } finally {
      setCalibrating(false);
    }
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.refreshMarketFeeds();
      setProviderStatus(res.status);
      setQuotes(res.quotes);
      const [c, s, b] = await Promise.all([
        api.getMarketCandles(selectedSymbol, timeframe),
        api.getMarketStructure(selectedSymbol),
        api.getMarketBriefing(selectedSymbol)
      ]);
      setCandles(c);
      setStructure(s);
      setBriefing(b);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFetchAiBriefing = async () => {
    setAiBriefingLoading(true);
    try {
      const res = await api.getAiMarketBriefing(selectedSymbol);
      setAiBriefingText(res.briefing);
    } catch (err) {
      console.error('Failed to generate AI briefing:', err);
    } finally {
      setAiBriefingLoading(false);
    }
  };

  const currentQuote = quotes.find(q => q.symbol === selectedSymbol);
  const isPos = (currentQuote?.change24hPercent ?? 0) >= 0;

  // Format relative recency
  const formatRecency = (sec: number) => {
    if (sec <= 2) return 'Just now (<2s)';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s ago`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TRADINGVIEW REAL-TIME MARKET FIDELITY & SESSION BANNER */}
      <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
        !currentQuote?.isMarketOpen && !providerStatus?.simulationModeActive
          ? 'border-amber-500/40 bg-amber-950/15 text-slate-800 dark:text-[#F4F6F8]'
          : providerStatus?.status === 'OUTAGE'
          ? 'border-red-500/50 bg-red-950/20 text-red-200'
          : providerStatus?.status === 'DEGRADED'
          ? 'border-amber-500/50 bg-amber-950/20 text-amber-200'
          : 'border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] text-slate-800 dark:text-[#F4F6F8]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              !currentQuote?.isMarketOpen && !providerStatus?.simulationModeActive
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : providerStatus?.status === 'OUTAGE'
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-[#00C781]/15 border-[#00C781]/40 text-[#00C781]'
            }`}>
              {!currentQuote?.isMarketOpen && !providerStatus?.simulationModeActive ? (
                <Lock size={18} />
              ) : providerStatus?.status === 'OUTAGE' ? (
                <WifiOff size={18} />
              ) : (
                <Wifi size={18} />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-[#AAB3BF]">
                  SESSION STATUS:
                </span>
                <span className={`font-mono text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  !currentQuote?.isMarketOpen && !providerStatus?.simulationModeActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : providerStatus?.simulationModeActive
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : providerStatus?.status === 'OUTAGE'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-[#00C781]/20 text-[#00C781]'
                }`}>
                  {!currentQuote?.isMarketOpen && !providerStatus?.simulationModeActive ? (
                    <>
                      <PauseCircle size={12} />
                      <span>MARKET CLOSED — TICKS FROZEN AT OFFICIAL CLOSE</span>
                    </>
                  ) : providerStatus?.simulationModeActive ? (
                    <>
                      <PlayCircle size={12} />
                      <span>PRACTICE SIMULATION SANDBOX ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#00C781] animate-pulse" />
                      <span>MARKET OPEN — LIVE REAL-TIME STREAM</span>
                    </>
                  )}
                </span>

                <span className="text-[11px] font-mono text-slate-400">
                  TradingView Benchmark: <strong>{currentQuote?.tradingViewSymbol}</strong>
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                {!currentQuote?.isMarketOpen && !providerStatus?.simulationModeActive ? (
                  <span>
                    Global exchanges are currently closed for the weekend. In institutional trading, prices <strong>do not move</strong> when order books are closed. Cloud X strictly freezes quotes at Friday settlement to mirror your exact TradingView chart.
                  </span>
                ) : (
                  <span>
                    Live interbank order book streaming active with low-latency execution feeds.
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 pt-0.5 font-mono">
                <span>Source: {currentQuote?.provider}</span>
                <span>·</span>
                <span>Latency: {providerStatus?.averageLatencyMs ?? 35}ms</span>
                <span>·</span>
                <span>Next Session: {currentQuote?.nextSessionNotice || 'Sunday 5:00 PM EST (22:00 UTC)'}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
            {/* Calibrate to Broker / TradingView Button */}
            <button
              onClick={() => {
                setTargetCalibratePrice(currentQuote?.lastPrice ? currentQuote.lastPrice.toString() : '');
                setShowCalibrateModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] hover:border-[#00B2FE]/60 transition-colors shadow-xs"
              title="Calibrate price to match your exact broker chart"
            >
              <Sliders size={13} className="text-[#00B2FE]" />
              <span>Calibrate Broker Price</span>
            </button>

            {/* TradingView Chart Direct Link */}
            <a
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(currentQuote?.tradingViewSymbol || 'NASDAQ:NDX')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-xs font-semibold text-slate-700 dark:text-[#F8FAFC] hover:text-[#00B2FE] transition-colors shadow-xs"
            >
              <span>TradingView Chart</span>
              <ExternalLink size={12} />
            </a>

            {/* Weekend Sandbox Simulator Toggle */}
            <button
              onClick={handleToggleSimulationMode}
              disabled={togglingSimulation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                providerStatus?.simulationModeActive
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#151A20] hover:bg-slate-200 dark:hover:bg-[#202731] border border-slate-200 dark:border-[#2E3845] text-slate-700 dark:text-slate-300'
              }`}
              title="Toggle simulated weekend order book ticks for off-hours practice"
            >
              {providerStatus?.simulationModeActive ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
              <span>{providerStatus?.simulationModeActive ? 'Disable Practice Ticks' : 'Practice Ticks'}</span>
            </button>

            {/* Sync Feed Button */}
            <button
              onClick={handleForceRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-xs font-semibold text-slate-700 dark:text-[#F4F6F8] hover:border-[#00C781]/50 transition-colors shadow-xs"
              title="Force immediate live quote refresh"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#00C781]' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Feed'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FIVE CANONICAL INSTRUMENTS LIVE TICKER CARDS (US100, US30, GBPUSD, GBPJPY, XAUUSD) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {Object.keys(CANONICAL_INSTRUMENTS).map(inst => {
          const sym = inst as CanonicalInstrument;
          const q = quotes.find(item => item.symbol === sym);
          const isSelected = selectedSymbol === sym;
          const pos = (q?.change24hPercent ?? 0) >= 0;
          const isClosed = !q?.isMarketOpen && !providerStatus?.simulationModeActive;

          return (
            <div
              key={sym}
              onClick={() => {
                setSelectedSymbol(sym);
                setAiBriefingText(null);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                isSelected
                  ? 'border-[#00C781] bg-slate-50 dark:bg-[#1B222B] shadow-md ring-1 ring-[#00C781]/40'
                  : 'border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Top Row: Symbol & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-[#F4F6F8]">
                      {sym}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isClosed
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : q?.feedStatus === 'OUTAGE_PROTECTION'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-[#00C781]/15 text-[#00C781]'
                    }`}>
                      {isClosed ? 'FROZEN' : 'LIVE'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    {q?.tradingViewSymbol || CANONICAL_INSTRUMENTS[sym].name}
                  </div>
                </div>

                <div className={`text-xs font-mono font-bold ${pos ? 'text-[#00C781]' : 'text-red-400'}`}>
                  {pos ? '+' : ''}{q?.change24hPercent ?? 0}%
                </div>
              </div>

              {/* Middle Row: Last Traded Price */}
              <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-[#F4F6F8] tracking-tight">
                {q ? q.lastPrice.toLocaleString(undefined, { minimumFractionDigits: q.symbol === 'GBPUSD' ? 4 : 2 }) : '—'}
              </div>

              {/* Bid & Ask Strip */}
              <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-100 dark:bg-[#12161C] font-mono text-[11px]">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">BID</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {q?.bid ?? '—'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block uppercase">ASK</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {q?.ask ?? '—'}
                  </span>
                </div>
              </div>

              {/* Source & Recency Footer */}
              <div className="pt-1.5 border-t border-slate-100 dark:border-[#252D38] text-[10px] text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span className="truncate mr-1">Spread: {q?.spread ?? 0}</span>
                  <span className={isClosed ? 'text-amber-400 font-semibold' : 'text-[#00C781] font-semibold'}>
                    {isClosed ? 'Closed (Locked)' : formatRecency(q?.recencySeconds ?? 0)}
                  </span>
                </div>
                <div className="truncate text-slate-500 dark:text-slate-500">
                  {q?.tradingViewSymbol} · {q?.provider}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. DETAILED MARKET INSPECTOR & ORDER BOOK DATA */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-5">
        {/* Header Strip with Bid, Ask, Last Price, and Recency */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#252D38]">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-[#F4F6F8]">
                {selectedSymbol}
              </h3>
              <span className="text-sm text-slate-500 dark:text-[#AAB3BF]">
                {CANONICAL_INSTRUMENTS[selectedSymbol].name}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#00C781]/15 text-[#00C781]">
                {currentQuote?.sessionStatus} · {currentQuote?.session} Session
              </span>
            </div>

            {/* Complete Data Source & Recency Attribution */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-[#AAB3BF] font-mono mt-1">
              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                <Server size={13} className="text-[#00C781]" />
                Provider: {currentQuote?.provider}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                Updated: {currentQuote ? new Date(currentQuote.timestamp).toLocaleTimeString() : 'N/A'}{' '}
                ({formatRecency(currentQuote?.recencySeconds ?? 0)})
              </span>
              <span>·</span>
              <span className="text-slate-400">
                Timestamp: {currentQuote?.timestamp}
              </span>
            </div>
          </div>

          {/* Timeframe & AI Briefing Trigger */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#151A20] border border-slate-200 dark:border-[#2E3845]">
              {(['15m', '1h', '4h', '1d'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                    timeframe === tf
                      ? 'bg-slate-900 text-white dark:bg-[#252D38] dark:text-[#00C781] shadow-xs'
                      : 'text-slate-600 dark:text-[#AAB3BF] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <button
              onClick={handleFetchAiBriefing}
              disabled={aiBriefingLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Sparkles size={14} />
              <span>{aiBriefingLoading ? 'Analyzing...' : 'Bandit AI Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Live Order Book Quote Strip (Bid / Ask / Last / Spread / 24h High & Low) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#12161C] border border-slate-100 dark:border-[#252D38] font-mono text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">LAST TRADED PRICE</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-[#F4F6F8] tabular-nums mt-0.5">
              {currentQuote?.lastPrice.toLocaleString(undefined, { minimumFractionDigits: currentQuote.symbol === 'GBPUSD' ? 4 : 2 })}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">CURRENT BID</div>
            <div className="text-base font-bold text-[#00C781] tabular-nums mt-0.5">
              {currentQuote?.bid}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">CURRENT ASK</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-200 tabular-nums mt-0.5">
              {currentQuote?.ask}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">LIVE SPREAD</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-300 tabular-nums mt-0.5">
              {currentQuote?.spread} pts
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">24H HIGH / LOW</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums mt-1">
              {currentQuote?.high24h} / {currentQuote?.low24h}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">FEED RECENCY</div>
            <div className="text-xs font-bold text-[#00C781] mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00C781] animate-pulse" />
              <span>{formatRecency(currentQuote?.recencySeconds ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Candlestick Chart Viewport */}
        <div className="h-72 w-full relative bg-slate-50 dark:bg-[#0F1318] rounded-xl border border-slate-100 dark:border-[#252D38] p-4 flex flex-col justify-between">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>High: {Math.max(...candles.map(c => c.high), 1).toLocaleString()}</span>
            <span className="text-[11px] text-[#00C781] font-semibold">
              {selectedSymbol} — {timeframe} Stream
            </span>
            <span>Low: {Math.min(...candles.map(c => c.low), 1).toLocaleString()}</span>
          </div>

          {/* SVG Candlestick Bars */}
          <div className="flex-1 w-full relative my-2 overflow-hidden flex items-end">
            <svg className="w-full h-full" viewBox="0 0 760 180" preserveAspectRatio="none">
              {candles.length > 0 && (() => {
                const minPrice = Math.min(...candles.map(c => c.low));
                const maxPrice = Math.max(...candles.map(c => c.high));
                const priceRange = maxPrice - minPrice || 1;
                const candleWidth = Math.max(4, Math.floor(740 / candles.length) - 4);

                return candles.map((c, i) => {
                  const x = (i / candles.length) * 740 + 10;
                  const isBullish = c.close >= c.open;
                  const yHigh = 160 - ((c.high - minPrice) / priceRange) * 140;
                  const yLow = 160 - ((c.low - minPrice) / priceRange) * 140;
                  const yOpen = 160 - ((c.open - minPrice) / priceRange) * 140;
                  const yClose = 160 - ((c.close - minPrice) / priceRange) * 140;

                  const bodyTop = Math.min(yOpen, yClose);
                  const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
                  const color = isBullish ? '#00C781' : '#EF4444';

                  return (
                    <g key={i}>
                      <line x1={x + candleWidth / 2} y1={yHigh} x2={x + candleWidth / 2} y2={yLow} stroke={color} strokeWidth="1.2" />
                      <rect
                        x={x}
                        y={bodyTop}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={color}
                        rx="1"
                      />
                    </g>
                  );
                });
              })()}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400 border-t border-slate-200 dark:border-[#252D38] pt-1.5">
            <span>Historical: {candles[0]?.timestamp ? new Date(candles[0].timestamp).toLocaleTimeString() : 'N/A'}</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Ref Price: {currentQuote?.lastPrice}
            </span>
            <span>Live Observation: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* AI Market Briefing or Deterministic Briefing Card */}
        {aiBriefingText ? (
          <div className="p-5 rounded-2xl border border-[#00C781]/40 bg-[#00C781]/5 text-slate-800 dark:text-[#F4F6F8] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00C781] uppercase tracking-wider">
                <Sparkles size={16} />
                <span>BANDIT AI INTRADAY INTELLIGENCE BRIEFING ({selectedSymbol})</span>
              </div>
              <button onClick={() => setAiBriefingText(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="prose dark:prose-invert text-xs leading-relaxed max-w-none whitespace-pre-wrap font-sans">
              {aiBriefingText}
            </div>
          </div>
        ) : briefing && (
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#151A20]/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#00C781] uppercase tracking-wider">
                  STRUCTURED MARKET BRIEFING
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F4F6F8]">
                  HTF Bias: {briefing.higherTimeframeBias}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Verified: {briefing.verifiedPrice}
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {briefing.shortTermStructure}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200 dark:border-[#252D38] text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-[#1B222B] border border-slate-100 dark:border-[#252D38] space-y-1">
                <div className="font-bold text-[#00C781]">Bullish Execution Scenario:</div>
                <p className="text-slate-600 dark:text-slate-300">{briefing.bullishScenario}</p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#1B222B] border border-slate-100 dark:border-[#252D38] space-y-1">
                <div className="font-bold text-red-400">Bearish Execution Scenario:</div>
                <p className="text-slate-600 dark:text-slate-300">{briefing.bearishScenario}</p>
              </div>
            </div>

            <div className="text-[11px] text-amber-500/90 font-mono">
              <strong>Strict Invalidation:</strong> {briefing.invalidationConditions}
            </div>
          </div>
        )}

        {/* SMC & ICT Market Structure Detected Levels */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 dark:text-[#AAB3BF] uppercase tracking-wider">
              Verified SMC / ICT Institutional Market Structure
            </h4>
            <span className="text-xs font-mono text-slate-400">
              {structure.length} Key Structural Zones
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {structure.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#151A20]/40 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        item.type === 'FVG'
                          ? 'bg-blue-500/20 text-blue-400'
                          : item.type === 'BOS' || item.type === 'CHoCH'
                          ? 'bg-[#00C781]/20 text-[#00C781]'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-[#F4F6F8]">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#AAB3BF]">
                    {item.timeframe} · Status: {item.status}
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-slate-900 dark:text-[#F4F6F8]">
                  {item.priceLevel.toLocaleString()}
                  {item.secondaryPriceLevel && ` - ${item.secondaryPriceLevel.toLocaleString()}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. HIGH-IMPACT ECONOMIC CALENDAR */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              High-Impact Economic Calendar (USD · GBP · JPY)
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF]">
              Macroeconomic news catalysts verified against the 5 canonical instruments
            </p>
          </div>
          <Calendar size={18} className="text-[#00C781]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#252D38] text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Date / UTC</th>
                <th className="py-2.5 px-3">Currency</th>
                <th className="py-2.5 px-3">Impact</th>
                <th className="py-2.5 px-3">Event Name</th>
                <th className="py-2.5 px-3 text-right">Forecast</th>
                <th className="py-2.5 px-3 text-right">Previous</th>
                <th className="py-2.5 px-3">Affected Markets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#252D38]">
              {economicEvents.map(event => (
                <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-[#151A20] transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-500 dark:text-[#AAB3BF] whitespace-nowrap">
                    {new Date(event.scheduledTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                    {new Date(event.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-slate-800 dark:text-[#F4F6F8]">
                      {event.currency}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        event.impact === 'HIGH'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {event.impact}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-[#F4F6F8]">
                    <div>{event.name}</div>
                    {event.aiImplicationSummary && (
                      <div className="text-[10px] text-slate-500 dark:text-[#AAB3BF] font-normal mt-0.5">
                        {event.aiImplicationSummary}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{event.forecast}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">{event.previous}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {event.affectedInstruments.map(sym => (
                        <span key={sym} className="text-[10px] font-mono px-1 rounded bg-slate-200 dark:bg-[#252D38] text-slate-700 dark:text-slate-300">
                          {sym}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CALIBRATION MODAL (MATCH TO TRADINGVIEW / BROKER FEED) */}
      {showCalibrateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] shadow-2xl p-6 space-y-5 text-slate-900 dark:text-[#F4F6F8]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#252D38]">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#00C781]" />
                <h3 className="font-bold text-base">Calibrate to TradingView / Broker</h3>
              </div>
              <button
                onClick={() => setShowCalibrateModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCalibrate} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151A20] space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Instrument:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSymbol}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>TradingView Counterpart:</span>
                  <span className="font-bold text-[#00C781]">{currentQuote?.tradingViewSymbol}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Current App Reference:</span>
                  <span className="font-bold">{currentQuote?.lastPrice.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Enter Your Broker / TradingView Quote
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={targetCalibratePrice}
                    onChange={e => setTargetCalibratePrice(e.target.value)}
                    placeholder={currentQuote?.lastPrice.toString()}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#12161C] font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00C781]"
                    required
                  />
                  <span className="absolute right-3 top-3 text-[11px] font-mono text-slate-400">
                    pts
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Brokers (FTMO, Apex, Eightcap, OANDA) often quote CFDs with a slight basis differential compared to cash indices or futures. Calibrating ensures your trade entries and P&L calculations match your chart to the penny.
                </p>
              </div>

              {calibrationSuccess && (
                <div className="p-2.5 rounded-lg bg-[#00C781]/15 border border-[#00C781]/40 text-[#00C781] text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  <span>Calibrated successfully! Real-time price updated.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalibrateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-100 dark:bg-[#151A20] text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calibrating}
                  className="px-5 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold transition-all shadow-xs"
                >
                  {calibrating ? 'Saving...' : 'Apply Calibration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
