import { AIEvaluationSchema, AIEvaluatorService } from '../services/ai-evaluator';
import { DeterministicResult } from '../types';

describe('AI Evaluator & Zod Validation', () => {
  const service = new AIEvaluatorService();

  const mockDeterministic: DeterministicResult = {
    accuracy: {
      level: 'Meets',
      passed: true,
      details: {} as any,
      strengths: ['Calculations verified'],
      missing: [],
      next_steps: ['Keep up the precision'],
    },
    completeness: {
      level: 'Mostly meets',
      passed: true,
      checklist: {
        hasStructuredAnswers: true,
        hasChart: false,
        findingsCount: 3,
        allFindingsHaveFigures: true,
        hasExplanation: true,
        hasOptionalSpreadsheet: false,
      },
      strengths: ['Answers and findings provided'],
      missing: ['Chart image missing'],
      next_steps: ['Upload a chart'],
    },
  };

  it('validates a compliant evaluation schema', () => {
    const validJson = {
      criteria: [
        {
          name: 'Accuracy',
          level: 'Meets',
          strengths: ['Accurate totals'],
          missing: [],
          next_steps: ['Continue standard practice'],
        },
        {
          name: 'Completeness',
          level: 'Mostly meets',
          strengths: ['Form filled'],
          missing: ['No chart'],
          next_steps: ['Add chart'],
        },
        {
          name: 'Reasoning',
          level: 'Meets',
          strengths: ['Good logic'],
          missing: [],
          next_steps: ['Deepen analysis'],
        },
        {
          name: 'Communication',
          level: 'Partly meets',
          strengths: ['Readable text'],
          missing: ['Unclear chart labels'],
          next_steps: ['Label axes clearly'],
        },
      ],
      overall_next_step: 'Focus on adding the chart and clarifying explanations.',
    };

    expect(() => AIEvaluationSchema.parse(validJson)).not.toThrow();
  });

  it('rejects invalid criteria names or invalid levels', () => {
    const invalidJson = {
      criteria: [
        {
          name: 'InvalidCriterionName',
          level: 'Super Excellent', // not in enum
          strengths: ['none'],
          missing: [],
          next_steps: ['none'],
        },
      ],
      overall_next_step: 'short',
    };

    expect(() => AIEvaluationSchema.parse(invalidJson)).toThrow();
  });

  it('produces valid heuristic assessment adhering to Zod schema', async () => {
    const payload = {
      task: 'Spreadsheet Insights MVP',
      rubricCriteria: [],
      answers: {
        totalRevenue: 54320.50,
        monthlyRevenue: { 'Jan': 8400 },
        topCategory: 'Electronics',
        averageOrderValue: 271.60,
      },
      deterministicResults: mockDeterministic,
      findings: [
        { finding: 'Electronics had highest sales volume', figures: '$26,000 revenue' },
        { finding: 'March showed strong growth trend', figures: '$9,500 total' },
        { finding: 'AOV remained consistent throughout', figures: '$271.60 average' },
      ],
      explanation: 'Detailed process using Excel functions and pivot tables to aggregate sales by category and month.',
      chartDescription: 'Chart image uploaded successfully',
    };

    const res = await service.evaluate(payload);
    expect(res.status).toBe('completed');
    expect(res.data).toBeDefined();
    expect(() => AIEvaluationSchema.parse(res.data)).not.toThrow();
    // Deterministic levels must be enforced
    const accuracy = res.data?.criteria.find(c => c.name === 'Accuracy');
    const completeness = res.data?.criteria.find(c => c.name === 'Completeness');
    expect(accuracy?.level).toBe('Meets');
    expect(completeness?.level).toBe('Mostly meets');
  });
});
