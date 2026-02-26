import { AdaptiveThresholdConfig, TransactionData, TransactionType } from '../types';

const STORAGE_KEY = 'securepay.threshold.config.v1';

export const defaultAdaptiveThresholdConfig: AdaptiveThresholdConfig = {
  defaultThreshold: 0.7,
  byType: {
    [TransactionType.CASH_OUT]: 0.6,
    [TransactionType.TRANSFER]: 0.62,
    [TransactionType.PAYMENT]: 0.72,
    [TransactionType.CASH_IN]: 0.78,
    [TransactionType.DEBIT]: 0.74,
  },
  byCountry: {
    US: 0.7,
    IN: 0.68,
    GB: 0.71,
    EU: 0.72,
  },
  nightShiftDelta: -0.05,
  weekendDelta: -0.03,
};

const clampThreshold = (value: number): number => Math.max(0.35, Math.min(0.95, value));

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getAdaptiveThresholdConfig = (): AdaptiveThresholdConfig => {
  if (!canUseStorage()) {
    return defaultAdaptiveThresholdConfig;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultAdaptiveThresholdConfig;
    }

    const parsed = JSON.parse(raw) as Partial<AdaptiveThresholdConfig>;
    return {
      defaultThreshold:
        typeof parsed.defaultThreshold === 'number'
          ? clampThreshold(parsed.defaultThreshold)
          : defaultAdaptiveThresholdConfig.defaultThreshold,
      byType: {
        ...defaultAdaptiveThresholdConfig.byType,
        ...(parsed.byType || {}),
      },
      byCountry: {
        ...defaultAdaptiveThresholdConfig.byCountry,
        ...(parsed.byCountry || {}),
      },
      nightShiftDelta:
        typeof parsed.nightShiftDelta === 'number'
          ? parsed.nightShiftDelta
          : defaultAdaptiveThresholdConfig.nightShiftDelta,
      weekendDelta:
        typeof parsed.weekendDelta === 'number'
          ? parsed.weekendDelta
          : defaultAdaptiveThresholdConfig.weekendDelta,
    };
  } catch {
    return defaultAdaptiveThresholdConfig;
  }
};

export const saveAdaptiveThresholdConfig = (config: AdaptiveThresholdConfig): void => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore local storage failures in demo mode.
  }
};

export const getThresholdForTransaction = (
  data: TransactionData,
  config: AdaptiveThresholdConfig,
  country?: string,
  now = new Date(),
): { threshold: number; notes: string[] } => {
  const notes: string[] = [];
  let threshold = config.defaultThreshold;

  const typeThreshold = config.byType[data.type];
  if (typeof typeThreshold === 'number') {
    threshold = typeThreshold;
    notes.push(`Type baseline: ${Math.round(typeThreshold * 100)}%`);
  }

  if (country && typeof config.byCountry[country] === 'number') {
    threshold = (threshold + config.byCountry[country]) / 2;
    notes.push(`Country adjustment: ${country}`);
  }

  const hour = now.getHours();
  if (hour < 6 || hour >= 22) {
    threshold += config.nightShiftDelta;
    notes.push('Night shift profile');
  }

  const day = now.getDay();
  if (day === 0 || day === 6) {
    threshold += config.weekendDelta;
    notes.push('Weekend profile');
  }

  threshold = clampThreshold(threshold);
  return { threshold, notes };
};
