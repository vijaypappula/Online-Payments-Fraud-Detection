import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Filter, Download, AlertTriangle, CheckCircle, FileText, 
  ArrowRight, Upload, Clock, Share2, Smartphone, MapPin, 
  FileCheck, Link as LinkIcon, Shield, Activity, Calendar,
  Network, HardDrive, Lock, Eye, Fingerprint, FileJson, Trash2
} from "lucide-react";
import { HistoryItem } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface Props {
  transactions: HistoryItem[];
}

export const ForensicsSearch = ({ transactions }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'network' | 'evidence' | 'device'>('timeline');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<string[]>([]);
  
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    return transactions.filter(item => 
      item.data.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.data.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.data.amount.toString().includes(searchTerm)
    );
  }, [transactions, searchTerm]);

  useEffect(() => {
    if (filteredTransactions.length > 0) {
      if (!selectedTransactionId || !filteredTransactions.some(t => t.data.id === selectedTransactionId)) {
        setSelectedTransactionId(filteredTransactions[0].data.id);
      }
    } else {
      setSelectedTransactionId(null);
    }
  }, [filteredTransactions]);

  const selectedTransaction = useMemo(() => 
    transactions.find(t => t.data.id === selectedTransactionId),
    [transactions, selectedTransactionId]
  );

  // A simple deterministic seed generator from a string
  const getSeed = (id: string | undefined) => {
    if (!id) return 0;
    return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  };

  // Generate mock data dynamically based on selected transaction
  const deviceDetails = useMemo(() => {
    if (!selectedTransaction) return null;
    const seed = getSeed(selectedTransaction.data.id);
    const ips = ['192.168.43.21', '10.0.5.112', '172.16.31.5', '203.0.113.88'];
    const isps = ['Comcast Cable', 'Verizon Fios', 'AT&T U-verse', 'Starlink'];
    const locations = ['San Francisco, US', 'New York, US', 'London, UK', 'Tokyo, JP'];
    const oses = ['MacOS / Chrome', 'Windows / Edge', 'Android / Chrome', 'iOS / Safari'];

    return {
      ip: ips[seed % ips.length],
      isp: isps[seed % isps.length],
      location: locations[seed % locations.length],
      vpn: selectedTransaction.result.prediction === 'Fraud',
      userAgent: `Mozilla/5.0 (${oses[seed % oses.length].split(' / ')[0]}...)`,
      deviceId: `dev_${selectedTransaction.data.id.slice(0, 5)}_${(seed % 900) + 100}`,
      os: oses[seed % oses.length],
      resolution: ['2560 x 1440', '1920 x 1080', '1440 x 900', '375 x 812'][seed % 4],
    };
  }, [selectedTransaction]);

  const chainOfCustody = useMemo(() => {
    if (!selectedTransaction) return [];
    const seed = getSeed(selectedTransaction.data.id);
    return [
      { id: 1, action: 'Evidence Collected', user: 'System Auto-Capture', timestamp: new Date(selectedTransaction.data.timestamp.getTime() + 1000).toLocaleString(), hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
      { id: 2, action: 'Access Logged', user: 'Alex Carter (Auditor)', timestamp: new Date(selectedTransaction.data.timestamp.getTime() + 5000).toLocaleString(), hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' },
      ...(seed % 2 === 0 ? [{ id: 3, action: 'Metadata Extracted', user: 'Forensic Tool v2.1', timestamp: new Date(selectedTransaction.data.timestamp.getTime() + 6000).toLocaleString(), hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a' }] : [])
    ];
  }, [selectedTransaction]);

  const networkNodes = useMemo(() => {
    const center = { x: 50, y: 50 };
    const radius = 30; // percentage
    const nodes = filteredTransactions.slice(0, 8).map((item, i, arr) => {
      const angle = (i / arr.length) * 2 * Math.PI - (Math.PI / 2);
      return {
        id: item.data.id,
        user: 'User-' + item.data.id.slice(0, 4).toUpperCase(),
        amount: item.data.amount,
        type: item.data.type,
        status: item.result.prediction,
        risk: Math.round(item.result.probability * 100),
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
    });
    return { center, nodes };
  }, [filteredTransactions]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (selectedTransaction) {
      const seed = getSeed(selectedTransaction.data.id);
      const baseEvidence = [
        { id: 1, name: `server_log_${selectedTransaction.data.id.slice(0,4)}.txt`, size: '2.4 MB', type: 'Log', uploadedBy: 'System', date: selectedTransaction.data.timestamp.toLocaleString() },
        { id: 2, name: 'suspicious_ip_list.csv', size: '156 KB', type: 'CSV', uploadedBy: 'System', date: selectedTransaction.data.timestamp.toLocaleString() },
      ];
      if (seed % 2 === 0) {
        baseEvidence.push({ id: 3, name: `capture_${seed}.png`, size: '1.1 MB', type: 'Image', uploadedBy: 'Alex Carter', date: new Date(selectedTransaction.data.timestamp.getTime() + 10000).toLocaleString() });
      }
      setEvidence(baseEvidence);
    } else {
      setEvidence([]);
    }
  }, [selectedTransaction]);

  const handlePrintSummary = () => {
    alert('This would generate a printable PDF summary of the forensic investigation. For this demo, we will open the browser print dialog.');
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredTransactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forensics_case_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadClick = () => {
    if (!selectedTransaction) {
      alert("Please select a transaction first to associate evidence with.");
      return;
    }
    fileInputRef.current?.click();
  };

  const processFiles = (files: FileList) => {
    if (!selectedTransaction) {
      alert("Please select a transaction first to associate evidence with.");
      return;
    }

    const newItems = Array.from(files).map(file => {
      const url = URL.createObjectURL(file);
      blobUrlsRef.current.push(url);
      return {
        id: Date.now() + Math.random(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        uploadedBy: 'Current User',
        date: new Date().toLocaleString(),
        url: url,
        isBlob: true
      };
    });
    setEvidence(prev => [...newItems, ...prev]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset input to allow re-uploading same file
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (selectedTransaction) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteEvidence = (id: number) => {
    setEvidence(prev => {
      const item = prev.find(i => i.id === id);
      if (item && item.isBlob && item.url) {
        URL.revokeObjectURL(item.url);
        blobUrlsRef.current = blobUrlsRef.current.filter(u => u !== item.url);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleViewEvidence = (file: any) => {
    if (file.url) {
      window.open(file.url, '_blank');
    } else {
      const dummyContent = `This is mock content for ${file.name}\n\nTransaction ID: ${selectedTransactionId}\nDate: ${new Date().toLocaleString()}`;
      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  const handleDownloadEvidence = (file: any) => {
    const link = document.createElement('a');
    link.href = file.url || URL.createObjectURL(new Blob([`Mock content for ${file.name}`], { type: 'text/plain' }));
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="col-span-12 space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Search className="w-6 h-6 text-indigo-600" />
              Forensics Investigation
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Advanced analysis, evidence collection, and timeline reconstruction</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExportJSON}
              className="flex items-center px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              <FileJson className="w-4 h-4 mr-2" />
              Export JSON
            </button>
            <button
              onClick={handlePrintSummary}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Summary
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by Transaction ID, Amount, or Type..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent border focus:border-indigo-200 focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all"
            />
          </div>
          <button className="px-4 py-3 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-50 p-1.5 rounded-2xl w-fit mb-8">
          {[
            { id: 'timeline', icon: Clock, label: 'Timeline' },
            { id: 'network', icon: Network, label: 'Link Analysis' },
            { id: 'device', icon: Smartphone, label: 'IP & Device' },
            { id: 'evidence', icon: HardDrive, label: 'Evidence & Chain' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
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

        {/* Tab Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'timeline' && (
              <motion.div 
                key="timeline"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Transaction Timeline Reconstruction</h3>
                  <span className="text-xs font-bold text-slate-400">{filteredTransactions.length} Events Found</span>
                </div>
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                  {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                    <div 
                      key={t.data.id} 
                      className="relative pl-8 cursor-pointer"
                      onClick={() => setSelectedTransactionId(t.data.id)}
                    >
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${selectedTransactionId === t.data.id ? 'border-indigo-600' : 'border-white'} shadow-sm ${t.result.prediction === 'Fraud' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                      <div className={`p-5 rounded-2xl border transition-all ${
                        selectedTransactionId === t.data.id 
                          ? 'bg-white shadow-lg border-indigo-200' 
                          : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-xs font-bold text-slate-400">{t.data.timestamp.toLocaleString()}</span>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${t.result.prediction === 'Fraud' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {t.result.prediction}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 text-lg">{t.data.type}</p>
                            <p className="text-xs text-slate-500 font-medium">ID: {t.data.id}</p>
                          </div>
                          <p className="font-mono font-black text-slate-700 text-xl">${t.data.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="pl-8 text-slate-400 text-sm italic">No transactions found matching criteria.</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'network' && (
              <motion.div 
                key="network"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="h-[500px] bg-slate-900 rounded-3xl p-8 relative overflow-hidden flex items-center justify-center"
              >
                <div className="absolute top-6 left-6 z-10">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-indigo-400" />
                    Link Analysis & Trace
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Visualizing fund flow and account relationships</p>
                </div>
                
                {/* Mock Visualization */}
                <div className="relative w-full h-full">
                  <svg className="w-full h-full absolute inset-0 pointer-events-none">
                    <defs>
                      <marker id="arrow" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#6366f1" />
                      </marker>
                    </defs>
                    {networkNodes.nodes.map((node) => (
                      <line 
                        key={`link-${node.id}`}
                        x1={`${networkNodes.center.x}%`} 
                        y1={`${networkNodes.center.y}%`} 
                        x2={`${node.x}%`} 
                        y2={`${node.y}%`} 
                        stroke={node.status === 'Fraud' ? '#f43f5e' : '#334155'} 
                        strokeWidth="2" 
                        strokeOpacity="0.6"
                      />
                    ))}
                  </svg>
                  
                  {/* Central Node */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/50 z-20 border-4 border-slate-800">
                    <div className="text-center">
                      <Shield className="w-8 h-8 text-white mx-auto mb-1" />
                      <span className="text-[10px] font-black text-indigo-200 uppercase">Target</span>
                    </div>
                  </div>

                  {/* Satellite Nodes */}
                  {networkNodes.nodes.map((node) => (
                    <div 
                      key={`node-${node.id}`}
                      className={`absolute w-16 h-16 rounded-full flex items-center justify-center border-2 cursor-pointer group transition-all hover:scale-110 z-10 ${
                        node.status === 'Fraud' 
                          ? 'bg-rose-900/80 border-rose-500 hover:bg-rose-800' 
                          : 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:bg-slate-700'
                      }`}
                      style={{ 
                        left: `${node.x}%`, 
                        top: `${node.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-300 group-hover:text-white block">
                          {node.amount > 1000 ? `${(node.amount/1000).toFixed(1)}k` : node.amount}
                        </span>
                        <span className={`text-[8px] font-black uppercase ${node.status === 'Fraud' ? 'text-rose-400' : 'text-slate-500'}`}>
                          {node.type}
                        </span>
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-black/90 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                        <p className="font-bold">{node.user}</p>
                        <p>Risk: {node.risk}%</p>
                      </div>
                    </div>
                  ))}
                  
                  {networkNodes.nodes.length === 0 && (
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-16 text-slate-500 text-sm font-medium">
                        No transaction links found.
                     </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'device' && (
              <motion.div 
                key="device"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {deviceDetails ? (
                  <>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center"><MapPin className="w-4 h-4 mr-2 text-indigo-600" />Geolocation Analysis</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">IP Address</span><span className="text-sm font-mono font-bold text-slate-800">{deviceDetails.ip}</span></div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">ISP</span><span className="text-sm font-bold text-slate-800">{deviceDetails.isp}</span></div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">Location</span><span className="text-sm font-bold text-slate-800">{deviceDetails.location}</span></div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-500">VPN/Proxy</span>
                          {deviceDetails.vpn ? <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-1 rounded">DETECTED</span> : <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded">NOT DETECTED</span>}
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center"><Fingerprint className="w-4 h-4 mr-2 text-indigo-600" />Device Fingerprint</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">User Agent</span><span className="text-xs font-mono text-slate-600 truncate max-w-[150px]">{deviceDetails.userAgent}</span></div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">Device ID</span><span className="text-sm font-mono font-bold text-slate-800">{deviceDetails.deviceId}</span></div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">OS / Browser</span><span className="text-sm font-bold text-slate-800">{deviceDetails.os}</span></div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-500">Screen Res</span><span className="text-sm font-bold text-slate-800">{deviceDetails.resolution}</span></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2 text-center py-12 text-slate-400">
                    <p>Select a transaction from the timeline to view device details.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'evidence' && (
              <motion.div 
                key="evidence"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Upload Section */}
                <div 
                  onClick={handleUploadClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer group ${
                    isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="file" 
                    multiple
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">Upload Evidence</h3>
                  <p className="text-sm text-slate-400 mt-1">Drag & drop logs, screenshots, or documents here</p>
                </div>

                {/* Evidence List */}
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Collected Evidence</h3>
                  <div className="grid grid-cols-1 gap-3 min-h-[50px]">
                    {evidence.length > 0 ? evidence.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{file.name}</p>
                            <p className="text-xs text-slate-400">{file.type} • {file.size} • Uploaded by {file.uploadedBy}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleViewEvidence(file)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDownloadEvidence(file)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Download className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteEvidence(file.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-slate-400 text-sm italic py-4">No evidence collected for this transaction.</p>
                    )}
                  </div>
                </div>

                {/* Chain of Custody */}
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Chain of Custody Log
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                        <tr>
                          <th className="px-6 py-3">Timestamp</th>
                          <th className="px-6 py-3">Action</th>
                          <th className="px-6 py-3">User / System</th>
                          <th className="px-6 py-3">Integrity Hash</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {chainOfCustody.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3 font-mono text-xs">{log.timestamp}</td>
                            <td className="px-6 py-3 font-bold text-slate-700">{log.action}</td>
                            <td className="px-6 py-3">{log.user}</td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                                <Lock className="w-3 h-3" />
                                <span className="text-[10px] font-mono font-bold truncate max-w-[100px]">{log.hash}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};