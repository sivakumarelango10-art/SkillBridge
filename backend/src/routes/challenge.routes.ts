import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { defaultStorage } from '../storage/storage.service';

const router = Router();
const prisma = new PrismaClient();

// GET /api/challenges/active
router.get('/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const challenge = await prisma.challenge.findFirst({
      where: { id: 'spreadsheet-insights' },
      include: {
        rubrics: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!challenge) {
      res.status(404).json({ error: 'Active challenge not found. Please ensure seed has run.' });
      return;
    }

    const latestRubric = challenge.rubrics[0] || null;

    res.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        instructions: challenge.instructions,
        datasetPath: challenge.datasetPath,
        rubric: latestRubric ? {
          version: latestRubric.version,
          criteria: latestRubric.criteria,
        } : null,
      },
    });
  } catch (err: any) {
    console.error('Error fetching active challenge:', err);
    res.status(500).json({ error: 'Failed to retrieve challenge details.' });
  }
});

// GET /api/challenges/:id/dataset
router.get('/:id/dataset', async (req: Request, res: Response): Promise<void> => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
    });

    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found.' });
      return;
    }

    const absPath = defaultStorage.getAbsolutePath(challenge.datasetPath);

    if (!fs.existsSync(absPath)) {
      res.status(404).json({ error: 'Dataset file not found on disk.' });
      return;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales.csv"');
    fs.createReadStream(absPath).pipe(res);
  } catch (err: any) {
    console.error('Error downloading dataset:', err);
    res.status(500).json({ error: 'Could not stream dataset file.' });
  }
});

export default router;
