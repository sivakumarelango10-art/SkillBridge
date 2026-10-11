import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import {
  Gear,
  ArrowsClockwise,
  CheckCircle,
  Database,
  Users,
  Table,
  WarningCircle,
} from '@phosphor-icons/react';

export const AdminPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.admin.getStatus();
      setStatus(res);
    } catch (err) {
      console.error('Error loading admin status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Trigger seed script? This will regenerate sales.csv (~200 rows), recompute ground truth, and ensure the challenge and rubric are initialized.')) {
      return;
    }

    setSeeding(true);
    setSeedResult(null);

    try {
      const res = await api.admin.reSeed();
      setSeedResult(res.message);
      await loadStatus();
    } catch (err: any) {
      alert(err.message || 'Seeding failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="pb-8 border-b border-slate-200">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">System Administration</span>
        <h1 className="text-3xl font-heading font-bold text-navy mt-1 flex items-center gap-2">
          <Gear size={28} className="text-navy" />
          <span>Admin System & Seeding Controls</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage system configurations, trigger database seeding, and inspect ground truth parameters.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading system status...</div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Metrics Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-actionBlue flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 block">Total Users</span>
                <span className="font-heading font-bold text-2xl text-navy">
                  {status?.metrics?.users || 0}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Table size={24} />
              </div>
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 block">Total Submissions</span>
                <span className="font-heading font-bold text-2xl text-navy">
                  {status?.metrics?.submissions || 0}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database size={24} />
              </div>
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 block">Assessments Saved</span>
                <span className="font-heading font-bold text-2xl text-navy">
                  {status?.metrics?.assessments || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Seed Script Control Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-premium p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-heading font-bold text-xl text-navy">
                  Seed Engine (sales.csv & Ground Truth)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Generates the reproducible 200-row sales dataset, stores ground truth calculations in the AnswerKey, and establishes Rubric v1.
                </p>
              </div>

              <button
                onClick={handleSeed}
                disabled={seeding}
                className="px-6 py-3 bg-actionBlue hover:bg-actionBlue-dark text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-50 shrink-0"
              >
                <ArrowsClockwise size={18} className={seeding ? 'animate-spin' : ''} />
                <span>{seeding ? 'Executing Seed...' : 'Re-Seed Dataset & Rubric v1'}</span>
              </button>
            </div>

            {seedResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle size={18} weight="fill" />
                <span>{seedResult}</span>
              </div>
            )}

            {/* Status of Challenge */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4 text-xs">
              <h3 className="font-bold text-navy text-sm font-heading">
                Active Challenge Status: {status?.challenge?.title || 'Spreadsheet Insights'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-mono block mb-1">Answer Key Present</span>
                  <span className="font-bold text-emerald-700">
                    {status?.challenge?.hasAnswerKey ? 'Active & Seeded ✓' : 'Missing ✕'}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-mono block mb-1">Rubric Versions</span>
                  <span className="font-bold text-navy font-mono">
                    {status?.challenge?.rubricVersions || 1} Version(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
