/**
 * BANDITRADES — Platform Settings & Subscription Tiers
 * Profile settings, risk management safeguards, subscription entitlements, and canonical aliases
 */

import React, { useState } from 'react';
import {
  User,
  Shield,
  CreditCard,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { CANONICAL_INSTRUMENTS } from '../../types/index.ts';

export const SettingsView: React.FC = () => {
  const { user, loginDemo } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName || 'Alex Vance');
  const [email, setEmail] = useState(user?.email || 'bandit@banditrades.com');
  const [riskTolerance, setRiskTolerance] = useState(user?.riskTolerancePercent || 1.0);
  const [maxDailyDD, setMaxDailyDD] = useState(user?.maxDailyDrawdownPercent || 3.0);
  const [dailyWarning, setDailyWarning] = useState(user?.dailyLossWarningPercent || 2.0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B]">
        <h2 className="text-lg font-bold text-slate-900 dark:text-[#F4F6F8]">
          Workspace Configuration &amp; Subscription Entitlements
        </h2>
        <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
          Manage your account profile, risk parameters, and prop-firm compliance limits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Profile & Risk Limits (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* User Profile Form */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F4F6F8] uppercase tracking-wider text-xs">
              Trader Identity &amp; Workspace Profile
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-[#AAB3BF] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-[#AAB3BF] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8]"
                  />
                </div>
              </div>

              {/* Risk Settings */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#252D38] space-y-3">
                <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-[#AAB3BF]">
                  Risk Safeguards &amp; Warning Limits
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Max Risk / Trade (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={riskTolerance}
                      onChange={e => setRiskTolerance(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Max Daily DD (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={maxDailyDD}
                      onChange={e => setMaxDailyDD(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Early Warning (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={dailyWarning}
                      onChange={e => setDailyWarning(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {savedSuccess && (
                  <span className="text-xs text-[#00C781] font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Settings updated successfully.
                  </span>
                )}
                <span />

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] font-bold text-xs transition-all shadow-xs"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>

          {/* Canonical Instruments Reference & Aliases */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F4F6F8] uppercase tracking-wider text-xs">
              Supported 5 Canonical Instruments &amp; Aliases
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB3BF]">
              Broker-specific symbols automatically resolve to their canonical instrument in BANDITRADES:
            </p>

            <div className="space-y-2 pt-1">
              {Object.entries(CANONICAL_INSTRUMENTS).map(([sym, meta]) => (
                <div
                  key={sym}
                  className="p-3 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#151A20]/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-[#F4F6F8]">
                        {sym}
                      </span>
                      <span className="text-slate-500 dark:text-[#AAB3BF]">
                        ({meta.name})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Aliases: {meta.aliases.join(', ')}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-[#252D38] text-slate-600 dark:text-slate-300">
                    Pip: {meta.pipSize}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Subscription Tiers & Workspace Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Subscription Tiers (Section 22) */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#00C781] uppercase tracking-wider">
                  MEMBERSHIP
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
                  Bandit Intelligence Tiers
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00C781]/15 text-[#00C781] font-mono text-xs font-bold uppercase">
                {user?.subscriptionTier || 'PRO'} TIER ACTIVE
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Free Tier */}
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#151A20]/40 text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-[#F4F6F8] flex justify-between">
                  <span>FREE</span>
                  <span className="font-mono text-slate-400">$0 / mo</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Basic journal · Standard analytics · 1 Trading account · Limited AI
                </div>
              </div>

              {/* Pro Tier (Current) */}
              <div className="p-3.5 rounded-xl border border-[#00C781]/40 bg-[#00C781]/10 text-xs space-y-1 relative">
                <div className="font-bold text-slate-900 dark:text-white flex justify-between">
                  <span className="flex items-center gap-1.5 text-[#00C781]">
                    <Sparkles size={14} /> PRO (Current Plan)
                  </span>
                  <span className="font-mono text-[#00C781] font-bold">$39 / mo</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  Advanced Explainable Grading · Performance Leak Detector · Full CSV Import · Bandit AI Coach
                </div>
              </div>

              {/* Premium Tier */}
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#151A20]/40 text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-[#F4F6F8] flex justify-between">
                  <span>PREMIUM DESK</span>
                  <span className="font-mono text-slate-400">$89 / mo</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Unlimited prop accounts · Low-latency live feeds · Comprehensive quant coaching · Custom webhook alerts
                </div>
              </div>
            </div>
          </div>

          {/* Quick Workspace Reset */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-[#AAB3BF] uppercase tracking-wider">
              Quick Workspace Actions
            </h4>

            <div className="space-y-2">
              <button
                onClick={() => {
                  loginDemo();
                  alert('Demo workspace re-initialized with 25+ trades, Apex funded account, and FTMO challenge!');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] text-xs font-semibold text-slate-800 dark:text-[#F4F6F8] hover:border-[#00C781]/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-[#00C781]" />
                  <span>Reload Complete Demo Seed Data</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">1-Click</span>
              </button>

              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] text-xs font-semibold text-slate-800 dark:text-[#F4F6F8] hover:border-[#00C781]/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  <span>Toggle Visual Theme ({theme.toUpperCase()})</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Theme</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
