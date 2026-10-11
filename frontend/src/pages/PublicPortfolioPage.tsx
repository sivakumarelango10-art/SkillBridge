import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { RubricBadge } from '../components/RubricBadge';
import {
  ShieldCheck,
  CalendarBlank,
  WarningCircle,
  Sparkle,
  ArrowSquareOut,
} from '@phosphor-icons/react';

export const PublicPortfolioPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<{ learner: any; projects: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPublic() {
      if (!token) return;
      try {
        const res = await api.portfolio.getPublic(token);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Portfolio not found or link has been revoked.');
      } finally {
        setLoading(false);
      }
    }
    fetchPublic();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading verified portfolio...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-premium">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
            <WarningCircle size={28} />
          </div>
          <h2 className="font-heading font-bold text-xl text-navy">Portfolio Unavailable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'This link is no longer accessible or has been revoked by the learner.'}
          </p>
          <div className="pt-2">
            <Link to="/" className="text-xs font-semibold text-actionBlue hover:underline">
              Visit SkillBridge Home →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-navy py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Learner Public Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <ShieldCheck size={16} /> Verified Workplace Work
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-navy">
              Portfolio of {data.learner.name}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <CalendarBlank size={14} />
              <span>Learner on SkillBridge since {new Date(data.learner.joinedAt).toLocaleDateString()}</span>
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">Verified Projects</span>
            <span className="font-heading font-bold text-3xl text-actionBlue">{data.projects.length}</span>
          </div>
        </div>

        {/* Ethical Standards Disclosure */}
        <div className="p-4 bg-navy-50/60 border border-navy-100 rounded-2xl text-xs text-slate-600 leading-relaxed">
          <strong className="text-navy font-semibold">Assessment Framework:</strong> The criterion ratings below reflect verified performance on the specific challenge rubric. Accuracy calculations are verified deterministically against stored ground truth.
        </div>

        {/* Projects List */}
        <div className="space-y-8">
          {data.projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              The learner has not published any visible challenge submissions yet.
            </div>
          ) : (
            data.projects.map(proj => {
              const assess = proj.assessment;
              const aiData = assess?.aiOutput as any;
              const criteriaList = (aiData?.criteria || []) as any[];

              return (
                <div
                  key={proj.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-premium overflow-hidden"
                >
                  {/* Project Header */}
                  <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="font-heading font-bold text-2xl text-navy">
                          {proj.challengeTitle}
                        </h2>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-actionBlue border border-blue-200">
                          Attempt {proj.attempt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {proj.challengeInstructions} · Submitted on {new Date(proj.date).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-highlightOrange shrink-0">
                      <Sparkle size={14} weight="fill" />
                      <span>AI-assisted evaluation</span>
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 space-y-8">
                    {/* Rubric Criteria Levels */}
                    <div>
                      <h3 className="font-heading font-bold text-base text-navy mb-4">
                        Rubric Performance Ratings
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {criteriaList.map((crit: any) => (
                          <div
                            key={crit.name}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2"
                          >
                            <span className="text-xs font-bold text-slate-700 block">{crit.name}</span>
                            <RubricBadge level={crit.level} size="sm" />
                            {crit.strengths?.[0] && (
                              <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                                {crit.strengths[0]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Calculated Metrics */}
                    <div>
                      <h3 className="font-heading font-bold text-base text-navy mb-3">
                        Verified Calculations
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Revenue</span>
                          <span className="font-heading font-bold text-lg text-navy font-mono">
                            ${Number(proj.answers?.totalRevenue || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[11px] font-mono text-slate-400 uppercase block">Top Category</span>
                          <span className="font-heading font-bold text-lg text-navy">
                            {proj.answers?.topCategory || 'N/A'}
                          </span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[11px] font-mono text-slate-400 uppercase block">Average Order Value</span>
                          <span className="font-heading font-bold text-lg text-navy font-mono">
                            ${Number(proj.answers?.averageOrderValue || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Chart */}
                    {proj.chartPath && (
                      <div>
                        <h3 className="font-heading font-bold text-base text-navy mb-3">
                          Visual Representation
                        </h3>
                        <div className="max-w-2xl rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
                          <img
                            src={proj.chartPath}
                            alt="Visual chart representation created by learner"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}

                    {/* Findings */}
                    {proj.findings && proj.findings.length > 0 && (
                      <div>
                        <h3 className="font-heading font-bold text-base text-navy mb-3">
                          Analytical Findings & Evidence
                        </h3>
                        <div className="space-y-3">
                          {proj.findings.map((f: any, i: number) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                              <div className="text-xs font-bold text-navy">
                                #{i + 1}: {f.finding}
                              </div>
                              <div className="text-xs font-mono text-actionBlue">
                                Supporting Figures: {f.figures}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Method Explanation */}
                    {proj.explanation && (
                      <div>
                        <h3 className="font-heading font-bold text-base text-navy mb-2">
                          Methodology & Analysis Procedure
                        </h3>
                        <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed italic">
                          "{proj.explanation}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
