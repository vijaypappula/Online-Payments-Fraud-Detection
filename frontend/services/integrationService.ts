import {
  AlertIntegrationTarget,
  PredictionResult,
  TransactionData,
} from '../types';

const STORAGE_KEY = 'securepay.integrations.v1';

export type IntegrationDispatchResult = {
  targetId: string;
  targetName: string;
  ok: boolean;
  message: string;
  sentAt: string;
};

export const defaultIntegrations: AlertIntegrationTarget[] = [
  {
    id: 'int-slack-soc',
    name: 'SOC Slack Channel',
    type: 'slack',
    endpoint: 'https://hooks.slack.com/services/demo/example',
    enabled: false,
  },
  {
    id: 'int-teams-fraud',
    name: 'Fraud Ops Teams',
    type: 'teams',
    endpoint: 'https://outlook.office.com/webhook/demo/example',
    enabled: false,
  },
];

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getIntegrationTargets = (): AlertIntegrationTarget[] => {
  if (!canUseStorage()) {
    return defaultIntegrations;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultIntegrations;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultIntegrations;
    }

    const valid = parsed.filter(
      (item): item is AlertIntegrationTarget =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.type === 'string' &&
        typeof item.endpoint === 'string' &&
        typeof item.enabled === 'boolean',
    );

    return valid.length > 0 ? valid : defaultIntegrations;
  } catch {
    return defaultIntegrations;
  }
};

export const saveIntegrationTargets = (targets: AlertIntegrationTarget[]): void => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
  } catch {
    // Ignore local storage write failures in demo mode.
  }
};

const validateTarget = (target: AlertIntegrationTarget): string | null => {
  if (!target.endpoint.trim()) {
    return 'Endpoint URL is empty.';
  }
  if (!/^https?:\/\//i.test(target.endpoint.trim())) {
    return 'Endpoint must start with http:// or https://';
  }
  return null;
};

const simulateDispatch = async (
  target: AlertIntegrationTarget,
  _payload: Record<string, unknown>,
): Promise<IntegrationDispatchResult> => {
  await delay(200);
  const validationError = validateTarget(target);

  if (validationError) {
    return {
      targetId: target.id,
      targetName: target.name,
      ok: false,
      message: validationError,
      sentAt: new Date().toISOString(),
    };
  }

  // Mock delivery with deterministic success by endpoint length to keep it predictable.
  const success = target.endpoint.length % 5 !== 0;

  return {
    targetId: target.id,
    targetName: target.name,
    ok: success,
    message: success ? 'Alert payload accepted by integration endpoint.' : 'Endpoint rejected payload (simulated 4xx).',
    sentAt: new Date().toISOString(),
  };
};

export const sendTestAlert = async (
  target: AlertIntegrationTarget,
): Promise<IntegrationDispatchResult> => {
  return simulateDispatch(target, {
    event: 'integration.test',
    message: 'SecurePay test alert',
    timestamp: new Date().toISOString(),
  });
};

export const dispatchHighRiskAlert = async (
  data: TransactionData,
  result: PredictionResult,
  targets: AlertIntegrationTarget[],
): Promise<IntegrationDispatchResult[]> => {
  const enabled = targets.filter((target) => target.enabled);
  if (enabled.length === 0) {
    return [];
  }

  const payload = {
    event: 'fraud.high_risk_detected',
    transactionId: data.id,
    country: data.country || 'UNKNOWN',
    amount: data.amount,
    type: data.type,
    risk: Math.round(result.probability * 100),
    prediction: result.prediction,
    timestamp: new Date().toISOString(),
  };

  const tasks = enabled.map((target) => simulateDispatch(target, payload));
  return Promise.all(tasks);
};
