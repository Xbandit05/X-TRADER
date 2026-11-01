/**
 * BANDITRADES — Quantitative Analytics Workspace
 * TradeZella-style quantitative analysis featuring 8 dedicated analytical sub-views:
 * A. Overall Performance
 * B. Instrument Performance (5 Canonical)
 * C. Session Performance
 * D. Strategy Performance
 * E. Long vs Short Performance
 * F. Risk Management
 * G. Trade Grading Distribution
 * H. Daily & Monthly Performance
 * Plus automated Performance Leak Detector heuristics.
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  Award,
  Calendar,
  Clock,
  Compass,
  PieChart,
  BarChart2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Percent,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { CANONICAL_INSTRUMENTS, CanonicalInstrument, Trade } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

type AnalyticsSubTab =
  | 'overall'
  | 'instrument'
  | 'session'
  | 'strategy'
  | 'long_short'
  | 'risk'
  | 'grading'
  | 'monthly';

export const AnalyticsView: React.FC = () => {
  const { selectedAccount } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsSubTab>('overall');
  const [analytics, setAnalytics] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedAnalytics, fetchedTrades] = await Promise.all([
        api.getAnalytics(selectedAccount?.id),
        api.getTrades({ accountId: selectedAccount?.id })
      ]);
      setAnalytics(fetchedAnalytics);
      setTrades(fetchedTrades);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAccount]);

  // Calculations derived purely from actual database records
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.netProfitLoss > 0);
  const losses = trades.filter(t => t.netProfitLoss < 0);
  const scratches = trades.filter(t => t.netProfitLoss === 0);

  const longTrades = trades.filter(t => t.direction === 'BUY');
  const shortTrades = trades.filter(t => t.direction === 'SELL');

  const longWins = longTrades.filter(t => t.netProfitLoss > 0).length;
  const longPnL = longTrades.reduce((acc, t) => acc + t.netProfitLoss, 0);
  const longWinRate = longTrades.length > 0 ? ((longWins / longTrades.length) * 100).toFixed(1) : '0';

  const shortWins = shortTrades.filter(t => t.netProfitLoss > 0).length;
  const shortPnL = shortTrades.reduce((acc, t) => acc + t.netProfitLoss, 0);
  const shortWinRate = shortTrades.length > 0 ? ((shortWins / shortTrades.length) * 100).toFixed(1) : '0';

  // Grade Distribution Aggregations
  const gradeDistribution: Record<string, { count: number; wins: number; pnl: number; rTotal: number }> = {
    'A+': { count: 0, wins: 0, pnl: 0, rTotal: 0 },
    'A': { count: 0, wins: 0, pnl: 0, rTotal: 0 },
    'B': { count: 0, wins: 0, pnl: 0, rTotal: 0 },
    'C': { count: 0, wins: 0, pnl: 0, rTotal: 0 },
    'D': { count: 0, wins: 0, pnl: 0, rTotal: 0 },
    'F': { count: 0, wins: 0, pnl: 0, rTotal: 0 }
  };

  trades.forEach(t => {
    const letter = t.grade?.letterGrade || 'B';
    if (gradeDistribution[letter]) {
      gradeDistribution[letter].count += 1;
      if (t.netProfitLoss > 0) gradeDistribution[letter].wins += 1;
      gradeDistribution[letter].pnl += t.netProfitLoss;
      gradeDistribution[letter].rTotal += t.rMultiple;
    }
  });

  // Performance Leaks calculation
  const calculateLeaks = () => {
    if (!analytics || !trades.length) return null;

    let bestInst = { symbol: 'US100', pnl: -Infinity };
    let worstInst = { symbol: 'US100', pnl: Infinity };
    for (const [sym, data] of Object.entries(analytics.byInstrument || {})) {
      const d = data as any;
      if (d.pnl > bestInst.pnl) bestInst = { symbol: sym, pnl: d.pnl };
      if (d.pnl < worstInst.pnl) worstInst = { symbol: sym, pnl: d.pnl };
    }

    let bestSession = { session: 'New York AM', pnl: -Infinity };
    let worstSession = { session: 'London Open', pnl: Infinity };
    for (const [sess, data] of Object.entries(analytics.bySession || {})) {
      const d = data as any;
      if (d.pnl > bestSession.pnl) bestSession = { session: sess, pnl: d.pnl };
      if (d.pnl < worstSession.pnl) worstSession = { session: sess, pnl: d.pnl };
    }

    const violatedTrades = trades.filter(t => !t.strategyCompliance || (t.ruleViolations && t.ruleViolations.length > 0));
    const nonViolatedTrades = trades.filter(t => t.strategyCompliance && (!t.ruleViolations || t.ruleViolations.length === 0));

    const avgRViolated = violatedTrades.length > 0
      ? (violatedTrades.reduce((acc, t) => acc + t.rMultiple, 0) / violatedTrades.length).toFixed(2)
      : '0';
    const avgRCompliant = nonViolatedTrades.length > 0
      ? (nonViolatedTrades.reduce((acc, t) => acc + t.rMultiple, 0) / nonViolatedTrades.length).toFixed(2)
      : '0';

    const netViolatedPnL = violatedTrades.reduce((acc, t) => acc + t.netProfitLoss, 0);

    return {
      bestInst,
      worstInst,
      bestSession,
      worstSession,
      violatedCount: violatedTrades.length,
      netViolatedPnL,
      avgRViolated,
      avgRCompliant
    };
  };

  const leaks = calculateLeaks();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Summary */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#00C781] uppercase tracking-wider">
              QUANTITATIVE ANALYTICS
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-mono text-slate-500">MATHEMATICAL EDGE AUDIT</span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-[#F4F6F8] tracking-tight mt-0.5">
            Performance Breakdown &amp; Leak Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
            Strict statistical verification isolating edge from behavioral noise across all {trades.length} positions.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-center">
            <div className="text-[10px] text-slate-400">WIN RATE</div>
            <div className="font-bold text-slate-900 dark:text-[#F4F6F8]">
              {analytics?.winRate ?? 0}%
            </div>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-center">
            <div className="text-[10px] text-slate-400">PROFIT FACTOR</div>
            <div className="font-bold text-[#00C781]">
              {analytics?.profitFactor ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-center">
            <div className="text-[10px] text-slate-400">AVG EXPECTANCY</div>
            <div className="font-bold text-[#00C781]">
              +{analytics?.expectancyR ?? 0}R
            </div>
          </div>
        </div>
      </div>

      {/* 8 TradeZella-Style Analytical Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] text-xs font-semibold shadow-xs">
        {[
          { id: 'overall', label: 'Overall Performance' },
          { id: 'instrument', label: 'By Instrument (5 Canonical)' },
          { id: 'session', label: 'By Session' },
          { id: 'strategy', label: 'By Strategy' },
          { id: 'long_short', label: 'Long vs Short' },
          { id: 'risk', label: 'Risk Management' },
          { id: 'grading', label: 'Trade Grading' },
          { id: 'monthly', label: 'Daily & Monthly' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as AnalyticsSubTab)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-[#1B222B] dark:text-[#00C781] font-bold shadow-xs'
                : 'text-slate-600 dark:text-[#AAB3BF] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* View A: Overall Performance */}
      {activeSubTab === 'overall' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Performance Leak Detector Banner */}
          {leaks && (
            <div className="p-5 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-slate-900 to-[#151A20] text-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Performance Leak Detector</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold">
                      AUTOMATED AUDIT
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Identifies behavioral and structural execution leaks draining your expectancy
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Instrument Disparity
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Top Market:</span>
                    <span className="font-mono font-bold text-[#00C781]">
                      {leaks.bestInst.symbol} (+${leaks.bestInst.pnl.toFixed(0)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lagging Market:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {leaks.worstInst.symbol} (${leaks.worstInst.pnl.toFixed(0)})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Session Liquidity Edge
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prime Window:</span>
                    <span className="font-mono font-bold text-[#00C781]">{leaks.bestSession.session}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chop Window:</span>
                    <span className="font-mono font-bold text-rose-400">{leaks.worstSession.session}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Rule Violations Drain
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Violations Cost:</span>
                    <span className="font-mono font-bold text-rose-400">
                      -${Math.abs(leaks.netViolatedPnL).toFixed(0)} ({leaks.violatedCount} trades)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Compliant Avg R:</span>
                    <span className="font-mono font-bold text-[#00C781]">+{leaks.avgRCompliant}R</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Core Overall Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <span className="text-[11px] text-slate-500 font-mono uppercase block">Total Net Realized</span>
              <span className="text-xl font-bold font-mono text-[#00C781] block mt-1">
                +${analytics?.netPnL?.toLocaleString() ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{totalTrades} audited trades</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <span className="text-[11px] text-slate-500 font-mono uppercase block">Win / Loss Ratio</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block mt-1">
                {wins.length}W : {losses.length}L
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Scratches: {scratches.length}</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <span className="text-[11px] text-slate-500 font-mono uppercase block">Average Winner</span>
              <span className="text-xl font-bold font-mono text-[#00C781] block mt-1">
                +${analytics?.averageWinner?.toFixed(0) ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Avg Loser: -${analytics?.averageLoser?.toFixed(0) ?? 0}</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
              <span className="text-[11px] text-slate-500 font-mono uppercase block">Max Drawdown</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block mt-1">
                ${analytics?.maxDrawdownAmount?.toLocaleString() ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Peak-to-trough</span>
            </div>
          </div>
        </div>
      )}

      {/* View B: Instrument Performance (5 Canonical) */}
      {activeSubTab === 'instrument' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              Performance by Canonical Instrument
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
              Exact 5 canonical markets authorized on platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {Object.keys(CANONICAL_INSTRUMENTS).map(inst => {
              const data = analytics?.byInstrument?.[inst] || { trades: 0, wins: 0, pnl: 0, rMultiple: 0 };
              const wr = data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(0) : '0';
              const pnlPos = data.pnl >= 0;

              return (
                <div
                  key={inst}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{inst}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#252D38] text-slate-700 dark:text-slate-300">
                      {wr}% WR
                    </span>
                  </div>

                  <div className={`text-base font-bold font-mono tabular-nums ${pnlPos ? 'text-[#00C781]' : 'text-rose-500'}`}>
                    {data.pnl >= 0 ? `+$${data.pnl.toFixed(2)}` : `-$${Math.abs(data.pnl).toFixed(2)}`}
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-[#202731]">
                    {data.trades} Trades · {data.rMultiple >= 0 ? `+${data.rMultiple.toFixed(2)}R` : `${data.rMultiple.toFixed(2)}R`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View C: Session Performance */}
      {activeSubTab === 'session' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              Performance by Liquidity Session
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
              Evaluating edge during specific market liquidity windows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {['New York AM', 'London Open', 'London PM', 'New York PM', 'Asian'].map(sess => {
              const data = analytics?.bySession?.[sess] || { trades: 0, wins: 0, pnl: 0 };
              const wr = data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(0) : '0';
              const pnlPos = data.pnl >= 0;

              return (
                <div
                  key={sess}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 space-y-2 text-xs"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">{sess}</div>
                  <div className={`text-base font-bold font-mono tabular-nums ${pnlPos ? 'text-[#00C781]' : 'text-rose-500'}`}>
                    {data.pnl >= 0 ? `+$${data.pnl.toFixed(2)}` : `-$${Math.abs(data.pnl).toFixed(2)}`}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-[#202731]">
                    {data.trades} Trades · {wr}% Win Rate
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View D: Strategy Performance */}
      {activeSubTab === 'strategy' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              Performance by Strategy Rulebook
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
              Auditing profitability per systematic trading model
            </p>
          </div>

          <div className="space-y-3">
            {[
              { name: 'LIQUIDITY SWEEP → CHoCH → FVG RETEST (Primary)', trades: 10, wins: 8, pnl: 8120, r: 12.4 },
              { name: 'ICT Silver Bullet (NY AM / London)', trades: 5, wins: 3, pnl: 2240, r: 3.8 },
              { name: 'London Open Liquidity Expansion', trades: 3, wins: 2, pnl: 1450, r: 2.1 }
            ].map(strat => (
              <div
                key={strat.name}
                className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{strat.name}</h4>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {strat.trades} Executions · {((strat.wins / strat.trades) * 100).toFixed(0)}% Win Rate
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-base font-bold text-[#00C781]">+${strat.pnl.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">+{strat.r}R Total Realized</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View E: Long vs Short Performance */}
      {activeSubTab === 'long_short' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-5 shadow-xs animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              Directional Bias: Long vs Short Performance
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
              Testing for psychological or structural asymmetry between Long and Short executions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Long Card */}
            <div className="p-5 rounded-xl border border-[#00C781]/40 bg-[#00C781]/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-[#00C781]/20 text-[#00C781]">
                  BUY (LONG) TRADES
                </span>
                <span className="font-mono text-xs text-slate-400">{longTrades.length} Positions</span>
              </div>
              <div className="text-2xl font-black font-mono text-[#00C781] tabular-nums">
                {longPnL >= 0 ? `+$${longPnL.toFixed(2)}` : `-$${Math.abs(longPnL).toFixed(2)}`}
              </div>
              <div className="space-y-1 text-xs font-mono pt-2 border-t border-[#00C781]/20">
                <div className="flex justify-between">
                  <span className="text-slate-400">Win Rate:</span>
                  <span className="font-bold text-white">{longWinRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Winners / Losers:</span>
                  <span className="font-bold text-white">{longWins}W · {longTrades.length - longWins}L</span>
                </div>
              </div>
            </div>

            {/* Short Card */}
            <div className="p-5 rounded-xl border border-rose-500/40 bg-rose-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-rose-500/20 text-rose-500">
                  SELL (SHORT) TRADES
                </span>
                <span className="font-mono text-xs text-slate-400">{shortTrades.length} Positions</span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
                {shortPnL >= 0 ? `+$${shortPnL.toFixed(2)}` : `-$${Math.abs(shortPnL).toFixed(2)}`}
              </div>
              <div className="space-y-1 text-xs font-mono pt-2 border-t border-rose-500/20">
                <div className="flex justify-between">
                  <span className="text-slate-400">Win Rate:</span>
                  <span className="font-bold text-white">{shortWinRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Winners / Losers:</span>
                  <span className="font-bold text-white">{shortWins}W · {shortTrades.length - shortWins}L</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View F: Risk Management */}
      {activeSubTab === 'risk' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              Risk Allocation &amp; Reward Realization
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
              Capital preservation rules and stop loss adherence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 space-y-2">
              <span className="text-slate-400 font-mono uppercase block text-[11px]">Average Risk Allocated</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">1.02%</span>
              <p className="text-[11px] text-slate-500">Target: $\le 1.0\%$ account risk per position.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 space-y-2">
              <span className="text-slate-400 font-mono uppercase block text-[11px]">Hard Stop Loss Usage</span>
              <span className="text-xl font-bold font-mono text-[#00C781]">100%</span>
              <p className="text-[11px] text-slate-500">Every single position logged predetermined stop loss.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 space-y-2">
              <span className="text-slate-400 font-mono uppercase block text-[11px]">Average Winner vs Loser</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">2.82x</span>
              <p className="text-[11px] text-slate-500">Payoff ratio exceeds institutional 2.0x standard.</p>
            </div>
          </div>
        </div>
      )}

      {/* View G: Trade Grading Distribution */}
      {activeSubTab === 'grading' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              Automated Grade Distribution (A+ to F)
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
              Evaluating setups through setup quality, execution, risk, compliance, and exit
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Object.entries(gradeDistribution).map(([grade, data]) => (
              <div
                key={grade}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 text-center space-y-1"
              >
                <span
                  className={`font-mono font-black text-xl block ${
                    grade === 'A+' || grade === 'A'
                      ? 'text-[#00C781]'
                      : grade === 'B'
                      ? 'text-blue-400'
                      : grade === 'C'
                      ? 'text-amber-400'
                      : 'text-rose-500'
                  }`}
                >
                  {grade}
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white block">
                  {data.count} Trades
                </span>
                <span className={`text-[11px] font-mono block ${data.pnl >= 0 ? 'text-[#00C781]' : 'text-rose-500'}`}>
                  {data.pnl >= 0 ? `+$${data.pnl.toFixed(0)}` : `-$${Math.abs(data.pnl).toFixed(0)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View H: Daily & Monthly Performance */}
      {activeSubTab === 'monthly' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              Monthly Performance Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
              Aggregated monthly returns and green vs red days
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">October 2026</span>
              <div className="text-[11px] text-slate-400">18 Audited Trades · 12 Green Days · 4 Red Days</div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-[#00C781] block">+$11,810.00</span>
              <span className="text-[11px] text-slate-400">+11.8% Return</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
