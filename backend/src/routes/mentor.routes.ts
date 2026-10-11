import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Require mentor or admin role for all routes in this file
router.use(requireAuth, requireRole('mentor', 'admin'));

// GET /api/mentor/assessments (Sampled queue of assessments)
router.get('/assessments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mentorId = req.user!.id;

    // Fetch assessments with submissions, learner info, and any existing review by this mentor
    const assessments = await prisma.assessment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        submission: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            challenge: { select: { title: true } },
          },
        },
        mentorReviews: {
          where: { mentorId },
        },
      },
    });

    res.json({
      assessments: assessments.map(a => ({
        id: a.id,
        createdAt: a.createdAt,
        model: a.model,
        rubricVersion: a.rubricVersion,
        deterministic: a.deterministic,
        aiOutput: a.aiOutput,
        submission: {
          id: a.submission.id,
          attempt: a.submission.attempt,
          learnerName: a.submission.user.name,
          challengeTitle: a.submission.challenge.title,
          answers: a.submission.answers,
          chartPath: a.submission.chartPath,
          findings: a.submission.findings,
          explanation: a.submission.explanation,
        },
        myReview: a.mentorReviews[0] || null,
      })),
    });
  } catch (err: any) {
    console.error('Error fetching mentor assessments:', err);
    res.status(500).json({ error: 'Failed to load assessment queue.' });
  }
});

// POST /api/mentor/reviews (Submit mentor criterion levels and notes)
router.post('/reviews', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mentorId = req.user!.id;
    const { assessmentId, levels, notes } = req.body;

    if (!assessmentId || !levels) {
      res.status(400).json({ error: 'assessmentId and levels are required.' });
      return;
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    // Upsert mentor review
    const existingReview = await prisma.mentorReview.findFirst({
      where: { assessmentId, mentorId },
    });

    let review;
    if (existingReview) {
      review = await prisma.mentorReview.update({
        where: { id: existingReview.id },
        data: {
          levels: levels as any,
          notes: notes || null,
        },
      });
    } else {
      review = await prisma.mentorReview.create({
        data: {
          assessmentId,
          mentorId,
          levels: levels as any,
          notes: notes || null,
        },
      });
    }

    res.json({
      message: 'Mentor review saved successfully.',
      review,
    });
  } catch (err: any) {
    console.error('Error saving mentor review:', err);
    res.status(500).json({ error: 'Failed to save mentor evaluation.' });
  }
});

// GET /api/mentor/agreement (Agreement summary against AI evaluations)
router.get('/agreement', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Fetch all mentor reviews across the system
    const allReviews = await prisma.mentorReview.findMany({
      include: {
        assessment: true,
      },
    });

    if (allReviews.length === 0) {
      res.json({
        totalReviews: 0,
        overallAgreementRate: 0,
        criteriaBreakdown: {
          Accuracy: { total: 0, agreed: 0, rate: 0 },
          Completeness: { total: 0, agreed: 0, rate: 0 },
          Reasoning: { total: 0, agreed: 0, rate: 0 },
          Communication: { total: 0, agreed: 0, rate: 0 },
        },
      });
      return;
    }

    const criteriaNames = ['Accuracy', 'Completeness', 'Reasoning', 'Communication'];
    const breakdown: Record<string, { total: number; agreed: number; rate: number }> = {
      Accuracy: { total: 0, agreed: 0, rate: 0 },
      Completeness: { total: 0, agreed: 0, rate: 0 },
      Reasoning: { total: 0, agreed: 0, rate: 0 },
      Communication: { total: 0, agreed: 0, rate: 0 },
    };

    let totalComparisons = 0;
    let totalAgreed = 0;

    for (const review of allReviews) {
      const mentorLevels = review.levels as Record<string, string>;
      const aiData = review.assessment.aiOutput as any;
      const aiCriteriaList = (aiData?.criteria || []) as Array<{ name: string; level: string }>;
      const aiLevelMap: Record<string, string> = {};

      for (const c of aiCriteriaList) {
        aiLevelMap[c.name] = c.level;
      }

      for (const name of criteriaNames) {
        const mLevel = mentorLevels?.[name];
        const aLevel = aiLevelMap?.[name];

        if (mLevel && aLevel) {
          breakdown[name].total++;
          totalComparisons++;
          if (mLevel.toLowerCase() === aLevel.toLowerCase()) {
            breakdown[name].agreed++;
            totalAgreed++;
          }
        }
      }
    }

    // Compute rates
    for (const name of criteriaNames) {
      const b = breakdown[name];
      b.rate = b.total > 0 ? Math.round((b.agreed / b.total) * 1000) / 10 : 0;
    }

    const overallRate = totalComparisons > 0 ? Math.round((totalAgreed / totalComparisons) * 1000) / 10 : 0;

    res.json({
      totalReviews: allReviews.length,
      totalComparisons,
      totalAgreed,
      overallAgreementRate: overallRate,
      criteriaBreakdown: breakdown,
    });
  } catch (err: any) {
    console.error('Error calculating agreement rate:', err);
    res.status(500).json({ error: 'Failed to calculate mentor agreement.' });
  }
});

export default router;
