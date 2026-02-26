import {
  AuditLogCategory,
  AuditLogEntry,
  AuditLogStatus,
  AppUser,
} from '../types';

const STORAGE_KEY = 'securepay.audit.logs.v1';
const GENESIS_HASH = '0'.repeat(64);

type AppendAuditLogInput = {
  action: string;
  category: AuditLogCategory;
  details: string;
  status?: AuditLogStatus;
  user?: string;
  ip?: string;
};

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readStorage = (): AuditLogEntry[] => {
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
      (entry): entry is AuditLogEntry =>
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.timestamp === 'string' &&
        typeof entry.user === 'string' &&
        typeof entry.action === 'string' &&
        typeof entry.category === 'string' &&
        typeof entry.details === 'string' &&
        typeof entry.ip === 'string' &&
        typeof entry.status === 'string' &&
        typeof entry.prevHash === 'string' &&
        typeof entry.hash === 'string',
    );
  } catch {
    return [];
  }
};

const writeStorage = (logs: AuditLogEntry[]): void => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore quota and storage access errors in local mode.
  }
};

// Lightweight non-cryptographic hash used for demo integrity chaining.
const hashString = (value: string): string => {
  let h1 = 0xdeadbeef ^ value.length;
  let h2 = 0x41c6ce57 ^ value.length;

  for (let i = 0; i < value.length; i += 1) {
    const ch = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const p4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');

  return `${p1}${p2}${p3}${p4}${p2}${p1}${p4}${p3}`;
};

const resolveCurrentUser = (): string => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const raw = window.sessionStorage.getItem('user') ?? window.localStorage.getItem('user');
    if (!raw) {
      return 'system';
    }

    const parsed = JSON.parse(raw) as Partial<AppUser>;
    if (parsed && typeof parsed.name === 'string' && parsed.name.trim()) {
      return parsed.name;
    }
  } catch {
    // Ignore malformed session payloads.
  }

  return 'system';
};

const createEntry = (input: AppendAuditLogInput, prevHash: string): AuditLogEntry => {
  const timestamp = new Date().toISOString();
  const base = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    timestamp,
    user: input.user || resolveCurrentUser(),
    action: input.action,
    category: input.category,
    details: input.details,
    ip: input.ip || '127.0.0.1',
    status: input.status || 'Success',
    prevHash,
  };

  const hash = hashString(JSON.stringify(base));
  return { ...base, hash };
};

export const ensureAuditLedger = (): void => {
  const existing = readStorage();
  if (existing.length > 0) {
    return;
  }

  const genesis = createEntry(
    {
      action: 'Audit Ledger Initialized',
      category: 'System',
      details: 'Created immutable audit chain for this workspace.',
      status: 'Success',
      user: 'system',
      ip: '127.0.0.1',
    },
    GENESIS_HASH,
  );
  writeStorage([genesis]);
};

export const appendAuditLog = (input: AppendAuditLogInput): AuditLogEntry => {
  ensureAuditLedger();
  const existing = readStorage();
  const prevHash = existing.length > 0 ? existing[existing.length - 1].hash : GENESIS_HASH;
  const next = createEntry(input, prevHash);
  const updated = [...existing, next];
  writeStorage(updated);
  return next;
};

export const getAuditLogs = (): AuditLogEntry[] => readStorage().slice().reverse();

export const verifyAuditLogChain = (logsDesc?: AuditLogEntry[]): {
  isValid: boolean;
  brokenAt?: string;
  checked: number;
} => {
  const logsAsc = (logsDesc ? logsDesc.slice().reverse() : readStorage()).slice();
  if (logsAsc.length === 0) {
    return { isValid: true, checked: 0 };
  }

  let previousHash = GENESIS_HASH;

  for (let i = 0; i < logsAsc.length; i += 1) {
    const entry = logsAsc[i];
    const recomputedHash = hashString(
      JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp,
        user: entry.user,
        action: entry.action,
        category: entry.category,
        details: entry.details,
        ip: entry.ip,
        status: entry.status,
        prevHash: entry.prevHash,
      }),
    );

    if (entry.prevHash !== previousHash || entry.hash !== recomputedHash) {
      return { isValid: false, brokenAt: entry.id, checked: i + 1 };
    }

    previousHash = entry.hash;
  }

  return { isValid: true, checked: logsAsc.length };
};

export const formatAuditLogsAsCsv = (logs: AuditLogEntry[]): string => {
  const header = 'id,timestamp,user,category,action,status,ip,details,prevHash,hash';
  const rows = logs.map((log) =>
    [
      log.id,
      log.timestamp,
      log.user,
      log.category,
      log.action,
      log.status,
      log.ip,
      log.details.replace(/"/g, '""'),
      log.prevHash,
      log.hash,
    ]
      .map((cell) => `"${cell}"`)
      .join(','),
  );

  return [header, ...rows].join('\n');
};
