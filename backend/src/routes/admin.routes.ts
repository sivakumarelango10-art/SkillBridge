import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';
import { seedDatabase } from '../seed';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth, requireRole('admin'));

// POST /api/admin/seed (Re-seed or reset data)
router.post('/seed', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await seedDatabase();
    res.json({ message: 'Database successfully re-seeded with challenge, rubric v1, sales dataset, and ground truth answer key.' });
  } catch (err: any) {
    console.error('Admin seed error:', err);
    res.status(500).json({ error: 'Failed to re-seed database.' });
  }
});

// GET /api/admin/status
router.get('/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [userCount, submissionCount, assessmentCount, challenge] = await Promise.all([
      prisma.user.count(),
      prisma.submission.count({ where: { status: { not: 'draft' } } }),
      prisma.assessment.count(),
      prisma.challenge.findUnique({
        where: { id: 'spreadsheet-insights' },
        include: { answerKey: true, rubrics: true },
      }),
    ]);

    res.json({
      metrics: {
        users: userCount,
        submissions: submissionCount,
        assessments: assessmentCount,
      },
      challenge: challenge ? {
        id: challenge.id,
        title: challenge.title,
        rubricVersions: challenge.rubrics.length,
        hasAnswerKey: !!challenge.answerKey,
      } : null,
    });
  } catch (err: any) {
    console.error('Admin status error:', err);
    res.status(500).json({ error: 'Failed to load system status.' });
  }
});

export default router;
