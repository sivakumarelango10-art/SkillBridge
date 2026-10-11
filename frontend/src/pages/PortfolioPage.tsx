import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { RubricBadge } from '../components/RubricBadge';
import {
  Briefcase,
  ShareNetwork,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  Trash,
  FileCsv,
  Lock,
} from '@phosphor-icons/react';

export const PortfolioPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [shareLink, setShareLink] = useState<{ token: string; createdAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const res = await api.portfolio.get();
      setItems(res.items);
      setShareLink(res.shareLink);
    } catch (err) {
      console.error('Error loading portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (submissionId: string, currentVisible: boolean) => {
    try {
      await api.portfolio.toggle(submissionId, !currentVisible);
      setItems(items.map(it => it.submissionId === submissionId ? { ...it, inPortfolio: !currentVisible } : it));
    } catch (err: any) {
      alert(err.message || 'Failed to update visibility');
    }
  };

  const handleGenerateShare = async () => {
    setGenerating(true);
    try {
      const res = await api.portfolio.share();
      setShareLink({ token: res.token, createdAt: new Date().toISOString() });
    } catch (err: any) {
      alert(err.message || 'Failed to generate share link');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!window.confirm('Are you sure you want to revoke this public link? Any external viewers will immediately lose access.')) {
      return;
    }
    setRevoking(true);
    try {
      await api.portfolio.revoke();
      setShareLink(null);
    } catch (err: any) {
      alert(err.message || 'Failed to revoke share link');
    } finally {
      setRevoking(false);
    }
  };

  const shareUrl = shareLink ? `${window.location.origin}/portfolio/view/${shareLink.token}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="pb-8 border-b border-slate-200">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Verified Work Showcase</span>
        <h1 className="text-3xl font-heading font-bold text-navy mt-1 flex items-center gap-2">
          <Briefcase size={28} className="text-actionBlue" />
          <span>My Verified Portfolio</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Select which attempts to include. Your portfolio is private by default until you generate an unguessable share link.
        </p>
      </div>

      {/* SHARE LINK CONTROLS CARD */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-premium p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${shareLink ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <h2 className="font-heading font-bold text-lg text-navy">
                {shareLink ? 'Public Sharing Active' : 'Portfolio is Private'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {shareLink
                ? 'Anyone with this unique link can view the items you have made visible. You can revoke it anytime.'
                : 'No one can view your work without your explicit action. Generate an unguessable link when you are ready to share with hiring managers or mentors.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {shareLink ? (
              <>
                <Link
                  to={`/portfolio/view/${shareLink.token}`}
                  target="_blank"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Eye size={16} />
                  <span>View Public Page</span>
                </Link>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-actionBlue hover:bg-actionBlue-dark text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={handleRevokeShare}
                  disabled={revoking}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Lock size={14} />
                  <span>Revoke Link</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleGenerateShare}
                disabled={generating}
                className="px-6 py-3 bg-actionBlue hover:bg-actionBlue-dark text-white text-sm font-semibold rounded-xl shadow transition-all flex items-center gap-2 active:scale-[0.98]"
              >
                <ShareNetwork size={18} />
                <span>Generate Public Share Link</span>
              </button>
            )}
          </div>
        </div>

        {shareLink && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg overflow-x-auto">
            <span className="text-slate-400 shrink-0">URL:</span>
            <span className="truncate">{shareUrl}</span>
          </div>
        )}
      </div>

      {/* SUBMISSION ITEMS LIST */}
      <div className="mt-12">
        <h3 className="font-heading font-bold text-xl text-navy mb-4">
          Submissions Available for Portfolio
        </h3>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading portfolio items...</div>
        ) : items.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center">
            <FileCsv size={40} className="mx-auto text-slate-400 mb-3" />
            <p className="text-sm text-slate-600 font-medium">No submissions yet.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Complete the challenge to publish work here.</p>
            <Link to="/challenge" className="px-4 py-2 bg-actionBlue text-white text-xs font-semibold rounded-xl">
              Go to Challenge
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(it => {
              const assess = it.assessment;
              const aiData = assess?.aiOutput as any;
              const criteriaList = (aiData?.criteria || []) as any[];

              return (
                <div
                  key={it.submissionId}
                  className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${
                    it.inPortfolio ? 'border-actionBlue/60 ring-1 ring-actionBlue/30' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-heading font-bold text-navy text-lg">
                          Attempt {it.attempt} — Spreadsheet Insights
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(it.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-medium text-slate-600">
                        {it.inPortfolio ? 'Visible in Public Portfolio' : 'Hidden from Portfolio'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggle(it.submissionId, it.inPortfolio)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          it.inPortfolio ? 'bg-actionBlue' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            it.inPortfolio ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Summary of Badges & Findings */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {criteriaList.map((crit: any) => (
                      <div key={crit.name} className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium text-slate-500">{crit.name}:</span>
                        <RubricBadge level={crit.level} size="sm" />
                      </div>
                    ))}
                  </div>

                  {it.chartPath && (
                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Attached Visual:</span>
                      <a
                        href={it.chartPath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-actionBlue hover:underline flex items-center gap-1"
                      >
                        View Chart File ↗
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
