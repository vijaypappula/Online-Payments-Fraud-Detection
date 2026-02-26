import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck, 
  Activity, 
  Settings, 
  FileText, 
  Users, 
  Cpu, 
  Search,
  Database, 
  Wifi,
  ChevronRight,
  LogOut,
  Zap,
  Briefcase,
  ClipboardList,
  BrainCircuit,
  GanttChartSquare,
  UploadCloud
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole } from '../types';

interface Props {
  stats: { total: number; frauds: number };
  user?: { name?: string; role?: UserRole };
  onLogout?: () => void;
}

export const Sidebar: React.FC<Props> = ({ stats, user, onLogout }) => {
  const navItems = [
    { id: 'audit', icon: Activity, label: 'Live Audit' },
    { id: 'batch-scoring', icon: UploadCloud, label: 'Batch Scoring' },
    { id: 'forensics', icon: Search, label: 'Forensics' },
    { id: 'rules', icon: GanttChartSquare, label: 'Rule Builder' },
    { id: 'model-monitoring', icon: BrainCircuit, label: 'Model Monitoring' },
    { id: 'cases', icon: Briefcase, label: 'Case Management' },
    { id: 'system-logs', icon: ClipboardList, label: 'System Logs' },
    { id: 'compliance', icon: ShieldCheck, label: 'Compliance' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  const role = user?.role || 'viewer';
  const allowedByRole: Record<UserRole, string[]> = {
    admin: navItems.map((item) => item.id),
    analyst: navItems.map((item) => item.id),
    viewer: ['audit', 'forensics', 'compliance', 'reports', 'model-monitoring'],
  };

  const visibleNavItems = navItems.filter((item) => allowedByRole[role].includes(item.id));

  return (
    <div className="w-[300px] h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 z-50">
      {/* Brand Section */}
      <div className="p-8 pb-6">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tighter">SecurePay</span>
        </div>

        {/* Auditor Profile */}
        <div className="bg-slate-900 rounded-[2rem] p-5 text-white shadow-2xl shadow-slate-200 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
            <Zap className="w-12 h-12" />
          </div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-400 p-0.5 overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'default')}`} alt="Auditor" className="w-full h-full rounded-full" />
            </div>
            <div>
              <h4 className="text-sm font-bold truncate w-24">{user?.name || 'Auditor'}</h4>
              <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">{role} access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow px-4 space-y-2 mt-4">
        {visibleNavItems.map(item => (
          <NavLink
            key={item.id}
            to={`/${item.id}`}
            className={({ isActive }) =>
              `w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Status Panel */}
      <div className="p-6 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
            <Cpu className="w-3 h-3 mr-2" />
            System Health
          </p>
          <StatusItem icon={Database} label="ML Engine" status="Online" color="emerald" />
          <StatusItem icon={Zap} label="Gemini AI" status="Active" color="emerald" />
          <StatusItem icon={Wifi} label="Network" status="Stable" color="emerald" />
          
          <div className="pt-2 mt-2 border-t border-slate-200">
             <div className="flex justify-between items-end mb-1">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Detection Rate</span>
               <span className="text-xs font-black text-slate-700">99.8%</span>
             </div>
             <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-[99.8%] bg-indigo-500 rounded-full"></div>
             </div>
          </div>
        </div>
        
        <button onClick={onLogout} disabled={!onLogout} className="w-full mt-6 flex items-center justify-center space-x-2 py-3 text-slate-400 hover:text-rose-500 transition-colors text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
           <LogOut className="w-4 h-4" />
           <span>Terminate Session</span>
        </button>
      </div>
    </div>
  );
};

const StatusItem = ({ icon: Icon, label, status, color }: { icon: React.ElementType, label: string, status: string, color: 'emerald' | 'rose' | 'amber' }) => {
  const colorMap = {
    emerald: { dot: 'bg-emerald-500', text: 'text-emerald-600' },
    rose: { dot: 'bg-rose-500', text: 'text-rose-600' },
    amber: { dot: 'bg-amber-500', text: 'text-amber-600' },
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Icon className="w-3 h-3 text-slate-400" />
        <span className="text-[11px] font-bold text-slate-600">{label}</span>
      </div>
      <div className="flex items-center space-x-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${colorMap[color].dot}`}></span>
        <span className={`text-[10px] font-black uppercase ${colorMap[color].text}`}>{status}</span>
      </div>
    </div>
  );
};
