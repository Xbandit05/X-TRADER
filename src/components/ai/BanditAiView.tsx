/**
 * BANDITRADES — Bandit AI Intelligence Terminal
 * Three intelligence systems: Performance Intelligence, Live Market Intelligence, Risk & Challenge Intelligence
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Shield,
  Activity,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  FileText
} from 'lucide-react';
import { AiChatMessage, CanonicalInstrument, CANONICAL_INSTRUMENTS } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface BanditAiViewProps {
  onSelectTradeId?: (id: string) => void;
}

export const BanditAiView: React.FC<BanditAiViewProps> = ({ onSelectTradeId }) => {
  const { user, selectedAccount } = useAuth();
  const [activeSystem, setActiveSystem] = useState<'performance' | 'market' | 'risk'>('performance');
  const [activeSymbol, setActiveSymbol] = useState<CanonicalInstrument>('US100');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg_init',
      sender: 'bandit',
      system: 'performance',
      text: `Welcome to **BANDIT AI**. I am your institutional quantitative trading mentor and risk guardian.

I have direct, authorized access to your journaled trades, calculated expectancies, risk metrics, and verified live market structure for the 5 canonical instruments (**US100, US30, GBPUSD, GBPJPY, XAUUSD**).

How can I sharpen your execution today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const presetQueries: Record<'performance' | 'market' | 'risk', string[]> = {
    performance: [
      'Audit my adherence to the NO RETEST = NO TRADE golden rule',
      'Evaluate my execution of LIQUIDITY SWEEP → CHoCH → FVG RETEST',
      'Why am I losing on US100?',
      'Which session has my strongest expectancy?',
      'What are my three most costly execution mistakes?',
      'Analyze my last 10 trades and detect behavioral leaks'
    ],
    market: [
      'Where is the confirmed FVG retest zone on US100 15M / 5M?',
      'What is the HTF draw on liquidity for US100?',
      'Analyze Gold (XAUUSD) order flow and upcoming macro catalysts',
      'Explain Cable (GBPUSD) Asian liquidity sweep scenario',
      'Identify key institutional FVG zones on US30',
      'Summarize upcoming high-impact FOMC / NFP implications'
    ],
    risk: [
      'Audit my prop-firm challenge distance to breach',
      'What is my recommended max position size for the next session?',
      'Have I violated any daily loss or risk limits this week?',
      'Explain how to calculate trailing drawdown vs static buffer',
      'Perform a comprehensive Capital Preservation Audit'
    ]
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: AiChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      system: activeSystem,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.chatWithBandit(text, activeSystem, activeSymbol);

      const banditMsg: AiChatMessage = {
        id: `bnd_${Date.now()}`,
        sender: 'bandit',
        system: activeSystem,
        text: res.text,
        citedTrades: res.citedTrades,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, banditMsg]);
    } catch (err) {
      console.error('Bandit AI Chat failed:', err);
      const errMsg: AiChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'bandit',
        system: activeSystem,
        text: 'Bandit AI processing error: Unable to retrieve real-time response. Please verify your connection or model parameters.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFullReview = async () => {
    setLoading(true);
    try {
      let resText = '';
      if (activeSystem === 'performance') {
        const res = await api.getPerformanceReview('Last 30 Days');
        resText = res.analysis;
      } else if (activeSystem === 'market') {
        const res = await api.getAiMarketBriefing(activeSymbol);
        resText = res.briefing;
      } else {
        const res = await api.getRiskAudit(selectedAccount?.id);
        resText = res.audit;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `full_${Date.now()}`,
          sender: 'bandit',
          system: activeSystem,
          text: resText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Failed to run full review:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col rounded-2xl border border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] overflow-hidden animate-in fade-in duration-200 shadow-xl">
      {/* Terminal Top Bar */}
      <div className="h-16 flex flex-wrap items-center justify-between gap-3 px-6 border-b border-slate-200 dark:border-[#252D38] bg-slate-50/70 dark:bg-[#151A20] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00C781]/15 text-[#00C781] border border-[#00C781]/30 flex items-center justify-center font-bold">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-[#F4F6F8]">
                BANDIT AI
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#00C781]/20 text-[#00C781]">
                GEMINI 3.8 FLASH
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Quantitative Coach &amp; Market Intelligence Guardian
            </div>
          </div>
        </div>

        {/* 3 Intelligence Systems Selector Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-[#1B222B] border border-slate-200 dark:border-[#2E3845]">
          <button
            onClick={() => setActiveSystem('performance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSystem === 'performance'
                ? 'bg-white text-slate-900 dark:bg-[#252D38] dark:text-[#00C781] shadow-xs'
                : 'text-slate-600 dark:text-[#AAB3BF] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>Performance</span>
          </button>

          <button
            onClick={() => setActiveSystem('market')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSystem === 'market'
                ? 'bg-white text-slate-900 dark:bg-[#252D38] dark:text-[#00C781] shadow-xs'
                : 'text-slate-600 dark:text-[#AAB3BF] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>Market Intel</span>
          </button>

          <button
            onClick={() => setActiveSystem('risk')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSystem === 'risk'
                ? 'bg-white text-slate-900 dark:bg-[#252D38] dark:text-[#00C781] shadow-xs'
                : 'text-slate-600 dark:text-[#AAB3BF] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield size={13} />
            <span>Risk &amp; Challenge</span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerateFullReview}
          disabled={loading}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00C781]/40 text-xs font-bold text-[#00C781] hover:bg-[#00C781]/10 transition-colors"
        >
          <Sparkles size={14} />
          <span>Generate Full Review</span>
        </button>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30 dark:bg-[#0B0D10]/50">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isUser
                    ? 'bg-slate-800 text-white dark:bg-slate-700'
                    : 'bg-[#151A20] text-[#00C781] border border-[#00C781]/40'
                }`}
              >
                {isUser ? 'U' : <Bot size={15} />}
              </div>

              <div className="space-y-2">
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-white dark:bg-[#222B36] dark:text-[#F4F6F8] rounded-tr-none'
                      : 'bg-white dark:bg-[#151A20] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#252D38] rounded-tl-none shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                  {/* Cited Trades Badges */}
                  {msg.citedTrades && msg.citedTrades.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#252D38] space-y-1.5">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Cited Journal Records:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citedTrades.map(ct => (
                          <span
                            key={ct.id}
                            className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                              ct.outcome === 'WIN'
                                ? 'border-[#00C781]/40 bg-[#00C781]/10 text-[#00C781]'
                                : 'border-red-500/40 bg-red-500/10 text-red-400'
                            }`}
                          >
                            <span>#{ct.id}</span>
                            <span>({ct.instrument} {ct.rMultiple}R)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`text-[10px] text-slate-400 font-mono px-1 ${
                    isUser ? 'text-right' : ''
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-[#151A20] text-[#00C781] border border-[#00C781]/40 flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151A20] border border-slate-200 dark:border-[#252D38] text-xs text-slate-500 dark:text-[#AAB3BF] flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-[#00C781]" />
              <span>Bandit AI is evaluating portfolio data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Fast-Prompt Buttons */}
      <div className="px-6 py-2.5 bg-slate-50 dark:bg-[#151A20] border-t border-slate-200 dark:border-[#252D38] flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase shrink-0">
          PROMPTS:
        </span>
        {presetQueries[activeSystem].map((query, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(query)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#1B222B] text-slate-700 dark:text-[#AAB3BF] hover:text-slate-900 dark:hover:text-[#F4F6F8] hover:border-[#00C781]/40 whitespace-nowrap shrink-0 transition-colors"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Bottom Message Input Box */}
      <div className="p-4 border-t border-slate-200 dark:border-[#252D38] bg-white dark:bg-[#1B222B] shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {activeSystem === 'market' && (
            <select
              value={activeSymbol}
              onChange={e => setActiveSymbol(e.target.value as CanonicalInstrument)}
              className="px-2.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] text-slate-800 dark:text-[#F4F6F8]"
            >
              {Object.keys(CANONICAL_INSTRUMENTS).map(inst => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder={`Ask Bandit AI (${activeSystem} intelligence)...`}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] placeholder-slate-400 focus:outline-none focus:border-[#00C781]"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <Send size={14} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
