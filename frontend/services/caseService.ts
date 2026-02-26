import { Case, CaseData } from '../types';

const STORAGE_KEY = 'securepay.cases.v1';

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
};

const readCases = (): Case[] => {
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
      (c): c is Case =>
        c &&
        typeof c.id === 'string' &&
        typeof c.status === 'string' &&
        typeof c.created_at === 'string' &&
        typeof c.summary === 'string' &&
        (typeof c.description === 'string' || c.description === null),
    );
  } catch {
    return [];
  }
};

const writeCases = (cases: Case[]): void => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch {
    // Ignore storage quota and access errors in local mock mode.
  }
};

const seedCases = (): Case[] => {
  const now = Date.now();

  return [
    {
      id: generateId(),
      status: 'Open',
      created_at: new Date(now - 1000 * 60 * 25).toISOString(),
      summary: 'Multiple cash-out attempts from newly added device',
      description:
        'Rapid sequence of transactions with inconsistent origin balances.',
    },
    {
      id: generateId(),
      status: 'Under Review',
      created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      summary: 'Cross-border transfer spike linked to high-risk corridor',
      description:
        'Destination pattern diverges from account baseline and normal spend profile.',
    },
    {
      id: generateId(),
      status: 'Escalated',
      created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      summary: 'Possible mule activity detected in destination account',
      description:
        'Incoming transaction behavior resembles known structuring indicators.',
    },
  ];
};

export async function getCases(): Promise<Case[]> {
  await delay(250);

  const existing = readCases();
  if (existing.length > 0) {
    return existing;
  }

  const seeded = seedCases();
  writeCases(seeded);
  return seeded;
}

export async function createCase(data: CaseData): Promise<Case> {
  await delay(220);

  const summary = data.summary?.trim();
  if (!summary) {
    throw new Error('Case summary is required.');
  }

  const newCase: Case = {
    id: generateId(),
    status: data.status?.trim() || 'Open',
    created_at: new Date().toISOString(),
    summary,
    description: data.description?.trim() || null,
  };

  const updated = [newCase, ...readCases()];
  writeCases(updated);
  return newCase;
}

