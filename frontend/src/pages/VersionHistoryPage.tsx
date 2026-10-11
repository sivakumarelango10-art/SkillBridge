import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { RubricBadge } from '../components/RubricBadge';
import {
  ClockCounterClockwise,
  ArrowRight,
  TrendUp,
  Table,
  CheckCircle,
} from '@phosphor-icons/react';

export const VersionHistoryPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptAId, setAttemptAId] = useState<string>('');
  const [attemptBId, setAttemptBId] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.submissions.list();
        setSubmissions(res.submissions);

        if (res.submissions.length >= 2) {
          setAttemptAId(res.submissions[res.submissions.length - 2].id);
          setAttemptBId(res.submissions[res.submissions.length - 1].id);
        } else if (res.submissions.length === 1) {
          setAttemptAId(res.submissions[0].id);
          setAttemptBId(res.submissions[0].id);
        }
      } catch (err) {
        console.error('Error loading submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const subA = submissions.find(s => s.id === attemptAId) || null;
  const subB = submissions.find(s => s.id === attemptBId) || null;

  const criteriaNames = ['Accuracy', 'Completeness', 'Reasoning', 'Communication'];

  const getLevel = (sub: any, critName: string) => {
    if (!sub || !sub.assessment?.aiOutput) return 'N/A';
    const criteria = sub.assessment.aiOutput.criteria || [];
    const match = criteria.find((c: any) => c.name === critName);
    return match ? match.level : 'N/A';
  };

  const levelRank: Record<string, number> = {
    'Not yet': 1,
    'Partly meets': 2,
    'Mostly meets': 3,
    'Meets': 4,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-8 border-b border-slate-200">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Progression Tracker</span>
        <h1 className="text-3xl font-heading font-bold text-navy mt-1 flex items-center gap-2">
          <ClockCounterClockwise size={28} className="text-actionBlue" />
          <span>Version History & Attempt Comparison</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Compare your submissions side-by-side to verify how each criterion level progressed across revisions.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading version records...</div>
      ) : submissions.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center my-8">
          <Table size={48} className="mx-auto text-slate-400 mb-3" />
          <h3 className="font-heading font-bold text-lg text-navy">No Submissions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Complete your initial attempt on the challenge to start tracking version-over-version growth.
          </p>
          <Link to="/challenge" className="px-5 py-2.5 bg-actionBlue text-white text-xs font-semibold rounded-xl">
            Go to Challenge
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {/* Attempt Selector Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase font-mono">
                Baseline (Attempt A)
              </label>
              <select
                value={attemptAId}
                onChange={e => setAttemptAId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:border-actionBlue font-medium"
              >
                {submissions.map(s => (
                  <option key={s.id} value={s.id}>
                    Attempt {s.attempt} ({new Date(s.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase font-mono">
                Revision (Attempt B)
              </label>
              <select
                value={attemptBId}
                onChange={e => setAttemptBId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:border-actionBlue font-medium"
              >
                {submissions.map(s => (
                  <option key={s.id} value={s.id}>
                    Attempt {s.attempt} ({new Date(s.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CRITERION LEVEL PROGRESSION TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/60">
              <h2 className="font-heading font-bold text-lg text-navy">
                Criterion Level Progression
              </h2>
              <p className="text-xs text-slate-500">
                Visualizing skill evolution from Attempt {subA?.attempt} to Attempt {subB?.attempt}.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                    <th className="py-3 px-6 font-semibold">Criterion</th>
                    <th className="py-3 px-6 font-semibold">Attempt {subA?.attempt}</th>
                    <th className="py-3 px-6 font-semibold">Attempt {subB?.attempt}</th>
                    <th className="py-3 px-6 font-semibold">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {criteriaNames.map(name => {
                    const levelA = getLevel(subA, name);
                    const levelB = getLevel(subB, name);
                    const rankA = levelRank[levelA] || 0;
                    const rankB = levelRank[levelB] || 0;
                    const diff = rankB - rankA;

                    return (
                      <tr key={name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-navy text-sm">{name}</td>
                        <td className="py-4 px-6">
                          <RubricBadge level={levelA} size="sm" />
                        </td>
                        <td className="py-4 px-6">
                          <RubricBadge level={levelB} size="sm" />
                        </td>
                        <td className="py-4 px-6 font-mono text-xs">
                          {diff > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <TrendUp size={14} /> +{diff} Level(s) Improved
                            </span>
                          ) : diff === 0 ? (
                            <span className="text-slate-400">Maintained</span>
                          ) : (
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                              {diff} Variance
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDE-BY-SIDE CALCULATIONS & METHODOLOGY COMPARISON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attempt A Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-heading font-bold text-base text-navy">Attempt {subA?.attempt} Details</h3>
                <Link to={`/feedback/${subA?.id}`} className="text-xs font-semibold text-actionBlue hover:underline">
                  View Full Feedback →
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-mono block">Total Revenue</span>
                  <span className="font-bold text-navy text-sm font-mono">
                    ${Number(subA?.answers?.totalRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block">Top Category</span>
                  <span className="font-bold text-navy">{subA?.answers?.topCategory || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block">Average Order Value (AOV)</span>
                  <span className="font-bold text-navy font-mono">
                    ${Number(subA?.answers?.averageOrderValue || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block mb-1">Methodology Explanation</span>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-600">
                    "{subA?.explanation || 'No explanation'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Attempt B Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-heading font-bold text-base text-navy">Attempt {subB?.attempt} Details</h3>
                <Link to={`/feedback/${subB?.id}`} className="text-xs font-semibold text-actionBlue hover:underline">
                  View Full Feedback →
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-mono block">Total Revenue</span>
                  <span className="font-bold text-navy text-sm font-mono">
                    ${Number(subB?.answers?.totalRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block">Top Category</span>
                  <span className="font-bold text-navy">{subB?.answers?.topCategory || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block">Average Order Value (AOV)</span>
                  <span className="font-bold text-navy font-mono">
                    ${Number(subB?.answers?.averageOrderValue || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block mb-1">Methodology Explanation</span>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-600">
                    "{subB?.explanation || 'No explanation'}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
