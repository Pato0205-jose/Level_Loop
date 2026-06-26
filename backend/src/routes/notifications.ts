import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const DEFAULT_NOTIFICATIONS = [
  {
    type: 'welcome',
    title: '¡Bienvenido a Level Loop!',
    message:
      'Empieza con la primera lección de tu materia favorita. Suma XP y desbloquea logros.',
    icon: 'celebration',
    color: '#cfbdff',
    read: false,
    offsetMs: 5 * 60_000,
  },
  {
    type: 'streak',
    title: 'Tu racha de 7 días sigue activa',
    message: 'Practica al menos una lección hoy para mantener tu racha encendida.',
    icon: 'local-fire-department',
    color: '#ffb4ab',
    read: false,
    offsetMs: 3 * 60 * 60_000,
  },
] as const;

function toNotificationPayload(row: {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  color: string | null;
  read: boolean;
  createdAt: Date;
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    icon: row.icon ?? 'notifications',
    color: row.color ?? '#51d5ff',
    read: row.read,
    createdAt: row.createdAt.getTime(),
  };
}

async function seedDefaultNotifications(userId: string) {
  const now = Date.now();
  const created = await prisma.$transaction(
    DEFAULT_NOTIFICATIONS.map((item, index) =>
      prisma.notification.create({
        data: {
          userId,
          type: item.type,
          title: item.title,
          message: item.message,
          icon: item.icon,
          color: item.color,
          read: item.read,
          createdAt: new Date(now - item.offsetMs - index),
        },
      }),
    ),
  );
  return created;
}

router.get('/', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;

  let rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (rows.length === 0) {
    rows = await seedDefaultNotifications(userId);
  }

  return res.json({ notifications: rows.map(toNotificationPayload) });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const parsed = z.object({ read: z.boolean() }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const row = await prisma.notification.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!row) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  const updated = await prisma.notification.update({
    where: { id: row.id },
    data: { read: parsed.data.read },
  });

  return res.json({ notification: toNotificationPayload(updated) });
});

router.post('/mark-all', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return res.json({ ok: true });
});

router.delete('/', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;

  await prisma.notification.deleteMany({ where: { userId } });

  return res.json({ ok: true });
});

export { router as notificationsRouter };
