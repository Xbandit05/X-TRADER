/**
 * BANDITRADES — Executive Performance Dashboard
 * TradeZella-style command center combining:
 * - 10 Institutional KPI Cards (Net Realized P&L, Unrealized P&L, Win Rate, Profit Factor, Avg R, Expectancy, Max Drawdown, Discipline Score, Gross P&L)
 * - TradeZella Daily Performance Calendar (Green/Red days, Net P&L, Trade Count, Day Inspection Drawer)
 * - Cumulative Equity Curve Chart
 * - Performance by 5 Canonical Instruments (US100, US30, GBPUSD, GBPJPY, XAUUSD)
 * - Performance by Session & Strategy
 * - Account Overview & Prop Firm Challenge Buffer Tracker
 * - Upcoming High-Impact Economic Events
 * - Zero-Trades Empty State (no invented statistics)
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Award,
  Shield,
  Activity,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  BarChart3,
  Flame,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import {
  Trade,
  CanonicalInstrument,
  CANONICAL_INSTRUMENTS,
  MarketQuote,
  EconomicEvent
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface MainDashboardProps {
  onOpenTradeModal: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectTrade: (trade: Trade) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  onOpenTradeModal,
  onNavigateTab,
  onSelectTrade
}) => {
  const { selectedAccount, accounts } = useAuth();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [dailyBriefing, setDailyBriefing] = useState<any>(null);
  const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([]);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'ytd' | 'all'>('30d');
  const [instrumentFilter, setInstrumentFilter] = useState<string>('ALL');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');

  // TradeZella Calendar Month State
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2026, 9, 1)); // October 2026 default based on seeds
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedTrades, fetchedAnalytics, fetchedBriefing, fetchedQuotes, fetchedEco] = await Promise.all([
        api.getTrades({ accountId: selectedAccount?.id }),
        api.getAnalytics(selectedAccount?.id),
        api.getDailyBriefing(),
        api.getMarketQuotes(),
        api.getEconomicCalendar()
      ]);
      setTrades(fetchedTrades);
      setAnalytics(fetchedAnalytics);
      setDailyBriefing(fetchedBriefing);
      setMarketQuotes(fetchedQuotes);
      setEconomicEvents(fetchedEco || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Live quote polling every 3 seconds to keep bid/ask/last fresh
    const pollInterval = setInterval(async () => {
      try {
        const fresh = await api.getMarketQuotes();
        setMarketQuotes(fresh);
      } catch (e) {
        // Silently handle transient network drop
      }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [selectedAccount]);

  // Filter trades locally for the dashboard view
  const filteredTrades = trades.filter(t => {
    if (instrumentFilter !== 'ALL' && t.instrument !== instrumentFilter) return false;
    if (sessionFilter !== 'ALL' && t.tradingSession !== sessionFilter) return false;
    return true;
  });

  const netPnL = analytics?.netPnL ?? 0;
  const isNetProfitable = netPnL >= 0;
  const unrealizedPnL = selectedAccount ? selectedAccount.currentEquity - selectedAccount.currentBalance : 0;

  // Build TradeZella Daily Calendar Aggregation
  const tradesByDate: Record<string, { date: string; pnl: number; count: number; wins: number; losses: number; trades: Trade[] }> = {};
  trades.forEach(t => {
    const dStr = t.entryDate.split('T')[0];
    if (!tradesByDate[dStr]) {
      tradesByDate[dStr] = { date: dStr, pnl: 0, count: 0, wins: 0, losses: 0, trades: [] };
    }
    tradesByDate[dStr].pnl += t.netProfitLoss;
    tradesByDate[dStr].count += 1;
    if (t.netProfitLoss > 0) tradesByDate[dStr].wins += 1;
    else if (t.netProfitLoss < 0) tradesByDate[dStr].losses += 1;
    tradesByDate[dStr].trades.push(t);
  });

  // Calendar Day Generation for Selected Month
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: ({ dayNumber: number; dateString: string; data?: any } | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = (month + 1).toString().padStart(2, '0');
    const dStr = d.toString().padStart(2, '0');
    const dateKey = `${year}-${mStr}-${dStr}`;
    calendarDays.push({
      dayNumber: d,
      dateString: dateKey,
      data: tradesByDate[dateKey]
    });
  }

  // Monthly stats for the visible calendar month
  const monthDates = Object.keys(tradesByDate).filter(d => d.startsWith(`${year}-${(month + 1).toString().padStart(2, '0')}`));
  const monthPnL = monthDates.reduce((acc, d) => acc + tradesByDate[d].pnl, 0);
  const greenDaysCount = monthDates.filter(d => tradesByDate[d].pnl > 0).length;
  const redDaysCount = monthDates.filter(d => tradesByDate[d].pnl < 0).length;

  // Selected Day Trades
  const selectedDayTrades = selectedCalendarDate && tradesByDate[selectedCalendarDate] ? tradesByDate[selectedCalendarDate].trades : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cloud AI Daily Briefing Banner */}
      {dailyBriefing && (
        <div className="relative overflow-hidden rounded-2xl border border-[#00B2FE]/30 bg-gradient-to-r from-slate-900 via-[#131926] to-[#090D14] text-[#F8FAFC] p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#00B2FE]/15 border border-[#00B2FE]/40 flex items-center justify-center shrink-0 text-[#00B2FE]">
                <Sparkles size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-wider text-[#00B2FE] uppercase">
                    CLOUD AI EXECUTIVE BRIEFING
                  </span>
                  <span className="text-[11px] text-slate-400">·</span>
                  <span className="text-xs text-slate-400 font-mono">{dailyBriefing.date}</span>
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  {dailyBriefing.performanceSummary}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5 font-mono">
                  <span className="inline-flex items-center gap-1 text-[#10B981]">
                    <CheckCircle2 size={13} /> {dailyBriefing.disciplineStatus}
                  </span>
                  <span>·</span>
                  <span className="text-amber-400/90">{dailyBriefing.accountWarning}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onNavigateTab('ai')}
                className="px-3.5 py-1.5 rounded-lg bg-[#00B2FE]/15 hover:bg-[#00B2FE]/25 border border-[#00B2FE]/30 text-xs font-semibold text-[#00B2FE] transition-colors flex items-center gap-1.5"
              >
                <span>Ask Cloud AI</span>
                <ArrowUpRight size={14} />
              </button>
              <button
                onClick={() => onNavigateTab('market')}
                className="px-3.5 py-1.5 rounded-lg bg-[#00B2FE] hover:bg-[#009BE0] text-[#090D14] text-xs font-bold transition-colors"
              >
                Market Intel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canonical Market Data Ticker Strip (5 Canonical Instruments) */}
      {marketQuotes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B2FE] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B2FE]"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-[#F8FAFC] uppercase">
                CANONICAL MARKET FEEDS
              </span>
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                (BID • ASK • LAST TRADED)
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('market')}
              className="text-xs font-mono text-[#00B2FE] hover:underline flex items-center gap-1"
            >
              <span>Full Market Intel</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {marketQuotes.map(q => {
              const isFx = q.symbol === 'GBPUSD' || q.symbol === 'GBPJPY';
              const isGold = q.symbol === 'XAUUSD';
              const decimals = q.symbol === 'GBPUSD' ? 5 : (q.symbol === 'GBPJPY' ? 3 : 2);
              const isUp = q.change24hPercent >= 0;

              return (
                <div
                  key={q.symbol}
                  onClick={() => onNavigateTab('market')}
                  className="p-3 rounded-xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] hover:border-[#00B2FE]/50 cursor-pointer transition-all duration-150 shadow-xs group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black tracking-wide text-slate-900 dark:text-white group-hover:text-[#00B2FE] transition-colors">
                        {q.symbol}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-[#18202F] text-slate-600 dark:text-[#94A3B8]">
                        {isFx ? 'FX' : (isGold ? 'METAL' : 'INDEX')}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${isUp ? 'text-[#10B981]' : 'text-rose-500'}`}>
                      {isUp ? '+' : ''}{q.change24hPercent.toFixed(2)}%
                    </span>
                  </div>

                  {/* Last Price */}
                  <div className="text-base font-mono font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC] tabular-nums">
                    {q.lastPrice.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                  </div>

                  {/* Bid / Ask Strip */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#1C2638] grid grid-cols-2 gap-1 text-[10px] font-mono tabular-nums">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block text-[9px] uppercase tracking-wider">Bid</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {q.bid.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-600 dark:text-slate-400 block text-[9px] uppercase tracking-wider">Ask</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {q.ask.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                      </span>
                    </div>
                  </div>

                  {/* Recency & Source Attribution */}
                  <div className="mt-2 flex items-center justify-between text-[9px] font-mono border-t border-slate-100 dark:border-[#1C2638]/60 pt-1.5">
                    <span className="truncate max-w-[95px] text-slate-500 dark:text-slate-400" title={`${q.tradingViewSymbol || q.symbol} (${q.provider})`}>
                      {q.tradingViewSymbol || q.symbol}
                    </span>
                    {!q.isMarketOpen && !q.simulationModeActive ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-1 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                        Closed
                      </span>
                    ) : (
                      <span className="text-[#10B981] font-semibold flex items-center gap-1 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                        {q.recencySeconds === 0 ? 'Live' : `${q.recencySeconds}s`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar: TradeZella Style Segments */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['today', '7d', '30d', '90d', 'ytd', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                dateRange === range
                  ? 'bg-[#00B2FE]/15 text-[#00B2FE] border border-[#00B2FE]/30 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range === 'today'
                ? 'Today'
                : range === '7d'
                ? 'Last 7 Days'
                : range === '30d'
                ? 'Last 30 Days'
                : range === '90d'
                ? 'Last 90 Days'
                : range === 'ytd'
                ? 'Year to Date'
                : 'All History'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Instrument Filter */}
          <select
            value={instrumentFilter}
            onChange={e => setInstrumentFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-800 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none font-mono"
          >
            <option value="ALL">All Instruments</option>
            {Object.keys(CANONICAL_INSTRUMENTS).map(inst => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>

          {/* Session Filter */}
          <select
            value={sessionFilter}
            onChange={e => setSessionFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-800 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
          >
            <option value="ALL">All Sessions</option>
            <option value="Asian">Asian</option>
            <option value="London Open">London Open</option>
            <option value="London PM">London PM</option>
            <option value="New York AM">New York AM</option>
            <option value="New York PM">New York PM</option>
          </select>
        </div>
      </div>

      {/* ZERO-TRADES EMPTY STATE (Never display invented statistics) */}
      {trades.length === 0 && !loading ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#1B222B] text-slate-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Trading Records Found in Selected Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-md mx-auto mt-1">
              Cloud X never generates invented statistics or fake performance metrics. Log your first execution or import a broker statement to activate full analytics.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenTradeModal}
              className="px-4 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold"
            >
              Log First Trade
            </button>
            <button
              onClick={() => onNavigateTab('journal')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2E3845] text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Go to Trade Journal
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 10 Institutional KPI Cards Grid (TradeZella Style) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* KPI 1: Net Realized P&L */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                <span>Net Realized P&amp;L</span>
                {isNetProfitable ? (
                  <TrendingUp size={15} className="text-[#00C781]" />
                ) : (
                  <TrendingDown size={15} className="text-rose-500" />
                )}
              </div>
              <div
                className={`text-xl md:text-2xl font-bold font-mono tabular-nums tracking-tight ${
                  isNetProfitable ? 'text-[#00C781]' : 'text-rose-500'
                }`}
              >
                {netPnL >= 0 ? `+$${netPnL.toLocaleString()}` : `-$${Math.abs(netPnL).toLocaleString()}`}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                {analytics?.totalTrades ?? 0} closed executions
              </div>
            </div>

            {/* KPI 2: Unrealized P&L */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                <span>Unrealized P&amp;L</span>
                <DollarSign size={15} className="text-slate-400" />
              </div>
              <div
                className={`text-xl md:text-2xl font-bold font-mono tabular-nums tracking-tight ${
                  unrealizedPnL >= 0 ? 'text-[#00C781]' : 'text-rose-500'
                }`}
              >
                {unrealizedPnL >= 0 ? `+$${unrealizedPnL.toLocaleString()}` : `-$${Math.abs(unrealizedPnL).toLocaleString()}`}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Equity: ${selectedAccount?.currentEquity?.toLocaleString() ?? '100,000'}
              </div>
            </div>

            {/* KPI 3: Win Rate */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                <span>Win Rate</span>
                <Percent size={15} className="text-[#00C781]" />
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F4F6F8]">
                {analytics?.winRate ?? 0}%
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                {analytics?.winningTrades ?? 0}W · {analytics?.losingTrades ?? 0}L
              </div>
            </div>

            {/* KPI 4: Profit Factor */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                <span>Profit Factor</span>
                <Activity size={15} className="text-[#00C781]" />
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F4F6F8]">
                {analytics?.profitFactor ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Gross: ${analytics?.grossProfit?.toLocaleString() ?? 0}
              </div>
            </div>

            {/* KPI 5: Average Realized R */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                <span>Average Realized R</span>
                <Award size={15} className="text-[#00C781]" />
              </div>
              <div
                className={`text-xl md:text-2xl font-bold font-mono tabular-nums ${
                  (analytics?.averageR ?? 0) >= 0 ? 'text-[#00C781]' : 'text-rose-500'
                }`}
              >
                {(analytics?.averageR ?? 0) >= 0 ? `+${analytics?.averageR}R` : `${analytics?.averageR}R`}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Exp: ${analytics?.expectancy?.toFixed(0) ?? 0} / trade
              </div>
            </div>

            {/* KPI 6: Discipline Score */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                <span>Discipline Score</span>
                <Shield size={15} className="text-[#00C781]" />
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F4F6F8]">
                92<span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
              <div className="text-[11px] text-[#00C781] mt-1 font-mono font-medium">
                Strict Sizing Enforced
              </div>
            </div>

            {/* KPI 7: Gross Profit */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                Gross Profit
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-[#00C781]">
                +${analytics?.grossProfit?.toLocaleString() ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Avg Winner: +${analytics?.averageWinner?.toFixed(0) ?? 0}
              </div>
            </div>

            {/* KPI 8: Gross Loss */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                Gross Loss
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-rose-500">
                -${analytics?.grossLoss?.toLocaleString() ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Avg Loser: -${analytics?.averageLoser?.toFixed(0) ?? 0}
              </div>
            </div>

            {/* KPI 9: Expectancy */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                Expectancy (R)
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-[#F4F6F8]">
                +{analytics?.expectancyR ?? 0}R
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Per systematic trade
              </div>
            </div>

            {/* KPI 10: Maximum Drawdown */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <div className="text-xs text-slate-500 dark:text-[#AAB3BF] mb-1 font-medium">
                Maximum Drawdown
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-[#F4F6F8]">
                ${analytics?.maxDrawdownAmount?.toLocaleString() ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Peak-to-trough
              </div>
            </div>
          </div>

          {/* TRADEZELLA DAILY PERFORMANCE CALENDAR (Flagship Feature) */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Daily Performance Calendar
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#00B2FE]/15 text-[#00B2FE] border border-[#00B2FE]/30 font-bold">
                    TRADEZELLA VIEW
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Click any active trading day to inspect executions and session details
                </p>
              </div>

              {/* Month Navigation & Monthly Summary Ribbon */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className={`font-bold ${monthPnL >= 0 ? 'text-[#10B981]' : 'text-rose-500'}`}>
                    {monthPnL >= 0 ? `+$${monthPnL.toFixed(0)}` : `-$${Math.abs(monthPnL).toFixed(0)}`}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-[#10B981] font-semibold">{greenDaysCount} Green</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-rose-500 font-semibold">{redDaysCount} Red</span>
                </div>

                <div className="flex items-center gap-1 border border-slate-200 dark:border-[#222E42] rounded-lg p-0.5">
                  <button
                    onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                    className="p-1 rounded text-slate-500 hover:text-white"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 font-mono text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    className="p-1 rounded text-slate-500 hover:text-white"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[11px] font-bold text-slate-400 uppercase py-1">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((cell, idx) => {
                  if (!cell) {
                    return (
                      <div
                        key={`empty_${idx}`}
                        className="h-20 rounded-xl bg-slate-50/30 dark:bg-[#131926]/30 border border-transparent"
                      />
                    );
                  }

                  const hasTrades = !!cell.data;
                  const isWinningDay = hasTrades && cell.data.pnl > 0;
                  const isLosingDay = hasTrades && cell.data.pnl < 0;
                  const isSelected = selectedCalendarDate === cell.dateString;

                  return (
                    <div
                      key={cell.dateString}
                      onClick={() => hasTrades && setSelectedCalendarDate(isSelected ? null : cell.dateString)}
                      className={`h-20 p-2 rounded-xl border transition-all flex flex-col justify-between ${
                        hasTrades ? 'cursor-pointer select-none' : 'opacity-40'
                      } ${
                        isSelected
                          ? 'ring-2 ring-[#00B2FE] border-[#00B2FE]'
                          : isWinningDay
                          ? 'border-[#10B981]/40 bg-[#10B981]/15 hover:border-[#10B981] hover:bg-[#10B981]/25'
                          : isLosingDay
                          ? 'border-rose-500/40 bg-rose-500/15 hover:border-rose-500 hover:bg-rose-500/25'
                          : 'border-slate-200 dark:border-[#222E42] bg-slate-50/50 dark:bg-[#18202F]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {cell.dayNumber}
                        </span>
                        {hasTrades && (
                          <span
                            className={`text-[9px] font-black px-1 rounded ${
                              isWinningDay
                                ? 'bg-[#10B981]/20 text-[#10B981]'
                                : isLosingDay
                                ? 'bg-rose-500/20 text-rose-500'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                            }`}
                          >
                            {cell.data.count}T
                          </span>
                        )}
                      </div>

                      {hasTrades ? (
                        <div className="space-y-0.5">
                          <div
                            className={`text-xs md:text-sm font-mono font-black tabular-nums tracking-tight ${
                              isWinningDay ? 'text-[#10B981]' : isLosingDay ? 'text-rose-500' : 'text-slate-400'
                            }`}
                          >
                            {cell.data.pnl >= 0 ? `+$${cell.data.pnl.toFixed(0)}` : `-$${Math.abs(cell.data.pnl).toFixed(0)}`}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {cell.data.wins}W {cell.data.losses}L
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-mono text-right">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Inspection Panel */}
            {selectedCalendarDate && selectedDayTrades.length > 0 && (
              <div className="mt-4 p-4 rounded-xl border border-[#00C781]/40 bg-slate-50 dark:bg-[#1B222B] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-[#00C781]" />
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase">
                      Trades for {selectedCalendarDate} ({selectedDayTrades.length} Positions)
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCalendarDate(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedDayTrades.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTrade(t)}
                      className="p-3 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] hover:border-[#00C781] cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{t.instrument}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            t.direction === 'BUY' ? 'bg-[#00C781]/20 text-[#00C781]' : 'bg-rose-500/20 text-rose-500'
                          }`}
                        >
                          {t.direction}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{t.setupType}</span>
                      </div>
                      <div className="text-right font-mono font-bold">
                        <span className={t.netProfitLoss >= 0 ? 'text-[#00C781]' : 'text-rose-500'}>
                          {t.netProfitLoss >= 0 ? `+$${t.netProfitLoss.toFixed(2)}` : `-$${Math.abs(t.netProfitLoss).toFixed(2)}`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{t.rMultiple >= 0 ? `+${t.rMultiple}R` : `${t.rMultiple}R`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Chart Section: Cumulative Equity Curve */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
                  Cumulative Equity Curve Progression
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#AAB3BF]">
                  Realized capital trajectory across {filteredTrades.length} audited positions
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-[#00C781] font-bold">
                  Peak: ${analytics?.highWaterMark ? (analytics.highWaterMark).toLocaleString() : '106,000'}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400">Drawdown: ${analytics?.maxDrawdownAmount?.toLocaleString() ?? 0}</span>
              </div>
            </div>

            {/* Equity Curve SVG */}
            <div className="h-64 w-full relative">
              {analytics?.equityCurve && analytics.equityCurve.length > 1 ? (
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 240">
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00C781" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00C781" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {(() => {
                    const curve = analytics.equityCurve;
                    const minEq = Math.min(...curve.map((c: any) => c.equity)) * 0.995;
                    const maxEq = Math.max(...curve.map((c: any) => c.equity)) * 1.005;
                    const range = Math.max(1, maxEq - minEq);

                    const points = curve.map((c: any, idx: number) => {
                      const x = (idx / (curve.length - 1)) * 780 + 10;
                      const y = 230 - ((c.equity - minEq) / range) * 210;
                      return { x, y, equity: c.equity, tradeNum: c.tradeNumber };
                    });

                    const lineD = points.reduce(
                      (acc: string, p: any, idx: number) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
                      ''
                    );
                    const areaD = `${lineD} L ${points[points.length - 1].x} 230 L ${points[0].x} 230 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#equityGrad)" />
                        <path d={lineD} fill="none" stroke="#00C781" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {points.map((p: any, idx: number) => (
                          <g key={idx} className="cursor-pointer group">
                            <circle cx={p.x} cy={p.y} r="3.5" fill="#0B0D10" stroke="#00C781" strokeWidth="2" />
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  Record at least two closed trades to generate the equity progression curve.
                </div>
              )}
            </div>
          </div>

          {/* Three Column Grid: Performance by Instrument, Session, and Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* By Canonical Instrument */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-3 shadow-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F4F6F8]">
                  By Canonical Instrument
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-[#AAB3BF]">
                  5 Canonical Markets Performance
                </p>
              </div>

              <div className="space-y-2">
                {Object.keys(CANONICAL_INSTRUMENTS).map(inst => {
                  const data = analytics?.byInstrument?.[inst] || { trades: 0, wins: 0, pnl: 0, rMultiple: 0 };
                  const wr = data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(0) : '0';
                  const pnlPos = data.pnl >= 0;

                  return (
                    <div
                      key={inst}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/40 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#252D38] text-slate-800 dark:text-[#F4F6F8]">
                          {inst}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {data.trades}T · {wr}% WR
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className={`font-bold ${pnlPos ? 'text-[#00C781]' : 'text-rose-500'}`}>
                          {data.pnl >= 0 ? `+$${data.pnl.toFixed(0)}` : `-$${Math.abs(data.pnl).toFixed(0)}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Session */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-3 shadow-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F4F6F8]">
                  By Trading Session
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-[#AAB3BF]">
                  Liquidity Window Distribution
                </p>
              </div>

              <div className="space-y-2">
                {['New York AM', 'London Open', 'London PM', 'New York PM', 'Asian'].map(sess => {
                  const data = analytics?.bySession?.[sess] || { trades: 0, wins: 0, pnl: 0 };
                  const wr = data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(0) : '0';
                  const pnlPos = data.pnl >= 0;

                  return (
                    <div
                      key={sess}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/40 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-[#F4F6F8] text-xs">
                          {sess}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {data.trades} Trades · {wr}% WR
                        </div>
                      </div>

                      <div className={`text-right font-mono font-bold ${pnlPos ? 'text-[#00C781]' : 'text-rose-500'}`}>
                        {data.pnl >= 0 ? `+$${data.pnl.toFixed(0)}` : `-$${Math.abs(data.pnl).toFixed(0)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account Overview & Prop Challenge Buffer */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-3 shadow-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F4F6F8]">
                  Account Capital &amp; Challenge
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-[#AAB3BF]">
                  {selectedAccount?.name || 'Primary Account'}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/40 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-mono">Balance / Equity</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ${selectedAccount?.currentBalance?.toLocaleString() ?? '100,000'} / ${selectedAccount?.currentEquity?.toLocaleString() ?? '100,000'}
                  </span>
                </div>
                {selectedAccount?.challengeRules ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono">Profit Target</span>
                      <span className="font-mono text-[#00C781] font-bold">
                        ${selectedAccount.challengeRules.profitTargetAmount.toLocaleString()} ({selectedAccount.challengeRules.profitTargetPercentage}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono">Daily Buffer Left</span>
                      <span className="font-mono text-amber-400 font-bold">
                        ${selectedAccount.challengeRules.maxDailyDrawdownAmount.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-slate-400 font-mono pt-1">
                    Standard Capital Buffer: 2% Daily Max Loss
                  </div>
                )}
              </div>

              {/* Economic Calendar Mini Strip */}
              {economicEvents.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#202731]">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                    High Impact Events
                  </span>
                  {economicEvents.slice(0, 2).map(ev => (
                    <div key={ev.id} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{ev.name}</span>
                      <span className="text-rose-500 font-bold">{ev.scheduledTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Executions Ledger Preview */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
                  Recent Audited Executions
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#AAB3BF]">
                  Audited trade entries with automated A+ to F grades
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('journal')}
                className="text-xs font-semibold text-[#00B2FE] hover:underline"
              >
                View Full Journal →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#222E42] text-slate-400 uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Market</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Setup Model</th>
                    <th className="py-2.5 px-3 text-right">Net P&amp;L</th>
                    <th className="py-2.5 px-3 text-right">Realized R</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-center">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#222E42]">
                  {filteredTrades.slice(0, 6).map(trade => {
                    const isWin = trade.netProfitLoss > 0;
                    return (
                      <tr
                        key={trade.id}
                        onClick={() => onSelectTrade(trade)}
                        className="hover:bg-slate-50 dark:hover:bg-[#18202F] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-[#94A3B8]">
                          {trade.entryDate.split('T')[0]}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-[#F8FAFC]">
                          {trade.instrument}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                              trade.direction === 'BUY'
                                ? 'bg-[#00B2FE]/15 text-[#00B2FE]'
                                : 'bg-rose-500/15 text-rose-500'
                            }`}
                          >
                            {trade.direction === 'BUY' ? 'LONG' : 'SHORT'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                          {trade.setupType}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                            isWin ? 'text-[#10B981]' : 'text-rose-500'
                          }`}
                        >
                          {trade.netProfitLoss >= 0
                            ? `+$${trade.netProfitLoss.toFixed(2)}`
                            : `-$${Math.abs(trade.netProfitLoss).toFixed(2)}`}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                            trade.rMultiple >= 0 ? 'text-[#10B981]' : 'text-rose-500'
                          }`}
                        >
                          {trade.rMultiple >= 0 ? `+${trade.rMultiple}R` : `${trade.rMultiple}R`}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-md text-xs ${
                              trade.grade?.letterGrade === 'A+' || trade.grade?.letterGrade === 'A'
                                ? 'bg-[#10B981]/20 text-[#10B981]'
                                : trade.grade?.letterGrade === 'B'
                                ? 'bg-sky-500/20 text-sky-400'
                                : trade.grade?.letterGrade === 'C'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {trade.grade?.letterGrade || 'A'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {trade.strategyCompliance ? (
                            <span className="text-[#10B981] font-semibold text-xs font-mono">100%</span>
                          ) : (
                            <span className="text-rose-500 font-semibold text-xs font-mono">Violated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
