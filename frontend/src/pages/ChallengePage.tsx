import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api/client';
import {
  FileCsv,
  DownloadSimple,
  ArrowRight,
  CheckCircle,
  Table,
  Sparkle,
  Calculator,
  ChatCircleText,
} from '@phosphor-icons/react';
import { RubricBadge } from '../components/RubricBadge';

export const ChallengePage: React.FC = () => {
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.challenges.getActive();
        setChallenge(res.challenge);
      } catch (err) {
        console.error('Error loading challenge:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const criteria = challenge?.rubric?.criteria || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="pb-8 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-actionBlue text-xs font-semibold mb-3">
          <FileCsv size={16} /> Workplace Brief · Business Analytics
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-navy tracking-tight">
          Spreadsheet Insights Challenge
        </h1>
        <p className="text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Task: You receive a sample sales dataset. Calculate key summaries, create one chart, and explain three findings.
        </p>
      </div>

      {/* Dataset Download & Start CTA Bar */}
      <div className="mt-8 bg-gradient-to-r from-navy to-navy-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl font-heading font-bold text-white">Step 1: Download the Raw Sales Dataset</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            `sales.csv` contains 200 realistic order rows with columns: date, month, region, category, product, units, unit_price, revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href={challenge ? api.challenges.downloadDatasetUrl(challenge.id) : '#'}
            download="sales.csv"
            className="px-5 py-3 bg-white hover:bg-slate-100 text-navy font-semibold text-sm rounded-xl shadow transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <DownloadSimple size={18} className="text-actionBlue" />
            <span>Download sales.csv (200 rows)</span>
          </a>

          <Link
            to="/submit"
            className="px-6 py-3 bg-actionBlue hover:bg-actionBlue-dark text-white font-semibold text-sm rounded-xl shadow transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <span>Start Challenge Submission</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* TASK REQUIREMENTS BREAKDOWN */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-actionBlue flex items-center justify-center font-bold">
            <Calculator size={22} />
          </div>
          <h3 className="font-heading font-bold text-navy text-base">1. Key Summaries</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Calculate total revenue, revenue for each month (Jan–Jun), the top-performing category, and average order value (AOV).
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Table size={22} />
          </div>
          <h3 className="font-heading font-bold text-navy text-base">2. Visual Chart</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Produce one chart image (bar, line, or column) visualizing the revenue pattern or category breakdown. Upload as PNG or JPG (up to 5MB).
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-highlightOrange flex items-center justify-center font-bold">
            <Sparkle size={22} />
          </div>
          <h3 className="font-heading font-bold text-navy text-base">3. Three Findings</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Write three substantive analytical findings. Each finding must specify the exact numerical figures that support your conclusion.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ChatCircleText size={22} />
          </div>
          <h3 className="font-heading font-bold text-navy text-base">4. Method Explanation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Describe the spreadsheet tools or formulas (e.g. PivotTables, SUMIF, AVERAGE) you used to arrive at your answers.
          </p>
        </div>
      </div>

      {/* FULL RUBRIC DETAILS (BEFORE STARTING) */}
      <div className="mt-14">
        <div className="mb-6">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Evaluation Blueprint</span>
          <h2 className="text-2xl font-heading font-bold text-navy mt-1">
            Official Assessment Rubric (Version 1)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Every submission is judged against these 4 standards across 4 levels: Not yet / Partly meets / Mostly meets / Meets.
          </p>
        </div>

        <div className="space-y-6">
          {criteria.map((c: any) => (
            <div key={c.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-heading font-bold text-lg text-navy">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.description}</p>
                </div>
                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md shrink-0 ${
                    c.type === 'deterministic'
                      ? 'bg-blue-50 text-actionBlue border border-blue-200'
                      : 'bg-orange-50 text-highlightOrange border border-orange-200'
                  }`}
                >
                  {c.type === 'deterministic' ? 'DETERMINISTIC EVALUATION' : 'AI-ASSISTED EVALUATION'}
                </span>
              </div>

              {/* 4 Levels Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                {['Meets', 'Mostly meets', 'Partly meets', 'Not yet'].map(levelKey => {
                  const levelDesc = c.levels?.[levelKey] || '';
                  return (
                    <div
                      key={levelKey}
                      className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="mb-2">
                          <RubricBadge level={levelKey} size="sm" />
                        </div>
                        <p className="text-slate-600 leading-relaxed">{levelDesc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-actionBlue hover:bg-actionBlue-dark text-white font-semibold text-base rounded-xl shadow-premium hover:shadow-premium-hover transition-all active:scale-[0.98]"
          >
            <span>I've Reviewed the Rubric — Start Submission</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};
