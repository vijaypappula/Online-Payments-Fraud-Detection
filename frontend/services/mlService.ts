import {
  PredictionResult,
  ReasonCode,
  RuleDefinition,
  TransactionData,
  TransactionType,
} from '../types';
import { evaluateRules } from './ruleService';

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const riskByType: Record<TransactionType, number> = {
  [TransactionType.CASH_OUT]: 0.88,
  [TransactionType.TRANSFER]: 0.8,
  [TransactionType.PAYMENT]: 0.55,
  [TransactionType.DEBIT]: 0.5,
  [TransactionType.CASH_IN]: 0.28,
};

type PredictFraudOptions = {
  threshold?: number;
  country?: string;
  rules?: RuleDefinition[];
  simulateLatency?: boolean;
};

export async function predictFraud(
  data: TransactionData,
  options: PredictFraudOptions = {},
): Promise<PredictionResult> {
  if (options.simulateLatency !== false) {
    await delay(650);
  }

  const threshold = options.threshold ?? 0.65;

  const amountScore = clamp01(data.amount / 20000);
  const behaviorScore = riskByType[data.type];

  const originDelta = data.oldbalanceOrg - data.newbalanceOrig;
  const expectedOriginDelta =
    data.type === TransactionType.CASH_IN ? -data.amount : data.amount;
  const originMismatch = clamp01(
    Math.abs(originDelta - expectedOriginDelta) / Math.max(data.amount, 1),
  );

  const destinationDelta = data.newbalanceDest - data.oldbalanceDest;
  const expectedDestinationDelta =
    data.type === TransactionType.CASH_IN ? data.amount : data.amount;
  const destinationMismatch = clamp01(
    Math.abs(destinationDelta - expectedDestinationDelta) / Math.max(data.amount, 1),
  );

  const anomalyScore = clamp01((originMismatch + destinationMismatch + amountScore) / 3);

  const drainRatio =
    data.oldbalanceOrg > 0 ? clamp01(originDelta / data.oldbalanceOrg) : 0;
  const destinationGrowth =
    data.oldbalanceDest > 0
      ? clamp01(destinationDelta / Math.max(data.oldbalanceDest, 1))
      : clamp01(destinationDelta / Math.max(data.amount, 1));
  const velocityScore = clamp01((drainRatio + destinationGrowth + amountScore) / 3);

  let probability =
    velocityScore * 0.35 + anomalyScore * 0.4 + behaviorScore * 0.25;

  if (data.amount >= 10000 && (data.type === TransactionType.CASH_OUT || data.type === TransactionType.TRANSFER)) {
    probability += 0.08;
  }
  if (drainRatio >= 0.9 && data.type !== TransactionType.CASH_IN) {
    probability += 0.06;
  }
  if (originMismatch > 0.7 || destinationMismatch > 0.7) {
    probability += 0.06;
  }

  const evaluatedRules = evaluateRules(data, options.rules || [], options.country || data.country);
  probability += evaluatedRules.scoreBoost;
  probability = clamp01(probability);

  let prediction: PredictionResult['prediction'] =
    probability >= threshold ? 'Fraud' : 'Not Fraud';
  let decisionSource: PredictionResult['decisionSource'] =
    threshold !== 0.65 ? 'adaptive-threshold' : 'model';

  if (evaluatedRules.reviewRequired && probability >= Math.max(0.45, threshold - 0.08)) {
    prediction = 'Fraud';
    decisionSource = 'rule';
  }

  if (evaluatedRules.forcedPrediction) {
    prediction = evaluatedRules.forcedPrediction;
    decisionSource = 'rule';
  }

  const reasoningParts: string[] = [];
  if (amountScore > 0.7) {
    reasoningParts.push('high-value amount');
  }
  if (originMismatch > 0.55 || destinationMismatch > 0.55) {
    reasoningParts.push('balance movement mismatch');
  }
  if (behaviorScore > 0.75) {
    reasoningParts.push('transaction type with elevated historical risk');
  }
  if (drainRatio > 0.85) {
    reasoningParts.push('rapid depletion of origin account');
  }

  const reasoning =
    reasoningParts.length > 0
      ? `Risk elevated due to ${reasoningParts.join(', ')}.`
      : 'No major anomaly pattern detected in amount, balance movement, or transaction type.';

  const metricReasons: ReasonCode[] = [
    {
      code: 'velocity',
      title: 'Velocity Shift',
      score: velocityScore,
      detail: 'Rapid fund movement relative to account baselines.',
    },
    {
      code: 'anomaly',
      title: 'Balance Anomaly',
      score: anomalyScore,
      detail: 'Observed balance changes diverge from expected transaction mechanics.',
    },
    {
      code: 'behavior',
      title: 'Behavioral Pattern',
      score: behaviorScore,
      detail: `Historical risk profile for ${data.type} transactions.`,
    },
    {
      code: 'amount',
      title: 'Amount Stress',
      score: amountScore,
      detail: 'Transaction size compared to fraud-prone value ranges.',
    },
  ];

  const ruleReasons: ReasonCode[] = evaluatedRules.matches.map((match) => ({
    code: `rule_${match.ruleId}`,
    title: `Rule Matched: ${match.ruleName}`,
    score: match.action === 'boost_score' ? Math.min(1, 0.6 + match.boostApplied) : 0.95,
    detail: match.reason,
  }));

  const reasonCodes = [...metricReasons, ...ruleReasons]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    prediction,
    probability,
    reasoning,
    thresholdUsed: threshold,
    decisionSource,
    reasonCodes,
    matchedRules: evaluatedRules.matches,
    riskMetrics: {
      velocity: velocityScore,
      anomaly: anomalyScore,
      behavioral: behaviorScore,
    },
    sources: [
      {
        title: 'FATF Guidance on Financial Transaction Monitoring',
        uri: 'https://www.fatf-gafi.org/en/publications/Methodsandtrends/money-laundering-terrorist-financing-risk-indicators.html',
      },
      {
        title: 'Federal Reserve: Payments Fraud Insights',
        uri: 'https://www.federalreserve.gov/paymentsystems/payments-fraud.htm',
      },
    ],
  };
}

