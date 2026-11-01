/**
 * BANDITRADES — Top Bar Navigation
 * Adheres strictly to the Top Bar Contract (3 zones separated by gap-8)
 */

import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Plus,
  ChevronDown,
  Shield,
  User,
  LogOut,
  Upload,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from './Sidebar.tsx';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenTradeModal: () => void;
  onOpenCsvModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenTradeModal,
  onOpenCsvModal
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, accounts, selectedAccount, setSelectedAccount, logout, loginDemo } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const tabTitles: Record<NavTab, string> = {
    dashboard: 'Main Performance Dashboard',
    journal: 'Trade Journal & Executions',
    analytics: 'Quantitative Analytics & Leak Detector',
    grading: 'Explainable Trade Grading Engine (A+ to F)',
    consistency: 'Consistency & Execution Discipline',
    strategies: 'Personal Strategy Rulebook',
    accounts: 'Professional Accounts & Prop-Firm Challenges',
    market: 'Live Market Intelligence (5 Canonical)',
    ai: 'Bandit AI Terminal',
    reports: 'Executive Reports & Statement Exports',
    settings: 'Platform Settings & Risk Limits'
  };

  return (
    <header className="h-16 flex items-center justify-between gap-8 px-6 border-b border-slate-200 dark:border-[#252D38] bg-white/80 dark:bg-[#0B0D10]/90 backdrop-blur-md sticky top-0 z-20">
      {/* Zone 1: Breadcrumb & Context Title (Single text element) */}
      <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
        <span className="text-xs font-mono font-medium text-slate-400 dark:text-[#AAB3BF] tracking-wider uppercase">
          WORKSPACE
        </span>
        <span className="text-slate-300 dark:text-slate-700 font-mono">/</span>
        <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-[#F4F6F8] tracking-tight">
          {tabTitles[activeTab]}
        </h1>
      </div>

      {/* Zone 2: 4-5 Clean Nav Links with hover underline */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-[#AAB3BF]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-slate-900 dark:hover:text-[#F4F6F8] transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'text-[#00C781] font-semibold' : ''
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`hover:text-slate-900 dark:hover:text-[#F4F6F8] transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'journal' ? 'text-[#00C781] font-semibold' : ''
          }`}
        >
          Journal
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`hover:text-slate-900 dark:hover:text-[#F4F6F8] transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'grading' ? 'text-[#00C781] font-semibold' : ''
          }`}
        >
          Grading
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`hover:text-slate-900 dark:hover:text-[#F4F6F8] transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'accounts' ? 'text-[#00C781] font-semibold' : ''
          }`}
        >
          Prop Challenges
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`hover:text-slate-900 dark:hover:text-[#F4F6F8] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'ai' ? 'text-[#00C781] font-semibold' : ''
          }`}
        >
          <Sparkles size={14} className="text-[#00C781]" />
          <span>Bandit AI</span>
        </button>
      </nav>

      {/* Zone 3: Actions (Account Selector, Import CSV, New Trade CTA, Theme Toggle, Profile) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Account Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] text-xs font-medium text-slate-800 dark:text-[#F4F6F8] hover:border-slate-300 dark:hover:border-[#00C781]/50 transition-colors whitespace-nowrap shrink-0"
          >
            <Shield size={14} className="text-[#00C781]" />
            <span className="max-w-[130px] truncate">
              {selectedAccount ? selectedAccount.name : 'All Accounts'}
            </span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {accountMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Active Account
              </div>
              <button
                onClick={() => {
                  setSelectedAccount(null);
                  setAccountMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between ${
                  !selectedAccount
                    ? 'bg-slate-100 dark:bg-[#222B36] text-[#00C781] font-semibold'
                    : 'text-slate-700 dark:text-[#AAB3BF] hover:bg-slate-50 dark:hover:bg-[#151A20]'
                }`}
              >
                <span>Combined Portfolio (All Accounts)</span>
              </button>
              <div className="h-px bg-slate-100 dark:bg-[#252D38] my-1" />
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccount(acc);
                    setAccountMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between ${
                    selectedAccount?.id === acc.id
                      ? 'bg-slate-100 dark:bg-[#222B36] text-[#00C781] font-semibold'
                      : 'text-slate-700 dark:text-[#AAB3BF] hover:bg-slate-50 dark:hover:bg-[#151A20]'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-medium truncate">{acc.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {acc.accountType.replace('_', ' ')}
                    </div>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-slate-900 dark:text-[#F4F6F8]">
                    ${acc.currentBalance.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CSV Import Button */}
        <button
          onClick={onOpenCsvModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] text-xs font-medium text-slate-700 dark:text-[#AAB3BF] hover:text-slate-900 dark:hover:text-[#F4F6F8] hover:bg-slate-50 dark:hover:bg-[#151A20] transition-colors whitespace-nowrap shrink-0"
          title="Import Broker CSV"
        >
          <Upload size={14} />
          <span>Import</span>
        </button>

        {/* Primary Action CTA: Log Trade */}
        <button
          onClick={onOpenTradeModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold transition-all shadow-xs hover:shadow-sm active:scale-98 whitespace-nowrap shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Log Trade</span>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-[#2E3845] text-slate-600 dark:text-[#AAB3BF] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#151A20] transition-colors"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 dark:border-[#2E3845] hover:border-[#00C781]/60 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#151A20] border border-[#00C781]/40 flex items-center justify-center text-[#00C781] text-xs font-bold">
              {user?.fullName?.charAt(0) || 'B'}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-[#252D38]">
                <div className="font-semibold text-xs text-slate-900 dark:text-[#F4F6F8]">
                  {user?.fullName || 'Trader'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#AAB3BF] truncate">
                  {user?.email}
                </div>
                <div className="text-[10px] font-mono text-[#00C781] mt-1 font-semibold uppercase">
                  {user?.subscriptionTier || 'PRO'} TIER ACTIVE
                </div>
              </div>

              <button
                onClick={() => {
                  loginDemo();
                  setUserMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-700 dark:text-[#AAB3BF] hover:bg-slate-50 dark:hover:bg-[#151A20]"
              >
                <RefreshCw size={14} className="text-[#00C781]" />
                <span>Reload Demo Workspace</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setUserMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-700 dark:text-[#AAB3BF] hover:bg-slate-50 dark:hover:bg-[#151A20]"
              >
                <User size={14} />
                <span>Account Preferences</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-[#252D38] my-1" />

              <button
                onClick={() => {
                  logout();
                  setUserMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
