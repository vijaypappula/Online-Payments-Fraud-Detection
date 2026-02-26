import React from 'react';
import { AnalystFeedbackLabel, PredictionResult } from '../types';
import { ShieldAlert, ShieldCheck, Link2, Info, ArrowUpRight, Tag, SlidersHorizontal, CheckCircle2, AlertTriangle, Clock3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  result: PredictionResult;
  amount?: number;
  currencySymbol?: string;
  feedbackLabel?: AnalystFeedbackLabel | null;
  onFeedback?: (label: AnalystFeedbackLabel) => void;
  readOnly?: boolean;
}

export const ResultDisplay: React.FC<Props> = ({
  result,
  amount,
  currencySymbol = '$',
  feedbackLabel = null,
  onFeedback,
  readOnly = false,
}) => {
  const isFraud = result.prediction === 'Fraud';
  const prob = Math.round(result.probability * 100);

  return (
    <div className="w-full bg-white p-8 rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden relative">
      <div className={`absolute top-0 right-0 p-12 opacity-5 ${isFraud ? 'text-rose-500' : 'text-emerald-500'}`}>
        {isFraud ? <ShieldAlert size={200} /> : <ShieldCheck size={200} />}
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div>
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full mb-4 text-[10px] font-black uppercase tracking-[0.2em] ${
              isFraud ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {isFraud ? 'High Risk Alert' : 'Transaction Secure'}
            </div>
            <h3 className={`text-6xl font-black tracking-tight ${isFraud ? 'text-rose-600' : 'text-emerald-600'}`}>
              {result.prediction}
            </h3>
            {amount !== undefined && (
              <p className="text-3xl font-bold text-slate-700 mt-2 font-mono">{currencySymbol}{amount.toLocaleString()}</p>
            )}
          </div>
          
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 min-w-[160px] text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Threat Score</p>
            <div className="text-5xl font-black text-slate-800">{prob}%</div>
          </div>
        </div>

        {/* Risk Metrics Breakdown */}
        {result.riskMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { label: 'Velocity', val: result.riskMetrics.velocity },
              { label: 'Anomaly', val: result.riskMetrics.anomaly },
              { label: 'Behavioral', val: result.riskMetrics.behavioral }
            ].map(m => (
              <div key={m.label} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  <span>{m.label}</span>
                  <span>{Math.round(m.val * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${m.val * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${isFraud ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {(result.thresholdUsed !== undefined || result.matchedRules?.length) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                <SlidersHorizontal className="w-3 h-3 mr-2" />
                Decision Context
              </p>
              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  Threshold Used:{' '}
                  <span className="font-black text-slate-800">
                    {result.thresholdUsed !== undefined ? `${Math.round(result.thresholdUsed * 100)}%` : 'N/A'}
                  </span>
                </p>
                <p>
                  Decision Source:{' '}
                  <span className="font-black text-slate-800">
                    {result.decisionSource || 'model'}
                  </span>
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                <Tag className="w-3 h-3 mr-2" />
                Matched Rules
              </p>
              {result.matchedRules && result.matchedRules.length > 0 ? (
                <div className="space-y-2">
                  {result.matchedRules.map((rule) => (
                    <div key={rule.ruleId} className="text-xs font-bold text-slate-600 bg-white border border-slate-100 rounded-lg px-3 py-2">
                      {rule.ruleName} ({rule.action})
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No override rules matched this transaction.</p>
              )}
            </div>
          </div>
        )}

        {result.reasonCodes && result.reasonCodes.length > 0 && (
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
              <Tag className="w-3 h-3 mr-2" />
              Top Reason Codes
            </p>
            <div className="space-y-3">
              {result.reasonCodes.map((reason) => (
                <div key={reason.code} className="bg-white border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-slate-700">{reason.title}</p>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {Math.round(reason.score * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{reason.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {onFeedback && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Analyst Feedback Loop
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                disabled={readOnly}
                onClick={() => onFeedback('confirmed_fraud')}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wide border transition-colors ${
                  feedbackLabel === 'confirmed_fraud'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmed Fraud
              </button>
              <button
                disabled={readOnly}
                onClick={() => onFeedback('false_positive')}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wide border transition-colors ${
                  feedbackLabel === 'false_positive'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                <AlertTriangle className="w-4 h-4" />
                False Positive
              </button>
              <button
                disabled={readOnly}
                onClick={() => onFeedback('needs_review')}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wide border transition-colors ${
                  feedbackLabel === 'needs_review'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                <Clock3 className="w-4 h-4" />
                Needs Review
              </button>
            </div>
            {readOnly && (
              <p className="text-[11px] text-amber-600 font-bold mt-3">
                Feedback submission is disabled for read-only role.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
              <Info className="w-3 h-3 mr-2" />
              Expert Insight
            </p>
            <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
              "{result.reasoning}"
            </p>
          </div>

          <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center">
              <Link2 className="w-3 h-3 mr-2" />
              Verified Documentation
            </p>
            <div className="space-y-2">
              {result.sources && result.sources.length > 0 ? result.sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" className="flex items-center text-xs font-bold text-indigo-600 hover:underline">
                  <ArrowUpRight className="w-3 h-3 mr-2" />
                  <span className="truncate">{s.title || s.uri}</span>
                </a>
              )) : <p className="text-[10px] text-slate-400 italic">No external grounding required.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
