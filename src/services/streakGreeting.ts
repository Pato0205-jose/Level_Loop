import { StorageKeys } from '../storage/keys';
import { getItem, setItem } from '../storage/storage';
import { todayKey } from './progress';

/**
 * Devuelve true si todavía no se ha mostrado el saludo de racha hoy.
 * No marca como visto: para eso usa `markStreakGreetedToday`.
 */
export async function shouldShowStreakGreeting(): Promise<boolean> {
  const stored = await getItem<string>(StorageKeys.STREAK_GREETED_DATE);
  return stored !== todayKey();
}

/** Marca como visto hoy el saludo de racha. */
export async function markStreakGreetedToday(): Promise<void> {
  await setItem(StorageKeys.STREAK_GREETED_DATE, todayKey());
}
