import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Trash, Warning } from '@phosphor-icons/react';

export const Footer: React.FC = () => {
  const { user, deleteAccount } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <footer className="bg-navy-900 text-slate-300 border-t border-navy-700/60 pt-12 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-navy-700/60">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-navy-800 border border-slate-700 flex items-center justify-center font-heading font-bold text-sm text-actionBlue">
                SB
              </div>
              <span className="font-heading font-bold text-lg text-white">SkillBridge</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Helping college students and self-taught learners practise real-world workplace tasks, receive rubric-based feedback, and publish an evidence-backed portfolio.
            </p>
            <div className="pt-2 text-xs text-slate-400 border-l-2 border-actionBlue pl-3">
              <strong className="text-slate-300">Ethical Standards:</strong> Rubric evaluations indicate performance on this specific challenge. SkillBridge does not issue credentials, certifications, or employment guarantees.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/challenge" className="hover:text-actionBlue transition-colors">Spreadsheet Insights Task</Link></li>
              <li><Link to="/auth?mode=login" className="hover:text-actionBlue transition-colors">Learner Portal</Link></li>
              <li><Link to="/auth?mode=signup" className="hover:text-actionBlue transition-colors">Create Free Account</Link></li>
              <li><a href="#pilot" className="hover:text-actionBlue transition-colors">College & Mentor Pilots</a></li>
            </ul>
          </div>

          {/* Privacy & Ethics */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white tracking-wider uppercase mb-3">Privacy & Trust</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck size={16} className="text-actionBlue" /> Submissions private by default
              </li>
              <li>Public sharing requires explicit learner action</li>
              <li>Feedback labeled AI-assisted</li>
              {user && (
                <li className="pt-2">
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash size={14} /> Delete my account and all data
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 SkillBridge. Built with accessibility (WCAG 2.1 AA) and student privacy at the core.</p>
          <div className="flex items-center gap-6">
            <span>Deterministic checks + AI-assisted analysis</span>
            <span>No fabricated metrics</span>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-navy shadow-2xl border border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Warning size={28} />
            </div>
            <h3 className="font-heading font-bold text-xl text-navy mb-2">Delete Account and All Data?</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              This action is permanent. All your submissions, drafts, evaluations, assessments, and public portfolio links will be permanently wiped from the database.
            </p>
            {deleteSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-medium text-center">
                Account deleted. Redirecting...
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
