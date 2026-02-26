import React, { useMemo } from 'react';
import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, LineChart } from 'lucide-react';
import { AnalystFeedbackItem, HistoryItem } from '../types';
import { buildModelMonitoringSnapshot, feedbackLabelText } from '../services/feedbackService';

interface Props {
  history: HistoryItem[];
  feedback: AnalystFeedbackItem[];
}

export const ModelMonitoringPage: React.FC<Props> = ({ history, feedback }) => {
  const snapshot = useMemo(
    () => buildModelMonitoringSnapshot(history, feedback),
    [history, feedback],
  );

  const recentFeedback = feedback.slice(0, 8);

  const cardClass =
    'p-6 rounded-2xl border border-slate-100 bg-slate-50';

  return (
    <div className="col-span-12 space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-indigo-600" />
              Model Monitoring
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Drift tracking, precision proxy, and analyst label coverage.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Coverage
            </p>
            <p className="text-2xl font-black text-indigo-600">{snapshot.labelCoverage}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className={cardClass}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Total Predictions
            </p>
            <p className="text-3xl font-black text-slate-800">{snapshot.totalPredictions}</p>
          </div>
          <div className={cardClass}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Precision Proxy
            </p>
            <p className="text-3xl font-black text-emerald-600">{snapshot.precisionEstimate}%</p>
          </div>
          <div className={cardClass}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              False Positive Rate
            </p>
            <p className="text-3xl font-black text-rose-600">{snapshot.falsePositiveRate}%</p>
          </div>
          <div className={cardClass}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Drift Score
            </p>
            <p className="text-3xl font-black text-amber-600">{snapshot.driftScore}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-5 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-indigo-600" />
              Type-Level Performance
            </h3>
            <div className="space-y-4">
              {snapshot.byType.map((row) => {
                const labeledRatio = row.total > 0 ? (row.labeled / row.total) * 100 : 0;
                const fraudRatio = row.labeled > 0 ? (row.confirmedFraud / row.labeled) * 100 : 0;
                return (
                  <div key={row.type} className="p-4 rounded-xl bg-white border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-slate-700">{row.type}</p>
                      <p className="text-xs font-bold text-slate-400">{row.total} tx</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          <span>Labeled Coverage</span>
                          <span>{Math.round(labeledRatio)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.max(2, labeledRatio)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          <span>Confirmed Fraud Ratio</span>
                          <span>{Math.round(fraudRatio)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.max(2, fraudRatio)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Latest Analyst Feedback
            </h3>
            <div className="space-y-3">
              {recentFeedback.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                  No analyst feedback submitted yet.
                </div>
              )}
              {recentFeedback.map((item) => {
                const label = feedbackLabelText[item.label];
                const color =
                  item.label === 'confirmed_fraud'
                    ? 'text-emerald-700 bg-emerald-50'
                    : item.label === 'false_positive'
                      ? 'text-rose-700 bg-rose-50'
                      : 'text-amber-700 bg-amber-50';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white border border-slate-100 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-700">{item.transactionId}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Analyst: {item.analyst} | Risk: {Math.round(item.probability * 100)}%
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${color}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-100 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-black text-slate-700">{snapshot.confirmedFraud}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Confirmed</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-100 text-center">
                <AlertTriangle className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                <p className="text-xs font-black text-slate-700">{snapshot.falsePositive}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">False Pos</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-100 text-center">
                <Activity className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <p className="text-xs font-black text-slate-700">{snapshot.needsReview}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Review</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
