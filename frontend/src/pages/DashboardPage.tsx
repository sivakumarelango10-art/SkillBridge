import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RubricBadge } from '../components/RubricBadge';
import {
  FileCsv,
  ArrowRight,
  ClockCounterClockwise,
  CheckCircle,
  Sparkle,
  ShareNetwork,
  Plus,
} from '@phosphor-icons/react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [subRes, chalRes] = await Promise.all([
          api.submissions.list(),
          api.challenges.getActive(),
        ]);
        setSubmissions(subRes.submissions);
        setChallenge(chalRes.challenge);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Determine current overall challenge status
  // Options: 'Not started' | 'Submitted' | 'Feedback ready' | 'Revised' | 'Published'
  let challengeStatus = 'Not started';
  const hasPublishedItem = submissions.some(s => s.inPortfolio);
  const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;

  if (hasPublishedItem) {
    challengeStatus = 'Published';
  } else if (submissions.length > 1) {
    challengeStatus = 'Revised';
  } else if (latestSubmission) {
    challengeStatus = latestSubmission.status === 'feedback_ready' ? 'Feedback ready' : 'Submitted';
  }

  const statusColors: Record<string, string> = {
    'Not started': 'bg-slate-100 text-slate-700 border-slate-300',
    'Submitted': 'bg-blue-50 text-actionBlue border-blue-200',
    'Feedback ready': 'bg-orange-50 text-highlightOrange border-orange-200',
    'Revised': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Published': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Learner Workspace</span>
          <h1 className="text-3xl font-heading font-bold text-navy mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track your challenge attempts, rubric assessments, and verified portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/challenge"
            className="px-4 py-2.5 bg-actionBlue hover:bg-actionBlue-dark text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <span>{submissions.length > 0 ? 'Work on Challenge' : 'Start First Challenge'}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* ACTIVE CHALLENGE CARD */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200/90 shadow-premium p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColors[challengeStatus]}`}>
                Status: {challengeStatus}
              </span>
              <span className="text-xs text-slate-400 font-mono">Attempt count: {submissions.length}</span>
            </div>

            <h2 className="text-2xl font-heading font-bold text-navy">
              {challenge?.title || 'Spreadsheet Insights'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {challenge?.instructions ||
                'You receive a sample sales dataset. Calculate key summaries, create one chart, and explain three findings.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            {latestSubmission ? (
              <>
                <Link
                  to={`/feedback/${latestSubmission.id}`}
                  className="px-5 py-2.5 bg-navy hover:bg-navy-900 text-white text-sm font-semibold rounded-xl shadow-sm text-center transition-all"
                >
                  View Latest Feedback
                </Link>
                <Link
                  to="/submit"
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-actionBlue border border-actionBlue text-sm font-semibold rounded-xl text-center transition-all"
                >
                  Revise & Resubmit (Attempt {submissions.length + 1})
                </Link>
              </>
            ) : (
              <Link
                to="/challenge"
                className="px-6 py-3 bg-actionBlue hover:bg-actionBlue-dark text-white text-sm font-semibold rounded-xl text-center shadow-sm"
              >
                Start Challenge
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ASSESSMENT HISTORY SECTION */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-navy flex items-center gap-2">
              <ClockCounterClockwise size={22} className="text-actionBlue" />
              <span>Assessment History</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every attempt is recorded with deterministic verification and AI-assisted rubric insights.
            </p>
          </div>

          {submissions.length > 1 && (
            <Link
              to="/history"
              className="text-xs font-semibold text-actionBlue hover:underline flex items-center gap-1"
            >
              Compare Version History →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading submission records...</div>
        ) : submissions.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center">
            <FileCsv size={40} className="mx-auto text-slate-400 mb-3" />
            <h4 className="font-heading font-bold text-base text-navy">No Submissions Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Download the sales dataset and complete your first calculation and analysis attempt.
            </p>
            <Link
              to="/challenge"
              className="inline-flex items-center gap-2 px-4 py-2 bg-actionBlue text-white text-xs font-semibold rounded-lg"
            >
              Begin Challenge
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => {
              const assess = sub.assessment;
              const aiData = assess?.aiOutput as any;
              const det = assess?.deterministic as any;
              const criteriaList = (aiData?.criteria || []) as any[];

              return (
                <motion.div
                  key={sub.id}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold text-navy text-lg">
                        Attempt {sub.attempt}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(sub.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {sub.inPortfolio && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <ShareNetwork size={12} /> In Portfolio
                        </span>
                      )}
                    </div>

                    {/* Criteria Badges Row */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {criteriaList.map((crit: any) => (
                        <div key={crit.name} className="flex items-center gap-1.5 text-xs">
                          <span className="font-medium text-slate-600">{crit.name}:</span>
                          <RubricBadge level={crit.level} size="sm" />
                        </div>
                      ))}
                    </div>

                    {aiData?.overall_next_step && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        "{aiData.overall_next_step}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      to={`/feedback/${sub.id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-semibold rounded-lg transition-colors"
                    >
                      View Rubric Breakdown
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
