/**
 * CLOUD X — Cloud AI Real-Time Intelligence Terminal
 * TradeZella-Grade Interface with Live Market Data Feeds, "Go Live" Audio Broadcast,
 * Speech-to-Text Voice Input, and Real-Time Data Fetching Engines.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Shield,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  FileText,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Database,
  Search,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BarChart2,
  Globe,
  SlidersHorizontal,
  Play,
  Square,
  Maximize2,
  Minimize2,
  CornerDownLeft,
  Trash2
} from 'lucide-react';
import {
  AiChatMessage,
  CanonicalInstrument,
  CANONICAL_INSTRUMENTS,
  MarketQuote
} from '../../types/index.ts';
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
  const [fetchingData, setFetchingData] = useState<string | null>(null);

  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // "GO LIVE" State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<HTMLAudioElement | null>(null);

  // Live Market Quotes for the top ticker tape
  const [liveQuotes, setLiveQuotes] = useState<MarketQuote[]>([]);
  const [lastTickTime, setLastTickTime] = useState<string>('');

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg_init',
      sender: 'bandit',
      system: 'performance',
      text: `### CLOUD AI REAL-TIME INTELLIGENCE ONLINE
Welcome to the institutional trading terminal for **Cloud X**. I am your live quantitative mentor and risk guardian.

**Real-Time Capabilities Enabled:**
- 📡 **Live Data Engine:** Fetch real-time market quotes, spreads, and order flow structures for **US100, US30, GBPUSD, GBPJPY, and XAUUSD**.
- 📊 **Audited Journal Ledger:** Directly examine closed trades, win rate expectancy, and rule compliance.
- 🔴 **Go Live Mode:** Toggle voice broadcast for spoken commentary and hands-free voice input.
- 🛡️ **Capital Preservation:** Real-time prop-firm challenge buffer and drawdown monitoring.

Tap **"Go Live"** above or choose a data fetcher below to begin.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, fetchingData]);

  // Auto-resize textarea when typing
  useEffect(() => {
    if (textareaRef.current && !isComposerExpanded) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const nextHeight = Math.min(Math.max(scrollHeight, 72), 160);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [inputMessage, isComposerExpanded]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initial load of live quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const quotes = await api.getMarketQuotes();
        setLiveQuotes(quotes);
        setLastTickTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Failed to load initial quotes:', err);
      }
    };
    fetchQuotes();
  }, []);

  // Live polling interval when Live Mode is ON
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(async () => {
      try {
        const quotes = await api.getMarketQuotes();
        setLiveQuotes(quotes);
        setLastTickTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Live polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentlyPlayingAudio) {
        currentlyPlayingAudio.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentlyPlayingAudio]);

  // Speech-to-Text Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
          // Auto send spoken prompt if in live mode
          setTimeout(() => {
            handleSendMessage(transcript);
          }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [activeSystem, activeSymbol, isLiveMode]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting speech recognition:', e);
      }
    }
  };

  // Audio Playback Engine (Gemini 3.8 Flash TTS or Web Speech fallback)
  const speakText = async (text: string): Promise<void> => {
    if (!isAudioEnabled) return;

    // Stop current audio if playing
    if (currentlyPlayingAudio) {
      currentlyPlayingAudio.pause();
      setCurrentlyPlayingAudio(null);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);

    try {
      // Clean markdown tags for spoken audio
      const cleanText = text
        .replace(/[*#_`>]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .slice(0, 380);

      // Attempt Gemini 3.8 Flash Lite TTS from backend
      const speechRes = await api.generateSpeech(cleanText);

      if (speechRes && speechRes.audioBase64) {
        const byteCharacters = atob(speechRes.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: speechRes.mimeType || 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        setCurrentlyPlayingAudio(audio);

        audio.onended = () => {
          setIsSpeaking(false);
          setCurrentlyPlayingAudio(null);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setCurrentlyPlayingAudio(null);
          URL.revokeObjectURL(audioUrl);
          fallbackWebSpeech(cleanText);
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('Gemini TTS failed, falling back to Web Speech:', err);
    }

    // Fallback to browser Web Speech API
    fallbackWebSpeech(text);
  };

  const fallbackWebSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }
    const cleanText = text.replace(/[*#_`>]/g, '').slice(0, 350);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (currentlyPlayingAudio) {
      currentlyPlayingAudio.pause();
      setCurrentlyPlayingAudio(null);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Interactive Live Data Fetching
  const handleFetchData = async (queryType: 'market' | 'portfolio' | 'strategy' | 'risk' | 'macro') => {
    setFetchingData(queryType);
    setLoading(true);

    try {
      const res = await api.fetchAiData(queryType, activeSymbol);

      const dataMessage: AiChatMessage = {
        id: `fetch_${Date.now()}`,
        sender: 'bandit',
        system: activeSystem,
        text: `### REAL-TIME DATA FETCHED: ${queryType.toUpperCase()}
${res.summary}`,
        fetchedData: {
          queryType: res.queryType,
          symbol: res.symbol,
          timestamp: res.timestamp,
          payload: res.data
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, dataMessage]);

      // If in Live Mode and audio is enabled, announce the data summary
      if (isLiveMode && isAudioEnabled) {
        speakText(res.summary);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err_fetch_${Date.now()}`,
          sender: 'bandit',
          system: activeSystem,
          text: `⚠️ **Data Retrieval Error:** Unable to synchronize live ${queryType} telemetry. Re-verifying server socket connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setFetchingData(null);
      setLoading(false);
    }
  };

  // Sending Chat Message
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
      const res = await api.chatWithCloudAi(text, activeSystem, activeSymbol);

      const aiMsg: AiChatMessage = {
        id: `cld_${Date.now()}`,
        sender: 'bandit',
        system: activeSystem,
        text: res.text,
        citedTrades: res.citedTrades,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);

      // Auto-narrate in Live Mode
      if (isLiveMode && isAudioEnabled) {
        speakText(res.text);
      }
    } catch (err) {
      console.error('Cloud AI Chat failed:', err);
      const errMsg: AiChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'bandit',
        system: activeSystem,
        text: 'Cloud AI processing error: Unable to retrieve real-time response. Please verify connection.',
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

      const reviewMsg: AiChatMessage = {
        id: `full_${Date.now()}`,
        sender: 'bandit',
        system: activeSystem,
        text: resText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, reviewMsg]);

      if (isLiveMode && isAudioEnabled) {
        speakText(resText.slice(0, 300));
      }
    } catch (err) {
      console.error('Failed to run full review:', err);
    } finally {
      setLoading(false);
    }
  };

  // Preset query shortcuts
  const presetQueries: Record<'performance' | 'market' | 'risk', string[]> = {
    performance: [
      'Audit my adherence to NO RETEST = NO TRADE',
      'Evaluate execution of LIQUIDITY SWEEP → CHoCH → FVG RETEST',
      'Why am I losing on US100?',
      'Which session has my strongest expectancy?',
      'Detect my 3 most costly execution leaks'
    ],
    market: [
      'Where is the confirmed FVG retest zone on US100 15M / 5M?',
      'What is the HTF draw on liquidity for US100?',
      'Analyze Gold (XAUUSD) order flow and upcoming macro catalysts',
      'Explain Cable (GBPUSD) Asian liquidity sweep scenario',
      'Identify key institutional FVG zones on US30'
    ],
    risk: [
      'Audit my prop-firm challenge distance to breach',
      'What is my recommended max position size for the next session?',
      'Have I violated any daily loss or risk limits this week?',
      'Perform a comprehensive Capital Preservation Audit'
    ]
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] overflow-hidden animate-in fade-in duration-200 shadow-xl">
      {/* 1. Terminal Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-200 dark:border-[#1C2638] bg-slate-50/80 dark:bg-[#0F141F] shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#00B2FE]/15 text-[#00B2FE] border border-[#00B2FE]/30 flex items-center justify-center font-bold shadow-xs">
              <Bot size={20} />
            </div>
            {isLiveMode && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0F141F] rounded-full animate-ping" />
            )}
            {isLiveMode && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0F141F] rounded-full" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                CLOUD AI
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00B2FE]/20 text-[#00B2FE] border border-[#00B2FE]/30">
                GEMINI 3.8 FLASH
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Globe size={10} />
                <span>SEARCH GROUNDED</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>Quantitative Coach &amp; Market Intelligence Guardian</span>
              {lastTickTime && (
                <span className="text-[10px] text-slate-500">
                  • Synced: {lastTickTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Mode Controls & Intelligence Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* "GO LIVE" Toggle Switch */}
          <button
            onClick={() => {
              const next = !isLiveMode;
              setIsLiveMode(next);
              if (next && isAudioEnabled) {
                speakText('Cloud AI live broadcast activated. Real-time feeds and voice audio connected.');
              } else {
                stopAudio();
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all shadow-xs ${
              isLiveMode
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
                : 'bg-slate-200 dark:bg-[#18202F] text-slate-700 dark:text-[#94A3B8] border border-slate-300 dark:border-[#222E42] hover:text-white hover:border-[#00B2FE]/50'
            }`}
            title="Toggle Live Audio Broadcast & Real-Time Tick Feed"
          >
            <Radio size={14} className={isLiveMode ? 'text-rose-400 animate-spin' : ''} />
            <span>{isLiveMode ? '🔴 LIVE ON AIR' : 'GO LIVE'}</span>
          </button>

          {/* Audio Speaker Mute/Unmute */}
          <button
            onClick={() => {
              if (isSpeaking) {
                stopAudio();
              }
              setIsAudioEnabled(!isAudioEnabled);
            }}
            className={`p-2 rounded-xl text-xs border transition-colors ${
              isAudioEnabled
                ? 'bg-[#00B2FE]/15 text-[#00B2FE] border-[#00B2FE]/30'
                : 'bg-slate-200 dark:bg-[#18202F] text-slate-400 border-slate-300 dark:border-[#222E42]'
            }`}
            title={isAudioEnabled ? 'Voice Narration Enabled (Click to Mute)' : 'Voice Muted (Click to Unmute)'}
          >
            {isAudioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Soundwave Animation when Speaking */}
          {isSpeaking && (
            <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#00B2FE]/10 border border-[#00B2FE]/30">
              <span className="w-1 h-3 bg-[#00B2FE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-[#00B2FE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-[#00B2FE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-3 bg-[#00B2FE] rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
            </div>
          )}

          {/* 3 Intelligence Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-[#18202F] border border-slate-200 dark:border-[#222E42]">
            <button
              onClick={() => setActiveSystem('performance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSystem === 'performance'
                  ? 'bg-white text-slate-900 dark:bg-[#222E42] dark:text-[#00B2FE] shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity size={13} />
              <span>Performance</span>
            </button>

            <button
              onClick={() => setActiveSystem('market')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSystem === 'market'
                  ? 'bg-white text-slate-900 dark:bg-[#222E42] dark:text-[#00B2FE] shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp size={13} />
              <span>Market Intel</span>
            </button>

            <button
              onClick={() => setActiveSystem('risk')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSystem === 'risk'
                  ? 'bg-white text-slate-900 dark:bg-[#222E42] dark:text-[#00B2FE] shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield size={13} />
              <span>Risk</span>
            </button>
          </div>

          {/* Run Full Review */}
          <button
            onClick={handleGenerateFullReview}
            disabled={loading}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00B2FE]/40 text-xs font-bold text-[#00B2FE] hover:bg-[#00B2FE]/10 transition-colors"
          >
            <Sparkles size={14} />
            <span>Full Review</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Market Ticker Ribbon (All 5 Canonical Instruments) */}
      <div className="px-6 py-2 bg-slate-100/70 dark:bg-[#0C101A] border-b border-slate-200 dark:border-[#1C2638] flex items-center justify-between gap-4 overflow-x-auto shrink-0 scrollbar-none text-xs">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            LIVE TICKERS:
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0 overflow-x-auto">
          {liveQuotes.map(q => {
            const isPos = q.change24hPercent >= 0;
            const isSelected = q.symbol === activeSymbol;
            return (
              <div
                key={q.symbol}
                onClick={() => setActiveSymbol(q.symbol)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#00B2FE] bg-[#00B2FE]/10 text-white'
                    : 'border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-slate-700 dark:text-[#94A3B8] hover:border-[#00B2FE]/40'
                }`}
              >
                <span className="font-mono font-bold text-[11px]">{q.symbol}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  {q.lastPrice.toLocaleString(undefined, { minimumFractionDigits: q.symbol === 'GBPUSD' ? 4 : 2 })}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold ${
                    isPos ? 'text-emerald-500' : 'text-rose-400'
                  }`}
                >
                  {isPos ? '+' : ''}{q.change24hPercent.toFixed(2)}%
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 dark:bg-[#1C2638] text-slate-400">
                  Spread: {q.spread}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Dedicated "FETCH REAL-TIME DATA" Actions Bar */}
      <div className="px-6 py-2.5 bg-slate-50 dark:bg-[#0E131E] border-b border-slate-200 dark:border-[#1C2638] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Database size={13} className="text-[#00B2FE]" />
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            FETCH REAL-TIME DATA:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleFetchData('market')}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-slate-700 dark:text-[#94A3B8] hover:text-[#00B2FE] hover:border-[#00B2FE]/50 flex items-center gap-1.5 transition-colors"
          >
            <Activity size={12} className="text-[#00B2FE]" />
            <span>📡 Live Tickers</span>
          </button>

          <button
            onClick={() => handleFetchData('portfolio')}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-slate-700 dark:text-[#94A3B8] hover:text-[#00B2FE] hover:border-[#00B2FE]/50 flex items-center gap-1.5 transition-colors"
          >
            <BarChart2 size={12} className="text-emerald-400" />
            <span>📊 My Portfolio Ledger</span>
          </button>

          <button
            onClick={() => handleFetchData('strategy')}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-slate-700 dark:text-[#94A3B8] hover:text-[#00B2FE] hover:border-[#00B2FE]/50 flex items-center gap-1.5 transition-colors"
          >
            <Zap size={12} className="text-amber-400" />
            <span>🔍 Scan Retest Setups</span>
          </button>

          <button
            onClick={() => handleFetchData('risk')}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-slate-700 dark:text-[#94A3B8] hover:text-[#00B2FE] hover:border-[#00B2FE]/50 flex items-center gap-1.5 transition-colors"
          >
            <Shield size={12} className="text-cyan-400" />
            <span>🛡️ Risk &amp; Drawdown Cushion</span>
          </button>

          <button
            onClick={() => handleFetchData('macro')}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-slate-700 dark:text-[#94A3B8] hover:text-[#00B2FE] hover:border-[#00B2FE]/50 flex items-center gap-1.5 transition-colors"
          >
            <Globe size={12} className="text-violet-400" />
            <span>🌐 Macro Catalysts</span>
          </button>
        </div>
      </div>

      {/* 4. Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30 dark:bg-[#090D14]/70">
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
                    : 'bg-[#18202F] text-[#00B2FE] border border-[#00B2FE]/40'
                }`}
              >
                {isUser ? 'U' : <Bot size={15} />}
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-white dark:bg-[#1A2332] dark:text-[#F8FAFC] rounded-tr-none'
                      : 'bg-white dark:bg-[#131926] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#222E42] rounded-tl-none shadow-xs'
                  }`}
                >
                  {/* Text Body */}
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Render Fetched Data Cards if message has telemetry */}
                  {msg.fetchedData && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-[#1C2638] space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="flex items-center gap-1.5 uppercase font-bold text-[#00B2FE]">
                          <Database size={11} />
                          <span>SYNCHRONIZED TELEMETRY: {msg.fetchedData.queryType}</span>
                        </span>
                        <span>{new Date(msg.fetchedData.timestamp).toLocaleTimeString()}</span>
                      </div>

                      {/* Market Snapshot Card */}
                      {msg.fetchedData.queryType === 'market' && msg.fetchedData.payload.quote && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F18] border border-slate-200 dark:border-[#1E293B] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                          <div>
                            <div className="text-[10px] text-slate-400">SYMBOL</div>
                            <div className="font-bold text-xs text-[#00B2FE]">
                              {msg.fetchedData.payload.quote.symbol}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">BID / ASK</div>
                            <div className="font-semibold text-xs text-slate-300">
                              {msg.fetchedData.payload.quote.bid} / {msg.fetchedData.payload.quote.ask}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">24H DELTA</div>
                            <div className={`font-bold text-xs ${msg.fetchedData.payload.quote.change24hPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {msg.fetchedData.payload.quote.change24hPercent >= 0 ? '+' : ''}
                              {msg.fetchedData.payload.quote.change24hPercent.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">SESSION</div>
                            <div className="font-semibold text-xs text-slate-300">
                              {msg.fetchedData.payload.quote.sessionStatus}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Portfolio Snapshot Card */}
                      {msg.fetchedData.queryType === 'portfolio' && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F18] border border-slate-200 dark:border-[#1E293B] grid grid-cols-3 gap-2 text-center font-mono">
                          <div>
                            <div className="text-[10px] text-slate-400">CLOSED TRADES</div>
                            <div className="font-bold text-xs text-slate-200">
                              {msg.fetchedData.payload.closedTrades}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">WIN RATE</div>
                            <div className="font-bold text-xs text-emerald-400">
                              {msg.fetchedData.payload.winRate}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">NET REALIZED P&L</div>
                            <div className={`font-bold text-xs ${msg.fetchedData.payload.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ${msg.fetchedData.payload.netPnL.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Strategy Scan Card */}
                      {msg.fetchedData.queryType === 'strategy' && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F18] border border-slate-200 dark:border-[#1E293B] space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-amber-400 font-bold">Rule: "NO RETEST = NO TRADE"</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              {msg.fetchedData.payload.retestRate} Compliance
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Unmitigated Fair Value Gaps Detected: <strong className="text-slate-200">{msg.fetchedData.payload.unmitigatedFVGs?.length || 0}</strong>
                          </div>
                        </div>
                      )}

                      {/* Risk & Cushion Card */}
                      {msg.fetchedData.queryType === 'risk' && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F18] border border-slate-200 dark:border-[#1E293B] grid grid-cols-3 gap-2 text-center font-mono">
                          <div>
                            <div className="text-[10px] text-slate-400">DISCIPLINE</div>
                            <div className="font-bold text-xs text-[#00B2FE]">
                              {msg.fetchedData.payload.disciplineScore}/100
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">DAILY BUFFER</div>
                            <div className="font-bold text-xs text-emerald-400">
                              ${msg.fetchedData.payload.dailyDrawdownLimit?.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">MAX LOT RISK</div>
                            <div className="font-bold text-xs text-slate-300">
                              {msg.fetchedData.payload.recommendedRiskPct}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cited Trades Badges */}
                  {msg.citedTrades && msg.citedTrades.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#1C2638] space-y-1.5">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Cited Journal Records:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citedTrades.map(ct => (
                          <span
                            key={ct.id}
                            onClick={() => onSelectTradeId && onSelectTradeId(ct.id)}
                            className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer hover:underline ${
                              ct.outcome === 'WIN'
                                ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
                                : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
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

                {/* Footer Controls: Audio Playback & Timestamp */}
                <div
                  className={`flex items-center gap-2 text-[10px] text-slate-400 font-mono px-1 ${
                    isUser ? 'justify-end' : 'justify-between'
                  }`}
                >
                  {!isUser && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="flex items-center gap-1 text-slate-400 hover:text-[#00B2FE] transition-colors"
                      title="Play Voice Audio"
                    >
                      <Play size={11} />
                      <span>Listen</span>
                    </button>
                  )}
                  <span>{msg.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-[#18202F] text-[#00B2FE] border border-[#00B2FE]/40 flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#222E42] text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-[#00B2FE]" />
              <span>
                {fetchingData
                  ? `Fetching real-time ${fetchingData} telemetry from live feeds...`
                  : 'Cloud AI is evaluating real-time order flow and journal data...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Preset Fast-Prompt Buttons */}
      <div className="px-6 py-2.5 bg-slate-50 dark:bg-[#0F141F] border-t border-slate-200 dark:border-[#1C2638] flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase shrink-0">
          PROMPTS:
        </span>
        {presetQueries[activeSystem].map((query, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(query)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:border-[#00B2FE]/40 whitespace-nowrap shrink-0 transition-colors"
          >
            {query}
          </button>
        ))}
      </div>

      {/* 6. Spacious Auto-Expanding Message Composer */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#1C2638] bg-white dark:bg-[#101522] shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative rounded-2xl border border-slate-200 dark:border-[#222E42] bg-slate-50 dark:bg-[#0B0F18] focus-within:border-[#00B2FE] focus-within:ring-2 focus-within:ring-[#00B2FE]/20 transition-all shadow-sm"
        >
          {/* Top text area with generous typing space & clear visibility */}
          <div className="p-3 sm:p-3.5 pb-1">
            <textarea
              ref={textareaRef}
              rows={isComposerExpanded ? 6 : 3}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? '🎙️ Listening to your voice... Speak clearly now...'
                  : `Ask Cloud AI (${activeSystem} intelligence, e.g. "Audit my FVG retests on ${activeSymbol}" or "Fetch live quotes and key levels")...`
              }
              className={`w-full bg-transparent text-sm leading-relaxed text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none resize-none transition-all ${
                isComposerExpanded ? 'min-h-[160px]' : 'min-h-[72px] max-h-[160px]'
              } ${isListening ? 'text-rose-400 font-medium' : ''}`}
            />
          </div>

          {/* Bottom Integrated Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-slate-200/80 dark:border-[#1A2333] bg-slate-100/60 dark:bg-[#0E131E]/95 rounded-b-2xl">
            {/* Left Tools: Instrument selector, Mode pill, Voice indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] text-xs font-mono">
                <span className="text-[10px] text-slate-400 font-bold uppercase">TICKER:</span>
                <select
                  value={activeSymbol}
                  onChange={e => setActiveSymbol(e.target.value as CanonicalInstrument)}
                  className="bg-transparent font-bold text-slate-800 dark:text-[#00B2FE] focus:outline-none cursor-pointer"
                >
                  {Object.keys(CANONICAL_INSTRUMENTS).map(inst => (
                    <option key={inst} value={inst} className="bg-white dark:bg-[#131926] text-slate-800 dark:text-white">
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-[#18202F] text-slate-600 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00B2FE]" />
                <span className="capitalize">{activeSystem} Mode</span>
              </span>

              {isListening && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-[10px] font-mono text-rose-400 font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>VOICE ACTIVE</span>
                </span>
              )}
            </div>

            {/* Right Tools: Clear text, Expand, Microphone, Send */}
            <div className="flex items-center gap-1.5">
              {inputMessage.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setInputMessage('')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-[#1C2638] transition-colors"
                  title="Clear text"
                >
                  <Trash2 size={13} />
                </button>
              )}

              {/* Expand / Minimize Toggle */}
              <button
                type="button"
                onClick={() => setIsComposerExpanded(!isComposerExpanded)}
                className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                  isComposerExpanded
                    ? 'border-[#00B2FE]/50 text-[#00B2FE] bg-[#00B2FE]/10'
                    : 'border-slate-200 dark:border-[#222E42] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-[#131926]'
                }`}
                title={isComposerExpanded ? 'Compact typing view' : 'Expand typing view for long trading queries'}
              >
                {isComposerExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span className="hidden md:inline text-[10px] font-mono">
                  {isComposerExpanded ? 'Compact' : 'Expand'}
                </span>
              </button>

              {/* Speech-to-Text Microphone */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-white dark:bg-[#18202F] text-slate-600 dark:text-[#94A3B8] border-slate-200 dark:border-[#222E42] hover:text-[#00B2FE] hover:border-[#00B2FE]/50'
                }`}
                title={isListening ? 'Click to Stop Listening' : 'Click to Speak (Speech-to-Text)'}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="px-4 py-2 rounded-xl bg-[#00B2FE] hover:bg-[#009BE0] text-[#090D14] text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Send</span>
                <CornerDownLeft size={13} />
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400 font-mono">
          <span>
            Press <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-[#18202F] text-slate-600 dark:text-slate-300 font-semibold">Enter ↵</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-[#18202F] text-slate-600 dark:text-slate-300 font-semibold">Shift + Enter</kbd> for new line
          </span>
          {inputMessage.length > 0 && (
            <span>{inputMessage.length} characters • {inputMessage.trim().split(/\s+/).filter(Boolean).length} words</span>
          )}
        </div>
      </div>
    </div>
  );
};
