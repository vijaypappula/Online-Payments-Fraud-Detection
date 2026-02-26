import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileJson,
  Lock,
  Search,
  Shield,
} from 'lucide-react';
import {
  formatAuditLogsAsCsv,
  getAuditLogs,
  verifyAuditLogChain,
} from '../services/auditLogService';
import { AuditLogEntry } from '../types';

const downloadText = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const SystemLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const refresh = () => {
      setLogs(getAuditLogs());
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const integrity = useMemo(() => verifyAuditLogChain(logs), [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip.includes(searchTerm);

      const matchesCategory =
        categoryFilter === 'All' || log.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [logs, searchTerm, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    logs.forEach((log) => set.add(log.category));
    return Array.from(set);
  }, [logs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'bg-emerald-50 text-emerald-600';
      case 'Failed':
        return 'bg-rose-50 text-rose-600';
      case 'Warning':
        return 'bg-amber-50 text-amber-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const exportCsv = () => {
    const csv = formatAuditLogsAsCsv(filteredLogs);
    downloadText(`audit-logs-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8;');
  };

  const exportJson = () => {
    downloadText(
      `audit-logs-${Date.now()}.json`,
      JSON.stringify(filteredLogs, null, 2),
      'application/json;charset=utf-8;',
    );
  };

  return (
    <div className="col-span-12 space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-600" />
              Immutable System Logs
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Hash-chained audit trail for auth, rules, scoring, and operations.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportJson}
              className="flex items-center px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              <FileJson className="w-4 h-4 mr-2" />
              Export JSON
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div
          className={`mb-6 p-4 rounded-xl border text-sm font-bold ${
            integrity.isValid
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}
        >
          {integrity.isValid
            ? `Integrity check passed. Verified ${integrity.checked} chained records.`
            : `Integrity check failed at record ${integrity.brokenAt || 'unknown'}.`}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search logs by user, action, IP or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent border focus:border-indigo-200 focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User / IP</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Integrity</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="font-mono font-bold text-slate-700">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{log.user}</div>
                    <div className="text-xs text-slate-400 font-mono">{log.ip}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{log.action}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">
                      {log.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                      <Lock className="w-3 h-3" />
                      <span className="text-[10px] font-mono font-bold">CHAINED</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono mt-1 truncate w-24">
                      {log.hash}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${getStatusColor(log.status)}`}
                    >
                      {log.status === 'Success' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                      {(log.status === 'Failed' || log.status === 'Warning') && (
                        <AlertTriangle className="w-3 h-3 mr-1.5" />
                      )}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-500 font-bold">No logs found matching criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
