import {
  RuleDefinition,
  RuleMatch,
  TransactionData,
  TransactionType,
} from '../types';

const STORAGE_KEY = 'securepay.rules.v1';

export const defaultRules: RuleDefinition[] = [
  {
    id: 'rule-cashout-large',
    name: 'Large Cash-Out Burst',
    enabled: true,
    severity: 'critical',
    action: 'boost_score',
    boost: 0.12,
    minAmount: 10000,
    transactionType: TransactionType.CASH_OUT,
    country: 'ANY',
  },
  {
    id: 'rule-transfer-highrisk-country',
    name: 'High-Risk Corridor Transfer',
    enabled: true,
    severity: 'high',
    action: 'boost_score',
    boost: 0.1,
    minAmount: 3000,
    transactionType: TransactionType.TRANSFER,
    country: 'IN',
  },
  {
    id: 'rule-origin-drain',
    name: 'Origin Balance Fully Drained',
    enabled: true,
    severity: 'high',
    action: 'force_review',
    minVelocity: 0.92,
    transactionType: 'ANY',
    country: 'ANY',
  },
  {
    id: 'rule-money-mule-pattern',
    name: 'Likely Mule Funnel Pattern',
    enabled: true,
    severity: 'critical',
    action: 'force_fraud',
    minAmount: 25000,
    transactionType: TransactionType.TRANSFER,
    country: 'ANY',
  },
];

type RuleEvaluationResult = {
  scoreBoost: number;
  forcedPrediction?: 'Fraud' | 'Not Fraud';
  reviewRequired: boolean;
  matches: RuleMatch[];
};

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getRules = (): RuleDefinition[] => {
  if (!canUseStorage()) {
    return defaultRules;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultRules;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultRules;
    }

    const valid = parsed.filter(
      (rule): rule is RuleDefinition =>
        rule &&
        typeof rule.id === 'string' &&
        typeof rule.name === 'string' &&
        typeof rule.enabled === 'boolean' &&
        typeof rule.severity === 'string' &&
        typeof rule.action === 'string',
    );

    return valid.length > 0 ? valid : defaultRules;
  } catch {
    return defaultRules;
  }
};

export const saveRules = (rules: RuleDefinition[]): void => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // Ignore local storage failures in demo mode.
  }
};

const velocityRatio = (data: TransactionData): number => {
  const originDelta = data.oldbalanceOrg - data.newbalanceOrig;
  if (data.oldbalanceOrg <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, originDelta / data.oldbalanceOrg));
};

const ruleMatches = (rule: RuleDefinition, data: TransactionData, country?: string): boolean => {
  if (!rule.enabled) {
    return false;
  }

  if (typeof rule.minAmount === 'number' && data.amount < rule.minAmount) {
    return false;
  }

  if (
    rule.transactionType &&
    rule.transactionType !== 'ANY' &&
    rule.transactionType !== data.type
  ) {
    return false;
  }

  if (rule.country && rule.country !== 'ANY') {
    if (!country || country !== rule.country) {
      return false;
    }
  }

  if (typeof rule.minVelocity === 'number') {
    if (velocityRatio(data) < rule.minVelocity) {
      return false;
    }
  }

  return true;
};

const severityBoost = (severity: RuleDefinition['severity']): number => {
  switch (severity) {
    case 'critical':
      return 0.12;
    case 'high':
      return 0.08;
    case 'medium':
      return 0.05;
    default:
      return 0.03;
  }
};

export const evaluateRules = (
  data: TransactionData,
  rules: RuleDefinition[],
  country?: string,
): RuleEvaluationResult => {
  let scoreBoost = 0;
  let forcedPrediction: 'Fraud' | 'Not Fraud' | undefined;
  let reviewRequired = false;
  const matches: RuleMatch[] = [];

  rules.forEach((rule) => {
    if (!ruleMatches(rule, data, country)) {
      return;
    }

    const boostApplied =
      rule.action === 'boost_score'
        ? typeof rule.boost === 'number'
          ? rule.boost
          : severityBoost(rule.severity)
        : 0;

    if (rule.action === 'boost_score') {
      scoreBoost += boostApplied;
    } else if (rule.action === 'force_fraud') {
      forcedPrediction = 'Fraud';
    } else if (rule.action === 'force_review') {
      reviewRequired = true;
    }

    const reasonBits: string[] = [];
    if (rule.minAmount) {
      reasonBits.push(`amount >= ${rule.minAmount}`);
    }
    if (rule.transactionType && rule.transactionType !== 'ANY') {
      reasonBits.push(`type = ${rule.transactionType}`);
    }
    if (rule.country && rule.country !== 'ANY') {
      reasonBits.push(`country = ${rule.country}`);
    }
    if (rule.minVelocity) {
      reasonBits.push(`velocity >= ${Math.round(rule.minVelocity * 100)}%`);
    }

    matches.push({
      ruleId: rule.id,
      ruleName: rule.name,
      action: rule.action,
      boostApplied,
      reason: reasonBits.length > 0 ? reasonBits.join(', ') : 'Custom condition matched',
    });
  });

  return {
    scoreBoost,
    forcedPrediction,
    reviewRequired,
    matches,
  };
};
