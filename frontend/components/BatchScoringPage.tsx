import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Play, Upload } from 'lucide-react';
import {
  AdaptiveThresholdConfig,
  HistoryItem,
  PredictionResult,
  RuleDefinition,
  TransactionData,
  TransactionType,
} from '../types';
import { getThresholdForTransaction } from '../services/thresholdService';
import { predictFraud } from '../services/mlService';

interface Props {
  rules: RuleDefinition[];
  thresholdConfig: AdaptiveThresholdConfig;
  onAppendHistory: (items: HistoryItem[]) => void;
  readOnly?: boolean;
}

interface BatchRow {
  rowNumber: number;
  data?: TransactionData;
  result?: PredictionResult;
  threshold?: number;
  error?: string;
}

const TEMPLATE = [
  'amount,type,oldbalanceOrg,newbalanceOrig,oldbalanceDest,newbalanceDest,country',
  '12000,CASH_OUT,18000,6000,5000,17000,US',
  '400,PAYMENT,2200,1800,100,500,IN',
  '24000,TRANSFER,25000,800,3000,26200,GB',
].join('\n');

const isTransactionType = (value: string): value is TransactionType =>
  Object.values(TransactionType).includes(value as TransactionType);

const toNumber = (raw: string): number => {
  const next = Number(raw);
  if (Number.isNaN(next)) {
    throw new Error(`Invalid number: ${raw}`);
  }
  return next;
};

const parseCsv = (text: string): BatchRow[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [{ rowNumber: 0, error: 'CSV must include a header and at least one data row.' }];
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const index = (name: string): number => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const required = ['amount', 'type', 'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest'];
  const missing = required.filter((h) => index(h) < 0);
  if (missing.length > 0) {
    return [{ rowNumber: 0, error: `Missing required columns: ${missing.join(', ')}` }];
  }

  return lines.slice(1).map((line, i) => {
    try {
      const cols = line.split(',').map((c) => c.trim());
      const type = cols[index('type')];
      if (!isTransactionType(type)) {
        throw new Error(`Invalid type "${type}"`);
      }

      const rowNumber = i + 2;
      const data: TransactionData = {
        id: `BATCH-${Date.now()}-${i + 1}`,
        timestamp: new Date(),
        amount: toNumber(cols[index('amount')]),
        type,
        oldbalanceOrg: toNumber(cols[index('oldbalanceOrg')]),
        newbalanceOrig: toNumber(cols[index('newbalanceOrig')]),
        oldbalanceDest: toNumber(cols[index('oldbalanceDest')]),
        newbalanceDest: toNumber(cols[index('newbalanceDest')]),
        country: index('country') >= 0 ? cols[index('country')] || 'US' : 'US',
      };
      return { rowNumber, data };
    } catch (error) {
      return {
        rowNumber: i + 2,
        error: error instanceof Error ? error.message : 'Row parse error',
      };
    }
  });
};

const downloadCsv = (rows: BatchRow[]) => {
  const header = 'row,transaction_id,prediction,risk_percent,threshold_percent,error';
  const lines = rows.map((row) => {
    const risk = row.result ? Math.round(row.result.probability * 100) : '';
    const threshold = row.threshold ? Math.round(row.threshold * 100) : '';
    return [
      row.rowNumber,
      row.data?.id || '',
      row.result?.prediction || '',
      risk,
      threshold,
      row.error || '',
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',');
  });

  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `batch-results-${Date.now()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const BatchScoringPage: React.FC<Props> = ({
  rules,
  thresholdConfig,
  onAppendHistory,
  readOnly = false,
}) => {
  const [country, setCountry] = useState('US');
  const [csvText, setCsvText] = useState(TEMPLATE);
  const [isRunning, setIsRunning] = useState(false);
  const [rows, setRows] = useState<BatchRow[]>([]);

  const summary = useMemo(() => {
    const valid = rows.filter((row) => row.result);
    const errors = rows.filter((row) => row.error);
    const frauds = valid.filter((row) => row.result?.prediction === 'Fraud');
    return {
      total: rows.length,
      valid: valid.length,
      errors: errors.length,
      frauds: frauds.length,
    };
  }, [rows]);

  const runBatch = async () => {
    if (readOnly) {
      return;
    }

    setIsRunning(true);
    try {
      const parsed = parseCsv(csvText);
      const scored: BatchRow[] = [];
      const historyRows: HistoryItem[] = [];

      for (const row of parsed) {
        if (!row.data || row.error) {
          scored.push(row);
          continue;
        }

        const { threshold } = getThresholdForTransaction(
          row.data,
          thresholdConfig,
          row.data.country || country,
        );
        const result = await predictFraud(row.data, {
          threshold,
          country: row.data.country || country,
          rules,
          simulateLatency: false,
        });

        const nextRow: BatchRow = { ...row, result, threshold };
        scored.push(nextRow);
        historyRows.push({ data: row.data, result });
      }

      setRows(scored);
      if (historyRows.length > 0) {
        onAppendHistory(historyRows);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="col-span-12 space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              Batch Scoring
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Upload CSV payloads and score multiple transactions in one run.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
            >
              <option value="US">US</option>
              <option value="IN">IN</option>
              <option value="GB">GB</option>
              <option value="EU">EU</option>
            </select>
            <label className="flex items-center px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
              <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={runBatch}
              disabled={isRunning || readOnly}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Scoring...' : 'Run Batch'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2">
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              disabled={readOnly}
              className="w-full h-64 p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-700 outline-none focus:bg-white focus:border-indigo-300"
            />
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rows</p>
              <p className="text-2xl font-black text-slate-800">{summary.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                Valid
              </p>
              <p className="text-2xl font-black text-emerald-700">{summary.valid}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                Errors
              </p>
              <p className="text-2xl font-black text-rose-700">{summary.errors}</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                Fraud Hits
              </p>
              <p className="text-2xl font-black text-indigo-700">{summary.frauds}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">Batch Results</h3>
            <button
              onClick={() => downloadCsv(rows)}
              disabled={rows.length === 0}
              className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Results
            </button>
          </div>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-4 py-3">Row</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Threshold</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={`row-${row.rowNumber}-${row.data?.id || 'err'}`}>
                  <td className="px-4 py-3 font-mono text-xs">{row.rowNumber}</td>
                  <td className="px-4 py-3 text-xs font-mono">{row.data?.id || '-'}</td>
                  <td className="px-4 py-3">
                    {row.result ? `${Math.round(row.result.probability * 100)}%` : '-'}
                  </td>
                  <td className="px-4 py-3">{row.threshold ? `${Math.round(row.threshold * 100)}%` : '-'}</td>
                  <td className="px-4 py-3">
                    {row.result ? (
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                          row.result.prediction === 'Fraud'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {row.result.prediction}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.error || row.result?.reasoning || '-'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                    Run a batch to see results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
