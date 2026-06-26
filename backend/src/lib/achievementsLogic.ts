import {
  countCompletedTopics,
  COURSE_TOPIC_IDS,
  ENGLISH_FIRST_THREE_MODULES,
  getCourseProgressPct,
  MATH_ALGEBRA_TOPICS,
} from './courseTopics.js';
import { getLevel, type UserProgress } from './progressLogic.js';

type Evaluation = { progress: number; unlocked: boolean };

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

const ACHIEVEMENT_IDS = [
  'launch',
  'first-steps',
  'xp-500',
  'xp-2000',
  'level-5',
  'level-10',
  'streak-3',
  'streak-7',
  'streak-30',
  'code',
  'einstein',
  'polyglot',
  'mathlete',
  'all-courses',
] as const;

function evaluateAchievement(id: string, progress: UserProgress | null): Evaluation {
  const topics = progress?.topics ?? {};
  const totalXp = progress?.totalXp ?? 0;
  const streak = progress?.longestStreak ?? progress?.streakDays ?? 0;
  const done = countCompletedTopics(topics);
  const level = getLevel(totalXp);

  switch (id) {
    case 'launch':
      return { progress: done > 0 ? 1 : 0, unlocked: done >= 1 };
    case 'first-steps':
      return { progress: clamp01(done / 5), unlocked: done >= 5 };
    case 'xp-500':
      return { progress: clamp01(totalXp / 500), unlocked: totalXp >= 500 };
    case 'xp-2000':
      return { progress: clamp01(totalXp / 2000), unlocked: totalXp >= 2000 };
    case 'level-5':
      return { progress: clamp01(level / 5), unlocked: level >= 5 };
    case 'level-10':
      return { progress: clamp01(level / 10), unlocked: level >= 10 };
    case 'streak-3':
      return { progress: clamp01(streak / 3), unlocked: streak >= 3 };
    case 'streak-7':
      return { progress: clamp01(streak / 7), unlocked: streak >= 7 };
    case 'streak-30':
      return { progress: clamp01(streak / 30), unlocked: streak >= 30 };
    case 'code':
      return {
        progress: clamp01(getCourseProgressPct('code', topics) / 100),
        unlocked: getCourseProgressPct('code', topics) >= 100,
      };
    case 'einstein':
      return {
        progress: clamp01(getCourseProgressPct('physics', topics) / 100),
        unlocked: getCourseProgressPct('physics', topics) >= 100,
      };
    case 'polyglot': {
      const total = ENGLISH_FIRST_THREE_MODULES.length;
      const completed = ENGLISH_FIRST_THREE_MODULES.filter((id) => topics[id]?.completed).length;
      return {
        progress: clamp01(completed / total),
        unlocked: total > 0 && completed >= total,
      };
    }
    case 'mathlete': {
      const total = MATH_ALGEBRA_TOPICS.length;
      const completed = MATH_ALGEBRA_TOPICS.filter((id) => topics[id]?.completed).length;
      return {
        progress: clamp01(completed / total),
        unlocked: total > 0 && completed >= total,
      };
    }
    case 'all-courses': {
      const courses = Object.keys(COURSE_TOPIC_IDS);
      const pcts = courses.map((courseId) => getCourseProgressPct(courseId, topics));
      const avgTowards50 =
        pcts.reduce((sum, pct) => sum + Math.min(pct, 50), 0) / (courses.length * 50);
      const allAt50 = pcts.every((pct) => pct >= 50);
      return { progress: clamp01(avgTowards50), unlocked: allAt50 };
    }
    default:
      return { progress: 0, unlocked: false };
  }
}

export function syncUnlockedAchievements(
  progress: UserProgress,
  previouslyUnlocked: Record<string, number>,
): { unlockedMap: Record<string, number>; newlyUnlockedIds: string[] } {
  const nextMap = { ...previouslyUnlocked };
  const newlyUnlockedIds: string[] = [];
  const now = Date.now();

  for (const id of ACHIEVEMENT_IDS) {
    const result = evaluateAchievement(id, progress);
    if (result.unlocked && previouslyUnlocked[id] === undefined) {
      nextMap[id] = now;
      newlyUnlockedIds.push(id);
    }
  }

  return { unlockedMap: nextMap, newlyUnlockedIds };
}
