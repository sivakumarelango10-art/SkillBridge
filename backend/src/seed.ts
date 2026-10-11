import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { generateSalesDataset } from './services/sales-data';
import { runDeterministicChecks } from './services/deterministic';
import { defaultAIEvaluator } from './services/ai-evaluator';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('--- Starting SkillBridge Seed Process ---');

  // 1. Ensure uploads directory exists
  const uploadsDir = path.resolve(process.env.STORAGE_DIR || './uploads');
  const datasetsDir = path.join(uploadsDir, 'datasets');
  const chartsDir = path.join(uploadsDir, 'charts');
  const sheetsDir = path.join(uploadsDir, 'spreadsheets');

  for (const dir of [uploadsDir, datasetsDir, chartsDir, sheetsDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // 2. Generate sales.csv and ground truth
  const { csv, records, groundTruth } = generateSalesDataset(200);
  const salesCsvPath = path.join(datasetsDir, 'sales.csv');
  fs.writeFileSync(salesCsvPath, csv, 'utf-8');
  console.log(`Generated sales.csv with ${records.length} rows at ${salesCsvPath}`);
  console.log(`Ground truth computed: Total Revenue = $${groundTruth.totalRevenue}, Top Category = ${groundTruth.topCategory}, AOV = $${groundTruth.averageOrderValue}`);

  // Create sample SVG chart for demonstrations
  const sampleChartSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
    <rect width="600" height="350" fill="#253653" rx="12"/>
    <text x="300" y="40" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">H1 Monthly Revenue Performance</text>
    <line x1="80" y1="280" x2="540" y2="280" stroke="#62B8E5" stroke-width="2"/>
    <rect x="110" y="140" width="45" height="140" fill="#38A0D8" rx="4"/>
    <text x="132" y="305" fill="#FFFFFF" font-family="sans-serif" font-size="12" text-anchor="middle">Jan</text>
    <rect x="180" y="110" width="45" height="170" fill="#38A0D8" rx="4"/>
    <text x="202" y="305" fill="#FFFFFF" font-family="sans-serif" font-size="12" text-anchor="middle">Feb</text>
    <rect x="250" y="90" width="45" height="190" fill="#E57116" rx="4"/>
    <text x="272" y="305" fill="#FFFFFF" font-family="sans-serif" font-size="12" text-anchor="middle">Mar</text>
    <rect x="320" y="130" width="45" height="150" fill="#38A0D8" rx="4"/>
    <text x="342" y="305" fill="#FFFFFF" font-family="sans-serif" font-size="12" text-anchor="middle">Apr</text>
    <rect x="390" y="115" width="45" height="165" fill="#38A0D8" rx="4"/>
    <text x="412" y="305" fill="#FFFFFF" font-family="sans-serif" font-size="12" text-anchor="middle">May</text>
    <rect x="460" y="100" width="45" height="180" fill="#38A0D8" rx="4"/>
    <text x="482" y="305" fill="#FFFFFF" font-family="sans-serif" font-size="12" text-anchor="middle">Jun</text>
  </svg>`;
  const demoChartPath = path.join(chartsDir, 'sample_revenue_chart.svg');
  fs.writeFileSync(demoChartPath, sampleChartSvg, 'utf-8');

  // 3. Seed Users
  const passwordSalt = await bcrypt.genSalt(10);
  const learnerHash = await bcrypt.hash('Learner123!', passwordSalt);
  const mentorHash = await bcrypt.hash('Mentor123!', passwordSalt);
  const adminHash = await bcrypt.hash('Admin123!', passwordSalt);

  const learner = await prisma.user.upsert({
    where: { email: 'learner@skillbridge.dev' },
    update: { passwordHash: learnerHash },
    create: {
      name: 'Alex Rivera',
      email: 'learner@skillbridge.dev',
      passwordHash: learnerHash,
      role: 'learner',
    },
  });

  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@skillbridge.dev' },
    update: { passwordHash: mentorHash },
    create: {
      name: 'Dr. Evelyn Reed',
      email: 'mentor@skillbridge.dev',
      passwordHash: mentorHash,
      role: 'mentor',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@skillbridge.dev' },
    update: { passwordHash: adminHash },
    create: {
      name: 'SkillBridge Admin',
      email: 'admin@skillbridge.dev',
      passwordHash: adminHash,
      role: 'admin',
    },
  });

  console.log('Seeded Users: learner@skillbridge.dev, mentor@skillbridge.dev, admin@skillbridge.dev');

  // 4. Seed Challenge
  const challenge = await prisma.challenge.upsert({
    where: { id: 'spreadsheet-insights' },
    update: {
      title: 'Spreadsheet Insights',
      instructions: 'You receive a sample sales dataset. Calculate key summaries, create one chart, and explain three findings.',
      datasetPath: '/uploads/datasets/sales.csv',
    },
    create: {
      id: 'spreadsheet-insights',
      title: 'Spreadsheet Insights',
      instructions: 'You receive a sample sales dataset. Calculate key summaries, create one chart, and explain three findings.',
      datasetPath: '/uploads/datasets/sales.csv',
    },
  });

  // 5. Seed AnswerKey
  await prisma.answerKey.upsert({
    where: { challengeId: challenge.id },
    update: { values: groundTruth as any },
    create: {
      challengeId: challenge.id,
      values: groundTruth as any,
    },
  });

  // 6. Seed Rubric v1
  const rubricCriteria = [
    {
      name: 'Accuracy',
      description: 'Calculations match the dataset within ±0.5% tolerance.',
      type: 'deterministic',
      levels: {
        'Meets': 'All key calculations (total revenue, monthly totals, top category, AOV) match dataset values within 0.5% tolerance.',
        'Mostly meets': 'Overall revenue and majority of monthly totals are correct, with minor variances.',
        'Partly meets': 'Total revenue is in the correct range, but several monthly figures or AOV deviate significantly.',
        'Not yet': 'Calculations contain major errors or omit essential metrics.',
      },
    },
    {
      name: 'Completeness',
      description: 'All required parts submitted: metrics, visual chart, 3 findings with figures, methodology explanation.',
      type: 'deterministic',
      levels: {
        'Meets': 'All structured fields, chart visual, 3 quantified findings, and methodology explanation are complete.',
        'Mostly meets': 'Most components submitted, but one minor item (e.g. 1 figure in finding) is omitted.',
        'Partly meets': 'Multiple components missing (e.g. no chart image or fewer than 3 findings).',
        'Not yet': 'Incomplete submission lacking essential components.',
      },
    },
    {
      name: 'Reasoning',
      description: 'Conclusions follow logically from the quantitative evidence and sales data.',
      type: 'ai-assisted',
      levels: {
        'Meets': 'Findings demonstrate logical workplace deductions directly supported by cited data points.',
        'Mostly meets': 'Sound reasoning provided, though some interpretations need stronger data linkage.',
        'Partly meets': 'Basic observations made, but lack quantitative backing or business context.',
        'Not yet': 'Conclusions do not follow from the data or are unsupported.',
      },
    },
    {
      name: 'Communication',
      description: 'Explanations and chart labels are clear, professional, and accessible.',
      type: 'ai-assisted',
      levels: {
        'Meets': 'Methodology is clearly explained with transparent formula descriptions and well-labeled visuals.',
        'Mostly meets': 'Methodology is understandable, with minor ambiguities in explanation or chart labeling.',
        'Partly meets': 'Explanation is very brief or lacks clarity on analytical methods.',
        'Not yet': 'Explanations are unclear or missing.',
      },
    },
  ];

  await prisma.rubric.upsert({
    where: {
      challengeId_version: {
        challengeId: challenge.id,
        version: 1,
      },
    },
    update: { criteria: rubricCriteria as any },
    create: {
      challengeId: challenge.id,
      version: 1,
      criteria: rubricCriteria as any,
    },
  });

  console.log('Seeded Challenge "Spreadsheet Insights", AnswerKey, and Rubric v1.');

  // 7. Seed Sample Initial Submission (Attempt 1) for Alex Rivera
  // Attempt 1: Slightly inaccurate on March total and slightly short explanation
  const attempt1Monthly = { ...groundTruth.monthlyRevenue, Mar: groundTruth.monthlyRevenue.Mar * 0.90 }; // 10% off on March
  const attempt1Answers = {
    totalRevenue: groundTruth.totalRevenue - (groundTruth.monthlyRevenue.Mar * 0.10),
    monthlyRevenue: attempt1Monthly,
    topCategory: groundTruth.topCategory,
    averageOrderValue: Math.round(((groundTruth.totalRevenue - (groundTruth.monthlyRevenue.Mar * 0.10)) / 200) * 100) / 100,
  };

  const attempt1Findings = [
    {
      finding: `${groundTruth.topCategory} generated the highest revenue among all product categories.`,
      figures: `Accounting for approximately $${groundTruth.categoryRevenues[groundTruth.topCategory]} in sales.`,
    },
    {
      finding: 'Q1 sales showed a steady month-over-month trajectory.',
      figures: `January was $${groundTruth.monthlyRevenue.Jan} and February reached $${groundTruth.monthlyRevenue.Feb}.`,
    },
    {
      finding: 'The average order value is around $270 per customer order.',
      figures: `Calculated from total orders.`,
    },
  ];

  const attempt1Det = runDeterministicChecks({
    answers: attempt1Answers as any,
    chartPath: '/uploads/charts/sample_revenue_chart.svg',
    findings: attempt1Findings,
    explanation: 'I used Excel to sum the revenue column and grouped rows by month.',
    spreadsheetPath: null,
  }, groundTruth);

  const attempt1Ai = await defaultAIEvaluator.evaluate({
    task: challenge.instructions,
    rubricCriteria: rubricCriteria.map(c => ({ name: c.name, description: c.description })),
    answers: attempt1Answers as any,
    deterministicResults: attempt1Det,
    findings: attempt1Findings,
    explanation: 'I used Excel to sum the revenue column and grouped rows by month.',
    chartDescription: 'Bar chart showing monthly revenue distribution from Jan to Jun.',
  });

  const existingSub1 = await prisma.submission.findFirst({
    where: { userId: learner.id, challengeId: challenge.id, attempt: 1 },
  });

  let sub1 = existingSub1;
  if (!sub1) {
    sub1 = await prisma.submission.create({
      data: {
        userId: learner.id,
        challengeId: challenge.id,
        attempt: 1,
        answers: attempt1Answers as any,
        chartPath: '/uploads/charts/sample_revenue_chart.svg',
        findings: attempt1Findings as any,
        explanation: 'I used Excel to sum the revenue column and grouped rows by month.',
        status: 'feedback_ready',
        assessments: {
          create: {
            rubricVersion: 1,
            deterministic: attempt1Det as any,
            aiOutput: attempt1Ai.data as any,
            model: attempt1Ai.model,
          },
        },
      },
    });
    console.log('Seeded Attempt 1 for Alex Rivera (status: feedback_ready)');
  }

  // 8. Seed Mentor Review sample for Attempt 1
  const assessment1 = await prisma.assessment.findFirst({
    where: { submissionId: sub1.id },
  });

  if (assessment1) {
    const existingMentorReview = await prisma.mentorReview.findFirst({
      where: { assessmentId: assessment1.id, mentorId: mentor.id },
    });

    if (!existingMentorReview) {
      await prisma.mentorReview.create({
        data: {
          assessmentId: assessment1.id,
          mentorId: mentor.id,
          levels: {
            Accuracy: attempt1Det.accuracy.level,
            Completeness: attempt1Det.completeness.level,
            Reasoning: 'Partly meets',
            Communication: 'Partly meets',
          },
          notes: 'Good initial start. Need to refine the March aggregation formula and expand on the business implications of finding #3.',
        },
      });
      console.log('Seeded mentor sample review for Dr. Evelyn Reed');
    }
  }

  console.log('--- SkillBridge Database Seed Complete! ---');
}

// Execute if run directly
if (require.main === module) {
  seedDatabase()
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
