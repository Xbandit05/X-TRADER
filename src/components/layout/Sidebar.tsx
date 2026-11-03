/**
 * CLOUD X — Master Sidebar Navigation
 * TradeZella-styled collapsible professional 10-view trading terminal sidebar
 */

import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  LineChart,
  Award,
  ShieldCheck,
  Compass,
  Briefcase,
  Bot,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Radio
} from 'lucide-react';
import { Logo } from '../common/Logo.tsx';

export type NavTab =
  | 'dashboard'
  | 'journal'
  | 'analytics'
  | 'grading'
  | 'consistency'
  | 'strategies'
  | 'accounts'
  | 'ai'
  | 'reports'
  | 'settings'
  | 'market';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal', label: 'Trade Journal', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'grading', label: 'Trade Grading', icon: Award },
    { id: 'consistency', label: 'Consistency', icon: ShieldCheck },
    { id: 'strategies', label: 'Strategies & Rulebook', icon: Compass },
    { id: 'accounts', label: 'Professional Accounts', icon: Briefcase },
    { id: 'market', label: 'Live Market Intel', icon: Radio, badge: 'LIVE' },
    { id: 'ai', label: 'Cloud AI', icon: Bot, badge: 'PRO' },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 border-r border-slate-200 dark:border-[#1C2638] bg-white dark:bg-[#090D14] transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#1C2638]">
        {collapsed ? (
          <div className="mx-auto cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <Logo variant="icon" size="md" />
          </div>
        ) : (
          <div className="cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <Logo variant="compact" size="md" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131926] transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Items List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[#00B2FE]/10 text-[#00B2FE] dark:bg-[#00B2FE]/15 dark:text-[#00B2FE] border border-[#00B2FE]/30 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] dark:hover:bg-[#131926] border border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div
                className={`flex items-center justify-center shrink-0 ${
                  isActive ? 'text-[#00B2FE]' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon size={18} />
              </div>

              {!collapsed && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-2 text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-[#00B2FE]/15 text-[#00B2FE] border border-[#00B2FE]/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status / Tagline */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-[#1C2638] bg-slate-50/50 dark:bg-[#0F141F]/60">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#94A3B8]">
            <TrendingUp size={14} className="text-[#00B2FE]" />
            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">5 Canonical Markets</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
            US100 · US30 · GBPUSD · GBPJPY · XAUUSD
          </div>
        </div>
      )}
    </aside>
  );
};
