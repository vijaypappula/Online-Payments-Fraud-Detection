export enum TransactionType {
  CASH_OUT = 'CASH_OUT',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  CASH_IN = 'CASH_IN',
  DEBIT = 'DEBIT'
}

export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface AppUser {
  name: string;
  role: UserRole;
}

export interface TransactionData {
  id: string;
  timestamp: Date;
  amount: number;
  type: TransactionType;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  oldbalanceDest: number;
  newbalanceDest: number;
  country?: string;
  sourceEntityId?: string;
  destinationEntityId?: string;
  deviceId?: string;
  ipAddress?: string;
}

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface ReasonCode {
  code: string;
  title: string;
  score: number;
  detail: string;
}

export type RuleAction = 'boost_score' | 'force_fraud' | 'force_review';

export interface RuleDefinition {
  id: string;
  name: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: RuleAction;
  boost?: number;
  minAmount?: number;
  transactionType?: TransactionType | 'ANY';
  country?: string | 'ANY';
  minVelocity?: number;
}

export interface RuleMatch {
  ruleId: string;
  ruleName: string;
  action: RuleAction;
  boostApplied: number;
  reason: string;
}

export interface AdaptiveThresholdConfig {
  defaultThreshold: number;
  byType: Partial<Record<TransactionType, number>>;
  byCountry: Record<string, number>;
  nightShiftDelta: number;
  weekendDelta: number;
}

export type AnalystFeedbackLabel = 'confirmed_fraud' | 'false_positive' | 'needs_review';

export interface AnalystFeedbackItem {
  id: string;
  transactionId: string;
  label: AnalystFeedbackLabel;
  prediction: 'Fraud' | 'Not Fraud';
  probability: number;
  timestamp: string;
  analyst: string;
}

export type IntegrationType = 'slack' | 'teams' | 'webhook' | 'email';

export interface AlertIntegrationTarget {
  id: string;
  name: string;
  type: IntegrationType;
  endpoint: string;
  enabled: boolean;
  secret?: string;
}

export type AuditLogCategory = 'Auth' | 'Case' | 'System' | 'Report' | 'Risk' | 'Rules' | 'Integration' | 'Model';
export type AuditLogStatus = 'Success' | 'Failed' | 'Warning';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: AuditLogCategory;
  details: string;
  ip: string;
  status: AuditLogStatus;
  prevHash: string;
  hash: string;
}

export interface PredictionResult {
  prediction: 'Fraud' | 'Not Fraud';
  probability: number;
  reasoning: string;
  sources?: GroundingLink[];
  thresholdUsed?: number;
  decisionSource?: 'model' | 'adaptive-threshold' | 'rule';
  reasonCodes?: ReasonCode[];
  matchedRules?: RuleMatch[];
  riskMetrics?: {
    velocity: number;
    anomaly: number;
    behavioral: number;
  };
}

export interface HistoryItem {
  data: TransactionData;
  result: PredictionResult;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Case {
  id: string;
  status: string;
  created_at: string;
  summary: string;
  description: string | null;
}

export interface CaseData {
  summary: string;
  description?: string;
  status?: string;
}
