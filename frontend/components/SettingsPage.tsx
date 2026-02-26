import React, { useState, useEffect } from 'react';
import {
  Settings, Shield, Bell, Lock, Sliders, Save, RotateCcw,
  Activity, Terminal, Moon, Sun, Check, X, History, Server,
  Database, AlertTriangle, Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AppSettings = {
  realtimeAlerts: boolean;
  autoLock: boolean;
  darkMode: boolean;
  devMode: boolean;
};

interface Props {
  riskThreshold: number;
  setRiskThreshold: (val: number) => void;
  settings?: AppSettings;
  setSettings: (settings: any) => void; // Relaxed type to allow new fields
  onSave: () => void; // Callback for saving changes
}

const defaultSettings: AppSettings = {
  realtimeAlerts: true,
  autoLock: false,
  darkMode: false,
  devMode: false
};

const MOCK_USER_ROLE = 'admin'; // Change to 'viewer' to test restrictions

export const SettingsPage: React.FC<Props> = ({ riskThreshold, setRiskThreshold, settings = defaultSettings, setSettings, onSave }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [simAmount, setSimAmount] = useState<string>('');
  const [simResult, setSimResult] = useState<{ risk: number; action: string } | null>(null);

  // 🔄 Auto-save with localStorage
  useEffect(() => {
    localStorage.setItem('fraud_settings', JSON.stringify(settings));
    localStorage.setItem('fraud_threshold', riskThreshold.toString());
  }, [settings, riskThreshold]);

  const logChange = (change: string) => {
    const entry = `${new Date().toLocaleTimeString()}: ${change}`;
    setAuditLog(prev => [entry, ...prev].slice(0, 5));
  };

  const percentage = Math.round(riskThreshold * 100);

  const handleToggle = (key: keyof AppSettings) => {
    // 🔐 Role-based setting access
    if (MOCK_USER_ROLE !== 'admin') {
      setToastMsg('Permission Denied: Admin access required');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    const newValue = !settings[key];
    setSettings({ ...settings, [key]: newValue });
    logChange(`Changed ${key} to ${newValue ? 'ON' : 'OFF'}`);
  };

  const handleThresholdChange = (val: number) => {
    if (MOCK_USER_ROLE !== 'admin') return;
    setRiskThreshold(val);
  };

  // 🔁 Reset to Default button
  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      setSettings(defaultSettings);
      setRiskThreshold(0.75);
      logChange('Reset to defaults');
      setToastMsg('Settings reset to default');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    setIsSaving(true);

    // 💾 Save to backend (Simulated)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Mock API call
      // await fetch('/api/settings', { method: 'POST', body: JSON.stringify({ settings, riskThreshold }) });
      
      onSave();
      logChange('Configuration saved to backend');
      setToastMsg('Settings saved successfully');
    } catch (e) {
      setToastMsg('Failed to save settings');
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // 📊 Risk preview simulator
  const runSimulation = () => {
    const amount = parseFloat(simAmount) || 0;
    // Mock simulation logic
    const randomRisk = Math.random();
    const isFlagged = randomRisk > riskThreshold;
    setSimResult({
      risk: Math.round(randomRisk * 100),
      action: isFlagged ? 'Blocked' : 'Approved'
    });
  };

  return (
    <div className="col-span-12 space-y-6 relative">
      {/* 🔔 Toast notifications */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛑 Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-center text-slate-800 mb-2">Save Changes?</h3>
              <p className="text-center text-slate-500 text-sm mb-6">
                This will update the production configuration and log an audit entry.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Settings className="w-6 h-6 text-indigo-600" />
              System Configuration
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Manage detection sensitivity and security protocols</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>
            <button 
              onClick={handleSaveClick}
              disabled={isSaving}
              className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-70"
            >
              {isSaving ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Detection Sensitivity Card */}
            <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 relative overflow-hidden">
              {MOCK_USER_ROLE !== 'admin' && (
                <div className="absolute inset-0 bg-slate-50/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-xs font-bold text-slate-500 flex items-center">
                    <Lock className="w-3 h-3 mr-2" /> Admin Access Only
                  </div>
                </div>
              )}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Detection Sensitivity</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">AI Threshold Control</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold text-slate-600">Fraud Alert Threshold</span>
                <span className="text-2xl font-black text-indigo-600">{percentage}%</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="99" 
                value={percentage} 
                onChange={(e) => handleThresholdChange(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Aggressive</span>
                <span>Balanced</span>
                <span>Conservative</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed">
              <span className="font-bold text-indigo-600">Current Impact:</span> Transactions with a risk score above <span className="font-bold">{percentage}%</span> will trigger an immediate AI investigation and alert the security team.
            </div>
          </div>

            {/* Risk Simulator */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Risk Simulator</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Preview Logic</p>
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <input 
                  type="number" 
                  placeholder="Transaction Amount ($)" 
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-colors"
                />
                <button 
                  onClick={runSimulation}
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Test
                </button>
              </div>
              {simResult && (
                <div className={`p-4 rounded-xl border flex justify-between items-center ${simResult.action === 'Blocked' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                  <span className="text-xs font-bold uppercase tracking-wider">Simulated Risk: {simResult.risk}%</span>
                  <span className="font-black uppercase text-sm">{simResult.action}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* General Settings */}
            <div className="space-y-4">
              <label className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-100 transition-colors group cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">Real-time Alerts</h4>
                  <p className="text-xs text-slate-400">Push notifications for high-risk events</p>
                </div>
              </div>
              <div 
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.realtimeAlerts ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <input type="checkbox" className="sr-only" checked={settings.realtimeAlerts} onChange={() => handleToggle('realtimeAlerts')} />
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                  settings.realtimeAlerts ? 'right-1' : 'left-1'
                }`}>
                </div>
              </div>
            </label>

              <label className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-100 transition-colors group cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">Auto-Lock Accounts</h4>
                  <p className="text-xs text-slate-400">Freeze accounts with &gt;95% risk score</p>
                </div>
              </div>
              <div 
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.autoLock ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <input type="checkbox" className="sr-only" checked={settings.autoLock} onChange={() => handleToggle('autoLock')} />
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                  settings.autoLock ? 'right-1' : 'left-1'
                }`}>
                </div>
              </div>
            </label>

              {/* 🧪 Environment toggle */}
              <label className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-100 transition-colors group cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">Developer Mode</h4>
                    <p className="text-xs text-slate-400">Enable verbose logging & debug tools</p>
                  </div>
                </div>
                <div 
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.devMode ? 'bg-indigo-500' : 'bg-slate-200'}`}
                >
                  <input type="checkbox" className="sr-only" checked={settings.devMode} onChange={() => handleToggle('devMode')} />
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                    settings.devMode ? 'right-1' : 'left-1'
                  }`}>
                  </div>
                </div>
              </label>

              {/* 🌙 Dark mode system settings */}
              <label className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-100 transition-colors group cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                    {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">Dark Mode</h4>
                    <p className="text-xs text-slate-400">System-wide appearance</p>
                  </div>
                </div>
                <div 
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}
                >
                  <input type="checkbox" className="sr-only" checked={settings.darkMode} onChange={() => handleToggle('darkMode')} />
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                    settings.darkMode ? 'right-1' : 'left-1'
                  }`}>
                  </div>
                </div>
              </label>
            </div>

            {/* 🕒 Configuration change audit log */}
            <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <History className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuration Audit Log</h4>
              </div>
              <div className="space-y-3">
                {auditLog.length === 0 && <p className="text-xs text-slate-400 italic">No changes recorded this session.</p>}
                {auditLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-slate-900 text-white border border-slate-800">
              <div className="flex items-center gap-4">
                <Shield className="w-8 h-8 text-indigo-400" />
                <div>
                  <h4 className="font-bold">Enterprise Security</h4>
                  <p className="text-xs text-slate-400 mt-1">v2.4.0-Stable • License Active</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <Server className="w-3 h-3" />
                    <span>Connected to SecureNode-01</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};