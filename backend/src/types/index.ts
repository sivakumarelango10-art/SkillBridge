export type CriterionLevel = 'Not yet' | 'Partly meets' | 'Mostly meets' | 'Meets';

export interface CriterionDefinition {
  name: 'Accuracy' | 'Completeness' | 'Reasoning' | 'Communication';
  description: string;
  type: 'deterministic' | 'ai-assisted';
  levels: Record<CriterionLevel, string>;
}

export interface GroundTruthValues {
  totalRevenue: number;
  monthlyRevenue: Record<string, number>;
  topCategory: string;
  categoryRevenues: Record<string, number>;
  averageOrderValue: number;
  totalOrders: number;
}

export interface StructuredAnswers {
  totalRevenue: number;
  monthlyRevenue: Record<string, number>;
  topCategory: string;
  averageOrderValue: number;
}

export interface Finding {
  finding: string;
  figures: string;
}

export interface CriterionFeedback {
  name: 'Accuracy' | 'Completeness' | 'Reasoning' | 'Communication';
  level: CriterionLevel;
  strengths: string[];
  missing: string[];
  next_steps: string[];
}

export interface AIEvaluationResponse {
  criteria: CriterionFeedback[];
  overall_next_step: string;
}

export interface DeterministicResult {
  accuracy: {
    level: CriterionLevel;
    passed: boolean;
    details: {
      totalRevenueCheck: { passed: boolean; learner: number; expected: number; diffPct: number };
      monthlyRevenueCheck: { passed: boolean; details: Record<string, { passed: boolean; learner: number; expected: number; diffPct: number }> };
      topCategoryCheck: { passed: boolean; learner: string; expected: string };
      aovCheck: { passed: boolean; learner: number; expected: number; diffPct: number };
    };
    strengths: string[];
    missing: string[];
    next_steps: string[];
  };
  completeness: {
    level: CriterionLevel;
    passed: boolean;
    checklist: {
      hasStructuredAnswers: boolean;
      hasChart: boolean;
      findingsCount: number;
      allFindingsHaveFigures: boolean;
      hasExplanation: boolean;
      hasOptionalSpreadsheet: boolean;
    };
    strengths: string[];
    missing: string[];
    next_steps: string[];
  };
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'mentor' | 'admin';
}
