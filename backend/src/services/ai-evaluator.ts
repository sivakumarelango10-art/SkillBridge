import { z } from 'zod';
import { CriterionLevel, DeterministicResult, Finding, StructuredAnswers, AIEvaluationResponse } from '../types';

export const CriterionFeedbackSchema = z.object({
  name: z.enum(['Accuracy', 'Completeness', 'Reasoning', 'Communication']),
  level: z.enum(['Not yet', 'Partly meets', 'Mostly meets', 'Meets']),
  strengths: z.array(z.string()).min(1),
  missing: z.array(z.string()),
  next_steps: z.array(z.string()).min(1),
});

export const AIEvaluationSchema = z.object({
  criteria: z.array(CriterionFeedbackSchema).min(2),
  overall_next_step: z.string().min(5),
});

export interface AssessmentPayload {
  task: string;
  rubricCriteria: Array<{ name: string; description: string }>;
  answers: StructuredAnswers;
  deterministicResults: DeterministicResult;
  findings: Finding[];
  explanation: string;
  chartDescription: string;
}

export interface EvaluationResult {
  status: 'completed' | 'feedback_pending_review';
  data?: AIEvaluationResponse;
  model: string;
  rawResponse?: string;
  error?: string;
}

export class AIEvaluatorService {
  private apiKey: string;
  private provider: string;
  private modelName: string;

  constructor() {
    this.provider = (process.env.AI_PROVIDER || (process.env.GROQ_API_KEY ? 'groq' : 'gemini')).toLowerCase();
    this.apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
    if (this.provider === 'groq') {
      this.modelName = process.env.AI_MODEL || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    } else if (this.provider === 'openai') {
      this.modelName = process.env.AI_MODEL || 'gpt-4o-mini';
    } else {
      this.modelName = process.env.AI_MODEL || 'gemini-1.5-flash';
    }
  }

  buildPrompt(payload: AssessmentPayload, retryContext?: string): string {
    return `You are a rigorous, supportive workplace assessment evaluator for SkillBridge.
Assess the learner's work strictly against the rubric for the 'Spreadsheet Insights' task.

TASK:
${payload.task}

RUBRIC CRITERIA:
1. Accuracy: Calculations match the dataset. (Already determined by deterministic check: Level = ${payload.deterministicResults.accuracy.level})
2. Completeness: All required parts submitted. (Already determined by deterministic check: Level = ${payload.deterministicResults.completeness.level})
3. Reasoning: Conclusions follow logically from the quantitative evidence and figures.
4. Communication: Explanations are lucid, terminology is sound, and chart labels/visuals are clear.

DETERMINISTIC EVALUATION OUTCOME (DO NOT RECOMPUTE NUMBERS OR CHANGE THESE SCORES):
- Accuracy Level: ${payload.deterministicResults.accuracy.level}
  Strengths: ${payload.deterministicResults.accuracy.strengths.join('; ')}
  Missing: ${payload.deterministicResults.accuracy.missing.join('; ') || 'None'}
- Completeness Level: ${payload.deterministicResults.completeness.level}
  Strengths: ${payload.deterministicResults.completeness.strengths.join('; ')}
  Missing: ${payload.deterministicResults.completeness.missing.join('; ') || 'None'}

LEARNER'S TEXT ANSWERS:
- Three Findings with Supporting Figures:
${payload.findings.map((f, i) => `  Finding ${i + 1}: "${f.finding}" (Figures: "${f.figures}")`).join('\n')}

- Learner's Explanation of Method:
"${payload.explanation}"

- Chart Description / Attached Status:
${payload.chartDescription}

REQUIREMENTS:
- For 'Accuracy' and 'Completeness': use the deterministic levels (${payload.deterministicResults.accuracy.level} and ${payload.deterministicResults.completeness.level}).
- For 'Reasoning': evaluate if the findings make sound logical deductions from their figures. Level must be one of: 'Not yet', 'Partly meets', 'Mostly meets', 'Meets'.
- For 'Communication': evaluate the clarity and professionalism of the explanation and findings. Level must be one of: 'Not yet', 'Partly meets', 'Mostly meets', 'Meets'.
- Describe performance as "performance on this challenge". Never call it certification or guarantee employability.
- Always name specific strengths, missing requirements, and actionable next steps.
${retryContext ? `\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${retryContext}\nPlease ensure strict valid JSON formatting conforming to schema.\n` : ''}

Respond with ONLY valid JSON adhering strictly to this JSON format (no markdown fences, no extra text):
{
  "criteria": [
    {
      "name": "Accuracy",
      "level": "${payload.deterministicResults.accuracy.level}",
      "strengths": ["..."],
      "missing": ["..."],
      "next_steps": ["..."]
    },
    {
      "name": "Completeness",
      "level": "${payload.deterministicResults.completeness.level}",
      "strengths": ["..."],
      "missing": ["..."],
      "next_steps": ["..."]
    },
    {
      "name": "Reasoning",
      "level": "Meets | Mostly meets | Partly meets | Not yet",
      "strengths": ["..."],
      "missing": ["..."],
      "next_steps": ["..."]
    },
    {
      "name": "Communication",
      "level": "Meets | Mostly meets | Partly meets | Not yet",
      "strengths": ["..."],
      "missing": ["..."],
      "next_steps": ["..."]
    }
  ],
  "overall_next_step": "A concise, motivating summary of what the learner should prioritize in revision."
}`;
  }

  async evaluate(payload: AssessmentPayload): Promise<EvaluationResult> {
    // If no API key configured, use high-fidelity heuristic AI evaluator directly
    if (!this.apiKey) {
      const heuristicData = this.generateHeuristicAssessment(payload);
      return {
        status: 'completed',
        data: heuristicData,
        model: 'heuristic-ai-evaluator',
      };
    }

    // Try call with 1 retry
    let lastError = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const prompt = this.buildPrompt(payload, attempt > 1 ? lastError : undefined);
        let rawText = '';

        if (this.provider === 'groq' || process.env.GROQ_API_KEY) {
          rawText = await this.callGroq(prompt);
        } else if (this.provider === 'openai' || process.env.OPENAI_API_KEY) {
          rawText = await this.callOpenAI(prompt);
        } else {
          rawText = await this.callGemini(prompt);
        }

        // Clean any code block backticks if returned
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // Strict Zod validation
        const validated = AIEvaluationSchema.parse(parsed);

        // Enforce deterministic levels for Accuracy and Completeness
        for (const crit of validated.criteria) {
          if (crit.name === 'Accuracy') {
            crit.level = payload.deterministicResults.accuracy.level;
            if (crit.strengths.length === 0) crit.strengths = payload.deterministicResults.accuracy.strengths;
            if (crit.missing.length === 0) crit.missing = payload.deterministicResults.accuracy.missing;
            if (crit.next_steps.length === 0) crit.next_steps = payload.deterministicResults.accuracy.next_steps;
          }
          if (crit.name === 'Completeness') {
            crit.level = payload.deterministicResults.completeness.level;
            if (crit.strengths.length === 0) crit.strengths = payload.deterministicResults.completeness.strengths;
            if (crit.missing.length === 0) crit.missing = payload.deterministicResults.completeness.missing;
            if (crit.next_steps.length === 0) crit.next_steps = payload.deterministicResults.completeness.next_steps;
          }
        }

        return {
          status: 'completed',
          data: validated as AIEvaluationResponse,
          model: this.modelName,
          rawResponse: rawText,
        };
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    // Fall back to "feedback pending review" state if retry fails
    return {
      status: 'feedback_pending_review',
      model: this.modelName,
      error: `AI response validation failed after retry: ${lastError}`,
    };
  }

  private async callGroq(prompt: string): Promise<string> {
    const key = process.env.GROQ_API_KEY || this.apiKey;
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: this.modelName || 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errBody}`);
    }

    const json: any = await response.json();
    return json?.choices?.[0]?.message?.content || '';
  }

  private async callGemini(prompt: string): Promise<string> {
    const key = process.env.GEMINI_API_KEY || this.apiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    const json: any = await response.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const key = process.env.OPENAI_API_KEY || this.apiKey;
    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: this.modelName.includes('gpt') ? this.modelName : 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errBody}`);
    }

    const json: any = await response.json();
    return json?.choices?.[0]?.message?.content || '';
  }

  /**
   * High-fidelity heuristic evaluator used when no API key is provided
   * or as an instant local mock engine.
   */
  generateHeuristicAssessment(payload: AssessmentPayload): AIEvaluationResponse {
    const validFindings = (payload.findings || []).filter(f => f && f.finding && f.finding.length > 5);
    const findingsWithFigures = validFindings.filter(f => f.figures && f.figures.length > 0);
    const explanationWords = (payload.explanation || '').trim().split(/\s+/).filter(Boolean).length;

    // Evaluate Reasoning
    let reasoningLevel: CriterionLevel = 'Not yet';
    const reasoningStrengths: string[] = [];
    const reasoningMissing: string[] = [];
    const reasoningNextSteps: string[] = [];

    if (validFindings.length >= 3 && findingsWithFigures.length >= 3) {
      // Check if figures mention numbers or percentages
      const hasQuantFigures = findingsWithFigures.every(f => /\d/.test(f.figures));
      if (hasQuantFigures && payload.deterministicResults.accuracy.passed) {
        reasoningLevel = 'Meets';
        reasoningStrengths.push('Key conclusions are directly backed by verified sales figures and percentages.');
        reasoningStrengths.push('Identified logical patterns distinguishing category performance and monthly trends.');
        reasoningNextSteps.push('To build further expertise, consider exploring segmenting regional performance by product line.');
      } else if (hasQuantFigures) {
        reasoningLevel = 'Mostly meets';
        reasoningStrengths.push('Findings attempt logical deductions with cited metrics.');
        reasoningMissing.push('Some conclusions draw from figures that deviate from true dataset sums.');
        reasoningNextSteps.push('Reconcile findings with corrected calculation summaries before drawing strategic insights.');
      } else {
        reasoningLevel = 'Partly meets';
        reasoningStrengths.push('Observations describe noticeable trends.');
        reasoningMissing.push('Supporting figures lack explicit numerical quantities or percentage calculations.');
        reasoningNextSteps.push('Always quantify insights (e.g., "$X revenue increase" or "Y% of overall sales").');
      }
    } else if (validFindings.length >= 1) {
      reasoningLevel = 'Partly meets';
      reasoningStrengths.push('Initial insights identify general sales movements.');
      reasoningMissing.push('Requires three comprehensive findings connecting data to commercial implications.');
      reasoningNextSteps.push('Expand each finding to explain WHY the trend happened and what action it suggests.');
    } else {
      reasoningLevel = 'Not yet';
      reasoningMissing.push('No substantive analytical conclusions provided.');
      reasoningNextSteps.push('Review the data to state 3 clear findings backed by dollar values.');
    }

    // Evaluate Communication
    let commLevel: CriterionLevel = 'Not yet';
    const commStrengths: string[] = [];
    const commMissing: string[] = [];
    const commNextSteps: string[] = [];

    const hasChart = payload.deterministicResults.completeness.checklist.hasChart;

    if (explanationWords >= 30 && hasChart) {
      commLevel = 'Meets';
      commStrengths.push('Methodology explanation is thorough, professional, and easy for stakeholders to trace.');
      commStrengths.push('Accompanying chart visually anchors the narrative.');
      commNextSteps.push('Maintain this clear standard of documentation in real workplace presentations.');
    } else if (explanationWords >= 15 && hasChart) {
      commLevel = 'Mostly meets';
      commStrengths.push('Methodology is stated clearly with chart visual attached.');
      commMissing.push('Explanation could elaborate more on data verification and formula choices.');
      commNextSteps.push('Describe the specific formulas (e.g. SUMIF, pivot tables) used to build trust in your analysis.');
    } else if (explanationWords >= 10 || hasChart) {
      commLevel = 'Partly meets';
      commStrengths.push('Basic explanation or visual submitted.');
      if (!hasChart) {
        commMissing.push('Visual chart missing to help non-technical stakeholders quickly digest results.');
        commNextSteps.push('Include a clean bar or line chart with descriptive title and labeled axes.');
      } else {
        commMissing.push('Explanation of methodology is brief.');
        commNextSteps.push('Write at least 2-3 sentences explaining your analytical workflow.');
      }
    } else {
      commLevel = 'Not yet';
      commMissing.push('Communication lacks sufficient methodological context and visual presentation.');
      commNextSteps.push('Provide a structured explanation of how you analyzed the data and upload a clear chart.');
    }

    const accuracyStrengths = [...payload.deterministicResults.accuracy.strengths];
    if (accuracyStrengths.length === 0) accuracyStrengths.push('Submitted initial calculations for evaluation.');

    const accuracyNextSteps = [...payload.deterministicResults.accuracy.next_steps];
    if (accuracyNextSteps.length === 0) accuracyNextSteps.push('Maintain audit checks on sales formulas.');

    const completenessStrengths = [...payload.deterministicResults.completeness.strengths];
    if (completenessStrengths.length === 0) completenessStrengths.push('Initiated the submission process.');

    const completenessNextSteps = [...payload.deterministicResults.completeness.next_steps];
    if (completenessNextSteps.length === 0) completenessNextSteps.push('Complete all required submission sections.');

    let overallNextStep = '';
    if (payload.deterministicResults.accuracy.level !== 'Meets') {
      overallNextStep = 'Focus first on recalculating your numerical summaries to match the dataset, then refresh your findings with the corrected numbers.';
    } else if (reasoningLevel !== 'Meets') {
      overallNextStep = 'Your calculations are solid! Strengthen your findings by connecting each observation directly to actionable business takeaways.';
    } else if (commLevel !== 'Meets') {
      overallNextStep = 'Your analysis is accurate and reasoned; refine your written methodology explanation and ensure your chart visual has clear labels.';
    } else {
      overallNextStep = 'Outstanding work across all criteria! Your submission meets workplace standards and is ready to be published to your portfolio.';
    }

    return {
      criteria: [
        {
          name: 'Accuracy',
          level: payload.deterministicResults.accuracy.level,
          strengths: accuracyStrengths,
          missing: payload.deterministicResults.accuracy.missing,
          next_steps: accuracyNextSteps,
        },
        {
          name: 'Completeness',
          level: payload.deterministicResults.completeness.level,
          strengths: completenessStrengths,
          missing: payload.deterministicResults.completeness.missing,
          next_steps: completenessNextSteps,
        },
        {
          name: 'Reasoning',
          level: reasoningLevel,
          strengths: reasoningStrengths,
          missing: reasoningMissing,
          next_steps: reasoningNextSteps,
        },
        {
          name: 'Communication',
          level: commLevel,
          strengths: commStrengths,
          missing: commMissing,
          next_steps: commNextSteps,
        },
      ],
      overall_next_step: overallNextStep,
    };
  }
}

export const defaultAIEvaluator = new AIEvaluatorService();
