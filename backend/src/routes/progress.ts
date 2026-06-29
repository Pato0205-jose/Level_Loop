import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import {
  recordExerciseResult,
  normalizeProgressForToday,
  shouldResetWeeklyXp,
  type UserProgress,
} from '../lib/progressLogic.js';

const router = Router();

const topicProgressSchema = z.object({
  completed: z.boolean(),
  completedAt: z.number().optional(),
  bestScore: z.number(),
  totalXp: z.number(),
  attempts: z.number(),
  lastPlayedAt: z.number().optional(),
});

const progressSchema = z.object({
  totalXp: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastActiveDate: z.string(),
  topics: z.record(z.string(), topicProgressSchema),
});

const exerciseResultSchema = z.object({
  topicId: z.string().min(1),
  correct: z.number().int().min(0),
  total: z.number().int().min(1),
  livesLeft: z.number().int().min(0),
});

const EMPTY_PROGRESS: UserProgress = {
  totalXp: 0,
  streakDays: 0,
  longestStreak: 0,
  lastActiveDate: '',
  topics: {},
};

function toProgressPayload(row: {
  totalXp: number;
  streakDays: number;
  longestStreak: number;
  lastActiveDate: string | null;
  topics: unknown;
}) {
  return {
    totalXp: row.totalXp,
    streakDays: row.streakDays,
    longestStreak: row.longestStreak,
    lastActiveDate: row.lastActiveDate ?? '',
    topics: (row.topics as Record<string, unknown>) ?? {},
  };
}

async function loadUserProgress(userId: string): Promise<UserProgress> {
  const row = await prisma.progress.findUnique({ where: { userId } });
  if (!row) return { ...EMPTY_PROGRESS, topics: {} };

  let progress = normalizeProgressForToday(toProgressPayload(row) as UserProgress);
  const weeklyXp = shouldResetWeeklyXp(progress.lastActiveDate) ? 0 : row.weeklyXp;

  const streakChanged = progress.streakDays !== row.streakDays;
  const weeklyChanged = weeklyXp !== row.weeklyXp;

  if (streakChanged || weeklyChanged) {
    await prisma.progress.update({
      where: { userId },
      data: {
        ...(streakChanged ? { streakDays: progress.streakDays } : {}),
        ...(weeklyChanged ? { weeklyXp } : {}),
      },
    });
  }

  return progress;
}

router.get('/me', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const progress = await loadUserProgress(userId);
  return res.json({ progress });
});

router.put('/me', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const parsed = progressSchema.safeParse(req.body?.progress ?? req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
  }

  const data = parsed.data;
  const existing = await prisma.progress.findUnique({ where: { userId } });

  const row = await prisma.progress.upsert({
    where: { userId },
    create: {
      userId,
      totalXp: data.totalXp,
      weeklyXp: 0,
      streakDays: data.streakDays,
      longestStreak: data.longestStreak,
      lastActiveDate: data.lastActiveDate || null,
      topics: data.topics,
    },
    update: {
      totalXp: data.totalXp,
      streakDays: data.streakDays,
      longestStreak: data.longestStreak,
      lastActiveDate: data.lastActiveDate || null,
      topics: data.topics,
      weeklyXp: existing?.weeklyXp ?? 0,
    },
  });

  return res.json({ progress: toProgressPayload(row) });
});

router.post('/exercise-result', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const parsed = exerciseResultSchema.safeParse(req.body?.result ?? req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
  }

  const prev = await loadUserProgress(userId);
  const existingRow = await prisma.progress.findUnique({ where: { userId } });
  const { progress, delta, weeklyXpGain } = recordExerciseResult(prev, parsed.data);

  const weeklyBase = shouldResetWeeklyXp(prev.lastActiveDate)
    ? 0
    : (existingRow?.weeklyXp ?? 0);

  const row = await prisma.progress.upsert({
    where: { userId },
    create: {
      userId,
      totalXp: progress.totalXp,
      weeklyXp: weeklyXpGain,
      streakDays: progress.streakDays,
      longestStreak: progress.longestStreak,
      lastActiveDate: progress.lastActiveDate || null,
      topics: progress.topics,
    },
    update: {
      totalXp: progress.totalXp,
      weeklyXp: weeklyBase + weeklyXpGain,
      streakDays: progress.streakDays,
      longestStreak: progress.longestStreak,
      lastActiveDate: progress.lastActiveDate || null,
      topics: progress.topics,
    },
  });

  return res.json({
    progress: toProgressPayload(row),
    delta,
  });
});

export { router as progressRouter };
