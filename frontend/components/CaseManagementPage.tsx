import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Briefcase, AlertCircle, CheckCircle, Clock, User, 
  MessageSquare, Paperclip, Link as LinkIcon, 
  MoreHorizontal, Filter, Plus, Search,
  ArrowUpRight, ShieldAlert, FileText, X,
  ChevronRight, AlertTriangle, Send, Flag
} from 'lucide-react';
import { Case } from '../types';
import * as caseService from '../services/caseService';

// Extended types to support new features locally
interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Evidence {
  id: string;
  name: string;
  size: string;
  type: string;
}

interface ExtendedCase extends Case {
  category: 'Account Takeover' | 'Payment Fraud' | 'Money Laundering' | 'Identity Theft';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  assignee: string;
  slaDue: string;
  notes: Comment[];
  evidence: Evidence[];
  relatedCases: string[];
}

const MOCK_USERS = ['Alex Carter', 'Sarah Jenkins', 'System Admin', 'Unassigned'];

export const CaseManagementPage: React.FC = () => {
  const [cases, setCases] = useState<ExtendedCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [newCaseData, setNewCaseData] = useState({
    summary: '',
    description: '',
    priority: 'Medium' as ExtendedCase['priority'],
    category: 'Payment Fraud' as ExtendedCase['category'],
    assignee: 'Unassigned'
  });

  // Detail View State
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'evidence'>('overview');
  const [newNote, setNewNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const enrichCaseData = (c: Case): ExtendedCase => {
    // Deterministic mock data generation based on ID char codes
    const seed = c.id.charCodeAt(0) || 0;
    const priorities: ExtendedCase['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
    const categories: ExtendedCase['category'][] = ['Payment Fraud', 'Account Takeover', 'Money Laundering', 'Identity Theft'];
    
    return {
      ...c,
      category: categories[seed % categories.length],
      priority: priorities[seed % priorities.length],
      assignee: c.status === 'New' ? 'Unassigned' : 'Alex Carter',
      slaDue: new Date(new Date(c.created_at).getTime() + 86400000 * 2).toISOString(),
      notes: [
        { id: '1', author: 'System', text: 'Case automatically created based on risk score > 85.', timestamp: c.created_at }
      ],
      evidence: [
        { id: 'e1', name: 'suspicious_activity_log.csv', size: '2.4 MB', type: 'CSV' }
      ],
      relatedCases: seed % 2 === 0 ? ['CASE-88291'] : []
    };
  };

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const fetchedCases = await caseService.getCases();
      // Transform to extended cases
      const extended = fetchedCases.map(enrichCaseData);
      setCases(extended);
      if (extended.length > 0 && !selectedCaseId) {
        setSelectedCaseId(extended[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch cases', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock creation to ensure UI works without backend
    const mockId = `CASE-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    const timestamp = new Date().toISOString();
    
    const newCaseMock = {
      id: mockId,
      summary: newCaseData.summary,
      description: newCaseData.description,
      status: 'Open',
      created_at: timestamp,
    } as unknown as Case;

    const extendedNewCase: ExtendedCase = {
      ...enrichCaseData(newCaseMock),
      priority: newCaseData.priority,
      category: newCaseData.category,
      assignee: newCaseData.assignee,
      status: 'Open', // Default status
      notes: [{ id: 'init', author: 'System', text: 'Case created manually.', timestamp }]
    };

    setCases([extendedNewCase, ...cases]);
    setIsCreating(false);
    setSelectedCaseId(extendedNewCase.id);
    setNewCaseData({ summary: '', description: '', priority: 'Medium', category: 'Payment Fraud', assignee: 'Unassigned' });
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedCaseId) return;
    
    setCases(prev => prev.map(c => {
      if (c.id === selectedCaseId) {
        return {
          ...c,
          notes: [...c.notes, {
            id: Math.random().toString(36).substr(2, 9),
            author: 'Alex Carter', // Current user
            text: newNote,
            timestamp: new Date().toISOString()
          }]
        };
      }
      return c;
    }));
    setNewNote('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedCaseId) {
      addEvidenceFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0] && selectedCaseId) {
      addEvidenceFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addEvidenceFile = (file: File) => {
    const newFile: Evidence = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE'
    };
    setCases(prev => prev.map(c => c.id === selectedCaseId ? {
      ...c,
      evidence: [newFile, ...c.evidence]
    } : c));
  };

  const handleDownloadEvidence = (evidence: Evidence) => {
    const element = document.createElement("a");
    const file = new Blob(["Mock content for " + evidence.name], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = evidence.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const updateCaseStatus = (id: string, status: string) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const updateCaseAssignee = (id: string, assignee: string) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, assignee } : c));
  };

  const selectedCase = useMemo(() => cases.find(c => c.id === selectedCaseId), [cases, selectedCaseId]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => 
      c.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cases, searchTerm]);

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'Critical': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'Open': return 'bg-blue-500';
      case 'Under Review': return 'bg-amber-500';
      case 'Escalated': return 'bg-rose-500';
      case 'Closed': return 'bg-slate-500';
      default: return 'bg-indigo-500';
    }
  };

  const getSLAStatus = (dueDate: string) => {
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const hoursLeft = Math.ceil((due - now) / (1000 * 60 * 60));
    const totalHours = 48; // Assuming 48h standard SLA
    const progress = Math.min(100, Math.max(0, ((totalHours - hoursLeft) / totalHours) * 100));
    return { hoursLeft, progress };
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col md:flex-row gap-6 p-6">
      {/* Left Sidebar: Case List */}
      <div className="w-full md:w-[400px] flex flex-col bg-white rounded-[2rem] shadow-xl border border-slate-200/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Cases
            </h2>
            <button 
              onClick={() => setIsCreating(true)}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search cases..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent border focus:border-indigo-200 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredCases.map(c => (
            <div 
              key={c.id}
              onClick={() => { setSelectedCaseId(c.id); setIsCreating(false); }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
                selectedCaseId === c.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'bg-white border-slate-100 hover:border-indigo-100'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-[10px] font-bold text-slate-400">#{c.id.slice(0, 8)}</span>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(c.status)}`}></span>
              </div>
              <h4 className="font-bold text-slate-700 text-sm mb-1 line-clamp-1">{c.summary}</h4>
              <div className="flex items-center gap-2 mt-3">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border ${getPriorityColor(c.priority)}`}>
                  {c.priority}
                </span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Detail View or Create Form */}
      <div className="flex-grow bg-white rounded-[2rem] shadow-xl border border-slate-200/60 overflow-hidden flex flex-col">
        {isCreating ? (
          <div className="p-8 max-w-2xl mx-auto w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800">Create New Case</h2>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCase} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Summary</label>
                <input
                  required
                  value={newCaseData.summary}
                  onChange={e => setNewCaseData({...newCaseData, summary: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder="Brief summary of the incident"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Priority</label>
                  <select 
                    value={newCaseData.priority}
                    onChange={e => setNewCaseData({...newCaseData, priority: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Category</label>
                  <select 
                    value={newCaseData.category}
                    onChange={e => setNewCaseData({...newCaseData, category: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option>Payment Fraud</option>
                    <option>Account Takeover</option>
                    <option>Money Laundering</option>
                    <option>Identity Theft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  rows={6}
                  value={newCaseData.description}
                  onChange={e => setNewCaseData({...newCaseData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Detailed description..."
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
                  Create Case
                </button>
              </div>
            </form>
          </div>
        ) : selectedCase ? (
          <>
            {/* Case Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-400">CASE-{selectedCase.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${getPriorityColor(selectedCase.priority)}`}>
                      {selectedCase.priority} Priority
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 mb-2">{selectedCase.summary}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={selectedCase.status}
                    onChange={(e) => updateCaseStatus(selectedCase.id, e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                  >
                    <option>Open</option>
                    <option>Under Review</option>
                    <option>Escalated</option>
                    <option>Closed</option>
                  </select>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assignee</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <select 
                      value={selectedCase.assignee}
                      onChange={(e) => updateCaseAssignee(selectedCase.id, e.target.value)}
                      className="bg-transparent font-bold text-slate-700 text-sm outline-none cursor-pointer w-full"
                    >
                      {MOCK_USERS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</p>
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    {selectedCase.category}
                  </div>
                </div>
                {(() => {
                  const { hoursLeft, progress } = getSLAStatus(selectedCase.slaDue);
                  return (
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SLA Status</p>
                        <span className={`text-[10px] font-bold ${hoursLeft < 12 ? 'text-rose-500' : 'text-emerald-500'}`}>{hoursLeft > 0 ? `${hoursLeft}h Remaining` : 'Overdue'}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${hoursLeft < 12 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-8">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'notes', label: 'Notes & Comments', icon: MessageSquare },
                { id: 'evidence', label: 'Evidence', icon: Paperclip },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto p-8 bg-slate-50/30">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Description</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {selectedCase.description || "No description provided."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Related Cases</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCase.relatedCases.length > 0 ? selectedCase.relatedCases.map(rcId => (
                        <div key={rcId} className="p-4 bg-white rounded-xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              <LinkIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-700 text-sm">{rcId}</p>
                              <p className="text-xs text-slate-400">Suspicious Link</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                        </div>
                      )) : (
                        <div className="col-span-2 text-slate-400 text-sm italic">No related cases linked.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="flex flex-col h-full">
                  <div className="flex-grow space-y-4 mb-6">
                    {selectedCase.notes.length === 0 && (
                      <div className="text-center text-slate-400 text-sm py-8">No notes yet. Start the discussion.</div>
                    )}
                    {selectedCase.notes.map((note, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {note.author.charAt(0)}
                        </div>
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm max-w-[80%]">
                          <div className="flex justify-between items-center mb-2 gap-4">
                            <span className="font-bold text-slate-700 text-xs">{note.author}</span>
                            <span className="text-[10px] text-slate-400">{new Date(note.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 text-sm">{note.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-2">
                    <input 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                      placeholder="Add an internal note..."
                      className="flex-grow px-4 py-2 bg-transparent outline-none text-sm"
                    />
                    <button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect} 
                    />
                    <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">Drop files here to attach evidence</p>
                    <p className="text-xs text-slate-400 mt-1">Logs, Screenshots, PDF Reports</p>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedCase.evidence.length > 0 ? selectedCase.evidence.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{ev.name}</p>
                            <p className="text-xs text-slate-400">{ev.size} • {ev.type}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDownloadEvidence(ev)} className="text-indigo-600 text-xs font-bold hover:underline">Download</button>
                      </div>
                    )) : (
                      <div className="text-center text-slate-400 text-sm py-8">No evidence uploaded yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Briefcase className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold">Select a case to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};