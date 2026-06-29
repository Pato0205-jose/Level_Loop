export type TopicProgress = {
  completed: boolean;
  completedAt?: number;
  bestScore: number;
  totalXp: number;
  attempts: number;
  lastPlayedAt?: number;
};

export type UserProgress = {
  totalXp: number;
  streakDays: number;
  longestStreak: number;
  lastActiveDate: string;
  topics: Record<string, TopicProgress>;
};

export type ExerciseResult = {
  topicId: string;
  correct: number;
  total: number;
  livesLeft: number;
};

export type CompletionDelta = {
  xpEarned: number;
  newStreak: number;
  streakIncreased: boolean;
  topicJustCompleted: boolean;
  alreadyCompleted: boolean;
  newLevel: number;
  leveledUp: boolean;
};

const XP_PER_CORRECT = 10;
const XP_PER_LIFE_LEFT = 5;
const PASS_SCORE = 60;
const XP_PER_LEVEL = 100;

export function computeXp(result: ExerciseResult): number {
  const xpFromCorrect = result.correct * XP_PER_CORRECT;
  const xpFromLives = result.livesLeft > 0 ? result.livesLeft * XP_PER_LIFE_LEFT : 0;
  return xpFromCorrect + xpFromLives;
}

export function computeAccuracy(result: ExerciseResult): number {
  if (result.total <= 0) return 0;
  return Math.round((result.correct / result.total) * 100);
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function diffInDays(a: string, b: string): number {
  if (!a || !b) return Infinity;
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  return Math.round((db - da) / (24 * 60 * 60 * 1000));
}

/** Lunes como inicio de semana (clave estable para ranking semanal). */
export function weekKeyFromDate(d: Date = new Date()): string {
  const date = new Date(d);
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  jan1.setHours(12, 0, 0, 0);
  const week = Math.floor((date.getTime() - jan1.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function weekKeyForDayKey(dayKey: string): string {
  if (!dayKey) return '';
  return weekKeyFromDate(new Date(`${dayKey}T12:00:00`));
}

export function shouldResetWeeklyXp(lastActiveDate: string): boolean {
  if (!lastActiveDate) return false;
  return weekKeyForDayKey(lastActiveDate) !== weekKeyFromDate(new Date());
}

/** Si pasaron 2+ días sin jugar, la racha visible vuelve a 0 hasta el próximo ejercicio. */
export function normalizeProgressForToday(progress: UserProgress): UserProgress {
  if (!progress.lastActiveDate) return progress;
  const today = todayKey();
  if (progress.lastActiveDate === today) return progress;

  const days = diffInDays(progress.lastActiveDate, today);
  if (days <= 1) return progress;
  if (progress.streakDays === 0) return progress;

  return { ...progress, streakDays: 0 };
}

export function getLevel(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

export function recordExerciseResult(
  prev: UserProgress,
  result: ExerciseResult,
): { progress: UserProgress; delta: CompletionDelta; weeklyXpGain: number } {
  const xp = computeXp(result);
  const score = computeAccuracy(result);
  const passed = score >= PASS_SCORE;

  const prevTopic: TopicProgress = prev.topics[result.topicId] ?? {
    completed: false,
    bestScore: 0,
    totalXp: 0,
    attempts: 0,
  };
  const wasCompleted = prevTopic.completed;
  const nowCompleted = wasCompleted || passed;

  const nextTopic: TopicProgress = {
    completed: nowCompleted,
    completedAt: !wasCompleted && nowCompleted ? Date.now() : prevTopic.completedAt,
    bestScore: Math.max(prevTopic.bestScore, score),
    totalXp: prevTopic.totalXp + xp,
    attempts: prevTopic.attempts + 1,
    lastPlayedAt: Date.now(),
  };

  const today = todayKey();
  let newStreak = prev.streakDays;
  let streakIncreased = false;

  if (prev.lastActiveDate !== today) {
    const days = diffInDays(prev.lastActiveDate, today);
    if (days === 1) {
      newStreak = prev.streakDays + 1;
    } else {
      newStreak = 1;
    }
    streakIncreased = newStreak > prev.streakDays;
  }

  const prevLevel = getLevel(prev.totalXp);
  const nextTotalXp = prev.totalXp + xp;
  const nextLevel = getLevel(nextTotalXp);

  const progress: UserProgress = {
    totalXp: nextTotalXp,
    streakDays: newStreak,
    longestStreak: Math.max(prev.longestStreak, newStreak),
    lastActiveDate: today,
    topics: { ...prev.topics, [result.topicId]: nextTopic },
  };

  return {
    progress,
    weeklyXpGain: xp,
    delta: {
      xpEarned: xp,
      newStreak,
      streakIncreased,
      topicJustCompleted: !wasCompleted && nowCompleted,
      alreadyCompleted: wasCompleted,
      newLevel: nextLevel,
      leveledUp: nextLevel > prevLevel,
    },
  };
}
