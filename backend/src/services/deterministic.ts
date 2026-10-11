import { GroundTruthValues, StructuredAnswers, Finding, DeterministicResult, CriterionLevel } from '../types';

export function isWithinTolerance(learner: number, expected: number, tolerance = 0.005): { passed: boolean; diffPct: number } {
  if (isNaN(learner) || learner === null || learner === undefined) {
    return { passed: false, diffPct: 1 };
  }
  const diff = Math.abs(learner - expected);
  const diffPct = expected === 0 ? (diff === 0 ? 0 : 1) : diff / Math.abs(expected);
  return {
    passed: diffPct <= tolerance,
    diffPct: Math.round(diffPct * 10000) / 100, // percentage e.g. 0.35%
  };
}

export function evaluateAccuracy(answers: StructuredAnswers, groundTruth: GroundTruthValues): DeterministicResult['accuracy'] {
  const strengths: string[] = [];
  const missing: string[] = [];
  const next_steps: string[] = [];

  // 1. Total revenue check (±0.5%)
  const totalRevCheck = isWithinTolerance(Number(answers.totalRevenue), groundTruth.totalRevenue);
  if (totalRevCheck.passed) {
    strengths.push(`Total revenue of $${Number(answers.totalRevenue).toLocaleString()} matches the dataset closely.`);
  } else {
    missing.push(`Total revenue ($${Number(answers.totalRevenue || 0).toLocaleString()}) does not match expected ($${groundTruth.totalRevenue.toLocaleString()}).`);
    next_steps.push(`Recheck your total revenue calculation formula; ensure you sum the revenue column for all 200 rows without omitting any rows.`);
  }

  // 2. Monthly revenue check
  const monthlyDetails: Record<string, { passed: boolean; learner: number; expected: number; diffPct: number }> = {};
  let monthsPassed = 0;
  const monthKeys = Object.keys(groundTruth.monthlyRevenue);

  for (const m of monthKeys) {
    const learnerVal = answers.monthlyRevenue ? Number(answers.monthlyRevenue[m]) : NaN;
    const expectedVal = groundTruth.monthlyRevenue[m];
    const check = isWithinTolerance(learnerVal, expectedVal);
    monthlyDetails[m] = {
      passed: check.passed,
      learner: learnerVal || 0,
      expected: expectedVal,
      diffPct: check.diffPct,
    };
    if (check.passed) {
      monthsPassed++;
    }
  }

  if (monthsPassed === monthKeys.length) {
    strengths.push(`All ${monthKeys.length} monthly revenue totals are accurate within 0.5% tolerance.`);
  } else if (monthsPassed > 0) {
    strengths.push(`${monthsPassed} out of ${monthKeys.length} monthly totals are calculated correctly.`);
    const failedMonths = monthKeys.filter(m => !monthlyDetails[m].passed);
    missing.push(`Monthly totals for ${failedMonths.join(', ')} deviate from dataset values.`);
    next_steps.push(`Verify the date filtering or PivotTable group settings for months: ${failedMonths.join(', ')}.`);
  } else {
    missing.push(`None of the monthly revenue totals match the expected monthly values.`);
    next_steps.push(`Group the dataset by the 'month' column and sum 'revenue' for each month to calculate accurate monthly totals.`);
  }

  // 3. Top category check
  const learnerTopCategory = (answers.topCategory || '').trim().toLowerCase();
  const expectedTopCategory = groundTruth.topCategory.toLowerCase();
  const topCatPassed = learnerTopCategory === expectedTopCategory;

  if (topCatPassed) {
    strengths.push(`Top category correctly identified as '${groundTruth.topCategory}'.`);
  } else {
    missing.push(`Top category '${answers.topCategory || 'N/A'}' does not match the highest revenue category.`);
    next_steps.push(`Aggregate total revenue by the 'category' column to compare Electronics, Furniture, and Office Supplies.`);
  }

  // 4. AOV check (±0.5%)
  const aovCheck = isWithinTolerance(Number(answers.averageOrderValue), groundTruth.averageOrderValue);
  if (aovCheck.passed) {
    strengths.push(`Average Order Value (AOV) of $${Number(answers.averageOrderValue).toFixed(2)} is verified.`);
  } else {
    missing.push(`Average Order Value of $${Number(answers.averageOrderValue || 0).toFixed(2)} does not match expected $${groundTruth.averageOrderValue.toFixed(2)}.`);
    next_steps.push(`Divide total revenue by the total count of order rows (${groundTruth.totalOrders}) to recalculate AOV.`);
  }

  // Determine Level:
  // Points: totalRev (2 pts), monthly (max 4 pts proportional), topCategory (2 pts), AOV (2 pts) = Total 10 pts
  let score = 0;
  if (totalRevCheck.passed) score += 2;
  score += Math.round((monthsPassed / monthKeys.length) * 4);
  if (topCatPassed) score += 2;
  if (aovCheck.passed) score += 2;

  let level: CriterionLevel;
  if (score >= 9) {
    level = 'Meets';
  } else if (score >= 7) {
    level = 'Mostly meets';
  } else if (score >= 4) {
    level = 'Partly meets';
  } else {
    level = 'Not yet';
  }

  const passed = level === 'Meets' || level === 'Mostly meets';

  return {
    level,
    passed,
    details: {
      totalRevenueCheck: {
        passed: totalRevCheck.passed,
        learner: Number(answers.totalRevenue) || 0,
        expected: groundTruth.totalRevenue,
        diffPct: totalRevCheck.diffPct,
      },
      monthlyRevenueCheck: {
        passed: monthsPassed === monthKeys.length,
        details: monthlyDetails,
      },
      topCategoryCheck: {
        passed: topCatPassed,
        learner: answers.topCategory || '',
        expected: groundTruth.topCategory,
      },
      aovCheck: {
        passed: aovCheck.passed,
        learner: Number(answers.averageOrderValue) || 0,
        expected: groundTruth.averageOrderValue,
        diffPct: aovCheck.diffPct,
      },
    },
    strengths,
    missing,
    next_steps,
  };
}

export function evaluateCompleteness(submission: {
  answers: StructuredAnswers;
  chartPath?: string | null;
  findings: Finding[];
  explanation: string;
  spreadsheetPath?: string | null;
}): DeterministicResult['completeness'] {
  const strengths: string[] = [];
  const missing: string[] = [];
  const next_steps: string[] = [];

  // Checklist items
  const hasStructuredAnswers = !!(
    submission.answers &&
    submission.answers.totalRevenue !== undefined &&
    submission.answers.topCategory &&
    submission.answers.averageOrderValue !== undefined &&
    submission.answers.monthlyRevenue &&
    Object.keys(submission.answers.monthlyRevenue).length > 0
  );

  const hasChart = !!(submission.chartPath && submission.chartPath.trim().length > 0);

  const findingsList = Array.isArray(submission.findings) ? submission.findings : [];
  const validFindings = findingsList.filter(f => f && f.finding && f.finding.trim().length > 5);
  const findingsWithFigures = validFindings.filter(f => f.figures && f.figures.trim().length > 0);
  const allFindingsHaveFigures = validFindings.length >= 3 && findingsWithFigures.length >= 3;

  const hasExplanation = !!(submission.explanation && submission.explanation.trim().split(/\s+/).length >= 10);
  const hasOptionalSpreadsheet = !!(submission.spreadsheetPath && submission.spreadsheetPath.trim().length > 0);

  if (hasStructuredAnswers) {
    strengths.push('Complete structured metrics provided including total, monthly totals, top category, and AOV.');
  } else {
    missing.push('Missing one or more structured answer metrics.');
    next_steps.push('Ensure all summary boxes (Total, Monthly, Category, AOV) are filled in.');
  }

  if (hasChart) {
    strengths.push('Visual chart file successfully uploaded and attached.');
  } else {
    missing.push('No visual chart image was submitted.');
    next_steps.push('Create and upload a clear chart image (PNG or JPG) showing revenue trends or category comparisons.');
  }

  if (validFindings.length >= 3) {
    strengths.push(`Provided 3 distinct analytical findings.`);
  } else {
    missing.push(`Only submitted ${validFindings.length} of the required 3 findings.`);
    next_steps.push(`Add ${3 - validFindings.length} more specific finding(s) about the sales patterns.`);
  }

  if (allFindingsHaveFigures) {
    strengths.push('All submitted findings include supporting numerical figures.');
  } else {
    missing.push('One or more findings lack specific supporting quantitative figures.');
    next_steps.push('Provide exact figures (dollar amounts, percentages, or unit counts) in each finding box.');
  }

  if (hasExplanation) {
    strengths.push('Included an explanation describing your spreadsheet analysis method.');
  } else {
    missing.push('Explanation of methodology is missing or too brief (minimum 10 words recommended).');
    next_steps.push('Write a brief paragraph detailing the spreadsheet tools or formulas (e.g. SUMIF, pivot tables) you used.');
  }

  if (hasOptionalSpreadsheet) {
    strengths.push('Optional source spreadsheet file attached for reference.');
  }

  // Scoring
  let checksPassed = 0;
  if (hasStructuredAnswers) checksPassed++;
  if (hasChart) checksPassed++;
  if (validFindings.length >= 3) checksPassed++;
  if (allFindingsHaveFigures) checksPassed++;
  if (hasExplanation) checksPassed++;

  let level: CriterionLevel;
  if (checksPassed === 5) {
    level = 'Meets';
  } else if (checksPassed === 4) {
    level = 'Mostly meets';
  } else if (checksPassed >= 2) {
    level = 'Partly meets';
  } else {
    level = 'Not yet';
  }

  return {
    level,
    passed: level === 'Meets' || level === 'Mostly meets',
    checklist: {
      hasStructuredAnswers,
      hasChart,
      findingsCount: validFindings.length,
      allFindingsHaveFigures,
      hasExplanation,
      hasOptionalSpreadsheet,
    },
    strengths,
    missing,
    next_steps,
  };
}

export function runDeterministicChecks(
  submission: {
    answers: StructuredAnswers;
    chartPath?: string | null;
    findings: Finding[];
    explanation: string;
    spreadsheetPath?: string | null;
  },
  groundTruth: GroundTruthValues
): DeterministicResult {
  const accuracy = evaluateAccuracy(submission.answers, groundTruth);
  const completeness = evaluateCompleteness(submission);
  return { accuracy, completeness };
}
