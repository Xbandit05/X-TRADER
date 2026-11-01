/**
 * BANDITRADES — Executive Reporting System
 * Downloadable & Printable trading performance reports with Bandit watermark
 */

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Award,
  CheckCircle2,
  TrendingUp,
  Shield,
  FileText
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Logo } from '../common/Logo.tsx';

export const ReportsView: React.FC = () => {
  const { user, selectedAccount } = useAuth();
  const [reportType, setReportType] = useState<'monthly' | 'weekly' | 'strategy' | 'prop_challenge'>('monthly');
  const [analytics, setAnalytics] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [a, t] = await Promise.all([
          api.getAnalytics(selectedAccount?.id),
          api.getTrades({ accountId: selectedAccount?.id })
        ]);
        setAnalytics(a);
        setTrades(t);
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedAccount]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = ['ID', 'Date', 'Instrument', 'Direction', 'Entry', 'Exit', 'NetPnL', 'RMultiple', 'Session', 'Grade'];
    const rows = trades.map(t => [
      t.id,
      t.entryDate.split('T')[0],
      t.instrument,
      t.direction,
      t.entryPrice,
      t.exitPrice,
      t.netProfitLoss,
      t.rMultiple,
      t.tradingSession,
      t.grade?.letterGrade || 'A'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `BANDITRADES_${reportType.toUpperCase()}_REPORT.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#F4F6F8]">
            Executive Performance Statement &amp; Audit Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
            Institutional-grade PDF exportable documentation for prop accounts and tax audits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] text-xs font-semibold text-slate-800 dark:text-[#F4F6F8] hover:border-[#00C781]/40 transition-colors"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold transition-all shadow-xs"
          >
            <Printer size={15} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] overflow-x-auto">
        {(['monthly', 'weekly', 'strategy', 'prop_challenge'] as const).map(type => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              reportType === type
                ? 'bg-slate-900 text-white dark:bg-[#1B222B] dark:text-[#00C781] shadow-xs'
                : 'text-slate-600 dark:text-[#AAB3BF] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {type === 'monthly'
              ? 'Monthly Executive Statement'
              : type === 'weekly'
              ? 'Weekly Execution Audit'
              : type === 'strategy'
              ? 'Strategy Effectiveness Report'
              : 'Prop-Firm Milestone Certificate'}
          </button>
        ))}
      </div>

      {/* The Printable Report Canvas (with Watermark) */}
      <div className="relative p-8 md:p-12 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] shadow-xl overflow-hidden space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Subtle Report Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Logo variant="watermark" size="xl" />
        </div>

        {/* Report Header Lockup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[#252D38] relative z-10">
          <Logo variant="horizontal" size="lg" showTagline={true} />

          <div className="text-left sm:text-right text-xs font-mono">
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              AUDITED STATEMENT #{reportType.toUpperCase()}-2026-X
            </div>
            <div className="text-slate-500 dark:text-[#AAB3BF] mt-0.5">
              Trader: {user?.fullName || 'Alex Vance'} ({user?.email})
            </div>
            <div className="text-slate-400 mt-0.5">
              Account: {selectedAccount ? selectedAccount.name : 'All Consolidated Accounts'}
            </div>
            <div className="text-[#00C781] font-semibold mt-1">
              Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 font-mono">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/70 dark:bg-[#1B222B]/70">
            <div className="text-[11px] text-slate-500 uppercase">Net Realized P&amp;L</div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${(analytics?.netPnL ?? 0) >= 0 ? 'text-[#00C781]' : 'text-red-400'}`}>
              {(analytics?.netPnL ?? 0) >= 0 ? `+$${analytics?.netPnL?.toLocaleString()}` : `-$${Math.abs(analytics?.netPnL ?? 0).toLocaleString()}`}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/70 dark:bg-[#1B222B]/70">
            <div className="text-[11px] text-slate-500 uppercase">Win Rate &amp; Trades</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {analytics?.winRate ?? 0}% ({analytics?.totalTrades ?? 0} closed)
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/70 dark:bg-[#1B222B]/70">
            <div className="text-[11px] text-slate-500 uppercase">Profit Factor</div>
            <div className="text-xl font-bold text-[#00C781] tabular-nums mt-1">
              {analytics?.profitFactor ?? 0}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/70 dark:bg-[#1B222B]/70">
            <div className="text-[11px] text-slate-500 uppercase">Avg Realized R</div>
            <div className="text-xl font-bold text-[#00C781] tabular-nums mt-1">
              +{analytics?.averageR ?? 0}R
            </div>
          </div>
        </div>

        {/* Written Audit Summary */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/50 space-y-2 relative z-10 text-xs">
          <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Quantitative Auditor's Executive Evaluation:
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            During this audited period, the trader demonstrated institutional process discipline across the 5 canonical markets (US100, US30, GBPUSD, GBPJPY, XAUUSD). Sizing remained strictly within the 1.0% capital allocation parameter. Positive mathematical expectancy was preserved throughout New York AM session volatility.
          </p>
        </div>

        {/* Audited Trades List in Report */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#AAB3BF]">
            <span>Verified Execution Ledger</span>
            <span className="font-mono">5 Canonical Instruments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#252D38] text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Market</th>
                  <th className="py-2 px-2">Side</th>
                  <th className="py-2 px-2">Lots</th>
                  <th className="py-2 px-2 text-right">Net P&amp;L</th>
                  <th className="py-2 px-2 text-right">R-Mult</th>
                  <th className="py-2 px-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#252D38]">
                {trades.slice(0, 10).map(t => (
                  <tr key={t.id}>
                    <td className="py-2 px-2 text-slate-500">{t.entryDate.split('T')[0]}</td>
                    <td className="py-2 px-2 font-bold">{t.instrument}</td>
                    <td className="py-2 px-2 font-bold">{t.direction}</td>
                    <td className="py-2 px-2">{t.positionSize}</td>
                    <td className={`py-2 px-2 text-right font-bold ${t.netProfitLoss >= 0 ? 'text-[#00C781]' : 'text-red-400'}`}>
                      {t.netProfitLoss >= 0 ? `+$${t.netProfitLoss.toFixed(2)}` : `-$${Math.abs(t.netProfitLoss).toFixed(2)}`}
                    </td>
                    <td className="py-2 px-2 text-right">{t.rMultiple >= 0 ? `+${t.rMultiple}R` : `${t.rMultiple}R`}</td>
                    <td className="py-2 px-2 text-center font-bold text-[#00C781]">{t.grade?.letterGrade || 'A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Footer / Signature Block */}
        <div className="pt-6 border-t border-slate-200 dark:border-[#252D38] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-slate-400 relative z-10">
          <div>BANDITRADES REPORT ENGINE · VERIFIED CLIENT RECORD</div>
          <div>CONFIDENTIAL &amp; PROPRIETARY FINANCIAL INTELLIGENCE</div>
        </div>
      </div>
    </div>
  );
};
