import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { RubricBadge, CriterionLevel } from '../components/RubricBadge';
import {
  UserCheck,
  Percent,
  CheckCircle,
  WarningCircle,
  FloppyDisk,
  Sparkle,
  ChatCircleDots,
} from '@phosphor-icons/react';

export const MentorReviewPage: React.FC = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review form states mapped by assessmentId
  const [reviewsData, setReviewsData] = useState<Record<string, { levels: Record<string, string>; notes: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assRes, agrRes] = await Promise.all([
        api.mentor.getAssessments(),
        api.mentor.getAgreement(),
      ]);

      setAssessments(assRes.assessments);
      setAgreement(agrRes);

      // Pre-fill existing reviews if any
      const initial: Record<string, { levels: Record<string, string>; notes: string }> = {};
      for (const a of assRes.assessments) {
        if (a.myReview) {
          initial[a.id] = {
            levels: (a.myReview.levels as Record<string, string>) || {},
            notes: a.myReview.notes || '',
          };
        } else {
          // Default empty or match
          initial[a.id] = {
            levels: {
              Accuracy: 'Meets',
              Completeness: 'Meets',
              Reasoning: 'Meets',
              Communication: 'Meets',
            },
            notes: '',
          };
        }
      }
      setReviewsData(initial);
    } catch (err) {
      console.error('Error loading mentor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (assessmentId: string, criterionName: string, level: string) => {
    setReviewsData(prev => ({
      ...prev,
      [assessmentId]: {
        ...prev[assessmentId],
        levels: {
          ...prev[assessmentId]?.levels,
          [criterionName]: level,
        },
      },
    }));
  };

  const handleNotesChange = (assessmentId: string, notes: string) => {
    setReviewsData(prev => ({
      ...prev,
      [assessmentId]: {
        ...prev[assessmentId],
        notes,
      },
    }));
  };

  const handleSaveReview = async (assessmentId: string) => {
    setSavingId(assessmentId);
    try {
      const current = reviewsData[assessmentId];
      await api.mentor.submitReview({
        assessmentId,
        levels: current.levels,
        notes: current.notes,
      });

      setSaveSuccessId(assessmentId);
      setTimeout(() => setSaveSuccessId(null), 3000);

      // Refresh agreement metrics
      const updatedAgreement = await api.mentor.getAgreement();
      setAgreement(updatedAgreement);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSavingId(null);
    }
  };

  const criteriaNames = ['Accuracy', 'Completeness', 'Reasoning', 'Communication'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="pb-8 border-b border-slate-200">
        <span className="text-xs font-mono uppercase tracking-wider text-highlightOrange">Mentor Portal</span>
        <h1 className="text-3xl font-heading font-bold text-navy mt-1 flex items-center gap-2">
          <UserCheck size={28} className="text-highlightOrange" />
          <span>Mentor Review & AI Agreement Calibration</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Review random samples of student submissions, enter your independent criterion levels, and track agreement with the automated assessment engine.
        </p>
      </div>

      {/* AGREEMENT SUMMARY DASHBOARD */}
      {agreement && (
        <div className="mt-8 bg-gradient-to-r from-navy to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-actionBlue-light block">
                Calibration Metric
              </span>
              <h2 className="text-2xl font-heading font-bold text-white mt-0.5">
                Mentor-AI Agreement Rate
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Calculated by comparing mentor-selected criterion levels against AI-generated levels across all evaluated criteria.
              </p>
            </div>

            <div className="flex items-center gap-6 bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-sm border border-white/10 shrink-0">
              <div className="text-right">
                <div className="text-[11px] font-mono uppercase text-slate-300">Overall Agreement</div>
                <div className="font-heading font-bold text-4xl text-actionBlue-light">
                  {agreement.overallAgreementRate}%
                </div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-300">Reviewed Samples</div>
                <div className="font-heading font-bold text-2xl text-white">
                  {agreement.totalReviews}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown per criterion */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {criteriaNames.map(name => {
              const b = agreement.criteriaBreakdown?.[name] || { rate: 0, agreed: 0, total: 0 };
              return (
                <div key={name} className="bg-white/5 rounded-xl p-3.5 border border-white/5 space-y-1">
                  <div className="text-xs font-semibold text-slate-300">{name}</div>
                  <div className="font-heading font-bold text-xl text-white">
                    {b.rate}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {b.agreed} / {b.total} agreed
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SAMPLED ASSESSMENTS QUEUE */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-xl text-navy">
            Sampled Assessment Queue ({assessments.length} Available)
          </h3>
          <span className="text-xs text-slate-500 font-mono">Randomly sampled submissions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading assessment queue...</div>
        ) : assessments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
            No assessments currently queued for review.
          </div>
        ) : (
          <div className="space-y-8">
            {assessments.map(a => {
              const aiData = a.aiOutput as any;
              const aiCriteriaList = (aiData?.criteria || []) as any[];
              const aiLevelMap: Record<string, string> = {};
              for (const c of aiCriteriaList) aiLevelMap[c.name] = c.level;

              const currentReview = reviewsData[a.id] || { levels: {}, notes: '' };
              const isSaved = saveSuccessId === a.id;
              const isSaving = savingId === a.id;

              return (
                <div
                  key={a.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
                >
                  {/* Top Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-heading font-bold text-lg text-navy">
                          Learner: {a.submission?.learnerName}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          Attempt {a.submission?.attempt}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Evaluated {new Date(a.createdAt).toLocaleDateString()} · Model: {a.model}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {a.myReview && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle size={14} weight="fill" /> Mentor Reviewed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student Work Preview */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                    <div className="font-bold text-slate-700 uppercase font-mono text-[11px]">
                      Student Submission Summary
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-slate-400 block font-mono">Total Revenue</span>
                        <span className="font-bold font-mono text-navy">
                          ${Number(a.submission?.answers?.totalRevenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono">Top Category</span>
                        <span className="font-bold text-navy">{a.submission?.answers?.topCategory || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono">AOV</span>
                        <span className="font-bold font-mono text-navy">
                          ${Number(a.submission?.answers?.averageOrderValue || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono">Chart Visual</span>
                        <span className="text-actionBlue font-medium">
                          {a.submission?.chartPath ? 'Chart Attached ✓' : 'No Chart ✕'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-mono mb-1">Student Method Explanation</span>
                      <p className="italic text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        "{a.submission?.explanation || 'No explanation provided'}"
                      </p>
                    </div>
                  </div>

                  {/* Mentor Calibration Matrix */}
                  <div className="space-y-4">
                    <h4 className="font-heading font-bold text-sm text-navy">
                      Criterion Evaluation & Level Comparison
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {criteriaNames.map(name => {
                        const aiLevel = aiLevelMap[name] || 'Not yet';
                        const mentorSelected = currentReview.levels[name] || 'Meets';
                        const agreed = mentorSelected.toLowerCase() === aiLevel.toLowerCase();

                        return (
                          <div
                            key={name}
                            className={`p-4 rounded-2xl border space-y-3 transition-colors ${
                              agreed ? 'bg-slate-50/70 border-slate-200' : 'bg-orange-50/50 border-orange-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-navy">{name}</span>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-400 font-mono text-[10px]">AI Level:</span>
                                <RubricBadge level={aiLevel} size="sm" />
                              </div>
                            </div>

                            {/* Mentor Selector */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Mentor Level Assignment:
                              </label>
                              <select
                                value={mentorSelected}
                                onChange={e => handleLevelChange(a.id, name, e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:border-highlightOrange bg-white font-medium"
                              >
                                <option value="Meets">Meets</option>
                                <option value="Mostly meets">Mostly meets</option>
                                <option value="Partly meets">Partly meets</option>
                                <option value="Not yet">Not yet</option>
                              </select>
                            </div>

                            <div className="text-[11px] flex items-center gap-1">
                              {agreed ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle size={14} weight="fill" /> Matches AI assessment
                                </span>
                              ) : (
                                <span className="text-highlightOrange font-semibold flex items-center gap-1">
                                  <WarningCircle size={14} weight="fill" /> Diverges from AI
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mentor Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mentor Feedback & Coaching Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add specific observations or coaching pointers for the student..."
                      value={currentReview.notes}
                      onChange={e => handleNotesChange(a.id, e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-highlightOrange focus:ring-1 focus:ring-highlightOrange leading-relaxed"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-2">
                    {isSaved ? (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle size={16} weight="fill" /> Review saved and agreement rate updated!
                      </span>
                    ) : <div />}

                    <button
                      type="button"
                      onClick={() => handleSaveReview(a.id)}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-highlightOrange hover:bg-highlightOrange-dark text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      <FloppyDisk size={16} />
                      <span>{isSaving ? 'Saving...' : 'Save Mentor Review'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
