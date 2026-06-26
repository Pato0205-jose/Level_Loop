import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth, type MaybeAuthedRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const scopeSchema = z.enum(['weekly', 'global', 'friends']);

const XP_PER_LEVEL = 100;

function getLevel(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

function nextSundayLabel(): string {
  const today = new Date();
  const day = today.getDay();
  const remaining = day === 0 ? 7 : 7 - day;
  return `Termina en ${remaining} ${remaining === 1 ? 'día' : 'días'}`;
}

function estimateWeeklyXp(totalXp: number): number {
  return Math.floor(totalXp * 0.35);
}

router.get('/', optionalAuth, async (req, res) => {
  const parsed = scopeSchema.safeParse(req.query.scope ?? 'weekly');

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid scope' });
  }

  const scope = parsed.data;
  const currentUserId = (req as MaybeAuthedRequest).userId;

  const where =
    scope === 'friends'
      ? {
          OR: [
            { isFriend: true },
            ...(currentUserId ? [{ id: currentUserId }] : []),
          ],
        }
      : {
          OR: [{ isDemo: true }, ...(currentUserId ? [{ id: currentUserId }] : [])],
        };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      progress: {
        select: {
          totalXp: true,
          weeklyXp: true,
        },
      },
    },
  });

  const rows = users.map((user) => {
    const totalXp = user.progress?.totalXp ?? 0;
    const storedWeekly = user.progress?.weeklyXp ?? 0;
    const weeklyXp = storedWeekly > 0 ? storedWeekly : estimateWeeklyXp(totalXp);

    return {
      id: user.id,
      rank: 0,
      name: user.name?.trim() || 'Cadete',
      level: getLevel(totalXp),
      totalXp,
      weeklyXp,
      isYou: currentUserId ? user.id === currentUserId : false,
    };
  });

  const sortKey = scope === 'weekly' ? 'weeklyXp' : 'totalXp';
  rows.sort((a, b) => b[sortKey] - a[sortKey]);
  rows.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  const you =
    rows.find((entry) => entry.isYou) ??
    (currentUserId
      ? {
          id: currentUserId,
          rank: rows.length + 1,
          name: 'Tú',
          level: 1,
          totalXp: 0,
          weeklyXp: 0,
          isYou: true,
        }
      : rows[0]);

  return res.json({
    scope,
    rows,
    top3: rows.slice(0, 3),
    you,
    weeklyResetLabel: scope === 'weekly' ? nextSundayLabel() : undefined,
  });
});

export { router as leaderboardRouter };
