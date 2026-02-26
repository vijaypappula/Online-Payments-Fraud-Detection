import React, { useEffect, useState } from 'react';
import { Plus, Save, Shield, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { RuleDefinition, TransactionType } from '../types';

interface Props {
  rules: RuleDefinition[];
  onSaveRules: (rules: RuleDefinition[]) => void;
  readOnly?: boolean;
}

const emptyRule = (): RuleDefinition => ({
  id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  enabled: true,
  severity: 'medium',
  action: 'boost_score',
  boost: 0.08,
  minAmount: 1000,
  transactionType: 'ANY',
  country: 'ANY',
  minVelocity: 0.7,
});

export const RuleBuilderPage: React.FC<Props> = ({ rules, onSaveRules, readOnly = false }) => {
  const [draftRules, setDraftRules] = useState<RuleDefinition[]>(rules);
  const [newRule, setNewRule] = useState<RuleDefinition>(emptyRule());

  useEffect(() => {
    setDraftRules(rules);
  }, [rules]);

  const updateRule = (id: string, patch: Partial<RuleDefinition>) => {
    setDraftRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (id: string) => {
    setDraftRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  const addRule = () => {
    if (!newRule.name.trim()) {
      return;
    }
    setDraftRules((prev) => [{ ...newRule, name: newRule.name.trim() }, ...prev]);
    setNewRule(emptyRule());
  };

  const saveAll = () => {
    onSaveRules(draftRules);
  };

  const severityColor = (severity: RuleDefinition['severity']): string => {
    switch (severity) {
      case 'critical':
        return 'text-rose-600 bg-rose-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-emerald-600 bg-emerald-50';
    }
  };

  return (
    <div className="col-span-12 space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-600" />
              Rule Builder
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Create override rules to force decisions or boost risk scores.
            </p>
          </div>
          <button
            onClick={saveAll}
            disabled={readOnly}
            className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Rule Set
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-4">
            {draftRules.length === 0 && (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium">
                No rules configured.
              </div>
            )}

            {draftRules.map((rule) => (
              <div key={rule.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      disabled={readOnly}
                      onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                      className="text-slate-400 hover:text-indigo-600 disabled:opacity-50"
                      title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-7 h-7 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-400" />
                      )}
                    </button>
                    <input
                      value={rule.name}
                      onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                      disabled={readOnly}
                      className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-700 w-full md:w-80"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${severityColor(rule.severity)}`}
                    >
                      {rule.severity}
                    </span>
                    <button
                      disabled={readOnly}
                      onClick={() => removeRule(rule.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={rule.action}
                    onChange={(e) =>
                      updateRule(rule.id, { action: e.target.value as RuleDefinition['action'] })
                    }
                    disabled={readOnly}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium"
                  >
                    <option value="boost_score">Boost Score</option>
                    <option value="force_review">Force Review</option>
                    <option value="force_fraud">Force Fraud</option>
                  </select>

                  <select
                    value={rule.transactionType || 'ANY'}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        transactionType: e.target.value as RuleDefinition['transactionType'],
                      })
                    }
                    disabled={readOnly}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium"
                  >
                    <option value="ANY">Any Type</option>
                    {Object.values(TransactionType).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    value={rule.severity}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        severity: e.target.value as RuleDefinition['severity'],
                      })
                    }
                    disabled={readOnly}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                  <input
                    type="number"
                    placeholder="Min Amount"
                    value={rule.minAmount ?? ''}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    disabled={readOnly}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="Boost (0-1)"
                    value={rule.boost ?? ''}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        boost: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    disabled={readOnly}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Country (US/IN)"
                    value={rule.country || 'ANY'}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        country: e.target.value.trim() ? e.target.value.toUpperCase() : 'ANY',
                      })
                    }
                    disabled={readOnly}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm uppercase"
                  />
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    placeholder="Min Velocity"
                    value={rule.minVelocity ?? ''}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        minVelocity: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    disabled={readOnly}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-fit">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">
              Add New Rule
            </h3>
            <div className="space-y-3">
              <input
                value={newRule.name}
                onChange={(e) => setNewRule((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Rule name"
                disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium"
              />
              <select
                value={newRule.action}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    action: e.target.value as RuleDefinition['action'],
                  }))
                }
                disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm"
              >
                <option value="boost_score">Boost Score</option>
                <option value="force_review">Force Review</option>
                <option value="force_fraud">Force Fraud</option>
              </select>
              <input
                type="number"
                placeholder="Min amount"
                value={newRule.minAmount ?? ''}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm"
              />
              <select
                value={newRule.transactionType || 'ANY'}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    transactionType: e.target.value as RuleDefinition['transactionType'],
                  }))
                }
                disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm"
              >
                <option value="ANY">Any Type</option>
                {Object.values(TransactionType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                onClick={addRule}
                disabled={readOnly}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Rule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
