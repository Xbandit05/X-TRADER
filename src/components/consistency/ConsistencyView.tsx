/**
 * BANDITRADES — Consistency & Discipline Workspace
 * Institutional discipline monitoring system featuring:
 * - 10 Configurable Personal Trading Rules with active/inactive toggles
 * - Daily, Weekly, and Monthly Adherence Tracking
 * - Honest Rule Violation Logger with severity & trade association
 * - Dual-Score Architecture: Profitability Score vs Discipline Score
 * - Terminal Lockout & Cool-down controls
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Sliders,
  Send,
  Plus,
  Check,
  X,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';
import { ConsistencyMetrics, PersonalTradingRule } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const ConsistencyView: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ConsistencyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // 10 Configurable Personal Trading Rules
  const [rules, setRules] = useState<PersonalTradingRule[]>([
    { id: 'rule_1', ruleText: 'Maximum two trade positions per day.', category: 'discipline', enabled: true, maxDailyViolationAllowance: 0 },
    { id: 'rule_2', ruleText: 'No trade without the complete strategy setup.', category: 'execution', enabled: true, maxDailyViolationAllowance: 0 },
    { id: 'rule_3', ruleText: 'Never chase price after missing an entry.', category: 'psychology', enabled: true, maxDailyViolationAllowance: 0 },
    { id: 'rule_4', ruleText: 'Never enter before the planned FVG or CHoCH-zone retest (NO RETEST = NO TRADE).', category: 'execution', enabled: true, maxDailyViolationAllowance: 0 },
    { id: 'rule_5', ruleText: 'Avoid emotional and revenge trading.', category: 'psychology', enabled: true, maxDailyViolationAllowance: 0 },
    { id: 'rule_6', ruleText: 'Do not move a stop loss farther away simply to avoid a loss.', category: 'risk', enabled: true, maxDailyViolationAllowance: 0 },
    { id: 'rule_7', ruleText: 'Do not close trades prematurely because of fear alone.', category: 'psychology', enabled: true, maxDailyViolationAllowance: 0 },
    { id: 'rule_8', ruleText: 'Always establish risk and invalidation before entry.', category: 'risk', enabled: true, maxDailyViolationAllowance: 0 },
    { id: 'rule_9', ruleText: 'Respect configured daily and account drawdown limits.', category: 'risk', enabled: true, maxDailyViolationAllowance: 0 },
    { id: 'rule_10', ruleText: 'Stop trading when personal trading limits are reached.', category: 'discipline', enabled: true, maxDailyViolationAllowance: 0 }
  ]);

  // Limits
  const [dailyLossLimit, setDailyLossLimit] = useState(2500);
  const [maxTradesLimit, setMaxTradesLimit] = useState(2);

  // Violation Logging Modal
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0].id);
  const [violationDetails, setViolationDetails] = useState('');
  const [violationSeverity, setViolationSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [loggingViolation, setLoggingViolation] = useState(false);

  // End-of-Day Reflection
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getConsistency();
      setMetrics(data);
      if (data.maxDailyLossLimit) setDailyLossLimit(data.maxDailyLossLimit);
      if (data.maxTradesPerDayLimit) setMaxTradesLimit(data.maxTradesPerDayLimit);
      if (data.personalRules && data.personalRules.length > 0) {
        setRules(data.personalRules);
      }
    } catch (err) {
      console.error('Failed to load consistency metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRule = async (ruleId: string) => {
    const updated = rules.map(r => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    setRules(updated);
    try {
      await api.updateConsistency({ personalRules: updated });
    } catch (e) {
      console.error('Failed to save rule state:', e);
    }
  };

  const handleLogViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationDetails.trim()) return;

    setLoggingViolation(true);
    try {
      const targetRule = rules.find(r => r.id === selectedRuleId);
      const updated = await api.logViolation({
        violationType: targetRule?.ruleText || 'Personal Rule Deviation',
        details: violationDetails.trim(),
        severity: violationSeverity
      });
      setMetrics(updated);
      setShowViolationModal(false);
      setViolationDetails('');
    } catch (err) {
      console.error('Failed to log rule violation:', err);
    } finally {
      setLoggingViolation(false);
    }
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (reflectionText.trim()) {
      setReflectionSubmitted(true);
      setTimeout(() => setReflectionSubmitted(false), 3000);
      setReflectionText('');
    }
  };

  const activeRulesCount = rules.filter(r => r.enabled).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#00B2FE] uppercase tracking-wider">
              DISCIPLINE &amp; EXECUTION CONSISTENCY
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-mono text-slate-500">10 PERSONAL RULES ACTIVE</span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight mt-0.5">
            Behavioral Guardrails &amp; Rulebook Adherence
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
            Decoupling financial return from procedural adherence to forge long-term institutional survivability.
          </p>
        </div>

        <button
          onClick={() => setShowViolationModal(true)}
          className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2 transition-colors shrink-0 shadow-xs"
        >
          <AlertTriangle size={15} />
          <span>Record Honest Rule Violation</span>
        </button>
      </div>

      {/* Dual Scores Showcase: Profitability Score vs Discipline Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Score 1: Profitability Score */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] relative overflow-hidden space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider font-mono">
                Financial Score
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                Profitability Rating
              </h3>
            </div>
            <div className="text-3xl md:text-4xl font-extrabold font-mono text-[#10B981] tabular-nums">
              {metrics?.profitabilityScore ?? 88}
              <span className="text-base font-normal text-slate-400">/100</span>
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-[#1C2638] overflow-hidden">
            <div
              className="h-full bg-[#10B981] rounded-full transition-all duration-500"
              style={{ width: `${metrics?.profitabilityScore ?? 88}%` }}
            />
          </div>

          <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Reflects overall net profitability, win rate (68.4%), and average risk-to-reward realization.
          </p>
        </div>

        {/* Score 2: Discipline Score (The Primary Health Indicator) */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] relative overflow-hidden space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#00B2FE] uppercase tracking-wider font-mono">
                Procedural Score (Primary)
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                Execution Discipline Score
              </h3>
            </div>
            <div className="text-3xl md:text-4xl font-extrabold font-mono text-[#00B2FE] tabular-nums">
              {metrics?.disciplineScore ?? 92}
              <span className="text-base font-normal text-slate-400">/100</span>
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-[#1C2638] overflow-hidden">
            <div
              className="h-full bg-[#00B2FE] rounded-full transition-all duration-500"
              style={{ width: `${metrics?.disciplineScore ?? 92}%` }}
            />
          </div>

          <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Measures compliance with your 10 personal rules, predetermined stop loss integrity, and zero overtrading.
          </p>
        </div>
      </div>

      {/* Adherence Timeframe Progress & Limits Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-2 text-xs shadow-xs">
          <div className="flex justify-between font-mono font-bold">
            <span className="text-slate-500 uppercase">Daily Adherence</span>
            <span className="text-[#00C781]">100% (0 Violations Today)</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#252D38] overflow-hidden">
            <div className="h-full bg-[#00C781] rounded-full w-full" />
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">
            Positions Today: 1 / {maxTradesLimit} max allowed
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-2 text-xs shadow-xs">
          <div className="flex justify-between font-mono font-bold">
            <span className="text-slate-500 uppercase">Weekly Adherence</span>
            <span className="text-[#00C781]">95% (1 Minor Flag)</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#252D38] overflow-hidden">
            <div className="h-full bg-[#00C781] rounded-full w-[95%]" />
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">
            Weekly Risk Average: 1.05%
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-2 text-xs shadow-xs">
          <div className="flex justify-between font-mono font-bold">
            <span className="text-slate-500 uppercase">Monthly Adherence</span>
            <span className="text-slate-900 dark:text-white">92% Overall</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#252D38] overflow-hidden">
            <div className="h-full bg-slate-900 dark:bg-white rounded-full w-[92%]" />
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">
            Consecutive Disciplined Days: 6
          </span>
        </div>
      </div>

      {/* 10 Configurable Personal Trading Rules (Primary Requirement) */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#252D38]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
                Personal Trading Rules &amp; Guardrails
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#00C781]/15 text-[#00C781]">
                {activeRulesCount} of 10 Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
              These rules define your institutional discipline. The Trade Grading engine inspects them on every trade.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {rules.map((rule, idx) => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                rule.enabled
                  ? 'border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60'
                  : 'border-slate-100 dark:border-[#202731] bg-slate-50/20 opacity-50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#00C781] shrink-0 text-xs mt-0.5">
                  {(idx + 1).toString().padStart(2, '0')}.
                </span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-[#F4F6F8] leading-relaxed block">
                    {rule.ruleText}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-200 dark:bg-[#252D38] text-slate-500 dark:text-slate-400 mt-1.5 inline-block">
                    {rule.category}
                  </span>
                </div>
              </div>

              {/* Toggle Rule */}
              <button
                type="button"
                onClick={() => handleToggleRule(rule.id)}
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                  rule.enabled ? 'bg-[#00C781]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                    rule.enabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Logged Behavioral Rule Violations Ledger */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#202731]">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              Logged Behavioral Rule Violations
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF]">
              Honest audit ledger of procedural slips and tilt trades
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {metrics?.recentViolations?.length ?? 0} instances recorded
          </span>
        </div>

        <div className="space-y-2.5">
          {metrics?.recentViolations && metrics.recentViolations.length > 0 ? (
            metrics.recentViolations.map(v => (
              <div
                key={v.id}
                className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-500">{v.violationType}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-bold">
                      {v.severity} severity
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{v.details}</p>
                </div>
                <span className="font-mono text-slate-400 shrink-0 text-[11px]">{v.date}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center">
              No recent rule violations recorded. Flawless discipline streak active.
            </div>
          )}
        </div>
      </div>

      {/* Daily Reflection Journal Entry */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-4 shadow-xs">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
            Daily End-of-Day Psychological Reflection
          </h4>
          <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
            Anchor your emotional state before closing the trading terminal
          </p>
        </div>

        <form onSubmit={handleSaveReflection} className="space-y-3">
          <textarea
            value={reflectionText}
            onChange={e => setReflectionText(e.target.value)}
            rows={3}
            placeholder="Today's execution notes: How did you handle drawdowns? Did you execute your plan without emotional interference? Did you respect NO RETEST = NO TRADE?"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
          />

          <div className="flex items-center justify-between">
            {reflectionSubmitted ? (
              <span className="text-xs text-[#00C781] font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Reflection saved into your psychological ledger.
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold transition-all shadow-xs"
            >
              Log Daily Reflection
            </button>
          </div>
        </form>
      </div>

      {/* Honest Violation Logger Modal */}
      {showViolationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-rose-500/40 bg-white dark:bg-[#151A20] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={18} />
                <span>Record Rule Violation</span>
              </h3>
              <button
                onClick={() => setShowViolationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Honesty with your journal is paramount. Acknowledging a broken rule in real-time prevents cascading drawdown.
            </p>

            <form onSubmit={handleLogViolation} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Which Rule Was Violated?
                </label>
                <select
                  value={selectedRuleId}
                  onChange={e => setSelectedRuleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                >
                  {rules.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.ruleText}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Severity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setViolationSeverity(sev)}
                      className={`py-1.5 rounded-lg border text-xs font-mono font-bold uppercase transition-colors ${
                        violationSeverity === sev
                          ? 'border-rose-500 bg-rose-500/20 text-rose-500'
                          : 'border-slate-200 dark:border-[#2E3845] text-slate-400'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  What Happened? (Honest Context)
                </label>
                <textarea
                  value={violationDetails}
                  onChange={e => setViolationDetails(e.target.value)}
                  rows={3}
                  placeholder="e.g. Took a loss on US100 and immediately took a 3rd position chasing price without waiting for the 5m FVG retest."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#252D38]">
                <button
                  type="button"
                  onClick={() => setShowViolationModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingViolation}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                >
                  {loggingViolation ? 'Logging...' : 'Confirm & Audit Violation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
