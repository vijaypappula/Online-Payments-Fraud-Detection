import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle, FileText, Clock, ChevronRight,
  Lock, Globe, UserCheck, Search, Flag, Settings, FileInput, Database,
  Users, AlertOctagon, Scale, FileOutput, List, Filter, Download, Eye,
  FileJson, Siren, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Regulation = { id: string; name: string; description: string; status: string; score: number; lastAudit: string; icon: React.ElementType; };
export const ComplianceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'screening' | 'risk' | 'reports'>('overview');

  const regulations = [
    {
      id: 'pci',
      name: 'PCI DSS v4.0',
      description: 'Payment Card Industry Data Security Standard',
      status: 'Compliant',
      score: 100,
      lastAudit: '2024-03-10',
      icon: Lock
    },
    {
      id: 'gdpr',
      name: 'GDPR Privacy',
      description: 'General Data Protection Regulation (EU)',
      status: 'Review',
      score: 85,
      lastAudit: '2024-03-08',
      icon: Globe
    },
    {
      id: 'aml',
      name: 'AML / KYC',
      description: 'Anti-Money Laundering & Know Your Customer',
      status: 'Compliant',
      score: 98,
      lastAudit: '2024-03-11',
      icon: ShieldCheck
    },
    {
      id: 'sox',
      name: 'SOX Compliance',
      description: 'Sarbanes-Oxley Act Section 404',
      status: 'Warning',
      score: 72,
      lastAudit: '2024-02-28',
      icon: FileText
    }
  ];

  const screeningAlerts = [
    { id: 1, name: 'Robert M. P.', type: 'Sanction Match', list: 'OFAC SDNT', match: '98%', status: 'Open', date: '2024-03-15' },
    { id: 2, name: 'Elena V.', type: 'PEP', list: 'EU PEP List', match: '100%', status: 'Review', date: '2024-03-14' },
    { id: 3, name: 'Oceanic Trade Ltd', type: 'Adverse Media', list: 'Global News', match: '85%', status: 'Open', date: '2024-03-14' },
  ];

  const amlRules = [
    { id: 'R-001', name: 'Large Cash Transaction', threshold: '> $10,000', risk: 'High', status: 'Active' },
    { id: 'R-002', name: 'Structuring (Smurfing)', threshold: 'Freq > 3 / 24h', risk: 'High', status: 'Active' },
    { id: 'R-003', name: 'High Risk Country Inflow', threshold: 'Any Amount', risk: 'Critical', status: 'Monitoring' },
    { id: 'R-004', name: 'Rapid Movement of Funds', threshold: 'In/Out < 1h', risk: 'Medium', status: 'Active' },
  ];

  const documents = [
    { name: 'AML_Policy_v2.4.pdf', type: 'Policy', size: '2.4 MB', date: '2024-01-15' },
    { name: 'KYC_Procedures_2024.docx', type: 'Procedure', size: '1.1 MB', date: '2024-02-20' },
    { name: 'SAR_Template_FinCEN.pdf', type: 'Template', size: '500 KB', date: '2023-11-10' },
    { name: 'Risk_Assessment_Q1.xlsx', type: 'Report', size: '3.2 MB', date: '2024-03-01' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'Compliant' || status === 'Active') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Review' || status === 'Monitoring') return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedRegulation, setSelectedRegulation] = useState<Regulation | null>(null);
  const blobUrlsRef = useRef<string[]>([]);

  const [uploadedDocs, setUploadedDocs] = useState(() => {
    const initialDocs = documents.map(doc => {
      const mockContent = `This is a mock document for: ${doc.name}\n\nContent is for demonstration purposes.`;
      const blob = new Blob([mockContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      blobUrlsRef.current.push(url);
      return { ...doc, url };
    });
    return initialDocs;
  });
  const [rules, setRules] = useState(amlRules);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    const newDocs = files.map(file => {
      const url = URL.createObjectURL(file);
      blobUrlsRef.current.push(url);
      return {
        name: file.name,
        type: 'Uploaded',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        date: new Date().toISOString().split('T')[0],
        url: url
      };
    });

    setUploadedDocs(prev => [...newDocs, ...prev]);
    e.target.value = '';
  };

  const handleDownloadDoc = (doc: any) => {
    if (!doc.url) return;
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewDoc = (doc: any) => {
    if (doc.url) window.open(doc.url, '_blank');
  };

  const toggleRuleStatus = (id: string) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === id
          ? { ...rule, status: rule.status === 'Active' ? 'Disabled' : 'Active' }
          : rule
      )
    );
  };

const generateSAR = () => {
  const content = `
SUSPICIOUS ACTIVITY REPORT
Generated: ${new Date().toLocaleString()}

Flagged Alerts:
${screeningAlerts.map(a => `- ${a.name} (${a.type}) Match: ${a.match}`).join('\n')}

System Generated Compliance Summary.
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `SAR_Report_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

  return (
    <div className="col-span-12 space-y-6">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              Compliance & Risk
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Regulatory monitoring, screening, and reporting hub</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Score</p>
                <p className="text-2xl font-black text-emerald-600">94/100</p>
             </div>
             <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-50">
                <span className="text-xl font-bold text-emerald-700">A+</span>
             </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-50 p-1.5 rounded-2xl w-fit mb-8 overflow-x-auto">
          {[
            { id: 'overview', icon: Scale, label: 'Overview' },
            { id: 'screening', icon: UserCheck, label: 'Screening & Checks' },
            { id: 'risk', icon: AlertOctagon, label: 'Risk & Rules' },
            { id: 'reports', icon: FileOutput, label: 'Reports & Docs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {regulations.map((reg) => (
                <div
                  key={reg.id}
                  className="p-6 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => setSelectedRegulation(reg)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                      <reg.icon className="w-6 h-6" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getStatusColor(reg.status)}`}>
                      {reg.status === 'Compliant' && <CheckCircle className="w-3 h-3" />}
                      {reg.status === 'Review' && <Clock className="w-3 h-3" />}
                      {reg.status === 'Warning' && <AlertTriangle className="w-3 h-3" />}
                      {reg.status}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{reg.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-6">{reg.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Adherence Score</span>
                      <span>{reg.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getScoreColor(reg.score)}`} 
                        style={{ width: `${reg.score}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                       <span className="text-[10px] text-slate-400 font-bold">Last Audit: {reg.lastAudit}</span>
                       <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'screening' && (
            <motion.div
              key="screening"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                  <div className="flex items-center gap-3 mb-2 text-rose-600">
                    <Siren className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Sanctions Hits</h3>
                  </div>
                  <p className="text-3xl font-black text-slate-800">12 <span className="text-xs font-bold text-rose-500">+2 today</span></p>
                </div>
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                  <div className="flex items-center gap-3 mb-2 text-amber-600">
                    <UserCheck className="w-5 h-5" />
                    <h3 className="font-bold text-sm">PEP Matches</h3>
                  </div>
                  <p className="text-3xl font-black text-slate-800">5 <span className="text-xs font-bold text-amber-500">Pending</span></p>
                </div>
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <div className="flex items-center gap-3 mb-2 text-indigo-600">
                    <Globe className="w-5 h-5" />
                    <h3 className="font-bold text-sm">High-Risk Countries</h3>
                  </div>
                  <p className="text-3xl font-black text-slate-800">8 <span className="text-xs font-bold text-indigo-500">Active</span></p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Screening Alerts Queue</h3>
                  <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
                </div>
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-6 py-3">Entity Name</th>
                      <th className="px-6 py-3">Alert Type</th>
                      <th className="px-6 py-3">List Source</th>
                      <th className="px-6 py-3">Match %</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {screeningAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-white transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{alert.name}</td>
                        <td className="px-6 py-4">{alert.type}</td>
                        <td className="px-6 py-4 text-xs font-mono">{alert.list}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-200 px-2 py-1 rounded-lg text-xs font-bold">{alert.match}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                            alert.status === 'Open' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'risk' && (
            <motion.div
              key="risk"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-indigo-600" />
                    AML Rule Configuration
                  </h3>
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div key={rule.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{rule.name}</p>
                          <p className="text-xs text-slate-400 mt-1">Threshold: {rule.threshold}</p>
                        </div>
                        <div className="text-right">
                          <span className={`block text-[10px] font-black uppercase mb-1 ${
                            rule.risk === 'Critical' ? 'text-rose-500' : rule.risk === 'High' ? 'text-orange-500' : 'text-amber-500'
                          }`}>{rule.risk} Risk</span>
                          <div
  onClick={() => toggleRuleStatus(rule.id)}
  className={`w-10 h-5 rounded-full ml-auto cursor-pointer transition-colors ${
    rule.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
  }`}
>
  <div
    className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
      rule.status === 'Active' ? 'translate-x-5' : 'translate-x-1'
    }`}
  />
</div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-indigo-600" />
                    Risk-Based Customer Classification
                  </h3>
                  <div className="space-y-4">
                    {['Low Risk', 'Medium Risk', 'High Risk'].map((level, i) => (
                      <div key={level} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>{level}</span>
                          <span>{[65, 25, 10][i]}% of Base</span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${[65, 25, 10][i]}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        <strong>Note:</strong> Customer risk profiles are automatically updated daily based on transaction behavior, KYC data changes, and screening hits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200">
                  <h3 className="font-bold text-lg mb-2">Generate STR / SAR</h3>
                  <p className="text-indigo-100 text-sm mb-6">Create Suspicious Transaction Reports based on flagged cases.</p>
                  <button 
                    onClick={generateSAR}
                    className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    Start New Report
                  </button>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-lg shadow-slate-200">
                  <h3 className="font-bold text-lg mb-2">Regulatory Upload</h3>
                  <p className="text-slate-400 text-sm mb-6">Securely store and categorize compliance documents.</p>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={handleUploadClick}
                    className="w-full py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 flex items-center justify-center gap-2"
                  >
                    <FileInput className="w-4 h-4" /> Upload Document
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4">Document Repository</h3>
                <div className="space-y-3">
                  {uploadedDocs.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{doc.name}</p>
                          <p className="text-xs text-slate-400">{doc.type} • {doc.size} • {doc.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handlePreviewDoc(doc)} className="p-2 text-slate-400 hover:text-indigo-600"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDownloadDoc(doc)} className="p-2 text-slate-400 hover:text-indigo-600"><Download className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedRegulation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRegulation(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl border border-slate-200/60 relative"
            >
              <button onClick={() => setSelectedRegulation(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                  <selectedRegulation.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{selectedRegulation.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{selectedRegulation.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">Status</span><span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(selectedRegulation.status)}`}>{selectedRegulation.status}</span></div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">Adherence Score</span><span className="text-sm font-mono font-bold text-slate-800">{selectedRegulation.score}%</span></div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">Last Audit Date</span><span className="text-sm font-mono font-bold text-slate-800">{selectedRegulation.lastAudit}</span></div>
              </div>
              <button onClick={() => setSelectedRegulation(null)} className="mt-8 w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};