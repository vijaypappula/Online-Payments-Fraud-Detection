
import React, { useState } from 'react';
import { TransactionData, TransactionType } from '../types';

interface Props {
  onSubmit: (data: TransactionData) => void;
  isLoading: boolean;
  currencySymbol?: string;
  readOnly?: boolean;
}

export const TransactionForm: React.FC<Props> = ({ onSubmit, isLoading, currencySymbol = '$', readOnly = false }) => {
  const [formData, setFormData] = useState<Omit<TransactionData, 'id' | 'timestamp'>>({
    amount: 0,
    type: TransactionType.PAYMENT,
    oldbalanceOrg: 0,
    newbalanceOrig: 0,
    oldbalanceDest: 0,
    newbalanceDest: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'type' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      return;
    }
    onSubmit({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    });
  };

  const inputClass = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm";
  const labelClass = "block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Transaction Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className={inputClass} disabled={isLoading || readOnly}>
            {Object.values(TransactionType).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Amount ({currencySymbol})</label>
          <input type="number" name="amount" placeholder="0.00" required step="0.01" onChange={handleChange} className={inputClass} disabled={isLoading || readOnly} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Origin Account</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Old Bal</label>
              <input type="number" name="oldbalanceOrg" required onChange={handleChange} className={inputClass} disabled={isLoading || readOnly} />
            </div>
            <div>
              <label className={labelClass}>New Bal</label>
              <input type="number" name="newbalanceOrig" required onChange={handleChange} className={inputClass} disabled={isLoading || readOnly} />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Destination Account</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Old Bal</label>
              <input type="number" name="oldbalanceDest" required onChange={handleChange} className={inputClass} disabled={isLoading || readOnly} />
            </div>
            <div>
              <label className={labelClass}>New Bal</label>
              <input type="number" name="newbalanceDest" required onChange={handleChange} className={inputClass} disabled={isLoading || readOnly} />
            </div>
          </div>
        </div>
      </div>

      {readOnly && (
        <div className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-4 py-3 rounded-xl">
          Read-only role: transaction submission is disabled.
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || readOnly}
        className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${
          isLoading || readOnly ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
        }`}
      >
        {isLoading ? 'ANALYZING DATABASE...' : readOnly ? 'READ-ONLY MODE' : 'RUN FRAUD CHECK'}
      </button>
    </form>
  );
};
