import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle,
  FileSpreadsheet,
  Target,
  Sparkle,
  ArrowsClockwise,
  ShareNetwork,
  Buildings,
  GraduationCap,
  PaperPlaneTilt,
} from '@phosphor-icons/react';
import { RubricBadge } from '../components/RubricBadge';

export const LandingPage: React.FC = () => {
  const [pilotSubmitted, setPilotSubmitted] = useState(false);
  const [pilotForm, setPilotForm] = useState({
    institution: '',
    contactName: '',
    email: '',
    learnerCount: '50-200',
    notes: '',
  });

  const handlePilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPilotSubmitted(true);
  };

  const steps = [
    {
      num: '01',
      title: 'Select a Challenge',
      desc: 'Work on realistic workplace briefs with raw datasets and instructions—not multiple-choice quizzes.',
      icon: <Target size={24} className="text-actionBlue" />,
    },
    {
      num: '02',
      title: 'Submit Real Work',
      desc: 'Enter structured calculations, upload your chart visual, cite quantitative findings, and explain your method.',
      icon: <FileSpreadsheet size={24} className="text-actionBlue" />,
    },
    {
      num: '03',
      title: 'Get Rubric Feedback',
      desc: 'Receive transparent feedback in seconds: deterministic calculation audits and AI-assisted qualitative analysis.',
      icon: <Sparkle size={24} className="text-highlightOrange" />,
    },
    {
      num: '04',
      title: 'Revise & Resubmit',
      desc: 'Act on specific next steps, correct formulas, sharpen observations, and track version-over-version growth.',
      icon: <ArrowsClockwise size={24} className="text-actionBlue" />,
    },
    {
      num: '05',
      title: 'Publish to Portfolio',
      desc: 'Turn verified work into a private or public shareable portfolio that proves what you can actually execute.',
      icon: <ShareNetwork size={24} className="text-emerald-600" />,
    },
  ];

  return (
    <div className="bg-[#F8FAFC] text-navy">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 border-b border-slate-200/80 bg-grid-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 border border-navy-100 text-xs font-semibold text-navy">
                <span className="w-2 h-2 rounded-full bg-actionBlue animate-pulse" />
                Workplace Practice for Career Builders
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-navy tracking-tight leading-[1.08]">
                Practise real tasks. <br />
                <span className="text-actionBlue">Prove real skills.</span>
              </h1>

              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                SkillBridge helps students and self-taught learners tackle authentic workplace tasks, get rubric-based feedback on what to improve, and publish a portfolio of verified work.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/challenge"
                  className="px-6 py-3.5 bg-actionBlue hover:bg-actionBlue-dark text-white font-semibold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-150 flex items-center gap-2 group active:scale-[0.98]"
                >
                  <span>Try the Challenge</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#pilot"
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-navy font-semibold rounded-xl border border-slate-300 shadow-sm transition-all duration-150 active:scale-[0.98]"
                >
                  Pilot with Your College
                </a>
              </div>

              {/* Honest Notice */}
              <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                <span>Deterministic accuracy audits · 100% private by default · AI-assisted feedback</span>
              </div>
            </motion.div>

            {/* Right Column: Hero Visual - Live Rubric Card Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5"
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Example Rubric Assessment</div>
                    <div className="font-heading font-bold text-navy text-lg">Spreadsheet Insights Task</div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-actionBlue rounded-md border border-blue-200">
                    Attempt 2
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-navy">Accuracy</div>
                      <div className="text-[11px] text-slate-500">Totals match dataset ±0.5%</div>
                    </div>
                    <RubricBadge level="Meets" size="sm" />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-navy">Completeness</div>
                      <div className="text-[11px] text-slate-500">All required parts submitted</div>
                    </div>
                    <RubricBadge level="Meets" size="sm" />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-navy">Reasoning</div>
                      <div className="text-[11px] text-slate-500">Conclusions follow evidence</div>
                    </div>
                    <RubricBadge level="Mostly meets" size="sm" />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-navy">Communication</div>
                      <div className="text-[11px] text-slate-500">Explanations and chart labels</div>
                    </div>
                    <RubricBadge level="Meets" size="sm" />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-orange-50/80 border border-orange-200 rounded-xl text-xs text-navy leading-relaxed">
                  <strong className="text-highlightOrange block mb-1">Feedback Action Step:</strong>
                  "Your category comparison is solid. In your next revision, explicitly cite the average order value when discussing transaction health."
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM WE SOLVE */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl font-heading font-bold text-navy tracking-tight mb-4">
              The gap between watching tutorials and workplace execution.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Most online learning ends with passive multiple-choice questions or copy-pasted code. Early career learners and self-taught developers face three distinct barriers:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-actionBlue flex items-center justify-center font-bold">1</div>
              <h3 className="font-heading font-bold text-lg text-navy">No Mentor Access</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                College students and self-learners rarely have senior managers or mentors available to review their spreadsheets or analyses line-by-line.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-highlightOrange flex items-center justify-center font-bold">2</div>
              <h3 className="font-heading font-bold text-lg text-navy">Vague Feedback</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Traditional grading gives arbitrary letter grades without explicit rubric criteria, clear strengths, or actionable next steps to revise.
              </p>
            </div>

            <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">3</div>
              <h3 className="font-heading font-bold text-lg text-navy">Empty Portfolios</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Course completion certificates don't prove competence to employers. A verified portfolio showing raw data, calculations, and revisions does.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW SKILLBRIDGE WORKS: THE 5-STEP JOURNEY */}
      <section id="how-it-works" className="py-16 md:py-24 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy tracking-tight">
              How SkillBridge Works
            </h2>
            <p className="text-slate-600 text-base">
              The five-step journey from raw data brief to a published portfolio showcase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={step.num}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                      {step.num}
                    </span>
                    {step.icon}
                  </div>
                  <h3 className="font-heading font-bold text-base text-navy mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* THE MVP CHALLENGE PREVIEW */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-block text-xs font-semibold px-3 py-1 bg-orange-100 text-highlightOrange rounded-md">
                Featured MVP Challenge
              </div>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy tracking-tight">
                Challenge: "Spreadsheet Insights"
              </h2>
              <p className="text-slate-600 leading-relaxed">
                You receive a realistic sales dataset (`sales.csv`) containing 200 order transactions. Your job is to calculate key summaries, produce a clear visual chart, and explain three findings.
              </p>
              <div className="space-y-2.5 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-actionBlue" />
                  <span><strong>Calculations:</strong> Total revenue, monthly totals, top category, average order value.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-actionBlue" />
                  <span><strong>Visual:</strong> Upload one chart image (PNG or JPG).</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-actionBlue" />
                  <span><strong>Evidence:</strong> 3 findings with cited numbers + methodology description.</span>
                </div>
              </div>

              <div className="pt-3">
                <Link
                  to="/challenge"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-navy hover:bg-navy-900 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98]"
                >
                  <span>Inspect Challenge & Rubric</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Rubric Matrix Preview */}
            <div className="lg:col-span-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6">
              <h3 className="font-heading font-bold text-lg text-navy mb-4">4-Level Assessment Rubric</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                      <th className="py-2.5 pr-3 font-semibold">Criterion</th>
                      <th className="py-2.5 px-3 font-semibold">Assessment Mode</th>
                      <th className="py-2.5 pl-3 font-semibold">Target standard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 text-slate-700">
                    <tr>
                      <td className="py-3 pr-3 font-bold text-navy">Accuracy</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px]">DETERMINISTIC</span></td>
                      <td className="py-3 pl-3">Matches stored ground truth within ±0.5% tolerance</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-3 font-bold text-navy">Completeness</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px]">DETERMINISTIC</span></td>
                      <td className="py-3 pl-3">All metrics, chart image, 3 findings, and explanation provided</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-3 font-bold text-navy">Reasoning</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono text-[10px]">AI-ASSISTED</span></td>
                      <td className="py-3 pl-3">Conclusions follow logically from cited sales numbers</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-3 font-bold text-navy">Communication</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono text-[10px]">AI-ASSISTED</span></td>
                      <td className="py-3 pl-3">Transparent method explanation and readable visual presentation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ETHICAL TRANSPARENCY & PILOT PLACEHOLDERS */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Pilot Collaborations & Academic Research
            </span>
          </div>
          {/* Section 6 Honesty rule: Clearly marked placeholders */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center opacity-70">
            <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 font-mono">
              [Partner logo: State College Pilot]
            </div>
            <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 font-mono">
              [Partner logo: Career Mentorship Group]
            </div>
            <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 font-mono">
              [Partner logo: Student Analytics Hub]
            </div>
            <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 font-mono">
              [Partner logo: Non-Profit Workforce Pilot]
            </div>
          </div>
        </div>
      </section>

      {/* SECOND CALL TO ACTION: PILOTS FOR COLLEGES & MENTORING GROUPS */}
      <section id="pilot" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-navy rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-actionBlue-light font-medium">
                  <GraduationCap size={16} /> For Higher Education & Non-Profit Bootcamps
                </div>
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight">
                  Pilot SkillBridge with your students.
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Provide your cohorts with instant, rubric-calibrated evaluation on real-world assignments. Mentors can sample assessments, track agreement rates, and help students graduate with evidence-backed portfolios.
                </p>
                <div className="pt-2 text-xs text-slate-400">
                  Zero setup fees for eligible academic and non-profit partner pilots.
                </div>
              </div>

              {/* Pilot Inquiry Form */}
              <div className="lg:col-span-5 bg-white text-navy rounded-2xl p-6 shadow-xl">
                {pilotSubmitted ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle size={28} weight="fill" />
                    </div>
                    <h3 className="font-heading font-bold text-xl text-navy">Pilot Inquiry Received</h3>
                    <p className="text-xs text-slate-600">
                      Thank you for connecting. Our academic partnerships team will contact {pilotForm.email} within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePilotSubmit} className="space-y-4">
                    <h3 className="font-heading font-bold text-lg text-navy">Request a Pilot Program</h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Institution / Mentoring Org</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metro State University"
                        value={pilotForm.institution}
                        onChange={e => setPilotForm({ ...pilotForm, institution: e.target.value })}
                        className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:border-actionBlue focus:ring-1 focus:ring-actionBlue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="dean@institution.edu"
                        value={pilotForm.email}
                        onChange={e => setPilotForm({ ...pilotForm, email: e.target.value })}
                        className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:border-actionBlue focus:ring-1 focus:ring-actionBlue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Learners in Cohort</label>
                      <select
                        value={pilotForm.learnerCount}
                        onChange={e => setPilotForm({ ...pilotForm, learnerCount: e.target.value })}
                        className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:border-actionBlue focus:ring-1 focus:ring-actionBlue"
                      >
                        <option value="25-50">25 - 50 students</option>
                        <option value="50-200">50 - 200 students</option>
                        <option value="200+">200+ students</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-actionBlue hover:bg-actionBlue-dark text-white font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <PaperPlaneTilt size={16} />
                      <span>Submit Pilot Request</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
