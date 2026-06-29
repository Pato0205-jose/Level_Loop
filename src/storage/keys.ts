export const StorageKeys = {
  USERS: '@levelloop/users',
  CURRENT_USER_ID: '@levelloop/currentUserId',
  ONBOARDING_DONE: '@levelloop/onboardingDone',
  NOTIFICATIONS: '@levelloop/notifications',
  FEEDBACK_PREFS: '@levelloop/feedbackPrefs',
  /** Fecha (YYYY-MM-DD) en la que se mostró el último saludo de racha. */
  STREAK_GREETED_DATE: '@levelloop/streakGreetedDate',
  /** Logros desbloqueados por usuario: `@levelloop/achievements:<userId>`. */
  ACHIEVEMENTS_PREFIX: '@levelloop/achievements:',
  /** Prefijo: se concatena con el userId — `@levelloop/progress:<userId>`. */
  PROGRESS_PREFIX: '@levelloop/progress:',
  /** Si el usuario ya aceptó/denegó los recordatorios push (true|false). */
  PUSH_PERMISSION_PROMPTED: '@levelloop/pushPermissionPrompted',
  /** Hora (HH:mm) configurada por el usuario para el recordatorio diario. */
  PUSH_REMINDER_TIME: '@levelloop/pushReminderTime',
} as const;

export function achievementsKey(userId: string): string {
  return `${StorageKeys.ACHIEVEMENTS_PREFIX}${userId}`;
}

export function streakGreetedKey(userId: string): string {
  return `${StorageKeys.STREAK_GREETED_DATE}:${userId}`;
}

export function progressKey(userId: string): string {
  return `${StorageKeys.PROGRESS_PREFIX}${userId}`;
}
