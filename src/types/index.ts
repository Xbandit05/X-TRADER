/**
 * BANDITRADES — Core Type Definitions
 * Professional Trading Journal & Intelligence Platform
 */

// Supported 5 Canonical Instruments
export type CanonicalInstrument = 'US100' | 'US30' | 'GBPUSD' | 'GBPJPY' | 'XAUUSD';

export interface InstrumentMeta {
  symbol: CanonicalInstrument;
  name: string;
  category: 'Indices' | 'Forex' | 'Commodities';
  pipSize: number;
  contractSize: number;
  aliases: string[];
  description: string;
}

export const CANONICAL_INSTRUMENTS: Record<CanonicalInstrument, InstrumentMeta> = {
  US100: {
    symbol: 'US100',
    name: 'NASDAQ 100 Index',
    category: 'Indices',
    pipSize: 0.25,
    contractSize: 20,
    aliases: ['NAS100', 'NDX', 'US100F', 'USTEC', 'NAS100USD'],
    description: 'Tech-heavy US top 100 benchmark index (CFD / Futures price standard).'
  },
  US30: {
    symbol: 'US30',
    name: 'Dow Jones Industrial 30',
    category: 'Indices',
    pipSize: 1.0,
    contractSize: 5,
    aliases: ['DJ30', 'WS30', 'US30F', 'WALLSTREET', 'YM'],
    description: 'Wall Street 30 blue-chip benchmark index.'
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    category: 'Forex',
    pipSize: 0.0001,
    contractSize: 100000,
    aliases: ['GBP/USD', 'CABLE', 'GBPUSD.pro'],
    description: 'Major currency cross - British Pound vs US Dollar.'
  },
  GBPJPY: {
    symbol: 'GBPJPY',
    name: 'British Pound / Japanese Yen',
    category: 'Forex',
    pipSize: 0.01,
    contractSize: 100000,
    aliases: ['GBP/JPY', 'GUPPY', 'THE_BEAST', 'GBPJPY.pro'],
    description: 'High-volatility cross pair - British Pound vs Japanese Yen.'
  },
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    category: 'Commodities',
    pipSize: 0.01,
    contractSize: 100,
    aliases: ['GOLD', 'XAU/USD', 'SPOT_GOLD', 'XAUUSD.pro'],
    description: 'Spot Gold bullion denominated in US Dollars per troy ounce.'
  }
};

export type TradeDirection = 'BUY' | 'SELL';
export type TradingSession = 'Asian' | 'London Open' | 'London PM' | 'New York AM' | 'New York PM';
export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN';
export type TradeGradeLetter = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface TradeScreenshot {
  id: string;
  type: 'before' | 'after' | 'execution' | 'higher_timeframe';
  url: string;
  caption?: string;
  timestamp: string;
}

export interface TradeGrade {
  overallScore: number; // 0 - 100
  letterGrade: TradeGradeLetter;
  setupQuality: number; // Max 25
  entryExecution: number; // Max 20
  riskManagement: number; // Max 20
  strategyCompliance: number; // Max 20
  exitExecution: number; // Max 15
  strengths: string[];
  mistakes: string[];
  evidenceUsed: string[];
  missingInformation: string[];
  recommendations: string[];
  evaluatedAt: string;
}

export interface StrategyWorkflowStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  instructions: string;
  requiredEvidence: string[];
}

export interface StrategyChecklistItem {
  step: number;
  title: string;
  status: 'Confirmed' | 'Not confirmed' | 'Not applicable' | 'Awaiting confirmation';
  notes?: string;
  screenshotUrl?: string;
}

export interface Trade {
  id: string;
  userId: string;
  accountId: string;
  instrument: CanonicalInstrument;
  brokerSymbol?: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit?: number;
  invalidationLevel?: number;
  positionSize: number; // Lots or contracts
  riskPercentage: number;
  accountBalanceAtEntry: number;
  grossProfitLoss: number;
  commission: number;
  swap: number;
  netProfitLoss: number;
  rMultiple: number; // Realized R
  plannedRMultiple?: number;
  entryDate: string; // ISO string
  exitDate: string; // ISO string
  holdingDurationMinutes: number;
  tradingSession: TradingSession;
  strategyId?: string;
  strategyName?: string;
  setupType: string;
  marketConditions: 'Trending Bullish' | 'Trending Bearish' | 'Ranging/Consolidation' | 'Volatile News' | 'Choppy';
  preTradeAnalysis: string;
  postTradeReflection: string;
  emotionalState: 'Calm & Confident' | 'Impatient / FOMO' | 'Anxious' | 'Revenge / Frustrated' | 'Disciplined';
  strategyCompliance: boolean;
  retestOccurred?: boolean;
  confirmationPresent?: boolean;
  confluencesUsed?: string[];
  checklist?: StrategyChecklistItem[];
  ruleViolations?: string[];
  screenshots: TradeScreenshot[];
  grade?: TradeGrade;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'personal_live' | 'demo' | 'prop_evaluation' | 'prop_funded' | 'professional';
export type AccountStatus = 'active' | 'passed' | 'failed' | 'paused' | 'archived';

export interface PropFirmChallengeRules {
  id: string;
  accountId: string;
  propFirmName: string;
  phase: 'Phase 1' | 'Phase 2' | 'Funded Stage';
  startingBalance: number;
  profitTargetAmount: number;
  profitTargetPercentage: number;
  maxDailyDrawdownAmount: number;
  maxDailyDrawdownPercentage: number;
  maxOverallDrawdownAmount: number;
  maxOverallDrawdownPercentage: number;
  drawdownCalculationType: 'equity_based' | 'balance_based';
  drawdownTrailingType: 'static' | 'trailing_relative_to_high_watermark';
  minTradingDays: number;
  maxTradingDays?: number;
  consistencyRulePercentage?: number; // e.g. no single day > 30% of total profit
  profitSplitPercentage: number;
  startDate: string;
  currentTradingDays: number;
}

export interface TradingAccount {
  id: string;
  userId: string;
  name: string;
  accountType: AccountType;
  brokerOrFirm: string;
  currency: string;
  startingBalance: number;
  currentBalance: number;
  currentEquity: number;
  status: AccountStatus;
  challengeRules?: PropFirmChallengeRules;
  createdAt: string;
  updatedAt: string;
}

export interface TradingStrategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPrimary?: boolean;
  corePrinciple?: string; // e.g. "NO RETEST = NO TRADE"
  timeframes?: {
    context4h: string;
    context1h: string;
    bias15m: string;
    execution5m: string;
  };
  workflowSteps?: StrategyWorkflowStep[];
  confluences?: string[];
  instruments: CanonicalInstrument[];
  preferredSessions: TradingSession[];
  higherTimeframeBias: string;
  liquidityConditions: string;
  marketStructureConditions: string;
  chochBosRequirements: string;
  fairValueGapRequirements: string;
  orderBlockRequirements: string;
  entryConfirmation: string;
  stopLossRules: string;
  takeProfitRules: string;
  riskManagementRules: string;
  invalidatingConditions: string;
  active: boolean;
  winRateTarget: number;
  createdAt: string;
}

export interface PersonalTradingRule {
  id: string;
  ruleText: string;
  category: 'execution' | 'risk' | 'discipline' | 'psychology';
  enabled: boolean;
  maxDailyViolationAllowance: number;
}

export interface ConsistencyMetrics {
  userId: string;
  period: string;
  profitabilityScore: number; // 0 - 100
  disciplineScore: number; // 0 - 100
  dailyRiskAveragePercent: number;
  maxDailyLossAmount: number;
  maxDailyLossLimit: number;
  maxTradesPerDayLimit: number;
  actualAvgTradesPerDay: number;
  ruleViolationCount: number;
  revengeTradingReports: number;
  overtradingDaysCount: number;
  earlyExitCount: number;
  consecutiveLosingDays: number;
  personalRules?: PersonalTradingRule[];
  recentViolations: {
    id: string;
    date: string;
    tradeId?: string;
    violationType: string;
    severity: 'low' | 'medium' | 'high';
    details: string;
  }[];
}

export interface MarketQuote {
  symbol: CanonicalInstrument;
  name: string;
  tradingViewSymbol: string;
  bid: number;
  ask: number;
  lastPrice: number;
  prevClose: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  spread: number;
  session: 'Sydney' | 'Tokyo' | 'London' | 'New York';
  sessionStatus: 'Open' | 'Closed' | 'Pre-Market';
  isMarketOpen: boolean;
  marketStateLabel: string;
  marketCloseNotice?: string;
  nextSessionNotice?: string;
  simulationModeActive?: boolean;
  provider: string;
  sourceType: 'INTERBANK_LIVE_FEED' | 'CFD_BENCHMARK_FEED' | 'FALLBACK_CACHE';
  feedStatus: 'REAL_TIME' | 'STANDBY_FALLBACK' | 'OUTAGE_PROTECTION' | 'DELAYED';
  providerHealth: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
  isRealtime: boolean;
  isStale: boolean;
  recencySeconds: number;
  latencyMs: number;
  outageMessage?: string;
  timestamp: string;
}

export interface MarketProviderStatus {
  primaryProvider: string;
  backupProvider: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
  lastSyncTimestamp: string;
  averageLatencyMs: number;
  isSimulatingOutage: boolean;
  simulationModeActive: boolean;
  activeFailover: boolean;
  message: string;
  globalMarketState: 'WEEKEND_CLOSED' | 'WEEKDAY_ACTIVE' | 'MAINTENANCE_HALT';
}

export interface MarketCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStructureItem {
  type: 'BOS' | 'CHoCH' | 'FVG' | 'ORDER_BLOCK' | 'LIQUIDITY_SWEEP' | 'SUPPORT_RESISTANCE';
  label: string;
  priceLevel: number;
  secondaryPriceLevel?: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeframe: '15m' | '1h' | '4h' | 'Daily';
  status: 'Fresh / Untapped' | 'Mitigated' | 'Invalidated';
}

export interface EconomicEvent {
  id: string;
  name: string;
  currency: 'USD' | 'GBP' | 'JPY' | 'EUR';
  scheduledTime: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  previous: string;
  forecast: string;
  actual?: string;
  affectedInstruments: CanonicalInstrument[];
  aiImplicationSummary?: string;
}

export interface BanditMarketBriefing {
  symbol: CanonicalInstrument;
  timestamp: string;
  timeframe: string;
  verifiedPrice: number;
  higherTimeframeBias: 'Strongly Bullish' | 'Bullish' | 'Neutral / Ranging' | 'Bearish' | 'Strongly Bearish';
  shortTermStructure: string;
  keyLevels: {
    resistance: number[];
    support: number[];
    liquidityPools: number[];
  };
  bullishScenario: string;
  bearishScenario: string;
  invalidationConditions: string;
  upcomingEvents: string[];
  dataLimitations: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  subscriptionTier: 'free' | 'pro' | 'premium';
  theme: 'dark' | 'light';
  riskTolerancePercent: number;
  maxDailyDrawdownPercent: number;
  dailyLossWarningPercent: number;
  createdAt: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'bandit';
  text: string;
  timestamp: string;
  system: 'performance' | 'market' | 'risk';
  citedTrades?: {
    id: string;
    instrument: CanonicalInstrument;
    outcome: TradeOutcome;
    rMultiple: number;
    date: string;
  }[];
  marketContext?: {
    symbol: CanonicalInstrument;
    price: number;
    bias: string;
  };
}
