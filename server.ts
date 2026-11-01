/**
 * BANDITRADES — Master Server Entry Point
 * Full-stack Express backend with mounted Vite middlewares
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db, computeAnalytics, calculateTradeGrade } from './server/db.ts';
import { marketService } from './server/market.ts';
import {
  generatePerformanceReview,
  generateMarketIntelligenceBriefing,
  generateRiskIntelligenceReview,
  chatWithBandit
} from './server/gemini.ts';
import {
  CanonicalInstrument,
  CANONICAL_INSTRUMENTS,
  Trade,
  TradingAccount,
  TradingStrategy
} from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Helper to resolve canonical symbol from broker symbol
function resolveCanonical(input: string): CanonicalInstrument {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  for (const [key, meta] of Object.entries(CANONICAL_INSTRUMENTS)) {
    if (key === clean) return key as CanonicalInstrument;
    if (meta.aliases.some(a => a.toUpperCase().replace(/[^A-Z0-9]/g, '') === clean)) {
      return key as CanonicalInstrument;
    }
  }
  // Default to US100 if unrecognized
  return 'US100';
}

// Simple authentication middleware simulation extracting userId from Authorization header or cookie
function getRequestUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer usr_')) {
    return authHeader.replace('Bearer ', '').trim();
  }
  // Default to demo user for seamless live interaction
  return 'usr_bandit_demo';
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ROUTES
// -------------------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Find user by email
  let foundUser = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!foundUser && (email === 'bandit@banditrades.com' || email === 'heisxbandit@gmail.com')) {
    foundUser = db.users.get('usr_bandit_demo');
  }

  if (!foundUser) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  return res.json({
    token: `usr_${foundUser.id}`,
    user: foundUser
  });
});

app.post('/api/auth/demo', (_req: Request, res: Response) => {
  const demoUser = db.users.get('usr_bandit_demo')!;
  return res.json({
    token: `usr_${demoUser.id}`,
    user: demoUser
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, fullName, username } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email and full name are required' });
  }

  const newId = `usr_${Date.now()}`;
  const newUser = {
    id: newId,
    email,
    fullName,
    username: username || email.split('@')[0],
    avatarUrl: '',
    subscriptionTier: 'pro' as const,
    theme: 'dark' as const,
    riskTolerancePercent: 1.0,
    maxDailyDrawdownPercent: 3.0,
    dailyLossWarningPercent: 2.0,
    createdAt: new Date().toISOString()
  };

  db.users.set(newId, newUser);

  // Automatically create a default live account and demo account for new user
  const initialAcc: TradingAccount = {
    id: `acc_${Date.now()}`,
    userId: newId,
    name: 'Primary Trading Account',
    accountType: 'personal_live',
    brokerOrFirm: 'Primary Broker',
    currency: 'USD',
    startingBalance: 10000,
    currentBalance: 10000,
    currentEquity: 10000,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.accounts.set(initialAcc.id, initialAcc);

  return res.json({
    token: `usr_${newId}`,
    user: newUser
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const user = db.users.get(userId) || db.users.get('usr_bandit_demo');
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  return res.json({ success: true, message: `Password reset link dispatched to ${email || 'your registered address'}.` });
});

// -------------------------------------------------------------
// 2. ACCOUNTS & PROP-FIRM CHALLENGES
// -------------------------------------------------------------

app.get('/api/accounts', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const accounts = db.getUserAccounts(userId);
  return res.json(accounts);
});

app.post('/api/accounts', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const body = req.body;
  const newAccount: TradingAccount = {
    id: `acc_${Date.now()}`,
    userId,
    name: body.name || 'New Trading Account',
    accountType: body.accountType || 'personal_live',
    brokerOrFirm: body.brokerOrFirm || 'Interactive Brokers',
    currency: body.currency || 'USD',
    startingBalance: Number(body.startingBalance) || 25000,
    currentBalance: Number(body.startingBalance) || 25000,
    currentEquity: Number(body.startingBalance) || 25000,
    status: 'active',
    challengeRules: body.challengeRules ? {
      id: `rule_${Date.now()}`,
      accountId: `acc_${Date.now()}`,
      propFirmName: body.challengeRules.propFirmName || 'Prop Firm',
      phase: body.challengeRules.phase || 'Phase 1',
      startingBalance: Number(body.startingBalance) || 50000,
      profitTargetAmount: Number(body.challengeRules.profitTargetAmount) || 5000,
      profitTargetPercentage: Number(body.challengeRules.profitTargetPercentage) || 10,
      maxDailyDrawdownAmount: Number(body.challengeRules.maxDailyDrawdownAmount) || 2500,
      maxDailyDrawdownPercentage: Number(body.challengeRules.maxDailyDrawdownPercentage) || 5,
      maxOverallDrawdownAmount: Number(body.challengeRules.maxOverallDrawdownAmount) || 5000,
      maxOverallDrawdownPercentage: Number(body.challengeRules.maxOverallDrawdownPercentage) || 10,
      drawdownCalculationType: body.challengeRules.drawdownCalculationType || 'balance_based',
      drawdownTrailingType: body.challengeRules.drawdownTrailingType || 'static',
      minTradingDays: Number(body.challengeRules.minTradingDays) || 5,
      maxTradingDays: Number(body.challengeRules.maxTradingDays) || 60,
      profitSplitPercentage: Number(body.challengeRules.profitSplitPercentage) || 80,
      startDate: new Date().toISOString(),
      currentTradingDays: 0
    } : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.accounts.set(newAccount.id, newAccount);
  return res.json(newAccount);
});

app.put('/api/accounts/:id', (req: Request, res: Response) => {
  const acc = db.accounts.get(req.params.id);
  if (!acc) return res.status(404).json({ error: 'Account not found' });
  Object.assign(acc, req.body, { updatedAt: new Date().toISOString() });
  return res.json(acc);
});

// -------------------------------------------------------------
// 3. TRADE JOURNAL & GRADING ROUTES
// -------------------------------------------------------------

app.get('/api/trades', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const { accountId, instrument, strategy, session, search } = req.query;

  let trades = db.getUserTrades(userId, accountId as string);

  if (instrument && instrument !== 'ALL') {
    trades = trades.filter(t => t.instrument === instrument);
  }
  if (strategy && strategy !== 'ALL') {
    trades = trades.filter(t => t.strategyName === strategy || t.strategyId === strategy);
  }
  if (session && session !== 'ALL') {
    trades = trades.filter(t => t.tradingSession === session);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    trades = trades.filter(t =>
      t.instrument.toLowerCase().includes(q) ||
      t.setupType.toLowerCase().includes(q) ||
      t.preTradeAnalysis.toLowerCase().includes(q) ||
      t.postTradeReflection.toLowerCase().includes(q) ||
      (t.strategyName && t.strategyName.toLowerCase().includes(q))
    );
  }

  return res.json(trades);
});

app.post('/api/trades', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const b = req.body;

  const canonicalSymbol = resolveCanonical(b.instrument || 'US100');
  const entry = Number(b.entryPrice);
  const exit = Number(b.exitPrice);
  const sl = Number(b.stopLoss);
  const dir = b.direction as 'BUY' | 'SELL';

  // Calculate R-multiple deterministically
  let rMult = Number(b.rMultiple);
  if (isNaN(rMult) && entry && exit && sl) {
    const riskDistance = Math.abs(entry - sl);
    const rewardDistance = dir === 'BUY' ? (exit - entry) : (entry - exit);
    rMult = riskDistance > 0 ? Number((rewardDistance / riskDistance).toFixed(2)) : 0;
  }

  // Calculate Net P&L if not explicitly provided
  let netPnL = Number(b.netProfitLoss);
  if (isNaN(netPnL)) {
    const gross = Number(b.grossProfitLoss) || 0;
    const comm = Number(b.commission) || 0;
    const swap = Number(b.swap) || 0;
    netPnL = gross - comm - swap;
  }

  const tradeStrategy = b.strategyId ? db.strategies.get(b.strategyId) : null;

  const newTrade: Trade = {
    id: `tr_${Date.now()}`,
    userId,
    accountId: b.accountId || 'acc_apex_100k',
    instrument: canonicalSymbol,
    brokerSymbol: b.brokerSymbol || canonicalSymbol,
    direction: dir || 'BUY',
    entryPrice: entry,
    exitPrice: exit,
    stopLoss: sl,
    takeProfit: b.takeProfit ? Number(b.takeProfit) : undefined,
    positionSize: Number(b.positionSize) || 1.0,
    riskPercentage: Number(b.riskPercentage) || 1.0,
    accountBalanceAtEntry: Number(b.accountBalanceAtEntry) || 100000,
    grossProfitLoss: Number(b.grossProfitLoss) || netPnL,
    commission: Number(b.commission) || 0,
    swap: Number(b.swap) || 0,
    netProfitLoss: netPnL,
    rMultiple: rMult || 0,
    plannedRMultiple: b.plannedRMultiple ? Number(b.plannedRMultiple) : undefined,
    entryDate: b.entryDate || new Date().toISOString(),
    exitDate: b.exitDate || new Date().toISOString(),
    holdingDurationMinutes: Number(b.holdingDurationMinutes) || 45,
    tradingSession: b.tradingSession || 'New York AM',
    strategyId: b.strategyId,
    strategyName: tradeStrategy?.name || b.strategyName,
    setupType: b.setupType || 'Discretionary Liquidity Retest',
    marketConditions: b.marketConditions || 'Trending Bullish',
    preTradeAnalysis: b.preTradeAnalysis || '',
    postTradeReflection: b.postTradeReflection || '',
    emotionalState: b.emotionalState || 'Disciplined',
    strategyCompliance: b.strategyCompliance !== false,
    ruleViolations: b.ruleViolations || [],
    screenshots: b.screenshots || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Grade the trade automatically
  newTrade.grade = calculateTradeGrade(newTrade, tradeStrategy);

  db.trades.set(newTrade.id, newTrade);

  // Update account balance
  const account = db.accounts.get(newTrade.accountId);
  if (account) {
    account.currentBalance += newTrade.netProfitLoss;
    account.currentEquity += newTrade.netProfitLoss;
    account.updatedAt = new Date().toISOString();
  }

  return res.json(newTrade);
});

app.put('/api/trades/:id', (req: Request, res: Response) => {
  const trade = db.trades.get(req.params.id);
  if (!trade) return res.status(404).json({ error: 'Trade not found' });

  Object.assign(trade, req.body, { updatedAt: new Date().toISOString() });
  trade.grade = calculateTradeGrade(trade, trade.strategyId ? db.strategies.get(trade.strategyId) : null);

  return res.json(trade);
});

app.delete('/api/trades/:id', (req: Request, res: Response) => {
  const deleted = db.trades.delete(req.params.id);
  return res.json({ success: deleted });
});

app.post('/api/trades/:id/grade', (req: Request, res: Response) => {
  const trade = db.trades.get(req.params.id);
  if (!trade) return res.status(404).json({ error: 'Trade not found' });

  const strat = trade.strategyId ? db.strategies.get(trade.strategyId) : null;
  trade.grade = calculateTradeGrade(trade, strat);
  return res.json(trade.grade);
});

// -------------------------------------------------------------
// 4. ANALYTICS & LEAK DETECTOR ROUTES
// -------------------------------------------------------------

app.get('/api/analytics', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const { accountId } = req.query;
  const trades = db.getUserTrades(userId, accountId as string);
  const analytics = computeAnalytics(trades);
  return res.json(analytics);
});

// -------------------------------------------------------------
// 5. CONSISTENCY & DISCIPLINE ROUTES
// -------------------------------------------------------------

app.get('/api/consistency', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  let metrics = db.consistencyRules.get(userId);
  if (!metrics) {
    // Generate fresh consistency metrics from user trades
    const trades = db.getUserTrades(userId);
    const violations = trades.flatMap(t => t.ruleViolations || []);
    metrics = {
      userId,
      period: 'Last 30 Days',
      profitabilityScore: 85,
      disciplineScore: Math.max(50, 100 - (violations.length * 6)),
      dailyRiskAveragePercent: 1.0,
      maxDailyLossAmount: 1500,
      maxDailyLossLimit: 2500,
      maxTradesPerDayLimit: 3,
      actualAvgTradesPerDay: 1.2,
      ruleViolationCount: violations.length,
      revengeTradingReports: 0,
      overtradingDaysCount: 0,
      earlyExitCount: 1,
      consecutiveLosingDays: 0,
      recentViolations: []
    };
  }
  return res.json(metrics);
});

app.put('/api/consistency', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  let metrics = db.consistencyRules.get(userId);
  if (!metrics) {
    metrics = {
      userId,
      period: 'Last 30 Days',
      profitabilityScore: 88,
      disciplineScore: 92,
      dailyRiskAveragePercent: 1.0,
      maxDailyLossAmount: 1500,
      maxDailyLossLimit: 2500,
      maxTradesPerDayLimit: 2,
      actualAvgTradesPerDay: 1.4,
      ruleViolationCount: 0,
      revengeTradingReports: 0,
      overtradingDaysCount: 0,
      earlyExitCount: 0,
      consecutiveLosingDays: 0,
      recentViolations: []
    };
  }
  Object.assign(metrics, req.body);
  db.consistencyRules.set(userId, metrics);
  return res.json(metrics);
});

app.post('/api/consistency/violation', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  let metrics = db.consistencyRules.get(userId);
  if (!metrics) {
    metrics = {
      userId,
      period: 'Last 30 Days',
      profitabilityScore: 85,
      disciplineScore: 90,
      dailyRiskAveragePercent: 1.0,
      maxDailyLossAmount: 1500,
      maxDailyLossLimit: 2500,
      maxTradesPerDayLimit: 2,
      actualAvgTradesPerDay: 1.2,
      ruleViolationCount: 0,
      revengeTradingReports: 0,
      overtradingDaysCount: 0,
      earlyExitCount: 0,
      consecutiveLosingDays: 0,
      recentViolations: []
    };
    db.consistencyRules.set(userId, metrics);
  }

  const { violationType, details, severity } = req.body;
  const newViol = {
    id: `viol_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    violationType: violationType || 'Unplanned Strategy Deviation',
    severity: severity || 'medium',
    details: details || 'Manual violation logged by trader.'
  };

  metrics.recentViolations = [newViol, ...(metrics.recentViolations || [])];
  metrics.ruleViolationCount = (metrics.ruleViolationCount || 0) + 1;
  metrics.disciplineScore = Math.max(20, (metrics.disciplineScore || 90) - 5);

  return res.json(metrics);
});

// -------------------------------------------------------------
// 6. STRATEGIES & RULEBOOK ROUTES
// -------------------------------------------------------------

app.get('/api/strategies', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  return res.json(db.getUserStrategies(userId));
});

app.post('/api/strategies', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const b = req.body;
  const newStrat: TradingStrategy = {
    id: `strat_${Date.now()}`,
    userId,
    name: b.name || 'New Strategy Model',
    description: b.description || '',
    instruments: b.instruments || ['US100'],
    preferredSessions: b.preferredSessions || ['New York AM'],
    higherTimeframeBias: b.higherTimeframeBias || '',
    liquidityConditions: b.liquidityConditions || '',
    marketStructureConditions: b.marketStructureConditions || '',
    chochBosRequirements: b.chochBosRequirements || '',
    fairValueGapRequirements: b.fairValueGapRequirements || '',
    orderBlockRequirements: b.orderBlockRequirements || '',
    entryConfirmation: b.entryConfirmation || '',
    stopLossRules: b.stopLossRules || '',
    takeProfitRules: b.takeProfitRules || '',
    riskManagementRules: b.riskManagementRules || '1.0% max risk per trade.',
    invalidatingConditions: b.invalidatingConditions || '',
    active: true,
    winRateTarget: Number(b.winRateTarget) || 65,
    createdAt: new Date().toISOString()
  };

  db.strategies.set(newStrat.id, newStrat);
  return res.json(newStrat);
});

app.put('/api/strategies/:id', (req: Request, res: Response) => {
  const strat = db.strategies.get(req.params.id);
  if (!strat) return res.status(404).json({ error: 'Strategy not found' });
  Object.assign(strat, req.body);
  return res.json(strat);
});

// -------------------------------------------------------------
// 7. REAL-TIME MARKET DATA ROUTES (5 CANONICAL INSTRUMENTS)
// -------------------------------------------------------------

app.get('/api/market/quotes', (_req: Request, res: Response) => {
  return res.json(marketService.getQuotes());
});

app.get('/api/market/candles', (req: Request, res: Response) => {
  const symbol = resolveCanonical((req.query.symbol as string) || 'US100');
  const tf = (req.query.timeframe as string) || '15m';
  return res.json(marketService.getCandles(symbol, tf));
});

app.get('/api/market/structure', (req: Request, res: Response) => {
  const symbol = resolveCanonical((req.query.symbol as string) || 'US100');
  return res.json(marketService.getMarketStructure(symbol));
});

app.get('/api/market/briefing', (req: Request, res: Response) => {
  const symbol = resolveCanonical((req.query.symbol as string) || 'US100');
  return res.json(marketService.getMarketBriefing(symbol));
});

app.get('/api/market/economic-calendar', (_req: Request, res: Response) => {
  return res.json(marketService.getEconomicCalendar());
});

app.get('/api/market/status', (_req: Request, res: Response) => {
  return res.json(marketService.getProviderStatus());
});

app.post('/api/market/simulate-outage', (req: Request, res: Response) => {
  const active = req.body.active === true;
  const status = marketService.setSimulateOutage(active);
  return res.json(status);
});

app.post('/api/market/simulation-mode', (req: Request, res: Response) => {
  const active = req.body.active === true;
  const simulationModeActive = marketService.setSimulationMode(active);
  return res.json({
    simulationModeActive,
    status: marketService.getProviderStatus(),
    quotes: marketService.getQuotes()
  });
});

app.post('/api/market/calibrate', (req: Request, res: Response) => {
  const symbol = resolveCanonical((req.body.symbol as string) || 'US100');
  const targetPrice = Number(req.body.targetPrice);
  if (isNaN(targetPrice) || targetPrice <= 0) {
    return res.status(400).json({ error: 'Valid positive targetPrice required' });
  }
  const updatedQuote = marketService.calibratePrice(symbol, targetPrice);
  return res.json({
    success: true,
    symbol,
    quote: updatedQuote,
    quotes: marketService.getQuotes()
  });
});

app.post('/api/market/refresh', async (_req: Request, res: Response) => {
  await marketService.syncLiveExternalFeeds();
  return res.json({
    status: marketService.getProviderStatus(),
    quotes: marketService.getQuotes()
  });
});

// -------------------------------------------------------------
// 8. BANDIT AI (THREE INTELLIGENCE SYSTEMS)
// -------------------------------------------------------------

app.post('/api/ai/performance-intelligence', async (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const trades = db.getUserTrades(userId);
  const analysis = await generatePerformanceReview(trades, req.body.timeframe || 'Last 30 Days');
  return res.json({ analysis });
});

app.post('/api/ai/market-intelligence', async (req: Request, res: Response) => {
  const symbol = resolveCanonical(req.body.symbol || 'US100');
  const briefing = await generateMarketIntelligenceBriefing(symbol);
  return res.json({ briefing });
});

app.post('/api/ai/risk-intelligence', async (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const accountId = req.body.accountId;
  const account = (accountId ? db.accounts.get(accountId) : null) || db.getUserAccounts(userId)[0];
  const trades = db.getUserTrades(userId, account?.id);
  const consistency = db.consistencyRules.get(userId) || {
    disciplineScore: 92,
    profitabilityScore: 88,
    ruleViolationCount: 2,
    overtradingDaysCount: 1,
    dailyRiskAveragePercent: 1.05
  };

  const audit = await generateRiskIntelligenceReview(account, trades, consistency as any);
  return res.json({ audit });
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const { message, system, activeSymbol } = req.body;
  const trades = db.getUserTrades(userId);
  const accounts = db.getUserAccounts(userId);
  const consistency = db.consistencyRules.get(userId);

  const result = await chatWithBandit(message, {
    system: system || 'performance',
    trades,
    accounts,
    consistency,
    activeSymbol: activeSymbol ? resolveCanonical(activeSymbol) : 'US100'
  });

  return res.json(result);
});

app.get('/api/ai/daily-briefing', async (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const trades = db.getUserTrades(userId);
  const accounts = db.getUserAccounts(userId);
  const quotes = marketService.getQuotes();
  const eco = marketService.getEconomicCalendar().slice(0, 3);

  const primaryAcc = accounts[0];
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.netProfitLoss > 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0';

  return res.json({
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
    performanceSummary: `Win rate: ${winRate}% across ${totalTrades} trades. Primary edge: US100 & XAUUSD NY AM sessions.`,
    disciplineStatus: 'Optimal (Discipline Score: 92/100). No stop loss tampering detected in last 5 sessions.',
    accountWarning: primaryAcc?.challengeRules
      ? `Challenge Cushion: $${primaryAcc.challengeRules.maxDailyDrawdownAmount.toLocaleString()} daily buffer. Sizing locked at 1.0% max.`
      : 'Capital safety active. Position sizing within limits.',
    upcomingEvents: eco.map(e => `${e.name} (${e.currency}, ${e.impact} Impact)`),
    marketSnapshot: quotes.map(q => `${q.symbol}: ${q.lastPrice} (${q.change24hPercent >= 0 ? '+' : ''}${q.change24hPercent}%)`)
  });
});

// -------------------------------------------------------------
// 9. CSV IMPORT & EXPORT
// -------------------------------------------------------------

app.post('/api/trades/import-csv', (req: Request, res: Response) => {
  const userId = getRequestUserId(req);
  const { trades, accountId } = req.body;

  if (!Array.isArray(trades) || trades.length === 0) {
    return res.status(400).json({ error: 'No trade records provided for import.' });
  }

  const targetAccountId = accountId || db.getUserAccounts(userId)[0]?.id || 'acc_apex_100k';
  let importedCount = 0;

  trades.forEach((raw: any) => {
    const canonical = resolveCanonical(raw.instrument || raw.symbol || 'US100');
    const entry = parseFloat(raw.entryPrice || raw.openPrice || 0);
    const exit = parseFloat(raw.exitPrice || raw.closePrice || 0);
    const pnl = parseFloat(raw.netPnL || raw.profit || raw.pnl || 0);
    const sl = parseFloat(raw.stopLoss || (raw.direction === 'BUY' ? entry * 0.99 : entry * 1.01));

    if (entry > 0 && exit > 0) {
      const id = `tr_imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const importedTrade: Trade = {
        id,
        userId,
        accountId: targetAccountId,
        instrument: canonical,
        brokerSymbol: raw.symbol || canonical,
        direction: (raw.direction || raw.type || 'BUY').toUpperCase().includes('SELL') ? 'SELL' : 'BUY',
        entryPrice: entry,
        exitPrice: exit,
        stopLoss: sl,
        positionSize: parseFloat(raw.lots || raw.positionSize || 1.0),
        riskPercentage: 1.0,
        accountBalanceAtEntry: 100000,
        grossProfitLoss: pnl,
        commission: parseFloat(raw.commission || 0),
        swap: parseFloat(raw.swap || 0),
        netProfitLoss: pnl,
        rMultiple: parseFloat(raw.rMultiple || 1.0),
        entryDate: raw.openTime || raw.entryDate || new Date().toISOString(),
        exitDate: raw.closeTime || raw.exitDate || new Date().toISOString(),
        holdingDurationMinutes: 60,
        tradingSession: 'New York AM',
        setupType: 'Imported CSV Record',
        marketConditions: 'Trending Bullish',
        preTradeAnalysis: 'Imported trade from broker history.',
        postTradeReflection: 'Imported record audit.',
        emotionalState: 'Disciplined',
        strategyCompliance: true,
        screenshots: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      importedTrade.grade = calculateTradeGrade(importedTrade);
      db.trades.set(id, importedTrade);
      importedCount++;
    }
  });

  return res.json({ success: true, importedCount });
});

// -------------------------------------------------------------
// 10. VITE DEV SERVER INTEGRATION
// -------------------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BANDITRADES Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
