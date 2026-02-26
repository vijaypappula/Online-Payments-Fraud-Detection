import {
  AnalystFeedbackItem,
  AnalystFeedbackLabel,
  HistoryItem,
  TransactionType,
} from '../types';

const STORAGE_KEY = 'securepay.feedback.v1';

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readFeedback = (): AnalystFeedbackItem[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is AnalystFeedbackItem =>
        item &&
        typeof item.id === 'string' &&
        typeof item.transactionId === 'string' &&
        typeof item.label === 'string' &&
        typeof item.prediction === 'string' &&
        typeof item.probability === 'number' &&
        typeof item.timestamp === 'string' &&
        typeof item.analyst === 'string',
    );
  } catch {
    return [];
  }
};

const writeFeedback = (items: AnalystFeedbackItem[]): void => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota and storage access errors in demo mode.
  }
};

export const getFeedbackItems = (): AnalystFeedbackItem[] => readFeedback();

export const getFeedbackByTransactionId = (
  transactionId: string,
): AnalystFeedbackItem | undefined =>
  readFeedback().find((item) => item.transactionId === transactionId);

export const upsertFeedback = (
  input: Omit<AnalystFeedbackItem, 'id' | 'timestamp'> & { timestamp?: string },
): AnalystFeedbackItem => {
  const existing = readFeedback();
  const current = existing.find((item) => item.transactionId === input.transactionId);

  const next: AnalystFeedbackItem = {
    id: current?.id || `FDB-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    transactionId: input.transactionId,
    label: input.label,
    prediction: input.prediction,
    probability: input.probability,
    analyst: input.analyst,
    timestamp: input.timestamp || new Date().toISOString(),
  };

  const updated = current
    ? existing.map((item) => (item.transactionId === input.transactionId ? next : item))
    : [next, ...existing];

  writeFeedback(updated);
  return next;
};

export type ModelMonitoringSnapshot = {
  totalPredictions: number;
  labeledCount: number;
  labelCoverage: number;
  confirmedFraud: number;
  falsePositive: number;
  needsReview: number;
  precisionEstimate: number;
  falsePositiveRate: number;
  averageRisk: number;
  driftScore: number;
  byType: Array<{
    type: TransactionType;
    total: number;
    labeled: number;
    confirmedFraud: number;
    falsePositive: number;
  }>;
};

const toPercent = (value: number): number => Math.round(value * 1000) / 10;

export const buildModelMonitoringSnapshot = (
  history: HistoryItem[],
  feedback: AnalystFeedbackItem[],
): ModelMonitoringSnapshot => {
  const totalPredictions = history.length;
  const labeledCount = feedback.length;
  const labelCoverage = totalPredictions > 0 ? labeledCount / totalPredictions : 0;

  const confirmedFraud = feedback.filter((f) => f.label === 'confirmed_fraud').length;
  const falsePositive = feedback.filter((f) => f.label === 'false_positive').length;
  const needsReview = feedback.filter((f) => f.label === 'needs_review').length;

  const predictedFraud = history.filter((h) => h.result.prediction === 'Fraud').length;
  const precisionEstimate = predictedFraud > 0 ? confirmedFraud / predictedFraud : 0;
  const falsePositiveRate = predictedFraud > 0 ? falsePositive / predictedFraud : 0;

  const averageRisk =
    totalPredictions > 0
      ? history.reduce((acc, item) => acc + item.result.probability, 0) / totalPredictions
      : 0;

  const recent = history.slice(0, 15);
  const baseline = history.slice(15, 45);
  const recentAvg =
    recent.length > 0
      ? recent.reduce((acc, item) => acc + item.result.probability, 0) / recent.length
      : averageRisk;
  const baselineAvg =
    baseline.length > 0
      ? baseline.reduce((acc, item) => acc + item.result.probability, 0) / baseline.length
      : averageRisk;
  const driftScore = Math.abs(recentAvg - baselineAvg);

  const byType = Object.values(TransactionType).map((type) => {
    const txForType = history.filter((item) => item.data.type === type);
    const txIds = new Set(txForType.map((item) => item.data.id));
    const labelsForType = feedback.filter((item) => txIds.has(item.transactionId));

    return {
      type,
      total: txForType.length,
      labeled: labelsForType.length,
      confirmedFraud: labelsForType.filter((item) => item.label === 'confirmed_fraud').length,
      falsePositive: labelsForType.filter((item) => item.label === 'false_positive').length,
    };
  });

  return {
    totalPredictions,
    labeledCount,
    labelCoverage: toPercent(labelCoverage),
    confirmedFraud,
    falsePositive,
    needsReview,
    precisionEstimate: toPercent(precisionEstimate),
    falsePositiveRate: toPercent(falsePositiveRate),
    averageRisk: toPercent(averageRisk),
    driftScore: toPercent(driftScore),
    byType,
  };
};

export const feedbackLabelText: Record<AnalystFeedbackLabel, string> = {
  confirmed_fraud: 'Confirmed Fraud',
  false_positive: 'False Positive',
  needs_review: 'Needs Review',
};
