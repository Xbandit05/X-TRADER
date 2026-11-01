/**
 * BANDITRADES — Frontend API Client
 */

import {
  CanonicalInstrument,
  Trade,
  TradingAccount,
  TradingStrategy,
  ConsistencyMetrics,
  MarketQuote,
  MarketCandle,
  MarketStructureItem,
  EconomicEvent,
  BanditMarketBriefing,
  UserProfile,
  TradeGrade
} from '../types/index.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('bandit_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(email: string, password?: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return res.json() as Promise<{ token: string; user: UserProfile }>;
  },

  async loginDemo() {
    const res = await fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json() as Promise<{ token: string; user: UserProfile }>;
  },

  async register(email: string, fullName: string, username?: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, username })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
    return res.json() as Promise<{ token: string; user: UserProfile }>;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return res.json() as Promise<{ user: UserProfile }>;
  },

  async resetPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  // Accounts
  async getAccounts() {
    const res = await fetch(`${API_BASE}/accounts`, {
      headers: { ...getAuthHeader() }
    });
    return res.json() as Promise<TradingAccount[]>;
  },

  async createAccount(data: Partial<TradingAccount>) {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<TradingAccount>;
  },

  async updateAccount(id: string, data: Partial<TradingAccount>) {
    const res = await fetch(`${API_BASE}/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<TradingAccount>;
  },

  // Trades
  async getTrades(params?: { accountId?: string; instrument?: string; strategy?: string; session?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.accountId) query.set('accountId', params.accountId);
    if (params?.instrument) query.set('instrument', params.instrument);
    if (params?.strategy) query.set('strategy', params.strategy);
    if (params?.session) query.set('session', params.session);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/trades?${query.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json() as Promise<Trade[]>;
  },

  async createTrade(trade: Partial<Trade>) {
    const res = await fetch(`${API_BASE}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(trade)
    });
    return res.json() as Promise<Trade>;
  },

  async updateTrade(id: string, trade: Partial<Trade>) {
    const res = await fetch(`${API_BASE}/trades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(trade)
    });
    return res.json() as Promise<Trade>;
  },

  async deleteTrade(id: string) {
    const res = await fetch(`${API_BASE}/trades/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async gradeTrade(id: string) {
    const res = await fetch(`${API_BASE}/trades/${id}/grade`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json() as Promise<TradeGrade>;
  },

  // Analytics
  async getAnalytics(accountId?: string) {
    const query = accountId ? `?accountId=${accountId}` : '';
    const res = await fetch(`${API_BASE}/analytics${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Consistency
  async getConsistency() {
    const res = await fetch(`${API_BASE}/consistency`, {
      headers: { ...getAuthHeader() }
    });
    return res.json() as Promise<ConsistencyMetrics>;
  },

  async updateConsistency(data: Partial<ConsistencyMetrics>) {
    const res = await fetch(`${API_BASE}/consistency`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<ConsistencyMetrics>;
  },

  async logViolation(violation: { violationType: string; details: string; severity?: 'low' | 'medium' | 'high' }) {
    const res = await fetch(`${API_BASE}/consistency/violation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(violation)
    });
    return res.json() as Promise<ConsistencyMetrics>;
  },

  // Strategies
  async getStrategies() {
    const res = await fetch(`${API_BASE}/strategies`, {
      headers: { ...getAuthHeader() }
    });
    return res.json() as Promise<TradingStrategy[]>;
  },

  async createStrategy(strategy: Partial<TradingStrategy>) {
    const res = await fetch(`${API_BASE}/strategies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(strategy)
    });
    return res.json() as Promise<TradingStrategy>;
  },

  async updateStrategy(id: string, strategy: Partial<TradingStrategy>) {
    const res = await fetch(`${API_BASE}/strategies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(strategy)
    });
    return res.json() as Promise<TradingStrategy>;
  },

  // Market Data
  async getMarketQuotes() {
    const res = await fetch(`${API_BASE}/market/quotes`);
    return res.json() as Promise<MarketQuote[]>;
  },

  async getMarketCandles(symbol: CanonicalInstrument, timeframe: string = '15m') {
    const res = await fetch(`${API_BASE}/market/candles?symbol=${symbol}&timeframe=${timeframe}`);
    return res.json() as Promise<MarketCandle[]>;
  },

  async getMarketStructure(symbol: CanonicalInstrument) {
    const res = await fetch(`${API_BASE}/market/structure?symbol=${symbol}`);
    return res.json() as Promise<MarketStructureItem[]>;
  },

  async getMarketBriefing(symbol: CanonicalInstrument) {
    const res = await fetch(`${API_BASE}/market/briefing?symbol=${symbol}`);
    return res.json() as Promise<BanditMarketBriefing>;
  },

  async getEconomicCalendar() {
    const res = await fetch(`${API_BASE}/market/economic-calendar`);
    return res.json() as Promise<EconomicEvent[]>;
  },

  async getMarketStatus() {
    const res = await fetch(`${API_BASE}/market/status`);
    return res.json() as Promise<import('../types/index.ts').MarketProviderStatus>;
  },

  async simulateOutage(active: boolean) {
    const res = await fetch(`${API_BASE}/market/simulate-outage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    return res.json() as Promise<import('../types/index.ts').MarketProviderStatus>;
  },

  async toggleSimulationMode(active: boolean) {
    const res = await fetch(`${API_BASE}/market/simulation-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    return res.json() as Promise<{
      simulationModeActive: boolean;
      status: import('../types/index.ts').MarketProviderStatus;
      quotes: MarketQuote[];
    }>;
  },

  async calibrateMarketPrice(symbol: CanonicalInstrument, targetPrice: number) {
    const res = await fetch(`${API_BASE}/market/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, targetPrice })
    });
    return res.json() as Promise<{
      success: boolean;
      symbol: CanonicalInstrument;
      quote: MarketQuote;
      quotes: MarketQuote[];
    }>;
  },

  async refreshMarketFeeds() {
    const res = await fetch(`${API_BASE}/market/refresh`, {
      method: 'POST'
    });
    return res.json() as Promise<{
      status: import('../types/index.ts').MarketProviderStatus;
      quotes: MarketQuote[];
    }>;
  },

  // Bandit AI
  async getPerformanceReview(timeframe: string = 'Last 30 Days') {
    const res = await fetch(`${API_BASE}/ai/performance-intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ timeframe })
    });
    return res.json() as Promise<{ analysis: string }>;
  },

  async getAiMarketBriefing(symbol: CanonicalInstrument) {
    const res = await fetch(`${API_BASE}/ai/market-intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ symbol })
    });
    return res.json() as Promise<{ briefing: string }>;
  },

  async getRiskAudit(accountId?: string) {
    const res = await fetch(`${API_BASE}/ai/risk-intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ accountId })
    });
    return res.json() as Promise<{ audit: string }>;
  },

  async chatWithBandit(message: string, system: 'performance' | 'market' | 'risk', activeSymbol?: CanonicalInstrument) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ message, system, activeSymbol })
    });
    return res.json() as Promise<{ text: string; citedTrades?: any[] }>;
  },

  async getDailyBriefing() {
    const res = await fetch(`${API_BASE}/ai/daily-briefing`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // CSV Import
  async importCsvTrades(trades: any[], accountId?: string) {
    const res = await fetch(`${API_BASE}/trades/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ trades, accountId })
    });
    return res.json() as Promise<{ success: boolean; importedCount: number }>;
  }
};
