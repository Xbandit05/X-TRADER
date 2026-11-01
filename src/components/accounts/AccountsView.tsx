/**
 * BANDITRADES — Professional Accounts & Prop-Firm Challenge Tracker
 * Institutional multi-account portfolio management with real-time drawdown and profit target meters
 */

import React, { useState } from 'react';
import {
  Briefcase,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Flame,
  ArrowUpRight,
  TrendingDown,
  Clock,
  Layers,
  Award
} from 'lucide-react';
import { TradingAccount, AccountType } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export const AccountsView: React.FC = () => {
  const { accounts, selectedAccount, setSelectedAccount, refreshAccounts } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Account Form State
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('prop_evaluation');
  const [brokerOrFirm, setBrokerOrFirm] = useState('FTMO');
  const [startingBalance, setStartingBalance] = useState<number>(100000);
  const [isPropFirm, setIsPropFirm] = useState(true);
  const [profitTargetPct, setProfitTargetPct] = useState(10);
  const [maxDailyDDPct, setMaxDailyDDPct] = useState(5);
  const [maxOverallDDPct, setMaxOverallDDPct] = useState(10);
  const [minDays, setMinDays] = useState(5);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const balance = Number(startingBalance) || 50000;
      await api.createAccount({
        name,
        accountType,
        brokerOrFirm,
        startingBalance: balance,
        currentBalance: balance,
        currentEquity: balance,
        currency: 'USD',
        status: 'active',
        challengeRules: isPropFirm
          ? {
              id: `rule_${Date.now()}`,
              accountId: '',
              propFirmName: brokerOrFirm,
              phase: 'Phase 1',
              startingBalance: balance,
              profitTargetAmount: (balance * profitTargetPct) / 100,
              profitTargetPercentage: profitTargetPct,
              maxDailyDrawdownAmount: (balance * maxDailyDDPct) / 100,
              maxDailyDrawdownPercentage: maxDailyDDPct,
              maxOverallDrawdownAmount: (balance * maxOverallDDPct) / 100,
              maxOverallDrawdownPercentage: maxOverallDDPct,
              drawdownCalculationType: 'balance_based',
              drawdownTrailingType: 'static',
              minTradingDays: minDays,
              profitSplitPercentage: 80,
              startDate: new Date().toISOString(),
              currentTradingDays: 0
            }
          : undefined
      });

      await refreshAccounts();
      setShowCreateModal(false);
      setName('');
    } catch (err) {
      console.error('Failed to create account:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#F4F6F8]">
            Professional Accounts &amp; Prop-Firm Challenge Monitor
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
            Real-time balance tracking, drawdown meters, and profit target milestone surveillance
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold transition-all shadow-xs shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Trading Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {accounts.map(acc => {
          const isSelected = selectedAccount?.id === acc.id;
          const rules = acc.challengeRules;
          const profit = acc.currentBalance - acc.startingBalance;
          const profitPct = (profit / acc.startingBalance) * 100;
          const isFunded = acc.accountType === 'prop_funded' || acc.accountType === 'personal_live';

          // Target Progress %
          const targetPct = rules && rules.profitTargetAmount > 0
            ? Math.min(100, Math.max(0, (profit / rules.profitTargetAmount) * 100))
            : 100;

          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccount(acc)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-4 ${
                isSelected
                  ? 'border-[#00C781]/70 bg-slate-50 dark:bg-[#222B36] shadow-md ring-1 ring-[#00C781]/50'
                  : 'border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      acc.accountType === 'prop_funded'
                        ? 'bg-[#00C781]/20 text-[#00C781]'
                        : acc.accountType === 'prop_evaluation'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {acc.accountType.replace('_', ' ')}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-[#F4F6F8] mt-1.5 truncate">
                    {acc.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">{acc.brokerOrFirm}</div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-[#00C781] font-bold">
                    {acc.status}
                  </span>
                </div>
              </div>

              {/* Balances */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#151A20] space-y-1 font-mono">
                <div className="text-[10px] text-slate-400 uppercase">Current Equity</div>
                <div className="text-xl font-bold text-slate-900 dark:text-[#F4F6F8] tabular-nums">
                  ${acc.currentBalance.toLocaleString()}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-[#252D38]">
                  <span className="text-slate-400">Total P&amp;L:</span>
                  <span className={`font-bold ${profit >= 0 ? 'text-[#00C781]' : 'text-red-400'}`}>
                    {profit >= 0 ? `+$${profit.toLocaleString()}` : `-$${Math.abs(profit).toLocaleString()}`}{' '}
                    ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Prop-Firm Challenge Rules Tracker */}
              {rules ? (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#252D38] text-xs">
                  {/* Profit Target Progress */}
                  {rules.profitTargetAmount > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-[#AAB3BF] font-medium">Profit Target</span>
                        <span className="font-mono text-slate-900 dark:text-[#F4F6F8]">
                          ${profit.toFixed(0)} / ${rules.profitTargetAmount.toLocaleString()} ({targetPct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#252D38] overflow-hidden">
                        <div
                          className="h-full bg-[#00C781] rounded-full transition-all"
                          style={{ width: `${targetPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Daily Drawdown Remaining */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-[#AAB3BF] font-medium">Daily Loss Buffer</span>
                      <span className="font-mono text-[#00C781]">
                        ${rules.maxDailyDrawdownAmount.toLocaleString()} allowed
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#252D38] overflow-hidden">
                      <div className="h-full bg-[#00C781] rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>

                  {/* Minimum Days */}
                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-1">
                    <span>Days Traded: {rules.currentTradingDays} / {rules.minTradingDays} min</span>
                    <span>Split: {rules.profitSplitPercentage}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-[#252D38]">
                  Personal live account with standard portfolio risk metrics.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Account Detailed Rules Audit Card */}
      {selectedAccount && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#252D38]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#00C781] uppercase tracking-wider">
                  SELECTED ACTIVE ACCOUNT
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-slate-500 dark:text-[#AAB3BF] font-mono">
                  {selectedAccount.accountType.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-[#F4F6F8] tracking-tight mt-1">
                {selectedAccount.name}
              </h3>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="text-right">
                <div className="text-[10px] text-slate-400">STARTING CAPITAL</div>
                <div className="font-bold text-slate-900 dark:text-[#F4F6F8]">
                  ${selectedAccount.startingBalance.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">CURRENT EQUITY</div>
                <div className="font-bold text-[#00C781]">
                  ${selectedAccount.currentBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {selectedAccount.challengeRules ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#151A20]/40 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase">Daily Drawdown Model</div>
                <div className="font-bold text-slate-800 dark:text-[#F4F6F8]">
                  ${selectedAccount.challengeRules.maxDailyDrawdownAmount.toLocaleString()} ({selectedAccount.challengeRules.maxDailyDrawdownPercentage}%)
                </div>
                <div className="text-[10px] text-slate-400">
                  {selectedAccount.challengeRules.drawdownCalculationType}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#151A20]/40 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase">Max Overall Drawdown</div>
                <div className="font-bold text-slate-800 dark:text-[#F4F6F8]">
                  ${selectedAccount.challengeRules.maxOverallDrawdownAmount.toLocaleString()} ({selectedAccount.challengeRules.maxOverallDrawdownPercentage}%)
                </div>
                <div className="text-[10px] text-slate-400">
                  {selectedAccount.challengeRules.drawdownTrailingType}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#151A20]/40 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase">Profit Target</div>
                <div className="font-bold text-[#00C781]">
                  ${selectedAccount.challengeRules.profitTargetAmount.toLocaleString()} ({selectedAccount.challengeRules.profitTargetPercentage}%)
                </div>
                <div className="text-[10px] text-slate-400">
                  Phase: {selectedAccount.challengeRules.phase}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#151A20]/40 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase">Trader Profit Split</div>
                <div className="font-bold text-[#00C781]">
                  {selectedAccount.challengeRules.profitSplitPercentage}% / {100 - selectedAccount.challengeRules.profitSplitPercentage}%
                </div>
                <div className="text-[10px] text-slate-400">
                  Apex/FTMO Payout Tier
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 dark:text-[#AAB3BF]">
              Personal Live Account: All journaled executions under this workspace calculate toward your private performance statistics.
            </div>
          )}
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#252D38]">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
                Add Professional Trading Account
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Apex $150K Funded or FTMO Phase 1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={e => {
                      const t = e.target.value as AccountType;
                      setAccountType(t);
                      setIsPropFirm(t.includes('prop'));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                  >
                    <option value="prop_evaluation">Prop Evaluation (Challenge)</option>
                    <option value="prop_funded">Prop Funded Account</option>
                    <option value="personal_live">Personal Live Account</option>
                    <option value="demo">Demo Simulation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                    Broker or Firm
                  </label>
                  <input
                    type="text"
                    value={brokerOrFirm}
                    onChange={e => setBrokerOrFirm(e.target.value)}
                    placeholder="e.g. Apex, FTMO, Topstep, IBKR"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                  Starting Balance ($)
                </label>
                <input
                  type="number"
                  value={startingBalance}
                  onChange={e => setStartingBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none font-mono"
                />
              </div>

              {isPropFirm && (
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B] space-y-3">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-[#AAB3BF] uppercase">
                    Challenge Rule Thresholds
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Profit Target %</label>
                      <input
                        type="number"
                        value={profitTargetPct}
                        onChange={e => setProfitTargetPct(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Daily DD %</label>
                      <input
                        type="number"
                        value={maxDailyDDPct}
                        onChange={e => setMaxDailyDDPct(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Overall DD %</label>
                      <input
                        type="number"
                        value={maxOverallDDPct}
                        onChange={e => setMaxOverallDDPct(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold transition-all"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
