import { streakGreetedKey } from '../storage/keys';
import { getItem, setItem } from '../storage/storage';
import { todayKey } from './progress';

/**
 * Devuelve true si todavía no se ha mostrado el saludo de racha hoy para este usuario.
 */
export async function shouldShowStreakGreeting(userId: string): Promise<boolean> {
  const stored = await getItem<string>(streakGreetedKey(userId));
  return stored !== todayKey();
}

/** Marca como visto hoy el saludo de racha del usuario. */
export async function markStreakGreetedToday(userId: string): Promise<void> {
  await setItem(streakGreetedKey(userId), todayKey());
}
