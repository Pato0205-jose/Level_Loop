import {
  ACHIEVEMENTS,
  evaluateAchievements,
  type Achievement,
} from '../constants/achievements';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { achievementsKey } from '../storage/keys';
import { getItem, setItem } from '../storage/storage';
import { apiFetch, USE_BACKEND } from './api';
import { getFirestoreDb } from './firebase';
import type { UserProgress } from './progress';

/** Map de `achievementId` → timestamp (ms) en que se desbloqueó por primera vez. */
export type UnlockedMap = Record<string, number>;

type AchievementsDoc = {
  unlockedMap: UnlockedMap;
  updatedAt: number;
};

function achievementsRef(userId: string) {
  return doc(getFirestoreDb(), 'achievements', userId);
}

export async function getUnlockedMap(userId: string): Promise<UnlockedMap> {
  if (USE_BACKEND) {
    try {
      const res = await apiFetch('/achievements/me');
      if (res.ok) {
        const payload = (await res.json()) as { unlockedMap: UnlockedMap };
        await setItem(achievementsKey(userId), payload.unlockedMap);
        return payload.unlockedMap;
      }
    } catch {
      // Fallback local si no hay red.
    }
  }

  try {
    const snap = await getDoc(achievementsRef(userId));
    if (snap.exists()) {
      const map = (snap.data() as AchievementsDoc).unlockedMap ?? {};
      await setItem(achievementsKey(userId), map);
      return map;
    }
  } catch {
    // Fallback local si no hay red/config remota.
  }

  const data = await getItem<UnlockedMap>(achievementsKey(userId));
  return data ?? {};
}

export async function setUnlockedMap(
  userId: string,
  map: UnlockedMap,
): Promise<void> {
  if (USE_BACKEND) {
    try {
      await apiFetch('/achievements/me', {
        method: 'PUT',
        body: JSON.stringify({ unlockedMap: map }),
      });
    } catch {
      // Fallback local si no hay red.
    }
  }

  try {
    await setDoc(
      achievementsRef(userId),
      {
        unlockedMap: map,
        updatedAt: Date.now(),
      } as AchievementsDoc,
      { merge: true },
    );
  } catch {
    // Fallback local si no hay red/config remota.
  }
  await setItem(achievementsKey(userId), map);
}

/**
 * Evalúa logros con el progreso actual, compara contra el storage y
 * persiste los nuevos desbloqueos. Devuelve los achievements completos
 * de los **recién desbloqueados** (los que no estaban antes).
 */
export async function syncAchievements(
  userId: string,
  progress: UserProgress,
): Promise<{ all: Achievement[]; newlyUnlocked: Achievement[] }> {
  const prev = await getUnlockedMap(userId);

  if (USE_BACKEND) {
    try {
      const res = await apiFetch('/achievements/sync', {
        method: 'POST',
        body: JSON.stringify({ progress }),
      });

      if (res.ok) {
        const payload = (await res.json()) as {
          unlockedMap: UnlockedMap;
          newlyUnlockedIds: string[];
        };
        await setItem(achievementsKey(userId), payload.unlockedMap);
        const evaluated = evaluateAchievements(progress, payload.unlockedMap);
        const newlyUnlocked = evaluated.filter((ach) =>
          payload.newlyUnlockedIds.includes(ach.id),
        );
        return { all: evaluated, newlyUnlocked };
      }
    } catch {
      // Fallback local si no hay red.
    }
  }

  const evaluated = evaluateAchievements(progress, prev);

  const newlyUnlocked: Achievement[] = [];
  const nextMap: UnlockedMap = { ...prev };

  for (const ach of evaluated) {
    if (ach.unlocked && prev[ach.id] === undefined) {
      const now = ach.unlockedAt ?? Date.now();
      nextMap[ach.id] = now;
      newlyUnlocked.push({ ...ach, unlockedAt: now });
    }
  }

  if (newlyUnlocked.length > 0) {
    await setUnlockedMap(userId, nextMap);
  }

  return { all: evaluated, newlyUnlocked };
}

/** Carga la lista de logros evaluados sin persistir nada. */
export async function loadAchievements(
  userId: string | null | undefined,
  progress: UserProgress | null | undefined,
): Promise<Achievement[]> {
  const map = userId ? await getUnlockedMap(userId) : {};
  return evaluateAchievements(progress, map);
}

export function countUnlocked(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlocked).length;
}

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;
