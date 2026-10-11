import { Router, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { defaultStorage } from '../storage/storage.service';
import { runDeterministicChecks } from '../services/deterministic';
import { defaultAIEvaluator } from '../services/ai-evaluator';
import { aiRateLimiter } from '../middleware/rate-limiter';
import { GroundTruthValues } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Multer memory storage so storage interface can handle persisting and validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Draft autosave in-memory / lightweight store or DB
// For drafts, we can store in DB as status = 'draft' with attempt = 0 or latest attempt draft
// GET /api/submissions/draft
router.get('/draft', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const draft = await prisma.submission.findFirst({
      where: { userId, status: 'draft' },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ draft: draft || null });
  } catch (err: any) {
    console.error('Error getting draft:', err);
    res.status(500).json({ error: 'Failed to retrieve draft.' });
  }
});

// POST /api/submissions/draft (Autosave draft)
router.post('/draft', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { challengeId = 'spreadsheet-insights', answers, findings, explanation } = req.body;

    const existingDraft = await prisma.submission.findFirst({
      where: { userId, status: 'draft' },
    });

    if (existingDraft) {
      const updated = await prisma.submission.update({
        where: { id: existingDraft.id },
        data: {
          answers: answers || {},
          findings: findings || [],
          explanation: explanation || '',
        },
      });
      res.json({ message: 'Draft autosaved', draftId: updated.id, updatedAt: updated.updatedAt });
    } else {
      const created = await prisma.submission.create({
        data: {
          userId,
          challengeId,
          attempt: 0,
          answers: answers || {},
          findings: findings || [],
          explanation: explanation || '',
          status: 'draft',
        },
      });
      res.json({ message: 'Draft created', draftId: created.id, updatedAt: created.updatedAt });
    }
  } catch (err: any) {
    console.error('Error saving draft:', err);
    res.status(500).json({ error: 'Failed to autosave draft.' });
  }
});

// POST /api/submissions (Full Submission & Assessment Execution)
router.post(
  '/',
  requireAuth,
  aiRateLimiter,
  upload.fields([
    { name: 'chart', maxCount: 1 },
    { name: 'spreadsheet', maxCount: 1 },
  ]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const chartFile = files?.['chart']?.[0];
      const spreadsheetFile = files?.['spreadsheet']?.[0];

      // Parse payload fields
      const challengeId = req.body.challengeId || 'spreadsheet-insights';
      let answers: any = {};
      let findings: any = [];
      const explanation: string = req.body.explanation || '';

      try {
        answers = typeof req.body.answers === 'string' ? JSON.parse(req.body.answers) : req.body.answers;
      } catch {
        answers = {};
      }

      try {
        findings = typeof req.body.findings === 'string' ? JSON.parse(req.body.findings) : req.body.findings;
      } catch {
        findings = [];
      }

      // Validate chart upload if present
      let chartPath: string | null = null;
      if (chartFile) {
        const validation = defaultStorage.validateFile(
          chartFile,
          ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
          5 * 1024 * 1024
        );
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }
        chartPath = await defaultStorage.saveFile(chartFile.buffer, chartFile.originalname, 'charts');
      }

      // Validate optional spreadsheet file if present
      let spreadsheetPath: string | null = null;
      if (spreadsheetFile) {
        const sheetValidation = defaultStorage.validateFile(
          spreadsheetFile,
          [
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream',
          ],
          15 * 1024 * 1024
        );
        if (!sheetValidation.valid) {
          res.status(400).json({ error: sheetValidation.error });
          return;
        }
        spreadsheetPath = await defaultStorage.saveFile(spreadsheetFile.buffer, spreadsheetFile.originalname, 'spreadsheets');
      }

      // Retrieve challenge, answer key, and rubric
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
          answerKey: true,
          rubrics: { orderBy: { version: 'desc' }, take: 1 },
        },
      });

      if (!challenge || !challenge.answerKey) {
        res.status(400).json({ error: 'Challenge or ground truth answer key not configured.' });
        return;
      }

      const groundTruth = challenge.answerKey.values as unknown as GroundTruthValues;
      const latestRubric = challenge.rubrics[0];
      const rubricVersion = latestRubric ? latestRubric.version : 1;

      // Determine attempt number
      const existingSubmissionsCount = await prisma.submission.count({
        where: { userId, challengeId, status: { not: 'draft' } },
      });
      const attemptNumber = existingSubmissionsCount + 1;

      // STEP 1: DETERMINISTIC CHECKS
      const deterministicResults = runDeterministicChecks(
        {
          answers,
          chartPath,
          findings,
          explanation,
          spreadsheetPath,
        },
        groundTruth
      );

      // STEP 2 & 3: AI EVALUATOR PIPELINE
      const aiPayload = {
        task: challenge.instructions,
        rubricCriteria: (latestRubric?.criteria as any[])?.map(c => ({ name: c.name, description: c.description })) || [],
        answers,
        deterministicResults,
        findings,
        explanation,
        chartDescription: chartPath
          ? `Visual chart uploaded (${chartFile?.originalname || 'chart file'}). Shows learner visual representation.`
          : 'No visual chart attached.',
      };

      const aiEvaluation = await defaultAIEvaluator.evaluate(aiPayload);

      // Create Submission record
      const submission = await prisma.submission.create({
        data: {
          userId,
          challengeId,
          attempt: attemptNumber,
          answers: answers as any,
          chartPath,
          spreadsheetPath,
          findings: findings as any,
          explanation,
          status: 'feedback_ready',
          assessments: {
            create: {
              rubricVersion,
              deterministic: deterministicResults as any,
              aiOutput: (aiEvaluation.data || { status: 'feedback_pending_review' }) as any,
              model: aiEvaluation.model,
            },
          },
        },
        include: {
          assessments: true,
        },
      });

      // Clear any pending draft
      await prisma.submission.deleteMany({
        where: { userId, challengeId, status: 'draft' },
      });

      res.status(201).json({
        message: 'Submission evaluated successfully',
        submission: {
          id: submission.id,
          attempt: submission.attempt,
          status: submission.status,
          createdAt: submission.createdAt,
          assessment: submission.assessments[0],
        },
      });
    } catch (err: any) {
      console.error('Submission processing error:', err);
      res.status(500).json({ error: 'Failed to process and assess submission.' });
    }
  }
);

// GET /api/submissions (User Submissions List for Dashboard & Version History)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const submissions = await prisma.submission.findMany({
      where: { userId, status: { not: 'draft' } },
      orderBy: { attempt: 'asc' },
      include: {
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        portfolioItems: {
          where: { userId },
        },
      },
    });

    res.json({
      submissions: submissions.map(s => ({
        id: s.id,
        attempt: s.attempt,
        status: s.status,
        answers: s.answers,
        chartPath: s.chartPath,
        spreadsheetPath: s.spreadsheetPath,
        findings: s.findings,
        explanation: s.explanation,
        createdAt: s.createdAt,
        inPortfolio: s.portfolioItems.length > 0 && s.portfolioItems[0].visible,
        assessment: s.assessments[0] || null,
      })),
    });
  } catch (err: any) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Failed to retrieve submission history.' });
  }
});

// GET /api/submissions/:id (Single Submission with Full Assessment)
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        portfolioItems: {
          where: { userId },
        },
      },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    // Role check: learner can view own submission, mentor or admin can view any
    if (submission.userId !== userId && req.user!.role === 'learner') {
      res.status(403).json({ error: 'Unauthorized to view this submission.' });
      return;
    }

    res.json({
      submission: {
        id: submission.id,
        attempt: submission.attempt,
        status: submission.status,
        answers: submission.answers,
        chartPath: submission.chartPath,
        spreadsheetPath: submission.spreadsheetPath,
        findings: submission.findings,
        explanation: submission.explanation,
        createdAt: submission.createdAt,
        inPortfolio: submission.portfolioItems.length > 0 && submission.portfolioItems[0].visible,
        assessment: submission.assessments[0] || null,
      },
    });
  } catch (err: any) {
    console.error('Error fetching submission details:', err);
    res.status(500).json({ error: 'Failed to retrieve submission details.' });
  }
});

export default router;
