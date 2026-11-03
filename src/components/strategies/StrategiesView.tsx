/**
 * BANDITRADES — Personal Strategy Rulebook & Systematic Model Workspace
 * Comprehensive institutional strategy framework featuring:
 * - Built-in primary template: LIQUIDITY SWEEP → CHoCH → FVG RETEST
 * - Strategy Timeframes: 4H context, 1H structural, 15M bias, 5M execution
 * - 8-Step Verification Workflow with strict "NO RETEST = NO TRADE" discipline
 * - Additional confluences & interactive checklist evaluation
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Shield,
  Target,
  ArrowRight,
  Clock,
  HelpCircle,
  Flame,
  Check,
  X,
  Copy,
  ChevronRight
} from 'lucide-react';
import {
  TradingStrategy,
  CanonicalInstrument,
  CANONICAL_INSTRUMENTS,
  TradingSession,
  StrategyWorkflowStep,
  StrategyChecklistItem
} from '../../types/index.ts';
import { api } from '../../services/api.ts';

export const StrategiesView: React.FC = () => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Interactive Checklist Simulator State for the selected strategy
  const [interactiveChecklist, setInteractiveChecklist] = useState<StrategyChecklistItem[]>([
    { step: 1, title: 'Step 1: Higher-Timeframe Bias (15M / 1H / 4H)', status: 'Confirmed', notes: '15m trend structure aligned with 4H draw on liquidity at previous day high.' },
    { step: 2, title: 'Step 2: Liquidity Sweep (EqH / EqL / Double Top/Bottom)', status: 'Confirmed', notes: 'Asian session equal lows purged cleanly by 12 points.' },
    { step: 3, title: 'Step 3: CHoCH Confirmation (Shift on 5M/15M)', status: 'Confirmed', notes: '5m candle body closed decisively above recent swing high.' },
    { step: 4, title: 'Step 4: Fair Value Gap (Displacement Imbalance)', status: 'Confirmed', notes: '3-candle impulse formed fresh bullish FVG with unmitigated wick boundaries.' },
    { step: 5, title: 'Step 5: Retest (CORE PRINCIPLE: NO RETEST = NO TRADE)', status: 'Confirmed', notes: 'Price returned cleanly to FVG 50% Consequent Encroachment.' },
    { step: 6, title: 'Step 6: Entry Confirmation (Buyer/Seller Rejection)', status: 'Confirmed', notes: 'Strong buyer rejection wick printed on 1m inside the FVG zone.' },
    { step: 7, title: 'Step 7: Risk & Execution Pre-Flight', status: 'Confirmed', notes: 'Risk capped at 1.0%, hard SL placed 5 pts below displacement swing low.' },
    { step: 8, title: 'Step 8: Post-Trade Review & Compliance Audit', status: 'Confirmed', notes: 'All rules followed. 2.97R captured at major opposing liquidity pool.' }
  ]);

  // Form State for creating a new model
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instruments, setInstruments] = useState<CanonicalInstrument[]>(['US100', 'US30']);
  const [preferredSessions, setPreferredSessions] = useState<TradingSession[]>(['New York AM', 'London Open']);
  const [higherTimeframeBias, setHigherTimeframeBias] = useState('');
  const [liquidityConditions, setLiquidityConditions] = useState('');
  const [marketStructureConditions, setMarketStructureConditions] = useState('');
  const [chochBosRequirements, setChochBosRequirements] = useState('');
  const [fairValueGapRequirements, setFairValueGapRequirements] = useState('');
  const [orderBlockRequirements, setOrderBlockRequirements] = useState('');
  const [entryConfirmation, setEntryConfirmation] = useState('');
  const [stopLossRules, setStopLossRules] = useState('');
  const [takeProfitRules, setTakeProfitRules] = useState('');
  const [riskManagementRules, setRiskManagementRules] = useState('1.0% maximum risk per position. Cap at 2 positions per day.');
  const [invalidatingConditions, setInvalidatingConditions] = useState('');
  const [winRateTarget, setWinRateTarget] = useState(70);

  const loadStrategies = async () => {
    setLoading(true);
    try {
      const data = await api.getStrategies();
      setStrategies(data);
      if (data.length > 0 && !selectedStrategy) {
        // Prefer the primary strategy if available
        const primary = data.find(s => s.name.includes('LIQUIDITY SWEEP') || s.isPrimary) || data[0];
        setSelectedStrategy(primary);
      }
    } catch (err) {
      console.error('Failed to load strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setInstruments(['US100', 'US30']);
    setPreferredSessions(['New York AM', 'London Open']);
    setHigherTimeframeBias('');
    setLiquidityConditions('');
    setMarketStructureConditions('');
    setChochBosRequirements('');
    setFairValueGapRequirements('');
    setOrderBlockRequirements('');
    setEntryConfirmation('');
    setStopLossRules('');
    setTakeProfitRules('');
    setRiskManagementRules('1.0% maximum risk per position. Cap at 2 positions per day.');
    setInvalidatingConditions('');
    setWinRateTarget(70);
    setIsCreating(false);
  };

  const handleApplyTemplate = (type: 'primary' | 'silver_bullet' | 'london_sweep') => {
    if (type === 'primary') {
      setName('LIQUIDITY SWEEP → CHoCH → FVG RETEST');
      setDescription('Primary institutional trading model. Liquidity sweep of key highs/lows, followed by Change of Character on M5/M15, displacement Fair Value Gap creation, and mandatory disciplined retest before execution.');
      setInstruments(['US100', 'US30', 'GBPUSD', 'GBPJPY', 'XAUUSD']);
      setPreferredSessions(['New York AM', 'London Open']);
      setHigherTimeframeBias('Identify market direction using the 15-minute structure. Use 1H and 4H charts to establish broader context and draw on liquidity (DOL).');
      setLiquidityConditions('Sweep of Equal highs, Equal lows, Double/Triple tops or bottoms, swing extremes, or clearly identifiable liquidity pools.');
      setMarketStructureConditions('Wait for a valid Change of Character (CHoCH) on 5M/15M with displacement body close.');
      setChochBosRequirements('Decisive candle body close beyond recent swing point with institutional impulse.');
      setFairValueGapRequirements('Identify 3-candle displacement creating fresh bullish or bearish FVG with upper and lower boundaries.');
      setOrderBlockRequirements('Last opposing candle prior to displacement impulse; breaker block mitigation.');
      setEntryConfirmation('NO RETEST = NO TRADE. Wait for price to return to the FVG or CHoCH breakout zone with buyer/seller confirmation signature.');
      setStopLossRules('Beyond structural invalidation (sweep extreme or displacement swing) with volatility buffer.');
      setTakeProfitRules('Opposing higher-timeframe liquidity pool or minimum 2R-3R target.');
      setRiskManagementRules('Maximum 1.0% account risk per position. Cap at 2 positions per day.');
      setInvalidatingConditions('FVG closed through with body close, red-folder news release, or lack of retest.');
      setWinRateTarget(72);
    } else if (type === 'silver_bullet') {
      setName('ICT Silver Bullet (NY AM)');
      setDescription('10:00–11:00 AM NY local time liquidity purge into 5m Fair Value Gap with MSS displacement.');
      setInstruments(['US100', 'US30']);
      setPreferredSessions(['New York AM']);
      setHigherTimeframeBias('Daily draw on liquidity (DOL) toward previous day high/low.');
      setLiquidityConditions('Sweep of Asian range highs or clean equal highs (EQH).');
      setMarketStructureConditions('1m or 5m Change of Character with aggressive body expansion.');
      setChochBosRequirements('Strong body close breaking recent swing high/low.');
      setFairValueGapRequirements('Minimum 3-candle imbalance with unfilled price wick.');
      setOrderBlockRequirements('Discount OB preceding displacement.');
      setEntryConfirmation('Limit order at FVG 50% Consequent Encroachment (CE).');
      setStopLossRules('Beyond the swing low that formed the displacement.');
      setTakeProfitRules('Opposing internal range liquidity or fixed 2R minimum.');
      setRiskManagementRules('1.0% account risk cap. Max 2 executions per session.');
      setInvalidatingConditions('FVG closed through or high-impact red folder news in next 5 min.');
      setWinRateTarget(68);
    } else if (type === 'london_sweep') {
      setName('London Open Liquidity Expansion');
      setDescription('Purge of Asian session range extreme during 07:00–08:30 GMT followed by clean reversion.');
      setInstruments(['GBPUSD', 'GBPJPY', 'XAUUSD']);
      setPreferredSessions(['London Open']);
      setHigherTimeframeBias('4H institutional order block alignment.');
      setLiquidityConditions('Asian high or low swept by 10-20 pips.');
      setMarketStructureConditions('15m candle close back inside previous consolidation range.');
      setChochBosRequirements('BOS with institutional volume confirmation.');
      setFairValueGapRequirements('Entry at newly printed 15m breaker or FVG.');
      setOrderBlockRequirements('Mitigation of London Judas swing apex.');
      setEntryConfirmation('M5 wick rejection and volume spike.');
      setStopLossRules('5 pips beyond the sweep extreme.');
      setTakeProfitRules('Opposite Asian session extreme.');
      setRiskManagementRules('1.0% maximum risk. Move to breakeven at 1.5R.');
      setInvalidatingConditions('Clean momentum continuation without any rejection.');
      setWinRateTarget(65);
    }
  };

  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const created = await api.createStrategy({
        name,
        description,
        isPrimary: name.includes('LIQUIDITY SWEEP'),
        corePrinciple: 'NO RETEST = NO TRADE',
        instruments,
        preferredSessions,
        higherTimeframeBias,
        liquidityConditions,
        marketStructureConditions,
        chochBosRequirements,
        fairValueGapRequirements,
        orderBlockRequirements,
        entryConfirmation,
        stopLossRules,
        takeProfitRules,
        riskManagementRules,
        invalidatingConditions,
        winRateTarget
      });

      setStrategies([...strategies, created]);
      setSelectedStrategy(created);
      resetForm();
    } catch (err) {
      console.error('Failed to create strategy:', err);
    }
  };

  // Toggle checklist status in interactive simulator
  const cycleStatus = (index: number) => {
    const statuses: StrategyChecklistItem['status'][] = [
      'Confirmed',
      'Awaiting confirmation',
      'Not confirmed',
      'Not applicable'
    ];
    setInteractiveChecklist(prev => {
      const next = [...prev];
      const cur = next[index].status;
      const curIdx = statuses.indexOf(cur);
      next[index] = {
        ...next[index],
        status: statuses[(curIdx + 1) % statuses.length]
      };
      return next;
    });
  };

  const confirmedCount = interactiveChecklist.filter(c => c.status === 'Confirmed').length;
  const checklistScore = Math.round((confirmedCount / interactiveChecklist.length) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: TradeZella Style Header */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#00B2FE] tracking-wider uppercase">
              STRATEGY LAB &amp; RULEBOOK
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-mono text-slate-500">CLOUD X DISCIPLINE ENGINE</span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight mt-0.5">
            Systematic Setup Architecture &amp; Playbook
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
            Institutional trading models. The Trade Grading Engine and Cloud AI evaluate every execution against these exact criteria.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setIsCreating(true);
              handleApplyTemplate('primary');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#18202F] dark:hover:bg-[#222E42] text-slate-800 dark:text-[#F8FAFC] text-xs font-bold transition-all border border-slate-200 dark:border-[#222E42]"
          >
            <Sparkles size={14} className="text-[#00B2FE]" />
            <span>Load Primary Template</span>
          </button>
          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedStrategy(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00B2FE] hover:bg-[#009BE0] text-[#090D14] text-xs font-bold transition-all shadow-xs"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Build New Model</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Strategy Playbook Cards (4 Cols) */}
        <div className="lg:col-span-4 p-4 rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider">
              Playbook Models ({strategies.length})
            </span>
            <span className="text-[11px] font-mono text-[#00B2FE]">ACTIVE</span>
          </div>

          <div className="space-y-2.5">
            {strategies.map(s => {
              const isSelected = selectedStrategy?.id === s.id && !isCreating;
              const isPrimary = s.name.includes('LIQUIDITY SWEEP') || s.isPrimary;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedStrategy(s);
                    setIsCreating(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#00B2FE] bg-[#00B2FE]/5 dark:bg-[#18202F] shadow-xs ring-1 ring-[#00B2FE]'
                      : 'border-slate-200 dark:border-[#1C2638] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#0F141F]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      {isPrimary && (
                        <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#00C781]/20 text-[#00C781] uppercase block mb-1">
                          ★ PRIMARY USER MODEL
                        </span>
                      )}
                      <h4 className="font-bold text-xs text-slate-900 dark:text-[#F4F6F8]">
                        {s.name}
                      </h4>
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#252D38] text-slate-700 dark:text-slate-300 font-bold shrink-0">
                      {s.winRateTarget}% WR
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-[#AAB3BF] line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-[#202731]">
                    {s.instruments.map(inst => (
                      <span
                        key={inst}
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#222B36] text-slate-700 dark:text-slate-300"
                      >
                        {inst}
                      </span>
                    ))}
                    {s.preferredSessions.map(sess => (
                      <span
                        key={sess}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#1B222B] text-slate-500"
                      >
                        {sess}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Model Inspector or Model Builder Form (8 Cols) */}
        <div className="lg:col-span-8">
          {isCreating ? (
            /* Strategy Builder Form */
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#252D38]">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
                    Strategy Model Architect
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#AAB3BF]">
                    Construct your verifiable institutional rulebook checklist
                  </p>
                </div>

                {/* Templates Quick Actions */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Pre-fill:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('primary')}
                    className="px-2.5 py-1 text-xs rounded-lg border border-[#00C781]/40 bg-[#00C781]/10 text-[#00C781] font-mono font-bold hover:bg-[#00C781]/20 transition-colors"
                  >
                    Primary 8-Step
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('silver_bullet')}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] hover:bg-slate-100 dark:hover:bg-[#252D38] text-slate-700 dark:text-slate-300 font-mono transition-colors"
                  >
                    Silver Bullet
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveStrategy} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase mb-1">
                      Strategy Model Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. LIQUIDITY SWEEP → CHoCH → FVG RETEST"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase mb-1">
                      Target Win Rate (%)
                    </label>
                    <input
                      type="number"
                      value={winRateTarget}
                      onChange={e => setWinRateTarget(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase mb-1">
                    Model Summary &amp; Edge Mechanics
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Concise overview of the systematic edge..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                  />
                </div>

                {/* Technical Architecture Checkpoints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-[#252D38]">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                      1. Higher-Timeframe Bias (HTF Structure &amp; DOL)
                    </label>
                    <input
                      type="text"
                      value={higherTimeframeBias}
                      onChange={e => setHigherTimeframeBias(e.target.value)}
                      placeholder="e.g. 15m structure aligned with 1H/4H draw on liquidity"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                      2. Liquidity Sweep Event
                    </label>
                    <input
                      type="text"
                      value={liquidityConditions}
                      onChange={e => setLiquidityConditions(e.target.value)}
                      placeholder="e.g. Equal highs/lows, double tops/bottoms, swing extremes"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                      3. CHoCH / Market Structure Shift
                    </label>
                    <input
                      type="text"
                      value={chochBosRequirements}
                      onChange={e => setChochBosRequirements(e.target.value)}
                      placeholder="e.g. Decisive 5m body close breaking recent swing high/low"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                      4. Fair Value Gap Displacement
                    </label>
                    <input
                      type="text"
                      value={fairValueGapRequirements}
                      onChange={e => setFairValueGapRequirements(e.target.value)}
                      placeholder="e.g. 3-candle imbalance with clean upper and lower wick gap"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                      5. Mandatory Retest &amp; Confirmation Rule
                    </label>
                    <input
                      type="text"
                      value={entryConfirmation}
                      onChange={e => setEntryConfirmation(e.target.value)}
                      placeholder="NO RETEST = NO TRADE. Wait for zone pullback + rejection wick."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-[#AAB3BF] mb-1">
                      6. Stop Loss &amp; Target Liquidity Pool
                    </label>
                    <input
                      type="text"
                      value={stopLossRules}
                      onChange={e => setStopLossRules(e.target.value)}
                      placeholder="Structural invalidation beyond sweep extreme; Target 2R+"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-rose-500 mb-1">
                    Strict Invalidation Conditions
                  </label>
                  <input
                    type="text"
                    value={invalidatingConditions}
                    onChange={e => setInvalidatingConditions(e.target.value)}
                    placeholder="e.g. 5m candle body closes through the FVG; red folder news; missed retest"
                    className="w-full px-3 py-1.5 rounded-lg border border-rose-500/30 bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#252D38]">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold transition-all shadow-xs"
                  >
                    Save &amp; Activate Model
                  </button>
                </div>
              </form>
            </div>
          ) : selectedStrategy ? (
            /* Selected Strategy Detailed Specification */
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Header Card */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#202731]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-[#00C781] uppercase tracking-wider">
                        ACTIVE INSTITUTIONAL MODEL
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-xs text-slate-500 dark:text-[#AAB3BF] font-mono">
                        Target {selectedStrategy.winRateTarget}% Win Rate
                      </span>
                      {selectedStrategy.name.includes('LIQUIDITY SWEEP') && (
                        <span className="px-2 py-0.5 rounded-full bg-[#00C781]/15 text-[#00C781] text-[10px] font-mono font-bold">
                          PRIMARY USER MODEL
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-[#F4F6F8] tracking-tight">
                      {selectedStrategy.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-[#AAB3BF] mt-1.5 leading-relaxed max-w-3xl">
                      {selectedStrategy.description}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#00C781]/15 text-[#00C781] text-xs font-bold font-mono">
                      STATUS: ACTIVE
                    </span>
                  </div>
                </div>

                {/* Core Strategy Principle Banner: NO RETEST = NO TRADE */}
                <div className="mt-4 p-3.5 rounded-xl border border-[#00C781]/30 bg-[#00C781]/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#00C781]/20 flex items-center justify-center text-[#00C781] shrink-0 font-bold">
                      <Shield size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#00C781]">
                        CORE STRATEGY PRINCIPLE
                      </div>
                      <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                        NO RETEST = NO TRADE
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-[#AAB3BF] font-mono hidden sm:inline text-right">
                    A missed setup must never be converted into a forced entry.
                  </span>
                </div>

                {/* 4 Multi-Timeframe Roadmap Grid */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#202731]">
                  <div className="text-xs font-bold text-slate-500 dark:text-[#AAB3BF] uppercase tracking-wider mb-2.5">
                    Multi-Timeframe Execution Matrix
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50 dark:bg-[#1B222B]">
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block">Context</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">4H Chart</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-sans">
                        Broader market context, institutional macro order flow &amp; daily pools.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50 dark:bg-[#1B222B]">
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block">Structure</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">1H Chart</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-sans">
                        Structural context, breaker blocks &amp; HTF imbalances/FVGs.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50 dark:bg-[#1B222B]">
                      <span className="text-[10px] text-[#00C781] font-bold uppercase block">Directional Bias</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">15M Chart</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-sans">
                        Primary directional bias, internal structure &amp; swing liquidity.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-[#00C781]/40 bg-[#00C781]/5 dark:bg-[#1B222B]">
                      <span className="text-[10px] text-[#00C781] font-bold uppercase block">Execution</span>
                      <span className="text-sm font-bold text-[#00C781]">5M Chart</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-sans">
                        Primary execution, displacement shift &amp; zone retest.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Confluences Strip */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#202731]">
                  <div className="text-xs font-bold text-slate-500 dark:text-[#AAB3BF] uppercase tracking-wider mb-2">
                    Permitted Additional Confluences (Contextual Only)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Order Blocks',
                      'Higher-timeframe FVGs',
                      'Support & Resistance',
                      'Trendline Breaks & Retests',
                      'Premium & Discount Zones',
                      'Equal Highs & Lows (EQH/EQL)',
                      'Market Session Liquidity'
                    ].map(conf => (
                      <span
                        key={conf}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#252D38] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50"
                      >
                        + {conf}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 8-Step Interactive Strategy Workflow */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
                      8-Step Institutional Execution Workflow
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-[#AAB3BF]">
                      Required procedural sequence before entering any position
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#00C781] font-bold">
                    STEPS 1 TO 8 MUST BE SATISFIED
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      step: 1,
                      name: 'STEP 1 — HIGHER-TIMEFRAME BIAS',
                      subtitle: 'Multi-Timeframe Structure & Draw on Liquidity (DOL)',
                      desc: 'Identify market direction using the 15-minute structure. Use 1H and 4H charts to establish broader context. Identify important highs, lows, liquidity pools and relevant imbalances.'
                    },
                    {
                      step: 2,
                      name: 'STEP 2 — LIQUIDITY SWEEP',
                      subtitle: 'Targeted Liquidity Purge (EqH, EqL, Double/Triple Tops/Bottoms)',
                      desc: 'Look for liquidity being taken from: Equal highs, Equal lows, Double tops, Double bottoms, Triple tops, Triple bottoms, Important swing highs, Important swing lows, or clearly identifiable liquidity pools. A trendline break and retest may be recorded as additional contextual evidence of a possible liquidity hunt, but must not independently trigger an entry.'
                    },
                    {
                      step: 3,
                      name: 'STEP 3 — CHoCH CONFIRMATION',
                      subtitle: 'Change of Character Shift on M5/M15',
                      desc: 'Wait for a valid Change of Character after the liquidity event. Record: Direction of structural shift, Relevant swing level, Confirmation timeframe, Supporting evidence. Do not treat every candle break as a confirmed CHoCH.'
                    },
                    {
                      step: 4,
                      name: 'STEP 4 — FAIR VALUE GAP',
                      subtitle: 'Displacement & Imbalance Boundaries',
                      desc: 'Identify the displacement associated with the structural shift. Record: Bullish or bearish FVG, Formation timeframe, Upper and lower boundaries, Whether the imbalance remains valid, Whether price has already mitigated it.'
                    },
                    {
                      step: 5,
                      name: 'STEP 5 — RETEST (CORE RULE: NO RETEST = NO TRADE)',
                      subtitle: 'Patient Zone Pullback',
                      desc: 'Wait for price to return to: The relevant FVG, The CHoCH breakout zone where applicable. Do not encourage immediate entries after displacement. A missed setup must never be converted into a forced entry.'
                    },
                    {
                      step: 6,
                      name: 'STEP 6 — ENTRY CONFIRMATION',
                      subtitle: 'Buyer / Seller Rejection Validation',
                      desc: 'For bullish setups, require buyer confirmation. For bearish setups, require seller confirmation. Allow traders to document their specific confirmation method (e.g. rejection wick, lower timeframe MSS).'
                    },
                    {
                      step: 7,
                      name: 'STEP 7 — RISK AND EXECUTION',
                      subtitle: 'Institutional Risk Pre-Flight',
                      desc: 'Before entry, require: Entry price, Stop loss, Invalidation level, Position size, Risk amount, Target, Planned R:R. Place the stop according to structural invalidation and the trader\'s risk model, with an appropriate buffer for instrument volatility. Do not recommend arbitrary stop distances.'
                    },
                    {
                      step: 8,
                      name: 'STEP 8 — POST-TRADE REVIEW',
                      subtitle: 'Fidelity Audit & Plan Compliance',
                      desc: 'Record: Whether all setup conditions were satisfied, Whether entry was early or late, Whether the retest occurred, Whether confirmation was present, Whether risk rules were followed, Whether exit followed the trading plan.'
                    }
                  ].map(item => (
                    <div
                      key={item.step}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 hover:border-[#00C781]/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#00C781]/15 text-[#00C781] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-[#F4F6F8]">
                              {item.name}
                            </h5>
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                              {item.subtitle}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-[#AAB3BF] mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Checklist Simulation */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#151A20] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
                        Interactive Trade Checklist Simulator
                      </h4>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#00C781]/15 text-[#00C781]">
                        {confirmedCount}/8 Confirmed ({checklistScore}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-0.5">
                      Click any condition to cycle through Confirmed, Awaiting Confirmation, Not Confirmed, or Not Applicable.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {interactiveChecklist.map((item, idx) => {
                    const isConfirmed = item.status === 'Confirmed';
                    const isAwaiting = item.status === 'Awaiting confirmation';
                    const isNotConfirmed = item.status === 'Not confirmed';

                    return (
                      <div
                        key={item.step}
                        onClick={() => cycleStatus(idx)}
                        className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-3 ${
                          isConfirmed
                            ? 'border-[#00C781]/40 bg-[#00C781]/5'
                            : isAwaiting
                            ? 'border-amber-500/40 bg-amber-500/5'
                            : isNotConfirmed
                            ? 'border-rose-500/40 bg-rose-500/5'
                            : 'border-slate-200 dark:border-[#252D38] bg-slate-50 dark:bg-[#1B222B]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              isConfirmed
                                ? 'bg-[#00C781] text-[#0B0D10]'
                                : isAwaiting
                                ? 'bg-amber-500 text-[#0B0D10]'
                                : isNotConfirmed
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                            }`}
                          >
                            {isConfirmed ? (
                              <Check size={14} strokeWidth={3} />
                            ) : isNotConfirmed ? (
                              <X size={14} strokeWidth={3} />
                            ) : (
                              <Clock size={14} />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-[#F4F6F8] block">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-[#AAB3BF]">
                              {item.notes}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                            isConfirmed
                              ? 'bg-[#00C781]/20 text-[#00C781]'
                              : isAwaiting
                              ? 'bg-amber-500/20 text-amber-500'
                              : isNotConfirmed
                              ? 'bg-rose-500/20 text-rose-500'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 border border-slate-200 dark:border-[#252D38] rounded-2xl">
              Select a strategy model on the left or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
