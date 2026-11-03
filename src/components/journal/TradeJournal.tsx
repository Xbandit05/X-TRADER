/**
 * BANDITRADES — Trade Journal & Execution Management Workspace
 * TradeZella-style institutional trading ledger with:
 * - Realized P&L, R-Multiple, Grade, Setup tags, Win/Loss status pills
 * - Comprehensive slide-in / side Trade Review Drawer with 5 tabs:
 *   1. Overview & Sizing
 *   2. 8-Step Strategy Checklist
 *   3. Explainable Grade Audit (A+ to F breakdown)
 *   4. Visual Chart Replay Gallery (full-screen lightbox)
 *   5. Pre/Post Trade Reflection Notes
 * - Filtering by 5 Canonical Instruments, Sessions, Outcomes, Search, and CSV Export
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Download,
  Trash2,
  Edit3,
  ExternalLink,
  Camera,
  CheckCircle,
  XCircle,
  Maximize2,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Award,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  X
} from 'lucide-react';
import {
  Trade,
  CanonicalInstrument,
  CANONICAL_INSTRUMENTS,
  StrategyChecklistItem
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface TradeJournalProps {
  onOpenTradeModal: (trade?: Trade) => void;
  onOpenCsvModal: () => void;
  selectedTradeFromDash?: Trade | null;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({
  onOpenTradeModal,
  onOpenCsvModal,
  selectedTradeFromDash
}) => {
  const { selectedAccount } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('ALL');
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'BREAKEVEN'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'pnl' | 'r' | 'grade'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Active Trade Detail Drawer & Sub-Tab
  const [activeTrade, setActiveTrade] = useState<Trade | null>(selectedTradeFromDash || null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'checklist' | 'grading' | 'charts' | 'notes'>('overview');
  const [zoomScreenshot, setZoomScreenshot] = useState<string | null>(null);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const data = await api.getTrades({ accountId: selectedAccount?.id });
      setTrades(data);
      if (selectedTradeFromDash) {
        const found = data.find(t => t.id === selectedTradeFromDash.id);
        if (found) setActiveTrade(found);
      }
    } catch (err) {
      console.error('Failed to load trades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedTradeFromDash) {
      setActiveTrade(selectedTradeFromDash);
    }
  }, [selectedTradeFromDash]);

  const handleDeleteTrade = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trade journal record?')) {
      await api.deleteTrade(id);
      if (activeTrade?.id === id) setActiveTrade(null);
      await loadTrades();
    }
  };

  // Filter & Sort Trades
  const filteredTrades = trades
    .filter(t => {
      if (instrumentFilter !== 'ALL' && t.instrument !== instrumentFilter) return false;
      if (sessionFilter !== 'ALL' && t.tradingSession !== sessionFilter) return false;
      if (outcomeFilter === 'WIN' && t.netProfitLoss <= 0) return false;
      if (outcomeFilter === 'LOSS' && t.netProfitLoss >= 0) return false;
      if (outcomeFilter === 'BREAKEVEN' && t.netProfitLoss !== 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInst = t.instrument.toLowerCase().includes(q);
        const matchBroker = (t.brokerSymbol || '').toLowerCase().includes(q);
        const matchSetup = (t.setupType || '').toLowerCase().includes(q);
        const matchStrat = (t.strategyName || '').toLowerCase().includes(q);
        const matchThesis = (t.preTradeAnalysis || '').toLowerCase().includes(q);
        const matchReflect = (t.postTradeReflection || '').toLowerCase().includes(q);
        return matchInst || matchBroker || matchSetup || matchStrat || matchThesis || matchReflect;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
      } else if (sortField === 'pnl') {
        comparison = b.netProfitLoss - a.netProfitLoss;
      } else if (sortField === 'r') {
        comparison = b.rMultiple - a.rMultiple;
      } else if (sortField === 'grade') {
        const order: Record<string, number> = { 'A+': 5, A: 4, B: 3, C: 2, D: 1, F: 0 };
        const gA = order[a.grade?.letterGrade || 'C'] ?? 2;
        const gB = order[b.grade?.letterGrade || 'C'] ?? 2;
        comparison = gB - gA;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const handleExportCsv = () => {
    if (filteredTrades.length === 0) return;
    const headers = [
      'Trade ID',
      'Account ID',
      'Date',
      'Instrument',
      'Broker Symbol',
      'Direction',
      'Entry Price',
      'Exit Price',
      'Stop Loss',
      'Position Size',
      'Risk Percentage',
      'Gross PnL',
      'Commission',
      'Swap',
      'Net PnL',
      'R-Multiple',
      'Session',
      'Strategy',
      'Setup Type',
      'Grade',
      'Compliance'
    ];

    const rows = filteredTrades.map(t => [
      t.id,
      t.accountId,
      t.entryDate,
      t.instrument,
      t.brokerSymbol || t.instrument,
      t.direction,
      t.entryPrice,
      t.exitPrice,
      t.stopLoss,
      t.positionSize,
      t.riskPercentage,
      t.grossProfitLoss,
      t.commission,
      t.swap,
      t.netProfitLoss,
      t.rMultiple,
      t.tradingSession,
      `"${t.strategyName || ''}"`,
      `"${t.setupType || ''}"`,
      t.grade?.letterGrade || 'N/A',
      t.strategyCompliance ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CloudX_Journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate fallback checklist for trade if not stored
  const getTradeChecklist = (trade: Trade): StrategyChecklistItem[] => {
    if (trade.checklist && trade.checklist.length > 0) return trade.checklist;
    return [
      { step: 1, title: 'Step 1: Higher-Timeframe Bias (4H/1H/15M DOL)', status: 'Confirmed', notes: 'Higher-timeframe structure confirmed draw on liquidity.' },
      { step: 2, title: 'Step 2: Liquidity Sweep (EqH/EqL/Double Top/Bottom)', status: 'Confirmed', notes: 'Targeted liquidity pool purged by wick rejection.' },
      { step: 3, title: 'Step 3: CHoCH Confirmation (Shift on 5M/15M)', status: 'Confirmed', notes: 'Displacement body close confirmed market structure shift.' },
      { step: 4, title: 'Step 4: Fair Value Gap Formation', status: 'Confirmed', notes: 'Clean 3-candle imbalance formed during expansion.' },
      { step: 5, title: 'Step 5: Retest (NO RETEST = NO TRADE)', status: trade.retestOccurred !== false ? 'Confirmed' : 'Not confirmed', notes: trade.retestOccurred !== false ? 'Waited patiently for zone mitigation.' : 'VIOLATION: Entered before zone retest.' },
      { step: 6, title: 'Step 6: Entry Confirmation', status: trade.confirmationPresent !== false ? 'Confirmed' : 'Not confirmed', notes: 'Lower-timeframe buyer/seller confirmation signature validated.' },
      { step: 7, title: 'Step 7: Risk & Execution Pre-Flight', status: trade.riskPercentage <= 1.5 ? 'Confirmed' : 'Not confirmed', notes: `Position sized at ${trade.riskPercentage}% risk.` },
      { step: 8, title: 'Step 8: Post-Trade Review & Compliance', status: trade.strategyCompliance ? 'Confirmed' : 'Not confirmed', notes: trade.strategyCompliance ? '100% Trading plan compliance.' : 'Plan diverged.' }
    ];
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Controls & Filter Bar: TradeZella Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search setup, thesis, strategy, instrument (e.g. US100, FVG)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#222E42] bg-slate-50 dark:bg-[#18202F] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:border-[#00B2FE]"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Instrument Filter */}
          <select
            value={instrumentFilter}
            onChange={e => setInstrumentFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-800 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none font-mono"
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
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-800 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
          >
            <option value="ALL">All Sessions</option>
            <option value="Asian">Asian</option>
            <option value="London Open">London Open</option>
            <option value="London PM">London PM</option>
            <option value="New York AM">New York AM</option>
            <option value="New York PM">New York PM</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={e => setOutcomeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-800 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WIN">Winners Only</option>
            <option value="LOSS">Losses Only</option>
            <option value="BREAKEVEN">Breakeven</option>
          </select>

          <button
            onClick={onOpenCsvModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E42] bg-slate-50 dark:bg-[#18202F] text-xs font-semibold text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Import trades from broker CSV statement"
          >
            <FileSpreadsheet size={14} className="text-[#00B2FE]" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E42] bg-slate-50 dark:bg-[#18202F] text-xs font-semibold text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Export filtered records to CSV"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          <button
            onClick={() => onOpenTradeModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00B2FE] hover:bg-[#009BE0] text-[#090D14] text-xs font-bold transition-all shadow-xs"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Log Trade</span>
          </button>
        </div>
      </div>

      {/* Main Journal Grid & Trade Review Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table of Trades */}
        <div
          className={`p-5 rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] space-y-4 shadow-xs ${
            activeTrade ? 'lg:col-span-7' : 'lg:col-span-12'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8]">
            <span className="font-mono">
              Showing {filteredTrades.length} of {trades.length} audited positions
            </span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-400">Sort:</span>
              <button
                onClick={() => {
                  if (sortField === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else setSortField('date');
                }}
                className={`font-semibold hover:text-slate-900 dark:hover:text-white ${sortField === 'date' ? 'text-[#00B2FE]' : ''}`}
              >
                Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <span>·</span>
              <button
                onClick={() => {
                  if (sortField === 'r') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else setSortField('r');
                }}
                className={`font-semibold hover:text-slate-900 dark:hover:text-white ${sortField === 'r' ? 'text-[#00B2FE]' : ''}`}
              >
                R {sortField === 'r' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <span>·</span>
              <button
                onClick={() => {
                  if (sortField === 'pnl') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else setSortField('pnl');
                }}
                className={`font-semibold hover:text-slate-900 dark:hover:text-white ${sortField === 'pnl' ? 'text-[#00B2FE]' : ''}`}
              >
                P&amp;L {sortField === 'pnl' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>

          {filteredTrades.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1B222B] text-slate-400 flex items-center justify-center mx-auto">
                <Calendar size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No trade records match the current filter
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try clearing your search query or instrument filter, or log a new trade execution.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#252D38] text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Market</th>
                    <th className="py-2.5 px-2">Side</th>
                    <th className="py-2.5 px-2">Setup / Model</th>
                    <th className="py-2.5 px-2 text-right">Net P&amp;L</th>
                    <th className="py-2.5 px-2 text-right">R-Multiple</th>
                    <th className="py-2.5 px-2 text-center">Grade</th>
                    <th className="py-2.5 px-2 text-center">Charts</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#252D38]">
                  {filteredTrades.map(trade => {
                    const isSelected = activeTrade?.id === trade.id;
                    const isWin = trade.netProfitLoss > 0;
                    const isLoss = trade.netProfitLoss < 0;

                    return (
                      <tr
                        key={trade.id}
                        onClick={() => setActiveTrade(trade)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#00B2FE]/10 dark:bg-[#18202F] border-l-2 border-[#00B2FE]'
                            : 'hover:bg-slate-50 dark:hover:bg-[#18202F]/60'
                        }`}
                      >
                        {/* Status Pill (TradeZella Style) */}
                        <td className="py-3 px-2">
                          <span
                            className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                              isWin
                                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25'
                                : isLoss
                                ? 'bg-rose-500/15 text-rose-500 border border-rose-500/25'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isWin ? 'WIN' : isLoss ? 'LOSS' : 'BE'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-2 font-mono text-slate-500 dark:text-[#94A3B8] whitespace-nowrap text-[11px]">
                          {trade.entryDate.split('T')[0]}
                        </td>

                        {/* Market Instrument & Session */}
                        <td className="py-3 px-2">
                          <div className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                            {trade.instrument}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {trade.tradingSession}
                          </div>
                        </td>

                        {/* Side Pill */}
                        <td className="py-3 px-2">
                          <span
                            className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                              trade.direction === 'BUY'
                                ? 'bg-[#00B2FE]/15 text-[#00B2FE] border border-[#00B2FE]/25'
                                : 'bg-rose-500/15 text-rose-500 border border-rose-500/25'
                            }`}
                          >
                            {trade.direction === 'BUY' ? 'LONG' : 'SHORT'}
                          </span>
                        </td>

                        {/* Setup Model Tag */}
                        <td className="py-3 px-2 max-w-[150px] truncate font-medium text-slate-700 dark:text-slate-300">
                          <span className="truncate block" title={trade.setupType}>
                            {trade.setupType}
                          </span>
                        </td>

                        {/* Net Realized P&L */}
                        <td
                          className={`py-3 px-2 text-right font-mono font-bold tabular-nums whitespace-nowrap text-xs ${
                            isWin ? 'text-[#10B981]' : isLoss ? 'text-rose-500' : 'text-slate-400'
                          }`}
                        >
                          {trade.netProfitLoss >= 0
                            ? `+$${trade.netProfitLoss.toFixed(2)}`
                            : `-$${Math.abs(trade.netProfitLoss).toFixed(2)}`}
                        </td>

                        {/* R-Multiple */}
                        <td
                          className={`py-3 px-2 text-right font-mono font-bold tabular-nums whitespace-nowrap ${
                            trade.rMultiple >= 0 ? 'text-[#10B981]' : 'text-rose-500'
                          }`}
                        >
                          {trade.rMultiple >= 0 ? `+${trade.rMultiple}R` : `${trade.rMultiple}R`}
                        </td>

                        {/* Grade Letter */}
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${
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

                        {/* Charts Count */}
                        <td className="py-3 px-2 text-center">
                          {trade.screenshots?.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#AAB3BF] font-mono">
                              <Camera size={12} className="text-[#00C781]" />
                              {trade.screenshots.length}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenTradeModal(trade)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#252D38]"
                              title="Edit Trade"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={e => handleDeleteTrade(trade.id, e)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              title="Delete Trade"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dedicated Trade Review Panel (TradeZella Style Slide-in Drawer) */}
        {activeTrade && (
          <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] space-y-4 shadow-lg animate-in slide-in-from-right duration-200">
            {/* Header of Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222E42]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
                    {activeTrade.instrument}
                  </span>
                  <span
                    className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                      activeTrade.direction === 'BUY'
                        ? 'bg-[#00B2FE]/15 text-[#00B2FE] border border-[#00B2FE]/25'
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/25'
                    }`}
                  >
                    {activeTrade.direction === 'BUY' ? 'LONG' : 'SHORT'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">#{activeTrade.id}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 font-mono">
                  {activeTrade.tradingSession} · {activeTrade.entryDate.split('T')[0]}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenTradeModal(activeTrade)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222E42] text-xs text-slate-600 dark:text-[#94A3B8] hover:text-white"
                  title="Edit Trade"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => setActiveTrade(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202F]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Top Stat Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#18202F] text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Net P&amp;L</span>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    activeTrade.netProfitLoss >= 0 ? 'text-[#10B981]' : 'text-rose-500'
                  }`}
                >
                  {activeTrade.netProfitLoss >= 0
                    ? `+$${activeTrade.netProfitLoss.toFixed(2)}`
                    : `-$${Math.abs(activeTrade.netProfitLoss).toFixed(2)}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">R Realized</span>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    activeTrade.rMultiple >= 0 ? 'text-[#10B981]' : 'text-rose-500'
                  }`}
                >
                  {activeTrade.rMultiple >= 0 ? `+${activeTrade.rMultiple}R` : `${activeTrade.rMultiple}R`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Trade Grade</span>
                <span className="text-sm font-bold text-[#10B981] tabular-nums">
                  {activeTrade.grade?.letterGrade || 'A'} ({activeTrade.grade?.overallScore ?? 92})
                </span>
              </div>
            </div>

            {/* Navigation Tabs in Drawer */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100 dark:border-[#222E42] text-xs font-medium">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'checklist', label: '8-Step Checklist' },
                { id: 'grading', label: 'Grade Audit' },
                { id: 'charts', label: `Charts (${activeTrade.screenshots?.length || 0})` },
                { id: 'notes', label: 'Notes' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setDrawerTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    drawerTab === t.id
                      ? 'bg-[#00B2FE]/15 text-[#00B2FE] border border-[#00B2FE]/30 font-bold'
                      : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview & Price Executions */}
            {drawerTab === 'overview' && (
              <div className="space-y-3 text-xs animate-in fade-in duration-150">
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500 dark:text-[#AAB3BF]">Entry / Exit Price</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.entryPrice} → {activeTrade.exitPrice}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500 dark:text-[#AAB3BF]">Stop Loss / Risk Distance</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.stopLoss} ({(Math.abs(activeTrade.entryPrice - activeTrade.stopLoss)).toFixed(2)} pts)
                    </span>
                  </div>
                  {activeTrade.takeProfit && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#202731]">
                      <span className="text-slate-500 dark:text-[#AAB3BF]">Target (TP)</span>
                      <span className="font-mono font-medium text-[#00C781]">{activeTrade.takeProfit}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500 dark:text-[#AAB3BF]">Position Sizing &amp; Risk</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.positionSize} Lots ({activeTrade.riskPercentage}% Risk)
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500 dark:text-[#AAB3BF]">Gross P&amp;L / Commissions</span>
                    <span className="font-mono text-slate-900 dark:text-[#F4F6F8]">
                      ${activeTrade.grossProfitLoss.toFixed(2)} (Comm: -${activeTrade.commission.toFixed(2)})
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500 dark:text-[#AAB3BF]">Holding Duration</span>
                    <span className="font-mono text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.holdingDurationMinutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500 dark:text-[#AAB3BF]">Psychological State</span>
                    <span className="font-semibold text-[#00C781]">{activeTrade.emotionalState}</span>
                  </div>
                </div>

                {/* Setup Type */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50 dark:bg-[#1B222B]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Trading Strategy</span>
                  <span className="font-semibold text-slate-900 dark:text-[#F4F6F8]">
                    {activeTrade.strategyName || 'LIQUIDITY SWEEP → CHoCH → FVG RETEST'}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Setup Model: {activeTrade.setupType}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: 8-Step Strategy Checklist */}
            {drawerTab === 'checklist' && (
              <div className="space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1">
                  <span className="font-mono font-bold text-slate-500 uppercase text-[10px]">
                    8-Step Strategy Execution Audit
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#00C781]">
                    NO RETEST = NO TRADE
                  </span>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {getTradeChecklist(activeTrade).map(item => {
                    const isConfirmed = item.status === 'Confirmed';
                    return (
                      <div
                        key={item.step}
                        className={`p-2.5 rounded-xl border text-xs ${
                          isConfirmed
                            ? 'border-[#00C781]/30 bg-[#00C781]/5'
                            : 'border-rose-500/30 bg-rose-500/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                isConfirmed ? 'bg-[#00C781] text-[#0B0D10]' : 'bg-rose-500 text-white'
                              }`}
                            >
                              {isConfirmed ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-[#F4F6F8]">
                              {item.title}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              isConfirmed ? 'bg-[#00C781]/20 text-[#00C781]' : 'bg-rose-500/20 text-rose-500'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-[#AAB3BF] mt-1 pl-7">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Grade Breakdown Audit */}
            {drawerTab === 'grading' && (
              <div className="space-y-3 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1B222B] border border-slate-200 dark:border-[#252D38]">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-mono">Overall Grade</span>
                    <span className="text-2xl font-black font-mono text-[#00C781]">
                      {activeTrade.grade?.letterGrade || 'A'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-mono">Total Points</span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.grade?.overallScore ?? 92}/100
                    </span>
                  </div>
                </div>

                {/* 5 Weighted Categories */}
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500">Setup Quality (25%)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.grade?.setupQuality ?? 23} / 25
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500">Entry Execution (20%)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.grade?.entryExecution ?? 19} / 20
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500">Risk Management (20%)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.grade?.riskManagement ?? 20} / 20
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500">Strategy Compliance (20%)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.grade?.strategyCompliance ?? 18} / 20
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#202731]">
                    <span className="text-slate-500">Exit Execution (15%)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#F4F6F8]">
                      {activeTrade.grade?.exitExecution ?? 14} / 15
                    </span>
                  </div>
                </div>

                {/* Strengths & Recommendations */}
                {activeTrade.grade?.strengths && activeTrade.grade.strengths.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#00C781] block">Identified Strengths</span>
                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      {activeTrade.grade.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check size={12} className="text-[#00C781] shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Chart Replay Screenshots */}
            {drawerTab === 'charts' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {activeTrade.screenshots && activeTrade.screenshots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeTrade.screenshots.map(sc => (
                      <div
                        key={sc.id}
                        onClick={() => setZoomScreenshot(sc.url)}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-[#2E3845] aspect-video bg-black cursor-zoom-in"
                      >
                        <img src={sc.url} alt={sc.type} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-black/80 text-white">
                          {sc.type}
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Maximize2 size={18} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No charts attached. Edit this trade to attach before &amp; after screenshots.
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Pre & Post Trade Notes */}
            {drawerTab === 'notes' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50 dark:bg-[#1B222B]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Pre-Trade Thesis &amp; Market Context
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeTrade.preTradeAnalysis || 'No pre-trade context logged.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50 dark:bg-[#1B222B]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Post-Trade Reflection
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeTrade.postTradeReflection || 'No reflection logged.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Screenshot Zoom Lightbox Modal */}
      {zoomScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 cursor-zoom-out animate-in fade-in duration-150"
          onClick={() => setZoomScreenshot(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img src={zoomScreenshot} alt="Zoomed screenshot" className="max-w-full max-h-[88vh] rounded-xl object-contain shadow-2xl" />
            <button
              onClick={() => setZoomScreenshot(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
