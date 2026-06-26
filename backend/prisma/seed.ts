import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { buildTopics, SEED_USERS } from './seed-data.js';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo1234!';

function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return todayKey(d);
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  let created = 0;
  let updated = 0;

  for (const seed of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: seed.email } });
    const topics = buildTopics(seed.topicIds, seed.totalXp);
    const lastActiveDate = daysAgoKey(seed.streakDays > 0 ? 0 : 2);

    const user = await prisma.user.upsert({
      where: { email: seed.email },
      create: {
        email: seed.email,
        passwordHash,
        name: seed.name,
        bio: seed.bio,
        interests: seed.interests,
        dailyGoalMin: seed.dailyGoalMin,
        onboardingDone: true,
        isDemo: true,
        isFriend: seed.isFriend,
      },
      update: {
        name: seed.name,
        bio: seed.bio,
        interests: seed.interests,
        dailyGoalMin: seed.dailyGoalMin,
        onboardingDone: true,
        isDemo: true,
        isFriend: seed.isFriend,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }

    await prisma.progress.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        totalXp: seed.totalXp,
        weeklyXp: seed.weeklyXp,
        streakDays: seed.streakDays,
        longestStreak: seed.longestStreak,
        lastActiveDate,
        topics,
      },
      update: {
        totalXp: seed.totalXp,
        weeklyXp: seed.weeklyXp,
        streakDays: seed.streakDays,
        longestStreak: seed.longestStreak,
        lastActiveDate,
        topics,
      },
    });

    await prisma.achievement.deleteMany({ where: { userId: user.id } });
    if (seed.achievementIds.length > 0) {
      await prisma.achievement.createMany({
        data: seed.achievementIds.map((achievementId, index) => ({
          userId: user.id,
          achievementId,
          unlockedAt: new Date(Date.now() - (index + 1) * 604_800_000),
        })),
      });
    }

    await prisma.notification.deleteMany({ where: { userId: user.id } });
    if (seed.notifications.length > 0) {
      await prisma.notification.createMany({
        data: seed.notifications.map((item) => ({
          userId: user.id,
          type: item.type,
          title: item.title,
          message: item.message,
          icon: item.icon,
          color: item.color,
          read: item.read,
          createdAt: new Date(Date.now() - item.daysAgo * 86_400_000),
        })),
      });
    }
  }

  const totalUsers = await prisma.user.count({ where: { isDemo: true } });
  const totalProgress = await prisma.progress.count();
  const totalAchievements = await prisma.achievement.count();
  const totalNotifications = await prisma.notification.count();

  console.log(`Seed completado: ${created} creados, ${updated} actualizados.`);
  console.log(`Usuarios demo: ${totalUsers}`);
  console.log(`Registros de progreso: ${totalProgress}`);
  console.log(`Logros: ${totalAchievements}`);
  console.log(`Notificaciones: ${totalNotifications}`);
  console.log(`Contraseña demo (solo usuarios seed): ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
