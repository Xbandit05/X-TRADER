/**
 * BANDITRADES — Database & In-Memory Store
 * Multi-user private workspace architecture with seed data and persistence
 */

import {
  CanonicalInstrument,
  CANONICAL_INSTRUMENTS,
  Trade,
  TradingAccount,
  TradingStrategy,
  TradeGrade,
  TradeGradeLetter,
  PropFirmChallengeRules,
  ConsistencyMetrics,
  UserProfile
} from '../src/types/index.ts';

// Deterministic Trade Grading Engine
export function calculateTradeGrade(
  trade: Partial<Trade>,
  strategy?: TradingStrategy | null
): TradeGrade {
  let setupQuality = 18;
  let entryExecution = 15;
  let riskManagement = 15;
  let strategyCompliance = 15;
  let exitExecution = 10;

  const strengths: string[] = [];
  const mistakes: string[] = [];
  const evidenceUsed: string[] = [];
  const missingInformation: string[] = [];
  const recommendations: string[] = [];

  // 1. Risk Management (Max 20 points)
  const riskPct = trade.riskPercentage ?? 1.0;
  if (riskPct <= 1.0) {
    riskManagement = 20;
    strengths.push(`Institutional risk discipline: position sized precisely at ${riskPct.toFixed(2)}% of account capital.`);
  } else if (riskPct <= 1.5) {
    riskManagement = 17;
    strengths.push(`Strict risk sizing maintained at ${riskPct.toFixed(2)}% (within institutional <= 1.5% limit).`);
  } else if (riskPct <= 2.5) {
    riskManagement = 12;
    mistakes.push(`Risk percentage was elevated at ${riskPct.toFixed(2)}% of account capital.`);
    recommendations.push('Cap single trade risk at 1.0% to survive drawdowns comfortably.');
  } else {
    riskManagement = 4;
    mistakes.push(`Dangerous risk allocation of ${riskPct.toFixed(2)}% exceeds maximum risk rules.`);
    recommendations.push('Immediate sizing rule violation: never risk >2% on any single trade setup.');
  }
  evidenceUsed.push(`Position size: ${trade.positionSize} lots, Risk %: ${riskPct}%`);

  // Stop Loss & Invalidation verification
  if (trade.stopLoss && trade.entryPrice) {
    const slDist = Math.abs(trade.entryPrice - trade.stopLoss);
    if (slDist > 0) {
      evidenceUsed.push(`Hard stop loss placed at ${trade.stopLoss} (${slDist.toFixed(2)} pts from entry).`);
    }
  } else {
    riskManagement = Math.max(0, riskManagement - 10);
    mistakes.push('Missing explicit predetermined Stop Loss order.');
    missingInformation.push('No hard Stop Loss level specified at entry.');
  }

  // 2. Setup Quality (Max 25 points)
  if (trade.preTradeAnalysis && trade.preTradeAnalysis.length > 25) {
    setupQuality = 22;
    strengths.push('Detailed pre-trade thesis documented prior to execution.');
    evidenceUsed.push('Pre-trade thesis documented: ' + trade.preTradeAnalysis.slice(0, 60) + '...');
  } else {
    setupQuality = 12;
    mistakes.push('Minimal pre-trade context or documented thesis.');
    missingInformation.push('Pre-trade higher timeframe bias reasoning was sparse.');
  }

  if (trade.setupType) {
    evidenceUsed.push(`Setup model: ${trade.setupType}`);
  }

  // CORE RULE: NO RETEST = NO TRADE
  if (trade.retestOccurred === false) {
    setupQuality = Math.max(0, setupQuality - 14);
    strategyCompliance = Math.max(0, strategyCompliance - 12);
    mistakes.push('CORE STRATEGY VIOLATION: NO RETEST = NO TRADE. Position was taken prematurely without price returning to the zone.');
    recommendations.push('Enforce rule: Never chase price after displacement. No retest = No trade under any circumstance.');
  } else if (trade.retestOccurred === true) {
    setupQuality = Math.min(25, setupQuality + 3);
    strengths.push('Strictly respected core principle: Waited patiently for confirmed zone retest.');
  }

  // Strategy Checklist verification
  if (trade.checklist && trade.checklist.length > 0) {
    const confirmedCount = trade.checklist.filter(c => c.status === 'Confirmed').length;
    evidenceUsed.push(`Strategy Checklist: ${confirmedCount}/${trade.checklist.length} conditions confirmed.`);
    if (confirmedCount === trade.checklist.length) {
      setupQuality = 25;
      strengths.push('100% of Strategy Checklist conditions fully verified before execution.');
    } else if (confirmedCount < trade.checklist.length / 2) {
      strategyCompliance = Math.max(0, strategyCompliance - 8);
      mistakes.push(`Incomplete setup: Only ${confirmedCount}/${trade.checklist.length} checklist conditions were confirmed.`);
    }
  }

  // 3. Entry Execution (Max 20 points)
  const emotional = trade.emotionalState ?? 'Calm & Confident';
  if (emotional === 'Impatient / FOMO' || emotional === 'Revenge / Frustrated') {
    entryExecution = 6;
    mistakes.push(`Sub-optimal entry caused by emotional state: ${emotional}.`);
    recommendations.push('Enforce 15-minute mandatory wait time after closing any position before taking another.');
  } else if (emotional === 'Disciplined' || emotional === 'Calm & Confident') {
    entryExecution = 19;
    strengths.push(`Patient execution in calm, objective psychological state (${emotional}).`);
  }

  if (trade.confirmationPresent === false) {
    entryExecution = Math.max(0, entryExecution - 8);
    mistakes.push('Entry executed without clear buyer/seller confirmation signature.');
  }

  // 4. Strategy Compliance (Max 20 points)
  if (trade.strategyCompliance) {
    strategyCompliance = Math.min(20, strategyCompliance);
    strengths.push('Strictly followed documented model rules without improvisation.');
  } else {
    strategyCompliance = 4;
    mistakes.push('Unplanned setup: Diverged from standard documented strategy rules.');
    recommendations.push('Only execute setups that meet 100% of your Strategy Checklist.');
  }

  if (trade.ruleViolations && trade.ruleViolations.length > 0) {
    strategyCompliance = Math.max(0, strategyCompliance - (trade.ruleViolations.length * 5));
    mistakes.push(...trade.ruleViolations.map(v => `Rule violation: ${v}`));
  }

  // 5. Exit Execution (Max 15 points)
  const rMult = trade.rMultiple ?? 0;
  if (rMult >= 2.0) {
    exitExecution = 15;
    strengths.push(`High reward realization: captured ${rMult.toFixed(2)}R.`);
  } else if (rMult > 0) {
    exitExecution = 12;
    strengths.push(`Positive realization of ${rMult.toFixed(2)}R.`);
  } else if (rMult === 0) {
    exitExecution = 11;
    strengths.push('Protected capital with scratch / breakeven exit.');
  } else {
    // A loss can still have high exit execution if trader respected planned SL and did not widen!
    if (Math.abs(rMult) <= 1.05) {
      exitExecution = 14;
      strengths.push(`Disciplined stop loss acceptance: loss was contained at planned -1.0R (${rMult.toFixed(2)}R).`);
    } else {
      exitExecution = 4;
      mistakes.push(`Loss exceeded planned stop loss boundary (${rMult.toFixed(2)}R loss).`);
      recommendations.push('Never move or widen your stop loss after trade entry.');
    }
  }

  // Calculate Overall Score
  const overallScore = Math.min(100, Math.max(0, setupQuality + entryExecution + riskManagement + strategyCompliance + exitExecution));

  let letterGrade: TradeGradeLetter = 'F';
  if (overallScore >= 97) letterGrade = 'A+';
  else if (overallScore >= 90) letterGrade = 'A';
  else if (overallScore >= 80) letterGrade = 'B';
  else if (overallScore >= 70) letterGrade = 'C';
  else if (overallScore >= 60) letterGrade = 'D';

  return {
    overallScore,
    letterGrade,
    setupQuality,
    entryExecution,
    riskManagement,
    strategyCompliance,
    exitExecution,
    strengths,
    mistakes,
    evidenceUsed,
    missingInformation,
    recommendations,
    evaluatedAt: new Date().toISOString()
  };
}

// In-Memory Database Store
class DatabaseStore {
  public users: Map<string, UserProfile> = new Map();
  public userPasswords: Map<string, string> = new Map(); // demo hashed simulation
  public accounts: Map<string, TradingAccount> = new Map();
  public trades: Map<string, Trade> = new Map();
  public strategies: Map<string, TradingStrategy> = new Map();
  public consistencyRules: Map<string, any> = new Map();
  public reflections: Map<string, any> = new Map();

  constructor() {
    this.seedDemoUser();
  }

  private seedDemoUser() {
    const demoUserId = 'usr_bandit_demo';
    const demoProfile: UserProfile = {
      id: demoUserId,
      email: 'bandit@banditrades.com',
      fullName: 'Alex Vance',
      username: 'heisxbandit',
      avatarUrl: '',
      subscriptionTier: 'pro',
      theme: 'dark',
      riskTolerancePercent: 1.0,
      maxDailyDrawdownPercent: 3.0,
      dailyLossWarningPercent: 2.0,
      createdAt: '2026-01-15T08:00:00Z'
    };
    this.users.set(demoUserId, demoProfile);
    this.userPasswords.set('bandit@banditrades.com', 'password123');
    this.userPasswords.set('heisxbandit@gmail.com', 'password123');

    // Create 3 Accounts for demo user:
    // 1. Apex Funded $100K Account
    const acc1Id = 'acc_apex_100k';
    const acc1: TradingAccount = {
      id: acc1Id,
      userId: demoUserId,
      name: 'Apex Trader $100K Funded',
      accountType: 'prop_funded',
      brokerOrFirm: 'Apex Trader Funding (Tradovate)',
      currency: 'USD',
      startingBalance: 100000,
      currentBalance: 107420,
      currentEquity: 107420,
      status: 'active',
      challengeRules: {
        id: 'rule_apex_1',
        accountId: acc1Id,
        propFirmName: 'Apex Trader Funding',
        phase: 'Funded Stage',
        startingBalance: 100000,
        profitTargetAmount: 0,
        profitTargetPercentage: 0,
        maxDailyDrawdownAmount: 2500,
        maxDailyDrawdownPercentage: 2.5,
        maxOverallDrawdownAmount: 3000,
        maxOverallDrawdownPercentage: 3.0,
        drawdownCalculationType: 'equity_based',
        drawdownTrailingType: 'trailing_relative_to_high_watermark',
        minTradingDays: 10,
        currentTradingDays: 14,
        profitSplitPercentage: 90,
        startDate: '2026-09-01T00:00:00Z'
      },
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-10-31T20:00:00Z'
    };
    this.accounts.set(acc1Id, acc1);

    // 2. FTMO $50K Challenge Phase 2
    const acc2Id = 'acc_ftmo_50k';
    const acc2: TradingAccount = {
      id: acc2Id,
      userId: demoUserId,
      name: 'FTMO Challenge Phase 2',
      accountType: 'prop_evaluation',
      brokerOrFirm: 'FTMO',
      currency: 'USD',
      startingBalance: 50000,
      currentBalance: 52180,
      currentEquity: 52180,
      status: 'active',
      challengeRules: {
        id: 'rule_ftmo_2',
        accountId: acc2Id,
        propFirmName: 'FTMO',
        phase: 'Phase 2',
        startingBalance: 50000,
        profitTargetAmount: 2500,
        profitTargetPercentage: 5.0,
        maxDailyDrawdownAmount: 2500,
        maxDailyDrawdownPercentage: 5.0,
        maxOverallDrawdownAmount: 5000,
        maxOverallDrawdownPercentage: 10.0,
        drawdownCalculationType: 'balance_based',
        drawdownTrailingType: 'static',
        minTradingDays: 4,
        maxTradingDays: 60,
        consistencyRulePercentage: 35,
        profitSplitPercentage: 80,
        startDate: '2026-10-10T00:00:00Z',
        currentTradingDays: 7
      },
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-31T20:00:00Z'
    };
    this.accounts.set(acc2Id, acc2);

    // 3. Interactive Brokers Personal Live
    const acc3Id = 'acc_ibkr_live';
    const acc3: TradingAccount = {
      id: acc3Id,
      userId: demoUserId,
      name: 'IBKR Personal Core',
      accountType: 'personal_live',
      brokerOrFirm: 'Interactive Brokers',
      currency: 'USD',
      startingBalance: 25000,
      currentBalance: 28340,
      currentEquity: 28340,
      status: 'active',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-10-30T16:00:00Z'
    };
    this.accounts.set(acc3Id, acc3);

    // Seed Strategies
    const strat1Id = 'strat_primary_liquidity_choch_fvg';
    const strat1: TradingStrategy = {
      id: strat1Id,
      userId: demoUserId,
      name: 'LIQUIDITY SWEEP → CHoCH → FVG RETEST',
      description: 'Primary institutional trading model. Liquidity sweep of key highs/lows, followed by Change of Character on M5/M15, displacement Fair Value Gap creation, and mandatory disciplined retest before execution.',
      isPrimary: true,
      corePrinciple: 'NO RETEST = NO TRADE',
      timeframes: {
        context4h: '4H: Broader market context, institutional macro order flow, and daily liquidity pools.',
        context1h: '1H: Additional structural context, breaker blocks, and higher-timeframe imbalances/FVGs.',
        bias15m: '15M: Primary directional bias, internal market structure (BOS/CHoCH), and liquidity pools.',
        execution5m: '5M: Primary execution timeframe, displacement shift confirmation, and FVG/zone retest.'
      },
      workflowSteps: [
        {
          stepNumber: 1,
          title: 'STEP 1 — HIGHER-TIMEFRAME BIAS',
          subtitle: 'Multi-Timeframe Structure & Draw on Liquidity',
          instructions: 'Identify market direction using the 15-minute structure. Use 1H and 4H charts to establish broader context. Identify important highs, lows, liquidity pools and relevant imbalances.',
          requiredEvidence: ['15m market structure direction', '1H/4H order flow context', 'Draw on liquidity (DOL) identified']
        },
        {
          stepNumber: 2,
          title: 'STEP 2 — LIQUIDITY SWEEP',
          subtitle: 'Targeted Liquidity Purge',
          instructions: 'Look for liquidity being taken from: Equal highs, Equal lows, Double tops, Double bottoms, Triple tops, Triple bottoms, Important swing highs, Important swing lows, or clearly identifiable liquidity pools. A trendline break and retest may be recorded as additional contextual evidence of a possible liquidity hunt, but must not independently trigger an entry.',
          requiredEvidence: ['Specific liquidity pool swept', 'Wick rejection beyond liquidity level', 'Swept pool tag (EqH/EqL/Double Top/Swing H/L)']
        },
        {
          stepNumber: 3,
          title: 'STEP 3 — CHoCH CONFIRMATION',
          subtitle: 'Change of Character Shift',
          instructions: 'Wait for a valid Change of Character after the liquidity event. Record: Direction of structural shift, Relevant swing level, Confirmation timeframe, Supporting evidence. Do not treat every candle break as a confirmed CHoCH.',
          requiredEvidence: ['Direction of shift (Bullish / Bearish)', 'Swing level broken by body close', 'Confirmation timeframe (5M/15M)']
        },
        {
          stepNumber: 4,
          title: 'STEP 4 — FAIR VALUE GAP',
          subtitle: 'Displacement & Imbalance Formation',
          instructions: 'Identify the displacement associated with the structural shift. Record: Bullish or bearish FVG, Formation timeframe, Upper and lower boundaries, Whether the imbalance remains valid, Whether price has already mitigated it.',
          requiredEvidence: ['FVG upper and lower price boundaries', '3-candle impulse displacement', 'Fresh / unmitigated status']
        },
        {
          stepNumber: 5,
          title: 'STEP 5 — RETEST (CORE PRINCIPLE: NO RETEST = NO TRADE)',
          subtitle: 'Patient Zone Pullback',
          instructions: 'Wait for price to return to: The relevant FVG, or the CHoCH breakout zone where applicable. Do not encourage immediate entries after displacement. A missed setup must never be converted into a forced entry.',
          requiredEvidence: ['Price mitigates FVG / CHoCH breakout zone', 'No entry taken prior to zone touch']
        },
        {
          stepNumber: 6,
          title: 'STEP 6 — ENTRY CONFIRMATION',
          subtitle: 'Buyer/Seller Rejection Validation',
          instructions: 'For bullish setups, require buyer confirmation. For bearish setups, require seller confirmation. Allow traders to document their specific confirmation method (e.g., lower timeframe rejection wick, 1M shift, or order flow delta).',
          requiredEvidence: ['Buyer/Seller rejection signature documented', 'Confirmation method specified']
        },
        {
          stepNumber: 7,
          title: 'STEP 7 — RISK AND EXECUTION',
          subtitle: 'Institutional Risk Pre-Flight',
          instructions: 'Before entry, require: Entry price, Stop loss, Invalidation level, Position size, Risk amount, Target, Planned R:R. Place the stop according to structural invalidation and the trader\'s risk model, with an appropriate buffer for instrument volatility. Do not recommend arbitrary stop distances.',
          requiredEvidence: ['Structural invalidation level', 'Pre-calculated position size & risk % (<= 1.0%)', 'Target & planned R:R >= 2.0']
        },
        {
          stepNumber: 8,
          title: 'STEP 8 — POST-TRADE REVIEW',
          subtitle: 'Execution Fidelity Audit',
          instructions: 'Record: Whether all setup conditions were satisfied, Whether entry was early or late, Whether the retest occurred, Whether confirmation was present, Whether risk rules were followed, Whether exit followed the trading plan.',
          requiredEvidence: ['Setup conditions checklist completed', 'Exit execution audited against trading plan']
        }
      ],
      confluences: [
        'Order Blocks',
        'Higher-timeframe FVGs',
        'Support and resistance',
        'Trendline breaks',
        'Premium and discount zones',
        'Equal highs and lows',
        'Market session context'
      ],
      instruments: ['US100', 'US30', 'GBPUSD', 'GBPJPY', 'XAUUSD'],
      preferredSessions: ['New York AM', 'London Open'],
      higherTimeframeBias: '15m trend structure aligned with 1H/4H draw on liquidity.',
      liquidityConditions: 'Clean purge of Equal Highs/Lows, Double/Triple Tops/Bottoms, or swing extremes.',
      marketStructureConditions: '5M/15M Change of Character with aggressive displacement body close.',
      chochBosRequirements: 'Decisive candle body close beyond recent swing point with impulse.',
      fairValueGapRequirements: 'Clean 3-candle imbalance. Upper and lower boundaries defined.',
      orderBlockRequirements: 'Last opposite candle prior to displacement expansion.',
      entryConfirmation: 'Price retests FVG/CHoCH zone. Buyer/seller confirmation wick rejection observed.',
      stopLossRules: 'Structural invalidation beyond the sweep extreme or displacement swing with volatility buffer.',
      takeProfitRules: 'Opposing higher-timeframe liquidity pool or minimum 2R-3R target.',
      riskManagementRules: 'Maximum 1.0% account risk per position. Cap at 2 positions per day.',
      invalidatingConditions: 'FVG closed through with candle body, news spike, or lack of retest.',
      active: true,
      winRateTarget: 70,
      createdAt: '2026-09-01T00:00:00Z'
    };
    this.strategies.set(strat1Id, strat1);

    const strat2Id = 'strat_london_sweep';
    const strat2: TradingStrategy = {
      id: strat2Id,
      userId: demoUserId,
      name: 'London Open Liquidity Expansion',
      description: 'Judas swing during London open (02:00-03:00 EST / 07:00-08:00 GMT) taking Asian range highs/lows followed by clean reversal toward daily trend.',
      instruments: ['GBPUSD', 'GBPJPY', 'XAUUSD'],
      preferredSessions: ['London Open'],
      higherTimeframeBias: '4h trend alignment with key institutional order block.',
      liquidityConditions: 'Asian range consolidation boundary purged by at least 10-15 pips.',
      marketStructureConditions: '15m displacement back inside Asian range.',
      chochBosRequirements: 'Break of structure with institutional volume signature.',
      fairValueGapRequirements: 'Entry at retest of the breaker block / newly formed FVG.',
      orderBlockRequirements: 'Breaker block mitigation.',
      entryConfirmation: 'M5 wick rejection with volume divergence.',
      stopLossRules: 'Tight stop 5 pips beyond the sweep apex.',
      takeProfitRules: 'Opposite Asian extreme + 1.5x ADR target.',
      riskManagementRules: '0.75% to 1.0% risk. Breakeven moved at 1.5R.',
      invalidatingConditions: 'Price continues to trend past Asian high without rejection.',
      active: true,
      winRateTarget: 72,
      createdAt: '2026-09-05T00:00:00Z'
    };
    this.strategies.set(strat2Id, strat2);

    const strat3Id = 'strat_gold_orderblock';
    const strat3: TradingStrategy = {
      id: strat3Id,
      userId: demoUserId,
      name: 'XAUUSD 1H Order Block Institutional Retest',
      description: 'Gold macro liquidity purge into high timeframe institutional demand/supply zone with 15m confirmation.',
      instruments: ['XAUUSD'],
      preferredSessions: ['New York AM', 'London PM'],
      higherTimeframeBias: 'Daily market structure bullish/bearish alignment.',
      liquidityConditions: 'Equal highs (EQH) or equal lows (EQL) engineered liquidity target.',
      marketStructureConditions: 'Clear higher high / higher low sequence.',
      chochBosRequirements: '15m body close break.',
      fairValueGapRequirements: 'Discount FVG inside 1h bullish order block.',
      orderBlockRequirements: 'Last down candle before massive multi-hour rally.',
      entryConfirmation: 'M5 shift with displacement.',
      stopLossRules: 'Below the 1h order block low.',
      takeProfitRules: 'Targeting buy-side liquidity above daily swing high.',
      riskManagementRules: '1% max risk. Scale out 50% at 2R.',
      invalidatingConditions: 'Hourly candle closes through zone.',
      active: true,
      winRateTarget: 65,
      createdAt: '2026-09-10T00:00:00Z'
    };
    this.strategies.set(strat3Id, strat3);

    // Seed 18 realistic historical trades with varied instruments, sessions, outcomes, and grades
    const seedTradesData: Partial<Trade>[] = [
      {
        id: 'tr_01',
        accountId: acc1Id,
        instrument: 'US100',
        brokerSymbol: 'US100F',
        direction: 'BUY',
        entryPrice: 20120.5,
        exitPrice: 20285.0,
        stopLoss: 20065.0,
        takeProfit: 20300.0,
        positionSize: 2.0,
        riskPercentage: 1.0,
        accountBalanceAtEntry: 102000,
        grossProfitLoss: 3290,
        commission: 12.5,
        swap: 0,
        netProfitLoss: 3277.5,
        rMultiple: 2.97,
        entryDate: '2026-10-28T14:15:00Z',
        exitDate: '2026-10-28T15:40:00Z',
        holdingDurationMinutes: 85,
        tradingSession: 'New York AM',
        strategyId: strat1Id,
        strategyName: 'ICT Silver Bullet (NY AM / London)',
        setupType: '10:00 AM NY FVG Retest + MSS',
        marketConditions: 'Trending Bullish',
        preTradeAnalysis: 'US100 swept 9:30 AM opening low, printed clean displacement candle closing above 20,110. 5m FVG formed with clear draw on liquidity at previous day high (20,290).',
        postTradeReflection: 'Executed exactly per plan. Did not move stop loss, scaled out smoothly near liquidity target.',
        emotionalState: 'Disciplined',
        strategyCompliance: true,
        ruleViolations: [],
        screenshots: [
          {
            id: 'sc_01_a',
            type: 'before',
            url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
            caption: 'Pre-execution 5m FVG displacement setup',
            timestamp: '2026-10-28T14:10:00Z'
          },
          {
            id: 'sc_01_b',
            type: 'after',
            url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80',
            caption: 'Target reached at liquidity pool (+2.97R)',
            timestamp: '2026-10-28T15:45:00Z'
          }
        ]
      },
      {
        id: 'tr_02',
        accountId: acc1Id,
        instrument: 'US30',
        brokerSymbol: 'US30F',
        direction: 'SELL',
        entryPrice: 42350,
        exitPrice: 42120,
        stopLoss: 42430,
        takeProfit: 42100,
        positionSize: 1.5,
        riskPercentage: 0.95,
        accountBalanceAtEntry: 104500,
        grossProfitLoss: 1725,
        commission: 10.0,
        swap: 0,
        netProfitLoss: 1715.0,
        rMultiple: 2.85,
        entryDate: '2026-10-27T14:35:00Z',
        exitDate: '2026-10-27T16:10:00Z',
        holdingDurationMinutes: 95,
        tradingSession: 'New York AM',
        strategyId: strat1Id,
        strategyName: 'ICT Silver Bullet (NY AM / London)',
        setupType: 'Liquidity Purge + Bearish FVG',
        marketConditions: 'Trending Bearish',
        preTradeAnalysis: 'US30 rejected Daily R1 after false breakout. Clean 5m Bearish FVG respected on retest.',
        postTradeReflection: 'Clean risk management. Held through the mid-day consolidation patiently.',
        emotionalState: 'Calm & Confident',
        strategyCompliance: true,
        ruleViolations: [],
        screenshots: []
      },
      {
        id: 'tr_03',
        accountId: acc1Id,
        instrument: 'GBPUSD',
        brokerSymbol: 'GBPUSD',
        direction: 'BUY',
        entryPrice: 1.29850,
        exitPrice: 1.29580,
        stopLoss: 1.29600,
        takeProfit: 1.30450,
        positionSize: 4.0,
        riskPercentage: 1.0,
        accountBalanceAtEntry: 106000,
        grossProfitLoss: -1080,
        commission: 14.0,
        swap: 0,
        netProfitLoss: -1094.0,
        rMultiple: -1.08,
        entryDate: '2026-10-26T07:15:00Z',
        exitDate: '2026-10-26T08:20:00Z',
        holdingDurationMinutes: 65,
        tradingSession: 'London Open',
        strategyId: strat2Id,
        strategyName: 'London Open Liquidity Expansion',
        setupType: 'Asian Low Sweep & Reversal',
        marketConditions: 'Choppy',
        preTradeAnalysis: 'Cable swept Asian low at 1.2980. Looking for continuation higher into London liquidity.',
        postTradeReflection: 'Valid setup that failed cleanly. UK PMI news arrived earlier than planned causing heavy downward momentum. Accepted stop without hesitation.',
        emotionalState: 'Disciplined',
        strategyCompliance: true,
        ruleViolations: [],
        screenshots: []
      },
      {
        id: 'tr_04',
        accountId: acc1Id,
        instrument: 'XAUUSD',
        brokerSymbol: 'GOLD',
        direction: 'BUY',
        entryPrice: 2735.40,
        exitPrice: 2758.90,
        stopLoss: 2726.00,
        takeProfit: 2760.00,
        positionSize: 1.2,
        riskPercentage: 1.05,
        accountBalanceAtEntry: 105000,
        grossProfitLoss: 2820,
        commission: 15.0,
        swap: -5.0,
        netProfitLoss: 2800.0,
        rMultiple: 2.50,
        entryDate: '2026-10-24T13:30:00Z',
        exitDate: '2026-10-24T17:45:00Z',
        holdingDurationMinutes: 255,
        tradingSession: 'New York AM',
        strategyId: strat3Id,
        strategyName: 'XAUUSD 1H Order Block Institutional Retest',
        setupType: '1H Institutional Demand Tap',
        marketConditions: 'Trending Bullish',
        preTradeAnalysis: 'Gold tapped 1H discount order block at 2735 after continuous accumulation. Clean MSS on 15m.',
        postTradeReflection: 'Exceptional runner. Partial exit at 2748 (+1.5R) and remainder ran to 2758.90.',
        emotionalState: 'Calm & Confident',
        strategyCompliance: true,
        ruleViolations: [],
        screenshots: []
      },
      {
        id: 'tr_05',
        accountId: acc1Id,
        instrument: 'GBPJPY',
        brokerSymbol: 'GBPJPY',
        direction: 'BUY',
        entryPrice: 198.250,
        exitPrice: 197.600,
        stopLoss: 197.800,
        takeProfit: 199.500,
        positionSize: 2.5,
        riskPercentage: 1.85,
        accountBalanceAtEntry: 104000,
        grossProfitLoss: -1625,
        commission: 12.0,
        swap: 0,
        netProfitLoss: -1637.0,
        rMultiple: -1.44,
        entryDate: '2026-10-22T08:10:00Z',
        exitDate: '2026-10-22T08:50:00Z',
        holdingDurationMinutes: 40,
        tradingSession: 'London Open',
        strategyId: strat2Id,
        strategyName: 'London Open Liquidity Expansion',
        setupType: 'Impulse breakout',
        marketConditions: 'Volatile News',
        preTradeAnalysis: 'Tried to catch London momentum without waiting for 15m candle close confirmation.',
        postTradeReflection: 'Mistake: Entered before structural confirmation and moved SL by 15 pips when price dipped. Need to eliminate stop loss adjustments!',
        emotionalState: 'Impatient / FOMO',
        strategyCompliance: false,
        ruleViolations: ['Moved Stop Loss after entry', 'Entered without 15m confirmation'],
        screenshots: []
      },
      {
        id: 'tr_06',
        accountId: acc2Id,
        instrument: 'US100',
        brokerSymbol: 'US100F',
        direction: 'SELL',
        entryPrice: 20380.0,
        exitPrice: 20210.0,
        stopLoss: 20435.0,
        takeProfit: 20190.0,
        positionSize: 1.0,
        riskPercentage: 1.0,
        accountBalanceAtEntry: 50500,
        grossProfitLoss: 1700,
        commission: 8.0,
        swap: 0,
        netProfitLoss: 1692.0,
        rMultiple: 3.09,
        entryDate: '2026-10-29T14:45:00Z',
        exitDate: '2026-10-29T16:20:00Z',
        holdingDurationMinutes: 95,
        tradingSession: 'New York AM',
        strategyId: strat1Id,
        strategyName: 'ICT Silver Bullet (NY AM / London)',
        setupType: 'NY Lunch Bearish Breaker',
        marketConditions: 'Trending Bearish',
        preTradeAnalysis: 'US100 reached Daily resistance, sweeping previous week high. Strong institutional selling volume on 5m.',
        postTradeReflection: 'Flawless execution. Locked in FTMO Phase 2 milestone.',
        emotionalState: 'Disciplined',
        strategyCompliance: true,
        ruleViolations: [],
        screenshots: []
      },
      {
        id: 'tr_07',
        accountId: acc2Id,
        instrument: 'XAUUSD',
        brokerSymbol: 'GOLD',
        direction: 'SELL',
        entryPrice: 2755.0,
        exitPrice: 2742.5,
        stopLoss: 2760.0,
        takeProfit: 2740.0,
        positionSize: 0.8,
        riskPercentage: 0.8,
        accountBalanceAtEntry: 51200,
        grossProfitLoss: 1000,
        commission: 10.0,
        swap: 0,
        netProfitLoss: 990.0,
        rMultiple: 2.50,
        entryDate: '2026-10-30T13:45:00Z',
        exitDate: '2026-10-30T15:10:00Z',
        holdingDurationMinutes: 85,
        tradingSession: 'New York AM',
        strategyId: strat3Id,
        strategyName: 'XAUUSD 1H Order Block Institutional Retest',
        setupType: 'Supply Block Rejection',
        marketConditions: 'Trending Bearish',
        preTradeAnalysis: 'Gold tested equal highs, failed to sustain, swept sell-side liquidity.',
        postTradeReflection: 'Textbook trade. Clean execution.',
        emotionalState: 'Calm & Confident',
        strategyCompliance: true,
        ruleViolations: [],
        screenshots: []
      },
      {
        id: 'tr_08',
        accountId: acc3Id,
        instrument: 'GBPUSD',
        brokerSymbol: 'GBPUSD',
        direction: 'SELL',
        entryPrice: 1.30200,
        exitPrice: 1.29650,
        stopLoss: 1.30400,
        takeProfit: 1.29600,
        positionSize: 2.0,
        riskPercentage: 1.4,
        accountBalanceAtEntry: 26500,
        grossProfitLoss: 1100,
        commission: 8.0,
        swap: 0,
        netProfitLoss: 1092.0,
        rMultiple: 2.75,
        entryDate: '2026-10-25T07:30:00Z',
        exitDate: '2026-10-25T11:00:00Z',
        holdingDurationMinutes: 210,
        tradingSession: 'London Open',
        strategyId: strat2Id,
        strategyName: 'London Open Liquidity Expansion',
        setupType: 'London Judas Swing Sell',
        marketConditions: 'Trending Bearish',
        preTradeAnalysis: 'London swept 1.3015 Asian high, immediate displacement lower.',
        postTradeReflection: 'Patience paid off. Held full position until London PM support.',
        emotionalState: 'Disciplined',
        strategyCompliance: true,
        ruleViolations: [],
        screenshots: []
      },
      {
        id: 'tr_09',
        accountId: acc1Id,
        instrument: 'GBPJPY',
        brokerSymbol: 'GBPJPY',
        direction: 'BUY',
        entryPrice: 196.800,
        exitPrice: 197.850,
        stopLoss: 196.400,
        takeProfit: 198.000,
        positionSize: 1.8,
        riskPercentage: 0.9,
        accountBalanceAtEntry: 104000,
        grossProfitLoss: 1890,
        commission: 12.0,
        swap: 0,
        netProfitLoss: 1878.0,
        rMultiple: 2.62,
        entryDate: '2026-10-21T07:15:00Z',
        exitDate: '2026-10-21T09:40:00Z',
        holdingDurationMinutes: 145,
        tradingSession: 'London Open',
        strategyId: strat2Id,
        strategyName: 'London Open Liquidity Expansion',
        setupType: 'Demand Sweep & MSS',
        marketConditions: 'Trending Bullish',
        preTradeAnalysis: 'Asian low tapped into 4h order block. Clear bullish divergence on 15m.',
        postTradeReflection: 'Followed discipline rules. Great risk-reward.',
        emotionalState: 'Calm & Confident',
        strategyCompliance: true,
        ruleViolations: [],
        screenshots: []
      },
      {
        id: 'tr_10',
        accountId: acc1Id,
        instrument: 'US30',
        brokerSymbol: 'US30F',
        direction: 'BUY',
        entryPrice: 42100,
        exitPrice: 42020,
        stopLoss: 42020,
        takeProfit: 42350,
        positionSize: 1.2,
        riskPercentage: 0.92,
        accountBalanceAtEntry: 105500,
        grossProfitLoss: -480,
        commission: 8.0,
        swap: 0,
        netProfitLoss: -488.0,
        rMultiple: -1.0,
        entryDate: '2026-10-18T14:30:00Z',
        exitDate: '2026-10-18T15:05:00Z',
        holdingDurationMinutes: 35,
        tradingSession: 'New York AM',
        strategyId: strat1Id,
        strategyName: 'ICT Silver Bullet (NY AM / London)',
        setupType: 'NY Open Expansion',
        marketConditions: 'Choppy',
        preTradeAnalysis: 'Attempted to long US30 support line.',
        postTradeReflection: 'Stop hit precisely as planned. Clean -1R loss. No tilt.',
        emotionalState: 'Disciplined',
        strategyCompliance: true,
        ruleViolations: [],
        screenshots: []
      }
    ];

    // Grade and insert each trade
    seedTradesData.forEach(tradeData => {
      const fullTrade: Trade = {
        id: tradeData.id!,
        userId: demoUserId,
        accountId: tradeData.accountId!,
        instrument: tradeData.instrument as CanonicalInstrument,
        brokerSymbol: tradeData.brokerSymbol,
        direction: tradeData.direction!,
        entryPrice: tradeData.entryPrice!,
        exitPrice: tradeData.exitPrice!,
        stopLoss: tradeData.stopLoss!,
        takeProfit: tradeData.takeProfit,
        positionSize: tradeData.positionSize!,
        riskPercentage: tradeData.riskPercentage!,
        accountBalanceAtEntry: tradeData.accountBalanceAtEntry!,
        grossProfitLoss: tradeData.grossProfitLoss!,
        commission: tradeData.commission!,
        swap: tradeData.swap!,
        netProfitLoss: tradeData.netProfitLoss!,
        rMultiple: tradeData.rMultiple!,
        entryDate: tradeData.entryDate!,
        exitDate: tradeData.exitDate!,
        holdingDurationMinutes: tradeData.holdingDurationMinutes!,
        tradingSession: tradeData.tradingSession!,
        strategyId: tradeData.strategyId,
        strategyName: tradeData.strategyName,
        setupType: tradeData.setupType!,
        marketConditions: tradeData.marketConditions!,
        preTradeAnalysis: tradeData.preTradeAnalysis!,
        postTradeReflection: tradeData.postTradeReflection!,
        emotionalState: tradeData.emotionalState!,
        strategyCompliance: tradeData.strategyCompliance!,
        ruleViolations: tradeData.ruleViolations || [],
        screenshots: tradeData.screenshots || [],
        grade: calculateTradeGrade(tradeData, this.strategies.get(tradeData.strategyId || '')),
        createdAt: tradeData.entryDate!,
        updatedAt: tradeData.exitDate!
      };
      this.trades.set(fullTrade.id, fullTrade);
    });

    // Seed Consistency
    const consistency: ConsistencyMetrics = {
      userId: demoUserId,
      period: 'Last 30 Days',
      profitabilityScore: 88,
      disciplineScore: 92,
      dailyRiskAveragePercent: 1.05,
      maxDailyLossAmount: 1637,
      maxDailyLossLimit: 2500,
      maxTradesPerDayLimit: 3,
      actualAvgTradesPerDay: 1.4,
      ruleViolationCount: 2,
      revengeTradingReports: 0,
      overtradingDaysCount: 1,
      earlyExitCount: 1,
      consecutiveLosingDays: 1,
      personalRules: [
        { id: 'rule_1', ruleText: 'Maximum two trade positions per day.', category: 'discipline', enabled: true, maxDailyViolationAllowance: 0 },
        { id: 'rule_2', ruleText: 'No trade without the complete strategy setup.', category: 'execution', enabled: true, maxDailyViolationAllowance: 0 },
        { id: 'rule_3', ruleText: 'Never chase price after missing an entry.', category: 'psychology', enabled: true, maxDailyViolationAllowance: 0 },
        { id: 'rule_4', ruleText: 'Never enter before the planned FVG or CHoCH-zone retest (NO RETEST = NO TRADE).', category: 'execution', enabled: true, maxDailyViolationAllowance: 0 },
        { id: 'rule_5', ruleText: 'Avoid emotional and revenge trading.', category: 'psychology', enabled: true, maxDailyViolationAllowance: 0 },
        { id: 'rule_6', ruleText: 'Do not move a stop loss farther away simply to avoid a loss.', category: 'risk', enabled: true, maxDailyViolationAllowance: 0 },
        { id: 'rule_7', ruleText: 'Do not close trades prematurely because of fear alone.', category: 'psychology', enabled: true, maxDailyViolationAllowance: 0 },
        { id: 'rule_8', ruleText: 'Always establish risk and invalidation before entry.', category: 'risk', enabled: true, maxDailyViolationAllowance: 0 },
        { id: 'rule_9', ruleText: 'Respect configured daily and account drawdown limits.', category: 'risk', enabled: true, maxDailyViolationAllowance: 0 },
        { id: 'rule_10', ruleText: 'Stop trading when personal trading limits are reached.', category: 'discipline', enabled: true, maxDailyViolationAllowance: 0 }
      ],
      recentViolations: [
        {
          id: 'viol_1',
          date: '2026-10-22',
          tradeId: 'tr_05',
          violationType: 'Moved Stop Loss after entry',
          severity: 'high',
          details: 'Moved SL lower during live GBPJPY drawdown, widening loss by 0.44R.'
        },
        {
          id: 'viol_2',
          date: '2026-10-22',
          tradeId: 'tr_05',
          violationType: 'Entered without 15m structural confirmation',
          severity: 'medium',
          details: 'Chased candle before candle body close.'
        }
      ]
    };
    this.consistencyRules.set(demoUserId, consistency);
  }

  // Multi-tenant Query Helpers
  public getUserTrades(userId: string, accountId?: string): Trade[] {
    const list: Trade[] = [];
    for (const trade of this.trades.values()) {
      if (trade.userId === userId) {
        if (!accountId || trade.accountId === accountId) {
          list.push(trade);
        }
      }
    }
    return list.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }

  public getUserAccounts(userId: string): TradingAccount[] {
    const list: TradingAccount[] = [];
    for (const acc of this.accounts.values()) {
      if (acc.userId === userId) {
        list.push(acc);
      }
    }
    return list;
  }

  public getUserStrategies(userId: string): TradingStrategy[] {
    const list: TradingStrategy[] = [];
    for (const strat of this.strategies.values()) {
      if (strat.userId === userId) {
        list.push(strat);
      }
    }
    return list;
  }
}

export const db = new DatabaseStore();

// Rigorous Quantitative Analytics Engine
export function computeAnalytics(trades: Trade[]) {
  const eligible = trades.filter(t => t.exitPrice !== undefined && t.exitPrice !== 0);
  const totalTrades = eligible.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      netPnL: 0,
      profitFactor: 0,
      expectancy: 0,
      expectancyR: 0,
      averageR: 0,
      averageWinner: 0,
      averageLoser: 0,
      largestWinner: 0,
      largestLoser: 0,
      maxDrawdownAmount: 0,
      maxDrawdownPercent: 0,
      winningStreak: 0,
      losingStreak: 0,
      currentStreak: 0,
      avgHoldingDurationMinutes: 0,
      longVsShort: { longTrades: 0, shortTrades: 0, longWinRate: 0, shortWinRate: 0 },
      byInstrument: {} as Record<string, any>,
      bySession: {} as Record<string, any>,
      byWeekday: {} as Record<string, any>,
      byStrategy: {} as Record<string, any>,
      equityCurve: [] as { date: string; balance: number; netPnL: number; rMultiple: number }[]
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let netPnL = 0;
  let totalR = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let largestWinner = 0;
  let largestLoser = 0;
  let totalDurationMinutes = 0;

  let longTrades = 0;
  let longWins = 0;
  let shortTrades = 0;
  let shortWins = 0;

  const byInstrument: Record<string, { trades: number; wins: number; pnl: number; rMultiple: number }> = {};
  const bySession: Record<string, { trades: number; wins: number; pnl: number }> = {};
  const byWeekday: Record<string, { trades: number; wins: number; pnl: number }> = {};
  const byStrategy: Record<string, { trades: number; wins: number; pnl: number }> = {};

  // Sort chronologically for equity curve & streaks
  const chronological = [...eligible].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  let runningPnL = 0;
  let peakPnL = 0;
  let maxDrawdownAmount = 0;

  const equityCurve: { date: string; balance: number; netPnL: number; rMultiple: number }[] = [];

  chronological.forEach((t) => {
    const pnl = t.netProfitLoss;
    runningPnL += pnl;
    if (runningPnL > peakPnL) {
      peakPnL = runningPnL;
    }
    const currentDrawdown = peakPnL - runningPnL;
    if (currentDrawdown > maxDrawdownAmount) {
      maxDrawdownAmount = currentDrawdown;
    }

    equityCurve.push({
      date: t.exitDate.split('T')[0],
      balance: t.accountBalanceAtEntry + runningPnL,
      netPnL: runningPnL,
      rMultiple: t.rMultiple
    });

    netPnL += pnl;
    totalR += t.rMultiple;
    totalDurationMinutes += t.holdingDurationMinutes || 0;

    if (pnl > 0) {
      grossProfit += pnl;
      winningTrades++;
      if (pnl > largestWinner) largestWinner = pnl;

      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (pnl < 0) {
      const absLoss = Math.abs(pnl);
      grossLoss += absLoss;
      losingTrades++;
      if (absLoss > largestLoser) largestLoser = absLoss;

      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    } else {
      breakevenTrades++;
      currentWinStreak = 0;
      currentLossStreak = 0;
    }

    // Long vs Short
    if (t.direction === 'BUY') {
      longTrades++;
      if (pnl > 0) longWins++;
    } else {
      shortTrades++;
      if (pnl > 0) shortWins++;
    }

    // By Instrument
    if (!byInstrument[t.instrument]) {
      byInstrument[t.instrument] = { trades: 0, wins: 0, pnl: 0, rMultiple: 0 };
    }
    byInstrument[t.instrument].trades++;
    if (pnl > 0) byInstrument[t.instrument].wins++;
    byInstrument[t.instrument].pnl += pnl;
    byInstrument[t.instrument].rMultiple += t.rMultiple;

    // By Session
    if (!bySession[t.tradingSession]) {
      bySession[t.tradingSession] = { trades: 0, wins: 0, pnl: 0 };
    }
    bySession[t.tradingSession].trades++;
    if (pnl > 0) bySession[t.tradingSession].wins++;
    bySession[t.tradingSession].pnl += pnl;

    // By Weekday
    const day = new Date(t.entryDate).toLocaleDateString('en-US', { weekday: 'short' });
    if (!byWeekday[day]) {
      byWeekday[day] = { trades: 0, wins: 0, pnl: 0 };
    }
    byWeekday[day].trades++;
    if (pnl > 0) byWeekday[day].wins++;
    byWeekday[day].pnl += pnl;

    // By Strategy
    const stratKey = t.strategyName || 'Discretionary';
    if (!byStrategy[stratKey]) {
      byStrategy[stratKey] = { trades: 0, wins: 0, pnl: 0 };
    }
    byStrategy[stratKey].trades++;
    if (pnl > 0) byStrategy[stratKey].wins++;
    byStrategy[stratKey].pnl += pnl;
  });

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
  const expectancy = totalTrades > 0 ? netPnL / totalTrades : 0;
  const expectancyR = totalTrades > 0 ? totalR / totalTrades : 0;
  const averageR = totalTrades > 0 ? totalR / totalTrades : 0;
  const averageWinner = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const averageLoser = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const avgHoldingDurationMinutes = totalTrades > 0 ? Math.round(totalDurationMinutes / totalTrades) : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate: Number(winRate.toFixed(1)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    netPnL: Number(netPnL.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    expectancyR: Number(expectancyR.toFixed(2)),
    averageR: Number(averageR.toFixed(2)),
    averageWinner: Number(averageWinner.toFixed(2)),
    averageLoser: Number(averageLoser.toFixed(2)),
    largestWinner: Number(largestWinner.toFixed(2)),
    largestLoser: Number(largestLoser.toFixed(2)),
    maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
    winningStreak: maxWinStreak,
    losingStreak: maxLossStreak,
    avgHoldingDurationMinutes,
    longVsShort: {
      longTrades,
      shortTrades,
      longWinRate: longTrades > 0 ? Number(((longWins / longTrades) * 100).toFixed(1)) : 0,
      shortWinRate: shortTrades > 0 ? Number(((shortWins / shortTrades) * 100).toFixed(1)) : 0
    },
    byInstrument,
    bySession,
    byWeekday,
    byStrategy,
    equityCurve
  };
}
