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
