import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/portfolio (Learner's Portfolio Manager)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get all user submissions with their portfolio item status
    const submissions = await prisma.submission.findMany({
      where: { userId, status: { not: 'draft' } },
      orderBy: { attempt: 'asc' },
      include: {
        portfolioItems: { where: { userId } },
        assessments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    // Get active share link if any
    const activeShareLink = await prisma.shareLink.findFirst({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      items: submissions.map(s => ({
        submissionId: s.id,
        attempt: s.attempt,
        createdAt: s.createdAt,
        inPortfolio: s.portfolioItems.length > 0 && s.portfolioItems[0].visible,
        answers: s.answers,
        chartPath: s.chartPath,
        findings: s.findings,
        explanation: s.explanation,
        assessment: s.assessments[0] || null,
      })),
      shareLink: activeShareLink ? {
        token: activeShareLink.token,
        createdAt: activeShareLink.createdAt,
      } : null,
    });
  } catch (err: any) {
    console.error('Error fetching portfolio:', err);
    res.status(500).json({ error: 'Failed to retrieve portfolio items.' });
  }
});

// POST /api/portfolio/toggle (Toggle submission inclusion in portfolio)
router.post('/toggle', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { submissionId, visible } = req.body;

    if (!submissionId) {
      res.status(400).json({ error: 'submissionId is required.' });
      return;
    }

    // Verify submission belongs to this user
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.userId !== userId) {
      res.status(403).json({ error: 'Unauthorized to modify this submission.' });
      return;
    }

    const portfolioItem = await prisma.portfolioItem.upsert({
      where: {
        userId_submissionId: { userId, submissionId },
      },
      update: { visible: Boolean(visible) },
      create: {
        userId,
        submissionId,
        visible: Boolean(visible),
      },
    });

    res.json({
      message: visible ? 'Submission added to portfolio.' : 'Submission removed from portfolio.',
      portfolioItem,
    });
  } catch (err: any) {
    console.error('Error toggling portfolio item:', err);
    res.status(500).json({ error: 'Failed to update portfolio visibility.' });
  }
});

// POST /api/portfolio/share (Generate unguessable public share link token)
router.post('/share', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Check if active unrevoked link already exists
    let shareLink = await prisma.shareLink.findFirst({
      where: { userId, revokedAt: null },
    });

    if (!shareLink) {
      // 48-character unguessable cryptographic token
      const token = crypto.randomBytes(24).toString('hex');
      shareLink = await prisma.shareLink.create({
        data: { userId, token },
      });
    }

    res.json({
      message: 'Share link generated',
      token: shareLink.token,
      shareUrl: `/portfolio/view/${shareLink.token}`,
    });
  } catch (err: any) {
    console.error('Error generating share link:', err);
    res.status(500).json({ error: 'Failed to generate share link.' });
  }
});

// DELETE /api/portfolio/share (Revoke public share link token)
router.delete('/share', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.shareLink.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.json({ message: 'Public share link has been revoked. The portfolio is now completely private.' });
  } catch (err: any) {
    console.error('Error revoking share link:', err);
    res.status(500).json({ error: 'Failed to revoke share link.' });
  }
});

// GET /api/portfolio/public/:token (Public View - No Authentication Required)
router.get('/public/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        user: { select: { id: true, name: true, createdAt: true } },
      },
    });

    if (!shareLink || shareLink.revokedAt !== null) {
      res.status(404).json({ error: 'This portfolio link does not exist or has been revoked by the author.' });
      return;
    }

    // Fetch all submissions marked as visible by this user
    const portfolioEntries = await prisma.portfolioItem.findMany({
      where: { userId: shareLink.userId, visible: true },
      include: {
        submission: {
          include: {
            challenge: { select: { id: true, title: true, instructions: true } },
            assessments: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      learner: {
        name: shareLink.user.name,
        joinedAt: shareLink.user.createdAt,
      },
      projects: portfolioEntries.map(entry => {
        const sub = entry.submission;
        const assess = sub.assessments[0] || null;
        return {
          id: sub.id,
          attempt: sub.attempt,
          date: sub.createdAt,
          challengeTitle: sub.challenge.title,
          challengeInstructions: sub.challenge.instructions,
          answers: sub.answers,
          chartPath: sub.chartPath,
          findings: sub.findings,
          explanation: sub.explanation,
          assessment: assess ? {
            rubricVersion: assess.rubricVersion,
            deterministic: assess.deterministic,
            aiOutput: assess.aiOutput,
            model: assess.model,
            evaluatedAt: assess.createdAt,
          } : null,
        };
      }),
    });
  } catch (err: any) {
    console.error('Error retrieving public portfolio:', err);
    res.status(500).json({ error: 'Failed to load public portfolio.' });
  }
});

export default router;
