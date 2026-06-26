import { progressKey } from '../storage/keys';
import { getItem, setItem } from '../storage/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { apiFetch, USE_BACKEND } from './api';
import { getFirestoreDb } from './firebase';

export type TopicProgress = {
  completed: boolean;
  completedAt?: number;
  /** Mejor puntaje obtenido (0–100). */
  bestScore: number;
  totalXp: number;
  attempts: number;
  lastPlayedAt?: number;
};

export type UserProgress = {
  totalXp: number;
  streakDays: number;
  longestStreak: number;
  /** YYYY-MM-DD (zona horaria local). */
  lastActiveDate: string;
  topics: Record<string, TopicProgress>;
};

export const EMPTY_PROGRESS: UserProgress = {
  totalXp: 0,
  streakDays: 0,
  longestStreak: 0,
  lastActiveDate: '',
  topics: {},
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
/** Puntaje mínimo (0–100) para que el tema se marque como completado. */
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

export function todayKey(d: Date = new Date()): string {
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

export type LevelInfo = {
  level: number;
  intoLevelXp: number;
  xpForNext: number;
  xpPerLevel: number;
  pctInLevel: number;
};

export function getLevelInfo(totalXp: number): LevelInfo {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const intoLevelXp = totalXp % XP_PER_LEVEL;
  const xpForNext = XP_PER_LEVEL - intoLevelXp;
  const pctInLevel = (intoLevelXp / XP_PER_LEVEL) * 100;
  return { level, intoLevelXp, xpForNext, xpPerLevel: XP_PER_LEVEL, pctInLevel };
}

async function getLocalProgress(userId: string): Promise<UserProgress> {
  const data = await getItem<UserProgress>(progressKey(userId));
  if (!data) return { ...EMPTY_PROGRESS, topics: {} };
  return { ...EMPTY_PROGRESS, ...data, topics: { ...data.topics } };
}

export async function getProgress(userId: string): Promise<UserProgress> {
  if (USE_BACKEND) {
    try {
      const res = await apiFetch('/progress/me');
      if (res.ok) {
        const payload = (await res.json()) as { progress: UserProgress };
        const progress = {
          ...EMPTY_PROGRESS,
          ...payload.progress,
          topics: { ...payload.progress.topics },
        };
        await setItem(progressKey(userId), progress);
        return progress;
      }
    } catch {
      // Fallback local si no hay red.
    }
    return getLocalProgress(userId);
  }

  try {
    const snap = await getDoc(doc(getFirestoreDb(), 'progress', userId));
    if (!snap.exists()) {
      return { ...EMPTY_PROGRESS, topics: {} };
    }
    const data = snap.data() as UserProgress;
    return { ...EMPTY_PROGRESS, ...data, topics: { ...data.topics } };
  } catch {
    return getLocalProgress(userId);
  }
}

export async function saveProgress(
  userId: string,
  progress: UserProgress,
): Promise<void> {
  if (USE_BACKEND) {
    try {
      await apiFetch('/progress/me', {
        method: 'PUT',
        body: JSON.stringify({ progress }),
      });
    } catch {
      // Si no hay backend o red, guardamos local como respaldo.
    }
  }

  try {
    await setDoc(doc(getFirestoreDb(), 'progress', userId), progress, { merge: true });
  } catch {
    // Si no hay backend o red, guardamos local como respaldo.
  }
  await setItem(progressKey(userId), progress);
}

export async function recordExerciseResult(
  userId: string,
  result: ExerciseResult,
): Promise<{ progress: UserProgress; delta: CompletionDelta }> {
  if (USE_BACKEND) {
    try {
      const res = await apiFetch('/progress/exercise-result', {
        method: 'POST',
        body: JSON.stringify({ result }),
      });

      if (res.ok) {
        const payload = (await res.json()) as {
          progress: UserProgress;
          delta: CompletionDelta;
        };
        const progress = {
          ...EMPTY_PROGRESS,
          ...payload.progress,
          topics: { ...payload.progress.topics },
        };
        await setItem(progressKey(userId), progress);
        return { progress, delta: payload.delta };
      }
    } catch {
      // Fallback local si no hay red.
    }
  }

  const prev = await getProgress(userId);
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
    completedAt:
      !wasCompleted && nowCompleted ? Date.now() : prevTopic.completedAt,
    bestScore: Math.max(prevTopic.bestScore, score),
    totalXp: prevTopic.totalXp + xp,
    attempts: prevTopic.attempts + 1,
    lastPlayedAt: Date.now(),
  };

  // Lógica de racha
  const today = todayKey();
  let newStreak = prev.streakDays;
  let streakIncreased = false;
  if (prev.lastActiveDate !== today) {
    const days = diffInDays(prev.lastActiveDate, today);
    if (days === 1) {
      newStreak = prev.streakDays + 1;
    } else if (Number.isFinite(days) && days > 1) {
      newStreak = 1;
    } else {
      newStreak = 1;
    }
    streakIncreased = newStreak > prev.streakDays;
  }

  const prevLevel = getLevelInfo(prev.totalXp).level;
  const nextTotalXp = prev.totalXp + xp;
  const nextLevel = getLevelInfo(nextTotalXp).level;

  const next: UserProgress = {
    totalXp: nextTotalXp,
    streakDays: newStreak,
    longestStreak: Math.max(prev.longestStreak, newStreak),
    lastActiveDate: today,
    topics: { ...prev.topics, [result.topicId]: nextTopic },
  };

  await saveProgress(userId, next);

  return {
    progress: next,
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

export function countCompletedTopics(progress: UserProgress | null | undefined): number {
  if (!progress) return 0;
  return Object.values(progress.topics).filter((t) => t.completed).length;
}

export function isTopicCompleted(
  progress: UserProgress | null | undefined,
  topicId: string,
): boolean {
  return !!progress?.topics?.[topicId]?.completed;
}
