import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { syncUnlockedAchievements } from '../lib/achievementsLogic.js';
import { type UserProgress } from '../lib/progressLogic.js';

const router = Router();

const unlockedMapSchema = z.record(z.string(), z.number().int().positive());

const progressSchema = z.object({
  totalXp: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastActiveDate: z.string(),
  topics: z.record(
    z.string(),
    z.object({
      completed: z.boolean(),
      completedAt: z.number().optional(),
      bestScore: z.number(),
      totalXp: z.number(),
      attempts: z.number(),
      lastPlayedAt: z.number().optional(),
    }),
  ),
});

const ACHIEVEMENT_LABELS: Record<string, string> = {
  launch: 'Despegue',
  'first-steps': 'Primeros Pasos',
  'xp-500': 'XP Hunter',
  'xp-2000': 'XP Élite',
  'level-5': 'Cadete',
  'level-10': 'Piloto',
  'streak-3': 'Tres en raya',
  'streak-7': 'Racha de 7',
  'streak-30': 'Racha de 30',
  code: 'Code Master',
  einstein: 'Einstein',
  polyglot: 'Políglota',
  mathlete: 'Mathlete',
  'all-courses': 'Multiverso',
};

async function loadUnlockedMap(userId: string): Promise<Record<string, number>> {
  const rows = await prisma.achievement.findMany({ where: { userId } });
  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.achievementId] = row.unlockedAt.getTime();
  }
  return map;
}

async function saveUnlockedMap(userId: string, nextMap: Record<string, number>) {
  const existing = await prisma.achievement.findMany({ where: { userId } });
  const existingIds = new Set(existing.map((row) => row.achievementId));
  const nextIds = new Set(Object.keys(nextMap));

  const toCreate = Object.entries(nextMap)
    .filter(([id]) => !existingIds.has(id))
    .map(([achievementId, unlockedAt]) => ({
      userId,
      achievementId,
      unlockedAt: new Date(unlockedAt),
    }));

  const toDelete = existing.filter((row) => !nextIds.has(row.achievementId));

  await prisma.$transaction([
    ...toDelete.map((row) => prisma.achievement.delete({ where: { id: row.id } })),
    ...toCreate.map((data) => prisma.achievement.create({ data })),
  ]);
}

router.get('/me', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const unlockedMap = await loadUnlockedMap(userId);
  return res.json({ unlockedMap });
});

router.put('/me', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const parsed = unlockedMapSchema.safeParse(req.body?.unlockedMap ?? req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
  }

  await saveUnlockedMap(userId, parsed.data);
  return res.json({ unlockedMap: parsed.data });
});

router.post('/sync', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const parsed = progressSchema.safeParse(req.body?.progress ?? req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
  }

  const progress = parsed.data as UserProgress;
  const previouslyUnlocked = await loadUnlockedMap(userId);
  const { unlockedMap, newlyUnlockedIds } = syncUnlockedAchievements(progress, previouslyUnlocked);

  if (newlyUnlockedIds.length > 0) {
    await saveUnlockedMap(userId, unlockedMap);

    await prisma.notification.createMany({
      data: newlyUnlockedIds.map((achievementId) => ({
        userId,
        type: 'achievement',
        title: '¡Logro desbloqueado!',
        message: `Conseguiste "${ACHIEVEMENT_LABELS[achievementId] ?? achievementId}".`,
        icon: 'emoji-events',
        color: '#cfbdff',
        read: false,
      })),
    });
  }

  return res.json({
    unlockedMap,
    newlyUnlockedIds,
  });
});

export { router as achievementsRouter };
