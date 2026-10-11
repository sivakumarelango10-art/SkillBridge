import { evaluateAccuracy, evaluateCompleteness, isWithinTolerance, runDeterministicChecks } from '../services/deterministic';
import { GroundTruthValues, StructuredAnswers, Finding } from '../types';

describe('Deterministic Assessment Engine', () => {
  const sampleGroundTruth: GroundTruthValues = {
    totalRevenue: 54320.50,
    monthlyRevenue: {
      'Jan': 8400.00,
      'Feb': 9100.50,
      'Mar': 9500.00,
      'Apr': 8800.00,
      'May': 9200.00,
      'Jun': 9320.00,
    },
    topCategory: 'Electronics',
    categoryRevenues: {
      'Electronics': 26000.50,
      'Furniture': 18320.00,
      'Office Supplies': 10000.00,
    },
    averageOrderValue: 271.60,
    totalOrders: 200,
  };

  describe('isWithinTolerance', () => {
    it('passes for exact number match', () => {
      const res = isWithinTolerance(54320.50, 54320.50);
      expect(res.passed).toBe(true);
      expect(res.diffPct).toBe(0);
    });

    it('passes for numbers within 0.5% tolerance (+0.3%)', () => {
      const slightlyOff = 54320.50 * 1.003; // +0.3%
      const res = isWithinTolerance(slightlyOff, 54320.50);
      expect(res.passed).toBe(true);
    });

    it('fails for numbers exceeding 0.5% tolerance (+1.2%)', () => {
      const tooFarOff = 54320.50 * 1.012; // +1.2%
      const res = isWithinTolerance(tooFarOff, 54320.50);
      expect(res.passed).toBe(false);
      expect(res.diffPct).toBeGreaterThan(0.5);
    });

    it('fails for completely wrong or NaN input', () => {
      const res = isWithinTolerance(NaN, 54320.50);
      expect(res.passed).toBe(false);
    });
  });

  describe('evaluateAccuracy', () => {
    it('awards "Meets" when all calculations match within 0.5% tolerance', () => {
      const correctAnswers: StructuredAnswers = {
        totalRevenue: 54320.50,
        monthlyRevenue: { ...sampleGroundTruth.monthlyRevenue },
        topCategory: 'Electronics',
        averageOrderValue: 271.60,
      };

      const result = evaluateAccuracy(correctAnswers, sampleGroundTruth);
      expect(result.level).toBe('Meets');
      expect(result.passed).toBe(true);
      expect(result.details.totalRevenueCheck.passed).toBe(true);
      expect(result.details.topCategoryCheck.passed).toBe(true);
      expect(result.details.aovCheck.passed).toBe(true);
      expect(result.details.monthlyRevenueCheck.passed).toBe(true);
      expect(result.strengths.length).toBeGreaterThanOrEqual(3);
      expect(result.missing.length).toBe(0);
    });

    it('detects inaccurate total revenue and returns next steps', () => {
      const incorrectTotal: StructuredAnswers = {
        totalRevenue: 40000.00, // significantly wrong
        monthlyRevenue: { ...sampleGroundTruth.monthlyRevenue },
        topCategory: 'Electronics',
        averageOrderValue: 271.60,
      };

      const result = evaluateAccuracy(incorrectTotal, sampleGroundTruth);
      expect(result.details.totalRevenueCheck.passed).toBe(false);
      expect(result.missing.some(m => m.includes('Total revenue'))).toBe(true);
      expect(result.next_steps.some(ns => ns.includes('Recheck your total revenue'))).toBe(true);
    });

    it('catches wrong category selection', () => {
      const wrongCat: StructuredAnswers = {
        totalRevenue: 54320.50,
        monthlyRevenue: { ...sampleGroundTruth.monthlyRevenue },
        topCategory: 'Furniture', // Wrong
        averageOrderValue: 271.60,
      };

      const result = evaluateAccuracy(wrongCat, sampleGroundTruth);
      expect(result.details.topCategoryCheck.passed).toBe(false);
      expect(result.missing.some(m => m.includes('Top category'))).toBe(true);
    });

    it('downgrades to "Partly meets" or "Not yet" when multiple values are inaccurate', () => {
      const badlyWrongAnswers: StructuredAnswers = {
        totalRevenue: 10000.00,
        monthlyRevenue: {
          'Jan': 1000,
          'Feb': 1000,
          'Mar': 1000,
          'Apr': 1000,
          'May': 1000,
          'Jun': 1000,
        },
        topCategory: 'Office Supplies',
        averageOrderValue: 50.00,
      };

      const result = evaluateAccuracy(badlyWrongAnswers, sampleGroundTruth);
      expect(['Partly meets', 'Not yet']).toContain(result.level);
      expect(result.passed).toBe(false);
    });
  });

  describe('evaluateCompleteness', () => {
    const fullFindings: Finding[] = [
      {
        finding: 'Electronics is the clear revenue driver across all regions.',
        figures: 'Generated $26,000.50 out of $54,320.50 (47.8% of total revenue).',
      },
      {
        finding: 'March was the highest revenue month of the first half.',
        figures: '$9,500.00 revenue in March, a 13% increase over January.',
      },
      {
        finding: 'The average transaction size is relatively stable across quarters.',
        figures: 'Average Order Value is $271.60 across 200 order transactions.',
      },
    ];

    it('awards "Meets" for a complete submission', () => {
      const completeSubmission = {
        answers: {
          totalRevenue: 54320.50,
          monthlyRevenue: sampleGroundTruth.monthlyRevenue,
          topCategory: 'Electronics',
          averageOrderValue: 271.60,
        },
        chartPath: '/uploads/charts/test-chart.png',
        findings: fullFindings,
        explanation: 'I used Excel pivot tables to group orders by month and category, calculating sum of revenue and average transaction values.',
        spreadsheetPath: '/uploads/spreadsheets/sales_model.xlsx',
      };

      const result = evaluateCompleteness(completeSubmission);
      expect(result.level).toBe('Meets');
      expect(result.checklist.hasChart).toBe(true);
      expect(result.checklist.findingsCount).toBe(3);
      expect(result.checklist.allFindingsHaveFigures).toBe(true);
      expect(result.checklist.hasExplanation).toBe(true);
    });

    it('flags missing chart image', () => {
      const noChartSubmission = {
        answers: {
          totalRevenue: 54320.50,
          monthlyRevenue: sampleGroundTruth.monthlyRevenue,
          topCategory: 'Electronics',
          averageOrderValue: 271.60,
        },
        chartPath: '',
        findings: fullFindings,
        explanation: 'I used Excel pivot tables to aggregate revenues and verified formulas.',
      };

      const result = evaluateCompleteness(noChartSubmission);
      expect(result.checklist.hasChart).toBe(false);
      expect(result.missing.some(m => m.includes('chart'))).toBe(true);
      expect(result.level).not.toBe('Meets');
    });

    it('flags missing figures in findings', () => {
      const findingsWithoutFigures: Finding[] = [
        { finding: 'Electronics is the best category.', figures: '' },
        { finding: 'March had high sales.', figures: '9500' },
        { finding: 'Average order was high.', figures: '' },
      ];

      const submission = {
        answers: {
          totalRevenue: 54320.50,
          monthlyRevenue: sampleGroundTruth.monthlyRevenue,
          topCategory: 'Electronics',
          averageOrderValue: 271.60,
        },
        chartPath: '/uploads/charts/chart.png',
        findings: findingsWithoutFigures,
        explanation: 'Used pivot tables in Google Sheets to analyze trends.',
      };

      const result = evaluateCompleteness(submission);
      expect(result.checklist.allFindingsHaveFigures).toBe(false);
      expect(result.missing.some(m => m.includes('quantitative figures'))).toBe(true);
    });
  });

  describe('runDeterministicChecks', () => {
    it('runs both accuracy and completeness in tandem', () => {
      const submission = {
        answers: {
          totalRevenue: 54320.50,
          monthlyRevenue: sampleGroundTruth.monthlyRevenue,
          topCategory: 'Electronics',
          averageOrderValue: 271.60,
        },
        chartPath: '/uploads/charts/chart.png',
        findings: [
          { finding: 'Finding 1 text here', figures: 'Fig 1' },
          { finding: 'Finding 2 text here', figures: 'Fig 2' },
          { finding: 'Finding 3 text here', figures: 'Fig 3' },
        ],
        explanation: 'A solid explanation of data processing methods exceeding ten words cleanly.',
      };

      const results = runDeterministicChecks(submission, sampleGroundTruth);
      expect(results.accuracy).toBeDefined();
      expect(results.completeness).toBeDefined();
      expect(results.accuracy.level).toBe('Meets');
      expect(results.completeness.level).toBe('Meets');
    });
  });
});
