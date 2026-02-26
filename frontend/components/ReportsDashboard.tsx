import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, PieChart, TrendingUp, Calendar, Printer, Search, Mail, FileSpreadsheet, Filter, Lock } from 'lucide-react';

// Mock User Role for RBAC
const CURRENT_USER_ROLE = 'admin'; // Change to 'viewer' to test permissions

interface Report {
  id: string;
  title: string;
  size: string;
  date: string;
  type: string;
  url?: string; // In a real app, this would be the S3/Blob URL
}

export const ReportsDashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState({
    totalVolume: 0,
    volumeChange: 0,
    fraudRate: 0,
    fraudChange: 0,
    preventedLoss: 0
  });

  // Simulate Backend API Integration
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock Data Response
      setReports([
        { id: '1', title: 'Monthly Security Audit - March 2024', size: '2.4 MB', date: '2024-03-31', type: 'Audit' },
        { id: '2', title: 'Q1 Fraud Analysis Report', size: '5.1 MB', date: '2024-03-15', type: 'Analysis' },
        { id: '3', title: 'Suspicious Activity Log (SAR)', size: '1.2 MB', date: '2024-03-10', type: 'SAR' },
        { id: '4', title: 'System Compliance Certificate', size: '856 KB', date: '2024-03-01', type: 'Compliance' },
        { id: '5', title: 'February Security Audit', size: '2.1 MB', date: '2024-02-28', type: 'Audit' },
      ]);

      setStats({
        totalVolume: 4200000,
        volumeChange: 12.5,
        fraudRate: 0.8,
        fraudChange: -2.4,
        preventedLoss: 342000
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            report.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const reportDate = new Date(report.date);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;

      const matchesDate = (!start || reportDate >= start) && (!end || reportDate <= end);

      return matchesSearch && matchesDate;
    });
  }, [reports, searchTerm, dateRange]);

  const handlePrint = () => {
    globalThis.print();
  };

  const handleExportCSV = () => {
    if (CURRENT_USER_ROLE !== 'admin') {
      alert('Permission Denied: Only admins can export CSV.');
      return;
    }

    const headers = ['ID,Title,Type,Date,Size'];
    const csvContent = [
      headers.join('\n'),
      ...filteredReports.map(r => `${r.id},"${r.title}",${r.type},${r.date},${r.size}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reports_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailReport = () => {
    const email = prompt("Enter recipient email address:");
    if (email) {
      // Mock Backend API Call
      alert(`Report scheduled to be sent to ${email}`);
    }
  };

  // Real file storage simulation (Blob generation)
  const handleDownloadFile = (report: Report) => {
    // In a real app, this would fetch from report.url or an API endpoint
    // Here we simulate a file download
    const content = `
      REPORT: ${report.title}
      DATE: ${report.date}
      TYPE: ${report.type}
      
      This is a generated placeholder for the actual report content.
      In a production environment, this would be the actual file stream from the secure storage.
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, '_')}.txt`; // Downloading as txt for demo
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="col-span-12 space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              Executive Reports
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Generate and export security audit summaries</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleEmailReport}
              className="flex items-center px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </button>
            {CURRENT_USER_ROLE === 'admin' && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Overview (Dynamic) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stats.volumeChange >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {stats.volumeChange > 0 ? '+' : ''}{stats.volumeChange}%
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Volume</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {loading ? '...' : `$${(stats.totalVolume / 1000000).toFixed(1)}M`}
            </h3>
          </div>
          
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                <PieChart className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stats.fraudChange <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {stats.fraudChange > 0 ? '+' : ''}{stats.fraudChange}%
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Fraud Rate</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {loading ? '...' : `${stats.fraudRate}%`}
            </h3>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400">Last 30 Days</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Prevented Loss</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {loading ? '...' : `$${(stats.preventedLoss / 1000).toFixed(0)}k`}
            </h3>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent border focus:border-indigo-200 focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
             <div className="relative">
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="pl-4 pr-2 py-3 bg-slate-50 border-transparent border focus:border-indigo-200 focus:bg-white rounded-2xl text-xs font-bold outline-none transition-all text-slate-600"
                />
             </div>
             <span className="self-center text-slate-300">-</span>
             <div className="relative">
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="pl-4 pr-2 py-3 bg-slate-50 border-transparent border focus:border-indigo-200 focus:bg-white rounded-2xl text-xs font-bold outline-none transition-all text-slate-600"
                />
             </div>
          </div>
        </div>

        {/* Report List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Available Reports</h3>
             <span className="text-xs font-bold text-slate-400">{filteredReports.length} found</span>
          </div>
          
          {loading ? (
             <div className="text-center py-12 text-slate-400">Loading reports...</div>
          ) : filteredReports.length === 0 ? (
             <div className="text-center py-12 text-slate-400">No reports found matching criteria.</div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{report.title}</h4>
                    <p className="text-xs text-slate-400 font-medium">{report.date} • {report.size} • {report.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadFile(report)}
                  className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                  title="Download File"
                >
                  {CURRENT_USER_ROLE === 'admin' ? <Download className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};