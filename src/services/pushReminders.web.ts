/**
 * Stub web: las notificaciones push nativas no aplican aquí.
 * Se reemplaza automáticamente por `pushReminders.ts` en iOS/Android.
 */

export const REMINDER_DEFAULTS = {
  hour: 19,
  minute: 30,
} as const;

export async function setupPushReminders(): Promise<void> {
  // no-op en web
}

export async function ensurePushPermission(): Promise<boolean> {
  return false;
}

export async function scheduleDailyStreakReminder(
  _hour?: number,
  _minute?: number,
): Promise<boolean> {
  return false;
}

export async function cancelStreakReminder(): Promise<void> {
  // no-op en web
}

export async function initStreakReminders(): Promise<void> {
  // no-op en web
}
