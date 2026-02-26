import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Globe,
  LayoutDashboard,
  MessageSquareDiff,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TransactionForm } from './components/TransactionForm';
import { ResultDisplay } from './components/ResultDisplay';
import { ChatAssistant } from './components/ChatAssistant';
import { GlobalThreatFeed } from './components/GlobalThreatFeed';
import { ForensicsSearch } from './components/ForensicsSearch';
import { ComplianceDashboard } from './components/ComplianceDashboard';
import { ReportsDashboard } from './components/ReportsDashboard';
import { SettingsPage } from './components/SettingsPage';
import { LoginPage } from './components/LoginPage';
import { CaseManagementPage } from './components/CaseManagementPage';
import { SystemLogsPage } from './components/SystemLogsPage';
import { RuleBuilderPage } from './components/RuleBuilderPage';
import { ModelMonitoringPage } from './components/ModelMonitoringPage';
import { BatchScoringPage } from './components/BatchScoringPage';
import {
  AdaptiveThresholdConfig,
  AlertIntegrationTarget,
  AnalystFeedbackItem,
  AnalystFeedbackLabel,
  AppUser,
  HistoryItem,
  PredictionResult,
  RuleDefinition,
  TransactionData,
  UserRole,
} from './types';
import { predictFraud } from './services/mlService';
import { defaultRules, getRules, saveRules } from './services/ruleService';
import {
  defaultAdaptiveThresholdConfig,
  getAdaptiveThresholdConfig,
  getThresholdForTransaction,
  saveAdaptiveThresholdConfig,
} from './services/thresholdService';
import {
  getFeedbackItems,
  upsertFeedback,
} from './services/feedbackService';
import {
  defaultIntegrations,
  dispatchHighRiskAlert,
  getIntegrationTargets,
  saveIntegrationTargets,
  sendTestAlert,
} from './services/integrationService';
import { appendAuditLog, ensureAuditLedger } from './services/auditLogService';

type AppSettings = { realtimeAlerts: boolean; autoLock: boolean };

type AppContextType = {
  loading: boolean;
  history: HistoryItem[];
  currentResult: PredictionResult | null;
  currentData: TransactionData | null;
  stats: { total: number; frauds: number };
  userRole: UserRole;
  feedbackForCurrent: AnalystFeedbackItem | null;
  handleTransactionSubmit: (data: TransactionData) => Promise<void>;
  handleFeedbackSubmit: (label: AnalystFeedbackLabel) => void;
};

const runtimeSettingsKey = 'securepay.app.settings.v1';

const roleAccessMap: Record<UserRole, string[]> = {
  admin: [
    'audit',
    'batch-scoring',
    'forensics',
    'rules',
    'model-monitoring',
    'cases',
    'system-logs',
    'compliance',
    'reports',
    'settings',
  ],
  analyst: [
    'audit',
    'batch-scoring',
    'forensics',
    'rules',
    'model-monitoring',
    'cases',
    'system-logs',
    'compliance',
    'reports',
    'settings',
  ],
  viewer: ['audit', 'forensics', 'model-monitoring', 'compliance', 'reports'],
};

const AuditPage: React.FC = () => {
  const {
    loading,
    history,
    currentResult,
    currentData,
    stats,
    userRole,
    feedbackForCurrent,
    handleTransactionSubmit,
    handleFeedbackSubmit,
  } = useOutletContext<AppContextType>();
  const [country, setCountry] = useState('US');

  const currencySymbol = useMemo(() => {
    switch (country) {
      case 'IN':
        return 'Rs ';
      case 'GB':
        return 'GBP ';
      case 'EU':
        return 'EUR ';
      default:
        return '$';
    }
  }, [country]);

  const readOnly = userRole === 'viewer';

  const handleSubmitWithCountry = async (data: TransactionData) => {
    const normalized = data.id.toUpperCase();
    const enriched: TransactionData = {
      ...data,
      country,
      sourceEntityId: `SRC-${normalized.slice(0, 4)}`,
      destinationEntityId: `DST-${normalized.slice(-4)}`,
      deviceId: `DEV-${normalized.slice(1, 5)}`,
      ipAddress: `10.0.${(Math.floor(data.amount) % 180) + 10}.${(Math.floor(data.amount) % 170) + 20}`,
    };
    await handleTransactionSubmit(enriched);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <div className="xl:col-span-5 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold flex items-center">
              <LayoutDashboard className="w-5 h-5 mr-3 text-indigo-600" />
              Audit Terminal
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="US">USD</option>
                  <option value="IN">INR</option>
                  <option value="GB">GBP</option>
                  <option value="EU">EUR</option>
                </select>
              </div>
              <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">
                {readOnly ? 'View Only' : 'Live Input'}
              </div>
            </div>
          </div>
          <TransactionForm
            onSubmit={handleSubmitWithCountry}
            isLoading={loading}
            currencySymbol={currencySymbol}
            readOnly={readOnly}
          />
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safe Ops</p>
              <p className="text-xl font-black text-slate-800">{stats.total - stats.frauds}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interceptions</p>
              <p className="text-xl font-black text-rose-600">{stats.frauds}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="xl:col-span-7 space-y-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white h-[550px] rounded-[3rem] border border-slate-200/60 flex flex-col items-center justify-center text-center p-12"
            >
              <div className="relative mb-10">
                <div className="w-24 h-24 border-[6px] border-slate-100 rounded-full" />
                <div className="w-24 h-24 border-[6px] border-indigo-600 rounded-full border-t-transparent animate-spin absolute inset-0" />
                <Activity className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
                System Scan in Progress
              </h3>
              <p className="text-slate-400 max-w-sm text-sm font-medium leading-relaxed">
                Analyzing behavioral vectors and cross-referencing global threat databases for anomaly detection...
              </p>
            </motion.div>
          ) : currentResult ? (
            <ResultDisplay
              key="result"
              result={currentResult}
              amount={currentData?.amount}
              currencySymbol={currencySymbol}
              feedbackLabel={feedbackForCurrent?.label || null}
              onFeedback={handleFeedbackSubmit}
              readOnly={readOnly}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white h-[550px] rounded-[3rem] border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-12 group"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-slate-100">
                <ShieldAlert className="w-12 h-12 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-2">
                Awaiting Transaction
              </h3>
              <p className="text-slate-400 max-w-xs text-sm font-medium">
                Inject a transaction payload into the audit terminal to generate a security assessment.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analysis Stream</h4>
            <div className="h-1 flex-grow mx-4 bg-slate-50 rounded-full" />
          </div>
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 custom-scrollbar">
            {history.length > 0 ? (
              history.map((item) => (
                <motion.div
                  key={item.data.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[190px] hover:bg-white hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {new Date(item.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.result.prediction === 'Fraud' ? 'bg-rose-500' : 'bg-emerald-500'
                      } animate-pulse`}
                    />
                  </div>
                  <p className="font-black text-slate-800 mb-1 leading-none text-lg">
                    {currencySymbol}
                    {item.data.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.data.type}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest py-4 pl-2">
                Stream offline - no active scans
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{
  user: AppUser;
  onLogout: () => void;
  stats: { total: number; frauds: number };
  appContext: AppContextType;
}> = ({ user, onLogout, stats, appContext }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-['Plus_Jakarta_Sans']">
      <Sidebar user={user} onLogout={onLogout} stats={stats} />
      <div className="flex-grow flex flex-col h-screen overflow-y-auto custom-scrollbar relative">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search txid or account..."
                  className="pl-10 pr-4 py-2 bg-slate-100 border-transparent border focus:border-indigo-200 focus:bg-white rounded-xl text-xs font-medium w-64 outline-none transition-all"
                />
              </div>
              <GlobalThreatFeed />
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Intelligence Hub
                </span>
                <span className="text-xs font-bold text-slate-700">{user.role} role</span>
              </div>
              <div className="w-px h-8 bg-slate-200 mx-2" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-600">Active Scan</span>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-[1400px] w-full mx-auto p-8">
          <Outlet context={appContext} />
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentResult, setCurrentResult] = useState<PredictionResult | null>(null);
  const [currentData, setCurrentData] = useState<TransactionData | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState(0.7);
  const [settings, setSettings] = useState<AppSettings>({ realtimeAlerts: true, autoLock: false });
  const [rules, setRules] = useState<RuleDefinition[]>(defaultRules);
  const [adaptiveConfig, setAdaptiveConfig] = useState<AdaptiveThresholdConfig>(defaultAdaptiveThresholdConfig);
  const [feedbackItems, setFeedbackItems] = useState<AnalystFeedbackItem[]>([]);
  const [integrations, setIntegrations] = useState<AlertIntegrationTarget[]>(defaultIntegrations);

  useEffect(() => {
    ensureAuditLedger();

    try {
      const storedSettingsRaw = localStorage.getItem(runtimeSettingsKey);
      if (storedSettingsRaw) {
        const stored = JSON.parse(storedSettingsRaw);
        if (typeof stored.riskThreshold === 'number') {
          setRiskThreshold(stored.riskThreshold);
        }
        if (stored.settings) {
          setSettings(stored.settings);
        }
      }

      const fromSession = sessionStorage.getItem('user');
      const fromLocal = localStorage.getItem('user');
      const storedUser = fromSession || fromLocal;
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as Partial<AppUser>;
        if (parsed?.name) {
          setUser({
            name: parsed.name,
            role: parsed.role || 'analyst',
          });
        }
      }
    } catch {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }

    setRules(getRules());
    setAdaptiveConfig(getAdaptiveThresholdConfig());
    setFeedbackItems(getFeedbackItems());
    setIntegrations(getIntegrationTargets());

    setIsInitializing(false);
  }, []);

  const canMutate = user?.role !== 'viewer';

  const handleLogin = (username: string, rememberMe: boolean, role: UserRole) => {
    const newUser: AppUser = { name: username, role };
    setUser(newUser);
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      sessionStorage.setItem('user', JSON.stringify(newUser));
    }

    appendAuditLog({
      action: 'User Login',
      category: 'Auth',
      details: `${username} signed in with role ${role}`,
      status: 'Success',
      user: username,
    });
  };

  const handleLogout = () => {
    if (user) {
      appendAuditLog({
        action: 'User Logout',
        category: 'Auth',
        details: `${user.name} terminated session`,
        status: 'Success',
        user: user.name,
      });
    }
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  const handleTransactionSubmit = async (data: TransactionData) => {
    if (!canMutate) {
      return;
    }

    setLoading(true);
    setCurrentResult(null);
    setCurrentData(data);
    try {
      const adaptive = getThresholdForTransaction(data, adaptiveConfig, data.country);
      const threshold = Math.max(0.35, Math.min(0.95, (riskThreshold + adaptive.threshold) / 2));
      const result = await predictFraud(data, {
        threshold,
        country: data.country,
        rules,
      });

      setCurrentResult(result);
      setHistory((prev) => [{ data, result }, ...prev].slice(0, 120));

      appendAuditLog({
        action: 'Transaction Scored',
        category: 'Model',
        details: `${data.id} -> ${result.prediction} (${Math.round(result.probability * 100)}%), threshold ${Math.round(threshold * 100)}%`,
        status: result.prediction === 'Fraud' ? 'Warning' : 'Success',
      });

      if (result.probability > threshold) {
        setIsChatOpen(true);
      }

      if (settings.realtimeAlerts && result.prediction === 'Fraud') {
        const dispatchResults = await dispatchHighRiskAlert(data, result, integrations);
        dispatchResults.forEach((dispatch) => {
          appendAuditLog({
            action: 'Integration Dispatch',
            category: 'Integration',
            details: `${dispatch.targetName}: ${dispatch.message}`,
            status: dispatch.ok ? 'Success' : 'Failed',
          });
        });
      }

      if (settings.autoLock && result.prediction === 'Fraud' && result.probability >= 0.95) {
        appendAuditLog({
          action: 'Auto-Lock Triggered',
          category: 'Risk',
          details: `Entity lock requested for transaction ${data.id} after ${Math.round(result.probability * 100)}% risk score.`,
          status: 'Warning',
        });
      }
    } catch (error) {
      appendAuditLog({
        action: 'Scoring Error',
        category: 'Model',
        details: error instanceof Error ? error.message : 'Unknown scoring error',
        status: 'Failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = (label: AnalystFeedbackLabel) => {
    if (!currentData || !currentResult || !user || !canMutate) {
      return;
    }

    upsertFeedback({
      transactionId: currentData.id,
      label,
      prediction: currentResult.prediction,
      probability: currentResult.probability,
      analyst: user.name,
    });

    setFeedbackItems(getFeedbackItems());

    appendAuditLog({
      action: 'Analyst Feedback Submitted',
      category: 'Model',
      details: `${user.name} labeled ${currentData.id} as ${label}`,
      status: 'Success',
      user: user.name,
    });
  };

  const handleSaveRules = (nextRules: RuleDefinition[]) => {
    if (!canMutate) {
      return;
    }
    setRules(nextRules);
    saveRules(nextRules);
    appendAuditLog({
      action: 'Rules Updated',
      category: 'Rules',
      details: `Rule set updated. Active rules: ${nextRules.filter((rule) => rule.enabled).length}`,
      status: 'Warning',
    });
  };

  const handleAppendBatchHistory = (items: HistoryItem[]) => {
    if (items.length === 0) {
      return;
    }
    setHistory((prev) => [...items, ...prev].slice(0, 200));
    appendAuditLog({
      action: 'Batch Scoring Completed',
      category: 'Model',
      details: `${items.length} transactions scored in batch mode.`,
      status: 'Success',
    });
  };

  const handleSaveSettings = () => {
    if (!canMutate) {
      return;
    }
    localStorage.setItem(runtimeSettingsKey, JSON.stringify({ riskThreshold, settings }));
    saveAdaptiveThresholdConfig(adaptiveConfig);
    saveIntegrationTargets(integrations);
    appendAuditLog({
      action: 'Settings Saved',
      category: 'System',
      details: `Risk threshold ${Math.round(riskThreshold * 100)}%. Integrations: ${integrations.length}.`,
      status: 'Success',
    });
  };

  const handleSendTestAlert = async (target: AlertIntegrationTarget) => {
    const result = await sendTestAlert(target);
    appendAuditLog({
      action: 'Integration Test Alert',
      category: 'Integration',
      details: `${target.name}: ${result.message}`,
      status: result.ok ? 'Success' : 'Failed',
    });
  };

  const stats = useMemo(() => {
    const total = history.length;
    const frauds = history.filter((item) => item.result.prediction === 'Fraud').length;
    return { total, frauds };
  }, [history]);

  const feedbackForCurrent = useMemo(() => {
    if (!currentData) {
      return null;
    }
    return feedbackItems.find((item) => item.transactionId === currentData.id) || null;
  }, [currentData, feedbackItems]);

  const appContext: AppContextType = {
    loading,
    history,
    currentResult,
    currentData,
    stats,
    userRole: user?.role || 'viewer',
    feedbackForCurrent,
    handleTransactionSubmit,
    handleFeedbackSubmit,
  };

  const hasAccess = (routeId: string): boolean => {
    if (!user) {
      return false;
    }
    return roleAccessMap[user.role].includes(routeId);
  };

  if (isInitializing) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/audit" />} />
        <Route
          path="/"
          element={user ? <DashboardLayout user={user} onLogout={handleLogout} stats={stats} appContext={appContext} /> : <Navigate to="/login" />}
        >
          <Route index element={<Navigate to="/audit" replace />} />
          <Route path="audit" element={hasAccess('audit') ? <AuditPage /> : <Navigate to="/audit" replace />} />
          <Route
            path="batch-scoring"
            element={
              hasAccess('batch-scoring') ? (
                <BatchScoringPage
                  rules={rules}
                  thresholdConfig={adaptiveConfig}
                  onAppendHistory={handleAppendBatchHistory}
                  readOnly={!canMutate}
                />
              ) : (
                <Navigate to="/audit" replace />
              )
            }
          />
          <Route
            path="forensics"
            element={hasAccess('forensics') ? <ForensicsSearch transactions={history} /> : <Navigate to="/audit" replace />}
          />
          <Route
            path="rules"
            element={
              hasAccess('rules') ? (
                <RuleBuilderPage rules={rules} onSaveRules={handleSaveRules} readOnly={!canMutate} />
              ) : (
                <Navigate to="/audit" replace />
              )
            }
          />
          <Route
            path="model-monitoring"
            element={
              hasAccess('model-monitoring') ? (
                <ModelMonitoringPage history={history} feedback={feedbackItems} />
              ) : (
                <Navigate to="/audit" replace />
              )
            }
          />
          <Route path="compliance" element={hasAccess('compliance') ? <ComplianceDashboard /> : <Navigate to="/audit" replace />} />
          <Route path="reports" element={hasAccess('reports') ? <ReportsDashboard /> : <Navigate to="/audit" replace />} />
          <Route
            path="settings"
            element={
              hasAccess('settings') ? (
                <SettingsPage
                  riskThreshold={riskThreshold}
                  setRiskThreshold={setRiskThreshold}
                  settings={settings}
                  setSettings={setSettings}
                  adaptiveConfig={adaptiveConfig}
                  setAdaptiveConfig={setAdaptiveConfig}
                  integrations={integrations}
                  setIntegrations={setIntegrations}
                  onSendTestAlert={handleSendTestAlert}
                  onSave={handleSaveSettings}
                  readOnly={!canMutate}
                />
              ) : (
                <Navigate to="/audit" replace />
              )
            }
          />
          <Route path="system-logs" element={hasAccess('system-logs') ? <SystemLogsPage /> : <Navigate to="/audit" replace />} />
          <Route path="cases" element={hasAccess('cases') ? <CaseManagementPage /> : <Navigate to="/audit" replace />} />
          <Route path="*" element={<div className="p-8 text-center"><h2>404: Page Not Found</h2></div>} />
        </Route>
      </Routes>

      {user && (
        <>
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl z-50 flex items-center justify-center transition-all duration-300 ${
              isChatOpen
                ? 'bg-slate-900 text-white rotate-90'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isChatOpen ? <MessageSquareDiff className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
          </motion.button>
          <ChatAssistant
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            lastTransaction={currentData}
            lastResult={currentResult}
          />
        </>
      )}
    </>
  );
};

export default App;
