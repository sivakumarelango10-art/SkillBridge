import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { RubricBadge } from '../components/RubricBadge';
import {
  Sparkle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowsClockwise,
  ShareNetwork,
  Calculator,
  WarningCircle,
  FileImage,
  ClockCounterClockwise,
} from '@phosphor-icons/react';

export const FeedbackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolioSuccess, setPortfolioSuccess] = useState(false);
  const [togglingPortfolio, setTogglingPortfolio] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await api.submissions.getById(id);
        setSubmission(res.submission);
      } catch (err) {
        console.error('Error loading feedback:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleTogglePortfolio = async () => {
    if (!submission) return;
    setTogglingPortfolio(true);
    try {
      const nextVisible = !submission.inPortfolio;
      await api.portfolio.toggle(submission.id, nextVisible);
      setSubmission({ ...submission, inPortfolio: nextVisible });
      setPortfolioSuccess(true);
      setTimeout(() => setPortfolioSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update portfolio');
    } finally {
      setTogglingPortfolio(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        Loading rubric evaluation...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-heading font-bold text-navy">Submission Not Found</h2>
        <Link to="/dashboard" className="text-actionBlue hover:underline text-sm font-semibold">
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  const assessment = submission.assessment;
  const aiData = assessment?.aiOutput as any;
  const det = assessment?.deterministic as any;
  const criteriaList = (aiData?.criteria || []) as any[];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link to="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-navy transition-colors">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-premium p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-heading font-bold text-navy text-2xl">
                Attempt {submission.attempt} Feedback
              </span>
              <span className="text-xs text-slate-400 font-mono">
                · Evaluated {new Date(submission.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Spreadsheet Insights Task · Rubric Version {assessment?.rubricVersion || 1}
            </div>
          </div>

          {/* AI-Assisted Feedback & Ethics Badge */}
          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-highlightOrange shadow-sm">
              <Sparkle size={14} weight="fill" />
              <span>AI-assisted feedback</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Evaluator Model: {assessment?.model || 'calibrated-evaluator'}
            </span>
          </div>
        </div>

        {/* Honest Ethical Standard Notice */}
        <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
          <strong className="text-slate-700">Performance Assessment Notice:</strong> Ratings indicate execution on this specific workplace task against explicit rubric benchmarks. They do not constitute credentialing, professional licensing, or employment guarantees.
        </div>

        {/* Action Buttons Row */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/submit"
              className="px-5 py-2.5 bg-actionBlue hover:bg-actionBlue-dark text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <ArrowsClockwise size={16} />
              <span>Revise & Resubmit</span>
            </Link>

            <button
              onClick={handleTogglePortfolio}
              disabled={togglingPortfolio}
              className={`px-5 py-2.5 font-semibold text-sm rounded-xl border transition-all flex items-center gap-2 active:scale-[0.98] ${
                submission.inPortfolio
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-white hover:bg-slate-50 text-navy border-slate-300'
              }`}
            >
              <ShareNetwork size={16} />
              <span>{submission.inPortfolio ? 'Included in Portfolio ✓' : 'Add to Portfolio'}</span>
            </button>
          </div>

          {submission.attempt > 1 && (
            <Link
              to="/history"
              className="text-xs font-semibold text-actionBlue hover:underline flex items-center gap-1"
            >
              <ClockCounterClockwise size={14} />
              <span>Compare with Previous Attempt</span>
            </Link>
          )}
        </div>

        {portfolioSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle size={16} weight="fill" />
            <span>Portfolio settings updated successfully. You can manage visibility in your Portfolio screen.</span>
          </div>
        )}
      </div>

      {/* OVERALL NEXT STEP CALLOUT */}
      {aiData?.overall_next_step && (
        <div className="my-8 p-6 bg-gradient-to-r from-orange-50 to-amber-50/60 border border-orange-200 rounded-2xl shadow-sm space-y-2">
          <span className="text-xs font-mono font-bold text-highlightOrange uppercase tracking-wider flex items-center gap-1.5">
            <Sparkle size={16} weight="fill" /> Key Revision Priority
          </span>
          <p className="text-sm sm:text-base text-navy font-medium leading-relaxed">
            "{aiData.overall_next_step}"
          </p>
        </div>
      )}

      {/* CRITERION LEVEL CARDS */}
      <div className="space-y-6">
        <h3 className="font-heading font-bold text-xl text-navy">Detailed Rubric Criteria Breakdown</h3>

        {criteriaList.map((crit: any) => {
          const isDeterministic = crit.name === 'Accuracy' || crit.name === 'Completeness';

          return (
            <motion.div
              key={crit.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-lg text-navy">{crit.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                      {isDeterministic ? 'Deterministic Check' : 'AI-Assisted'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {crit.name === 'Accuracy' && 'Mathematical verification against dataset values (±0.5% tolerance).'}
                    {crit.name === 'Completeness' && 'Structural checklist verification of all required fields & attachments.'}
                    {crit.name === 'Reasoning' && 'Evaluates how soundly conclusions follow from cited sales numbers.'}
                    {crit.name === 'Communication' && 'Assesses clarity, transparent methodology, and chart presentation.'}
                  </p>
                </div>

                <div className="shrink-0">
                  <RubricBadge level={crit.level} size="md" />
                </div>
              </div>

              {/* Strengths */}
              {crit.strengths && crit.strengths.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={15} weight="fill" className="text-emerald-600" /> Strengths
                  </span>
                  <ul className="space-y-1.5 pl-6 list-disc text-xs text-slate-700 leading-relaxed">
                    {crit.strengths.map((str: string, i: number) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Requirements */}
              {crit.missing && crit.missing.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle size={15} weight="fill" className="text-red-600" /> Missing Requirements
                  </span>
                  <ul className="space-y-1.5 pl-6 list-disc text-xs text-slate-700 leading-relaxed">
                    {crit.missing.map((mis: string, i: number) => (
                      <li key={i}>{mis}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specific Next Steps */}
              {crit.next_steps && crit.next_steps.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <span className="text-xs font-mono font-bold text-actionBlue uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowRight size={15} className="text-actionBlue" /> Next Steps for Revision
                  </span>
                  <ul className="space-y-1.5 pl-6 list-disc text-xs text-slate-700 leading-relaxed">
                    {crit.next_steps.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* SUBMITTED ARTIFACTS ACCORDION PREVIEW */}
      <div className="mt-10 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h4 className="font-heading font-bold text-base text-navy">Submitted Work Snapshot</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-mono block mb-1">Total Revenue</span>
            <span className="font-bold text-sm text-navy">${Number(submission.answers?.totalRevenue || 0).toLocaleString()}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-mono block mb-1">Top Category</span>
            <span className="font-bold text-sm text-navy">{submission.answers?.topCategory || 'N/A'}</span>
          </div>
        </div>

        {submission.chartPath && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-600 block mb-2">Uploaded Chart Image:</span>
            <div className="max-w-md rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <img src={submission.chartPath} alt="Submitted visual chart" className="w-full h-auto" />
            </div>
          </div>
        )}

        <div className="pt-2">
          <span className="text-xs font-bold text-slate-600 block mb-1">Methodology Explanation:</span>
          <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
            "{submission.explanation}"
          </p>
        </div>
      </div>
    </div>
  );
};
