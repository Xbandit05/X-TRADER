/**
 * BANDITRADES — Explainable Trade Grading Engine (A+ to F)
 * Institutional trade scoring system prioritizing process discipline over pure P&L
 */

import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Settings,
  Sparkles,
  Search,
  Filter,
  BarChart,
  ArrowRight
} from 'lucide-react';
import { Trade, TradeGrade, TradeGradeLetter } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface TradeGradingViewProps {
  onSelectTrade: (trade: Trade) => void;
}

export const TradeGradingView: React.FC<TradeGradingViewProps> = ({ onSelectTrade }) => {
  const { selectedAccount } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [gradeFilter, setGradeFilter] = useState<'ALL' | TradeGradeLetter>('ALL');
  const [loading, setLoading] = useState(true);

  // Custom Grading Weights State (User configurable)
  const [weights, setWeights] = useState({
    setupQuality: 25,
    entryExecution: 20,
    riskManagement: 20,
    strategyCompliance: 20,
    exitExecution: 15
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getTrades({ accountId: selectedAccount?.id });
      setTrades(data);
      if (data.length > 0) {
        setSelectedTrade(data[0]);
      }
    } catch (err) {
      console.error('Failed to load trades for grading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAccount]);

  const filteredTrades = trades.filter(t => {
    if (gradeFilter === 'ALL') return true;
    return t.grade?.letterGrade === gradeFilter;
  });

  const grade = selectedTrade?.grade;

  // Grade color badges
  const getGradeColor = (letter?: TradeGradeLetter) => {
    switch (letter) {
      case 'A+':
      case 'A':
        return 'text-[#00C781] bg-[#00C781]/15 border-[#00C781]/40';
      case 'B':
        return 'text-blue-400 bg-blue-500/15 border-blue-500/40';
      case 'C':
        return 'text-amber-400 bg-amber-500/15 border-amber-500/40';
      case 'D':
      case 'F':
        return 'text-red-400 bg-red-500/15 border-red-500/40';
      default:
        return 'text-slate-400 bg-slate-500/15 border-slate-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Educational Banner: The Golden Rule of Trade Grading */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-slate-50 dark:bg-[#151A20] flex items-start gap-3.5">
        <Award size={22} className="text-[#00C781] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#F4F6F8]">
            The Core Principle of BANDIT Grading: Outcome vs. Execution
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#AAB3BF] leading-relaxed">
            A profitable trade does <strong>not</strong> automatically receive a high grade. In institutional trading, a trader can make money through reckless luck and receive an <strong>F</strong>. Conversely, a cleanly accepted stop loss executed with 100% strategy compliance and proper sizing can receive an <strong>A+</strong>.
          </p>
        </div>
      </div>

      {/* Grade Distribution Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'A+', 'A', 'B', 'C', 'D', 'F'] as const).map(g => {
            const count = g === 'ALL' ? trades.length : trades.filter(t => t.grade?.letterGrade === g).length;
            return (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  gradeFilter === g
                    ? 'bg-slate-900 text-white dark:bg-[#252D38] dark:text-[#00C781] shadow-xs'
                    : 'text-slate-600 dark:text-[#AAB3BF] hover:bg-slate-100 dark:hover:bg-[#151A20]'
                }`}
              >
                <span>{g === 'ALL' ? 'All Grades' : `Grade ${g}`}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-[#AAB3BF]">
          Thresholds: A+ (97-100) · A (90-96) · B (80-89) · C (70-79) · D (60-69) · F (&lt;60)
        </div>
      </div>

      {/* 2-Column Split: Trades Selection List (Left) & Full Explainable Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Trades List (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-3">
          <div className="text-xs font-bold text-slate-500 dark:text-[#AAB3BF] uppercase tracking-wider">
            Select Trade to Inspect
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredTrades.map(t => {
              const isSelected = selectedTrade?.id === t.id;
              const isWin = t.netProfitLoss > 0;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrade(t)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#00C781]/60 bg-slate-50 dark:bg-[#222B36] shadow-xs'
                      : 'border-slate-100 dark:border-[#252D38] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#151A20]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-[#F4F6F8]">
                        {t.instrument}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                          t.direction === 'BUY' ? 'bg-[#00C781]/15 text-[#00C781]' : 'bg-red-500/15 text-red-500'
                        }`}
                      >
                        {t.direction}
                      </span>
                    </div>

                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md border ${getGradeColor(
                        t.grade?.letterGrade
                      )}`}
                    >
                      {t.grade?.letterGrade || 'A'} ({t.grade?.overallScore ?? 90})
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                    {t.setupType}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-[#252D38] text-[11px] font-mono">
                    <span className="text-slate-400">{t.entryDate.split('T')[0]}</span>
                    <span className={isWin ? 'text-[#00C781] font-bold' : 'text-red-400 font-bold'}>
                      {t.netProfitLoss >= 0 ? `+$${t.netProfitLoss.toFixed(2)}` : `-$${Math.abs(t.netProfitLoss).toFixed(2)}`}{' '}
                      ({t.rMultiple >= 0 ? `+${t.rMultiple}R` : `${t.rMultiple}R`})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Comprehensive Explainable Breakdown (8 cols) */}
        {selectedTrade && grade ? (
          <div className="lg:col-span-8 space-y-5">
            {/* Main Scorecard Header */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase text-[#00C781] tracking-wider">
                      GRADE AUDIT REPORT
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs text-slate-500 dark:text-[#AAB3BF] font-mono">
                      Trade #{selectedTrade.id}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-[#F4F6F8] tracking-tight mt-1">
                    {selectedTrade.instrument} {selectedTrade.direction} — {selectedTrade.setupType}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
                    Account: {selectedTrade.accountId} · Session: {selectedTrade.tradingSession} · Evaluated: {grade.evaluatedAt.split('T')[0]}
                  </div>
                </div>

                {/* Big Letter Grade Box */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-[#F4F6F8]">
                      {grade.overallScore}
                      <span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">Numerical Score</div>
                  </div>

                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center font-mono font-extrabold text-3xl border shadow-lg ${getGradeColor(
                      grade.letterGrade
                    )}`}
                  >
                    {grade.letterGrade}
                  </div>
                </div>
              </div>

              {/* 5 Category Weight Bars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-100 dark:border-[#252D38]">
                {/* 1. Setup Quality (25) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151A20] space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-[#AAB3BF]">Setup Quality</span>
                    <span className="font-mono text-slate-900 dark:text-[#F4F6F8]">
                      {grade.setupQuality}/{weights.setupQuality}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#252D38] overflow-hidden">
                    <div
                      className="h-full bg-[#00C781] rounded-full"
                      style={{ width: `${(grade.setupQuality / weights.setupQuality) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 2. Entry Execution (20) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151A20] space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-[#AAB3BF]">Entry Execution</span>
                    <span className="font-mono text-slate-900 dark:text-[#F4F6F8]">
                      {grade.entryExecution}/{weights.entryExecution}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#252D38] overflow-hidden">
                    <div
                      className="h-full bg-[#00C781] rounded-full"
                      style={{ width: `${(grade.entryExecution / weights.entryExecution) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 3. Risk Management (20) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151A20] space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-[#AAB3BF]">Risk Management</span>
                    <span className="font-mono text-slate-900 dark:text-[#F4F6F8]">
                      {grade.riskManagement}/{weights.riskManagement}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#252D38] overflow-hidden">
                    <div
                      className="h-full bg-[#00C781] rounded-full"
                      style={{ width: `${(grade.riskManagement / weights.riskManagement) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 4. Strategy Compliance (20) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151A20] space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-[#AAB3BF]">Compliance</span>
                    <span className="font-mono text-slate-900 dark:text-[#F4F6F8]">
                      {grade.strategyCompliance}/{weights.strategyCompliance}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#252D38] overflow-hidden">
                    <div
                      className="h-full bg-[#00C781] rounded-full"
                      style={{ width: `${(grade.strategyCompliance / weights.strategyCompliance) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 5. Exit Execution (15) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151A20] space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-[#AAB3BF]">Exit Execution</span>
                    <span className="font-mono text-slate-900 dark:text-[#F4F6F8]">
                      {grade.exitExecution}/{weights.exitExecution}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#252D38] overflow-hidden">
                    <div
                      className="h-full bg-[#00C781] rounded-full"
                      style={{ width: `${(grade.exitExecution / weights.exitExecution) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Qualitative & Explainable Breakdown Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Strengths */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00C781] uppercase tracking-wider">
                  <CheckCircle2 size={16} />
                  <span>Execution Strengths Observed</span>
                </div>
                {grade.strengths.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {grade.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#00C781] font-bold mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-400">No major strengths recorded.</div>
                )}
              </div>

              {/* Mistakes & Leaks */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                  <AlertTriangle size={16} />
                  <span>Mistakes &amp; Execution Leaks</span>
                </div>
                {grade.mistakes.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {grade.mistakes.map((mis, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-400 font-bold mt-0.5">•</span>
                        <span>{mis}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-[#00C781] font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Zero execution leaks detected.
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Used & Missing Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-3">
                <div className="text-xs font-bold text-slate-500 dark:text-[#AAB3BF] uppercase tracking-wider">
                  Audited Verification Evidence
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                  {grade.evidenceUsed.map((ev, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#00C781]">✓</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-3">
                <div className="text-xs font-bold text-slate-500 dark:text-[#AAB3BF] uppercase tracking-wider">
                  Missing Context / Unverified Criteria
                </div>
                {grade.missingInformation.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-amber-500/90 font-mono">
                    {grade.missingInformation.map((mi, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span>?</span>
                        <span>{mi}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-400 font-mono">
                    All required evidence parameters were fully satisfied.
                  </div>
                )}
              </div>
            </div>

            {/* Improvement Recommendations */}
            {grade.recommendations.length > 0 && (
              <div className="p-5 rounded-2xl border border-[#00C781]/30 bg-[#00C781]/5 text-slate-900 dark:text-[#F4F6F8] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00C781] uppercase tracking-wider">
                  <Sparkles size={15} />
                  <span>Bandit Coach Directives for this Setup</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {grade.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ArrowRight size={13} className="text-[#00C781] mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-xs text-slate-400 border border-slate-200 dark:border-[#252D38] rounded-2xl">
            Select a trade from the left to view its comprehensive explainable grade audit.
          </div>
        )}
      </div>
    </div>
  );
};
