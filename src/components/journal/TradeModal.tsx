/**
 * BANDITRADES — Trade Entry & Editing Modal
 * Comprehensive institutional trade logger with instant R calculation and screenshot attachment
 */

import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Image as ImageIcon, Camera } from 'lucide-react';
import {
  CanonicalInstrument,
  CANONICAL_INSTRUMENTS,
  Trade,
  TradingSession,
  TradingStrategy,
  TradeScreenshot
} from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import confetti from 'canvas-confetti';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradeData: Partial<Trade>) => Promise<void>;
  editTrade?: Trade | null;
  strategies: TradingStrategy[];
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editTrade,
  strategies
}) => {
  const { accounts, selectedAccount } = useAuth();

  const [accountId, setAccountId] = useState(selectedAccount?.id || accounts[0]?.id || '');
  const [instrument, setInstrument] = useState<CanonicalInstrument>('US100');
  const [brokerSymbol, setBrokerSymbol] = useState('US100F');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState<number | ''>(20240.0);
  const [exitPrice, setExitPrice] = useState<number | ''>(20380.0);
  const [stopLoss, setStopLoss] = useState<number | ''>(20180.0);
  const [takeProfit, setTakeProfit] = useState<number | ''>(20400.0);
  const [positionSize, setPositionSize] = useState<number | ''>(1.5);
  const [riskPercentage, setRiskPercentage] = useState<number | ''>(1.0);
  const [grossPnL, setGrossPnL] = useState<number | ''>(2100);
  const [commission, setCommission] = useState<number | ''>(12.0);
  const [swap, setSwap] = useState<number | ''>(0);
  const [tradingSession, setTradingSession] = useState<TradingSession>('New York AM');
  const [strategyId, setStrategyId] = useState<string>(strategies[0]?.id || '');
  const [setupType, setSetupType] = useState('10:00 AM NY FVG Retest + MSS');
  const [marketConditions, setMarketConditions] = useState<any>('Trending Bullish');
  const [preTradeAnalysis, setPreTradeAnalysis] = useState('Swept previous session lows into 15m bullish order block. Clear draw on liquidity at Asian highs.');
  const [postTradeReflection, setPostTradeReflection] = useState('Clean execution. Did not touch stop loss. Target achieved smoothly.');
  const [emotionalState, setEmotionalState] = useState<any>('Disciplined');
  const [strategyCompliance, setStrategyCompliance] = useState(true);
  const [retestOccurred, setRetestOccurred] = useState(true);
  const [confirmationPresent, setConfirmationPresent] = useState(true);
  const [ruleViolations, setRuleViolations] = useState<string[]>([]);
  const [newViolation, setNewViolation] = useState('');
  const [screenshots, setScreenshots] = useState<TradeScreenshot[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotType, setScreenshotType] = useState<'before' | 'after'>('before');

  const [saving, setSaving] = useState(false);

  // Populate when editing
  useEffect(() => {
    if (editTrade) {
      setAccountId(editTrade.accountId);
      setInstrument(editTrade.instrument);
      setBrokerSymbol(editTrade.brokerSymbol || editTrade.instrument);
      setDirection(editTrade.direction);
      setEntryPrice(editTrade.entryPrice);
      setExitPrice(editTrade.exitPrice);
      setStopLoss(editTrade.stopLoss);
      setTakeProfit(editTrade.takeProfit || '');
      setPositionSize(editTrade.positionSize);
      setRiskPercentage(editTrade.riskPercentage);
      setGrossPnL(editTrade.grossProfitLoss);
      setCommission(editTrade.commission);
      setSwap(editTrade.swap);
      setTradingSession(editTrade.tradingSession);
      setStrategyId(editTrade.strategyId || '');
      setSetupType(editTrade.setupType);
      setMarketConditions(editTrade.marketConditions);
      setPreTradeAnalysis(editTrade.preTradeAnalysis);
      setPostTradeReflection(editTrade.postTradeReflection);
      setEmotionalState(editTrade.emotionalState);
      setStrategyCompliance(editTrade.strategyCompliance);
      setRetestOccurred(editTrade.retestOccurred !== false);
      setConfirmationPresent(editTrade.confirmationPresent !== false);
      setRuleViolations(editTrade.ruleViolations || []);
      setScreenshots(editTrade.screenshots || []);
    } else {
      // Default to sensible initial values
      setAccountId(selectedAccount?.id || accounts[0]?.id || '');
      setRetestOccurred(true);
      setConfirmationPresent(true);
    }
  }, [editTrade, isOpen, selectedAccount, accounts]);

  if (!isOpen) return null;

  // Real-time calculation helpers
  const calculatedRiskDist = (entryPrice !== '' && stopLoss !== '') ? Math.abs(Number(entryPrice) - Number(stopLoss)) : 0;
  const calculatedRewardDist = (entryPrice !== '' && exitPrice !== '')
    ? (direction === 'BUY' ? Number(exitPrice) - Number(entryPrice) : Number(entryPrice) - Number(exitPrice))
    : 0;
  const calculatedR = calculatedRiskDist > 0 ? Number((calculatedRewardDist / calculatedRiskDist).toFixed(2)) : 0;
  const netPnLPreview = (grossPnL !== '' ? Number(grossPnL) : 0) - (commission !== '' ? Number(commission) : 0) - (swap !== '' ? Number(swap) : 0);

  const handleAddViolation = () => {
    if (newViolation.trim() && !ruleViolations.includes(newViolation.trim())) {
      setRuleViolations([...ruleViolations, newViolation.trim()]);
      setNewViolation('');
    }
  };

  const handleRemoveViolation = (item: string) => {
    setRuleViolations(ruleViolations.filter(v => v !== item));
  };

  const handleAddScreenshot = () => {
    if (screenshotUrl.trim()) {
      setScreenshots([
        ...screenshots,
        {
          id: `sc_${Date.now()}`,
          type: screenshotType,
          url: screenshotUrl.trim(),
          timestamp: new Date().toISOString()
        }
      ]);
      setScreenshotUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedStrat = strategies.find(s => s.id === strategyId);
      const acc = accounts.find(a => a.id === accountId);

      await onSave({
        accountId,
        instrument,
        brokerSymbol: brokerSymbol || instrument,
        direction,
        entryPrice: Number(entryPrice),
        exitPrice: Number(exitPrice),
        stopLoss: Number(stopLoss),
        takeProfit: takeProfit !== '' ? Number(takeProfit) : undefined,
        positionSize: Number(positionSize) || 1.0,
        riskPercentage: Number(riskPercentage) || 1.0,
        accountBalanceAtEntry: acc?.currentBalance || 100000,
        grossProfitLoss: Number(grossPnL) || 0,
        commission: Number(commission) || 0,
        swap: Number(swap) || 0,
        netProfitLoss: netPnLPreview,
        rMultiple: calculatedR,
        entryDate: editTrade?.entryDate || new Date().toISOString(),
        exitDate: editTrade?.exitDate || new Date().toISOString(),
        holdingDurationMinutes: 65,
        tradingSession,
        strategyId: selectedStrat?.id,
        strategyName: selectedStrat?.name,
        setupType,
        marketConditions,
        preTradeAnalysis,
        postTradeReflection,
        emotionalState,
        strategyCompliance,
        retestOccurred,
        confirmationPresent,
        ruleViolations,
        screenshots
      });

      if (netPnLPreview > 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }

      onClose();
    } catch (err) {
      console.error('Error saving trade:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F4F6F8]">
              {editTrade ? 'Edit Journal Entry' : 'Log Institutional Trade'}
            </h2>
            <div className="text-xs font-mono text-slate-500 dark:text-[#AAB3BF]">
              Real-time R &amp; Grade Engine
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#252D38] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Execution & Account */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase tracking-wider mb-1.5">
                Trading Account
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.currentBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase tracking-wider mb-1.5">
                Canonical Instrument
              </label>
              <select
                value={instrument}
                onChange={e => {
                  const inst = e.target.value as CanonicalInstrument;
                  setInstrument(inst);
                  setBrokerSymbol(CANONICAL_INSTRUMENTS[inst].aliases[0] || inst);
                }}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                required
              >
                {Object.keys(CANONICAL_INSTRUMENTS).map(inst => (
                  <option key={inst} value={inst}>
                    {inst} — {CANONICAL_INSTRUMENTS[inst as CanonicalInstrument].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase tracking-wider mb-1.5">
                Broker Symbol Alias
              </label>
              <input
                type="text"
                value={brokerSymbol}
                onChange={e => setBrokerSymbol(e.target.value)}
                placeholder="e.g. US100F, NAS100, GOLD"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
              />
            </div>
          </div>

          {/* Direction & Price Levels */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-[#F4F6F8]">
                Position &amp; Order Mechanics
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('BUY')}
                  className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-colors ${
                    direction === 'BUY'
                      ? 'bg-[#00C781] text-[#0B0D10]'
                      : 'bg-slate-200 dark:bg-[#252D38] text-slate-600 dark:text-[#AAB3BF]'
                  }`}
                >
                  BUY (LONG)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SELL')}
                  className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-colors ${
                    direction === 'SELL'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-200 dark:bg-[#252D38] text-slate-600 dark:text-[#AAB3BF]'
                  }`}
                >
                  SELL (SHORT)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-[#AAB3BF] mb-1">
                  Entry Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={e => setEntryPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-[#AAB3BF] mb-1">
                  Exit Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice}
                  onChange={e => setExitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-[#AAB3BF] mb-1">
                  Hard Stop Loss
                </label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={e => setStopLoss(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-[#AAB3BF] mb-1">
                  Take Profit (Optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={takeProfit}
                  onChange={e => setTakeProfit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                />
              </div>
            </div>

            {/* Sizing & Profit Calculation Summary Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-[#252D38]">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-[#AAB3BF] mb-1">
                  Position Size (Lots)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={positionSize}
                  onChange={e => setPositionSize(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-[#AAB3BF] mb-1">
                  Risk % of Capital
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={riskPercentage}
                  onChange={e => setRiskPercentage(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-[#AAB3BF] mb-1">
                  Gross P&amp;L ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={grossPnL}
                  onChange={e => setGrossPnL(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="text-[11px] font-medium text-slate-500 dark:text-[#AAB3BF] mb-1">
                  Computed Realized R
                </div>
                <div
                  className={`text-sm font-mono font-bold tabular-nums px-3 py-1 rounded-lg border flex items-center justify-between ${
                    calculatedR >= 0
                      ? 'border-[#00C781]/40 bg-[#00C781]/10 text-[#00C781]'
                      : 'border-red-500/40 bg-red-500/10 text-red-500'
                  }`}
                >
                  <span>{calculatedR >= 0 ? `+${calculatedR}R` : `${calculatedR}R`}</span>
                  <span className="text-[10px] font-normal opacity-80">
                    Net: ${netPnLPreview.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Strategy, Session, Context */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase tracking-wider mb-1.5">
                Trading Session
              </label>
              <select
                value={tradingSession}
                onChange={e => setTradingSession(e.target.value as TradingSession)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
              >
                <option value="Asian">Asian (Tokyo/Sydney)</option>
                <option value="London Open">London Open (07:00 - 10:00 GMT)</option>
                <option value="London PM">London PM</option>
                <option value="New York AM">New York AM (09:30 - 12:00 EST)</option>
                <option value="New York PM">New York PM (13:30 - 16:00 EST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase tracking-wider mb-1.5">
                Strategy Rulebook Model
              </label>
              <select
                value={strategyId}
                onChange={e => setStrategyId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
              >
                <option value="">Discretionary Setup</option>
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase tracking-wider mb-1.5">
                Emotional Mindset
              </label>
              <select
                value={emotionalState}
                onChange={e => setEmotionalState(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
              >
                <option value="Disciplined">Disciplined (Execution Focus)</option>
                <option value="Calm & Confident">Calm &amp; Confident</option>
                <option value="Impatient / FOMO">Impatient / FOMO (Chasing)</option>
                <option value="Anxious">Anxious (Risk Concern)</option>
                <option value="Revenge / Frustrated">Revenge / Frustrated</option>
              </select>
            </div>
          </div>

          {/* Pre-trade analysis & Post-trade reflection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase tracking-wider mb-1.5">
                Pre-Trade Thesis &amp; Context (HTF Bias, DOL, FVG)
              </label>
              <textarea
                value={preTradeAnalysis}
                onChange={e => setPreTradeAnalysis(e.target.value)}
                rows={3}
                placeholder="What was the draw on liquidity? Which HTF levels were swept? Why is this a valid setup?"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase tracking-wider mb-1.5">
                Post-Trade Reflection &amp; Execution Audit
              </label>
              <textarea
                value={postTradeReflection}
                onChange={e => setPostTradeReflection(e.target.value)}
                rows={3}
                placeholder="Did you follow the plan? Did you manage risk properly? Any hesitation or early exit?"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
              />
            </div>
          </div>

          {/* Strategy Compliance & Violations */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={strategyCompliance}
                  onChange={e => setStrategyCompliance(e.target.checked)}
                  className="rounded text-[#00C781] focus:ring-[#00C781]"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-[#F4F6F8]">
                  Strategy Compliance (100% adherence to documented setup rules)
                </span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-[#AAB3BF]">
                Grade Impact: 20 pts
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={retestOccurred}
                  onChange={e => setRetestOccurred(e.target.checked)}
                  className="rounded text-[#00C781] focus:ring-[#00C781]"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-[#F4F6F8]">
                  Zone Retest Occurred (<span className="text-[#00C781]">NO RETEST = NO TRADE</span> principle respected)
                </span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-[#AAB3BF]">
                Grade Impact: 15 pts
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmationPresent}
                  onChange={e => setConfirmationPresent(e.target.checked)}
                  className="rounded text-[#00C781] focus:ring-[#00C781]"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-[#F4F6F8]">
                  Buyer/Seller Rejection Confirmation Signature Validated
                </span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-[#AAB3BF]">
                Grade Impact: 10 pts
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newViolation}
                  onChange={e => setNewViolation(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddViolation();
                    }
                  }}
                  placeholder="Record an execution mistake (e.g. Moved Stop Loss, Entered before candle close)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddViolation}
                  className="px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg transition-colors"
                >
                  Add Mistake
                </button>
              </div>

              {ruleViolations.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {ruleViolations.map((v, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-[11px] text-red-400 font-medium"
                    >
                      <AlertTriangle size={12} />
                      <span>{v}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveViolation(v)}
                        className="text-red-400 hover:text-red-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Screenshots Gallery & Upload Attachment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-[#AAB3BF] uppercase tracking-wider">
                Chart Screenshots (Before / After Replay)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-[#AAB3BF]">
                {screenshots.length} attached
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={screenshotType}
                onChange={e => setScreenshotType(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8]"
              >
                <option value="before">Before Setup</option>
                <option value="after">After Exit</option>
              </select>

              <input
                type="text"
                value={screenshotUrl}
                onChange={e => setScreenshotUrl(e.target.value)}
                placeholder="Paste chart image URL or TradingView snapshot link..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
              />

              <button
                type="button"
                onClick={handleAddScreenshot}
                className="px-3 py-1.5 text-xs font-medium bg-[#00C781]/15 text-[#00C781] border border-[#00C781]/30 rounded-lg hover:bg-[#00C781]/25 transition-colors"
              >
                Attach
              </button>
            </div>

            {screenshots.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {screenshots.map(sc => (
                  <div
                    key={sc.id}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-[#2E3845] aspect-video bg-slate-900"
                  >
                    <img
                      src={sc.url}
                      alt={sc.type}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-black/80 text-white">
                      {sc.type}
                    </div>
                    <button
                      type="button"
                      onClick={() => setScreenshots(screenshots.filter(s => s.id !== sc.id))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#222E42]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#00B2FE] hover:bg-[#009BE0] text-[#090D14] font-bold text-xs transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editTrade ? 'Save Changes' : 'Confirm & Grade Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
