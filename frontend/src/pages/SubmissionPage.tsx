import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api/client';
import {
  UploadSimple,
  CheckCircle,
  FileImage,
  FileText,
  Trash,
  Lightning,
  FloppyDisk,
  WarningCircle,
  ArrowRight,
  CircleNotch,
} from '@phosphor-icons/react';

export const SubmissionPage: React.FC = () => {
  const navigate = useNavigate();

  // Structured answers
  const [totalRevenue, setTotalRevenue] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState<Record<string, string>>({
    Jan: '', Feb: '', Mar: '', Apr: '', May: '', Jun: '',
  });
  const [topCategory, setTopCategory] = useState('');
  const [averageOrderValue, setAverageOrderValue] = useState('');

  // Files
  const [chartFile, setChartFile] = useState<File | null>(null);
  const [chartPreview, setChartPreview] = useState<string | null>(null);
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);

  // Findings
  const [findings, setFindings] = useState([
    { finding: '', figures: '' },
    { finding: '', figures: '' },
    { finding: '', figures: '' },
  ]);

  // Method explanation
  const [explanation, setExplanation] = useState('');

  // UI States
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isInitialMount = useRef(true);

  // Load draft on mount
  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await api.submissions.getDraft();
        if (res.draft) {
          const d = res.draft;
          const ans = d.answers || {};
          if (ans.totalRevenue) setTotalRevenue(String(ans.totalRevenue));
          if (ans.monthlyRevenue) setMonthlyRevenue(ans.monthlyRevenue);
          if (ans.topCategory) setTopCategory(ans.topCategory);
          if (ans.averageOrderValue) setAverageOrderValue(String(ans.averageOrderValue));

          if (Array.isArray(d.findings) && d.findings.length === 3) {
            setFindings(d.findings);
          }
          if (d.explanation) setExplanation(d.explanation);
          setLastSavedTime(new Date(d.updatedAt).toLocaleTimeString());
        }
      } catch (err) {
        console.warn('No existing draft loaded');
      }
    }
    loadDraft();
  }, []);

  // Autosave draft (Debounced)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        const answersObj = {
          totalRevenue: totalRevenue ? parseFloat(totalRevenue) : undefined,
          monthlyRevenue,
          topCategory,
          averageOrderValue: averageOrderValue ? parseFloat(averageOrderValue) : undefined,
        };

        const res = await api.submissions.saveDraft({
          challengeId: 'spreadsheet-insights',
          answers: answersObj,
          findings,
          explanation,
        });

        setAutosaveStatus('saved');
        setLastSavedTime(new Date(res.updatedAt).toLocaleTimeString());
      } catch (err) {
        setAutosaveStatus('idle');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [totalRevenue, monthlyRevenue, topCategory, averageOrderValue, findings, explanation]);

  const handleChartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Chart image exceeds 5MB size limit.');
        return;
      }
      setChartFile(file);
      setChartPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSpreadsheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSpreadsheetFile(file);
    }
  };

  const handleFindingChange = (index: number, field: 'finding' | 'figures', value: string) => {
    const updated = [...findings];
    updated[index][field] = value;
    setFindings(updated);
  };

  // Quick Demo Autofill helpers for reviewers
  const handleAutofillCorrect = () => {
    setTotalRevenue('184609.87');
    setMonthlyRevenue({
      Jan: '24752.80',
      Feb: '34456.09',
      Mar: '34905.41',
      Apr: '28669.60',
      May: '30833.77',
      Jun: '30992.20',
    });
    setTopCategory('Furniture');
    setAverageOrderValue('923.05');

    setFindings([
      {
        finding: 'Furniture is the dominant revenue engine, generating over 59% of total company sales.',
        figures: 'Total Furniture sales: $109,063.69 out of $184,609.87 gross revenue.',
      },
      {
        finding: 'March was the highest revenue month ($34,905.41), closely followed by February ($34,456.09).',
        figures: 'March reached $34,905.41 and February reached $34,456.09.',
      },
      {
        finding: 'Average Order Value remains remarkably stable around $923 per customer transaction.',
        figures: 'AOV of $923.05 calculated across all 200 orders in the H1 period.',
      },
    ]);

    setExplanation(
      'I processed the raw 200 rows by building Pivot Tables in Microsoft Excel. I aggregated revenue by month and category using SUM formulas, verified row consistency against grand totals, and computed average order value by dividing total revenue by total order count.'
    );
  };

  const handleAutofillSlightMistakes = () => {
    setTotalRevenue('184609.87');
    setMonthlyRevenue({
      Jan: '28678.96',
      Feb: '32009.43',
      Mar: '25000.00', // Intentional mistake in March
      Apr: '30454.12',
      May: '32560.10',
      Jun: '29380.30',
    });
    setTopCategory('Electronics'); // Intentional wrong category
    setAverageOrderValue('923.05');

    setFindings([
      {
        finding: 'Electronics is our top category according to my initial check.',
        figures: 'Generated substantial sales.',
      },
      {
        finding: 'March had lower sales than other months.',
        figures: 'Around $25,000.',
      },
      {
        finding: 'Overall volume seems good.',
        figures: '', // Intentional missing figures
      },
    ]);

    setExplanation('Quickly summed up in Google Sheets.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client checks
    if (!totalRevenue || !topCategory || !averageOrderValue) {
      setError('Please fill in all structured calculation fields before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitStage('Running deterministic calculations check against ground truth...');

    try {
      const formData = new FormData();
      formData.append('challengeId', 'spreadsheet-insights');

      const answersObj = {
        totalRevenue: parseFloat(totalRevenue),
        monthlyRevenue: Object.fromEntries(
          Object.entries(monthlyRevenue).map(([k, v]) => [k, parseFloat(v) || 0])
        ),
        topCategory,
        averageOrderValue: parseFloat(averageOrderValue),
      };

      formData.append('answers', JSON.stringify(answersObj));
      formData.append('findings', JSON.stringify(findings));
      formData.append('explanation', explanation);

      if (chartFile) {
        formData.append('chart', chartFile);
      }

      if (spreadsheetFile) {
        formData.append('spreadsheet', spreadsheetFile);
      }

      setTimeout(() => {
        setSubmitStage('Executing AI rubric analysis with Zod schema validation...');
      }, 1200);

      const res = await api.submissions.submit(formData);

      navigate(`/feedback/${res.submission.id}`);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check form inputs and try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header & Autosave Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Submission Studio</span>
          <h1 className="text-3xl font-heading font-bold text-navy mt-0.5">
            Submit "Spreadsheet Insights"
          </h1>
        </div>

        {/* Floating Autosave Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            {autosaveStatus === 'saving' ? (
              <>
                <CircleNotch size={14} className="animate-spin text-actionBlue" />
                <span>Autosaving draft...</span>
              </>
            ) : lastSavedTime ? (
              <>
                <CheckCircle size={14} className="text-emerald-600" weight="fill" />
                <span>Draft autosaved ({lastSavedTime})</span>
              </>
            ) : (
              <span>Autosave active</span>
            )}
          </div>
        </div>
      </div>

      {/* Reviewer / Tester Quick Fill Banner */}
      <div className="my-6 p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-navy">
          <strong className="text-actionBlue block mb-0.5 font-semibold">Demo Quick-Fill Assist</strong>
          Test the dual deterministic + AI pipeline with 1 click using verified ground truth answers or test edge cases.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAutofillCorrect}
            className="px-3 py-1.5 bg-actionBlue hover:bg-actionBlue-dark text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Fill Correct Answers (Meets)
          </button>
          <button
            type="button"
            onClick={handleAutofillSlightMistakes}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Fill with Flaws (For Revision)
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <WarningCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* SECTION 1: STRUCTURED ANSWERS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-heading font-bold text-navy">1. Structured Numerical Answers</h2>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic checks compare these values directly to the dataset ground truth (±0.5% tolerance).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">Total Revenue ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 184609.87"
                value={totalRevenue}
                onChange={e => setTotalRevenue(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:border-actionBlue focus:ring-1 focus:ring-actionBlue font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">Top Category by Revenue</label>
              <select
                required
                value={topCategory}
                onChange={e => setTopCategory(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:border-actionBlue focus:ring-1 focus:ring-actionBlue"
              >
                <option value="">Select Category...</option>
                <option value="Furniture">Furniture</option>
                <option value="Electronics">Electronics</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>
            </div>
          </div>

          {/* Monthly Totals Breakdown */}
          <div>
            <label className="block text-xs font-bold text-navy mb-2">Monthly Revenue Breakdown ($)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                <div key={m} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-mono text-slate-500 uppercase">{m}</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={monthlyRevenue[m] || ''}
                    onChange={e =>
                      setMonthlyRevenue({ ...monthlyRevenue, [m]: e.target.value })
                    }
                    className="w-full mt-1 bg-white text-xs px-2 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-actionBlue"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="sm:w-1/2">
            <label className="block text-xs font-bold text-navy mb-1.5">Average Order Value (AOV) ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 923.05"
              value={averageOrderValue}
              onChange={e => setAverageOrderValue(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:border-actionBlue focus:ring-1 focus:ring-actionBlue font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Total Revenue divided by 200 orders.</span>
          </div>
        </div>

        {/* SECTION 2: CHART UPLOAD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-heading font-bold text-navy">2. Visual Chart Upload</h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload one chart image (PNG or JPG, up to 5 MB) visualizing the revenue pattern or category comparison.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-actionBlue rounded-2xl p-6 text-center cursor-pointer transition-colors relative">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleChartChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadSimple size={36} className="mx-auto text-actionBlue mb-2" />
              <div className="text-sm font-semibold text-navy">
                {chartFile ? chartFile.name : 'Choose or drag & drop chart image'}
              </div>
              <div className="text-xs text-slate-400 mt-1">PNG, JPG up to 5 MB</div>
            </div>

            {chartPreview && (
              <div className="w-48 h-36 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative group">
                <img src={chartPreview} alt="Chart Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setChartFile(null); setChartPreview(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <Trash size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: THREE FINDINGS WITH SUPPORTING FIGURES */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-heading font-bold text-navy">3. Three Analytical Findings</h2>
            <p className="text-xs text-slate-500 mt-1">
              State three distinct conclusions. In the "Figures" box, include the specific numbers (dollars, percentages, units) supporting each claim.
            </p>
          </div>

          <div className="space-y-6">
            {findings.map((f, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-actionBlue uppercase tracking-wider">
                    Finding #{i + 1}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Analytical Statement</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Furniture delivered the highest gross margin and sales volume..."
                    value={f.finding}
                    onChange={e => handleFindingChange(i, 'finding', e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:border-actionBlue bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supporting Quantitative Figures
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $84,150.20 revenue (45.6% of gross total)..."
                    value={f.figures}
                    onChange={e => handleFindingChange(i, 'figures', e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:border-actionBlue bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: EXPLANATION OF METHOD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-heading font-bold text-navy">4. Methodology Explanation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Describe the spreadsheet tools or formulas (e.g. PivotTables, SUMIF, AVERAGE) you used to ensure formula precision.
            </p>
          </div>

          <div>
            <textarea
              required
              rows={4}
              placeholder="Detail your analytical process here (e.g. I imported sales.csv into Google Sheets, created a pivot table by month and category...)"
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:border-actionBlue focus:ring-1 focus:ring-actionBlue leading-relaxed"
            />
          </div>
        </div>

        {/* SECTION 5: OPTIONAL SOURCE SPREADSHEET */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="text-lg font-heading font-bold text-navy">5. Optional File: Your Spreadsheet (.xlsx or .csv)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Optional: Attach your working workbook for inclusion in your portfolio repository.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer border border-slate-200 flex items-center gap-2 transition-colors">
              <FileText size={16} />
              <span>{spreadsheetFile ? spreadsheetFile.name : 'Attach Spreadsheet (.xlsx / .csv)'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleSpreadsheetChange}
                className="hidden"
              />
            </label>
            {spreadsheetFile && (
              <button
                type="button"
                onClick={() => setSpreadsheetFile(null)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* SUBMISSION BUTTON */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Clicking submit triggers deterministic verification and AI rubric evaluation within ~30s.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-actionBlue hover:bg-actionBlue-dark text-white font-semibold text-base rounded-xl shadow-premium hover:shadow-premium-hover transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <CircleNotch size={20} className="animate-spin" />
                <span>Evaluating Submission...</span>
              </>
            ) : (
              <>
                <span>Submit Work for Rubric Assessment</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Processing overlay modal during submission */}
        {submitting && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-actionBlue flex items-center justify-center mx-auto">
                <CircleNotch size={32} className="animate-spin" />
              </div>
              <h3 className="font-heading font-bold text-xl text-navy">Evaluating Submission</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-mono">
                {submitStage}
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                <div className="bg-actionBlue h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
